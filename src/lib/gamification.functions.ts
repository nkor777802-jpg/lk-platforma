import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/** Настройки модуля геймификации. */
export const gamificationSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("platform_settings")
      .select("key, value")
      .in("key", ["gamification_enabled", "leaderboards_enabled"]);
    const map = new Map((data ?? []).map((r) => [r.key, r.value]));
    const flag = (key: string) => String(map.get(key) ?? "true") !== "false";
    return {
      gamificationEnabled: flag("gamification_enabled"),
      leaderboardsEnabled: flag("leaderboards_enabled"),
    };
  });

/** Список производственных тренажёров и квестов без признаков правильных ответов. */
export const listTrainers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { trainerKind, TRAINER_TYPES } = await import("./gamification.server");

    const { data: tasks } = await supabaseAdmin
      .from("practical_tasks")
      .select(
        "id, title, instruction, task_type, image_url, max_score, profession_id, professions(name), practical_task_items(id, content, image_url, sort_order, match_target)",
      )
      .eq("is_active", true)
      .order("sort_order");

    const { data: results } = await supabaseAdmin
      .from("practical_results")
      .select("task_id, score, max_score, passed, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });

    const best = new Map<string, { score: number; maxScore: number; passed: boolean }>();
    for (const r of results ?? []) {
      if (!r.task_id) continue;
      const prev = best.get(r.task_id);
      if (!prev || r.score > prev.score)
        best.set(r.task_id, { score: r.score, maxScore: r.max_score, passed: r.passed });
    }

    return (tasks ?? []).map((t) => {
      const kind = trainerKind(t.task_type);
      const items = (t.practical_task_items ?? []).map((i) => ({
        id: i.id,
        content: i.content,
        imageUrl: i.image_url,
      }));
      const targets =
        kind === "match"
          ? Array.from(
              new Set(
                (t.practical_task_items ?? [])
                  .map((i) => i.match_target)
                  .filter((v): v is string => Boolean(v)),
              ),
            ).sort()
          : [];
      return {
        id: t.id,
        title: t.title,
        instruction: t.instruction,
        taskType: t.task_type,
        typeLabel: TRAINER_TYPES[t.task_type]?.label ?? "Тренажёр",
        kind,
        imageUrl: t.image_url,
        maxScore: t.max_score,
        professionName: (t as { professions?: { name?: string } }).professions?.name ?? null,
        items: kind === "sequence" ? [...items].sort(() => Math.random() - 0.5) : items,
        targets,
        result: best.get(t.id) ?? null,
      };
    });
  });

/** Отправка ответа тренажёра. Проверка выполняется на сервере. */
export const submitTrainer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        taskId: z.string().uuid(),
        order: z.array(z.string().uuid()).max(50).optional(),
        matches: z.record(z.string(), z.string()).optional(),
        selectedItemIds: z.array(z.string().uuid()).max(50).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { gradeTrainer, recalcGamification } = await import("./gamification.server");

    const { data: task } = await supabaseAdmin
      .from("practical_tasks")
      .select(
        "id, task_type, max_score, practical_task_items(id, content, match_target, correct_position, is_correct)",
      )
      .eq("id", data.taskId)
      .eq("is_active", true)
      .single();
    if (!task) throw new Error("Тренажёр не найден");

    const graded = gradeTrainer(task.task_type, task.max_score ?? 0, task.practical_task_items ?? [], {
      order: data.order,
      matches: data.matches,
      selectedItemIds: data.selectedItemIds,
    });

    await supabaseAdmin.from("practical_results").insert({
      user_id: context.userId,
      task_id: task.id,
      score: graded.score,
      max_score: graded.maxScore,
      passed: graded.passed,
      response: {
        order: data.order ?? null,
        matches: data.matches ?? null,
        selectedItemIds: data.selectedItemIds ?? null,
      },
    });

    const recalc = await recalcGamification(supabaseAdmin, context.userId);
    return { ...graded, awarded: recalc.awarded, zonesUnlocked: recalc.zonesUnlocked };
  });

/** Данные раздела «Развитие навыков» для текущего сотрудника. */
export const myGamification = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { recalcGamification } = await import("./gamification.server");

    const { stats } = await recalcGamification(supabaseAdmin, context.userId);

    const [{ data: achievements }, { data: mine }, { data: zones }, { data: openZones }, { data: collection }] =
      await Promise.all([
        supabaseAdmin.from("achievements").select("*").eq("is_active", true).order("sort_order"),
        supabaseAdmin
          .from("employee_achievements")
          .select("achievement_id, earned_at")
          .eq("user_id", context.userId),
        supabaseAdmin.from("factory_zones").select("*").eq("is_active", true).order("sort_order"),
        supabaseAdmin
          .from("employee_factory_zones")
          .select("zone_id, unlocked_at")
          .eq("user_id", context.userId),
        supabaseAdmin
          .from("profession_collection")
          .select("profession_id, level_code, unlocked_at, professions(name, slug, short_description, image_url)")
          .eq("user_id", context.userId),
      ]);

    const earned = new Map((mine ?? []).map((m) => [m.achievement_id, m.earned_at]));
    const opened = new Map((openZones ?? []).map((z) => [z.zone_id, z.unlocked_at]));

    return {
      stats,
      achievements: (achievements ?? []).map((a) => ({
        id: a.id,
        title: a.title,
        description: a.description,
        icon: a.icon,
        conditionType: a.condition_type,
        conditionValue: a.condition_value ?? 1,
        progress: Math.min(
          stats[a.condition_type as keyof typeof stats] ?? 0,
          a.condition_value ?? 1,
        ),
        earnedAt: earned.get(a.id) ?? null,
      })),
      zones: (zones ?? []).map((z) => ({
        id: z.id,
        name: z.name,
        description: z.description,
        icon: z.icon,
        conditionType: z.unlock_condition,
        conditionValue: z.unlock_value,
        progress: Math.min(stats[z.unlock_condition as keyof typeof stats] ?? 0, z.unlock_value),
        unlockedAt: opened.get(z.id) ?? null,
      })),
      collection: (collection ?? []).map((c) => ({
        professionId: c.profession_id,
        levelCode: c.level_code,
        unlockedAt: c.unlocked_at,
        name: (c as { professions?: { name?: string } }).professions?.name ?? "Профессия",
        slug: (c as { professions?: { slug?: string | null } }).professions?.slug ?? null,
        description:
          (c as { professions?: { short_description?: string | null } }).professions
            ?.short_description ?? null,
        imageUrl: (c as { professions?: { image_url?: string | null } }).professions?.image_url ?? null,
      })),
    };
  });

/** Рейтинги по подразделениям, профессиям и активности. */
export const listLeaderboards = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { buildLeaderboards } = await import("./gamification.server");

    const { data: setting } = await supabaseAdmin
      .from("platform_settings")
      .select("value")
      .eq("key", "leaderboards_enabled")
      .maybeSingle();
    if (String(setting?.value ?? "true") === "false") {
      return { enabled: false, byDepartment: [], byProfession: [], byActivity: [] };
    }
    const boards = await buildLeaderboards(supabaseAdmin);
    return { enabled: true, ...boards };
  });