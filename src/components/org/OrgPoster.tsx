import { Fragment } from "react";
import { Briefcase, Building2, ChevronDown, Cog, Factory, Layers, UserRound, Users } from "lucide-react";
import { matches, type OrgNode } from "@/lib/org-tree";

export function fmt(v: number) {
  return new Intl.NumberFormat("ru-RU").format(Math.round(v));
}

export function depthOf(node: OrgNode): number {
  if (!node.children.length) return 0;
  return 1 + Math.max(...node.children.map(depthOf));
}

/** Крупная ветвь — глубина больше 2 уровней либо более 8 вложенных подразделений. */
export function isBigBranch(node: OrgNode): boolean {
  return depthOf(node) > 2 || node.children.length > 8;
}

type Kind = "root" | "lead" | "unit" | "shop" | "area" | "shift" | "center" | "place";

export function kindOf(node: OrgNode, depth: number): Kind {
  const t = (node.unitType ?? "").toLowerCase();
  if (depth === 0) return "root";
  if (t.includes("цех")) return "shop";
  if (t.includes("смена")) return "shift";
  if (t.includes("рабочий центр") || t.includes("рц")) return "center";
  if (t.includes("участок") || t.includes("отделение") || t.includes("хозяйство")) return "area";
  if (t.includes("дирекция") || t.includes("департамент")) return "lead";
  if (depth >= 4) return "place";
  return "unit";
}

const KIND_CLASS: Record<Kind, string> = {
  root: "border-primary bg-primary text-primary-foreground",
  lead: "border-primary/50 bg-primary/10 text-foreground",
  unit: "border-secondary/30 bg-card text-foreground",
  shop: "border-secondary bg-secondary text-secondary-foreground",
  area: "border-accent/50 bg-accent/15 text-foreground",
  shift: "border-accent/40 bg-accent/10 text-foreground",
  center: "border-accent/60 bg-accent/25 text-foreground",
  place: "border-secondary/30 bg-muted text-foreground",
};

const KIND_META: Record<Kind, string> = {
  root: "text-primary-foreground/80",
  lead: "text-muted-foreground",
  unit: "text-muted-foreground",
  shop: "text-secondary-foreground/80",
  area: "text-muted-foreground",
  shift: "text-muted-foreground",
  center: "text-muted-foreground",
  place: "text-muted-foreground",
};

function IconFor({ node, depth }: { node: OrgNode; depth: number }) {
  const kind = kindOf(node, depth);
  const cls = "h-4 w-4 shrink-0";
  if (kind === "root") return <Building2 className={cls} />;
  if (kind === "shop") return <Factory className={cls} />;
  if (kind === "lead") return <Briefcase className={cls} />;
  if (kind === "area" || kind === "center") return <Cog className={cls} />;
  if (kind === "shift") return <Layers className={cls} />;
  return <Users className={cls} />;
}

interface Common {
  query: string;
  onOpen: (node: OrgNode) => void;
}

/** Компактная карточка внутри развёрнутой панели ветви. */
function BranchNode({ node, depth, query, onOpen }: Common & { node: OrgNode; depth: number }) {
  const kind = kindOf(node, depth);
  const highlighted = Boolean(query.trim()) && matches(node, query);
  return (
    <li className="relative flex flex-col items-center px-2">
      <span className="org-line-up absolute left-1/2 top-0 h-5 w-px -translate-x-1/2 bg-border" aria-hidden />
      <div className="pt-5">
        <button
          type="button"
          onClick={() => onOpen(node)}
          className={[
            "w-40 rounded-lg border px-2.5 py-2 text-center transition-all duration-200",
            "hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            KIND_CLASS[kind],
            highlighted ? "ring-2 ring-ring ring-offset-2 ring-offset-background" : "",
          ].join(" ")}
        >
          <span className="block text-[11px] font-semibold uppercase leading-tight break-words">{node.name}</span>
          {node.managerName ? (
            <span className={`mt-1 block text-[10px] break-words ${KIND_META[kind]}`}>{node.managerName}</span>
          ) : null}
          <span className={`mt-1 block text-[10px] ${KIND_META[kind]}`}>Штат {fmt(node.planned)}</span>
        </button>
      </div>
      {node.children.length ? (
        <>
          <span className="h-5 w-px bg-border" aria-hidden />
          <ul className="org-children flex items-start justify-center">
            {node.children.map((c) => (
              <BranchNode key={c.key} node={c} depth={depth + 1} query={query} onOpen={onOpen} />
            ))}
          </ul>
        </>
      ) : null}
    </li>
  );
}

/** Панель «Подробная структура» для крупной ветви. */
function BranchPanel({ node, depth, query, onOpen }: Common & { node: OrgNode; depth: number }) {
  return (
    <section className="min-w-[520px] flex-1 overflow-hidden rounded-2xl border border-secondary/40 bg-card">
      <header className="flex items-center gap-2 bg-secondary px-4 py-2.5 text-secondary-foreground">
        <IconFor node={node} depth={depth} />
        <h3 className="text-sm font-semibold uppercase tracking-wide break-words">{node.name}</h3>
        <span className="ml-auto shrink-0 text-xs text-secondary-foreground/80">Штат {fmt(node.planned)}</span>
      </header>
      <div className="overflow-x-auto p-4">
        <ul className="org-children org-root flex items-start justify-center">
          <BranchNode node={node} depth={depth} query={query} onOpen={onOpen} />
        </ul>
      </div>
    </section>
  );
}

