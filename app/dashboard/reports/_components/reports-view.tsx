"use client";

import React, { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  BarChart3,
  Users,
  ClipboardList,
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  GraduationCap,
  ChevronRight,
  Download,
  Search,
  Check,
  Sparkles,
  FileCheck2,
  UserCheck,
  AlertTriangle,
} from "lucide-react";
import type {
  ReportSummaryDTO,
  ReportGroupDTO,
  GroupAttendanceDTO,
  GroupAssignmentDTO,
  StudentActivityDTO,
} from "../actions";

interface ReportsViewProps {
  summary: ReportSummaryDTO;
  groups: ReportGroupDTO[];
  groupAttendance: GroupAttendanceDTO[];
  groupAssignments: GroupAssignmentDTO[];
  studentActivity: StudentActivityDTO[];
}

function ProgressBar({ value, className = "" }: { value: number; className?: string }) {
  const color =
    value >= 75
      ? "bg-primary"
      : value >= 50
        ? "bg-amber-500"
        : "bg-destructive";
  return (
    <div className={`h-1.5 rounded-full bg-muted overflow-hidden ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
      />
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border p-3 flex items-center justify-between gap-3 bg-card shadow-2xs">
      <div className="space-y-0.5 min-w-0">
        <div className="text-[10px] text-muted-foreground font-medium truncate">{label}</div>
        <div className="text-base font-bold text-foreground">{value}</div>
        {sub && <div className="text-[10px] text-muted-foreground truncate">{sub}</div>}
      </div>
      <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 bg-primary/10 text-primary">
        {icon}
      </div>
    </div>
  );
}

type Tab = "overview" | "attendance" | "assignments" | "students";
type StudentFilterMode = "ALL" | "EXCELLENT" | "RISK";

export function ReportsView({
  summary,
  groups,
  groupAttendance,
  groupAssignments,
  studentActivity,
}: ReportsViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [selectedGroupId, setSelectedGroupId] = useState<string>("all");
  const [studentSearch, setStudentSearch] = useState<string>("");
  const [studentFilter, setStudentFilter] = useState<StudentFilterMode>("ALL");

  const attendancePct =
    summary.totalAttendanceRecords > 0
      ? Math.round((summary.presentCount / summary.totalAttendanceRecords) * 100)
      : 0;

  const submissionPct =
    summary.totalSubmissions > 0
      ? Math.round((summary.acceptedSubmissions / summary.totalSubmissions) * 100)
      : 0;

  const filteredGroupAttendance = useMemo(() => {
    return selectedGroupId === "all"
      ? groupAttendance
      : groupAttendance.filter((g) => g.groupId === selectedGroupId);
  }, [selectedGroupId, groupAttendance]);

  const filteredGroupAssignments = useMemo(() => {
    return selectedGroupId === "all"
      ? groupAssignments
      : groupAssignments.filter((g) => g.groupId === selectedGroupId);
  }, [selectedGroupId, groupAssignments]);

  const filteredStudents = useMemo(() => {
    return studentActivity.filter((s) => {
      // Group filter
      if (selectedGroupId !== "all") {
        const grp = groups.find((g) => g.id === selectedGroupId);
        if (grp && s.groupName !== grp.name) return false;
      }

      // Search filter
      if (studentSearch.trim()) {
        const query = studentSearch.toLowerCase().trim();
        const matchName = s.studentName.toLowerCase().includes(query);
        const matchGroup = s.groupName.toLowerCase().includes(query);
        if (!matchName && !matchGroup) return false;
      }

      // Status filter
      if (studentFilter === "EXCELLENT") {
        return s.attendancePct >= 80;
      }
      if (studentFilter === "RISK") {
        return s.attendancePct < 60;
      }

      return true;
    });
  }, [studentActivity, selectedGroupId, groups, studentSearch, studentFilter]);

  const handleExportCSV = () => {
    const headers = [
      "ФИО Студента",
      "Группа",
      "Сдано ДЗ",
      "Принято ДЗ",
      "Посещаемость (%)",
      "Присутствовал (пар)",
      "Всего занятий",
    ];

    const rows = filteredStudents.map((s) => [
      `"${s.studentName}"`,
      `"${s.groupName}"`,
      s.submissionsCount,
      s.acceptedCount,
      `${s.attendancePct}%`,
      s.attendancePresent,
      s.attendanceTotal,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const groupSuffix = selectedGroupId === "all" ? "Все_группы" : (groups.find((g) => g.id === selectedGroupId)?.name || "Группа");
    link.setAttribute("download", `Отчет_успеваемости_${groupSuffix}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "overview", label: "Обзор", icon: <BarChart3 className="h-3.5 w-3.5" /> },
    { key: "attendance", label: "Посещаемость", icon: <CalendarCheck className="h-3.5 w-3.5" /> },
    { key: "assignments", label: "Домашние задания", icon: <ClipboardList className="h-3.5 w-3.5" /> },
    { key: "students", label: "Успеваемость студентов", icon: <GraduationCap className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="space-y-3 w-full text-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-3.5 rounded-xl border shadow-2xs">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span>Администрация</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-semibold">Аналитика & Отчёты</span>
          </div>
          <h1 className="text-sm font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" /> Аналитика & Отчёты
          </h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
            <SelectTrigger className="h-8 text-xs bg-background w-[170px] font-medium">
              <SelectValue>
                {selectedGroupId === "all"
                  ? "Все группы"
                  : groups.find((g) => g.id === selectedGroupId)?.name || "Группа"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">Все группы</SelectItem>
              {groups.map((g) => (
                <SelectItem key={g.id} value={g.id} className="text-xs">
                  Группа {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            size="xs"
            variant="outline"
            onClick={handleExportCSV}
            className="h-8 text-xs gap-1.5 font-medium border-primary/30 text-primary hover:bg-primary/10"
            title="Экспорт ведомости в формате CSV"
          >
            <Download className="h-3.5 w-3.5" />
            Экспорт CSV
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 p-1 bg-card border rounded-xl shadow-2xs overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === "overview" && (
        <div className="space-y-3">
          {/* Main 4 KPI Indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard
              label="Средняя посещаемость"
              value={`${attendancePct}%`}
              sub={`${summary.presentCount} из ${summary.totalAttendanceRecords} отметок`}
              icon={<CalendarCheck className="h-4 w-4" />}
            />
            <KpiCard
              label="Принято ДЗ"
              value={`${submissionPct}%`}
              sub={`${summary.acceptedSubmissions} принято из ${summary.totalSubmissions}`}
              icon={<CheckCircle2 className="h-4 w-4" />}
            />
            <KpiCard
              label="Активных студентов"
              value={summary.totalStudents}
              sub={`в ${summary.totalGroups} учебных группах`}
              icon={<GraduationCap className="h-4 w-4" />}
            />
            <KpiCard
              label="Тестирований LMS"
              value={summary.testSubmissionsCount}
              sub={`по ${summary.totalTests} тестам`}
              icon={<FileCheck2 className="h-4 w-4" />}
            />
          </div>

          {/* Attendance & Assignments Breakdown Side-by-Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-card border rounded-xl p-3.5 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <CalendarCheck className="h-4 w-4 text-primary" /> Сводка посещаемости
                </h2>
                <Badge variant="outline" className="text-[10px] font-semibold border-primary/30 text-primary">
                  {summary.totalAttendanceRecords} записей
                </Badge>
              </div>
              <div className="space-y-2.5">
                {[
                  { label: "Присутствовал", count: summary.presentCount, color: "text-primary", bg: "bg-primary" },
                  { label: "Отсутствовал (НБ)", count: summary.absentCount, color: "text-destructive", bg: "bg-destructive" },
                  { label: "Опоздал", count: summary.lateCount, color: "text-amber-500", bg: "bg-amber-500" },
                ].map((item) => {
                  const pct = summary.totalAttendanceRecords > 0
                    ? Math.round((item.count / summary.totalAttendanceRecords) * 100)
                    : 0;
                  return (
                    <div key={item.label} className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className={`font-semibold ${item.color}`}>{item.count} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full rounded-full ${item.bg}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-card border rounded-xl p-3.5 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <ClipboardList className="h-4 w-4 text-primary" /> Сводка домашних заданий
                </h2>
                <Badge variant="outline" className="text-[10px] font-semibold border-primary/30 text-primary">
                  {summary.totalSubmissions} сданных работ
                </Badge>
              </div>
              <div className="space-y-2.5">
                {[
                  {
                    label: "Принято преподавателями",
                    count: summary.acceptedSubmissions,
                    total: summary.totalSubmissions,
                    color: "text-primary",
                    bg: "bg-primary",
                  },
                  {
                    label: "На проверке / доработке",
                    count: Math.max(0, summary.totalSubmissions - summary.acceptedSubmissions),
                    total: summary.totalSubmissions,
                    color: "text-amber-500",
                    bg: "bg-amber-500",
                  },
                ].map((item) => {
                  const pct = item.total > 0 ? Math.round((item.count / item.total) * 100) : 0;
                  return (
                    <div key={item.label} className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className={`font-semibold ${item.color}`}>{item.count} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full rounded-full ${item.bg}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Groups Summary Table */}
          <div className="bg-card border rounded-xl p-3.5 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Users className="h-4 w-4 text-primary" /> Сводная ведомость учебных групп
              </h2>
              <span className="text-[11px] text-muted-foreground">{groups.length} групп</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/30 text-muted-foreground text-[11px]">
                    <th className="text-left py-2 px-3 font-semibold">Группа</th>
                    <th className="text-center py-2 px-2 font-semibold">Студентов</th>
                    <th className="text-center py-2 px-2 font-semibold">Дисциплин</th>
                    <th className="text-center py-2 px-3 font-semibold">Посещаемость</th>
                    <th className="text-center py-2 px-3 font-semibold">Сдача ДЗ</th>
                    <th className="text-right py-2 px-3 font-semibold">Статус</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {groups.map((g) => {
                    const att = groupAttendance.find((a) => a.groupId === g.id);
                    const asg = groupAssignments.find((a) => a.groupId === g.id);
                    const isGood = (att?.presentPct ?? 0) >= 75 && (asg?.submissionPct ?? 0) >= 60;

                    return (
                      <tr key={g.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-foreground">{g.name}</td>
                        <td className="py-2.5 px-2 text-center text-muted-foreground">{g.studentsCount}</td>
                        <td className="py-2.5 px-2 text-center text-muted-foreground">{g.subjectsCount}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`font-bold ${att && att.presentPct >= 75 ? "text-primary" : "text-destructive"}`}>
                            {att?.presentPct ?? "—"}%
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`font-bold ${asg && asg.submissionPct >= 60 ? "text-primary" : "text-amber-500"}`}>
                            {asg?.submissionPct ?? "—"}%
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-medium border ${
                              isGood
                                ? "bg-primary/10 text-primary border-primary/30"
                                : "bg-amber-500/10 text-amber-600 border-amber-500/30"
                            }`}
                          >
                            {isGood ? "В норме" : "Контроль"}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Attendance */}
      {activeTab === "attendance" && (
        <div className="space-y-3">
          {filteredGroupAttendance.length === 0 ? (
            <div className="bg-card border rounded-xl p-12 text-center text-muted-foreground text-xs">
              Нет данных о посещаемости
            </div>
          ) : (
            filteredGroupAttendance.map((g) => (
              <div key={g.groupId} className="bg-card border rounded-xl p-3.5 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-foreground text-xs flex items-center gap-1.5">
                    <CalendarCheck className="h-4 w-4 text-primary" />
                    Группа {g.groupName}
                  </h3>
                  <Badge variant="outline" className={`text-[10px] font-semibold border ${g.presentPct >= 75 ? "bg-primary/10 text-primary border-primary/30" : "bg-destructive/10 text-destructive border-destructive/30"}`}>
                    {g.presentPct}% посещаемость
                  </Badge>
                </div>

                <ProgressBar value={g.presentPct} />

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {[
                    { label: "Присутствовал", count: g.presentCount, icon: <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> },
                    { label: "Отсутствовал (НБ)", count: g.absentCount, icon: <XCircle className="h-3.5 w-3.5 text-destructive" /> },
                    { label: "Опоздал", count: g.lateCount, icon: <Clock className="h-3.5 w-3.5 text-amber-500" /> },
                    { label: "Справка", count: g.excusedCount, icon: <AlertCircle className="h-3.5 w-3.5 text-sky-500" /> },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border text-[11px]">
                      {item.icon}
                      <div>
                        <div className="font-bold text-foreground">{item.count}</div>
                        <div className="text-[10px] text-muted-foreground">{item.label}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-[10px] text-muted-foreground pt-1 border-t flex justify-between items-center">
                  <span>Всего отметок: {g.totalRecords}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Assignments */}
      {activeTab === "assignments" && (
        <div className="space-y-3">
          {filteredGroupAssignments.length === 0 ? (
            <div className="bg-card border rounded-xl p-12 text-center text-muted-foreground text-xs">
              Нет данных о заданиях
            </div>
          ) : (
            filteredGroupAssignments.map((g) => (
              <div key={g.groupId} className="bg-card border rounded-xl p-3.5 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-foreground text-xs flex items-center gap-1.5">
                    <ClipboardList className="h-4 w-4 text-primary" />
                    Группа {g.groupName}
                  </h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] font-medium border-primary/30 text-primary">
                      {g.totalAssignments} заданий
                    </Badge>
                    <Badge variant="outline" className={`text-[10px] font-semibold border ${g.submissionPct >= 60 ? "bg-primary/10 text-primary border-primary/30" : "bg-amber-500/10 text-amber-600 border-amber-500/30"}`}>
                      {g.submissionPct}% сдали
                    </Badge>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Сдано работ</span>
                    <span className="font-medium text-foreground">{g.totalSubmissions}</span>
                  </div>
                  <ProgressBar value={g.submissionPct} />
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  {[
                    { label: "Всего заданий", value: g.totalAssignments, icon: <ClipboardList className="h-3.5 w-3.5 text-primary" /> },
                    { label: "Принято", value: g.acceptedCount, icon: <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> },
                    { label: "На проверке", value: g.needRevisionCount, icon: <AlertCircle className="h-3.5 w-3.5 text-amber-500" /> },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border text-[11px]">
                      {item.icon}
                      <div>
                        <div className="font-bold text-foreground">{item.value}</div>
                        <div className="text-[10px] text-muted-foreground">{item.label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 4: Students Activity */}
      {activeTab === "students" && (
        <div className="space-y-2.5">
          {/* Controls Bar for Students */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-card p-3 rounded-xl border shadow-2xs">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Поиск по ФИО студента..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="pl-8 h-8 text-xs bg-background"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto p-0.5 bg-muted/60 rounded-lg border text-xs">
              <button
                type="button"
                onClick={() => setStudentFilter("ALL")}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  studentFilter === "ALL"
                    ? "bg-background text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Все ({studentActivity.length})
              </button>
              <button
                type="button"
                onClick={() => setStudentFilter("EXCELLENT")}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
                  studentFilter === "EXCELLENT"
                    ? "bg-background text-primary shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Sparkles className="h-3 w-3 text-primary" /> Отличники (≥80%)
              </button>
              <button
                type="button"
                onClick={() => setStudentFilter("RISK")}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
                  studentFilter === "RISK"
                    ? "bg-background text-destructive shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <AlertTriangle className="h-3 w-3 text-destructive" /> Зона риска (&lt;60%)
              </button>
            </div>
          </div>

          {/* Students Table */}
          <div className="bg-card border rounded-xl shadow-2xs overflow-hidden">
            <div className="p-3 border-b flex items-center justify-between">
              <h2 className="font-bold text-foreground text-xs flex items-center gap-1.5">
                <UserCheck className="h-4 w-4 text-primary" /> Ведомость успеваемости
              </h2>
              <span className="text-[11px] text-muted-foreground">{filteredStudents.length} студентов найдено</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/30 text-muted-foreground text-[11px]">
                    <th className="text-left py-2 px-3 font-semibold">Студент</th>
                    <th className="text-center py-2 px-2 font-semibold">Группа</th>
                    <th className="text-center py-2 px-2 font-semibold">Сдано ДЗ</th>
                    <th className="text-center py-2 px-2 font-semibold">Принято</th>
                    <th className="text-left py-2 px-3 font-semibold w-40">Посещаемость</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredStudents.map((s) => (
                    <tr key={s.studentId} className="hover:bg-muted/20 transition-colors">
                      <td className="py-2.5 px-3 font-medium text-foreground">{s.studentName}</td>
                      <td className="py-2.5 px-2 text-center">
                        <Badge variant="outline" className="text-[10px] border-primary/30 text-primary font-medium">
                          {s.groupName}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-2 text-center font-semibold">{s.submissionsCount}</td>
                      <td className="py-2.5 px-2 text-center">
                        <span className={`font-semibold ${s.acceptedCount > 0 ? "text-primary" : "text-muted-foreground"}`}>
                          {s.acceptedCount}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <ProgressBar value={s.attendancePct} className="flex-1" />
                          <span className={`text-[11px] font-bold shrink-0 min-w-[36px] text-right ${s.attendancePct >= 75 ? "text-primary" : "text-destructive"}`}>
                            {s.attendancePct}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-muted-foreground italic text-xs">
                        Студенты по данным критериям не найдены
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
