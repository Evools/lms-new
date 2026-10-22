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
  Award,
  Download,
  Printer,
  Search,
  Users,
  CheckCircle2,
  AlertTriangle,
  GraduationCap,
  Sparkles,
  TrendingUp,
  Percent,
  BookOpen,
  HelpCircle,
  FileSpreadsheet,
  Check,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import type {
  ReportGroupDTO,
  GroupPerformanceSheetDTO,
} from "../actions";
import { updateStudentGradeAction } from "../actions";
import { exportToExcel } from "@/lib/excel-export";

interface PerformanceSheetTabProps {
  groups: ReportGroupDTO[];
  currentGroupId: string;
  onSelectGroup: (groupId: string) => void;
  sheet: GroupPerformanceSheetDTO | null;
  onSheetChange?: (newSheet: GroupPerformanceSheetDTO) => void;
  isLoading: boolean;
}

type PerformanceFilter = "ALL" | "EXCELLENT" | "GOOD" | "SATISFACTORY" | "DEBT";

export function PerformanceSheetTab({
  groups,
  currentGroupId,
  onSelectGroup,
  sheet,
  onSheetChange,
  isLoading,
}: PerformanceSheetTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<PerformanceFilter>("ALL");
  const [updatingStudentSub, setUpdatingStudentSub] = useState<string | null>(null);

  const handleUpdateGrade = async (studentId: string, subjectName: string, newGrade: number) => {
    if (!sheet) return;
    setUpdatingStudentSub(`${studentId}_${subjectName}`);

    // Optimistic local update
    const updatedStudents = sheet.students.map((st) => {
      if (st.studentId !== studentId) return st;
      const currentSub = Object.values(st.subjects).find((s) => s.subjectName === subjectName);
      if (!currentSub) return st;

      const newSubjects = {
        ...st.subjects,
        [currentSub.groupSubjectId]: {
          ...currentSub,
          grade: newGrade,
          percentage: newGrade === 5 ? 95 : newGrade === 4 ? 80 : newGrade === 3 ? 65 : 45,
          status: (newGrade === 5
            ? "EXCELLENT"
            : newGrade === 4
              ? "GOOD"
              : newGrade === 3
                ? "SATISFACTORY"
                : "DEBT") as "EXCELLENT" | "GOOD" | "SATISFACTORY" | "DEBT",
        },
      };

      const grades = Object.values(newSubjects).map((s) => s.grade);
      const avg = Number((grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(1));
      const debts = grades.filter((g) => g === 2).length;
      let status: "EXCELLENT" | "GOOD" | "SATISFACTORY" | "DEBT" = "SATISFACTORY";
      if (debts > 0) status = "DEBT";
      else if (grades.every((g) => g === 5)) status = "EXCELLENT";
      else if (grades.every((g) => g >= 4)) status = "GOOD";

      return {
        ...st,
        subjects: newSubjects,
        averageGrade: avg,
        debtsCount: debts,
        academicStatus: status,
      };
    });

    const total = updatedStudents.length;
    const exc = updatedStudents.filter((s) => s.academicStatus === "EXCELLENT").length;
    const good = updatedStudents.filter((s) => s.academicStatus === "GOOD").length;
    const debts = updatedStudents.filter((s) => s.academicStatus === "DEBT").length;

    const optimisticSheet: GroupPerformanceSheetDTO = {
      ...sheet,
      students: updatedStudents,
      excellentCount: exc,
      goodCount: good,
      debtCount: debts,
      academicSuccessPct: total > 0 ? Math.round(((total - debts) / total) * 100) : 0,
      qualityKnowledgePct: total > 0 ? Math.round(((exc + good) / total) * 100) : 0,
      averageGroupGrade:
        total > 0
          ? Number(
            (updatedStudents.reduce((a, s) => a + s.averageGrade, 0) / total).toFixed(2)
          )
          : 0,
    };

    onSheetChange?.(optimisticSheet);

    try {
      const res = await updateStudentGradeAction(sheet.groupId, studentId, subjectName, newGrade);
      if (res.success && res.sheet) {
        onSheetChange?.(res.sheet);
      }
    } catch (err) {
      console.error("Failed to update grade:", err);
    } finally {
      setUpdatingStudentSub(null);
    }
  };

  const filteredStudents = useMemo(() => {
    if (!sheet) return [];
    return sheet.students.filter((st) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = st.studentName.toLowerCase().includes(query);
        const matchRoll = st.rollNumber?.toLowerCase().includes(query);
        if (!matchName && !matchRoll) return false;
      }

      if (statusFilter === "EXCELLENT") return st.academicStatus === "EXCELLENT";
      if (statusFilter === "GOOD") return st.academicStatus === "GOOD";
      if (statusFilter === "SATISFACTORY") return st.academicStatus === "SATISFACTORY";
      if (statusFilter === "DEBT") return st.academicStatus === "DEBT";

      return true;
    });
  }, [sheet, searchQuery, statusFilter]);

  const handleExportExcel = () => {
    if (!sheet) return;

    const discNames = sheet.disciplines.map((d) => d.name);

    const headerRows = [
      ["СВОДНАЯ ВЕДОМОСТЬ УСПЕВАЕМОСТИ СТУДЕНТОВ ПО ВСЕМ ДИСЦИПЛИНАМ"],
      [`Группа: ${sheet.groupName}`, `Специальность: ${sheet.specialtyName || "—"}`, `Курс: ${sheet.course || 1}`],
      [`Куратор: ${sheet.curatorName || "—"}`, `Дата формирования: ${new Date().toLocaleDateString("ru-RU")}`],
      [],
      [
        "№ п/п",
        "Поим. №",
        "ФИО Студента",
        ...discNames.map((d) => `${d} (Балл / %)`),
        "Средний балл",
        "% Успеваемости",
        "Задолженностей",
        "Итоговый статус",
      ],
    ];

    const studentRows = sheet.students.map((st, idx) => {
      const subjectCols = sheet.disciplines.map((d) => {
        const sub = st.subjects[d.id];
        if (!sub) return "—";
        return `${sub.grade} (${sub.percentage}%)`;
      });

      const statusLabel =
        st.academicStatus === "EXCELLENT"
          ? "Отличник (5)"
          : st.academicStatus === "GOOD"
            ? "Хорошист (4-5)"
            : st.academicStatus === "DEBT"
              ? "Задолженность"
              : "Успевает";

      return [
        idx + 1,
        st.rollNumber || "—",
        st.studentName,
        ...subjectCols,
        st.averageGrade,
        `${st.overallPercentage}%`,
        st.debtsCount,
        statusLabel,
      ];
    });

    const summaryRows = [
      [],
      [
        "ИТОГО СРЕДНИЙ БАЛЛ ПО ДИСЦИПЛИНАМ:",
        "",
        "",
        ...sheet.disciplines.map((d) => sheet.subjectAverages[d.id]?.averageGrade || "—"),
        sheet.averageGroupGrade,
        `${sheet.academicSuccessPct}%`,
        sheet.debtCount,
        "",
      ],
      [
        "КАЧЕСТВО ЗНАНИЙ ПО ДИСЦИПЛИНАМ (%):",
        "",
        "",
        ...sheet.disciplines.map((d) => `${sheet.subjectAverages[d.id]?.qualityPct || 0}%`),
        "",
        "",
        "",
        "",
      ],
      [],
      ["ИТОГОВЫЕ ПОКАЗАТЕЛИ ГРУППЫ В ПРОЦЕНТНОМ СООТНОШЕНИИ:"],
      [`Абсолютная успеваемость группы (без двоек): ${sheet.academicSuccessPct}%`],
      [`Качество знаний группы (оценки 4 и 5): ${sheet.qualityKnowledgePct}%`],
      [`Средний балл учебной группы: ${sheet.averageGroupGrade}`],
      [`Всего студентов: ${sheet.totalStudents}`],
      [`Отличников: ${sheet.excellentCount} (${sheet.totalStudents > 0 ? Math.round((sheet.excellentCount / sheet.totalStudents) * 100) : 0}%)`],
      [`Хорошистов: ${sheet.goodCount} (${sheet.totalStudents > 0 ? Math.round((sheet.goodCount / sheet.totalStudents) * 100) : 0}%)`],
      [`Успевающих (на 3): ${sheet.satisfactoryCount} (${sheet.totalStudents > 0 ? Math.round((sheet.satisfactoryCount / sheet.totalStudents) * 100) : 0}%)`],
      [`С задолженностями: ${sheet.debtCount} (${sheet.totalStudents > 0 ? Math.round((sheet.debtCount / sheet.totalStudents) * 100) : 0}%)`],
    ];

    exportToExcel(
      [...headerRows, ...studentRows, ...summaryRows],
      `Сводная_ведомость_успеваемости_${sheet.groupName}.xlsx`,
      "Успеваемость"
    );
  };

  const handlePrint = () => {
    window.print();
  };

  if (!sheet && !isLoading) {
    return (
      <div className="bg-card border rounded-xl p-8 text-center space-y-2 shadow-2xs">
        <Award className="h-8 w-8 text-muted-foreground/40 mx-auto" />
        <p className="text-xs font-semibold text-foreground">Ведомость не сформирована</p>
        <p className="text-[11px] text-muted-foreground">Выберите учебную группу для отображения сводной ведомости успеваемости.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 w-full">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 bg-card border rounded-xl p-3 shadow-2xs print:hidden">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="space-y-0.5">
            <span className="text-[10px] text-muted-foreground font-medium block">Учебная группа</span>
            <Select value={currentGroupId} onValueChange={onSelectGroup} disabled={isLoading}>
              <SelectTrigger className="h-8 text-xs bg-background w-[180px] font-medium">
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

          <div className="space-y-0.5">
            <span className="text-[10px] text-muted-foreground font-medium block">Поиск студента</span>
            <div className="relative flex items-center">
              <Search className="h-3.5 w-3.5 absolute left-2.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Поиск по ФИО или №..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 text-xs pl-8 w-[190px] bg-background"
              />
            </div>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] text-muted-foreground font-medium block">Статус успеваемости</span>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as PerformanceFilter)}>
              <SelectTrigger className="h-8 text-xs bg-background w-[160px] font-medium">
                <SelectValue>
                  {statusFilter === "ALL"
                    ? "Все студенты"
                    : statusFilter === "EXCELLENT"
                      ? "Отличники (5)"
                      : statusFilter === "GOOD"
                        ? "Хорошисты (4-5)"
                        : statusFilter === "SATISFACTORY"
                          ? "Успевающие (3)"
                          : "С задолженностями"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">Все студенты</SelectItem>
                <SelectItem value="EXCELLENT" className="text-xs">Отличники (5)</SelectItem>
                <SelectItem value="GOOD" className="text-xs">Хорошисты (4-5)</SelectItem>
                <SelectItem value="SATISFACTORY" className="text-xs">Успевающие (3)</SelectItem>
                <SelectItem value="DEBT" className="text-xs">С задолженностями</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1 sm:pt-0">
          <Button
            size="xs"
            variant="outline"
            onClick={handleExportExcel}
            disabled={!sheet || isLoading}
            className="h-8 text-xs gap-1.5 font-medium border-primary/30 text-primary hover:bg-primary/10"
            title="Выгрузить сводную ведомость успеваемости в Excel"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Экспорт Excel
          </Button>

          <Button
            size="xs"
            variant="outline"
            onClick={handlePrint}
            disabled={!sheet || isLoading}
            className="h-8 text-xs gap-1.5 font-medium"
            title="Печать официального бланка ведомости"
          >
            <Printer className="h-3.5 w-3.5 text-muted-foreground" />
            Печать бланка
          </Button>
        </div>
      </div>

      {sheet && (
        <>
          {/* Group Header Info & KPI Cards with Percentages */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            <div className="rounded-xl border p-3 bg-card shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[10px] font-medium uppercase tracking-wide">Абсолютная успеваемость</span>
                <Percent className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-foreground">{sheet.academicSuccessPct}%</span>
                <span className="text-[10px] text-muted-foreground">без двоек</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${sheet.academicSuccessPct}%` }}
                />
              </div>
              <div className="text-[10px] text-muted-foreground pt-0.5">
                {sheet.totalStudents - sheet.debtCount} из {sheet.totalStudents} студентов аттестованы
              </div>
            </div>

            <div className="rounded-xl border p-3 bg-card shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[10px] font-medium uppercase tracking-wide">Качество знаний</span>
                <Sparkles className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-foreground">{sheet.qualityKnowledgePct}%</span>
                <span className="text-[10px] text-muted-foreground">на 4 и 5</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${sheet.qualityKnowledgePct}%` }}
                />
              </div>
              <div className="text-[10px] text-muted-foreground pt-0.5">
                {sheet.excellentCount + sheet.goodCount} студентов отличники и хорошисты
              </div>
            </div>

            <div className="rounded-xl border p-3 bg-card shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[10px] font-medium uppercase tracking-wide">Средний балл группы</span>
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-foreground">{sheet.averageGroupGrade}</span>
                <span className="text-[10px] text-muted-foreground">из 5.0</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${(sheet.averageGroupGrade / 5) * 100}%` }}
                />
              </div>
              <div className="text-[10px] text-muted-foreground pt-0.5">
                По {sheet.disciplines.length} дисциплинам учебного плана
              </div>
            </div>

            <div className="rounded-xl border p-3 bg-card shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[10px] font-medium uppercase tracking-wide">Распределение оценок</span>
                <GraduationCap className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="grid grid-cols-4 gap-1 text-center pt-0.5">
                <div className="bg-primary/10 rounded-md p-1">
                  <div className="text-xs font-bold text-primary">{sheet.excellentCount}</div>
                  <div className="text-[9px] text-muted-foreground font-medium">«5»</div>
                </div>
                <div className="bg-emerald-500/10 rounded-md p-1">
                  <div className="text-xs font-bold text-emerald-600">{sheet.goodCount}</div>
                  <div className="text-[9px] text-muted-foreground font-medium">«4»</div>
                </div>
                <div className="bg-amber-500/10 rounded-md p-1">
                  <div className="text-xs font-bold text-amber-600">{sheet.satisfactoryCount}</div>
                  <div className="text-[9px] text-muted-foreground font-medium">«3»</div>
                </div>
                <div className="bg-destructive/10 rounded-md p-1">
                  <div className="text-xs font-bold text-destructive">{sheet.debtCount}</div>
                  <div className="text-[9px] text-muted-foreground font-medium">«2»</div>
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground pt-0.5 text-center">
                {sheet.debtCount === 0 ? "Задолженностей нет" : `${sheet.debtCount} студ. имеют долги`}
              </div>
            </div>
          </div>

          {/* Official Printable Sheet Header */}
          <div className="hidden print:block p-4 border-b space-y-2 text-center">
            <h1 className="text-base font-bold uppercase tracking-tight">Лицей при КГТУ им. И. Раззакова</h1>
            <h2 className="text-sm font-semibold">СВОДНАЯ ВЕДОМОСТЬ УСПЕВАЕМОСТИ СТУДЕНТОВ</h2>
            <div className="text-xs flex justify-between pt-2">
              <span><strong>Группа:</strong> {sheet.groupName}</span>
              <span><strong>Специальность:</strong> {sheet.specialtyName || "—"}</span>
              <span><strong>Куратор:</strong> {sheet.curatorName || "—"}</span>
              <span><strong>Дата:</strong> {new Date().toLocaleDateString("ru-RU")}</span>
            </div>
          </div>

          {/* Main Matrix Table */}
          <div className="bg-card border rounded-xl shadow-2xs overflow-hidden space-y-2">
            <div className="p-3 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" />
                <h2 className="text-xs font-bold text-foreground">
                  Сводная ведомость успеваемости: Группа {sheet.groupName}
                </h2>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {sheet.disciplines.length} предметов
                </Badge>
              </div>
              <span className="text-[11px] text-muted-foreground font-medium">
                Показано: {filteredStudents.length} из {sheet.totalStudents} студентов
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-muted/40 border-b text-[11px] text-muted-foreground">
                    <th className="py-2 px-2.5 text-center font-semibold w-10">№</th>
                    <th className="py-2 px-2.5 text-center font-semibold w-16">Поим. №</th>
                    <th className="py-2 px-3 text-left font-semibold min-w-[200px]">ФИО Студента</th>
                    {sheet.disciplines.map((d) => (
                      <th key={d.id} className="py-2 px-2.5 text-center font-semibold min-w-[130px] border-l border-border/40">
                        <div className="truncate max-w-[150px] mx-auto" title={d.name}>
                          {d.name}
                        </div>
                        {d.teacherName && (
                          <div className="text-[9px] font-normal text-muted-foreground truncate max-w-[150px] mx-auto" title={`Преподаватель: ${d.teacherName}`}>
                            {d.teacherName}
                          </div>
                        )}
                      </th>
                    ))}
                    <th className="py-2 px-2.5 text-center font-semibold w-24 border-l bg-primary/5 text-foreground">
                      Ср. балл
                    </th>
                    <th className="py-2 px-2.5 text-center font-semibold w-24 border-l bg-primary/5 text-foreground">
                      % Успев.
                    </th>
                    <th className="py-2 px-2 text-center font-semibold w-16 border-l text-muted-foreground">
                      Долги
                    </th>
                    <th className="py-2 px-3 text-center font-semibold w-28 border-l">Статус</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7 + sheet.disciplines.length} className="text-center py-8 text-muted-foreground">
                        Студенты по заданным критериям не найдены.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((st, idx) => (
                      <tr key={st.studentId} className="hover:bg-muted/25 transition-colors">
                        <td className="py-2 px-2.5 text-center text-muted-foreground font-mono text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-2.5 text-center font-mono text-[11px] text-muted-foreground">
                          {st.rollNumber || "—"}
                        </td>
                        <td className="py-2 px-3 font-medium text-foreground">
                          {st.studentName}
                        </td>
                        {sheet.disciplines.map((d) => {
                          const sub = st.subjects[d.id];
                          if (!sub) {
                            return (
                              <td key={d.id} className="py-2 px-2.5 text-center text-muted-foreground border-l border-border/40">
                                —
                              </td>
                            );
                          }

                          const gradeBadge =
                            sub.grade === 5
                              ? "bg-primary/10 text-primary border-primary/25"
                              : sub.grade === 4
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/25"
                                : sub.grade === 3
                                  ? "bg-amber-500/10 text-amber-600 border-amber-500/25"
                                  : "bg-destructive/10 text-destructive border-destructive/25";

                          return (
                            <td key={d.id} className="py-1.5 px-2 text-center border-l border-border/40">
                              <DropdownMenu>
                                <DropdownMenuTrigger className="outline-none group/cell w-full">
                                  <div className="flex flex-col items-center justify-center p-1 rounded-md hover:bg-muted/60 transition-colors cursor-pointer">
                                    <div className="flex items-center gap-1.5">
                                      <span
                                        className={`inline-flex items-center justify-center h-5 w-5 rounded-md font-bold text-xs border transition-transform group-hover/cell:scale-105 ${gradeBadge}`}
                                        title="Нажмите, чтобы изменить оценку"
                                      >
                                        {sub.grade}
                                      </span>
                                      <span className="text-[10px] text-muted-foreground font-medium">
                                        {sub.percentage}%
                                      </span>
                                    </div>
                                    <div className="text-[9px] text-muted-foreground/75 truncate max-w-[110px] mt-0.5">
                                      {sub.testScorePct !== undefined
                                        ? `Тест: ${sub.testScorePct}%`
                                        : sub.totalAssignments > 0
                                          ? `ДЗ: ${sub.acceptedAssignments}/${sub.totalAssignments}`
                                          : "Аттестация"}
                                    </div>
                                  </div>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="center" className="w-40 p-1 text-xs">
                                  <DropdownMenuLabel className="text-[10px] text-muted-foreground px-2 py-1">
                                    Оценка по предмету:
                                  </DropdownMenuLabel>
                                  <DropdownMenuItem
                                    onClick={() => handleUpdateGrade(st.studentId, d.name, 5)}
                                    className="cursor-pointer text-xs flex items-center justify-between py-1.5 px-2"
                                  >
                                    <span className="font-semibold text-primary">5 — Отлично</span>
                                    {sub.grade === 5 && <Check className="h-3.5 w-3.5 text-primary" />}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleUpdateGrade(st.studentId, d.name, 4)}
                                    className="cursor-pointer text-xs flex items-center justify-between py-1.5 px-2"
                                  >
                                    <span className="font-semibold text-emerald-600">4 — Хорошо</span>
                                    {sub.grade === 4 && <Check className="h-3.5 w-3.5 text-emerald-600" />}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleUpdateGrade(st.studentId, d.name, 3)}
                                    className="cursor-pointer text-xs flex items-center justify-between py-1.5 px-2"
                                  >
                                    <span className="font-semibold text-amber-600">3 — Удовл.</span>
                                    {sub.grade === 3 && <Check className="h-3.5 w-3.5 text-amber-600" />}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleUpdateGrade(st.studentId, d.name, 2)}
                                    className="cursor-pointer text-xs flex items-center justify-between py-1.5 px-2 text-destructive"
                                  >
                                    <span className="font-semibold">2 — Задолженность</span>
                                    {sub.grade === 2 && <Check className="h-3.5 w-3.5 text-destructive" />}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          );
                        })}
                        <td className="py-2 px-2.5 text-center font-bold text-xs border-l bg-primary/5 text-foreground">
                          {st.averageGrade}
                        </td>
                        <td className="py-2 px-2.5 text-center border-l bg-primary/5">
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="font-semibold text-xs text-foreground">{st.overallPercentage}%</span>
                            <div className="w-12 h-1 rounded-full bg-muted overflow-hidden">
                              <div
                                className={`h-full rounded-full ${st.overallPercentage >= 80 ? "bg-primary" : st.overallPercentage >= 60 ? "bg-amber-500" : "bg-destructive"
                                  }`}
                                style={{ width: `${st.overallPercentage}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-2 px-2 text-center font-semibold border-l">
                          {st.debtsCount > 0 ? (
                            <span className="text-destructive font-bold">{st.debtsCount}</span>
                          ) : (
                            <span className="text-muted-foreground/60">0</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-center border-l">
                          {st.academicStatus === "EXCELLENT" && (
                            <Badge variant="outline" className="text-[10px] font-semibold bg-primary/10 text-primary border-primary/30">
                              Отличник (5)
                            </Badge>
                          )}
                          {st.academicStatus === "GOOD" && (
                            <Badge variant="outline" className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                              Хорошист (4-5)
                            </Badge>
                          )}
                          {st.academicStatus === "SATISFACTORY" && (
                            <Badge variant="outline" className="text-[10px] font-medium bg-amber-500/10 text-amber-600 border-amber-500/30">
                              Успевает (3)
                            </Badge>
                          )}
                          {st.academicStatus === "DEBT" && (
                            <Badge variant="outline" className="text-[10px] font-semibold bg-destructive/10 text-destructive border-destructive/30">
                              Задолженность
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>

                {/* Footer Group Summary Row */}
                <tfoot>
                  <tr className="bg-muted/50 border-t-2 border-border font-bold text-[11px] text-foreground">
                    <td colSpan={3} className="py-2.5 px-3 text-left">
                      ИТОГО СРЕДНИЙ БАЛЛ ПО ПРЕДМЕТАМ:
                    </td>
                    {sheet.disciplines.map((d) => {
                      const stat = sheet.subjectAverages[d.id];
                      return (
                        <td key={d.id} className="py-2.5 px-2.5 text-center border-l border-border/60">
                          <div className="space-y-0.5">
                            <span className="text-primary font-bold">{stat?.averageGrade || "—"}</span>
                            <div className="text-[9px] text-muted-foreground font-medium">
                              Качество: {stat?.qualityPct || 0}%
                            </div>
                          </div>
                        </td>
                      );
                    })}
                    <td className="py-2.5 px-2.5 text-center border-l bg-primary/10 text-primary font-bold text-xs">
                      {sheet.averageGroupGrade}
                    </td>
                    <td className="py-2.5 px-2.5 text-center border-l bg-primary/10 text-primary font-bold text-xs">
                      {sheet.academicSuccessPct}%
                    </td>
                    <td className="py-2.5 px-2 text-center border-l text-destructive">
                      {sheet.debtCount}
                    </td>
                    <td className="py-2.5 px-3 text-center border-l text-[10px] text-muted-foreground font-medium">
                      {sheet.totalStudents} студ.
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Printable Signature Section */}
          <div className="hidden print:grid grid-cols-3 gap-6 pt-8 text-xs">
            <div className="space-y-4">
              <div>Директор лицея: ___________________</div>
              <div>«___» ____________ 2026 г.</div>
            </div>
            <div className="space-y-4">
              <div>Зам. директора по УР: ___________________</div>
              <div>«___» ____________ 2026 г.</div>
            </div>
            <div className="space-y-4">
              <div>Куратор группы ({sheet.curatorName || "ФИО"}): ___________________</div>
              <div>«___» ____________ 2026 г.</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
