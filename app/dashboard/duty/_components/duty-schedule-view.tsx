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
} from "lucide-react";
import {
  DayDutyGroupDTO,
  generateWeeklyDutyAction,
  addDutyStudentAction,
  removeDutyStudentAction,
  AllGroupsTodayDutyDTO,
  StudentDutyStatDTO,
  GroupStudentWithDutyInfo,
} from "../actions";

interface DutyScheduleViewProps {
  userRole: string;
  groupsList: { id: string; name: string }[];
  weeklyDays: DayDutyGroupDTO[];
  groupStudents: GroupStudentWithDutyInfo[];
  allGroupsTodayDuty: AllGroupsTodayDutyDTO[];
  groupDutyStats: StudentDutyStatDTO[];
  selectedGroupId?: string;
}

type StudentPickerMode = {
  type: "add";
  fullDate: string;
  dayName: string;
  existingIds: string[];
};

export function DutyScheduleView({
  userRole,
  groupsList = [],
  weeklyDays = [],
  groupStudents = [],
  allGroupsTodayDuty = [],
  groupDutyStats = [],
  selectedGroupId,
}: DutyScheduleViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [currentGroupId, setCurrentGroupId] = useState<string>(
    selectedGroupId || (groupsList[0]?.id || "")
  );

  const [activeTab, setActiveTab] = useState<"WEEKLY" | "ALL_GROUPS" | "STATS">("WEEKLY");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Student picker dialog
  const [pickerMode, setPickerMode] = useState<StudentPickerMode | null>(null);
  const [pickerStudentId, setPickerStudentId] = useState<string>("");

  const isAdminOrTeacher = userRole === "ADMIN" || userRole === "TEACHER";
  const currentGroupObj = groupsList.find((g) => g.id === currentGroupId);

  // Group Switcher
  const handleGroupChange = (groupId: string) => {
    setCurrentGroupId(groupId);
    router.push(`/dashboard/duty?group=${groupId}`);
  };

  // Generate auto-rotation
  const handleAutoRotation = () => {
    if (!currentGroupId) return;
    setErrorMsg(null);
    startTransition(async () => {
      const res = await generateWeeklyDutyAction(currentGroupId);
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

  // Confirm Manual Add
  const handleConfirmAdd = () => {
    if (!pickerMode || !pickerStudentId) return;
    setErrorMsg(null);
    startTransition(async () => {
      const res = await addDutyStudentAction(currentGroupId, pickerStudentId, pickerMode.fullDate);
      if (res.success) {
        setSuccessMsg("Дежурный успешно добавлен!");
        setPickerMode(null);
        setPickerStudentId("");
        router.refresh();
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setErrorMsg(res.error || "Ошибка добавления дежурного");
      }
    });
  };

  // Open add dialog
  const openAddModal = (day: DayDutyGroupDTO) => {
    const existing = day.dutyStudents.map((s) => s.id);
    const available = groupStudents.filter((s) => !existing.includes(s.id));
    setPickerMode({
      type: "add",
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
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-4 rounded-xl border">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/groups"
              className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-base font-bold text-foreground flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" /> Панель управления дежурствами лицея
            </h1>
          </div>
          <p className="text-xs text-muted-foreground pl-6">
            Централизованный аудит, автоматическая ротация и оперативные замены
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="xs" onClick={handlePrint} className="h-8 text-xs gap-1.5">
            <Printer className="h-3.5 w-3.5" /> Печать
          </Button>

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

      {/* Group Selector & KPI Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Selector Card */}
        <div className="bg-card p-3 rounded-xl border flex flex-col justify-between space-y-2">
          <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-primary" /> Учебная группа
          </div>
          <Select value={currentGroupId} onValueChange={handleGroupChange}>
            <SelectTrigger className="h-8 text-xs font-semibold bg-background">
              <SelectValue>{currentGroupObj?.name || "Выберите группу"}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {groupsList.map((g) => (
                <SelectItem key={g.id} value={g.id} className="text-xs font-medium">
                  Группа {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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
      {successMsg && (
        <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Mode Tabs & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border-b pb-2">
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
            onClick={() => setActiveTab("ALL_GROUPS")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              activeTab === "ALL_GROUPS"
                ? "bg-background text-foreground shadow-2xs border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Building2 className="h-3.5 w-3.5 inline-block mr-1.5 text-primary" />
            Сводка по лицею (Сегодня)
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
        <Card className="p-0 border overflow-hidden">
          <CardHeader className="p-3 border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xs font-bold text-foreground">
                  Недельная ведомость дежурств
                </CardTitle>
                <CardDescription className="text-[11px] text-muted-foreground">
                  Расписание дежурных по учебным дням недели
                </CardDescription>
              </div>

              {isAdminOrTeacher && (
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => {
                    const targetDay = weeklyDays.find((d) => d.isToday && !d.isSunday) || weeklyDays.find((d) => !d.isSunday) || weeklyDays[0];
                    if (targetDay) openAddModal(targetDay);
                  }}
                  className="h-7 text-xs gap-1 border-primary/20 text-primary hover:bg-primary/10"
                >
                  <UserPlus className="h-3.5 w-3.5" /> Назначить дежурного
                </Button>
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
                        day.dutyStudents.map((st) => (
                          <div
                            key={st.id}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium transition-all ${
                              day.isToday
                                ? "border-primary/30 bg-primary/10 text-primary"
                                : "border-border bg-muted/20 text-foreground"
                            }`}
                          >
                            <Avatar className="h-4 w-4 border shrink-0">
                              <AvatarFallback className={`text-[7px] font-bold ${day.isToday ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                                {st.name.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate">{st.name}</span>
                            {isAdminOrTeacher && (
                              <button
                                type="button"
                                onClick={() => handleRemoveDuty(st.id, day.fullDate)}
                                className="text-muted-foreground/40 hover:text-destructive transition-colors ml-0.5"
                                title="Убрать из дежурных"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        ))
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
                          onClick={() => openAddModal(day)}
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

      {/* TAB 2: ALL GROUPS TODAY SUMMARY */}
      {activeTab === "ALL_GROUPS" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-primary" /> Сводное табло дежурств по всем группам лицея на сегодня
            </h2>
            <Badge variant="outline" className="text-[10px]">
              Всего групп: {allGroupsTodayDuty.length}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {allGroupsTodayDuty.map((g) => (
              <Card key={g.groupId} className="p-3 border hover:border-primary/40 transition-all space-y-2.5">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="font-bold text-xs text-foreground flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-primary" /> Группа {g.groupName}
                  </div>
                  <Link
                    href={`/dashboard/duty?group=${g.groupId}`}
                    className="text-[10px] text-primary hover:underline flex items-center gap-0.5 font-medium"
                  >
                    Перейти <ArrowRight className="h-2.5 w-2.5" />
                  </Link>
                </div>

                {g.leaderStudent && (
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Crown className="h-3 w-3 text-primary shrink-0" />
                    <span>Староста: <strong>{g.leaderStudent.name}</strong></span>
                  </div>
                )}

                <div className="space-y-1">
                  <div className="text-[10px] text-muted-foreground font-medium">Дежурные на сегодня:</div>
                  {g.dutyStudents.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {g.dutyStudents.map((st) => (
                        <div
                          key={st.id}
                          className="flex items-center gap-1 px-2 py-1 rounded-md border border-primary/20 bg-primary/5 text-primary text-xs font-medium"
                        >
                          <Avatar className="h-4 w-4 border shrink-0">
                            <AvatarFallback className="text-[7px] font-bold bg-primary/20 text-primary">
                              {st.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span>{st.name}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[11px] text-muted-foreground/60 italic py-1">
                      Дежурные не назначены
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: DUTY STATS & AUDIT */}
      {activeTab === "STATS" && (
        <Card className="p-0 border overflow-hidden">
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

      {/* Dialog for Manual Student Picker */}
      <Dialog open={pickerMode !== null} onOpenChange={(open) => !open && setPickerMode(null)}>
        {pickerMode && (
          <DialogContent className="p-4 gap-3 text-xs sm:max-w-[420px]">
            <DialogHeader className="pb-2 border-b gap-1">
              <DialogTitle className="flex items-center gap-2 text-sm font-bold text-foreground">
                <UserPlus className="h-4 w-4 text-primary" /> Назначение дежурного
              </DialogTitle>
              <DialogDescription className="text-xs">
                День: <strong>{pickerMode.dayName}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-1 text-xs">
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
                              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-normal">
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
                <UserPlus className="h-3.5 w-3.5 mr-1" /> Назначить
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
