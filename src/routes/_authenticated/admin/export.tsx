import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { exportCsv } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/admin/export")({
  component: ExportPage,
});

const KINDS = [
  { value: "users", label: "Сотрудники", text: "Профили, подразделения, должности, статус." },
  { value: "results", label: "Результаты тестирования", text: "Попытки, баллы, статус прохождения." },
  { value: "assignments", label: "Назначения обучения", text: "Кому что назначено и сроки." },
  { value: "statistics", label: "Статистика", text: "Сводные показатели по профессиям и обучению." },
  { value: "audit", label: "Журнал действий", text: "Действия персонала в системе." },
] as const;

type Kind = (typeof KINDS)[number]["value"];

function ExportPage() {
  const run = useServerFn(exportCsv);
  const mutation = useMutation({
    mutationFn: (kind: Kind) => run({ data: { kind } }),
    onSuccess: (data, kind) => {
      const csv = (data as { csv: string }).csv ?? "";
      if (!csv) {
        toast.info("Нет данных для выгрузки");
        return;
      }
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${kind}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary">Экспорт данных</h1>
        <p className="text-sm text-muted-foreground">
          Выгрузка в CSV (разделитель «;», кодировка UTF-8) для отчётности и обработки в Excel.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {KINDS.map((k) => (
          <Card key={k.value}>
            <CardContent className="flex items-center justify-between gap-4 pt-6">
              <div>
                <p className="font-semibold text-foreground">{k.label}</p>
                <p className="text-sm text-muted-foreground">{k.text}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={mutation.isPending}
                onClick={() => mutation.mutate(k.value)}
              >
                <Download className="mr-1.5 h-4 w-4" />
                CSV
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
