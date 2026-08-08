import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { EntityManager } from "@/components/admin/EntityManager";
import { AdminTable } from "@/components/admin/AdminTable";
import { developmentAnalyticsQuery, developmentPlansQuery } from "@/lib/development-queries";
import { InlineLoading } from "@/components/states";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/admin/development")({
  head: () => ({
    meta: [
      { title: "Развитие сотрудников — админ-панель" },
      {
        name: "description",
        content: "Уровни квалификации, матрица компетенций, индивидуальные планы и аналитика развития.",
      },
      { property: "og:title", content: "Профессиональное развитие — управление" },
      { property: "og:description", content: "Планы развития, компетенции и квалификационные переходы." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminDevelopmentPage,
});

const STATUS_OPTIONS = [
  { value: "not_started", label: "Не начато" },
  { value: "in_progress", label: "В процессе" },
  { value: "awaiting_review", label: "Ожидает оценки" },
  { value: "completed", label: "Выполнено" },
  { value: "retraining_required", label: "Требуется повторное обучение" },
];

const STATUS_LABEL: Record<string, string> = Object.fromEntries(
  STATUS_OPTIONS.map((s) => [s.value, s.label]),
);

function Analytics() {
  const analytics = useQuery(developmentAnalyticsQuery);
  if (analytics.isLoading) return <InlineLoading />;
  const a = analytics.data;
  if (!a) return null;

  const cards = [
    { label: "Сотрудников развивается", value: a.developing },
    { label: "Планов всего", value: a.total },
    { label: "В процессе", value: a.active },
    { label: "Ожидают оценки", value: a.awaiting },
    { label: "Просроченных планов", value: a.overdue },
    { label: "Квалификационных переходов", value: a.transitions },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-secondary">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Планы по профессиям</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {a.byProfession.length === 0 ? (
            <p className="text-muted-foreground">Планы развития ещё не создавались.</p>
          ) : (
            a.byProfession.map((p) => (
              <div key={p.name} className="flex items-center justify-between">
                <span>{p.name}</span>
                <Badge variant="secondary">{p.count}</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PlansOverview() {
  const plans = useQuery(developmentPlansQuery);
  if (plans.isLoading) return <InlineLoading />;
  const rows = (plans.data ?? []) as Record<string, unknown>[];

  return (
    <AdminTable
      rows={rows}
      searchKeys={["user_name", "goal"]}
      emptyTitle="Планы развития не созданы"
      columns={[
        { key: "user_name", label: "Сотрудник" },
        { key: "goal", label: "Цель" },
        {
          key: "profession",
          label: "Профессия",
          render: (r) => (r["professions"] as { name?: string } | null)?.name ?? "—",
        },
        { key: "responsible_name", label: "Ответственный" },
        {
          key: "due_date",
          label: "Срок",
          render: (r) =>
            r["due_date"] ? new Date(String(r["due_date"])).toLocaleDateString("ru-RU") : "—",
        },
        {
          key: "progress",
          label: "Пункты",
          render: (r) => `${r["items_done"]} / ${r["items_total"]}`,
        },
        {
          key: "status",
          label: "Статус",
          render: (r) => (
            <Badge variant={r["status"] === "completed" ? "default" : "secondary"}>
              {STATUS_LABEL[String(r["status"])] ?? String(r["status"])}
            </Badge>
          ),
        },
      ]}
    />
  );
}

function AdminDevelopmentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary">Профессиональное развитие</h1>
        <p className="text-sm text-muted-foreground">
          Уровни квалификации, матрица компетенций, индивидуальные планы и аналитика.
        </p>
      </div>

      <Tabs defaultValue="analytics">
        <TabsList className="flex-wrap">
          <TabsTrigger value="analytics">Аналитика</TabsTrigger>
          <TabsTrigger value="plans">Планы</TabsTrigger>
          <TabsTrigger value="plans_edit">Редактор планов</TabsTrigger>
          <TabsTrigger value="items">Пункты планов</TabsTrigger>
          <TabsTrigger value="levels">Уровни квалификации</TabsTrigger>
          <TabsTrigger value="competencies">Компетенции</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="pt-6">
          <Analytics />
        </TabsContent>

        <TabsContent value="plans" className="pt-6">
          <PlansOverview />
        </TabsContent>

        <TabsContent value="plans_edit" className="pt-6">
          <EntityManager
            table="development_plans"
            title="Индивидуальные планы"
            description="Цель, профессия, целевой уровень, ответственный и срок."
            archivable={false}
            searchKeys={["goal"]}
            orderBy="created_at"
            fields={[
              { name: "user_id", label: "ID сотрудника", required: true },
              { name: "goal", label: "Цель", required: true },
              { name: "profession_id", label: "ID профессии" },
              { name: "target_level_id", label: "ID целевого уровня" },
              { name: "responsible_id", label: "ID ответственного" },
              { name: "due_date", label: "Срок (ГГГГ-ММ-ДД)" },
              { name: "status", label: "Статус", type: "select", options: STATUS_OPTIONS },
              { name: "comment", label: "Комментарий", type: "textarea" },
            ]}
            columns={[
              { key: "goal", label: "Цель" },
              { key: "due_date", label: "Срок" },
              {
                key: "status",
                label: "Статус",
                render: (r) => STATUS_LABEL[String(r["status"])] ?? String(r["status"]),
              },
            ]}
          />
        </TabsContent>

        <TabsContent value="items" className="pt-6">
          <EntityManager
            table="development_plan_items"
            title="Пункты планов"
            description="Курсы, материалы, практические задания и тесты со сроками и ответственными."
            archivable={false}
            searchKeys={["title"]}
            orderBy="sort_order"
            fields={[
              { name: "plan_id", label: "ID плана", required: true },
              { name: "title", label: "Наименование", required: true },
              {
                name: "item_type",
                label: "Тип",
                type: "select",
                options: [
                  { value: "course", label: "Курс" },
                  { value: "material", label: "Материал" },
                  { value: "practical", label: "Практическое задание" },
                  { value: "test", label: "Тест" },
                ],
              },
              { name: "course_id", label: "ID курса" },
              { name: "material_id", label: "ID материала" },
              { name: "practical_task_id", label: "ID практического задания" },
              { name: "test_profession_id", label: "ID профессии для теста" },
              { name: "is_mandatory", label: "Обязательный", type: "boolean" },
              { name: "due_date", label: "Срок (ГГГГ-ММ-ДД)" },
              { name: "responsible_id", label: "ID ответственного" },
              { name: "status", label: "Статус", type: "select", options: STATUS_OPTIONS },
              { name: "sort_order", label: "Порядок", type: "number" },
            ]}
            columns={[
              { key: "title", label: "Наименование" },
              { key: "item_type", label: "Тип" },
              {
                key: "status",
                label: "Статус",
                render: (r) => STATUS_LABEL[String(r["status"])] ?? String(r["status"]),
              },
              { key: "due_date", label: "Срок" },
            ]}
          />
        </TabsContent>

        <TabsContent value="levels" className="pt-6">
          <EntityManager
            table="qualification_levels"
            title="Уровни квалификации"
            description="Разряды и уровни профессии, порядок и переход на следующий уровень."
            orderBy="sort_order"
            fields={[
              { name: "profession_id", label: "ID профессии" },
              { name: "name", label: "Наименование", required: true },
              { name: "code", label: "Код разряда" },
              { name: "description", label: "Описание", type: "textarea" },
              { name: "sort_order", label: "Порядок", type: "number" },
              { name: "next_level_id", label: "ID следующего уровня" },
              { name: "is_leadership", label: "Руководящая роль", type: "boolean" },
            ]}
            columns={[
              { key: "name", label: "Уровень" },
              { key: "code", label: "Код" },
              { key: "sort_order", label: "Порядок" },
            ]}
          />
        </TabsContent>

        <TabsContent value="competencies" className="pt-6">
          <EntityManager
            table="competencies"
            title="Матрица компетенций"
            description="Знания, навыки, требования безопасности и технологические операции уровня."
            archivable={false}
            searchKeys={["title"]}
            orderBy="sort_order"
            fields={[
              { name: "level_id", label: "ID уровня", required: true },
              { name: "title", label: "Требование", required: true },
              {
                name: "competency_type",
                label: "Тип",
                type: "select",
                options: [
                  { value: "knowledge", label: "Знание" },
                  { value: "skill", label: "Навык" },
                  { value: "safety", label: "Требование безопасности" },
                  { value: "operation", label: "Технологическая операция" },
                ],
              },
              { name: "description", label: "Описание", type: "textarea" },
              { name: "course_id", label: "ID обязательного курса" },
              { name: "profession_test_id", label: "ID профессии для контрольного теста" },
              { name: "is_required", label: "Обязательная", type: "boolean" },
              { name: "sort_order", label: "Порядок", type: "number" },
            ]}
            columns={[
              { key: "title", label: "Требование" },
              { key: "competency_type", label: "Тип" },
            ]}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}