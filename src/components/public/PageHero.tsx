import type { ReactNode } from "react";

/**
 * Единая «шапка» страницы: одинаковая высота и выравнивание на всех разделах.
 * Контент вертикально центрируется, поэтому блоки выглядят одинаково
 * независимо от длины заголовка и подзаголовка.
 */
export function PageHero({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  children?: ReactNode;
}) {
  return (
    <section className="brand-pattern-blue text-secondary-foreground">
      <div className="mx-auto flex min-h-[220px] w-full max-w-7xl flex-col justify-center px-4 py-12 sm:min-h-[260px] sm:py-14">
        {eyebrow ? (
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">{eyebrow}</p>
        ) : null}
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1>
        {lead ? <p className="mt-4 max-w-3xl text-lg opacity-90">{lead}</p> : null}
        {children ? <div className="mt-6">{children}</div> : null}
      </div>
    </section>
  );
}
