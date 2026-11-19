export const LEVEL_THRESHOLDS: { level: number; minXp: number; title: string }[] = [
  { level: 1, minXp: 0, title: "Новичок" },
  { level: 2, minXp: 200, title: "Абитуриент" },
  { level: 3, minXp: 450, title: "Первокурсник" },
  { level: 4, minXp: 750, title: "Стажёр" },
  { level: 5, minXp: 1100, title: "Практикант" },
  { level: 6, minXp: 1500, title: "Кодер" },
  { level: 7, minXp: 1950, title: "Джуниор" },
  { level: 8, minXp: 2450, title: "Разработчик" },
  { level: 9, minXp: 3000, title: "Инженер" },
  { level: 10, minXp: 3600, title: "Мидл-лицеист" },
  { level: 11, minXp: 4250, title: "Уверенный мидл" },
  { level: 12, minXp: 4950, title: "Наставник" },
  { level: 13, minXp: 5700, title: "Профи" },
  { level: 14, minXp: 6500, title: "Эксперт" },
  { level: 15, minXp: 7350, title: "Сеньор" },
  { level: 16, minXp: 8250, title: "Архитектор" },
  { level: 17, minXp: 9200, title: "Техлид" },
  { level: 18, minXp: 10200, title: "Тимлид" },
  { level: 19, minXp: 11300, title: "Мастер кода" },
  { level: 20, minXp: 12500, title: "Легенда лицея" },
];

export interface LevelInfo {
  level: number;
  title: string;
  floorXp: number;
  nextXp: number;
  progress: number;
}

export function getLevelInfo(xp: number): LevelInfo {
  const safeXp = Math.max(0, Math.floor(xp));
  const last = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  if (safeXp >= last.minXp) {
    const step = 1200;
    const extra = Math.floor((safeXp - last.minXp) / step);
    const level = last.level + extra;
    const floorXp = last.minXp + extra * step;
    const nextXp = floorXp + step;
    const progress = Math.min(100, Math.max(0, Math.round(((safeXp - floorXp) / step) * 100)));
    return { level, title: last.title, floorXp, nextXp, progress };
  }

  let current = LEVEL_THRESHOLDS[0];
  for (const item of LEVEL_THRESHOLDS) {
    if (safeXp >= item.minXp) current = item;
    else break;
  }
  const next = LEVEL_THRESHOLDS.find((item) => item.level === current.level + 1)!;
  const span = next.minXp - current.minXp;
  const progress = Math.min(100, Math.max(0, Math.round(((safeXp - current.minXp) / span) * 100)));
  return {
    level: current.level,
    title: current.title,
    floorXp: current.minXp,
    nextXp: next.minXp,
    progress,
  };
}

export type QuestPeriod = "weekly" | "monthly";

export interface QuestDefinition {
  id: string;
  period: QuestPeriod;
  title: string;
  desc: string;
  target: number;
  rewardXp: number;
}

export const QUEST_DEFINITIONS: QuestDefinition[] = [
  {
    id: "w-assignments-2",
    period: "weekly",
    title: "Сдать 2 ДЗ за неделю",
    desc: "Принятые задания на этой неделе",
    target: 2,
    rewardXp: 120,
  },
  {
    id: "w-test-85",
    period: "weekly",
    title: "Пройти тест на 85%+",
    desc: "Результат от 85% за неделю",
    target: 1,
    rewardXp: 90,
  },
  {
    id: "w-present-5",
    period: "weekly",
    title: "5 пар без пропусков",
    desc: "Отметки «Присутствовал» за неделю",
    target: 5,
    rewardXp: 80,
  },
  {
    id: "m-assignments-8",
    period: "monthly",
    title: "Закрыть 8 ДЗ за месяц",
    desc: "Принятые задания в этом месяце",
    target: 8,
    rewardXp: 300,
  },
  {
    id: "m-present-20",
    period: "monthly",
    title: "20 пар без пропусков",
    desc: "Посещаемость за текущий месяц",
    target: 20,
    rewardXp: 350,
  },
  {
    id: "m-tests-3",
    period: "monthly",
    title: "Пройти 3 теста за месяц",
    desc: "Успешно завершённые тесты (60%+)",
    target: 3,
    rewardXp: 250,
  },
];

export function getCurrentPeriodBounds(now = new Date()) {
  const weekStart = new Date(now);
  const day = weekStart.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  weekStart.setDate(weekStart.getDate() + diffToMonday);
  weekStart.setHours(0, 0, 0, 0);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

  const y = weekStart.getFullYear();
  const m = String(weekStart.getMonth() + 1).padStart(2, "0");
  const d = String(weekStart.getDate()).padStart(2, "0");
  const weekKey = `W-${y}-${m}-${d}`;
  const monthKey = `M-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  return { weekStart, monthStart, weekKey, monthKey };
}
