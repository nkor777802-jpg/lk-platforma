import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { dueFromOffset } from "./training-types";

type Admin = SupabaseClient<Database>;

export interface CreateProgramInput {
  userId: string;
  templateId?: string | null;
  hireDate: string;
  mentorId?: string | null;
  professionId?: string | null;
  departmentId?: string | null;
}

/** Подбирает шаблон адаптации: точное совпадение профессии → подразделения → шаблон по умолчанию. */
export async function pickTemplate(admin: Admin, input: CreateProgramInput) {
  if (input.templateId) {
    const { data } = await admin
      .from("onboarding_templates")
      .select("*")
      .eq("id", input.templateId)
      .maybeSingle();
    if (data) return data;
  }
  const { data: rows } = await admin
    .from("onboarding_templates")
    .select("*")
    .eq("is_active", true);
  const list = rows ?? [];
  return (
    list.find((t) => input.professionId && t.profession_id === input.professionId) ??
    list.find((t) => input.departmentId && t.department_id === input.departmentId) ??
    list.find((t) => t.is_default) ??
    null
  );
}

/**
 * Создаёт индивидуальную программу адаптации «снимком» шаблона.
 * Сроки пунктов считаются от даты приёма (Day 0 / +1 / +7 ...).
 */
export async function createOnboardingProgram(admin: Admin, input: CreateProgramInput) {
  const existing = await admin
    .from("onboarding_programs")
    .select("id")
    .eq("user_id", input.userId)
    .eq("status", "active")
    .maybeSingle();
  if (existing.data?.id) return { programId: existing.data.id, created: false };

  const template = await pickTemplate(admin, input);
  if (!template) throw new Error("Не найден шаблон адаптации. Создайте шаблон в разделе «Адаптация».");

  const { data: program, error } = await admin
    .from("onboarding_programs")
    .insert({
      user_id: input.userId,
      template_id: template.id,
      template_name: template.name,
      mentor_id: input.mentorId ?? null,
      hire_date: input.hireDate,
      status: "active",
    })
    .select("id")
    .single();
  if (error || !program) throw new Error(error?.message ?? "Не удалось создать программу адаптации");

  const { data: items } = await admin
    .from("onboarding_template_items")
    .select("*")
    .eq("template_id", template.id)
    .order("sort_order");

  const rows = (items ?? []).map((i) => ({
    program_id: program.id,
    user_id: input.userId,
    title: i.title,
    description: i.description,
    item_type: i.item_type,
    section: i.section,
    offset_days: i.offset_days,
    due_date: dueFromOffset(input.hireDate, i.offset_days),
    material_id: i.material_id,
    video_id: i.video_id,
    course_id: i.course_id,
    test_settings_id: i.test_settings_id,
    link_url: i.link_url,
    is_required: i.is_required,
    requires_mentor: i.requires_mentor,
    sort_order: i.sort_order,
    status: "pending",
  }));
  if (rows.length > 0) {
    const { error: itemsError } = await admin.from("onboarding_program_items").insert(rows);
    if (itemsError) throw new Error(itemsError.message);
  }

  await admin
    .from("profiles")
    .update({
      onboarding_status: "in_progress",
      hire_date: input.hireDate,
      mentor_id: input.mentorId ?? null,
    })
    .eq("id", input.userId);

  return { programId: program.id, created: true, items: rows.length };
}

/** Закрывает программу адаптации, если все обязательные пункты выполнены. */
export async function refreshProgramStatus(admin: Admin, programId: string, userId: string) {
  const { data: items } = await admin
    .from("onboarding_program_items")
    .select("status, is_required")
    .eq("program_id", programId);
  const list = items ?? [];
  const done = list
    .filter((i) => i.is_required)
    .every((i) => i.status === "completed" || i.status === "confirmed");
  if (list.length > 0 && done) {
    await admin
      .from("onboarding_programs")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", programId);
    await admin.from("profiles").update({ onboarding_status: "completed" }).eq("id", userId);
    return true;
  }
  return false;
}

/** Создаёт стартовые назначения при приёме: профессия, обязательное обучение. */
export async function createHireAssignments(
  admin: Admin,
  input: {
    userId: string;
    hireDate: string;
    assignedBy: string;
    professionId?: string | null;
    mandatoryCourseIds?: string[];
  },
) {
  const rows: Database["public"]["Tables"]["assignments"]["Insert"][] = [];
  if (input.professionId) {
    rows.push({
      user_id: input.userId,
      profession_id: input.professionId,
      assigned_by: input.assignedBy,
      assigned_at: input.hireDate,
      training_type: "initial_profession",
      is_mandatory: true,
      status: "assigned",
    });
  }
  for (const courseId of input.mandatoryCourseIds ?? []) {
    rows.push({
      user_id: input.userId,
      course_id: courseId,
      assigned_by: input.assignedBy,
      assigned_at: input.hireDate,
      training_type: "mandatory",
      is_mandatory: true,
      status: "assigned",
    });
  }
  if (rows.length === 0) return 0;
  const { error } = await admin.from("assignments").insert(rows);
  if (error) throw new Error(error.message);
  return rows.length;
}
