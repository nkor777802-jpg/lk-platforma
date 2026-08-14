import * as XLSX from "xlsx";

/** Профиль сопоставления колонок файла штатной расстановки (индексы колонок, 0-based). */
export interface OrgMapping {
  sheetName?: string | null;
  headerRows: number;
  unitColumns: number[];
  codeColumn: number | null;
  positionColumn: number;
  categoryColumn: number | null;
  fullNameColumn: number | null;
  hireDateColumn: number | null;
  gradeColumn: number | null;
  plannedColumn: number | null;
  actualColumn: number | null;
  vacantColumn: number | null;
}

export const DEFAULT_MAPPING: OrgMapping = {
  headerRows: 4,
  unitColumns: [0, 1, 2, 3],
  codeColumn: 4,
  positionColumn: 5,
  categoryColumn: 6,
  fullNameColumn: 7,
  hireDateColumn: 8,
  gradeColumn: 9,
  plannedColumn: 10,
  actualColumn: 11,
  vacantColumn: 12,
};

export const MAPPING_FIELDS: { key: keyof OrgMapping; label: string; multi?: boolean }[] = [
  { key: "unitColumns", label: "Наименование подразделения (уровни)", multi: true },
  { key: "codeColumn", label: "Код подразделения" },
  { key: "positionColumn", label: "Должность (специальность, профессия)" },
  { key: "categoryColumn", label: "Категория персонала" },
  { key: "fullNameColumn", label: "ФИО" },
  { key: "hireDateColumn", label: "Дата приёма" },
  { key: "gradeColumn", label: "Разряд" },
  { key: "plannedColumn", label: "Количество: штат" },
  { key: "actualColumn", label: "Количество: факт" },
  { key: "vacantColumn", label: "Количество: вакансии" },
];

export interface OrgIssue {
  level: "ERROR" | "WARNING" | "INFO";
  row: number | null;
  message: string;
  value?: string | null;
}

export interface ParsedUnit {
  key: string;
  parentKey: string | null;
  name: string;
  level: number;
  unitType: string | null;
  sortOrder: number;
  managerName: string | null;
  planned: number;
  actual: number;
  vacant: number;
  reviewStatus: "OK" | "REQUIRES_REVIEW";
  sourceRow: number;
}

export interface ParsedPosition {
  unitKey: string;
  name: string;
  category: string | null;
  planned: number;
  actual: number;
  vacant: number;
  sortOrder: number;
  reviewStatus: "OK" | "REQUIRES_REVIEW";
  sourceRow: number;
}

export interface ParsedAssignment {
  unitKey: string;
  positionName: string;
  fullName: string | null;
  isVacancy: boolean;
  hireDate: string | null;
  grade: string | null;
  rate: number | null;
  reviewStatus: "OK" | "REQUIRES_REVIEW";
  sourceRow: number;
}

export interface ParsedStaffing {
  sheetName: string;
  mapping: OrgMapping;
  units: ParsedUnit[];
  positions: ParsedPosition[];
  assignments: ParsedAssignment[];
  issues: OrgIssue[];
  stats: {
    rows: number;
    units: number;
    positions: number;
    people: number;
    vacancies: number;
    planned: number;
    actual: number;
    errors: number;
    warnings: number;
    review: number;
  };
}

type Cell = string;

function cell(row: Cell[], idx: number | null): string {
  if (idx === null || idx === undefined) return "";
  return (row[idx] ?? "").trim();
}

function normalize(v: string): string {
  return v.replace(/\s+/g, " ").trim().toLowerCase();
}

function isTotalsRow(v: string): boolean {
  return /итого/i.test(v);
}

