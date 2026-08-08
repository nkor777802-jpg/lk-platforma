import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const filterSchema = z.object({
  from: z.string().nullish(),
  to: z.string().nullish(),
  departmentId: z.string().uuid().nullish(),
  professionId: z.string().uuid().nullish(),
  courseId: z.string().uuid().nullish(),
  granularity: z.enum(["month", "quarter", "year"]).default("month"),
});

export type AnalyticsInput = z.input<typeof filterSchema>;

/** Справочники для панели фильтров аналитики. */
export const analyticsFilterOptions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertRole } = await import("./admin.server");
    await assertRole(context.supabase, context.userId, ["admin", "hr", "teacher", "manager"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [departments, professions, courses] = await Promise.all([
      supabaseAdmin.from("departments").select("id, name").order("name"),
      supabaseAdmin.from("professions").select("id, name").eq("is_active", true).order("name"),
      supabaseAdmin.from("courses").select("id, title").eq("is_active", true).order("title"),
    ]);
    return {
      departments: departments.data ?? [],
      professions: professions.data ?? [],
      courses: courses.data ?? [],
    };
  });

/** Сводная аналитика обучения и аттестации с учётом роли и фильтров. */
export const analyticsDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => filterSchema.parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const { resolveScope, periodKey, summarize, avg, pct } = await import("./analytics.server");
    const scope = await resolveScope(context.supabase, context.userId, data);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const ids = scope.userIds;
    if (ids && ids.length === 0) {
      return {
        empty: true as const,
        kpi: { employees: 0, attempts: 0, avgScore: 0, passRate: 0, overdue: 0, active: 0, completedStages: 0 },
        trend: [] as { period: string; attempts: number; avgScore: number; passRate: number }[],
        scoreBuckets: [] as { bucket: string; count: number }[],
        byDepartment: [] as any[],
        byProfession: [] as any[],
        byEmployee: [] as any[],
        byCourse: [] as any[],
        problemTopics: [] as any[],
      };
    }

    // --- Профили в области видимости
    let profQ = supabaseAdmin
      .from("profiles")
      .select("id, full_name, grade, department_id, profession_id, departments(name), professions(name)");
    if (ids) profQ = profQ.in("id", ids);
    const { data: profiles } = await profQ;
    const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));

    // --- Попытки тестирования
    let attemptQ = supabaseAdmin
      .from("test_attempts")
      .select("id, user_id, profession_id, started_at, score_percent, passed, status, professions(name)")
      .eq("status", "finished");
    if (ids) attemptQ = attemptQ.in("user_id", ids);
    if (data.from) attemptQ = attemptQ.gte("started_at", data.from);
    if (data.to) attemptQ = attemptQ.lte("started_at", `${data.to}T23:59:59`);
    if (data.professionId) attemptQ = attemptQ.eq("profession_id", data.professionId);
    const { data: attemptsRaw } = await attemptQ;
    const attempts = (attemptsRaw ?? []) as any[];

    // --- Назначения
    let assignQ = supabaseAdmin
      .from("assignments")
      .select("id, user_id, course_id, profession_id, status, due_date, assigned_at, courses(title)");
    if (ids) assignQ = assignQ.in("user_id", ids);
    if (data.courseId) assignQ = assignQ.eq("course_id", data.courseId);
    if (data.professionId) assignQ = assignQ.eq("profession_id", data.professionId);
    const { data: assignRaw } = await assignQ;
    const assignments = (assignRaw ?? []) as any[];

    // --- Прогресс обучения
    let progQ = supabaseAdmin
      .from("learning_progress")
      .select("id, user_id, status, completed_at");
    if (ids) progQ = progQ.in("user_id", ids);
    const { data: progressRaw } = await progQ;
    const progress = (progressRaw ?? []) as any[];

    const today = new Date().toISOString().slice(0, 10);
    const overdue = assignments.filter(
      (a) => a.due_date && a.due_date < today && a.status !== "completed",
    ).length;

    const kpi = {
      employees: profiles?.length ?? 0,
      attempts: attempts.length,
      avgScore: avg(attempts.map((a) => Number(a.score_percent ?? 0))),
      passRate: pct(attempts.filter((a) => a.passed).length, attempts.length),
      overdue,
      active: new Set(attempts.map((a) => a.user_id)).size,
      completedStages: progress.filter((p) => p.status === "completed").length,
    };

    // --- Динамика по периодам
    const periods = new Map<string, any[]>();
    for (const a of attempts) {
      const key = periodKey(a.started_at, data.granularity);
      periods.set(key, [...(periods.get(key) ?? []), a]);
    }
    const trend = [...periods.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([period, list]) => {
        const s = summarize(list);
        return { period, attempts: s.attempts, avgScore: s.avgScore, passRate: s.passRate };
      });

    // --- Распределение баллов
    const buckets = ["0–39", "40–59", "60–79", "80–89", "90–100"];
    const scoreBuckets = buckets.map((bucket) => ({ bucket, count: 0 }));
    for (const a of attempts) {
      const v = Number(a.score_percent ?? 0);
      const i = v < 40 ? 0 : v < 60 ? 1 : v < 80 ? 2 : v < 90 ? 3 : 4;
      scoreBuckets[i]!.count += 1;
    }

    // --- Срезы
    const group = <T>(list: any[], keyOf: (x: any) => string, nameOf: (x: any) => string) => {
      const map = new Map<string, { key: string; name: string; items: any[] }>();
      for (const item of list) {
        const key = keyOf(item) || "—";
        const cur = map.get(key) ?? { key, name: nameOf(item) || "—", items: [] };
        cur.items.push(item);
        map.set(key, cur);
      }
      return [...map.values()] as unknown as T[];
    };

    const byDepartment = group<any>(
      attempts,
      (a) => profileMap.get(a.user_id)?.department_id ?? "—",
      (a) => profileMap.get(a.user_id)?.departments?.name ?? "Без подразделения",
    ).map((g: any) => ({ id: g.key, name: g.name, ...summarize(g.items) }));

    const byProfession = group<any>(
      attempts,
      (a) => a.profession_id ?? "—",
      (a) => a.professions?.name ?? "Без профессии",
    ).map((g: any) => ({ id: g.key, name: g.name, ...summarize(g.items) }));

    const byEmployee = group<any>(
      attempts,
      (a) => a.user_id,
      (a) => profileMap.get(a.user_id)?.full_name ?? "Сотрудник",
    )
      .map((g: any) => ({
        id: g.key,
        name: g.name,
        department: profileMap.get(g.key)?.departments?.name ?? "—",
        profession: profileMap.get(g.key)?.professions?.name ?? "—",
        ...summarize(g.items),
      }))
      .sort((a: any, b: any) => b.avgScore - a.avgScore);

    const byCourse = group<any>(
      assignments.filter((a) => a.course_id),
      (a) => a.course_id,
      (a) => a.courses?.title ?? "Курс",
    ).map((g: any) => {
      const total = g.items.length;
      const completed = g.items.filter((i: any) => i.status === "completed").length;
      const late = g.items.filter(
        (i: any) => i.due_date && i.due_date < today && i.status !== "completed",
      ).length;
      return {
        id: g.key,
        name: g.name,
        assigned: total,
        completed,
        completionRate: pct(completed, total),
        overdue: late,
      };
    });

    // --- Проблемные темы (по ответам в рамках выбранных попыток)
    let problemTopics: { topic: string; total: number; errors: number; errorRate: number }[] = [];
    const attemptIds = attempts.map((a) => a.id).slice(0, 500);
    if (attemptIds.length > 0) {
      const { data: answers } = await supabaseAdmin
        .from("test_answers")
        .select("is_correct, questions(topic, category)")
        .in("attempt_id", attemptIds);
      const map = new Map<string, { total: number; errors: number }>();
      for (const ans of (answers ?? []) as any[]) {
        const topic = ans.questions?.topic ?? ans.questions?.category ?? "Без темы";
        const cur = map.get(topic) ?? { total: 0, errors: 0 };
        cur.total += 1;
        if (ans.is_correct === false) cur.errors += 1;
        map.set(topic, cur);
      }
      problemTopics = [...map.entries()]
        .map(([topic, v]) => ({ topic, ...v, errorRate: pct(v.errors, v.total) }))
        .filter((t) => t.total >= 3)
        .sort((a, b) => b.errorRate - a.errorRate)
        .slice(0, 10);
    }

    return {
      empty: false as const,
      kpi,
      trend,
      scoreBuckets,
      byDepartment,
      byProfession,
      byEmployee,
      byCourse,
      problemTopics,
    };
  });

