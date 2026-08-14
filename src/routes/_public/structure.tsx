import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { OrgGraph } from "@/components/org/OrgGraph";
import { publicOrgStructureQuery } from "@/lib/public-queries";
import { PageHero } from "@/components/public/PageHero";

const TITLE = "Организационная структура — АО «Людиновокабель»";
const DESCRIPTION =
  "Интерактивная схема структуры кабельного завода «Людиновокабель»: подразделения, должности, численность и производственные участки.";

export const Route = createFileRoute("/_public/structure")({
  loader: ({ context }) => {
    void context.queryClient.ensureQueryData(publicOrgStructureQuery);
  },
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/structure" }],
  }),
  component: PublicStructurePage,
});

function num(v: number) {
  return new Intl.NumberFormat("ru-RU").format(Math.round(v));
}

function PublicStructurePage() {
  const { data } = useSuspenseQuery(publicOrgStructureQuery);
  const stats = data.stats;

  return (
    <>
      <PageHero
        title={`Организационная структура${stats?.year ? ` ${stats.year} год` : ""}`}
        lead="Как устроено предприятие: подразделения, должности и численность."
      >
          {stats ? (
            <dl className="flex flex-wrap gap-x-8 gap-y-4">
              {[
                { label: "Подразделений", value: num(stats.units), accent: false },
                { label: "Должностей", value: num(stats.positions), accent: false },
                { label: "Штатная численность", value: num(stats.planned), accent: false },
                {
                  label: "в том числе производственных рабочих",
                  value: num(stats.productionWorkers),
                  accent: true,
                },
              ].map((m) => (
                <div key={m.label} className="max-w-[16rem]">
                  <dd className={`text-3xl font-bold ${m.accent ? "text-primary" : ""}`}>{m.value}</dd>
                  <dt className="text-sm opacity-80">{m.label}</dt>
                </div>
              ))}
            </dl>
          ) : null}
      </PageHero>

      <section className="bg-background">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
          {data.units.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Организационная структура публикуется. Загляните чуть позже.
            </p>
          ) : (
            <>
              <OrgGraph
                units={data.units}
                title="Схема предприятия"
                {...(data.version?.title ? { subtitle: data.version.title } : {})}
                note="Актуальная версия структуры"
              />
              <p className="mt-4 text-xs text-muted-foreground">
                Персональные данные работников на публичной схеме не отображаются.
              </p>
            </>
          )}
        </div>
      </section>
    </>
  );
}
