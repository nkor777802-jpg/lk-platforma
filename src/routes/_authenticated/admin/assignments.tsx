import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { adminTableQuery, adminUsersQuery } from "@/lib/admin-queries";
import { EntityManager } from "@/components/admin/EntityManager";
import { TRAINING_TYPE_OPTIONS, trainingTypeLabel } from "@/lib/training-types";

export const Route = createFileRoute("/_authenticated/admin/assignments")({
  component: AssignmentsPage,
});

function AssignmentsPage() {
  const users = useQuery(adminUsersQuery);
  const professions = useQuery(adminTableQuery("professions", "id, name", "name"));
  const courses = useQuery(adminTableQuery("courses", "id, title", "title"));
  const groups = useQuery(adminTableQuery("groups", "id, name", "name"));
  const departments = useQuery(adminTableQuery("departments", "id, name", "name"));

  const opt = (rows: unknown, key: "name" | "title") =>
    ((rows ?? []) as Record<string, string>[]).map((r) => ({
      value: r["id"] as string,
      label: r[key] as string,
    }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary">Назначение обучения</h1>
        <p className="text-sm text-muted-foreground">
          Назначение сотруднику, группе, подразделению или профессии с указанием срока и обязательности.
        </p>
      </div>

      <EntityManager
        table="assignments"
        title="Назначения"
        archivable={false}
        searchKeys={["status", "comment"]}
        select="*, profiles!assignments_user_id_fkey(full_name), professions(name), courses(title)"
        fields={[
          {
            name: "user_id",
            label: "Сотрудник",
            type: "select",
            required: true,
            options: ((users.data ?? []) as Record<string, unknown>[]).map((u) => ({
              value: u["id"] as string,
              label: String(u["full_name"] ?? u["email"] ?? ""),
            })),
          },
          {
            name: "training_type",
            label: "Тип обучения",
            type: "select",
            required: true,
            options: TRAINING_TYPE_OPTIONS,
          },
          { name: "profession_id", label: "Профессия", type: "select", options: opt(professions.data, "name") },
          {
            name: "target_profession_id",
            label: "Целевая профессия (для новой профессии)",
            type: "select",
            options: opt(professions.data, "name"),
          },
          { name: "current_grade", label: "Текущий разряд" },
          { name: "target_grade", label: "Целевой разряд" },
          { name: "course_id", label: "Курс", type: "select", options: opt(courses.data, "title") },
          { name: "group_id", label: "Группа", type: "select", options: opt(groups.data, "name") },
          { name: "department_id", label: "Подразделение", type: "select", options: opt(departments.data, "name") },
          { name: "assigned_at", label: "Дата назначения (ГГГГ-ММ-ДД)" },
          { name: "due_date", label: "Срок прохождения (ГГГГ-ММ-ДД)" },
          { name: "is_mandatory", label: "Обязательное", type: "boolean" },
          { name: "is_repeat", label: "Повторное обучение", type: "boolean" },
          { name: "comment", label: "Комментарий", type: "textarea" },
          {
            name: "status",
            label: "Статус",
            type: "select",
            options: [
              { value: "assigned", label: "Назначено" },
              { value: "in_progress", label: "В процессе" },
              { value: "completed", label: "Завершено" },
              { value: "overdue", label: "Просрочено" },
            ],
          },
        ]}
        columns={[
          {
            key: "user",
            label: "Сотрудник",
            render: (r) => (r["profiles"] as { full_name?: string } | null)?.full_name ?? "—",
          },
          {
            key: "target",
            label: "Программа",
            render: (r) =>
              (r["courses"] as { title?: string } | null)?.title ??
              (r["professions"] as { name?: string } | null)?.name ??
              "—",
          },
          {
            key: "training_type",
            label: "Тип обучения",
            render: (r) => trainingTypeLabel(r["training_type"] as string | null),
          },
          { key: "assigned_at", label: "Назначено" },
          { key: "due_date", label: "Срок" },
          { key: "status", label: "Статус" },
          {
            key: "is_mandatory",
            label: "Обязательно",
            render: (r) => (r["is_mandatory"] === false ? "нет" : "да"),
          },
        ]}
      />
    </div>
  );
}
