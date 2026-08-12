import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const STAFF = ["admin", "hr"] as const;

/** Программа адаптации текущего сотрудника со всеми пунктами. */
export const myOnboarding = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: program } = await context.supabase
      .from("onboarding_programs")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!program) return { program: null, items: [] };
    const { data: items } = await context.supabase
      .from("onboarding_program_items")
      .select("*")
      .eq("program_id", program.id)
      .order("offset_days")
      .order("sort_order");
    return { program, items: items ?? [] };
  });

/** Сотрудник отмечает пункт адаптации выполненным. */
export const completeOnboardingItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ itemId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: item } = await context.supabase
      .from("onboarding_program_items")
      .select("id, program_id, requires_mentor, user_id")
      .eq("id", data.itemId)
      .maybeSingle();
    if (!item || item.user_id !== context.userId) throw new Error("Пункт адаптации не найден");

    const { error } = await context.supabase
      .from("onboarding_program_items")
      .update({
        status: item.requires_mentor ? "awaiting_mentor" : "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", data.itemId);
    if (error) throw new Error(error.message);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { refreshProgramStatus } = await import("./onboarding.server");
    const finished = await refreshProgramStatus(supabaseAdmin, item.program_id, context.userId);
    return { success: true, finished };
  });

/** Наставник или HR подтверждает пункт адаптации. */
export const confirmOnboardingItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ itemId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: item, error: readError } = await context.supabase
      .from("onboarding_program_items")
      .select("id, program_id, user_id")
      .eq("id", data.itemId)
      .maybeSingle();
    if (readError || !item) throw new Error("Пункт адаптации не найден");

    const { error } = await context.supabase
      .from("onboarding_program_items")
      .update({
        status: "confirmed",
        mentor_confirmed_by: context.userId,
        mentor_confirmed_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      })
      .eq("id", data.itemId);
    if (error) throw new Error("Недостаточно прав для подтверждения пункта");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { refreshProgramStatus } = await import("./onboarding.server");
    await refreshProgramStatus(supabaseAdmin, item.program_id, item.user_id);
    return { success: true };
  });

/** Обратная связь новичка по адаптации. */
export const submitOnboardingFeedback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        programId: z.string().uuid().nullish(),
        itemId: z.string().uuid().nullish(),
        rating: z.number().int().min(1).max(5).nullish(),
        message: z.string().min(3).max(2000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("onboarding_feedback").insert({
      user_id: context.userId,
      program_id: data.programId ?? null,
      item_id: data.itemId ?? null,
      rating: data.rating ?? null,
      message: data.message,
    });
    if (error) throw new Error(error.message);
    return { success: true };
  });

/** HR/админ назначает адаптацию сотруднику при приёме. */
export const assignOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        userId: z.string().uuid(),
        templateId: z.string().uuid().nullish(),
        hireDate: z.string().min(10),
        mentorId: z.string().uuid().nullish(),
        assignProfession: z.boolean().optional(),
        mandatoryCourseIds: z.array(z.string().uuid()).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertRole, logAction } = await import("./admin.server");
    await assertRole(context.supabase, context.userId, [...STAFF]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { createOnboardingProgram, createHireAssignments } = await import("./onboarding.server");

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("profession_id, department_id")
      .eq("id", data.userId)
      .maybeSingle();

    const result = await createOnboardingProgram(supabaseAdmin, {
      userId: data.userId,
      templateId: data.templateId ?? null,
      hireDate: data.hireDate,
      mentorId: data.mentorId ?? null,
      professionId: profile?.profession_id ?? null,
      departmentId: profile?.department_id ?? null,
    });

    const assignments = await createHireAssignments(supabaseAdmin, {
      userId: data.userId,
      hireDate: data.hireDate,
      assignedBy: context.userId,
      professionId: data.assignProfession === false ? null : (profile?.profession_id ?? null),
      mandatoryCourseIds: data.mandatoryCourseIds ?? [],
    });

    await supabaseAdmin.from("notifications").insert({
      user_id: data.userId,
      type: "onboarding",
      title: "Вам назначена программа адаптации",
      body: "Откройте раздел «Я Новичок» в личном кабинете.",
      link: "/onboarding",
    });

    await logAction({
      actorId: context.userId,
      action: "onboarding.assign",
      entity: "onboarding_programs",
      entityId: result.programId,
      details: { userId: data.userId, assignments },
    });
    return { ...result, assignments };
  });

