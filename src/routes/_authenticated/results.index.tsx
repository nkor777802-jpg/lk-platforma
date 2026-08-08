import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { myAttemptsQuery } from "@/lib/lms-queries";
import { EmptyState, InlineLoading } from "@/components/states";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/results/")({
  head: () => ({
    meta: [
      { title: "Результаты тестирования — Академия «Людиновокабель»" },
      { name: "description", content: "История попыток тестирования, проценты и итоги аттестации." },
      { property: "og:title", content: "Результаты тестирования" },
      { property: "og:description", content: "Даты, попытки, проценты и статусы аттестаций." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResultsListPage,
});

const GRADES: Record<string, string> = {
  confirmed: "Разряд подтверждён",
  lowered: "Разряд понижен",
  failed: "Не пройдено",
};

function ResultsListPage() {
  const { user } = useAuth();
  const attempts = useQuery(myAttemptsQuery(user?.id));

  if (attempts.isLoading) return <InlineLoading />;
  const items = attempts.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary sm:text-3xl">Результаты тестирования</h1>
        <p className="mt-2 text-muted-foreground">Все ваши попытки и итоги аттестации.</p>
      </div>

      {items.length === 0 ? (
        <EmptyState title="Результатов пока нет" description="Пройдите тест, чтобы увидеть итоги." />
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <Card key={a.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {(a as { professions?: { name?: string } }).professions?.name ?? "Тестирование"}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-3 text-sm">
                <span className="text-muted-foreground">
                  {new Date(a.started_at).toLocaleString("ru-RU")}
                </span>
                <Badge variant="outline">Попытка №{a.attempt_number}</Badge>
                <Badge variant="secondary">{Number(a.score_percent ?? 0)}%</Badge>
                {a.status !== "finished" ? (
                  <Badge variant="outline">Не завершено</Badge>
                ) : (
                  <Badge variant={a.passed ? "default" : "destructive"}>
                    {a.passed ? "Зачтено" : "Не зачтено"}
                  </Badge>
                )}
                {a.grade_result ? (
                  <span className="text-muted-foreground">{GRADES[a.grade_result] ?? a.grade_result}</span>
                ) : null}
                <Button asChild size="sm" variant="outline" className="ml-auto">
                  <Link to="/results/$attemptId" params={{ attemptId: a.id }}>
                    Подробнее
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}