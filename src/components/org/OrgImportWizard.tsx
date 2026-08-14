import { useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, FileSpreadsheet, Info, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InlineLoading } from "@/components/states";
import {
  createOrgDraft,
  inspectStaffingFile,
  previewStaffingImport,
} from "@/lib/org.functions";
import { MAPPING_FIELDS_CLIENT, type ClientMapping } from "@/lib/org-mapping";

type Step = "upload" | "mapping" | "validation" | "compare" | "preview" | "done";

const STEPS: { id: Step; label: string }[] = [
  { id: "upload", label: "Загрузка" },
  { id: "mapping", label: "Сопоставление" },
  { id: "validation", label: "Валидация" },
  { id: "compare", label: "Сравнение" },
  { id: "preview", label: "Предпросмотр" },
  { id: "done", label: "Публикация" },
];

interface Issue {
  level: "ERROR" | "WARNING" | "INFO";
  row: number | null;
  message: string;
  value?: string | null;
}

interface PreviewResult {
  sheetName: string;
  mapping: ClientMapping;
  stats: Record<string, number>;
  issues: Issue[];
  units: {
    key: string;
    parentKey: string | null;
    name: string;
    level: number;
    unitType: string | null;
    managerName: string | null;
    planned: number;
    actual: number;
    vacant: number;
    reviewStatus: string;
  }[];
  diff: {
    hasBaseline: boolean;
    baselineTitle: string | null;
    entries: { type: string; scope: string; name: string; detail: string }[];
    summary: Record<string, number>;
  };
}

async function fileToBase64(file: File): Promise<string> {
  const buffer = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  const chunk = 8192;
  for (let i = 0; i < buffer.length; i += chunk) {
    binary += String.fromCharCode(...buffer.subarray(i, i + chunk));
  }
  return btoa(binary);
}

const levelBadge = (level: Issue["level"]) =>
  level === "ERROR" ? (
    <Badge className="bg-destructive text-destructive-foreground">ERROR</Badge>
  ) : level === "WARNING" ? (
    <Badge className="bg-primary text-primary-foreground">WARNING</Badge>
  ) : (
    <Badge variant="outline">INFO</Badge>
  );

