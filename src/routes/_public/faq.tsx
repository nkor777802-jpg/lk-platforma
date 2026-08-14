import { createFileRoute } from "@tanstack/react-router";
import { faq } from "@/content/site";
import { Section } from "@/components/public/sections";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PageHero } from "@/components/public/PageHero";

const TITLE = "Частые вопросы об обучении — Людиновокабель";
const DESCRIPTION =
  "Вход в систему обучения, восстановление доступа, прохождение курсов, результаты и повторные попытки тестирования.";

export const Route = createFileRoute("/_public/faq")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/faq" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/faq" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faq.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
    ],
  }),
  component: FaqPage,
});

function FaqPage() {
  return (
    <>
      <PageHero
        title="Частые вопросы"
        lead="Ответы на типовые вопросы работников об обучении, тестировании и аттестации."
      />
      <Section title="Ответы на вопросы работников">
        <Accordion type="single" collapsible className="max-w-3xl">
          {faq.map((item) => (
            <AccordionItem key={item.q} value={item.q}>
              <AccordionTrigger className="text-left">{item.q}</AccordionTrigger>
              <AccordionContent>{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Section>
    </>
  );
}
