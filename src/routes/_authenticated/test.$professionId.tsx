import { createFileRoute, useParams, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { finishAttempt, startAttempt, submitAnswer } from "@/lib/test.functions";
import { InlineLoading } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/test/$professionId")({
  head: () => ({
    meta: [
      { title: "Тестирование — Академия «Людиновокабель»" },
      { name: "description", content: "Итоговое тестирование по профессии кабельного производства." },
      { property: "og:title", content: "Итоговое тестирование" },
      { property: "og:description", content: "Проверка знаний и аттестация сотрудника." },
    ],
  }),
  component: TestPage,
});

type QuestionType = "single" | "multi" | "situational" | "open";
type Question = {
  id: string;
  index: number;
  text: string;
  type: QuestionType;
  options: { id: string; text: string }[];
};
type Session = Awaited<ReturnType<typeof startAttempt>>;
type Feedback = { isCorrect: boolean | null; correctText: string | null; explanation: string | null };

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function TestPage() {
  const { professionId } = useParams({ from: "/_authenticated/test/$professionId" });
  const router = useRouter();
  const start = useServerFn(startAttempt);
  const answer = useServerFn(submitAnswer);
  const finish = useServerFn(finishAttempt);

  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const questionStartedAt = useRef<number>(Date.now());
  const warned = useRef(false);
  const finishing = useRef(false);

  const questions = (session?.questions ?? []) as Question[];
  const q = questions[current];
  const answeredIds = useMemo(
    () => new Set((session?.answered ?? []).map((a) => a.questionId)),
    [session],
  );

  const begin = async () => {
    setLoading(true);
    try {
      const res = await start({ data: { professionId } });
      setSession(res);
      const firstUnanswered = res.questions.findIndex(
        (item) => !res.answered.some((a) => a.questionId === item.id),
      );
      setCurrent(firstUnanswered === -1 ? 0 : firstUnanswered);
      questionStartedAt.current = Date.now();
      if (res.resumed) toast.info("Восстановлена незавершённая попытка");
    } catch (e) {
      toast.error("Не удалось начать тест", { description: (e as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const complete = useCallback(
    async (auto = false) => {
      if (!session || finishing.current) return;
      finishing.current = true;
      try {
        const res = await finish({ data: { attemptId: session.attemptId } });
        if (auto) toast.warning("Время вышло — тест завершён автоматически");
        if (res.pending > 0) toast.info("Развернутые ответы отправлены на проверку преподавателю");
        void router.navigate({
          to: "/results/$attemptId",
          params: { attemptId: session.attemptId },
        });
      } catch (e) {
        finishing.current = false;
        toast.error("Не удалось завершить тест", { description: (e as Error).message });
      }
    },
    [finish, router, session],
  );

  // Таймер обратного отсчёта с предупреждением и автозавершением
  useEffect(() => {
    if (!session?.timeLimitMinutes) return;
    const deadline =
      new Date(session.startedAt).getTime() + session.timeLimitMinutes * 60_000;
    const tick = () => {
      const left = Math.max(0, Math.round((deadline - Date.now()) / 1000));
      setRemaining(left);
      if (
        !warned.current &&
        session.warnBeforeMinutes &&
        left <= session.warnBeforeMinutes * 60 &&
        left > 0
      ) {
        warned.current = true;
        toast.warning(`Осталось ${session.warnBeforeMinutes} мин до окончания теста`);
      }
      if (left === 0) void complete(true);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [session, complete]);

  const canSubmit = q
    ? q.type === "open"
      ? text.trim().length > 0
      : selected.length > 0
    : false;

  const goNext = () => {
    setSelected([]);
    setText("");
    setFeedback(null);
    questionStartedAt.current = Date.now();
    if (current + 1 < questions.length) setCurrent((c) => c + 1);
    else void complete();
  };

  const submit = async () => {
    if (!session || !q || !canSubmit) return;
    setLoading(true);
    try {
      const res = await answer({
        data: {
          attemptId: session.attemptId,
          questionId: q.id,
          optionIds: q.type === "open" ? [] : selected,
          textAnswer: q.type === "open" ? text : undefined,
          sortOrder: current,
          timeSpentSeconds: Math.round((Date.now() - questionStartedAt.current) / 1000),
        },
      });
      if (session.showCorrectAnswer && res.isCorrect !== null) {
        setFeedback({
          isCorrect: res.isCorrect,
          correctText: res.correctText,
          explanation: res.explanation,
        });
        return;
      }
      goNext();
    } catch (e) {
      toast.error("Ошибка сохранения ответа", { description: (e as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const toggle = (id: string) => {
    if (feedback) return;
    setSelected((prev) =>
      q?.type === "multi"
        ? prev.includes(id)
          ? prev.filter((x) => x !== id)
          : [...prev, id]
        : [id],
    );
  };

  if (!session) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>Итоговое тестирование</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Вопросы формируются автоматически по настройкам администратора. Ответы сохраняются на
            сервере, результат появится сразу после завершения.
          </p>
          <Button onClick={begin} disabled={loading}>
            Начать тест
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!q) return <InlineLoading />;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Вопрос {current + 1} из {questions.length} · попытка №{session.attemptNumber}
        </p>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {session.mode === "learning" ? "Учебный режим" : "Аттестация"}
          </Badge>
          {remaining !== null ? (
            <Badge variant={remaining <= 60 ? "destructive" : "secondary"}>
              Осталось {formatTime(remaining)}
            </Badge>
          ) : null}
        </div>
      </div>
      <Progress value={((current + 1) / questions.length) * 100} />
      <Card>
        <CardHeader>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {q.type === "multi"
              ? "Выберите все верные варианты"
              : q.type === "open"
                ? "Развернутый ответ"
                : q.type === "situational"
                  ? "Ситуационная задача"
                  : "Выберите один вариант"}
            {answeredIds.has(q.id) ? " · ответ уже сохранён" : ""}
          </p>
          <CardTitle className="text-lg leading-snug">{q.text}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {q.type === "open" ? (
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={7}
              placeholder="Изложите ответ своими словами. Ответ проверит преподаватель."
            />
          ) : (
            q.options.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => toggle(o.id)}
                disabled={Boolean(feedback)}
                className={`flex w-full items-start gap-3 rounded-lg border p-4 text-left text-sm transition-colors ${
                  selected.includes(o.id)
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-card hover:bg-muted"
                }`}
              >
                {q.type === "multi" ? (
                  <Checkbox checked={selected.includes(o.id)} className="mt-0.5" />
                ) : null}
                <span>{o.text}</span>
              </button>
            ))
          )}

          {feedback ? (
            <div
              className={`rounded-lg border p-4 text-sm ${
                feedback.isCorrect
                  ? "border-accent bg-accent/10"
                  : "border-destructive bg-destructive/10"
              }`}
            >
              <p className="font-semibold">
                {feedback.isCorrect ? "Верно" : "Неверно"}
              </p>
              {!feedback.isCorrect && feedback.correctText ? (
                <p className="mt-1">Правильный ответ: {feedback.correctText}</p>
              ) : null}
              {feedback.explanation ? (
                <p className="mt-1 text-muted-foreground">{feedback.explanation}</p>
              ) : null}
            </div>
          ) : null}

          {feedback ? (
            <Button className="w-full" onClick={goNext}>
              {current + 1 === questions.length ? "Завершить тест" : "Следующий вопрос"}
            </Button>
          ) : (
            <Button className="w-full" disabled={!canSubmit || loading} onClick={submit}>
              {current + 1 === questions.length ? "Завершить тест" : "Ответить и продолжить"}
            </Button>
          )}
          {!session.lockAnswer && current > 0 && !feedback ? (
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                setSelected([]);
                setText("");
                setCurrent((c) => c - 1);
              }}
            >
              Предыдущий вопрос
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}