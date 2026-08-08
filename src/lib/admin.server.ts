import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];

export async function getRoles(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<AppRole[]> {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  return ((data ?? []) as { role: AppRole }[]).map((r) => r.role);
}

export async function assertRole(
  supabase: SupabaseClient<Database>,
  userId: string,
  allowed: AppRole[],
): Promise<AppRole[]> {
  const roles = await getRoles(supabase, userId);
  if (!roles.some((r) => allowed.includes(r))) {
    throw new Error("Недостаточно прав для выполнения операции");
  }
  return roles;
}

export async function logAction(input: {
  actorId: string;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: Record<string, unknown>;
}) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("full_name")
    .eq("id", input.actorId)
    .maybeSingle();
  await supabaseAdmin.from("audit_log").insert({
    actor_id: input.actorId,
    actor_name: profile?.full_name ?? null,
    action: input.action,
    entity: input.entity,
    entity_id: input.entityId ?? null,
    details: (input.details ?? {}) as never,
  });
}

/** Таблицы, доступные для управления через админ-панель. */
export const MANAGED_TABLES = {
  departments: { soft: "none" },
  positions: { soft: "is_active" },
  groups: { soft: "is_active" },
  professions: { soft: "is_active" },
  courses: { soft: "is_active" },
  course_modules: { soft: "none" },
  course_types: { soft: "is_active" },
  learning_categories: { soft: "is_active" },
  test_kinds: { soft: "is_active" },
  material_categories: { soft: "none" },
  materials: { soft: "is_active" },
  videos: { soft: "is_active" },
  products: { soft: "is_active" },
  questions: { soft: "is_active" },
  answer_options: { soft: "none" },
  practical_tasks: { soft: "is_active" },
  practical_task_items: { soft: "none" },
  assignments: { soft: "none" },
  group_members: { soft: "none" },
  test_settings: { soft: "none" },
  qualification_levels: { soft: "is_active" },
  competencies: { soft: "none" },
  development_plans: { soft: "none" },
  development_plan_items: { soft: "none" },
} as const;

export type ManagedTable = keyof typeof MANAGED_TABLES;

export function isManagedTable(value: string): value is ManagedTable {
  return Object.prototype.hasOwnProperty.call(MANAGED_TABLES, value);
}

export function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  const escape = (v: unknown) => {
    if (v === null || v === undefined) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    return /[";\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
  };
  return [
    headers.join(";"),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(";")),
  ].join("\n");
}

export function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const clean = text.replace(/^\uFEFF/, "").trim();
  if (!clean) return { headers: [], rows: [] };
  const lines = clean.split(/\r?\n/);
  const delimiter = (lines[0]?.includes(";") ? ";" : ",") as string;
  const split = (line: string) => {
    const out: string[] = [];
    let cur = "";
    let quoted = false;
    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      if (quoted) {
        if (ch === '"' && line[i + 1] === '"') {
          cur += '"';
          i += 1;
        } else if (ch === '"') quoted = false;
        else cur += ch;
      } else if (ch === '"') quoted = true;
      else if (ch === delimiter) {
        out.push(cur.trim());
        cur = "";
      } else cur += ch;
    }
    out.push(cur.trim());
    return out;
  };
  const headers = split(lines[0] ?? "").map((h) => h.trim());
  const rows = lines.slice(1).filter((l) => l.trim().length > 0).map((line) => {
    const cells = split(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = cells[i] ?? "";
    });
    return row;
  });
  return { headers, rows };
}

export const IMPORT_SCHEMAS: Record<
  string,
  { table: ManagedTable; required: string[]; optional: string[]; label: string }
> = {
  questions: {
    table: "questions",
    required: ["text"],
    optional: ["topic", "category", "explanation", "difficulty", "is_common"],
    label: "Вопросы",
  },
  materials: {
    table: "materials",
    required: ["title", "material_type"],
    optional: ["description", "external_url", "tags"],
    label: "Учебные материалы",
  },
  departments: {
    table: "departments",
    required: ["name"],
    optional: ["code", "head_name", "description"],
    label: "Подразделения",
  },
  positions: {
    table: "positions",
    required: ["name"],
    optional: ["code", "description"],
    label: "Должности",
  },
  professions: {
    table: "professions",
    required: ["name"],
    optional: ["code", "slug", "short_description", "description", "duration_hours"],
    label: "Профессии",
  },
};
