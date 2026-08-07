import type { ReactNode } from "react";
import { AlertTriangle, Inbox, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function LoadingState({ rows = 3 }: { rows?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-40 w-full rounded-xl" />
      ))}
    </div>
  );
}

export function InlineLoading({ label = "Загрузка…" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 py-8 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span className="text-base">{label}</span>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 px-6 py-14 text-center">
      <Inbox className="mb-3 h-9 w-9 text-muted-foreground" />
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-12 text-center">
      <AlertTriangle className="mb-3 h-9 w-9 text-destructive" />
      <h3 className="text-lg font-semibold text-foreground">Не удалось загрузить данные</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        {message ?? "Повторите попытку позже."}
      </p>
    </div>
  );
}