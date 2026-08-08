import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Download, ExternalLink } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { myCertificatesQuery } from "@/lib/account-queries";
import { signedUrl } from "@/lib/storage";
import { EmptyState, InlineLoading } from "@/components/states";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/certificates")({
  head: () => ({
    meta: [
      { title: "Сертификаты — Академия «Людиновокабель»" },
      { name: "description", content: "Выданные сертификаты сотрудника, даты выдачи и сроки действия." },
      { property: "og:title", content: "Сертификаты сотрудника" },
      { property: "og:description", content: "Просмотр и скачивание сертификатов об обучении." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CertificatesPage,
});

type CertRow = {
  id: string;
  title: string;
  number: string | null;
  issued_at: string;
  expires_at: string | null;
  file_url: string | null;
  courses?: { title?: string } | null;
  professions?: { name?: string } | null;
};

function CertificatesPage() {
  const { user } = useAuth();
  const certificates = useQuery(myCertificatesQuery(user?.id));
  const [busy, setBusy] = useState<string | null>(null);

  if (certificates.isLoading) return <InlineLoading />;
  const items = (certificates.data ?? []) as CertRow[];

  const open = async (c: CertRow) => {
    if (!c.file_url) {
      toast.error("Файл сертификата недоступен");
      return;
    }
    setBusy(c.id);
    const url = await signedUrl(c.file_url);
    setBusy(null);
    if (!url) {
      toast.error("Не удалось открыть файл");
      return;
    }
    window.open(url, "_blank", "noopener");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary sm:text-3xl">Сертификаты</h1>
        <p className="mt-2 text-muted-foreground">
          Документы, подтверждающие завершение программ обучения.
        </p>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="Сертификатов пока нет"
          description="Сертификат появится после успешного завершения программы, которая его предусматривает."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((c) => {
            const expired = c.expires_at ? new Date(c.expires_at) < new Date() : false;
            return (
              <Card key={c.id}>
                <CardHeader className="space-y-2">
                  <CardTitle className="text-lg leading-snug">{c.title}</CardTitle>
                  <div className="flex flex-wrap gap-2">
                    {c.number ? <Badge variant="outline">№ {c.number}</Badge> : null}
                    <Badge variant={expired ? "destructive" : "secondary"}>
                      {expired ? "Срок истёк" : "Действителен"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="text-muted-foreground">
                    {c.courses?.title ?? c.professions?.name ?? ""}
                  </p>
                  <p className="text-muted-foreground">
                    Выдан: {new Date(c.issued_at).toLocaleDateString("ru-RU")}
                    {c.expires_at
                      ? ` · действует до ${new Date(c.expires_at).toLocaleDateString("ru-RU")}`
                      : ""}
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" disabled={busy === c.id} onClick={() => open(c)}>
                      <ExternalLink className="mr-1.5 h-4 w-4" />
                      Открыть
                    </Button>
                    <Button size="sm" variant="outline" disabled={busy === c.id} onClick={() => open(c)}>
                      <Download className="mr-1.5 h-4 w-4" />
                      Скачать
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}