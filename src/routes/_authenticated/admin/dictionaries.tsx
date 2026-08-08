import { createFileRoute } from "@tanstack/react-router";
import { EntityManager } from "@/components/admin/EntityManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/admin/dictionaries")({
  component: DictionariesPage,
});

const SIMPLE_FIELDS = [
  { name: "name", label: "Наименование", required: true },
  { name: "code", label: "Код" },
  { name: "description", label: "Описание", type: "textarea" as const },
  { name: "sort_order", label: "Порядок", type: "number" as const },
];

const SIMPLE_COLUMNS = [
  { key: "name", label: "Наименование" },
  { key: "code", label: "Код" },
];

function DictionariesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary">Справочники</h1>
        <p className="text-sm text-muted-foreground">
          Профессии, категории обучения, типы курсов, виды тестов и категории материалов.
        </p>
      </div>

      <Tabs defaultValue="professions">
        <TabsList className="flex-wrap">
          <TabsTrigger value="professions">Профессии</TabsTrigger>
          <TabsTrigger value="course_types">Типы курсов</TabsTrigger>
          <TabsTrigger value="learning_categories">Категории обучения</TabsTrigger>
          <TabsTrigger value="test_kinds">Виды тестов</TabsTrigger>
          <TabsTrigger value="material_categories">Категории материалов</TabsTrigger>
        </TabsList>

        <TabsContent value="professions" className="pt-6">
          <EntityManager
            table="professions"
            title="Профессии"
            orderBy="sort_order"
            fields={[
              { name: "name", label: "Наименование", required: true },
              { name: "code", label: "Код" },
              { name: "slug", label: "URL-идентификатор" },
              { name: "short_description", label: "Краткое описание", type: "textarea" },
              { name: "description", label: "Описание", type: "textarea" },
              { name: "duration_hours", label: "Длительность, ч", type: "number" },
              { name: "sort_order", label: "Порядок", type: "number" },
            ]}
            columns={[
              { key: "name", label: "Наименование" },
              { key: "code", label: "Код" },
            ]}
          />
        </TabsContent>

        <TabsContent value="course_types" className="pt-6">
          <EntityManager table="course_types" title="Типы курсов" orderBy="sort_order" fields={SIMPLE_FIELDS} columns={SIMPLE_COLUMNS} />
        </TabsContent>

        <TabsContent value="learning_categories" className="pt-6">
          <EntityManager table="learning_categories" title="Категории обучения" orderBy="sort_order" fields={SIMPLE_FIELDS} columns={SIMPLE_COLUMNS} />
        </TabsContent>

        <TabsContent value="test_kinds" className="pt-6">
          <EntityManager table="test_kinds" title="Виды тестов" orderBy="sort_order" fields={SIMPLE_FIELDS} columns={SIMPLE_COLUMNS} />
        </TabsContent>

        <TabsContent value="material_categories" className="pt-6">
          <EntityManager
            table="material_categories"
            title="Категории материалов"
            archivable={false}
            orderBy="sort_order"
            fields={[
              { name: "name", label: "Наименование", required: true },
              { name: "slug", label: "Идентификатор" },
              { name: "sort_order", label: "Порядок", type: "number" },
            ]}
            columns={SIMPLE_COLUMNS}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
