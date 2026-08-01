"use client";

import React, { useState } from "react";
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
  BarChart3,
  Users,
  BookOpen,
  ClipboardList,
  CalendarCheck,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  GraduationCap,
  Award,
  ChevronRight,
  Activity,
} from "lucide-react";
import type {
  ReportSummaryDTO,
  ReportGroupDTO,
  GroupAttendanceDTO,
  GroupAssignmentDTO,
  StudentActivityDTO,
  SubjectMaterialsDTO,
} from "../actions";

interface ReportsViewProps {
  summary: ReportSummaryDTO;
  groups: ReportGroupDTO[];
  groupAttendance: GroupAttendanceDTO[];
  groupAssignments: GroupAssignmentDTO[];
  studentActivity: StudentActivityDTO[];
  subjectMaterials: SubjectMaterialsDTO[];
}

function ProgressBar({ value, className = "" }: { value: number; className?: string }) {
  const color =
    value >= 80
      ? "bg-primary"
      : value >= 60
        ? "bg-amber-500"
        : "bg-destructive";
  return (
    <div className={`h-1.5 rounded-full bg-muted overflow-hidden ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  icon,
  accent = false,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-3 flex items-center justify-between gap-3 bg-card shadow-xs`}>
      <div className="space-y-0.5 min-w-0">
        <div className="text-[10px] text-muted-foreground font-medium truncate">{label}</div>
        <div className={`text-lg font-bold ${accent ? "text-primary" : "text-foreground"}`}>{value}</div>
        {sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}
      </div>
      <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${accent ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
        {icon}
      </div>
    </div>
  );
}

type Tab = "overview" | "attendance" | "assignments" | "students" | "subjects";

export function ReportsView({
  summary,
  groups,
  groupAttendance,
  groupAssignments,
  studentActivity,
  subjectMaterials,
}: ReportsViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [selectedGroupId, setSelectedGroupId] = useState<string>("all");

  const attendancePct =
    summary.totalAttendanceRecords > 0
      ? Math.round((summary.presentCount / summary.totalAttendanceRecords) * 100)
      : 0;
  const submissionPct =
    summary.totalSubmissions > 0
      ? Math.round((summary.acceptedSubmissions / summary.totalSubmissions) * 100)
      : 0;

  const filteredGroupAttendance =
    selectedGroupId === "all"
      ? groupAttendance
      : groupAttendance.filter((g) => g.groupId === selectedGroupId);

  const filteredGroupAssignments =
    selectedGroupId === "all"
      ? groupAssignments
      : groupAssignments.filter((g) => g.groupId === selectedGroupId);

  const filteredStudents =
    selectedGroupId === "all"
      ? studentActivity
      : studentActivity.filter((s) => {
          const grp = groups.find((g) => g.id === selectedGroupId);
          return grp ? s.groupName === grp.name : true;
        });

  const filteredSubjects =
    selectedGroupId === "all"
      ? subjectMaterials
      : subjectMaterials.filter((s) => {
          const grp = groups.find((g) => g.id === selectedGroupId);
          return grp ? s.groupName === grp.name : true;
        });

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "overview", label: "Обзор", icon: <BarChart3 className="h-3.5 w-3.5" /> },
    { key: "attendance", label: "Посещаемость", icon: <CalendarCheck className="h-3.5 w-3.5" /> },
    { key: "assignments", label: "Задания", icon: <ClipboardList className="h-3.5 w-3.5" /> },
    { key: "students", label: "Студенты", icon: <GraduationCap className="h-3.5 w-3.5" /> },
    { key: "subjects", label: "Дисциплины", icon: <BookOpen className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="space-y-3 w-full text-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-3.5 rounded-xl border shadow-xs">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span>Администратор</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-semibold">Аналитика & Отчёты</span>
          </div>
          <h1 className="text-sm font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" /> Аналитика & Отчёты
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
            <SelectTrigger className="h-8 text-xs font-semibold bg-background w-[180px]">
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
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 p-1 bg-card border rounded-xl shadow-xs overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {activeTab === "overview" && (
        <div className="space-y-3">
          {/* KPI Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard label="Учебных групп" value={summary.totalGroups} icon={<Users className="h-4 w-4" />} />
            <KpiCard label="Активных студентов" value={summary.totalStudents} icon={<GraduationCap className="h-4 w-4" />} accent />
            <KpiCard label="Преподавателей" value={summary.totalTeachers} icon={<Award className="h-4 w-4" />} />
            <KpiCard label="Учебных материалов" value={summary.totalMaterials} icon={<BookOpen className="h-4 w-4" />} accent />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard
              label="Домашних заданий"
              value={summary.totalAssignments}
              icon={<ClipboardList className="h-4 w-4" />}
            />
            <KpiCard
              label="Сдано работ"
              value={summary.totalSubmissions}
              sub={`${summary.acceptedSubmissions} принято`}
              icon={<CheckCircle2 className="h-4 w-4" />}
              accent
            />
            <KpiCard
              label="Посещаемость"
              value={`${attendancePct}%`}
              sub={`${summary.presentCount} из ${summary.totalAttendanceRecords}`}
              icon={<CalendarCheck className="h-4 w-4" />}
              accent={attendancePct >= 75}
            />
            <KpiCard
              label="Принято работ"
              value={`${submissionPct}%`}
              sub={`${summary.acceptedSubmissions} из ${summary.totalSubmissions}`}
              icon={<TrendingUp className="h-4 w-4" />}
            />
          </div>

          {/* Attendance breakdown bars */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-card border rounded-xl p-3.5 space-y-3 shadow-xs">
              <h2 className="text-xs font-bold text-foreground flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-primary" /> Сводка посещаемости
              </h2>
              <div className="space-y-2">
                {[
                  { label: "Присутствовал", count: summary.presentCount, color: "text-primary", bg: "bg-primary" },
                  { label: "Отсутствовал", count: summary.absentCount, color: "text-destructive", bg: "bg-destructive" },
                  { label: "Опоздал", count: summary.lateCount, color: "text-amber-500", bg: "bg-amber-500" },
                ].map((item) => {
                  const pct = summary.totalAttendanceRecords > 0
                    ? Math.round((item.count / summary.totalAttendanceRecords) * 100)
                    : 0;
                  return (
                    <div key={item.label} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">{item.label}</span>
                        <span className={`text-[11px] font-semibold ${item.color}`}>{item.count} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full rounded-full ${item.bg}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-card border rounded-xl p-3.5 space-y-3 shadow-xs">
              <h2 className="text-xs font-bold text-foreground flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-primary" /> Сводка заданий
              </h2>
              <div className="space-y-2">
                {[
                  {
                    label: "Принято преподавателем",
                    count: summary.acceptedSubmissions,
                    total: summary.totalSubmissions,
                    color: "text-primary",
                    bg: "bg-primary",
                  },
                  {
                    label: "На доработке",
                    count: summary.totalSubmissions - summary.acceptedSubmissions,
                    total: summary.totalSubmissions,
                    color: "text-amber-500",
                    bg: "bg-amber-500",
                  },
                ].map((item) => {
                  const pct = item.total > 0 ? Math.round((item.count / item.total) * 100) : 0;
                  return (
                    <div key={item.label} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">{item.label}</span>
                        <span className={`text-[11px] font-semibold ${item.color}`}>{item.count} ({pct}%)</span>
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

          {/* Groups Overview Table */}
          <div className="bg-card border rounded-xl p-3.5 shadow-xs space-y-2">
            <h2 className="text-xs font-bold text-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> Группы
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 pr-4 font-medium">Группа</th>
                    <th className="text-center py-2 px-2 font-medium">Студентов</th>
                    <th className="text-center py-2 px-2 font-medium">Дисциплин</th>
                    <th className="text-center py-2 px-2 font-medium">Посещаемость</th>
                    <th className="text-center py-2 px-2 font-medium">Сдано ДЗ</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((g) => {
                    const att = groupAttendance.find((a) => a.groupId === g.id);
                    const asg = groupAssignments.find((a) => a.groupId === g.id);
                    return (
                      <tr key={g.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="py-2 pr-4 font-semibold text-foreground">{g.name}</td>
                        <td className="py-2 px-2 text-center">{g.studentsCount}</td>
                        <td className="py-2 px-2 text-center">{g.subjectsCount}</td>
                        <td className="py-2 px-2 text-center">
                          <span className={`font-semibold ${att && att.presentPct >= 75 ? "text-primary" : "text-destructive"}`}>
                            {att?.presentPct ?? "—"}%
                          </span>
                        </td>
                        <td className="py-2 px-2 text-center">
                          <span className={`font-semibold ${asg && asg.submissionPct >= 60 ? "text-primary" : "text-amber-500"}`}>
                            {asg?.submissionPct ?? "—"}%
                          </span>
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

      {/* Tab: Attendance */}
      {activeTab === "attendance" && (
        <div className="space-y-3">
          {filteredGroupAttendance.length === 0 ? (
            <div className="bg-card border rounded-xl p-12 text-center text-muted-foreground text-xs">
              Нет данных о посещаемости
            </div>
          ) : (
            filteredGroupAttendance.map((g) => (
              <div key={g.groupId} className="bg-card border rounded-xl p-3.5 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-foreground flex items-center gap-2">
                    <CalendarCheck className="h-4 w-4 text-primary" />
                    Группа {g.groupName}
                  </h3>
                  <Badge variant="outline" className={`text-[10px] font-semibold border-0 ${g.presentPct >= 75 ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                    {g.presentPct}% посещаемость
                  </Badge>
                </div>

                <ProgressBar value={g.presentPct} />

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {[
                    { label: "Присутствовал", count: g.presentCount, icon: <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> },
                    { label: "Отсутствовал", count: g.absentCount, icon: <XCircle className="h-3.5 w-3.5 text-destructive" /> },
                    { label: "Опоздал", count: g.lateCount, icon: <Clock className="h-3.5 w-3.5 text-amber-500" /> },
                    { label: "Уважительная", count: g.excusedCount, icon: <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" /> },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border">
                      {item.icon}
                      <div>
                        <div className="font-bold text-foreground">{item.count}</div>
                        <div className="text-[10px] text-muted-foreground">{item.label}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-[10px] text-muted-foreground pt-1 border-t">
                  Всего записей: {g.totalRecords}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Assignments */}
      {activeTab === "assignments" && (
        <div className="space-y-3">
          {filteredGroupAssignments.length === 0 ? (
            <div className="bg-card border rounded-xl p-12 text-center text-muted-foreground text-xs">
              Нет данных о заданиях
            </div>
          ) : (
            filteredGroupAssignments.map((g) => (
              <div key={g.groupId} className="bg-card border rounded-xl p-3.5 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-foreground flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-primary" />
                    Группа {g.groupName}
                  </h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] font-medium border-primary/30 text-primary">
                      {g.totalAssignments} заданий
                    </Badge>
                    <Badge variant="outline" className={`text-[10px] font-semibold border-0 ${g.submissionPct >= 60 ? "bg-primary/10 text-primary" : "bg-amber-500/10 text-amber-600"}`}>
                      {g.submissionPct}% сдали
                    </Badge>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Сдано работ</span>
                    <span>{g.totalSubmissions}</span>
                  </div>
                  <ProgressBar value={g.submissionPct} />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Принято из сданных</span>
                    <span>{g.acceptedCount} / {g.totalSubmissions}</span>
                  </div>
                  <ProgressBar value={g.acceptedPct} />
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  {[
                    { label: "Всего заданий", value: g.totalAssignments, icon: <ClipboardList className="h-3.5 w-3.5 text-primary" /> },
                    { label: "Принято", value: g.acceptedCount, icon: <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> },
                    { label: "На доработке", value: g.needRevisionCount, icon: <AlertCircle className="h-3.5 w-3.5 text-amber-500" /> },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border">
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

      {/* Tab: Students */}
      {activeTab === "students" && (
        <div className="bg-card border rounded-xl shadow-xs overflow-hidden">
          <div className="p-3.5 border-b flex items-center justify-between">
            <h2 className="font-bold text-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" /> Активность студентов
            </h2>
            <span className="text-[11px] text-muted-foreground">{filteredStudents.length} студентов</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/30 text-muted-foreground">
                  <th className="text-left py-2 px-3.5 font-medium">Студент</th>
                  <th className="text-center py-2 px-2 font-medium">Группа</th>
                  <th className="text-center py-2 px-2 font-medium">Сдано ДЗ</th>
                  <th className="text-center py-2 px-2 font-medium">Принято</th>
                  <th className="text-left py-2 px-3 font-medium w-36">Посещаемость</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s) => (
                  <tr key={s.studentId} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="py-2 px-3.5 font-medium text-foreground">{s.studentName}</td>
                    <td className="py-2 px-2 text-center">
                      <Badge variant="outline" className="text-[10px] border-primary/30 text-primary font-medium">
                        {s.groupName}
                      </Badge>
                    </td>
                    <td className="py-2 px-2 text-center font-semibold">{s.submissionsCount}</td>
                    <td className="py-2 px-2 text-center">
                      <span className={`font-semibold ${s.acceptedCount > 0 ? "text-primary" : "text-muted-foreground"}`}>
                        {s.acceptedCount}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <ProgressBar value={s.attendancePct} className="flex-1" />
                        <span className={`text-[11px] font-semibold shrink-0 ${s.attendancePct >= 75 ? "text-primary" : "text-destructive"}`}>
                          {s.attendancePct}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-muted-foreground italic">
                      Нет данных о студентах
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Subjects */}
      {activeTab === "subjects" && (
        <div className="bg-card border rounded-xl shadow-xs overflow-hidden">
          <div className="p-3.5 border-b flex items-center justify-between">
            <h2 className="font-bold text-foreground flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" /> Учебные дисциплины
            </h2>
            <span className="text-[11px] text-muted-foreground">{filteredSubjects.length} дисциплин</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/30 text-muted-foreground">
                  <th className="text-left py-2 px-3.5 font-medium">Дисциплина</th>
                  <th className="text-center py-2 px-2 font-medium">Группа</th>
                  <th className="text-center py-2 px-2 font-medium">Материалов</th>
                  <th className="text-center py-2 px-2 font-medium">Заданий</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubjects.map((s, idx) => (
                  <tr key={idx} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="py-2 px-3.5 font-medium text-foreground">{s.subjectName}</td>
                    <td className="py-2 px-2 text-center">
                      <Badge variant="outline" className="text-[10px] border-primary/30 text-primary font-medium">
                        {s.groupName}
                      </Badge>
                    </td>
                    <td className="py-2 px-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <BookOpen className="h-3 w-3 text-primary" />
                        <span className="font-semibold">{s.materialsCount}</span>
                      </div>
                    </td>
                    <td className="py-2 px-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <ClipboardList className="h-3 w-3 text-muted-foreground" />
                        <span className="font-semibold">{s.assignmentsCount}</span>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredSubjects.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-muted-foreground italic">
                      Нет данных по дисциплинам
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
