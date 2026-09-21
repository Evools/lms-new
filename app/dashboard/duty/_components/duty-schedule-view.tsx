"use client";

import React, { useState, useEffect, useTransition, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Clock,
  Calendar,
  Crown,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  UserPlus,
  ChevronLeft,
  X,
  Printer,
  Search,
  Users,
  BarChart3,
  Building2,
  ShieldCheck,
  ArrowRight,
  AlertTriangle,
  UserX,
  RefreshCw,
  FileText,
  MoreVertical,
  Trash2,
  Check,
  SlidersHorizontal,
  Power,
  PowerOff,
} from "lucide-react";
import {
  DayDutyGroupDTO,
  generateWeeklyDutyAction,
  addDutyStudentAction,
  removeDutyStudentAction,
  replaceDutyStudentAction,
  clearDutyScheduleAction,
  addDisciplinaryDutyAction,
  toggleGroupDutyAction,
  StudentDutyStatDTO,
  GroupStudentWithDutyInfo,
} from "../actions";

interface DutyScheduleViewProps {
  userRole: string;
  groupsList: { id: string; name: string; isDutyEnabled?: boolean }[];
  weeklyDays: DayDutyGroupDTO[];
  groupStudents: GroupStudentWithDutyInfo[];
  groupDutyStats: StudentDutyStatDTO[];
  selectedGroupId?: string;
  isDutyEnabled?: boolean;
  embedded?: boolean;
}

type StudentPickerMode = {
  type: "add" | "penalty";
  fullDate: string;
  dayName: string;
  existingIds: string[];
};

