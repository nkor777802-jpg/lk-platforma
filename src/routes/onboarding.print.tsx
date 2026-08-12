import { useEffect, useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { onboardingPlanForPrint } from "@/lib/onboarding.functions";
import { dueFromOffset, itemTypeLabel, sectionLabel } from "@/lib/training-types";
import { brandLogos } from "@/lib/brand";
import { company, stages } from "@/content/site";
import { StageList } from "@/components/StageList";
import { InlineLoading } from "@/components/states";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
.print-doc { hyphens: auto; overflow-wrap: anywhere; }
@media print {
  .no-print { display: none !important; }
  .print-sheet { box-shadow: none !important; border: 0 !important; padding: 0 !important; }
  body { background: #fff !important; }
  tr, .avoid-break { break-inside: avoid; }
  thead { display: table-header-group; }
}
`;

const SETTINGS_KEY = "onboarding-print-settings";
type Orientation = "portrait" | "landscape";

function fmt(d: string | null | undefined) {
  return d ? new Date(d).toLocaleDateString("ru-RU") : "—";
}

function OnboardingPrintPage() {
  const { programId } = Route.useSearch();
  const [orientation, setOrientation] = useState<Orientation>("portrait");
  const [margin, setMargin] = useState("12");
  const [settingsReady, setSettingsReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { orientation?: Orientation; margin?: string };
        if (saved.orientation === "portrait" || saved.orientation === "landscape") {
          setOrientation(saved.orientation);
        }
        if (saved.margin) setMargin(saved.margin);
      }
    } catch {
      /* ignore */
    }
    setSettingsReady(true);
  }, []);

  useEffect(() => {
    if (!settingsReady) return;
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ orientation, margin }));
    } catch {
      /* ignore */
    }
  }, [settingsReady, orientation, margin]);

  const plan = useQuery({
    queryKey: ["onboarding", "print", programId ?? "me"],
    queryFn: () => onboardingPlanForPrint({ data: { programId: programId ?? null } }),
  });

  const ready = plan.isSuccess && !!plan.data?.program;
  useEffect(() => {
    if (!ready || !settingsReady) return;
    const t = setTimeout(() => window.print(), 600);
    return () => clearTimeout(t);
  }, [ready, settingsReady]);

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
  const sheetWidth = orientation === "landscape" ? "297mm" : "210mm";

  return (
    <div lang="ru" className="print-doc min-h-screen bg-muted/40 py-4 print:bg-background print:py-0 sm:py-6">
      <style
        dangerouslySetInnerHTML={{
          __html: `@page { size: A4 ${orientation}; margin: ${margin}mm; }` + PRINT_CSS,
        }}
      />

      <div
        className="no-print mx-auto mb-4 flex w-full flex-col gap-3 px-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between"
        style={{ maxWidth: sheetWidth }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            Ориентация
            <Select value={orientation} onValueChange={(v) => setOrientation(v as Orientation)}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="portrait">Книжная (A4)</SelectItem>
                <SelectItem value="landscape">Альбомная (A4)</SelectItem>
              </SelectContent>
            </Select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            Поля
            <Select value={margin} onValueChange={setMargin}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="8">Узкие (8 мм)</SelectItem>
                <SelectItem value="12">Обычные (12 мм)</SelectItem>
                <SelectItem value="20">Широкие (20 мм)</SelectItem>
              </SelectContent>
            </Select>
          </label>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <p className="text-xs text-muted-foreground sm:text-sm">
            В диалоге печати выберите «Сохранить в PDF».
          </p>
          <Button className="w-full sm:w-auto" onClick={() => window.print()}>
            Печать / PDF
          </Button>
        </div>
      </div>

      <div
        className="print-sheet mx-auto w-full rounded-lg border border-border bg-background shadow-sm"
        style={{ maxWidth: sheetWidth, padding: `${margin}mm` }}
      >
        <header className="flex flex-col items-start justify-between gap-3 border-b border-border pb-4 sm:flex-row sm:items-start sm:gap-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <img
              src={brandLogos.fullColor}
              alt={brandLogos.alt}
              className="h-10 w-auto shrink-0 object-contain sm:h-12"
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-secondary">{company.legalName}</p>
              <p className="text-xs text-muted-foreground">{company.address}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Сформировано {new Date().toLocaleDateString("ru-RU")}
          </p>
        </header>

        <h1 className="mt-5 text-lg font-bold text-secondary sm:mt-6 sm:text-xl">
          Программа адаптации сотрудника «Я Новичок»
        </h1>

        <dl className="mt-4 grid grid-cols-1 gap-x-8 gap-y-2 text-xs sm:grid-cols-2 sm:text-sm print:grid-cols-2">
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
            <table className="hidden w-full table-fixed border-collapse text-xs sm:table print:table">
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

            <ul className="space-y-2 sm:hidden print:hidden">
              {items
                .filter((i) => i.section === section)
                .map((item) => {
                  const planned =
                    item.due_date ?? dueFromOffset(program.hire_date, item.offset_days ?? 0);
                  return (
                    <li key={item.id} className="rounded-md border border-border p-3 text-xs">
                      <p className="font-medium text-foreground">{item.title}</p>
                      {item.description ? (
                        <p className="mt-1 text-muted-foreground">{item.description}</p>
                      ) : null}
                      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-muted-foreground">
                        <span>{item.offset_days ? `День +${item.offset_days}` : "День 0"}</span>
                        <span>План: {fmt(planned)}</span>
                        <span>{itemTypeLabel(item.item_type)}</span>
                        <span>{item.is_required ? "Обязательно" : "По желанию"}</span>
                        <span>{STATUS_LABELS[item.status] ?? item.status}</span>
                        <span>Вып.: {fmt(item.completed_at)}</span>
                      </dl>
                    </li>
                  );
                })}
            </ul>
          </section>
        ))}

        <section className="mt-8 avoid-break">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-secondary">
            Этапы обучения на платформе
          </h2>
          <StageList items={stages} />
        </section>

        <footer className="mt-10 grid grid-cols-1 gap-6 text-xs text-muted-foreground avoid-break sm:grid-cols-2 sm:gap-10 print:grid-cols-2">
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
  return <td className="break-words px-2 py-1 align-top">{children}</td>;
}