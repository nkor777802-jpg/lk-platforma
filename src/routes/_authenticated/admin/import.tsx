import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Download, FileSpreadsheet, Upload } from "lucide-react";
import { IMPORT_KINDS, type ImportKind } from "@/lib/import-schemas";
import {
  commitImportFile,
  getImportTemplate,
  listImportRuns,
  previewImport,
  type ImportRunRow,
} from "@/lib/import.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InlineLoading } from "@/components/states";

export const Route = createFileRoute("/_authenticated/admin/import")({
  component: ImportCenterPage,
});

interface ImportIssue {
  sheet: string;
  row: number | null;
  column: string | null;
  value: string | null;
  message: string;
  fix?: string;
  level: "error" | "warning";
}

interface ImportReport {
  kind: string;
  fileName: string;
  totalRows: number;
  created: number;
  updated: number;
  unchanged: number;
  skipped: number;
  issues: ImportIssue[];
  preview: { sheet: string; rows: Record<string, string>[] }[];
  committed: boolean;
  status: "success" | "warning" | "error";
  credentials?: { fullName: string; email: string; password: string }[];
}

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

async function fileToBase64(file: File): Promise<string> {
  const buffer = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  for (let i = 0; i < buffer.length; i += 1) binary += String.fromCharCode(buffer[i] as number);
  return btoa(binary);
}

