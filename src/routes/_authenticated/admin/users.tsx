import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { adminTableQuery, adminUsersQuery } from "@/lib/admin-queries";
import { createAdminUser, setUserRoles, updateAdminUser } from "@/lib/admin.functions";
import { AdminTable, type Column } from "@/components/admin/AdminTable";
import { ErrorState, InlineLoading } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: AdminUsersPage,
});

const ROLE_LABEL: Record<string, string> = {
  employee: "Сотрудник",
  manager: "Руководитель",
  teacher: "Преподаватель",
  hr: "HR",
  admin: "Администратор",
};

type UserRow = Record<string, unknown>;

/** Порядок приоритета: в таблице показываем максимальную роль сотрудника. */
const ROLE_PRIORITY = ["admin", "hr", "teacher", "manager", "employee"] as const;

function primaryRole(list: string[]): string {
  return ROLE_PRIORITY.find((r) => list.includes(r)) ?? "employee";
}

function AdminUsersPage() {
  const qc = useQueryClient();
  const users = useQuery(adminUsersQuery);
  const departments = useQuery(adminTableQuery("departments", "id, name", "name"));
  const positions = useQuery(adminTableQuery("positions", "id, name", "name"));
  const professions = useQuery(adminTableQuery("professions", "id, name", "name"));

  const createFn = useServerFn(createAdminUser);
  const updateFn = useServerFn(updateAdminUser);
  const rolesFn = useServerFn(setUserRoles);

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin"] });

  const createMutation = useMutation({
    mutationFn: () =>
      createFn({
        data: {
          email: form["email"] ?? "",
          password: form["password"] ?? "",
          fullName: form["fullName"] ?? "",
          role: (form["role"] ?? "employee") as "employee",
          departmentId: form["departmentId"] || null,
          positionId: form["positionId"] || null,
          professionId: form["professionId"] || null,
          personnelNumber: form["personnelNumber"] || null,
        },
      }),
    onSuccess: () => {
      toast.success("Пользователь создан");
      setCreateOpen(false);
      setForm({});
      void invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      updateFn({
        data: {
          userId: editing?.["id"] as string,
          fullName: form["fullName"] || undefined,
          departmentId: form["departmentId"] || null,
          positionId: form["positionId"] || null,
          professionId: form["professionId"] || null,
          personnelNumber: form["personnelNumber"] || null,
          grade: form["grade"] || null,
        },
      }),
    onSuccess: () => {
      toast.success("Профиль обновлён");
      setEditing(null);
      void invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const blockMutation = useMutation({
    mutationFn: (p: { userId: string; isActive: boolean }) =>
      updateFn({ data: { userId: p.userId, isActive: p.isActive } }),
    onSuccess: () => {
      toast.success("Доступ обновлён");
      void invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const roleMutation = useMutation({
    mutationFn: (p: { userId: string; role: string }) =>
      rolesFn({ data: { userId: p.userId, roles: [p.role as "employee"] } }),
    onSuccess: () => {
      toast.success("Роль изменена");
      void invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const optionList = (q: typeof departments) =>
    ((q.data ?? []) as { id: string; name: string }[]).map((d) => ({ value: d.id, label: d.name }));

  const columns: Column<UserRow>[] = [
    { key: "full_name", label: "ФИО" },
    { key: "email", label: "Email" },
    {
      key: "department",
      label: "Подразделение",
      render: (r) => (r["departments"] as { name?: string } | null)?.name ?? "—",
    },
    {
      key: "position",
      label: "Должность",
      render: (r) => (r["positions"] as { name?: string } | null)?.name ?? (r["position"] as string) ?? "—",
    },
    {
      key: "roles",
      label: "Роль",
      render: (r) => {
        const list = (r["roles"] as string[]) ?? [];
        const value = primaryRole(list);
        return (
          <Select
            value={value}
            onValueChange={(role) => roleMutation.mutate({ userId: r["id"] as string, role })}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ROLE_LABEL).map(([v, l]) => (
                <SelectItem key={v} value={v}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      },
    },
    {
      key: "is_active",
      label: "Доступ",
      render: (r) => (
        <Badge variant={r["is_active"] === false ? "outline" : "secondary"}>
          {r["is_active"] === false ? "Заблокирован" : "Активен"}
        </Badge>
      ),
    },
    {
      key: "__actions",
      label: "Действия",
      className: "text-right",
      render: (r) => (
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setEditing(r);
              setForm({
                fullName: String(r["full_name"] ?? ""),
                departmentId: String(r["department_id"] ?? ""),
                positionId: String(r["position_id"] ?? ""),
                professionId: String(r["profession_id"] ?? ""),
                personnelNumber: String(r["personnel_number"] ?? ""),
                grade: String(r["grade"] ?? ""),
              });
            }}
          >
            Изменить
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              blockMutation.mutate({
                userId: r["id"] as string,
                isActive: r["is_active"] === false,
              })
            }
          >
            {r["is_active"] === false ? "Восстановить" : "Блокировать"}
          </Button>
        </div>
      ),
    },
  ];

  const selectField = (
    key: string,
    label: string,
    options: { value: string; label: string }[],
  ) => (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select
        value={form[key] ?? ""}
        onValueChange={(v) => setForm((f) => ({ ...f, [key]: v }))}
      >
        <SelectTrigger>
          <SelectValue placeholder="Не выбрано" />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const textField = (key: string, label: string, type = "text") => (
    <div className="space-y-1.5">
      <Label htmlFor={`u-${key}`}>{label}</Label>
      <Input
        id={`u-${key}`}
        type={type}
        value={form[key] ?? ""}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-secondary">Пользователи</h1>
          <p className="text-sm text-muted-foreground">
            Создание, роли, подразделения, профессии и доступ сотрудников.
          </p>
        </div>
        <Button
          onClick={() => {
            setForm({ role: "employee" });
            setCreateOpen(true);
          }}
        >
          <UserPlus className="mr-1.5 h-4 w-4" />
          Новый пользователь
        </Button>
      </div>

      {users.isPending ? (
        <InlineLoading />
      ) : users.isError ? (
        <ErrorState message={(users.error as Error).message} />
      ) : (
        <AdminTable
          rows={users.data as UserRow[]}
          columns={columns}
          searchKeys={["full_name", "email", "personnel_number"]}
          emptyTitle="Пользователи не найдены"
        />
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Новый пользователь</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {textField("fullName", "ФИО *")}
            {textField("email", "Email *", "email")}
            {textField("password", "Временный пароль * (мин. 8 символов)", "password")}
            {textField("personnelNumber", "Табельный номер")}
            {selectField(
              "role",
              "Роль",
              Object.entries(ROLE_LABEL).map(([v, l]) => ({ value: v, label: l })),
            )}
            {selectField("departmentId", "Подразделение", optionList(departments))}
            {selectField("positionId", "Должность", optionList(positions))}
            {selectField("professionId", "Профессия", optionList(professions))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Отмена
            </Button>
            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
              Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editing)} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Редактирование пользователя</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {textField("fullName", "ФИО")}
            {textField("personnelNumber", "Табельный номер")}
            {textField("grade", "Разряд")}
            {selectField("departmentId", "Подразделение", optionList(departments))}
            {selectField("positionId", "Должность", optionList(positions))}
            {selectField("professionId", "Профессия", optionList(professions))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Отмена
            </Button>
            <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
