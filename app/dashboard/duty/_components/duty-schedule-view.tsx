"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  ChevronLeft,
} from "lucide-react";
import { DayDutyGroupDTO, generateWeeklyDutyAction, markDutyAbsentAction } from "../actions";

interface DutyScheduleViewProps {
  userRole: string;
  groupsList: { id: string; name: string }[];
  weeklyDays: DayDutyGroupDTO[];
  selectedGroupId?: string;
}

export function DutyScheduleView({
  userRole,
  groupsList = [],
  weeklyDays = [],
  selectedGroupId,
}: DutyScheduleViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [currentGroupId, setCurrentGroupId] = useState<string>(
    selectedGroupId || (groupsList[0]?.id || "")
  );
  const [successMsg, setSuccessMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // Track locally which students are marked absent (studentId_date)
  const [absentSet, setAbsentSet] = useState<Set<string>>(new Set());

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
        setSuccessMsg(true);
        setTimeout(() => setSuccessMsg(false), 3000);
      } else {
        setErrorMsg(res.error || "Ошибка при генерации ротации");
      }
    });
  };

  const handleMarkAbsent = (studentId: string, fullDate: string) => {
    const key = `${studentId}_${fullDate}`;
    startTransition(async () => {
      const res = await markDutyAbsentAction(currentGroupId, studentId, fullDate);
      if (res.success) {
        setAbsentSet((prev) => new Set(prev).add(key));
      }
    });
  };

  const isAbsent = (studentId: string, fullDate: string) =>
    absentSet.has(`${studentId}_${fullDate}`);

  const selectedGroupObj = groupsList.find((g) => g.id === currentGroupId);
  const todayDutyDay = weeklyDays.find((d) => d.isToday);

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
              2–3 дежурных в день · ротация по алфавитному списку группы
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
          <span><strong>График пересчитан!</strong> 2–3 дежурных назначены на каждый день недели.</span>
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
          <div className="flex items-center justify-between px-3 py-2 border-b border-primary/15 bg-primary/8">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary text-primary-foreground text-[9px] px-1.5 py-0 font-medium uppercase tracking-wider">
                Сегодня
              </Badge>
              <span className="text-xs font-medium text-foreground">
                {todayDutyDay.dayName}, {todayDutyDay.dateStr}
              </span>
            </div>
            {todayDutyDay.leaderStudent && (
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Crown className="h-3 w-3 text-primary" />
                Ст. дежурный: <strong className="text-foreground ml-0.5">{todayDutyDay.leaderStudent.name}</strong>
              </div>
            )}
          </div>

          <div className="p-3 flex flex-wrap gap-2">
            {todayDutyDay.dutyStudents.map((st) => {
              const absent = isAbsent(st.id, todayDutyDay.fullDate);
              return (
                <div
                  key={st.id}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs transition-all ${
                    absent
                      ? "border-muted bg-muted/50 opacity-50"
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
                    <Badge variant="outline" className="text-[8px] px-1 py-0 text-muted-foreground">
                      Отсутствует
                    </Badge>
                  ) : (
                    isAdminOrTeacher && (
                      <button
                        onClick={() => handleMarkAbsent(st.id, todayDutyDay.fullDate)}
                        className="text-muted-foreground/50 hover:text-destructive transition-colors"
                        title="Отметить как отсутствующего"
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
          {/* Table header */}
          <div className="grid grid-cols-[100px_1fr_80px] items-center gap-3 px-3 py-2 bg-muted/40 border-b text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            <span>День</span>
            <span>Дежурные студенты</span>
            <span className="text-right">Статус</span>
          </div>

          <div className="divide-y">
            {weeklyDays.map((day) => (
              <div
                key={day.fullDate}
                className={`grid grid-cols-[100px_1fr_80px] items-start gap-3 px-3 py-2.5 transition-colors ${
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
                  {day.leaderStudent && !day.isSunday && (
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                      <Crown className="h-2.5 w-2.5 text-primary shrink-0" />
                      <span className="truncate">{day.leaderStudent.name}</span>
                    </div>
                  )}
                </div>

                {/* Duty students */}
                <div className="flex flex-wrap gap-1.5 py-0.5">
                  {day.isSunday ? (
                    <span className="text-[10px] text-muted-foreground/50 self-center">Выходной день</span>
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
                            <AvatarFallback className={`text-[7px] font-bold ${absent ? "bg-muted text-muted-foreground" : day.isToday ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                              {st.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className={`text-[11px] ${absent ? "line-through text-muted-foreground" : day.isToday ? "text-primary font-medium" : "text-foreground"}`}>
                            {st.name}
                          </span>
                          {absent && (
                            <span className="text-[9px] text-muted-foreground/60">отсутствует</span>
                          )}
                          {!absent && isAdminOrTeacher && day.isToday && (
                            <button
                              onClick={() => handleMarkAbsent(st.id, day.fullDate)}
                              className="text-muted-foreground/40 hover:text-destructive transition-colors"
                              title="Отметить отсутствие"
                            >
                              <UserX className="h-2.5 w-2.5" />
                            </button>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <span className="text-[11px] text-muted-foreground/50 self-center">Не назначены</span>
                  )}
                </div>

                {/* Status */}
                <div className="flex justify-end pt-0.5">
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
    </div>
  );
}
