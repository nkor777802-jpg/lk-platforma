import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { levelFromXp } from "./simulator.server";

type Admin = SupabaseClient<Database>;

/** Условия достижений и открытия участков завода. */
export const CONDITION_LABELS: Record<string, string> = {
  runs_completed: "Собрано кабелей на тренажёре",
  steps_correct: "Верных производственных операций",
  flawless_runs: "Сборок без единой ошибки",
  defects_found: "Найдено дефектов",
  tests_passed: "Сдано аттестаций",
  perfect_test: "Тестов на 100%",
  perfect_streak: "Серия тестов без ошибок",
  plans_completed: "Завершено планов развития",
  process_ops: "Операций по процессу участка",
};

export type GamificationStats = {
  runs_completed: number;
  steps_correct: number;
  flawless_runs: number;
  defects_found: number;
  tests_passed: number;
  perfect_test: number;
  perfect_streak: number;
  plans_completed: number;
};

export type StatsBundle = {
  stats: GamificationStats;
  processOps: Record<string, number>;
  xp: ReturnType<typeof levelFromXp>;
};

export async function collectStats(admin: Admin, userId: string): Promise<StatsBundle> {
  const [{ data: runs }, { data: steps }, { data: results }, { data: attempts }, { data: plans }] =
    await Promise.all([
      admin
        .from("simulator_runs")
        .select("status, errors, xp, correct_steps, total_steps")
        .eq("user_id", userId),
      admin.from("simulator_steps").select("process, is_correct").eq("user_id", userId),
      admin.from("practical_results").select("passed, response").eq("user_id", userId),
      admin
        .from("test_attempts")
        .select("passed, score_percent, finished_at")
        .eq("user_id", userId)
        .eq("status", "finished")
        .order("finished_at", { ascending: false }),
      admin.from("development_plans").select("status").eq("user_id", userId),
    ]);

  const runRows = runs ?? [];
  const tests = attempts ?? [];

  const processOps: Record<string, number> = {};
  for (const s of steps ?? []) {
    if (!s.is_correct) continue;
    processOps[s.process] = (processOps[s.process] ?? 0) + 1;
  }

  let streak = 0;
  for (const a of tests) {
    if (Number(a.score_percent ?? 0) >= 100) streak += 1;
    else break;
  }

  const stats: GamificationStats = {
    runs_completed: runRows.filter((r) => r.status === "completed").length,
    steps_correct: (steps ?? []).filter((s) => s.is_correct).length,
    flawless_runs: runRows.filter((r) => r.status === "completed" && r.errors === 0).length,
    defects_found: (results ?? []).filter(
      (r) =>
        r.passed &&
        ((r.response as { kind?: string } | null)?.kind ?? "") === "quality",
    ).length,
    tests_passed: tests.filter((a) => a.passed).length,
    perfect_test: tests.filter((a) => Number(a.score_percent ?? 0) >= 100).length,
    perfect_streak: streak,
    plans_completed: (plans ?? []).filter((p) => p.status === "completed").length,
  };

  const totalXp =
    runRows.reduce((sum, r) => sum + (r.xp ?? 0), 0) +
    stats.tests_passed * 30 +
    stats.perfect_test * 20 +
    stats.defects_found * 10;

  return { stats, processOps, xp: levelFromXp(totalXp) };
}

