import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Maximize2,
  Minus,
  Plus,
  Scan,
  Search,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  ORG_MODES,
  ancestorsOf,
  buildTree,
  defaultExpanded,
  findNode,
  headPositionOf,
  keysMatching,
  matches,
  pathTo,
  type OrgMode,
  type OrgNode,
  type OrgUnitData,
} from "@/lib/org-tree";

interface Props {
  units: OrgUnitData[];
  workCenters?: { departmentId: string | null; center: { id: string; code: string | null; name: string; site: string | null; area: string | null; process: string | null } | null }[];
  title?: string;
  subtitle?: string;
  /** public — без ФИО и режимов с персональными данными. */
  variant?: "internal" | "public";
}

function num(v: number) {
  return Number.isInteger(v) ? String(v) : String(Math.round(v * 100) / 100);
}

function NodeCard({
  node,
  mode,
  highlighted,
  focused,
  centers,
  onFocus,
}: {
  node: OrgNode;
  mode: OrgMode;
  highlighted: boolean;
  focused: boolean;
  centers: string[];
  onFocus: () => void;
}) {
  const isRoot = node.level === 0;
  return (
    <button
      type="button"
      onClick={onFocus}
      className={[
        "w-full rounded-lg border bg-card px-3 py-2 text-left transition-colors",
        "hover:border-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary",
        highlighted ? "border-accent ring-1 ring-accent" : "border-border",
        focused ? "border-secondary ring-1 ring-secondary" : "",
      ].join(" ")}
    >
      <div
        className={[
          "font-semibold text-secondary break-words",
          isRoot ? "text-base sm:text-lg" : node.level === 1 ? "text-sm sm:text-base" : "text-sm",
        ].join(" ")}
      >
        {node.name}
      </div>
      {node.unitType ? (
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{node.unitType}</div>
      ) : null}

      {(mode === "org" || mode === "managers") && headPositionOf(node) ? (
        <div className="mt-1 text-xs text-foreground/80 break-words">Рук.: {headPositionOf(node)}</div>
      ) : null}

      {mode === "staffing" || mode === "org" ? (
        <div className="mt-2 flex flex-wrap gap-1">
          <Badge variant="secondary" className="text-[11px]">Штат {num(node.planned)}</Badge>
          <Badge variant="outline" className="text-[11px]">Факт {num(node.actual)}</Badge>
          {node.vacant > 0 ? (
            <Badge className="bg-primary text-primary-foreground text-[11px]">Вакансии {num(node.vacant)}</Badge>
          ) : null}
        </div>
      ) : null}

      {mode === "positions" && node.positions.length ? (
        <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
          {node.positions.slice(0, 8).map((p) => (
            <li key={p.name} className="break-words">
              {p.name} — {num(p.planned)} ед.
            </li>
          ))}
          {node.positions.length > 8 ? <li>и ещё {node.positions.length - 8}…</li> : null}
        </ul>
      ) : null}

      {mode === "employees" && node.people.length ? (
        <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
          {node.people.slice(0, 10).map((p, i) => (
            <li key={`${p.positionName}-${i}`} className="break-words">
              {p.isVacancy ? "Вакансия" : (p.fullName ?? "—")} · {p.positionName}
            </li>
          ))}
          {node.people.length > 10 ? <li>и ещё {node.people.length - 10}…</li> : null}
        </ul>
      ) : null}

      {mode === "production" && centers.length ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {centers.map((c) => (
            <Badge key={c} variant="outline" className="text-[11px]">
              {c}
            </Badge>
          ))}
        </div>
      ) : null}
    </button>
  );
}

