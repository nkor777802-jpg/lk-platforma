import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type Admin = SupabaseClient<Database>;

export type WorkCenter = {
  code: string;
  name: string;
  process: string;
  area: string | null;
  equipmentType: string | null;
};

export type RouteStep = {
  stepNumber: number;
  process: string;
  comment: string | null;
  layerCodes: string[];
};

export type CableLayer = {
  code: string;
  name: string;
  visualType: string;
  description: string | null;
  materialName: string | null;
  process: string | null;
  stepNumber: number | null;
};

/** Очки за операцию в зависимости от числа попыток. */
export function stepScore(attempt: number) {
  if (attempt <= 1) return 10;
  if (attempt === 2) return 6;
  if (attempt === 3) return 3;
  return 1;
}

/** Уровень сотрудника по накопленному опыту. */
export function levelFromXp(xp: number) {
  const level = Math.floor(Math.sqrt(Math.max(xp, 0) / 100)) + 1;
  const currentFloor = (level - 1) ** 2 * 100;
  const nextFloor = level ** 2 * 100;
  return {
    level,
    xp,
    currentFloor,
    nextFloor,
    progress: Math.round(((xp - currentFloor) / (nextFloor - currentFloor)) * 100),
  };
}

/** Справочник рабочих центров предприятия. */
export async function loadWorkCenters(admin: Admin): Promise<WorkCenter[]> {
  const { data } = await admin
    .from("work_centers")
    .select("code, name, process, area, equipment_type")
    .eq("is_active", true)
    .order("code");
  return (data ?? []).map((w) => ({
    code: w.code,
    name: w.name,
    process: w.process ?? "",
    area: w.area,
    equipmentType: w.equipment_type,
  }));
}

/** Продукция производственного паспорта, сгруппированная по категориям. */
export async function loadCatalog(admin: Admin) {
  const [{ data: categories }, { data: products }, { data: routes }, { data: layers }] =
    await Promise.all([
      admin.from("product_categories").select("code, name, description").eq("is_active", true),
      admin
        .from("production_products")
        .select("code, name, brand, category, description, default_area")
        .eq("is_active", true)
        .order("code"),
      admin.from("production_routes").select("product_code, step_number").eq("is_active", true),
      admin.from("cable_constructions").select("product_code, layer_number").eq("is_active", true),
    ]);

  const stepCount = new Map<string, Set<number>>();
  for (const r of routes ?? []) {
    const set = stepCount.get(r.product_code) ?? new Set<number>();
    set.add(r.step_number);
    stepCount.set(r.product_code, set);
  }
  const layerCount = new Map<string, number>();
  for (const l of layers ?? [])
    layerCount.set(l.product_code, (layerCount.get(l.product_code) ?? 0) + 1);

  return {
    categories: (categories ?? []).map((c) => ({
      code: c.code ?? "",
      name: c.name,
      description: c.description,
    })),
    products: (products ?? []).map((p) => ({
      code: p.code,
      name: p.name,
      brand: p.brand,
      category: p.category,
      description: p.description,
      area: p.default_area,
      steps: stepCount.get(p.code)?.size ?? 0,
      layers: layerCount.get(p.code) ?? 0,
    })),
  };
}

/**
 * Построение технологического маршрута и конструкции по данным паспорта.
 * Жёстко заданных маршрутов нет — всё берётся из таблиц продукции.
 */
export async function buildRoute(admin: Admin, productCode: string) {
  const [{ data: product }, { data: routeRows }, { data: layerRows }, { data: materials }] =
    await Promise.all([
      admin
        .from("production_products")
        .select("code, name, brand, category, description")
        .eq("code", productCode)
        .maybeSingle(),
      admin
        .from("production_routes")
        .select("step_number, process, work_center_code, is_allowed, trainer_comment")
        .eq("product_code", productCode)
        .eq("is_active", true)
        .order("step_number"),
      admin
        .from("cable_constructions")
        .select("layer_number, element_code, element_name, process, material_code, visual_type, layer_description")
        .eq("product_code", productCode)
        .eq("is_active", true)
        .order("layer_number"),
      admin.from("production_materials").select("code, name"),
    ]);

  const materialNames = new Map((materials ?? []).map((m) => [m.code, m.name]));

  const byStep = new Map<number, { process: string; comment: string | null; allowed: string[] }>();
  for (const r of routeRows ?? []) {
    const entry = byStep.get(r.step_number) ?? {
      process: r.process,
      comment: r.trainer_comment,
      allowed: [],
    };
    if (r.is_allowed !== false) entry.allowed.push(r.work_center_code);
    if (!entry.comment && r.trainer_comment) entry.comment = r.trainer_comment;
    byStep.set(r.step_number, entry);
  }

  const orderedSteps = Array.from(byStep.entries()).sort((a, b) => a[0] - b[0]);

  // Каждый конструктивный слой привязывается к ближайшей операции своего процесса.
  const usedSteps = new Set<number>();
  const layers: CableLayer[] = (layerRows ?? []).map((l) => {
    const match = orderedSteps.find(
      ([num, s]) => s.process === (l.process ?? "") && !usedSteps.has(num),
    );
    if (match) usedSteps.add(match[0]);
    return {
      code: l.element_code,
      name: l.element_name,
      visualType: l.visual_type ?? "insulation",
      description: l.layer_description,
      materialName: l.material_code ? (materialNames.get(l.material_code) ?? null) : null,
      process: l.process,
      stepNumber: match?.[0] ?? null,
    };
  });

  const steps: RouteStep[] = orderedSteps.map(([num, s]) => ({
    stepNumber: num,
    process: s.process,
    comment: s.comment,
    layerCodes: layers.filter((l) => l.stepNumber === num).map((l) => l.code),
  }));

  return {
    product: product
      ? {
          code: product.code,
          name: product.name,
          brand: product.brand,
          category: product.category,
          description: product.description,
        }
      : null,
    steps,
    layers,
    expected: new Map(orderedSteps.map(([num, s]) => [num, s.allowed])),
  };
}

/** Детерминированный выбор задания «Найди дефект» без раскрытия ответа клиенту. */
export function pickDefectIndex(seed: string, total: number) {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash) % Math.max(total, 1);
}

/** Дефекты, относящиеся к процессам маршрута выбранной продукции. */
export async function loadDefectsForProduct(admin: Admin, productCode: string) {
  const { data: product } = await admin
    .from("production_products")
    .select("category")
    .eq("code", productCode)
    .maybeSingle();
  const { data: routeRows } = await admin
    .from("production_routes")
    .select("process")
    .eq("product_code", productCode)
    .eq("is_active", true);
  const processes = new Set((routeRows ?? []).map((r) => r.process));

  const { data: defects } = await admin
    .from("defects")
    .select("id, code, name, process, product_category, description, possible_cause, corrective_action")
    .eq("is_active", true)
    .order("code");

  const scoped = (defects ?? []).filter(
    (d) =>
      (!d.process || processes.has(d.process)) &&
      (!d.product_category || !product?.category || d.product_category === product.category),
  );
  return scoped.length ? scoped : (defects ?? []);
}
