import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  BarChart3,
  BookOpen,
  ClipboardList,
  Download,
  Factory,
  FileText,
  FolderTree,
  Inbox,
  ListChecks,
  Lock,
  Menu,
  PenLine,
  ScrollText,
  Settings,
  Trophy,
  TrendingUp,
  Upload,
  Users,
  Sparkles,
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { EmptyState, InlineLoading } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { unlockAdminPanel } from "@/lib/admin-unlock.functions";
import { adminUnlockKey } from "@/lib/admin-unlock";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Админ-панель — Академия «Людиновокабель»" },
      {
        name: "description",
        content: "Управление пользователями, курсами, тестами, справочниками и настройками платформы.",
      },
      { property: "og:title", content: "Админ-панель платформы обучения" },
      { property: "og:description", content: "Пользователи, курсы, тесты, справочники, журнал действий." },
    ],
  }),
  component: AdminLayout,
});

/** Роли соответствуют серверным проверкам доступа для каждого раздела. */
const ALL = ["admin", "hr", "teacher", "manager"] as const;
const STAFF = ["admin", "hr"] as const;

export const ADMIN_NAV = [
  { to: "/admin", label: "Обзор", icon: BarChart3, exact: true, roles: ALL },
  { to: "/admin/analytics", label: "Аналитика", icon: BarChart3, roles: ALL },
  { to: "/admin/users", label: "Пользователи", icon: Users, roles: ["admin", "hr", "manager"] },
  { to: "/admin/org", label: "Оргструктура", icon: FolderTree, roles: STAFF },
  { to: "/admin/courses", label: "Курсы", icon: BookOpen, roles: ["admin", "hr", "teacher"] },
  { to: "/admin/materials", label: "Материалы", icon: FileText, roles: ["admin", "hr", "teacher"] },
  { to: "/admin/onboarding", label: "Адаптация", icon: Sparkles, roles: ["admin", "hr", "manager"] },
  { to: "/admin/assignments", label: "Назначения", icon: ClipboardList, roles: ["admin", "hr", "manager"] },
  { to: "/admin/requests", label: "Заявки", icon: Inbox, roles: STAFF },
  { to: "/admin/development", label: "Развитие", icon: TrendingUp, roles: STAFF },

  { to: "/admin/gamification", label: "Геймификация", icon: Trophy, roles: STAFF },
  { to: "/admin/production", label: "Производственные данные", icon: Factory, roles: STAFF },
  { to: "/admin/tests", label: "Тесты", icon: ListChecks, roles: ["admin", "hr", "teacher"] },
  { to: "/admin/reviews", label: "Проверка ответов", icon: PenLine, roles: ["admin", "hr", "teacher"] },
  { to: "/admin/dictionaries", label: "Справочники", icon: FolderTree, roles: STAFF },
  { to: "/admin/import", label: "Импорт", icon: Upload, roles: ["admin", "hr", "teacher"] },
  { to: "/admin/export", label: "Экспорт", icon: Download, roles: ALL },
  { to: "/admin/audit", label: "Журнал действий", icon: ScrollText, roles: ["admin"] },
  { to: "/admin/settings", label: "Настройки", icon: Settings, roles: ["admin"] },
] as const;

function AdminLayout() {
  const { roles, loading, user } = useAuth();
  const allowed = roles.some((r) => ["admin", "hr", "teacher", "manager"].includes(r));
  const navItems = ADMIN_NAV.filter((item) =>
    (item.roles as readonly string[]).some((r) => roles.includes(r as never)),
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const currentLabel =
    [...navItems]
      .sort((a, b) => b.to.length - a.to.length)
      .find((i) => pathname === i.to || pathname.startsWith(`${i.to}/`))?.label ?? "Обзор";

  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const unlock = useServerFn(unlockAdminPanel);

  useEffect(() => {
    if (!user?.id) return;
    setUnlocked(sessionStorage.getItem(adminUnlockKey(user.id)) === "1");
  }, [user?.id]);

  const handleUnlock = async (e: FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setPending(true);
    setError(null);
    try {
      const res = await unlock({ data: { password } });
      if (res.ok) {
        sessionStorage.setItem(adminUnlockKey(user.id), "1");
        setUnlocked(true);
        setPassword("");
      } else {
        setError("Неверный пароль");
      }
    } catch {
      setError("Не удалось проверить пароль. Повторите попытку.");
    } finally {
      setPending(false);
    }
  };

  /** Раздел, открытый по прямой ссылке, тоже проверяется по ролям. */
  const section = [...ADMIN_NAV]
    .sort((a, b) => b.to.length - a.to.length)
    .find((i) =>
      (i as { exact?: boolean }).exact
        ? pathname === i.to
        : pathname === i.to || pathname.startsWith(`${i.to}/`),
    );
  const sectionAllowed =
    !section || (section.roles as readonly string[]).some((r) => roles.includes(r as never));

  if (loading) return <InlineLoading />;
  if (!allowed)
    return (
      <EmptyState
        title="Доступ ограничен"
        description="Административная панель доступна администраторам, HR, преподавателям и руководителям."
        action={
          <Link to="/dashboard" className="text-primary hover:underline">
            Вернуться на главную
          </Link>
        }
      />
    );

  if (!unlocked)
    return (
      <div className="mx-auto w-full max-w-md">
        <form
          onSubmit={handleUnlock}
          className="rounded-xl border border-border bg-card p-6 shadow-sm"
        >
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
              <Lock className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Доступ к админ-панели</h1>
              <p className="text-sm text-muted-foreground">
                Введите дополнительный пароль доступа
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-panel-password">Пароль доступа</Label>
            <Input
              id="admin-panel-password"
              type="password"
              autoComplete="off"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
          <Button type="submit" className="mt-4 w-full" disabled={pending || !password}>
            {pending ? "Проверка…" : "Открыть панель"}
          </Button>
          <Link
            to="/dashboard"
            className="mt-3 block text-center text-sm text-muted-foreground hover:text-foreground"
          >
            Вернуться в личный кабинет
          </Link>
        </form>
      </div>
    );

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8">
      <div className="lg:hidden">
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full justify-start gap-2">
              <Menu className="h-4 w-4 shrink-0" />
              <span className="truncate">Разделы · {currentLabel}</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[17rem] overflow-y-auto p-4">
            <nav className="mt-8 flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  activeOptions={{ exact: Boolean((item as { exact?: boolean }).exact) }}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  activeProps={{ className: "bg-secondary/10 text-secondary" }}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
      <aside className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: Boolean((item as { exact?: boolean }).exact) }}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              activeProps={{ className: "bg-secondary/10 text-secondary" }}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="min-w-0">
        {sectionAllowed ? (
          <Outlet />
        ) : (
          <EmptyState
            title="Доступ ограничен"
            description="У вашей роли нет прав на этот раздел админ-панели."
            action={
              <Link to="/admin" className="text-primary hover:underline">
                Вернуться к обзору
              </Link>
            }
          />
        )}
      </div>
    </div>
  );
}
