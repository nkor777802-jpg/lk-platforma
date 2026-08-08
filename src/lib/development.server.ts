/** Серверные помощники модуля профессионального развития. */

export const PLAN_STATUSES = [
  "not_started",
  "in_progress",
  "awaiting_review",
  "completed",
  "retraining_required",
] as const;

export type PlanStatus = (typeof PLAN_STATUSES)[number];

export const STATUS_LABELS: Record<PlanStatus, string> = {
  not_started: "Не начато",
  in_progress: "В процессе",
  awaiting_review: "Ожидает оценки",
  completed: "Выполнено",
  retraining_required: "Требуется повторное обучение",
};

/**
 * Закрывает пункты плана типа «тест» после успешной аттестации
 * и помечает повторное обучение при провале. Исторические записи не меняются.
 */
export async function syncTestPlanItems(
  admin: any,
  userId: string,
  professionId: string | null,
  passed: boolean | null,
) {
  if (!professionId || passed === null) return;

  const { data: plans } = await admin
    .from("development_plans")
    .select("id")
    .eq("user_id", userId)
    .neq("status", "completed");
  const planIds = ((plans ?? []) as { id: string }[]).map((p) => p.id);
  if (planIds.length === 0) return;

  const { data: items } = await admin
    .from("development_plan_items")
    .select("id, status")
    .in("plan_id", planIds)
    .eq("item_type", "test")
    .eq("test_profession_id", professionId);

  const rows = (items ?? []) as { id: string; status: string }[];
  const targets = rows.filter((r) => r.status !== "completed");
  if (targets.length === 0) return;

  await admin
    .from("development_plan_items")
    .update(
      passed
        ? { status: "completed", completed_at: new Date().toISOString() }
        : { status: "retraining_required" },
    )
    .in(
      "id",
      targets.map((t) => t.id),
    );

  for (const planId of planIds) {
    const { data: all } = await admin
      .from("development_plan_items")
      .select("status, is_mandatory")
      .eq("plan_id", planId);
    const list = (all ?? []) as { status: string; is_mandatory: boolean }[];
    if (list.length === 0) continue;
    const mandatory = list.filter((i) => i.is_mandatory);
    const done = mandatory.length > 0 && mandatory.every((i) => i.status === "completed");
    const started = list.some((i) => i.status !== "not_started");
    await admin
      .from("development_plans")
      .update({ status: done ? "completed" : started ? "in_progress" : "not_started" })
      .eq("id", planId);
  }
}

/** Рекомендации: следующий курс, повторение темы, подготовка к квалификационному тесту. */
export function buildRecommendations(input: {
  items: { title: string; item_type: string; status: string; due_date: string | null }[];
  hasFailedAttempt: boolean;
  nextLevelName: string | null;
}) {
  const out: { kind: string; text: string }[] = [];
  const today = new Date().toISOString().slice(0, 10);

  const nextCourse = input.items.find(
    (i) => i.item_type === "course" && i.status !== "completed",
  );
  if (nextCourse) out.push({ kind: "course", text: `Следующий курс: «${nextCourse.title}»` });

  const retraining = input.items.filter((i) => i.status === "retraining_required");
  for (const r of retraining)
    out.push({ kind: "repeat", text: `Рекомендуется повторить тему: «${r.title}»` });

  if (input.hasFailedAttempt && retraining.length === 0)
    out.push({ kind: "repeat", text: "Повторите материалы по неуспешной аттестации" });

  const overdue = input.items.filter(
    (i) => i.due_date && i.due_date < today && i.status !== "completed",
  );
  if (overdue.length > 0)
    out.push({ kind: "overdue", text: `Просрочено пунктов плана: ${overdue.length}` });

  const testItem = input.items.find((i) => i.item_type === "test" && i.status !== "completed");
  if (testItem)
    out.push({
      kind: "test",
      text: input.nextLevelName
        ? `Подготовьтесь к квалификационному тесту для уровня «${input.nextLevelName}»`
        : "Подготовьтесь к квалификационному тесту",
    });

  return out;
}