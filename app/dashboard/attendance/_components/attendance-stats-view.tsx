"use client";

import React, { useState, useEffect, useTransition, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Building2,
  BookOpen,
  Calendar as CalendarIcon,
  Search,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  Loader2,
  Crown,
  ArrowUpDown,
  FileSpreadsheet,
  Layers,
  Sparkles,
} from "lucide-react";
import {
  GroupItemDTO,
  GroupSubjectItemDTO,
  AttendancePeriodStatsDTO,
  getAttendancePeriodStatsAction,
} from "../actions";
import { exportToExcel } from "@/lib/excel-export";
import { toast } from "@/components/ui/toast";

interface AttendanceStatsViewProps {
  groups: GroupItemDTO[];
  subjects: GroupSubjectItemDTO[];
  selectedGroupId: string;
  onGroupChange: (groupId: string) => void;
}

type PeriodPreset =
  | "THIS_WEEK"
  | "THIS_MONTH"
  | "LAST_MONTH"
  | "SEMESTER"
  | "ACADEMIC_YEAR"
  | "CUSTOM";

type SortField = "name" | "rate_asc" | "rate_desc" | "absent_desc";

const SORT_LABELS: Record<SortField, string> = {
  rate_desc: "Посещаемость (лучшие)",
  rate_asc: "Посещаемость (худшие)",
  absent_desc: "По пропускам (больше НБ)",
  name: "По алфавиту (ФИО)",
};

function formatDateRu(ymdStr: string): string {
  if (!ymdStr) return "—";
  const parts = ymdStr.split("-").map(Number);
  if (parts.length !== 3 || isNaN(parts[0])) return ymdStr;
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  return d.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getPresetLabel(p: PeriodPreset): string {
  switch (p) {
    case "THIS_WEEK":
      return "Текущая неделя";
    case "THIS_MONTH":
      return "Текущий месяц";
    case "LAST_MONTH":
      return "Прошлый месяц";
    case "SEMESTER":
      return "Семестр";
    case "ACADEMIC_YEAR":
      return "Учебный год";
    case "CUSTOM":
      return "Свой период";
    default:
      return "";
  }
}

function getPresetDates(preset: PeriodPreset): { start: string; end: string } {
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  switch (preset) {
    case "THIS_WEEK": {
      const day = now.getDay();
      const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(now);
      monday.setDate(diffToMonday);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return {
        start: monday.toISOString().split("T")[0],
        end: sunday.toISOString().split("T")[0],
      };
    }
    case "THIS_MONTH": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return {
        start: start.toISOString().split("T")[0],
        end: end.toISOString().split("T")[0],
      };
    }
    case "LAST_MONTH": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return {
        start: start.toISOString().split("T")[0],
        end: end.toISOString().split("T")[0],
      };
    }
    case "SEMESTER": {
      // Current semester (approx 6 months)
      const isSecondHalf = now.getMonth() >= 1 && now.getMonth() <= 6;
      const start = isSecondHalf
        ? new Date(now.getFullYear(), 0, 1)
        : new Date(now.getFullYear(), 8, 1);
      const end = isSecondHalf
        ? new Date(now.getFullYear(), 5, 30)
        : new Date(now.getFullYear() + 1, 0, 31);
      return {
        start: start.toISOString().split("T")[0],
        end: end.toISOString().split("T")[0],
      };
    }
    case "ACADEMIC_YEAR": {
      const academicYearStart =
        now.getMonth() >= 8
          ? new Date(now.getFullYear(), 8, 1)
          : new Date(now.getFullYear() - 1, 8, 1);
      const academicYearEnd =
        now.getMonth() >= 8
          ? new Date(now.getFullYear() + 1, 7, 31)
          : new Date(now.getFullYear(), 7, 31);
      return {
        start: academicYearStart.toISOString().split("T")[0],
        end: academicYearEnd.toISOString().split("T")[0],
      };
    }
    case "CUSTOM":
    default:
      return {
        start: todayStr,
        end: todayStr,
      };
  }
}

