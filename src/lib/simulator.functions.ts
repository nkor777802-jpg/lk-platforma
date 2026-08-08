import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/** Каталог продукции и рабочие центры производственного паспорта. */
export const simulatorCatalog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { loadCatalog, loadWorkCenters } = await import("./simulator.server");
    const [catalog, workCenters] = await Promise.all([
      loadCatalog(supabaseAdmin),
      loadWorkCenters(supabaseAdmin),
    ]);
    return { ...catalog, workCenters };
  });

/** Запуск производственного сценария по выбранной марке продукции. */
export const startSimulatorRun = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ productCode: z.string().min(1).max(64) }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { buildRoute, loadWorkCenters } = await import("./simulator.server");

    const route = await buildRoute(supabaseAdmin, data.productCode);
    if (!route.product || route.steps.length === 0)
      throw new Error("Для этой продукции не загружен технологический маршрут");

    const maxScore = route.steps.length * 10;
    const { data: run, error } = await supabaseAdmin
      .from("simulator_runs")
      .insert({
        user_id: context.userId,
        product_code: route.product.code,
        product_name: route.product.name,
        total_steps: route.steps.length,
        max_score: maxScore,
        status: "in_progress",
      })
      .select("id")
      .single();
    if (error || !run) throw new Error("Не удалось запустить тренажёр");

    return {
      runId: run.id,
      product: route.product,
      steps: route.steps.map((s) => ({
        stepNumber: s.stepNumber,
        process: s.process,
        comment: s.comment,
        layerCodes: s.layerCodes,
      })),
      layers: route.layers,
      workCenters: await loadWorkCenters(supabaseAdmin),
      maxScore,
    };
  });

/** Проверка выбранного рабочего центра. Ответ известен только серверу. */
export const submitSimulatorStep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        runId: z.string().uuid(),
        stepNumber: z.number().int().min(1).max(200),
        workCenterCode: z.string().min(1).max(64),
        attempt: z.number().int().min(1).max(20),
        durationSeconds: z.number().int().min(0).max(86400),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { buildRoute, stepScore } = await import("./simulator.server");

    const { data: run } = await supabaseAdmin
      .from("simulator_runs")
      .select("*")
      .eq("id", data.runId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!run) throw new Error("Прохождение не найдено");
    if (run.status !== "in_progress") throw new Error("Прохождение уже завершено");

    const route = await buildRoute(supabaseAdmin, run.product_code);
    const step = route.steps.find((s) => s.stepNumber === data.stepNumber);
    if (!step) throw new Error("Шаг маршрута не найден");
    const expected = route.expected.get(data.stepNumber) ?? [];
    const isCorrect = expected.includes(data.workCenterCode);

    await supabaseAdmin.from("simulator_steps").insert({
      run_id: run.id,
      user_id: context.userId,
      step_number: data.stepNumber,
      process: step.process,
      selected_work_center: data.workCenterCode,
      expected_work_centers: expected,
      is_correct: isCorrect,
      attempts: data.attempt,
      duration_seconds: data.durationSeconds,
    });

    if (isCorrect) {
      const gained = stepScore(data.attempt);
      await supabaseAdmin
        .from("simulator_runs")
        .update({
          correct_steps: run.correct_steps + 1,
          current_step: Math.min(data.stepNumber + 1, run.total_steps + 1),
          score: run.score + gained,
          duration_seconds: run.duration_seconds + data.durationSeconds,
        })
        .eq("id", run.id);
      return {
        correct: true,
        gained,
        layers: step.layerCodes,
        comment: step.comment,
        hint: null as string | null,
      };
    }

    await supabaseAdmin
      .from("simulator_runs")
      .update({
        errors: run.errors + 1,
        duration_seconds: run.duration_seconds + data.durationSeconds,
      })
      .eq("id", run.id);

    return {
      correct: false,
      gained: 0,
      layers: [] as string[],
      comment: step.comment,
      hint:
        data.attempt >= 2
          ? `Операция «${step.process}» выполняется на оборудовании этого процесса.`
          : null,
    };
  });

