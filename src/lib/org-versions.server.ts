import { parseStaffing, buildDiff, buildOrgWorkbook, type OrgMapping, type ParsedStaffing } from "./org.server";

type UnitRow = {
  external_key: string;
  parent_key: string | null;
  name: string;
  unit_type: string | null;
  level: number;
  sort_order: number;
  manager_name: string | null;
  planned_units: number;
  actual_units: number;
  vacant_units: number;
  review_status: string;
};

type PositionRow = {
  unit_key: string;
  name: string;
  category: string | null;
  planned_units: number;
  actual_units: number;
  vacant_units: number;
  sort_order: number;
  review_status: string;
};

type AssignmentRow = {
  unit_key: string;
  position_name: string;
  full_name: string | null;
  is_vacancy: boolean;
  hire_date: string | null;
  grade: string | null;
  rate: number | null;
  review_status: string;
};

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/** Действующая версия для сравнения. */
export async function loadBaseline() {
  const db = await admin();
  const { data: version } = await db
    .from("org_versions")
    .select("id, title")
    .eq("status", "ACTIVE")
    .maybeSingle();
  if (!version) return null;
  const [{ data: units }, { data: positions }] = await Promise.all([
    db.from("org_snapshot_units").select("external_key, name, manager_name, planned_units").eq("version_id", version.id),
    db.from("org_snapshot_positions").select("unit_key, name, planned_units, vacant_units").eq("version_id", version.id),
  ]);
  return { title: version.title, units: units ?? [], positions: positions ?? [] };
}

async function insertChunks<T extends object>(table: string, rows: T[]) {
  const db = await admin();
  for (let i = 0; i < rows.length; i += 400) {
    const chunk = rows.slice(i, i + 400);
    const { error } = await db.from(table as never).insert(chunk as never);
    if (error) throw new Error(`${table}: ${error.message}`);
  }
}

export async function saveDraftVersion(input: {
  base64: string;
  fileName: string;
  title: string;
  mapping: Partial<OrgMapping> | null;
  actorId: string;
  saveProfileName: string | null;
}) {
  const db = await admin();
  const parsed: ParsedStaffing = parseStaffing(input.base64, input.mapping);
  const baseline = await loadBaseline();
  const diff = buildDiff(parsed, baseline);

  const { data: profile } = await db.from("profiles").select("full_name").eq("id", input.actorId).maybeSingle();

  const { data: version, error } = await db
    .from("org_versions")
    .insert({
      title: input.title,
      status: parsed.stats.errors > 0 ? "DRAFT" : "VALIDATED",
      source_file_name: input.fileName,
      created_by: input.actorId,
      created_by_name: profile?.full_name ?? null,
      stats: parsed.stats as never,
    })
    .select("id")
    .single();
  if (error || !version) throw new Error(error?.message ?? "Не удалось создать версию");

  const units: (UnitRow & { version_id: string })[] = parsed.units.map((u) => ({
    version_id: version.id,
    external_key: u.key,
    parent_key: u.parentKey,
    name: u.name,
    unit_type: u.unitType,
    level: u.level,
    sort_order: u.sortOrder,
    manager_name: u.managerName,
    planned_units: u.planned,
    actual_units: u.actual,
    vacant_units: u.vacant,
    review_status: u.reviewStatus,
  }));
  const positions: (PositionRow & { version_id: string })[] = parsed.positions.map((p) => ({
    version_id: version.id,
    unit_key: p.unitKey,
    name: p.name,
    category: p.category,
    planned_units: p.planned,
    actual_units: p.actual,
    vacant_units: p.vacant,
    sort_order: p.sortOrder,
    review_status: p.reviewStatus,
  }));
  const assignments: (AssignmentRow & { version_id: string })[] = parsed.assignments.map((a) => ({
    version_id: version.id,
    unit_key: a.unitKey,
    position_name: a.positionName,
    full_name: a.fullName,
    is_vacancy: a.isVacancy,
    hire_date: a.hireDate,
    grade: a.grade,
    rate: a.rate,
    review_status: a.reviewStatus,
  }));

  await insertChunks("org_snapshot_units", units);
  await insertChunks("org_snapshot_positions", positions);
  await insertChunks("org_snapshot_assignments", assignments);

  await db.from("org_import_runs").insert({
    version_id: version.id,
    file_name: input.fileName,
    sheet_name: parsed.sheetName,
    mapping: parsed.mapping as never,
    status: parsed.stats.errors > 0 ? "ERRORS" : "READY",
    validation: { issues: parsed.issues.slice(0, 500) } as never,
    diff: diff as never,
    stats: parsed.stats as never,
    actor_id: input.actorId,
    actor_name: profile?.full_name ?? null,
  });

  if (input.saveProfileName) {
    await db.from("org_mapping_profiles").insert({
      name: input.saveProfileName,
      sheet_name: parsed.sheetName,
      mapping: parsed.mapping as never,
      is_default: true,
    });
  }

  return { versionId: version.id, stats: parsed.stats, diff, issues: parsed.issues.slice(0, 300) };
}

