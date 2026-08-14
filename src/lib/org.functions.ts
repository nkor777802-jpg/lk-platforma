import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const mappingSchema = z
  .object({
    sheetName: z.string().nullable().optional(),
    headerRows: z.number().int().min(0).max(50),
    unitColumns: z.array(z.number().int().min(0)),
    codeColumn: z.number().int().min(0).nullable(),
    positionColumn: z.number().int().min(0),
    categoryColumn: z.number().int().min(0).nullable(),
    fullNameColumn: z.number().int().min(0).nullable(),
    hireDateColumn: z.number().int().min(0).nullable(),
    gradeColumn: z.number().int().min(0).nullable(),
    plannedColumn: z.number().int().min(0).nullable(),
    actualColumn: z.number().int().min(0).nullable(),
    vacantColumn: z.number().int().min(0).nullable(),
  })
  .partial()
  .nullable()
  .optional();

/** Первичный разбор файла: автосопоставление, превью колонок, сохранённые профили. */
export const inspectStaffingFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z.object({ base64: z.string(), sheetName: z.string().nullable().optional() }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { assertRole } = await import("./admin.server");
    await assertRole(context.supabase, context.userId, ["admin", "hr"]);
    const { readSheet, autoMapping } = await import("./org.server");
    const { sheetNames, sheetName, matrix } = readSheet(data.base64, data.sheetName ?? null);
    const mapping = autoMapping(matrix);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profiles } = await supabaseAdmin
      .from("org_mapping_profiles")
      .select("id, name, mapping, is_default, sheet_name")
      .order("created_at", { ascending: false });
    return {
      sheetNames,
      sheetName,
      mapping: { ...mapping, sheetName },
      headPreview: matrix.slice(0, 12),
      columnCount: Math.max(...matrix.slice(0, 20).map((r) => r.length), 1),
      profiles: profiles ?? [],
    };
  });

/** Разбор + валидация + сравнение с действующей версией (без записи). */
export const previewStaffingImport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ base64: z.string(), mapping: mappingSchema }).parse(i))
  .handler(async ({ data, context }) => {
    const { assertRole } = await import("./admin.server");
    await assertRole(context.supabase, context.userId, ["admin", "hr"]);
    const { parseStaffing, buildDiff } = await import("./org.server");
    const { loadBaseline } = await import("./org-versions.server");
    const parsed = parseStaffing(data.base64, (data.mapping ?? null) as never);
    const baseline = await loadBaseline();
    const diff = buildDiff(parsed, baseline);
    return {
      sheetName: parsed.sheetName,
      mapping: parsed.mapping,
      stats: parsed.stats,
      issues: parsed.issues.slice(0, 300),
      units: parsed.units.map((u) => ({
        key: u.key,
        parentKey: u.parentKey,
        name: u.name,
        level: u.level,
        unitType: u.unitType,
        managerName: u.managerName,
        planned: u.planned,
        actual: u.actual,
        vacant: u.vacant,
        reviewStatus: u.reviewStatus,
      })),
      diff,
    };
  });

/** Создать черновик версии структуры из файла. */
export const createOrgDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z
      .object({
        base64: z.string(),
        fileName: z.string(),
        title: z.string().min(2),
        mapping: mappingSchema,
        saveProfileName: z.string().optional().nullable(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { assertRole, logAction } = await import("./admin.server");
    await assertRole(context.supabase, context.userId, ["admin", "hr"]);
    const { saveDraftVersion } = await import("./org-versions.server");
    const result = await saveDraftVersion({
      base64: data.base64,
      fileName: data.fileName,
      title: data.title,
      mapping: (data.mapping ?? null) as never,
      actorId: context.userId,
      saveProfileName: data.saveProfileName ?? null,
    });
    await logAction({
      actorId: context.userId,
      action: "org_import_draft",
      entity: "org_versions",
      entityId: result.versionId,
      details: { file: data.fileName, stats: result.stats },
    });
    return result;
  });

export const listOrgVersions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertRole } = await import("./admin.server");
    await assertRole(context.supabase, context.userId, ["admin", "hr", "teacher", "manager"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("org_versions")
      .select("id, title, status, effective_from, source_file_name, created_by_name, published_at, stats, created_at")
      .order("created_at", { ascending: false });
    return data ?? [];
  });

