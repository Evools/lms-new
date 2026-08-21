"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  RotateCcw,
  RefreshCw,
  Check,
  X,
  CheckCircle2,
  XCircle,
  User,
  FileText,
  Users,
  Building2,
  Clock,
  Sparkles,
  Download,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Award,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Cell,
} from "recharts";
import { resetTestSubmissionAction } from "@/app/dashboard/lms/actions";

interface QuestionDTO {
  id: string;
  type?: string;
  questionText: string;
  options: any;
  correctAnswer: string;
  points: number;
}

interface StudentResultDTO {
  studentId: string;
  studentName: string;
  submissionId: string | null;
  hasSubmitted: boolean;
  score: number;
  maxScore: number;
  percent: number;
  submittedAt: string | null;
  tabSwitches?: number;
  answersMap: Record<
    string,
    { answer: string; isCorrect: boolean; isPartial?: boolean; pointsAwarded: number }
  >;
}

interface AnalyticsDTO {
  totalEnrolled: number;
  submittedCount: number;
  avgPercent: number;
  medianPercent: number;
  highestPercent: number;
  lowestPercent: number;
  hardestQuestion: {
    questionId: string;
    questionNumber: number;
    questionText: string;
    accuracyPercent: number;
  } | null;
  easiestQuestion: {
    questionId: string;
    questionNumber: number;
    questionText: string;
    accuracyPercent: number;
  } | null;
  scoreDistribution: Array<{
    range: string;
    label: string;
    count: number;
    fill: string;
  }>;
}

interface QuestionStatDTO {
  questionId: string;
  questionNumber: number;
  questionText: string;
  type?: string;
  points: number;
  fullCorrectCount: number;
  partialCount: number;
  wrongCount: number;
  accuracyPercent: number;
}

interface TestResultsViewProps {
  test: {
    id: string;
    title: string;
    description: string;
    groupName: string;
    subjectName: string;
    timeLimit: number | null;
    totalMaxPoints: number;
  };
  questions: QuestionDTO[];
  studentsResults: StudentResultDTO[];
  analytics?: AnalyticsDTO;
  questionStats?: QuestionStatDTO[];
}

