import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

async function unwrap<T>(p: PromiseLike<{ data: T | null; error: { message: string } | null }>) {
  const { data, error } = await p;
  if (error) throw new Error(error.message);
  return (data ?? []) as T;
}

export type AssignmentRow = {
  id: string;
  status: string;
  due_date: string | null;
  assigned_at: string | null;
  is_mandatory: boolean;
  comment: string | null;
  course_id: string | null;
  profession_id: string | null;
  training_type: string | null;
  target_grade: string | null;
  courses?: { id: string; title: string; description: string | null } | null;
  professions?: { id: string; name: string; slug: string | null } | null;
};

export function myAssignmentsQuery(userId: string | undefined) {
  return queryOptions({
    queryKey: ["my-assignments", userId],
    enabled: Boolean(userId),
    queryFn: () =>
      unwrap<AssignmentRow[]>(
        supabase
          .from("assignments")
          .select(
            "id, status, due_date, assigned_at, is_mandatory, comment, course_id, profession_id, training_type, target_grade, courses(id, title, description), professions(id, name, slug)",
          )
          .eq("user_id", userId!)
          .order("due_date", { nullsFirst: false }) as never,
      ),
  });
}

export function courseDetailQuery(courseId: string) {
  return queryOptions({
    queryKey: ["course-detail", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select(
          "*, professions(id, name, slug), course_modules(id, title, description, module_type, sort_order, is_required)",
        )
        .eq("id", courseId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
  });
}

export function courseMaterialsQuery(moduleIds: string[]) {
  return queryOptions({
    queryKey: ["course-materials", moduleIds.join(",")],
    enabled: moduleIds.length > 0,
    queryFn: () =>
      unwrap(
        supabase
          .from("materials")
          .select("*, material_categories(name)")
          .in("module_id", moduleIds)
          .eq("is_active", true)
          .order("sort_order"),
      ),
  });
}

export function myNotificationsQuery(userId: string | undefined) {
  return queryOptions({
    queryKey: ["notifications", userId],
    enabled: Boolean(userId),
    queryFn: () =>
      unwrap(
        supabase
          .from("notifications")
          .select("*")
          .eq("user_id", userId!)
          .order("created_at", { ascending: false })
          .limit(50),
      ),
  });
}

export function myCertificatesQuery(userId: string | undefined) {
  return queryOptions({
    queryKey: ["certificates", userId],
    enabled: Boolean(userId),
    queryFn: () =>
      unwrap(
        supabase
          .from("certificates")
          .select("*, courses(title), professions(name)")
          .eq("user_id", userId!)
          .order("issued_at", { ascending: false }),
      ),
  });
}

export function testSettingsQuery(professionId: string | undefined | null) {
  return queryOptions({
    queryKey: ["test-settings", professionId ?? "default"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("test_settings")
        .select("*")
        .or(
          professionId ? `profession_id.eq.${professionId},is_default.eq.true` : "is_default.eq.true",
        );
      if (error) throw new Error(error.message);
      const rows = data ?? [];
      return rows.find((r) => r.profession_id === professionId) ?? rows[0] ?? null;
    },
  });
}