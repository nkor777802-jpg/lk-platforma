import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { qualityTask, submitQuality } from "@/lib/simulator.functions";
import { simulatorCatalogQuery } from "@/lib/simulator-queries";
import { EmptyState, InlineLoading } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Task = {
  round: number;
  symptom: string;
  process: string | null;
  options: { id: string; name: string; process: string | null }[];
};

type Answer = {
  passed: boolean;
  defect: {
    name: string;
    process: string | null;
    cause: string | null;
    consequence: string | null;
    action: string | null;
  };
};

export function QualityLab() {
  const catalog = useQuery(simulatorCatalogQuery);
  const queryClient = useQueryClient();
  const getTask = useServerFn(qualityTask);
  const answerTask = useServerFn(submitQuality);

  const [productCode, setProductCode] = useState("");
  const [round, setRound] = useState(1);
  const [task, setTask] = useState<Task | null>(null);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [busy, setBusy] = useState(false);

  const loadTask = async (code: string, nextRound: number) => {
    setBusy(true);
    setAnswer(null);
    try {
      const data = (await getTask({ data: { productCode: code, round: nextRound } })) as Task | null;
      setTask(data);
      setRound(nextRound);
      if (!data) toast.info("Для этой продукции не заведены дефекты");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось загрузить задание");
    } finally {
      setBusy(false);
    }
  };

  const choose = async (defectId: string) => {
    if (!task || !productCode) return;
    setBusy(true);
    try {
      const result = (await answerTask({
        data: { productCode, round: task.round, defectId },
      })) as Answer;
      setAnswer(result);
      await queryClient.invalidateQueries({ queryKey: ["gamification"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ошибка проверки ответа");
    } finally {
      setBusy(false);
    }
  };

  if (catalog.isLoading) return <InlineLoading />;
  if ((catalog.data?.products ?? []).length === 0)
    return (
      <EmptyState
        title="Нет данных производственного паспорта"
        description="Дефекты и продукция загружаются через админ-панель."
      />
    );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Найди дефект</CardTitle>
        <CardDescription>
          По описанию отклонения определите дефект. После ответа отображаются причина, последствия и
          корректирующие действия.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <Select
            value={productCode}
            onValueChange={(value) => {
              setProductCode(value);
              void loadTask(value, 1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Марка продукции" />
            </SelectTrigger>
            <SelectContent>
              {(catalog.data?.products ?? []).map((p) => (
                <SelectItem key={p.code} value={p.code}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            disabled={!productCode || busy}
            onClick={() => void loadTask(productCode, round + 1)}
          >
            Следующее задание
          </Button>
        </div>

        {task ? (
          <div className="space-y-3">
            {task.process ? <Badge variant="secondary">Процесс: {task.process}</Badge> : null}
            <p className="text-sm">{task.symptom}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {task.options.map((o) => (
                <Button
                  key={o.id}
                  variant="outline"
                  disabled={busy || Boolean(answer)}
                  className="h-auto justify-start whitespace-normal py-2 text-left"
                  onClick={() => choose(o.id)}
                >
                  {o.name}
                </Button>
              ))}
            </div>
          </div>
        ) : null}

        {answer ? (
          <div
            className={`space-y-2 rounded-lg border p-4 text-sm ${
              answer.passed ? "border-primary/40" : "border-destructive/40"
            }`}
          >
            <p className="font-semibold text-secondary">
              {answer.passed ? "Дефект определён верно" : "Неверно"} — {answer.defect.name}
            </p>
            <p>
              <span className="text-muted-foreground">Причина: </span>
              {answer.defect.cause ?? "не указана"}
            </p>
            <p>
              <span className="text-muted-foreground">Последствия: </span>
              {answer.defect.consequence ?? "не указаны"}
            </p>
            <p>
              <span className="text-muted-foreground">Корректирующие действия: </span>
              {answer.defect.action ?? "не указаны"}
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
