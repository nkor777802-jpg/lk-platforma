import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getImportTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ kind: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    const { assertRole } = await import("./admin.server");
    await assertRole(context.supabase, context.userId, ["admin", "hr", "teacher"]);
    const { getImportKind } = await import("./import-schemas");
    const { buildTemplate } = await import("./import.server");
    const kind = getImportKind(data.kind);
    if (!kind) throw new Error("Неизвестный тип импорта");
    return { fileName: kind.template, base64: buildTemplate(kind) };
  });

export const previewImport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ kind: z.string(), fileName: z.string(), base64: z.string() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertRole } = await import("./admin.server");
    await assertRole(context.supabase, context.userId, ["admin", "hr", "teacher"]);
    const { runImport } = await import("./import.server");
    return runImport({
      kindId: data.kind,
      fileName: data.fileName,
      base64: data.base64,
      dryRun: true,
    });
  });

export const commitImportFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ kind: z.string(), fileName: z.string(), base64: z.string() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertRole, logAction } = await import("./admin.server");
    await assertRole(context.supabase, context.userId, ["admin", "hr"]);
    const { runImport } = await import("./import.server");
    const report = await runImport({
      kindId: data.kind,
      fileName: data.fileName,
      base64: data.base64,
      dryRun: false,
    });
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name")
      .eq("id", context.userId)
      .maybeSingle();
    await supabaseAdmin.from("import_runs").insert({
      kind: data.kind,
      file_name: data.fileName,
      actor_id: context.userId,
      actor_name: profile?.full_name ?? null,
      total_rows: report.totalRows,
      created_rows: report.created,
      updated_rows: report.updated,
      skipped_rows: report.skipped + report.unchanged,
      error_rows: report.issues.filter((i) => i.level === "error").length,
      status: report.status,
      report: report as never,
    });
    await logAction({
      actorId: context.userId,
      action: "import",
      entity: data.kind,
      details: {
        file: data.fileName,
        created: report.created,
        updated: report.updated,
        status: report.status,
      },
    });
    return report;
  });

export interface ImportRunRow {
  id: string;
  kind: string;
  file_name: string | null;
  actor_name: string | null;
  total_rows: number;
  created_rows: number;
  updated_rows: number;
  skipped_rows: number;
  error_rows: number;
  status: string;
  created_at: string;
}

export const listImportRuns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertRole } = await import("./admin.server");
    await assertRole(context.supabase, context.userId, ["admin", "hr", "teacher"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("import_runs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    return JSON.parse(JSON.stringify(data ?? [])) as ImportRunRow[];
  });

export const exportExcel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ kind: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    const { assertRole, logAction } = await import("./admin.server");
    await assertRole(context.supabase, context.userId, ["admin", "hr", "teacher", "manager"]);
    const { buildExport } = await import("./export.server");
    const result = await buildExport(data.kind);
    await logAction({ actorId: context.userId, action: "export.xlsx", entity: data.kind });
    return result;
  });