export function DutyScheduleView({
  userRole,
  groupsList = [],
  weeklyDays = [],
  groupStudents = [],
  groupDutyStats = [],
  selectedGroupId,
  isDutyEnabled = true,
  embedded = false,
}: DutyScheduleViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [currentGroupId, setCurrentGroupId] = useState<string>(
    selectedGroupId || (groupsList[0]?.id || "")
  );

  useEffect(() => {
    if (selectedGroupId) {
      setCurrentGroupId(selectedGroupId);
    }
  }, [selectedGroupId]);

  const [daysList, setDaysList] = useState<DayDutyGroupDTO[]>(weeklyDays);

  useEffect(() => {
    setDaysList(weeklyDays);
  }, [weeklyDays]);

  const [activeTab, setActiveTab] = useState<"WEEKLY" | "STATS" | "SETTINGS">("WEEKLY");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Detailed Duty Settings state
  const [dutyEnabledLocal, setDutyEnabledLocal] = useState<boolean>(isDutyEnabled);
  const [dutyPerDaySetting, setDutyPerDaySetting] = useState<number>(0); // 0 = Auto
  const [activeDutyDays, setActiveDutyDays] = useState<number[]>([0, 1, 2, 3, 4, 5]); // Mon-Sat
  const [responsibleMode, setResponsibleMode] = useState<"NONE" | "MONITOR" | "DEPUTY" | "CUSTOM">("MONITOR");
  const [customResponsibleStudentId, setCustomResponsibleStudentId] = useState<string>("");
  const [dutyAlgorithm, setDutyAlgorithm] = useState<"FAIR" | "ALPHABETICAL" | "RANDOM">("FAIR");
  const [excludedStudentIds, setExcludedStudentIds] = useState<string[]>([]);
  const [exemptionSearch, setExemptionSearch] = useState<string>("");

  useEffect(() => {
    setDutyEnabledLocal(isDutyEnabled);
  }, [isDutyEnabled]);

  // Absent tracking state map: key = `${studentId}_${fullDate}`, value = reason
  const [absentMap, setAbsentMap] = useState<Record<string, string>>({});

  // Penalty reason state
  const [penaltyReason, setPenaltyReason] = useState<string>("Опоздание на урок");

  // Student picker dialog
  const [pickerMode, setPickerMode] = useState<StudentPickerMode | null>(null);
  const [pickerStudentId, setPickerStudentId] = useState<string>("");

  // Replacement dialog
  const [replaceTarget, setReplaceTarget] = useState<{
    fullDate: string;
    dayName: string;
    absentStudentId: string;
    absentStudentName: string;
    existingIds: string[];
  } | null>(null);
  const [replacementStudentId, setReplacementStudentId] = useState<string>("");

  // Clear confirmation dialog
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

  const isAdminOrTeacher = userRole === "ADMIN" || userRole === "TEACHER";
  const currentGroupObj = groupsList.find((g) => g.id === currentGroupId);

  // Toggle group duty status
  const handleToggleDutyStatus = (enabled: boolean) => {
    if (!currentGroupId) return;
    startTransition(async () => {
      const res = await toggleGroupDutyAction(currentGroupId, enabled);
      if (res.success) {
        setDutyEnabledLocal(enabled);
        toast.add({
          title: enabled
            ? "Дежурства для группы успешно включены!"
            : "Дежурства для группы отключены. График приостановлен.",
          type: "success",
        });
        router.refresh();
      } else {
        toast.add({ title: res.error || "Ошибка при изменении статуса дежурств", type: "error" });
      }
    });
  };

  // Save detailed duty settings and generate schedule
  const handleApplyDetailedDutySettings = () => {
    if (!currentGroupId) return;
    startTransition(async () => {
      const res = await generateWeeklyDutyAction(currentGroupId, {
        isDutyEnabled: dutyEnabledLocal,
        perDay: dutyPerDaySetting > 0 ? dutyPerDaySetting : undefined,
        activeDays: activeDutyDays,
        includeLeader: responsibleMode !== "NONE",
        responsibleMode,
        customResponsibleStudentId: responsibleMode === "CUSTOM" ? customResponsibleStudentId : undefined,
        algorithm: dutyAlgorithm,
        excludedStudentIds,
      });
      if (res.success) {
        toast.add({
          title: dutyEnabledLocal
            ? "График дежурств успешно сформирован с учетом настроек!"
            : "Настройки сохранены. Дежурства отключены.",
          type: "success",
        });
        setActiveTab("WEEKLY");
        router.refresh();
      } else {
        toast.add({ title: res.error || "Ошибка при генерации графика", type: "error" });
      }
    });
  };

  // Group Switcher
  const handleGroupChange = (groupId: string) => {
    setCurrentGroupId(groupId);
    router.push(`/dashboard/duty?group=${groupId}`);
  };

  // Duty count per day setting
  const [dutyCountPerDay, setDutyCountPerDay] = useState<string>("auto");

  // Generate auto-rotation
  const handleAutoRotation = () => {
    if (!currentGroupId) return;
    startTransition(async () => {
      const countParam = dutyCountPerDay === "auto" ? undefined : Number(dutyCountPerDay);
      const res = await generateWeeklyDutyAction(currentGroupId, countParam);
      if (res.success) {
        toast.add({ title: "Честная авто-ротация успешно сформирована!", type: "success" });
        router.refresh();
      } else {
        toast.add({ title: res.error || "Ошибка при генерации ротации", type: "error" });
      }
    });
  };

  // Remove duty student with instant Optimistic UI update
  const handleRemoveDuty = (studentId: string, dateStr: string) => {
    const prevDays = daysList;
    // 1. Instant local removal
    setDaysList((current) =>
      current.map((day) =>
        day.fullDate === dateStr
          ? {
            ...day,
            dutyStudents: day.dutyStudents.filter((s) => s.id !== studentId),
          }
          : day
      )
    );
    toast.add({ title: "Дежурный убран из расписания", type: "success" });

    // 2. Background server execution
    startTransition(async () => {
      const res = await removeDutyStudentAction(currentGroupId, studentId, dateStr);
      if (!res.success) {
        setDaysList(prevDays);
        toast.add({ title: res.error || "Ошибка удаления из дежурства", type: "error" });
      } else {
        router.refresh();
      }
    });
  };

  // Clear duty schedule
  const handleConfirmClear = () => {
    if (!currentGroupId) return;
    const prevDays = daysList;
    setDaysList((current) =>
      current.map((day) => ({ ...day, dutyStudents: [], leaderStudent: undefined }))
    );
    setIsClearConfirmOpen(false);
    toast.add({ title: `Расписание дежурств группы ${currentGroupObj?.name || ""} очищено`, type: "success" });

    startTransition(async () => {
      const res = await clearDutyScheduleAction(currentGroupId);
      if (!res.success) {
        setDaysList(prevDays);
        toast.add({ title: res.error || "Ошибка при очистке дежурств", type: "error" });
      } else {
        router.refresh();
      }
    });
  };

  // Replace duty student
  const handleConfirmReplace = () => {
    if (!replaceTarget || !replacementStudentId) return;

    const repStudent = groupStudents.find((s) => s.id === replacementStudentId);
    if (!repStudent) return;

    const { fullDate, absentStudentId } = replaceTarget;
    const prevDays = daysList;

    // Instant optimistic swap
    setDaysList((current) =>
      current.map((day) =>
        day.fullDate === fullDate
          ? {
            ...day,
            dutyStudents: [
              ...day.dutyStudents.filter((s) => s.id !== absentStudentId),
              { id: repStudent.id, name: repStudent.name, isLeader: false },
            ],
          }
          : day
      )
    );

    setReplaceTarget(null);
    setReplacementStudentId("");
    toast.add({
      title: `Дежурный успешно заменен на ${repStudent.name}!`,
      type: "success",
    });

    startTransition(async () => {
      const res = await replaceDutyStudentAction(
        currentGroupId,
        absentStudentId,
        repStudent.id,
        fullDate
      );
      if (!res.success) {
        setDaysList(prevDays);
        toast.add({ title: res.error || "Ошибка при замене дежурного", type: "error" });
      } else {
        router.refresh();
      }
    });
  };

  // Mark student absent
  const handleMarkAbsent = (studentId: string, fullDate: string, reason: string = "Прогул/Отсутствие") => {
    setAbsentMap((prev) => ({
      ...prev,
      [`${studentId}_${fullDate}`]: reason,
    }));
    toast.add({ title: "Пропуск зафиксирован. Вы можете назначить замену.", type: "success" });
  };

  // Confirm Add (Standard or Penalty) with instant Optimistic UI update
  const handleConfirmAdd = () => {
    if (!pickerMode || !pickerStudentId) return;

    const studentToAdd = groupStudents.find((s) => s.id === pickerStudentId);
    if (!studentToAdd) return;

    const targetDateStr = pickerMode.fullDate;
    const isPenalty = pickerMode.type === "penalty";
    const currentReason = penaltyReason;
    const prevDays = daysList;

    // 1. Instant optimistic insertion
    setDaysList((current) =>
      current.map((day) =>
        day.fullDate === targetDateStr
          ? {
            ...day,
            dutyStudents: [
              ...day.dutyStudents.filter((s) => s.id !== studentToAdd.id),
              { id: studentToAdd.id, name: studentToAdd.name, isLeader: false },
            ],
          }
          : day
      )
    );

    setPickerMode(null);
    setPickerStudentId("");
    toast.add({
      title: isPenalty
        ? `Внеочередное дежурство (${currentReason}) назначено!`
        : "Дежурный успешно добавлен!",
      type: "success",
    });

    // 2. Background server execution
    startTransition(async () => {
      const res = isPenalty
        ? await addDisciplinaryDutyAction(currentGroupId, studentToAdd.id, targetDateStr, currentReason)
        : await addDutyStudentAction(currentGroupId, studentToAdd.id, targetDateStr);

      if (!res.success) {
        setDaysList(prevDays);
        toast.add({ title: res.error || "Ошибка сохранения дежурного", type: "error" });
      } else {
        router.refresh();
      }
    });
  };

  // Open add dialog
  const openAddModal = (day: DayDutyGroupDTO, type: "add" | "penalty" = "add") => {
    const existing = day.dutyStudents.map((s) => s.id);
    const available = groupStudents.filter((s) => !existing.includes(s.id));
    setPickerMode({
      type,
      fullDate: day.fullDate,
      dayName: `${day.dayName} (${day.dateStr})`,
      existingIds: existing,
    });
    setPickerStudentId(available[0]?.id || "");
  };

  // Open replace dialog
  const openReplaceModal = (
    day: DayDutyGroupDTO,
    studentId: string,
    studentName: string
  ) => {
    const existing = day.dutyStudents.map((s) => s.id);
    const available = groupStudents.filter((s) => !existing.includes(s.id));
    setReplaceTarget({
      fullDate: day.fullDate,
      dayName: `${day.dayName} (${day.dateStr})`,
      absentStudentId: studentId,
      absentStudentName: studentName,
      existingIds: existing,
    });
    setReplacementStudentId(available[0]?.id || "");
  };

  // Printable Handler
  const handlePrint = () => {
    window.print();
  };

  // Filtered days by search query
  const filteredWeeklyDays = daysList.map((day) => {
    if (!searchQuery.trim()) return day;
    const q = searchQuery.toLowerCase();
    const matchesStudents = day.dutyStudents.filter((st) =>
      st.name.toLowerCase().includes(q)
    );
    const matchesLeader = day.leaderStudent?.name.toLowerCase().includes(q);
    const matchesDay = day.dayName.toLowerCase().includes(q) || day.dateStr.includes(q);

    if (matchesStudents.length > 0 || matchesLeader || matchesDay) {
      return {
        ...day,
        dutyStudents: matchesStudents.length > 0 ? matchesStudents : day.dutyStudents,
      };
    }
    return { ...day, dutyStudents: [] };
  });

  // Calculate absent duty alerts across the week
  const absentDutyAlerts = useMemo(() => {
    const alerts: {
      studentName: string;
      dateStr: string;
      dayName: string;
      fullDate: string;
      studentId: string;
      existingIds: string[];
      reason: string;
    }[] = [];

    daysList.forEach((day) => {
      if (day.isSunday) return;
      const existing = day.dutyStudents.map((s) => s.id);
      day.dutyStudents.forEach((st) => {
        const isAbsentInDb = st.attendanceStatus === "ABSENT" || st.attendanceStatus === "EXCUSED";
        const localAbsent = absentMap[`${st.id}_${day.fullDate}`];
        if (isAbsentInDb || localAbsent) {
          alerts.push({
            studentName: st.name,
            dateStr: day.dateStr,
            dayName: day.dayName,
            fullDate: day.fullDate,
            studentId: st.id,
            existingIds: existing,
            reason:
              localAbsent ||
              (st.attendanceStatus === "EXCUSED"
                ? "Уважительная причина"
                : "Отсутствует на занятиях (Н/Б)"),
          });
        }
      });
    });
    return alerts;
  }, [daysList, absentMap]);

  // Calculate Metrics
  const totalShiftsThisWeek = daysList.reduce((acc, d) => acc + (d.dutyStudents?.length || 0), 0);
  const todayObj = daysList.find((d) => d.isToday);
  const todayStudentsCount = todayObj?.dutyStudents?.length || 0;

  return (
    <div className="space-y-4 pb-8 text-xs">
      {/* Dynamic Print CSS */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-duty-roster, #printable-duty-roster * {
            visibility: visible;
          }
          #printable-duty-roster {
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

      {/* Printable Poster Container (Hidden on screen, Visible on print) */}
      <div id="printable-duty-roster" className="hidden print:block space-y-6 font-sans">
        <div className="text-center border-b-2 border-black pb-4 space-y-1">
          <h1 className="text-xl font-bold uppercase tracking-wider">ЛИЦЕЙСКОЕ РАСПИСАНИЕ ДЕЖУРСТВ</h1>
          <div className="text-sm font-semibold">
            Учебная группа: <strong>{currentGroupObj?.name || "Все группы"}</strong> | Учебный период: 2025-2026 гг.
          </div>
          {weeklyDays.length > 0 && (
            <div className="text-xs text-gray-600">
              Неделя: {weeklyDays[0]?.dateStr} — {weeklyDays[weeklyDays.length - 1]?.dateStr}
            </div>
          )}
        </div>

        <table className="w-full border-collapse border border-black text-xs">
          <thead>
            <tr className="bg-gray-100 border-b border-black text-left">
              <th className="border border-black p-2 w-32">День недели</th>
              <th className="border border-black p-2 w-24">Дата</th>
              <th className="border border-black p-2">Дежурные студенты</th>
              <th className="border border-black p-2 w-40">Староста / Ответственный</th>
            </tr>
          </thead>
          <tbody>
            {weeklyDays.map((day) => (
              <tr key={day.fullDate} className="border-b border-black">
                <td className="border border-black p-2 font-bold">{day.dayName}</td>
                <td className="border border-black p-2 font-mono">{day.dateStr}</td>
                <td className="border border-black p-2">
                  {day.isSunday ? (
                    <span className="italic text-gray-500">Выходной день</span>
                  ) : day.dutyStudents && day.dutyStudents.length > 0 ? (
                    <div className="space-y-1">
                      {day.dutyStudents.map((st) => (
                        <div key={st.id} className="font-medium">
                          • {st.name}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="italic text-gray-500">Не назначены</span>
                  )}
                </td>
                <td className="border border-black p-2">
                  {day.leaderStudent ? day.leaderStudent.name : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="pt-8 grid grid-cols-2 gap-8 text-xs">
          <div>
            Куратор группы: _____________________ / (Ф.И.О.)
          </div>
          <div className="text-right">
            Завуч по УР: _____________________ / (Ф.И.О.)
          </div>
        </div>
      </div>

      {/* Screen UI Top Header */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-4 rounded-xl border">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {!embedded && (
              <Link
                href={currentGroupId ? `/dashboard/groups/${currentGroupId}` : "/dashboard/groups"}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
              >
                <ChevronLeft className="h-4 w-4" />
              </Link>
            )}
            <h1 className="text-base font-bold text-foreground flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <span>Дежурства {currentGroupObj ? `группы ${currentGroupObj.name}` : "лицея"}</span>
            </h1>
          </div>
          <p className="text-xs text-muted-foreground pl-6">
            Централизованный аудит, дисциплинарные назначения, автоматическая ротация и замены
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2" data-tour="duty-header-actions">
          {/* Group Selector Dropdown */}
          {!embedded && groupsList.length > 0 && (
            <div className="flex items-center gap-1.5 bg-background border rounded-lg px-2.5 py-1 text-xs shadow-2xs">
              <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
              <Select value={currentGroupId} onValueChange={handleGroupChange}>
                <SelectTrigger className="h-6 text-xs font-semibold border-0 bg-transparent p-0 shadow-none focus:ring-0 min-w-[130px]">
                  <SelectValue>{currentGroupObj ? `Группа ${currentGroupObj.name}` : "Выберите группу"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {groupsList.map((g) => (
                    <SelectItem key={g.id} value={g.id} className="text-xs">
                      Группа {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button variant="outline" size="xs" onClick={handlePrint} className="h-8 text-xs gap-1.5">
            <Printer className="h-3.5 w-3.5" /> Печать (A4)
          </Button>

          {isAdminOrTeacher && (
            <Button
              variant="outline"
              size="xs"
              onClick={() => setActiveTab(activeTab === "SETTINGS" ? "WEEKLY" : "SETTINGS")}
              className={`h-8 text-xs gap-1.5 font-medium ${activeTab === "SETTINGS" ? "bg-primary/10 border-primary/40 text-primary" : ""
                }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Настройки</span>
            </Button>
          )}

          {isAdminOrTeacher && dutyEnabledLocal && (
            <div className="flex items-center gap-1.5 bg-background border rounded-lg px-2.5 py-1 text-xs">
              <span className="text-[11px] text-muted-foreground whitespace-nowrap">Дежурных в день:</span>
              <Select
                value={dutyCountPerDay}
                onValueChange={(val) => val && setDutyCountPerDay(val)}
              >
                <SelectTrigger className="h-6 text-xs w-28 border-0 bg-transparent p-0 shadow-none focus:ring-0">
                  <SelectValue>{dutyCountPerDay === "auto" ? "Авторасчет" : `${dutyCountPerDay} чел.`}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Авторасчет</SelectItem>
                  <SelectItem value="1">1 человек</SelectItem>
                  <SelectItem value="2">2 человека</SelectItem>
                  <SelectItem value="3">3 человека</SelectItem>
                  <SelectItem value="4">4 человека</SelectItem>
                  <SelectItem value="5">5 человек</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {isAdminOrTeacher && dutyEnabledLocal && (
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                size="xs"
                variant="outline"
                onClick={() => setIsClearConfirmOpen(true)}
                disabled={isPending || !currentGroupId}
                className="h-8 text-xs gap-1.5 font-medium border-destructive/30 text-destructive hover:bg-destructive/10"
                title="Очистить расписание дежурств группы"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Очистить
              </Button>
              <Button
                size="xs"
                onClick={handleAutoRotation}
                disabled={isPending || !currentGroupId}
                className="h-8 text-xs gap-1.5 font-medium"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {isPending ? "Расчет..." : "Авто-ротация"}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Screen KPI Bar */}
      <div className="print:hidden grid grid-cols-1 md:grid-cols-3 gap-3" data-tour="duty-kpi">

        {/* KPI 1 */}
        <div className="bg-card p-3 rounded-xl border flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-[10px] text-muted-foreground font-medium">Дежурных на сегодня</div>
            <div className="text-lg font-bold text-foreground">{todayStudentsCount} чел.</div>
            <div className="text-[9px] text-primary font-medium">
              {todayObj ? `${todayObj.dayName}, ${todayObj.dateStr}` : "Выходной"}
            </div>
          </div>
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <UserCheck className="h-5 w-5" />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-card p-3 rounded-xl border flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-[10px] text-muted-foreground font-medium">Дежурств на неделе</div>
            <div className="text-lg font-bold text-foreground">{totalShiftsThisWeek} смен</div>
            <div className="text-[9px] text-muted-foreground font-medium">Понедельник — Суббота</div>
          </div>
          <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
            <Calendar className="h-5 w-5" />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-card p-3 rounded-xl border flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-[10px] text-muted-foreground font-medium">Состав группы</div>
            <div className="text-lg font-bold text-foreground">{groupStudents.length} учащихся</div>
            <div className="text-[9px] text-muted-foreground font-medium flex items-center gap-0.5">
              <ShieldCheck className="h-3 w-3 text-primary" /> Без повторов
            </div>
          </div>
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Users className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Alert Messages */}
      {!dutyEnabledLocal && (
        <div className="print:hidden p-3.5 rounded-xl border border-destructive/30 bg-destructive/5 text-destructive text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
            <span>
              Дежурства для группы <strong>{currentGroupObj?.name || ""}</strong> отключены в настройках группы. График не рассчитывается.
            </span>
          </div>
          {isAdminOrTeacher && (
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="xs"
                onClick={() => handleToggleDutyStatus(true)}
                disabled={isPending || !currentGroupId}
                className="h-7 text-xs gap-1 font-medium bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Power className="h-3.5 w-3.5" /> Включить
              </Button>
              <Button
                size="xs"
                variant="outline"
                onClick={() => setActiveTab("SETTINGS")}
                className="h-7 text-xs gap-1 font-medium"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" /> Настройки
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Main Mode Tabs & Filter Bar */}
      <div className="print:hidden flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border-b pb-2" data-tour="duty-filters">
        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border">
          <button
            type="button"
            onClick={() => setActiveTab("WEEKLY")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${activeTab === "WEEKLY"
              ? "bg-background text-foreground shadow-2xs border"
              : "text-muted-foreground hover:text-foreground"
              }`}
          >
            <Calendar className="h-3.5 w-3.5 inline-block mr-1.5 text-primary" />
            График группы {currentGroupObj?.name ? `(${currentGroupObj.name})` : ""}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("STATS")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${activeTab === "STATS"
              ? "bg-background text-foreground shadow-2xs border"
              : "text-muted-foreground hover:text-foreground"
              }`}
          >
            <BarChart3 className="h-3.5 w-3.5 inline-block mr-1.5 text-primary" />
            Аудит и рейтинг
          </button>

          {isAdminOrTeacher && (
            <button
              type="button"
              onClick={() => setActiveTab("SETTINGS")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${activeTab === "SETTINGS"
                ? "bg-background text-foreground shadow-2xs border"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5 inline-block mr-1.5 text-primary" />
              Настройки дежурства
            </button>
          )}
        </div>

        {activeTab === "WEEKLY" && (
          <div className="relative w-full sm:w-64">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Поиск по фамилии..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 text-xs pl-8 bg-background"
            />
          </div>
        )}
      </div>

      {/* Absent Duty Alerts Banner */}
      {absentDutyAlerts.length > 0 && (
        <div className="print:hidden p-3.5 rounded-xl border border-destructive/30 bg-destructive/5 text-destructive text-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold">
              <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
              <span>Обнаружены дежурные с пропусками занятий ({absentDutyAlerts.length})</span>
            </div>
            <span className="text-[11px] text-muted-foreground">
              Рекомендуется назначить замену из присутствующих студентов
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
            {absentDutyAlerts.map((a, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-2 p-2 rounded-lg bg-background/90 border border-destructive/20 text-foreground text-xs shadow-2xs"
              >
                <div className="min-w-0">
                  <div className="font-semibold truncate">{a.studentName}</div>
                  <div className="text-[10px] text-destructive font-medium truncate">
                    {a.dayName} ({a.dateStr}) • {a.reason}
                  </div>
                </div>
                {isAdminOrTeacher && (
                  <Button
                    size="xs"
                    variant="outline"
                    className="h-6 px-2 text-[11px] border-primary/30 text-primary hover:bg-primary/10 gap-1 shrink-0 font-medium"
                    onClick={() => {
                      const available = groupStudents.filter((s) => !a.existingIds.includes(s.id));
                      setReplaceTarget({
                        fullDate: a.fullDate,
                        dayName: `${a.dayName} (${a.dateStr})`,
                        absentStudentId: a.studentId,
                        absentStudentName: a.studentName,
                        existingIds: a.existingIds,
                      });
                      setReplacementStudentId(available[0]?.id || "");
                    }}
                  >
                    <RefreshCw className="h-3 w-3" /> Заменить
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 1: WEEKLY GROUP SCHEDULE */}
      {activeTab === "WEEKLY" && (
        <Card className="print:hidden p-0 border overflow-hidden" data-tour="duty-roster">
          <CardHeader className="p-3 border-b bg-muted/30">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle className="text-xs font-bold text-foreground flex items-center gap-2">
                  <span>Недельная ведомость дежурств</span>
                  {currentGroupObj && (
                    <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20 font-medium">
                      Группа {currentGroupObj.name}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-[11px] text-muted-foreground">
                  Расписание дежурных, внеочередные назначения, сверка с посещаемостью и замены
                </CardDescription>
              </div>

              {isAdminOrTeacher && (
                <div className="flex items-center gap-1.5">
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => {
                      const targetDay = weeklyDays.find((d) => d.isToday && !d.isSunday) || weeklyDays.find((d) => !d.isSunday) || weeklyDays[0];
                      if (targetDay) openAddModal(targetDay, "penalty");
                    }}
                    className="h-7 text-xs gap-1 border-primary/30 text-primary hover:bg-primary/10"
                  >
                    <AlertTriangle className="h-3.5 w-3.5" /> За нарушение
                  </Button>
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => {
                      const targetDay = weeklyDays.find((d) => d.isToday && !d.isSunday) || weeklyDays.find((d) => !d.isSunday) || weeklyDays[0];
                      if (targetDay) openAddModal(targetDay, "add");
                    }}
                    className="h-7 text-xs gap-1 border-primary/20 text-primary hover:bg-primary/10"
                  >
                    <UserPlus className="h-3.5 w-3.5" /> Назначить
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {totalShiftsThisWeek === 0 ? (
              <div className="p-8 text-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                  <Clock className="h-6 w-6" />
                </div>
                <div className="space-y-1 max-w-sm mx-auto">
                  <div className="text-sm font-bold text-foreground">График дежурств пуст</div>
                  <div className="text-xs text-muted-foreground">
                    На этой неделе дежурные еще не назначены. Вы можете назначить учащихся вручную на каждый день или запустить автоматическую ротацию.
                  </div>
                </div>
                {isAdminOrTeacher && isDutyEnabled && (
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => {
                        const targetDay = weeklyDays.find((d) => !d.isSunday) || weeklyDays[0];
                        if (targetDay) openAddModal(targetDay, "add");
                      }}
                      className="h-8 text-xs gap-1.5"
                    >
                      <UserPlus className="h-3.5 w-3.5" /> Назначить вручную
                    </Button>
                    <Button
                      size="xs"
                      onClick={handleAutoRotation}
                      disabled={isPending || !currentGroupId}
                      className="h-8 text-xs gap-1.5 font-medium"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      {isPending ? "Расчет..." : "Запустить авто-ротацию"}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="divide-y">
                <div className="grid grid-cols-[150px_1fr_auto] items-center gap-3 px-3 py-2 bg-muted/40 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  <span>День / Дата</span>
                  <span>Дежурные студенты</span>
                  <span className="text-right">Действия</span>
                </div>

                {filteredWeeklyDays.map((day) => {
                  const availableStudents = groupStudents.filter(
                    (s) => !day.dutyStudents.some((ds) => ds.id === s.id)
                  );

                  return (
                    <div
                      key={day.fullDate}
                      className={`grid grid-cols-[150px_1fr_auto] items-center gap-3 px-3 py-2.5 transition-colors ${day.isToday
                        ? "bg-primary/5"
                        : day.isSunday
                          ? "bg-muted/20 opacity-60"
                          : "hover:bg-muted/20"
                        }`}
                    >
                      {/* Day & Date */}
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-xs font-bold ${day.isToday
                            ? "text-primary"
                            : "text-foreground"
                            }`}>
                            {day.dayName}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">{day.dateStr}</span>
                        </div>
                        <div className="flex items-center gap-1 pt-0.5">
                          {day.isToday && (
                            <Badge className="bg-primary text-primary-foreground text-[8px] px-1 py-0 font-medium">
                              Сегодня
                            </Badge>
                          )}
                          {day.isPast && !day.isSunday && (
                            <Badge variant="outline" className="text-muted-foreground border-border bg-muted/40 text-[8px] px-1.5 py-0 font-medium inline-flex items-center gap-0.5">
                              <Check className="h-2.5 w-2.5 text-primary" /> Отдежурили
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Duty Students */}
                      <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                        {day.isSunday ? (
                          <span className="text-[11px] text-muted-foreground/60 italic">Выходной день</span>
                        ) : day.dutyStudents && day.dutyStudents.length > 0 ? (
                          day.dutyStudents.map((st) => {
                            const isAbsentInDb = st.attendanceStatus === "ABSENT" || st.attendanceStatus === "EXCUSED";
                            const isLateInDb = st.attendanceStatus === "LATE";
                            const isPresentInDb = st.attendanceStatus === "PRESENT";
                            const localAbsent = absentMap[`${st.id}_${day.fullDate}`];
                            const isAbsent = isAbsentInDb || Boolean(localAbsent);
                            const absentLabel = localAbsent || (st.attendanceStatus === "EXCUSED" ? "Уваж." : "Н/Б");

                            return (
                              <div
                                key={st.id}
                                className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium transition-all ${isAbsent
                                  ? "border-destructive/40 bg-destructive/10 text-destructive"
                                  : day.isToday
                                    ? "border-primary/30 bg-primary/10 text-primary"
                                    : day.isPast
                                      ? "border-border bg-muted/30 text-foreground"
                                      : "border-border bg-muted/10 text-foreground"
                                  }`}
                              >
                                <Avatar className="h-4 w-4 border shrink-0">
                                  <AvatarFallback className={`text-[7px] font-bold ${isAbsent
                                    ? "bg-destructive/20 text-destructive"
                                    : day.isToday
                                      ? "bg-primary/20 text-primary"
                                      : "bg-muted text-muted-foreground"
                                    }`}>
                                    {st.name.slice(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>

                                <span className={`truncate ${isAbsent ? "line-through opacity-85" : ""}`}>
                                  {st.name}
                                </span>

                                {isAbsent && (
                                  <span className="text-[9px] font-bold no-underline text-destructive inline-flex items-center gap-0.5">
                                    <AlertCircle className="h-2.5 w-2.5" />
                                    {absentLabel}
                                  </span>
                                )}

                                {isPresentInDb && !isAbsent && (
                                  <span title="Был на занятиях" className="text-[8px] text-primary inline-flex items-center gap-0.5">
                                    <Check className="h-2.5 w-2.5" /> Присутствовал
                                  </span>
                                )}

                                {isLateInDb && !isAbsent && (
                                  <span title="Опоздал на занятия" className="text-[8px] text-muted-foreground inline-flex items-center gap-0.5">
                                    ⏱️ Опоздал
                                  </span>
                                )}

                                {day.isPast && !isAbsent && !isPresentInDb && (
                                  <span title="Дежурство выполнено" className="inline-flex items-center shrink-0">
                                    <Check className="h-3 w-3 text-primary/70" />
                                  </span>
                                )}

                                {isAdminOrTeacher && (
                                  <div className="flex items-center gap-0.5 ml-0.5">
                                    {isAbsent && (
                                      <button
                                        type="button"
                                        onClick={() => openReplaceModal(day, st.id, st.name)}
                                        className="h-5 px-1.5 text-[9px] rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium flex items-center gap-0.5"
                                        title="Назначить замену дежурного"
                                      >
                                        <RefreshCw className="h-2.5 w-2.5" /> Заменить
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => handleRemoveDuty(st.id, day.fullDate)}
                                      className="p-0.5 rounded text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-colors"
                                      title="Быстро убрать из дежурных"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>

                                    <DropdownMenu>
                                      <DropdownMenuTrigger render={
                                        <button
                                          type="button"
                                          className="p-0.5 rounded hover:bg-muted/80 text-muted-foreground/60 hover:text-foreground transition-colors"
                                        />
                                      }>
                                        <MoreVertical className="h-3 w-3" />
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="text-xs p-1 min-w-[160px]">
                                        <DropdownMenuItem
                                          onClick={() => openReplaceModal(day, st.id, st.name)}
                                          className="text-xs gap-2 py-1.5 cursor-pointer font-medium"
                                        >
                                          <RefreshCw className="h-3.5 w-3.5 text-primary" />
                                          <span>Назначить замену</span>
                                        </DropdownMenuItem>
                                        {!isAbsent && (
                                          <DropdownMenuItem
                                            onClick={() => handleMarkAbsent(st.id, day.fullDate, "Прогул/Болезнь")}
                                            className="text-xs gap-2 py-1.5 cursor-pointer font-medium"
                                          >
                                            <UserX className="h-3.5 w-3.5 text-muted-foreground" />
                                            <span>Отметить пропуск</span>
                                          </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem
                                          onClick={() => handleRemoveDuty(st.id, day.fullDate)}
                                          className="text-xs gap-2 py-1.5 cursor-pointer text-destructive focus:text-destructive font-medium"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                          <span>Удалить из дежурных</span>
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-muted-foreground/50">Дежурные не назначены</span>
                            {isAdminOrTeacher && (
                              <button
                                type="button"
                                onClick={() => openAddModal(day, "add")}
                                className="text-[10px] text-primary hover:underline font-medium"
                              >
                                + Назначить
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-1.5 shrink-0">
                        {!day.isSunday && isAdminOrTeacher && (
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => openAddModal(day, "add")}
                            disabled={availableStudents.length === 0}
                            className="h-7 text-xs px-2.5 gap-1 border-primary/20 text-primary hover:bg-primary/10"
                          >
                            <UserPlus className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Назначить</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 2: DUTY STATS & AUDIT */}
      {activeTab === "STATS" && (
        <Card className="print:hidden p-0 border overflow-hidden">
          <CardHeader className="p-3 border-b bg-muted/30">
            <CardTitle className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <BarChart3 className="h-4 w-4 text-primary" /> Рейтинг и аудит дежурств группы {currentGroupObj?.name}
            </CardTitle>
            <CardDescription className="text-[11px] text-muted-foreground">
              Учёт общего количества дежурств по каждому учащемуся группы
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            <div className="divide-y text-xs">
              <div className="grid grid-cols-[1fr_130px_140px_90px_80px] items-center gap-3 px-3 py-2 bg-muted/40 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                <span>Студент</span>
                <span>Статус</span>
                <span>Последнее дежурство</span>
                <span className="text-right">Выполнено</span>
                <span className="text-right">В плане</span>
              </div>

              {groupDutyStats.map((st) => (
                <div key={st.studentId} className="grid grid-cols-[1fr_130px_140px_90px_80px] items-center gap-3 px-3 py-2.5 hover:bg-muted/20">
                  <div className="flex items-center gap-2 font-medium">
                    <Avatar className="h-5 w-5 border shrink-0">
                      <AvatarFallback className="text-[8px] font-bold bg-muted text-muted-foreground">
                        {st.studentName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span>{st.studentName}</span>
                    {st.isMonitor && (
                      <span title="Староста">
                        <Crown className="h-3 w-3 text-primary shrink-0" />
                      </span>
                    )}
                  </div>

                  <div>
                    {st.completedDutiesCount > 0 ? (
                      <Badge variant="outline" className="text-[9px] border-primary/30 text-primary bg-primary/10 font-medium flex items-center gap-1 w-fit">
                        <Check className="h-2.5 w-2.5" /> Отдежурил ({st.completedDutiesCount})
                      </Badge>
                    ) : st.scheduledDutiesCount > 0 ? (
                      <Badge variant="outline" className="text-[9px] border-border text-muted-foreground bg-muted/40 font-medium">
                        В плане ({st.scheduledDutiesCount})
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[9px]">
                        В очереди
                      </Badge>
                    )}
                  </div>

                  <div className="text-[11px] text-muted-foreground font-mono">
                    {st.lastDutyDate}
                  </div>

                  <div className="text-right font-bold text-foreground">
                    {st.completedDutiesCount} дн.
                  </div>

                  <div className="text-right font-medium text-muted-foreground">
                    {st.scheduledDutiesCount > 0 ? `+${st.scheduledDutiesCount} дн.` : "—"}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 3: DUTY ROTATION SETTINGS */}
      {activeTab === "SETTINGS" && (
        <Card className="print:hidden p-4 space-y-4 text-xs bg-card border shadow-xs">
          <CardHeader className="p-0 pb-3 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-primary" /> Настройки автоматической ротации
              </CardTitle>
              <CardDescription className="text-[11px] text-muted-foreground mt-0.5">
                Параметры дежурств, алгоритм распределения, старший дежурный и освобожденные студенты группы {currentGroupObj?.name ? `«${currentGroupObj.name}»` : ""}
              </CardDescription>
            </div>
            <Button
              size="xs"
              onClick={handleApplyDetailedDutySettings}
              disabled={isPending || !currentGroupId}
              className="h-8 text-xs gap-1.5 shrink-0 font-medium"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {isPending ? "Расчет..." : "Сохранить и сформировать"}
            </Button>
          </CardHeader>

          <CardContent className="p-0 space-y-4">
            {/* 0. Main Duty Enable / Disable Option (Segmented Toggle) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border bg-muted/10 border-primary/20 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <Power className={`h-4 w-4 shrink-0 ${dutyEnabledLocal ? "text-emerald-500" : "text-destructive"}`} />
                <div className="space-y-0.5">
                  <div className="font-semibold text-foreground">
                    Режим дежурств:{" "}
                    <span className={dutyEnabledLocal ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}>
                      {dutyEnabledLocal ? "Включено" : "Отключено"}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {dutyEnabledLocal
                      ? "Система автоматически рассчитывает график дежурств и отслеживает пропуски"
                      : "Дежурства приостановлены, график для этой группы не составляется"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <div className="inline-flex p-0.5 bg-muted/80 rounded-lg border text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => handleToggleDutyStatus(true)}
                    disabled={isPending || !currentGroupId}
                    className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 font-medium ${dutyEnabledLocal
                      ? "bg-background text-emerald-600 dark:text-emerald-400 border border-border shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>Включено</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleDutyStatus(false)}
                    disabled={isPending || !currentGroupId}
                    className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 font-medium ${!dutyEnabledLocal
                      ? "bg-background text-destructive border border-border shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    <PowerOff className="h-3.5 w-3.5 text-destructive shrink-0" />
                    <span>Отключено</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Column 1: Duty Parameters */}
              <div className="space-y-3.5">
                {/* 1. Duty Persons Count */}
                <div className="space-y-1.5 p-3 rounded-xl border bg-muted/10">
                  <label className="font-semibold text-foreground flex items-center justify-between">
                    <span>Количество дежурных в день:</span>
                    <span className="text-primary font-medium text-[11px]">
                      {dutyPerDaySetting === 0 ? "Авто-расчет (1-3 чел.)" : `${dutyPerDaySetting} чел. в смену`}
                    </span>
                  </label>
                  <div className="grid grid-cols-6 gap-1 p-1 bg-muted/60 rounded-lg border text-xs text-center font-medium">
                    {[
                      { value: 0, label: "Авто" },
                      { value: 1, label: "1 чел" },
                      { value: 2, label: "2 чел" },
                      { value: 3, label: "3 чел" },
                      { value: 4, label: "4 чел" },
                      { value: 5, label: "5 чел" },
                    ].map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setDutyPerDaySetting(item.value)}
                        className={`py-1.5 rounded-md transition-colors font-medium ${dutyPerDaySetting === item.value
                          ? "bg-background border border-border text-primary shadow-2xs"
                          : "text-muted-foreground hover:text-foreground"
                          }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Days of Week */}
                <div className="space-y-1.5 p-3 rounded-xl border bg-muted/10">
                  <label className="font-semibold text-foreground">Дни проведения дежурств:</label>
                  <div className="grid grid-cols-6 gap-1.5">
                    {[
                      { idx: 0, name: "Пн" },
                      { idx: 1, name: "Вт" },
                      { idx: 2, name: "Ср" },
                      { idx: 3, name: "Чт" },
                      { idx: 4, name: "Пт" },
                      { idx: 5, name: "Сб" },
                    ].map((day) => {
                      const isActive = activeDutyDays.includes(day.idx);
                      return (
                        <button
                          key={day.idx}
                          type="button"
                          onClick={() => {
                            setActiveDutyDays((prev) =>
                              isActive ? prev.filter((d) => d !== day.idx) : [...prev, day.idx].sort()
                            );
                          }}
                          className={`py-2 rounded-lg border text-center font-medium transition-colors text-xs ${isActive
                            ? "bg-primary/10 border-primary/40 text-primary"
                            : "bg-background border-border text-muted-foreground hover:bg-muted"
                            }`}
                        >
                          {day.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Rotation Algorithm */}
                <div className="space-y-1.5 p-3 rounded-xl border bg-muted/10">
                  <label className="font-semibold text-foreground">Алгоритм распределения:</label>
                  <div className="grid grid-cols-3 gap-1 p-1 bg-muted/60 rounded-lg border text-xs text-center font-medium">
                    {(
                      [
                        { id: "FAIR", label: "Честный (учет прошлых)" },
                        { id: "ALPHABETICAL", label: "По алфавиту" },
                        { id: "RANDOM", label: "Случайный (рандом)" },
                      ] as const
                    ).map((alg) => (
                      <button
                        key={alg.id}
                        type="button"
                        onClick={() => setDutyAlgorithm(alg.id)}
                        className={`py-1.5 px-1 rounded-md transition-colors text-[11px] truncate font-medium ${dutyAlgorithm === alg.id
                          ? "bg-background border border-border text-primary shadow-2xs"
                          : "text-muted-foreground hover:text-foreground"
                          }`}
                      >
                        {alg.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Responsible / Senior Duty Person Options */}
                <div className="space-y-2 p-3 rounded-xl border bg-muted/10">
                  <label className="font-semibold text-foreground flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Crown className="h-4 w-4 text-primary" /> Ответственный (Старший дежурный):
                    </span>
                    <span className="text-[11px] text-muted-foreground">Ежедневно</span>
                  </label>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 bg-muted/60 rounded-lg border text-xs text-center font-medium">
                    {(
                      [
                        { id: "NONE", label: "Без старшего" },
                        { id: "MONITOR", label: "Староста" },
                        { id: "DEPUTY", label: "Зам. старосты" },
                        { id: "CUSTOM", label: "Другой студент" },
                      ] as const
                    ).map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setResponsibleMode(mode.id)}
                        className={`py-1.5 px-1 rounded-md transition-colors text-[11px] truncate font-medium ${responsibleMode === mode.id
                          ? "bg-background border border-border text-primary shadow-2xs"
                          : "text-muted-foreground hover:text-foreground"
                          }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>

                  {responsibleMode === "CUSTOM" && (
                    <div className="pt-1.5">
                      <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                        Выберите ответственного студента из списка группы:
                      </label>
                      <Select
                        value={customResponsibleStudentId}
                        onValueChange={(val) => val && setCustomResponsibleStudentId(val)}
                      >
                        <SelectTrigger className="h-8 text-xs bg-background">
                          <SelectValue placeholder="Выберите ответственного..." />
                        </SelectTrigger>
                        <SelectContent className="text-xs">
                          {groupStudents.map((st) => (
                            <SelectItem key={st.id} value={st.id} className="text-xs">
                              {st.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>

              {/* Column 2: Exempted Students (Исключения) */}
              <div className="space-y-2 p-3 rounded-xl border bg-muted/10 flex flex-col">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-foreground">Освобождение от дежурств (Исключения):</label>
                  {excludedStudentIds.length > 0 ? (
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] px-1.5 py-0 font-medium">
                      Освобождено: {excludedStudentIds.length} чел.
                    </Badge>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">Все дежурят</span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Отметьте студентов, которые не должны включаться в ротацию (освобождены по здоровью и т.д.):
                </p>

                {groupStudents.length > 6 && (
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    <Input
                      placeholder="Поиск по ФИО..."
                      className="pl-8 h-8 text-xs bg-background"
                      value={exemptionSearch}
                      onChange={(e) => setExemptionSearch(e.target.value)}
                    />
                  </div>
                )}

                <div className="flex-1 min-h-[220px] max-h-[300px] overflow-y-auto border rounded-lg divide-y bg-background p-1">
                  {groupStudents
                    .filter((s) => s.name.toLowerCase().includes(exemptionSearch.toLowerCase()))
                    .map((st) => {
                      const isExempt = excludedStudentIds.includes(st.id);
                      return (
                        <div
                          key={st.id}
                          onClick={() => {
                            setExcludedStudentIds((prev) =>
                              isExempt ? prev.filter((id) => id !== st.id) : [...prev, st.id]
                            );
                          }}
                          className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors text-xs ${isExempt
                            ? "bg-primary/10 text-primary font-medium"
                            : "hover:bg-muted/50 text-foreground"
                            }`}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`h-4 w-4 rounded border flex items-center justify-center text-[10px] ${isExempt ? "bg-primary text-primary-foreground border-primary" : "border-border"
                                }`}
                            >
                              {isExempt && <Check className="h-3 w-3" />}
                            </div>
                            <span className="truncate">{st.name}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {isExempt ? "Освобожден" : "Дежурит"}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border-t">
              <div className="text-[11px] text-muted-foreground">
                При нажатии на кнопку график дежурств будет пересчитан с учетом выбранных параметров.
              </div>
              <Button
                size="xs"
                onClick={handleApplyDetailedDutySettings}
                disabled={isPending || !currentGroupId}
                className="h-8 text-xs gap-1.5 font-medium shrink-0"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {isPending ? "Расчет..." : "Сохранить и сформировать график"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog for Manual Student Picker / Penalty Picker */}
      <Dialog open={pickerMode !== null} onOpenChange={(open) => !open && setPickerMode(null)}>
        {pickerMode && (
          <DialogContent className="p-4 gap-3 text-xs sm:max-w-[420px]">
            <DialogHeader className="pb-2 border-b gap-1">
              <DialogTitle className="flex items-center gap-2 text-sm font-bold text-foreground">
                {pickerMode.type === "penalty" ? (
                  <>
                    <AlertTriangle className="h-4 w-4 text-primary" /> Назначение за нарушение / опоздание
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 text-primary" /> Назначение дежурного
                  </>
                )}
              </DialogTitle>
              <DialogDescription className="text-xs">
                День: <strong>{pickerMode.dayName}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-1 text-xs">
              {pickerMode.type === "penalty" && (
                <div className="space-y-1">
                  <label className="font-medium text-foreground text-xs">Причина внеочередного дежурства</label>
                  <Select value={penaltyReason} onValueChange={setPenaltyReason}>
                    <SelectTrigger className="h-8 text-xs bg-background">
                      <SelectValue>{penaltyReason}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Опоздание на урок" className="text-xs">Опоздание на урок</SelectItem>
                      <SelectItem value="Нарушение формы/дисциплины" className="text-xs">Нарушение формы / дисциплины</SelectItem>
                      <SelectItem value="Невыполнение обязанностей" className="text-xs">Невыполнение обязанностей</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-1">
                <label className="font-medium text-foreground text-xs">Выберите учащегося</label>
                <Select value={pickerStudentId} onValueChange={(val) => val && setPickerStudentId(val)}>
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue>
                      {groupStudents.find((s) => s.id === pickerStudentId)?.name || "Выберите студента"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {[...groupStudents]
                      .filter((s) => !pickerMode.existingIds.includes(s.id))
                      .sort((a, b) => {
                        const aRecent = a.isRecentDuty ? 1 : 0;
                        const bRecent = b.isRecentDuty ? 1 : 0;
                        if (aRecent !== bRecent) return aRecent - bRecent;
                        return a.name.localeCompare(b.name);
                      })
                      .map((st) => (
                        <SelectItem key={st.id} value={st.id} className="text-xs">
                          <div className="flex items-center justify-between w-full gap-2">
                            <span>{st.name}</span>
                            {st.recentDutyNote ? (
                              <span className="text-[10px] text-primary font-medium">
                                ({st.recentDutyNote})
                              </span>
                            ) : (
                              <span className="text-[10px] text-muted-foreground/60 font-normal">
                                (В очереди)
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
              <Button variant="outline" size="xs" onClick={() => setPickerMode(null)}>
                Отмена
              </Button>
              <Button size="xs" disabled={!pickerStudentId || isPending} onClick={handleConfirmAdd}>
                {pickerMode.type === "penalty" ? (
                  <>
                    <AlertTriangle className="h-3.5 w-3.5 mr-1 text-primary-foreground" /> Назначить за нарушение
                  </>
                ) : (
                  <>
                    <UserPlus className="h-3.5 w-3.5 mr-1" /> Назначить
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Dialog for Replacing an Absent Duty Student */}
      <Dialog open={replaceTarget !== null} onOpenChange={(open) => !open && setReplaceTarget(null)}>
        {replaceTarget && (
          <DialogContent className="p-4 gap-3 text-xs sm:max-w-[420px]">
            <DialogHeader className="pb-2 border-b gap-1">
              <DialogTitle className="flex items-center gap-2 text-sm font-bold text-foreground">
                <RefreshCw className="h-4 w-4 text-primary" /> Назначение замены дежурного
              </DialogTitle>
              <DialogDescription className="text-xs">
                День: <strong>{replaceTarget.dayName}</strong> • Отсутствует:{" "}
                <strong className="text-destructive">{replaceTarget.absentStudentName}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-1 text-xs">
              <div className="space-y-1">
                <label className="font-medium text-foreground text-xs">Выберите заменяющего студента</label>
                <Select
                  value={replacementStudentId}
                  onValueChange={(val) => val && setReplacementStudentId(val)}
                >
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue>
                      {groupStudents.find((s) => s.id === replacementStudentId)?.name || "Выберите студента из группы"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {[...groupStudents]
                      .filter((s) => !replaceTarget.existingIds.includes(s.id) && s.id !== replaceTarget.absentStudentId)
                      .sort((a, b) => {
                        const aRecent = a.isRecentDuty ? 1 : 0;
                        const bRecent = b.isRecentDuty ? 1 : 0;
                        if (aRecent !== bRecent) return aRecent - bRecent;
                        return a.name.localeCompare(b.name);
                      })
                      .map((st) => (
                        <SelectItem key={st.id} value={st.id} className="text-xs">
                          <div className="flex items-center justify-between w-full gap-2">
                            <span>{st.name}</span>
                            {st.recentDutyNote ? (
                              <span className="text-[10px] text-primary font-medium">
                                ({st.recentDutyNote})
                              </span>
                            ) : (
                              <span className="text-[10px] text-muted-foreground/60 font-normal">
                                (В очереди)
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
              <Button variant="outline" size="xs" onClick={() => setReplaceTarget(null)}>
                Отмена
              </Button>
              <Button
                size="xs"
                disabled={!replacementStudentId || isPending}
                onClick={handleConfirmReplace}
                className="font-medium gap-1"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Назначить замену
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Clear Duty Confirmation AlertDialog */}
      <AlertDialog open={isClearConfirmOpen} onOpenChange={setIsClearConfirmOpen}>
        <AlertDialogContent className="p-4 gap-3 text-xs sm:max-w-[400px] place-items-start text-left">
          <AlertDialogHeader className="text-left gap-1">
            <AlertDialogTitle className="text-sm font-bold flex items-center gap-1.5 text-foreground">
              <Trash2 className="h-4 w-4 text-destructive" /> Очистить дежурства?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Вы уверены, что хотите удалить все записи дежурств для группы{" "}
              <strong className="text-foreground">«{currentGroupObj?.name || ""}»</strong>?
              Таблица расписания будет полностью очищена.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2 w-full">
            <AlertDialogCancel className="h-6 px-2.5 text-xs">
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmClear}
              disabled={isPending}
              className="h-6 px-2.5 text-xs bg-destructive text-white hover:bg-destructive/90 font-medium"
            >
              Очистить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
