import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { professionMaterialsQuery, professionQuery, professionVideosQuery } from "@/lib/lms-queries";
import { EmptyState, InlineLoading } from "@/components/states";
import { MaterialList } from "@/components/MaterialList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/professions/$slug")({
  head: () => ({
    meta: [
      { title: "Программа обучения — Академия «Людиновокабель»" },
      { name: "description", content: "Материалы, видео и аттестация по выбранной профессии." },
      { property: "og:title", content: "Программа обучения по профессии" },
      { property: "og:description", content: "Теория, оборудование, безопасность и итоговая аттестация." },
    ],
  }),
  component: ProfessionPage,
});

function ProfessionPage() {
  const { slug } = useParams({ from: "/_authenticated/professions/$slug" });
  const profession = useQuery(professionQuery(slug));
  const materials = useQuery(professionMaterialsQuery(profession.data?.id));
  const videos = useQuery(professionVideosQuery(profession.data?.id));

  if (profession.isLoading) return <InlineLoading />;
  if (!profession.data)
    return <EmptyState title="Профессия не найдена" description="Проверьте адрес страницы." />;

  const p = profession.data;

  return (
    <div className="space-y-8">
      <div>
        <Link to="/professions" className="text-sm text-primary hover:underline">
          ← Все профессии
        </Link>
        <h1 className="mt-3 text-3xl font-bold text-secondary">{p.name}</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">{p.short_description}</p>
        {p.grades?.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {p.grades.map((g: string) => (
              <Badge key={g} variant="secondary">
                Разряд {g}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="overview">Описание</TabsTrigger>
          <TabsTrigger value="materials">Материалы</TabsTrigger>
          <TabsTrigger value="videos">Видео</TabsTrigger>
          <TabsTrigger value="test">Аттестация</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 pt-6">
          <Card>
            <CardHeader>
              <CardTitle>О профессии</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p className="whitespace-pre-line">{p.description ?? "Описание будет добавлено."}</p>
              {p.skills?.length ? (
                <div>
                  <p className="font-medium text-foreground">Ключевые навыки</p>
                  <ul className="mt-2 list-inside list-disc text-sm">
                    {p.skills.map((s: string) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {p.equipment?.length ? (
                <div>
                  <p className="font-medium text-foreground">Оборудование</p>
                  <ul className="mt-2 list-inside list-disc text-sm">
                    {p.equipment.map((s: string) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="materials" className="pt-6">
          <MaterialList items={materials.data ?? []} loading={materials.isLoading} />
        </TabsContent>

        <TabsContent value="videos" className="pt-6">
          {videos.isLoading ? (
            <InlineLoading />
          ) : (videos.data ?? []).length === 0 ? (
            <EmptyState title="Видео пока не добавлены" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {(videos.data ?? []).map((v) => (
                <Card key={v.id}>
                  <CardContent className="pt-6">
                    <p className="font-semibold text-foreground">{v.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{v.description}</p>
                    {v.external_url ? (
                      <a
                        href={v.external_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-block text-sm text-primary hover:underline"
                      >
                        Смотреть видео
                      </a>
                    ) : null}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="test" className="pt-6">
          <Card>
            <CardHeader>
              <CardTitle>Итоговая аттестация</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Тестирование формируется автоматически из банка вопросов по профессии и общих тем.
                После теста выполняется практическое задание, затем формируется протокол.
              </p>
              <Button asChild>
                <Link to="/test/$professionId" params={{ professionId: p.id }}>
                  Начать тестирование
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}