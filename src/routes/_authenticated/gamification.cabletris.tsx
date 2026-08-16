import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CabletrisGame } from "@/components/gamification/cabletris/CabletrisGame";
import { EmptyState, InlineLoading } from "@/components/states";
import { gamificationSettingsQuery } from "@/lib/gamification-queries";

export const Route = createFileRoute("/_authenticated/gamification/cabletris")({
  head: () => ({
    meta: [
      { title: "КабельТрис — Академия «Людиновокабель»" },
      {
        name: "description",
        content: "Обучающая мини-игра: собирайте марки кабельной продукции и категории.",
      },
      { property: "og:title", content: "КабельТрис" },
      {
        property: "og:description",
        content: "Падающие карточки продукции, слияние марок и категорий.",
      },
    ],
  }),
  component: CabletrisPage,
});

function CabletrisPage() {
  const settings = useQuery(gamificationSettingsQuery);

  if (settings.isLoading) return <InlineLoading />;
  if (!settings.data?.gamificationEnabled) {
    return (
      <EmptyState
        title="Модуль отключён"
        description="Производственный тренажёр и мини-игры отключены администратором платформы."
      />
    );
  }

  return <CabletrisGame />;
}
