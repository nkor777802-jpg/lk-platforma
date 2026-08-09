import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const STAFF = ["admin", "hr"] as const;

export const adminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertRole } = await import("./admin.server");
    await assertRole(context.supabase, context.userId, ["admin", "hr", "manager", "teacher"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const count = async (table: string, apply?: (q: any) => any) => {
      let q = supabaseAdmin.from(table as never).select("id", { count: "exact", head: true });
      if (apply) q = apply(q);
      const { count: c } = await q;
      return c ?? 0;
    };

    const today = new Date().toISOString().slice(0, 10);
    const [
      users,
      courses,
      assignments,
      overdue,
      attempts,
      blocked,
      professions,
      tests,
      trainers,
      workCenters,
      productCategories,
    ] = await Promise.all([
      count("profiles", (q) => q.eq("is_active", true)),
      count("courses", (q) => q.eq("is_active", true)),
      count("assignments"),
      count("assignments", (q) => q.lt("due_date", today).neq("status", "completed")),
      count("test_attempts"),
      count("profiles", (q) => q.eq("is_active", false)),
      count("professions", (q) => q.eq("is_active", true)),
      count("test_settings"),
      count("factory_zones", (q) => q.eq("is_active", true)),
      count("work_centers", (q) => q.eq("is_active", true)),
      count("production_products", (q) => q.eq("is_active", true)),
    ]);

    const { data: scores } = await supabaseAdmin
      .from("test_attempts")
      .select("score_percent")
      .eq("status", "finished")
      .limit(2000);
    const scoreRows = (scores ?? []) as { score_percent: number | null }[];
    const avgScore =
      scoreRows.length > 0
        ? Math.round(
            scoreRows.reduce((sum, r) => sum + Number(r.score_percent ?? 0), 0) / scoreRows.length,
          )
        : 0;

    const { data: imports } = await supabaseAdmin
      .from("import_runs")
      .select("id, kind, file_name, actor_name, status, error_rows, created_rows, updated_rows, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    const { data: recent } = await supabaseAdmin
      .from("audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    const importRows = (imports ?? []) as {
      id: string;
      kind: string;
      file_name: string | null;
      actor_name: string | null;
      status: string;
      error_rows: number;
      created_rows: number;
      updated_rows: number;
      created_at: string;
    }[];

    return {
      users,
      courses,
      assignments,
      overdue,
      attempts,
      blocked,
      professions,
      tests,
      trainers,
      workCenters,
      productCategories,
      avgScore,
      imports: importRows,
      importErrors: importRows.filter((i) => i.error_rows > 0).length,
      recent: recent ?? [],
    };
  });

export const listAdminUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertRole } = await import("./admin.server");
    await assertRole(context.supabase, context.userId, [...STAFF, "manager"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("*, departments(name), professions(name), positions(name)")
      .order("full_name");
    const { data: roles } = await supabaseAdmin.from("user_roles").select("user_id, role");
    return (profiles ?? []).map((p) => ({
      ...p,
      roles: (roles ?? []).filter((r) => r.user_id === p.id).map((r) => r.role),
    }));
  });

export const createAdminUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        email: z.string().email(),
        password: z.string().min(8),
        fullName: z.string().min(2),
        role: z.enum(["employee", "manager", "hr", "admin", "teacher"]),
        departmentId: z.string().uuid().nullish(),
        positionId: z.string().uuid().nullish(),
        professionId: z.string().uuid().nullish(),
        personnelNumber: z.string().nullish(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertRole, logAction } = await import("./admin.server");
    const roles = await assertRole(context.supabase, context.userId, [...STAFF]);
    if (data.role === "admin" && !roles.includes("admin"))
      throw new Error("Права администратора выдаёт только администратор");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.fullName },
    });
    if (error || !created.user) throw new Error(error?.message ?? "Не удалось создать пользователя");

    await supabaseAdmin
      .from("profiles")
      .update({
        full_name: data.fullName,
        department_id: data.departmentId ?? null,
        position_id: data.positionId ?? null,
        profession_id: data.professionId ?? null,
        personnel_number: data.personnelNumber ?? null,
      })
      .eq("id", created.user.id);

    if (data.role !== "employee") {
      await supabaseAdmin.from("user_roles").insert({ user_id: created.user.id, role: data.role });
    }
    await logAction({
      actorId: context.userId,
      action: "user.create",
      entity: "profiles",
      entityId: created.user.id,
      details: { email: data.email, role: data.role },
    });
    return { id: created.user.id };
  });

