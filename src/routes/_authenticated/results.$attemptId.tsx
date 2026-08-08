import { createFileRoute, useParams } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getProtocolHtml } from "@/lib/test.functions";
import { supabase } from "@/integrations/supabase/client";
import { ErrorState, InlineLoading } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/results/$attemptId")({
  head: () => ({
    meta: [
      { title: "Результат аттестации — Академия «Людиновокабель»" },
      { name: "description", content: "Результат тестирования и протокол проверки знаний." },
      { property: "og:title", content: "Результат аттестации" },
      { property: "og:description", content: "Итоги тестирования и HTML-протокол." },
    ],
  }),
  component: ResultsPage,
});

function ResultsPage() {
  const { attemptId } = useParams({ from: "/_authenticated/results/$attemptId" });
  const protocol = useServerFn(getProtocolHtml);
  const [busy, setBusy] = useState(false);

  const attempt = useQuery({
    queryKey: ["attempt", attemptId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("test_attempts")
        .select("*, professions(name)")
        .eq("id", attemptId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const openProtocol = async () => {
    setBusy(true);
    try {
      const { html } = await protocol({ data: { attemptId } });
      const win = window.open("", "_blank");
      if (win) {
        win.document.write(html);
        win.document.close();
      }
    } finally {
      setBusy(false);
    }
  };

  if (attempt.isLoading) return <InlineLoading />;
  if (attempt.error || !attempt.data) return <ErrorState />;

  const a = attempt.data;
  const gradeLabels: Record<string, string> = {
    confirmed: "Соответствует заявленному разряду",
    lowered: "Подтверждён более низкий разряд",
    failed: "Разряд не подтверждён",
  };
  const awaiting = a.status === "awaiting_review";
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold text-secondary">Результат аттестации</h1>
      <Card>
        <CardHeader>
          <CardTitle>
            {(a as { professions?: { name?: string } }).professions?.name ?? "Тестирование"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-5xl font-bold text-foreground">{Number(a.score_percent ?? 0)}%</p>
          <p className="text-sm text-muted-foreground">
            Правильных ответов: {a.correct_answers ?? 0} из {a.total_questions ?? 0}
          </p>
          <p className="text-sm text-muted-foreground">Попытка №{a.attempt_number ?? 1}</p>
          <div className="flex flex-wrap gap-2">
            {awaiting ? (
              <Badge variant="secondary">Развернутые ответы на проверке</Badge>
            ) : (
              <Badge variant={a.passed ? "default" : "destructive"}>
                {a.passed ? "Аттестован" : "Не аттестован"}
              </Badge>
            )}
            {a.grade_result ? (
              <Badge variant="outline">{gradeLabels[a.grade_result] ?? a.grade_result}</Badge>
            ) : null}
          </div>
          <div>
            <Button onClick={openProtocol} disabled={busy}>
              Открыть протокол
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}