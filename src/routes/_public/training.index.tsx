import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { platform, stages } from "@/content/site";
import { Section, InfoCard } from "@/components/public/sections";
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

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

function TypewriterText({
  text,
  delay = 0,
  speed = 30,
}: {
  text: string;
  delay?: number;
  speed?: number;
}) {
  const [displayed, setDisplayed] = useState(text);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      setDisplayed(text);
      return;
    }
    setDisplayed(text);
    const start = setTimeout(() => {
      setDisplayed("");
      let i = 0;
      const interval = setInterval(() => {
        i += 1;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) clearInterval(interval);
      }, speed);
    }, delay);
    return () => clearTimeout(start);
  }, [text, delay, speed, reducedMotion]);

  return <span>{displayed}</span>;
}

function AnimatedStageList({ items }: { items: readonly { title: string; text: string }[] }) {
  return (
    <ol className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
      {items.map((s, i) => {
        const cardDelay = i * 300;
        const titleDelay = cardDelay + 400;
        const textDelay = titleDelay + s.title.length * 30 + 200;
        return (
          <li
            key={s.title}
            className="animate-fade-in rounded-lg border border-border bg-card p-6"
            style={{ animationDelay: `${cardDelay}ms`, animationFillMode: "both" }}
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              {i + 1}
            </span>
            <h3 className="mt-4 min-h-[1.5rem] text-base font-semibold text-foreground">
              <TypewriterText text={s.title} delay={titleDelay} speed={30} />
            </h3>
            <p className="mt-2 min-h-[3rem] text-sm text-muted-foreground">
              <TypewriterText text={s.text} delay={textDelay} speed={20} />
            </p>
          </li>
        );
      })}
    </ol>
  );
}

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