/** Карточка подразделения верхнего уровня со списком вложенных подразделений. */
function TopCard({
  node,
  query,
  onOpen,
  panelOpen,
  onTogglePanel,
}: Common & { node: OrgNode; panelOpen: boolean; onTogglePanel: () => void }) {
  const kind = kindOf(node, 1);
  const big = isBigBranch(node);
  const highlighted = Boolean(query.trim()) && matches(node, query);
  const listed = big ? node.children.slice(0, 3) : node.children.slice(0, 8);
  const rest = node.children.length - listed.length;

  return (
    <li className="relative flex flex-col items-center px-2">
      <span className="org-line-up absolute left-1/2 top-0 h-6 w-px -translate-x-1/2 bg-border" aria-hidden />
      <div
        className={[
          "mt-6 flex w-60 flex-col self-stretch overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow",
          big ? "border-primary/50" : "border-border",
          highlighted ? "ring-2 ring-ring ring-offset-2 ring-offset-background" : "",
        ].join(" ")}
      >
        <button
          type="button"
          onClick={() => onOpen(node)}
          className="flex flex-col items-center gap-2 px-3 pt-4 text-center transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span
            className={`flex h-10 w-10 items-center justify-center rounded-full border ${KIND_CLASS[kind]}`}
            aria-hidden
          >
            <IconFor node={node} depth={1} />
          </span>
          <span className="text-xs font-bold uppercase leading-tight text-secondary break-words">{node.name}</span>
          {node.managerName ? (
            <span className="text-[11px] text-muted-foreground break-words">{node.managerName}</span>
          ) : null}
        </button>

        {listed.length ? (
          <ul className="mt-3 space-y-1 px-4 text-left text-[11px] leading-snug text-foreground">
            {listed.map((c) => (
              <li key={c.key} className="flex gap-1.5">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" aria-hidden />
                <span className="break-words">{c.name}</span>
              </li>
            ))}
            {rest > 0 ? <li className="pl-2.5 text-muted-foreground">и ещё {fmt(rest)}</li> : null}
          </ul>
        ) : null}

        {big ? (
          <button
            type="button"
            onClick={onTogglePanel}
            className="mx-4 mt-3 flex items-center justify-center gap-1.5 rounded-md bg-secondary px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-secondary-foreground transition-colors hover:bg-secondary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Подробная структура
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${panelOpen ? "rotate-180" : ""}`} />
          </button>
        ) : null}

        <div className="mt-auto border-t border-border px-4 py-2 text-center text-[11px] text-muted-foreground">
          {fmt(node.planned)} сотрудников
        </div>
      </div>
    </li>
  );
}

interface Props extends Common {
  roots: OrgNode[];
  title?: string | undefined;
  subtitle?: string | undefined;
  note?: string | undefined;
  openPanels: Set<string>;
  onTogglePanel: (key: string) => void;
}

export function OrgPoster({ roots, title, subtitle, note, query, onOpen, openPanels, onTogglePanel }: Props) {
  const single = roots.length === 1 ? roots[0]! : null;
  const head = single ?? null;
  const topLevel = single ? single.children : roots;
  const total = roots.reduce((sum, r) => sum + r.planned, 0);
  const panels = topLevel.filter((n) => isBigBranch(n) && openPanels.has(n.key));

  return (
    <div className="min-w-max bg-background px-8 pb-10 pt-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          {title ? (
            <h2 className="text-xl font-bold uppercase tracking-tight text-secondary">{title}</h2>
          ) : null}
          {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
        <div className="ml-auto flex items-center gap-3 rounded-xl border border-primary/40 bg-primary/10 px-4 py-2">
          <UserRound className="h-5 w-5 text-primary" aria-hidden />
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Общая численность</p>
            <p className="text-lg font-bold text-secondary">{fmt(total)} сотрудников</p>
          </div>
        </div>
      </div>

      {head ? (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => onOpen(head)}
            className="flex items-center gap-3 rounded-xl border border-primary bg-primary px-6 py-3 text-primary-foreground shadow-lg transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Building2 className="h-5 w-5" aria-hidden />
            <span className="text-left">
              <span className="block text-sm font-bold uppercase tracking-wide">{head.name}</span>
              <span className="block text-[11px] text-primary-foreground/80">
                {head.managerName ?? head.unitType ?? "предприятие"} · штат {fmt(head.planned)}
              </span>
            </span>
          </button>
        </div>
      ) : null}

      <ul className={`org-children flex items-stretch justify-center ${head ? "" : "org-root"}`}>
        {topLevel.map((node) => (
          <TopCard
            key={node.key}
            node={node}
            query={query}
            onOpen={onOpen}
            panelOpen={openPanels.has(node.key)}
            onTogglePanel={() => onTogglePanel(node.key)}
          />
        ))}
      </ul>

      {panels.length ? (
        <div className="mt-8 flex flex-wrap gap-6">
          {panels.map((node) => (
            <Fragment key={node.key}>
              <BranchPanel node={node} depth={1} query={query} onOpen={onOpen} />
            </Fragment>
          ))}
        </div>
      ) : null}

      <div className="mt-8 rounded-xl border border-dashed border-border px-4 py-3 text-xs text-muted-foreground">
        Оргструктура строится автоматически по данным штатной расстановки.
        {note ? <span className="ml-1 font-medium text-secondary">{note}</span> : null}
      </div>
    </div>
  );
}