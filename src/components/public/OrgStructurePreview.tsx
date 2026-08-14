import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Building2, Layers, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { publicOrgStructureQuery } from "@/lib/public-queries";

function num(v: number) {
  return new Intl.NumberFormat("ru-RU").format(Math.round(v));
}

export function OrgStructurePreview() {
  const { data } = useQuery(publicOrgStructureQuery);
  const units = data?.units ?? [];
  const stats = data?.stats;
  const top = units
    .filter((u) => u.level === 1)
    .sort((a, b) => b.planned - a.planned)
    .slice(0, 8);

  if (!stats || units.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Организационная структура публикуется. Загляните чуть позже.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <dl className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: Building2, label: "Подразделений", value: num(stats.units) },
          { icon: Layers, label: "Должностей", value: num(stats.positions) },
          { icon: Users, label: "Штатных единиц", value: num(stats.planned) },
        ].map((m) => (
          <div
            key={m.label}
            className="rounded-lg border border-border bg-card p-6 transition-colors hover:border-secondary"
          >
            <m.icon className="h-6 w-6 text-primary" aria-hidden />
            <dt className="mt-3 text-sm text-muted-foreground">{m.label}</dt>
            <dd className="text-3xl font-bold text-secondary">{m.value}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {top.map((u) => (
          <div
            key={u.key}
            className="group h-full rounded-lg border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-accent hover:shadow-md"
          >
            <span className="block h-1 w-10 rounded-full bg-accent transition-all group-hover:w-16" aria-hidden />
            <h3 className="mt-3 text-sm font-semibold text-secondary">{u.name}</h3>
            {u.unitType ? (
              <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">{u.unitType}</p>
            ) : null}
            <p className="mt-2 text-xs text-muted-foreground">
              Штат {num(u.planned)} · Должностей {u.positions.length}
            </p>
          </div>
        ))}
      </div>

      <Button asChild size="lg">
        <Link to="/structure">
          Смотреть полную схему
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}
