"use client";

import React, { useState, useTransition, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AttendanceStatus } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
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
  UserCheck,
  CheckCheck,
  Printer,
  ChevronLeft,
  ChevronRight,
  Building2,
  BookOpen,
  Calendar as CalendarIcon,
  Crown,
  Search,
  X,
  AlertCircle,
  CheckCircle2,
  Save,
  Loader2,
  RotateCcw,
  AlertTriangle,
  Clock,
  Shield,
  RefreshCw,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  GroupItemDTO,
  GroupSubjectItemDTO,
  saveBatchAttendanceAction,
  clearAttendanceAction,
} from "../actions";
import { toast } from "@/components/ui/toast";

interface StudentInfo {
  studentId: string;
  studentName: string;
  isMonitor: boolean;
}

interface AttendanceViewProps {
  userRole: string;
  groups: GroupItemDTO[];
  subjects: GroupSubjectItemDTO[];
  students: StudentInfo[];
  attendanceMap: Record<string, { status: AttendanceStatus; comment: string }>;
  dutyMap?: Record<string, { isDuty: boolean; isLeader: boolean }>;
  selectedGroupId: string;
  selectedGroupSubjectId: string;
  dateStr: string;
  canEdit?: boolean;
}

type FilterStatusTab = "ALL" | AttendanceStatus;

