import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { adminTableQuery } from "@/lib/admin-queries";
import { EntityManager } from "@/components/admin/EntityManager";
import { ManagementEditor } from "@/components/admin/ManagementEditor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrgStructureViewer } from "@/components/org/OrgStructureViewer";
import { OrgImportWizard } from "@/components/org/OrgImportWizard";
import { OrgVersionsPanel } from "@/components/org/OrgVersionsPanel";
import { OrgWorkCenterLinks } from "@/components/org/OrgWorkCenterLinks";

export const Route = createFileRoute("/_authenticated/admin/org")({
  component: OrgPage,
});

function OrgPage() {
  const departments = useQuery(adminTableQuery("departments", "id, name", "name"));
  const deptOptions = ((departments.data ?? []) as { id: string; name: string }[]).map((d) => ({
    value: d.id,
    label: d.name,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary">Организационная структура</h1>
        <p className="text-sm text-muted-foreground">
          Подразделения, должности, группы и руководители. Записи не удаляются — только архивируются.
        </p>
      </div>

      <Tabs defaultValue="chart">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="chart">Схема</TabsTrigger>
          <TabsTrigger value="import">Импорт ШР</TabsTrigger>
          <TabsTrigger value="versions">Версии</TabsTrigger>
          <TabsTrigger value="production">Производство</TabsTrigger>
          <TabsTrigger value="departments">Подразделения</TabsTrigger>
          <TabsTrigger value="positions">Должности</TabsTrigger>
          <TabsTrigger value="groups">Группы</TabsTrigger>
          <TabsTrigger value="management">Руководство</TabsTrigger>
        </TabsList>

        <TabsContent value="chart" className="pt-6">
          <OrgStructureViewer />
        </TabsContent>

        <TabsContent value="import" className="pt-6">
          <OrgImportWizard />
        </TabsContent>

        <TabsContent value="versions" className="pt-6">
          <OrgVersionsPanel />
        </TabsContent>

        <TabsContent value="production" className="pt-6">
          <OrgWorkCenterLinks />
        </TabsContent>

        <TabsContent value="departments" className="pt-6">
          <EntityManager
            table="departments"
            title="Подразделения"
            archivable={false}
            orderBy="sort_order"
            fields={[
              { name: "name", label: "Наименование", required: true },
              { name: "code", label: "Код" },
              { name: "head_name", label: "Руководитель" },
              { name: "description", label: "Описание", type: "textarea" },
              { name: "sort_order", label: "Порядок", type: "number" },
            ]}
            columns={[
              { key: "name", label: "Наименование" },
              { key: "code", label: "Код" },
              { key: "head_name", label: "Руководитель" },
            ]}
          />
        </TabsContent>

        <TabsContent value="positions" className="pt-6">
          <EntityManager
            table="positions"
            title="Должности"
            orderBy="sort_order"
            fields={[
              { name: "name", label: "Наименование", required: true },
              { name: "code", label: "Код" },
              { name: "department_id", label: "Подразделение", type: "select", options: deptOptions },
              { name: "description", label: "Описание", type: "textarea" },
              { name: "sort_order", label: "Порядок", type: "number" },
            ]}
            columns={[
              { key: "name", label: "Наименование" },
              { key: "code", label: "Код" },
            ]}
          />
        </TabsContent>

        <TabsContent value="groups" className="pt-6">
          <EntityManager
            table="groups"
            title="Группы"
            fields={[
              { name: "name", label: "Наименование", required: true },
              { name: "description", label: "Описание", type: "textarea" },
              { name: "department_id", label: "Подразделение", type: "select", options: deptOptions },
            ]}
            columns={[
              { key: "name", label: "Наименование" },
              { key: "description", label: "Описание" },
          ]}
          />
        </TabsContent>

        <TabsContent value="management" className="pt-6">
          <ManagementEditor />
        </TabsContent>
      </Tabs>
    </div>
  );
}
