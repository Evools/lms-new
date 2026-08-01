"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  UserX,
  UserPlus,
  RefreshCw,
  ChevronLeft,
  X,
} from "lucide-react";
import {
  DayDutyGroupDTO,
  generateWeeklyDutyAction,
  addDutyStudentAction,
  removeDutyStudentAction,
  replaceDutyStudentAction,
} from "../actions";

interface DutyScheduleViewProps {
  userRole: string;
  groupsList: { id: string; name: string }[];
  weeklyDays: DayDutyGroupDTO[];
  groupStudents: { id: string; name: string }[];
  selectedGroupId?: string;
}

type StudentPickerMode =
  | { type: "add"; fullDate: string; dayName: string; existingIds: string[] }
  | { type: "replace"; fullDate: string; dayName: string; absentStudentId: string; absentStudentName: string; existingIds: string[] };

export function DutyScheduleView({
  userRole,
  groupsList = [],
  weeklyDays = [],
  groupStudents = [],
  selectedGroupId,
}: DutyScheduleViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [currentGroupId, setCurrentGroupId] = useState<string>(
    selectedGroupId || (groupsList[0]?.id || "")
  );
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Absent tracking: key = `studentId_date`
  const [absentSet, setAbsentSet] = useState<Set<string>>(new Set());

  // Student picker dialog
  const [pickerMode, setPickerMode] = useState<StudentPickerMode | null>(null);
  const [pickerStudentId, setPickerStudentId] = useState<string>("");

  const isAdminOrTeacher = userRole === "ADMIN" || userRole === "TEACHER";

  const handleGroupChange = (groupId: string) => {
    setCurrentGroupId(groupId);
    router.push(`/dashboard/duty?group=${groupId}`);
  };

  const handleAutoRotation = () => {
    if (!currentGroupId) return;
    setErrorMsg(null);
    startTransition(async () => {
      const res = await generateWeeklyDutyAction(currentGroupId);
      if (res.success) {
        setSuccessMsg("График пересчитан! 2–3 дежурных назначены на каждый день недели.");
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setErrorMsg(res.error || "Ошибка при генерации ротации");
      }
    });
  };

  const handleRemoveDuty = (studentId: string, dateStr: string) => {
    setErrorMsg(null);
    startTransition(async () => {
      const res = await removeDutyStudentAction(currentGroupId, studentId, dateStr);
      if (res.success) {
        setSuccessMsg("Студент убран из дежурства.");
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setErrorMsg(res.error || "Ошибка удаления из дежурства");
      }
    });
  };

  const handleMarkAbsent = (studentId: string, fullDate: string) => {
    // Only local state — no DB call. DB change happens on Replace.
    setAbsentSet((prev) => new Set(prev).add(`${studentId}_${fullDate}`));
  };

  const isAbsent = (studentId: string, fullDate: string) =>
    absentSet.has(`${studentId}_${fullDate}`);

  const openAdd = (day: DayDutyGroupDTO) => {
    const existingIds = [
      ...day.dutyStudents.map((s) => s.id),
      ...(day.leaderStudent ? [day.leaderStudent.id] : []),
    ];
    setPickerStudentId("");
    setPickerMode({ type: "add", fullDate: day.fullDate, dayName: day.dayName, existingIds });
  };

  const openReplace = (day: DayDutyGroupDTO, absentStudent: { id: string; name: string }) => {
    const existingIds = [
      ...day.dutyStudents.map((s) => s.id),
      ...(day.leaderStudent ? [day.leaderStudent.id] : []),
    ];
    setPickerStudentId("");
    setPickerMode({
      type: "replace",
      fullDate: day.fullDate,
      dayName: day.dayName,
      absentStudentId: absentStudent.id,
      absentStudentName: absentStudent.name,
      existingIds,
    });
  };

  const handlePickerConfirm = () => {
    if (!pickerMode || !pickerStudentId) return;
    startTransition(async () => {
      let res;
      if (pickerMode.type === "add") {
        res = await addDutyStudentAction(currentGroupId, pickerStudentId, pickerMode.fullDate);
      } else {
        res = await replaceDutyStudentAction(
          currentGroupId,
          pickerMode.absentStudentId,
          pickerStudentId,
          pickerMode.fullDate
        );
        if (res.success) {
          // Remove from absent set since they're now replaced
          setAbsentSet((prev) => {
            const next = new Set(prev);
            next.delete(`${pickerMode.absentStudentId}_${pickerMode.fullDate}`);
            return next;
          });
        }
      }
      if (res.success) {
        setSuccessMsg(
          pickerMode.type === "add" ? "Студент добавлен в дежурство." : "Студент заменён."
        );
        setTimeout(() => setSuccessMsg(null), 3000);
        setPickerMode(null);
      } else {
        setErrorMsg(res.error || "Ошибка");
        setPickerMode(null);
      }
    });
  };

  const selectedGroupObj = groupsList.find((g) => g.id === currentGroupId);
  const todayDutyDay = weeklyDays.find((d) => d.isToday);

  // Build set of studentIds that already have duty this week (across all days)
  const weekDutiedIds = new Set<string>(
    weeklyDays.flatMap((d) =>
      d.dutyStudents.map((s) => s.id)
    )
  );

  // Students in picker: exclude those assigned on THIS specific day (existingIds),
  // but show everyone else — sorted: not-dutied-this-week first, then already-dutied
  const pickerAvailableStudents = pickerMode
    ? groupStudents
        .filter((s) => {
          if (pickerMode.type === "replace") {
            // Exclude the absent student themselves and others on this day
            return s.id !== pickerMode.absentStudentId &&
              !pickerMode.existingIds.filter(id => id !== pickerMode.absentStudentId).includes(s.id);
          }
          return !pickerMode.existingIds.includes(s.id);
        })
        .sort((a, b) => {
          // Not-dutied-this-week first
          const aDutied = weekDutiedIds.has(a.id) ? 1 : 0;
          const bDutied = weekDutiedIds.has(b.id) ? 1 : 0;
          return aDutied - bDutied;
        })
    : [];

  return (
    <div className="w-full space-y-4 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-xs" className="h-7 w-7" render={<Link href="/dashboard/groups" />}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              График дежурств
              {selectedGroupObj && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-medium">
                  {selectedGroupObj.name}
                </Badge>
              )}
            </h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              2–3 дежурных в день · ротация по алфавитному списку
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Select value={currentGroupId} onValueChange={handleGroupChange}>
            <SelectTrigger className="h-8 text-xs w-40 bg-background">
              <SelectValue placeholder="Выберите группу" />
            </SelectTrigger>
            <SelectContent>
              {groupsList.map((g) => (
                <SelectItem key={g.id} value={g.id} className="text-xs">
                  Группа {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {isAdminOrTeacher && (
            <Button
              size="xs"
              onClick={handleAutoRotation}
              disabled={isPending || !currentGroupId}
              className="h-8 text-xs gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {isPending ? "Генерация..." : "Авто-ротация"}
            </Button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 flex items-center gap-2.5 text-xs animate-in fade-in duration-200">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive flex items-center gap-2.5 text-xs animate-in fade-in duration-200">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Today strip */}
      {todayDutyDay && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-primary/15 bg-primary/5">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary text-primary-foreground text-[9px] px-1.5 py-0 font-medium uppercase tracking-wider">
                Сегодня
              </Badge>
              <span className="text-xs font-medium text-foreground">
                {todayDutyDay.dayName}, {todayDutyDay.dateStr}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {todayDutyDay.leaderStudent && (
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Crown className="h-3 w-3 text-primary" />
                  <strong className="text-foreground">{todayDutyDay.leaderStudent.name}</strong>
                </div>
              )}
              {isAdminOrTeacher && (
                <Button
                  size="icon-xs"
                  variant="ghost"
                  className="h-6 w-6 text-muted-foreground hover:text-primary"
                  title="Добавить дежурного"
                  onClick={() => openAdd(todayDutyDay)}
                >
                  <UserPlus className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          <div className="p-3 flex flex-wrap gap-2">
            {todayDutyDay.dutyStudents.map((st) => {
              const absent = isAbsent(st.id, todayDutyDay.fullDate);
              return (
                <div
                  key={st.id}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs transition-all ${
                    absent
                      ? "border-muted bg-muted/50 opacity-60"
                      : "border-primary/20 bg-background"
                  }`}
                >
                  <Avatar className="h-5 w-5 border shrink-0">
                    <AvatarFallback className={`text-[8px] font-bold ${absent ? "bg-muted text-muted-foreground" : "bg-primary/15 text-primary"}`}>
                      {st.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className={absent ? "text-muted-foreground line-through" : "text-foreground font-medium"}>
                    {st.name}
                  </span>
                  {absent ? (
                    <>
                      <Badge variant="outline" className="text-[8px] px-1 py-0 text-destructive border-destructive/30">
                        Отсутствует
                      </Badge>
                      {isAdminOrTeacher && (
                        <Button
                          size="xs"
                          variant="outline"
                          className="h-5 text-[9px] px-1.5 gap-1 text-primary border-primary/30 hover:bg-primary/10"
                          onClick={() => openReplace(todayDutyDay, st)}
                        >
                          <RefreshCw className="h-2.5 w-2.5" /> Заменить
                        </Button>
                      )}
                    </>
                  ) : (
                    isAdminOrTeacher && (
                      <button
                        onClick={() => handleMarkAbsent(st.id, todayDutyDay.fullDate)}
                        className="text-muted-foreground/40 hover:text-destructive transition-colors"
                        title="Отметить отсутствие"
                      >
                        <UserX className="h-3 w-3" />
                      </button>
                    )
                  )}
                </div>
              );
            })}
            {todayDutyDay.dutyStudents.length === 0 && (
              <span className="text-[11px] text-muted-foreground">Дежурные не назначены</span>
            )}
          </div>
        </div>
      )}

      {/* Weekly table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            Расписание на неделю
          </span>
          <span className="text-[10px] text-muted-foreground">Пн — Сб</span>
        </div>

        <div className="rounded-xl border overflow-hidden">
          <div className="grid grid-cols-[80px_1fr_90px] items-center gap-3 px-3 py-2 bg-muted/40 border-b text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            <span>День</span>
            <span>Дежурные студенты</span>
            <span className="text-right">Статус / +</span>
          </div>

          <div className="divide-y">
            {weeklyDays.map((day) => (
              <div
                key={day.fullDate}
                className={`grid grid-cols-[80px_1fr_90px] items-start gap-3 px-3 py-2.5 transition-colors ${
                  day.isToday
                    ? "bg-primary/5"
                    : day.isSunday
                    ? "bg-muted/20 opacity-60"
                    : "hover:bg-muted/20"
                }`}
              >
                {/* Day */}
                <div className="pt-0.5">
                  <div className={`text-xs font-medium ${day.isToday ? "text-primary" : "text-foreground"}`}>
                    {day.dayName}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono">{day.dateStr}</div>
                </div>

                {/* Duty students */}
                <div className="flex flex-wrap gap-1.5 py-0.5">
                  {day.isSunday ? (
                    <span className="text-[10px] text-muted-foreground/50 self-center">Выходной</span>
                  ) : day.dutyStudents.length > 0 ? (
                    day.dutyStudents.map((st) => {
                      const absent = isAbsent(st.id, day.fullDate);
                      return (
                        <div
                          key={st.id}
                          className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs transition-all ${
                            absent
                              ? "border-muted bg-muted/30 opacity-50"
                              : day.isToday
                              ? "border-primary/20 bg-primary/5"
                              : "border-border bg-muted/20"
                          }`}
                        >
                          <Avatar className="h-4 w-4 border shrink-0">
                            <AvatarFallback className={`text-[7px] font-bold ${
                              absent ? "bg-muted text-muted-foreground"
                              : day.isToday ? "bg-primary/15 text-primary"
                              : "bg-muted text-muted-foreground"
                            }`}>
                              {st.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className={`text-[11px] ${absent ? "line-through text-muted-foreground" : day.isToday ? "text-primary font-medium" : "text-foreground"}`}>
                            {st.name}
                          </span>
                          {absent && isAdminOrTeacher && (
                            <button
                              onClick={() => openReplace(day, st)}
                              className="text-primary/60 hover:text-primary transition-colors"
                              title="Заменить"
                            >
                              <RefreshCw className="h-2.5 w-2.5" />
                            </button>
                          )}
                          {isAdminOrTeacher && (
                            <button
                              onClick={() => handleRemoveDuty(st.id, day.fullDate)}
                              className="text-muted-foreground/40 hover:text-destructive transition-colors ml-0.5"
                              title="Убрать дежурного"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <span className="text-[11px] text-muted-foreground/50 self-center">Не назначены</span>
                  )}
                </div>

                {/* Status + add button */}
                <div className="flex flex-col items-end gap-1.5 pt-0.5">
                  {day.isSunday ? (
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-muted-foreground/50">
                      Выходной
                    </Badge>
                  ) : day.isToday ? (
                    <Badge className="bg-primary text-primary-foreground text-[9px] px-1.5 py-0 font-medium">
                      Сегодня
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                      Ожидает
                    </Badge>
                  )}
                  {!day.isSunday && isAdminOrTeacher && (
                    <button
                      onClick={() => openAdd(day)}
                      className="text-[9px] text-muted-foreground/50 hover:text-primary transition-colors flex items-center gap-0.5"
                      title="Добавить дежурного вручную"
                    >
                      <UserPlus className="h-2.5 w-2.5" /> добавить
                    </button>
                  )}
                </div>
              </div>
            ))}

            {weeklyDays.length === 0 && (
              <div className="py-10 text-center text-muted-foreground text-xs space-y-2">
                <Clock className="h-7 w-7 mx-auto text-muted-foreground/30" />
                <div>График не сформирован</div>
                {isAdminOrTeacher && (
                  <p className="text-[10px]">Нажмите «Авто-ротация» для генерации расписания</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Student Picker Dialog */}
      <Dialog open={pickerMode !== null} onOpenChange={(open) => !open && setPickerMode(null)}>
        <DialogContent className="p-4 gap-3 text-xs sm:max-w-[380px]">
          <DialogHeader className="pb-2 border-b gap-1">
            <DialogTitle className="flex items-center gap-2 text-sm font-bold text-foreground">
              {pickerMode?.type === "replace" ? (
                <><RefreshCw className="h-4 w-4 text-primary" /> Замена дежурного</>
              ) : (
                <><UserPlus className="h-4 w-4 text-primary" /> Добавить дежурного</>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {pickerMode?.type === "replace" ? (
                <>Замена <strong>{pickerMode.absentStudentName}</strong> · {pickerMode.dayName}</>
              ) : (
                <>Ручное назначение · {pickerMode?.dayName}</>
              )}
            </DialogDescription>
          </DialogHeader>

          {pickerAvailableStudents.length === 0 ? (
            <div className="py-6 text-center text-muted-foreground text-xs">
              Все студенты группы уже назначены на этот день
            </div>
          ) : (
            <div className="space-y-1 max-h-52 overflow-y-auto">
              {pickerAvailableStudents.map((st) => (
                <button
                  key={st.id}
                  onClick={() => setPickerStudentId(st.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left transition-all ${
                    pickerStudentId === st.id
                      ? "border-primary bg-primary/8 ring-1 ring-primary/30"
                      : "border-border hover:bg-muted/30"
                  }`}
                >
                  <Avatar className="h-6 w-6 border shrink-0">
                    <AvatarFallback className={`text-[9px] font-bold ${pickerStudentId === st.id ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {st.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className={`text-xs font-medium ${pickerStudentId === st.id ? "text-primary" : "text-foreground"}`}>
                    {st.name}
                  </span>
                </button>
              ))}
            </div>
          )}

          <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-1">
            <Button variant="outline" size="xs" onClick={() => setPickerMode(null)}>
              Отмена
            </Button>
            <Button
              size="xs"
              disabled={!pickerStudentId || isPending}
              onClick={handlePickerConfirm}
            >
              {pickerMode?.type === "replace" ? (
                <><RefreshCw className="h-3.5 w-3.5 mr-1" /> Заменить</>
              ) : (
                <><UserPlus className="h-3.5 w-3.5 mr-1" /> Добавить</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
