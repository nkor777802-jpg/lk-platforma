import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Проверка дополнительного пароля доступа к админ-панели.
 * Пароль зависит от уровня прав вызывающего пользователя.
 */
export const unlockAdminPanel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { password: string }) => ({
    password: String(input?.password ?? ""),
  }))
  .handler(async ({ data, context }) => {
    const { getRoles, logAction } = await import("./admin.server");
    const { timingSafeEqualString } = await import("./admin-unlock.server");

    const roles = await getRoles(context.supabase, context.userId);
    const isStaff = roles.some((r) => r === "admin" || r === "hr");
    const isTeaching = roles.some((r) => r === "teacher" || r === "manager");
    if (!isStaff && !isTeaching) {
      return { ok: false as const, tier: null };
    }

    const tier = isStaff ? ("staff" as const) : ("teaching" as const);
    const expected =
      tier === "staff" ? process.env["ADMIN_PANEL_PASSWORD"] : process.env["STAFF_PANEL_PASSWORD"];
    if (!expected) throw new Error("Пароль доступа к админ-панели не настроен");

    const ok = timingSafeEqualString(data.password, expected);
    await logAction({
      actorId: context.userId,
      action: ok ? "admin_panel_unlock" : "admin_panel_unlock_failed",
      entity: "admin_panel",
      details: { tier },
    });

    return { ok, tier: ok ? tier : null };
  });