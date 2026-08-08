/**
 * Серверная логика тестирования. Никогда не импортируется клиентом:
 * правильные ответы и активный промпт остаются на сервере.
 */

export interface TestSettings {
  total_questions: number;
  common_questions: number;
  professional_questions: number;
  pass_percent: number;
  time_limit_minutes: number | null;
  allow_retry: boolean;
  max_attempts: number;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  show_correct_answer: boolean;
  lock_answer: boolean;
  retry_interval_hours: number;
  result_rule: "best" | "last";
  warn_before_minutes: number;
  mode: "learning" | "exam";
  grading_rules?: Record<string, unknown> | null;
}

export const DEFAULT_SETTINGS: TestSettings = {
  total_questions: 20,
  common_questions: 5,
  professional_questions: 15,
  pass_percent: 80,
  time_limit_minutes: 30,
  allow_retry: true,
  max_attempts: 3,
  shuffle_questions: true,
  shuffle_options: true,
  show_correct_answer: false,
  lock_answer: true,
  retry_interval_hours: 0,
  result_rule: "best",
  warn_before_minutes: 5,
  mode: "exam",
};

export type GradeResult = "confirmed" | "lowered" | "failed";

/** Итог по разряду: соответствует заявленному / подтверждён более низкий / не пройден. */
export function computeGrade(
  percent: number,
  passPercent: number,
  rules?: Record<string, unknown> | null,
): GradeResult {
  const lower = Number((rules as { lower_percent?: number } | null)?.lower_percent);
  const lowerThreshold = Number.isFinite(lower) ? lower : Math.max(passPercent - 15, 0);
  if (percent >= passPercent) return "confirmed";
  if (percent >= lowerThreshold) return "lowered";
  return "failed";
}

export const GRADE_LABELS: Record<GradeResult, string> = {
  confirmed: "Соответствует заявленному разряду",
  lowered: "Подтверждён более низкий разряд",
  failed: "Разряд не подтверждён",
};

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = copy[i]!;
    copy[i] = copy[j]!;
    copy[j] = a;
  }
  return copy;
}

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export interface ProtocolInput {
  fullName: string;
  personnelNumber: string | null;
  department: string | null;
  profession: string | null;
  grade: string | null;
  date: string;
  attemptNumber: number;
  logoUrl: string;
  mode?: "learning" | "exam";
  gradeResult?: GradeResult | null;
  awaitingReview?: boolean;
  answers: {
    question_text: string;
    selected_text: string | null;
    correct_text: string | null;
    is_correct: boolean | null;
    review_status?: string | null;
  }[];
  practical: { title: string; score: number; maxScore: number; passed: boolean }[];
  correct: number;
  total: number;
  percent: number;
  passed: boolean;
}

export function renderProtocolHtml(p: ProtocolInput): string {
  const rows = p.answers
    .map(
      (a, i) => `<tr>
      <td class="num">${i + 1}</td>
      <td>${escapeHtml(a.question_text)}</td>
      <td>${escapeHtml(a.selected_text ?? "—")}</td>
      <td>${escapeHtml(a.correct_text ?? "—")}</td>
      <td class="${a.review_status === "pending" ? "muted" : a.is_correct ? "ok" : "bad"}">${
        a.review_status === "pending" ? "На проверке" : a.is_correct ? "Верно" : "Ошибка"
      }</td>
    </tr>`,
    )
    .join("");

  const practicalRows = p.practical.length
    ? p.practical
        .map(
          (t) => `<tr><td colspan="2">${escapeHtml(t.title)}</td>
          <td colspan="2">${t.score} / ${t.maxScore}</td>
          <td class="${t.passed ? "ok" : "bad"}">${t.passed ? "Зачтено" : "Не зачтено"}</td></tr>`,
        )
        .join("")
    : `<tr><td colspan="5" class="muted">Практическое задание не выполнялось</td></tr>`;

  return `<!doctype html>
<html lang="ru"><head><meta charset="utf-8">
<title>Протокол аттестации — ${escapeHtml(p.fullName)}</title>
<style>
 body{font-family:"Golos Text","PT Sans",Arial,sans-serif;color:#323232;margin:0;padding:32px;background:#fff}
 .wrap{max-width:980px;margin:0 auto}
 header{display:flex;align-items:center;gap:20px;border-bottom:4px solid #E3661D;padding-bottom:16px}
 header img{height:56px}
 h1{font-size:22px;color:#112866;margin:0}
 .meta{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px 24px;margin:24px 0}
 .meta div{font-size:14px}
 .meta span{color:#4D4D4D}
 table{width:100%;border-collapse:collapse;margin-top:16px;font-size:13px}
 th{background:#112866;color:#fff;text-align:left;padding:8px}
 td{border-bottom:1px solid #e3e6ee;padding:8px;vertical-align:top}
 .num{width:36px;color:#4D4D4D}
 .ok{color:#1A7E8C;font-weight:600}
 .bad{color:#c0392b;font-weight:600}
 .muted{color:#4D4D4D}
 .summary{margin-top:24px;padding:16px 20px;border-radius:10px;background:#F2F4F7}
 .verdict{margin-top:12px;font-size:20px;font-weight:700;color:${p.passed ? "#1A7E8C" : "#c0392b"}}
 footer{margin-top:32px;font-size:12px;color:#4D4D4D}
</style></head>
<body><div class="wrap">
<header><img src="${escapeHtml(p.logoUrl)}" alt="Людиновокабель"><h1>Протокол проверки знаний</h1></header>
<div class="meta">
  <div><span>ФИО:</span> <b>${escapeHtml(p.fullName)}</b></div>
  <div><span>Табельный номер:</span> <b>${escapeHtml(p.personnelNumber ?? "—")}</b></div>
  <div><span>Подразделение:</span> <b>${escapeHtml(p.department ?? "—")}</b></div>
  <div><span>Профессия:</span> <b>${escapeHtml(p.profession ?? "—")}</b></div>
  <div><span>Разряд:</span> <b>${escapeHtml(p.grade ?? "—")}</b></div>
  <div><span>Дата и время:</span> <b>${escapeHtml(p.date)}</b></div>
  <div><span>Попытка:</span> <b>№${p.attemptNumber}</b></div>
  <div><span>Режим:</span> <b>${p.mode === "learning" ? "Учебный" : "Аттестационный"}</b></div>
</div>
<table><thead><tr><th>№</th><th>Вопрос</th><th>Ответ сотрудника</th><th>Правильный ответ</th><th>Результат</th></tr></thead>
<tbody>${rows}</tbody></table>
<h2 style="font-size:16px;color:#112866;margin-top:28px">Практическое задание</h2>
<table><tbody>${practicalRows}</tbody></table>
<div class="summary">
  <div>Всего вопросов: <b>${p.total}</b></div>
  <div>Правильных ответов: <b>${p.correct}</b></div>
  <div>Ошибок: <b>${p.total - p.correct}</b></div>
  <div>Результат: <b>${p.percent.toFixed(1)}%</b></div>
  ${p.gradeResult ? `<div>Итог по разряду: <b>${escapeHtml(GRADE_LABELS[p.gradeResult])}</b></div>` : ""}
  ${p.awaitingReview ? `<div class="muted">Часть развернутых ответов ожидает проверки преподавателем.</div>` : ""}
  <div class="verdict">${p.passed ? "АТТЕСТОВАН" : "НЕ АТТЕСТОВАН"}</div>
</div>
<footer>Документ сформирован автоматически корпоративной платформой обучения «Людиновокабель».</footer>
</div></body></html>`;
}