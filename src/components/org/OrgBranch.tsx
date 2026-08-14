import { Minus, Plus } from "lucide-react";
import { headPositionOf, matches, type OrgNode } from "@/lib/org-tree";
import { fmt, IconFor, KIND_CLASS, KIND_META, kindOf } from "./OrgPoster";

interface Common {
  query: string;
  onOpen: (node: OrgNode) => void;
  expanded: Set<string>;
  onToggle: (key: string) => void;
  /** Листовой режим: всё раскрыто, компактные карточки, без кнопок свёртки. */
  sheet?: boolean;
}

function BranchNode({
  node,
  depth,
  query,
  onOpen,
  expanded,
  onToggle,
  sheet,
  vertical,
}: Common & { node: OrgNode; depth: number; vertical?: boolean }) {
  const kind = kindOf(node, depth);
  const highlighted = Boolean(query.trim()) && matches(node, query);
  const open = sheet ? true : expanded.has(node.key);
  // В листовом режиме глубокие уровни выкладываем вертикально — так лист остаётся узким и читаемым.
  const childrenVertical = Boolean(sheet) && depth >= 2;

  return (
    <li
      className={[
        "relative flex flex-col",
        vertical ? "items-start px-0" : "items-center",
        vertical ? "" : sheet ? "px-1.5" : "px-3",
      ].join(" ")}
    >
      {depth > 1 && !vertical ? (
        <span className="org-line-up absolute left-1/2 top-0 h-6 w-px -translate-x-1/2 bg-border" aria-hidden />
      ) : null}
      <div className={depth > 1 && !vertical ? "pt-6" : ""}>
        <div
          data-node-key={node.key}
          className={[
            sheet
              ? `${vertical ? "w-44 text-left" : "w-44 text-center"} rounded-lg border px-2 py-1.5 shadow-sm`
              : "w-52 rounded-lg border px-3 py-2.5 text-center shadow-sm transition-all duration-200",
            KIND_CLASS[kind],
            highlighted ? "ring-2 ring-ring ring-offset-2 ring-offset-background" : "",
          ].join(" ")}
        >
          <button
            type="button"
            onClick={() => onOpen(node)}
            className={`w-full ${vertical ? "text-left" : "text-center"} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
          >
            <span className={`flex items-center gap-1.5 ${vertical ? "justify-start" : "justify-center"}`}>
              <IconFor
                node={node}
                depth={depth}
                className={
                  kind === "root" || kind === "shop"
                    ? "h-4 w-4 shrink-0"
                    : "h-4 w-4 shrink-0 text-primary"
                }
              />
              <span className="text-xs font-semibold uppercase leading-tight break-words">{node.name}</span>
            </span>
            {headPositionOf(node) ? (
              <span className={`mt-1 block text-[11px] break-words ${KIND_META[kind]}`}>{headPositionOf(node)}</span>
            ) : null}
            {node.managerName ? (
              <span className={`mt-1 block text-[11px] break-words ${KIND_META[kind]}`}>{node.managerName}</span>
            ) : null}
            <span className={`mt-1 block text-[11px] ${KIND_META[kind]}`}>Штат {fmt(node.planned)}</span>
          </button>

          {node.children.length && !sheet ? (
            <button
              type="button"
              onClick={() => onToggle(node.key)}
              className={`mt-2 flex w-full items-center justify-center gap-1 rounded-md border border-current/20 px-2 py-1 text-[11px] font-medium ${KIND_META[kind]} hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
            >
              {open ? <Minus className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
              {open ? "Свернуть" : `Показать ${fmt(node.children.length)}`}
            </button>
          ) : null}
        </div>
      </div>

      {node.children.length && open ? (
        <>
          {childrenVertical ? null : <span className="h-6 w-px bg-border" aria-hidden />}
          <ul
            className={
              childrenVertical
                ? "ml-4 mt-2 flex flex-col items-start gap-2 border-l border-border pl-4"
                : "org-children flex items-start justify-center"
            }
          >
            {node.children.map((c) => (
              <BranchNode
                key={c.key}
                node={c}
                depth={depth + 1}
                query={query}
                onOpen={onOpen}
                expanded={expanded}
                onToggle={onToggle}
                sheet={sheet ?? false}
                vertical={childrenVertical}
              />
            ))}
          </ul>
        </>
      ) : null}
    </li>
  );
}

/** Подробная структура одного департамента. */
export function OrgBranch({ root, query, onOpen, expanded, onToggle, sheet }: Common & { root: OrgNode }) {
  return (
    <div className={sheet ? "min-w-max px-6 pb-6 pt-4" : "min-w-max px-8 pb-10 pt-6"}>
      <ul className="org-children org-root flex items-start justify-center">
        <BranchNode
          node={root}
          depth={1}
          query={query}
          onOpen={onOpen}
          expanded={expanded}
          onToggle={onToggle}
          sheet={sheet ?? false}
        />
      </ul>
    </div>
  );
}
