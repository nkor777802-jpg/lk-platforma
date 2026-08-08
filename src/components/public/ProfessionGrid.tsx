import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export type PublicProfession = {
  id: string;
  name: string;
  slug: string | null;
  code: string | null;
  short_description: string | null;
  duration_hours: number | null;
  skills: string[] | null;
  grades: string[] | null;
};

export function ProfessionGrid({ items }: { items: PublicProfession[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Справочник профессий наполняется. Актуальный перечень программ можно уточнить в отделе персонала.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((p) => (
        <article key={p.id} className="flex h-full flex-col rounded-lg border border-border bg-card p-6">
          {p.code ? (
            <p className="text-xs font-semibold uppercase tracking-widest text-accent">{p.code}</p>
          ) : null}
          <h3 className="mt-1 text-lg font-semibold text-foreground">{p.name}</h3>
          <p className="mt-2 flex-1 text-sm text-muted-foreground">
            {p.short_description ?? "Описание программы уточняется."}
          </p>
          <dl className="mt-4 space-y-1 text-sm text-muted-foreground">
            {p.grades?.length ? (
              <div className="flex gap-2">
                <dt className="font-medium text-foreground">Разряды:</dt>
                <dd>{p.grades.join(", ")}</dd>
              </div>
            ) : null}
            {p.duration_hours ? (
              <div className="flex gap-2">
                <dt className="font-medium text-foreground">Программа:</dt>
                <dd>{p.duration_hours} ч</dd>
              </div>
            ) : null}
          </dl>
          <Button asChild variant="outline" className="mt-5 w-full">
            <Link to="/auth">Пройти обучение после входа</Link>
          </Button>
        </article>
      ))}
    </div>
  );
}
