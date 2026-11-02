"use client";

import React, { useState, useMemo } from "react";
import { StudentCardDTO, StudentDiaryMonthItem } from "../../actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Calendar,
  Award,
  Printer,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  FileSpreadsheet,
  GraduationCap,
  Sparkles,
  Info,
  Clock,
  Layers,
} from "lucide-react";

interface StudentDiaryTabProps {
  student: StudentCardDTO;
}

export function StudentDiaryTab({ student }: StudentDiaryTabProps) {
  const diary = student.diary;
  const availableMonths = diary?.months || [];

  // Default to latest month, or "ALL" if no months
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(() => {
    return availableMonths[0]?.monthKey || "ALL";
  });

  // Current active month object (if single month selected)
  const currentMonthData: StudentDiaryMonthItem | null = useMemo(() => {
    if (selectedMonthKey === "ALL") return null;
    return availableMonths.find((m) => m.monthKey === selectedMonthKey) || availableMonths[0] || null;
  }, [availableMonths, selectedMonthKey]);

  // Derived KPIs depending on whether single month or all months selected
  const activeKPIs = useMemo(() => {
    if (currentMonthData) {
      const total = currentMonthData.totalGrades;
      const goodAndExcellent = currentMonthData.count5 + currentMonthData.count4;
      const qualityPercent = total > 0 ? Math.round((goodAndExcellent / total) * 100) : 0;
      const passPercent = total > 0 ? Math.round(((total - currentMonthData.count2) / total) * 100) : 100;

      return {
        label: currentMonthData.monthLabel,
        averageGrade: currentMonthData.averageGrade,
        status: currentMonthData.status,
        statusLabel: currentMonthData.statusLabel,
        statusReason: currentMonthData.statusReason,
        count5: currentMonthData.count5,
        count4: currentMonthData.count4,
        count3: currentMonthData.count3,
        count2: currentMonthData.count2,
        totalGrades: total,
        qualityPercent,
        passPercent,
      };
    }

    // "ALL" months summary
    const total = diary?.totalGradesCount || 0;
    const count5 = diary?.count5 || 0;
    const count4 = diary?.count4 || 0;
    const count3 = diary?.count3 || 0;
    const count2 = diary?.count2 || 0;
    const qualityPercent = total > 0 ? Math.round(((count5 + count4) / total) * 100) : 0;
    const passPercent = total > 0 ? Math.round(((total - count2) / total) * 100) : 100;

    let allStatus: "EXCELLENT" | "GOOD" | "NO_SCHOLARSHIP" | "PENDING" = "PENDING";
    let allLabel = "Сводная успеваемость за все периоды";
    if (total > 0) {
      if (count3 > 0 || count2 > 0) {
        allStatus = "NO_SCHOLARSHIP";
        allLabel = "Есть оценки ниже «4» за учебный период";
      } else if (count5 > 0 && count4 === 0) {
        allStatus = "EXCELLENT";
        allLabel = "Отличник (только «5» по всем предметам)";
      } else if (count4 > 0) {
        allStatus = "GOOD";
        allLabel = "Ударник («4» и «5»)";
      }
    }

    return {
      label: "Все периоды (Сводный табель)",
      averageGrade: diary?.cumulativeAverage || 0,
      status: allStatus,
      statusLabel: allLabel,
      statusReason: `Всего зафиксировано ${total} оценок по ${diary?.allSubjects?.length || 0} дисциплинам`,
      count5,
      count4,
      count3,
      count2,
      totalGrades: total,
      qualityPercent,
      passPercent,
    };
  }, [currentMonthData, diary]);

  // Cross-month matrix map: subject -> monthKey -> StudentDiarySubjectGrade
  const crossMonthMatrix = useMemo(() => {
    if (!diary?.allSubjects || diary.allSubjects.length === 0) return [];

    return diary.allSubjects.map((subjectName) => {
      let totalSum = 0;
      let totalCount = 0;
      const monthGrades: Record<string, { grades: number[]; avg: number | null }> = {};

      availableMonths.forEach((m) => {
        const foundSubj = m.subjects.find((s) => s.subjectName === subjectName);
        if (foundSubj && foundSubj.grades.length > 0) {
          monthGrades[m.monthKey] = {
            grades: foundSubj.grades,
            avg: foundSubj.averageGrade,
          };
          foundSubj.grades.forEach((g) => {
            totalSum += g;
            totalCount++;
          });
        } else {
          monthGrades[m.monthKey] = { grades: [], avg: null };
        }
      });

      const overallAvg = totalCount > 0 ? Number((totalSum / totalCount).toFixed(2)) : null;

      return {
        subjectName,
        monthGrades,
        totalGradesCount: totalCount,
        overallAverage: overallAvg,
      };
    });
  }, [diary, availableMonths]);

  // Color helper for single grade pill
  const getGradeBadgeClass = (grade: number) => {
    switch (grade) {
      case 5:
        return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30";
      case 4:
        return "bg-primary/15 text-primary border-primary/30";
      case 3:
        return "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30";
      default:
        return "bg-destructive/15 text-destructive border-destructive/30";
    }
  };

  const getQualitativeVerdict = (avg: number | null) => {
    if (avg === null) return "—";
    if (avg >= 4.75) return "Отлично";
    if (avg >= 3.75) return "Хорошо";
    if (avg >= 2.75) return "Удовл.";
    return "Неуд.";
  };

  return (
    <div className="space-y-3 text-xs">
      {/* PRINT STYLES FOR OFFICIAL STUDENT GRADE REPORT */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 12mm 10mm 12mm;
          }
          aside,
          header,
          nav,
          [data-sidebar="sidebar"],
          [data-slot="sidebar"],
          .screen-only-view,
          button,
          .no-print {
            display: none !important;
          }
          body,
          main,
          #root {
            background: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
          }
          .diary-printable-sheet {
            display: block !important;
            width: 100% !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
            color: #000000 !important;
            background: #ffffff !important;
          }
        }
        @media screen {
          .diary-printable-sheet {
            display: none;
          }
        }
      `}</style>

      {/* SCREEN VIEW */}
      <div className="screen-only-view space-y-3">
        {/* Top Control Bar: Period Pills & Print Button */}
        <div className="bg-card border rounded-xl p-3 space-y-2.5 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <BookOpen className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  Онлайн-дневник успеваемости
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  Оценки по дисциплинам из ежемесячных ведомостей успеваемости и стипендии
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                size="xs"
                variant="outline"
                onClick={() => window.print()}
                className="h-7 px-2.5 gap-1.5 text-xs font-medium border-border hover:bg-muted"
                title="Распечатать табель успеваемости (Ctrl+P)"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Печать табеля</span>
              </Button>
            </div>
          </div>

          {/* Month Navigation Pills */}
          {availableMonths.length > 0 && (
            <div className="flex items-center gap-1 overflow-x-auto pt-2 border-t no-scrollbar">
              <span className="text-[11px] text-muted-foreground font-semibold shrink-0 mr-1 flex items-center gap-1">
                <Calendar className="h-3 w-3 text-primary" />
                Период:
              </span>

              {availableMonths.map((m) => {
                const isActive = selectedMonthKey === m.monthKey;
                return (
                  <button
                    key={m.monthKey}
                    type="button"
                    onClick={() => setSelectedMonthKey(m.monthKey)}
                    className={`h-6 px-2.5 rounded-md text-[11px] font-medium transition-colors shrink-0 flex items-center gap-1.5 border ${
                      isActive
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-border hover:text-foreground hover:bg-muted/40"
                    }`}
                  >
                    <span>{m.monthLabel}</span>
                    {m.averageGrade > 0 && (
                      <span
                        className={`text-[10px] px-1 py-0.2 rounded font-mono ${
                          isActive
                            ? "bg-primary-foreground/20 text-primary-foreground"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        {m.averageGrade.toFixed(2)}
                      </span>
                    )}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setSelectedMonthKey("ALL")}
                className={`h-6 px-2.5 rounded-md text-[11px] font-medium transition-colors shrink-0 flex items-center gap-1.5 border ${
                  selectedMonthKey === "ALL"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:text-foreground hover:bg-muted/40"
                }`}
              >
                <Layers className="h-3 w-3" />
                <span>Сводный табель (все)</span>
              </button>
            </div>
          )}
        </div>

        {/* Empty state if no scholarship records for this group */}
        {availableMonths.length === 0 ? (
          <div className="p-8 rounded-xl border bg-card text-center space-y-3">
            <div className="h-10 w-10 mx-auto rounded-full bg-muted/60 border border-border flex items-center justify-center text-muted-foreground">
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-sm font-bold text-foreground">
                Оценок в электронном дневнике пока нет
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Оценки появятся здесь автоматически, как только куратор или преподаватель заполнит ведомость успеваемости и стипендии по группе в разделе <strong>«Стипендия»</strong>.
              </p>
            </div>
            <div className="pt-2 text-[11px] text-muted-foreground flex items-center justify-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-primary" />
              <span>Группа учащегося: <strong>{student.groupName}</strong></span>
            </div>
          </div>
        ) : (
          <>
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {/* Card 1: Средний балл */}
              <div className="p-3 rounded-xl border bg-card space-y-1.5">
                <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                  <span className="font-semibold flex items-center gap-1">
                    <TrendingUp className="h-3.5 w-3.5 text-primary" />
                    Средний балл
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">
                    {activeKPIs.label}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-foreground">
                    {activeKPIs.averageGrade > 0 ? activeKPIs.averageGrade.toFixed(2) : "—"}
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0.2 font-medium ${
                      activeKPIs.averageGrade >= 4.5
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                        : activeKPIs.averageGrade >= 3.5
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : activeKPIs.averageGrade >= 2.5
                        ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                        : "border-destructive/30 bg-destructive/10 text-destructive"
                    }`}
                  >
                    {getQualitativeVerdict(activeKPIs.averageGrade > 0 ? activeKPIs.averageGrade : null)}
                  </Badge>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300 rounded-full"
                    style={{
                      width: `${Math.min(100, Math.max(0, (activeKPIs.averageGrade / 5) * 100))}%`,
                    }}
                  />
                </div>
              </div>

              {/* Card 2: Статус стипендии */}
              <div className="p-3 rounded-xl border bg-card space-y-1.5">
                <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                  <span className="font-semibold flex items-center gap-1">
                    <Award className="h-3.5 w-3.5 text-primary" />
                    Статус стипендии
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0.2 font-medium ${
                      activeKPIs.status === "EXCELLENT"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                        : activeKPIs.status === "GOOD"
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : activeKPIs.status === "NO_SCHOLARSHIP"
                        ? "border-destructive/30 bg-destructive/10 text-destructive"
                        : "border-border bg-muted text-muted-foreground"
                    }`}
                  >
                    {activeKPIs.status === "EXCELLENT"
                      ? "Повышенная (5)"
                      : activeKPIs.status === "GOOD"
                      ? "Обычная (4 и 5)"
                      : activeKPIs.status === "NO_SCHOLARSHIP"
                      ? "Без стипендии"
                      : "Не выставлено"}
                  </Badge>
                </div>
                <div className="text-xs font-semibold text-foreground truncate">
                  {activeKPIs.statusLabel}
                </div>
                <div className="text-[10px] text-muted-foreground truncate" title={activeKPIs.statusReason}>
                  {activeKPIs.statusReason}
                </div>
              </div>

              {/* Card 3: Распределение оценок (5, 4, 3, 2) */}
              <div className="p-3 rounded-xl border bg-card space-y-1.5">
                <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                  <span className="font-semibold flex items-center gap-1">
                    <GraduationCap className="h-3.5 w-3.5 text-primary" />
                    Оценки (всего: {activeKPIs.totalGrades})
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1 text-center font-mono text-xs">
                  <div
                    className="p-1 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    title="Пятёрки (Отлично)"
                  >
                    <div className="text-[10px] text-muted-foreground">«5»</div>
                    <div className="font-bold">{activeKPIs.count5}</div>
                  </div>
                  <div
                    className="p-1 rounded border border-primary/30 bg-primary/10 text-primary"
                    title="Четвёрки (Хорошо)"
                  >
                    <div className="text-[10px] text-muted-foreground">«4»</div>
                    <div className="font-bold">{activeKPIs.count4}</div>
                  </div>
                  <div
                    className="p-1 rounded border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                    title="Тройки (Удовл.)"
                  >
                    <div className="text-[10px] text-muted-foreground">«3»</div>
                    <div className="font-bold">{activeKPIs.count3}</div>
                  </div>
                  <div
                    className="p-1 rounded border border-destructive/30 bg-destructive/10 text-destructive"
                    title="Двойки (Неуд.)"
                  >
                    <div className="text-[10px] text-muted-foreground">«2»</div>
                    <div className="font-bold">{activeKPIs.count2}</div>
                  </div>
                </div>
                {/* Visual bar of grades proportion */}
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden flex">
                  {activeKPIs.totalGrades > 0 ? (
                    <>
                      <div
                        style={{ width: `${(activeKPIs.count5 / activeKPIs.totalGrades) * 100}%` }}
                        className="bg-emerald-500 h-full"
                        title={`5-ки: ${activeKPIs.count5}`}
                      />
                      <div
                        style={{ width: `${(activeKPIs.count4 / activeKPIs.totalGrades) * 100}%` }}
                        className="bg-primary h-full"
                        title={`4-ки: ${activeKPIs.count4}`}
                      />
                      <div
                        style={{ width: `${(activeKPIs.count3 / activeKPIs.totalGrades) * 100}%` }}
                        className="bg-amber-500 h-full"
                        title={`3-ки: ${activeKPIs.count3}`}
                      />
                      <div
                        style={{ width: `${(activeKPIs.count2 / activeKPIs.totalGrades) * 100}%` }}
                        className="bg-destructive h-full"
                        title={`2-ки: ${activeKPIs.count2}`}
                      />
                    </>
                  ) : null}
                </div>
              </div>

              {/* Card 4: Качество знаний & Успеваемость */}
              <div className="p-3 rounded-xl border bg-card space-y-1.5">
                <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                  <span className="font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                    Качество знаний
                  </span>
                  <span className="font-mono font-bold text-foreground">
                    {activeKPIs.qualityPercent}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="text-muted-foreground">Абсолютная успеваемость:</span>
                  <span className="font-mono font-bold text-foreground">
                    {activeKPIs.passPercent}%
                  </span>
                </div>
                <div className="text-[10px] text-muted-foreground flex items-center gap-1 pt-0.5">
                  <Sparkles className="h-3 w-3 text-primary shrink-0" />
                  <span>
                    {activeKPIs.qualityPercent >= 80
                      ? "Высокое качество знаний"
                      : activeKPIs.qualityPercent >= 50
                      ? "Стабильный уровень"
                      : "Требуется подтянуть дисциплины"}
                  </span>
                </div>
              </div>
            </div>

            {/* TAB CONTENT: Single Month View OR Multi-Month Matrix View */}
            {selectedMonthKey !== "ALL" && currentMonthData ? (
              /* SINGLE MONTH VIEW */
              <div className="border rounded-xl bg-card overflow-hidden shadow-2xs">
                <div className="p-3 border-b flex flex-wrap items-center justify-between gap-2 bg-muted/20">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <div>
                      <h3 className="text-xs font-bold text-foreground">
                        Ведомость оценок: {currentMonthData.monthLabel}
                      </h3>
                      <p className="text-[10px] text-muted-foreground">
                        Все выставленные оценки и средний балл по учебным предметам
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] font-mono">
                    <span className="text-muted-foreground">Дисциплин:</span>
                    <span className="font-bold text-foreground">{currentMonthData.subjects.length}</span>
                    <span className="text-muted-foreground ml-2">Всего оценок:</span>
                    <span className="font-bold text-foreground">{currentMonthData.totalGrades}</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b bg-muted/40 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        <th className="p-2.5 w-10 text-center">№</th>
                        <th className="p-2.5 min-w-[180px]">Дисциплина</th>
                        <th className="p-2.5 min-w-[260px]">Текущие оценки за месяц</th>
                        <th className="p-2.5 w-24 text-center">Средний балл</th>
                        <th className="p-2.5 w-24 text-center">Итоговая</th>
                        <th className="p-2.5 min-w-[140px] text-right">Статус</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {currentMonthData.subjects.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-muted-foreground">
                            В ведомости этого месяца предметов не найдено
                          </td>
                        </tr>
                      ) : (
                        currentMonthData.subjects.map((subj, sIdx) => {
                          const hasGrades = subj.grades.length > 0;
                          return (
                            <tr key={subj.subjectName} className="hover:bg-muted/15 transition-colors">
                              <td className="p-2.5 text-center font-mono text-muted-foreground">
                                {sIdx + 1}
                              </td>

                              <td className="p-2.5 font-medium text-foreground">
                                <div className="flex items-center gap-2">
                                  <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />
                                  <span className="font-semibold">{subj.subjectName}</span>
                                </div>
                              </td>

                              <td className="p-2.5">
                                {hasGrades ? (
                                  <div className="flex flex-wrap items-center gap-1">
                                    {subj.grades.map((grade, gIdx) => (
                                      <span
                                        key={gIdx}
                                        className={`inline-flex items-center justify-center h-6 w-6 rounded-md font-mono font-bold text-xs border ${getGradeBadgeClass(
                                          grade
                                        )}`}
                                      >
                                        {grade}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-[11px]">—</span>
                                )}
                              </td>

                              <td className="p-2.5 text-center font-mono font-bold text-xs">
                                {subj.averageGrade !== null ? (
                                  <span
                                    className={
                                      subj.averageGrade >= 4.5
                                        ? "text-emerald-600 dark:text-emerald-400"
                                        : subj.averageGrade >= 3.5
                                        ? "text-primary"
                                        : subj.averageGrade >= 2.5
                                        ? "text-amber-600 dark:text-amber-400"
                                        : "text-destructive"
                                    }
                                  >
                                    {subj.averageGrade.toFixed(2)}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground font-normal">—</span>
                                )}
                              </td>

                              <td className="p-2.5 text-center">
                                {subj.finalGrade !== null && subj.finalGrade !== undefined ? (
                                  <Badge
                                    variant="outline"
                                    className={`font-mono text-xs px-2 py-0.5 font-bold ${getGradeBadgeClass(
                                      subj.finalGrade
                                    )}`}
                                  >
                                    {subj.finalGrade} ({getQualitativeVerdict(subj.finalGrade)})
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground text-[11px]">—</span>
                                )}
                              </td>

                              <td className="p-2.5 text-right">
                                {hasGrades ? (
                                  subj.hasLowGrade ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-destructive">
                                      <AlertCircle className="h-3 w-3" />
                                      Есть 3 или 2
                                    </span>
                                  ) : subj.averageGrade && subj.averageGrade >= 4.75 ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                                      <CheckCircle2 className="h-3 w-3" />
                                      Отличник
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary">
                                      <CheckCircle2 className="h-3 w-3" />
                                      Ударник
                                    </span>
                                  )
                                ) : (
                                  <span className="text-muted-foreground text-[11px]">Нет оценок</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* MULTI-MONTH MATRIX VIEW (СВОДНЫЙ ТАБЕЛЬ) */
              <div className="border rounded-xl bg-card overflow-hidden shadow-2xs">
                <div className="p-3 border-b flex flex-wrap items-center justify-between gap-2 bg-muted/20">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-primary" />
                    <div>
                      <h3 className="text-xs font-bold text-foreground">
                        Сводный табель успеваемости по всем периодам
                      </h3>
                      <p className="text-[10px] text-muted-foreground">
                        Сравнительная матрица оценок и средних баллов по всем прошедшим месяцам
                      </p>
                    </div>
                  </div>

                  <div className="text-[11px] text-muted-foreground font-mono">
                    Учтено месяцев: <strong>{availableMonths.length}</strong>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b bg-muted/40 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        <th className="p-2.5 w-10 text-center">№</th>
                        <th className="p-2.5 min-w-[180px]">Дисциплина</th>
                        {availableMonths.map((m) => (
                          <th key={m.monthKey} className="p-2.5 text-center min-w-[120px]">
                            {m.monthLabel}
                          </th>
                        ))}
                        <th className="p-2.5 w-28 text-center font-bold text-foreground">
                          Итог (ср. балл)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {crossMonthMatrix.map((row, rIdx) => (
                        <tr key={row.subjectName} className="hover:bg-muted/15 transition-colors">
                          <td className="p-2.5 text-center font-mono text-muted-foreground">
                            {rIdx + 1}
                          </td>

                          <td className="p-2.5 font-medium text-foreground">
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />
                              <span className="font-semibold">{row.subjectName}</span>
                            </div>
                          </td>

                          {availableMonths.map((m) => {
                            const cell = row.monthGrades[m.monthKey];
                            const hasG = cell && cell.grades.length > 0;
                            return (
                              <td key={m.monthKey} className="p-2 text-center font-mono">
                                {hasG ? (
                                  <div className="flex flex-col items-center gap-0.5">
                                    <div className="flex flex-wrap items-center justify-center gap-0.5">
                                      {cell.grades.map((g, gIdx) => (
                                        <span
                                          key={gIdx}
                                          className={`inline-flex items-center justify-center h-5 w-5 rounded text-[11px] font-bold border ${getGradeBadgeClass(
                                            g
                                          )}`}
                                        >
                                          {g}
                                        </span>
                                      ))}
                                    </div>
                                    {cell.avg !== null && (
                                      <span className="text-[10px] text-muted-foreground font-semibold">
                                        ср. {cell.avg.toFixed(2)}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-[11px]">—</span>
                                )}
                              </td>
                            );
                          })}

                          <td className="p-2.5 text-center font-mono font-bold text-xs">
                            {row.overallAverage !== null ? (
                              <span
                                className={`text-sm ${
                                  row.overallAverage >= 4.5
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : row.overallAverage >= 3.5
                                    ? "text-primary"
                                    : row.overallAverage >= 2.5
                                    ? "text-amber-600 dark:text-amber-400"
                                    : "text-destructive"
                                }`}
                              >
                                {row.overallAverage.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground font-normal">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* PRINTABLE OFFICIAL SHEET FOR STUDENT GRADE REPORT (VISIBLE ONLY IN WINDOW.PRINT) */}
      <div className="diary-printable-sheet text-black space-y-4">
        {/* Header */}
        <div className="border-b-2 border-black pb-2 text-center space-y-1">
          <div className="text-[10px] uppercase font-bold tracking-wider text-neutral-600">
            ПРОФЕССИОНАЛЬНЫЙ ЛИЦЕЙ • УЧЕБНАЯ ЧАСТЬ
          </div>
          <h1 className="text-base font-bold uppercase tracking-wide">
            Табель успеваемости (электронный дневник)
          </h1>
          <div className="text-xs">
            Период: <strong>{activeKPIs.label}</strong>
          </div>
        </div>

        {/* Student metadata */}
        <div className="grid grid-cols-2 gap-2 text-xs border border-black p-2.5 bg-neutral-50/50">
          <div>
            <div>Учащийся: <strong>{student.name}</strong></div>
            <div>Группа: <strong>{student.groupName}</strong> (Курс {student.course})</div>
            {student.rollNumber && <div>Поименный номер: <strong>{student.rollNumber}</strong></div>}
          </div>
          <div className="text-right">
            <div>Специальность: <strong>{student.specialtyName || "Основная программа"}</strong></div>
            <div>Куратор / Мастер: <strong>{student.curatorName || "Вопольский В. В."}</strong></div>
            <div>Дата формирования: <strong>{new Date().toLocaleDateString("ru-RU")}</strong></div>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-4 gap-2 border border-black p-2 text-center text-xs">
          <div>
            <div className="text-[10px] text-neutral-600">Средний балл</div>
            <div className="font-bold text-sm">{activeKPIs.averageGrade.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-[10px] text-neutral-600">Всего оценок</div>
            <div className="font-bold text-sm">{activeKPIs.totalGrades}</div>
          </div>
          <div>
            <div className="text-[10px] text-neutral-600">Отличных (5) / Хороших (4)</div>
            <div className="font-bold text-sm">{activeKPIs.count5} / {activeKPIs.count4}</div>
          </div>
          <div>
            <div className="text-[10px] text-neutral-600">Стипендиальный статус</div>
            <div className="font-bold text-xs">{activeKPIs.statusLabel}</div>
          </div>
        </div>

        {/* Grades Table */}
        <table className="w-full text-xs border-collapse border border-black">
          <thead>
            <tr className="bg-neutral-100 border-b border-black text-[10px] font-bold uppercase">
              <th className="border border-black p-1.5 w-8 text-center">№</th>
              <th className="border border-black p-1.5 text-left">Дисциплина</th>
              <th className="border border-black p-1.5 text-center">Оценки за период</th>
              <th className="border border-black p-1.5 w-20 text-center">Ср. балл</th>
              <th className="border border-black p-1.5 w-20 text-center">Итоговая</th>
            </tr>
          </thead>
          <tbody>
            {(currentMonthData?.subjects || []).map((subj, idx) => (
              <tr key={subj.subjectName} className="border-b border-black">
                <td className="border border-black p-1.5 text-center font-mono">{idx + 1}</td>
                <td className="border border-black p-1.5 font-medium">{subj.subjectName}</td>
                <td className="border border-black p-1.5 text-center font-mono">
                  {subj.grades.length > 0 ? subj.grades.join(" ") : "—"}
                </td>
                <td className="border border-black p-1.5 text-center font-mono font-bold">
                  {subj.averageGrade !== null ? subj.averageGrade.toFixed(2) : "—"}
                </td>
                <td className="border border-black p-1.5 text-center font-mono font-bold">
                  {subj.finalGrade !== null && subj.finalGrade !== undefined
                    ? `${subj.finalGrade} (${getQualitativeVerdict(subj.finalGrade)})`
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Signatures */}
        <div className="pt-6 grid grid-cols-2 gap-8 text-xs">
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Мастер (куратор) группы:</span>
              <span>{student.curatorName || "Вопольский В. В."}</span>
            </div>
            <div className="border-b border-black pt-4" />
            <div className="text-[9px] text-neutral-500 text-center">(подпись)</div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Родитель / Законный представитель:</span>
              <span>_______________________</span>
            </div>
            <div className="border-b border-black pt-4" />
            <div className="text-[9px] text-neutral-500 text-center">(подпись)</div>
          </div>
        </div>
      </div>
    </div>
  );
}