export function AttendanceStatsView({
  groups,
  subjects,
  selectedGroupId,
  onGroupChange,
}: AttendanceStatsViewProps) {
  const [isPending, startTransition] = useTransition();
  const [preset, setPreset] = useState<PeriodPreset>("THIS_MONTH");
  const [dates, setDates] = useState<{ start: string; end: string }>(() =>
    getPresetDates("THIS_MONTH")
  );
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("all");
  const [statsData, setStatsData] = useState<AttendancePeriodStatsDTO | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("rate_desc");

  const currentGroupObj = groups.find((g) => g.id === selectedGroupId);

  const fetchStats = (
    groupId: string,
    startDate: string,
    endDate: string,
    subjectId: string
  ) => {
    if (!groupId) return;
    startTransition(async () => {
      const res = await getAttendancePeriodStatsAction(
        groupId,
        startDate,
        endDate,
        subjectId === "all" ? undefined : subjectId
      );
      if (res.success && res.data) {
        setStatsData(res.data);
      } else {
        toast.add({
          title: res.error || "Не удалось загрузить сводную статистику",
          type: "error",
        });
      }
    });
  };

  useEffect(() => {
    fetchStats(selectedGroupId, dates.start, dates.end, selectedSubjectId);
  }, [selectedGroupId, dates.start, dates.end, selectedSubjectId]);

  const handlePresetSelect = (newPreset: PeriodPreset) => {
    setPreset(newPreset);
    if (newPreset !== "CUSTOM") {
      const newDates = getPresetDates(newPreset);
      setDates(newDates);
    }
  };

  // Filter and sort students
  const processedStudents = useMemo(() => {
    if (!statsData) return [];
    let list = [...statsData.students];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((s) => s.studentName.toLowerCase().includes(q));
    }

    list.sort((a, b) => {
      switch (sortField) {
        case "name":
          return a.studentName.localeCompare(b.studentName);
        case "rate_asc":
          return a.attendanceRate - b.attendanceRate;
        case "rate_desc":
          return b.attendanceRate - a.attendanceRate;
        case "absent_desc":
          return b.absentCount - a.absentCount;
        default:
          return 0;
      }
    });

    return list;
  }, [statsData, searchQuery, sortField]);

  // Export Excel (.xlsx)
  const handleExportExcel = () => {
    if (!statsData || !currentGroupObj) return;

    const selectedSubjectName =
      selectedSubjectId === "all"
        ? "Все дисциплины"
        : subjects.find((s) => s.id === selectedSubjectId)?.subjectName || "Предмет";

    const titleRow = [`Сводная ведомость посещаемости: Группа ${currentGroupObj.name}`];
    const periodRow = [`Период: ${dates.start} — ${dates.end}`];
    const subjectRow = [`Дисциплина: ${selectedSubjectName}`];
    const emptyRow: string[] = [];

    const headers = [
      "№",
      "Студент",
      "Всего занятий",
      "Был",
      "НБ (Неуваж.)",
      "Опоздал",
      "Уваж. (справка / отпрос)",
      "% Посещаемости",
    ];

    const rows = processedStudents.map((s, idx) => [
      idx + 1,
      s.studentName,
      s.totalLessons,
      s.presentCount,
      s.absentCount,
      s.lateCount,
      s.excusedCount,
      `${s.attendanceRate}%`,
    ]);

    const data = [titleRow, periodRow, subjectRow, emptyRow, headers, ...rows];
    const fileName = `Посещаемость_${currentGroupObj.name}_${dates.start}_${dates.end}.xlsx`;

    exportToExcel(data, fileName, "Посещаемость");
    toast.add({ title: "Файл Excel (.xlsx) успешно экспортирован!", type: "success" });
  };

  const handlePrint = () => {
    window.print();
  };

  const selectedSubjectObj =
    selectedSubjectId !== "all"
      ? subjects.find((s) => s.id === selectedSubjectId)
      : null;

  return (
    <div className="flex-1 min-h-0 flex flex-col text-xs">
      {/* Print Styles for Summary Attendance Sheet */}
      <style jsx global>{`
        @media screen {
          .attendance-printable-doc {
            display: none !important;
          }
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 15mm 15mm 15mm 15mm;
          }
          body {
            background: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          aside,
          header,
          nav,
          [data-sidebar="sidebar"],
          [data-slot="sidebar"],
          [data-slot="sidebar-gap"],
          [data-slot="sidebar-container"],
          [data-slot="sidebar-rail"],
          [data-slot="sidebar-trigger"],
          .screen-only-view,
          .no-print {
            display: none !important;
          }
          .attendance-printable-doc {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
            padding: 4mm 8mm !important;
            margin: 0 auto !important;
            color: #000000 !important;
            background: #ffffff !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          th, td {
            padding: 5px 8px !important;
          }
          thead {
            display: table-header-group;
          }
          tfoot {
            display: table-footer-group;
          }
        }
      `}</style>

      {/* Printable Document for Period Attendance Stats */}
      <div id="printable-attendance-stats" className="attendance-printable-doc font-sans text-black space-y-4">
        {/* Header */}
        <div className="border-b-2 border-black pb-3 text-center space-y-1">
          <div className="text-[10px] tracking-wider uppercase text-neutral-600 font-semibold">
            Учебная часть • Информационная система учета посещаемости
          </div>
          <h1 className="text-lg font-bold uppercase tracking-wide">
            Сводная ведомость посещаемости занятий
          </h1>
          <div className="text-xs font-semibold text-neutral-800">
            Группа: <strong>{currentGroupObj?.name ? `Группа ${currentGroupObj.name}` : "Все группы"}</strong>
            {selectedSubjectObj ? (
              <> • Дисциплина: <strong>{selectedSubjectObj.subjectName}</strong> ({selectedSubjectObj.teacherName})</>
            ) : (
              <> • Дисциплина: <strong>Все дисциплины учебного плана</strong></>
            )}
          </div>
          <div className="text-[11px] text-neutral-600">
            Период: <strong>{formatDateRu(dates.start)}</strong> — <strong>{formatDateRu(dates.end)}</strong>
            {" "}({getPresetLabel(preset)})
            {" • "}
            Дата формирования: <strong>{formatDateRu(new Date().toISOString().split("T")[0])}</strong>
          </div>
        </div>

        {!statsData ? (
          <div className="py-12 text-center text-xs text-neutral-600 font-medium">
            Загрузка сводных данных посещаемости...
          </div>
        ) : (
          <>
            {/* KPI Summary Block */}
            <div className="grid grid-cols-6 gap-2 border border-black p-2 text-center text-xs bg-neutral-50/50">
              <div>
                <div className="text-[10px] text-neutral-600">Всего занятий</div>
                <div className="font-bold text-sm font-mono">{statsData.totalLessons}</div>
              </div>
              <div>
                <div className="text-[10px] text-neutral-600">Ср. посещаемость</div>
                <div className="font-bold text-sm font-mono">{statsData.groupAttendanceRate}%</div>
              </div>
              <div>
                <div className="text-[10px] text-neutral-600">Присутствовали</div>
                <div className="font-bold text-sm font-mono">{statsData.totalPresent}</div>
              </div>
              <div>
                <div className="text-[10px] text-neutral-600">Пропуски (Н/Б)</div>
                <div className="font-bold text-sm font-mono">{statsData.totalAbsent}</div>
              </div>
              <div>
                <div className="text-[10px] text-neutral-600">Опоздания</div>
                <div className="font-bold text-sm font-mono">{statsData.totalLate}</div>
              </div>
              <div>
                <div className="text-[10px] text-neutral-600">Справки (уваж.)</div>
                <div className="font-bold text-sm font-mono">{statsData.totalExcused}</div>
              </div>
            </div>

            {/* Attendance Table */}
            <table className="w-full border-collapse border border-black text-[11px]">
              <thead>
                <tr className="bg-neutral-100 border-b border-black text-black">
                  <th className="border border-black p-1.5 w-8 text-center font-bold">№</th>
                  <th className="border border-black p-1.5 text-left font-bold">ФИО Студента</th>
                  <th className="border border-black p-1.5 w-20 text-center font-bold">Всего пар</th>
                  <th className="border border-black p-1.5 w-16 text-center font-bold">Был</th>
                  <th className="border border-black p-1.5 w-20 text-center font-bold">Н/Б (неув.)</th>
                  <th className="border border-black p-1.5 w-16 text-center font-bold">Опоздал</th>
                  <th className="border border-black p-1.5 w-20 text-center font-bold">Уваж.</th>
                  <th className="border border-black p-1.5 w-24 text-center font-bold">% Посещ.</th>
                </tr>
              </thead>
              <tbody>
                {processedStudents.map((st, idx) => (
                  <tr key={st.studentId} className="border-b border-black">
                    <td className="border border-black p-1.5 text-center font-mono">{idx + 1}</td>
                    <td className="border border-black p-1.5 font-medium">
                      {st.studentName}
                      {st.isMonitor && (
                        <span className="text-[10px] text-neutral-600 font-normal"> (староста)</span>
                      )}
                    </td>
                    <td className="border border-black p-1.5 text-center font-mono">{st.totalLessons}</td>
                    <td className="border border-black p-1.5 text-center font-mono font-semibold">{st.presentCount}</td>
                    <td className="border border-black p-1.5 text-center font-mono font-semibold">
                      {st.absentCount > 0 ? st.absentCount : 0}
                    </td>
                    <td className="border border-black p-1.5 text-center font-mono">{st.lateCount}</td>
                    <td className="border border-black p-1.5 text-center font-mono">{st.excusedCount}</td>
                    <td className="border border-black p-1.5 text-center font-mono font-bold">
                      {st.attendanceRate}%
                    </td>
                  </tr>
                ))}
                {processedStudents.length === 0 && (
                  <tr>
                    <td colSpan={8} className="border border-black p-4 text-center text-neutral-500">
                      За выбранный период записей посещаемости не найдено
                    </td>
                  </tr>
                )}
              </tbody>
              {processedStudents.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-black bg-neutral-100 font-bold">
                    <td colSpan={2} className="border border-black p-1.5 text-right font-bold">
                      ИТОГО ПО ГРУППЕ:
                    </td>
                    <td className="border border-black p-1.5 text-center font-mono">
                      {statsData.totalLessons}
                    </td>
                    <td className="border border-black p-1.5 text-center font-mono">
                      {statsData.totalPresent}
                    </td>
                    <td className="border border-black p-1.5 text-center font-mono">
                      {statsData.totalAbsent}
                    </td>
                    <td className="border border-black p-1.5 text-center font-mono">
                      {statsData.totalLate}
                    </td>
                    <td className="border border-black p-1.5 text-center font-mono">
                      {statsData.totalExcused}
                    </td>
                    <td className="border border-black p-1.5 text-center font-mono font-bold">
                      {statsData.groupAttendanceRate}%
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>

            {/* Signatures block */}
            <div className="pt-6 space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-6">
                  <div className="font-semibold">Куратор группы:</div>
                  <div className="border-b border-black text-[10px] text-neutral-500 pb-0.5">
                    (подпись / расшифровка)
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="font-semibold">Староста группы:</div>
                  <div className="border-b border-black text-[10px] text-neutral-500 pb-0.5">
                    (подпись / расшифровка)
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="font-semibold">Зам. директора по УВР:</div>
                  <div className="border-b border-black text-[10px] text-neutral-500 pb-0.5">
                    (подпись / расшифровка)
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] text-neutral-500 pt-3 border-t border-neutral-300">
                <div>М.П. (Место для печати)</div>
                <div>Дата выдачи: «___» _____________ 20___ г.</div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Screen-only Interactive Content */}
      <div className="screen-only-view print:hidden flex-1 min-h-0 flex flex-col gap-2.5">
        {/* Filters & Range Toolbar */}
        <div className="bg-card p-2.5 sm:p-3 rounded-xl border shadow-2xs space-y-2 shrink-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2 items-center">
          {/* Group Selector */}
          <div className="lg:col-span-4">
            <Select value={selectedGroupId} onValueChange={onGroupChange}>
              <SelectTrigger className="h-8 text-xs bg-background font-medium">
                <div className="flex items-center gap-1.5 truncate">
                  <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
                  <SelectValue>
                    {currentGroupObj?.name ? `Группа ${currentGroupObj.name}` : "Выберите группу"}
                  </SelectValue>
                </div>
              </SelectTrigger>
              <SelectContent>
                {groups.map((g) => (
                  <SelectItem key={g.id} value={g.id} className="text-xs">
                    Группа {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subject Selector */}
          <div className="lg:col-span-4">
            <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
              <SelectTrigger className="h-8 text-xs bg-background font-medium">
                <div className="flex items-center gap-1.5 truncate">
                  <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />
                  <SelectValue>
                    {selectedSubjectId === "all"
                      ? "Все дисциплины группы"
                      : subjects.find((s) => s.id === selectedSubjectId)?.subjectName ||
                        "Все дисциплины"}
                  </SelectValue>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs font-medium">
                  Все дисциплины группы
                </SelectItem>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={s.id} className="text-xs">
                    {s.subjectName} ({s.teacherName})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Export & Print actions */}
          <div className="lg:col-span-4 flex items-center justify-end gap-1.5">
            <Button
              size="xs"
              variant="outline"
              onClick={handleExportExcel}
              disabled={!statsData || isPending}
              className="h-8 text-xs gap-1 border-primary/30 text-primary hover:bg-primary/10 font-medium cursor-pointer"
              title="Экспорт ведомости в формате Excel (.xlsx)"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Экспорт Excel</span>
            </Button>

            <Button
              size="xs"
              variant="outline"
              onClick={handlePrint}
              disabled={!statsData}
              className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
              title="Распечатать ведомость"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Печать</span>
            </Button>
          </div>
        </div>

        {/* Period Presets Bar */}
        <div className="pt-2 border-t flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5">
          <div className="flex items-center gap-1 flex-wrap bg-muted/60 p-1 rounded-lg border text-xs">
            <button
              type="button"
              onClick={() => handlePresetSelect("THIS_WEEK")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                preset === "THIS_WEEK"
                  ? "bg-background text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Неделя
            </button>
            <button
              type="button"
              onClick={() => handlePresetSelect("THIS_MONTH")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                preset === "THIS_MONTH"
                  ? "bg-background text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Текущий месяц
            </button>
            <button
              type="button"
              onClick={() => handlePresetSelect("LAST_MONTH")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                preset === "LAST_MONTH"
                  ? "bg-background text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Прошлый месяц
            </button>
            <button
              type="button"
              onClick={() => handlePresetSelect("SEMESTER")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                preset === "SEMESTER"
                  ? "bg-background text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Семестр
            </button>
            <button
              type="button"
              onClick={() => handlePresetSelect("ACADEMIC_YEAR")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                preset === "ACADEMIC_YEAR"
                  ? "bg-background text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Учебный год
            </button>
            <button
              type="button"
              onClick={() => handlePresetSelect("CUSTOM")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                preset === "CUSTOM"
                  ? "bg-background text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Свой период
            </button>
          </div>

          {/* Date Pickers for Custom Range */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
              <CalendarIcon className="h-3.5 w-3.5 text-primary" />
              <span>Период:</span>
            </div>
            <Input
              type="date"
              value={dates.start}
              onChange={(e) => {
                setPreset("CUSTOM");
                setDates((prev) => ({ ...prev, start: e.target.value }));
              }}
              className="h-7 text-xs bg-background w-32 font-mono"
            />
            <span className="text-muted-foreground">—</span>
            <Input
              type="date"
              value={dates.end}
              onChange={(e) => {
                setPreset("CUSTOM");
                setDates((prev) => ({ ...prev, end: e.target.value }));
              }}
              className="h-7 text-xs bg-background w-32 font-mono"
            />
          </div>
        </div>
      </div>

      {/* KPI Stat Cards Summary */}
      {statsData && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 shrink-0">
          {/* Card 1: Lessons Recorded */}
          <div className="p-2 sm:p-2.5 rounded-xl border bg-card space-y-0.5 shadow-2xs">
            <div className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Layers className="h-3.5 w-3.5 text-primary" />
              <span>Всего занятий</span>
            </div>
            <div className="text-base font-bold text-foreground">
              {statsData.totalLessons}{" "}
              <span className="text-[10px] text-muted-foreground font-normal">пар</span>
            </div>
          </div>

          {/* Card 2: Overall Attendance % */}
          <div className="p-2 sm:p-2.5 rounded-xl border bg-card space-y-0.5 shadow-2xs">
            <div className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Посещаемость</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span
                className={`text-base font-bold ${
                  statsData.groupAttendanceRate >= 85
                    ? "text-primary"
                    : statsData.groupAttendanceRate >= 70
                      ? "text-amber-600"
                      : "text-destructive"
                }`}
              >
                {statsData.groupAttendanceRate}%
              </span>
              <span className="text-[10px] text-muted-foreground">средняя</span>
            </div>
          </div>

          {/* Card 3: Present Count */}
          <div className="p-2 sm:p-2.5 rounded-xl border bg-card space-y-0.5 shadow-2xs">
            <div className="text-[11px] text-muted-foreground flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              <span>Присутствовали</span>
            </div>
            <div className="text-base font-bold text-primary">
              {statsData.totalPresent}{" "}
              <span className="text-[10px] text-muted-foreground font-normal">отметок</span>
            </div>
          </div>

          {/* Card 4: Absent (НБ) */}
          <div className="p-2 sm:p-2.5 rounded-xl border bg-card space-y-0.5 shadow-2xs">
            <div className="text-[11px] text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
              <span>Пропуски (Н/Б)</span>
            </div>
            <div className="text-base font-bold text-destructive">
              {statsData.totalAbsent}{" "}
              <span className="text-[10px] text-muted-foreground font-normal">неуваж.</span>
            </div>
          </div>

          {/* Card 5: Late (Опоздали) */}
          <div className="p-2 sm:p-2.5 rounded-xl border bg-card space-y-0.5 shadow-2xs">
            <div className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-amber-600" />
              <span>Опоздания</span>
            </div>
            <div className="text-base font-bold text-amber-600">
              {statsData.totalLate}{" "}
              <span className="text-[10px] text-muted-foreground font-normal">раз</span>
            </div>
          </div>

          {/* Card 6: Excused (Справки) */}
          <div className="p-2 sm:p-2.5 rounded-xl border bg-card space-y-0.5 shadow-2xs">
            <div className="text-[11px] text-muted-foreground flex items-center gap-1">
              <UserCheck className="h-3.5 w-3.5 text-blue-600" />
              <span>Справки (У/П)</span>
            </div>
            <div className="text-base font-bold text-blue-600">
              {statsData.totalExcused}{" "}
              <span className="text-[10px] text-muted-foreground font-normal">уваж.</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Aggregated Table */}
      <div className="bg-card rounded-xl border shadow-2xs overflow-hidden flex-1 min-h-0 flex flex-col">
        {/* Table Header Controls */}
        <div className="p-2 sm:px-3 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
              <Input
                placeholder="Поиск студента..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 text-xs pl-8 bg-background"
              />
            </div>

            <div className="text-xs text-muted-foreground font-medium hidden md:inline">
              Студентов в ведомости: {processedStudents.length}
            </div>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <ArrowUpDown className="h-3 w-3" /> Сортировка:
            </span>
            <Select value={sortField} onValueChange={(val) => setSortField(val as SortField)}>
              <SelectTrigger className="h-8 text-xs bg-background w-48 font-medium">
                <SelectValue>{SORT_LABELS[sortField] || "Сортировка"}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rate_desc" className="text-xs">
                  Посещаемость (лучшие)
                </SelectItem>
                <SelectItem value="rate_asc" className="text-xs">
                  Посещаемость (худшие)
                </SelectItem>
                <SelectItem value="absent_desc" className="text-xs">
                  По пропускам (больше НБ)
                </SelectItem>
                <SelectItem value="name" className="text-xs">
                  По алфавиту (ФИО)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Loading Spinner */}
        {isPending && (
          <div className="flex-1 flex items-center justify-center gap-2 text-xs text-muted-foreground p-8">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>Загрузка сводных данных за период...</span>
          </div>
        )}

        {/* Table Content */}
        {!isPending && (
          <div className="overflow-x-auto overflow-y-auto flex-1 min-h-[250px] md:min-h-0 pb-2">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 z-20 bg-muted/95 backdrop-blur-xs border-b shadow-2xs">
                <tr className="border-b text-[11px] text-muted-foreground font-semibold">
                  <th className="sticky top-0 z-20 bg-muted/95 backdrop-blur-xs py-2.5 px-3 w-10 text-center">№</th>
                  <th className="sticky top-0 z-20 bg-muted/95 backdrop-blur-xs py-2.5 px-3 min-w-[200px]">Студент</th>
                  <th className="sticky top-0 z-20 bg-muted/95 backdrop-blur-xs py-2.5 px-3 text-center">Всего пар</th>
                  <th className="sticky top-0 z-20 bg-muted/95 backdrop-blur-xs py-2.5 px-3 text-center text-primary">Был</th>
                  <th className="sticky top-0 z-20 bg-muted/95 backdrop-blur-xs py-2.5 px-3 text-center text-destructive">Н/Б</th>
                  <th className="sticky top-0 z-20 bg-muted/95 backdrop-blur-xs py-2.5 px-3 text-center text-amber-600">Опоздал</th>
                  <th className="sticky top-0 z-20 bg-muted/95 backdrop-blur-xs py-2.5 px-3 text-center text-blue-600">Уваж.</th>
                  <th className="sticky top-0 z-20 bg-muted/95 backdrop-blur-xs py-2.5 px-3 min-w-[170px] text-right">% Посещаемости</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {processedStudents.map((st, idx) => {
                  const rateColor =
                    st.attendanceRate >= 85
                      ? "text-primary border-primary/30 bg-primary/10"
                      : st.attendanceRate >= 70
                        ? "text-amber-600 border-amber-300 bg-amber-50"
                        : "text-destructive border-destructive/30 bg-destructive/10";

                  const barBg =
                    st.attendanceRate >= 85
                      ? "bg-primary"
                      : st.attendanceRate >= 70
                        ? "bg-amber-500"
                        : "bg-destructive";

                  return (
                    <tr key={st.studentId} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2 px-3 text-center font-mono text-[10px] text-muted-foreground">
                        {idx + 1}
                      </td>

                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6 border text-[10px] shrink-0">
                            <AvatarFallback className="bg-primary/10 text-primary font-bold text-[9px]">
                              {st.studentName ? st.studentName[0].toUpperCase() : "С"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <span className="font-semibold text-foreground truncate block">
                              {st.studentName}
                            </span>
                            {st.isMonitor && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] text-primary font-medium">
                                <Crown className="h-2.5 w-2.5" /> Староста
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-2 px-3 text-center font-mono font-medium">
                        {st.totalLessons}
                      </td>

                      <td className="py-2 px-3 text-center font-mono font-bold text-primary">
                        {st.presentCount}
                      </td>

                      <td className="py-2 px-3 text-center font-mono font-bold">
                        {st.absentCount > 0 ? (
                          <span className="text-destructive px-1.5 py-0.5 rounded bg-destructive/10">
                            {st.absentCount}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </td>

                      <td className="py-2 px-3 text-center font-mono font-medium">
                        {st.lateCount > 0 ? (
                          <span className="text-amber-600">{st.lateCount}</span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </td>

                      <td className="py-2 px-3 text-center font-mono font-medium">
                        {st.excusedCount > 0 ? (
                          <span className="text-blue-600">{st.excusedCount}</span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </td>

                      <td className="py-2 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Progress bar */}
                          <div className="w-20 bg-muted/80 h-1.5 rounded-full overflow-hidden border hidden sm:block">
                            <div
                              className={`h-full transition-all duration-300 ${barBg}`}
                              style={{ width: `${st.attendanceRate}%` }}
                            />
                          </div>

                          <Badge
                            variant="outline"
                            className={`text-[10px] font-bold font-mono px-2 py-0.5 shrink-0 ${rateColor}`}
                          >
                            {st.attendanceRate}%
                          </Badge>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {processedStudents.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground text-xs">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <UserCheck className="h-8 w-8 text-muted-foreground/30" />
                        <span className="font-semibold text-foreground">
                          За выбранный период записей посещаемости не найдено
                        </span>
                        <span className="text-[11px]">
                          Попробуйте изменить диапазон дат или выбрать другую дисциплину
                        </span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
