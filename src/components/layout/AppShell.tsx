import { Link, useRouter } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { LogOut, Shield, User as UserIcon, X } from "lucide-react";
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
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-3 sm:gap-6 sm:px-4">
          <Link to="/dashboard" className="shrink-0">
            <img
              src={brandLogos.markColor}
              alt={brandLogos.alt}
              className="h-8 w-auto sm:hidden"
            />
            <img
              src={brandLogos.fullColor}
              alt={brandLogos.alt}
              className="hidden h-9 w-auto sm:block"
            />
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
          <div className="ml-auto flex items-center gap-0.5 sm:gap-2">
            <NotificationBell />
            {isStaff ? (
              <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
                <Link to="/admin">
                  <Shield className="mr-1.5 h-4 w-4" />
                  Админ-панель
                </Link>
              </Button>
            ) : null}
            <Button
              asChild
              variant="ghost"
              size="icon"
              aria-label="Личный кабинет"
              className="hidden sm:inline-flex"
            >
              <Link to="/profile">
                <UserIcon className="h-5 w-5" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Выйти"
              className="hidden sm:inline-flex"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label={open ? "Закрыть меню" : "Открыть меню"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? (
                <X className="h-5 w-5" />
              ) : (
                <img
                  src={brandLogos.markBlue}
                  alt=""
                  aria-hidden="true"
                  className="h-6 w-auto"
                  width={24}
                  height={24}
                />
              )}
            </Button>
          </div>
        </div>
        {open ? (
          <nav className="max-h-[70vh] overflow-y-auto border-t border-border bg-card px-4 py-2 lg:hidden">
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
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                void handleSignOut();
              }}
              className="mt-1 flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground sm:hidden"
            >
              <LogOut className="h-4 w-4" />
              Выйти
            </button>
          </nav>
        ) : null}
      </header>

      <div className="brand-pattern flex-1">
        <main className="mx-auto w-full min-w-0 max-w-7xl px-3 py-6 sm:px-4 sm:py-8">
          {children}
        </main>
      </div>

      <footer className="border-t border-border bg-secondary py-8 text-secondary-foreground">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 sm:flex-row sm:items-center sm:justify-between">
          <img
            src={brandLogos.fullWhite}
            alt={brandLogos.alt}
            className="h-7 w-auto max-w-[180px] object-contain sm:h-8 sm:max-w-none"
          />
          <p className="break-words text-sm opacity-80">
            Корпоративная платформа обучения и аттестации · {user?.email}
          </p>
        </div>
      </footer>
    </div>
  );
}