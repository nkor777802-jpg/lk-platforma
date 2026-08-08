import { Link, useRouter } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { LogOut, Menu, Shield, User as UserIcon, X } from "lucide-react";
import { brandLogos } from "@/lib/brand";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/layout/NotificationBell";

const NAV = [
  { to: "/dashboard", label: "Главная" },
  { to: "/learning", label: "Мое обучение" },
  { to: "/tests", label: "Тесты" },
  { to: "/results", label: "Результаты" },
  { to: "/development", label: "Развитие" },
  { to: "/gamification", label: "Навыки" },
  { to: "/certificates", label: "Сертификаты" },
  { to: "/profile", label: "Профиль" },
] as const;

const SECONDARY_NAV = [
  { to: "/company", label: "О компании" },
  { to: "/products", label: "Продукция" },
  { to: "/professions", label: "Профессии" },
  { to: "/library", label: "Библиотека" },
  { to: "/videos", label: "Видео" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { isStaff, signOut, user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    void router.navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-6 px-4">
          <Link to="/dashboard" className="shrink-0">
            <img src={brandLogos.fullColor} alt={brandLogos.alt} className="h-9 w-auto" />
          </Link>
          <nav className="hidden flex-1 items-center gap-1 lg:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                activeProps={{ className: "bg-secondary/10 text-secondary" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <NotificationBell />
            {isStaff ? (
              <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
                <Link to="/admin">
                  <Shield className="mr-1.5 h-4 w-4" />
                  Админ-панель
                </Link>
              </Button>
            ) : null}
            <Button asChild variant="ghost" size="icon" aria-label="Личный кабинет">
              <Link to="/profile">
                <UserIcon className="h-5 w-5" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" aria-label="Выйти" onClick={handleSignOut}>
              <LogOut className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label="Меню"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
        {open ? (
          <nav className="border-t border-border bg-card px-4 py-2 lg:hidden">
            {[...NAV, ...SECONDARY_NAV].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                activeProps={{ className: "bg-secondary/10 text-secondary" }}
              >
                {item.label}
              </Link>
            ))}
            {isStaff ? (
              <Link
                to="/admin"
                onClick={() => setOpen(false)}
                className="block rounded-md px-3 py-2 text-sm font-medium text-primary"
              >
                Админ-панель
              </Link>
            ) : null}
          </nav>
        ) : null}
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">{children}</main>

      <footer className="border-t border-border bg-secondary py-8 text-secondary-foreground">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 sm:flex-row sm:items-center sm:justify-between">
          <img src={brandLogos.fullWhite} alt={brandLogos.alt} className="h-8 w-auto" />
          <p className="text-sm opacity-80">
            Корпоративная платформа обучения и аттестации · {user?.email}
          </p>
        </div>
      </footer>
    </div>
  );
}