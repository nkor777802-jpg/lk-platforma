import { cn } from "@/lib/utils";
import { thumbUrl } from "@/lib/cabletris/adapter";

export function ProductCard({
  brand,
  image,
  compact = false,
  thumb = false,
}: {
  brand: string;
  image: string;
  compact?: boolean;
  thumb?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex h-full min-h-0 w-full flex-col overflow-hidden rounded-md border border-border/70 bg-card shadow-sm",
        compact && "rounded-sm",
      )}
    >
      <div className="flex min-h-0 flex-[3] items-center justify-center bg-muted/30 p-0.5">
        <img
          src={thumb ? thumbUrl(image) : image}
          alt=""
          className="h-full w-full object-contain"
          draggable={false}
          decoding="async"
          loading="eager"
          width={192}
          height={192}
        />
      </div>
      <p
        className={cn(
          "flex shrink-0 items-center justify-center px-0.5 pb-0.5 text-center font-semibold leading-[1.05] tracking-tight text-secondary [overflow-wrap:anywhere]",
          compact ? "text-[9px] sm:text-[11px]" : "text-[9px] sm:text-[11px]",
        )}
      >
        {brand}
      </p>
    </div>
  );
}
