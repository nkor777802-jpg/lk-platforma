import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { adminTableQuery } from "@/lib/admin-queries";
import { EntityManager } from "@/components/admin/EntityManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/admin/materials")({
  component: MaterialsPage,
});

const MATERIAL_TYPES = [
  { value: "text", label: "Текст" },
  { value: "pdf", label: "PDF" },
  { value: "video", label: "Видео" },
  { value: "image", label: "Изображение" },
  { value: "instruction", label: "Инструкция" },
  { value: "presentation", label: "Презентация" },
  { value: "link", label: "Ссылка" },
  { value: "document", label: "Документ" },
];

function MaterialsPage() {
  const professions = useQuery(adminTableQuery("professions", "id, name", "name"));
  const categories = useQuery(adminTableQuery("material_categories", "id, name", "name"));
  const profOptions = ((professions.data ?? []) as { id: string; name: string }[]).map((p) => ({
    value: p.id,
    label: p.name,
  }));
  const catOptions = ((categories.data ?? []) as { id: string; name: string }[]).map((c) => ({
    value: c.id,
    label: c.name,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary">Учебные материалы</h1>
        <p className="text-sm text-muted-foreground">
          Документы, инструкции, презентации, ссылки и видео. Файлы загружаются в защищённое хранилище.
        </p>
      </div>

      <Tabs defaultValue="materials">
        <TabsList>
          <TabsTrigger value="materials">Материалы</TabsTrigger>
          <TabsTrigger value="videos">Видео</TabsTrigger>
        </TabsList>

        <TabsContent value="materials" className="pt-6">
          <EntityManager
            table="materials"
            title="Материалы"
            searchKeys={["title"]}
            orderBy="sort_order"
            fields={[
              { name: "title", label: "Название", required: true },
              { name: "material_type", label: "Тип", type: "select", required: true, options: MATERIAL_TYPES },
              { name: "description", label: "Описание", type: "textarea" },
              { name: "category_id", label: "Категория", type: "select", options: catOptions },
              { name: "profession_id", label: "Профессия", type: "select", options: profOptions },
              { name: "external_url", label: "Внешняя ссылка" },
              { name: "file_url", label: "Файл в хранилище (путь)" },
              { name: "is_mandatory_for_all", label: "Обязателен для всех", type: "boolean" },
              { name: "sort_order", label: "Порядок", type: "number" },
            ]}
            columns={[
              { key: "title", label: "Название" },
              { key: "material_type", label: "Тип" },
              {
                key: "created_at",
                label: "Опубликован",
                render: (r) =>
                  r["created_at"] ? new Date(String(r["created_at"])).toLocaleDateString("ru-RU") : "—",
              },
            ]}
          />
        </TabsContent>

        <TabsContent value="videos" className="pt-6">
          <EntityManager
            table="videos"
            title="Видеоматериалы"
            searchKeys={["title"]}
            orderBy="sort_order"
            fields={[
              { name: "title", label: "Название", required: true },
              { name: "description", label: "Описание", type: "textarea" },
              { name: "topic", label: "Тема" },
              { name: "profession_id", label: "Профессия", type: "select", options: profOptions },
              { name: "external_url", label: "Внешняя ссылка" },
              { name: "video_url", label: "Файл в хранилище (путь)" },
              { name: "is_company_video", label: "Видео о компании", type: "boolean" },
              { name: "sort_order", label: "Порядок", type: "number" },
            ]}
            columns={[
              { key: "title", label: "Название" },
              { key: "topic", label: "Тема" },
            ]}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