/** Публикация версии: только вручную, ERROR блокирует. */
export async function publishVersion(versionId: string, effectiveFrom: string) {
  const db = await admin();
  const { data: run } = await db
    .from("org_import_runs")
    .select("validation")
    .eq("version_id", versionId)
    .maybeSingle();
  const issues = ((run?.validation as { issues?: { level: string }[] } | null)?.issues ?? []).filter(
    (i) => i.level === "ERROR",
  );
  if (issues.length > 0) throw new Error("Публикация заблокирована: в версии есть ошибки уровня ERROR");

  const today = new Date().toISOString().slice(0, 10);
  const scheduled = effectiveFrom > today;

  if (!scheduled) {
    await db
      .from("org_versions")
      .update({ status: "ARCHIVED", archived_at: new Date().toISOString() })
      .eq("status", "ACTIVE");
  }
  const { error } = await db
    .from("org_versions")
    .update({
      status: scheduled ? "SCHEDULED" : "ACTIVE",
      effective_from: effectiveFrom,
      published_at: new Date().toISOString(),
    })
    .eq("id", versionId);
  if (error) throw new Error(error.message);

  const synced = scheduled ? { departments: 0, positions: 0 } : await syncToWorkingTables(versionId);
  return { status: scheduled ? "SCHEDULED" : "ACTIVE", ...synced };
}

export async function rollbackToVersion(versionId: string) {
  const db = await admin();
  await db
    .from("org_versions")
    .update({ status: "ARCHIVED", archived_at: new Date().toISOString() })
    .eq("status", "ACTIVE");
  const { error } = await db
    .from("org_versions")
    .update({ status: "ACTIVE", archived_at: null })
    .eq("id", versionId);
  if (error) throw new Error(error.message);
  const synced = await syncToWorkingTables(versionId);
  return { ok: true, ...synced };
}

/** Мягкая синхронизация с рабочими таблицами: создаём/обновляем, ничего не удаляем. */
async function syncToWorkingTables(versionId: string) {
  const db = await admin();
  const { data: units } = await db
    .from("org_snapshot_units")
    .select("id, external_key, parent_key, name, unit_type, level, sort_order")
    .eq("version_id", versionId)
    .order("level");
  const { data: existing } = await db.from("departments").select("id, name, parent_id");
  const byName = new Map((existing ?? []).map((d) => [d.name.trim().toLowerCase(), d.id]));
  const keyToId = new Map<string, string>();
  let created = 0;

  for (const u of units ?? []) {
    if (!u.parent_key) {
      const rootId = byName.get(u.name.trim().toLowerCase());
      if (rootId) keyToId.set(u.external_key, rootId);
      continue;
    }
    const parentId = u.parent_key ? (keyToId.get(u.parent_key) ?? null) : null;
    const known = byName.get(u.name.trim().toLowerCase());
    if (known) {
      await db
        .from("departments")
        .update({ parent_id: parentId, unit_type: u.unit_type, level: u.level, sort_order: u.sort_order })
        .eq("id", known);
      keyToId.set(u.external_key, known);
      continue;
    }
    const { data: inserted } = await db
      .from("departments")
      .insert({
        name: u.name,
        parent_id: parentId,
        unit_type: u.unit_type,
        level: u.level,
        sort_order: u.sort_order,
      })
      .select("id")
      .single();
    if (inserted) {
      keyToId.set(u.external_key, inserted.id);
      byName.set(u.name.trim().toLowerCase(), inserted.id);
      created += 1;
    }
  }

  const { data: snapPositions } = await db
    .from("org_snapshot_positions")
    .select("id, unit_key, name, category")
    .eq("version_id", versionId);
  const { data: existingPositions } = await db.from("positions").select("id, name, department_id");
  const posKey = (name: string, dept: string | null) => `${name.trim().toLowerCase()}|${dept ?? ""}`;
  const posMap = new Map((existingPositions ?? []).map((p) => [posKey(p.name, p.department_id), p.id]));
  let createdPositions = 0;

  for (const p of snapPositions ?? []) {
    const deptId = keyToId.get(p.unit_key) ?? null;
    const key = posKey(p.name, deptId);
    const known = posMap.get(key);
    if (known) {
      await db.from("positions").update({ category: p.category }).eq("id", known);
      await db.from("org_snapshot_positions").update({ position_id: known }).eq("id", p.id);
      continue;
    }
    const { data: inserted } = await db
      .from("positions")
      .insert({ name: p.name, department_id: deptId, category: p.category })
      .select("id")
      .single();
    if (inserted) {
      posMap.set(key, inserted.id);
      await db.from("org_snapshot_positions").update({ position_id: inserted.id }).eq("id", p.id);
      createdPositions += 1;
    }
  }

  for (const [key, id] of keyToId) {
    await db.from("org_snapshot_units").update({ department_id: id }).eq("version_id", versionId).eq("external_key", key);
  }

  return { departments: created, positions: createdPositions };
}

