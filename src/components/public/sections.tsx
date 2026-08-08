import type { ReactNode } from "react";

export function Section({
  id,
  title,
  lead,
  children,
  tone = "default",
}: {
  id?: string;
  title: string;
  lead?: string;
  children: ReactNode;
  tone?: "default" | "muted" | "dark";
}) {
  const toneClass =
    tone === "muted" ? "bg-muted" : tone === "dark" ? "brand-pattern-blue text-secondary-foreground" : "bg-background";
  return (
    <section id={id} className={toneClass}>
      <div className="mx-auto max-w-7xl px-4 py-16 sm:py-20">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
        {lead ? <p className="mt-4 max-w-3xl text-lg text-muted-foreground">{lead}</p> : null}
        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
}

export function InfoCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="h-full rounded-lg border border-border bg-card p-6">
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

export function StageList({ items }: { items: readonly { title: string; text: string }[] }) {
  return (
    <ol className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
      {items.map((s, i) => (
        <li key={s.title} className="rounded-lg border border-border bg-card p-6">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
            {i + 1}
          </span>
          <h3 className="mt-4 text-base font-semibold text-foreground">{s.title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
        </li>
      ))}
    </ol>
  );
}
