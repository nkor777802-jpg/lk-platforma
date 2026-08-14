import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { History, Rocket, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { InlineLoading } from "@/components/states";
import { orgVersionsQuery } from "@/lib/org-queries";
import { publishOrgVersion, rollbackOrgVersion } from "@/lib/org.functions";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Черновик",
  SCHEDULED: "Запланирована",
  ACTIVE: "Действующая",
  ARCHIVED: "Архив",
};

export function OrgVersionsPanel() {
  const qc = useQueryClient();
  const versions = useQuery(orgVersionsQuery());
  const publishFn = useServerFn(publishOrgVersion);
  const rollbackFn = useServerFn(rollbackOrgVersion);
  const [dates, setDates] = useState<Record<string, string>>({});

  const publish = useMutation({
    mutationFn: (v: { versionId: string; effectiveFrom: string }) => publishFn({ data: v }),
    onSuccess: (r) => {
      toast.success(r.status === "SCHEDULED" ? "Версия запланирована" : "Версия опубликована");
      qc.invalidateQueries({ queryKey: ["org"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rollback = useMutation({
    mutationFn: (versionId: string) => rollbackFn({ data: { versionId } }),
    onSuccess: () => {
      toast.success("Выполнен откат к выбранной версии");
      qc.invalidateQueries({ queryKey: ["org"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (versions.isLoading) return <InlineLoading />;
  const list = versions.data ?? [];
  if (list.length === 0)
    return <p className="text-sm text-muted-foreground">Версий пока нет — импортируйте штатную расстановку.</p>;

  return (
    <div className="space-y-3">
      {list.map((v) => {
        const stats = (v.stats ?? {}) as Record<string, number>;
        const today = new Date().toISOString().slice(0, 10);
        return (
          <Card key={v.id}>
            <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-secondary break-words">{v.title}</span>
                  <Badge variant={v.status === "ACTIVE" ? "default" : "outline"}>
                    {STATUS_LABEL[v.status] ?? v.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground break-words">
                  {v.source_file_name ?? "—"} · автор: {v.created_by_name ?? "—"} · действует с:{" "}
                  {v.effective_from ?? "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Подразделений: {stats["units"] ?? 0} · должностей: {stats["positions"] ?? 0} · сотрудников:{" "}
                  {stats["people"] ?? 0} · вакансий: {stats["vacancies"] ?? 0}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {v.status === "DRAFT" || v.status === "SCHEDULED" ? (
                  <>
                    <Input
                      type="date"
                      className="w-40"
                      value={dates[v.id] ?? v.effective_from ?? today}
                      onChange={(e) => setDates((p) => ({ ...p, [v.id]: e.target.value }))}
                    />
                    <Button
                      size="sm"
                      disabled={publish.isPending}
                      onClick={() =>
                        publish.mutate({
                          versionId: v.id,
                          effectiveFrom: dates[v.id] ?? v.effective_from ?? today,
                        })
                      }
                    >
                      <Rocket className="mr-2 h-4 w-4" /> Опубликовать
                    </Button>
                  </>
                ) : null}
                {v.status === "ARCHIVED" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={rollback.isPending}
                    onClick={() => rollback.mutate(v.id)}
                  >
                    <Undo2 className="mr-2 h-4 w-4" /> Откатиться
                  </Button>
                ) : null}
                <Badge variant="outline" className="gap-1">
                  <History className="h-3 w-3" />
                  {new Date(v.created_at).toLocaleDateString("ru-RU")}
                </Badge>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
