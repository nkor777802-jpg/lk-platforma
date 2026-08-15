import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, GraduationCap, X } from "lucide-react";
import { brandLogos } from "@/lib/brand";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

type NavLink = { to: string; label: string };
type NavGroup = { label: string; items: NavLink[] };
type NavEntry = NavLink | NavGroup;

const NAV: NavEntry[] = [
  { to: "/", label: "Главная" },
  {
    label: "АО «Людиновокабель»",
    items: [
      { to: "/about", label: "О предприятии" },
      { to: "/structure", label: "Структура" },
      { to: "/management", label: "Руководство" },
    ],
  },
  {
    label: "Структура обучения",
    items: [
      { to: "/training", label: "Структура обучения" },
      { to: "/training/professions", label: "Возможные профессии для обучения" },
    ],
  },
  { to: "/faq", label: "Частые вопросы" },
  { to: "/contacts", label: "Контакты" },
];

function isGroup(e: NavEntry): e is NavGroup {
  return "items" in e;
}

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  const linkClass =
    "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-4">
        <Link to="/" className="notranslate shrink-0" translate="no" aria-label="На главную">
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

        <nav
          aria-label="Основная навигация"
          translate="no"
          className="notranslate hidden flex-1 items-center gap-1 lg:flex"
        >
          {NAV.map((entry) =>
            isGroup(entry) ? (
              <DropdownMenu key={entry.label}>
                <DropdownMenuTrigger
                  className={`${linkClass} group inline-flex items-center gap-1 data-[state=open]:bg-secondary/10 data-[state=open]:text-secondary`}
                >
                  {entry.label}
                  <ChevronDown
                    className="h-4 w-4 transition-transform duration-200 ease-out group-data-[state=open]:rotate-180"
                    aria-hidden
                  />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  sideOffset={8}
                  className="notranslate nav-dropdown min-w-56 overflow-hidden"
                >
                  {entry.items.map((item, i) => (
                    <DropdownMenuItem
                      key={item.to}
                      asChild
                      className="nav-dropdown-item"
                      style={{ animationDelay: `${60 + i * 40}ms` }}
                    >
                      <Link
                        to={item.to}
                        className="cursor-pointer"
                        activeProps={{ className: "bg-secondary/10 text-secondary" }}
                      >
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                key={entry.to}
                to={entry.to}
                activeOptions={{ exact: entry.to === "/" }}
                className={linkClass}
                activeProps={{ className: "bg-secondary/10 text-secondary" }}
              >
                {entry.label}
              </Link>
            ),
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button asChild size="sm">
            <Link to="/auth">
              <GraduationCap className="mr-1.5 h-4 w-4" />
              Моё обучение
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 lg:hidden"
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
        <nav
          aria-label="Мобильная навигация"
          translate="no"
          className="notranslate border-t border-border bg-card lg:hidden"
        >
          <div className="mx-auto flex max-w-7xl flex-col p-2">
            {NAV.map((entry) =>
              isGroup(entry) ? (
                <Collapsible key={entry.label}>
                  <CollapsibleTrigger className="group flex w-full items-center justify-between rounded-md px-3 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-[state=open]:text-secondary">
                    {entry.label}
                    <ChevronDown
                      className="h-4 w-4 transition-transform duration-200 ease-out group-data-[state=open]:rotate-180"
                      aria-hidden
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                    <div className="flex flex-col pl-3">
                    {entry.items.map((item, i) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setOpen(false)}
                        style={{ animationDelay: `${60 + i * 40}ms` }}
                        className="nav-dropdown-item rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                        activeProps={{ className: "bg-secondary/10 text-secondary" }}
                      >
                        {item.label}
                      </Link>
                    ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <Link
                  key={entry.to}
                  to={entry.to}
                  activeOptions={{ exact: entry.to === "/" }}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                  activeProps={{ className: "bg-secondary/10 text-secondary" }}
                >
                  {entry.label}
                </Link>
              ),
            )}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
