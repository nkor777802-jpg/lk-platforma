import { useEffect } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { onboardingPlanForPrint } from "@/lib/onboarding.functions";
import { dueFromOffset, itemTypeLabel, sectionLabel } from "@/lib/training-types";
import { brandLogos } from "@/lib/brand";
import { company } from "@/content/site";
import { InlineLoading } from "@/components/states";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/onboarding/print")({
  ssr: false,
  validateSearch: z.object({ programId: z.string().uuid().optional() }),
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
  },
  head: () => ({
    meta: [
      { title: "Адаптационный план — Академия «Людиновокабель»" },
      {
        name: "description",
        content: "Печатная форма программы адаптации сотрудника: мероприятия, сроки и статусы.",
      },
      { property: "og:title", content: "Адаптационный план сотрудника" },
      { property: "og:description", content: "Печатная форма программы адаптации «Я Новичок»." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OnboardingPrintPage,
});

const STATUS_LABELS: Record<string, string> = {
  pending: "К выполнению",
  awaiting_mentor: "Ждёт наставника",
  completed: "Выполнено",
  confirmed: "Подтверждено",
};

const PRINT_CSS = `
@page { size: A4 portrait; margin: 12mm; }
@media print {
  .no-print { display: none !important; }
  .print-sheet { box-shadow: none !important; border: 0 !important; padding: 0 !important; }
  body { background: #fff !important; }
  tr, .avoid-break { break-inside: avoid; }
  thead { display: table-header-group; }
}
`;

function fmt(d: string | null | undefined) {
  return d ? new Date(d).toLocaleDateString("ru-RU") : "—";
}

function OnboardingPrintPage() {
  const { programId } = Route.useSearch();
  const plan = useQuery({
    queryKey: ["onboarding", "print", programId ?? "me"],
    queryFn: () => onboardingPlanForPrint({ data: { programId: programId ?? null } }),
  });

  const ready = plan.isSuccess && !!plan.data?.program;
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => window.print(), 600);
    return () => clearTimeout(t);
  }, [ready]);

  if (plan.isLoading) return <InlineLoading />;

  const program = plan.data?.program;
  const items = plan.data?.items ?? [];

  if (!program) {
    return (
      <div className="mx-auto max-w-3xl p-10 text-center">
        <p className="text-muted-foreground">Программа адаптации не найдена.</p>
      </div>
    );
  }

  const done = items.filter((i) => i.status === "completed" || i.status === "confirmed").length;
  const percent = items.length ? Math.round((done / items.length) * 100) : 0;
  const sections = Array.from(new Set(items.map((i) => i.section)));
  let counter = 0;

  return (
    <div className="min-h-screen bg-muted/40 py-6 print:bg-background print:py-0">
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />

      <div className="no-print mx-auto mb-4 flex max-w-[210mm] items-center justify-between gap-3 px-4">
        <p className="text-sm text-muted-foreground">
          В диалоге печати выберите «Сохранить в PDF».
        </p>
        <Button onClick={() => window.print()}>Печать / PDF</Button>
      </div>

      <div className="print-sheet mx-auto max-w-[210mm] rounded-lg border border-border bg-background p-8 shadow-sm">
        <header className="flex items-start justify-between gap-6 border-b border-border pb-4">
          <div className="flex items-center gap-4">
            <img
              src={brandLogos.fullColor}
              alt={brandLogos.alt}
              className="h-12 w-auto object-contain"
            />
            <div>
              <p className="text-sm font-semibold text-secondary">{company.legalName}</p>
              <p className="text-xs text-muted-foreground">{company.address}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Сформировано {new Date().toLocaleDateString("ru-RU")}
          </p>
        </header>

        <h1 className="mt-6 text-xl font-bold text-secondary">
          Программа адаптации сотрудника «Я Новичок»
        </h1>

        <dl className="mt-4 grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
          <Row label="Сотрудник" value={program.employee_name} />
          <Row label="Табельный номер" value={program.personnel_number ?? "—"} />
          <Row label="Должность" value={program.employee_position ?? "—"} />
          <Row label="Профессия" value={program.profession_name ?? "—"} />
          <Row label="Подразделение" value={program.department_name ?? "—"} />
          <Row label="Разряд" value={program.employee_grade ? String(program.employee_grade) : "—"} />
          <Row label="Наставник" value={program.mentor_name ?? "—"} />
          <Row label="Дата приёма (День 0)" value={fmt(program.hire_date)} />
          <Row label="Шаблон адаптации" value={program.template_name ?? "—"} />
          <Row
            label="Статус программы"
            value={
              program.status === "completed"
                ? `Завершена (${percent}%)`
                : `В процессе — выполнено ${done} из ${items.length} (${percent}%)`
            }
          />
        </dl>

        {sections.map((section) => (
          <section key={section} className="mt-6 avoid-break">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-secondary">
              {sectionLabel(section)}
            </h2>
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-muted/60 text-left">
                  <Th className="w-8">№</Th>
                  <Th>Мероприятие</Th>
                  <Th className="w-24">Тип</Th>
                  <Th className="w-20">День</Th>
                  <Th className="w-24">План. дата</Th>
                  <Th className="w-20">Обяз.</Th>
                  <Th className="w-28">Статус</Th>
                  <Th className="w-24">Выполнено</Th>
                </tr>
              </thead>
              <tbody>
                {items
                  .filter((i) => i.section === section)
                  .map((item) => {
                    counter += 1;
                    const planned =
                      item.due_date ?? dueFromOffset(program.hire_date, item.offset_days ?? 0);
                    return (
                      <tr key={item.id} className="border-b border-border align-top">
                        <Td>{counter}</Td>
                        <Td>
                          <span className="font-medium text-foreground">{item.title}</span>
                          {item.description ? (
                            <span className="block text-muted-foreground">{item.description}</span>
                          ) : null}
                        </Td>
                        <Td>{itemTypeLabel(item.item_type)}</Td>
                        <Td>
                          {item.offset_days ? `День +${item.offset_days}` : "День 0"}
                        </Td>
                        <Td>{fmt(planned)}</Td>
                        <Td>{item.is_required ? "Да" : "Нет"}</Td>
                        <Td>{STATUS_LABELS[item.status] ?? item.status}</Td>
                        <Td>{fmt(item.completed_at)}</Td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </section>
        ))}

        <footer className="mt-10 grid grid-cols-2 gap-10 text-xs text-muted-foreground avoid-break">
          <div>
            <div className="h-8 border-b border-border" />
            <p className="mt-1">Сотрудник — {program.employee_name}</p>
          </div>
          <div>
            <div className="h-8 border-b border-border" />
            <p className="mt-1">Наставник — {program.mentor_name ?? "—"}</p>
          </div>
        </footer>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="text-muted-foreground">{label}:</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={`border-b border-border px-2 py-1 font-semibold ${className ?? ""}`}>{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-2 py-1">{children}</td>;
}