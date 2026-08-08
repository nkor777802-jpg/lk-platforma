import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, ClipboardCheck, GraduationCap, Trophy } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  myAchievementsQuery,
  myAttemptsQuery,
  myProfileQuery,
  myProgressQuery,
  professionsQuery,
} from "@/lib/lms-queries";
import { myAssignmentsQuery, myNotificationsQuery } from "@/lib/account-queries";
import { EmptyState, InlineLoading } from "@/components/states";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Главная — Академия «Людиновокабель»" },
      { name: "description", content: "Личная сводка обучения, прогресс и назначенные программы." },
      { property: "og:title", content: "Главная — Академия «Людиновокабель»" },
      { property: "og:description", content: "Личная сводка обучения и прогресс сотрудника." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useAuth();
  const profile = useQuery(myProfileQuery(user?.id));
  const attempts = useQuery(myAttemptsQuery(user?.id));
  const progress = useQuery(myProgressQuery(user?.id));
  const achievements = useQuery(myAchievementsQuery(user?.id));
  const professions = useQuery(professionsQuery);
  const assignments = useQuery(myAssignmentsQuery(user?.id));
  const notifications = useQuery(myNotificationsQuery(user?.id));

  if (profile.isLoading) return <InlineLoading />;

  const myProfession = professions.data?.find((p) => p.id === profile.data?.profession_id);
  const completed = (progress.data ?? []).filter((p) => p.status === "completed").length;
  const totalProgress = progress.data?.length ?? 0;
  const percent = totalProgress ? Math.round((completed / totalProgress) * 100) : 0;
  const lastAttempt = attempts.data?.[0];
  const today = new Date(new Date().toDateString());
  const active = (assignments.data ?? []).filter((a) => a.status !== "completed");
  const upcoming = active
    .filter((a) => a.due_date)
    .sort((a, b) => (a.due_date! < b.due_date! ? -1 : 1))
    .slice(0, 5);
  const unread = (notifications.data ?? []).filter((n) => !n.is_read).slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-secondary">
          Здравствуйте, {profile.data?.full_name ?? user?.email}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {myProfession ? `Профессия: ${myProfession.name}` : "Профессия не назначена"}
          {profile.data?.grade ? ` · разряд ${profile.data.grade}` : ""}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={BookOpen} label="Изучено материалов" value={String(completed)} />
        <StatCard icon={ClipboardCheck} label="Попыток тестирования" value={String(attempts.data?.length ?? 0)} />
        <StatCard
          icon={GraduationCap}
          label="Последний результат"
          value={lastAttempt ? `${Number(lastAttempt.score_percent ?? 0)}%` : "—"}
        />
        <StatCard icon={Trophy} label="Достижений" value={String(achievements.data?.length ?? 0)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Прогресс обучения</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={percent} />
          <p className="text-sm text-muted-foreground">
            Завершено {completed} из {totalProgress || 0} этапов
          </p>
          {myProfession ? (
            <Button asChild>
              <Link to="/professions/$slug" params={{ slug: myProfession.slug ?? myProfession.id }}>
                Продолжить обучение
              </Link>
            </Button>
          ) : (
            <Button asChild variant="outline">
              <Link to="/professions">Выбрать профессию</Link>
            </Button>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-4 text-xl font-semibold text-secondary">История аттестаций</h2>
        {attempts.isLoading ? (
          <InlineLoading />
        ) : (attempts.data ?? []).length === 0 ? (
          <EmptyState
            title="Аттестаций пока нет"
            description="Изучите материалы профессии и пройдите итоговое тестирование."
          />
        ) : (
          <div className="space-y-3">
            {(attempts.data ?? []).slice(0, 5).map((a) => (
              <div
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4"
              >
                <div>
                  <p className="font-medium text-foreground">
                    {(a as { professions?: { name?: string } }).professions?.name ?? "Тест"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(a.started_at ?? Date.now()).toLocaleString("ru-RU")} · попытка №
                    {a.attempt_number}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-semibold">{Number(a.score_percent ?? 0)}%</span>
                  <Badge variant={a.passed ? "default" : "destructive"}>
                    {a.status === "in_progress" ? "В процессе" : a.passed ? "Аттестован" : "Не аттестован"}
                  </Badge>
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

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BookOpen;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <Icon className="h-6 w-6 text-primary" />
      <p className="mt-3 text-2xl font-bold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}