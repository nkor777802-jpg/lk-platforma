import { useQuery } from "@tanstack/react-query";
import { ExternalLink, FileText } from "lucide-react";
import { publicLegalDocumentsQuery } from "@/lib/public-queries";
import { Button } from "@/components/ui/button";

function formatSize(bytes: number | null) {
  if (!bytes) return null;
  return `${Math.max(1, Math.round(bytes / 1024))} КБ`;
}

function formatDate(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function LegalDocsDownload({
  slugs,
  title = "Официальные документы",
}: {
  slugs: string[];
  title?: string;
}) {
  const { data } = useQuery(publicLegalDocumentsQuery);
  const docs = (data ?? []).filter((d) => slugs.includes(d.slug));
  if (docs.length === 0) return null;

  return (
    <div id="documents" className="rounded-xl border border-border bg-card p-6">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <ul className="mt-4 space-y-3">
        {docs.map((doc) => {
          const meta = [formatDate(doc.updatedAt), formatSize(doc.fileSize)].filter(Boolean).join(" · ");
          return (
            <li key={doc.slug} className="flex flex-wrap items-center gap-3">
              <FileText className="size-5 shrink-0 text-primary" aria-hidden />
              <div className="min-w-56 flex-1">
                <p className="font-medium text-foreground">{doc.title}</p>
                <p className="text-sm text-muted-foreground">
                  {doc.fileName ?? "PDF"}
                  {meta ? ` — ${meta}` : ""}
                </p>
              </div>
              <Button asChild size="sm" variant="outline">
                <a href={doc.url ?? "#"} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-4" aria-hidden /> Открыть
                </a>
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
