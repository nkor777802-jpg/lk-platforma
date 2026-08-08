import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Download, FileSpreadsheet } from "lucide-react";
import { exportCsv } from "@/lib/admin.functions";
import { exportExcel } from "@/lib/import.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/admin/export")({
  component: ExportPage,
});

const EXCEL_KINDS = [
  { value: "employees", label: "Сотрудники", text: "Структура файла совпадает с Employees_Template.xlsx." },
  { value: "departments", label: "Подразделения", text: "Организационная структура предприятия." },
  { value: "professions", label: "Профессии", text: "Каталог профессий с кодами." },
  { value: "courses", label: "Курсы", text: "Каталог курсов и статусы публикации." },
  { value: "course_structure", label: "Структура курсов", text: "Разделы и уроки на двух листах." },
  { value: "materials", label: "Учебные материалы", text: "Материалы с привязкой к курсу и уроку." },
  { value: "questions", label: "Банк вопросов", text: "Вопросы и варианты ответов." },
  { value: "tests", label: "Конфигурация тестов", text: "Параметры тестов и режимы." },
  { value: "assignments", label: "Назначения обучения", text: "Совместимо с шаблоном назначений." },
  { value: "results", label: "Результаты тестирования", text: "Отчёт по попыткам и баллам." },
  { value: "learning", label: "Обучение", text: "Прогресс и сроки по сотрудникам." },
  { value: "production", label: "Производственный паспорт", text: "Все восемь листов паспорта данных." },
] as const;

const CSV_KINDS = [
  { value: "users", label: "Сотрудники" },
  { value: "results", label: "Результаты тестирования" },
  { value: "assignments", label: "Назначения обучения" },
  { value: "statistics", label: "Статистика" },
  { value: "audit", label: "Журнал действий" },
] as const;

function downloadBase64(base64: string, fileName: string) {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const blob = new Blob([bytes], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

function ExportPage() {
  const runCsv = useServerFn(exportCsv);
  const runXlsx = useServerFn(exportExcel);

  const xlsx = useMutation({
    mutationFn: (kind: string) => runXlsx({ data: { kind } }),
    onSuccess: (data) => downloadBase64(data.base64, data.fileName),
    onError: (e: Error) => toast.error(e.message),
  });

  const csv = useMutation({
    mutationFn: (kind: (typeof CSV_KINDS)[number]["value"]) => runCsv({ data: { kind } }),
    onSuccess: (data, kind) => {
      const content = (data as { csv: string }).csv ?? "";
      if (!content) {
        toast.info("Нет данных для выгрузки");
        return;
      }
      const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8" });
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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-secondary">Экспорт данных</h1>
        <p className="text-sm text-muted-foreground">
          Выгрузка Excel выполняется в структуре шаблонов импорта: файл можно отредактировать и
          загрузить обратно без ручного преобразования.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-secondary">Выгрузить Excel</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {EXCEL_KINDS.map((k) => (
            <Card key={k.value}>
              <CardContent className="flex h-full flex-col gap-3 pt-6">
                <div>
                  <p className="font-semibold text-foreground">{k.label}</p>
                  <p className="text-sm text-muted-foreground">{k.text}</p>
                </div>
                <Button
                  className="mt-auto w-fit"
                  size="sm"
                  disabled={xlsx.isPending}
                  onClick={() => xlsx.mutate(k.value)}
                >
                  <FileSpreadsheet className="mr-1.5 h-4 w-4" />
                  Выгрузить Excel
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-secondary">Быстрые отчёты CSV</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {CSV_KINDS.map((k) => (
            <Card key={k.value}>
              <CardContent className="flex items-center justify-between gap-4 pt-6">
                <p className="font-medium text-foreground">{k.label}</p>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={csv.isPending}
                  onClick={() => csv.mutate(k.value)}
                >
                  <Download className="mr-1.5 h-4 w-4" />
                  CSV
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