function toNumber(v: string): number {
  const s = v.replace(/\s/g, "").replace(",", ".");
  if (!s) return 0;
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function toDate(v: string): string | null {
  const s = v.trim();
  if (!s) return null;
  const ru = s.match(/^(\d{2})[.](\d{2})[.](\d{4})$/);
  if (ru) return `${ru[3]}-${ru[2]}-${ru[1]}`;
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

const UNIT_TYPES: [RegExp, string][] = [
  [/^ао |акционерное общество|предприяти/i, "предприятие"],
  [/дирекц/i, "дирекция"],
  [/служб/i, "служба"],
  [/управлени/i, "управление"],
  [/^цех|цех\b/i, "цех"],
  [/участ/i, "участок"],
  [/отдел/i, "отдел"],
  [/бюро/i, "бюро"],
  [/лаборатор/i, "лаборатория"],
  [/групп/i, "группа"],
  [/сектор|секретариат|секритариат/i, "сектор"],
];

export function guessUnitType(name: string): string | null {
  for (const [re, type] of UNIT_TYPES) if (re.test(name)) return type;
  return null;
}

/** Читает лист как массив массивов строк. */
export function readSheet(base64: string, sheetName?: string | null) {
  const wb = XLSX.read(base64, { type: "base64", raw: false, cellDates: true });
  const name = sheetName && wb.SheetNames.includes(sheetName) ? sheetName : wb.SheetNames[0];
  if (!name) throw new Error("В файле нет листов");
  const sheet = wb.Sheets[name];
  if (!sheet) throw new Error("Лист не найден");
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "", raw: false });
  const matrix = rows.map((r) => (r as unknown[]).map((c) => String(c ?? "").trim()));
  return { sheetNames: wb.SheetNames, sheetName: name, matrix };
}

/** Автоопределение колонок по заголовкам первых строк. */
export function autoMapping(matrix: string[][]): OrgMapping {
  const mapping: OrgMapping = { ...DEFAULT_MAPPING, unitColumns: [...DEFAULT_MAPPING.unitColumns] };
  const head = matrix.slice(0, 6);
  const colText = (idx: number) => normalize(head.map((r) => r[idx] ?? "").join(" "));
  const width = Math.max(...matrix.slice(0, 20).map((r) => r.length), 13);
  let headerRows = 0;
  for (let i = 0; i < Math.min(6, matrix.length); i += 1) {
    const cells = (matrix[i] ?? []).filter((c) => c !== "");
    if (!cells.length) continue;
    const joined = normalize(cells.join(" "));
    const isEnumeration = cells.every((c) => /^\d{1,2}([.,]0+)?$/.test(c.trim()));
    if (isEnumeration || /подразделение|должность|фио|штат|наименование|код|вак|разряд/.test(joined)) {
      headerRows = i + 1;
    }
  }
  mapping.headerRows = headerRows || DEFAULT_MAPPING.headerRows;

  let firstUnitCol: number | null = null;
  for (let c = 0; c < width; c += 1) {
    const t = colText(c);
    if (/подразделение|наименование/.test(t)) firstUnitCol = firstUnitCol ?? c;
    else if (/^код|\bкод\b/.test(t) && mapping.codeColumn === DEFAULT_MAPPING.codeColumn) mapping.codeColumn = c;
    else if (/должность|специальност|професси/.test(t)) mapping.positionColumn = c;
    else if (/категор/.test(t)) mapping.categoryColumn = c;
    else if (/фио|фамилия/.test(t)) mapping.fullNameColumn = c;
    else if (/дата\s*приема|дата\s*приёма/.test(t)) mapping.hireDateColumn = c;
    else if (/разряд|раз-ряд/.test(t)) mapping.gradeColumn = c;
    else if (/штат/.test(t)) mapping.plannedColumn = c;
    else if (/факт/.test(t)) mapping.actualColumn = c;
    else if (/вак/.test(t)) mapping.vacantColumn = c;
  }
  const start = firstUnitCol ?? 0;
  const bounds = [mapping.codeColumn, mapping.positionColumn].filter(
    (c): c is number => typeof c === "number" && c > start,
  );
  const limit = bounds.length ? Math.min(...bounds) : start + 1;
  const cols: number[] = [];
  for (let c = start; c < limit; c += 1) cols.push(c);
  mapping.unitColumns = cols.length ? cols : [...DEFAULT_MAPPING.unitColumns];
  return mapping;
}

