import { createFileRoute } from "@tanstack/react-router";
import { about, company } from "@/content/site";
import { Section, InfoCard } from "@/components/public/sections";
import plantExterior from "@/assets/plant-exterior.jpg.asset.json";

const TITLE = "О предприятии — Людиновокабель";
const DESCRIPTION =
  "Кабельное производство «Людиновокабель»: специализация, подход к качеству и развитию профессиональных кадров.";
const PLANT_IMAGE = `https://brand-palette-decoder.lovable.app${plantExterior.url}`;

export const Route = createFileRoute("/_public/about")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://brand-palette-decoder.lovable.app/about" },
      { property: "og:image", content: PLANT_IMAGE },
      { name: "twitter:image", content: PLANT_IMAGE },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://brand-palette-decoder.lovable.app/about" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <>
      <div className="brand-pattern-blue text-secondary-foreground">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 lg:grid-cols-2 lg:py-20">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">
              {company.legalName}
            </p>
            <h1 className="mt-4 text-4xl font-bold sm:text-5xl">О предприятии</h1>
            <p className="mt-4 max-w-2xl text-lg opacity-90">{about.lead}</p>
          </div>

          <figure className="relative">
            <span aria-hidden className="absolute -left-3 -top-3 h-16 w-16 bg-primary" />
            <img
              src={plantExterior.url}
              alt="Производственный корпус кабельного завода «Людиновокабель»"
              loading="lazy"
              width={836}
              height={383}
              className="relative aspect-[836/383] w-full object-cover shadow-brand"
            />
            <figcaption className="mt-3 text-sm opacity-75">
              Производственная площадка, г. Людиново
            </figcaption>
          </figure>
        </div>
      </div>

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
