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

    // Восстановление незавершённой попытки (перезагрузка страницы, обрыв связи)
    const { data: running } = await supabaseAdmin
      .from("test_attempts")
      .select("id, started_at, attempt_number, settings_snapshot")
      .eq("user_id", userId)
      .eq("profession_id", data.professionId)
      .eq("status", "in_progress")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const questionIds: string[] | null = running
      ? (((running.settings_snapshot ?? {}) as { question_ids?: string[] }).question_ids ?? null)
      : null;

    let attemptId: string;
    let attemptNumber: number;
    let startedAt: string;
    let selected: {
      id: string;
      text: string;
      question_type: string;
      answer_options: { id: string; text: string; sort_order: number | null }[];
    }[];

    const select = "id, text, question_type, answer_options(id, text, sort_order)";

    if (running && questionIds?.length) {
      const { data: rows } = await supabaseAdmin.from("questions").select(select).in("id", questionIds);
      const byId = new Map((rows ?? []).map((q) => [q.id, q]));
      selected = questionIds.map((id) => byId.get(id)).filter(Boolean) as typeof selected;
      attemptId = running.id;
      attemptNumber = running.attempt_number ?? 1;
      startedAt = running.started_at;
    } else {
      const { data: finishedAttempts } = await supabaseAdmin
        .from("test_attempts")
        .select("id, finished_at")
        .eq("user_id", userId)
        .eq("profession_id", data.professionId)
        .order("started_at", { ascending: false });
      const prevCount = (finishedAttempts ?? []).length;
      attemptNumber = prevCount + 1;
      if (!settings.allow_retry && attemptNumber > 1)
        throw new Error("Повторное прохождение запрещено");
      if (settings.max_attempts && attemptNumber > settings.max_attempts)
        throw new Error("Исчерпан лимит попыток");

      const lastFinished = (finishedAttempts ?? [])[0]?.finished_at;
      if (settings.retry_interval_hours && lastFinished) {
        const readyAt = new Date(lastFinished).getTime() + settings.retry_interval_hours * 3600_000;
        if (Date.now() < readyAt)
          throw new Error(
            `Повторная попытка будет доступна ${new Date(readyAt).toLocaleString("ru-RU")}`,
          );
      }

      const { data: professional } = await supabaseAdmin
        .from("questions")
        .select(select)
        .eq("is_active", true)
        .eq("is_common", false)
        .eq("profession_id", data.professionId);
      const { data: common } = await supabaseAdmin
        .from("questions")
        .select(select)
        .eq("is_active", true)
        .eq("is_common", true);

      const pick = [
        ...shuffle(professional ?? []).slice(0, settings.professional_questions),
        ...shuffle(common ?? []).slice(0, settings.common_questions),
      ];
      const unique = Array.from(new Map(pick.map((q) => [q.id, q])).values());
      if (unique.length === 0) throw new Error("Банк вопросов для этой профессии пуст");
      const ordered = settings.shuffle_questions ? shuffle(unique) : unique;
      selected = ordered.slice(0, settings.total_questions || ordered.length) as typeof selected;

      const { data: attempt, error } = await supabaseAdmin
        .from("test_attempts")
        .insert({
          user_id: userId,
          profession_id: data.professionId,
          attempt_number: attemptNumber,
          status: "in_progress",
          total_questions: selected.length,
          settings_snapshot: JSON.parse(
            JSON.stringify({ ...settings, question_ids: selected.map((q) => q.id) }),
          ),
        })
        .select("id, started_at")
        .single();
      if (error) throw error;
      attemptId = attempt.id;
      startedAt = attempt.started_at;
    }

    const { data: saved } = await supabaseAdmin
      .from("test_answers")
      .select("question_id, selected_option_ids, text_answer")
      .eq("attempt_id", attemptId);

    return {
      attemptId,
      attemptNumber,
      startedAt,
      resumed: Boolean(running && questionIds?.length),
      timeLimitMinutes: settings.time_limit_minutes,
      warnBeforeMinutes: settings.warn_before_minutes,
      mode: settings.mode,
      passPercent: settings.pass_percent,
      maxAttempts: settings.max_attempts,
      lockAnswer: settings.lock_answer,
      showCorrectAnswer: settings.show_correct_answer || settings.mode === "learning",
      answered: (saved ?? []).map((a) => ({
        questionId: a.question_id,
        optionIds: a.selected_option_ids ?? [],
        text: a.text_answer ?? "",
      })),
      questions: selected.map((q, i) => ({
        id: q.id,
        index: i + 1,
        text: q.text,
        type: (q.question_type ?? "single") as "single" | "multi" | "situational" | "open",
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
        optionIds: z.array(z.string().uuid()).max(20).default([]),
        textAnswer: z.string().max(5000).optional(),
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
      .select("id, text, question_type, points, explanation, reference_answer, answer_options(id, text, is_correct)")
      .eq("id", data.questionId)
      .single();
    if (!question) throw new Error("Вопрос не найден");

    const options = question.answer_options ?? [];
    const type = question.question_type ?? "single";
    const chosen = options.filter((o) => data.optionIds.includes(o.id));
    const correctOptions = options.filter((o) => o.is_correct);
    const correctText = correctOptions.map((o) => o.text).join("; ") || null;
    const isOpen = type === "open";

    const chosenIds = new Set(chosen.map((o) => o.id));
    const isCorrect = isOpen
      ? null
      : correctOptions.length > 0 &&
        correctOptions.every((o) => chosenIds.has(o.id)) &&
        chosen.every((o) => o.is_correct);

    const { error } = await supabaseAdmin.from("test_answers").upsert(
      {
        attempt_id: data.attemptId,
        question_id: question.id,
        question_text: question.text,
        selected_option_id: chosen[0]?.id ?? null,
        selected_option_ids: chosen.map((o) => o.id),
        selected_text: isOpen ? (data.textAnswer ?? null) : chosen.map((o) => o.text).join("; ") || null,
        text_answer: isOpen ? (data.textAnswer ?? null) : null,
        correct_text: isOpen ? (question.reference_answer ?? null) : correctText,
        is_correct: isOpen ? null : isCorrect,
        review_status: isOpen ? "pending" : "auto",
        points: question.points ?? 1,
        sort_order: data.sortOrder,
        time_spent_seconds: data.timeSpentSeconds ?? null,
      },
      { onConflict: "attempt_id,question_id" },
    );
    if (error) throw error;

    const snapshot = (attempt.settings_snapshot ?? {}) as {
      show_correct_answer?: boolean;
      mode?: string;
    };
    const reveal = Boolean(snapshot.show_correct_answer) || snapshot.mode === "learning";
    return reveal && !isOpen
      ? {
          recorded: true,
          isCorrect,
          correctText,
          explanation: question.explanation ?? null,
        }
      : { recorded: true, isCorrect: null, correctText: null, explanation: null };
  });

export const finishAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ attemptId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { finalizeAttempt } = await import("./test-engine.server");

    const { data: attempt } = await supabaseAdmin
      .from("test_attempts")
      .select("id, user_id")
      .eq("id", data.attemptId)
      .single();
    if (!attempt || attempt.user_id !== context.userId) throw new Error("Попытка не найдена");

    return finalizeAttempt(supabaseAdmin, data.attemptId);
  });

