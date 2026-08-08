import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { adminSettingsQuery } from "@/lib/admin-queries";
import { savePlatformSetting } from "@/lib/admin.functions";
import { ErrorState, InlineLoading } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: SettingsPage,
});

interface SettingRow {
  key: string;
  value: unknown;
  description?: string | null;
}

function SettingsPage() {
  const qc = useQueryClient();
  const query = useQuery(adminSettingsQuery);
  const save = useServerFn(savePlatformSetting);
  const [draft, setDraft] = useState<Record<string, string>>({});

  const rows = (query.data ?? []) as SettingRow[];

  useEffect(() => {
    if (rows.length === 0) return;
    setDraft((prev) =>
      Object.keys(prev).length > 0
        ? prev
        : Object.fromEntries(
            rows.map((r) => [
              r.key,
              typeof r.value === "string" ? r.value : JSON.stringify(r.value, null, 2),
            ]),
          ),
    );
  }, [rows.length]);

  const mutation = useMutation({
    mutationFn: (payload: { key: string; value: unknown }) => save({ data: payload }),
    onSuccess: () => {
      toast.success("Настройка сохранена");
      void qc.invalidateQueries({ queryKey: ["admin", "settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (query.isPending) return <InlineLoading />;
  if (query.isError) return <ErrorState message="Не удалось загрузить настройки платформы." />;

  const submit = (key: string) => {
    const raw = draft[key] ?? "";
    let parsed: unknown = raw;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = raw;
    }
    mutation.mutate({ key, value: parsed });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary">Настройки платформы</h1>
        <p className="text-sm text-muted-foreground">
          Общие параметры системы обучения и аттестации. Значения в формате JSON или текста.
        </p>
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Настройки ещё не заданы.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {rows.map((row) => {
            const value = draft[row.key] ?? "";
            const multiline = value.length > 60 || value.includes("\n");
            return (
              <Card key={row.key}>
                <CardHeader>
                  <CardTitle className="text-base">{row.key}</CardTitle>
                  {row.description ? (
                    <p className="text-sm text-muted-foreground">{row.description}</p>
                  ) : null}
                </CardHeader>
                <CardContent className="space-y-3">
                  <Label className="sr-only" htmlFor={`setting-${row.key}`}>
                    {row.key}
                  </Label>
                  {multiline ? (
                    <Textarea
                      id={`setting-${row.key}`}
                      rows={6}
                      value={value}
                      onChange={(e) => setDraft((d) => ({ ...d, [row.key]: e.target.value }))}
                    />
                  ) : (
                    <Input
                      id={`setting-${row.key}`}
                      value={value}
                      onChange={(e) => setDraft((d) => ({ ...d, [row.key]: e.target.value }))}
                    />
                  )}
                  <Button size="sm" disabled={mutation.isPending} onClick={() => submit(row.key)}>
                    Сохранить
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
