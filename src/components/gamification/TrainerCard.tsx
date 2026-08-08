import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { submitTrainer } from "@/lib/gamification.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type Trainer = {
  id: string;
  title: string;
  instruction: string | null;
  taskType: string;
  typeLabel: string;
  kind: "sequence" | "match" | "select";
  imageUrl: string | null;
  maxScore: number;
  professionName: string | null;
  items: { id: string; content: string; imageUrl: string | null }[];
  targets: string[];
  result: { score: number; maxScore: number; passed: boolean } | null;
};

export function TrainerCard({ trainer }: { trainer: Trainer }) {
  const qc = useQueryClient();
  const send = useServerFn(submitTrainer);
  const [order, setOrder] = useState<string[]>([]);
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string[]>([]);
  const [outcome, setOutcome] = useState<{ score: number; maxScore: number; passed: boolean } | null>(
    null,
  );

  const mutation = useMutation({
    mutationFn: () =>
      send({
        data: {
          taskId: trainer.id,
          ...(trainer.kind === "sequence" ? { order } : {}),
          ...(trainer.kind === "match" ? { matches } : {}),
          ...(trainer.kind === "select" ? { selectedItemIds: selected } : {}),
        },
      }),
    onSuccess: (res) => {
      setOutcome({ score: res.score, maxScore: res.maxScore, passed: res.passed });
      toast[res.passed ? "success" : "warning"](
        res.passed ? "Задание выполнено" : "Задание не зачтено",
        { description: `Результат: ${res.score} из ${res.maxScore}` },
      );
      if (res.awarded > 0) toast.success(`Получено новых достижений: ${res.awarded}`);
      if (res.zonesUnlocked > 0) toast.success(`Открыто участков завода: ${res.zonesUnlocked}`);
      void qc.invalidateQueries({ queryKey: ["gamification"] });
    },
    onError: (e: Error) => toast.error("Не удалось отправить ответ", { description: e.message }),
  });

  const ready =
    trainer.kind === "sequence"
      ? order.length === trainer.items.length
      : trainer.kind === "match"
        ? Object.keys(matches).length === trainer.items.length
        : selected.length > 0;

  const reset = () => {
    setOrder([]);
    setMatches({});
    setSelected([]);
    setOutcome(null);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{trainer.typeLabel}</Badge>
          {trainer.professionName ? (
            <Badge variant="secondary">{trainer.professionName}</Badge>
          ) : null}
          {trainer.result ? (
            <Badge variant={trainer.result.passed ? "default" : "destructive"}>
              Лучший результат: {trainer.result.score}/{trainer.result.maxScore}
            </Badge>
          ) : null}
        </div>
        <CardTitle className="text-base leading-snug">{trainer.title}</CardTitle>
        {trainer.instruction ? (
          <p className="text-sm text-muted-foreground">{trainer.instruction}</p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        {trainer.imageUrl ? (
          <img
            src={trainer.imageUrl}
            alt={trainer.title}
            loading="lazy"
            className="max-h-64 w-full rounded-lg object-cover"
          />
        ) : null}

        {trainer.kind === "sequence" ? (
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Выберите элементы в правильном порядке
            </p>
            {trainer.items.map((item) => {
              const pos = order.indexOf(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    setOrder((prev) =>
                      prev.includes(item.id)
                        ? prev.filter((x) => x !== item.id)
                        : [...prev, item.id],
                    )
                  }
                  className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left text-sm transition-colors ${
                    pos >= 0
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:bg-muted"
                  }`}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border text-xs">
                    {pos >= 0 ? pos + 1 : "—"}
                  </span>
                  <span>{item.content}</span>
                </button>
              );
            })}
          </div>
        ) : null}

        {trainer.kind === "match" ? (
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Сопоставьте операции и оборудование
            </p>
            {trainer.items.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center"
              >
                <span className="flex-1 text-sm">{item.content}</span>
                <Select
                  value={matches[item.id] ?? ""}
                  onValueChange={(v) => setMatches((prev) => ({ ...prev, [item.id]: v }))}
                >
                  <SelectTrigger className="sm:w-64">
                    <SelectValue placeholder="Выберите вариант" />
                  </SelectTrigger>
                  <SelectContent>
                    {trainer.targets.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        ) : null}

        {trainer.kind === "select" ? (
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Отметьте все верные варианты
            </p>
            {trainer.items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  setSelected((prev) =>
                    prev.includes(item.id) ? prev.filter((x) => x !== item.id) : [...prev, item.id],
                  )
                }
                className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left text-sm transition-colors ${
                  selected.includes(item.id)
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:bg-muted"
                }`}
              >
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.content}
                    loading="lazy"
                    className="h-16 w-24 rounded object-cover"
                  />
                ) : null}
                <span>{item.content}</span>
              </button>
            ))}
          </div>
        ) : null}

        {outcome ? (
          <div
            className={`rounded-lg border p-3 text-sm ${
              outcome.passed ? "border-accent bg-accent/10" : "border-destructive bg-destructive/10"
            }`}
          >
            {outcome.passed ? "Верно" : "Есть ошибки"} — {outcome.score} из {outcome.maxScore} баллов
          </div>
        ) : null}

        <div className="flex gap-2">
          <Button
            onClick={() => mutation.mutate()}
            disabled={!ready || mutation.isPending || trainer.items.length === 0}
          >
            Проверить
          </Button>
          <Button variant="ghost" onClick={reset}>
            Сбросить
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}