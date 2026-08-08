import { createFileRoute } from "@tanstack/react-router";
import { EntityManager } from "@/components/admin/EntityManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/admin/gamification")({
  head: () => ({
    meta: [
      { title: "Геймификация — Админ-панель" },
      {
        name: "description",
        content: "Достижения, участки виртуального завода и правила начисления опыта.",
      },
      { property: "og:title", content: "Управление геймификацией" },
      {
        property: "og:description",
        content: "Производственные значки, участки завода и настройки тренажёра.",
      },
    ],
  }),
  component: AdminGamificationPage,
});

const CONDITIONS = [
  { value: "runs_completed", label: "Собрано кабелей на тренажёре" },
  { value: "steps_correct", label: "Верных производственных операций" },
  { value: "flawless_runs", label: "Сборок без единой ошибки" },
  { value: "defects_found", label: "Найдено дефектов" },
  { value: "tests_passed", label: "Сдано аттестаций" },
  { value: "perfect_test", label: "Тестов на 100%" },
  { value: "perfect_streak", label: "Серия тестов без ошибок" },
  { value: "plans_completed", label: "Завершено планов развития" },
  { value: "process_ops", label: "Операций по процессу участка" },
];

function AdminGamificationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary">Геймификация</h1>
        <p className="mt-1 text-muted-foreground">
          Тренажёр строится автоматически из производственного паспорта — продукция, рабочие центры,
          маршруты, конструкция и дефекты редактируются в разделе «Производство». Здесь настраиваются
          достижения и участки виртуального завода.
        </p>
      </div>

      <Tabs defaultValue="achievements">
        <TabsList className="flex w-full flex-wrap justify-start">
          <TabsTrigger value="achievements">Достижения</TabsTrigger>
          <TabsTrigger value="zones">Виртуальный завод</TabsTrigger>
        </TabsList>

        <TabsContent value="achievements" className="pt-4">
          <EntityManager
            table="achievements"
            title="Достижения"
            description="Производственные значки и правила их начисления."
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
              { key: "title", label: "Название" },
              { key: "condition_type", label: "Условие" },
              { key: "condition_value", label: "Значение" },
            ]}
          />
        </TabsContent>

        <TabsContent value="zones" className="pt-4">
          <EntityManager
            table="factory_zones"
            title="Участки виртуального завода"
            description="Код участка должен совпадать с названием технологического процесса из маршрутов."
            orderBy="sort_order"
            fields={[
              { name: "code", label: "Код (процесс)", required: true },
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
              { name: "sort_order", label: "Порядок", type: "number" },
              { name: "is_active", label: "Активно", type: "boolean" },
            ]}
            columns={[
              { key: "name", label: "Участок" },
              { key: "unlock_condition", label: "Условие" },
              { key: "unlock_value", label: "Значение" },
            ]}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
