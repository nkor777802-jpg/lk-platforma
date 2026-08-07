import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import {
  allAchievementsQuery,
  myAchievementsQuery,
  myAttemptsQuery,
  myProfileQuery,
} from "@/lib/lms-queries";
import { EmptyState, InlineLoading } from "@/components/states";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Личный кабинет — Академия «Людиновокабель»" },
      { name: "description", content: "Профиль сотрудника, история аттестаций и достижения." },
      { property: "og:title", content: "Личный кабинет сотрудника" },
      { property: "og:description", content: "Данные профиля, результаты тестов и достижения." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const profile = useQuery(myProfileQuery(user?.id));
  const attempts = useQuery(myAttemptsQuery(user?.id));
  const earned = useQuery(myAchievementsQuery(user?.id));
  const all = useQuery(allAchievementsQuery);

  if (profile.isLoading) return <InlineLoading />;
  const p = profile.data;
  const earnedIds = new Set((earned.data ?? []).map((e) => e.achievement_id));

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-secondary">Личный кабинет</h1>

      <Card>
        <CardHeader>
          <CardTitle>Данные сотрудника</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <Field label="ФИО" value={p?.full_name} />
          <Field label="Табельный номер" value={p?.personnel_number} />
          <Field label="E-mail" value={p?.email ?? user?.email} />
          <Field label="Должность" value={p?.position} />
          <Field
            label="Подразделение"
            value={(p as { departments?: { name?: string } } | null)?.departments?.name}
          />
          <Field
            label="Профессия"
            value={(p as { professions?: { name?: string } } | null)?.professions?.name}
          />
          <Field label="Разряд" value={p?.grade} />
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-4 text-xl font-semibold text-secondary">Достижения</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(all.data ?? []).map((a) => {
            const has = earnedIds.has(a.id);
            return (
              <div
                key={a.id}
                className={`rounded-xl border p-5 ${has ? "border-primary bg-primary/5" : "border-border bg-card opacity-60"}`}
              >
                <p className="font-semibold text-foreground">{a.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{a.description}</p>
                <Badge className="mt-3" variant={has ? "default" : "secondary"}>
                  {has ? "Получено" : "Не получено"}
                </Badge>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-xl font-semibold text-secondary">История аттестаций</h2>
        {(attempts.data ?? []).length === 0 ? (
          <EmptyState title="Попыток пока нет" />
        ) : (
          <div className="space-y-3">
            {(attempts.data ?? []).map((a) => (
              <div
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4"
              >
                <div>
                  <p className="font-medium text-foreground">
                    {(a as { professions?: { name?: string } }).professions?.name ?? "Тест"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(a.started_at ?? Date.now()).toLocaleString("ru-RU")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{Number(a.score_percent ?? 0)}%</span>
                  {a.status === "finished" ? (
                    <Button asChild size="sm" variant="outline">
                      <Link to="/results/$attemptId" params={{ attemptId: a.id }}>
                        Протокол
                      </Link>
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="font-medium text-foreground">{value || "—"}</p>
    </div>
  );
}