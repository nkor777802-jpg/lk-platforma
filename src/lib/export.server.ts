import { buildWorkbook } from "./import.server";

type Rows = Record<string, unknown>[];
const yn = (v: unknown) => (v ? "Да" : "Нет");

/** Экспорт в структуре, совместимой с шаблонами импорта. */
export async function buildExport(kind: string): Promise<{ fileName: string; base64: string }> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const admin = supabaseAdmin as any;
  const get = async (table: string, select = "*", order?: string) => {
    let q = admin.from(table).select(select);
    if (order) q = q.order(order);
    const { data } = await q;
    return (data ?? []) as any[];
  };

  const codeMap = async (table: string) => {
    const rows = await get(table, "id, code");
    return new Map<string, string>(rows.filter((r) => r.code).map((r) => [r.id, r.code]));
  };

  if (kind === "employees") {
    const deps = await codeMap("departments");
    const profs = await codeMap("professions");
    const rows = await get(
      "profiles",
      "code, full_name, personnel_number, position, grade, email, phone, status, is_active, department_id, profession_id",
      "full_name",
    );
    const sheet: Rows = rows.map((p) => {
      const parts = String(p.full_name ?? "").split(" ");
      return {
        Код_сотрудника: p.code ?? "",
        Фамилия: parts[0] ?? "",
        Имя: parts[1] ?? "",
        Отчество: parts.slice(2).join(" "),
        Код_подразделения: deps.get(p.department_id) ?? "",
        Код_профессии: profs.get(p.profession_id) ?? "",
        Статус: p.status ?? (p.is_active ? "активен" : "заблокирован"),
        Табельный_номер: p.personnel_number ?? "",
        Должность: p.position ?? "",
        Разряд: p.grade ?? "",
        Email: p.email ?? "",
        Телефон: p.phone ?? "",
      };
    });
    return { fileName: "Employees_Export.xlsx", base64: buildWorkbook([{ name: "Сотрудники", rows: sheet }]) };
  }

  if (kind === "departments") {
    const rows = await get("departments", "code, name, description, head_name", "name");
    return {
      fileName: "Departments_Export.xlsx",
      base64: buildWorkbook([
        {
          name: "Подразделения",
          rows: rows.map((d) => ({
            Код_подразделения: d.code ?? "",
            Наименование: d.name,
            Активно: "Да",
            Код_руководителя: d.head_name ?? "",
            Описание: d.description ?? "",
          })),
        },
      ]),
    };
  }

  if (kind === "professions") {
    const rows = await get("professions", "code, name, description, short_description, is_active", "name");
    return {
      fileName: "Professions_Export.xlsx",
      base64: buildWorkbook([
        {
          name: "Профессии",
          rows: rows.map((p) => ({
            Код_профессии: p.code ?? "",
            Наименование: p.name,
            Активна: yn(p.is_active),
            Описание: p.description ?? "",
            Категория: p.short_description ?? "",
          })),
        },
      ]),
    };
  }

  if (kind === "courses") {
    const profs = await codeMap("professions");
    const rows = await get("courses", "code, title, description, sort_order, is_active, profession_id", "sort_order");
    return {
      fileName: "Courses_Export.xlsx",
      base64: buildWorkbook([
        {
          name: "Курсы",
          rows: rows.map((c) => ({
            Код_курса: c.code ?? "",
            Название: c.title,
            Код_профессии: profs.get(c.profession_id) ?? "",
            Статус: c.is_active ? "Опубликован" : "Архив",
            Описание: c.description ?? "",
            Порядок: c.sort_order,
          })),
        },
      ]),
    };
  }

  if (kind === "course_structure") {
    const courses = await codeMap("courses");
    const modules = await get("course_modules", "id, code, course_id, title, sort_order, description, module_type, is_required", "sort_order");
    const moduleCodes = new Map<string, string>(modules.filter((m) => m.code).map((m) => [m.id, m.code]));
    const lessons = await get("course_lessons", "*", "sort_order");
    return {
      fileName: "Course_Structure_Export.xlsx",
      base64: buildWorkbook([
        {
          name: "Разделы",
          rows: modules.map((m) => ({
            Код_раздела: m.code ?? "",
            Код_курса: courses.get(m.course_id) ?? "",
            Название: m.title,
            Порядок: m.sort_order,
            Описание: m.description ?? "",
            Тип_раздела: m.module_type,
            Обязательный: yn(m.is_required),
          })),
        },
        {
          name: "Уроки",
          rows: lessons.map((l) => ({
            Код_урока: l.code ?? "",
            Код_раздела: moduleCodes.get(l.module_id) ?? "",
            Название: l.title,
            Порядок: l.sort_order,
            Тип_материала: l.material_type,
            Описание: l.description ?? "",
            Файл_или_URL: l.file_url ?? "",
            Обязательный: yn(l.is_required),
            Продолжительность: l.duration_minutes ?? "",
            Текст_урока: l.content ?? "",
          })),
        },
      ]),
    };
  }

  if (kind === "materials") {
    const courses = await codeMap("courses");
    const lessons = await codeMap("course_lessons");
    const rows = await get("materials", "*", "title");
    return {
      fileName: "Learning_Materials_Export.xlsx",
      base64: buildWorkbook([
        {
          name: "Учебные_материалы",
          rows: rows.map((m) => ({
            Код_материала: m.code ?? "",
            Название: m.title,
            Тип: m.material_type,
            Код_курса: courses.get(m.course_id) ?? "",
            Код_урока: lessons.get(m.lesson_id) ?? "",
            Файл_или_URL: m.external_url ?? m.file_url ?? "",
            Описание: m.description ?? "",
            Автор: m.author ?? "",
            Версия: m.version ?? "",
            Дата_актуализации: m.actualized_at ?? "",
            Обязательный: yn(m.is_mandatory_for_all),
          })),
        },
      ]),
    };
  }

  if (kind === "questions") {
    const profs = await codeMap("professions");
    const rows = await get("questions", "*, answer_options(text, is_correct, sort_order)", "created_at");
    const letters = ["A", "B", "C", "D"];
    return {
      fileName: "Question_Bank_Export.xlsx",
      base64: buildWorkbook([
        {
          name: "Вопросы",
          rows: rows.map((q) => {
            const opts = (q.answer_options ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order);
            const out: Record<string, unknown> = {
              Код_вопроса: q.code ?? "",
              Код_профессии: profs.get(q.profession_id) ?? "",
              Тема: q.topic ?? "",
              Вопрос: q.text,
              Тип_вопроса: q.question_type,
              Правильный_ответ:
                opts.length > 0
                  ? opts.map((o: any, i: number) => (o.is_correct ? letters[i] : null)).filter(Boolean).join(",")
                  : (q.reference_answer ?? ""),
              Активен: yn(q.is_active),
            };
            letters.forEach((l, i) => {
              out[`Вариант_${l}`] = opts[i]?.text ?? "";
            });
            out["Уровень_сложности"] = q.difficulty;
            out["Общий_вопрос"] = yn(q.is_common);
            out["Пояснение"] = q.explanation ?? "";
            out["Категория"] = q.category ?? "";
            return out;
          }),
        },
      ]),
    };
  }

  if (kind === "tests") {
    const courses = await codeMap("courses");
    const profs = await codeMap("professions");
    const rows = await get("test_settings", "*");
    return {
      fileName: "Tests_Export.xlsx",
      base64: buildWorkbook([
        {
          name: "Тесты",
          rows: rows.map((t) => ({
            Код_теста: t.code ?? "",
            Название: t.title ?? "",
            Код_курса: courses.get(t.course_id) ?? "",
            Код_профессии: profs.get(t.profession_id) ?? "",
            Количество_вопросов: t.total_questions,
            Проходной_процент: t.pass_percent,
            Количество_попыток: t.max_attempts,
            Статус: t.status ?? "active",
            Время_минут: t.time_limit_minutes ?? "",
            Случайный_порядок: yn(t.shuffle_questions),
            Показывать_правильные_ответы: yn(t.show_correct_answer),
            Учебный_или_аттестационный: t.mode === "training" ? "учебный" : "аттестационный",
          })),
        },
      ]),
    };
  }

  if (kind === "assignments") {
    const emp = await codeMap("profiles");
    const courses = await codeMap("courses");
    const rows = await get("assignments", "*");
    return {
      fileName: "Learning_Assignments_Export.xlsx",
      base64: buildWorkbook([
        {
          name: "Назначения",
          rows: rows.map((a) => ({
            Код_сотрудника: emp.get(a.user_id) ?? "",
            Код_курса: courses.get(a.course_id) ?? "",
            Дата_назначения: a.assigned_at ?? "",
            Срок_прохождения: a.due_date ?? "",
            Обязательное: yn(a.is_mandatory),
            Комментарий: a.comment ?? "",
            Повторное_обучение: yn(a.is_repeat),
          })),
        },
      ]),
    };
  }

  if (kind === "results") {
    const rows = await get(
      "test_attempts",
      "started_at, finished_at, attempt_number, correct_answers, total_questions, score_percent, passed, status, profiles(code, full_name), professions(name)",
      "started_at",
    );
    return {
      fileName: "Test_Results_Export.xlsx",
      base64: buildWorkbook([
        {
          name: "Результаты",
          rows: rows.map((a) => ({
            Код_сотрудника: a.profiles?.code ?? "",
            ФИО: a.profiles?.full_name ?? "",
            Профессия: a.professions?.name ?? "",
            Дата: a.started_at,
            Попытка: a.attempt_number,
            Правильных: a.correct_answers,
            Всего: a.total_questions,
            Процент: a.score_percent,
            Статус: a.passed ? "Пройден" : a.status,
            Время_прохождения:
              a.finished_at && a.started_at
                ? Math.round((new Date(a.finished_at).getTime() - new Date(a.started_at).getTime()) / 60000)
                : "",
          })),
        },
      ]),
    };
  }

  if (kind === "learning") {
    const rows = await get(
      "assignments",
      "assigned_at, due_date, status, profiles!assignments_user_id_fkey(code, full_name, departments(name), professions(name)), courses(title)",
    );
    return {
      fileName: "Learning_Export.xlsx",
      base64: buildWorkbook([
        {
          name: "Обучение",
          rows: rows.map((a) => ({
            Код_сотрудника: a.profiles?.code ?? "",
            ФИО: a.profiles?.full_name ?? "",
            Подразделение: a.profiles?.departments?.name ?? "",
            Профессия: a.profiles?.professions?.name ?? "",
            Курс: a.courses?.title ?? "",
            Дата_назначения: a.assigned_at ?? "",
            Срок: a.due_date ?? "",
            Статус: a.status,
          })),
        },
      ]),
    };
  }

  if (kind === "production") {
    const [products, centers, routes, constructions, materials, defects, assets] = await Promise.all([
      get("production_products", "*", "code"),
      get("work_centers", "*", "code"),
      get("production_routes", "*", "product_code"),
      get("cable_constructions", "*", "product_code"),
      get("production_materials", "*", "code"),
      get("defects", "*", "code"),
      get("model_assets", "*", "code"),
    ]);
    return {
      fileName: "Production_Data_Passport_Export.xlsx",
      base64: buildWorkbook([
        {
          name: "01_Продукция",
          rows: products.map((p) => ({
            Код_продукции: p.code,
            Категория: p.category ?? "",
            Марка: p.brand ?? "",
            Наименование: p.name,
            Активна: yn(p.is_active),
            Описание: p.description ?? "",
            Участок_по_умолчанию: p.default_area ?? "",
          })),
        },
        {
          name: "02_Рабочие_центры",
          rows: centers.map((c) => ({
            Код_РЦ: c.code,
            Наименование_РЦ: c.name,
            Процесс: c.process ?? "",
            Тип_оборудования: c.equipment_type ?? "",
            Активен: yn(c.is_active),
            Участок: c.area ?? "",
            Площадка: c.site ?? "",
            Описание: c.description ?? "",
          })),
        },
        {
          name: "03_Маршруты",
          rows: routes.map((r) => ({
            Код_продукции: r.product_code,
            "№_этапа": r.step_number,
            Процесс: r.process,
            Код_РЦ: r.work_center_code,
            Допустим: yn(r.is_allowed),
            Обязательный_этап: yn(r.is_required_step),
            Комментарий_для_тренажёра: r.trainer_comment ?? "",
          })),
        },
        {
          name: "04_Конструкция_3D",
          rows: constructions.map((c) => ({
            Код_продукции: c.product_code,
            "№_слоя": c.layer_number,
            Код_элемента: c.element_code,
            Элемент: c.element_name,
            Процесс: c.process ?? "",
            Код_3D_элемента: c.asset_code ?? "",
            Материал_код: c.material_code ?? "",
            Тип_визуализации: c.visual_type ?? "",
            Описание_слоя: c.layer_description ?? "",
            Показывать_в_учебном_режиме: yn(c.show_in_learning),
          })),
        },
        {
          name: "05_Материалы",
          rows: materials.map((m) => ({
            Код_материала: m.code,
            Наименование: m.name,
            Категория: m.category ?? "",
            Активен: yn(m.is_active),
            Описание: m.description ?? "",
          })),
        },
        {
          name: "06_Дефекты",
          rows: defects.map((d) => ({
            Код_дефекта: d.code,
            Процесс: d.process ?? "",
            Название_дефекта: d.name,
            Активен: yn(d.is_active),
            Категория_продукции: d.product_category ?? "",
            Описание: d.description ?? "",
            Возможная_причина: d.possible_cause ?? "",
            Корректирующее_действие: d.corrective_action ?? "",
            Изображение_или_файл: d.image_url ?? "",
          })),
        },
        {
          name: "07_3D_Ресурсы",
          rows: assets.map((a) => ({
            Код_3D_элемента: a.code,
            Название: a.name,
            Формат: a.format ?? "",
            Активен: yn(a.is_active),
            Имя_файла_или_URL: a.file_url ?? "",
            Версия: a.version ?? "",
            Описание: a.description ?? "",
          })),
        },
      ]),
    };
  }

  throw new Error("Неизвестный тип экспорта");
}
