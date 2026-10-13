import { ScholarshipStatus, StudentScholarshipRow, ScholarshipSummaryKPI } from "../_components/types";

export const MONTH_NAMES_RU: string[] = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

export function formatMonthKeyToLabel(monthKey: string): string {
  // Format: "2026-10" -> "Октябрь 2026"
  if (!monthKey || !monthKey.includes("-")) return monthKey;
  const [yearStr, monthNumStr] = monthKey.split("-");
  const monthIdx = parseInt(monthNumStr, 10) - 1;
  const monthName = MONTH_NAMES_RU[monthIdx] || monthNumStr;
  return `${monthName} ${yearStr}`;
}

export function getCurrentMonthKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Parses grade string sequence like "54554" or "5, 4, 5" into an array of integers [5, 4, 5, 5, 4]
 */
export function parseGradeString(raw: string | number | null | undefined): number[] {
  if (raw === null || raw === undefined) return [];
  if (typeof raw === "number") {
    return raw >= 1 && raw <= 5 ? [raw] : [];
  }
  const str = String(raw).trim();
  if (!str) return [];

  // Match all single digits from 1 to 5
  const matches = str.match(/[1-5]/g);
  if (!matches) return [];
  return matches.map((d) => parseInt(d, 10));
}

export function calculateStudentRow(
  studentId: string,
  studentName: string,
  avatar: string | null | undefined,
  rollNumber: string,
  grades: Record<string, string>,
  subjects: string[]
): StudentScholarshipRow {
  let count5 = 0;
  let count4 = 0;
  let count3 = 0;
  let count2 = 0;
  let totalScore = 0;
  let totalGrades = 0;
  const subjectsWith3OrLess: string[] = [];
  const subjectAverages: Record<string, number | null> = {};

  subjects.forEach((subj) => {
    const rawVal = grades[subj];
    const parsedGrades = parseGradeString(rawVal);

    if (parsedGrades.length > 0) {
      let subjSum = 0;
      let hasBadInSubj = false;

      parsedGrades.forEach((g) => {
        totalGrades++;
        totalScore += g;
        subjSum += g;

        if (g === 5) count5++;
        else if (g === 4) count4++;
        else if (g === 3) {
          count3++;
          hasBadInSubj = true;
        } else if (g <= 2) {
          count2++;
          hasBadInSubj = true;
        }
      });

      if (hasBadInSubj) {
        subjectsWith3OrLess.push(subj);
      }

      subjectAverages[subj] = Number((subjSum / parsedGrades.length).toFixed(2));
    } else {
      subjectAverages[subj] = null;
    }
  });

  const averageGrade = totalGrades > 0 ? Number((totalScore / totalGrades).toFixed(2)) : 0;

  let status: ScholarshipStatus = "PENDING";
  let statusReason = "Оценки пока не выставлены";

  if (totalGrades > 0) {
    if (count3 > 0 || count2 > 0) {
      status = "NO_SCHOLARSHIP";
      statusReason = `Снят(а) со стипендии: есть тройка или неуд [${subjectsWith3OrLess.join(", ")}]`;
    } else if (count5 > 0 && count4 === 0) {
      status = "EXCELLENT";
      statusReason = "Отличник (только «5») — повышенная стипендия";
    } else if (count4 > 0 && count3 === 0 && count2 === 0) {
      status = "GOOD";
      statusReason = "Ударник («4» и «5») — обычная стипендия";
    }
  }

  return {
    studentId,
    studentName,
    avatar,
    rollNumber,
    grades,
    subjectAverages,
    count5,
    count4,
    count3,
    count2,
    totalGrades,
    averageGrade,
    status,
    statusReason,
  };
}

export function calculateSummaryKPI(rows: StudentScholarshipRow[]): ScholarshipSummaryKPI {
  const totalStudents = rows.length;
  let gradedStudents = 0;
  let excellentCount = 0;
  let goodCount = 0;
  let noScholarshipCount = 0;
  let pendingCount = 0;
  let totalScoreSum = 0;
  let totalGradesCount = 0;

  rows.forEach((row) => {
    if (row.totalGrades > 0) {
      gradedStudents++;
      totalScoreSum += row.averageGrade;
      totalGradesCount++;

      if (row.status === "EXCELLENT") excellentCount++;
      else if (row.status === "GOOD") goodCount++;
      else if (row.status === "NO_SCHOLARSHIP") noScholarshipCount++;
      else pendingCount++;
    } else {
      pendingCount++;
    }
  });

  const groupAverageGrade =
    totalGradesCount > 0 ? Number((totalScoreSum / totalGradesCount).toFixed(2)) : 0;

  return {
    totalStudents,
    gradedStudents,
    excellentCount,
    goodCount,
    noScholarshipCount,
    pendingCount,
    groupAverageGrade,
  };
}
