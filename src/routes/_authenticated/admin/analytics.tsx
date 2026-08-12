import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download, RefreshCw } from "lucide-react";
import { analyticsDashboardQuery, analyticsFiltersQuery } from "@/lib/analytics-queries";
import { exportCsv } from "@/lib/admin.functions";
import { TRAINING_TYPE_OPTIONS } from "@/lib/training-types";
import { AdminTable } from "@/components/admin/AdminTable";
import { EmptyState, ErrorState, InlineLoading } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/admin/analytics")({
  head: () => ({
    meta: [
      { title: "Аналитика обучения — Академия «Людиновокабель»" },
      {
        name: "description",
        content: "KPI обучения и аттестации: динамика, срезы по подразделениям, профессиям и курсам.",
      },
      { property: "og:title", content: "Аналитика обучения и аттестации" },
      { property: "og:description", content: "KPI, динамика результатов и проблемные темы." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AnalyticsPage,
});

const ALL = "all";

function AnalyticsPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [departmentId, setDepartmentId] = useState(ALL);
  const [professionId, setProfessionId] = useState(ALL);
  const [courseId, setCourseId] = useState(ALL);
  const [trainingType, setTrainingType] = useState(ALL);
  const [granularity, setGranularity] = useState<"month" | "quarter" | "year">("month");

  const options = useQuery(analyticsFiltersQuery);
  const input = {
    from: from || null,
    to: to || null,
    departmentId: departmentId === ALL ? null : departmentId,
    professionId: professionId === ALL ? null : professionId,
    courseId: courseId === ALL ? null : courseId,
    trainingType: trainingType === ALL ? null : trainingType,
    granularity,
  };
  const dash = useQuery(analyticsDashboardQuery(input));
  const runExport = useServerFn(exportCsv);

  const download = async (kind: "results" | "statistics" | "assignments") => {
    try {
      const res = await runExport({ data: { kind } });
      const blob = new Blob([`\uFEFF${res.csv}`], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analytics-${kind}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Выгружено строк: ${res.count}`);
    } catch (e) {
      toast.error("Не удалось выгрузить отчёт", { description: (e as Error).message });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary sm:text-3xl">Аналитика</h1>
          <p className="mt-2 text-muted-foreground">
            Показатели обучения и аттестации. Руководитель видит данные только своих сотрудников.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => void dash.refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" /> Обновить
          </Button>
          <Button variant="outline" size="sm" onClick={() => void download("results")}>
            <Download className="mr-2 h-4 w-4" /> Результаты CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => void download("statistics")}>
            <Download className="mr-2 h-4 w-4" /> Статистика CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Фильтры</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <div className="space-y-1">
            <Label htmlFor="from">Период с</Label>
            <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="to">по</Label>
            <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Подразделение</Label>
            <Select value={departmentId} onValueChange={setDepartmentId}>
              <SelectTrigger>
                <SelectValue placeholder="Все" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Все</SelectItem>
                {(options.data?.departments ?? []).map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Профессия</Label>
            <Select value={professionId} onValueChange={setProfessionId}>
              <SelectTrigger>
                <SelectValue placeholder="Все" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Все</SelectItem>
                {(options.data?.professions ?? []).map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Курс</Label>
            <Select value={courseId} onValueChange={setCourseId}>
              <SelectTrigger>
                <SelectValue placeholder="Все" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Все</SelectItem>
                {(options.data?.courses ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Тип обучения</Label>
            <Select value={trainingType} onValueChange={setTrainingType}>
              <SelectTrigger>
                <SelectValue placeholder="Все" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Все</SelectItem>
                {TRAINING_TYPE_OPTIONS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Детализация</Label>
            <Select
              value={granularity}
              onValueChange={(v) => setGranularity(v as "month" | "quarter" | "year")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">По месяцам</SelectItem>
                <SelectItem value="quarter">По кварталам</SelectItem>
                <SelectItem value="year">По годам</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {dash.isPending ? (
        <InlineLoading />
      ) : dash.isError ? (
        <ErrorState message={(dash.error as Error).message} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Сотрудников в выборке", value: dash.data.kpi.employees },
              { label: "Аттестаций", value: dash.data.kpi.attempts },
              { label: "Средний балл", value: `${dash.data.kpi.avgScore}%` },
              { label: "Доля успешных", value: `${dash.data.kpi.passRate}%` },
              { label: "Активных сотрудников", value: dash.data.kpi.active },
              { label: "Завершённых этапов", value: dash.data.kpi.completedStages },
              { label: "Просроченных назначений", value: dash.data.kpi.overdue },
            ].map((c) => (
              <Card key={c.label}>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">{c.label}</p>
                  <p className="mt-1 text-3xl font-bold text-secondary">{c.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Динамика результатов</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                {dash.data.trend.length === 0 ? (
                  <EmptyState title="Нет аттестаций за выбранный период" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dash.data.trend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="period" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="avgScore"
                        name="Средний балл, %"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="passRate"
                        name="Доля успешных, %"
                        stroke="hsl(var(--accent))"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Распределение баллов</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dash.data.scoreBuckets}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="bucket" fontSize={12} />
                    <YAxis fontSize={12} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" name="Аттестаций" fill="hsl(var(--primary))" radius={4} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="departments">
            <TabsList className="flex-wrap">
              <TabsTrigger value="departments">Подразделения</TabsTrigger>
              <TabsTrigger value="professions">Профессии</TabsTrigger>
              <TabsTrigger value="employees">Сотрудники</TabsTrigger>
              <TabsTrigger value="courses">Курсы</TabsTrigger>
              <TabsTrigger value="training">Типы обучения</TabsTrigger>
              <TabsTrigger value="topics">Проблемные темы</TabsTrigger>
            </TabsList>

            <TabsContent value="departments" className="pt-6">
              <AdminTable
                rows={dash.data.byDepartment as unknown as Record<string, unknown>[]}
                searchKeys={["name"]}
                emptyTitle="Нет данных по подразделениям"
                columns={[
                  { key: "name", label: "Подразделение" },
                  { key: "attempts", label: "Аттестаций" },
                  { key: "passed", label: "Успешных" },
                  { key: "passRate", label: "Доля успешных, %" },
                  { key: "avgScore", label: "Средний балл, %" },
                ]}
              />
            </TabsContent>

            <TabsContent value="professions" className="pt-6">
              <AdminTable
                rows={dash.data.byProfession as unknown as Record<string, unknown>[]}
                searchKeys={["name"]}
                emptyTitle="Нет данных по профессиям"
                columns={[
                  { key: "name", label: "Профессия" },
                  { key: "attempts", label: "Аттестаций" },
                  { key: "passed", label: "Успешных" },
                  { key: "passRate", label: "Доля успешных, %" },
                  { key: "avgScore", label: "Средний балл, %" },
                ]}
              />
            </TabsContent>

            <TabsContent value="employees" className="pt-6">
              <AdminTable
                rows={dash.data.byEmployee as unknown as Record<string, unknown>[]}
                searchKeys={["name", "department", "profession"]}
                emptyTitle="Нет данных по сотрудникам"
                columns={[
                  { key: "name", label: "Сотрудник" },
                  { key: "department", label: "Подразделение" },
                  { key: "profession", label: "Профессия" },
                  { key: "attempts", label: "Аттестаций" },
                  { key: "passRate", label: "Доля успешных, %" },
                  { key: "avgScore", label: "Средний балл, %" },
                ]}
              />
            </TabsContent>

            <TabsContent value="courses" className="space-y-4 pt-6">
              <AdminTable
                rows={dash.data.byCourse as unknown as Record<string, unknown>[]}
                searchKeys={["name"]}
                emptyTitle="Курсы не назначались"
                toolbar={
                  <Button variant="outline" size="sm" onClick={() => void download("assignments")}>
                    <Download className="mr-2 h-4 w-4" /> Назначения CSV
                  </Button>
                }
                columns={[
                  { key: "name", label: "Курс" },
                  { key: "assigned", label: "Назначено" },
                  { key: "completed", label: "Завершено" },
                  { key: "completionRate", label: "Завершение, %" },
                  { key: "overdue", label: "Просрочено" },
                ]}
              />
            </TabsContent>

            <TabsContent value="training" className="space-y-4 pt-6">
              <div className="rounded-lg border border-border bg-card p-4 text-sm">
                Адаптация: активных программ {dash.data.onboarding.active}, завершено{" "}
                {dash.data.onboarding.completed} из {dash.data.onboarding.total} (
                {dash.data.onboarding.completionRate}%)
              </div>
              <AdminTable
                rows={dash.data.byTrainingType as unknown as Record<string, unknown>[]}
                searchKeys={["name"]}
                emptyTitle="Назначений нет"
                columns={[
                  { key: "name", label: "Тип обучения" },
                  { key: "assigned", label: "Назначено" },
                  { key: "completed", label: "Завершено" },
                  { key: "completionRate", label: "Завершение, %" },
                  { key: "overdue", label: "Просрочено" },
                ]}
              />
            </TabsContent>

            <TabsContent value="topics" className="pt-6">
              <AdminTable
                rows={dash.data.problemTopics as unknown as Record<string, unknown>[]}
                searchKeys={["topic"]}
                emptyTitle="Недостаточно ответов для анализа тем"
                columns={[
                  { key: "topic", label: "Тема" },
                  { key: "total", label: "Ответов" },
                  { key: "errors", label: "Ошибок" },
                  { key: "errorRate", label: "Доля ошибок, %" },
                ]}
              />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}