export function AttendanceView({
  userRole,
  groups = [],
  subjects = [],
  students = [],
  attendanceMap = {},
  dutyMap = {},
  selectedGroupId,
  selectedGroupSubjectId,
  dateStr,
  canEdit = false,
}: AttendanceViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [currentGroupId, setCurrentGroupId] = useState<string>(selectedGroupId);
  const [currentSubjectId, setCurrentSubjectId] = useState<string>(selectedGroupSubjectId);
  const [currentDateStr, setCurrentDateStr] = useState<string>(dateStr);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilterTab, setStatusFilterTab] = useState<FilterStatusTab>("ALL");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state when props change
  useEffect(() => {
    setCurrentGroupId(selectedGroupId);
  }, [selectedGroupId]);

  useEffect(() => {
    setCurrentSubjectId(selectedGroupSubjectId);
  }, [selectedGroupSubjectId]);

  useEffect(() => {
    setCurrentDateStr(dateStr);
  }, [dateStr]);

  // Local state for attendance records: key = studentId
  const [records, setRecords] = useState<
    Record<string, { status: AttendanceStatus; comment: string }>
  >(() => {
    const initial: Record<string, { status: AttendanceStatus; comment: string }> = {};
    students.forEach((st) => {
      initial[st.studentId] = {
        status: attendanceMap[st.studentId]?.status || AttendanceStatus.PRESENT,
        comment: attendanceMap[st.studentId]?.comment || "",
      };
    });
    return initial;
  });

  useEffect(() => {
    const initial: Record<string, { status: AttendanceStatus; comment: string }> = {};
    students.forEach((st) => {
      initial[st.studentId] = {
        status: attendanceMap[st.studentId]?.status || AttendanceStatus.PRESENT,
        comment: attendanceMap[st.studentId]?.comment || "",
      };
    });
    setRecords(initial);
    setHasUnsavedChanges(false);
  }, [attendanceMap, students]);

  const isAdminOrTeacher = userRole === "ADMIN" || userRole === "TEACHER" || canEdit;
  const currentGroupObj = groups.find((g) => g.id === currentGroupId);
  const currentSubjectObj = subjects.find((s) => s.id === currentSubjectId);

  // Safe Timezone-Independent Date Helpers
  const parseYMD = (s: string) => {
    const [y, m, d] = (s || "").split("-").map(Number);
    return { year: y || 2026, month: (m || 1) - 1, day: d || 1 };
  };

  const formatYMD = (year: number, monthIndex: number, day: number) => {
    const dt = new Date(year, monthIndex, day);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const d = String(dt.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const formatDisplayDate = (ymdStr: string) => {
    const { year, month, day } = parseYMD(ymdStr);
    return new Date(year, month, day).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const shiftDate = (daysDelta: number) => {
    const { year, month, day } = parseYMD(currentDateStr);
    const newDateStr = formatYMD(year, month, day + daysDelta);
    setCurrentDateStr(newDateStr);
    startTransition(() => {
      router.push(
        `/dashboard/attendance?group=${currentGroupId}&subject=${currentSubjectId}&date=${newDateStr}`
      );
    });
  };

  const setDateToToday = () => {
    const now = new Date();
    const newDateStr = formatYMD(now.getFullYear(), now.getMonth(), now.getDate());
    setCurrentDateStr(newDateStr);
    startTransition(() => {
      router.push(
        `/dashboard/attendance?group=${currentGroupId}&subject=${currentSubjectId}&date=${newDateStr}`
      );
    });
  };

  // Update filters with transition
  const handleGroupChange = (val: string) => {
    setCurrentGroupId(val);
    setCurrentSubjectId("");
    startTransition(() => {
      router.push(`/dashboard/attendance?group=${val}&date=${currentDateStr}`);
    });
  };

  const handleSubjectChange = (val: string) => {
    setCurrentSubjectId(val);
    startTransition(() => {
      router.push(
        `/dashboard/attendance?group=${currentGroupId}&subject=${val}&date=${currentDateStr}`
      );
    });
  };

  const handleDateChange = (val: string) => {
    setCurrentDateStr(val);
    startTransition(() => {
      router.push(
        `/dashboard/attendance?group=${currentGroupId}&subject=${currentSubjectId}&date=${val}`
      );
    });
  };

  // Status Change Handler (In-memory ONLY, 0 DB queries)
  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setRecords((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], status },
    }));
    setHasUnsavedChanges(true);
  };

  // Comment Change Handler (In-memory ONLY, 0 DB queries)
  const handleCommentChange = (studentId: string, comment: string) => {
    setRecords((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], comment },
    }));
    setHasUnsavedChanges(true);
  };

  // Mark All Present (In-memory)
  const handleMarkAllPresent = () => {
    const updated: Record<string, { status: AttendanceStatus; comment: string }> = {};
    students.forEach((st) => {
      const comm = records[st.studentId]?.comment || "";
      updated[st.studentId] = { status: AttendanceStatus.PRESENT, comment: comm };
    });
    setRecords(updated);
    setHasUnsavedChanges(true);
  };

  // Single Batch Save to DB (1 single network request)
  const handleSaveAll = useCallback(() => {
    if (!currentSubjectId || students.length === 0) return;

    const batchList = students.map((st) => ({
      studentId: st.studentId,
      status: records[st.studentId]?.status || AttendanceStatus.PRESENT,
      comment: records[st.studentId]?.comment || "",
    }));

    startTransition(async () => {
      const res = await saveBatchAttendanceAction(currentSubjectId, currentDateStr, batchList);
      if (res.success) {
        setHasUnsavedChanges(false);
        toast.add({ title: "Журнал успешно сохранен в базу данных!", type: "success" });
      } else {
        toast.add({ title: res.error || "Ошибка при сохранении журнала", type: "error" });
      }
    });
  }, [currentSubjectId, currentDateStr, students, records]);

  // Clear / Annul attendance for this day
  const handleClearAttendance = useCallback(() => {
    if (!currentSubjectId) return;

    startTransition(async () => {
      const res = await clearAttendanceAction(currentSubjectId, currentDateStr);
      if (res.success) {
        const resetMap: Record<string, { status: AttendanceStatus; comment: string }> = {};
        students.forEach((st) => {
          resetMap[st.studentId] = { status: AttendanceStatus.PRESENT, comment: "" };
        });
        setRecords(resetMap);
        setHasUnsavedChanges(false);
        setIsClearDialogOpen(false);
        toast.add({ title: "Посещаемость за этот день успешно аннулирована", type: "success" });
      } else {
        toast.add({ title: res.error || "Ошибка аннулирования посещаемости", type: "error" });
      }
    });
  }, [currentSubjectId, currentDateStr, students]);

  // Keyboard shortcut Ctrl+S / Cmd+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (hasUnsavedChanges && !isPending) {
          handleSaveAll();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasUnsavedChanges, isPending, handleSaveAll]);

  const handlePrint = () => window.print();

  const totalStudents = students.length;
  let presentCount = 0;
  let absentCount = 0;
  let lateCount = 0;
  let excusedCount = 0;

  students.forEach((st) => {
    const stStatus = records[st.studentId]?.status || AttendanceStatus.PRESENT;
    if (stStatus === AttendanceStatus.PRESENT) presentCount++;
    else if (stStatus === AttendanceStatus.ABSENT) absentCount++;
    else if (stStatus === AttendanceStatus.LATE) lateCount++;
    else if (stStatus === AttendanceStatus.EXCUSED) excusedCount++;
  });

  // Filtered Students by Search and Status Tab
  const filteredStudents = useMemo(() => {
    return students.filter((st) => {
      const matchesSearch = st.studentName.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      const stStatus = records[st.studentId]?.status || AttendanceStatus.PRESENT;
      if (statusFilterTab === "ALL") return true;
      return stStatus === statusFilterTab;
    });
  }, [students, searchQuery, statusFilterTab, records]);

  // Calculate if any students scheduled on duty today are absent/excused
  const absentDutyInAttendance = useMemo(() => {
    return students.filter((st) => {
      const isDuty = dutyMap[st.studentId];
      const rec = records[st.studentId];
      return Boolean(
        isDuty &&
          (rec?.status === AttendanceStatus.ABSENT ||
            rec?.status === AttendanceStatus.EXCUSED)
      );
    });
  }, [students, dutyMap, records]);

  return (
    <div className="space-y-4 pb-8 text-xs font-sans">
      {/* Printable Sheet (Hidden on screen, Visible on print) */}
      <div id="printable-attendance-sheet" className="hidden print:block space-y-4">
        <div className="text-center border-b pb-4">
          <h1 className="text-lg font-bold uppercase">Журнал учета посещаемости занятий</h1>
          <div className="text-sm font-medium mt-1">
            Группа: {currentGroupObj?.name || "—"} | Предмет: {currentSubjectObj?.subjectName || "—"}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Преподаватель: {currentSubjectObj?.teacherName || "—"} | Дата: {formatDisplayDate(currentDateStr)}
          </div>
        </div>

        <table className="w-full border-collapse border border-foreground/20 text-xs">
          <thead>
            <tr className="bg-muted/40">
              <th className="border border-foreground/20 p-2 text-center w-12">№</th>
              <th className="border border-foreground/20 p-2 text-left">ФИО Учащегося</th>
              <th className="border border-foreground/20 p-2 text-center w-32">Статус</th>
              <th className="border border-foreground/20 p-2 text-left">Примечание</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((st, idx) => {
              const rec = records[st.studentId] || { status: AttendanceStatus.PRESENT, comment: "" };
              return (
                <tr key={st.studentId} className="border-b border-foreground/10">
                  <td className="border border-foreground/20 p-2 text-center font-mono">{idx + 1}</td>
                  <td className="border border-foreground/20 p-2 font-medium">{st.studentName}</td>
                  <td className="border border-foreground/20 p-2 text-center">
                    {rec.status === AttendanceStatus.PRESENT
                      ? "Был"
                      : rec.status === AttendanceStatus.ABSENT
                      ? "НБ"
                      : rec.status === AttendanceStatus.LATE
                      ? "Опоздал"
                      : "Справка"}
                  </td>
                  <td className="border border-foreground/20 p-2 text-muted-foreground">{rec.comment || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Screen Header */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-4 rounded-xl border">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-base font-bold text-foreground flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              <span>Электронный журнал посещаемости</span>
            </h1>
          </div>
          <p className="text-xs text-muted-foreground pl-6">
            Оперативная фиксация присутствия, интеграция с графиком дежурств и экспорт ведомостей
          </p>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2" data-tour="attendance-actions">
          {isAdminOrTeacher && (
            <>
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={handleMarkAllPresent}
                disabled={isPending || students.length === 0}
                className="h-8 text-xs gap-1.5 font-medium cursor-pointer"
                title="Отметить всех присутствующими"
              >
                <CheckCheck className="h-3.5 w-3.5 text-primary" />
                <span className="hidden sm:inline">Все были</span>
              </Button>

              <Button
                type="button"
                size="xs"
                onClick={handleSaveAll}
                disabled={isPending || !hasUnsavedChanges || students.length === 0}
                className={`h-8 text-xs gap-1.5 font-medium transition-all cursor-pointer ${
                  hasUnsavedChanges
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs ring-2 ring-primary/30"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 cursor-default"
                }`}
                title="Сохранить изменения в базу данных (Ctrl+S)"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Сохранение...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    <span>Сохранить</span>
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={() => setIsClearDialogOpen(true)}
                disabled={isPending || students.length === 0}
                className="h-8 text-xs gap-1.5 font-medium text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                title="Аннулировать отметки за этот день"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Аннулировать</span>
              </Button>
            </>
          )}

          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={handlePrint}
            className="h-8 text-xs gap-1.5 font-medium cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Печать</span>
          </Button>
        </div>
      </div>

      {/* Absent Duty Alerts Banner in Attendance */}
      {absentDutyInAttendance.length > 0 && (
        <div className="print:hidden p-3.5 rounded-xl border border-destructive/30 bg-destructive/5 text-destructive text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
            <span>
              <strong>Внимание:</strong> {absentDutyInAttendance.length === 1 ? "Студент" : "Студенты"}{" "}
              <strong>{absentDutyInAttendance.map((s) => s.studentName).join(", ")}</strong> назначен(ы) дежурным(и) на эту дату, но отмечен(ы) как отсутствующие.
            </span>
          </div>
          {currentGroupId && (
            <Link
              href={`/dashboard/duty?group=${currentGroupId}`}
              className="inline-flex items-center gap-1 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 px-2.5 py-1 rounded-md shrink-0 transition-colors shadow-2xs"
            >
              <RefreshCw className="h-3 w-3" /> Назначить замену в дежурствах ↗
            </Link>
          )}
        </div>
      )}

      {/* Screen Filters Bar */}
      <div className="print:hidden grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2 bg-card p-2.5 rounded-xl border items-center" data-tour="attendance-filters">
        {/* Group Selector */}
        <div className="sm:col-span-1 lg:col-span-3">
          <Select value={currentGroupId} onValueChange={handleGroupChange} disabled={isPending}>
            <SelectTrigger className="h-8 text-xs font-medium bg-background w-full">
              <div className="flex items-center gap-1.5 truncate">
                <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
                <SelectValue>{currentGroupObj?.name ? `Группа ${currentGroupObj.name}` : "Выберите группу"}</SelectValue>
              </div>
              {isPending && <Loader2 className="h-3 w-3 animate-spin text-primary ml-auto shrink-0" />}
            </SelectTrigger>
            <SelectContent>
              {groups.map((g) => (
                <SelectItem key={g.id} value={g.id} className="text-xs">Группа {g.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Subject Selector */}
        <div className="sm:col-span-1 lg:col-span-4">
          <Select value={currentSubjectId} onValueChange={handleSubjectChange} disabled={isPending}>
            <SelectTrigger className="h-8 text-xs font-medium bg-background w-full">
              <div className="flex items-center gap-1.5 truncate">
                <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />
                <SelectValue>
                  {currentSubjectObj ? `${currentSubjectObj.subjectName} (${currentSubjectObj.teacherName})` : "Выберите предмет"}
                </SelectValue>
              </div>
              {isPending && <Loader2 className="h-3 w-3 animate-spin text-primary ml-auto shrink-0" />}
            </SelectTrigger>
            <SelectContent>
              {subjects.map((s) => (
                <SelectItem key={s.id} value={s.id} className="text-xs">{s.subjectName} ({s.teacherName})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Selector with Next/Prev Day */}
        <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-1">
          <Button type="button" variant="outline" size="xs" onClick={() => shiftDate(-1)} disabled={isPending} className="h-8 w-8 p-0 shrink-0 cursor-pointer" title="Предыдущий день">
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Input type="date" value={currentDateStr} onChange={(e) => handleDateChange(e.target.value)} disabled={isPending} className="h-8 text-xs bg-background font-medium flex-1 min-w-0 text-center" />
          <Button type="button" variant="outline" size="xs" onClick={() => shiftDate(1)} disabled={isPending} className="h-8 w-8 p-0 shrink-0 cursor-pointer" title="Следующий день">
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
          <Button type="button" variant="ghost" size="xs" onClick={setDateToToday} disabled={isPending} className="h-8 px-2 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer shrink-0">
            Сегодня
          </Button>
        </div>

        {/* Search Student Box */}
        <div className="sm:col-span-2 lg:col-span-2 relative">
          <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
          <Input placeholder="Поиск учащегося..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-8 text-xs pl-8 pr-7 bg-background" />
          {searchQuery && <button type="button" onClick={() => setSearchQuery("")} className="absolute right-2 top-2 text-muted-foreground hover:text-foreground cursor-pointer"><X className="h-3.5 w-3.5" /></button>}
        </div>
      </div>

      {/* Attendance Table with Status Tabs Header */}
      <Card className="relative print:hidden p-0 border overflow-hidden" data-tour="attendance-table">
        {/* Loading Overlay */}
        {isPending && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/50 backdrop-blur-[1px] transition-all">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border shadow-xs text-xs text-foreground font-medium">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              <span>Загрузка данных...</span>
            </div>
          </div>
        )}

        {/* Status Filter Tabs in Card Header */}
        <div className="p-2.5 border-b bg-muted/20 flex items-center gap-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => setStatusFilterTab("ALL")}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              statusFilterTab === "ALL"
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            Все ({totalStudents})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilterTab(AttendanceStatus.PRESENT)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              statusFilterTab === AttendanceStatus.PRESENT
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            Присутствуют ({presentCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilterTab(AttendanceStatus.ABSENT)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              statusFilterTab === AttendanceStatus.ABSENT
                ? "bg-destructive text-white shadow-2xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            Отсутствуют ({absentCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilterTab(AttendanceStatus.LATE)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              statusFilterTab === AttendanceStatus.LATE
                ? "bg-amber-500 text-white shadow-2xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            Опоздали ({lateCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilterTab(AttendanceStatus.EXCUSED)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              statusFilterTab === AttendanceStatus.EXCUSED
                ? "bg-sky-500 text-white shadow-2xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            Справка ({excusedCount})
          </button>
        </div>

        <CardContent className="p-0">
          <div className="divide-y text-xs">
            {/* Desktop Table Header */}
            <div className="hidden md:grid md:grid-cols-[36px_1fr_auto_240px] lg:grid-cols-[40px_1fr_auto_280px] items-center gap-3 px-3.5 py-2 bg-muted/40 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              <span className="text-center">№</span>
              <span>Студент</span>
              <span className="text-center">Статус</span>
              <span>Примечание</span>
            </div>

            {filteredStudents.map((st, idx) => {
              const rec = records[st.studentId] || { status: AttendanceStatus.PRESENT, comment: "" };
              const dutyInfo = dutyMap[st.studentId];
              const isAbsentDuty = Boolean(
                dutyInfo &&
                  (rec.status === AttendanceStatus.ABSENT ||
                    rec.status === AttendanceStatus.EXCUSED)
              );

              const borderAccentColor =
                rec.status === AttendanceStatus.ABSENT
                  ? "border-l-4 border-l-destructive bg-destructive/5"
                  : rec.status === AttendanceStatus.LATE
                  ? "border-l-4 border-l-amber-500 bg-amber-500/5"
                  : rec.status === AttendanceStatus.EXCUSED
                  ? "border-l-4 border-l-sky-500 bg-sky-500/5"
                  : "border-l-4 border-l-primary/40 hover:bg-muted/20";

              return (
                <div
                  key={st.studentId}
                  className={`transition-colors ${borderAccentColor}`}
                >
                  {/* DESKTOP ROW (md and up) */}
                  <div className="hidden md:grid md:grid-cols-[36px_1fr_auto_240px] lg:grid-cols-[40px_1fr_auto_280px] items-center gap-3 px-3.5 py-2">
                    <span className="text-center text-[11px] font-mono text-muted-foreground">{idx + 1}</span>
                    <div className="flex items-center gap-2 font-medium min-w-0 flex-wrap">
                      <Avatar className="h-6 w-6 border shrink-0">
                        <AvatarFallback className="text-[9px] font-bold bg-primary/10 text-primary">
                          {st.studentName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate text-foreground text-xs">{st.studentName}</span>
                      {st.isMonitor && (
                        <Badge variant="outline" className="text-[9px] py-0 px-1 h-3.5 gap-0.5 border-primary/30 text-primary font-medium shrink-0">
                          <Crown className="h-2.5 w-2.5" /> Староста
                        </Badge>
                      )}
                      {dutyInfo && (
                        <Badge
                          variant="outline"
                          className={`text-[9px] py-0 px-1.5 h-3.5 gap-0.5 font-medium shrink-0 ${
                            isAbsentDuty
                              ? "border-destructive/40 bg-destructive/10 text-destructive"
                              : "border-primary/40 bg-primary/10 text-primary"
                          }`}
                          title={dutyInfo.isLeader ? "Ответственный / старший дежурный на сегодня" : "Дежурный на сегодня"}
                        >
                          <Clock className="h-2.5 w-2.5" />
                          {dutyInfo.isLeader ? "Старший дежурный" : "Дежурный"}
                        </Badge>
                      )}
                      {isAbsentDuty && (
                        <span className="text-[10px] text-destructive font-semibold flex items-center gap-0.5">
                          <AlertTriangle className="h-3 w-3 shrink-0" />
                          <span>Дежурит сегодня!</span>
                          <Link
                            href={`/dashboard/duty?group=${currentGroupId}`}
                            className="underline text-primary hover:opacity-80 ml-0.5"
                            title="Перейти в график дежурств для назначения замены"
                          >
                            Заменить ↗
                          </Link>
                        </span>
                      )}
                    </div>

                    {isAdminOrTeacher ? (
                      <div className="grid grid-cols-4 gap-0.5 p-0.5 bg-muted/60 rounded-lg border text-xs shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(st.studentId, AttendanceStatus.PRESENT)}
                          className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors cursor-pointer ${
                            rec.status === AttendanceStatus.PRESENT
                              ? "bg-primary text-primary-foreground shadow-2xs"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          }`}
                          title="Присутствует"
                        >
                          Был
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(st.studentId, AttendanceStatus.ABSENT)}
                          className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors cursor-pointer ${
                            rec.status === AttendanceStatus.ABSENT
                              ? "bg-destructive text-white shadow-2xs"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          }`}
                          title="Отсутствует (НБ)"
                        >
                          НБ
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(st.studentId, AttendanceStatus.LATE)}
                          className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors cursor-pointer ${
                            rec.status === AttendanceStatus.LATE
                              ? "bg-amber-500 text-white shadow-2xs"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          }`}
                          title="Опоздал"
                        >
                          Опоздал
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(st.studentId, AttendanceStatus.EXCUSED)}
                          className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors cursor-pointer ${
                            rec.status === AttendanceStatus.EXCUSED
                              ? "bg-sky-500 text-white shadow-2xs"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          }`}
                          title="Уважительная причина (справка)"
                        >
                          Справка
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-center">
                        <Badge
                          variant="outline"
                          className={`text-[11px] font-medium ${
                            rec.status === AttendanceStatus.PRESENT
                              ? "bg-primary/10 text-primary border-primary/20"
                              : rec.status === AttendanceStatus.ABSENT
                              ? "bg-destructive/10 text-destructive border-destructive/20"
                              : rec.status === AttendanceStatus.LATE
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                              : "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20"
                          }`}
                        >
                          {rec.status === "PRESENT"
                            ? "Присутствует"
                            : rec.status === "ABSENT"
                            ? "Отсутствует (НБ)"
                            : rec.status === "LATE"
                            ? "Опоздал"
                            : "Справка"}
                        </Badge>
                      </div>
                    )}

                    <div>
                      {isAdminOrTeacher ? (
                        <Input
                          placeholder="Примечание..."
                          value={rec.comment}
                          onChange={(e) => handleCommentChange(st.studentId, e.target.value)}
                          className="h-7 text-xs bg-background"
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground truncate block">
                          {rec.comment || "—"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* MOBILE CARD VIEW (< md) */}
                  <div className="md:hidden p-3 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-[11px] font-mono text-muted-foreground shrink-0 w-4 text-center">{idx + 1}</span>
                        <Avatar className="h-7 w-7 border shrink-0">
                          <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                            {st.studentName.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-foreground text-xs leading-snug break-words">
                              {st.studentName}
                            </span>
                            {st.isMonitor && (
                              <Badge variant="outline" className="text-[9px] py-0 px-1 h-3.5 gap-0.5 border-primary/30 text-primary font-medium shrink-0">
                                <Crown className="h-2.5 w-2.5" /> Староста
                              </Badge>
                            )}
                            {dutyInfo && (
                              <Badge
                                variant="outline"
                                className={`text-[9px] py-0 px-1.5 h-3.5 gap-0.5 font-medium shrink-0 ${
                                  isAbsentDuty
                                    ? "border-destructive/40 bg-destructive/10 text-destructive"
                                    : "border-primary/40 bg-primary/10 text-primary"
                                }`}
                              >
                                <Clock className="h-2.5 w-2.5" />
                                {dutyInfo.isLeader ? "Старший дежурный" : "Дежурный"}
                              </Badge>
                            )}
                          </div>
                          {isAbsentDuty && (
                            <div className="text-[10px] text-destructive font-semibold flex items-center gap-1 mt-1">
                              <AlertTriangle className="h-3 w-3 shrink-0" />
                              <span>Назначен дежурным!</span>
                              <Link
                                href={`/dashboard/duty?group=${currentGroupId}`}
                                className="underline text-primary"
                              >
                                Заменить ↗
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>

                      {!isAdminOrTeacher && (
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-medium shrink-0 ${
                            rec.status === AttendanceStatus.PRESENT
                              ? "bg-primary/10 text-primary border-primary/20"
                              : rec.status === AttendanceStatus.ABSENT
                              ? "bg-destructive/10 text-destructive border-destructive/20"
                              : rec.status === AttendanceStatus.LATE
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                              : "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20"
                          }`}
                        >
                          {rec.status === "PRESENT"
                            ? "Присутствует"
                            : rec.status === "ABSENT"
                            ? "Отсутствует (НБ)"
                            : rec.status === "LATE"
                            ? "Опоздал"
                            : "Справка"}
                        </Badge>
                      )}
                    </div>

                    {isAdminOrTeacher && (
                      <div className="grid grid-cols-4 gap-1 p-1 bg-muted/60 rounded-lg border text-xs">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(st.studentId, AttendanceStatus.PRESENT)}
                          className={`py-1.5 rounded-md text-xs font-medium transition-colors text-center cursor-pointer ${
                            rec.status === AttendanceStatus.PRESENT
                              ? "bg-primary text-primary-foreground shadow-2xs"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          }`}
                        >
                          Был
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(st.studentId, AttendanceStatus.ABSENT)}
                          className={`py-1.5 rounded-md text-xs font-medium transition-colors text-center cursor-pointer ${
                            rec.status === AttendanceStatus.ABSENT
                              ? "bg-destructive text-white shadow-2xs"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          }`}
                        >
                          НБ
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(st.studentId, AttendanceStatus.LATE)}
                          className={`py-1.5 rounded-md text-xs font-medium transition-colors text-center cursor-pointer ${
                            rec.status === AttendanceStatus.LATE
                              ? "bg-amber-500 text-white shadow-2xs"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          }`}
                        >
                          Опоздал
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(st.studentId, AttendanceStatus.EXCUSED)}
                          className={`py-1.5 rounded-md text-xs font-medium transition-colors text-center cursor-pointer ${
                            rec.status === AttendanceStatus.EXCUSED
                              ? "bg-sky-500 text-white shadow-2xs"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          }`}
                        >
                          Справка
                        </button>
                      </div>
                    )}

                    {isAdminOrTeacher ? (
                      <Input
                        placeholder="Примечание (причина, комментарий...)"
                        value={rec.comment}
                        onChange={(e) => handleCommentChange(st.studentId, e.target.value)}
                        className="h-8 text-xs bg-background w-full"
                      />
                    ) : (
                      rec.comment && (
                        <div className="text-[11px] text-muted-foreground bg-muted/30 px-2.5 py-1.5 rounded border">
                          Примечание: {rec.comment}
                        </div>
                      )
                    )}
                  </div>
                </div>
              );
            })}

            {filteredStudents.length === 0 && (
              <div className="py-8 text-center text-muted-foreground text-xs">
                Учащиеся не найдены
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Annulment Confirmation Modal */}
      <AlertDialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
        <AlertDialogContent className="p-4 gap-3 text-xs sm:max-w-[400px]">
          <AlertDialogHeader className="text-left place-items-start gap-1">
            <AlertDialogTitle className="flex items-center gap-2 text-sm font-bold text-destructive">
              <AlertTriangle className="h-4 w-4" /> Аннулировать посещаемость?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Вы действительно хотите удалить все отметки посещаемости группы{" "}
              <strong className="text-foreground">{currentGroupObj?.name || ""}</strong> по предмету{" "}
              <strong className="text-foreground">{currentSubjectObj?.subjectName || ""}</strong> за дату{" "}
              <strong className="text-foreground">
                {formatDisplayDate(currentDateStr)}
              </strong>
              ? Это действие удалит сохраненные записи из базы данных.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => setIsClearDialogOpen(false)}
              disabled={isPending}
              className="h-7 px-3 text-xs"
            >
              Отмена
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="xs"
              onClick={handleClearAttendance}
              disabled={isPending}
              className="h-7 px-3 text-xs"
            >
              {isPending ? "Аннулирование..." : "Аннулировать"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
