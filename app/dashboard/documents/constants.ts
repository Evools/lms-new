export const ALLOWED_CATEGORIES = [
  "Методички",
  "Положения",
  "Инструкции",
  "Шаблоны",
  "Приказы",
  "Расписание",
  "Прочее",
] as const;

export type DocumentCategory = (typeof ALLOWED_CATEGORIES)[number];
