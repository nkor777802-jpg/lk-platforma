import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { adminTableQuery } from "@/lib/admin-queries";
import { EntityManager } from "@/components/admin/EntityManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/admin/courses")({
  component: CoursesPage,
});

function CoursesPage() {
  const professions = useQuery(adminTableQuery("professions", "id, name", "name"));
  const courses = useQuery(adminTableQuery("courses", "id, title", "title"));
  const profOptions = ((professions.data ?? []) as { id: string; name: string }[]).map((p) => ({
    value: p.id,
    label: p.name,
  }));
  const courseOptions = ((courses.data ?? []) as { id: string; title: string }[]).map((c) => ({
    value: c.id,
    label: c.title,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary">Курсы</h1>
        <p className="text-sm text-muted-foreground">
          Программы обучения, их модули и привязка к профессиям. Архивирование вместо удаления.
        </p>
      </div>

      <Tabs defaultValue="courses">
        <TabsList>
          <TabsTrigger value="courses">Курсы</TabsTrigger>
          <TabsTrigger value="modules">Модули</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="pt-6">
          <EntityManager
            table="courses"
            title="Программы обучения"
            searchKeys={["title"]}
            orderBy="sort_order"
            fields={[
              { name: "title", label: "Название", required: true },
              { name: "description", label: "Описание", type: "textarea" },
              { name: "profession_id", label: "Профессия", type: "select", options: profOptions },
              { name: "is_common", label: "Общий для всех", type: "boolean" },
              { name: "sort_order", label: "Порядок", type: "number" },
            ]}
            columns={[
              { key: "title", label: "Название" },
              { key: "description", label: "Описание" },
            ]}
          />
        </TabsContent>

        <TabsContent value="modules" className="pt-6">
          <EntityManager
            table="course_modules"
            title="Модули курсов"
            searchKeys={["title"]}
            archivable={false}
            orderBy="sort_order"
            fields={[
              { name: "course_id", label: "Курс", type: "select", options: courseOptions, required: true },
              { name: "title", label: "Название", required: true },
              { name: "description", label: "Описание", type: "textarea" },
              {
                name: "module_type",
                label: "Тип",
                type: "select",
                required: true,
                options: [
                  { value: "theory", label: "Теория" },
                  { value: "video", label: "Видео" },
                  { value: "practice", label: "Практика" },
                  { value: "test", label: "Тест" },
                ],
              },
              { name: "is_required", label: "Обязательный", type: "boolean" },
              { name: "sort_order", label: "Порядок", type: "number" },
            ]}
            columns={[
              { key: "title", label: "Название" },
              { key: "module_type", label: "Тип" },
            ]}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
