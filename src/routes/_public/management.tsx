import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { publicManagementQuery } from "@/lib/public-queries";
import { EmptyState } from "@/components/states";
import { ManagementCard } from "@/components/public/ManagementCard";

const TITLE = "Руководство — Людиновокабель";
const DESCRIPTION =
  "Руководство АО «Людиновокабель»: состав управленческой команды, должности и зоны ответственности.";
const URL = "https://brand-palette-decoder.lovable.app/management";

export const Route = createFileRoute("/_public/management")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: URL },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
  loader: ({ context }) => {
    void context.queryClient.ensureQueryData(publicManagementQuery);
  },
  component: ManagementPage,
});

function ManagementPage() {
  const { data } = useSuspenseQuery(publicManagementQuery);

  return (
    <>
      <div className="brand-pattern-blue text-secondary-foreground">
        <div className="mx-auto max-w-7xl px-4 py-16 lg:py-20">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            АО «Людиновокабель»
          </p>
          <h1 className="mt-4 text-4xl font-bold sm:text-5xl">Руководство</h1>
          <p className="mt-4 max-w-3xl text-lg opacity-90">
            Управленческая команда предприятия: кто отвечает за производство, качество и развитие
            персонала.
          </p>
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-4 py-12 lg:py-16">
        {data.length === 0 ? (
          <EmptyState title="Раздел ещё не заполнен" description="Информация появится позже." />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
            {data.map((m) => (
              <ManagementCard key={m.id} member={m} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
