"use client";

import React, { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Download,
  Printer,
  Search,
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  AlertOctagon,
  Percent,
  FileSpreadsheet,
  HelpCircle,
  TrendingDown,
  ShieldAlert,
} from "lucide-react";
import type {
  ReportGroupDTO,
  GroupAbsenceSheetDTO,
} from "../actions";
import { exportToExcel } from "@/lib/excel-export";

interface AbsenceSheetTabProps {
  groups: ReportGroupDTO[];
  currentGroupId: string;
  currentPeriod: string;
  onSelectGroup: (groupId: string) => void;
  onSelectPeriod: (period: string) => void;
  sheet: GroupAbsenceSheetDTO | null;
  isLoading: boolean;
}

type AbsenceRiskFilter = "ALL" | "NORMAL" | "WARNING" | "CRITICAL";

const PERIOD_OPTIONS = [
  { value: "ALL", label: "Весь период" },
  { value: "2026-10", label: "Октябрь 2026" },
  { value: "2026-09", label: "Сентябрь 2026" },
  { value: "2026-11", label: "Ноябрь 2026" },
  { value: "2026-12", label: "Декабрь 2026" },
  { value: "2027-01", label: "Январь 2027" },
  { value: "2027-02", label: "Февраль 2027" },
  { value: "2027-03", label: "Март 2027" },
  { value: "2027-04", label: "Апрель 2027" },
  { value: "2027-05", label: "Май 2027" },
];

