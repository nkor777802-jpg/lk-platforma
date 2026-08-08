import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CheckCircle2, Circle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { courseDetailQuery, courseMaterialsQuery } from "@/lib/account-queries";
import { myProgressQuery } from "@/lib/lms-queries";
import { completeModule } from "@/lib/account.functions";
import { MaterialList, type MaterialRow } from "@/components/MaterialList";
import { ErrorState, InlineLoading } from "@/components/states";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_authenticated/learning/$courseId")({
  head: () => ({
    meta: [
      { title: "Курс обучения — Академия «Людиновокабель»" },
      { name: "description", content: "Содержание курса, уроки, материалы и условия завершения." },
      { property: "og:title", content: "Курс обучения" },
      { property: "og:description", content: "Уроки, учебные материалы и итоговое тестирование." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CoursePage,
});

function CoursePage() {
  const { courseId } = useParams({ from: "/_authenticated/learning/$courseId" });
  const { user } = useAuth();
  const qc = useQueryClient();
  const course = useQuery(courseDetailQuery(courseId));
  const progress = useQuery(myProgressQuery(user?.id));
  const complete = useServerFn(completeModule);

  const modules = [
    ...(((course.data as { course_modules?: ModuleRow[] } | null)?.course_modules ?? []) as ModuleRow[]),
  ].sort((a, b) => a.sort_order - b.sort_order);
  const materials = useQuery(courseMaterialsQuery(modules.map((m) => m.id)));

  const mutation = useMutation({
    mutationFn: (moduleId: string) =>
      complete({
        data: {
          moduleId,
          professionId: (course.data as { profession_id?: string | null } | null)?.profession_id ?? null,
        },
      }),
    onSuccess: () => {
      toast.success("Урок отмечен как пройденный");
      void qc.invalidateQueries({ queryKey: ["progress"] });
    },
    onError: (e: Error) => toast.error("Не удалось сохранить прогресс", { description: e.message }),
  });

  if (course.isLoading) return <InlineLoading />;
  if (course.error || !course.data) return <ErrorState message={(course.error as Error)?.message} />;

  const c = course.data as CourseRow;
  const done = new Set(
    (progress.data ?? [])
      .filter((p) => p.status === "completed" && p.module_id)
      .map((p) => p.module_id as string),
  );
  const requiredModules = modules.filter((m) => m.is_required);
  const doneRequired = requiredModules.filter((m) => done.has(m.id)).length;
  const percent = modules.length
    ? Math.round((modules.filter((m) => done.has(m.id)).length / modules.length) * 100)
    : 0;
  const canTest = requiredModules.length === 0 || doneRequired === requiredModules.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-secondary">{c.title}</h1>
        {c.description ? <p className="mt-2 text-muted-foreground">{c.description}</p> : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Прогресс</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Progress value={percent} />
          <p className="text-sm text-muted-foreground">
            Пройдено {modules.filter((m) => done.has(m.id)).length} из {modules.length} уроков.
            Условие завершения: все обязательные уроки и итоговое тестирование.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Содержание курса</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {modules.length === 0 ? (
            <p className="text-sm text-muted-foreground">Уроки пока не добавлены.</p>
          ) : (
            modules.map((m) => (
              <div
                key={m.id}
                className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3">
                  {done.has(m.id) ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-accent" />
                  ) : (
                    <Circle className="mt-0.5 h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium">{m.title}</p>
                    {m.description ? (
                      <p className="text-sm text-muted-foreground">{m.description}</p>
                    ) : null}
                    {m.is_required ? (
                      <Badge variant="outline" className="mt-1">
                        Обязательный
                      </Badge>
                    ) : null}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={done.has(m.id) ? "outline" : "default"}
                  disabled={done.has(m.id) || mutation.isPending}
                  onClick={() => mutation.mutate(m.id)}
                >
                  {done.has(m.id) ? "Пройдено" : "Отметить пройденным"}
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Учебные материалы</CardTitle>
        </CardHeader>
        <CardContent>
          <MaterialList
            items={(materials.data ?? []) as MaterialRow[]}
            loading={materials.isLoading}
          />
        </CardContent>
      </Card>

      {c.profession_id ? (
        <Card>
          <CardHeader>
            <CardTitle>Итоговое тестирование</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {canTest
                ? "Все обязательные уроки пройдены — можно приступать к тесту."
                : "Сначала завершите все обязательные уроки курса."}
            </p>
            <Button asChild disabled={!canTest}>
              <Link to="/test/$professionId" params={{ professionId: c.profession_id }}>
                Перейти к тесту
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

type ModuleRow = {
  id: string;
  title: string;
  description: string | null;
  module_type: string | null;
  sort_order: number;
  is_required: boolean;
};

type CourseRow = {
  id: string;
  title: string;
  description: string | null;
  profession_id: string | null;
};