import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Trophy } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  allAchievementsQuery,
  myAchievementsQuery,
  myAttemptsQuery,
  myProgressQuery,
} from "@/lib/lms-queries";
import { myAssignmentsQuery } from "@/lib/account-queries";
import { EmptyState, InlineLoading } from "@/components/states";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/development")({
  head: () => ({
    meta: [
      { title: "Развитие — Академия «Людиновокабель»" },
      { name: "description", content: "История обучения, квалификационные этапы и достижения сотрудника." },
      { property: "og:title", content: "Развитие сотрудника" },
      { property: "og:description", content: "История программ, аттестаций и достижений." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DevelopmentPage,
});

function DevelopmentPage() {
  const { user } = useAuth();
  const assignments = useQuery(myAssignmentsQuery(user?.id));
  const attempts = useQuery(myAttemptsQuery(user?.id));
  const progress = useQuery(myProgressQuery(user?.id));
  const earned = useQuery(myAchievementsQuery(user?.id));
  const all = useQuery(allAchievementsQuery);

  if (assignments.isLoading || attempts.isLoading) return <InlineLoading />;

  const earnedIds = new Set((earned.data ?? []).map((e) => e.achievement_id));
  const completedStages = (progress.data ?? []).filter((p) => p.status === "completed").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-secondary">Развитие</h1>
        <p className="mt-2 text-muted-foreground">
          История обучения сохраняется при смене должности и подразделения.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>История обучения</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">Завершено этапов обучения: {completedStages}</p>
          {(assignments.data ?? []).length === 0 ? (
            <EmptyState title="Программы не назначались" />
          ) : (
            (assignments.data ?? []).map((a) => (
              <div
                key={a.id}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3"
              >
                <span className="font-medium">
                  {a.courses?.title ?? a.professions?.name ?? "Программа обучения"}
                </span>
                <span className="text-muted-foreground">
                  назначено{" "}
                  {a.assigned_at ? new Date(a.assigned_at).toLocaleDateString("ru-RU") : "—"}
                </span>
                <Badge variant={a.status === "completed" ? "default" : "secondary"}>
                  {a.status === "completed" ? "Завершено" : "В работе"}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Квалификационные этапы</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {(attempts.data ?? []).filter((a) => a.status === "finished").length === 0 ? (
            <p className="text-muted-foreground">Аттестации ещё не проходили.</p>
          ) : (
            (attempts.data ?? [])
              .filter((a) => a.status === "finished")
              .map((a) => (
                <div key={a.id} className="flex flex-wrap items-center gap-3">
                  <span>{new Date(a.started_at).toLocaleDateString("ru-RU")}</span>
                  <span className="font-medium">
                    {(a as { professions?: { name?: string } }).professions?.name ?? "Аттестация"}
                  </span>
                  <Badge variant={a.passed ? "default" : "destructive"}>
                    {Number(a.score_percent ?? 0)}%
                  </Badge>
                </div>
              ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Достижения</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(all.data ?? []).map((a) => (
            <div
              key={a.id}
              className={`flex items-start gap-3 rounded-lg border p-4 ${
                earnedIds.has(a.id) ? "border-primary bg-primary/5" : "border-border opacity-70"
              }`}
            >
              <Trophy
                className={`h-5 w-5 ${earnedIds.has(a.id) ? "text-primary" : "text-muted-foreground"}`}
              />
              <div>
                <p className="text-sm font-medium">{a.title}</p>
                {a.description ? (
                  <p className="text-xs text-muted-foreground">{a.description}</p>
                ) : null}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}