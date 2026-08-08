import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const STATUS = z.enum([
  "not_started",
  "in_progress",
  "awaiting_review",
  "completed",
  "retraining_required",
]);

/** Данные раздела «Развитие» для текущего сотрудника. */
export const myDevelopment = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { buildRecommendations } = await import("./development.server");
    const userId = context.userId;

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select(
        "id, full_name, grade, position, profession_id, departments(name), positions(name), professions(id, name, slug, grades)",
      )
      .eq("id", userId)
      .maybeSingle();

    const professionId = profile?.profession_id ?? null;

    const { data: levels } = professionId
      ? await supabaseAdmin
          .from("qualification_levels")
          .select("*")
          .eq("profession_id", professionId)
          .eq("is_active", true)
          .order("sort_order")
      : { data: [] };

    const levelIds = (levels ?? []).map((l) => l.id);
    const { data: competencies } = levelIds.length
      ? await supabaseAdmin
          .from("competencies")
          .select("*, courses(title)")
          .in("level_id", levelIds)
          .order("sort_order")
      : { data: [] };

    const { data: plans } = await supabaseAdmin
      .from("development_plans")
      .select(
        "*, professions(name), qualification_levels!development_plans_target_level_id_fkey(name), development_plan_items(*)",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    const { data: history } = await supabaseAdmin
      .from("qualification_history")
      .select("*, professions(name)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    const { data: attempts } = await supabaseAdmin
      .from("test_attempts")
      .select("id, passed, status, score_percent, started_at, profession_id, professions(name)")
      .eq("user_id", userId)
      .order("started_at", { ascending: false });

    const { data: progress } = await supabaseAdmin
      .from("learning_progress")
      .select("id, status, course_id:module_id")
      .eq("user_id", userId);

    const activePlan = (plans ?? [])[0] ?? null;
    const items = ((activePlan?.development_plan_items ?? []) as any[]).map((i) => ({
      title: i.title as string,
      item_type: i.item_type as string,
      status: i.status as string,
      due_date: i.due_date as string | null,
    }));

    // Текущий уровень определяется разрядом в профиле, следующий — по порядку.
    const levelList = (levels ?? []) as any[];
    const currentIndex = levelList.findIndex(
      (l) => profile?.grade && (l.code === profile.grade || l.name === profile.grade),
    );
    const nextLevel = currentIndex >= 0 ? (levelList[currentIndex + 1] ?? null) : (levelList[0] ?? null);

    const recommendations = buildRecommendations({
      items,
      hasFailedAttempt: (attempts ?? []).some((a) => a.passed === false),
      nextLevelName: nextLevel?.name ?? null,
    });

    return {
      profile,
      levels: levelList,
      currentLevelId: currentIndex >= 0 ? levelList[currentIndex].id : null,
      nextLevelId: nextLevel?.id ?? null,
      competencies: competencies ?? [],
      plans: plans ?? [],
      history: history ?? [],
      attempts: attempts ?? [],
      completedStages: (progress ?? []).filter((p: any) => p.status === "completed").length,
      recommendations,
    };
  });

/** Смена статуса пункта плана: сотрудник — по своим пунктам, HR/админ/преподаватель — по любым. */
export const setPlanItemStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ itemId: z.string().uuid(), status: STATUS, comment: z.string().nullish() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { getRoles, logAction } = await import("./admin.server");
    const roles = await getRoles(context.supabase, context.userId);
    const isStaff = roles.some((r) => ["admin", "hr", "teacher"].includes(r));

    const { data: item } = await supabaseAdmin
      .from("development_plan_items")
      .select("id, plan_id, development_plans(user_id)")
      .eq("id", data.itemId)
      .maybeSingle();
    if (!item) throw new Error("Пункт плана не найден");

    const ownerId = (item as any).development_plans?.user_id as string | undefined;
    if (!isStaff) {
      if (ownerId !== context.userId) throw new Error("Нет доступа к пункту плана");
      if (!["in_progress", "awaiting_review"].includes(data.status))
        throw new Error("Сотрудник может отметить только «в процессе» или «ожидает оценки»");
    }

    const { error } = await supabaseAdmin
      .from("development_plan_items")
      .update({
        status: data.status,
        comment: data.comment ?? undefined,
        completed_at: data.status === "completed" ? new Date().toISOString() : null,
      })
      .eq("id", data.itemId);
    if (error) throw new Error(error.message);

    const { data: all } = await supabaseAdmin
      .from("development_plan_items")
      .select("status, is_mandatory")
      .eq("plan_id", item.plan_id);
    const list = (all ?? []) as { status: string; is_mandatory: boolean }[];
    const mandatory = list.filter((i) => i.is_mandatory);
    const done = mandatory.length > 0 && mandatory.every((i) => i.status === "completed");
    const started = list.some((i) => i.status !== "not_started");
    await supabaseAdmin
      .from("development_plans")
      .update({ status: done ? "completed" : started ? "in_progress" : "not_started" })
      .eq("id", item.plan_id);

    await logAction({
      actorId: context.userId,
      action: "development.item_status",
      entity: "development_plan_items",
      entityId: data.itemId,
      details: { status: data.status },
    });
    return { ok: true };
  });

