import { useState } from "react";
import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  BookOpen,
  ClipboardList,
  Download,
  Factory,
  FileText,
  FolderTree,
  ListChecks,
  Menu,
  PenLine,
  ScrollText,
  Settings,
  Trophy,
  TrendingUp,
  Upload,
  Users,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { EmptyState, InlineLoading } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

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

export const ADMIN_NAV = [
  { to: "/admin", label: "Обзор", icon: BarChart3, exact: true },
  { to: "/admin/analytics", label: "Аналитика", icon: BarChart3 },
  { to: "/admin/users", label: "Пользователи", icon: Users },
  { to: "/admin/org", label: "Оргструктура", icon: FolderTree },
  { to: "/admin/courses", label: "Курсы", icon: BookOpen },
  { to: "/admin/materials", label: "Материалы", icon: FileText },
  { to: "/admin/assignments", label: "Назначения", icon: ClipboardList },
  { to: "/admin/development", label: "Развитие", icon: TrendingUp },
  { to: "/admin/gamification", label: "Геймификация", icon: Trophy },
  { to: "/admin/production", label: "Производственные данные", icon: Factory },
  { to: "/admin/tests", label: "Тесты", icon: ListChecks },
  { to: "/admin/reviews", label: "Проверка ответов", icon: PenLine },
  { to: "/admin/dictionaries", label: "Справочники", icon: FolderTree },
  { to: "/admin/import", label: "Импорт", icon: Upload },
  { to: "/admin/export", label: "Экспорт", icon: Download },
  { to: "/admin/audit", label: "Журнал действий", icon: ScrollText },
  { to: "/admin/settings", label: "Настройки", icon: Settings },
] as const;

function AdminLayout() {
  const { roles, loading } = useAuth();
  const allowed = roles.some((r) => ["admin", "hr", "teacher", "manager"].includes(r));
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const currentLabel =
    [...ADMIN_NAV]
      .sort((a, b) => b.to.length - a.to.length)
      .find((i) => pathname === i.to || pathname.startsWith(`${i.to}/`))?.label ?? "Обзор";

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
              {ADMIN_NAV.map((item) => (
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
          {ADMIN_NAV.map((item) => (
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
        <Outlet />
      </div>
    </div>
  );
}