/** Разбор штатной расстановки в версионный срез. */
export function parseStaffing(base64: string, mappingInput?: Partial<OrgMapping> | null): ParsedStaffing {
  const pre = readSheet(base64, mappingInput?.sheetName ?? null);
  const auto = autoMapping(pre.matrix);
  const mapping: OrgMapping = { ...auto, ...(mappingInput ?? {}), sheetName: pre.sheetName };
  if (!mapping.unitColumns?.length) mapping.unitColumns = [...DEFAULT_MAPPING.unitColumns];

  const issues: OrgIssue[] = [];
  const units: ParsedUnit[] = [];
  const positions: ParsedPosition[] = [];
  const assignments: ParsedAssignment[] = [];
  const unitByKey = new Map<string, ParsedUnit>();
  const stack: (ParsedUnit | null)[] = [];
  const posSeen = new Set<string>();
  let order = 0;
  let dataRows = 0;

  const rootName = "АО «Людиновокабель»";
  const root: ParsedUnit = {
    key: "root",
    parentKey: null,
    name: rootName,
    level: 0,
    unitType: "предприятие",
    sortOrder: 0,
    managerName: null,
    planned: 0,
    actual: 0,
    vacant: 0,
    reviewStatus: "OK",
    sourceRow: 0,
  };
  units.push(root);
  unitByKey.set(root.key, root);

  const openUnit = (name: string, depth: number, rowIdx: number) => {
    let parent: ParsedUnit = root;
    for (let d = depth - 1; d >= 0; d -= 1) {
      const candidate = stack[d];
      if (candidate) {
        parent = candidate;
        break;
      }
    }
    const key = `${parent.key}/${normalize(name)}`;
    let unit = unitByKey.get(key);
    if (!unit) {
      order += 1;
      unit = {
        key,
        parentKey: parent.key,
        name,
        level: parent.level + 1,
        unitType: guessUnitType(name),
        sortOrder: order,
        managerName: null,
        planned: 0,
        actual: 0,
        vacant: 0,
        reviewStatus: depth > 0 && !stack.slice(0, depth).some(Boolean) ? "REQUIRES_REVIEW" : "OK",
        sourceRow: rowIdx + 1,
      };
      if (unit.reviewStatus === "REQUIRES_REVIEW") {
        issues.push({
          level: "WARNING",
          row: rowIdx + 1,
          value: name,
          message: "Не удалось однозначно определить родительское подразделение — требуется проверка",
        });
      }
      units.push(unit);
      unitByKey.set(key, unit);
    }
    stack[depth] = unit;
    for (let d = depth + 1; d < stack.length; d += 1) stack[d] = null;
    return unit;
  };

  for (let i = mapping.headerRows; i < pre.matrix.length; i += 1) {
    const row = pre.matrix[i] ?? [];
    if (!row.some((c) => c !== "")) continue;

    // 1. Наименования подразделений по уровням отступа
    let current: ParsedUnit | null = null;
    mapping.unitColumns.forEach((col, depth) => {
      const raw = cell(row, col);
      if (!raw) return;
      if (isTotalsRow(raw)) return; // строки ИТОГО не создают узлов
      current = openUnit(raw, depth, i);
    });
    const lastUnit = current ?? [...stack].reverse().find(Boolean) ?? root;

    // 2. Должность / сотрудник
    const positionName = cell(row, mapping.positionColumn);
    const fullName = cell(row, mapping.fullNameColumn);
    const category = cell(row, mapping.categoryColumn);
    const planned = toNumber(cell(row, mapping.plannedColumn));
    const actual = toNumber(cell(row, mapping.actualColumn));
    const vacant = toNumber(cell(row, mapping.vacantColumn));

    if (!positionName || isTotalsRow(positionName)) continue;
    if (!fullName && !category) continue; // сводные строки без данных
    dataRows += 1;

    const isVacancy = /вакан/i.test(fullName);
    let review: "OK" | "REQUIRES_REVIEW" = "OK";

    if (!fullName && !isVacancy && actual > 0) {
      issues.push({
        level: "WARNING",
        row: i + 1,
        value: positionName,
        message: "Строка занятой единицы без ФИО",
      });
      review = "REQUIRES_REVIEW";
    }
    if (lastUnit === root) {
      issues.push({
        level: "ERROR",
        row: i + 1,
        value: positionName,
        message: "Должность вне подразделения",
      });
      review = "REQUIRES_REVIEW";
    }
    if (planned < 0 || actual < 0 || vacant < 0) {
      issues.push({ level: "ERROR", row: i + 1, value: positionName, message: "Отрицательное количество единиц" });
    }
    if (planned > 0 && actual > planned) {
      issues.push({
        level: "WARNING",
        row: i + 1,
        value: positionName,
        message: `Факт (${actual}) больше штата (${planned})`,
      });
    }
    if (planned === 0 && actual === 0 && vacant === 0) {
      issues.push({ level: "INFO", row: i + 1, value: positionName, message: "Нулевое количество единиц" });
    }

    const posKey = `${lastUnit.key}|${normalize(positionName)}`;
    const existing = positions.find((p) => `${p.unitKey}|${normalize(p.name)}` === posKey);
    if (existing) {
      existing.planned += planned;
      existing.actual += actual;
      existing.vacant += vacant;
      if (review === "REQUIRES_REVIEW") existing.reviewStatus = "REQUIRES_REVIEW";
    } else {
      order += 1;
      positions.push({
        unitKey: lastUnit.key,
        name: positionName,
        category: category || null,
        planned,
        actual,
        vacant,
        sortOrder: order,
        reviewStatus: review,
        sourceRow: i + 1,
      });
      posSeen.add(posKey);
    }

    if (fullName && !isVacancy) {
      const dup = assignments.find(
        (a) => a.unitKey === lastUnit.key && normalize(a.fullName ?? "") === normalize(fullName),
      );
      if (dup) {
        issues.push({
          level: "WARNING",
          row: i + 1,
          value: fullName,
          message: "Дубль сотрудника в одном подразделении",
        });
        review = "REQUIRES_REVIEW";
      }
    }

    assignments.push({
      unitKey: lastUnit.key,
      positionName,
      fullName: fullName || null,
      isVacancy: isVacancy || (!fullName && vacant > 0),
      hireDate: toDate(cell(row, mapping.hireDateColumn)),
      grade: cell(row, mapping.gradeColumn) || null,
      rate: planned || null,
      reviewStatus: review,
      sourceRow: i + 1,
    });

    if (/руководител/i.test(category) && !isVacancy && fullName && !lastUnit.managerName) {
      lastUnit.managerName = fullName;
    }

    lastUnit.planned += planned;
    lastUnit.actual += actual;
    lastUnit.vacant += vacant;
  }

  // Агрегация по дереву (снизу вверх)
  const sorted = [...units].sort((a, b) => b.level - a.level);
  for (const u of sorted) {
    if (!u.parentKey) continue;
    const parent = unitByKey.get(u.parentKey);
    if (!parent) continue;
    parent.planned += u.planned;
    parent.actual += u.actual;
    parent.vacant += u.vacant;
  }

  for (const u of units) {
    if (u.key === root.key) continue;
    if (!u.managerName) {
      issues.push({ level: "INFO", row: u.sourceRow, value: u.name, message: "Не определён руководитель подразделения" });
    }
  }
  if (units.length <= 1) {
    issues.push({ level: "ERROR", row: null, message: "Не найдено ни одного подразделения — проверьте сопоставление колонок" });
  }

  // --- Структурная валидация дерева ---
  const seenKeys = new Set<string>();
  for (const u of units) {
    if (seenKeys.has(u.key)) {
      issues.push({ level: "ERROR", row: u.sourceRow, value: u.name, message: `Дубль идентификатора подразделения: ${u.key}` });
    }
    seenKeys.add(u.key);
  }
  for (const u of units) {
    if (!u.parentKey) {
      if (u.key !== root.key) {
        issues.push({ level: "ERROR", row: u.sourceRow, value: u.name, message: "Подразделение без места в дереве (не указан вышестоящий уровень)" });
      }
      continue;
    }
    if (!unitByKey.has(u.parentKey)) {
      issues.push({ level: "ERROR", row: u.sourceRow, value: u.name, message: `Не найдено вышестоящее подразделение: ${u.parentKey}` });
    }
  }
  for (const u of units) {
    const path = new Set<string>([u.key]);
    let cur = u.parentKey ? unitByKey.get(u.parentKey) : undefined;
    while (cur) {
      if (path.has(cur.key)) {
        issues.push({ level: "ERROR", row: u.sourceRow, value: u.name, message: "Циклическая подчинённость подразделений" });
        break;
      }
      path.add(cur.key);
      cur = cur.parentKey ? unitByKey.get(cur.parentKey) : undefined;
    }
  }
  for (const a of assignments) {
    if (!unitByKey.has(a.unitKey)) {
      issues.push({ level: "ERROR", row: a.sourceRow, value: a.fullName ?? a.positionName, message: "Сотрудник вне известного подразделения" });
    }
    if (!a.positionName.trim()) {
      issues.push({ level: "ERROR", row: a.sourceRow, value: a.fullName ?? "", message: "Сотрудник без должности" });
    }
  }

  const people = assignments.filter((a) => !a.isVacancy && a.fullName).length;
  const vacancies = assignments.filter((a) => a.isVacancy).length;

  return {
    sheetName: pre.sheetName,
    mapping,
    units,
    positions,
    assignments,
    issues,
    stats: {
      rows: dataRows,
      units: units.length - 1,
      positions: positions.length,
      people,
      vacancies,
      planned: Math.round(root.planned * 1000) / 1000,
      actual: Math.round(root.actual * 1000) / 1000,
      errors: issues.filter((i) => i.level === "ERROR").length,
      warnings: issues.filter((i) => i.level === "WARNING").length,
      review: units.filter((u) => u.reviewStatus === "REQUIRES_REVIEW").length,
    },
  };
}

