import { createFileRoute } from "@tanstack/react-router";
import { company } from "@/content/site";
import { Section } from "@/components/public/sections";
import { ContactForm } from "@/components/public/ContactForm";

const TITLE = "Контакты — Людиновокабель";
const DESCRIPTION =
  "Адрес, телефон и e-mail предприятия «Людиновокабель», контакты отдела подготовки и развития персонала.";

export const Route = createFileRoute("/_public/contacts")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/contacts" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/contacts" }],
  }),
  component: ContactsPage,
});

function ContactsPage() {
  return (
    <>
      <div className="brand-pattern-blue text-secondary-foreground">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <h1 className="text-4xl font-bold sm:text-5xl">Контакты</h1>
          <p className="mt-4 max-w-3xl text-lg opacity-90">
            Вопросы по обучению, доступу в систему и аттестации.
          </p>
        </div>
      </div>

      <Section title="Как с нами связаться">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="text-base font-semibold text-foreground">{company.legalName}</h3>
              <address className="mt-3 space-y-2 text-sm not-italic text-muted-foreground">
                <p>{company.address}</p>
                <p>
                  Телефон:{" "}
                  <a className="text-primary underline underline-offset-4" href={`tel:${company.phone.replace(/[^+\d]/g, "")}`}>
                    {company.phone}
                  </a>
                </p>
                <p>
                  E-mail:{" "}
                  <a className="text-primary underline underline-offset-4" href={`mailto:${company.email}`}>
                    {company.email}
                  </a>
                </p>
              </address>
            </div>
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="text-base font-semibold text-foreground">{company.unit}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Назначение программ, доступ в систему, вопросы аттестации.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">Режим работы: {company.workHours}</p>
            </div>
          </div>
          <div>
            <h3 className="mb-4 text-base font-semibold text-foreground">Форма обращения</h3>
            <ContactForm />
          </div>
        </div>
      </Section>
    </>
  );
}