/** Список программ адаптации для админ-панели. */
export const listOnboardingPrograms = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertRole } = await import("./admin.server");
    await assertRole(context.supabase, context.userId, [...STAFF, "manager", "teacher"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: programs } = await supabaseAdmin
      .from("onboarding_programs")
      .select("*, profiles!onboarding_programs_mentor_id_fkey(full_name)")
      .order("created_at", { ascending: false });
    const { data: profiles } = await supabaseAdmin.from("profiles").select("id, full_name");
    const { data: items } = await supabaseAdmin
      .from("onboarding_program_items")
      .select("program_id, status, is_required");
    return (programs ?? []).map((p) => {
      const own = (items ?? []).filter((i) => i.program_id === p.id);
      const done = own.filter((i) => i.status === "completed" || i.status === "confirmed").length;
      return {
        ...p,
        employee_name: (profiles ?? []).find((u) => u.id === p.user_id)?.full_name ?? "—",
        mentor_name: (p as { profiles?: { full_name?: string } | null }).profiles?.full_name ?? null,
        total_items: own.length,
        done_items: done,
        percent: own.length ? Math.round((done / own.length) * 100) : 0,
      };
    });
  });

/** Обратная связь по адаптации для HR. */
export const listOnboardingFeedback = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertRole } = await import("./admin.server");
    await assertRole(context.supabase, context.userId, [...STAFF]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("onboarding_feedback")
      .select("*, profiles:user_id(full_name)")
      .order("created_at", { ascending: false })
      .limit(200);
    return data ?? [];
  });

/** Профессиональный паспорт: компетенции сотрудника со статусами. */
/** Данные адаптационного плана для печатной формы (PDF). */
export const onboardingPlanForPrint = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({ programId: z.string().uuid().nullish() })
      .nullish()
      .transform((v) => v ?? {})
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let programId = data.programId ?? null;
    if (programId) {
      const { assertRole } = await import("./admin.server");
      const { data: target } = await supabaseAdmin
        .from("onboarding_programs")
        .select("user_id, mentor_id")
        .eq("id", programId)
        .maybeSingle();
      if (!target) throw new Error("Программа адаптации не найдена");
      const isOwner = target.user_id === context.userId;
      const isMentor = target.mentor_id === context.userId;
      if (!isOwner && !isMentor) {
        await assertRole(context.supabase, context.userId, [...STAFF]);
      }
    } else {
      const { data: own } = await supabaseAdmin
        .from("onboarding_programs")
        .select("id")
        .eq("user_id", context.userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      programId = own?.id ?? null;
    }
    if (!programId) return { program: null, items: [] };

    const { data: program } = await supabaseAdmin
      .from("onboarding_programs")
      .select("*")
      .eq("id", programId)
      .maybeSingle();
    if (!program) return { program: null, items: [] };

    const { data: items } = await supabaseAdmin
      .from("onboarding_program_items")
      .select("*")
      .eq("program_id", programId)
      .order("offset_days")
      .order("sort_order");

    const ids = [program.user_id, program.mentor_id].filter(Boolean) as string[];
    const { data: people } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, position, grade, personnel_number, profession_id, department_id")
      .in("id", ids);
    const employee = (people ?? []).find((p) => p.id === program.user_id) ?? null;
    const mentor = (people ?? []).find((p) => p.id === program.mentor_id) ?? null;

    let professionName: string | null = null;
    let departmentName: string | null = null;
    if (employee?.profession_id) {
      const { data: prof } = await supabaseAdmin
        .from("professions")
        .select("name")
        .eq("id", employee.profession_id)
        .maybeSingle();
      professionName = prof?.name ?? null;
    }
    if (employee?.department_id) {
      const { data: dep } = await supabaseAdmin
        .from("departments")
        .select("name")
        .eq("id", employee.department_id)
        .maybeSingle();
      departmentName = dep?.name ?? null;
    }

    return {
      program: {
        ...program,
        employee_name: employee?.full_name ?? "—",
        employee_position: employee?.position ?? null,
        employee_grade: employee?.grade ?? null,
        personnel_number: employee?.personnel_number ?? null,
        profession_name: professionName,
        department_name: departmentName,
        mentor_name: mentor?.full_name ?? null,
      },
      items: items ?? [],
    };
  });

export const myCompetencyPassport = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: rows } = await context.supabase
      .from("employee_competencies")
      .select("*, competencies(title, competency_type), professions(name)")
      .eq("user_id", context.userId)
      .order("created_at");
    return rows ?? [];
  });

/** Изменение статуса компетенции сотрудника (HR, наставник). */
export const setCompetencyStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        userId: z.string().uuid(),
        competencyId: z.string().uuid().nullish(),
        title: z.string().min(2),
        professionId: z.string().uuid().nullish(),
        status: z.enum(["not_started", "in_progress", "tested", "practice", "confirmed"]),
        comment: z.string().max(1000).nullish(),
        source: z.string().max(100).nullish(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const confirmed = data.status === "confirmed";
    const { error } = await context.supabase.from("employee_competencies").upsert(
      {
        user_id: data.userId,
        competency_id: data.competencyId ?? null,
        profession_id: data.professionId ?? null,
        title: data.title,
        status: data.status,
        comment: data.comment ?? null,
        source: data.source ?? "manual",
        confirmed_by: confirmed ? context.userId : null,
        confirmed_at: confirmed ? new Date().toISOString() : null,
      },
      { onConflict: "user_id,competency_id" },
    );
    if (error) throw new Error(error.message);
    return { success: true };
  });
