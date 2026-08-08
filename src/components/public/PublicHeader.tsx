import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { X } from "lucide-react";
import { brandLogos } from "@/lib/brand";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/", label: "Главная" },
  { to: "/about", label: "О предприятии" },
  { to: "/training", label: "Обучение" },
  { to: "/training/professions", label: "Профессии" },
  { to: "/faq", label: "Вопросы" },
  { to: "/contacts", label: "Контакты" },
] as const;

export function PublicHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-4">
        <Link to="/" className="shrink-0" aria-label="На главную">
          <img
            src={brandLogos.fullCompactColor}
            alt={brandLogos.alt}
            className="h-12 w-auto object-contain sm:hidden"
            width={47}
            height={48}
          />
          <img
            src={brandLogos.fullColor}
            alt={brandLogos.alt}
            className="hidden h-9 w-auto max-w-[200px] object-contain sm:block lg:h-10"
            width={112}
            height={40}
          />
        </Link>

        <nav aria-label="Основная навигация" className="hidden flex-1 items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              activeProps={{ className: "bg-secondary/10 text-secondary" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button asChild size="sm">
            <Link to="/auth">Войти</Link>
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
        <nav aria-label="Мобильная навигация" className="border-t border-border bg-card lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col p-2">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                activeProps={{ className: "bg-secondary/10 text-secondary" }}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
