import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const startAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ professionId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { DEFAULT_SETTINGS, shuffle } = await import("./test-engine.server");
    const userId = context.userId;

    const { data: settingsRows } = await supabaseAdmin
      .from("test_settings")
      .select("*")
      .or(`profession_id.eq.${data.professionId},is_default.eq.true`);
    const specific = (settingsRows ?? []).find((s) => s.profession_id === data.professionId);
    const fallback = (settingsRows ?? []).find((s) => s.is_default);
    const settings = { ...DEFAULT_SETTINGS, ...(specific ?? fallback ?? {}) };

    const { count: prevCount } = await supabaseAdmin
      .from("test_attempts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("profession_id", data.professionId);
    const attemptNumber = (prevCount ?? 0) + 1;
    if (!settings.allow_retry && attemptNumber > 1) throw new Error("Повторное прохождение запрещено");
    if (settings.max_attempts && attemptNumber > settings.max_attempts)
      throw new Error("Исчерпан лимит попыток");

    const { data: professional } = await supabaseAdmin
      .from("questions")
      .select("id, text, answer_options(id, text, sort_order)")
      .eq("is_active", true)
      .eq("is_common", false)
      .eq("profession_id", data.professionId);
    const { data: common } = await supabaseAdmin
      .from("questions")
      .select("id, text, answer_options(id, text, sort_order)")
      .eq("is_active", true)
      .eq("is_common", true);

    const pick = [
      ...shuffle(professional ?? []).slice(0, settings.professional_questions),
      ...shuffle(common ?? []).slice(0, settings.common_questions),
    ];
    if (pick.length === 0) throw new Error("Банк вопросов для этой профессии пуст");
    const ordered = settings.shuffle_questions ? shuffle(pick) : pick;
    const selected = ordered.slice(0, settings.total_questions || ordered.length);

    const { data: attempt, error } = await supabaseAdmin
      .from("test_attempts")
      .insert({
        user_id: userId,
        profession_id: data.professionId,
        attempt_number: attemptNumber,
        status: "in_progress",
        total_questions: selected.length,
        settings_snapshot: { ...settings, question_ids: selected.map((q) => q.id) },
      })
      .select("id, started_at")
      .single();
    if (error) throw error;

    return {
      attemptId: attempt.id,
      startedAt: attempt.started_at,
      timeLimitMinutes: settings.time_limit_minutes,
      lockAnswer: settings.lock_answer,
      showCorrectAnswer: settings.show_correct_answer,
      questions: selected.map((q, i) => ({
        id: q.id,
        index: i + 1,
        text: q.text,
        options: (settings.shuffle_options
          ? shuffle(q.answer_options ?? [])
          : [...(q.answer_options ?? [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        ).map((o) => ({ id: o.id, text: o.text })),
      })),
    };
  });

export const submitAnswer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        attemptId: z.string().uuid(),
        questionId: z.string().uuid(),
        optionId: z.string().uuid(),
        sortOrder: z.number().int().min(0),
        timeSpentSeconds: z.number().int().min(0).max(86400).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: attempt } = await supabaseAdmin
      .from("test_attempts")
      .select("id, user_id, status, settings_snapshot")
      .eq("id", data.attemptId)
      .single();
    if (!attempt || attempt.user_id !== context.userId) throw new Error("Попытка не найдена");
    if (attempt.status !== "in_progress") throw new Error("Попытка уже завершена");

    const { data: question } = await supabaseAdmin
      .from("questions")
      .select("id, text, answer_options(id, text, is_correct)")
      .eq("id", data.questionId)
      .single();
    if (!question) throw new Error("Вопрос не найден");

    const options = question.answer_options ?? [];
    const chosen = options.find((o) => o.id === data.optionId);
    const correct = options.find((o) => o.is_correct);
    const isCorrect = Boolean(chosen?.is_correct);

    await supabaseAdmin.from("test_answers").insert({
      attempt_id: data.attemptId,
      question_id: question.id,
      question_text: question.text,
      selected_option_id: chosen?.id ?? null,
      selected_text: chosen?.text ?? null,
      correct_text: correct?.text ?? null,
      is_correct: isCorrect,
      sort_order: data.sortOrder,
      time_spent_seconds: data.timeSpentSeconds ?? null,
    });

    const snapshot = (attempt.settings_snapshot ?? {}) as { show_correct_answer?: boolean };
    return snapshot.show_correct_answer
      ? { recorded: true, isCorrect, correctText: correct?.text ?? null }
      : { recorded: true };
  });

