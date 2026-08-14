import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { publicProfessionsQuery } from "@/lib/public-queries";
import { ProfessionGrid } from "@/components/public/ProfessionGrid";
import { Section } from "@/components/public/sections";
import { PageHero } from "@/components/public/PageHero";

const TITLE = "Обучение по профессиям кабельного производства — Людиновокабель";
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
            { "@type": "ListItem", position: 3, name: "Обучение по профессиям", item: "/training/professions" },
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
      <PageHero
        title="Обучение по профессиям"
        lead="Направления производства и программы обучения. Прохождение обучения возможно только после авторизации в системе."
      />

      <Section title="Программы обучения">
        <ProfessionGrid items={data} />
      </Section>
    </>
  );
}
