import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

async function unwrap<T>(p: PromiseLike<{ data: T | null; error: { message: string } | null }>) {
  const { data, error } = await p;
  if (error) throw new Error(error.message);
  return (data ?? []) as T;
}

export const professionsQuery = queryOptions({
  queryKey: ["professions"],
  queryFn: () =>
    unwrap(
      supabase
        .from("professions")
        .select("*")
        .eq("is_active", true)
        .order("sort_order")
        .order("name"),
    ),
});

export const productsQuery = queryOptions({
  queryKey: ["products"],
  queryFn: () =>
    unwrap(supabase.from("products").select("*").eq("is_active", true).order("sort_order")),
});

export const historyQuery = queryOptions({
  queryKey: ["company_history"],
  queryFn: () => unwrap(supabase.from("company_history").select("*").order("sort_order")),
});

export const managementQuery = queryOptions({
  queryKey: ["management"],
  queryFn: () =>
    unwrap(supabase.from("management").select("*").eq("is_active", true).order("sort_order")),
});

export const departmentsQuery = queryOptions({
  queryKey: ["departments"],
  queryFn: () => unwrap(supabase.from("departments").select("*").order("sort_order")),
});

export const materialCategoriesQuery = queryOptions({
  queryKey: ["material_categories"],
  queryFn: () => unwrap(supabase.from("material_categories").select("*").order("sort_order")),
});

export const materialsQuery = queryOptions({
  queryKey: ["materials"],
  queryFn: () =>
    unwrap(
      supabase
        .from("materials")
        .select("*, material_categories(name), professions(name)")
        .eq("is_active", true)
        .order("sort_order"),
    ),
});

export const videosQuery = queryOptions({
  queryKey: ["videos"],
  queryFn: () =>
    unwrap(
      supabase
        .from("videos")
        .select("*, professions(name)")
        .eq("is_active", true)
        .order("sort_order"),
    ),
});

export const siteContentQuery = queryOptions({
  queryKey: ["site_content"],
  queryFn: () => unwrap(supabase.from("site_content").select("*")),
});

export function professionQuery(slug: string) {
  return queryOptions({
    queryKey: ["profession", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("professions")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
  });
}

export function professionMaterialsQuery(professionId: string | undefined) {
  return queryOptions({
    queryKey: ["profession-materials", professionId],
    enabled: Boolean(professionId),
    queryFn: () =>
      unwrap(
        supabase
          .from("materials")
          .select("*, material_categories(name)")
          .eq("is_active", true)
          .or(`profession_id.eq.${professionId},is_mandatory_for_all.eq.true`)
          .order("sort_order"),
      ),
  });
}

export function professionVideosQuery(professionId: string | undefined) {
  return queryOptions({
    queryKey: ["profession-videos", professionId],
    enabled: Boolean(professionId),
    queryFn: () =>
      unwrap(
        supabase
          .from("videos")
          .select("*")
          .eq("is_active", true)
          .eq("profession_id", professionId!)
          .order("sort_order"),
      ),
  });
}

export function myProfileQuery(userId: string | undefined) {
  return queryOptions({
    queryKey: ["profile", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*, departments(name), professions(name, slug)")
        .eq("id", userId!)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
  });
}

export function myAttemptsQuery(userId: string | undefined) {
  return queryOptions({
    queryKey: ["attempts", userId],
    enabled: Boolean(userId),
    queryFn: () =>
      unwrap(
        supabase
          .from("test_attempts")
          .select("*, professions(name)")
          .eq("user_id", userId!)
          .order("started_at", { ascending: false }),
      ),
  });
}

export function myProgressQuery(userId: string | undefined) {
  return queryOptions({
    queryKey: ["progress", userId],
    enabled: Boolean(userId),
    queryFn: () =>
      unwrap(supabase.from("learning_progress").select("*").eq("user_id", userId!)),
  });
}

export function myAchievementsQuery(userId: string | undefined) {
  return queryOptions({
    queryKey: ["achievements", userId],
    enabled: Boolean(userId),
    queryFn: () =>
      unwrap(
        supabase
          .from("employee_achievements")
          .select("*, achievements(*)")
          .eq("user_id", userId!),
      ),
  });
}

export const allAchievementsQuery = queryOptions({
  queryKey: ["all-achievements"],
  queryFn: () =>
    unwrap(supabase.from("achievements").select("*").eq("is_active", true).order("sort_order")),
});

export function practicalTasksQuery(professionId: string | undefined) {
  return queryOptions({
    queryKey: ["practical-tasks", professionId],
    enabled: Boolean(professionId),
    queryFn: () =>
      unwrap(
        supabase
          .from("practical_tasks")
          .select("*, practical_task_items(id, content, match_target, image_url, sort_order)")
          .eq("is_active", true)
          .eq("profession_id", professionId!)
          .order("sort_order"),
      ),
  });
}