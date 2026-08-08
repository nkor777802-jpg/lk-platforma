import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CheckCircle2, Lightbulb, Trophy } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { allAchievementsQuery, myAchievementsQuery } from "@/lib/lms-queries";
import { myDevelopmentQuery } from "@/lib/development-queries";
import { myAnalyticsQuery } from "@/lib/analytics-queries";
import { setPlanItemStatus } from "@/lib/development.functions";
import { EmptyState, InlineLoading } from "@/components/states";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

const STATUS_LABEL: Record<string, string> = {
  not_started: "Не начато",
  in_progress: "В процессе",
  awaiting_review: "Ожидает оценки",
  completed: "Выполнено",
  retraining_required: "Требуется повторное обучение",
};

const TYPE_LABEL: Record<string, string> = {
  knowledge: "Знания",
  skill: "Навыки",
  safety: "Безопасность",
  operation: "Технологические операции",
};

const ITEM_TYPE_LABEL: Record<string, string> = {
  course: "Курс",
  material: "Материал",
  practical: "Практическое задание",
  test: "Тест",
};

function DevelopmentPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const dev = useQuery(myDevelopmentQuery);
  const stats = useQuery(myAnalyticsQuery);
  const earned = useQuery(myAchievementsQuery(user?.id));
  const all = useQuery(allAchievementsQuery);
  const setStatus = useServerFn(setPlanItemStatus);

  const mutate = useMutation({
    mutationFn: (payload: { itemId: string; status: string }) =>
      setStatus({ data: { itemId: payload.itemId, status: payload.status as never } }),
    onSuccess: () => {
      toast.success("Статус обновлён");
      void qc.invalidateQueries({ queryKey: ["development"] });
    },
    onError: (e: Error) => toast.error("Не удалось обновить статус", { description: e.message }),
  });

  if (dev.isLoading) return <InlineLoading />;
  const data = dev.data;
  if (!data) return <EmptyState title="Данные развития недоступны" />;

  const profile = data.profile as any;
  const levels = data.levels as any[];
  const plan = (data.plans as any[])[0] ?? null;
  const items = ((plan?.development_plan_items ?? []) as any[]).sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );
  const doneItems = items.filter((i) => i.status === "completed").length;
  const earnedIds = new Set((earned.data ?? []).map((e) => e.achievement_id));
  const nextLevel = levels.find((l) => l.id === data.nextLevelId) ?? null;
  const shownLevelId = data.nextLevelId ?? data.currentLevelId;
  const competencies = (data.competencies as any[]).filter((c) => c.level_id === shownLevelId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary sm:text-3xl">Профессиональное развитие</h1>
        <p className="mt-2 text-muted-foreground">
          Текущая квалификация, карьерный маршрут и индивидуальный план. История обучения
          сохраняется при смене должности и подразделения.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Текущая квалификация</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-muted-foreground">Профессия</p>
            <p className="font-medium">{profile?.professions?.name ?? "Не назначена"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Разряд</p>
            <p className="font-medium">{profile?.grade ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Должность</p>
            <p className="font-medium">{profile?.positions?.name ?? profile?.position ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Подразделение</p>
            <p className="font-medium">{profile?.departments?.name ?? "—"}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Моя статистика</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {stats.isPending ? (
            <InlineLoading />
          ) : !stats.data ? (
            <p className="text-sm text-muted-foreground">Статистика пока недоступна.</p>
          ) : (
            <>
              <div className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Пройдено аттестаций", value: stats.data.attempts },
                  { label: "Средний балл", value: `${stats.data.avgScore}%` },
                  { label: "Доля успешных", value: `${stats.data.passRate}%` },
                  {
                    label: "Последний результат",
                    value: stats.data.lastScore === null ? "—" : `${stats.data.lastScore}%`,
                  },
                  { label: "Завершено этапов обучения", value: stats.data.completedStages },
                  {
                    label: "Выполнено назначений",
                    value: `${stats.data.completedAssignments} из ${stats.data.assignments}`,
                  },
                  { label: "Выполнение назначений", value: `${stats.data.assignmentRate}%` },
                  { label: "Просрочено", value: stats.data.overdue },
                ].map((c) => (
                  <div key={c.label} className="rounded-lg border border-border p-3">
                    <p className="text-muted-foreground">{c.label}</p>
                    <p className="mt-1 text-2xl font-semibold text-secondary">{c.value}</p>
                  </div>
                ))}
              </div>
              {stats.data.trend.length > 1 ? (
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Динамика среднего балла по месяцам
                  </p>
                  {stats.data.trend.map((t) => (
                    <div key={t.period} className="flex items-center gap-3 text-xs">
                      <span className="w-20 text-muted-foreground">{t.period}</span>
                      <Progress value={t.avgScore} className="h-2 flex-1" />
                      <span className="w-10 text-right font-medium">{t.avgScore}%</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      {data.recommendations.length > 0 ? (
        <Card className="border-primary/40 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lightbulb className="h-4 w-4 text-primary" /> Рекомендации
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {data.recommendations.map((r, i) => (
              <p key={`${r.kind}-${i}`}>{r.text}</p>
            ))}
            <p className="pt-2 text-xs text-muted-foreground">
              Рекомендации не заменяют решение HR или руководителя об изменении квалификации.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Tabs defaultValue="route">
        <TabsList className="flex-wrap">
          <TabsTrigger value="route">Карьерный маршрут</TabsTrigger>
          <TabsTrigger value="plan">План развития</TabsTrigger>
          <TabsTrigger value="competencies">Компетенции</TabsTrigger>
          <TabsTrigger value="history">История</TabsTrigger>
        </TabsList>

        <TabsContent value="route" className="pt-6">
          <Card>
            <CardHeader>
              <CardTitle>Уровни квалификации</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {levels.length === 0 ? (
                <EmptyState
                  title="Маршрут не настроен"
                  description="Уровни квалификации по профессии ещё не заданы."
                />
              ) : (
                levels.map((l) => {
                  const isCurrent = l.id === data.currentLevelId;
                  const isNext = l.id === data.nextLevelId;
                  return (
                    <div
                      key={l.id}
                      className={`rounded-lg border p-4 ${
                        isCurrent
                          ? "border-primary bg-primary/5"
                          : isNext
                            ? "border-accent bg-accent/5"
                            : "border-border"
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{l.name}</span>
                        {l.code ? <Badge variant="outline">{l.code}</Badge> : null}
                        {isCurrent ? <Badge>Текущий уровень</Badge> : null}
                        {isNext ? <Badge variant="secondary">Следующий уровень</Badge> : null}
                        {l.is_leadership ? (
                          <Badge variant="outline">Руководящая роль</Badge>
                        ) : null}
                      </div>
                      {l.description ? (
                        <p className="mt-1 text-muted-foreground">{l.description}</p>
                      ) : null}
                    </div>
                  );
                })
              )}
              <p className="text-xs text-muted-foreground">
                Переход между уровнями требует обучения, проверки знаний, практической оценки и
                решения уполномоченных лиц.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plan" className="pt-6">
          <Card>
            <CardHeader>
              <CardTitle>Индивидуальный план развития</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {!plan ? (
                <EmptyState
                  title="План не сформирован"
                  description="Индивидуальный план развития создаёт HR или руководитель."
                />
              ) : (
                <>
                  <div className="space-y-1">
                    <p className="text-base font-medium">Цель: {plan.goal}</p>
                    <p className="text-muted-foreground">
                      Целевой уровень: {plan.qualification_levels?.name ?? nextLevel?.name ?? "—"} ·
                      срок:{" "}
                      {plan.due_date
                        ? new Date(plan.due_date).toLocaleDateString("ru-RU")
                        : "не задан"}{" "}
                      · статус: {STATUS_LABEL[plan.status] ?? plan.status}
                    </p>
                  </div>
                  {items.length > 0 ? (
                    <Progress value={(doneItems / items.length) * 100} />
                  ) : null}
                  {items.length === 0 ? (
                    <p className="text-muted-foreground">Пункты плана ещё не добавлены.</p>
                  ) : (
                    items.map((i) => (
                      <div
                        key={i.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3"
                      >
                        <div>
                          <p className="font-medium">{i.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {ITEM_TYPE_LABEL[i.item_type] ?? i.item_type}
                            {i.is_mandatory ? " · обязательный" : " · дополнительный"}
                            {i.due_date
                              ? ` · до ${new Date(i.due_date).toLocaleDateString("ru-RU")}`
                              : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              i.status === "completed"
                                ? "default"
                                : i.status === "retraining_required"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {STATUS_LABEL[i.status] ?? i.status}
                          </Badge>
                          {i.status !== "completed" ? (
                            <>
                              {i.status === "not_started" ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={mutate.isPending}
                                  onClick={() =>
                                    mutate.mutate({ itemId: i.id, status: "in_progress" })
                                  }
                                >
                                  Начать
                                </Button>
                              ) : null}
                              {i.status !== "awaiting_review" ? (
                                <Button
                                  size="sm"
                                  disabled={mutate.isPending}
                                  onClick={() =>
                                    mutate.mutate({ itemId: i.id, status: "awaiting_review" })
                                  }
                                >
                                  Отправить на оценку
                                </Button>
                              ) : null}
                            </>
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="competencies" className="pt-6">
          <Card>
            <CardHeader>
              <CardTitle>
                Матрица компетенций
                {nextLevel ? ` — уровень «${nextLevel.name}»` : ""}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {competencies.length === 0 ? (
                <EmptyState
                  title="Компетенции не заданы"
                  description="Требования уровня заполняет HR или преподаватель."
                />
              ) : (
                ["knowledge", "skill", "safety", "operation"].map((type) => {
                  const group = competencies.filter((c) => c.competency_type === type);
                  if (group.length === 0) return null;
                  return (
                    <div key={type} className="space-y-2">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        {TYPE_LABEL[type]}
                      </p>
                      {group.map((c) => (
                        <div key={c.id} className="rounded-lg border border-border p-3">
                          <p className="font-medium">{c.title}</p>
                          {c.description ? (
                            <p className="text-xs text-muted-foreground">{c.description}</p>
                          ) : null}
                          {c.courses?.title ? (
                            <p className="mt-1 text-xs">
                              Обязательный курс: {c.courses.title}
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6 pt-6">
          <Card>
            <CardHeader>
              <CardTitle>Квалификационные переходы</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {(data.history as any[]).length === 0 ? (
                <p className="text-muted-foreground">Переходы ещё не оформлялись.</p>
              ) : (
                (data.history as any[]).map((h) => (
                  <div key={h.id} className="flex flex-wrap items-center gap-3">
                    <span>{new Date(h.created_at).toLocaleDateString("ru-RU")}</span>
                    <span className="font-medium">{h.professions?.name ?? "Профессия"}</span>
                    <span className="text-muted-foreground">
                      основание: {h.basis ?? "—"} · подтвердил: {h.approved_by_name ?? "—"}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>История аттестаций</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-muted-foreground">
                Завершено этапов обучения: {data.completedStages}
              </p>
              {(data.attempts as any[]).filter((a) => a.status === "finished").length === 0 ? (
                <p className="text-muted-foreground">Аттестации ещё не проходили.</p>
              ) : (
                (data.attempts as any[])
                  .filter((a) => a.status === "finished")
                  .map((a) => (
                    <div key={a.id} className="flex flex-wrap items-center gap-3">
                      <span>{new Date(a.started_at).toLocaleDateString("ru-RU")}</span>
                      <span className="font-medium">{a.professions?.name ?? "Аттестация"}</span>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}