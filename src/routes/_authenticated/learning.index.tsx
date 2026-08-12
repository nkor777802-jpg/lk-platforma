import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { myAssignmentsQuery, type AssignmentRow } from "@/lib/account-queries";
import { TRAINING_TYPE_OPTIONS, trainingTypeLabel } from "@/lib/training-types";
import { EmptyState, ErrorState, InlineLoading } from "@/components/states";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/learning/")({
  head: () => ({
    meta: [
      { title: "Мое обучение — Академия «Людиновокабель»" },
      { name: "description", content: "Назначенные программы обучения, сроки и прогресс сотрудника." },
      { property: "og:title", content: "Мое обучение" },
      { property: "og:description", content: "Назначенные, текущие, завершенные и просроченные программы." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LearningPage,
});

export function assignmentBucket(a: AssignmentRow) {
  const overdue =
    a.due_date && a.status !== "completed" && new Date(a.due_date) < new Date(new Date().toDateString());
  if (a.status === "completed") return "completed";
  if (overdue) return "overdue";
  if (a.status === "in_progress") return "in_progress";
  return "assigned";
}

const LABELS: Record<string, string> = {
  assigned: "Назначено",
  in_progress: "В процессе",
  completed: "Завершено",
  overdue: "Просрочено",
};

function LearningPage() {
  const { user } = useAuth();
  const assignments = useQuery(myAssignmentsQuery(user?.id));
  const [typeFilter, setTypeFilter] = useState("all");

  if (assignments.isLoading) return <InlineLoading />;
  if (assignments.error) return <ErrorState message={(assignments.error as Error).message} />;

  const all = assignments.data ?? [];
  const items = typeFilter === "all" ? all : all.filter((a) => a.training_type === typeFilter);
  const groups = {
    assigned: items.filter((a) => assignmentBucket(a) === "assigned"),
    in_progress: items.filter((a) => assignmentBucket(a) === "in_progress"),
    completed: items.filter((a) => assignmentBucket(a) === "completed"),
    overdue: items.filter((a) => assignmentBucket(a) === "overdue"),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary sm:text-3xl">Мое обучение</h1>
        <p className="mt-2 text-muted-foreground">
          Программы, назначенные вам руководителем или отделом персонала.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={typeFilter === "all" ? "default" : "outline"}
          onClick={() => setTypeFilter("all")}
        >
          Все типы
        </Button>
        {TRAINING_TYPE_OPTIONS.map((t) => (
          <Button
            key={t.value}
            size="sm"
            variant={typeFilter === t.value ? "default" : "outline"}
            onClick={() => setTypeFilter(t.value)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      <Tabs defaultValue="assigned">
        <TabsList className="flex w-full flex-wrap justify-start">
          {(["assigned", "in_progress", "completed", "overdue"] as const).map((key) => (
            <TabsTrigger key={key} value={key}>
              {LABELS[key]} ({groups[key].length})
            </TabsTrigger>
          ))}
        </TabsList>
        {(["assigned", "in_progress", "completed", "overdue"] as const).map((key) => (
          <TabsContent key={key} value={key} className="mt-4">
            {groups[key].length === 0 ? (
              <EmptyState title="Программ в этом статусе нет" />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {groups[key].map((a) => (
                  <AssignmentCard key={a.id} item={a} bucket={key} />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function AssignmentCard({ item, bucket }: { item: AssignmentRow; bucket: string }) {
  const title = item.courses?.title ?? item.professions?.name ?? "Программа обучения";
  const percent = bucket === "completed" ? 100 : bucket === "in_progress" ? 50 : 0;
  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={bucket === "overdue" ? "destructive" : "secondary"}>{LABELS[bucket]}</Badge>
          <Badge variant="outline">{trainingTypeLabel(item.training_type)}</Badge>
          {item.is_mandatory ? <Badge variant="outline">Обязательно</Badge> : null}
          {item.target_grade ? (
            <Badge variant="outline">до разряда {item.target_grade}</Badge>
          ) : null}
        </div>
        <CardTitle className="text-lg leading-snug">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {item.courses?.description ? (
          <p className="text-muted-foreground">{item.courses.description}</p>
        ) : null}
        <p className="text-muted-foreground">
          Срок: {item.due_date ? new Date(item.due_date).toLocaleDateString("ru-RU") : "не указан"}
        </p>
        <Progress value={percent} />
        {item.course_id ? (
          <Button asChild size="sm">
            <Link to="/learning/$courseId" params={{ courseId: item.course_id }}>
              {bucket === "completed" ? "Открыть курс" : "Продолжить"}
            </Link>
          </Button>
        ) : item.professions?.slug ? (
          <Button asChild size="sm">
            <Link to="/professions/$slug" params={{ slug: item.professions.slug }}>
              Перейти к программе
            </Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}