/** Справочники типов обучения, адаптации и компетенций. */

export const TRAINING_TYPES = {
  onboarding: "Адаптация (Я Новичок)",
  initial_profession: "Первоначальное обучение профессии",
  grade_upgrade: "Повышение квалификации (разряд)",
  new_profession: "Обучение новой профессии",
  skill: "Обучение навыку",
  mandatory: "Обязательное обучение",
} as const;

export type TrainingType = keyof typeof TRAINING_TYPES;

export const TRAINING_TYPE_OPTIONS = Object.entries(TRAINING_TYPES).map(([value, label]) => ({
  value,
  label,
}));

export function trainingTypeLabel(value: string | null | undefined) {
  return (TRAINING_TYPES as Record<string, string>)[value ?? ""] ?? "Обучение";
}

export const MATERIAL_SCOPES = {
  onboarding: "Адаптация",
  professional: "Профессиональное",
  mandatory: "Обязательное",
  general: "Общее",
} as const;

export const MATERIAL_SCOPE_OPTIONS = Object.entries(MATERIAL_SCOPES).map(([value, label]) => ({
  value,
  label,
}));

export const TEST_SCOPES = {
  onboarding: "Адаптационный",
  professional: "Профессиональный",
  mandatory: "Обязательный",
  certification: "Аттестационный",
} as const;

export const TEST_SCOPE_OPTIONS = Object.entries(TEST_SCOPES).map(([value, label]) => ({
  value,
  label,
}));

export const COMPETENCY_STATUSES = {
  not_started: "Не начато",
  in_progress: "В обучении",
  tested: "Теория сдана",
  practice: "Практика пройдена",
  confirmed: "Подтверждено",
} as const;

export type CompetencyStatus = keyof typeof COMPETENCY_STATUSES;

export const COMPETENCY_STATUS_OPTIONS = Object.entries(COMPETENCY_STATUSES).map(
  ([value, label]) => ({ value, label }),
);

export const ONBOARDING_SECTIONS = {
  company: "О предприятии",
  safety: "Охрана труда и безопасность",
  workplace: "Рабочее место",
  mentor: "Работа с наставником",
  profession: "Профессия",
  feedback: "Обратная связь",
} as const;

export const ONBOARDING_SECTION_OPTIONS = Object.entries(ONBOARDING_SECTIONS).map(
  ([value, label]) => ({ value, label }),
);

export const ONBOARDING_ITEM_TYPES = {
  info: "Информация",
  material: "Материал",
  video: "Видео",
  course: "Курс",
  test: "Тест",
  meeting: "Встреча",
  task: "Задание",
  simulator: "Тренажёр",
} as const;

export const ONBOARDING_ITEM_TYPE_OPTIONS = Object.entries(ONBOARDING_ITEM_TYPES).map(
  ([value, label]) => ({ value, label }),
);

export function sectionLabel(value: string | null | undefined) {
  return (ONBOARDING_SECTIONS as Record<string, string>)[value ?? ""] ?? "Прочее";
}

export function itemTypeLabel(value: string | null | undefined) {
  return (ONBOARDING_ITEM_TYPES as Record<string, string>)[value ?? ""] ?? "Задача";
}

export function competencyStatusLabel(value: string | null | undefined) {
  return (COMPETENCY_STATUSES as Record<string, string>)[value ?? ""] ?? "Не начато";
}

/** Дата пункта адаптации = дата приёма + смещение в днях. */
export function dueFromOffset(hireDate: string, offsetDays: number): string {
  const d = new Date(`${hireDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}
