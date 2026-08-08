import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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

/** Данные раздела «Развитие навыков» для текущего сотрудника. */
export const myGamification = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { recalcGamification } = await import("./gamification.server");

    const { stats, processOps, xp } = await recalcGamification(supabaseAdmin, context.userId);

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
    const metric = (type: string, code?: string) =>
      type === "process_ops"
        ? (processOps[code ?? ""] ?? 0)
        : (stats[type as keyof typeof stats] ?? 0);

    return {
      stats,
      xp,
      achievements: (achievements ?? []).map((a) => ({
        id: a.id,
        title: a.title,
        description: a.description,
        icon: a.icon,
        conditionType: a.condition_type,
        conditionValue: a.condition_value ?? 1,
        progress: Math.min(metric(a.condition_type), a.condition_value ?? 1),
        earnedAt: earned.get(a.id) ?? null,
      })),
      zones: (zones ?? []).map((z) => ({
        id: z.id,
        name: z.name,
        description: z.description,
        process: z.code,
        conditionValue: z.unlock_value,
        progress: Math.min(metric(z.unlock_condition, z.code), z.unlock_value),
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
