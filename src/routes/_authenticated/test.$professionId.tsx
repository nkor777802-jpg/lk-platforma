import { createFileRoute, useParams, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { finishAttempt, startAttempt, submitAnswer } from "@/lib/test.functions";
import { InlineLoading } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

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

type Question = { id: string; index: number; text: string; options: { id: string; text: string }[] };

function TestPage() {
  const { professionId } = useParams({ from: "/_authenticated/test/$professionId" });
  const router = useRouter();
  const start = useServerFn(startAttempt);
  const answer = useServerFn(submitAnswer);
  const finish = useServerFn(finishAttempt);

  const [loading, setLoading] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);

  const begin = async () => {
    setLoading(true);
    try {
      const res = await start({ data: { professionId } });
      setAttemptId(res.attemptId);
      setQuestions(res.questions);
      setCurrent(0);
    } catch (e) {
      toast.error("Не удалось начать тест", { description: (e as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const next = async () => {
    if (!attemptId || !selected) return;
    const q = questions[current];
    if (!q) return;
    setLoading(true);
    try {
      await answer({
        data: { attemptId, questionId: q.id, optionId: selected, sortOrder: current },
      });
      setSelected(null);
      if (current + 1 < questions.length) {
        setCurrent((c) => c + 1);
      } else {
        await finish({ data: { attemptId } });
        void router.navigate({ to: "/results/$attemptId", params: { attemptId } });
      }
    } catch (e) {
      toast.error("Ошибка сохранения ответа", { description: (e as Error).message });
    } finally {
      setLoading(false);
    }
  };

  if (!attemptId) {
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

  const q = questions[current];
  if (!q) return <InlineLoading />;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Progress value={((current + 1) / questions.length) * 100} />
      <p className="text-sm text-muted-foreground">
        Вопрос {current + 1} из {questions.length}
      </p>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg leading-snug">{q.text}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {q.options.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => setSelected(o.id)}
              className={`w-full rounded-lg border p-4 text-left text-sm transition-colors ${
                selected === o.id
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-card hover:bg-muted"
              }`}
            >
              {o.text}
            </button>
          ))}
          <Button className="w-full" disabled={!selected || loading} onClick={next}>
            {current + 1 === questions.length ? "Завершить тест" : "Следующий вопрос"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}