function TreeBranch({
  node,
  mode,
  expanded,
  toggle,
  query,
  focusKey,
  onFocus,
  centersOf,
}: {
  node: OrgNode;
  mode: OrgMode;
  expanded: Set<string>;
  toggle: (key: string) => void;
  query: string;
  focusKey: string | null;
  onFocus: (key: string) => void;
  centersOf: (node: OrgNode) => string[];
}) {
  const isOpen = expanded.has(node.key);
  const hasChildren = node.children.length > 0;
  return (
    <li className="relative pl-5 before:absolute before:left-0 before:top-0 before:h-full before:w-px before:bg-border last:before:h-5">
      <div className="relative">
        <span className="absolute -left-5 top-5 h-px w-5 bg-border" aria-hidden />
        <div className="flex items-start gap-2 py-1">
          {hasChildren ? (
            <button
              type="button"
              aria-label={isOpen ? "Свернуть" : "Развернуть"}
              onClick={() => toggle(node.key)}
              className="mt-2 shrink-0 rounded border border-border bg-background p-0.5 text-secondary hover:border-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
            >
              {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </button>
          ) : (
            <span className="mt-2 h-4 w-4 shrink-0" />
          )}
          <div className="min-w-0 flex-1 max-w-md">
            <NodeCard
              node={node}
              mode={mode}
              highlighted={Boolean(query) && matches(node, query)}
              focused={focusKey === node.key}
              centers={centersOf(node)}
              onFocus={() => onFocus(node.key)}
            />
          </div>
        </div>
      </div>
      {hasChildren && isOpen ? (
        <ul className="ml-1">
          {node.children.map((child) => (
            <TreeBranch
              key={child.key}
              node={child}
              mode={mode}
              expanded={expanded}
              toggle={toggle}
              query={query}
              focusKey={focusKey}
              onFocus={onFocus}
              centersOf={centersOf}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function OrgChart({ units, workCenters = [], title, subtitle, variant = "internal" }: Props) {
  const isMobile = useIsMobile();
  const modeOptions = useMemo(
    () =>
      variant === "public"
        ? ORG_MODES.filter((m) => !["employees", "managers"].includes(m.value))
        : ORG_MODES,
    [variant],
  );
  const roots = useMemo(() => buildTree(units), [units]);
  const [mode, setMode] = useState<OrgMode>("org");
  const [query, setQuery] = useState("");
  const [zoom, setZoom] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const [drillKey, setDrillKey] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    setExpanded(new Set(defaultExpanded(roots, 2)));
  }, [roots]);

  useEffect(() => {
    if (!query.trim()) return;
    const hits = keysMatching(roots, query);
    if (hits.length) setExpanded(new Set(ancestorsOf(roots, hits)));
  }, [query, roots]);

  const centersByDept = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const l of workCenters) {
      if (!l.departmentId || !l.center) continue;
      const list = map.get(l.departmentId) ?? [];
      list.push(l.center.code ? `${l.center.code} · ${l.center.name}` : l.center.name);
      map.set(l.departmentId, list);
    }
    return map;
  }, [workCenters]);
  const centersOf = (node: OrgNode) => (node.departmentId ? (centersByDept.get(node.departmentId) ?? []) : []);

  const visibleRoots = useMemo(() => {
    if (!focusKey) return roots;
    const node = findNode(roots, focusKey);
    return node ? [node] : roots;
  }, [roots, focusKey]);

  const breadcrumb = focusKey ? pathTo(roots, focusKey) : [];

  const toggle = (key: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const filtered = useMemo(() => {
    if (mode !== "production") return visibleRoots;
    return visibleRoots;
  }, [mode, visibleRoots]);

  // --- Mobile drill-down ---
  if (isMobile) {
    const currentNode = drillKey ? findNode(roots, drillKey) : null;
    const list = currentNode ? currentNode.children : roots;
    const crumbs = drillKey ? pathTo(roots, drillKey) : [];
    const searchHits = query.trim()
      ? units.filter((u) => u.name.toLowerCase().includes(query.trim().toLowerCase()))
      : [];

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск подразделения"
              className="pl-9"
            />
          </div>
          <Select value={mode} onValueChange={(v) => setMode(v as OrgMode)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {modeOptions.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {query.trim() ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Найдено: {searchHits.length}</p>
            {searchHits.slice(0, 30).map((u) => (
              <Card key={u.key}>
                <CardContent className="p-3">
                  <button
                    type="button"
                    className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                    onClick={() => {
                      setDrillKey(u.key);
                      setQuery("");
                    }}
                  >
                    <span className="font-medium text-secondary break-words">{u.name}</span>
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            <nav className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
              <button type="button" className="underline-offset-2 hover:underline" onClick={() => setDrillKey(null)}>
                Все
              </button>
              {crumbs.map((c) => (
                <span key={c.key} className="flex items-center gap-1">
                  <ChevronRight className="h-3 w-3" />
                  <button
                    type="button"
                    className="underline-offset-2 hover:underline break-words text-left"
                    onClick={() => setDrillKey(c.key)}
                  >
                    {c.name}
                  </button>
                </span>
              ))}
            </nav>

            {currentNode ? (
              <Card>
                <CardContent className="space-y-2 p-3">
                  <NodeCard
                    node={currentNode}
                    mode={mode}
                    highlighted={false}
                    focused
                    centers={centersOf(currentNode)}
                    onFocus={() => undefined}
                  />
                </CardContent>
              </Card>
            ) : null}

            <div className="space-y-2">
              {list.map((n) => (
                <button
                  key={n.key}
                  type="button"
                  onClick={() => setDrillKey(n.key)}
                  className="flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-3 text-left transition-colors hover:border-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                >
                  <span className="min-w-0">
                    <span className="block font-medium text-secondary break-words">{n.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      Штат {num(n.planned)} · Факт {num(n.actual)}
                      {n.vacant > 0 ? ` · Вакансии ${num(n.vacant)}` : ""}
                    </span>
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
      </div>
    );
  }

  // --- Desktop / tablet chart ---
  return (
    <div
      className={
        fullscreen
          ? "fixed inset-0 z-50 overflow-auto bg-background p-4"
          : "rounded-lg border border-border bg-background"
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

        <Select value={mode} onValueChange={(v) => setMode(v as OrgMode)}>
          <SelectTrigger className="h-9 w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {modeOptions.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))} aria-label="Уменьшить">
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-12 text-center text-xs text-muted-foreground">{Math.round(zoom * 100)}%</span>
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setZoom((z) => Math.min(1.6, z + 0.1))} aria-label="Увеличить">
            <Plus className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setZoom(1)} aria-label="По размеру экрана">
            <Scan className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setFullscreen((f) => !f)} aria-label="Во весь экран">
            {fullscreen ? <X className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2 text-xs text-muted-foreground">
        <Users className="h-3.5 w-3.5" />
        <button type="button" className="underline-offset-2 hover:underline" onClick={() => setFocusKey(null)}>
          Вся структура
        </button>
        {breadcrumb.map((c) => (
          <span key={c.key} className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3" />
            <button type="button" className="underline-offset-2 hover:underline" onClick={() => setFocusKey(c.key)}>
              {c.name}
            </button>
          </span>
        ))}
        {focusKey ? (
          <Button variant="ghost" size="sm" className="ml-auto h-7" onClick={() => setFocusKey(null)}>
            Сбросить фокус
          </Button>
        ) : null}
      </div>

      <div className={fullscreen ? "overflow-auto p-4" : "max-h-[70vh] overflow-auto p-4"}>
        <div style={{ transform: `scale(${zoom})`, transformOrigin: "top left", width: `${100 / zoom}%` }}>
          <ul className="space-y-1">
            {filtered.map((root) => (
              <TreeBranch
                key={root.key}
                node={root}
                mode={mode}
                expanded={expanded}
                toggle={toggle}
                query={query}
                focusKey={focusKey}
                onFocus={(key) => setFocusKey(key)}
                centersOf={centersOf}
              />
            ))}
          </ul>
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">Структура не загружена.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}