export const updateAdminUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        userId: z.string().uuid(),
        fullName: z.string().min(2).optional(),
        departmentId: z.string().uuid().nullish(),
        positionId: z.string().uuid().nullish(),
        professionId: z.string().uuid().nullish(),
        personnelNumber: z.string().nullish(),
        grade: z.string().nullish(),
        isActive: z.boolean().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertRole, logAction } = await import("./admin.server");
    await assertRole(context.supabase, context.userId, [...STAFF]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: Record<string, unknown> = {};
    if (data.fullName !== undefined) patch["full_name"] = data.fullName;
    if (data.departmentId !== undefined) patch["department_id"] = data.departmentId;
    if (data.positionId !== undefined) patch["position_id"] = data.positionId;
    if (data.professionId !== undefined) patch["profession_id"] = data.professionId;
    if (data.personnelNumber !== undefined) patch["personnel_number"] = data.personnelNumber;
    if (data.grade !== undefined) patch["grade"] = data.grade;
    if (data.isActive !== undefined) patch["is_active"] = data.isActive;
    const { error } = await supabaseAdmin
      .from("profiles")
      .update(patch as never)
      .eq("id", data.userId);
    if (error) throw new Error(error.message);
    await logAction({
      actorId: context.userId,
      action: data.isActive === false ? "user.block" : "user.update",
      entity: "profiles",
      entityId: data.userId,
      details: patch,
    });
    return { ok: true };
  });

export const setUserRoles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        userId: z.string().uuid(),
        roles: z.array(z.enum(["employee", "manager", "hr", "admin", "teacher"])),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertRole, logAction } = await import("./admin.server");
    const actorRoles = await assertRole(context.supabase, context.userId, [...STAFF]);
    if (data.roles.includes("admin") && !actorRoles.includes("admin"))
      throw new Error("Права администратора выдаёт только администратор");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    if (data.roles.length > 0) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .insert(data.roles.map((role) => ({ user_id: data.userId, role })));
      if (error) throw new Error(error.message);
    }
    await logAction({
      actorId: context.userId,
      action: "user.roles",
      entity: "user_roles",
      entityId: data.userId,
      details: { roles: data.roles },
    });
    return { ok: true };
  });

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
type JsonRow = { [key: string]: JsonValue };

export const listRows = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ table: z.string(), select: z.string().optional(), orderBy: z.string().optional() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertRole, isManagedTable } = await import("./admin.server");
    await assertRole(context.supabase, context.userId, [...STAFF, "teacher", "manager"]);
    if (!isManagedTable(data.table)) throw new Error("Недопустимая таблица");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const query = supabaseAdmin.from(data.table as never).select(data.select ?? "*");
    const { data: rows, error } = await (data.orderBy
      ? query.order(data.orderBy, { ascending: true })
      : query);
    if (error) throw new Error(error.message);
    return JSON.parse(JSON.stringify(rows ?? [])) as JsonRow[];
  });

export const saveRow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        table: z.string(),
        id: z.string().uuid().nullish(),
        values: z.record(z.string(), z.unknown()),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertRole, isManagedTable, logAction } = await import("./admin.server");
    await assertRole(context.supabase, context.userId, [...STAFF, "teacher"]);
    if (!isManagedTable(data.table)) throw new Error("Недопустимая таблица");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const values = data.values as never;
    if (data.id) {
      const { error } = await supabaseAdmin.from(data.table as never).update(values).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { data: inserted, error } = await supabaseAdmin
        .from(data.table as never)
        .insert(values)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      data.id = (inserted as { id: string }).id;
    }
    await logAction({
      actorId: context.userId,
      action: data.id ? "row.save" : "row.create",
      entity: data.table,
      entityId: data.id ?? null,
      details: data.values,
    });
    return { id: data.id };
  });

export const archiveRow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ table: z.string(), id: z.string().uuid(), active: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertRole, isManagedTable, MANAGED_TABLES, MANAGED_TABLES_V2, logAction } =
      await import("./admin.server");
    await assertRole(context.supabase, context.userId, [...STAFF]);
    if (!isManagedTable(data.table)) throw new Error("Недопустимая таблица");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const soft =
      (MANAGED_TABLES as Record<string, { soft: string }>)[data.table]?.soft ??
      (MANAGED_TABLES_V2 as Record<string, { soft: string }>)[data.table]?.soft;
    if (soft !== "is_active") {
      throw new Error("Для этой сущности архивирование не предусмотрено");
    }
    const { error } = await supabaseAdmin
      .from(data.table as never)
      .update({ is_active: data.active } as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await logAction({
      actorId: context.userId,
      action: data.active ? "row.restore" : "row.archive",
      entity: data.table,
      entityId: data.id,
    });
    return { ok: true };
  });