export function OrgImportWizard({ onPublished }: { onPublished?: () => void }) {
  const qc = useQueryClient();
  const inspect = useServerFn(inspectStaffingFile);
  const preview = useServerFn(previewStaffingImport);
  const draft = useServerFn(createOrgDraft);

  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<{ name: string; base64: string } | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [headPreview, setHeadPreview] = useState<string[][]>([]);
  const [columnCount, setColumnCount] = useState(13);
  const [mapping, setMapping] = useState<ClientMapping | null>(null);
  const [result, setResult] = useState<PreviewResult | null>(null);
  const [title, setTitle] = useState(`Штатная расстановка от ${new Date().toLocaleDateString("ru-RU")}`);
  const [profileName, setProfileName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const inspectMutation = useMutation({
    mutationFn: async (f: File) => {
      const base64 = await fileToBase64(f);
      const res = await inspect({ data: { base64 } });
      return { base64, name: f.name, res };
    },
    onSuccess: ({ base64, name, res }) => {
      setFile({ name, base64 });
      setSheetNames(res.sheetNames);
      setHeadPreview(res.headPreview);
      setColumnCount(res.columnCount);
      const saved = (res.profiles ?? []).find((p) => p.is_default)?.mapping as ClientMapping | undefined;
      setMapping({ ...(res.mapping as ClientMapping), ...(saved ?? {}) });
      setStep("mapping");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const previewMutation = useMutation({
    mutationFn: () => preview({ data: { base64: file!.base64, mapping: mapping as never } }),
    onSuccess: (d) => {
      setResult(d as PreviewResult);
      setStep("validation");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const draftMutation = useMutation({
    mutationFn: () =>
      draft({
        data: {
          base64: file!.base64,
          fileName: file!.name,
          title,
          mapping: mapping as never,
          saveProfileName: profileName.trim() || null,
        },
      }),
    onSuccess: () => {
      toast.success("Черновик версии создан. Опубликуйте его во вкладке «Версии».");
      qc.invalidateQueries({ queryKey: ["org"] });
      setStep("done");
      onPublished?.();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const errors = useMemo(() => (result?.issues ?? []).filter((i) => i.level === "ERROR"), [result]);
  const warnings = useMemo(() => (result?.issues ?? []).filter((i) => i.level === "WARNING"), [result]);
  const infos = useMemo(() => (result?.issues ?? []).filter((i) => i.level === "INFO"), [result]);

  const setMappingField = (key: keyof ClientMapping, value: string) => {
    setMapping((prev) => {
      if (!prev) return prev;
      if (key === "unitColumns") {
        const cols = value
          .split(",")
          .map((s) => Number(s.trim()))
          .filter((n) => Number.isInteger(n) && n >= 0);
        return { ...prev, unitColumns: cols };
      }
      if (key === "headerRows") return { ...prev, headerRows: Number(value) || 0 };
      return { ...prev, [key]: value === "none" ? null : Number(value) } as ClientMapping;
    });
  };

  return (
    <div className="space-y-4">
      <ol className="flex flex-wrap gap-2 text-xs">
        {STEPS.map((s, i) => {
          const activeIndex = STEPS.findIndex((x) => x.id === step);
          const state = i < activeIndex ? "done" : i === activeIndex ? "active" : "todo";
          return (
            <li
              key={s.id}
              className={[
                "rounded-full border px-3 py-1",
                state === "active"
                  ? "border-secondary bg-secondary text-secondary-foreground"
                  : state === "done"
                    ? "border-secondary/40 text-secondary"
                    : "border-border text-muted-foreground",
              ].join(" ")}
            >
              {i + 1}. {s.label}
            </li>
          );
        })}
      </ol>

      {step === "upload" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Загрузка файла штатной расстановки</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Формат .xlsx. Менять рабочий файл не требуется — колонки определяются автоматически, при
              необходимости их можно поправить на следующем шаге.
            </p>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) inspectMutation.mutate(f);
                e.target.value = "";
              }}
            />
            <Button onClick={() => inputRef.current?.click()} disabled={inspectMutation.isPending}>
              <Upload className="mr-2 h-4 w-4" />
              Выбрать файл
            </Button>
            {inspectMutation.isPending ? <InlineLoading /> : null}
          </CardContent>
        </Card>
      ) : null}

      {step === "mapping" && mapping ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileSpreadsheet className="h-4 w-4" /> Сопоставление колонок — {file?.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1">
                <Label>Лист</Label>
                <Select
                  value={mapping.sheetName ?? sheetNames[0] ?? ""}
                  onValueChange={(v) => setMapping({ ...mapping, sheetName: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sheetNames.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Строк шапки</Label>
                <Input
                  type="number"
                  value={mapping.headerRows}
                  onChange={(e) => setMappingField("headerRows", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Колонки подразделений (уровни, через запятую)</Label>
                <Input
                  value={mapping.unitColumns.join(", ")}
                  onChange={(e) => setMappingField("unitColumns", e.target.value)}
                />
              </div>
              {MAPPING_FIELDS_CLIENT.map((f) => (
                <div key={f.key} className="space-y-1">
                  <Label>{f.label}</Label>
                  <Select
                    value={
                      mapping[f.key] === null || mapping[f.key] === undefined
                        ? "none"
                        : String(mapping[f.key])
                    }
                    onValueChange={(v) => setMappingField(f.key, v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— не используется —</SelectItem>
                      {Array.from({ length: columnCount }, (_, i) => (
                        <SelectItem key={i} value={String(i)}>
                          Колонка {i + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full text-xs">
                <tbody>
                  {headPreview.slice(0, 8).map((row, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      {Array.from({ length: columnCount }, (_, c) => (
                        <td key={c} className="max-w-[160px] truncate px-2 py-1 text-muted-foreground">
                          {row[c] ?? ""}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={() => previewMutation.mutate()} disabled={previewMutation.isPending}>
                Проверить файл
              </Button>
              <Button variant="outline" onClick={() => setStep("upload")}>
                Назад
              </Button>
              {previewMutation.isPending ? <InlineLoading /> : null}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {step !== "upload" && step !== "mapping" && result ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              ["Строк", result.stats["rows"]],
              ["Подразделений", result.stats["units"]],
              ["Должностей", result.stats["positions"]],
              ["Сотрудников", result.stats["people"]],
              ["Вакансий", result.stats["vacancies"]],
              ["Штат, ед.", result.stats["planned"]],
            ].map(([label, value]) => (
              <Card key={String(label)}>
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-lg font-semibold text-secondary">{String(value)}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {step === "validation" ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Валидация</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2 text-sm">
                  <Badge className="bg-destructive text-destructive-foreground">ERROR: {errors.length}</Badge>
                  <Badge className="bg-primary text-primary-foreground">WARNING: {warnings.length}</Badge>
                  <Badge variant="outline">INFO: {infos.length}</Badge>
                </div>
                <div className="max-h-72 space-y-1 overflow-auto">
                  {[...errors, ...warnings, ...infos].slice(0, 100).map((i, idx) => (
                    <div key={idx} className="flex flex-wrap items-center gap-2 rounded border border-border px-2 py-1 text-xs">
                      {levelBadge(i.level)}
                      <span className="text-muted-foreground">стр. {i.row ?? "—"}</span>
                      <span className="break-words">{i.message}</span>
                      {i.value ? <span className="text-muted-foreground break-words">({i.value})</span> : null}
                    </div>
                  ))}
                  {result.issues.length === 0 ? (
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4" /> Замечаний нет.
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => setStep("compare")} disabled={errors.length > 0}>
                    Далее: сравнение
                  </Button>
                  <Button variant="outline" onClick={() => setStep("mapping")}>
                    Изменить сопоставление
                  </Button>
                  {errors.length > 0 ? (
                    <span className="flex items-center gap-1 text-xs text-destructive">
                      <AlertTriangle className="h-3.5 w-3.5" /> Ошибки блокируют публикацию
                    </span>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {step === "compare" ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Сравнение с действующей версией{result.diff.baselineTitle ? ` «${result.diff.baselineTitle}»` : ""}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!result.diff.hasBaseline ? (
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Info className="h-4 w-4" /> Действующей версии нет — это будет первая структура.
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-2 text-sm">
                  <Badge variant="secondary">ADDED: {result.diff.summary["ADDED"] ?? 0}</Badge>
                  <Badge variant="secondary">CHANGED: {result.diff.summary["CHANGED"] ?? 0}</Badge>
                  <Badge variant="secondary">REMOVED: {result.diff.summary["REMOVED"] ?? 0}</Badge>
                </div>
                <div className="max-h-72 space-y-1 overflow-auto">
                  {result.diff.entries.slice(0, 200).map((e, idx) => (
                    <div key={idx} className="flex flex-wrap items-center gap-2 rounded border border-border px-2 py-1 text-xs">
                      <Badge variant="outline">{e.type}</Badge>
                      <span className="font-medium break-words">{e.name}</span>
                      <span className="text-muted-foreground break-words">{e.detail}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => setStep("preview")}>Далее: предпросмотр</Button>
                  <Button variant="outline" onClick={() => setStep("validation")}>
                    Назад
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {step === "preview" ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Предпросмотр структуры</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="max-h-80 overflow-auto rounded border border-border p-2">
                  {result.units.map((u) => (
                    <div
                      key={u.key}
                      className="flex flex-wrap items-center gap-2 py-0.5 text-xs"
                      style={{ paddingLeft: `${u.level * 14}px` }}
                    >
                      <span className="font-medium text-secondary break-words">{u.name}</span>
                      {u.unitType ? <span className="text-muted-foreground">{u.unitType}</span> : null}
                      <span className="text-muted-foreground">
                        штат {u.planned} · факт {u.actual}
                        {u.vacant > 0 ? ` · вакансий ${u.vacant}` : ""}
                      </span>
                      {u.managerName ? <span className="text-muted-foreground">рук.: {u.managerName}</span> : null}
                      {u.reviewStatus !== "OK" ? <Badge variant="outline">Проверить</Badge> : null}
                    </div>
                  ))}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label>Название версии</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Сохранить профиль сопоставления (необязательно)</Label>
                    <Input
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      placeholder="Например: ШР ЛК стандарт"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => draftMutation.mutate()} disabled={draftMutation.isPending}>
                    Создать черновик версии
                  </Button>
                  <Button variant="outline" onClick={() => setStep("compare")}>
                    Назад
                  </Button>
                  {draftMutation.isPending ? <InlineLoading /> : null}
                </div>
                <p className="text-xs text-muted-foreground">
                  Новый файл не изменяет действующую структуру автоматически: публикация выполняется вручную
                  во вкладке «Версии» с указанием даты начала действия.
                </p>
              </CardContent>
            </Card>
          ) : null}

          {step === "done" ? (
            <Card>
              <CardContent className="space-y-3 p-4">
                <p className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-secondary" /> Черновик версии создан.
                </p>
                <Button variant="outline" onClick={() => { setStep("upload"); setResult(null); setFile(null); }}>
                  Загрузить ещё файл
                </Button>
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
