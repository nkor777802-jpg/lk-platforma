import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink, FileText } from "lucide-react";
import { toast } from "sonner";
import { acceptLegalConsents } from "@/lib/legal.functions";
import { legalDocumentsQuery, myConsentStatusQuery } from "@/lib/legal-queries";
import { signedUrl } from "@/lib/storage";
import { InlineLoading } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/legal-consent")({
  head: () => ({
    meta: [
      { title: "Согласие на обработку персональных данных" },
      {
        name: "description",
        content: "Подтверждение согласия работника на обработку персональных данных.",
      },
      { property: "og:title", content: "Согласие на обработку персональных данных" },
      { property: "og:description", content: "Обязательный шаг перед началом работы в системе." },
    ],
  }),
  component: ConsentPage,
});

function ConsentPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const status = useQuery(myConsentStatusQuery);
  const docs = useQuery(legalDocumentsQuery);
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const accept = useServerFn(acceptLegalConsents);

  const openDoc = async (path: string | null) => {
    const url = await signedUrl(path, "legal-docs");
    if (!url) {
      toast.error("Файл документа не загружен");
      return;
    }
    window.open(url, "_blank", "noopener");
  };

  const submit = async () => {
    setBusy(true);
    try {
      await accept({ data: undefined });
      await qc.invalidateQueries({ queryKey: ["legal", "my-consent"] });
      toast.success("Согласие сохранено");
      void router.navigate({ to: "/dashboard", replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось сохранить согласие");
    } finally {
      setBusy(false);
    }
  };

  if (status.isPending) return <InlineLoading />;

  const siteDocs = (docs.data ?? []).filter((d) => d.kind === "site");

  return (
    <div className="mx-auto max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Согласие на обработку персональных данных</CardTitle>
          <CardDescription>
            Для доступа к платформе обучения необходимо ознакомиться с документами и подтвердить
            согласие на обработку персональных данных.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <ul className="space-y-3">
            {siteDocs.map((doc) => (
              <li
                key={doc.id}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-4"
              >
                <FileText className="size-5 shrink-0 text-primary" aria-hidden />
                <p className="min-w-56 flex-1 font-medium text-foreground">{doc.title}</p>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!doc.storage_path}
                  onClick={() => void openDoc(doc.storage_path)}
                >
                  <ExternalLink className="size-4" aria-hidden /> Открыть
                </Button>
              </li>
            ))}
          </ul>

          <label className="flex items-start gap-3 text-sm text-foreground">
            <Checkbox
              checked={checked}
              onCheckedChange={(v) => setChecked(v === true)}
              aria-label="Подтверждение согласия"
            />
            <span>
              Я ознакомлен(а) с указанными документами и даю согласие на обработку моих
              персональных данных.
            </span>
          </label>

          <Button disabled={!checked || busy} onClick={() => void submit()}>
            {busy ? "Сохранение…" : "Подтвердить"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
