import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CalendarCheck, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { myAssignmentsQuery } from "@/lib/account-queries";
import { myOnboardingQuery } from "@/lib/onboarding-queries";
import { trainingTypeLabel } from "@/lib/training-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Task = {
  key: string;
  title: string;
  marker: string;
  due: string | null;
  overdue: boolean;
  to: "/onboarding" | "/learning" | "/tests";
};

/** Агрегатор «Что сделать сегодня?»: адаптация + назначенное обучение. */
export function TodayTasks() {
  const { user } = useAuth();
  const assignments = useQuery(myAssignmentsQuery(user?.id));
  const onboarding = useQuery(myOnboardingQuery);

  const today = new Date(new Date().toDateString());
  const tasks: Task[] = [];

  for (const item of onboarding.data?.items ?? []) {
    if (item.status === "completed" || item.status === "confirmed") continue;
    tasks.push({
      key: `onb-${item.id}`,
      title: item.title,
      marker: "Адаптация",
      due: item.due_date,
      overdue: Boolean(item.due_date && new Date(item.due_date) < today),
      to: "/onboarding",
    });
  }

  for (const a of assignments.data ?? []) {
    if (a.status === "completed") continue;
    tasks.push({
      key: `asg-${a.id}`,
      title: a.courses?.title ?? a.professions?.name ?? "Программа обучения",
      marker: trainingTypeLabel(a.training_type),
      due: a.due_date,
      overdue: Boolean(a.due_date && new Date(a.due_date) < today),
      to: "/learning",
    });
  }

  const sorted = tasks
    .sort((a, b) => {
      if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
      if (!a.due) return 1;
      if (!b.due) return -1;
      return a.due < b.due ? -1 : 1;
    })
    .slice(0, 6);

  const program = onboarding.data?.program;
  const showNewcomer = Boolean(program) && program?.status !== "completed";

  return (
    <div className="space-y-4">
      {showNewcomer ? (
        <Card className="border-primary bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Sparkles className="h-5 w-5" /> Я Новичок
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Программа адаптации «{program?.template_name}» — пройдите шаги первых дней работы.
            </p>
            <Button asChild size="sm">
              <Link to="/onboarding">Перейти к адаптации</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5" /> Что сделать сегодня?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {sorted.length === 0 ? (
            <p className="text-muted-foreground">Актуальных задач нет — всё выполнено.</p>
          ) : (
            sorted.map((t) => (
              <div key={t.key} className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  {t.overdue ? <AlertTriangle className="h-4 w-4 text-destructive" /> : null}
                  <span className="font-medium">{t.title}</span>
                  <Badge variant="secondary">{t.marker}</Badge>
                  {t.due ? (
                    <Badge variant={t.overdue ? "destructive" : "outline"}>
                      до {new Date(t.due).toLocaleDateString("ru-RU")}
                    </Badge>
                  ) : null}
                </div>
                <Button asChild size="sm" variant="ghost">
                  <Link to={t.to}>Открыть</Link>
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
