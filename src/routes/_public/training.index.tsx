import { createFileRoute, Link } from "@tanstack/react-router";
import { platform, stages } from "@/content/site";
import { Section, InfoCard } from "@/components/public/sections";
import { AnimatedStageList } from "@/components/public/animated-stage-list";
import { Button } from "@/components/ui/button";

const TITLE = "Обучение и аттестация — Людиновокабель";
const DESCRIPTION =
  "Как устроено корпоративное обучение «Людиновокабель»: назначение программ, материалы, тестирование и фиксация результатов.";

export const Route = createFileRoute("/_public/training/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/training" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/training" }],
  }),
  component: TrainingPage,
});

function TrainingPage() {
  return (
    <>
      <div className="brand-pattern-blue text-secondary-foreground">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <h1 className="text-4xl font-bold sm:text-5xl">Система обучения</h1>
          <p className="mt-4 max-w-3xl text-lg opacity-90">{platform.lead}</p>
        </div>
      </div>

      <Section title="Как это работает">
        <div className="grid gap-6 md:grid-cols-2">
          {platform.points.map((p) => (
            <InfoCard key={p.title} title={p.title} text={p.text} />
          ))}
        </div>
      </Section>

      <Section title="Этапы обучения" tone="muted">
        <AnimatedStageList items={stages} />
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/auth">Войти в систему обучения</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/training/professions">Профессии и программы</Link>
          </Button>
        </div>
      </Section>
    </>
  );
}
