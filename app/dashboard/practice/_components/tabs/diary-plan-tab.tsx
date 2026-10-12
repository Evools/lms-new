"use client";

import React from "react";
import { cn } from "@/lib/utils";
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
  BookOpenCheck,
  Plus,
  Printer,
  GraduationCap,
  CalendarDays,
  Search,
  X,
  Clock,
  ChevronUp,
  ChevronDown,
  Settings2,
  Edit2,
  PenLine,
  CheckCircle2,
  RotateCcw,
  Check,
  Copy,
  CheckSquare,
  Square,
  Trash2,
} from "lucide-react";
import { SpecialtyDiaryPlan, DiaryDayTopic, StudentPracticeRecord } from "../types";
import { AnimatedCounter } from "../animated-counter";

interface SectionSummaryItem {
  section: string;
  daysCount: number;
  hoursCount: number;
  percent: number;
}

interface SectionGroup {
  section: string;
  days: DiaryDayTopic[];
  total: number;
  done: number;
  hours: number;
  collapsed: boolean;
}

interface DiaryPlanTabProps {
  isStudent: boolean;
  diaryPlans: SpecialtyDiaryPlan[];
  selectedPlanId: string;
  setSelectedPlanId: (val: string) => void;
  planStartDate: string;
  onStartDateChange: (val: string) => void;
  memoDaySearch: string;
  setMemoDaySearch: (val: string) => void;
  currentDiaryPlan?: SpecialtyDiaryPlan;
  myPracticeInfo?: StudentPracticeRecord;
  averageHoursPerDay: number | string;
  isCurriculumTableExpanded: boolean;
  setIsCurriculumTableExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  sectionHoursSummary: SectionSummaryItem[];
  rewriteProgress: { count: number; percent: number };
  rewriteFilter: "ALL" | "PENDING" | "DONE";
  setRewriteFilter: (val: "ALL" | "PENDING" | "DONE") => void;
  collapsedSections: string[];
  setCollapsedSections: React.Dispatch<React.SetStateAction<string[]>>;
  filteredPlanDays: DiaryDayTopic[];
  sectionGroups: SectionGroup[];
  calculatedDates: string[];
  getWeekdayFromDateStr: (dateStr: string) => string;
  rewrittenDayIds: string[];
  copiedDayId: string | null;
  onCopyTopicContent: (id: string, text: string) => void;
  onToggleDayRewritten: (dayId: string) => void;
  onOpenCreatePlan: () => void;
  onOpenEditPlan: (plan: SpecialtyDiaryPlan) => void;
  onOpenAddDayTopic: () => void;
  onOpenEditDayTopic: (day: DiaryDayTopic) => void;
  onDeleteDayTopic: (day: DiaryDayTopic) => void;
  onDeletePlan?: (plan: SpecialtyDiaryPlan) => void;
  onOpenPrintPlanDialog: () => void;
  onOpenSectionsDialog: () => void;
  onOpenResetDialog: () => void;
  onEditSection: (section: string) => void;
}

