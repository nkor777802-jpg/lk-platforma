import { Layers } from "lucide-react";
import { cn } from "@/lib/utils";

export function CategoryTile({ label, compact = false }: { label: string; compact?: boolean }) {
  return (
    <div
      className={cn(
        "flex h-full min-h-0 w-full flex-col items-center justify-center gap-0.5 rounded-md border-2 border-accent bg-accent/20 px-0.5 text-center font-semibold leading-[1.05] tracking-tight text-accent-foreground [overflow-wrap:anywhere]",
        "bg-accent text-accent-foreground",
        compact ? "text-[9px] sm:text-[10px]" : "text-[9px] sm:text-[11px]",
      )}
    >
      <Layers className="h-3 w-3 shrink-0 opacity-90" aria-hidden />
      <span className="line-clamp-2">{label}</span>
    </div>
  );
}