/** Завершение прохождения: начисление опыта и пересчёт достижений. */
export const finishSimulatorRun = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ runId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { recalcGamification } = await import("./gamification.server");

    const { data: run } = await supabaseAdmin
      .from("simulator_runs")
      .select("*")
      .eq("id", data.runId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!run) throw new Error("Прохождение не найдено");

    const completed = run.correct_steps >= run.total_steps && run.total_steps > 0;
    const xp = run.score + (completed ? 25 : 0) + (run.errors === 0 && completed ? 25 : 0);

    if (run.status === "in_progress") {
      await supabaseAdmin
        .from("simulator_runs")
        .update({
          status: completed ? "completed" : "abandoned",
          xp,
          finished_at: new Date().toISOString(),
        })
        .eq("id", run.id);
    }

    const recalc = await recalcGamification(supabaseAdmin, context.userId);
    return {
      completed,
      score: run.score,
      maxScore: run.max_score,
      errors: run.errors,
      xp,
      awarded: recalc.awarded,
      zonesUnlocked: recalc.zonesUnlocked,
    };
  });

/** Задание «Найди дефект» по процессам маршрута выбранной продукции. */
export const qualityTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({ productCode: z.string().min(1).max(64), round: z.number().int().min(1).max(999) })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { loadDefectsForProduct, pickDefectIndex } = await import("./simulator.server");

    const pool = await loadDefectsForProduct(supabaseAdmin, data.productCode);
    if (pool.length < 2) return null;

    const idx = pickDefectIndex(`${context.userId}:${data.productCode}:${data.round}`, pool.length);
    const correct = pool[idx]!;
    const others = pool.filter((d) => d.id !== correct.id).slice(0, 3);
    const options = [...others, correct]
      .map((d) => ({ id: d.id, name: d.name, process: d.process }))
      .sort((a, b) => a.id.localeCompare(b.id));

    return {
      round: data.round,
      symptom: correct.description ?? "Отклонение обнаружено при визуальном контроле",
      process: correct.process,
      options,
    };
  });

/** Проверка ответа в режиме контроля качества. */
export const submitQuality = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        productCode: z.string().min(1).max(64),
        round: z.number().int().min(1).max(999),
        defectId: z.string().uuid(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { loadDefectsForProduct, pickDefectIndex } = await import("./simulator.server");
    const { recalcGamification } = await import("./gamification.server");

    const pool = await loadDefectsForProduct(supabaseAdmin, data.productCode);
    if (!pool.length) throw new Error("Справочник дефектов пуст");
    const idx = pickDefectIndex(`${context.userId}:${data.productCode}:${data.round}`, pool.length);
    const correct = pool[idx]!;
    const passed = correct.id === data.defectId;

    await supabaseAdmin.from("practical_results").insert({
      user_id: context.userId,
      score: passed ? 10 : 0,
      max_score: 10,
      passed,
      response: { kind: "quality", productCode: data.productCode, defectCode: correct.code },
    });
    await recalcGamification(supabaseAdmin, context.userId);

    return {
      passed,
      defect: {
        name: correct.name,
        process: correct.process,
        cause: correct.possible_cause,
        consequence: correct.description,
        action: correct.corrective_action,
      },
    };
  });

/** История прохождений тренажёра сотрудником. */
export const mySimulatorHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("simulator_runs")
      .select("id, product_name, status, score, max_score, errors, xp, duration_seconds, started_at")
      .eq("user_id", context.userId)
      .order("started_at", { ascending: false })
      .limit(20);
    return (data ?? []).map((r) => ({
      id: r.id,
      productName: r.product_name,
      status: r.status,
      score: r.score,
      maxScore: r.max_score,
      errors: r.errors,
      xp: r.xp,
      durationSeconds: r.duration_seconds,
      startedAt: r.started_at,
    }));
  });
