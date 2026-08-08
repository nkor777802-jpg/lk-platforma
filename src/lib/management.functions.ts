import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const STAFF = ["admin", "hr"] as const;

function base64ToUint8Array(base64: string) {
  const clean = base64.replace(/^data:.*;base64,/, "");
  return Buffer.from(clean, "base64");
}

export const uploadManagementPhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ id: z.string().uuid(), fileName: z.string(), base64: z.string() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertRole } = await import("./admin.server");
    await assertRole(context.supabase, context.userId, [...STAFF]);

    const safeName = `${Date.now()}-${data.fileName.replace(/[^\w.\-]+/g, "_")}`;
    const path = `${data.id}/${safeName}`;
    const bytes = base64ToUint8Array(data.base64);

    const { error: uploadError } = await context.supabase.storage
      .from("management")
      .upload(path, bytes, { upsert: false, contentType: undefined });
    if (uploadError) throw new Error(uploadError.message);

    const { error: updateError } = await context.supabase
      .from("management")
      .update({ photo_url: path })
      .eq("id", data.id);
    if (updateError) throw new Error(updateError.message);

    return { path };
  });

export const deleteManagementPhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid(), path: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    const { assertRole } = await import("./admin.server");
    await assertRole(context.supabase, context.userId, [...STAFF]);

    const { error: removeError } = await context.supabase.storage.from("management").remove([data.path]);
    if (removeError) throw new Error(removeError.message);

    const { error: updateError } = await context.supabase
      .from("management")
      .update({ photo_url: null })
      .eq("id", data.id);
    if (updateError) throw new Error(updateError.message);

    return { ok: true };
  });
