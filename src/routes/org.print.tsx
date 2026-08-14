import { useEffect, useMemo, useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { brandLogos } from "@/lib/brand";
import { company } from "@/content/site";
import { InlineLoading } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { orgStructureQuery } from "@/lib/org-queries";
import { buildTree, findNode, pathTo, type OrgNode } from "@/lib/org-tree";

export const Route = createFileRoute("/org/print")({
  ssr: false,
  validateSearch: z.object({ versionId: z.string().uuid().optional(), focus: z.string().optional() }),
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
  },
  head: () => ({
    meta: [
      { title: "Оргструктура — печатная форма | Академия «Людиновокабель»" },
      {
        name: "description",
        content: "Печатная форма организационной структуры предприятия с численностью и руководителями.",
      },
      { property: "og:title", content: "Организационная структура предприятия" },
      { property: "og:description", content: "Печатная форма оргструктуры: подразделения, штат, факт, вакансии." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrgPrintPage,
});

const PRINT_CSS = `
.print-doc { hyphens: auto; overflow-wrap: anywhere; }
@media print {
  .no-print { display: none !important; }
  .print-sheet { box-shadow: none !important; border: 0 !important; padding: 0 !important; }
  body { background: #fff !important; }
  tr, .avoid-break { break-inside: avoid; }
  thead { display: table-header-group; }
}
`;

type Orientation = "portrait" | "landscape";

function flatten(nodes: OrgNode[], acc: OrgNode[] = []): OrgNode[] {
  for (const n of nodes) {
    acc.push(n);
    flatten(n.children, acc);
  }
  return acc;
}

function OrgPrintPage() {
  const { versionId, focus } = Route.useSearch();
  const [orientation, setOrientation] = useState<Orientation>("landscape");
  const [margin, setMargin] = useState("12");

  const structure = useQuery(orgStructureQuery(versionId ?? null));
  const tree = useMemo(() => buildTree(structure.data?.units ?? []), [structure.data]);
  const branch = useMemo(() => (focus ? findNode(tree, focus) : null), [tree, focus]);
  const branchPath = useMemo(() => (focus ? pathTo(tree, focus) : []), [tree, focus]);
  const rows = useMemo(() => flatten(branch ? [branch] : tree), [tree, branch]);

  const ready = structure.isSuccess && rows.length > 0;
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => window.print(), 600);
    return () => clearTimeout(t);
  }, [ready]);

  if (structure.isLoading) return <InlineLoading />;

  if (!structure.data?.version) {
    return <div className="mx-auto max-w-3xl p-10 text-center text-muted-foreground">Структура не найдена.</div>;
  }

  return (
    <div className="min-h-screen bg-muted/40 py-6 print-doc">
      <style>{PRINT_CSS}</style>
      <style>{`@page { size: A4 ${orientation}; margin: ${margin}mm; }`}</style>

      <div className="no-print mx-auto mb-4 flex max-w-5xl flex-wrap items-center gap-2 px-4">
        <Select value={orientation} onValueChange={(v) => setOrientation(v as Orientation)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="portrait">Книжная A4</SelectItem>
            <SelectItem value="landscape">Альбомная A4</SelectItem>
          </SelectContent>
        </Select>
        <Select value={margin} onValueChange={setMargin}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {["8", "12", "16", "20"].map((m) => (
              <SelectItem key={m} value={m}>
                Поля {m} мм
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => window.print()}>Печать / Сохранить PDF</Button>
      </div>

      <div className="print-sheet mx-auto max-w-5xl rounded-lg border border-border bg-background p-8 shadow-sm">
        <header className="mb-6 flex items-center justify-between gap-4 border-b border-border pb-4">
          <img src={brandLogos.fullColor} alt={company.legalName} className="h-12 w-auto" />
          <div className="text-right text-xs text-muted-foreground">
            <p className="text-sm font-semibold text-secondary">Организационная структура</p>
            <p>{structure.data.version.title}</p>
            {branchPath.length ? (
              <p>Ветка: {branchPath.map((n) => n.name).join(" / ")}</p>
            ) : null}
            <p>Действует с: {structure.data.version.effective_from ?? "—"}</p>
          </div>
        </header>

        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="py-2">Подразделение</th>
              <th className="py-2">Тип</th>
              <th className="py-2">Руководитель</th>
              <th className="py-2 text-right">Штат</th>
              <th className="py-2 text-right">Факт</th>
              <th className="py-2 text-right">Вакансии</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="avoid-break border-b border-border/60">
                <td className="py-1" style={{ paddingLeft: `${r.level * 12}px` }}>
                  {r.name}
                </td>
                <td className="py-1 text-muted-foreground">{r.unitType ?? "—"}</td>
                <td className="py-1">{r.managerName ?? "—"}</td>
                <td className="py-1 text-right">{r.planned}</td>
                <td className="py-1 text-right">{r.actual}</td>
                <td className="py-1 text-right">{r.vacant}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <footer className="mt-6 border-t border-border pt-3 text-[10px] text-muted-foreground">
          {company.legalName} · сформировано {new Date().toLocaleDateString("ru-RU")}
        </footer>
      </div>
    </div>
  );
}
