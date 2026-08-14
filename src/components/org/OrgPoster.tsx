import {
  Briefcase,
  Building2,
  ChevronRight,
  ClipboardList,
  Cog,
  Factory,
  Handshake,
  Landmark,
  Layers,
  Megaphone,
  MonitorCog,
  ShieldCheck,
  UserRound,
  UserRoundCog,
  Users,
  UsersRound,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { headPositionOf, matches, type OrgNode } from "@/lib/org-tree";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function fmt(v: number) {
  return new Intl.NumberFormat("ru-RU").format(Math.round(v));
}

export function depthOf(node: OrgNode): number {
  if (!node.children.length) return 0;
  return 1 + Math.max(...node.children.map(depthOf));
}

export type Kind = "root" | "lead" | "unit" | "shop" | "area" | "shift" | "center" | "place";

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

export const KIND_CLASS: Record<Kind, string> = {
  root: "border-primary bg-primary text-primary-foreground",
  lead: "border-primary/50 bg-primary/10 text-foreground",
  unit: "border-secondary/30 bg-card text-foreground",
  shop: "border-secondary bg-secondary text-secondary-foreground",
  area: "border-accent/50 bg-accent/15 text-foreground",
  shift: "border-accent/40 bg-accent/10 text-foreground",
  center: "border-accent/60 bg-accent/25 text-foreground",
  place: "border-secondary/30 bg-muted text-foreground",
};

/** Кружок иконки подразделения: фирменный оранжевый, кроме карточек с плотной заливкой. */
export const KIND_ICON_CLASS: Record<Kind, string> = {
  root: "border-primary bg-primary text-primary-foreground",
  lead: "border-primary/40 bg-primary/10 text-primary",
  unit: "border-primary/25 bg-primary/5 text-primary",
  shop: "border-secondary bg-secondary text-secondary-foreground",
  area: "border-primary/30 bg-primary/10 text-primary",
  shift: "border-primary/25 bg-primary/5 text-primary",
  center: "border-primary/35 bg-primary/15 text-primary",
  place: "border-primary/20 bg-primary/5 text-primary",
};

export const KIND_META: Record<Kind, string> = {
  root: "text-primary-foreground/80",
  lead: "text-muted-foreground",
  unit: "text-muted-foreground",
  shop: "text-secondary-foreground/80",
  area: "text-muted-foreground",
  shift: "text-muted-foreground",
  center: "text-muted-foreground",
  place: "text-muted-foreground",
};

/** Индивидуальные иконки верхнеуровневых подразделений штатной расстановки. */
const UNIT_ICONS: { test: RegExp; icon: LucideIcon }[] = [
  { test: /административно-управленческий/i, icon: Landmark },
  { test: /планировани|автоматизаци/i, icon: ClipboardList },
  { test: /финансов/i, icon: Wallet },
  { test: /безопасност/i, icon: ShieldCheck },
  { test: /персонал/i, icon: UsersRound },
  { test: /информационн|ит\b/i, icon: MonitorCog },
  { test: /коммерческ/i, icon: Handshake },
  { test: /маркетинг/i, icon: Megaphone },
  { test: /производствен/i, icon: Factory },
];

export function iconForName(name: string): LucideIcon | null {
  return UNIT_ICONS.find((u) => u.test.test(name))?.icon ?? null;
}

export function IconFor({ node, depth, className }: { node: OrgNode; depth: number; className?: string }) {
  const kind = kindOf(node, depth);
  const cls = className ?? "h-4 w-4 shrink-0";
  if (depth === 1) {
    const Special = iconForName(node.name);
    if (Special) return <Special className={cls} />;
  }
  if (kind === "root") return <Building2 className={cls} />;
  if (kind === "shop") return <Factory className={cls} />;
  if (kind === "lead") return <Briefcase className={cls} />;
  if (kind === "area" || kind === "center") return <Cog className={cls} />;
  if (kind === "shift") return <Layers className={cls} />;
  return <Users className={cls} />;
}

/** Подсветка руководителя подразделения: значок + должность + ФИО. */
export function HeadBadge({
  node,
  inverted,
  className,
}: {
  node: OrgNode;
  inverted?: boolean;
  className?: string;
}) {
  const position = headPositionOf(node);
  if (!position && !node.managerName) return null;
  const box = inverted
    ? "border-current/30 bg-foreground/10"
    : "border-primary/30 bg-primary/10";
  const title = inverted ? "" : "text-primary";
  const sub = inverted ? "opacity-80" : "text-muted-foreground";
  const tipLines = [position, node.managerName].filter(Boolean) as string[];
  return (
    <span
      className={`mt-1.5 flex items-start gap-1.5 rounded-md border px-2 py-1 text-left ${box} ${className ?? ""}`}
    >
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              tabIndex={0}
              aria-label="Руководитель подразделения"
              className="mt-0.5 shrink-0 cursor-help rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <UserRoundCog className={`h-3.5 w-3.5 ${title}`} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[240px] text-left">
            <span className="block font-semibold">Руководитель подразделения</span>
            {tipLines.length ? (
              <span className="block text-xs opacity-90">{tipLines.join(" — ")}</span>
            ) : null}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <span className="min-w-0">
        {position ? (
          <span className={`block text-[11px] font-semibold leading-snug break-words ${title}`}>{position}</span>
        ) : null}
        {node.managerName ? (
          <span className={`block text-[11px] leading-snug break-words ${sub}`}>{node.managerName}</span>
        ) : null}
      </span>
    </span>
  );
}

interface Props {
  roots: OrgNode[];
  note?: string | undefined;
  query: string;
  /** Открыть карточку подразделения (боковая панель). */
  onOpen: (node: OrgNode) => void;
  /** Открыть подробную структуру департамента. */
  onOpenBranch: (node: OrgNode) => void;
}

/** Обзорная схема предприятия: генеральный директор и департаменты на одном листе. */
export function OrgPoster({ roots, note, query, onOpen, onOpenBranch }: Props) {
  const head = roots.length === 1 ? roots[0]! : null;
  const topLevel = head ? head.children : roots;
  const total = roots.reduce((sum, r) => sum + r.planned, 0);

  return (
    <div className="w-full px-4 pb-8 pt-6 sm:px-6">
      {head ? (
        <div className="flex flex-col items-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{head.name}</p>
          <button
            type="button"
            onClick={() => onOpen(head)}
            className="mt-3 flex w-full max-w-md items-center gap-4 rounded-2xl border-2 border-primary bg-card px-6 py-4 text-left shadow-lg transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UserRound className="h-6 w-6" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-base font-bold uppercase tracking-wide text-secondary">
                Генеральный директор
              </span>
              {head.managerName ? (
                <span className="block text-sm text-foreground/80 break-words">{head.managerName}</span>
              ) : null}
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Общая численность — {fmt(total)} сотрудников
              </span>
            </span>
          </button>
          <span className="h-6 w-px bg-border" aria-hidden />
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {topLevel.map((node) => {
          const kind = kindOf(node, 1);
          const highlighted = Boolean(query.trim()) && matches(node, query);
          return (
            <div
              key={node.key}
              data-node-key={node.key}
              className={[
                "flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md",
                highlighted ? "ring-2 ring-ring ring-offset-2 ring-offset-background" : "",
              ].join(" ")}
            >
              <button
                type="button"
                onClick={() => onOpen(node)}
                className="flex flex-1 items-start gap-3 px-4 pb-3 pt-4 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${KIND_ICON_CLASS[kind]}`}
                  aria-hidden
                >
                  <IconFor node={node} depth={1} className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold uppercase leading-snug text-secondary break-words">
                    {node.name}
                  </span>
                  <HeadBadge node={node} />
                </span>
              </button>

              <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-2 text-xs text-muted-foreground">
                <span>
                  {node.children.length ? `${fmt(node.children.length)} подразд. · ` : ""}
                  штат {fmt(node.planned)} ед.
                </span>
              </div>

              {node.children.length ? (
                <button
                  type="button"
                  onClick={() => onOpenBranch(node)}
                  className="flex items-center justify-center gap-1.5 bg-secondary px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-secondary-foreground transition-colors hover:bg-secondary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                >
                  Структура подразделения
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-xl border border-dashed border-border px-4 py-3 text-xs text-muted-foreground">
        Оргструктура формируется автоматически по данным предприятия.
        {note ? <span className="ml-1 font-medium text-secondary">{note}</span> : null}
      </div>
    </div>
  );
}
