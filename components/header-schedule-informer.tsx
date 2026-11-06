"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Clock,
  CalendarCheck,
  Coffee,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  BookOpen,
  MapPin,
  User,
  Sparkles,
  Check,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  getHeaderCurrentStatusAction,
  type HeaderStatusDTO,
} from "@/app/dashboard/schedule/actions";

export function HeaderScheduleInformer() {
  const [status, setStatus] = useState<HeaderStatusDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(undefined);

  const fetchStatus = (groupId?: string) => {
    getHeaderCurrentStatusAction(groupId)
      .then((data) => {
        setStatus(data);
        if (data?.selectedGroupId && !groupId) {
          setSelectedGroupId(data.selectedGroupId);
        }
      })
      .catch((err) => {
        console.error("Failed to load header status:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    let savedGroupId: string | undefined = undefined;
    try {
      const saved = localStorage.getItem("lms_informer_group_id");
      if (saved) savedGroupId = saved;
    } catch {}

    if (savedGroupId) {
      setSelectedGroupId(savedGroupId);
      fetchStatus(savedGroupId);
    } else {
      fetchStatus();
    }

    // Refresh status every 60 seconds to keep countdown accurate
    const interval = setInterval(() => {
      fetchStatus(selectedGroupId);
    }, 60000);
    return () => clearInterval(interval);
  }, [selectedGroupId]);

  const handleGroupChange = (newGroupId: string) => {
    setSelectedGroupId(newGroupId);
    try {
      localStorage.setItem("lms_informer_group_id", newGroupId);
    } catch {}
    fetchStatus(newGroupId);
  };

  if (loading || !status) {
    return (
      <div className="hidden md:flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-border/60 bg-muted/30 text-xs text-muted-foreground animate-pulse">
        <Clock className="h-3 w-3" />
        <span className="text-[11px]">Загрузка расписания...</span>
      </div>
    );
  }

  // Determine label for the header pill
  const { currentLesson, nextLesson, isBreak, breakMinutesLeft } = status;

  const currentGroupName =
    status.allGroups?.find((g) => g.id === (status.selectedGroupId || selectedGroupId))?.name ||
    status.groupName ||
    "Группа";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1.5 h-7 px-2.5 rounded-md border text-xs font-medium transition-colors hover:bg-muted/60 outline-none select-none cursor-pointer">
        {/* Active Lesson / Break / Finished status */}
        {currentLesson ? (
          <div className="flex items-center gap-1.5 text-primary">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <span className="font-semibold text-[11px] truncate max-w-[150px] sm:max-w-[220px]">
              {currentLesson.pairNumber} пара: {currentLesson.subject}
            </span>
            {currentLesson.minutesLeft !== undefined && (
              <span className="text-[10px] text-muted-foreground font-mono hidden sm:inline">
                • ещё {currentLesson.minutesLeft} мин
              </span>
            )}
          </div>
        ) : isBreak && nextLesson ? (
          <div className="flex items-center gap-1 text-foreground">
            <Coffee className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-[11px] font-medium">Перемена</span>
            {breakMinutesLeft !== undefined && (
              <span className="text-[10px] text-muted-foreground font-mono hidden sm:inline">
                ({breakMinutesLeft} мин до {nextLesson.pairNumber} пары)
              </span>
            )}
          </div>
        ) : nextLesson ? (
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3 w-3 shrink-0" />
            <span className="text-[11px]">
              {nextLesson.pairNumber} пара в {nextLesson.time.split("–")[0].trim()}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-muted-foreground">
            <CalendarCheck className="h-3 w-3 shrink-0" />
            <span className="text-[11px] hidden sm:inline">Пары завершены</span>
            <span className="text-[11px] sm:hidden">Расписание</span>
          </div>
        )}

        <ChevronDown className="h-3 w-3 opacity-50 shrink-0 ml-0.5" />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={6}
        className="w-[320px] sm:w-[360px] p-3 text-xs space-y-2.5 rounded-xl border bg-popover shadow-lg"
      >
        {/* Top Header Card */}
        <div className="border-b pb-2 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="font-bold text-xs text-foreground capitalize flex items-center gap-1.5 flex-wrap">
              <span>{status.dayName}</span>
              {status.allGroups && status.allGroups.length > 1 ? (
                <div
                  className="inline-block"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <Select
                    value={status.selectedGroupId || selectedGroupId}
                    onValueChange={(val) => handleGroupChange(val)}
                  >
                    <SelectTrigger className="h-6 w-auto min-w-[85px] max-w-[140px] px-2 py-0 text-[11px] font-mono font-semibold bg-muted/60 border-border/80">
                      <span className="truncate">{currentGroupName}</span>
                    </SelectTrigger>
                    <SelectContent align="start" className="z-70 max-h-56">
                      {status.allGroups.map((g) => (
                        <SelectItem key={g.id} value={g.id} className="text-xs font-mono">
                          {g.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : status.groupName ? (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-muted text-muted-foreground border">
                  {status.groupName}
                </span>
              ) : null}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{status.fullDate}</div>
          </div>

          <div className="text-right shrink-0">
            {currentLesson ? (
              <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                {currentLesson.room}
              </Badge>
            ) : isBreak ? (
              <Badge variant="secondary" className="text-[10px]">
                Перемена
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-[10px]">
                Отдых
              </Badge>
            )}
          </div>
        </div>

        {/* Timetable for Today */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-foreground">
            <span>Расписание пар на сегодня:</span>
            <span className="text-[10px] text-muted-foreground font-normal">
              {status.lessonsToday.length} пар(ы)
            </span>
          </div>

          {status.lessonsToday.length > 0 ? (
            <div className="space-y-1 max-h-[220px] overflow-y-auto pr-0.5">
              {status.lessonsToday.map((lesson) => {
                const isActive = lesson.status === "active";
                const isPast = lesson.status === "past";

                return (
                  <div
                    key={lesson.id}
                    className={`p-2 rounded-lg border transition-colors flex items-start justify-between gap-2 ${
                      isActive
                        ? "bg-primary/10 border-primary/40 text-foreground shadow-2xs"
                        : isPast
                        ? "bg-muted/20 border-border/40 opacity-60 text-muted-foreground"
                        : "bg-card border-border/80 text-foreground"
                    }`}
                  >
                    <div className="flex items-start gap-2 min-w-0">
                      <span
                        className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 ${
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : isPast
                            ? "bg-muted text-muted-foreground"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        {isPast ? <Check className="h-3 w-3" /> : lesson.pairNumber}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-xs truncate">{lesson.subject}</div>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-2 mt-0.5">
                          <span className="font-mono">{lesson.time}</span>
                          {lesson.teacher && <span>• {lesson.teacher}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-muted/60 border border-border/40">
                        {lesson.room}
                      </span>
                      {isActive && lesson.minutesLeft !== undefined && (
                        <div className="text-[9px] text-primary font-semibold mt-1">
                          ещё {lesson.minutesLeft}м
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-4 text-center text-muted-foreground text-xs">
              На сегодня занятий нет
            </div>
          )}
        </div>

        {/* Footer Navigation Button */}
        <div className="border-t pt-2">
          <Button
            size="xs"
            variant="outline"
            render={<Link href="/dashboard/schedule" />}
            className="h-7 text-xs w-full gap-1.5 font-medium"
          >
            <CalendarCheck className="h-3.5 w-3.5" />
            <span>Открыть расписание</span>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
