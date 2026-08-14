import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { about, advantages, company, faq, platform, stages } from "@/content/site";
import { useCompany } from "@/hooks/useCompany";
import { publicProfessionsQuery } from "@/lib/public-queries";
import { Section, InfoCard } from "@/components/public/sections";
import { AnimatedStageList } from "@/components/public/animated-stage-list";
import { ProfessionGrid } from "@/components/public/ProfessionGrid";
import { OrgStructurePreview } from "@/components/public/OrgStructurePreview";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import heroImage from "@/assets/hero-plant.jpg";

const TITLE = "Людиновокабель — обучение и аттестация работников кабельного производства";
const DESCRIPTION =
  "Корпоративная платформа обучения «Людиновокабель»: программы по профессиям, учебные материалы, тестирование и аттестация работников кабельного завода.";

export const Route = createFileRoute("/_public/")({
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
      { property: "og:url", content: "/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: company.legalName,
          description: DESCRIPTION,
          address: { "@type": "PostalAddress", streetAddress: company.address },
          telephone: company.phone,
          email: company.email,
        }),
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const company = useCompany();
  const { data: professions } = useSuspenseQuery(publicProfessionsQuery);

  return (
    <>
      <section className="bg-secondary text-secondary-foreground">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:py-24 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">
              Корпоративная платформа обучения
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl">
              Профессиональная подготовка и аттестация работников кабельного производства
            </h1>
            <p className="mt-5 max-w-xl text-lg opacity-90">
              Единая система обучения предприятия: программы по профессиям, учебные материалы,
              проверка знаний и подтверждение квалификации.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/auth">Войти в систему обучения</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-transparent">
                <Link to="/training/professions">Смотреть профессии</Link>
              </Button>
            </div>
          </div>
          <img
            src={heroImage}
            alt="Производственный цех кабельного завода: барабаны с медной жилой и линия экструзии"
            width={1600}
            height={1008}
            className="w-full rounded-lg border border-primary-foreground/10 object-cover shadow-lg"
          />
        </div>
      </section>

      <Section title="О предприятии" lead={about.lead}>
        <div className="grid gap-6 md:grid-cols-3">
          {about.points.map((p) => (
            <InfoCard key={p.title} title={p.title} text={p.text} />
          ))}
        </div>
        <Button asChild variant="link" className="mt-6 px-0">
          <Link to="/about">Подробнее о предприятии</Link>
        </Button>
      </Section>

      <Section title="Система обучения" lead={platform.lead} tone="muted">
        <div className="grid gap-6 md:grid-cols-2">
          {platform.points.map((p) => (
            <InfoCard key={p.title} title={p.title} text={p.text} />
          ))}
        </div>
        <Button asChild variant="link" className="mt-6 px-0">
          <Link to="/training">Как устроено обучение</Link>
        </Button>
      </Section>

      <Section
        id="structure"
        title="Структура предприятия"
        lead="Организационная структура завода по действующей штатной расстановке: подразделения, должности и численность."
      >
        <OrgStructurePreview />
      </Section>

      <Section
        title="Обучение по профессиям"
        lead="Программы обучения по рабочим профессиям кабельного производства. Прохождение доступно после входа в систему."
      >
        <ProfessionGrid items={professions.slice(0, 6)} />
        <Button asChild variant="link" className="mt-6 px-0">
          <Link to="/training/professions">Все профессии</Link>
        </Button>
      </Section>

      <Section title="Преимущества обучения" tone="muted">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {advantages.map((a) => (
            <InfoCard key={a.title} title={a.title} text={a.text} />
          ))}
        </div>
      </Section>

      <Section title="Этапы обучения">
        <AnimatedStageList items={stages} />
      </Section>

      <Section title="Частые вопросы" tone="muted">
        <Accordion type="single" collapsible className="max-w-3xl">
          {faq.map((item) => (
            <AccordionItem key={item.q} value={item.q}>
              <AccordionTrigger className="text-left">{item.q}</AccordionTrigger>
              <AccordionContent>{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Section>

      <Section title="Контакты" lead="Вопросы по обучению и доступу в систему.">
        <div className="grid gap-6 md:grid-cols-3">
          <InfoCard title="Адрес" text={company.address} />
          <InfoCard title="Телефон и e-mail" text={`${company.phone} · ${company.email}`} />
          <InfoCard title={company.unit} text={company.workHours} />
        </div>
        <Button asChild className="mt-6">
          <Link to="/contacts">Написать в отдел персонала</Link>
        </Button>
      </Section>
    </>
  );
}
