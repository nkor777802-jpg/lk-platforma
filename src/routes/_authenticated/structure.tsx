import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { OrgStructureViewer } from "@/components/org/OrgStructureViewer";

export const Route = createFileRoute("/_authenticated/structure")({
  head: () => ({
    meta: [
      { title: "Структура предприятия | Академия «Людиновокабель»" },
      {
        name: "description",
        content:
          "Интерактивная организационная структура завода: подразделения, руководители, должности и численность.",
      },
      { property: "og:title", content: "Организационная структура предприятия" },
      {
        property: "og:description",
        content: "Подразделения, руководители, штатная численность и связь с производственными участками.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StructurePage,
});

function StructurePage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary">Структура предприятия</h1>
          <p className="text-sm text-muted-foreground">
            Действующая организационная структура: подразделения, руководители, должности и численность.
          </p>
        </div>
        <OrgStructureViewer />
      </div>
    </AppShell>
  );
}
