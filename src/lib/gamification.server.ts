import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type Admin = SupabaseClient<Database>;

export const TRAINER_TYPES: Record<string, { label: string; kind: "sequence" | "match" | "select" }> = {
  cable_assembly: { label: "Сборка конструкции кабеля", kind: "sequence" },
  route: { label: "Маршрут изготовления", kind: "sequence" },
  workcenter: { label: "Выбор рабочего центра", kind: "match" },
  tech_error: { label: "Найди технологическую ошибку", kind: "select" },
  quality: { label: "Контроль качества", kind: "select" },
  shift: { label: "Производственная смена", kind: "sequence" },
  quest: { label: "Производственный квест", kind: "select" },
  sequence: { label: "Последовательность", kind: "sequence" },
  match: { label: "Сопоставление", kind: "match" },
};

export function trainerKind(taskType: string): "sequence" | "match" | "select" {
  return TRAINER_TYPES[taskType]?.kind ?? "select";
}

export type TrainerItem = {
  id: string;
  content: string;
  match_target: string | null;
  correct_position: number | null;
  is_correct: boolean;
};

/** Проверка ответа тренажёра. Выполняется только на сервере. */
export function gradeTrainer(
  taskType: string,
  maxScore: number,
  items: TrainerItem[],
  response: {
    order?: string[] | undefined;
    matches?: Record<string, string> | undefined;
    selectedItemIds?: string[] | undefined;
  },
) {
  const units = items.length || 1;
  const kind = trainerKind(taskType);
  let scored = 0;

  if (kind === "sequence") {
    const expected = [...items].sort((a, b) => (a.correct_position ?? 0) - (b.correct_position ?? 0));
    const given = response.order ?? [];
    scored = expected.filter((item, i) => given[i] === item.id).length;
  } else if (kind === "match") {
    const given = response.matches ?? {};
    scored = items.filter((item) => given[item.id] === (item.match_target ?? "")).length;
  } else {
    const chosen = new Set(response.selectedItemIds ?? []);
    scored = items.filter((item) => chosen.has(item.id) === Boolean(item.is_correct)).length;
  }

  const max = maxScore || units;
  const score = Math.round((scored / units) * max);
  return { score, maxScore: max, passed: score >= Math.ceil(max * 0.7) };
}

export type GamificationStats = {
  trainers_completed: number;
  trainers_passed: number;
  quality_passed: number;
  tests_passed: number;
  perfect_test: number;
  perfect_streak: number;
  plans_completed: number;
};

export async function collectStats(admin: Admin, userId: string): Promise<GamificationStats> {
  const [{ data: results }, { data: attempts }, { data: plans }] = await Promise.all([
    admin
      .from("practical_results")
      .select("passed, practical_tasks(task_type)")
      .eq("user_id", userId),
    admin
      .from("test_attempts")
      .select("passed, score_percent, finished_at")
      .eq("user_id", userId)
      .eq("status", "finished")
      .order("finished_at", { ascending: false }),
    admin.from("development_plans").select("status").eq("user_id", userId),
  ]);

  const rows = results ?? [];
  const tests = attempts ?? [];

  let streak = 0;
  for (const a of tests) {
    if (Number(a.score_percent ?? 0) >= 100) streak += 1;
    else break;
  }

  return {
    trainers_completed: rows.length,
    trainers_passed: rows.filter((r) => r.passed).length,
    quality_passed: rows.filter(
      (r) =>
        r.passed &&
        ((r as { practical_tasks?: { task_type?: string } }).practical_tasks?.task_type ?? "") === "quality",
    ).length,
    tests_passed: tests.filter((a) => a.passed).length,
    perfect_test: tests.filter((a) => Number(a.score_percent ?? 0) >= 100).length,
    perfect_streak: streak,
    plans_completed: (plans ?? []).filter((p) => p.status === "completed").length,
  };
}

/** Пересчёт достижений, участков завода и коллекции профессий. */
export async function recalcGamification(admin: Admin, userId: string) {
  const stats = await collectStats(admin, userId);

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
    .select("id, unlock_condition, unlock_value")
    .eq("is_active", true);
  const { data: openZones } = await admin
    .from("employee_factory_zones")
    .select("zone_id")
    .eq("user_id", userId);
  const openIds = new Set((openZones ?? []).map((z) => z.zone_id));
  const newZones = (zones ?? []).filter((z) => {
    if (openIds.has(z.id)) return false;
    const metric = stats[z.unlock_condition as keyof GamificationStats];
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

  return { stats, awarded: newAchievements.length, zonesUnlocked: newZones.length };
}

export type LeaderboardEntry = {
  key: string;
  label: string;
  points: number;
  people: number;
};

/** Рейтинги по подразделениям, профессиям и активности сотрудников. */
export async function buildLeaderboards(admin: Admin) {
  const [{ data: profiles }, { data: attempts }, { data: results }] = await Promise.all([
    admin
      .from("profiles")
      .select("id, full_name, department_id, profession_id, departments(name), professions(name)")
      .eq("is_active", true),
    admin.from("test_attempts").select("user_id, passed, score_percent").eq("status", "finished"),
    admin.from("practical_results").select("user_id, score, passed"),
  ]);

  const points = new Map<string, number>();
  for (const a of attempts ?? []) {
    const add = (a.passed ? 20 : 0) + Math.round(Number(a.score_percent ?? 0) / 10);
    points.set(a.user_id, (points.get(a.user_id) ?? 0) + add);
  }
  for (const r of results ?? []) {
    points.set(r.user_id, (points.get(r.user_id) ?? 0) + (r.score ?? 0) + (r.passed ? 5 : 0));
  }

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
    p.department_id
      ? { key: p.department_id, label: p.departments?.name ?? "Подразделение" }
      : null,
  );
  const byProfession = group((p) =>
    p.profession_id ? { key: p.profession_id, label: p.professions?.name ?? "Профессия" } : null,
  );
  const byActivity = list
    .map((p) => ({
      key: p.id,
      label: p.full_name,
      points: points.get(p.id) ?? 0,
      people: 1,
    }))
    .filter((p) => p.points > 0)
    .sort((a, b) => b.points - a.points)
    .slice(0, 20);

  return { byDepartment, byProfession, byActivity };
}