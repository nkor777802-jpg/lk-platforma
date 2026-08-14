import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ChevronDown,
  ChevronRight,
  Factory,
  Maximize2,
  Minus,
  Plus,
  Scan,
  Search,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  ancestorsOf,
  buildTree,
  findNode,
  keysMatching,
  matches,
  pathTo,
  type OrgNode,
  type OrgUnitData,
  type OrgWorkCenterLink,
} from "@/lib/org-tree";
import { isBigBranch, OrgPoster } from "./OrgPoster";

interface Props {
  units: OrgUnitData[];
  title?: string;
  subtitle?: string;
  /** Подпись об актуальности данных штатной расстановки. */
  note?: string;
  /** public — без ФИО и ссылок на профили; internal — полный доступ. */
  variant?: "public" | "internal";
  workCenters?: OrgWorkCenterLink[];
  /** Контейнер со схемой (без масштабирования) — для экспорта PNG/SVG. */
  exportRef?: React.RefObject<HTMLDivElement | null>;
  onStateChange?: (state: { focusKey: string | null; expanded: string[] }) => void;
}

function num(v: number) {
  return new Intl.NumberFormat("ru-RU").format(Math.round(v));
}

const LEVEL_STYLES = [
  {
    card: "border-primary/40 bg-primary text-primary-foreground shadow-lg",
    meta: "text-primary-foreground/80",
    line: "bg-primary/50",
  },
  {
    card: "border-secondary/40 bg-secondary text-secondary-foreground shadow-md",
    meta: "text-secondary-foreground/80",
    line: "bg-secondary/40",
  },
  {
    card: "border-accent/50 bg-accent text-accent-foreground shadow-sm",
    meta: "text-accent-foreground/80",
    line: "bg-accent/40",
  },
  {
    card: "border-border bg-card text-card-foreground shadow-sm",
    meta: "text-muted-foreground",
    line: "bg-border",
  },
];

function styleFor(level: number) {
  return LEVEL_STYLES[Math.min(level, LEVEL_STYLES.length - 1)]!;
}