export const publishOrgVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z.object({ versionId: z.string().uuid(), effectiveFrom: z.string().min(4) }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { assertRole, logAction } = await import("./admin.server");
    await assertRole(context.supabase, context.userId, ["admin", "hr"]);
    const { publishVersion } = await import("./org-versions.server");
    const res = await publishVersion(data.versionId, data.effectiveFrom);
    await logAction({
      actorId: context.userId,
      action: "org_version_publish",
      entity: "org_versions",
      entityId: data.versionId,
      details: { effectiveFrom: data.effectiveFrom, ...res },
    });
    return res;
  });

export const rollbackOrgVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ versionId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { assertRole, logAction } = await import("./admin.server");
    await assertRole(context.supabase, context.userId, ["admin", "hr"]);
    const { rollbackToVersion } = await import("./org-versions.server");
    const res = await rollbackToVersion(data.versionId);
    await logAction({
      actorId: context.userId,
      action: "org_version_rollback",
      entity: "org_versions",
      entityId: data.versionId,
    });
    return res;
  });

/** Данные для Org Chart: действующая версия, версия по id или структура на дату. */
export const getOrgStructure = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z
      .object({
        versionId: z.string().uuid().nullable().optional(),
        onDate: z.string().nullable().optional(),
      })
      .parse(i ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { getRoles } = await import("./admin.server");
    const roles = await getRoles(context.supabase, context.userId);
    const { loadStructure } = await import("./org-versions.server");
    return loadStructure({
      versionId: data.versionId ?? null,
      onDate: data.onDate ?? null,
      canSeePersonal: roles.some((r) => ["admin", "hr", "manager"].includes(r)),
    });
  });

export const exportOrgExcel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z
      .object({
        versionId: z.string().uuid().nullable().optional(),
        scope: z.enum(["all", "units", "managers", "staffing", "assignments", "vacancies"]).default("all"),
        branchKey: z.string().nullable().optional(),
        includeEmployees: z.boolean().default(true),
      })
      .parse(i ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { assertRole } = await import("./admin.server");
    const roles = await assertRole(context.supabase, context.userId, ["admin", "hr", "manager", "teacher"]);
    const { exportExcel } = await import("./org-versions.server");
    return exportExcel({
      versionId: data.versionId ?? null,
      scope: data.scope,
      branchKey: data.branchKey ?? null,
      includeEmployees: data.includeEmployees && roles.some((r) => ["admin", "hr", "manager"].includes(r)),
    });
  });

export const saveOrgMappingProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z.object({ name: z.string().min(2), sheetName: z.string().nullable().optional(), mapping: z.record(z.string(), z.unknown()) }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { assertRole } = await import("./admin.server");
    await assertRole(context.supabase, context.userId, ["admin", "hr"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("org_mapping_profiles").insert({
      name: data.name,
      sheet_name: data.sheetName ?? null,
      mapping: data.mapping as never,
      is_default: true,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Связи подразделений с рабочими центрами (производственная структура). */
export const getWorkCenterLinks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertRole } = await import("./admin.server");
    await assertRole(context.supabase, context.userId, ["admin", "hr", "teacher", "manager"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: links }, { data: centers }, { data: departments }] = await Promise.all([
      supabaseAdmin.from("org_unit_work_centers").select("id, department_id, work_center_id"),
      supabaseAdmin.from("work_centers").select("id, code, name, site, area, process").order("name"),
      supabaseAdmin.from("departments").select("id, name, parent_id, unit_type").order("name"),
    ]);
    return { links: links ?? [], centers: centers ?? [], departments: departments ?? [] };
  });

export const setWorkCenterLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z
      .object({
        departmentId: z.string().uuid(),
        workCenterId: z.string().uuid(),
        linked: z.boolean(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { assertRole } = await import("./admin.server");
    await assertRole(context.supabase, context.userId, ["admin", "hr"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.linked) {
      await supabaseAdmin
        .from("org_unit_work_centers")
        .upsert(
          { department_id: data.departmentId, work_center_id: data.workCenterId },
          { onConflict: "department_id,work_center_id" },
        );
    } else {
      await supabaseAdmin
        .from("org_unit_work_centers")
        .delete()
        .eq("department_id", data.departmentId)
        .eq("work_center_id", data.workCenterId);
    }
    return { ok: true };
  });

/** Доступ к печати и графическому экспорту оргструктуры: только admin и hr. */
export const canPrintOrgStructure = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    const roles = (data ?? []).map((r) => r.role as string);
    return { allowed: roles.includes("admin") || roles.includes("hr") };
  });