export function AbsenceSheetTab({
  groups,
  currentGroupId,
  currentPeriod,
  onSelectGroup,
  onSelectPeriod,
  sheet,
  isLoading,
}: AbsenceSheetTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<AbsenceRiskFilter>("ALL");

  const filteredStudents = useMemo(() => {
    if (!sheet) return [];
    return sheet.students.filter((st) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = st.studentName.toLowerCase().includes(query);
        const matchRoll = st.rollNumber?.toLowerCase().includes(query);
        if (!matchName && !matchRoll) return false;
      }

      if (riskFilter === "NORMAL") return st.riskStatus === "NORMAL";
      if (riskFilter === "WARNING") return st.riskStatus === "WARNING";
      if (riskFilter === "CRITICAL") return st.riskStatus === "CRITICAL";

      return true;
    });
  }, [sheet, searchQuery, riskFilter]);

  const handleExportExcel = () => {
    if (!sheet) return;

    const exportRows: any[][] = [];

    // Header info
    exportRows.push([
      `СВОДНАЯ ВЕДОМОСТЬ ПОСЕЩАЕМОСТИ И ПРОПУСКОВ ЗАНЯТИЙ`,
    ]);
    exportRows.push([
      `Группа: ${sheet.groupName}${sheet.course ? ` (${sheet.course} курс)` : ""}`,
      "",
      `Куратор: ${sheet.curatorName || "Не назначен"}`,
      "",
      `Период: ${sheet.periodLabel}`,
      "",
      `Дата выгрузки: ${new Date().toLocaleDateString("ru-RU")}`,
    ]);
    exportRows.push([]); // blank row

    // Discipline columns
    const headerRow: string[] = ["№", "Ф.И.О. Студента", "Номер билета"];
    sheet.disciplines.forEach((d) => {
      headerRow.push(`${d.name} (пропущено ч.)`);
      headerRow.push(`${d.name} (% пропусков)`);
    });
    headerRow.push(
      "Всего часов",
      "Пропущено (ч)",
      "Неуваж. НБ (ч)",
      "Уваж. УВ (ч)",
      "Опозданий",
      "% Пропусков",
      "% Явки",
      "Статус"
    );
    exportRows.push(headerRow);

    // Student rows
    filteredStudents.forEach((st, idx) => {
      const row: (string | number)[] = [
        idx + 1,
        st.studentName,
        st.rollNumber || "-",
      ];

      sheet.disciplines.forEach((d) => {
        const sub = st.subjects[d.id];
        if (sub) {
          row.push(sub.totalMissedHours);
          row.push(`${sub.absencePct}%`);
        } else {
          row.push(0);
          row.push("0%");
        }
      });

      const riskLabel =
        st.riskStatus === "NORMAL"
          ? "Норма"
          : st.riskStatus === "WARNING"
            ? "Внимание"
            : "Критично";

      row.push(
        st.totalHours,
        st.totalMissedHours,
        st.absentHours,
        st.excusedHours,
        st.lateCount,
        `${st.absencePct}%`,
        `${st.attendancePct}%`,
        riskLabel
      );

      exportRows.push(row);
    });

    // Summary row
    exportRows.push([]);
    const summaryRow: (string | number)[] = [
      "",
      "ИТОГО ПО ГРУППЕ",
      "",
    ];
    sheet.disciplines.forEach((d) => {
      const st = sheet.subjectStats[d.id];
      if (st) {
        summaryRow.push(st.missedHours);
        summaryRow.push(`${st.absencePct}%`);
      } else {
        summaryRow.push(0);
        summaryRow.push("0%");
      }
    });

    summaryRow.push(
      sheet.totalGroupHours,
      sheet.totalMissedHours,
      sheet.totalAbsentHours,
      sheet.totalExcusedHours,
      sheet.totalLateCount,
      `${sheet.groupAbsencePct}%`,
      `${sheet.groupAttendancePct}%`,
      ""
    );
    exportRows.push(summaryRow);

    // Group KPI ratio block
    exportRows.push([]);
    exportRows.push([
      "Статистика и процентные соотношения группы:",
    ]);
    exportRows.push([
      `Общая явка: ${sheet.groupAttendancePct}%`,
      `Общий процент пропусков: ${sheet.groupAbsencePct}%`,
      `Доля неуважительных пропусков (НБ): ${sheet.unexcusedPct}%`,
      `Доля уважительных пропусков (УВ): ${sheet.excusedPct}%`,
    ]);

    exportToExcel(
      exportRows,
      `Ведомость_пропусков_${sheet.groupName.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}`
    );
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading && !sheet) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg bg-card">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs text-muted-foreground font-medium">
          Формирование сводной ведомости пропусков по дисциплинам...
        </p>
      </div>
    );
  }

  if (!sheet) {
    return (
      <div className="p-8 text-center border rounded-lg bg-card text-muted-foreground text-xs">
        Данные для ведомости пропусков не найдены. Выберите другую группу.
      </div>
    );
  }

  const normalCount = sheet.students.filter((s) => s.riskStatus === "NORMAL").length;
  const warningCount = sheet.students.filter((s) => s.riskStatus === "WARNING").length;
  const criticalCount = sheet.students.filter((s) => s.riskStatus === "CRITICAL").length;

  return (
    <div className="space-y-4">
      {/* Top Toolbar: Group, Period, Search, Filters & Export */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 bg-card border rounded-lg">
        <div className="flex flex-wrap items-center gap-2">
          {/* Group selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground font-medium">
              Группа:
            </span>
            <Select value={currentGroupId} onValueChange={onSelectGroup}>
              <SelectTrigger className="h-8 text-xs w-[180px] bg-background">
                <SelectValue placeholder="Выберите группу">
                  {groups.find((g) => g.id === currentGroupId)?.name || "Выберите группу"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {groups.map((g) => (
                  <SelectItem key={g.id} value={g.id} className="text-xs">
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Period selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground font-medium">
              Период:
            </span>
            <Select value={currentPeriod} onValueChange={onSelectPeriod}>
              <SelectTrigger className="h-8 text-xs w-[200px] bg-background">
                <SelectValue placeholder="Выберите период">
                  {PERIOD_OPTIONS.find((p) => p.value === currentPeriod)?.label || "Выберите период"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-[200px]">
            <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Поиск студента..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 text-xs pl-8 bg-background"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <Button
            variant="outline"
            size="xs"
            onClick={handleExportExcel}
            className="h-8 px-2.5 text-xs gap-1.5 border-border"
          >
            <Download className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Excel</span>
          </Button>
          <Button
            variant="outline"
            size="xs"
            onClick={handlePrint}
            className="h-8 px-2.5 text-xs gap-1.5 border-border"
          >
            <Printer className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Печать</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards: Absence & Attendance Ratios */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Overall Attendance */}
        <div className="p-3 border rounded-lg bg-card flex flex-col justify-between">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs text-muted-foreground font-medium">
              Общая явка группы
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {sheet.groupAttendancePct}%
            </span>
            <span className="text-[11px] text-muted-foreground">
              {sheet.totalGroupHours - sheet.totalMissedHours} из {sheet.totalGroupHours} ч.
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-emerald-600 dark:bg-emerald-500 h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, sheet.groupAttendancePct)}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5">
            Доля фактического присутствия на парах
          </p>
        </div>

        {/* 2. Total Absences */}
        <div className="p-3 border rounded-lg bg-card flex flex-col justify-between">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs text-muted-foreground font-medium">
              Общий % пропусков
            </span>
            <TrendingDown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {sheet.groupAbsencePct}%
            </span>
            <span className="text-[11px] text-muted-foreground">
              всего {sheet.totalMissedHours} ч.
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${sheet.groupAbsencePct > 20
                ? "bg-rose-600"
                : sheet.groupAbsencePct > 10
                  ? "bg-amber-500"
                  : "bg-primary"
                }`}
              style={{ width: `${Math.min(100, sheet.groupAbsencePct)}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5">
            Пропущено учебных академических часов
          </p>
        </div>

        {/* 3. Unexcused (НБ) */}
        <div className="p-3 border rounded-lg bg-card flex flex-col justify-between">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs text-muted-foreground font-medium">
              Неуважительные (НБ)
            </span>
            <AlertOctagon className="h-4 w-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {sheet.unexcusedPct}%
            </span>
            <span className="text-[11px] text-muted-foreground">
              {sheet.totalAbsentHours} ч. без причины
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-rose-600 h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, sheet.unexcusedPct)}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5">
            Доля НБ от общего объема пропусков
          </p>
        </div>

        {/* 4. Excused & Lates */}
        <div className="p-3 border rounded-lg bg-card flex flex-col justify-between">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs text-muted-foreground font-medium">
              Уважительные (УВ) и Опоздания
            </span>
            <Clock className="h-4 w-4 text-primary" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {sheet.excusedPct}%
            </span>
            <span className="text-[11px] text-muted-foreground">
              {sheet.totalExcusedHours} ч. (УВ) • {sheet.totalLateCount} опозд.
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, sheet.excusedPct)}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5">
            Подтвержденные справками или заявлениями
          </p>
        </div>
      </div>

      {/* Segmented Filter Pills */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-muted/40 border rounded-lg text-xs">
        <span className="text-[11px] font-medium text-muted-foreground px-2">
          Фильтр риска:
        </span>
        <button
          type="button"
          onClick={() => setRiskFilter("ALL")}
          className={`h-7 px-3 rounded-md text-xs font-medium transition-colors ${riskFilter === "ALL"
            ? "bg-card text-foreground border border-border shadow-xs"
            : "text-muted-foreground hover:text-foreground"
            }`}
        >
          Все ({sheet.totalStudents})
        </button>
        <button
          type="button"
          onClick={() => setRiskFilter("NORMAL")}
          className={`h-7 px-3 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${riskFilter === "NORMAL"
            ? "bg-card text-foreground border border-border shadow-xs"
            : "text-muted-foreground hover:text-foreground"
            }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Норма ({normalCount})</span>
        </button>
        <button
          type="button"
          onClick={() => setRiskFilter("WARNING")}
          className={`h-7 px-3 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${riskFilter === "WARNING"
            ? "bg-card text-foreground border border-border shadow-xs"
            : "text-muted-foreground hover:text-foreground"
            }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span>Внимание ({warningCount})</span>
        </button>
        <button
          type="button"
          onClick={() => setRiskFilter("CRITICAL")}
          className={`h-7 px-3 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${riskFilter === "CRITICAL"
            ? "bg-card text-foreground border border-border shadow-xs"
            : "text-muted-foreground hover:text-foreground"
            }`}
        >
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          <span>Критический риск ({criticalCount})</span>
        </button>
      </div>

      {/* Main Consolidated Absences Matrix Table */}
      <div className="border rounded-lg bg-card overflow-hidden">
        {/* Table Top Info Header */}
        <div className="p-3 border-b flex flex-wrap items-center justify-between gap-2 bg-muted/20">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-foreground">
              Сводная ведомость пропусков: {sheet.groupName}
            </span>
            <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-medium">
              {sheet.periodLabel}
            </Badge>
            {sheet.curatorName && (
              <span className="text-[11px] text-muted-foreground">
                Куратор: {sheet.curatorName}
              </span>
            )}
          </div>
          <div className="text-[11px] text-muted-foreground">
            Показано: {filteredStudents.length} из {sheet.totalStudents} студентов
          </div>
        </div>

        {/* Scrollable Matrix with Correct Sticky Column Offsets */}
        <div className="overflow-x-auto max-h-[640px] border rounded-lg bg-card">
          <table className="w-full text-xs border-separate border-spacing-0">
            <thead className="sticky top-0 z-20 bg-muted">
              <tr>
                {/* Sticky Header: Number */}
                <th className="p-2.5 text-center w-10 min-w-[40px] max-w-[40px] sticky left-0 top-0 z-30 bg-muted border-b border-r border-border font-medium">
                  №
                </th>
                {/* Sticky Header: Student Name (Offset by w-10 = left-10 = 40px) */}
                <th className="p-2.5 text-left min-w-[220px] max-w-[220px] sticky left-10 top-0 z-30 bg-muted border-b border-r-2 border-border font-medium">
                  Ф.И.О. Студента
                </th>
                {/* Discipline Header Columns */}
                {sheet.disciplines.map((d) => (
                  <th
                    key={d.id}
                    className="p-2 text-center min-w-[130px] border-b border-r border-border font-medium bg-muted"
                    title={d.name}
                  >
                    <div className="truncate max-w-[150px] mx-auto font-semibold text-foreground">
                      {d.name}
                    </div>
                    {d.teacherName && (
                      <div className="text-[9px] font-normal text-muted-foreground truncate max-w-[150px] mx-auto">
                        {d.teacherName}
                      </div>
                    )}
                  </th>
                ))}
                {/* Summary Metrics Columns */}
                <th className="p-2 text-center w-14 border-b border-r border-border font-medium bg-muted/90">
                  Всего ч.
                </th>
                <th className="p-2 text-center w-14 border-b border-r border-border font-medium bg-muted/90">
                  Проп. ч.
                </th>
                <th className="p-2 text-center w-14 border-b border-r border-border font-medium bg-muted/90 text-rose-600 dark:text-rose-400">
                  НБ ч.
                </th>
                <th className="p-2 text-center w-14 border-b border-r border-border font-medium bg-muted/90">
                  УВ ч.
                </th>
                <th className="p-2 text-center w-12 border-b border-r border-border font-medium bg-muted/90">
                  Опозд.
                </th>
                <th className="p-2 text-center w-16 border-b border-r border-border font-medium bg-muted/90">
                  % Проп.
                </th>
                <th className="p-2 text-center w-16 border-b border-r border-border font-medium bg-muted/90">
                  % Явки
                </th>
                <th className="p-2.5 text-center w-20 border-b border-border font-medium bg-muted/90">
                  Статус
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td
                    colSpan={sheet.disciplines.length + 10}
                    className="p-8 text-center text-muted-foreground text-xs bg-card"
                  >
                    Студенты по выбранным критериям не найдены.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st, idx) => {
                  return (
                    <tr
                      key={st.studentId}
                      className="hover:bg-muted/30 transition-colors group/row"
                    >
                      {/* Sticky Body: Number */}
                      <td className="p-2 text-center text-muted-foreground font-mono text-[11px] sticky left-0 z-10 bg-card group-hover/row:bg-muted border-b border-r border-border w-10 min-w-[40px] max-w-[40px]">
                        {idx + 1}
                      </td>
                      {/* Sticky Body: Student Name (Offset by left-10 = 40px) */}
                      <td className="p-2.5 sticky left-10 z-10 bg-card group-hover/row:bg-muted border-b border-r-2 border-border min-w-[220px] max-w-[220px]">
                        <div className="font-medium text-foreground truncate max-w-[200px]">
                          {st.studentName}
                        </div>
                        {st.rollNumber && (
                          <div className="text-[10px] text-muted-foreground font-mono">
                            № {st.rollNumber}
                          </div>
                        )}
                      </td>

                      {/* Discipline Absence Cells */}
                      {sheet.disciplines.map((d) => {
                        const sub = st.subjects[d.id];
                        if (!sub) {
                          return (
                            <td
                              key={d.id}
                              className="p-2 text-center border-b border-r border-border text-muted-foreground/40 text-[11px] bg-card group-hover/row:bg-muted/30"
                            >
                              —
                            </td>
                          );
                        }

                        const hasMissed = sub.totalMissedHours > 0;
                        const hasUnexcused = sub.absentHours > 0;

                        return (
                          <td
                            key={d.id}
                            className={`p-2 text-center border-b border-r border-border text-[11px] ${hasUnexcused
                              ? "bg-rose-500/5 group-hover/row:bg-rose-500/10"
                              : hasMissed
                                ? "bg-amber-500/5 group-hover/row:bg-amber-500/10"
                                : "bg-card group-hover/row:bg-muted/30"
                              }`}
                          >
                            <div className="flex flex-col items-center justify-center">
                              <span
                                className={`font-semibold ${hasUnexcused
                                  ? "text-rose-600 dark:text-rose-400 font-bold"
                                  : hasMissed
                                    ? "text-amber-600 dark:text-amber-400"
                                    : "text-muted-foreground"
                                  }`}
                              >
                                {sub.totalMissedHours} ч.
                              </span>
                              <div className="flex items-center gap-1 text-[9px] text-muted-foreground mt-0.5">
                                <span title="Неуважительные (НБ)">
                                  {sub.absentHours} нб
                                </span>
                                <span>/</span>
                                <span title="Уважительные (УВ)">
                                  {sub.excusedHours} ув
                                </span>
                                <span className="text-primary font-mono ml-0.5">
                                  ({sub.absencePct}%)
                                </span>
                              </div>
                            </div>
                          </td>
                        );
                      })}

                      {/* Summary Metrics Cells */}
                      <td className="p-2 text-center border-b border-r border-border font-mono text-[11px] text-muted-foreground bg-card group-hover/row:bg-muted/30">
                        {st.totalHours}
                      </td>
                      <td className="p-2 text-center border-b border-r border-border font-mono text-[11px] font-bold text-foreground bg-card group-hover/row:bg-muted/30">
                        {st.totalMissedHours}
                      </td>
                      <td className="p-2 text-center border-b border-r border-border font-mono text-[11px] font-medium text-rose-600 dark:text-rose-400 bg-card group-hover/row:bg-muted/30">
                        {st.absentHours}
                      </td>
                      <td className="p-2 text-center border-b border-r border-border font-mono text-[11px] font-medium text-muted-foreground bg-card group-hover/row:bg-muted/30">
                        {st.excusedHours}
                      </td>
                      <td className="p-2 text-center border-b border-r border-border font-mono text-[11px] text-muted-foreground bg-card group-hover/row:bg-muted/30">
                        {st.lateCount}
                      </td>
                      <td className="p-2 text-center border-b border-r border-border font-mono text-[11px] font-semibold bg-card group-hover/row:bg-muted/30">
                        <span
                          className={
                            st.absencePct > 20
                              ? "text-rose-600 dark:text-rose-400"
                              : st.absencePct > 10
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-muted-foreground"
                          }
                        >
                          {st.absencePct}%
                        </span>
                      </td>
                      <td className="p-2 text-center border-b border-r border-border font-mono text-[11px] bg-card group-hover/row:bg-muted/30">
                        <span
                          className={`font-semibold ${st.attendancePct >= 80
                            ? "text-emerald-600 dark:text-emerald-400"
                            : st.attendancePct >= 60
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-rose-600 dark:text-rose-400"
                            }`}
                        >
                          {st.attendancePct}%
                        </span>
                      </td>
                      <td className="p-2 text-center border-b border-border bg-card group-hover/row:bg-muted/30">
                        {st.riskStatus === "NORMAL" && (
                          <Badge
                            variant="outline"
                            className="text-[10px] h-5 px-1.5 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 font-medium"
                          >
                            Норма
                          </Badge>
                        )}
                        {st.riskStatus === "WARNING" && (
                          <Badge
                            variant="outline"
                            className="text-[10px] h-5 px-1.5 border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10 font-medium"
                          >
                            Внимание
                          </Badge>
                        )}
                        {st.riskStatus === "CRITICAL" && (
                          <Badge
                            variant="outline"
                            className="text-[10px] h-5 px-1.5 border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/10 font-medium"
                          >
                            Критично
                          </Badge>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Footer Summary Row (Sticky to Left) */}
            <tfoot className="border-t-2 border-border bg-muted font-medium">
              <tr>
                <td
                  colSpan={2}
                  className="p-2.5 text-left sticky left-0 z-10 bg-muted border-t-2 border-r-2 border-border font-bold text-foreground text-xs min-w-[260px] max-w-[260px]"
                >
                  ИТОГО ПО ГРУППЕ:
                </td>
                {/* Discipline Totals */}
                {sheet.disciplines.map((d) => {
                  const st = sheet.subjectStats[d.id];
                  if (!st) {
                    return (
                      <td
                        key={d.id}
                        className="p-2 text-center border-t-2 border-r border-border text-[11px] text-muted-foreground bg-muted"
                      >
                        —
                      </td>
                    );
                  }
                  return (
                    <td
                      key={d.id}
                      className="p-2 text-center border-t-2 border-r border-border text-[11px] bg-muted"
                    >
                      <div className="font-bold text-foreground">
                        {st.missedHours} ч.
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {st.absentHours} нб / {st.excusedHours} ув
                      </div>
                      <div className="text-[10px] text-primary font-mono font-semibold">
                        {st.absencePct}% проп.
                      </div>
                    </td>
                  );
                })}
                {/* Overall Group Totals */}
                <td className="p-2 text-center border-t-2 border-r border-border font-mono text-[11px] font-bold text-foreground bg-muted">
                  {sheet.totalGroupHours}
                </td>
                <td className="p-2 text-center border-t-2 border-r border-border font-mono text-[11px] font-bold text-foreground bg-muted">
                  {sheet.totalMissedHours}
                </td>
                <td className="p-2 text-center border-t-2 border-r border-border font-mono text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-muted">
                  {sheet.totalAbsentHours}
                </td>
                <td className="p-2 text-center border-t-2 border-r border-border font-mono text-[11px] font-bold text-muted-foreground bg-muted">
                  {sheet.totalExcusedHours}
                </td>
                <td className="p-2 text-center border-t-2 border-r border-border font-mono text-[11px] font-bold text-muted-foreground bg-muted">
                  {sheet.totalLateCount}
                </td>
                <td className="p-2 text-center border-t-2 border-r border-border font-mono text-[11px] font-bold text-foreground bg-muted">
                  {sheet.groupAbsencePct}%
                </td>
                <td className="p-2 text-center border-t-2 border-r border-border font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-muted">
                  {sheet.groupAttendancePct}%
                </td>
                <td className="p-2 text-center border-t-2 border-border text-[10px] text-muted-foreground bg-muted">
                  {sheet.totalStudents} студ.
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Legend / Info bar */}
        <div className="p-3 border-t bg-muted/20 flex flex-wrap items-center justify-between gap-3 text-[11px] text-muted-foreground">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-medium text-foreground">Обозначения:</span>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-rose-600 dark:text-rose-400">НБ</span>
              <span>— пропуск по неуважительной причине</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-foreground">УВ</span>
              <span>— пропуск по уважительной причине (справка / заявление)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>1 пара = 2 академических часа</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span>Соотношение причин:</span>
            <span className="font-semibold text-rose-600 dark:text-rose-400">
              НБ: {sheet.unexcusedPct}%
            </span>
            <span>/</span>
            <span className="font-semibold text-foreground">
              УВ: {sheet.excusedPct}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