export interface OrgStructureUnit {
  key: string;
  parentKey: string | null;
  name: string;
  unitType: string | null;
  level: number;
  managerName: string | null;
  planned: number;
  actual: number;
  vacant: number;
  departmentId: string | null;
  positions: {
    name: string;
    category: string | null;
    planned: number;
    actual: number;
    vacant: number;
  }[];
  people: {
    fullName: string | null;
    positionName: string;
    isVacancy: boolean;
    grade: string | null;
    profileId: string | null;
  }[];
}

export async function loadStructure(input: {
  versionId: string | null;
  onDate: string | null;
  canSeePersonal: boolean;
}) {
  const db = await admin();
  let versionQuery = db.from("org_versions").select("id, title, status, effective_from, stats, source_file_name");
  if (input.versionId) {
    versionQuery = versionQuery.eq("id", input.versionId);
  } else if (input.onDate) {
    versionQuery = versionQuery
      .in("status", ["ACTIVE", "ARCHIVED"])
      .lte("effective_from", input.onDate)
      .order("effective_from", { ascending: false })
      .limit(1);
  } else {
    versionQuery = versionQuery.eq("status", "ACTIVE").limit(1);
  }
  const { data: versions } = await versionQuery;
  const version = versions?.[0] ?? null;
  if (!version) return { version: null, units: [] as OrgStructureUnit[], workCenters: [] };

  const [{ data: units }, { data: positions }, { data: assignments }, { data: links }, { data: profileRows }] =
    await Promise.all([
    db
      .from("org_snapshot_units")
      .select("external_key, parent_key, name, unit_type, level, sort_order, manager_name, planned_units, actual_units, vacant_units, department_id")
      .eq("version_id", version.id)
      .order("sort_order"),
    db
      .from("org_snapshot_positions")
      .select("unit_key, name, category, planned_units, actual_units, vacant_units, sort_order")
      .eq("version_id", version.id)
      .order("sort_order"),
    db
      .from("org_snapshot_assignments")
      .select("unit_key, position_name, full_name, is_vacancy, grade")
      .eq("version_id", version.id),
    db.from("org_unit_work_centers").select("department_id, work_centers(id, code, name, site, area, process)"),
      input.canSeePersonal
        ? db.from("profiles").select("id, full_name")
        : Promise.resolve({ data: [] as { id: string; full_name: string | null }[] }),
    ]);

  const normName = (v: string | null | undefined) => (v ?? "").toLowerCase().replace(/\s+/g, " ").trim();
  const profileByName = new Map<string, string>();
  for (const p of profileRows ?? []) {
    const key = normName(p.full_name);
    if (key && !profileByName.has(key)) profileByName.set(key, p.id);
  }

  const byKey = new Map<string, OrgStructureUnit>();
  for (const u of units ?? []) {
    byKey.set(u.external_key, {
      key: u.external_key,
      parentKey: u.parent_key,
      name: u.name,
      unitType: u.unit_type,
      level: u.level,
      managerName: input.canSeePersonal ? u.manager_name : null,
      planned: Number(u.planned_units),
      actual: Number(u.actual_units),
      vacant: Number(u.vacant_units),
      departmentId: u.department_id,
      positions: [],
      people: [],
    });
  }
  for (const p of positions ?? []) {
    byKey.get(p.unit_key)?.positions.push({
      name: p.name,
      category: p.category,
      planned: Number(p.planned_units),
      actual: Number(p.actual_units),
      vacant: Number(p.vacant_units),
    });
  }
  for (const a of assignments ?? []) {
    byKey.get(a.unit_key)?.people.push({
      fullName: input.canSeePersonal ? a.full_name : null,
      positionName: a.position_name,
      isVacancy: a.is_vacancy,
      grade: input.canSeePersonal ? a.grade : null,
      profileId: input.canSeePersonal ? (profileByName.get(normName(a.full_name)) ?? null) : null,
    });
  }

  return {
    version,
    units: [...byKey.values()],
    workCenters: (links ?? []).map((l) => ({ departmentId: l.department_id, center: l.work_centers })),
  };
}

