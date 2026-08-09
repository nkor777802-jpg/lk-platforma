import * as XLSX from "xlsx";
import { getImportKind, type ImportKind } from "./import-schemas";

export interface ImportIssue {
  sheet: string;
  row: number | null;
  column: string | null;
  value: string | null;
  message: string;
  fix?: string;
  level: "error" | "warning";
}

export interface ImportReport {
  kind: string;
  fileName: string;
  totalRows: number;
  created: number;
  updated: number;
  unchanged: number;
  skipped: number;
  issues: ImportIssue[];
  preview: { sheet: string; rows: Record<string, string>[] }[];
  committed: boolean;
  status: "success" | "warning" | "error";
  credentials?: { fullName: string; email: string; password: string }[];
}

type Row = Record<string, string>;
type Ctx = { refs: Record<string, Map<string, string>>; issues: ImportIssue[] };

const truthy = new Set(["да", "yes", "true", "1", "активен", "активна", "активно", "y"]);

function bool(v: string | undefined, fallback = true): boolean {
  const s = (v ?? "").trim().toLowerCase();
  if (!s) return fallback;
  return truthy.has(s);
}

function num(v: string | undefined): number | null {
  const s = (v ?? "").trim().replace(",", ".");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function txt(v: string | undefined): string | null {
  const s = (v ?? "").trim();
  return s === "" ? null : s;
}

function date(v: string | undefined): string | null {
  const s = (v ?? "").trim();
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

/** Парсинг XLSX/CSV из base64 в набор листов. */
export function parseWorkbook(base64: string): Record<string, Row[]> {
  const wb = XLSX.read(base64, { type: "base64", raw: false });
  const out: Record<string, Row[]> = {};
  for (const name of wb.SheetNames) {
    const sheet = wb.Sheets[name];
    if (!sheet) continue;
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
    out[name.trim()] = rows.map((r) => {
      const clean: Row = {};
      for (const [k, v] of Object.entries(r)) clean[String(k).trim()] = String(v ?? "").trim();
      return clean;
    });
  }
  return out;
}

/** Генерация официального шаблона в base64. */
export function buildTemplate(kind: ImportKind): string {
  const wb = XLSX.utils.book_new();
  for (const sheet of kind.sheets) {
    const headers = [...sheet.required, ...sheet.optional];
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    ws["!cols"] = headers.map((h) => ({ wch: Math.max(14, h.length + 2) }));
    XLSX.utils.book_append_sheet(wb, ws, sheet.name.slice(0, 31));
  }
  // Примеры заполнения выносятся на отдельные листы, чтобы не попасть в импорт.
  for (const sheet of kind.sheets) {
    const headers = [...sheet.required, ...sheet.optional];
    const ws = XLSX.utils.aoa_to_sheet([headers, headers.map((h) => sheet.example[h] ?? "")]);
    XLSX.utils.book_append_sheet(wb, ws, `Пример_${sheet.name}`.slice(0, 31));
  }
  return XLSX.write(wb, { type: "base64", bookType: "xlsx" }) as string;
}

export function buildWorkbook(sheets: { name: string; rows: Record<string, unknown>[] }[]): string {
  const wb = XLSX.utils.book_new();
  for (const s of sheets) {
    const ws = XLSX.utils.json_to_sheet(s.rows.length > 0 ? s.rows : [{}]);
    XLSX.utils.book_append_sheet(wb, ws, s.name.slice(0, 31));
  }
  return XLSX.write(wb, { type: "base64", bookType: "xlsx" }) as string;
}

async function loadRefs(admin: any): Promise<Record<string, Map<string, string>>> {
  const tables: [string, string][] = [
    ["departments", "departments"],
    ["professions", "professions"],
    ["courses", "courses"],
    ["course_modules", "course_modules"],
    ["course_lessons", "course_lessons"],
    ["profiles", "profiles"],
    ["materials", "materials"],
    ["production_products", "production_products"],
    ["work_centers", "work_centers"],
    ["production_materials", "production_materials"],
    ["model_assets", "model_assets"],
    ["questions", "questions"],
    ["test_settings", "test_settings"],
    ["defects", "defects"],
  ];
  const refs: Record<string, Map<string, string>> = {};
  await Promise.all(
    tables.map(async ([key, table]) => {
      const { data } = await admin.from(table).select("id, code");
      const map = new Map<string, string>();
      for (const r of (data ?? []) as { id: string; code: string | null }[]) {
        if (r.code) map.set(r.code.trim(), r.id);
      }
      refs[key] = map;
    }),
  );
  return refs;
}

interface Mapped {
  table: string;
  match: Record<string, unknown>;
  values: Record<string, unknown>;
  extra?: { options?: { text: string; is_correct: boolean }[] };
}

type Mapper = (row: Row, ctx: Ctx, rowNum: number, sheet: string) => Mapped | null;

function ref(
  ctx: Ctx,
  sheet: string,
  rowNum: number,
  column: string,
  value: string | undefined,
  refKey: string,
  required: boolean,
  human: string,
): string | null {
  const code = (value ?? "").trim();
  if (!code) {
    if (required) {
      ctx.issues.push({
        sheet,
        row: rowNum,
        column,
        value: "",
        message: `Не указан ${human}`,
        fix: "Заполните колонку кодом из справочника",
        level: "error",
      });
    }
    return null;
  }
  const id = ctx.refs[refKey]?.get(code) ?? null;
  if (!id) {
    ctx.issues.push({
      sheet,
      row: rowNum,
      column,
      value: code,
      message: `${human} ${code} отсутствует в справочнике`,
      fix: "Сначала импортируйте справочник или исправьте код",
      level: required ? "error" : "warning",
    });
  }
  return id;
}

const MAPPERS: Record<string, Record<string, Mapper>> = {
  departments: {
    Подразделения: (row, ctx, n, s) => ({
      table: "departments",
      match: { code: row["Код_подразделения"] },
      values: {
        code: row["Код_подразделения"],
        name: row["Наименование"],
        parent_id: row["Родительское_подразделение"]
          ? ref(ctx, s, n, "Родительское_подразделение", row["Родительское_подразделение"], "departments", false, "Подразделение")
          : null,
        head_name: txt(row["Код_руководителя"]),
        description: txt(row["Описание"]),
      },
    }),
  },
  professions: {
    Профессии: (row) => ({
      table: "professions",
      match: { code: row["Код_профессии"] },
      values: {
        code: row["Код_профессии"],
        name: row["Наименование"],
        slug: (row["Код_профессии"] ?? "").toLowerCase(),
        is_active: bool(row["Активна"]),
        description: txt(row["Описание"]),
        short_description: txt(row["Категория"]),
      },
    }),
  },
  courses: {
    Курсы: (row, ctx, n, s) => ({
      table: "courses",
      match: { code: row["Код_курса"] },
      values: {
        code: row["Код_курса"],
        title: row["Название"],
        profession_id: ref(ctx, s, n, "Код_профессии", row["Код_профессии"], "professions", true, "Профессия"),
        is_active: (row["Статус"] ?? "").toLowerCase() !== "архив",
        description: txt(row["Описание"]),
        sort_order: num(row["Порядок"]) ?? 0,
      },
    }),
  },
  course_structure: {
    Разделы: (row, ctx, n, s) => ({
      table: "course_modules",
      match: { code: row["Код_раздела"] },
      values: {
        code: row["Код_раздела"],
        course_id: ref(ctx, s, n, "Код_курса", row["Код_курса"], "courses", true, "Курс"),
        title: row["Название"],
        sort_order: num(row["Порядок"]) ?? 0,
        description: txt(row["Описание"]),
        module_type: txt(row["Тип_раздела"]) ?? "theory",
        is_required: bool(row["Обязательный"]),
      },
    }),
    Уроки: (row, ctx, n, s) => ({
      table: "course_lessons",
      match: { code: row["Код_урока"] },
      values: {
        code: row["Код_урока"],
        module_id: ref(ctx, s, n, "Код_раздела", row["Код_раздела"], "course_modules", true, "Раздел курса"),
        title: row["Название"],
        sort_order: num(row["Порядок"]) ?? 0,
        material_type: row["Тип_материала"] || "text",
        description: txt(row["Описание"]),
        file_url: txt(row["Файл_или_URL"]),
        content: txt(row["Текст_урока"]),
        duration_minutes: num(row["Продолжительность"]),
        is_required: bool(row["Обязательный"]),
      },
    }),
  },
  materials: {
    Учебные_материалы: (row, ctx, n, s) => ({
      table: "materials",
      match: { code: row["Код_материала"] },
      values: {
        code: row["Код_материала"],
        title: row["Название"],
        material_type: (row["Тип"] || "document").toLowerCase(),
        lesson_id: ref(ctx, s, n, "Код_урока", row["Код_урока"], "course_lessons", true, "Урок"),
        course_id: ref(ctx, s, n, "Код_курса", row["Код_курса"], "courses", true, "Курс"),
        external_url: txt(row["Файл_или_URL"]),
        description: txt(row["Описание"]),
        is_mandatory_for_all: bool(row["Обязательный"], false),
      },
    }),
  },
  questions: {
    Вопросы: (row, ctx, n, s) => {
      const options = (["A", "B", "C", "D"] as const)
        .map((letter) => ({ letter, text: (row[`Вариант_${letter}`] ?? "").trim() }))
        .filter((o) => o.text !== "");
      const correct = (row["Правильный_ответ"] ?? "").trim();
      const type = (row["Тип_вопроса"] || "single").toLowerCase();
      if (options.length > 0) {
        const letters = correct.split(/[,;\s]+/).map((c) => c.trim().toUpperCase()).filter(Boolean);
        const known = new Set(options.map((o) => o.letter));
        if (letters.some((l) => !known.has(l as "A"))) {
          ctx.issues.push({
            sheet: s,
            row: n,
            column: "Правильный_ответ",
            value: correct,
            message: "Правильный ответ не соответствует заполненным вариантам",
            fix: "Укажите буквы вариантов, например A или A,C",
            level: "error",
          });
        }
      }
      return {
        table: "questions",
        match: { code: row["Код_вопроса"] },
        values: {
          code: row["Код_вопроса"],
          profession_id: ref(ctx, s, n, "Код_профессии", row["Код_профессии"], "professions", true, "Профессия"),
          topic: txt(row["Тема"]),
          category: txt(row["Категория"]),
          text: row["Вопрос"],
          question_type: type,
          reference_answer: options.length === 0 ? txt(row["Правильный_ответ"]) : null,
          difficulty: (row["Уровень_сложности"] || "medium").toLowerCase(),
          is_common: bool(row["Общий_вопрос"], false),
          is_active: bool(row["Активен"]),
          explanation: txt(row["Пояснение"]),
        },
        extra: {
          options: options.map((o) => ({
            text: o.text,
            is_correct: correct
              .toUpperCase()
              .split(/[,;\s]+/)
              .includes(o.letter),
          })),
        },
      };
    },
  },
  tests: {
    Тесты: (row, ctx, n, s) => ({
      table: "test_settings",
      match: { code: row["Код_теста"] },
      values: {
        code: row["Код_теста"],
        title: row["Название"],
        course_id: ref(ctx, s, n, "Код_курса", row["Код_курса"], "courses", true, "Курс"),
        profession_id: row["Код_профессии"]
          ? ref(ctx, s, n, "Код_профессии", row["Код_профессии"], "professions", false, "Профессия")
          : null,
        total_questions: num(row["Количество_вопросов"]) ?? 20,
        pass_percent: num(row["Проходной_процент"]) ?? 80,
        max_attempts: num(row["Количество_попыток"]) ?? 3,
        status: row["Статус"] || "active",
        time_limit_minutes: num(row["Время_минут"]),
        shuffle_questions: bool(row["Случайный_порядок"]),
        show_correct_answer: bool(row["Показывать_правильные_ответы"], false),
        mode: (row["Учебный_или_аттестационный"] || "").toLowerCase().startsWith("учеб")
          ? "training"
          : "exam",
      },
    }),
  },
  assignments: {
    Назначения: (row, ctx, n, s) => ({
      table: "assignments",
      match: {
        user_id: ref(ctx, s, n, "Код_сотрудника", row["Код_сотрудника"], "profiles", true, "Сотрудник"),
        course_id: ref(ctx, s, n, "Код_курса", row["Код_курса"], "courses", true, "Курс"),
      },
      values: {
        assigned_at: date(row["Дата_назначения"]),
        due_date: date(row["Срок_прохождения"]),
        is_mandatory: bool(row["Обязательное"]),
        is_repeat: bool(row["Повторное_обучение"], false),
        comment: txt(row["Комментарий"]),
        status: "assigned",
      },
    }),
  },
  production: {
    "01_Продукция": (row) => ({
      table: "production_products",
      match: { code: row["Код_продукции"] },
      values: {
        code: row["Код_продукции"],
        category: txt(row["Категория"]),
        brand: txt(row["Марка"]),
        name: row["Наименование"],
        is_active: bool(row["Активна"]),
        description: txt(row["Описание"]),
        default_area: txt(row["Участок_по_умолчанию"]),
      },
    }),
    "02_Рабочие_центры": (row) => ({
      table: "work_centers",
      match: { code: row["Код_РЦ"] },
      values: {
        code: row["Код_РЦ"],
        name: row["Наименование_РЦ"],
        process: txt(row["Процесс"]),
        equipment_type: txt(row["Тип_оборудования"]),
        is_active: bool(row["Активен"]),
        area: txt(row["Участок"]),
        site: txt(row["Площадка"]),
        description: txt(row["Описание"]),
      },
    }),
    "03_Маршруты": (row, ctx, n, s) => {
      ref(ctx, s, n, "Код_продукции", row["Код_продукции"], "production_products", true, "Продукция");
      ref(ctx, s, n, "Код_РЦ", row["Код_РЦ"], "work_centers", true, "Рабочий центр");
      return {
        table: "production_routes",
        match: {
          product_code: row["Код_продукции"],
          step_number: num(row["№_этапа"]) ?? 0,
          work_center_code: row["Код_РЦ"],
        },
        values: {
          process: row["Процесс"],
          is_allowed: bool(row["Допустим"]),
          is_required_step: bool(row["Обязательный_этап"]),
          trainer_comment: txt(row["Комментарий_для_тренажёра"]),
        },
      };
    },
    "04_Конструкция_3D": (row, ctx, n, s) => {
      ref(ctx, s, n, "Код_продукции", row["Код_продукции"], "production_products", true, "Продукция");
      ref(ctx, s, n, "Код_3D_элемента", row["Код_3D_элемента"], "model_assets", false, "3D-ресурс");
      return {
        table: "cable_constructions",
        match: {
          product_code: row["Код_продукции"],
          layer_number: num(row["№_слоя"]) ?? 0,
          element_code: row["Код_элемента"],
        },
        values: {
          element_name: row["Элемент"],
          process: txt(row["Процесс"]),
          asset_code: txt(row["Код_3D_элемента"]),
          material_code: txt(row["Материал_код"]),
          visual_type: txt(row["Тип_визуализации"]),
          layer_description: txt(row["Описание_слоя"]),
          show_in_learning: bool(row["Показывать_в_учебном_режиме"]),
        },
      };
    },
    "05_Материалы": (row) => ({
      table: "production_materials",
      match: { code: row["Код_материала"] },
      values: {
        code: row["Код_материала"],
        name: row["Наименование"],
        category: txt(row["Категория"]),
        is_active: bool(row["Активен"]),
        description: txt(row["Описание"]),
      },
    }),
    "06_Дефекты": (row) => ({
      table: "defects",
      match: { code: row["Код_дефекта"] },
      values: {
        code: row["Код_дефекта"],
        process: txt(row["Процесс"]),
        name: row["Название_дефекта"],
        is_active: bool(row["Активен"]),
        product_category: txt(row["Категория_продукции"]),
        description: txt(row["Описание"]),
        possible_cause: txt(row["Возможная_причина"]),
        corrective_action: txt(row["Корректирующее_действие"]),
        image_url: txt(row["Изображение_или_файл"]),
      },
    }),
    "07_3D_Ресурсы": (row) => ({
      table: "model_assets",
      match: { code: row["Код_3D_элемента"] },
      values: {
        code: row["Код_3D_элемента"],
        name: row["Название"],
        format: txt(row["Формат"]),
        is_active: bool(row["Активен"]),
        file_url: txt(row["Имя_файла_или_URL"]),
        version: txt(row["Версия"]),
        description: txt(row["Описание"]),
      },
    }),
  },
};

async function findExisting(admin: any, table: string, match: Record<string, unknown>) {
  let q = admin.from(table).select("*");
  for (const [k, v] of Object.entries(match)) q = v === null ? q.is(k, null) : q.eq(k, v);
  const { data } = await q.limit(1);
  return (data ?? [])[0] ?? null;
}

function changed(existing: Record<string, unknown>, values: Record<string, unknown>) {
  return Object.entries(values).some(([k, v]) => {
    const cur = existing[k];
    if (v === null && (cur === null || cur === undefined)) return false;
    return String(cur ?? "") !== String(v ?? "");
  });
}

async function importEmployees(
  admin: any,
  rows: Row[],
  ctx: Ctx,
  dryRun: boolean,
  report: ImportReport,
) {
  const sheet = "Сотрудники";
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i] as Row;
    const n = i + 2;
    const code = (row["Код_сотрудника"] ?? "").trim();
    const departmentId = ref(ctx, sheet, n, "Код_подразделения", row["Код_подразделения"], "departments", true, "Подразделение");
    const professionId = ref(ctx, sheet, n, "Код_профессии", row["Код_профессии"], "professions", true, "Профессия");
    const fullName = [row["Фамилия"], row["Имя"], row["Отчество"]]
      .map((p) => (p ?? "").trim())
      .filter(Boolean)
      .join(" ");
    const status = (row["Статус"] ?? "активен").toLowerCase();
    const values = {
      code,
      full_name: fullName,
      department_id: departmentId,
      profession_id: professionId,
      personnel_number: txt(row["Табельный_номер"]),
      position: txt(row["Должность"]),
      grade: txt(row["Разряд"]),
      email: txt(row["Email"]),
      phone: txt(row["Телефон"]),
      status,
      is_active: status === "активен",
    };
    const existingId = ctx.refs["profiles"]?.get(code);
    if (existingId) {
      const existing = await findExisting(admin, "profiles", { id: existingId });
      if (existing && !changed(existing, values)) {
        report.unchanged += 1;
        continue;
      }
      report.updated += 1;
      if (!dryRun) await admin.from("profiles").update(values).eq("id", existingId);
      continue;
    }
    const email = txt(row["Email"]);
    if (!email) {
      ctx.issues.push({
        sheet,
        row: n,
        column: "Email",
        value: "",
        message: "Новый сотрудник без Email — учётная запись не может быть создана",
        fix: "Укажите корпоративный Email",
        level: "error",
      });
      report.skipped += 1;
      continue;
    }
    report.created += 1;
    if (dryRun) continue;
    const password = `Lk-${crypto.randomUUID().slice(0, 12)}`;
    const { data: created, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (error || !created?.user) {
      ctx.issues.push({
        sheet,
        row: n,
        column: "Email",
        value: email,
        message: error?.message ?? "Не удалось создать учётную запись",
        level: "error",
      });
      report.created -= 1;
      report.skipped += 1;
      continue;
    }
    await admin.from("profiles").update(values).eq("id", created.user.id);
    ctx.refs["profiles"]?.set(code, created.user.id);
    report.credentials?.push({ fullName, email, password });
  }
}

function pickSheet(available: string[], name: string, sheetCount: number) {
  const usable = available.filter((n) => !n.toLowerCase().startsWith("пример"));
  return (
    usable.find((n) => n === name) ??
    usable.find((n) => n.toLowerCase() === name.toLowerCase()) ??
    (sheetCount === 1 ? usable[0] : undefined)
  );
}

export async function runImport(input: {
  kindId: string;
  fileName: string;
  base64: string;
  dryRun: boolean;
}): Promise<ImportReport> {
  const kind = getImportKind(input.kindId);
  if (!kind) throw new Error("Неизвестный тип импорта");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const admin = supabaseAdmin as any;

  const sheets = parseWorkbook(input.base64);
  const ctx: Ctx = { refs: await loadRefs(admin), issues: [] };
  const report: ImportReport = {
    kind: kind.id,
    fileName: input.fileName,
    totalRows: 0,
    created: 0,
    updated: 0,
    unchanged: 0,
    skipped: 0,
    issues: [],
    preview: [],
    committed: !input.dryRun,
    status: "success",
    credentials: [],
  };

  const available = Object.keys(sheets);
  for (const spec of kind.sheets) {
    const key = pickSheet(available, spec.name, kind.sheets.length);
    const rows = key ? (sheets[key] ?? []) : [];
    if (!key) {
      ctx.issues.push({
        sheet: spec.name,
        row: null,
        column: null,
        value: null,
        message: `В файле отсутствует лист «${spec.name}»`,
        fix: "Используйте официальный шаблон",
        level: "error",
      });
      continue;
    }
    const headers = Object.keys(rows[0] ?? {});
    const missing = spec.required.filter((h) => !headers.includes(h));
    if (missing.length > 0) {
      ctx.issues.push({
        sheet: spec.name,
        row: null,
        column: missing.join(", "),
        value: null,
        message: `Отсутствуют обязательные колонки: ${missing.join(", ")}`,
        fix: "Скачайте официальный шаблон и перенесите данные",
        level: "error",
      });
      continue;
    }
    const unknown = headers.filter(
      (h) => h && !spec.required.includes(h) && !spec.optional.includes(h),
    );
    if (unknown.length > 0) {
      ctx.issues.push({
        sheet: spec.name,
        row: null,
        column: unknown.join(", "),
        value: null,
        message: `Неизвестные колонки будут проигнорированы: ${unknown.join(", ")}`,
        level: "warning",
      });
    }
    report.totalRows += rows.length;
    report.preview.push({ sheet: spec.name, rows: rows.slice(0, 5) });

    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i] as Row;
      const n = i + 2;
      for (const col of spec.required) {
        if (!(row[col] ?? "").trim()) {
          ctx.issues.push({
            sheet: spec.name,
            row: n,
            column: col,
            value: "",
            message: `Пустое обязательное значение «${col}»`,
            fix: "Заполните ячейку",
            level: "error",
          });
        }
      }
    }
  }

  const hasBlocking = ctx.issues.some((i) => i.level === "error");
  const dryRun = input.dryRun || hasBlocking;

  for (const spec of kind.sheets) {
    const key = pickSheet(available, spec.name, kind.sheets.length);
    if (!key) continue;
    const rows = (sheets[key] ?? []).filter((r) =>
      spec.required.every((c) => (r[c] ?? "").trim() !== ""),
    );
    if (rows.length === 0) continue;

    if (kind.id === "employees") {
      await importEmployees(admin, rows, ctx, dryRun, report);
      continue;
    }

    const mapper = MAPPERS[kind.id]?.[spec.name];
    if (!mapper) continue;

    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i] as Row;
      const n = i + 2;
      const mapped = mapper(row, ctx, n, spec.name);
      if (!mapped) continue;
      if (Object.values(mapped.match).some((v) => v === null || v === undefined || v === "")) {
        report.skipped += 1;
        continue;
      }
      const existing = await findExisting(admin, mapped.table, mapped.match);
      if (existing) {
        if (!changed(existing, mapped.values)) {
          report.unchanged += 1;
        } else {
          report.updated += 1;
          if (!dryRun) {
            const { error } = await admin
              .from(mapped.table)
              .update(mapped.values)
              .eq("id", existing.id);
            if (error) {
              ctx.issues.push({
                sheet: spec.name,
                row: n,
                column: null,
                value: null,
                message: error.message,
                level: "error",
              });
            }
          }
        }
        if (!dryRun && mapped.extra?.options) {
          await syncOptions(admin, existing.id, mapped.extra.options);
        }
        continue;
      }
      report.created += 1;
      if (dryRun) continue;
      const { data: inserted, error } = await admin
        .from(mapped.table)
        .insert({ ...mapped.match, ...mapped.values })
        .select("id")
        .single();
      if (error) {
        report.created -= 1;
        report.skipped += 1;
        ctx.issues.push({
          sheet: spec.name,
          row: n,
          column: null,
          value: null,
          message: error.message,
          level: "error",
        });
        continue;
      }
      const newId = (inserted as { id: string }).id;
      if (mapped.values["code"]) {
        const refKey = mapped.table;
        ctx.refs[refKey]?.set(String(mapped.values["code"]), newId);
      }
      if (mapped.extra?.options) await syncOptions(admin, newId, mapped.extra.options);
    }
  }

  report.issues = ctx.issues.slice(0, 200);
  report.committed = !dryRun;
  report.status = hasBlocking ? "error" : ctx.issues.length > 0 ? "warning" : "success";
  return report;
}

async function syncOptions(
  admin: any,
  questionId: string,
  options: { text: string; is_correct: boolean }[],
) {
  if (options.length === 0) return;
  await admin.from("answer_options").delete().eq("question_id", questionId);
  await admin.from("answer_options").insert(
    options.map((o, idx) => ({
      question_id: questionId,
      text: o.text,
      is_correct: o.is_correct,
      sort_order: idx,
    })),
  );
}