export const listAuditLog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertRole } = await import("./admin.server");
    await assertRole(context.supabase, context.userId, [...STAFF]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);
    return data ?? [];
  });

export const getPlatformSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertRole } = await import("./admin.server");
    await assertRole(context.supabase, context.userId, [...STAFF]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("platform_settings").select("*").order("key");
    return data ?? [];
  });

export const savePlatformSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        key: z.string().min(1),
        value: z.record(z.string(), z.unknown()),
        description: z.string().nullish(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertRole, logAction } = await import("./admin.server");
    await assertRole(context.supabase, context.userId, ["admin"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("platform_settings").upsert({
      key: data.key,
      value: data.value as never,
      description: data.description ?? null,
    });
    if (error) throw new Error(error.message);
    await logAction({
      actorId: context.userId,
      action: "settings.save",
      entity: "platform_settings",
      entityId: data.key,
      details: data.value,
    });
    return { ok: true };
  });

export const correctAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        attemptId: z.string().uuid(),
        scorePercent: z.number().min(0).max(100),
        passed: z.boolean(),
        reason: z.string().min(5),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertRole, logAction } = await import("./admin.server");
    await assertRole(context.supabase, context.userId, [...STAFF]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("test_attempts")
      .update({ score_percent: data.scorePercent, passed: data.passed })
      .eq("id", data.attemptId);
    if (error) throw new Error(error.message);
    await logAction({
      actorId: context.userId,
      action: "attempt.correct",
      entity: "test_attempts",
      entityId: data.attemptId,
      details: { scorePercent: data.scorePercent, passed: data.passed, reason: data.reason },
    });
    return { ok: true };
  });

export const validateImport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ kind: z.string(), csv: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    const { assertRole, IMPORT_SCHEMAS, parseCsv } = await import("./admin.server");
    await assertRole(context.supabase, context.userId, [...STAFF]);
    const schema = IMPORT_SCHEMAS[data.kind];
    if (!schema) throw new Error("Неизвестный тип импорта");
    const { headers, rows } = parseCsv(data.csv);
    const missing = schema.required.filter((h) => !headers.includes(h));
    const unknown = headers.filter(
      (h) => !schema.required.includes(h) && !schema.optional.includes(h),
    );
    const errors: string[] = [];
    if (missing.length > 0) errors.push(`Отсутствуют обязательные колонки: ${missing.join(", ")}`);
    rows.forEach((row, i) => {
      schema.required.forEach((h) => {
        if (!row[h]) errors.push(`Строка ${i + 2}: пустое значение «${h}»`);
      });
    });
    return {
      ok: errors.length === 0,
      errors: errors.slice(0, 50),
      unknownColumns: unknown,
      total: rows.length,
      preview: rows.slice(0, 5),
    };
  });

export const commitImport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ kind: z.string(), csv: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    const { assertRole, IMPORT_SCHEMAS, parseCsv, logAction } = await import("./admin.server");
    await assertRole(context.supabase, context.userId, [...STAFF]);
    const schema = IMPORT_SCHEMAS[data.kind];
    if (!schema) throw new Error("Неизвестный тип импорта");
    const { headers, rows } = parseCsv(data.csv);
    const missing = schema.required.filter((h) => !headers.includes(h));
    if (missing.length > 0) throw new Error(`Отсутствуют колонки: ${missing.join(", ")}`);
    const allowed = new Set([...schema.required, ...schema.optional]);
    const payload = rows.map((row) => {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(row)) {
        if (!allowed.has(k) || v === "") continue;
        if (k === "is_common") out[k] = v.toLowerCase() === "true" || v === "1";
        else if (k === "duration_hours") out[k] = Number(v);
        else if (k === "tags") out[k] = v.split(",").map((t) => t.trim());
        else out[k] = v;
      }
      return out;
    });
    if (payload.length === 0) return { inserted: 0 };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from(schema.table as never).insert(payload as never);
    if (error) throw new Error(error.message);
    await logAction({
      actorId: context.userId,
      action: "import",
      entity: schema.table,
      details: { kind: data.kind, count: payload.length },
    });
    return { inserted: payload.length };
  });

