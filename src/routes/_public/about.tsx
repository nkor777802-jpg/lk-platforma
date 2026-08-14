import { createFileRoute } from "@tanstack/react-router";
import { about, company } from "@/content/site";
import { useCompany } from "@/hooks/useCompany";
import { Section, InfoCard } from "@/components/public/sections";

const TITLE = "О предприятии — Людиновокабель";
const DESCRIPTION =
  "Кабельное производство «Людиновокабель»: специализация, подход к качеству и развитию профессиональных кадров.";

export const Route = createFileRoute("/_public/about")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://brand-palette-decoder.lovable.app/about" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://brand-palette-decoder.lovable.app/about" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  const company = useCompany();
  return (
    <>
      <PageHero eyebrow={company.legalName} title="О предприятии" lead={about.lead} />

      <Section title="Чем занимается предприятие">
        <div className="grid gap-6 md:grid-cols-3">
          {about.points.map((p) => (
            <InfoCard key={p.title} title={p.title} text={p.text} />
          ))}
        </div>
      </Section>

      <Section title="Подход к персоналу" tone="muted">
        <div className="max-w-3xl space-y-4 text-muted-foreground">
          <p>
            Производство кабеля требует точного соблюдения технологии: от подготовки токопроводящей
            жилы до наложения изоляции и оболочки. Ошибка на любом переделе означает брак партии.
          </p>
          <p>
            Поэтому предприятие развивает собственную систему подготовки: единые программы по
            профессиям, наставничество, регулярная проверка знаний и подтверждение разряда.
          </p>
          <p>
            Организация: {company.legalName}. Обучением занимается {company.unit.toLowerCase()}.
          </p>
        </div>
      </Section>
    </>
  );
}
