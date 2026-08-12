import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CheckCircle2, Clock, FileDown, MessageSquare } from "lucide-react";
import { myOnboardingQuery } from "@/lib/onboarding-queries";
import { completeOnboardingItem, submitOnboardingFeedback } from "@/lib/onboarding.functions";
import { itemTypeLabel, sectionLabel } from "@/lib/training-types";
import { EmptyState, InlineLoading } from "@/components/states";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Я Новичок — Академия «Людиновокабель»" },
      {
        name: "description",
        content: "Программа адаптации нового сотрудника: задачи по дням, наставник и обратная связь.",
      },
      { property: "og:title", content: "Я Новичок — адаптация сотрудника" },
      { property: "og:description", content: "Пошаговая программа адаптации с наставником." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OnboardingPage,
});

const STATUS_LABELS: Record<string, string> = {
  pending: "К выполнению",
  awaiting_mentor: "Ждёт наставника",
  completed: "Выполнено",
  confirmed: "Подтверждено",
};

function OnboardingPage() {
  const qc = useQueryClient();
  const onboarding = useQuery(myOnboardingQuery);
  const complete = useServerFn(completeOnboardingItem);
  const feedback = useServerFn(submitOnboardingFeedback);
  const [message, setMessage] = useState("");

  const completeMutation = useMutation({
    mutationFn: (itemId: string) => complete({ data: { itemId } }),
    onSuccess: (res) => {
      toast.success(res.finished ? "Адаптация завершена!" : "Отмечено выполненным");
      void qc.invalidateQueries({ queryKey: ["onboarding"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const feedbackMutation = useMutation({
    mutationFn: (text: string) =>
      feedback({ data: { programId: onboarding.data?.program?.id ?? null, message: text } }),
    onSuccess: () => {
      toast.success("Спасибо! Отдел персонала получил ваш отзыв");
      setMessage("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (onboarding.isLoading) return <InlineLoading />;

  const program = onboarding.data?.program;
  const items = onboarding.data?.items ?? [];

  if (!program) {
    return (
      <EmptyState
        title="Программа адаптации не назначена"
        description="Программу «Я Новичок» назначает отдел персонала при приёме на работу."
      />
    );
  }

  const done = items.filter((i) => i.status === "completed" || i.status === "confirmed").length;
  const percent = items.length ? Math.round((done / items.length) * 100) : 0;
  const sections = Array.from(new Set(items.map((i) => i.section)));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-secondary sm:text-3xl">Я Новичок</h1>
          <p className="mt-2 text-muted-foreground">
            {program.template_name} · дата приёма{" "}
            {new Date(program.hire_date).toLocaleDateString("ru-RU")}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/onboarding/print" target="_blank" rel="noreferrer">
            <FileDown className="mr-2 h-4 w-4" />
            Скачать план (PDF)
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Прогресс адаптации</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Progress value={percent} />
          <p className="text-sm text-muted-foreground">
            Выполнено {done} из {items.length} пунктов ·{" "}
            {program.status === "completed" ? "Адаптация завершена" : "Адаптация продолжается"}
          </p>
        </CardContent>
      </Card>

      {sections.map((section) => (
        <div key={section}>
          <h2 className="mb-3 text-xl font-semibold text-secondary">{sectionLabel(section)}</h2>
          <div className="space-y-3">
            {items
              .filter((i) => i.section === section)
              .map((item) => {
                const finished = item.status === "completed" || item.status === "confirmed";
                return (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-border bg-card p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-foreground">{item.title}</p>
                        <Badge variant="secondary">{itemTypeLabel(item.item_type)}</Badge>
                        {item.is_required ? <Badge variant="outline">Обязательно</Badge> : null}
                      </div>
                      {item.description ? (
                        <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                      ) : null}
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        День {item.offset_days}
                        {item.due_date
                          ? ` · до ${new Date(item.due_date).toLocaleDateString("ru-RU")}`
                          : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={finished ? "default" : "secondary"}>
                        {STATUS_LABELS[item.status] ?? item.status}
                      </Badge>
                      {item.link_url ? (
                        <Button asChild size="sm" variant="outline">
                          <a href={item.link_url} target="_blank" rel="noreferrer">
                            Открыть
                          </a>
                        </Button>
                      ) : null}
                      {!finished && item.status !== "awaiting_mentor" ? (
                        <Button
                          size="sm"
                          onClick={() => completeMutation.mutate(item.id)}
                          disabled={completeMutation.isPending}
                        >
                          <CheckCircle2 className="mr-1 h-4 w-4" />
                          Выполнено
                        </Button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      ))}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" /> Обратная связь по адаптации
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Что было понятно, а что вызвало сложности?"
            rows={4}
          />
          <Button
            onClick={() => feedbackMutation.mutate(message)}
            disabled={message.trim().length < 3 || feedbackMutation.isPending}
          >
            Отправить
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
