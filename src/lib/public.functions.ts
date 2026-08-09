import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const contactSchema = z.object({
  fullName: z.string().trim().min(2, "Укажите ФИО").max(120),
  unit: z.string().trim().max(160).optional().or(z.literal("")),
  email: z.string().trim().email("Некорректный e-mail").max(255).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  message: z.string().trim().min(10, "Опишите вопрос подробнее").max(2000),
  consent: z.literal(true),
});

export type ContactInput = z.input<typeof contactSchema>;

export const listPublicProfessions = createServerFn({ method: "GET" }).handler(async () => {
  const { createPublicSupabase } = await import("./public-supabase.server");
  const supabase = createPublicSupabase();
  const { data, error } = await supabase
    .from("professions")
    .select("id, name, slug, code, short_description, duration_hours, skills, grades")
    .eq("is_active", true)
    .order("sort_order")
    .order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const submitContactRequest = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => contactSchema.parse(input))
  .handler(async ({ data }) => {
    if (!data.email && !data.phone) {
      throw new Error("Укажите e-mail или телефон для ответа");
    }
    const { createPublicSupabase } = await import("./public-supabase.server");
    const supabase = createPublicSupabase();
    const { error } = await supabase.from("contact_requests").insert({
      full_name: data.fullName,
      unit: data.unit || null,
      email: data.email || null,
      phone: data.phone || null,
      message: data.message,
      consent: true,
    });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const getSiteContacts = createServerFn({ method: "GET" }).handler(async () => {
  const { createPublicSupabase } = await import("./public-supabase.server");
  try {
    const supabase = createPublicSupabase();
    const { data } = await supabase
      .from("site_content")
      .select("data")
      .eq("key", "contacts")
      .maybeSingle();
    return (data?.data ?? null) as Record<string, string> | null;
  } catch {
    return null;
  }
});

export type PublicManagementMember = {
  id: string;
  full_name: string;
  position: string;
  bio: string | null;
  photo_url: string | null;
};

export const listPublicManagement = createServerFn({ method: "GET" }).handler(async () => {
  const { createPublicSupabase } = await import("./public-supabase.server");
  const supabase = createPublicSupabase();
  const { data, error } = await supabase
    .from("management")
    .select("id, full_name, position, bio, photo_url")
    .eq("is_active", true)
    .order("sort_order")
    .order("full_name");
  if (error) throw new Error(error.message);

  const rows = data ?? [];
  const members: PublicManagementMember[] = await Promise.all(
    rows.map(async (row) => {
      let photo: string | null = null;
      if (row.photo_url) {
        if (row.photo_url.startsWith("http")) {
          photo = row.photo_url;
        } else {
          const { data: signed } = await supabase.storage
            .from("management")
            .createSignedUrl(row.photo_url, 60 * 60);
          photo = signed?.signedUrl ?? null;
        }
      }
      return {
        id: row.id,
        full_name: row.full_name,
        position: row.position,
        bio: row.bio ?? null,
        photo_url: photo,
      };
    }),
  );
  return members;
});
