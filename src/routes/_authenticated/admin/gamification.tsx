import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { EntityManager } from "@/components/admin/EntityManager";
import { adminTableQuery } from "@/lib/admin-queries";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/admin/gamification")({
  head: () => ({
    meta: [
      { title: "Геймификация — Админ-панель" },
      {
        name: "description",
        content: "Управление тренажёрами, достижениями и участками виртуального завода.",
      },
      { property: "og:title", content: "Управление геймификацией" },
      { property: "og:description", content: "Тренажёры, квесты, достижения, виртуальный завод." },
    ],
  }),
  component: AdminGamificationPage,
});

const TASK_TYPES = [
  { value: "cable_assembly", label: "Сборка конструкции кабеля" },
  { value: "route", label: "Маршрут изготовления" },
  { value: "workcenter", label: "Выбор рабочего центра" },
  { value: "tech_error", label: "Найди технологическую ошибку" },
  { value: "quality", label: "Контроль качества" },
  { value: "shift", label: "Производственная смена" },
  { value: "quest", label: "Производственный квест" },
];

const CONDITIONS = [
  { value: "trainers_completed", label: "Пройдено тренажёров" },
  { value: "trainers_passed", label: "Успешных тренажёров" },
  { value: "quality_passed", label: "Тренажёров контроля качества" },
  { value: "tests_passed", label: "Сдано аттестаций" },
  { value: "perfect_test", label: "Тестов на 100%" },
  { value: "perfect_streak", label: "Серия тестов без ошибок" },
  { value: "plans_completed", label: "Завершено планов развития" },
];

function AdminGamificationPage() {
  const professions = useQuery(adminTableQuery("professions", "id, name", "name"));
  const tasks = useQuery(adminTableQuery("practical_tasks", "id, title", "title"));

  const professionOptions = ((professions.data ?? []) as { id: string; name: string }[]).map((p) => ({
    value: p.id,
    label: p.name,
  }));
  const taskOptions = ((tasks.data ?? []) as { id: string; title: string }[]).map((t) => ({
    value: t.id,
    label: t.title,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary">Геймификация</h1>
        <p className="mt-1 text-muted-foreground">
          Производственные тренажёры и квесты, их элементы, достижения и участки виртуального завода.
        </p>
      </div>

      <Tabs defaultValue="tasks">
        <TabsList className="flex w-full flex-wrap justify-start">
          <TabsTrigger value="tasks">Тренажёры</TabsTrigger>
          <TabsTrigger value="items">Элементы</TabsTrigger>
          <TabsTrigger value="achievements">Достижения</TabsTrigger>
          <TabsTrigger value="zones">Виртуальный завод</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="pt-4">
          <EntityManager
            table="practical_tasks"
            title="Тренажёры и квесты"
            description="Производственные сценарии для практической отработки."
            orderBy="sort_order"
            fields={[
              { name: "title", label: "Название", required: true },
              { name: "instruction", label: "Инструкция", type: "textarea" },
              { name: "task_type", label: "Тип", type: "select", options: TASK_TYPES, required: true },
              { name: "profession_id", label: "Профессия", type: "select", options: professionOptions },
              { name: "image_url", label: "Изображение (URL)" },
              { name: "max_score", label: "Максимальный балл", type: "number" },
              { name: "sort_order", label: "Порядок", type: "number" },
              { name: "is_active", label: "Активно", type: "boolean" },
            ]}
            columns={[
              { key: "title", header: "Название" },
              { key: "task_type", header: "Тип" },
              { key: "max_score", header: "Балл" },
            ]}
          />
        </TabsContent>

        <TabsContent value="items" className="pt-4">
          <EntityManager
            table="practical_task_items"
            title="Элементы заданий"
            description="Варианты, порядок операций и соответствия оборудования."
            orderBy="sort_order"
            archivable={false}
            searchKeys={["content"]}
            fields={[
              { name: "task_id", label: "Задание", type: "select", options: taskOptions, required: true },
              { name: "content", label: "Содержание", type: "textarea", required: true },
              { name: "match_target", label: "Соответствие (для сопоставления)" },
              { name: "correct_position", label: "Правильная позиция", type: "number" },
              { name: "is_correct", label: "Верный вариант", type: "boolean" },
              { name: "image_url", label: "Изображение (URL)" },
              { name: "sort_order", label: "Порядок", type: "number" },
            ]}
            columns={[
              { key: "content", header: "Содержание" },
              { key: "match_target", header: "Соответствие" },
              { key: "correct_position", header: "Позиция" },
            ]}
          />
        </TabsContent>

        <TabsContent value="achievements" className="pt-4">
          <EntityManager
            table="achievements"
            title="Достижения"
            description="Правила начисления наград сотрудникам."
            orderBy="sort_order"
            fields={[
              { name: "code", label: "Код", required: true },
              { name: "title", label: "Название", required: true },
              { name: "description", label: "Описание", type: "textarea" },
              { name: "icon", label: "Иконка" },
              {
                name: "condition_type",
                label: "Условие",
                type: "select",
                options: CONDITIONS,
                required: true,
              },
              { name: "condition_value", label: "Значение условия", type: "number" },
              { name: "sort_order", label: "Порядок", type: "number" },
              { name: "is_active", label: "Активно", type: "boolean" },
            ]}
            columns={[
              { key: "title", header: "Название" },
              { key: "condition_type", header: "Условие" },
              { key: "condition_value", header: "Значение" },
            ]}
          />
        </TabsContent>

        <TabsContent value="zones" className="pt-4">
          <EntityManager
            table="factory_zones"
            title="Участки виртуального завода"
            description="Участки, которые открываются по мере обучения."
            orderBy="sort_order"
            fields={[
              { name: "code", label: "Код", required: true },
              { name: "name", label: "Название", required: true },
              { name: "description", label: "Описание", type: "textarea" },
              { name: "icon", label: "Иконка" },
              {
                name: "unlock_condition",
                label: "Условие открытия",
                type: "select",
                options: CONDITIONS,
                required: true,
              },
              { name: "unlock_value", label: "Значение условия", type: "number" },
              { name: "profession_id", label: "Профессия", type: "select", options: professionOptions },
              { name: "sort_order", label: "Порядок", type: "number" },
              { name: "is_active", label: "Активно", type: "boolean" },
            ]}
            columns={[
              { key: "name", header: "Участок" },
              { key: "unlock_condition", header: "Условие" },
              { key: "unlock_value", header: "Значение" },
            ]}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}