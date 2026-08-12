/** Статичный список этапов (заголовок → описание) — для печати и предпросмотра. */
export function StageList({
  items,
  compact = false,
}: {
  items: readonly { title: string; text: string }[];
  compact?: boolean;
}) {
  return (
    <ol
      className={
        compact
          ? "grid gap-3 sm:grid-cols-2"
          : "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-2"
      }
    >
      {items.map((s, i) => (
        <li
          key={s.title}
          className="avoid-break rounded-lg border border-border bg-card p-4 print:p-3"
        >
          <div className="flex items-start gap-3">
            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {i + 1}
            </span>
            <div className="min-w-0">
              <h3 className="break-words hyphens-auto text-sm font-semibold text-foreground">
                {s.title}
              </h3>
              <p className="mt-1 break-words hyphens-auto text-xs leading-relaxed text-muted-foreground">
                {s.text}
              </p>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}