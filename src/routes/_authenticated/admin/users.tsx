import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Copy, Download, Eye, EyeOff, RefreshCw, UserPlus } from "lucide-react";
import { adminTableQuery, adminUsersQuery } from "@/lib/admin-queries";
import { createAdminUser, setUserRoles, updateAdminUser } from "@/lib/admin.functions";
import { ROLE_LABEL, getAssignableRoles, primaryRole, type AppRole } from "@/lib/roles";
import { useAuth } from "@/hooks/useAuth";
import { AdminTable, type Column } from "@/components/admin/AdminTable";
import { RoleMultiSelect } from "@/components/admin/RoleMultiSelect";
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

function downloadCredentialsCsv(rows: { fullName: string; email: string; password: string }[]) {
  const csv = [
    ["ФИО", "Логин (email)", "Пароль", "Роль"],
    ...rows.map((r) => [r.fullName, r.email, r.password, "Сотрудник"]),
  ]
    .map((line) => line.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(";"))
    .join("\r\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Учетные_данные_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function generatePassword(length = 16) {
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const upper = "ABCDEFGHJKMNPQRSTUVWXYZ";
  const digits = "23456789";
  const symbols = "!@#$%^&*-_=+?";
  const all = lower + upper + digits + symbols;
  let pwd = "";
  pwd += lower.charAt(Math.floor(Math.random() * lower.length));
  pwd += upper.charAt(Math.floor(Math.random() * upper.length));
  pwd += digits.charAt(Math.floor(Math.random() * digits.length));
  pwd += symbols.charAt(Math.floor(Math.random() * symbols.length));
  for (let i = 4; i < length; i++) {
    pwd += all.charAt(Math.floor(Math.random() * all.length));
  }
  return pwd
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

function normalizePasswordError(message: string) {
  if (message.toLowerCase().includes("weak") || message.toLowerCase().includes("pwned")) {
    return "Пароль слишком простой или скомпрометирован. Сгенерируйте другой.";
  }
  return message;
}

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: AdminUsersPage,
});

type UserRow = Record<string, unknown>;