export interface OrgDiffEntry {
  type: "ADDED" | "REMOVED" | "CHANGED";
  scope: "unit" | "position" | "manager" | "vacancy" | "transfer";
  name: string;
  detail: string;
}

export interface OrgDiff {
  hasBaseline: boolean;
  baselineTitle: string | null;
  entries: OrgDiffEntry[];
  summary: Record<string, number>;
}

interface BaselineUnit {
  external_key: string;
  name: string;
  manager_name: string | null;
  planned_units: number;
}
interface BaselinePosition {
  unit_key: string;
  name: string;
  planned_units: number;
  vacant_units: number;
}

export function buildDiff(
  parsed: ParsedStaffing,
  baseline: { title: string; units: BaselineUnit[]; positions: BaselinePosition[] } | null,
): OrgDiff {
  const entries: OrgDiffEntry[] = [];
  if (!baseline) {
    return {
      hasBaseline: false,
      baselineTitle: null,
      entries: parsed.units
        .filter((u) => u.parentKey)
        .map((u) => ({ type: "ADDED" as const, scope: "unit" as const, name: u.name, detail: "Новое подразделение" })),
      summary: { ADDED: parsed.units.length - 1, CHANGED: 0, REMOVED: 0 },
    };
  }

  const oldUnits = new Map(baseline.units.map((u) => [u.external_key, u]));
  for (const u of parsed.units) {
    if (!u.parentKey) continue;
    const prev = oldUnits.get(u.key);
    if (!prev) {
      entries.push({ type: "ADDED", scope: "unit", name: u.name, detail: "Новое подразделение" });
      continue;
    }
    if ((prev.manager_name ?? "") !== (u.managerName ?? "")) {
      entries.push({
        type: "CHANGED",
        scope: "manager",
        name: u.name,
        detail: `Руководитель: ${prev.manager_name ?? "—"} → ${u.managerName ?? "—"}`,
      });
    }
    if (Number(prev.planned_units) !== u.planned) {
      entries.push({
        type: "CHANGED",
        scope: "unit",
        name: u.name,
        detail: `Штатных единиц: ${prev.planned_units} → ${u.planned}`,
      });
    }
    oldUnits.delete(u.key);
  }
  for (const [, prev] of oldUnits) {
    entries.push({ type: "REMOVED", scope: "unit", name: prev.name, detail: "Подразделение отсутствует в новом файле" });
  }

  const posKey = (unitKey: string, name: string) => `${unitKey}|${normalize(name)}`;
  const oldPos = new Map(baseline.positions.map((p) => [posKey(p.unit_key, p.name), p]));
  for (const p of parsed.positions) {
    const k = posKey(p.unitKey, p.name);
    const prev = oldPos.get(k);
    if (!prev) {
      entries.push({ type: "ADDED", scope: "position", name: p.name, detail: `Новая должность (${p.planned} ед.)` });
      if (p.vacant > 0) entries.push({ type: "ADDED", scope: "vacancy", name: p.name, detail: `Новая вакансия: ${p.vacant} ед.` });
      continue;
    }
    if (Number(prev.planned_units) !== p.planned) {
      entries.push({
        type: "CHANGED",
        scope: "position",
        name: p.name,
        detail: `Штат: ${prev.planned_units} → ${p.planned}`,
      });
    }
    if (Number(prev.vacant_units) !== p.vacant) {
      entries.push({
        type: "CHANGED",
        scope: "vacancy",
        name: p.name,
        detail: `Вакансии: ${prev.vacant_units} → ${p.vacant}${p.vacant === 0 ? " (закрыта)" : ""}`,
      });
    }
    oldPos.delete(k);
  }
  for (const [, prev] of oldPos) {
    entries.push({ type: "REMOVED", scope: "position", name: prev.name, detail: "Должность отсутствует в новом файле" });
  }

  const summary = entries.reduce<Record<string, number>>((acc, e) => {
    acc[e.type] = (acc[e.type] ?? 0) + 1;
    return acc;
  }, {});
  return { hasBaseline: true, baselineTitle: baseline.title, entries, summary };
}

/** Excel-выгрузка структуры, пригодная для повторного импорта. */
export function buildOrgWorkbook(rows: Record<string, string | number | null>[], sheet = "Оргструктура"): string {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, sheet.slice(0, 31));
  return XLSX.write(wb, { type: "base64", bookType: "xlsx" });
}