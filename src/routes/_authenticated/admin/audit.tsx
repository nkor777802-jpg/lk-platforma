import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { adminAuditQuery } from "@/lib/admin-queries";
import { AdminTable } from "@/components/admin/AdminTable";
import { ErrorState, InlineLoading } from "@/components/states";

export const Route = createFileRoute("/_authenticated/admin/audit")({
  component: AuditPage,
});

type Row = Record<string, unknown>;

function AuditPage() {
  const query = useQuery(adminAuditQuery);

  if (query.isPending) return <InlineLoading />;
  if (query.isError) return <ErrorState message="Не удалось загрузить журнал действий." />;

  const rows = (query.data ?? []) as Row[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary">Журнал действий</h1>
        <p className="text-sm text-muted-foreground">
          Кто, когда и что изменил: создание, редактирование, архивирование, импорт и корректировки.
        </p>
      </div>

      <AdminTable
        rows={rows}
        searchKeys={["action", "entity", "actor_name"]}
        columns={[
          {
            key: "created_at",
            label: "Дата",
            render: (r) =>
              r["created_at"] ? new Date(String(r["created_at"])).toLocaleString("ru-RU") : "—",
          },
          {
            key: "actor",
            label: "Пользователь",
            render: (r) =>
              (r["profiles"] as { full_name?: string } | null)?.full_name ??
              String(r["actor_name"] ?? "—"),
          },
          { key: "action", label: "Действие" },
          { key: "entity", label: "Объект" },
          {
            key: "details",
            label: "Детали",
            render: (r) => (r["details"] ? JSON.stringify(r["details"]).slice(0, 120) : "—"),
          },
        ]}
      />
    </div>
  );
}
