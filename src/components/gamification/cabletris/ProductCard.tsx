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
        "flex h-full min-h-0 w-full flex-col overflow-hidden rounded-md border border-border bg-card",
        compact && "rounded-sm",
      )}
    >
      <div className="flex min-h-0 flex-1 items-center justify-center bg-muted/40 p-0.5">
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
          "shrink-0 truncate px-0.5 py-0.5 text-center font-medium leading-tight text-secondary",
          compact ? "text-[8px] sm:text-[10px]" : "text-[9px] sm:text-xs",
        )}
      >
        {brand}
      </p>
    </div>
  );
}