export function DiaryPlanTab({
  isStudent,
  diaryPlans,
  selectedPlanId,
  setSelectedPlanId,
  planStartDate,
  onStartDateChange,
  memoDaySearch,
  setMemoDaySearch,
  currentDiaryPlan,
  myPracticeInfo,
  averageHoursPerDay,
  isCurriculumTableExpanded,
  setIsCurriculumTableExpanded,
  sectionHoursSummary,
  rewriteProgress,
  rewriteFilter,
  setRewriteFilter,
  collapsedSections,
  setCollapsedSections,
  filteredPlanDays,
  sectionGroups,
  calculatedDates,
  getWeekdayFromDateStr,
  rewrittenDayIds,
  copiedDayId,
  onCopyTopicContent,
  onToggleDayRewritten,
  onOpenCreatePlan,
  onOpenEditPlan,
  onOpenAddDayTopic,
  onOpenEditDayTopic,
  onDeleteDayTopic,
  onDeletePlan,
  onOpenPrintPlanDialog,
  onOpenSectionsDialog,
  onOpenResetDialog,
  onEditSection,
}: DiaryPlanTabProps) {
  return (
    <div className="space-y-3">
      <div className="bg-card border rounded-xl p-3.5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
          <div>
            <h3 className="font-bold text-foreground text-sm flex items-center gap-1.5">
              <BookOpenCheck className="h-4 w-4 text-primary" />
              Памятка студенту: Программы практики и расчасовка по группам
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Индивидуальные памятки, утверждённая расчасовка и готовый текст для заполнения рукописного дневника практики.
            </p>
          </div>

          {/* Top Plan Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {!isStudent && (
              <Button
                size="xs"
                variant="outline"
                onClick={onOpenCreatePlan}
                className="h-8 gap-1.5 font-medium border-primary/40 text-primary hover:bg-primary/10"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Создать памятку группы</span>
              </Button>
            )}

            <Button
              size="xs"
              onClick={onOpenPrintPlanDialog}
              className="h-8 gap-1.5 font-medium"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Печать памятки</span>
            </Button>
          </div>
        </div>

        {/* Group Selector Dropdown & Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-muted-foreground text-xs font-medium flex items-center gap-1.5">
              <GraduationCap className="h-4 w-4 text-primary" />
              Учебная группа:
            </span>
            <Select
              value={selectedPlanId}
              onValueChange={(val) => {
                setSelectedPlanId(val);
                const plan = diaryPlans.find((p) => p.id === val);
                if (plan?.startDate) onStartDateChange(plan.startDate);
              }}
            >
              <SelectTrigger className="h-8 min-w-[280px] sm:w-[380px] text-xs font-medium bg-background border-border">
                <SelectValue placeholder="Выберите учебную группу">
                  {currentDiaryPlan
                    ? `Группа ${currentDiaryPlan.groupName} — ${currentDiaryPlan.specialty} (${currentDiaryPlan.course} курс)`
                    : "Выберите учебную группу"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {diaryPlans.length === 0 ? (
                  <SelectItem value="__none__" disabled className="text-xs">
                    Нет созданных памяток
                  </SelectItem>
                ) : (
                  diaryPlans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id} className="text-xs">
                      <div className="flex items-center justify-between gap-3 w-full">
                        <span className="font-semibold text-foreground">Группа {plan.groupName}</span>
                        <span className="text-muted-foreground text-[11px]">
                          {plan.specialty} ({plan.course} к.)
                        </span>
                        <Badge variant="outline" className="text-[10px] font-mono ml-1 py-0 h-4 border-primary/30 text-primary">
                          {plan.totalHours} ч. / {plan.days.length} дн.
                        </Badge>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Start Date input & Search */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5 text-primary" /> Старт:
              </span>
              <Input
                value={planStartDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                placeholder="15.10.2026"
                className="h-8 w-[110px] text-xs font-mono bg-background text-center"
              />
            </div>

            <div className="relative w-[160px] sm:w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Поиск по темам..."
                value={memoDaySearch}
                onChange={(e) => setMemoDaySearch(e.target.value)}
                className="h-8 pl-8 pr-7 text-xs bg-background"
              />
              {memoDaySearch && (
                <button
                  type="button"
                  onClick={() => setMemoDaySearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Empty State when no diary plan is created or active */}
      {!currentDiaryPlan && (
        <div className="bg-card border rounded-xl p-8 text-center space-y-3">
          <div className="mx-auto w-10 h-10 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground">
            <BookOpenCheck className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-semibold text-sm text-foreground">Памятка практики не создана</h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {isStudent
                ? "Для вашей группы пока не создана памятка практики. Обратитесь к куратору или руководителю практики."
                : "Памятки для учебных групп ещё не созданы. Нажмите «Создать памятку группы», чтобы утвердить первую программу практики."}
            </p>
          </div>
          {!isStudent && (
            <Button
              size="xs"
              onClick={onOpenCreatePlan}
              className="h-8 gap-1.5 font-medium"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Создать памятку группы</span>
            </Button>
          )}
        </div>
      )}

      {/* Student Banner when viewing their group's memo */}
      {isStudent && myPracticeInfo && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <GraduationCap className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-foreground flex items-center gap-2">
                <span>Памятка для вашей группы:</span>
                <Badge className="bg-primary text-primary-foreground font-semibold text-[10px]">
                  {myPracticeInfo.groupName}
                </Badge>
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                Специальность: <strong>{currentDiaryPlan?.specialty}</strong> • {currentDiaryPlan?.course} курс • {currentDiaryPlan?.practiceType}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[11px] font-mono bg-background border-primary/40 text-primary">
              Расчасовка: {currentDiaryPlan?.totalHours} ч. ({currentDiaryPlan?.days.length} рабочих дней по {averageHoursPerDay} ч./день)
            </Badge>
          </div>
        </div>
      )}

      {/* Dedicated Расчасовка & Academic Curriculum Table */}
      {currentDiaryPlan && (
        <div className="bg-card border rounded-xl p-3.5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2.5">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span className="font-bold text-foreground text-xs sm:text-sm">
                Утверждённая расчасовка: Группа {currentDiaryPlan.groupName} ({currentDiaryPlan.specialty})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
                {currentDiaryPlan.practiceType}
              </Badge>
              <Button
                size="xs"
                variant="ghost"
                onClick={() => setIsCurriculumTableExpanded(!isCurriculumTableExpanded)}
                className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground gap-1"
              >
                <span>{isCurriculumTableExpanded ? "Свернуть таблицу" : "Развернуть таблицу"}</span>
                {isCurriculumTableExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>
            </div>
          </div>

          {/* 4 Academic Summary Metric Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-muted/30 border space-y-0.5">
              <span className="text-[10px] text-muted-foreground font-medium">Общий объем практики</span>
              <div className="font-bold text-foreground text-sm font-mono text-primary">
                <AnimatedCounter value={currentDiaryPlan.totalHours} /> ак. часов
              </div>
              <div className="text-[10px] text-muted-foreground">по утверждённому учебному плану</div>
            </div>

            <div className="p-2.5 rounded-lg bg-muted/30 border space-y-0.5">
              <span className="text-[10px] text-muted-foreground font-medium">Продолжительность</span>
              <div className="font-bold text-foreground text-sm font-mono">
                <AnimatedCounter value={currentDiaryPlan.days.length} /> рабочих дней
              </div>
              <div className="text-[10px] text-muted-foreground">норма: {averageHoursPerDay} ч. в день</div>
            </div>

            <div className="p-2.5 rounded-lg bg-muted/30 border space-y-0.5">
              <span className="text-[10px] text-muted-foreground font-medium">Календарные сроки</span>
              <div className="font-semibold text-foreground text-[11px] font-mono truncate">
                {calculatedDates[0] || "—"} — {calculatedDates[calculatedDates.length - 1] || "—"}
              </div>
              <div className="text-[10px] text-muted-foreground">без учета воскресений</div>
            </div>

            <div className="p-2.5 rounded-lg bg-muted/30 border space-y-0.5">
              <span className="text-[10px] text-muted-foreground font-medium">Курс и модули</span>
              <div className="font-bold text-foreground text-sm font-mono">
                <AnimatedCounter value={sectionHoursSummary.length} /> модулей / {currentDiaryPlan.course} курс
              </div>
              <div className="text-[10px] text-muted-foreground">{currentDiaryPlan.specialty}</div>
            </div>
          </div>

          {/* Formal Academic Curriculum Table */}
          {isCurriculumTableExpanded && (
            <div className="space-y-1.5 pt-1">
              <div className="text-[11px] font-semibold text-muted-foreground flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span>Учебно-тематический план распределения часов по разделам:</span>
                  {!isStudent && (
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={onOpenSectionsDialog}
                      className="h-6 px-2 text-[10px] gap-1 font-medium bg-background border-primary/40 text-primary hover:bg-primary/10"
                      title="Настроить перечень разделов и распределение часов"
                    >
                      <Settings2 className="h-3 w-3" />
                      <span>Настроить разделы и часы</span>
                    </Button>
                  )}
                </div>
                <span className="font-mono text-[10px]">Всего часов: {currentDiaryPlan.totalHours} ак. ч.</span>
              </div>

              <div className="border rounded-lg overflow-hidden bg-background">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-muted/50 border-b text-[11px] text-muted-foreground">
                      <th className="p-2 text-center w-10 border-r font-semibold">№</th>
                      <th className="p-2 text-left border-r font-semibold">Наименование раздела / модуля программы практики</th>
                      <th className="p-2 text-center w-24 border-r font-semibold">Дней</th>
                      <th className="p-2 text-center w-28 border-r font-semibold">Норма (ч./день)</th>
                      <th className="p-2 text-center w-28 border-r font-semibold">Всего часов</th>
                      <th className="p-2 text-center w-20 border-r font-semibold">Доля</th>
                      {!isStudent && (
                        <th className="p-2 text-center w-20 font-semibold">Действия</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y text-[11px]">
                    {sectionHoursSummary.map((sec, idx) => (
                      <tr key={idx} className="hover:bg-muted/20 transition-colors">
                        <td className="p-2 text-center font-mono text-muted-foreground border-r">{idx + 1}</td>
                        <td className="p-2 font-medium text-foreground border-r">{sec.section}</td>
                        <td className="p-2 text-center font-mono border-r">{sec.daysCount} дн.</td>
                        <td className="p-2 text-center font-mono text-muted-foreground border-r">
                          {(sec.hoursCount / sec.daysCount).toFixed(0)} ч.
                        </td>
                        <td className="p-2 text-center font-mono font-bold text-primary border-r">
                          {sec.hoursCount} ч.
                        </td>
                        <td className={`p-2 text-center font-mono text-muted-foreground ${!isStudent ? "border-r" : ""}`}>{sec.percent}%</td>
                        {!isStudent && (
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => onEditSection(sec.section)}
                              className="p-1 text-muted-foreground hover:text-primary rounded transition-colors"
                              title="Настроить раздел"
                            >
                              <Edit2 className="h-3 w-3 inline" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                    <tr className="bg-muted/40 font-bold border-t text-[11px]">
                      <td className="p-2 text-center border-r font-mono">—</td>
                      <td className="p-2 border-r text-foreground">ИТОГО ПО УТВЕРЖДЁННОМУ ПЛАНУ:</td>
                      <td className="p-2 text-center font-mono border-r">{currentDiaryPlan.days.length} дн.</td>
                      <td className="p-2 text-center font-mono border-r">{averageHoursPerDay} ч.</td>
                      <td className="p-2 text-center font-mono text-primary border-r">{currentDiaryPlan.totalHours} ч.</td>
                      <td className={`p-2 text-center font-mono ${!isStudent ? "border-r" : ""}`}>100%</td>
                      {!isStudent && <td className="p-2 text-center font-mono text-muted-foreground">—</td>}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Convenient Physical Diary Rewriting Section */}
      {currentDiaryPlan && (
        <div className="bg-card border rounded-xl overflow-clip space-y-0">
          {/* Header with Title, Mode Switcher & Focus Mode */}
          <div className="p-3 bg-muted/40 border-b flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <PenLine className="h-4 w-4 text-primary" />
                <span className="font-bold text-foreground text-xs sm:text-sm">
                  Образец заполнения дневника практики (Группа {currentDiaryPlan.groupName})
                </span>
                <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30 font-medium">
                  {currentDiaryPlan.specialty}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Строка за строкой переписывайте данные в соответствующие графы вашего бумажного дневника.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Admin actions */}
              {!isStudent && (
                <div className="flex items-center gap-1">
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={onOpenAddDayTopic}
                    className="h-7 px-2 text-xs gap-1 font-medium bg-background border-primary/40 text-primary hover:bg-primary/10"
                    title="Добавить новый день"
                  >
                    <Plus className="h-3 w-3" />
                    <span>День #{currentDiaryPlan.days.length + 1}</span>
                  </Button>

                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => onOpenEditPlan(currentDiaryPlan)}
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                    title="Параметры памятки"
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>

                  {onDeletePlan && (
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => onDeletePlan(currentDiaryPlan)}
                      className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      title="Удалить памятку группы"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* STICKY PANEL: progress + search + filters */}
          <div className="sticky top-0 z-20 bg-background border-b">
            <div className="p-2.5 bg-muted/20 border-b flex flex-wrap items-center justify-between gap-2.5 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground text-[11px]">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>
                  <strong>Памятка:</strong> в узкую графу дневника вносите <em>«Тему задания»</em>, в широкую графу — <em>«Краткое содержание работ»</em>.
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground">
                  Внесено в тетрадь: <strong className="text-foreground"><AnimatedCounter value={rewriteProgress.count} /></strong> из <AnimatedCounter value={currentDiaryPlan.days.length} /> дн.
                </span>
                <div className="w-24 bg-muted rounded-full h-1.5 overflow-hidden border">
                  <div
                    className="bg-primary h-full transition-all duration-700 ease-out"
                    style={{ width: `${rewriteProgress.percent}%` }}
                  />
                </div>
                <span className="font-mono text-[10px] font-bold text-primary w-8 text-right">
                  <AnimatedCounter value={rewriteProgress.percent} suffix="%" />
                </span>
              </div>
            </div>

            {/* Search + Filters Toolbar */}
            <div className="p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  value={memoDaySearch}
                  onChange={(e) => setMemoDaySearch(e.target.value)}
                  placeholder="Поиск по теме, содержанию, дню..."
                  className="h-7 pl-7 pr-7 text-xs bg-background"
                />
                {memoDaySearch && (
                  <button
                    type="button"
                    onClick={() => setMemoDaySearch("")}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground"
                    title="Очистить поиск"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-muted-foreground font-medium mr-1">Показать:</span>
                <button
                  type="button"
                  onClick={() => setRewriteFilter("ALL")}
                  className={`h-6 px-2.5 rounded text-[11px] font-medium border transition-colors active:scale-95 ${
                    rewriteFilter === "ALL"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-muted text-foreground border-border"
                  }`}
                >
                  Все дни (<AnimatedCounter value={currentDiaryPlan.days.length} />)
                </button>
                <button
                  type="button"
                  onClick={() => setRewriteFilter("PENDING")}
                  className={`h-6 px-2.5 rounded text-[11px] font-medium border transition-colors active:scale-95 ${
                    rewriteFilter === "PENDING"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-muted text-foreground border-border"
                  }`}
                >
                  Осталось записать (<AnimatedCounter value={currentDiaryPlan.days.length - rewriteProgress.count} />)
                </button>
                <button
                  type="button"
                  onClick={() => setRewriteFilter("DONE")}
                  className={`h-6 px-2.5 rounded text-[11px] font-medium border transition-colors active:scale-95 ${
                    rewriteFilter === "DONE"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-muted text-foreground border-border"
                  }`}
                >
                  Уже в тетради (<AnimatedCounter value={rewriteProgress.count} />)
                </button>

                {rewriteProgress.count > 0 && (
                  <button
                    type="button"
                    onClick={onOpenResetDialog}
                    className="h-6 px-2 text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-1 ml-1"
                    title="Сбросить все отметки"
                  >
                    <RotateCcw className="h-2.5 w-2.5" />
                    <span>Сбросить</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    const all = Array.from(
                      new Set(currentDiaryPlan.days.map((d) => d.section?.trim() || "Общий раздел"))
                    );
                    setCollapsedSections((prev) => (prev.length >= all.length ? [] : all));
                  }}
                  className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 ml-1"
                  title="Свернуть или развернуть все разделы"
                >
                  <ChevronUp className="h-2.5 w-2.5" />
                  <span>Свернуть / развернуть разделы</span>
                </button>
              </div>

              <div className="text-[11px] text-muted-foreground font-mono">
                Норма: ~{averageHoursPerDay} ч./день • Всего: {currentDiaryPlan.totalHours} ч.
              </div>
            </div>
          </div>

          {/* TABLE VIEW (EXACTLY LIKE PHYSICAL PAPER DIARY PAGES) */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse text-left table-fixed">
              <colgroup>
                <col className="w-28" />
                <col className="w-[28%]" />
                <col />
                <col className="w-16" />
                <col className="w-28" />
                {!isStudent && <col className="w-20" />}
              </colgroup>
              <thead>
                <tr className="bg-muted/50 border-b text-[11px] text-muted-foreground">
                  <th className="p-2.5 text-center w-28 border-r font-semibold">
                    Дата и день
                  </th>
                  <th className="p-2.5 w-[28%] border-r font-semibold">
                    Графа 1: «Индивидуальное задание / Тема»
                  </th>
                  <th className="p-2.5 font-semibold">
                    Графа 2: «Краткое содержание выполненных работ» (текст для дневника)
                  </th>
                  <th className="p-2.5 text-center w-16 border-l font-semibold">
                    Часы
                  </th>
                  <th className="p-2.5 text-center w-28 border-l font-semibold">
                    В тетради
                  </th>
                  {!isStudent && (
                    <th className="p-2.5 text-center w-20 border-l font-semibold">
                      Действия
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y text-xs">
                {filteredPlanDays.length === 0 ? (
                  <tr>
                    <td colSpan={isStudent ? 5 : 6} className="p-8 text-center text-muted-foreground">
                      Дней по выбранному фильтру не найдено.
                    </td>
                  </tr>
                ) : (
                  sectionGroups.map((group) => {
                    const pct = group.total > 0 ? Math.round((group.done / group.total) * 100) : 0;
                    return (
                      <React.Fragment key={`sec-${group.section}`}>
                        {/* Section Accordion Header Row */}
                        <tr
                          className="bg-muted/40 hover:bg-muted/60 cursor-pointer select-none transition-colors"
                          onClick={() =>
                            setCollapsedSections((prev) =>
                              prev.includes(group.section)
                                ? prev.filter((s) => s !== group.section)
                                : [...prev, group.section]
                            )
                          }
                        >
                          <td colSpan={isStudent ? 5 : 6} className="p-2">
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                              <div className="flex items-center gap-1.5 font-semibold text-foreground text-xs">
                                <ChevronDown
                                  className={`h-3.5 w-3.5 text-primary shrink-0 transition-transform duration-300 ${
                                    group.collapsed ? "-rotate-90" : "rotate-0"
                                  }`}
                                />
                                <span>{group.section}</span>
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                <span className="font-mono">
                                  <AnimatedCounter value={group.done} /> из <AnimatedCounter value={group.total} /> дн. • {group.hours} ч.
                                </span>
                                <div className="w-16 bg-muted rounded-full h-1.5 overflow-hidden border">
                                  <div
                                    className="bg-primary h-full transition-all duration-500 ease-out"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className="font-mono text-[10px] font-bold text-primary w-8 text-right">
                                  <AnimatedCounter value={pct} suffix="%" />
                                </span>
                              </div>
                            </div>
                          </td>
                        </tr>

                        {/* Animated Accordion Content Row */}
                        <tr className="border-0">
                          <td colSpan={isStudent ? 5 : 6} className="p-0 border-0">
                            <div
                              className={cn(
                                "grid transition-all duration-300 ease-in-out",
                                group.collapsed ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"
                              )}
                            >
                              <div className="overflow-hidden">
                                <table className="w-full text-xs border-collapse table-fixed text-left">
                                  <colgroup>
                                    <col className="w-28" />
                                    <col className="w-[28%]" />
                                    <col />
                                    <col className="w-16" />
                                    <col className="w-28" />
                                    {!isStudent && <col className="w-20" />}
                                  </colgroup>
                                  <tbody className="divide-y text-xs">
                                    {group.days.map((dayItem, dayIdx) => {
                                      const actualIdx = currentDiaryPlan.days.findIndex((d) => d.id === dayItem.id);
                                      const dateForThisDay = calculatedDates[actualIdx >= 0 ? actualIdx : dayIdx] || "—";
                                      const weekday = getWeekdayFromDateStr(dateForThisDay);
                                      const isRewritten = rewrittenDayIds.includes(dayItem.id);
                                      const isTopicCopied = copiedDayId === `topic-${dayItem.id}`;
                                      const isContentCopied = copiedDayId === `content-${dayItem.id}`;

                                      return (
                                        <tr
                                          key={dayItem.id}
                                          className={`transition-colors ${
                                            isRewritten
                                              ? "bg-primary/5 hover:bg-primary/10"
                                              : "hover:bg-muted/20"
                                          }`}
                                        >
                                          {/* Column 1: Date & Day number */}
                                          <td className="p-2.5 text-center border-r align-top whitespace-nowrap bg-muted/10">
                                            <div className="font-bold text-foreground text-xs">
                                              День {dayItem.dayNumber}
                                            </div>
                                            <div className="font-mono text-xs text-primary font-bold mt-0.5">
                                              {dateForThisDay}
                                            </div>
                                            {weekday && (
                                              <div className="text-[10px] text-muted-foreground">
                                                ({weekday})
                                              </div>
                                            )}
                                          </td>

                                          {/* Column 2: Theme / Task */}
                                          <td className="p-2.5 border-r align-top">
                                            <div className="flex items-start justify-between gap-1.5">
                                              <div className="font-semibold text-foreground text-xs leading-snug">
                                                {dayItem.topic}
                                              </div>
                                              <button
                                                type="button"
                                                onClick={() => onCopyTopicContent(`topic-${dayItem.id}`, dayItem.topic)}
                                                className="p-1 text-muted-foreground hover:text-primary rounded shrink-0 transition-all active:scale-90"
                                                title="Скопировать тему"
                                              >
                                                {isTopicCopied ? <Check className="h-3.5 w-3.5 text-primary animate-in zoom-in-75 duration-200" /> : <Copy className="h-3.5 w-3.5" />}
                                              </button>
                                            </div>
                                            <div className="text-[10px] text-muted-foreground/80 italic mt-1">
                                              {dayItem.section}
                                            </div>
                                          </td>

                                          {/* Column 3: Work Content for Handwriting */}
                                          <td className="p-2.5 align-top">
                                            <div className="flex items-start justify-between gap-2">
                                              <div className="text-foreground text-xs leading-relaxed font-sans select-all">
                                                {dayItem.tasksContent}
                                              </div>
                                              <button
                                                type="button"
                                                onClick={() => onCopyTopicContent(`content-${dayItem.id}`, dayItem.tasksContent)}
                                                className="p-1 text-muted-foreground hover:text-primary rounded shrink-0 transition-all active:scale-90"
                                                title="Скопировать текст работы"
                                              >
                                                {isContentCopied ? <Check className="h-3.5 w-3.5 text-primary animate-in zoom-in-75 duration-200" /> : <Copy className="h-3.5 w-3.5" />}
                                              </button>
                                            </div>
                                          </td>

                                          {/* Column 4: Hours */}
                                          <td className="p-2.5 text-center border-l align-top font-mono font-bold text-xs whitespace-nowrap text-foreground">
                                            {dayItem.hours} ч.
                                          </td>

                                          {/* Column 5: Rewrite Checkbox */}
                                          <td className="p-2.5 text-center border-l align-top">
                                            <button
                                              type="button"
                                              onClick={() => onToggleDayRewritten(dayItem.id)}
                                              className={`h-7 px-2.5 rounded border text-[11px] font-medium w-full flex items-center justify-center gap-1.5 transition-all duration-150 active:scale-95 ${
                                                isRewritten
                                                  ? "bg-primary text-primary-foreground border-primary"
                                                  : "bg-background hover:bg-muted text-muted-foreground border-border"
                                              }`}
                                              title={isRewritten ? "Снять отметку" : "Отметить как переписанное в тетрадь"}
                                            >
                                              {isRewritten ? (
                                                <>
                                                  <CheckSquare className="h-3.5 w-3.5 shrink-0 animate-in zoom-in-75 duration-150" />
                                                  <span>Записано</span>
                                                </>
                                              ) : (
                                                <>
                                                  <Square className="h-3.5 w-3.5 shrink-0" />
                                                  <span>Записать</span>
                                                </>
                                              )}
                                            </button>
                                          </td>

                                          {/* Column 6: Admin Actions */}
                                          {!isStudent && (
                                            <td className="p-2.5 text-center border-l align-top">
                                              <div className="flex items-center justify-center gap-1">
                                                <button
                                                  type="button"
                                                  onClick={() => onOpenEditDayTopic(dayItem)}
                                                  className="p-1 text-muted-foreground hover:text-primary rounded transition-colors"
                                                  title="Редактировать тему, раздел и часы этого дня"
                                                >
                                                  <Edit2 className="h-3.5 w-3.5" />
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => onDeleteDayTopic(dayItem)}
                                                  className="p-1 text-muted-foreground hover:text-destructive rounded transition-colors"
                                                  title="Удалить день из плана"
                                                >
                                                  <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                              </div>
                                            </td>
                                          )}
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
