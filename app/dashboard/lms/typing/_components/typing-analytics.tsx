"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCpmVerdict } from "../_lib/text-generator";
import {
  Search,
  Users,
  Award,
  Gauge,
  TrendingUp,
  CheckCircle2,
  Clock,
  Building2,
  X,
  ExternalLink,
  Percent,
} from "lucide-react";

interface TypingAnalyticsProps {
  groups: Array<{ id: string; name: string; studentsCount: number }>;
  activeGroupId: string;
  onGroupChange: (groupId: string) => void;
  analytics: {
    groupId: string;
    groupName: string;
    totalStudents: number;
    activeStudentsCount: number;
    groupAvgCpm: number;
    groupTotalTests: number;
    topStudent: {
      name: string;
      cpm: number;
      accuracy: number;
    } | null;
    students: Array<{
      studentId: string;
      studentName: string;
      studentAvatar?: string | null;
      bestRU?: { cpm: number; wpm: number; accuracy: number; date: string } | null;
      bestEN?: { cpm: number; wpm: number; accuracy: number; date: string } | null;
      bestCODE?: { cpm: number; wpm: number; accuracy: number; date: string } | null;
      totalAttempts: number;
      lastAttemptAt?: string | null;
    }>;
  } | null;
}

export function TypingAnalytics({
  groups,
  activeGroupId,
  onGroupChange,
  analytics,
}: TypingAnalyticsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PASSED" | "IN_PROGRESS" | "NONE">("ALL");

  const filteredStudents = useMemo(() => {
    if (!analytics?.students) return [];
    return analytics.students.filter((st) => {
      const matchesSearch = st.studentName.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      const hasRu = st.bestRU && st.bestRU.cpm > 0;
      const isPassed = (st.bestRU?.cpm || 0) >= 170; // 170+ CPM is "Хорошо / Отлично" norm

      if (statusFilter === "PASSED") return isPassed;
      if (statusFilter === "IN_PROGRESS") return hasRu && !isPassed;
      if (statusFilter === "NONE") return !hasRu;
      return true;
    });
  }, [analytics?.students, searchQuery, statusFilter]);

  if (!analytics) {
    return (
      <div className="p-8 text-center text-xs text-muted-foreground border rounded-xl bg-card">
        Данные аналитики по группе отсутствуют
      </div>
    );
  }

  const passedCount = analytics.students.filter((s) => (s.bestRU?.cpm || 0) >= 170).length;
  const selectedGroup = groups.find((g) => g.id === activeGroupId) || (analytics ? { id: analytics.groupId, name: analytics.groupName, studentsCount: analytics.totalStudents } : null);

  return (
    <div className="space-y-3 text-xs">
      {/* Group Selector & Filter Toolbar */}
      <div className="bg-card border rounded-xl p-3 flex flex-wrap items-center justify-between gap-2.5 shadow-2xs">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <div className="flex items-center gap-1.5 font-bold text-sm text-foreground shrink-0">
            <Building2 className="h-4 w-4 text-primary" />
            <span>Группа:</span>
          </div>

          <div className="w-56 shrink-0">
            <Select value={activeGroupId} onValueChange={onGroupChange}>
              <SelectTrigger className="h-7 text-xs bg-background font-medium">
                <SelectValue placeholder="Выберите группу">
                  {selectedGroup
                    ? `Группа ${selectedGroup.name} (${selectedGroup.studentsCount} студ.)`
                    : "Выберите группу"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {groups.map((g) => (
                  <SelectItem key={g.id} value={g.id} className="text-xs">
                    Группа {g.name} ({g.studentsCount} студ.)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Search & Filter pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск учащегося..."
              className="h-7 pl-8 pr-7 text-xs bg-background"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`h-6 px-2.5 rounded-md font-medium transition-colors ${
                statusFilter === "ALL"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Все ({analytics.totalStudents})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("PASSED")}
              className={`h-6 px-2.5 rounded-md font-medium transition-colors ${
                statusFilter === "PASSED"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Сдали норматив ({passedCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("IN_PROGRESS")}
              className={`h-6 px-2.5 rounded-md font-medium transition-colors ${
                statusFilter === "IN_PROGRESS"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              В процессе ({analytics.activeStudentsCount - passedCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("NONE")}
              className={`h-6 px-2.5 rounded-md font-medium transition-colors ${
                statusFilter === "NONE"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Не сдавали ({analytics.totalStudents - analytics.activeStudentsCount})
            </button>
          </div>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-xl border bg-card space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-[11px]">
            <span className="font-semibold flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-primary" />
              Охват группы
            </span>
            <span className="font-mono font-bold text-foreground">
              {Math.round((analytics.activeStudentsCount / Math.max(1, analytics.totalStudents)) * 100)}%
            </span>
          </div>
          <div className="font-mono text-xl font-bold text-foreground">
            {analytics.activeStudentsCount}{" "}
            <span className="text-xs text-muted-foreground font-normal">из {analytics.totalStudents} студ.</span>
          </div>
          <div className="text-[10px] text-muted-foreground">Прошли хотя бы 1 тестирование</div>
        </div>

        <div className="p-3 rounded-xl border bg-card space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-[11px]">
            <span className="font-semibold flex items-center gap-1">
              <Gauge className="h-3.5 w-3.5 text-primary" />
              Средняя скорость группы
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">RU</span>
          </div>
          <div className="font-mono text-xl font-bold text-foreground">
            {analytics.groupAvgCpm}{" "}
            <span className="text-xs text-muted-foreground font-normal">зн/мин</span>
          </div>
          <div className="text-[10px] text-muted-foreground">
            Норматив: от 170 зн/мин
          </div>
        </div>

        <div className="p-3 rounded-xl border bg-card space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-[11px]">
            <span className="font-semibold flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              Всего попыток
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">тестов</span>
          </div>
          <div className="font-mono text-xl font-bold text-foreground">
            {analytics.groupTotalTests}
          </div>
          <div className="text-[10px] text-muted-foreground">Тренировочных заездов группы</div>
        </div>

        <div className="p-3 rounded-xl border bg-card space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-[11px]">
            <span className="font-semibold flex items-center gap-1">
              <Award className="h-3.5 w-3.5 text-primary" />
              Рекорд группы
            </span>
            <span className="font-mono text-[10px] text-primary font-bold">Лидер</span>
          </div>
          {analytics.topStudent ? (
            <div>
              <div className="font-bold text-xs text-foreground truncate">
                {analytics.topStudent.name}
              </div>
              <div className="text-[11px] font-mono text-muted-foreground">
                <span className="font-bold text-primary">{analytics.topStudent.cpm}</span> зн/мин (
                {analytics.topStudent.accuracy}%)
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground text-xs">—</div>
          )}
        </div>
      </div>

      {/* Main Students Performance Table */}
      <div className="border rounded-xl bg-card overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b bg-muted/40 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="p-2.5 w-10 text-center">№</th>
                <th className="p-2.5 min-w-[200px]">Ф.И.О. студента</th>
                <th className="p-2.5 text-center min-w-[130px]">Русский (RU)</th>
                <th className="p-2.5 text-center min-w-[130px]">English (EN)</th>
                <th className="p-2.5 text-center min-w-[110px]">Код (CODE)</th>
                <th className="p-2.5 text-center w-20">Попыток</th>
                <th className="p-2.5 text-center min-w-[120px]">Последняя активность</th>
                <th className="p-2.5 text-right min-w-[140px]">Норматив</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    Студентов по выбранным условиям не найдено
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st, idx) => {
                  const ruVerdict = st.bestRU?.cpm ? getCpmVerdict(st.bestRU.cpm) : null;
                  const isPassed = (st.bestRU?.cpm || 0) >= 170;

                  return (
                    <tr key={st.studentId} className="hover:bg-muted/15 transition-colors">
                      <td className="p-2.5 text-center font-mono text-muted-foreground">
                        {idx + 1}
                      </td>

                      <td className="p-2.5">
                        <div className="flex items-center gap-2">
                          {st.studentAvatar ? (
                            <img
                              src={st.studentAvatar}
                              alt=""
                              className="h-5 w-5 rounded-full object-cover shrink-0 border border-border"
                            />
                          ) : (
                            <div className="h-5 w-5 rounded-full bg-primary/10 text-primary text-[9px] font-bold flex items-center justify-center shrink-0 border border-primary/20">
                              {st.studentName.slice(0, 1).toUpperCase()}
                            </div>
                          )}
                          <Link
                            href={`/dashboard/students/${st.studentId}`}
                            className="font-medium text-foreground hover:text-primary hover:underline transition-colors truncate max-w-[220px]"
                            title="Открыть личную карточку"
                          >
                            {st.studentName}
                          </Link>
                        </div>
                      </td>

                      {/* Best RU Result */}
                      <td className="p-2.5 text-center">
                        {st.bestRU?.cpm ? (
                          <div className="font-mono">
                            <span className="font-bold text-foreground text-xs">
                              {st.bestRU.cpm}
                            </span>{" "}
                            <span className="text-[10px] text-muted-foreground">зн/м</span>
                            <span className="text-[10px] text-muted-foreground block">
                              ({st.bestRU.accuracy}%)
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Best EN Result */}
                      <td className="p-2.5 text-center">
                        {st.bestEN?.cpm ? (
                          <div className="font-mono">
                            <span className="font-bold text-foreground text-xs">
                              {st.bestEN.cpm}
                            </span>{" "}
                            <span className="text-[10px] text-muted-foreground">зн/м</span>
                            <span className="text-[10px] text-muted-foreground block">
                              ({st.bestEN.accuracy}%)
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Best CODE Result */}
                      <td className="p-2.5 text-center">
                        {st.bestCODE?.cpm ? (
                          <div className="font-mono">
                            <span className="font-bold text-foreground text-xs">
                              {st.bestCODE.cpm}
                            </span>{" "}
                            <span className="text-[10px] text-muted-foreground">зн/м</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Total Attempts */}
                      <td className="p-2.5 text-center font-mono font-bold text-foreground">
                        {st.totalAttempts}
                      </td>

                      {/* Last Attempt Date */}
                      <td className="p-2.5 text-center text-[11px] text-muted-foreground">
                        {st.lastAttemptAt
                          ? new Date(st.lastAttemptAt).toLocaleDateString("ru-RU", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </td>

                      {/* Norm Verdict */}
                      <td className="p-2.5 text-right">
                        {ruVerdict ? (
                          <Badge variant="outline" className={`text-[10px] px-2 py-0.5 font-medium ${ruVerdict.badgeClass}`}>
                            {isPassed ? <CheckCircle2 className="h-3 w-3 mr-1" /> : null}
                            {ruVerdict.label}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">Не сдавал</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