/** Очередь развернутых ответов на ручную проверку (преподаватель, HR, администратор). */
export const listPendingReviews = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: isStaff } = await supabaseAdmin.rpc("is_staff", { _user_id: context.userId });
    const { data: isTeacher } = await supabaseAdmin.rpc("has_role", {
      _user_id: context.userId,
      _role: "teacher",
    });
    if (!isStaff && !isTeacher) throw new Error("Нет доступа");

    const { data: rows } = await supabaseAdmin
      .from("test_answers")
      .select(
        "id, question_text, text_answer, correct_text, points, attempt_id, test_attempts(user_id, attempt_number, profiles:user_id(full_name))",
      )
      .eq("review_status", "pending")
      .order("answered_at", { ascending: true })
      .limit(200);

    return (rows ?? []).map((r) => {
      const attempt = r.test_attempts as unknown as
        | { attempt_number?: number; profiles?: { full_name?: string } }
        | null;
      return {
        id: r.id,
        attemptId: r.attempt_id,
        questionText: r.question_text,
        answer: r.text_answer ?? "",
        reference: r.correct_text ?? "",
        points: r.points ?? 1,
        attemptNumber: attempt?.attempt_number ?? 1,
        employee: attempt?.profiles?.full_name ?? "—",
      };
    });
  });

/** Выставление балла за развернутый ответ и пересчёт итога попытки. */
export const gradeOpenAnswer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        answerId: z.string().uuid(),
        score: z.number().int().min(0).max(100),
        comment: z.string().max(2000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { finalizeAttempt } = await import("./test-engine.server");
    const { data: isStaff } = await supabaseAdmin.rpc("is_staff", { _user_id: context.userId });
    const { data: isTeacher } = await supabaseAdmin.rpc("has_role", {
      _user_id: context.userId,
      _role: "teacher",
    });
    if (!isStaff && !isTeacher) throw new Error("Нет доступа");

    const { data: answer } = await supabaseAdmin
      .from("test_answers")
      .select("id, attempt_id, points")
      .eq("id", data.answerId)
      .single();
    if (!answer) throw new Error("Ответ не найден");

    const max = answer.points ?? 1;
    const score = Math.min(data.score, max);

    await supabaseAdmin
      .from("test_answers")
      .update({
        review_status: "graded",
        review_score: score,
        review_comment: data.comment ?? null,
        is_correct: score >= max,
        reviewer_id: context.userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", data.answerId);

    const result = await finalizeAttempt(supabaseAdmin, answer.attempt_id);
    return { graded: true, ...result };
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
      .select("question_text, selected_text, correct_text, is_correct, sort_order, review_status")
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
      mode: ((attempt.settings_snapshot ?? {}) as { mode?: "learning" | "exam" }).mode ?? "exam",
      gradeResult: (attempt.grade_result ?? null) as "confirmed" | "lowered" | "failed" | null,
      awaitingReview: attempt.status === "awaiting_review",
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