/** Подтверждение перехода на следующий уровень квалификации (только HR/администратор). */
export const approveLevelTransition = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        userId: z.string().uuid(),
        toLevelId: z.string().uuid(),
        basis: z.string().min(3),
        attemptId: z.string().uuid().nullish(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertRole, logAction } = await import("./admin.server");
    await assertRole(context.supabase, context.userId, ["admin", "hr"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, grade, profession_id")
      .eq("id", data.userId)
      .maybeSingle();
    if (!profile) throw new Error("Сотрудник не найден");

    const { data: level } = await supabaseAdmin
      .from("qualification_levels")
      .select("id, code, name, profession_id")
      .eq("id", data.toLevelId)
      .maybeSingle();
    if (!level) throw new Error("Уровень квалификации не найден");

    const { data: fromLevel } = profile.profession_id
      ? await supabaseAdmin
          .from("qualification_levels")
          .select("id")
          .eq("profession_id", profile.profession_id)
          .or(`code.eq.${profile.grade ?? "-"},name.eq.${profile.grade ?? "-"}`)
          .maybeSingle()
      : { data: null };

    const { data: actor } = await supabaseAdmin
      .from("profiles")
      .select("full_name")
      .eq("id", context.userId)
      .maybeSingle();

    const { error } = await supabaseAdmin.from("qualification_history").insert({
      user_id: data.userId,
      profession_id: level.profession_id,
      from_level_id: fromLevel?.id ?? null,
      to_level_id: level.id,
      basis: data.basis,
      attempt_id: data.attemptId ?? null,
      approved_by: context.userId,
      approved_by_name: actor?.full_name ?? null,
    });
    if (error) throw new Error(error.message);

    await supabaseAdmin
      .from("profiles")
      .update({ grade: level.code ?? level.name })
      .eq("id", data.userId);

    await logAction({
      actorId: context.userId,
      action: "development.level_approved",
      entity: "profiles",
      entityId: data.userId,
      details: { toLevel: level.name, basis: data.basis },
    });
    return { ok: true };
  });

/** Список планов развития для HR, руководителя и преподавателя. */
export const listDevelopmentPlans = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertRole } = await import("./admin.server");
    await assertRole(context.supabase, context.userId, ["admin", "hr", "teacher", "manager"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: plans } = await supabaseAdmin
      .from("development_plans")
      .select("*, professions(name), development_plan_items(id, status, is_mandatory)")
      .order("created_at", { ascending: false });

    const { data: profiles } = await supabaseAdmin.from("profiles").select("id, full_name");
    const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

    return (plans ?? []).map((p: any) => ({
      ...p,
      user_name: nameById.get(p.user_id) ?? "—",
      responsible_name: p.responsible_id ? (nameById.get(p.responsible_id) ?? "—") : "—",
      items_total: (p.development_plan_items ?? []).length,
      items_done: (p.development_plan_items ?? []).filter((i: any) => i.status === "completed").length,
    }));
  });

/** Аналитика развития: активные планы, профессии, просрочка, квалификационные переходы. */
export const developmentAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertRole } = await import("./admin.server");
    await assertRole(context.supabase, context.userId, ["admin", "hr", "teacher", "manager"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const today = new Date().toISOString().slice(0, 10);

    const { data: plans } = await supabaseAdmin
      .from("development_plans")
      .select("id, user_id, status, due_date, profession_id, professions(name)");
    const rows = (plans ?? []) as any[];

    const byProfession = new Map<string, number>();
    for (const p of rows) {
      const key = p.professions?.name ?? "Без профессии";
      byProfession.set(key, (byProfession.get(key) ?? 0) + 1);
    }

    const { count: transitions } = await supabaseAdmin
      .from("qualification_history")
      .select("id", { count: "exact", head: true });

    return {
      total: rows.length,
      active: rows.filter((p) => p.status === "in_progress").length,
      completed: rows.filter((p) => p.status === "completed").length,
      awaiting: rows.filter((p) => p.status === "awaiting_review").length,
      overdue: rows.filter((p) => p.due_date && p.due_date < today && p.status !== "completed")
        .length,
      developing: new Set(rows.filter((p) => p.status !== "completed").map((p) => p.user_id)).size,
      byProfession: [...byProfession.entries()].map(([name, count]) => ({ name, count })),
      transitions: transitions ?? 0,
    };
  });