/** Персональная статистика текущего сотрудника. */
export const myAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { periodKey, summarize, pct } = await import("./analytics.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    const [{ data: attemptsRaw }, { data: assignRaw }, { data: progressRaw }] = await Promise.all([
      supabaseAdmin
        .from("test_attempts")
        .select("id, started_at, score_percent, passed, status, professions(name)")
        .eq("user_id", userId)
        .eq("status", "finished")
        .order("started_at"),
      supabaseAdmin.from("assignments").select("id, status, due_date").eq("user_id", userId),
      supabaseAdmin.from("learning_progress").select("id, status").eq("user_id", userId),
    ]);

    const attempts = (attemptsRaw ?? []) as any[];
    const assignments = (assignRaw ?? []) as any[];
    const progress = (progressRaw ?? []) as any[];
    const today = new Date().toISOString().slice(0, 10);

    const trend = [
      ...attempts
        .reduce((map: Map<string, any[]>, a) => {
          const key = periodKey(a.started_at, "month");
          map.set(key, [...(map.get(key) ?? []), a]);
          return map;
        }, new Map())
        .entries(),
    ]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([period, list]) => ({ period, avgScore: summarize(list as any[]).avgScore }));

    return {
      ...summarize(attempts),
      completedStages: progress.filter((p) => p.status === "completed").length,
      assignments: assignments.length,
      completedAssignments: assignments.filter((a) => a.status === "completed").length,
      assignmentRate: pct(
        assignments.filter((a) => a.status === "completed").length,
        assignments.length,
      ),
      overdue: assignments.filter(
        (a) => a.due_date && a.due_date < today && a.status !== "completed",
      ).length,
      lastScore: attempts.length ? Number(attempts[attempts.length - 1].score_percent ?? 0) : null,
      trend,
    };
  });