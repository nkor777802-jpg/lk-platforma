import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { OrgGraph } from "@/components/org/OrgGraph";
import { publicOrgStructureQuery } from "@/lib/public-queries";

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
      <section className="brand-pattern-blue text-secondary-foreground">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:py-20">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Организационная структура</h1>
          <p className="mt-4 max-w-3xl text-lg opacity-90">
            Как устроено предприятие: подразделения, должности и штатная численность.
          </p>
          {stats ? (
            <dl className="mt-8 flex flex-wrap gap-8">
              {[
                { label: "Подразделений", value: num(stats.units) },
                { label: "Должностей", value: num(stats.positions) },
                { label: "Штатных единиц", value: num(stats.planned) },
              ].map((m) => (
                <div key={m.label}>
                  <dd className="text-3xl font-bold">{m.value}</dd>
                  <dt className="text-sm opacity-80">{m.label}</dt>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      </section>

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
                note="Актуально по действующей штатной расстановке"
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