function AdminUsersPage() {
  const qc = useQueryClient();
  const { roles: actorRoles, isStaff, loading: authLoading } = useAuth();
  const assignableRoles = getAssignableRoles(actorRoles);

  const users = useQuery(adminUsersQuery);
  const departments = useQuery(adminTableQuery("departments", "id, name", "name"));
  const positions = useQuery(adminTableQuery("positions", "id, name", "name"));
  const professions = useQuery(adminTableQuery("professions", "id, name", "name"));

  const createFn = useServerFn(createAdminUser);
  const updateFn = useServerFn(updateAdminUser);
  const rolesFn = useServerFn(setUserRoles);

  const [createOpen, setCreateOpen] = useState(false);
  const [createRoles, setCreateRoles] = useState<AppRole[]>(["employee"]);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{
    fullName: string;
    email: string;
    password: string;
  } | null>(null);

  useEffect(() => {
    if (createOpen && !form["password"]) {
      setForm((f) => ({ ...f, password: generatePassword() }));
    }
  }, [createOpen]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin"] });

  const createMutation = useMutation({
    mutationFn: () =>
      createFn({
        data: {
          email: form["email"] ?? "",
          password: form["password"] ?? "",
          fullName: form["fullName"] ?? "",
          roles: createRoles,
          departmentId: form["departmentId"] || null,
          positionId: form["positionId"] || null,
          professionId: form["professionId"] || null,
          personnelNumber: form["personnelNumber"] || null,
        },
      }),
    onSuccess: () => {
      toast.success("Пользователь создан");
      const credentials = {
        fullName: form["fullName"] ?? "",
        email: form["email"] ?? "",
        password: form["password"] ?? "",
      };
      setCreatedCredentials(credentials);
      downloadCredentialsCsv([credentials]);
      setCreateOpen(false);
      setForm({});
      setCreateRoles(["employee"]);
      setShowCreatePassword(false);
      void invalidate();
    },
    onError: (e: Error) => toast.error(normalizePasswordError(e.message)),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      updateFn({
        data: {
          userId: editing?.["id"] as string,
          fullName: form["fullName"] || undefined,
          email: form["email"] || undefined,
          departmentId: form["departmentId"] || null,
          positionId: form["positionId"] || null,
          professionId: form["professionId"] || null,
          personnelNumber: form["personnelNumber"] || null,
          grade: form["grade"] || null,
          password: form["editPassword"] || undefined,
        },
      }),
    onSuccess: () => {
      toast.success("Профиль обновлён");
      setEditing(null);
      setShowEditPassword(false);
      void invalidate();
    },
    onError: (e: Error) => toast.error(normalizePasswordError(e.message)),
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
    mutationFn: (p: { userId: string; roles: AppRole[] }) =>
      rolesFn({ data: { userId: p.userId, roles: p.roles } }),
    onSuccess: () => {
      toast.success("Роли обновлены");
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
      label: "Роли",
      render: (r) => {
        const currentRoles = (r["roles"] as AppRole[]) ?? [];
        const lockedRoles = currentRoles.filter((r) => !assignableRoles.includes(r));
        const editableRoles = currentRoles.filter((r) => assignableRoles.includes(r));
        const main = primaryRole(currentRoles);
        return (
          <div className="flex min-w-[16rem] flex-wrap items-center gap-2">
            <Badge variant="secondary">{ROLE_LABEL[main]}</Badge>
            <RoleMultiSelect
              value={editableRoles}
              options={assignableRoles}
              disabledOptions={lockedRoles}
              placeholder="Изменить роли"
              onChange={(next) => roleMutation.mutate({ userId: r["id"] as string, roles: next })}
            />
          </div>
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
                email: String(r["email"] ?? ""),
                departmentId: String(r["department_id"] ?? ""),
                positionId: String(r["position_id"] ?? ""),
                professionId: String(r["profession_id"] ?? ""),
                personnelNumber: String(r["personnel_number"] ?? ""),
                grade: String(r["grade"] ?? ""),
                editPassword: "",
              });
              setShowEditPassword(false);
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

  const passwordField = (key: string, label: string, show: boolean, setShow: (v: boolean) => void, canRegenerate = false) => (
    <div className="space-y-1.5">
      <Label htmlFor={`u-${key}`}>{label}</Label>
      <div className="flex gap-2">
        <Input
          id={`u-${key}`}
          type={show ? "text" : "password"}
          value={form[key] ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setShow(!show)}
          title={show ? "Скрыть" : "Показать"}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => {
            void navigator.clipboard.writeText(form[key] ?? "");
            toast.success("Пароль скопирован");
          }}
          title="Скопировать"
        >
          <Copy className="h-4 w-4" />
        </Button>
        {canRegenerate && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setForm((f) => ({ ...f, [key]: generatePassword() }))}
            title="Сгенерировать новый"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );

  if (authLoading) return <InlineLoading />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-secondary">Пользователи</h1>
          <p className="text-sm text-muted-foreground">
            Создание, роли, подразделения, профессии и доступ сотрудников.
          </p>
        </div>
        {isStaff && (
          <Button
            onClick={() => {
              setForm({});
              setCreateRoles(["employee"]);
              setCreateOpen(true);
            }}
          >
            <UserPlus className="mr-1.5 h-4 w-4" />
            Новый пользователь
          </Button>
        )}
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
            {passwordField(
              "password",
              "Временный пароль * (мин. 8 символов)",
              showCreatePassword,
              setShowCreatePassword,
              true,
            )}
            {textField("personnelNumber", "Табельный номер")}
            <div className="space-y-1.5">
              <Label>Роли</Label>
              <RoleMultiSelect
                value={createRoles}
                options={assignableRoles}
                onChange={setCreateRoles}
              />
            </div>
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

      <Dialog open={Boolean(createdCredentials)} onOpenChange={() => setCreatedCredentials(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Учётные данные сотрудника</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Передайте сотруднику логин и пароль — письмо не отправляется.
            </p>
            <div className="space-y-1.5">
              <Label>Логин (email)</Label>
              <div className="flex gap-2">
                <Input readOnly value={createdCredentials?.email ?? ""} className="flex-1" />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    void navigator.clipboard.writeText(createdCredentials?.email ?? "");
                    toast.success("Логин скопирован");
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Пароль</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  type={showCreatePassword ? "text" : "password"}
                  value={createdCredentials?.password ?? ""}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowCreatePassword(!showCreatePassword)}
                >
                  {showCreatePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    void navigator.clipboard.writeText(createdCredentials?.password ?? "");
                    toast.success("Пароль скопирован");
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setCreatedCredentials(null)}>Закрыть</Button>
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
            {textField("email", "Email", "email")}
            {passwordField(
              "editPassword",
              "Новый пароль (мин. 8 символов, оставьте пустым, чтобы не менять)",
              showEditPassword,
              setShowEditPassword,
              true,
            )}
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
