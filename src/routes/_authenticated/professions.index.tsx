import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { professionsQuery } from "@/lib/lms-queries";
import { EmptyState, LoadingState } from "@/components/states";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/professions/")({
  head: () => ({
    meta: [
      { title: "Обучение по профессиям — Академия «Людиновокабель»" },
      { name: "description", content: "Программы обучения по профессиям кабельного производства." },
      { property: "og:title", content: "Обучение по профессиям кабельного производства" },
      { property: "og:description", content: "Программы обучения, материалы и аттестация по профессиям." },
    ],
  }),
  component: ProfessionsPage,
});

function ProfessionsPage() {
  const professions = useQuery(professionsQuery);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-secondary sm:text-3xl">Обучение по профессиям</h1>
        <p className="mt-2 text-muted-foreground">
          Выберите профессию, чтобы изучить материалы и пройти аттестацию.
        </p>
      </div>
      {professions.isLoading ? (
        <LoadingState />
      ) : (professions.data ?? []).length === 0 ? (
        <EmptyState title="Профессии пока не добавлены" description="Администратор наполнит справочник профессий." />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(professions.data ?? []).map((p) => (
            <Card key={p.id}>
              <CardContent className="flex h-full flex-col pt-6">
                <h2 className="text-lg font-semibold text-foreground">{p.name}</h2>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">{p.short_description}</p>
                <Button asChild className="mt-5 w-full">
                  <Link to="/professions/$slug" params={{ slug: p.slug ?? p.id }}>
                    Открыть программу
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}