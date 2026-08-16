import { Layers } from "lucide-react";
import { cn } from "@/lib/utils";

export function CategoryTile({ label, compact = false }: { label: string; compact?: boolean }) {
  return (
    <div
      className={cn(
        "flex h-full min-h-0 w-full flex-col items-center justify-center gap-0.5 rounded-lg border-2 border-accent bg-accent px-0.5 text-center font-bold leading-[1.1] tracking-tight text-accent-foreground shadow-[0_2px_8px_-2px_color-mix(in_oklab,var(--brand-teal)_60%,transparent)] [overflow-wrap:anywhere]",
        compact ? "text-[9px] sm:text-[10px]" : "text-[10px] sm:text-[12px]",
      )}
      title={label}
    >
      <Layers className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span className="line-clamp-2">{label}</span>
    </div>
  );
}
