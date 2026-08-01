"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AttendanceStatus } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  Building2,
  BookOpen,
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle,
  Clock,
  Crown,
  Save,
  Search,
  Users,
} from "lucide-react";
import {
  GroupItemDTO,
  GroupSubjectItemDTO,
  saveStudentAttendanceAction,
  saveBatchAttendanceAction,
} from "../actions";

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
  selectedGroupId: string;
  selectedGroupSubjectId: string;
  dateStr: string;
  canEdit?: boolean;
}

export function AttendanceView({
  userRole,
  groups = [],
  subjects = [],
  students = [],
  attendanceMap = {},
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
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  const isAdminOrTeacher = userRole === "ADMIN" || userRole === "TEACHER" || canEdit;
  const currentGroupObj = groups.find((g) => g.id === currentGroupId);
  const currentSubjectObj = subjects.find((s) => s.id === currentSubjectId);

  // Update filters
  const handleGroupChange = (val: string) => {
    setCurrentGroupId(val);
    router.push(`/dashboard/attendance?group=${val}&date=${currentDateStr}`);
  };

  const handleSubjectChange = (val: string) => {
    setCurrentSubjectId(val);
    router.push(
      `/dashboard/attendance?group=${currentGroupId}&subject=${val}&date=${currentDateStr}`
    );
  };

  const handleDateChange = (val: string) => {
    setCurrentDateStr(val);
    router.push(
      `/dashboard/attendance?group=${currentGroupId}&subject=${currentSubjectId}&date=${val}`
    );
  };

  // Status Change Handler
  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));

    if (currentSubjectId) {
      startTransition(async () => {
        await saveStudentAttendanceAction(
          currentSubjectId,
          studentId,
          currentDateStr,
          status,
          records[studentId]?.comment
        );
      });
    }
  };

  // Comment Change Handler
  const handleCommentChange = (studentId: string, comment: string) => {
    setRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        comment,
      },
    }));
  };

  // Comment Blur Handler (Save to DB)
  const handleCommentBlur = (studentId: string) => {
    if (currentSubjectId && records[studentId]) {
      startTransition(async () => {
        await saveStudentAttendanceAction(
          currentSubjectId,
          studentId,
          currentDateStr,
          records[studentId].status,
          records[studentId].comment
        );
      });
    }
  };

  // Mark All Present
  const handleMarkAllPresent = () => {
    setErrorMsg(null);
    const updated: Record<string, { status: AttendanceStatus; comment: string }> = {};
    const batchList: { studentId: string; status: AttendanceStatus; comment: string }[] = [];

    students.forEach((st) => {
      const comm = records[st.studentId]?.comment || "";
      updated[st.studentId] = { status: AttendanceStatus.PRESENT, comment: comm };
      batchList.push({ studentId: st.studentId, status: AttendanceStatus.PRESENT, comment: comm });
    });

    setRecords(updated);

    if (currentSubjectId) {
      startTransition(async () => {
        const res = await saveBatchAttendanceAction(currentSubjectId, currentDateStr, batchList);
        if (res.success) {
          setSuccessMsg("Все студенты отмечены присутствующими!");
          setTimeout(() => setSuccessMsg(null), 3000);
        } else {
          setErrorMsg(res.error || "Ошибка сохранения посещаемости");
        }
      });
    }
  };

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  // Calculate Metrics
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

  const attendancePercent =
    totalStudents > 0 ? Math.round(((presentCount + lateCount) / totalStudents) * 100) : 100;

  // Filtered Students by Search Query
  const filteredStudents = students.filter((st) =>
    st.studentName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4 pb-8 text-xs">
      {/* Dynamic Print CSS */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-attendance-sheet, #printable-attendance-sheet * {
            visibility: visible;
          }
          #printable-attendance-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            background: white !important;
            color: black !important;
          }
        }
      `}</style>

      {/* Printable Sheet (Hidden on Screen, Visible on Print) */}
      <div id="printable-attendance-sheet" className="hidden print:block space-y-6 font-sans">
        <div className="text-center border-b-2 border-black pb-4 space-y-1">
          <h1 className="text-xl font-bold uppercase tracking-wider">КЛАССНЫЙ ЖУРНАЛ ПОСЕЩАЕМОСТИ</h1>
          <div className="text-sm font-semibold">
            Группа: <strong>{currentGroupObj?.name || "—"}</strong> | Дисциплина: <strong>{currentSubjectObj?.subjectName || "—"}</strong>
          </div>
          <div className="text-xs text-gray-600">
            Преподаватель: {currentSubjectObj?.teacherName || "—"} | Дата: {new Date(currentDateStr).toLocaleDateString("ru-RU")}
          </div>
        </div>

        <table className="w-full border-collapse border border-black text-xs">
          <thead>
            <tr className="bg-gray-100 border-b border-black text-left">
              <th className="border border-black p-2 w-10 text-center">№</th>
              <th className="border border-black p-2">Ф.И.О. Учащегося</th>
              <th className="border border-black p-2 w-36 text-center">Статус</th>
              <th className="border border-black p-2">Примечание</th>
            </tr>
          </thead>
          <tbody>
            {students.map((st, idx) => {
              const rec = records[st.studentId];
              const statusText =
                rec?.status === AttendanceStatus.PRESENT
                  ? "Присутствует"
                  : rec?.status === AttendanceStatus.ABSENT
                  ? "Отсутствует"
                  : rec?.status === AttendanceStatus.LATE
                  ? "Опоздал"
                  : "Уважительная";

              return (
                <tr key={st.studentId} className="border-b border-black">
                  <td className="border border-black p-2 text-center">{idx + 1}</td>
                  <td className="border border-black p-2 font-medium">
                    {st.studentName} {st.isMonitor ? "(Староста)" : ""}
                  </td>
                  <td className="border border-black p-2 text-center font-bold">{statusText}</td>
                  <td className="border border-black p-2">{rec?.comment || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="pt-8 grid grid-cols-2 gap-8 text-xs">
          <div>
            Преподаватель: _____________________ / ({currentSubjectObj?.teacherName || "Ф.И.О."})
          </div>
          <div className="text-right">
            Завуч по УР: _____________________ / (Ф.И.О.)
          </div>
        </div>
      </div>

      {/* Screen Navigation Header */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-4 rounded-xl border">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href={currentGroupId ? `/dashboard/groups/${currentGroupId}` : "/dashboard/groups"}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-base font-bold text-foreground flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" /> Журнал посещаемости занятий
            </h1>
          </div>
          <p className="text-xs text-muted-foreground pl-6">
            Оперативный учет присутствия, причин отсутствия и опозданий учащихся
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="xs" onClick={handlePrint} className="h-8 text-xs gap-1.5">
            <Printer className="h-3.5 w-3.5" /> Печать бланка
          </Button>

          {isAdminOrTeacher && (
            <Button
              size="xs"
              onClick={handleMarkAllPresent}
              disabled={isPending || students.length === 0}
              className="h-8 text-xs gap-1.5"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Отметить всех присутствующими
            </Button>
          )}
        </div>
      </div>

      {/* Screen Filters Bar */}
      <div className="print:hidden grid grid-cols-1 sm:grid-cols-3 gap-3 bg-card p-3 rounded-xl border">
        {/* Group Selector */}
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-primary" /> Учебная группа
          </label>
          <Select value={currentGroupId} onValueChange={handleGroupChange}>
            <SelectTrigger className="h-8 text-xs font-semibold bg-background">
              <SelectValue>{currentGroupObj?.name || "Выберите группу"}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {groups.map((g) => (
                <SelectItem key={g.id} value={g.id} className="text-xs font-medium">
                  Группа {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Subject Selector */}
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5 text-primary" /> Дисциплина / Предмет
          </label>
          <Select value={currentSubjectId} onValueChange={handleSubjectChange}>
            <SelectTrigger className="h-8 text-xs font-semibold bg-background">
              <SelectValue>
                {currentSubjectObj
                  ? `${currentSubjectObj.subjectName} (${currentSubjectObj.teacherName})`
                  : "Выберите предмет"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {subjects.map((s) => (
                <SelectItem key={s.id} value={s.id} className="text-xs font-medium">
                  {s.subjectName} ({s.teacherName})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Selector */}
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
            <CalendarIcon className="h-3.5 w-3.5 text-primary" /> Дата занятия
          </label>
          <Input
            type="date"
            value={currentDateStr}
            onChange={(e) => handleDateChange(e.target.value)}
            className="h-8 text-xs bg-background font-medium"
          />
        </div>
      </div>

      {/* KPI Metrics Summary Bar */}
      <div className="print:hidden grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* KPI 1: Present */}
        <div className="bg-card p-3 rounded-xl border flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-[10px] text-muted-foreground font-medium">Присутствуют</div>
            <div className="text-base font-bold text-primary">
              {presentCount} чел.
            </div>
          </div>
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </div>

        {/* KPI 2: Absent */}
        <div className="bg-card p-3 rounded-xl border flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-[10px] text-muted-foreground font-medium">Отсутствуют</div>
            <div className="text-base font-bold text-destructive">
              {absentCount} чел.
            </div>
          </div>
          <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive">
            <AlertCircle className="h-4 w-4" />
          </div>
        </div>

        {/* KPI 3: Late */}
        <div className="bg-card p-3 rounded-xl border flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-[10px] text-muted-foreground font-medium">Опоздали</div>
            <div className="text-base font-bold text-primary">
              {lateCount} чел.
            </div>
          </div>
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Clock className="h-4 w-4" />
          </div>
        </div>

        {/* KPI 4: Excused */}
        <div className="bg-card p-3 rounded-xl border flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-[10px] text-muted-foreground font-medium">Уважительная</div>
            <div className="text-base font-bold text-foreground">
              {excusedCount} чел.
            </div>
          </div>
          <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
            <Users className="h-4 w-4" />
          </div>
        </div>

        {/* KPI 5: Overall Attendance Rate */}
        <div className="bg-card p-3 rounded-xl border flex items-center justify-between col-span-2 md:col-span-1">
          <div className="space-y-0.5">
            <div className="text-[10px] text-muted-foreground font-medium">Посещаемость</div>
            <div className="text-base font-bold text-foreground">{attendancePercent}%</div>
          </div>
          <Badge
            className={
              attendancePercent >= 75
                ? "bg-primary text-primary-foreground text-[9px] px-1.5 py-0 font-medium"
                : "bg-destructive text-white text-[9px] px-1.5 py-0 font-medium"
            }
          >
            {attendancePercent >= 90 ? "Отлично" : attendancePercent >= 75 ? "Норма" : "Низкая"}
          </Badge>
        </div>
      </div>

      {/* Alert Messages */}
      {successMsg && (
        <div className="print:hidden p-3 rounded-lg border border-primary/30 bg-primary/10 text-primary text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="print:hidden p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Attendance Register Card */}
      <Card className="print:hidden p-0 border overflow-hidden">
        <CardHeader className="p-3 border-b bg-muted/30 flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle className="text-xs font-bold text-foreground">
              Интерактивный ведомость посещаемости
            </CardTitle>
            <CardDescription className="text-[11px] text-muted-foreground">
              Отметьте статус каждого учащегося и укажите примечание при необходимости
            </CardDescription>
          </div>

          <div className="relative w-full sm:w-60">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Поиск по учащимся..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 text-xs pl-8 bg-background"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="divide-y text-xs">
            {/* Table Header */}
            <div className="grid grid-cols-[1fr_auto_220px] sm:grid-cols-[1fr_auto_280px] items-center gap-3 px-3 py-2 bg-muted/40 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              <span>Студент</span>
              <span className="text-center">Статус посещаемости</span>
              <span>Примечание</span>
            </div>

            {/* Student Rows */}
            {filteredStudents.map((st) => {
              const rec = records[st.studentId] || {
                status: AttendanceStatus.PRESENT,
                comment: "",
              };

              return (
                <div
                  key={st.studentId}
                  className={`grid grid-cols-[1fr_auto_220px] sm:grid-cols-[1fr_auto_280px] items-center gap-3 px-3 py-2.5 transition-colors ${
                    rec.status === AttendanceStatus.ABSENT
                      ? "bg-destructive/5"
                      : rec.status === AttendanceStatus.LATE
                      ? "bg-primary/5"
                      : "hover:bg-muted/20"
                  }`}
                >
                  {/* Student Name */}
                  <div className="flex items-center gap-2 font-medium min-w-0">
                    <Avatar className="h-5 w-5 border shrink-0">
                      <AvatarFallback className="text-[8px] font-bold bg-muted text-muted-foreground">
                        {st.studentName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate">{st.studentName}</span>
                    {st.isMonitor && (
                      <span title="Староста">
                        <Crown className="h-3 w-3 text-primary shrink-0" />
                      </span>
                    )}
                  </div>

                  {/* Segmented Pill Toggle for Attendance Status */}
                  <div className="grid grid-cols-4 gap-0.5 p-0.5 bg-muted/60 rounded-lg border text-xs">
                    <button
                      type="button"
                      disabled={!isAdminOrTeacher}
                      onClick={() => handleStatusChange(st.studentId, AttendanceStatus.PRESENT)}
                      className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all ${
                        rec.status === AttendanceStatus.PRESENT
                          ? "bg-primary text-primary-foreground shadow-2xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Был
                    </button>

                    <button
                      type="button"
                      disabled={!isAdminOrTeacher}
                      onClick={() => handleStatusChange(st.studentId, AttendanceStatus.ABSENT)}
                      className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all ${
                        rec.status === AttendanceStatus.ABSENT
                          ? "bg-destructive text-white shadow-2xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      НБ
                    </button>

                    <button
                      type="button"
                      disabled={!isAdminOrTeacher}
                      onClick={() => handleStatusChange(st.studentId, AttendanceStatus.LATE)}
                      className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all ${
                        rec.status === AttendanceStatus.LATE
                          ? "bg-primary text-primary-foreground shadow-2xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Опоздал
                    </button>

                    <button
                      type="button"
                      disabled={!isAdminOrTeacher}
                      onClick={() => handleStatusChange(st.studentId, AttendanceStatus.EXCUSED)}
                      className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all ${
                        rec.status === AttendanceStatus.EXCUSED
                          ? "bg-secondary text-secondary-foreground shadow-2xs border"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Уваж.
                    </button>
                  </div>

                  {/* Comment Input */}
                  <div>
                    <Input
                      placeholder="Примечание..."
                      value={rec.comment}
                      disabled={!isAdminOrTeacher}
                      onChange={(e) => handleCommentChange(st.studentId, e.target.value)}
                      onBlur={() => handleCommentBlur(st.studentId)}
                      className="h-7 text-xs bg-background"
                    />
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
    </div>
  );
}
