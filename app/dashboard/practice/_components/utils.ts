export function calculateWorkingDates(startDateStr: string, totalDays: number): string[] {
  const match = startDateStr.match(/(\d{1,2})[./](\d{1,2})[./](\d{4})/);
  let current = new Date();
  if (match) {
    const d = parseInt(match[1], 10);
    const m = parseInt(match[2], 10) - 1;
    const y = parseInt(match[3], 10);
    current = new Date(y, m, d);
  }

  const result: string[] = [];
  while (result.length < totalDays) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      const dayFormatted = current.getDate().toString().padStart(2, "0");
      const monthFormatted = (current.getMonth() + 1).toString().padStart(2, "0");
      const yearFormatted = current.getFullYear();
      result.push(`${dayFormatted}.${monthFormatted}.${yearFormatted}`);
    }
    current.setDate(current.getDate() + 1);
  }
  return result;
}

export const WEEKDAY_NAMES = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

export function getWeekdayFromDateStr(dateStr: string): string {
  const parts = dateStr.split(".");
  if (parts.length === 3) {
    const d = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    return WEEKDAY_NAMES[d.getDay()] || "";
  }
  return "";
}