function downloadCredentialsCsv(rows: { fullName: string; email: string; password: string }[]) {
  const csv = [
    ["ФИО", "Логин (email)", "Пароль", "Роль"],
    ...rows.map((r) => [r.fullName, r.email, r.password, "Сотрудник"]),
  ]
    .map((line) => line.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(";"))
    .join("\r\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Учетные_данные_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function ImportCenterPage() {
  const qc = useQueryClient();
  const runs = useQuery({ queryKey: ["admin", "import-runs"], queryFn: () => listImportRuns() });
  const template = useServerFn(getImportTemplate);
  const preview = useServerFn(previewImport);
  const commit = useServerFn(commitImportFile);

  const [active, setActive] = useState<ImportKind | null>(null);
  const [file, setFile] = useState<{ name: string; base64: string } | null>(null);
  const [report, setReport] = useState<ImportReport | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const templateMutation = useMutation({
    mutationFn: (kind: string) => template({ data: { kind } }),
    onSuccess: (d) => downloadBase64(d.base64, d.fileName),
    onError: (e: Error) => toast.error(e.message),
  });

  const previewMutation = useMutation({
    mutationFn: () =>
      preview({ data: { kind: active!.id, fileName: file!.name, base64: file!.base64 } }),
    onSuccess: (d) => setReport(d as ImportReport),
    onError: (e: Error) => toast.error(e.message),
  });

  const commitMutation = useMutation({
    mutationFn: () =>
      commit({ data: { kind: active!.id, fileName: file!.name, base64: file!.base64 } }),
    onSuccess: (d) => {
      const r = d as ImportReport;
      setReport(r);
      if (r.committed) {
        toast.success(`Импорт выполнен: создано ${r.created}, обновлено ${r.updated}`);
        if (r.credentials?.length) downloadCredentialsCsv(r.credentials);
        void qc.invalidateQueries({ queryKey: ["admin"] });
      } else {
        toast.error("Импорт не выполнен: в файле есть ошибки");
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const lastRun = (kind: string) =>
    (runs.data as ImportRunRow[] | undefined)?.find((r) => r.kind === kind);

  const openKind = (kind: ImportKind) => {
    setActive(kind);
    setFile(null);
    setReport(null);
  };

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    setFile({ name: f.name, base64: await fileToBase64(f) });
    setReport(null);
  };

  const errors = report?.issues.filter((i) => i.level === "error") ?? [];
  const warnings = report?.issues.filter((i) => i.level === "warning") ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary">Импорт данных</h1>
        <p className="text-sm text-muted-foreground">
          Единая точка загрузки структурированных данных платформы. Для каждого типа доступен
          официальный шаблон Excel, предварительная проверка и протокол результата.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {IMPORT_KINDS.map((kind) => {
          const run = lastRun(kind.id);
          return (
            <Card key={kind.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileSpreadsheet className="h-4 w-4 text-primary" />
                  {kind.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-3 text-sm">
                <p className="text-muted-foreground">{kind.description}</p>
                <p className="text-xs text-muted-foreground">
                  Листы: {kind.sheets.map((s) => s.name).join(", ")}
                </p>
                <p className="text-xs text-muted-foreground">Используется: {kind.target}</p>
                <p className="text-xs text-muted-foreground">
                  {run
                    ? `Последний импорт: ${new Date(run.created_at).toLocaleString("ru-RU")} · ${run.actor_name ?? "—"}`
                    : "Импортов ещё не было"}
                </p>
                <div className="mt-auto flex flex-wrap gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => templateMutation.mutate(kind.id)}
                  >
                    <Download className="mr-1.5 h-4 w-4" />
                    Шаблон Excel
                  </Button>
                  <Button size="sm" onClick={() => openKind(kind)}>
                    <Upload className="mr-1.5 h-4 w-4" />
                    Загрузить файл
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">История импорта</CardTitle>
        </CardHeader>
        <CardContent>
          {runs.isPending ? (
            <InlineLoading />
          ) : (runs.data as ImportRunRow[] | undefined)?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="whitespace-nowrap px-3 py-2">Дата</th>
                    <th className="whitespace-nowrap px-3 py-2">Тип</th>
                    <th className="whitespace-nowrap px-3 py-2">Файл</th>
                    <th className="whitespace-nowrap px-3 py-2">Пользователь</th>
                    <th className="whitespace-nowrap px-3 py-2">Строк</th>
                    <th className="whitespace-nowrap px-3 py-2">Создано</th>
                    <th className="whitespace-nowrap px-3 py-2">Обновлено</th>
                    <th className="whitespace-nowrap px-3 py-2">Пропущено</th>
                    <th className="whitespace-nowrap px-3 py-2">Ошибки</th>
                    <th className="whitespace-nowrap px-3 py-2">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {(runs.data as ImportRunRow[]).map((r) => (
                    <tr key={r.id} className="border-t border-border">
                      <td className="px-3 py-2">{new Date(r.created_at).toLocaleString("ru-RU")}</td>
                      <td className="px-3 py-2">{r.kind}</td>
                      <td className="px-3 py-2">{r.file_name}</td>
                      <td className="px-3 py-2">{r.actor_name ?? "—"}</td>
                      <td className="px-3 py-2">{r.total_rows}</td>
                      <td className="px-3 py-2">{r.created_rows}</td>
                      <td className="px-3 py-2">{r.updated_rows}</td>
                      <td className="px-3 py-2">{r.skipped_rows}</td>
                      <td className="px-3 py-2">{r.error_rows}</td>
                      <td className="px-3 py-2">
                        <Badge variant={r.status === "success" ? "secondary" : "outline"}>
                          {r.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Импортов пока не было.</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={active !== null} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Импорт: {active?.label}</DialogTitle>
          </DialogHeader>

          {active ? (
            <div className="space-y-4 text-sm">
              {active.sheets.map((s) => (
                <div key={s.name} className="rounded-md border border-border p-3">
                  <p className="font-medium text-foreground">Лист «{s.name}»</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Обязательные колонки: {s.required.join(", ")}
                  </p>
                  {s.optional.length > 0 ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Дополнительные: {s.optional.join(", ")}
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs text-muted-foreground">
                    Пример: {Object.entries(s.example).slice(0, 4).map(([k, v]) => `${k}=${v}`).join("; ")}
                  </p>
                </div>
              ))}

              <div className="flex flex-wrap items-center gap-2 [&>button]:flex-1 sm:[&>button]:flex-none">
                <input
                  ref={inputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => void onFile(e.target.files?.[0])}
                />
                <Button variant="outline" onClick={() => inputRef.current?.click()}>
                  Выбрать файл
                </Button>
                <span className="w-full break-all text-xs text-muted-foreground sm:w-auto">
                  {file ? file.name : "Файл не выбран"}
                </span>
                <Button
                  variant="outline"
                  disabled={!file || previewMutation.isPending}
                  onClick={() => previewMutation.mutate()}
                >
                  Проверить
                </Button>
                <Button
                  disabled={!report || errors.length > 0 || commitMutation.isPending}
                  onClick={() => commitMutation.mutate()}
                >
                  Подтвердить импорт
                </Button>
              </div>

              {report ? (
                <div className="space-y-3 rounded-md border border-border p-3">
                  <p className="font-medium text-foreground">
                    {report.committed ? "Импорт выполнен" : "Предварительная проверка"}
                  </p>
                  {report.credentials?.length ? (
                    <div className="flex flex-wrap items-center gap-2 rounded-md border border-border p-2 text-xs">
                      <span className="text-muted-foreground">
                        Созданы учётные записи ({report.credentials.length}), роль «Сотрудник».
                        Файл с логинами и паролями выгружен автоматически.
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadCredentialsCsv(report.credentials ?? [])}
                      >
                        <Download className="mr-1.5 h-4 w-4" />
                        Скачать логины и пароли
                      </Button>
                    </div>
                  ) : null}
                  <pre className="whitespace-pre-wrap break-words rounded bg-muted p-3 text-xs">
{`Файл: ${report.fileName}

Строк найдено: ${report.totalRows}
Новые записи: ${report.created}
Будут обновлены: ${report.updated}
Без изменений: ${report.unchanged}
Пропущено: ${report.skipped}
Предупреждения: ${warnings.length}
Ошибки: ${errors.length}

${report.committed ? "Данные записаны в базу." : "Импорт пока не выполнен."}`}
                  </pre>

                  {report.issues.length > 0 ? (
                    <ul className="space-y-2">
                      {report.issues.slice(0, 50).map((i, idx) => (
                        <li
                          key={idx}
                          className={
                            i.level === "error"
                              ? "rounded border border-destructive/40 bg-destructive/5 p-2 text-xs"
                              : "rounded border border-border p-2 text-xs text-muted-foreground"
                          }
                        >
                          <span className="font-medium">
                            Лист: {i.sheet}
                            {i.row ? ` · Строка: ${i.row}` : ""}
                            {i.column ? ` · Колонка: ${i.column}` : ""}
                          </span>
                          {i.value ? <span> · Значение: {i.value}</span> : null}
                          <div>{i.message}</div>
                          {i.fix ? <div className="opacity-80">Рекомендация: {i.fix}</div> : null}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setActive(null)}>
              Закрыть
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
