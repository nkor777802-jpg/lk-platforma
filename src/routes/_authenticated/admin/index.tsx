import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { adminOverviewQuery } from "@/lib/admin-queries";
import { ErrorState, InlineLoading } from "@/components/states";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminOverviewPage,
});

function AdminOverviewPage() {
  const { data, isPending, isError, error } = useQuery(adminOverviewQuery);

  if (isPending) return <InlineLoading />;
  if (isError) return <ErrorState message={(error as Error).message} />;

  const cards = [
    { label: "Активные пользователи", value: data.users },
    { label: "Профессии", value: data.professions },
    { label: "Активные курсы", value: data.courses },
    { label: "Назначенные обучения", value: data.assignments },
    { label: "Просроченные обучения", value: data.overdue },
    { label: "Активные тесты", value: data.tests },
    { label: "Средний результат, %", value: data.avgScore },
    { label: "Производственные тренажёры", value: data.trainers },
    { label: "Рабочие центры", value: data.workCenters },
    { label: "Категории продукции", value: data.productCategories },
    { label: "Тестирования", value: data.attempts },
    { label: "Ошибки импорта", value: data.importErrors },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-secondary sm:text-3xl">Админ-панель</h1>
        <p className="mt-2 text-muted-foreground">
          Управление пользователями, обучением, тестированием и системными настройками.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{c.label}</p>
              <p className="mt-1 text-3xl font-bold text-secondary">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-secondary">Последние импорты</h2>
        {data.imports.length === 0 ? (
          <p className="text-sm text-muted-foreground">Импортов пока не было.</p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {data.imports.map((r) => (
              <li key={r.id} className="flex flex-wrap gap-2 px-4 py-3 text-sm">
                <span className="font-medium text-foreground">{r.file_name ?? r.kind}</span>
                <span className="text-muted-foreground">
                  создано {r.created_rows} · обновлено {r.updated_rows} · ошибок {r.error_rows}
                </span>
                <span className="ml-auto text-muted-foreground">
                  {r.actor_name ?? "—"} · {new Date(r.created_at).toLocaleString("ru-RU")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-secondary">Последние административные действия</h2>
        {data.recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">Действий пока нет.</p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {data.recent.map((r) => (
              <li key={r.id} className="flex flex-wrap gap-2 px-4 py-3 text-sm">
                <span className="font-medium text-foreground">{r.action}</span>
                <span className="text-muted-foreground">{r.entity}</span>
                <span className="ml-auto text-muted-foreground">
                  {r.actor_name ?? "—"} · {new Date(r.created_at).toLocaleString("ru-RU")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
