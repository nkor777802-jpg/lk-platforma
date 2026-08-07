import { supabase } from "@/integrations/supabase/client";

/** Публичные бакеты заблокированы политикой воркспейса — используем подписанные ссылки. */
export async function signedUrl(path: string | null | undefined, bucket = "materials") {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}

export async function uploadFile(bucket: string, file: File, prefix = "") {
  const safeName = `${Date.now()}-${file.name.replace(/[^\w.\-]+/g, "_")}`;
  const path = `${prefix}${safeName}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
  if (error) throw error;
  return path;
}