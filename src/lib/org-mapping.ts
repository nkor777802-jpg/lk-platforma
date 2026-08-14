export interface ClientMapping {
  sheetName?: string | null;
  headerRows: number;
  unitColumns: number[];
  codeColumn: number | null;
  positionColumn: number;
  categoryColumn: number | null;
  fullNameColumn: number | null;
  hireDateColumn: number | null;
  gradeColumn: number | null;
  plannedColumn: number | null;
  actualColumn: number | null;
  vacantColumn: number | null;
}

export const MAPPING_FIELDS_CLIENT: { key: keyof ClientMapping; label: string }[] = [
  { key: "codeColumn", label: "Код подразделения" },
  { key: "positionColumn", label: "Должность (профессия)" },
  { key: "categoryColumn", label: "Категория персонала" },
  { key: "fullNameColumn", label: "ФИО" },
  { key: "hireDateColumn", label: "Дата приёма" },
  { key: "gradeColumn", label: "Разряд" },
  { key: "plannedColumn", label: "Количество: штат" },
  { key: "actualColumn", label: "Количество: факт" },
  { key: "vacantColumn", label: "Количество: вакансии" },
];
