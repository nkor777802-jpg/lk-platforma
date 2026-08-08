import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        phone: z.string().max(40).nullable().optional(),
        email: z.string().email().nullable().optional(),
        avatar_url: z.string().max(500).nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    // Белый список полей: кадровые данные сотрудник менять не может
    const patch: Record<string, string | null> = {};
    if (data.phone !== undefined) patch["phone"] = data.phone;
    if (data.email !== undefined) patch["email"] = data.email;
    if (data.avatar_url !== undefined) patch["avatar_url"] = data.avatar_url;
    const { error } = await context.supabase
      .from("profiles")
      .update(patch)
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const markNotificationRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ id: z.string().uuid().optional(), all: z.boolean().optional() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", context.userId);
    if (!data.all && data.id) q = q.eq("id", data.id);
    const { error } = await q;
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const completeModule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ moduleId: z.string().uuid(), professionId: z.string().uuid().nullish() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: existing } = await context.supabase
      .from("learning_progress")
      .select("id")
      .eq("user_id", context.userId)
      .eq("module_id", data.moduleId)
      .maybeSingle();

    if (existing?.id) {
      const { error } = await context.supabase
        .from("learning_progress")
        .update({
          status: "completed",
          progress_percent: 100,
          completed_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("learning_progress").insert({
        user_id: context.userId,
        module_id: data.moduleId,
        profession_id: data.professionId ?? null,
        status: "completed",
        progress_percent: 100,
        completed_at: new Date().toISOString(),
      });
      if (error) throw new Error(error.message);
    }
    return { success: true };
  });