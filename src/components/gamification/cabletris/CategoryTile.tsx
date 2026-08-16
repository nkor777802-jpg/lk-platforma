import { cn } from "@/lib/utils";

export function CategoryTile({ label, compact = false }: { label: string; compact?: boolean }) {
  return (
    <div
      className={cn(
        "flex h-full min-h-0 w-full items-center justify-center rounded-md border-2 border-accent bg-accent/15 px-0.5 text-center font-semibold leading-tight text-accent",
        compact ? "text-[8px] sm:text-[10px]" : "text-[9px] sm:text-xs",
      )}
    >
      {label}
    </div>
  );
}
