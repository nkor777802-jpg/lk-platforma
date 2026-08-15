import { createFileRoute, Link } from "@tanstack/react-router";
import { company } from "@/content/site";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-plant.jpg";

const TITLE = "Людиновокабель — обучение и аттестация работников кабельного производства";
const DESCRIPTION =
  "Корпоративная платформа обучения «Людиновокабель»: программы по профессиям, учебные материалы, тестирование и аттестация работников кабельного завода.";

export const Route = createFileRoute("/_public/")({
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
  return (
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
              <Link to="/training/professions">Возможные профессии для обучения</Link>
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
  );
}