export const exportCsv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        kind: z.enum(["users", "results", "assignments", "statistics", "audit"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertRole, toCsv, logAction } = await import("./admin.server");
    await assertRole(context.supabase, context.userId, [...STAFF, "manager"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let rows: Record<string, unknown>[] = [];

    if (data.kind === "users") {
      const { data: r } = await supabaseAdmin
        .from("profiles")
        .select("full_name, email, personnel_number, position, grade, is_active, departments(name), professions(name)");
      rows = (r ?? []).map((p: any) => ({
        ФИО: p.full_name,
        Email: p.email,
        Табельный: p.personnel_number,
        Подразделение: p.departments?.name ?? "",
        Профессия: p.professions?.name ?? "",
        Разряд: p.grade,
        Активен: p.is_active ? "да" : "нет",
      }));
    } else if (data.kind === "results") {
      const { data: r } = await supabaseAdmin
        .from("test_attempts")
        .select("started_at, finished_at, status, score_percent, passed, correct_answers, total_questions, profiles(full_name), professions(name)")
        .order("started_at", { ascending: false });
      rows = (r ?? []).map((a: any) => ({
        Сотрудник: a.profiles?.full_name ?? "",
        Профессия: a.professions?.name ?? "",
        Начало: a.started_at,
        Завершение: a.finished_at,
        Статус: a.status,
        Балл: a.score_percent,
        Пройден: a.passed ? "да" : "нет",
        Верных: `${a.correct_answers}/${a.total_questions}`,
      }));
    } else if (data.kind === "assignments") {
      const { data: r } = await supabaseAdmin
        .from("assignments")
        .select("assigned_at, due_date, status, is_mandatory, comment, profiles!assignments_user_id_fkey(full_name), professions(name), courses(title)");
      rows = (r ?? []).map((a: any) => ({
        Сотрудник: a.profiles?.full_name ?? "",
        Профессия: a.professions?.name ?? "",
        Курс: a.courses?.title ?? "",
        Назначено: a.assigned_at,
        Срок: a.due_date,
        Статус: a.status,
        Обязательно: a.is_mandatory ? "да" : "нет",
        Комментарий: a.comment,
      }));
    } else if (data.kind === "statistics") {
      const { data: r } = await supabaseAdmin
        .from("test_attempts")
        .select("profession_id, passed, score_percent, professions(name)");
      const map = new Map<string, { name: string; total: number; passed: number; sum: number }>();
      for (const a of (r ?? []) as any[]) {
        const key = a.profession_id ?? "—";
        const cur = map.get(key) ?? { name: a.professions?.name ?? "—", total: 0, passed: 0, sum: 0 };
        cur.total += 1;
        cur.passed += a.passed ? 1 : 0;
        cur.sum += Number(a.score_percent ?? 0);
        map.set(key, cur);
      }
      rows = [...map.values()].map((v) => ({
        Профессия: v.name,
        Попыток: v.total,
        Успешно: v.passed,
        "Средний балл": v.total ? Math.round(v.sum / v.total) : 0,
      }));
    } else {
      const { data: r } = await supabaseAdmin
        .from("audit_log")
        .select("created_at, actor_name, action, entity, entity_id")
        .order("created_at", { ascending: false })
        .limit(2000);
      rows = (r ?? []) as Record<string, unknown>[];
    }

    await logAction({ actorId: context.userId, action: "export", entity: data.kind });
    return { csv: toCsv(rows), count: rows.length };
  });

const contactsSchema = z.object({
  legalName: z.string().trim().min(2).max(160),
  shortName: z.string().trim().min(2).max(120),
  address: z.string().trim().min(5).max(400),
  phone: z.string().trim().min(3).max(60),
  internalPhones: z.string().trim().max(120),
  email: z.string().trim().email().max(160),
  unit: z.string().trim().min(2).max(160),
  workHours: z.string().trim().max(160),
});

export const saveSiteContacts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => contactsSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { assertRole, logAction } = await import("./admin.server");
    await assertRole(context.supabase, context.userId, ["admin"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("site_content").upsert({
      key: "contacts",
      title: "Контактные данные",
      data: data as never,
    });
    if (error) throw new Error(error.message);
    await logAction({
      actorId: context.userId,
      action: "settings.contacts.save",
      entity: "site_content",
      entityId: "contacts",
      details: data,
    });
    return { ok: true };
  });
