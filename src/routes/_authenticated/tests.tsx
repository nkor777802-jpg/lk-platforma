import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { myAssignmentsQuery, testSettingsQuery } from "@/lib/account-queries";
import { myAttemptsQuery, myProfileQuery, professionsQuery } from "@/lib/lms-queries";
import { EmptyState, InlineLoading } from "@/components/states";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/tests")({
  head: () => ({
    meta: [
      { title: "Тесты — Академия «Людиновокабель»" },
      { name: "description", content: "Доступные тесты по профессии, попытки и условия допуска." },
      { property: "og:title", content: "Доступные тесты" },
      { property: "og:description", content: "Тестирование по профессии и назначенным программам." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TestsPage,
});

function TestsPage() {
  const { user } = useAuth();
  const profile = useQuery(myProfileQuery(user?.id));
  const assignments = useQuery(myAssignmentsQuery(user?.id));
  const attempts = useQuery(myAttemptsQuery(user?.id));
  const professions = useQuery(professionsQuery);
  const settings = useQuery(testSettingsQuery(profile.data?.profession_id));

  if (profile.isLoading || assignments.isLoading) return <InlineLoading />;

  const ids = new Set<string>();
  if (profile.data?.profession_id) ids.add(profile.data.profession_id);
  for (const a of assignments.data ?? []) if (a.profession_id) ids.add(a.profession_id);
  const list = (professions.data ?? []).filter((p) => ids.has(p.id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-secondary">Тесты</h1>
        <p className="mt-2 text-muted-foreground">
          Тестирование доступно по вашей профессии и назначенным программам.
        </p>
      </div>

      {list.length === 0 ? (
        <EmptyState
          title="Доступных тестов нет"
          description="Тест появится после назначения профессии или программы обучения."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((p) => {
            const used = (attempts.data ?? []).filter((a) => a.profession_id === p.id).length;
            const max = settings.data?.max_attempts ?? 0;
            const exhausted = max > 0 && used >= max && !(settings.data?.allow_retry ?? true);
            return (
              <Card key={p.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{p.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Попыток использовано: {used}</Badge>
                    {max > 0 ? <Badge variant="outline">Максимум: {max}</Badge> : null}
                    {settings.data?.time_limit_minutes ? (
                      <Badge variant="outline">{settings.data.time_limit_minutes} мин</Badge>
                    ) : null}
                    {settings.data?.retry_interval_hours ? (
                      <Badge variant="outline">
                        Интервал между попытками: {settings.data.retry_interval_hours} ч
                      </Badge>
                    ) : null}
                  </div>
                  <Button asChild disabled={exhausted}>
                    <Link to="/test/$professionId" params={{ professionId: p.id }}>
                      {exhausted ? "Попытки исчерпаны" : "Начать тест"}
                    </Link>
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