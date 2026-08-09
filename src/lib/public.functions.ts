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
