import { useState } from "react";
import { Download, FileText, Link2 } from "lucide-react";
import { toast } from "sonner";
import { signedUrl } from "@/lib/storage";
import { EmptyState, InlineLoading } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface MaterialRow {
  id: string;
  title: string;
  description: string | null;
  material_type: string | null;
  file_url: string | null;
  external_url: string | null;
  material_categories?: { name?: string } | null;
}

export function MaterialList({ items, loading }: { items: MaterialRow[]; loading?: boolean }) {
  const [busy, setBusy] = useState<string | null>(null);

  if (loading) return <InlineLoading />;
  if (items.length === 0)
    return (
      <EmptyState
        title="Материалы пока не добавлены"
        description="Администратор загрузит документы и инструкции в админ-панели."
      />
    );

  const open = async (m: MaterialRow) => {
    if (m.external_url) {
      window.open(m.external_url, "_blank", "noopener");
      return;
    }
    setBusy(m.id);
    const url = await signedUrl(m.file_url);
    setBusy(null);
    if (!url) {
      toast.error("Файл недоступен");
      return;
    }
    window.open(url, "_blank", "noopener");
  };

  return (
    <ul className="space-y-3">
      {items.map((m) => (
        <li
          key={m.id}
          className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-card p-4"
        >
          <div className="flex min-w-0 items-start gap-3">
            <FileText className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="font-medium text-foreground">{m.title}</p>
              {m.description ? (
                <p className="mt-0.5 text-sm text-muted-foreground">{m.description}</p>
              ) : null}
              {m.material_categories?.name ? (
                <Badge variant="secondary" className="mt-2">
                  {m.material_categories.name}
                </Badge>
              ) : null}
            </div>
          </div>
          <Button size="sm" variant="outline" disabled={busy === m.id} onClick={() => open(m)}>
            {m.external_url ? <Link2 className="mr-1.5 h-4 w-4" /> : <Download className="mr-1.5 h-4 w-4" />}
            Открыть
          </Button>
        </li>
      ))}
    </ul>
  );
}