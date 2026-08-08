import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { commitImport, validateImport } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/admin/import")({
  component: ImportPage,
});

const KINDS = [
  { value: "questions", label: "Вопросы", columns: "text; topic; category; explanation; difficulty; is_common" },
  { value: "materials", label: "Учебные материалы", columns: "title; material_type; description; external_url; tags" },
  { value: "departments", label: "Подразделения", columns: "name; code; head_name; description" },
  { value: "positions", label: "Должности", columns: "name; code; description" },
  { value: "professions", label: "Профессии", columns: "name; code; slug; short_description; description; duration_hours" },
];

interface ValidationResult {
  ok: boolean;
  errors: string[];
  unknownColumns: string[];
  total: number;
  preview: Record<string, string>[];
}

function ImportPage() {
  const qc = useQueryClient();
  const [kind, setKind] = useState("questions");
  const [csv, setCsv] = useState("");
  const [result, setResult] = useState<ValidationResult | null>(null);
  const validate = useServerFn(validateImport);
  const commit = useServerFn(commitImport);

  const validateMutation = useMutation({
    mutationFn: () => validate({ data: { kind, csv } }),
    onSuccess: (data) => setResult(data as ValidationResult),
    onError: (e: Error) => toast.error(e.message),
  });

  const commitMutation = useMutation({
    mutationFn: () => commit({ data: { kind, csv } }),
    onSuccess: (data) => {
      toast.success(`Загружено записей: ${(data as { inserted: number }).inserted}`);
      setCsv("");
      setResult(null);
      void qc.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const active = KINDS.find((k) => k.value === kind);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setCsv(await file.text());
    setResult(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary">Импорт данных</h1>
        <p className="text-sm text-muted-foreground">
          Загрузка CSV-файлов. Перед сохранением выполняется проверка структуры и обязательных полей.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Источник данных</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 sm:max-w-sm">
            <Label>Тип импорта</Label>
            <Select value={kind} onValueChange={(v) => { setKind(v); setResult(null); }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {KINDS.map((k) => (
                  <SelectItem key={k.value} value={k.value}>
                    {k.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Колонки: {active?.columns}</p>
          </div>

          <div className="grid gap-2">
            <Label>CSV-файл</Label>
            <input
              type="file"
              accept=".csv,text/csv"
              className="text-sm"
              onChange={(e) => void onFile(e.target.files?.[0])}
            />
          </div>

          <div className="grid gap-2">
            <Label>Или вставьте содержимое CSV</Label>
            <Textarea
              rows={8}
              value={csv}
              onChange={(e) => { setCsv(e.target.value); setResult(null); }}
              placeholder="text;topic;difficulty"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={!csv || validateMutation.isPending}
              onClick={() => validateMutation.mutate()}
            >
              Проверить файл
            </Button>
            <Button
              disabled={!result?.ok || commitMutation.isPending}
              onClick={() => commitMutation.mutate()}
            >
              Загрузить в базу
            </Button>
          </div>
        </CardContent>
      </Card>

      {result ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Результат проверки: {result.ok ? "ошибок нет" : "найдены ошибки"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">Строк в файле: {result.total}</p>
            {result.unknownColumns.length > 0 ? (
              <p className="text-muted-foreground">
                Игнорируемые колонки: {result.unknownColumns.join(", ")}
              </p>
            ) : null}
            {result.errors.length > 0 ? (
              <ul className="list-disc space-y-1 pl-5 text-destructive">
                {result.errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            ) : null}
            {result.preview.length > 0 ? (
              <div className="overflow-x-auto rounded-md border border-border">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted">
                    <tr>
                      {Object.keys(result.preview[0] ?? {}).map((h) => (
                        <th key={h} className="px-3 py-2 font-medium">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.preview.map((row, i) => (
                      <tr key={i} className="border-t border-border">
                        {Object.keys(result.preview[0] ?? {}).map((h) => (
                          <td key={h} className="px-3 py-2">
                            {row[h]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