export function OrgGraph({
  units,
  title,
  subtitle,
  note,
  variant = "public",
  workCenters = [],
  exportRef,
  onStateChange,
}: Props) {
  const isMobile = useIsMobile();
  const allRoots = useMemo(() => buildTree(units), [units]);
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const focusNode = useMemo(() => (focusKey ? findNode(allRoots, focusKey) : null), [allRoots, focusKey]);
  const roots = useMemo(() => (focusNode ? [focusNode] : allRoots), [allRoots, focusNode]);
  const focusCrumbs = useMemo(() => (focusKey ? pathTo(allRoots, focusKey) : []), [allRoots, focusKey]);
  const [query, setQuery] = useState("");
  const [zoom, setZoom] = useState(0.9);
  const [fullscreen, setFullscreen] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [detail, setDetail] = useState<OrgNode | null>(null);
  const [drillKey, setDrillKey] = useState<string | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (exportRef) exportRef.current = innerRef.current;
  });

  useEffect(() => {
    onStateChange?.({ focusKey, expanded: [...expanded] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey, expanded]);

  useEffect(() => {
    setExpanded(new Set());
    setPan({ x: 0, y: 0 });
  }, [roots]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      const canvas = canvasRef.current;
      const content = contentRef.current;
      if (!canvas || !content) return;
      const cw = canvas.clientWidth;
      const raw = content.scrollWidth;
      const fit = Math.min(1, Math.max(0.4, (cw - 48) / Math.max(raw, 1)));
      setZoom(fit);
      setPan({ x: Math.round((cw - raw * fit) / 2), y: 0 });
    }, 80);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roots, fullscreen]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      const canvas = canvasRef.current;
      const content = contentRef.current;
      if (!canvas || !content) return;
      const cw = canvas.clientWidth;
      const w = content.scrollWidth * zoom;
      if (w < cw) setPan((p) => ({ x: Math.round((cw - w) / 2), y: p.y }));
    }, 60);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded]);

  const panelKeys = useMemo(() => {
    const top = roots.length === 1 ? roots[0]!.children : roots;
    return top.filter(isBigBranch).map((n) => n.key);
  }, [roots]);

  useEffect(() => {
    if (!query.trim()) return;
    const hits = keysMatching(roots, query);
    if (!hits.length) return;
    const chain = new Set(ancestorsOf(roots, hits));
    setExpanded(new Set(panelKeys.filter((k) => chain.has(k))));
  }, [query, roots, panelKeys]);

  const toggle = (key: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const detailCenters = useMemo(() => {
    if (!detail?.departmentId) return [];
    return workCenters
      .filter((l) => l.departmentId === detail.departmentId && l.center)
      .map((l) => l.center!);
  }, [detail, workCenters]);

  const detailSheet = (
    <Sheet open={Boolean(detail)} onOpenChange={(o) => !o && setDetail(null)}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {detail ? (
          <>
            <SheetHeader>
              <SheetTitle className="text-secondary">{detail.name}</SheetTitle>
              <SheetDescription>
                {detail.unitType ? `${detail.unitType} · ` : ""}Штатных единиц {num(detail.planned)}
              </SheetDescription>
            </SheetHeader>
            {detail.managerName ? (
              <p className="mt-4 text-sm">
                <span className="text-muted-foreground">Руководитель: </span>
                {detail.managerName}
              </p>
            ) : null}
            {detail.children.length ? (
              <Button
                size="sm"
                className="mt-4"
                onClick={() => {
                  setFocusKey(detail.key);
                  setDetail(null);
                }}
              >
                Открыть ветку подразделения
              </Button>
            ) : null}
            {detail.positions.length ? (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-secondary">Должности</h3>
                <ul className="mt-2 space-y-1 text-sm">
                  {detail.positions.map((p) => (
                    <li key={p.name} className="flex justify-between gap-3 border-b border-border py-1">
                      <span className="break-words">{p.name}</span>
                      <span className="shrink-0 text-muted-foreground">{num(p.planned)} ед.</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {detail.children.length ? (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-secondary">Входящие подразделения</h3>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {detail.children.map((c) => (
                    <li key={c.key} className="break-words">
                      {c.name}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {variant === "internal" && detail.people.some((p) => p.fullName) ? (
              <div className="mt-6">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-secondary">
                  <Users className="h-4 w-4" /> Сотрудники
                </h3>
                <ul className="mt-2 space-y-1 text-sm">
                  {detail.people
                    .filter((p) => p.fullName)
                    .map((p, i) => (
                      <li key={`${p.fullName}-${i}`} className="border-b border-border py-1">
                        {p.profileId ? (
                          <Link to="/admin/users" className="font-medium text-secondary hover:underline">
                            {p.fullName}
                          </Link>
                        ) : (
                          <span className="font-medium">{p.fullName}</span>
                        )}
                        <span className="block text-xs text-muted-foreground break-words">{p.positionName}</span>
                      </li>
                    ))}
                </ul>
              </div>
            ) : null}
            {variant === "internal" && detailCenters.length ? (
              <div className="mt-6">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-secondary">
                  <Factory className="h-4 w-4" /> Рабочие центры
                </h3>
                <ul className="mt-2 space-y-1 text-sm">
                  {detailCenters.map((c) => (
                    <li key={c.id} className="border-b border-border py-1">
                      <span className="font-medium break-words">{c.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {[c.code, c.site, c.area, c.process].filter(Boolean).join(" · ") || "—"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );

  // --- Мобильный пошаговый режим ---
  if (isMobile) {
    const currentNode = drillKey ? findNode(roots, drillKey) : null;
    const list = currentNode ? currentNode.children : roots;
    const crumbs = drillKey ? pathTo(roots, drillKey) : [];
    const q = query.trim().toLowerCase();
    const hits = q
      ? units
          .filter(
            (u) =>
              u.name.toLowerCase().includes(q) ||
              (u.managerName ?? "").toLowerCase().includes(q) ||
              u.positions.some((p) => p.name.toLowerCase().includes(q)) ||
              u.people.some((p) => (p.fullName ?? "").toLowerCase().includes(q)),
          )
          .slice(0, 30)
      : [];

    return (
      <div className="space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск подразделения"
            className="pl-9"
          />
        </div>

        {query.trim() ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Найдено: {hits.length}</p>
            {hits.map((u) => (
              <button
                key={u.key}
                type="button"
                onClick={() => {
                  setDrillKey(u.key);
                  setQuery("");
                }}
                className="w-full rounded-lg border border-border bg-card px-3 py-3 text-left"
              >
                <span className="font-medium text-secondary break-words">{u.name}</span>
              </button>
            ))}
          </div>
        ) : (
          <>
            <nav className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
              <button type="button" className="hover:underline" onClick={() => setDrillKey(null)}>
                Вся структура
              </button>
              {crumbs.map((c) => (
                <span key={c.key} className="flex items-center gap-1">
                  <ChevronRight className="h-3 w-3" />
                  <button type="button" className="break-words text-left hover:underline" onClick={() => setDrillKey(c.key)}>
                    {c.name}
                  </button>
                </span>
              ))}
            </nav>

            {currentNode ? (
              <div className={`rounded-xl border px-4 py-3 ${styleFor(currentNode.level).card}`}>
                <p className="text-base font-semibold break-words">{currentNode.name}</p>
                {currentNode.managerName ? (
                  <p className={`mt-1 text-xs ${styleFor(currentNode.level).meta}`}>{currentNode.managerName}</p>
                ) : null}
                <p className={`mt-2 text-xs ${styleFor(currentNode.level).meta}`}>
                  Штат {num(currentNode.planned)} · Должностей {num(currentNode.positions.length)}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 bg-background text-foreground"
                  onClick={() => setDetail(currentNode)}
                >
                  Подробнее
                </Button>
              </div>
            ) : null}

            <div className="space-y-2">
              {list.map((n) => (
                <button
                  key={n.key}
                  type="button"
                  onClick={() => setDrillKey(n.key)}
                  className="flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-3 text-left transition-colors hover:border-secondary"
                >
                  <span className="min-w-0">
                    <span className="block font-medium text-secondary break-words">{n.name}</span>
                    <span className="block text-xs text-muted-foreground">Штат {num(n.planned)}</span>
                  </span>
                  {n.children.length ? <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" /> : null}
                </button>
              ))}
              {list.length === 0 ? (
                <p className="text-sm text-muted-foreground">Вложенных подразделений нет.</p>
              ) : null}
            </div>
          </>
        )}
        {detailSheet}
      </div>
    );
  }

  return (
    <div
      className={
        fullscreen
          ? "fixed inset-0 z-50 flex flex-col overflow-hidden bg-background"
          : "flex flex-col overflow-hidden rounded-xl border border-border bg-background"
      }
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
        <div className="mr-auto min-w-0">
          {title ? <p className="truncate font-semibold text-secondary">{title}</p> : null}
          {subtitle ? <p className="truncate text-xs text-muted-foreground">{subtitle}</p> : null}
        </div>

        <div className="relative w-56">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск"
            className="h-9 pl-9"
          />
        </div>

        <Button variant="outline" size="sm" className="h-9" onClick={() => setExpanded(new Set(panelKeys))}>
          Развернуть всё
        </Button>
        <Button variant="outline" size="sm" className="h-9" onClick={() => setExpanded(new Set())}>
          Свернуть всё
        </Button>

        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setZoom((z) => Math.max(0.35, z - 0.1))} aria-label="Уменьшить">
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-12 text-center text-xs text-muted-foreground">{Math.round(zoom * 100)}%</span>
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setZoom((z) => Math.min(1.6, z + 0.1))} aria-label="Увеличить">
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => {
              const canvas = canvasRef.current;
              const content = contentRef.current;
              if (canvas && content) {
                const cw = canvas.clientWidth;
                const raw = content.scrollWidth / zoom;
                const fit = Math.min(1, Math.max(0.4, (cw - 48) / Math.max(raw, 1)));
                setZoom(fit);
                setPan({ x: Math.round((cw - raw * fit) / 2), y: 0 });
              }
            }}
            aria-label="Сбросить вид"
          >
            <Scan className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setFullscreen((f) => !f)} aria-label="Во весь экран">
            {fullscreen ? <X className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <nav className="flex flex-wrap items-center gap-1 border-b border-border px-3 py-2 text-xs text-muted-foreground">
        <button type="button" className="hover:underline" onClick={() => setFocusKey(null)}>
          Вся структура
        </button>
        {focusCrumbs.map((c) => (
          <span key={c.key} className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3" />
            <button
              type="button"
              className="text-left hover:underline"
              onClick={() => setFocusKey(c.key)}
            >
              {c.name}
            </button>
          </span>
        ))}
      </nav>

      <div
        ref={canvasRef}
        className={[
          "org-canvas relative cursor-grab overflow-hidden bg-muted/30 active:cursor-grabbing",
          fullscreen ? "flex-1" : "h-[70vh]",
        ].join(" ")}
        onPointerDown={(e) => {
          dragRef.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          const d = dragRef.current;
          if (!d) return;
          setPan({ x: d.px + (e.clientX - d.x), y: d.py + (e.clientY - d.y) });
        }}
        onPointerUp={() => {
          dragRef.current = null;
        }}
        onPointerLeave={() => {
          dragRef.current = null;
        }}
        onWheel={(e) => {
          if (!e.ctrlKey && !e.metaKey) return;
          e.preventDefault();
          setZoom((z) => Math.min(1.6, Math.max(0.35, z - e.deltaY * 0.001)));
        }}
      >
        <div
          ref={contentRef}
          className="w-max origin-top-left"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
        >
          <div ref={innerRef} className="bg-background">
            <OrgPoster
              roots={roots}
              note={note}
              query={query}
              onOpen={(n) => setDetail(n)}
              openPanels={expanded}
              onTogglePanel={toggle}
            />
          </div>
        </div>
        {roots.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">Структура не загружена.</p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-4 border-t border-border px-3 py-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-primary" aria-hidden /> Руководство
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-secondary" aria-hidden /> Службы, отделы и цеха
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-accent" aria-hidden /> Участки, смены, рабочие центры
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" aria-hidden /> Рабочие места и профессии
        </span>
        <span className="ml-auto">Перетаскивайте схему мышью, Ctrl + колесо — масштаб</span>
      </div>

      {detailSheet}
    </div>
  );
}
