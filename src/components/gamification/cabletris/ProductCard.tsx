import { cn } from "@/lib/utils";
import { thumbUrl } from "@/lib/cabletris/adapter";

/** Цветовая метка категории — только фирменные токены. */
const CATEGORY_ACCENT: Record<string, string> = {
  "01": "bg-primary",
  "02": "bg-accent",
  "03": "bg-secondary",
};

export function ProductCard({
  brand,
  image,
  categoryId,
  compact = false,
  thumb = false,
  showLabel = true,
}: {
  brand: string;
  image: string;
  categoryId?: string;
  compact?: boolean;
  thumb?: boolean;
  showLabel?: boolean;
}) {
  const accent = (categoryId && CATEGORY_ACCENT[categoryId]) || "bg-primary";

  return (
    <div
      className={cn(
        "relative flex h-full min-h-0 w-full flex-col overflow-hidden rounded-lg border border-secondary/25 bg-card shadow-[0_2px_6px_-2px_color-mix(in_oklab,var(--brand-blue)_45%,transparent)]",
        compact && "rounded-md",
      )}
      title={brand}
      aria-label={brand}
    >
      <span className={cn("h-1 w-full shrink-0", accent)} aria-hidden />
      <div className="flex min-h-0 flex-1 items-center justify-center bg-gradient-to-b from-background to-muted/50 p-0.5">
        <img
          src={thumb ? thumbUrl(image) : image}
          alt=""
          className="h-full w-full object-contain drop-shadow-sm"
          draggable={false}
          decoding="async"
          loading="eager"
          width={192}
          height={96}
        />
      </div>
      {showLabel ? (
        <p
        className={cn(
          "line-clamp-2 shrink-0 bg-secondary px-1 py-0.5 text-center font-bold leading-[1.1] tracking-tight text-secondary-foreground [overflow-wrap:anywhere]",
          compact ? "text-[9px]" : "text-[10px] sm:text-[12px]",
        )}
      >
        {brand}
      </p>
      ) : null}
    </div>
  );
}
