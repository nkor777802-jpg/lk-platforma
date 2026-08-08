import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { publicProfessionsQuery } from "@/lib/public-queries";
import { ProfessionGrid } from "@/components/public/ProfessionGrid";
import { Section } from "@/components/public/sections";

const TITLE = "Профессии кабельного производства — Людиновокабель";
const DESCRIPTION =
  "Рабочие профессии кабельного завода «Людиновокабель» и программы обучения по каждой из них.";

export const Route = createFileRoute("/_public/training/professions")({
  loader: ({ context }) => {
    void context.queryClient.ensureQueryData(publicProfessionsQuery);
  },
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/training/professions" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/training/professions" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Главная", item: "/" },
            { "@type": "ListItem", position: 2, name: "Обучение", item: "/training" },
            { "@type": "ListItem", position: 3, name: "Профессии", item: "/training/professions" },
          ],
        }),
      },
    ],
  }),
  component: ProfessionsPage,
});

function ProfessionsPage() {
  const { data } = useSuspenseQuery(publicProfessionsQuery);

  return (
    <>
      <div className="brand-pattern-blue text-secondary-foreground">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <h1 className="text-4xl font-bold sm:text-5xl">Профессии</h1>
          <p className="mt-4 max-w-3xl text-lg opacity-90">
            Направления производства и программы обучения. Прохождение обучения возможно только
            после авторизации в системе.
          </p>
        </div>
      </div>

      <Section title="Программы обучения">
        <ProfessionGrid items={data} />
      </Section>
    </>
  );
}
