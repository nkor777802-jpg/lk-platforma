import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { AppRole } from "./admin.server";

export interface AnalyticsFilters {
  from?: string | null | undefined;
  to?: string | null | undefined;
  departmentId?: string | null | undefined;
  professionId?: string | null | undefined;
  courseId?: string | null | undefined;
}

export interface Scope {
  roles: AppRole[];
  /** null = доступ ко всем сотрудникам */
  userIds: string[] | null;
}

/** Определяет, чьи данные доступны текущему пользователю. */
export async function resolveScope(
  supabase: SupabaseClient<Database>,
  userId: string,
  filters: AnalyticsFilters,
): Promise<Scope> {
  const { getRoles } = await import("./admin.server");
  const roles = await getRoles(supabase, userId);
  const full = roles.some((r) => ["admin", "hr", "teacher"].includes(r));
  if (!full && !roles.includes("manager")) {
    throw new Error("Недостаточно прав для просмотра аналитики");
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  let query = supabaseAdmin.from("profiles").select("id, department_id, profession_id, manager_id");
  if (filters.departmentId) query = query.eq("department_id", filters.departmentId);
  if (filters.professionId) query = query.eq("profession_id", filters.professionId);
  const { data: profiles } = await query;

  let allowed = profiles ?? [];
  if (!full) {
    const { data: me } = await supabaseAdmin
      .from("profiles")
      .select("department_id")
      .eq("id", userId)
      .maybeSingle();
    allowed = allowed.filter(
      (p) => p.manager_id === userId || (me?.department_id && p.department_id === me.department_id),
    );
  }

  const filtered = Boolean(filters.departmentId || filters.professionId) || !full;
  return { roles, userIds: filtered ? allowed.map((p) => p.id) : null };
}

export function periodKey(iso: string, granularity: "month" | "quarter" | "year") {
  const d = new Date(iso);
  const y = d.getUTCFullYear();
  if (granularity === "year") return String(y);
  if (granularity === "quarter") return `${y}-Q${Math.floor(d.getUTCMonth() / 3) + 1}`;
  return `${y}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function avg(nums: number[]) {
  if (nums.length === 0) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

export function pct(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

/** Сводка группы попыток. */
export function summarize(attempts: { score_percent: unknown; passed: unknown }[]) {
  const finished = attempts.length;
  const passed = attempts.filter((a) => a.passed === true).length;
  return {
    attempts: finished,
    passed,
    passRate: pct(passed, finished),
    avgScore: avg(attempts.map((a) => Number(a.score_percent ?? 0))),
  };
}