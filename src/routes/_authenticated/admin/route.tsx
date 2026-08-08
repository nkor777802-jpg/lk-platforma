import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import {
  BarChart3,
  BookOpen,
  ClipboardList,
  Download,
  FileText,
  FolderTree,
  ListChecks,
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
  { to: "/admin/users", label: "Пользователи", icon: Users },
  { to: "/admin/org", label: "Оргструктура", icon: FolderTree },
  { to: "/admin/courses", label: "Курсы", icon: BookOpen },
  { to: "/admin/materials", label: "Материалы", icon: FileText },
  { to: "/admin/assignments", label: "Назначения", icon: ClipboardList },
  { to: "/admin/development", label: "Развитие", icon: TrendingUp },
  { to: "/admin/gamification", label: "Геймификация", icon: Trophy },
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
    <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <nav className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
          {ADMIN_NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: Boolean((item as { exact?: boolean }).exact) }}
              className="flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              activeProps={{ className: "bg-secondary/10 text-secondary" }}
            >
              <item.icon className="h-4 w-4" />
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
