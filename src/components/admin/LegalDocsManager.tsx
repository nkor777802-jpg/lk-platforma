import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Download, ExternalLink, FileText, Upload } from "lucide-react";
import { toast } from "sonner";
import { legalDocumentsQuery } from "@/lib/legal-queries";
import { saveLegalDocumentVersion } from "@/lib/legal.functions";
import { signedUrl, uploadFile } from "@/lib/storage";
import { ErrorState, InlineLoading } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const BUCKET = "legal-docs";
const ACCEPT = ".pdf,.doc,.docx,application/pdf";

export interface LegalDocRow {
  id: string;
  slug: string;
  title: string;
  kind: string;
  storage_path: string | null;
  file_name: string | null;
  file_size: number | null;
  uploaded_at: string | null;
  uploaded_by_name?: string | null;
}

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

export function DocumentRow({
  doc,
  canManage,
  onUploaded,
}: {
  doc: LegalDocRow;
  canManage: boolean;
  onUploaded: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const save = useServerFn(saveLegalDocumentVersion);

  const download = async () => {
    const url = await signedUrl(doc.storage_path, BUCKET);
    if (!url) {
      toast.error("Файл документа не загружен");
      return;
    }
    window.open(url, "_blank", "noopener");
  };

  /** Принудительное скачивание доступно только админу и HR. */
  const downloadFile = async () => {
    const url = await signedUrl(doc.storage_path, BUCKET);
    if (!url) {
      toast.error("Файл документа не загружен");
      return;
    }
    const link = document.createElement("a");
    link.href = `${url}${url.includes("?") ? "&" : "?"}download=${encodeURIComponent(doc.file_name ?? "document.pdf")}`;
    link.rel = "noopener";
    link.click();
  };

  const upload = async (file: File) => {
    setBusy(true);
    try {
      const path = await uploadFile(BUCKET, file, `${doc.slug}/`);
      await save({
        data: {
          slug: doc.slug,
          storagePath: path,
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          fileSize: file.size,
        },
      });
      toast.success("Документ обновлён");
      onUploaded();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось загрузить документ");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const meta = [formatDate(doc.uploaded_at), formatSize(doc.file_size), doc.uploaded_by_name]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-4">
      <FileText className="size-5 shrink-0 text-primary" aria-hidden />
      <div className="min-w-56 flex-1">
        <p className="font-medium text-foreground">{doc.title}</p>
        <p className="text-sm text-muted-foreground">
          {doc.file_name ?? "Файл не загружен"}
          {meta ? ` — ${meta}` : ""}
        </p>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={download} disabled={!doc.storage_path}>
          <ExternalLink className="size-4" aria-hidden /> Открыть
        </Button>
        {canManage ? (
          <>
            <Button size="sm" variant="outline" onClick={downloadFile} disabled={!doc.storage_path}>
              <Download className="size-4" aria-hidden /> Скачать
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPT}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void upload(file);
              }}
            />
            <Button size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
              <Upload className="size-4" aria-hidden /> {busy ? "Загрузка…" : "Заменить"}
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
}

export function LegalDocsManager({ canManage = true }: { canManage?: boolean }) {
  const qc = useQueryClient();
  const query = useQuery(legalDocumentsQuery);

  if (query.isPending) return <InlineLoading />;
  if (query.isError) return <ErrorState message="Не удалось загрузить документы по ПД." />;

  const rows = (query.data ?? []) as LegalDocRow[];
  const refresh = () => void qc.invalidateQueries({ queryKey: ["legal", "documents"] });

  const groups = [
    { kind: "site", title: "Документы для сайта", hint: "Публикуются в разделах о персональных данных." },
    { kind: "signature", title: "Бланки для подписи", hint: "Выгружаются на печать и подписываются работником." },
  ];

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <Card key={group.kind}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              {group.title}
              <Badge variant="secondary">{rows.filter((r) => r.kind === group.kind).length}</Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground">{group.hint}</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {rows
              .filter((r) => r.kind === group.kind)
              .map((doc) => (
                <DocumentRow key={doc.id} doc={doc} canManage={canManage} onUploaded={refresh} />
              ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
