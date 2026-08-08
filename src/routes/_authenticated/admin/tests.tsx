import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { adminTableQuery } from "@/lib/admin-queries";
import { EntityManager } from "@/components/admin/EntityManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/admin/tests")({
  component: TestsPage,
});

function TestsPage() {
  const professions = useQuery(adminTableQuery("professions", "id, name", "name"));
  const questions = useQuery(adminTableQuery("questions", "id, text", "text"));
  const profOptions = ((professions.data ?? []) as { id: string; name: string }[]).map((p) => ({
    value: p.id,
    label: p.name,
  }));
  const questionOptions = ((questions.data ?? []) as { id: string; text: string }[]).map((q) => ({
    value: q.id,
    label: q.text.slice(0, 70),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary">Тесты</h1>
        <p className="text-sm text-muted-foreground">
          Банк вопросов, варианты ответов, практические задания и параметры тестирования.
        </p>
      </div>

      <Tabs defaultValue="questions">
        <TabsList className="flex-wrap">
          <TabsTrigger value="questions">Вопросы</TabsTrigger>
          <TabsTrigger value="options">Варианты ответов</TabsTrigger>
          <TabsTrigger value="practical">Практические задания</TabsTrigger>
          <TabsTrigger value="settings">Настройки тестов</TabsTrigger>
          <TabsTrigger value="stats">Статистика</TabsTrigger>
        </TabsList>

        <TabsContent value="questions" className="pt-6">
          <EntityManager
            table="questions"
            title="Банк вопросов"
            searchKeys={["text", "topic"]}
            fields={[
              { name: "text", label: "Формулировка вопроса", type: "textarea", required: true },
              { name: "topic", label: "Тема" },
              { name: "category", label: "Категория" },
              { name: "profession_id", label: "Профессия", type: "select", options: profOptions },
              { name: "is_common", label: "Общий вопрос", type: "boolean" },
              {
                name: "difficulty",
                label: "Сложность",
                type: "select",
                options: [
                  { value: "easy", label: "Лёгкий" },
                  { value: "medium", label: "Средний" },
                  { value: "hard", label: "Сложный" },
                ],
              },
              { name: "explanation", label: "Пояснение", type: "textarea" },
            ]}
            columns={[
              { key: "text", label: "Вопрос" },
              { key: "topic", label: "Тема" },
              { key: "difficulty", label: "Сложность" },
            ]}
          />
        </TabsContent>

        <TabsContent value="options" className="pt-6">
          <EntityManager
            table="answer_options"
            title="Варианты ответов"
            searchKeys={["text"]}
            archivable={false}
            orderBy="sort_order"
            fields={[
              { name: "question_id", label: "Вопрос", type: "select", required: true, options: questionOptions },
              { name: "text", label: "Текст ответа", required: true },
              { name: "is_correct", label: "Правильный", type: "boolean" },
              { name: "sort_order", label: "Порядок", type: "number" },
            ]}
            columns={[
              { key: "text", label: "Ответ" },
              {
                key: "is_correct",
                label: "Верный",
                render: (r) => (r["is_correct"] ? "да" : "нет"),
              },
            ]}
          />
        </TabsContent>

        <TabsContent value="practical" className="pt-6">
          <EntityManager
            table="practical_tasks"
            title="Практические задания"
            searchKeys={["title"]}
            orderBy="sort_order"
            fields={[
              { name: "title", label: "Название", required: true },
              { name: "instruction", label: "Инструкция", type: "textarea" },
              {
                name: "task_type",
                label: "Тип задания",
                type: "select",
                required: true,
                options: [
                  { value: "sequence", label: "Последовательность" },
                  { value: "match", label: "Соответствие" },
                  { value: "choice", label: "Выбор" },
                ],
              },
              { name: "profession_id", label: "Профессия", type: "select", options: profOptions },
              { name: "max_score", label: "Максимальный балл", type: "number" },
              { name: "sort_order", label: "Порядок", type: "number" },
            ]}
            columns={[
              { key: "title", label: "Название" },
              { key: "task_type", label: "Тип" },
              { key: "max_score", label: "Балл" },
            ]}
          />
        </TabsContent>

        <TabsContent value="settings" className="pt-6">
          <EntityManager
            table="test_settings"
            title="Параметры тестирования"
            archivable={false}
            searchKeys={[]}
            fields={[
              { name: "profession_id", label: "Профессия (пусто — по умолчанию)", type: "select", options: profOptions },
              { name: "total_questions", label: "Всего вопросов", type: "number", required: true },
              { name: "common_questions", label: "Общих вопросов", type: "number" },
              { name: "professional_questions", label: "Профессиональных вопросов", type: "number" },
              { name: "pass_percent", label: "Проходной балл, %", type: "number" },
              { name: "time_limit_minutes", label: "Ограничение по времени, мин", type: "number" },
              { name: "max_attempts", label: "Количество попыток", type: "number" },
              { name: "allow_retry", label: "Разрешить пересдачу", type: "boolean" },
              { name: "shuffle_questions", label: "Случайная выборка вопросов", type: "boolean" },
              { name: "shuffle_options", label: "Перемешивать ответы", type: "boolean" },
              { name: "show_correct_answer", label: "Показывать верный ответ", type: "boolean" },
            ]}
            columns={[
              {
                key: "profession",
                label: "Профессия",
                render: (r) =>
                  profOptions.find((p) => p.value === r["profession_id"])?.label ?? "По умолчанию",
              },
              { key: "total_questions", label: "Вопросов" },
              { key: "pass_percent", label: "Проходной, %" },
              { key: "max_attempts", label: "Попыток" },
            ]}
          />
        </TabsContent>

        <TabsContent value="stats" className="pt-6">
          <TestStats />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TestStats() {
  return (
    <Card>
      <CardContent className="pt-6 text-sm text-muted-foreground">
        Подробная статистика по попыткам, средним баллам и профессиям доступна в разделе
        «Экспорт» — выгрузки «Статистика» и «Результаты» в CSV.
      </CardContent>
    </Card>
  );
}