export async function exportExcel(input: {
  versionId: string | null;
  scope: "all" | "units" | "managers" | "staffing" | "assignments" | "vacancies";
  branchKey: string | null;
  includeEmployees: boolean;
}) {
  const structure = await loadStructure({
    versionId: input.versionId,
    onDate: null,
    canSeePersonal: input.includeEmployees,
  });
  if (!structure.version) throw new Error("Нет действующей версии структуры");

  const byKey = new Map(structure.units.map((u) => [u.key, u]));
  const inBranch = (u: OrgStructureUnit) => {
    if (!input.branchKey) return true;
    let cur: OrgStructureUnit | undefined = u;
    while (cur) {
      if (cur.key === input.branchKey) return true;
      cur = cur.parentKey ? byKey.get(cur.parentKey) : undefined;
    }
    return false;
  };
  const path = (u: OrgStructureUnit) => {
    const parts: string[] = [];
    let cur: OrgStructureUnit | undefined = u;
    while (cur) {
      parts.unshift(cur.name);
      cur = cur.parentKey ? byKey.get(cur.parentKey) : undefined;
    }
    return parts.join(" / ");
  };

  const units = structure.units.filter(inBranch);
  let rows: Record<string, string | number | null>[] = [];
  let sheet = "Оргструктура";

  if (input.scope === "units" || input.scope === "all") {
    rows = units.map((u) => ({
      Уровень: u.level,
      Подразделение: u.name,
      Путь: path(u),
      Тип: u.unitType,
      Руководитель: u.managerName,
      Штат: u.planned,
      Факт: u.actual,
      Вакансии: u.vacant,
    }));
  }
  if (input.scope === "managers") {
    sheet = "Руководители";
    rows = units
      .filter((u) => u.managerName)
      .map((u) => ({ Подразделение: u.name, Путь: path(u), Руководитель: u.managerName }));
  }
  if (input.scope === "staffing" || input.scope === "vacancies") {
    sheet = input.scope === "vacancies" ? "Вакансии" : "Штатная структура";
    rows = units.flatMap((u) =>
      u.positions
        .filter((p) => (input.scope === "vacancies" ? p.vacant > 0 : true))
        .map((p) => ({
          Подразделение: u.name,
          Путь: path(u),
          Должность: p.name,
          Категория: p.category,
          Штат: p.planned,
          Факт: p.actual,
          Вакансии: p.vacant,
        })),
    );
  }
  if (input.scope === "assignments") {
    sheet = "Штатная расстановка";
    rows = units.flatMap((u) =>
      u.people.map((p) => ({
        Подразделение: u.name,
        Путь: path(u),
        Должность: p.positionName,
        ФИО: p.isVacancy ? "Вакансия" : (p.fullName ?? ""),
        Разряд: p.grade,
      })),
    );
  }

  const base64 = buildOrgWorkbook(rows, sheet);
  const date = new Date().toISOString().slice(0, 10);
  return { base64, fileName: `Оргструктура_${sheet}_${date}.xlsx`, rows: rows.length };
}