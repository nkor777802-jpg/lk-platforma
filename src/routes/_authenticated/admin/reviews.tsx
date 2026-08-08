import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { gradeOpenAnswer, listPendingReviews } from "@/lib/test.functions";
import { EmptyState, ErrorState, InlineLoading } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/admin/reviews")({
  component: ReviewsPage,
});

function ReviewsPage() {
  const list = useServerFn(listPendingReviews);
  const grade = useServerFn(gradeOpenAnswer);
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { score: string; comment: string }>>({});

  const pending = useQuery({ queryKey: ["pending-reviews"], queryFn: () => list({}) });

  const save = async (id: string, maxPoints: number) => {
    const draft = drafts[id] ?? { score: String(maxPoints), comment: "" };
    setBusy(id);
    try {
      await grade({
        data: {
          answerId: id,
          score: Math.max(0, Math.min(maxPoints, Number(draft.score) || 0)),
          comment: draft.comment || undefined,
        },
      });
      toast.success("Ответ проверен");
      await queryClient.invalidateQueries({ queryKey: ["pending-reviews"] });
    } catch (e) {
      toast.error("Не удалось сохранить оценку", { description: (e as Error).message });
    } finally {
      setBusy(null);
    }
  };

  if (pending.isLoading) return <InlineLoading />;
  if (pending.error) return <ErrorState />;

  const items = pending.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary">Проверка ответов</h1>
        <p className="text-sm text-muted-foreground">
          Развернутые ответы сотрудников, ожидающие оценки преподавателя.
        </p>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="Очередь пуста"
          description="Все развернутые ответы проверены."
        />
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const draft = drafts[item.id] ?? { score: String(item.points), comment: "" };
            return (
              <Card key={item.id}>
                <CardHeader>
                  <p className="text-xs text-muted-foreground">
                    {item.employee} · попытка №{item.attemptNumber} · максимум {item.points} б.
                  </p>
                  <CardTitle className="text-base leading-snug">{item.questionText}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                      Ответ сотрудника
                    </p>
                    <p className="whitespace-pre-wrap text-sm">{item.answer || "—"}</p>
                  </div>
                  {item.reference ? (
                    <div>
                      <p className="text-xs font-semibold uppercase text-muted-foreground">
                        Эталонный ответ
                      </p>
                      <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                        {item.reference}
                      </p>
                    </div>
                  ) : null}
                  <div className="flex flex-wrap items-end gap-3">
                    <div className="w-28">
                      <label className="text-xs text-muted-foreground" htmlFor={`score-${item.id}`}>
                        Балл
                      </label>
                      <Input
                        id={`score-${item.id}`}
                        type="number"
                        min={0}
                        max={item.points}
                        value={draft.score}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [item.id]: { ...draft, score: e.target.value },
                          }))
                        }
                      />
                    </div>
                    <div className="min-w-60 flex-1">
                      <label className="text-xs text-muted-foreground" htmlFor={`c-${item.id}`}>
                        Комментарий
                      </label>
                      <Textarea
                        id={`c-${item.id}`}
                        rows={2}
                        value={draft.comment}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [item.id]: { ...draft, comment: e.target.value },
                          }))
                        }
                      />
                    </div>
                    <Button disabled={busy === item.id} onClick={() => void save(item.id, item.points)}>
                      Сохранить оценку
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}