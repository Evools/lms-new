"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Users,
  UserCheck,
  Crown,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  GraduationCap,
  ShieldCheck,
  Building2,
  Check,
} from "lucide-react";
import { DayDutyGroupDTO, generateWeeklyDutyAction } from "../actions";

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

  const selectedGroupObj = groupsList.find((g) => g.id === currentGroupId);
  const todayDutyDay = weeklyDays.find((d) => d.isToday) || weeklyDays[0];

  return (
    <div className="w-full space-y-6 pb-20 text-xs">
      {/* Top Navigation & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              График дежурств по лицею
            </h1>
            {selectedGroupObj && (
              <Badge variant="secondary" className="font-mono text-xs px-2.5 py-0.5">
                Группа: {selectedGroupObj.name}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Календарное распределение дежурных по учебным кабинетам, контроль чистоты и порядка
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Select Group Filter */}
          <Select value={currentGroupId} onValueChange={handleGroupChange}>
            <SelectTrigger className="h-8 text-xs w-44 bg-background">
              <SelectValue placeholder="Выберите группу" />
            </SelectTrigger>
            <SelectContent>
              {groupsList.map((g) => (
                <SelectItem key={g.id} value={g.id}>
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
              className="h-8 text-xs gap-1.5 shadow-xs"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              {isPending ? "Ротация..." : "Авто-ротация на неделю"}
            </Button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 flex items-center gap-3 animate-in fade-in duration-200">
          <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div className="text-xs">
            <strong>График дежурств пересчитан!</strong> Все студенты группы распределены по дням недели.
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive flex items-center gap-3 animate-in fade-in duration-200">
          <AlertCircle className="h-4.5 w-4.5 shrink-0 text-destructive" />
          <div className="text-xs">{errorMsg}</div>
        </div>
      )}

      {/* Hero Banner: Today's Duty Summary */}
      {todayDutyDay && (
        <Card className="border bg-gradient-to-r from-primary/10 via-primary/5 to-background shadow-xs overflow-hidden">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary text-primary-foreground text-[10px] uppercase font-bold tracking-wider">
                    Дежурство сегодня
                  </Badge>
                  <span className="text-xs font-semibold text-foreground">
                    {todayDutyDay.dayName}, {todayDutyDay.dateStr}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-foreground mt-1">
                  Ответственные за порядок в кабинете
                </h2>
                <p className="text-xs text-muted-foreground">
                  Обязанности: проветривание кабинета, подготвка доски к урокам, проверка порядка на столах
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-[280px]">
                <div className="bg-background/90 border p-3 rounded-xl flex items-center gap-3 shadow-2xs">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                    <Crown className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] text-muted-foreground uppercase font-semibold">Старший дежурный</div>
                    <div className="text-xs font-bold text-foreground truncate mt-0.5">
                      {todayDutyDay.leaderStudent ? todayDutyDay.leaderStudent.name : "Не назначен"}
                    </div>
                  </div>
                </div>

                <div className="bg-background/90 border p-3 rounded-xl flex items-center gap-3 shadow-2xs">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <UserCheck className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] text-muted-foreground uppercase font-semibold">Дежурный студент</div>
                    <div className="text-xs font-bold text-foreground truncate mt-0.5">
                      {todayDutyDay.dutyStudent ? todayDutyDay.dutyStudent.name : "Не назначен"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weekly Duty Calendar Grid (Mon - Sat) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Сетка дежурств на текущую неделю
          </h2>
          <Badge variant="outline" className="text-[10px]">
            Понедельник — Суббота
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {weeklyDays.map((day) => (
            <Card
              key={day.fullDate}
              className={`border shadow-none transition-all ${
                day.isToday
                  ? "border-primary/60 bg-primary/5 shadow-xs"
                  : day.isSunday
                  ? "bg-muted/20 opacity-75"
                  : "hover:border-primary/30"
              }`}
            >
              <CardHeader className="py-2.5 px-3.5 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-foreground">{day.dayName}</span>
                    <span className="text-[11px] text-muted-foreground font-mono">{day.dateStr}</span>
                  </div>
                  {day.isToday && (
                    <Badge className="bg-primary text-primary-foreground text-[9px] px-1.5 py-0">
                      Сегодня
                    </Badge>
                  )}
                  {day.isSunday && (
                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                      Выходной
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-3 space-y-2.5 text-xs">
                {!day.isSunday ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-[11px] flex items-center gap-1">
                        <Crown className="h-3 w-3 text-amber-500" /> Старший:
                      </span>
                      <span className="font-semibold text-foreground truncate max-w-[140px]">
                        {day.leaderStudent ? day.leaderStudent.name : "Не назначен"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-[11px] flex items-center gap-1">
                        <UserCheck className="h-3 w-3 text-emerald-600 dark:text-emerald-400" /> Дежурный:
                      </span>
                      <span className="font-semibold text-foreground truncate max-w-[140px]">
                        {day.dutyStudent ? day.dutyStudent.name : "Не назначен"}
                      </span>
                    </div>

                    <div className="pt-2 border-t flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">Статус:</span>
                      <Badge
                        variant="outline"
                        className={
                          day.isToday
                            ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20 text-[9px] px-1.5 py-0"
                            : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 text-[9px] px-1.5 py-0"
                        }
                      >
                        {day.isToday ? "Дежурит сегодня" : "Назначен"}
                      </Badge>
                    </div>
                  </>
                ) : (
                  <div className="py-4 text-center text-muted-foreground text-[11px]">
                    Воскресенье — Учебных занятий нет
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