export function TestResultsView({
  test,
  questions,
  studentsResults,
  analytics,
  questionStats = [],
}: TestResultsViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<"matrix" | "analytics">("matrix");

  const [resetTarget, setResetTarget] = useState<{
    submissionId: string;
    studentName: string;
  } | null>(null);

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  const handleConfirmReset = async () => {
    if (!resetTarget) return;
    const res = await resetTestSubmissionAction(
      resetTarget.submissionId,
      test.id
    );
    setResetTarget(null);
    if (res.success) {
      router.refresh();
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "ФИО Студента",
      "Статус",
      "Баллы",
      "Макс. балл",
      "Процент (%)",
      "Переключений вкладок",
      "Дата сдачи",
      ...questions.map((_, idx) => `Вопрос #${idx + 1}`),
    ];

    const rows = studentsResults.map((s) => {
      const qAnswers = questions.map((q) => {
        if (!s.hasSubmitted) return "Не сдавал";
        const a = s.answersMap[q.id];
        if (!a) return "Нет ответа";
        if (a.isCorrect) return `Верно (+${a.pointsAwarded})`;
        if (a.isPartial) return `Частично (+${a.pointsAwarded})`;
        return "Ошибка (0)";
      });

      return [
        `"${s.studentName}"`,
        s.hasSubmitted ? "Сдано" : "Не сдавал",
        s.hasSubmitted ? s.score : 0,
        s.maxScore,
        s.hasSubmitted ? `${s.percent}%` : "0%",
        s.tabSwitches || 0,
        s.submittedAt ? `"${new Date(s.submittedAt).toLocaleString("ru-RU")}"` : "-",
        ...qAnswers.map((ans) => `"${ans}"`),
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Результаты_${test.title.replace(/\s+/g, "_")}_${test.groupName}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const submittedCount = studentsResults.filter((s) => s.hasSubmitted).length;
  const avgPercent =
    analytics?.avgPercent ??
    (submittedCount > 0
      ? Math.round(
          studentsResults
            .filter((s) => s.hasSubmitted)
            .reduce((acc, s) => acc + s.percent, 0) / submittedCount
        )
      : 0);

  const distributionData = analytics?.scoreDistribution || [
    { range: "0–39%", label: "Неуд", count: studentsResults.filter((s) => s.hasSubmitted && s.percent < 40).length, fill: "var(--destructive)" },
    { range: "40–59%", label: "Удовл", count: studentsResults.filter((s) => s.hasSubmitted && s.percent >= 40 && s.percent < 60).length, fill: "var(--chart-3)" },
    { range: "60–79%", label: "Хор", count: studentsResults.filter((s) => s.hasSubmitted && s.percent >= 60 && s.percent < 80).length, fill: "var(--chart-2)" },
    { range: "80–100%", label: "Отл", count: studentsResults.filter((s) => s.hasSubmitted && s.percent >= 80).length, fill: "var(--chart-1)" },
  ];

  const questionChartData = questionStats.map((qs) => ({
    name: `В#${qs.questionNumber}`,
    accuracy: qs.accuracyPercent,
    fullText: qs.questionText,
    correct: qs.fullCorrectCount,
    partial: qs.partialCount,
    wrong: qs.wrongCount,
  }));

  return (
    <TooltipProvider>
      <div className="space-y-4 w-full pb-10">
        {/* Header Navigation & Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3.5 rounded-xl border shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Link href="/dashboard/lms/tests">
                <Button
                  size="xs"
                  variant="ghost"
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Назад к тестам
                </Button>
              </Link>
              <span className="text-muted-foreground">•</span>
              <Badge variant="outline" className="text-[10px] gap-1 font-medium border-primary/30 text-primary">
                <Building2 className="h-3 w-3" /> {test.groupName}
              </Badge>
              <Badge variant="secondary" className="text-[10px] font-normal">
                {test.subjectName}
              </Badge>
            </div>

            <h1 className="text-base font-bold text-foreground tracking-tight flex items-center gap-2">
              Результаты теста: {test.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-primary" /> Сдали:{" "}
                <strong className="text-foreground">{submittedCount}</strong> из{" "}
                {studentsResults.length} студентов
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                Средний результат:{" "}
                <strong className="text-primary">{avgPercent}%</strong>
              </span>
              {test.timeLimit && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-primary" /> Лимит:{" "}
                    <strong className="text-foreground">{test.timeLimit} мин.</strong>
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-center flex-wrap">
            <div className="flex items-center bg-muted p-0.5 rounded-lg border text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("matrix")}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  activeTab === "matrix"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Матрица
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("analytics")}
                className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1 ${
                  activeTab === "analytics"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <BarChart3 className="h-3 w-3 text-primary" />
                Аналитика
              </button>
            </div>

            <Button
              size="xs"
              variant="outline"
              onClick={handleExportCSV}
              className="h-8 text-xs gap-1.5 font-medium hover:bg-muted"
            >
              <Download className="h-3.5 w-3.5" />
              Экспорт CSV
            </Button>

            <Button
              size="xs"
              variant="outline"
              onClick={handleRefresh}
              disabled={isPending}
              className="h-8 text-xs gap-1.5 font-medium border-primary/30 text-primary hover:bg-primary/5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />
              Обновить
            </Button>
          </div>
        </div>

        {/* Insight KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="p-3 bg-card border shadow-xs space-y-1">
            <div className="flex items-center justify-between text-muted-foreground text-[11px]">
              <span>Сдано работ</span>
              <Users className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="text-lg font-bold text-foreground">
              {submittedCount}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                / {studentsResults.length}
              </span>
            </div>
            <div className="text-[10px] text-muted-foreground">
              {Math.round((submittedCount / (studentsResults.length || 1)) * 100)}% явка на тест
            </div>
          </Card>

          <Card className="p-3 bg-card border shadow-xs space-y-1">
            <div className="flex items-center justify-between text-muted-foreground text-[11px]">
              <span>Средний результат</span>
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="text-lg font-bold text-foreground flex items-center gap-1.5">
              {avgPercent}%
              <span className="text-xs font-normal text-muted-foreground">
                (медиана {analytics?.medianPercent ?? avgPercent}%)
              </span>
            </div>
            <div className="text-[10px] text-muted-foreground">
              Макс: {analytics?.highestPercent ?? 0}% • Мин: {analytics?.lowestPercent ?? 0}%
            </div>
          </Card>

          <Card className="p-3 bg-card border shadow-xs space-y-1">
            <div className="flex items-center justify-between text-muted-foreground text-[11px]">
              <span>Самый сложный вопрос</span>
              <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
            </div>
            <div className="text-sm font-bold text-destructive truncate">
              {analytics?.hardestQuestion ? (
                <>Вопрос #{analytics.hardestQuestion.questionNumber} ({analytics.hardestQuestion.accuracyPercent}%)</>
              ) : (
                "Нет данных"
              )}
            </div>
            <div className="text-[10px] text-muted-foreground truncate">
              {analytics?.hardestQuestion?.questionText || "Ошибок не обнаружено"}
            </div>
          </Card>

          <Card className="p-3 bg-card border shadow-xs space-y-1">
            <div className="flex items-center justify-between text-muted-foreground text-[11px]">
              <span>Самый легкий вопрос</span>
              <Award className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="text-sm font-bold text-primary truncate">
              {analytics?.easiestQuestion ? (
                <>Вопрос #{analytics.easiestQuestion.questionNumber} ({analytics.easiestQuestion.accuracyPercent}%)</>
              ) : (
                "Нет данных"
              )}
            </div>
            <div className="text-[10px] text-muted-foreground truncate">
              {analytics?.easiestQuestion?.questionText || "Все вопросы сбалансированы"}
            </div>
          </Card>
        </div>

        {/* Analytics Charts View */}
        {activeTab === "analytics" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Score Distribution Chart */}
            <Card className="p-4 bg-card border shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <BarChart3 className="h-4 w-4 text-primary" /> Распределение баллов в группе
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Количество студентов по диапазонам успешности
                  </p>
                </div>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={distributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                    <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <RechartsTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-popover text-popover-foreground text-xs p-2 rounded-lg border shadow-md space-y-0.5">
                              <p className="font-bold">{data.label}</p>
                              <p className="text-muted-foreground">
                                Студентов: <strong className="text-foreground">{data.count}</strong>
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {distributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Question Accuracy Chart */}
            <Card className="p-4 bg-card border shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-primary" /> Успешность по вопросам (% верных)
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Определяет темы, вызвавшие наибольшие затруднения
                  </p>
                </div>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={questionChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} />
                    <RechartsTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-popover text-popover-foreground text-xs p-2.5 rounded-lg border shadow-md space-y-1 max-w-xs">
                              <p className="font-bold text-primary">{data.name}: {data.accuracy}% верных</p>
                              <p className="text-[11px] text-muted-foreground line-clamp-2">{data.fullText}</p>
                              <div className="text-[10px] pt-1 border-t border-border flex items-center gap-2">
                                <span className="text-primary font-semibold">Верно: {data.correct}</span>
                                {data.partial > 0 && <span className="text-amber-600 dark:text-amber-400 font-semibold">Частично: {data.partial}</span>}
                                <span className="text-destructive font-semibold">Ошибок: {data.wrong}</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="accuracy" radius={[4, 4, 0, 0]}>
                      {questionChartData.map((entry, index) => {
                        const color =
                          entry.accuracy >= 75
                            ? "var(--chart-1)"
                            : entry.accuracy >= 45
                              ? "var(--chart-3)"
                              : "var(--destructive)";
                        return <Cell key={`qcell-${index}`} fill={color} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        )}

        {/* Matrix Results Table */}
        <div className="border rounded-xl bg-card shadow-xs overflow-hidden">
          <div className="p-3 border-b bg-muted/30 flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Сводная матрица результатов
            </h2>
            <div className="flex items-center gap-2 text-[11px] flex-wrap">
              <Badge variant="outline" className="text-[11px] font-medium gap-1 text-primary border-primary/30 bg-primary/10">
                <CheckCircle2 className="h-3 w-3" />
                Верно
              </Badge>
              <Badge variant="outline" className="text-[11px] font-medium gap-1 text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10">
                <span className="font-bold font-mono text-[10px]">½</span>
                Частично
              </Badge>
              <Badge variant="outline" className="text-[11px] font-medium gap-1 text-destructive border-destructive/30 bg-destructive/10">
                <XCircle className="h-3 w-3" />
                Ошибка
              </Badge>
              <span className="text-muted-foreground ml-1 flex items-center gap-1 text-[11px]">
                <RotateCcw className="h-3 w-3" /> Сбросить попытку
              </span>
            </div>
          </div>

          <div className="overflow-x-auto max-w-full">
            <table className="w-full text-xs text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-muted/50 border-b text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  <th className="py-2.5 px-3 sticky left-0 z-20 bg-muted/95 border-r shadow-xs min-w-[280px]">
                    ФИО / % / Баллы
                  </th>

                  {questions.map((q, qIdx) => {
                    const headerAlign = qIdx <= 1 ? "start" : qIdx >= questions.length - 2 ? "end" : "center";
                    return (
                      <th
                        key={q.id}
                        className="py-2.5 px-2 text-center border-r min-w-[46px] max-w-[56px]"
                      >
                        <Tooltip>
                          <TooltipTrigger>
                            <div className="inline-flex items-center gap-0.5 cursor-help hover:text-primary transition-colors">
                              <FileText className="h-3.5 w-3.5 shrink-0" />
                              <span>{qIdx + 1}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" align={headerAlign} className="max-w-xs text-xs p-2.5 bg-popover text-popover-foreground border border-border shadow-md">
                            <p className="font-bold text-primary mb-1">
                              Вопрос #{qIdx + 1} ({q.points} б.)
                            </p>
                            <p className="text-muted-foreground line-clamp-3">
                              {q.questionText}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {studentsResults.map((student) => {
                  const percentBadgeStyle =
                    !student.hasSubmitted
                      ? "bg-muted text-muted-foreground border-border"
                      : student.percent >= 80
                        ? "bg-primary/15 text-primary border-primary/30 font-bold"
                        : student.percent >= 60
                          ? "bg-secondary text-secondary-foreground border-border font-bold"
                          : "bg-destructive/15 text-destructive border-destructive/30 font-bold";

                  const leftBorderStyle =
                    !student.hasSubmitted
                      ? "border-l-border"
                      : student.percent >= 80
                        ? "border-l-primary"
                        : student.percent >= 60
                          ? "border-l-secondary-foreground/40"
                          : "border-l-destructive";

                  return (
                    <tr
                      key={student.studentId}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      {/* Fixed Left Column */}
                      <td
                        className={`py-2 px-3 sticky left-0 z-10 bg-card border-r border-l-4 ${leftBorderStyle} shadow-2xs`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="space-y-0.5 truncate">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-foreground text-xs block truncate">
                                {student.studentName}
                              </span>
                              {student.tabSwitches && student.tabSwitches > 0 ? (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Badge variant="destructive" className="h-4 px-1 text-[9px] gap-0.5 font-mono">
                                      <ShieldAlert className="h-2.5 w-2.5" /> {student.tabSwitches}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="text-xs">
                                    Студент переключал вкладку {student.tabSwitches} раз(а)
                                  </TooltipContent>
                                </Tooltip>
                              ) : null}
                            </div>
                            {!student.hasSubmitted && (
                              <span className="text-[10px] text-muted-foreground italic">
                                Не проходил тест
                              </span>
                            )}
                          </div>

                          {student.hasSubmitted && (
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full border ${percentBadgeStyle}`}
                              >
                                {student.percent}%
                              </span>

                              <span className="font-mono font-bold text-xs text-foreground min-w-[40px] text-right">
                                {student.score.toFixed(1)} б.
                              </span>

                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={() =>
                                  setResetTarget({
                                    submissionId: student.submissionId!,
                                    studentName: student.studentName,
                                  })
                                }
                                className="h-6 w-6 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md"
                                title="Дать пересдать (Сбросить попытку)"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Question Columns (#1..#N) */}
                      {questions.map((q, qIdx) => {
                        const ansData = student.answersMap[q.id];

                        if (!student.hasSubmitted || !ansData) {
                          return (
                            <td
                              key={q.id}
                              className="py-2 px-1 text-center border-r text-muted-foreground/40 font-mono text-[11px]"
                            >
                              -
                            </td>
                          );
                        }

                        const isCorrect = ansData.isCorrect;
                        const isPartial = ansData.isPartial;

                        const tooltipAlign = qIdx <= 1 ? "start" : qIdx >= questions.length - 2 ? "end" : "center";

                        return (
                          <td
                            key={q.id}
                            className={`py-1.5 px-1 text-center border-r transition-colors ${
                              isCorrect
                                ? "bg-primary/5 hover:bg-primary/10"
                                : isPartial
                                  ? "bg-amber-500/5 hover:bg-amber-500/10"
                                  : "bg-destructive/5 hover:bg-destructive/10"
                            }`}
                          >
                            <Tooltip>
                              <TooltipTrigger>
                                <div className="w-full h-7 flex items-center justify-center cursor-help">
                                  {isCorrect ? (
                                    <div className="w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center border border-primary/30 shadow-2xs">
                                      <Check className="h-3 w-3 stroke-[2.5]" />
                                    </div>
                                  ) : isPartial ? (
                                    <div className="w-5 h-5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/30 shadow-2xs text-[10px] font-bold">
                                      ½
                                    </div>
                                  ) : (
                                    <div className="w-5 h-5 rounded-full bg-destructive/15 text-destructive flex items-center justify-center border border-destructive/30 shadow-2xs">
                                      <X className="h-3 w-3 stroke-[2.5]" />
                                    </div>
                                  )}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent
                                side="top"
                                align={tooltipAlign}
                                showArrow={false}
                                className="w-72 p-3 space-y-2 bg-popover text-popover-foreground border border-border shadow-xl rounded-xl text-xs z-50 block"
                              >
                                <div className="space-y-1 border-b pb-1.5">
                                  <div className="font-bold text-foreground text-xs">
                                    Вопрос #{qIdx + 1} ({q.points} б.)
                                  </div>
                                  <div>
                                    <span
                                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                        isCorrect
                                          ? "bg-primary/10 text-primary border-primary/30"
                                          : isPartial
                                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                                            : "bg-destructive/10 text-destructive border-destructive/30"
                                      }`}
                                    >
                                      {isCorrect ? (
                                        <>
                                          <Check className="h-3 w-3 stroke-[3]" /> Верно (+{ansData.pointsAwarded} б.)
                                        </>
                                      ) : isPartial ? (
                                        <>
                                          <Sparkles className="h-3 w-3" /> Частично (+{ansData.pointsAwarded} б.)
                                        </>
                                      ) : (
                                        <>
                                          <X className="h-3 w-3 stroke-[3]" /> Ошибка (0 б.)
                                        </>
                                      )}
                                    </span>
                                  </div>
                                </div>

                                <div className="text-[11px] text-muted-foreground leading-relaxed break-words font-medium py-1">
                                  {q.questionText}
                                </div>

                                <div className="space-y-1 pt-1.5 border-t text-[11px]">
                                  <div className="flex items-start gap-1">
                                    <span className="text-muted-foreground font-semibold shrink-0 flex items-center gap-1">
                                      <User className="h-3 w-3 text-muted-foreground shrink-0" /> Ответ студента:
                                    </span>
                                    <span
                                      className={`font-bold break-words ${
                                        isCorrect
                                          ? "text-primary"
                                          : isPartial
                                            ? "text-amber-600 dark:text-amber-400"
                                            : "text-destructive"
                                      }`}
                                    >
                                      {ansData.answer || "Нет ответа"}
                                    </span>
                                  </div>

                                  <div className="flex items-start gap-1">
                                    <span className="text-muted-foreground font-semibold shrink-0 flex items-center gap-1">
                                      <CheckCircle2 className="h-3 w-3 text-primary shrink-0" /> Верный ответ:
                                    </span>
                                    <span className="text-primary font-bold break-words">
                                      {q.correctAnswer}
                                    </span>
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Confirmation */}
        <AlertDialog
          open={Boolean(resetTarget)}
          onOpenChange={(open) => !open && setResetTarget(null)}
        >
          <AlertDialogContent className="p-4 gap-3 text-xs sm:max-w-[400px] place-items-start text-left">
            <AlertDialogHeader className="text-left gap-1">
              <AlertDialogTitle className="text-sm font-bold flex items-center gap-1.5 text-foreground">
                <RotateCcw className="h-4 w-4 text-primary" /> Разрешить пересдачу теста?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-muted-foreground">
                Вы действительно хотите сбросить результат работы студента{" "}
                <strong className="text-foreground">{resetTarget?.studentName}</strong>?
                Текущая попытка будет сброшена, и студент сможет пройти тест заново.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2 w-full">
              <AlertDialogCancel className="h-6 px-2.5 text-xs">
                Отмена
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmReset}
                className="h-6 px-2.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
              >
                Разрешить
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}