/** Пересчёт достижений, участков завода и коллекции профессий. */
export async function recalcGamification(admin: Admin, userId: string) {
  const bundle = await collectStats(admin, userId);
  const { stats, processOps } = bundle;

  const { data: achievements } = await admin
    .from("achievements")
    .select("id, code, condition_type, condition_value")
    .eq("is_active", true);
  const { data: earned } = await admin
    .from("employee_achievements")
    .select("achievement_id")
    .eq("user_id", userId);
  const earnedIds = new Set((earned ?? []).map((e) => e.achievement_id));

  const newAchievements = (achievements ?? []).filter((a) => {
    if (earnedIds.has(a.id)) return false;
    const metric = stats[a.condition_type as keyof GamificationStats];
    if (typeof metric !== "number") return false;
    return metric >= (a.condition_value ?? 1);
  });
  if (newAchievements.length) {
    await admin
      .from("employee_achievements")
      .upsert(
        newAchievements.map((a) => ({ user_id: userId, achievement_id: a.id })),
        { onConflict: "user_id,achievement_id", ignoreDuplicates: true },
      );
  }

  const { data: zones } = await admin
    .from("factory_zones")
    .select("id, code, unlock_condition, unlock_value")
    .eq("is_active", true);
  const { data: openZones } = await admin
    .from("employee_factory_zones")
    .select("zone_id")
    .eq("user_id", userId);
  const openIds = new Set((openZones ?? []).map((z) => z.zone_id));
  const newZones = (zones ?? []).filter((z) => {
    if (openIds.has(z.id)) return false;
    const metric =
      z.unlock_condition === "process_ops"
        ? (processOps[z.code] ?? 0)
        : stats[z.unlock_condition as keyof GamificationStats];
    if (typeof metric !== "number") return false;
    return metric >= (z.unlock_value ?? 1);
  });
  if (newZones.length) {
    await admin
      .from("employee_factory_zones")
      .upsert(
        newZones.map((z) => ({ user_id: userId, zone_id: z.id })),
        { onConflict: "user_id,zone_id", ignoreDuplicates: true },
      );
  }

  const { data: passedAttempts } = await admin
    .from("test_attempts")
    .select("profession_id, grade_result")
    .eq("user_id", userId)
    .eq("status", "finished")
    .eq("passed", true);
  const professionIds = Array.from(
    new Set((passedAttempts ?? []).map((a) => a.profession_id).filter(Boolean) as string[]),
  );
  if (professionIds.length) {
    await admin.from("profession_collection").upsert(
      professionIds.map((pid) => ({
        user_id: userId,
        profession_id: pid,
        level_code:
          (passedAttempts ?? []).find((a) => a.profession_id === pid)?.grade_result ?? null,
      })),
      { onConflict: "user_id,profession_id", ignoreDuplicates: true },
    );
  }

  return { ...bundle, awarded: newAchievements.length, zonesUnlocked: newZones.length };
}

export type LeaderboardEntry = {
  key: string;
  label: string;
  points: number;
  people: number;
};

/** Рейтинги сотрудников, подразделений и профессий. */
export async function buildLeaderboards(admin: Admin) {
  const [{ data: profiles }, { data: attempts }, { data: runs }, { data: results }] =
    await Promise.all([
      admin
        .from("profiles")
        .select("id, full_name, department_id, profession_id, departments(name), professions(name)")
        .eq("is_active", true),
      admin.from("test_attempts").select("user_id, passed, score_percent").eq("status", "finished"),
      admin.from("simulator_runs").select("user_id, xp, score"),
      admin.from("practical_results").select("user_id, score, passed"),
    ]);

  const points = new Map<string, number>();
  const add = (userId: string, value: number) =>
    points.set(userId, (points.get(userId) ?? 0) + value);

  for (const a of attempts ?? [])
    add(a.user_id, (a.passed ? 20 : 0) + Math.round(Number(a.score_percent ?? 0) / 10));
  for (const r of runs ?? []) add(r.user_id, (r.xp ?? 0) + (r.score ?? 0));
  for (const r of results ?? []) add(r.user_id, (r.score ?? 0) + (r.passed ? 5 : 0));

  type ProfileRow = {
    id: string;
    full_name: string;
    department_id: string | null;
    profession_id: string | null;
    departments?: { name?: string } | null;
    professions?: { name?: string } | null;
  };
  const list = (profiles ?? []) as ProfileRow[];

  const group = (getKey: (p: ProfileRow) => { key: string; label: string } | null) => {
    const map = new Map<string, LeaderboardEntry>();
    for (const p of list) {
      const g = getKey(p);
      if (!g) continue;
      const prev = map.get(g.key) ?? { key: g.key, label: g.label, points: 0, people: 0 };
      prev.points += points.get(p.id) ?? 0;
      prev.people += 1;
      map.set(g.key, prev);
    }
    return Array.from(map.values())
      .sort((a, b) => b.points - a.points)
      .slice(0, 20);
  };

  const byDepartment = group((p) =>
    p.department_id ? { key: p.department_id, label: p.departments?.name ?? "Подразделение" } : null,
  );
  const byProfession = group((p) =>
    p.profession_id ? { key: p.profession_id, label: p.professions?.name ?? "Профессия" } : null,
  );
  const byActivity = list
    .map((p) => ({ key: p.id, label: p.full_name, points: points.get(p.id) ?? 0, people: 1 }))
    .filter((p) => p.points > 0)
    .sort((a, b) => b.points - a.points)
    .slice(0, 20);

  return { byDepartment, byProfession, byActivity };
}
