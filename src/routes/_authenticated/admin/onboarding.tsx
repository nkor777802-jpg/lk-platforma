import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { adminTableQuery, adminUsersQuery } from "@/lib/admin-queries";
import { onboardingFeedbackQuery, onboardingProgramsQuery } from "@/lib/onboarding-queries";
import { assignOnboarding } from "@/lib/onboarding.functions";
import {
  ONBOARDING_ITEM_TYPE_OPTIONS,
  ONBOARDING_SECTION_OPTIONS,
} from "@/lib/training-types";
import { EntityManager } from "@/components/admin/EntityManager";
import { EmptyState, InlineLoading } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/admin/onboarding")({
  component: OnboardingAdminPage,
});

function OnboardingAdminPage() {
  const professions = useQuery(adminTableQuery("professions", "id, name", "name"));
  const departments = useQuery(adminTableQuery("departments", "id, name", "name"));
  const templates = useQuery(adminTableQuery("onboarding_templates", "id, name", "name"));
  const materials = useQuery(adminTableQuery("materials", "id, title", "title"));
  const courses = useQuery(adminTableQuery("courses", "id, title", "title"));

  const opt = (rows: unknown, key: "name" | "title") =>
    ((rows ?? []) as Record<string, string>[]).map((r) => ({
      value: r["id"] as string,
      label: r[key] as string,
    }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary">Адаптация «Я Новичок»</h1>
        <p className="text-sm text-muted-foreground">
          Шаблоны адаптации с относительными сроками (День 0, +1, +7), индивидуальные программы
          новичков и обратная связь.
        </p>
      </div>

      <Tabs defaultValue="programs">
        <TabsList className="flex w-full flex-wrap justify-start">
          <TabsTrigger value="programs">Программы новичков</TabsTrigger>
          <TabsTrigger value="templates">Шаблоны</TabsTrigger>
          <TabsTrigger value="items">Пункты шаблонов</TabsTrigger>
          <TabsTrigger value="feedback">Обратная связь</TabsTrigger>
        </TabsList>

        <TabsContent value="programs" className="space-y-6 pt-6">
          <AssignOnboardingCard templateOptions={opt(templates.data, "name")} />
          <ProgramList />
        </TabsContent>

        <TabsContent value="templates" className="pt-6">
          <EntityManager
            table="onboarding_templates"
            title="Шаблоны адаптации"
            searchKeys={["name", "code"]}
            orderBy="name"
            fields={[
              { name: "name", label: "Название", required: true },
              { name: "code", label: "Код" },
              { name: "description", label: "Описание", type: "textarea" },
              {
                name: "profession_id",
                label: "Профессия",
                type: "select",
                options: opt(professions.data, "name"),
              },
              {
                name: "department_id",
                label: "Подразделение",
                type: "select",
                options: opt(departments.data, "name"),
              },
              { name: "duration_days", label: "Длительность, дней", type: "number" },
              { name: "is_default", label: "Шаблон по умолчанию", type: "boolean" },
            ]}
            columns={[
              { key: "name", label: "Название" },
              { key: "duration_days", label: "Дней" },
              {
                key: "is_default",
                label: "По умолчанию",
                render: (r) => (r["is_default"] ? "да" : "нет"),
              },
            ]}
          />
        </TabsContent>

        <TabsContent value="items" className="pt-6">
          <EntityManager
            table="onboarding_template_items"
            title="Пункты шаблона"
            archivable={false}
            searchKeys={["title"]}
            orderBy="sort_order"
            select="*, onboarding_templates(name)"
            fields={[
              {
                name: "template_id",
                label: "Шаблон",
                type: "select",
                required: true,
                options: opt(templates.data, "name"),
              },
              { name: "title", label: "Название пункта", required: true },
              { name: "description", label: "Описание", type: "textarea" },
              {
                name: "section",
                label: "Раздел",
                type: "select",
                options: ONBOARDING_SECTION_OPTIONS,
              },
              {
                name: "item_type",
                label: "Тип пункта",
                type: "select",
                options: ONBOARDING_ITEM_TYPE_OPTIONS,
              },
              { name: "offset_days", label: "День от приёма (0, 1, 7 ...)", type: "number" },
              {
                name: "material_id",
                label: "Материал",
                type: "select",
                options: opt(materials.data, "title"),
              },
              {
                name: "course_id",
                label: "Курс",
                type: "select",
                options: opt(courses.data, "title"),
              },
              { name: "link_url", label: "Ссылка" },
              { name: "is_required", label: "Обязательный", type: "boolean" },
              { name: "requires_mentor", label: "Подтверждает наставник", type: "boolean" },
              { name: "sort_order", label: "Порядок", type: "number" },
            ]}
            columns={[
              {
                key: "template",
                label: "Шаблон",
                render: (r) => (r["onboarding_templates"] as { name?: string } | null)?.name ?? "—",
              },
              { key: "title", label: "Пункт" },
              { key: "offset_days", label: "День" },
              { key: "section", label: "Раздел" },
            ]}
          />
        </TabsContent>

        <TabsContent value="feedback" className="pt-6">
          <FeedbackList />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AssignOnboardingCard({
  templateOptions,
}: {
  templateOptions: { value: string; label: string }[];
}) {
  const qc = useQueryClient();
  const users = useQuery(adminUsersQuery);
  const assign = useServerFn(assignOnboarding);
  const [userId, setUserId] = useState("");
  const [mentorId, setMentorId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [hireDate, setHireDate] = useState(new Date().toISOString().slice(0, 10));

  const userOptions = ((users.data ?? []) as Record<string, unknown>[]).map((u) => ({
    value: u["id"] as string,
    label: String(u["full_name"] ?? u["email"] ?? ""),
  }));

  const mutation = useMutation({
    mutationFn: () =>
      assign({
        data: {
          userId,
          hireDate,
          templateId: templateId || null,
          mentorId: mentorId || null,
        },
      }),
    onSuccess: (res) => {
      toast.success(
        res.created
          ? `Адаптация назначена, создано назначений: ${res.assignments}`
          : "У сотрудника уже есть активная программа адаптации",
      );
      void qc.invalidateQueries({ queryKey: ["admin", "onboarding"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Назначить адаптацию при приёме</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Сотрудник</Label>
          <Select value={userId} onValueChange={setUserId}>
            <SelectTrigger>
              <SelectValue placeholder="Выберите сотрудника" />
            </SelectTrigger>
            <SelectContent>
              {userOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Наставник</Label>
          <Select value={mentorId} onValueChange={setMentorId}>
            <SelectTrigger>
              <SelectValue placeholder="Выберите наставника" />
            </SelectTrigger>
            <SelectContent>
              {userOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Шаблон адаптации</Label>
          <Select value={templateId} onValueChange={setTemplateId}>
            <SelectTrigger>
              <SelectValue placeholder="Подобрать автоматически" />
            </SelectTrigger>
            <SelectContent>
              {templateOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="hire-date">Дата приёма</Label>
          <Input
            id="hire-date"
            type="date"
            value={hireDate}
            onChange={(e) => setHireDate(e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <Button onClick={() => mutation.mutate()} disabled={!userId || mutation.isPending}>
            Назначить адаптацию и обучение
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">
            Автоматически создаются: программа адаптации по шаблону со сроками от даты приёма и
            назначение обучения по профессии сотрудника.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function ProgramList() {
  const programs = useQuery(onboardingProgramsQuery);
  if (programs.isLoading) return <InlineLoading />;
  const rows = programs.data ?? [];
  if (rows.length === 0) return <EmptyState title="Программ адаптации пока нет" />;
  return (
    <div className="space-y-3">
      {rows.map((p) => (
        <div key={p.id} className="rounded-lg border border-border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-medium text-foreground">{p.employee_name}</p>
              <p className="text-sm text-muted-foreground">
                {p.template_name} · приём {new Date(p.hire_date).toLocaleDateString("ru-RU")}
                {p.mentor_name ? ` · наставник: ${p.mentor_name}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={p.status === "completed" ? "default" : "secondary"}>
                {p.status === "completed" ? "Завершена" : "В процессе"}
              </Badge>
              <Button asChild size="sm" variant="outline">
                <Link
                  to="/onboarding/print"
                  search={{ programId: p.id }}
                  target="_blank"
                  rel="noreferrer"
                >
                  PDF
                </Link>
              </Button>
            </div>
          </div>
          <Progress value={p.percent} className="mt-3" />
          <p className="mt-1 text-xs text-muted-foreground">
            {p.done_items} из {p.total_items} пунктов
          </p>
        </div>
      ))}
    </div>
  );
}

function FeedbackList() {
  const feedback = useQuery(onboardingFeedbackQuery);
  if (feedback.isLoading) return <InlineLoading />;
  const rows = feedback.data ?? [];
  if (rows.length === 0) return <EmptyState title="Обратной связи пока нет" />;
  return (
    <div className="space-y-3">
      {rows.map((f) => (
        <div key={f.id} className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm font-medium text-foreground">
            {(f as { profiles?: { full_name?: string } | null }).profiles?.full_name ?? "Сотрудник"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{f.message}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            {new Date(f.created_at).toLocaleString("ru-RU")}
          </p>
        </div>
      ))}
    </div>
  );
}
