"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
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
} from "lucide-react";
import {
  DayDutyGroupDTO,
  generateWeeklyDutyAction,
  addDutyStudentAction,
  removeDutyStudentAction,
  addDisciplinaryDutyAction,
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
}: DutyScheduleViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [currentGroupId, setCurrentGroupId] = useState<string>(
    selectedGroupId || (groupsList[0]?.id || "")
  );

  const [activeTab, setActiveTab] = useState<"WEEKLY" | "STATS">("WEEKLY");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  const isAdminOrTeacher = userRole === "ADMIN" || userRole === "TEACHER";
  const currentGroupObj = groupsList.find((g) => g.id === currentGroupId);

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
    setErrorMsg(null);
    startTransition(async () => {
      const countParam = dutyCountPerDay === "auto" ? undefined : Number(dutyCountPerDay);
      const res = await generateWeeklyDutyAction(currentGroupId, countParam);
      if (res.success) {
        setSuccessMsg("Честная авто-ротация успешно сформирована!");
        router.refresh();
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setErrorMsg(res.error || "Ошибка при генерации ротации");
      }
    });
  };

  // Remove duty student
  const handleRemoveDuty = (studentId: string, dateStr: string) => {
    setErrorMsg(null);
    startTransition(async () => {
      const res = await removeDutyStudentAction(currentGroupId, studentId, dateStr);
      if (res.success) {
        setSuccessMsg("Дежурный убран из расписания.");
        router.refresh();
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setErrorMsg(res.error || "Ошибка удаления из дежурства");
      }
    });
  };

  // Mark student absent
  const handleMarkAbsent = (studentId: string, fullDate: string, reason: string = "Прогул/Отсутствие") => {
    setAbsentMap((prev) => ({
      ...prev,
      [`${studentId}_${fullDate}`]: reason,
    }));
    setSuccessMsg("Пропуск зафиксирован. Вы можете назначить замену.");
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Confirm Add (Standard or Penalty)
  const handleConfirmAdd = () => {
    if (!pickerMode || !pickerStudentId) return;
    setErrorMsg(null);

    startTransition(async () => {
      let res;
      if (pickerMode.type === "penalty") {
        res = await addDisciplinaryDutyAction(
          currentGroupId,
          pickerStudentId,
          pickerMode.fullDate,
          penaltyReason
        );
      } else {
        res = await addDutyStudentAction(currentGroupId, pickerStudentId, pickerMode.fullDate);
      }

      if (res.success) {
        setSuccessMsg(
          pickerMode.type === "penalty"
            ? `Внеочередное дежурство (${penaltyReason}) назначено!`
            : "Дежурный успешно добавлен!"
        );
        setPickerMode(null);
        setPickerStudentId("");
        router.refresh();
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setErrorMsg(res.error || "Ошибка сохранения дежурного");
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

  // Printable Handler
  const handlePrint = () => {
    window.print();
  };

  // Filtered days by search query
  const filteredWeeklyDays = weeklyDays.map((day) => {
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

  // Calculate Metrics
  const totalShiftsThisWeek = weeklyDays.reduce((acc, d) => acc + (d.dutyStudents?.length || 0), 0);
  const todayObj = weeklyDays.find((d) => d.isToday);
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
            <Link
              href={currentGroupId ? `/dashboard/groups/${currentGroupId}` : "/dashboard/groups"}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-base font-bold text-foreground flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" /> Панель управления дежурствами лицея
            </h1>
          </div>
          <p className="text-xs text-muted-foreground pl-6">
            Централизованный аудит, дисциплинарные назначения, автоматическая ротация и замены
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="xs" onClick={handlePrint} className="h-8 text-xs gap-1.5">
            <Printer className="h-3.5 w-3.5" /> Печать (A4)
          </Button>

          {isAdminOrTeacher && (
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
          {isAdminOrTeacher && (
            <Button
              size="xs"
              onClick={handleAutoRotation}
              disabled={isPending || !currentGroupId}
              className="h-8 text-xs gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {isPending ? "Расчет..." : "Авто-ротация"}
            </Button>
          )}
        </div>
      </div>

      {/* Screen KPI Bar */}
      <div className="print:hidden grid grid-cols-1 md:grid-cols-3 gap-3">

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
            <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-0.5">
              <ShieldCheck className="h-3 w-3" /> Без повторов
            </div>
          </div>
          <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Users className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Alert Messages */}
      {!isDutyEnabled && (
        <div className="print:hidden p-3.5 rounded-xl border border-destructive/30 bg-destructive/5 text-destructive text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
            <span>
              Дежурства для группы <strong>{currentGroupObj?.name || ""}</strong> отключены в настройках группы. График не рассчитывается.
            </span>
          </div>
          {currentGroupId && (
            <Link href={`/dashboard/groups/${currentGroupId}`}>
              <Button size="xs" variant="outline" className="h-7 text-xs gap-1 border-destructive/30 text-destructive hover:bg-destructive/10 shrink-0">
                Настройки группы
              </Button>
            </Link>
          )}
        </div>
      )}

      {successMsg && (
        <div className="print:hidden p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="print:hidden p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Mode Tabs & Filter Bar */}
      <div className="print:hidden flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border-b pb-2">
        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border">
          <button
            type="button"
            onClick={() => setActiveTab("WEEKLY")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              activeTab === "WEEKLY"
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
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              activeTab === "STATS"
                ? "bg-background text-foreground shadow-2xs border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5 inline-block mr-1.5 text-primary" />
            Аудит и рейтинг
          </button>
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

      {/* TAB 1: WEEKLY GROUP SCHEDULE */}
      {activeTab === "WEEKLY" && (
        <Card className="print:hidden p-0 border overflow-hidden">
          <CardHeader className="p-3 border-b bg-muted/30">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle className="text-xs font-bold text-foreground">
                  Недельная ведомость дежурств
                </CardTitle>
                <CardDescription className="text-[11px] text-muted-foreground">
                  Расписание дежурных, внеочередные назначения и учет пропусков
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
            <div className="divide-y">
              <div className="grid grid-cols-[110px_1fr_auto] items-center gap-3 px-3 py-2 bg-muted/40 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
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
                    className={`grid grid-cols-[110px_1fr_auto] items-center gap-3 px-3 py-2.5 transition-colors ${
                      day.isToday
                        ? "bg-primary/5"
                        : day.isSunday
                        ? "bg-muted/20 opacity-60"
                        : "hover:bg-muted/20"
                    }`}
                  >
                    {/* Day & Date */}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-bold ${day.isToday ? "text-primary" : "text-foreground"}`}>
                          {day.dayName}
                        </span>
                        {day.isToday && (
                          <Badge className="bg-primary text-primary-foreground text-[8px] px-1 py-0 font-medium">
                            Сегодня
                          </Badge>
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{day.dateStr}</div>
                    </div>

                    {/* Duty Students */}
                    <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                      {day.isSunday ? (
                        <span className="text-[11px] text-muted-foreground/60 italic">Выходной день</span>
                      ) : day.dutyStudents && day.dutyStudents.length > 0 ? (
                        day.dutyStudents.map((st) => {
                          const absentReason = absentMap[`${st.id}_${day.fullDate}`];
                          return (
                            <div
                              key={st.id}
                              className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium transition-all ${
                                absentReason
                                  ? "border-destructive/30 bg-destructive/10 text-destructive line-through opacity-70"
                                  : day.isToday
                                  ? "border-primary/30 bg-primary/10 text-primary"
                                  : "border-border bg-muted/20 text-foreground"
                              }`}
                            >
                              <Avatar className="h-4 w-4 border shrink-0">
                                <AvatarFallback className={`text-[7px] font-bold ${
                                  absentReason ? "bg-destructive/20 text-destructive"
                                  : day.isToday ? "bg-primary/20 text-primary"
                                  : "bg-muted text-muted-foreground"
                                }`}>
                                  {st.name.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="truncate">{st.name}</span>

                              {absentReason && (
                                <span className="text-[9px] font-normal no-underline text-destructive font-semibold">
                                  ({absentReason})
                                </span>
                              )}

                              {isAdminOrTeacher && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger render={
                                    <button
                                      type="button"
                                      className="p-1 rounded hover:bg-muted/80 text-muted-foreground/60 hover:text-foreground transition-colors ml-0.5"
                                    />
                                  }>
                                    <MoreVertical className="h-3 w-3" />
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="text-xs p-1 min-w-[160px]">
                                    {!absentReason && (
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
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <span className="text-[11px] text-muted-foreground/50">Не назначены</span>
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
              <div className="grid grid-cols-[1fr_120px_140px_100px] items-center gap-3 px-3 py-2 bg-muted/40 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                <span>Студент</span>
                <span>Статус</span>
                <span>Последнее дежурство</span>
                <span className="text-right">Всего смен</span>
              </div>

              {groupDutyStats.map((st) => (
                <div key={st.studentId} className="grid grid-cols-[1fr_120px_140px_100px] items-center gap-3 px-3 py-2.5 hover:bg-muted/20">
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
                    {st.totalDutiesCount > 0 ? (
                      <Badge variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                        Активный
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

                  <div className="text-right font-bold text-foreground pr-2">
                    {st.totalDutiesCount} дн.
                  </div>
                </div>
              ))}
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
                            {st.recentDutyNote && (
                              <span className="text-[10px] text-primary font-normal">
                                ({st.recentDutyNote})
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
    </div>
  );
}
