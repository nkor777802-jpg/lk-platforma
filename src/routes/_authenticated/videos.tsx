import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { videosQuery } from "@/lib/lms-queries";
import { EmptyState, LoadingState } from "@/components/states";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/videos")({
  head: () => ({
    meta: [
      { title: "Видео — Академия «Людиновокабель»" },
      { name: "description", content: "Видеоматериалы о заводе, технологии и охране труда." },
      { property: "og:title", content: "Видеоматериалы завода" },
      { property: "og:description", content: "Обучающие видео по технологии и безопасности." },
    ],
  }),
  component: VideosPage,
});

function VideosPage() {
  const videos = useQuery(videosQuery);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-secondary">Видеоматериалы</h1>
      {videos.isLoading ? (
        <LoadingState />
      ) : (videos.data ?? []).length === 0 ? (
        <EmptyState title="Видео пока не добавлены" />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
    </div>
  );
}