export const finishAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ attemptId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { DEFAULT_SETTINGS } = await import("./test-engine.server");

    const { data: attempt } = await supabaseAdmin
      .from("test_attempts")
      .select("id, user_id, profession_id, total_questions, settings_snapshot, status")
      .eq("id", data.attemptId)
      .single();
    if (!attempt || attempt.user_id !== context.userId) throw new Error("Попытка не найдена");

    const { data: answers } = await supabaseAdmin
      .from("test_answers")
      .select("is_correct")
      .eq("attempt_id", data.attemptId);
    const correct = (answers ?? []).filter((a) => a.is_correct).length;
    const total = attempt.total_questions || (answers ?? []).length || 1;
    const percent = Math.round((correct / total) * 1000) / 10;
    const snapshot = (attempt.settings_snapshot ?? {}) as { pass_percent?: number };
    const passPercent = snapshot.pass_percent ?? DEFAULT_SETTINGS.pass_percent;
    const passed = percent >= passPercent;

    await supabaseAdmin
      .from("test_attempts")
      .update({
        status: "finished",
        correct_answers: correct,
        score_percent: percent,
        passed,
        finished_at: new Date().toISOString(),
      })
      .eq("id", data.attemptId);

    return { correct, total, percent, passed, passPercent };
  });

export const submitPractical = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        taskId: z.string().uuid(),
        attemptId: z.string().uuid().nullable().optional(),
        selectedItemIds: z.array(z.string().uuid()).max(100).optional(),
        order: z.array(z.string().uuid()).max(100).optional(),
        matches: z.record(z.string(), z.string()).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: task } = await supabaseAdmin
      .from("practical_tasks")
      .select("id, task_type, max_score, practical_task_items(id, content, match_target, correct_position, is_correct)")
      .eq("id", data.taskId)
      .single();
    if (!task) throw new Error("Задание не найдено");

    const items = task.practical_task_items ?? [];
    let scored = 0;
    let maxUnits = items.length || 1;

    if (task.task_type === "sequence") {
      const expected = [...items].sort(
        (a, b) => (a.correct_position ?? 0) - (b.correct_position ?? 0),
      );
      const given = data.order ?? [];
      scored = expected.filter((item, i) => given[i] === item.id).length;
    } else if (task.task_type === "match") {
      const given = data.matches ?? {};
      scored = items.filter((item) => given[item.id] === (item.match_target ?? "")).length;
    } else {
      const chosen = new Set(data.selectedItemIds ?? []);
      scored = items.filter((item) => chosen.has(item.id) === Boolean(item.is_correct)).length;
    }

    const maxScore = task.max_score ?? maxUnits;
    const score = Math.round((scored / maxUnits) * maxScore);
    const passed = score >= Math.ceil(maxScore * 0.7);

    await supabaseAdmin.from("practical_results").insert({
      user_id: context.userId,
      task_id: task.id,
      attempt_id: data.attemptId ?? null,
      score,
      max_score: maxScore,
      passed,
      response: { selectedItemIds: data.selectedItemIds, order: data.order, matches: data.matches },
    });

    return { score, maxScore, passed };
  });

export const getProtocolHtml = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ attemptId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { renderProtocolHtml } = await import("./test-engine.server");

    const { data: attempt } = await supabaseAdmin
      .from("test_attempts")
      .select("*")
      .eq("id", data.attemptId)
      .single();
    if (!attempt) throw new Error("Попытка не найдена");

    const { data: isStaff } = await supabaseAdmin.rpc("is_staff", { _user_id: context.userId });
    if (attempt.user_id !== context.userId && !isStaff) throw new Error("Нет доступа");

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, personnel_number, grade, departments(name)")
      .eq("id", attempt.user_id)
      .single();
    const { data: profession } = await supabaseAdmin
      .from("professions")
      .select("name")
      .eq("id", attempt.profession_id ?? "")
      .single();
    const { data: answers } = await supabaseAdmin
      .from("test_answers")
      .select("question_text, selected_text, correct_text, is_correct, sort_order")
      .eq("attempt_id", data.attemptId)
      .order("sort_order");
    const { data: practical } = await supabaseAdmin
      .from("practical_results")
      .select("score, max_score, passed, practical_tasks(title)")
      .eq("attempt_id", data.attemptId);

    const logo = await import("@/assets/logo-full-color.png.asset.json");
    const html = renderProtocolHtml({
      fullName: profile?.full_name ?? "—",
      personnelNumber: profile?.personnel_number ?? null,
      department: (profile as { departments?: { name?: string } } | null)?.departments?.name ?? null,
      profession: profession?.name ?? null,
      grade: profile?.grade ?? null,
      date: new Date(attempt.finished_at ?? attempt.started_at ?? Date.now()).toLocaleString("ru-RU"),
      attemptNumber: attempt.attempt_number ?? 1,
      logoUrl: (logo.default ?? logo).url,
      answers: answers ?? [],
      practical: (practical ?? []).map((p) => ({
        title: (p as { practical_tasks?: { title?: string } }).practical_tasks?.title ?? "Задание",
        score: p.score ?? 0,
        maxScore: p.max_score ?? 0,
        passed: Boolean(p.passed),
      })),
      correct: attempt.correct_answers ?? 0,
      total: attempt.total_questions ?? 0,
      percent: Number(attempt.score_percent ?? 0),
      passed: Boolean(attempt.passed),
    });
    return { html };
  });