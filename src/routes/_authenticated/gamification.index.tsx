import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { gamificationSettingsQuery } from "@/lib/gamification-queries";
import { GAMES_CATALOG } from "@/lib/games-catalog";
import { GameCard } from "@/components/gamification/GameCard";
import { EmptyState, InlineLoading } from "@/components/states";

export const Route = createFileRoute("/_authenticated/gamification/")({
  head: () => ({
    meta: [
      { title: "Игры и тренажёры — Академия «Людиновокабель»" },
      {
        name: "description",
        content: "Изучай продукцию и производство в игровом формате.",
      },
      { property: "og:title", content: "Игры и тренажёры" },
      {
        property: "og:description",
        content: "Обучающие производственные игры и тренажёры платформы.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: GamesCatalogPage,
});

function GamesCatalogPage() {
  const settings = useQuery(gamificationSettingsQuery);

  if (settings.isLoading) return <InlineLoading />;
  if (!settings.data?.gamificationEnabled) {
    return (
      <EmptyState
        title="Модуль отключён"
        description="Игры и тренажёры отключены администратором платформы."
      />
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-secondary sm:text-3xl">Игры и тренажёры</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Изучай продукцию и производство в игровом формате
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {GAMES_CATALOG.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    </div>
  );
}
