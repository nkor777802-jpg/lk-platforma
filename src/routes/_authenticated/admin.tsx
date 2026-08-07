import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { EmptyState, InlineLoading } from "@/components/states";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Админ-панель — Академия «Людиновокабель»" },
      { name: "description", content: "Управление контентом, пользователями и настройками тестирования." },
      { property: "og:title", content: "Админ-панель платформы обучения" },
      { property: "og:description", content: "Управление контентом, пользователями и тестами." },
    ],
  }),
  component: AdminPage,
});

const SECTIONS = [
  { title: "Пользователи и роли", text: "Сотрудники, роли, подразделения, назначение профессий." },
  { title: "Профессии и курсы", text: "Справочник профессий, модули и программы обучения." },
  { title: "Материалы и видео", text: "Загрузка документов, инструкций и видеоматериалов." },
  { title: "Банк вопросов", text: "Вопросы, варианты ответов, общие и профессиональные темы." },
  { title: "Настройки тестирования", text: "Количество вопросов, проходной балл, попытки, время." },
  { title: "Практические задания", text: "Задания на последовательность, соответствие и выбор." },
  { title: "Результаты и протоколы", text: "Попытки сотрудников, статистика и выгрузка протоколов." },
  { title: "Контент компании", text: "История, руководство, продукция, ценности." },
];

function AdminPage() {
  const { isStaff, loading } = useAuth();

  if (loading) return <InlineLoading />;
  if (!isStaff)
    return (
      <EmptyState
        title="Доступ ограничен"
        description="Админ-панель доступна сотрудникам HR и администраторам."
        action={
          <Link to="/dashboard" className="text-primary hover:underline">
            Вернуться на главную
          </Link>
        }
      />
    );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-secondary">Админ-панель</h1>
        <p className="mt-2 text-muted-foreground">
          Управление платформой обучения и аттестации. Разделы наполняются данными вашей базы.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((s) => (
          <Card key={s.title}>
            <CardContent className="pt-6">
              <p className="font-semibold text-foreground">{s.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}