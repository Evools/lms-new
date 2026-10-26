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
  ShieldCheck,
  AlertCircle,
  GraduationCap,
  Printer,
  ArrowRight,
  ChevronDown,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
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
import { exportMultiSheetExcel } from "@/lib/excel-export";
import { exportAcademicStatementDocx } from "@/lib/docx-export";
import { toast } from "@/components/ui/toast";
import {
  TestReportDialog,
  formatCorrectAnswerText,
  getGradeLabel,
} from "./test-report-dialog";
import { resetTestSubmissionAction } from "@/app/dashboard/lms/actions";

interface QuestionDTO {
  id: string;
  type?: string;
  questionText: string;
  options: unknown;
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
    teacherName?: string;
    specialtyName?: string;
    academicYear?: string;
    timeLimit: number | null;
    totalMaxPoints: number;
  };
  questions: QuestionDTO[];
  studentsResults: StudentResultDTO[];
  analytics?: AnalyticsDTO;
  questionStats?: QuestionStatDTO[];
}

const QUESTION_TYPE_LABELS: Record<string, string> = {
  SINGLE: "Один ответ",
  MULTIPLE: "Несколько ответов",
  TEXT: "Текстовый",
  TRUE_FALSE: "Да / Нет",
  ORDERING: "Упорядочивание",
  BLANKS: "Пропуски",
  CODE: "Код",
  MATCHING: "Сопоставление",
  NUMERICAL: "Числовой",
};

interface AnswerDisplayProps {
  rawAnswer?: string | null;
  correctAnswer?: string | null;
  type?: string;
  isStudent?: boolean;
  isCorrect?: boolean;
}

function AnswerDisplay({
  rawAnswer,
  correctAnswer,
  type,
  isStudent = false,
  isCorrect = false,
}: AnswerDisplayProps) {
  if (!rawAnswer || !rawAnswer.trim()) {
    return <span className="text-muted-foreground/70 italic text-[11px]">Нет ответа</span>;
  }

  const qType = (type || "SINGLE").toUpperCase();
  const trimmed = rawAnswer.trim();

  // Try parsing JSON if it looks like array or object
  let parsed: unknown = null;
  if (
    (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
    (trimmed.startsWith("{") && trimmed.endsWith("}"))
  ) {
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      parsed = null;
    }
  }

  // Parse correct array for comparison if available
  let correctArr: string[] = [];
  if (correctAnswer) {
    try {
      const c = JSON.parse(correctAnswer);
      if (Array.isArray(c)) {
        correctArr = c.map((s) => String(s).trim().toLowerCase());
      }
    } catch { }
  }

  // 1. Array of values (MULTIPLE, ORDERING, BLANKS, or any array)
  if (Array.isArray(parsed)) {
    if (parsed.length === 0) {
      return <span className="text-muted-foreground/70 italic text-[11px]">Пустой ответ</span>;
    }

    if (qType === "ORDERING") {
      return (
        <div className="flex flex-wrap gap-1">
          {parsed.map((item, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-background border border-border text-foreground shadow-2xs"
            >
              <span className="font-mono font-bold text-primary text-[9px]">{idx + 1}.</span>
              <span className="break-words">{String(item)}</span>
            </span>
          ))}
        </div>
      );
    }

    // MULTIPLE / BLANKS / other array
    return (
      <div className="flex flex-wrap gap-1">
        {parsed.map((item, idx) => {
          const str = String(item).trim();
          const isItemCorrect = correctArr.length > 0 && correctArr.includes(str.toLowerCase());

          return (
            <span
              key={idx}
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border shadow-2xs ${!isStudent
                ? "bg-primary/10 border-primary/30 text-primary"
                : isItemCorrect
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "bg-destructive/10 border-destructive/30 text-destructive"
                }`}
            >
              {!isStudent ? (
                <Check className="h-2.5 w-2.5 shrink-0 stroke-[2.5]" />
              ) : isItemCorrect ? (
                <Check className="h-2.5 w-2.5 shrink-0 stroke-[2.5]" />
              ) : (
                <X className="h-2.5 w-2.5 shrink-0 stroke-[2.5]" />
              )}
              <span className="break-words">{str}</span>
            </span>
          );
        })}
      </div>
    );
  }

  // 2. Object of pairs (MATCHING)
  if (parsed && typeof parsed === "object") {
    const entries = Object.entries(parsed as Record<string, unknown>);
    if (entries.length === 0) {
      return <span className="text-muted-foreground/70 italic text-[11px]">Пусто</span>;
    }
    return (
      <div className="space-y-1">
        {entries.map(([left, right], idx) => (
          <div
            key={idx}
            className="flex items-center justify-between gap-1.5 px-2 py-0.5 rounded text-[10px] bg-background border border-border/70"
          >
            <span className="font-medium text-foreground">{left}</span>
            <span className="text-muted-foreground text-[9px] shrink-0">→</span>
            <span className="font-semibold text-primary">{String(right)}</span>
          </div>
        ))}
      </div>
    );
  }

  // 3. Simple text / Single / Numerical
  const cleanStr = trimmed.replace(/^"|"$/g, "");
  return (
    <span
      className={`text-[11px] font-medium break-words leading-relaxed ${!isStudent
        ? "text-primary"
        : isCorrect
          ? "text-primary"
          : "text-destructive"
        }`}
    >
      {cleanStr}
    </span>
  );
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
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "submitted" | "not_submitted" | "debt">("all");

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

  const handleExportExcel = () => {
    const submittedCount = studentsResults.filter((s) => s.hasSubmitted).length;
    const avgScoreVal =
      submittedCount > 0
        ? (studentsResults.filter((s) => s.hasSubmitted).reduce((sum, s) => sum + s.score, 0) / submittedCount).toFixed(1)
        : "0";

    // Sheet 1: Results and grades
    const resultsSheetData: (string | number | boolean | null | undefined)[][] = [
      ["ВЕДОМОСТЬ РЕЗУЛЬТАТОВ КОМПЬЮТЕРНОГО ТЕСТИРОВАНИЯ"],
      ["Дисциплина:", test.subjectName, "Учебная группа:", test.groupName, "Преподаватель:", test.teacherName || "—"],
      ["Название теста:", test.title, "Дата выгрузки:", new Date().toLocaleDateString("ru-RU"), "Всего студентов:", studentsResults.length],
      ["Сдано работ:", `${submittedCount} из ${studentsResults.length}`, "Средний балл:", `${avgScoreVal} / ${test.totalMaxPoints}`, "Средний процент:", `${analytics?.avgPercent ?? 0}%`],
      [],
      [
        "№",
        "ФИО Студента",
        "Статус",
        "Набрано баллов",
        "Макс. балл",
        "Процент (%)",
        "Оценка (шкала)",
        "Переключений вкладок",
        "Дата сдачи",
        ...questions.map((_, idx) => `Вопрос #${idx + 1}`),
      ],
    ];

    studentsResults.forEach((s, idx) => {
      const grade = getGradeLabel(s.percent);
      const qAnswers = questions.map((q) => {
        if (!s.hasSubmitted) return "Не сдавал";
        const a = s.answersMap[q.id];
        if (!a) return "Нет ответа";
        if (a.isCorrect) return `Верно (+${a.pointsAwarded})`;
        if (a.isPartial) return `Частично (+${a.pointsAwarded})`;
        return "Ошибка (0)";
      });

      resultsSheetData.push([
        idx + 1,
        s.studentName,
        s.hasSubmitted ? "Сдано" : "Не сдавал",
        s.hasSubmitted ? s.score : 0,
        s.maxScore,
        s.hasSubmitted ? `${s.percent}%` : "0%",
        s.hasSubmitted ? grade.label : "—",
        s.tabSwitches || 0,
        s.submittedAt ? new Date(s.submittedAt).toLocaleString("ru-RU") : "-",
        ...qAnswers,
      ]);
    });

    // Sheet 2: Questions and Answer Key
    const keySheetData: (string | number | boolean | null | undefined)[][] = [
      ["СПЕЦИФИКАЦИЯ И КЛЮЧИ ПРАВИЛЬНЫХ ОТВЕТОВ К ТЕСТУ"],
      ["Тест:", test.title, "Дисциплина:", test.subjectName, "Группа:", test.groupName],
      ["Всего заданий:", questions.length, "Максимальная сумма баллов:", test.totalMaxPoints],
      [],
      [
        "№",
        "Текст вопроса",
        "Тип задания",
        "Эталонный правильный ответ",
        "Балл",
        "Верно решили (чел)",
        "Частично (чел)",
        "Неверно (чел)",
        "Процент решаемости (%)",
      ],
    ];

    questions.forEach((q, idx) => {
      const stat = questionStats.find((s) => s.questionId === q.id);
      const answerText = formatCorrectAnswerText(q.type, q.correctAnswer, q.options);
      const qTypeLabel =
        q.type === "MULTIPLE"
          ? "Множественный выбор"
          : q.type === "NUMERICAL"
            ? "Числовой ответ"
            : q.type === "TEXT"
              ? "Текстовый ответ"
              : q.type === "ORDERING"
                ? "Упорядочивание"
                : q.type === "MATCHING"
                  ? "Сопоставление"
                  : "Одиночный выбор";

      keySheetData.push([
        idx + 1,
        q.questionText,
        qTypeLabel,
        answerText,
        q.points,
        stat ? stat.fullCorrectCount : "—",
        stat ? stat.partialCount : "—",
        stat ? stat.wrongCount : "—",
        stat ? `${stat.accuracyPercent}%` : "—",
      ]);
    });

    const safeTitle = test.title.replace(/[\s\/:*?"<>|]+/g, "_");
    const safeGroup = test.groupName.replace(/[\s\/:*?"<>|]+/g, "_");

    exportMultiSheetExcel(
      [
        { name: "Ведомость результатов", data: resultsSheetData },
        { name: "Ключи теста и статистика", data: keySheetData },
      ],
      `Ведомость_${safeTitle}_${safeGroup}.xlsx`
    );

    toast.add({
      title: "Ведомость выгружена в Excel",
      description: "Файл содержит 2 листа: результаты студентов и ключ правильных ответов",
      type: "success",
    });
  };

  const handleExportDocx = async () => {
    try {
      await exportAcademicStatementDocx({
        testTitle: test.title,
        groupName: test.groupName,
        subjectName: test.subjectName,
        specialtyName: test.specialtyName,
        teacherName: test.teacherName,
        academicYear: test.academicYear,
        students: studentsResults.map((s) => ({
          studentName: s.studentName,
          hasSubmitted: s.hasSubmitted,
          percent: s.percent,
          score: s.score,
          maxScore: s.maxScore,
        })),
      });
      toast.add({
        title: "Ведомость Word сформирована",
        description: "Файл .docx скачан на ваше устройство",
        type: "success",
      });
    } catch {
      toast.add({
        title: "Ошибка формирования Word документа",
        type: "error",
      });
    }
  };

  const submittedCount = studentsResults.filter((s) => s.hasSubmitted).length;
  const notSubmittedCount = studentsResults.length - submittedCount;
  const debtCount = studentsResults.filter((s) => s.hasSubmitted && s.percent < 60).length;

  const filteredStudents = studentsResults.filter((s) => {
    const matchesSearch = s.studentName.toLowerCase().includes(searchQuery.toLowerCase().trim());
    if (!matchesSearch) return false;
    if (statusFilter === "submitted") return s.hasSubmitted;
    if (statusFilter === "not_submitted") return !s.hasSubmitted;
    if (statusFilter === "debt") return s.hasSubmitted && s.percent < 60;
    return true;
  });

  const questionAccuracyMap = React.useMemo(() => {
    const map: Record<string, { percent: number; correct: number; partial: number; wrong: number }> = {};
    questions.forEach((q) => {
      const fromStat = questionStats.find((qs) => qs.questionId === q.id);
      if (fromStat) {
        map[q.id] = {
          percent: fromStat.accuracyPercent,
          correct: fromStat.fullCorrectCount,
          partial: fromStat.partialCount,
          wrong: fromStat.wrongCount,
        };
        return;
      }
      const submitted = studentsResults.filter((s) => s.hasSubmitted);
      let correct = 0;
      let partial = 0;
      let wrong = 0;
      submitted.forEach((s) => {
        const a = s.answersMap[q.id];
        if (a?.isCorrect) correct++;
        else if (a?.isPartial) partial++;
        else wrong++;
      });
      const percent = submitted.length > 0
        ? Math.round(((correct + partial * 0.5) / submitted.length) * 100)
        : 0;
      map[q.id] = { percent, correct, partial, wrong };
    });
    return map;
  }, [questions, questionStats, studentsResults]);

  const academicAnalytics = React.useMemo(() => {
    const submitted = studentsResults.filter((s) => s.hasSubmitted);
    const total = submitted.length;
    if (total === 0) {
      return {
        grades: [
          { grade: 5, label: "5 (Отлично)", count: 0, percent: 0, range: "85–100%", fill: "var(--chart-1)" },
          { grade: 4, label: "4 (Хорошо)", count: 0, percent: 0, range: "70–84%", fill: "var(--chart-2)" },
          { grade: 3, label: "3 (Удовл.)", count: 0, percent: 0, range: "50–69%", fill: "var(--chart-3)" },
          { grade: 2, label: "2 (Неуд.)", count: 0, percent: 0, range: "< 50%", fill: "var(--chart-5)" },
        ],
        qualityPercent: 0,
        passPercent: 0,
        honestCount: 0,
        honestPercent: 100,
        suspiciousStudents: [] as StudentResultDTO[],
        riskStudents: [] as StudentResultDTO[],
        anomalies: [] as Array<{
          questionNumber: number;
          questionText: string;
          accuracyPercent: number;
          type: "critical" | "easy";
          title: string;
          message: string;
        }>,
      };
    }

    let g5 = 0, g4 = 0, g3 = 0, g2 = 0;
    let honest = 0;
    const suspicious: StudentResultDTO[] = [];
    const risk: StudentResultDTO[] = [];

    submitted.forEach((s) => {
      const g = getGradeLabel(s.percent).grade;
      if (g === 5) g5++;
      else if (g === 4) g4++;
      else if (g === 3) g3++;
      else g2++;

      if (!s.tabSwitches || s.tabSwitches === 0) {
        honest++;
      } else if (s.tabSwitches >= 2) {
        suspicious.push(s);
      }

      if (s.percent < 60) {
        risk.push(s);
      }
    });

    suspicious.sort((a, b) => (b.tabSwitches || 0) - (a.tabSwitches || 0));
    risk.sort((a, b) => a.percent - b.percent);

    const qualityPercent = Math.round(((g5 + g4) / total) * 100);
    const passPercent = Math.round(((total - g2) / total) * 100);
    const honestPercent = Math.round((honest / total) * 100);

    const grades = [
      { grade: 5, label: "5 (Отлично)", count: g5, percent: Math.round((g5 / total) * 100), range: "85–100%", fill: "var(--chart-1)" },
      { grade: 4, label: "4 (Хорошо)", count: g4, percent: Math.round((g4 / total) * 100), range: "70–84%", fill: "var(--chart-2)" },
      { grade: 3, label: "3 (Удовл.)", count: g3, percent: Math.round((g3 / total) * 100), range: "50–69%", fill: "var(--chart-3)" },
      { grade: 2, label: "2 (Неуд.)", count: g2, percent: Math.round((g2 / total) * 100), range: "< 50%", fill: "var(--chart-5)" },
    ];

    const anomalies: Array<{
      questionNumber: number;
      questionText: string;
      accuracyPercent: number;
      type: "critical" | "easy";
      title: string;
      message: string;
    }> = [];

    questions.forEach((q, idx) => {
      const acc = questionAccuracyMap[q.id]?.percent ?? 0;
      if (acc < 30 && total >= 3) {
        anomalies.push({
          questionNumber: idx + 1,
          questionText: q.questionText,
          accuracyPercent: acc,
          type: "critical",
          title: "Критически низкая решаемость (<30%)",
          message: "Большинство группы ошиблось. Возможно, вопрос содержит двусмысленную формулировку или неверный ключ ответа.",
        });
      } else if (acc === 100 && total >= 3) {
        anomalies.push({
          questionNumber: idx + 1,
          questionText: q.questionText,
          accuracyPercent: acc,
          type: "easy",
          title: "100% верных ответов (Базовый вопрос)",
          message: "Все студенты ответили верно. Вопрос подтверждает базовое понимание, но не дифференцирует уровень знаний.",
        });
      }
    });

    // Sort: critical issues at top, then question number
    anomalies.sort((a, b) => {
      if (a.type === "critical" && b.type !== "critical") return -1;
      if (a.type !== "critical" && b.type === "critical") return 1;
      return a.questionNumber - b.questionNumber;
    });

    return {
      grades,
      qualityPercent,
      passPercent,
      honestCount: honest,
      honestPercent,
      suspiciousStudents: suspicious,
      riskStudents: risk,
      anomalies,
    };
  }, [studentsResults, questions, questionAccuracyMap]);

  return (
    <TooltipProvider>
      <div className="space-y-4 w-full max-w-full min-w-0 pb-10">
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
              <span className="text-muted-foreground/40">•</span>
              <Badge variant="outline" className="text-[10px] gap-1 font-medium border-primary/30 text-primary bg-primary/5">
                <Building2 className="h-3 w-3" /> {test.groupName}
              </Badge>
              <Badge variant="secondary" className="text-[10px] font-normal">
                {test.subjectName}
              </Badge>
            </div>

            <h1 className="text-base font-bold text-foreground tracking-tight">
              Результаты теста: {test.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
              {test.teacherName && (
                <>
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3 text-muted-foreground shrink-0" /> {test.teacherName}
                  </span>
                  <span>•</span>
                </>
              )}
              <span className="flex items-center gap-1">
                Макс. балл: <strong className="text-foreground">{test.totalMaxPoints} б.</strong>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-muted-foreground shrink-0" />{" "}
                {test.timeLimit ? `${test.timeLimit} мин.` : "Без ограничения времени"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-center flex-wrap">
            <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("matrix")}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${activeTab === "matrix"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                Матрица
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("analytics")}
                className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1.5 ${activeTab === "analytics"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                <BarChart3 className="h-3 w-3 text-primary" />
                Аналитика
              </button>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    size="xs"
                    variant="default"
                    className="h-8 text-xs gap-1.5 font-medium bg-primary text-primary-foreground shadow-xs hover:bg-primary/90"
                  />
                }
              >
                <Download className="h-3.5 w-3.5" />
                <span>Экспорт ведомости</span>
                <ChevronDown className="h-3 w-3 opacity-70" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="text-xs p-1 min-w-[210px]">
                <DropdownMenuItem onClick={() => setReportDialogOpen(true)} className="cursor-pointer">
                  <Printer className="h-3.5 w-3.5 mr-2 text-primary" />
                  <span>Ведомость PDF (печать)</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportDocx} className="cursor-pointer">
                  <FileText className="h-3.5 w-3.5 mr-2 text-primary" />
                  <span>Ведомость Word (.docx)</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportExcel} className="cursor-pointer">
                  <Download className="h-3.5 w-3.5 mr-2 text-primary" />
                  <span>Таблица Excel (.xlsx)</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              size="xs"
              variant="outline"
              onClick={handleRefresh}
              disabled={isPending}
              className="h-8 text-xs gap-1.5 font-medium text-muted-foreground hover:text-foreground"
              title="Обновить результаты"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Обновить</span>
            </Button>
          </div>
        </div>

        {/* TAB 1: Analytics Charts & Questions Breakdown View */}
        {activeTab === "analytics" && (
          <div className="space-y-4">
            {/* Top Row: Academic Grades & Integrity Monitoring */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Card 1: Academic Grades 5/4/3/2 */}
              <Card className="p-4 bg-card border shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <GraduationCap className="h-4 w-4 text-primary" /> Академическая успеваемость (Оценки)
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Распределение по 5-балльной академической шкале
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">
                      Качество: {academicAnalytics.qualityPercent}%
                    </Badge>
                    <Badge variant="secondary" className="text-[10px]">
                      Успеваемость: {academicAnalytics.passPercent}%
                    </Badge>
                  </div>
                </div>

                {/* 4 Grade Segment Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {academicAnalytics.grades.map((g) => (
                    <div key={g.grade} className="p-2.5 rounded-lg border bg-muted/20 space-y-1 text-center">
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span className="font-semibold text-foreground">{g.label}</span>
                        <span>{g.range}</span>
                      </div>
                      <div className="text-base font-bold text-foreground font-mono">
                        {g.count} <span className="text-[10px] font-normal text-muted-foreground">({g.percent}%)</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${g.percent}%`, backgroundColor: g.fill }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-2 rounded-lg bg-muted/30 border border-border/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
                  <span>Качество знаний («4» и «5»): <strong className="text-foreground">{academicAnalytics.qualityPercent}%</strong></span>
                  <span>Абсолютная успеваемость: <strong className="text-foreground">{academicAnalytics.passPercent}%</strong></span>
                </div>
              </Card>

              {/* Card 2: Integrity & Proctoring (Tab Switches) */}
              <Card className="p-4 bg-card border shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-primary" /> Академическая честность (Прокторинг)
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Мониторинг переключений вкладок и окон браузера
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] gap-1",
                      academicAnalytics.honestPercent >= 80
                        ? "bg-primary/5 text-primary border-primary/20"
                        : "bg-destructive/10 text-destructive border-destructive/20"
                    )}
                  >
                    Честность: {academicAnalytics.honestPercent}%
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-lg border bg-muted/20 text-center space-y-0.5">
                    <span className="text-[10px] text-muted-foreground">Сдали без переключений</span>
                    <div className="text-base font-bold font-mono text-primary">
                      {academicAnalytics.honestCount} <span className="text-[10px] font-normal text-muted-foreground">из {submittedCount}</span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg border bg-muted/20 text-center space-y-0.5">
                    <span className="text-[10px] text-muted-foreground">С переключениями (≥2)</span>
                    <div className="text-base font-bold font-mono text-destructive">
                      {academicAnalytics.suspiciousStudents.length} <span className="text-[10px] font-normal text-muted-foreground">студ.</span>
                    </div>
                  </div>
                </div>

                {academicAnalytics.suspiciousStudents.length > 0 ? (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-semibold text-muted-foreground block">
                      Студенты с частым уходом со страницы теста:
                    </span>
                    <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                      {academicAnalytics.suspiciousStudents.map((s) => (
                        <div
                          key={s.studentId}
                          className="flex items-center justify-between p-1.5 rounded-md bg-muted/30 border text-[11px]"
                        >
                          <span className="font-medium text-foreground truncate max-w-[180px]">
                            {s.studentName}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Badge variant="destructive" className="h-4 px-1.5 text-[9px] gap-0.5 font-mono">
                              <ShieldAlert className="h-2.5 w-2.5" /> {s.tabSwitches} перекл.
                            </Badge>
                            <span className="font-mono text-[10px] text-muted-foreground">
                              {s.percent}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-center text-xs text-primary flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" /> Нарушений не зафиксировано: все студенты не покидали тест
                  </div>
                )}
              </Card>
            </div>

            {/* Middle Row: Question Audit & Risk Zone */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
              {/* Question Anomalies & Recommendations */}
              <Card className="p-4 bg-card border shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <AlertCircle className="h-4 w-4 text-primary" /> Рекомендации составителю теста
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Автоматический анализ вопросов на возможные ошибки или дисбаланс
                    </p>
                  </div>
                  {academicAnalytics.anomalies.length > 0 && (
                    <Badge variant="outline" className="text-[10px] text-primary border-primary/20 bg-primary/5 font-medium">
                      {academicAnalytics.anomalies.length} замеч.
                    </Badge>
                  )}
                </div>

                {academicAnalytics.anomalies.length > 0 ? (
                  <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1.5">
                    {academicAnalytics.anomalies.map((anom, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "p-2.5 rounded-lg border text-xs space-y-1",
                          anom.type === "critical"
                            ? "bg-destructive/5 border-destructive/20 text-foreground"
                            : "bg-muted/30 border-border/80 text-foreground"
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 font-semibold text-xs">
                            {anom.type === "critical" ? (
                              <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                            )}
                            <span className={anom.type === "critical" ? "text-destructive" : "text-foreground"}>
                              {anom.title}
                            </span>
                          </div>
                          <Badge
                            variant={anom.type === "critical" ? "destructive" : "secondary"}
                            className="text-[9px] font-mono h-4 px-1"
                          >
                            Вопрос #{anom.questionNumber} ({anom.accuracyPercent}%)
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground italic">
                          «{anom.questionText}»
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {anom.message}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-lg border bg-muted/20 text-center text-xs text-muted-foreground">
                    Вопросы теста хорошо сбалансированы. Аномалий сложности не обнаружено.
                  </div>
                )}
              </Card>

              {/* Risk Zone & Debtors */}
              <Card className="p-4 bg-card border shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4 text-destructive" /> Зона риска и должники (&lt;60%)
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Студенты, не набравшие проходной порог
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] text-destructive border-destructive/20 bg-destructive/5 font-medium">
                    {academicAnalytics.riskStudents.length} студ.
                  </Badge>
                </div>

                {academicAnalytics.riskStudents.length > 0 ? (
                  <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                    {academicAnalytics.riskStudents.map((s) => (
                      <div
                        key={s.studentId}
                        className="flex items-center justify-between p-2 rounded-lg border bg-muted/20 text-xs"
                      >
                        <div className="space-y-0.5 truncate mr-2">
                          <span className="font-semibold text-foreground block truncate">
                            {s.studentName}
                          </span>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <span>Оценка: <strong className="text-destructive font-mono">{s.percent}%</strong></span>
                            <span>•</span>
                            <span>Балл: <strong className="font-mono text-foreground">{s.score.toFixed(1)} б.</strong></span>
                          </div>
                        </div>
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() =>
                            setResetTarget({
                              submissionId: s.submissionId!,
                              studentName: s.studentName,
                            })
                          }
                          className="h-6 px-2 text-[10px] gap-1 shrink-0 hover:border-primary hover:text-primary"
                        >
                          <RotateCcw className="h-3 w-3" /> Пересдача
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-lg border bg-primary/5 text-center text-xs text-primary flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" /> Все сдавшие студенты успешно преодолели проходной порог!
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}

        {/* TAB 2: Matrix Results Table */}
        {activeTab === "matrix" && (
          <div className="border rounded-xl bg-card shadow-xs overflow-hidden w-full max-w-full min-w-0">
            {/* Filter and Search Bar */}
            <div className="p-3 border-b bg-muted/20 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 max-w-xl flex-wrap sm:flex-nowrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Поиск по ФИО студента..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 pl-8 text-xs bg-background"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground text-xs"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>

                {/* Filter Pills */}
                <div className="flex items-center p-0.5 bg-muted/60 rounded-lg border text-xs shrink-0">
                  <button
                    type="button"
                    onClick={() => setStatusFilter("all")}
                    className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${statusFilter === "all" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    Все ({studentsResults.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter("submitted")}
                    className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${statusFilter === "submitted" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    Сдали ({submittedCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter("not_submitted")}
                    className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${statusFilter === "not_submitted" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    Не сдали ({notSubmittedCount})
                  </button>
                  {debtCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setStatusFilter("debt")}
                      className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${statusFilter === "debt" ? "bg-background text-destructive shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                      Долги ({debtCount})
                    </button>
                  )}
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-2 text-[11px] flex-wrap shrink-0">
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
              </div>
            </div>

            <div className="overflow-x-auto w-full max-w-full relative">
              <table className="w-full text-xs text-left border-separate border-spacing-0 min-w-max">
                <thead>
                  <tr className="bg-muted/50 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    <th className="py-2.5 px-3 sticky left-0 z-20 bg-muted/95 border-b border-r border-border shadow-[2px_0_4px_rgba(0,0,0,0.05)] min-w-[260px] sm:min-w-[300px] max-w-[320px]">
                      № / ФИО / % / Баллы
                    </th>

                    {questions.map((q, qIdx) => {
                      const headerAlign = qIdx <= 1 ? "start" : qIdx >= questions.length - 2 ? "end" : "center";
                      return (
                        <th
                          key={q.id}
                          className="py-2.5 px-2 text-center border-b border-r border-border/60 min-w-[46px] max-w-[56px]"
                        >
                          <Tooltip>
                            <TooltipTrigger>
                              <div className="inline-flex items-center gap-0.5 cursor-help hover:text-primary transition-colors">
                                <FileText className="h-3.5 w-3.5 shrink-0" />
                                <span>{qIdx + 1}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" align={headerAlign} showArrow={false} className="max-w-xs text-xs p-2.5 bg-popover text-popover-foreground border border-border shadow-md">
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
                <tbody>
                  {filteredStudents.map((student, sIdx) => {
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
                          className={`py-2 px-3 sticky left-0 z-10 bg-card border-b border-r border-border border-l-4 ${leftBorderStyle} shadow-[2px_0_4px_rgba(0,0,0,0.05)] min-w-[260px] sm:min-w-[300px] max-w-[320px]`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <span className="font-mono text-[11px] text-muted-foreground w-4 shrink-0 text-left">
                                {sIdx + 1}.
                              </span>
                              <div className="space-y-0.5 truncate min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="font-semibold text-foreground text-xs block truncate">
                                    {student.studentName}
                                  </span>
                                  {student.tabSwitches && student.tabSwitches > 0 ? (
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <Badge variant="destructive" className="h-4 px-1 text-[9px] gap-0.5 font-mono shrink-0">
                                          <ShieldAlert className="h-2.5 w-2.5" /> {student.tabSwitches}
                                        </Badge>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" showArrow={false} className="text-xs">
                                        Студент переключал вкладку {student.tabSwitches} раз(а)
                                      </TooltipContent>
                                    </Tooltip>
                                  ) : null}
                                </div>
                                {!student.hasSubmitted && (
                                  <span className="text-[10px] text-muted-foreground italic block">
                                    Не проходил тест
                                  </span>
                                )}
                              </div>
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
                                className="py-2 px-1 text-center border-b border-r border-border/60 text-muted-foreground/40 font-mono text-[11px]"
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
                              className={`py-1.5 px-1 text-center border-b border-r border-border/60 transition-colors ${isCorrect
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
                                  className="max-w-none w-80 sm:w-96 p-3 space-y-2 bg-popover text-popover-foreground border border-border shadow-lg rounded-xl text-xs z-50 block"
                                >
                                  <div className="flex items-center justify-between gap-2 border-b border-border/70 pb-2">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <span className="font-bold text-foreground text-xs shrink-0">
                                        Вопрос #{qIdx + 1}
                                      </span>
                                      <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                                        ({q.points} б.)
                                      </span>
                                      <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/60 truncate">
                                        {QUESTION_TYPE_LABELS[q.type || "SINGLE"] || q.type}
                                      </span>
                                    </div>
                                    <span
                                      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border shrink-0 ${isCorrect
                                        ? "bg-primary/10 text-primary border-primary/30"
                                        : isPartial
                                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                                          : "bg-destructive/10 text-destructive border-destructive/30"
                                        }`}
                                    >
                                      {isCorrect ? (
                                        <>
                                          <Check className="h-3 w-3 stroke-[2.5]" /> Верно (+{ansData.pointsAwarded} б.)
                                        </>
                                      ) : isPartial ? (
                                        <>
                                          <Sparkles className="h-3 w-3" /> Частично (+{ansData.pointsAwarded} б.)
                                        </>
                                      ) : (
                                        <>
                                          <X className="h-3 w-3 stroke-[2.5]" /> Ошибка (0 б.)
                                        </>
                                      )}
                                    </span>
                                  </div>

                                  <div className="text-[11px] text-foreground leading-snug font-medium py-0.5 max-h-24 overflow-y-auto">
                                    {q.questionText}
                                  </div>

                                  <div className="space-y-2 pt-2 border-t border-border/70 text-[11px]">
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
                                        <User className="h-3 w-3 shrink-0" /> Ответ студента:
                                      </div>
                                      <div className="p-1.5 rounded-md border border-border/70 bg-muted/30">
                                        <AnswerDisplay
                                          rawAnswer={ansData.answer}
                                          correctAnswer={q.correctAnswer}
                                          type={q.type}
                                          isCorrect={isCorrect}
                                          isStudent={true}
                                        />
                                      </div>
                                    </div>

                                    <div className="space-y-1">
                                      <div className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
                                        <CheckCircle2 className="h-3 w-3 text-primary shrink-0" /> Верный ответ:
                                      </div>
                                      <div className="p-1.5 rounded-md border border-primary/20 bg-primary/5">
                                        <AnswerDisplay
                                          rawAnswer={q.correctAnswer}
                                          correctAnswer={q.correctAnswer}
                                          type={q.type}
                                          isCorrect={true}
                                          isStudent={false}
                                        />
                                      </div>
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
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td
                        colSpan={questions.length + 1}
                        className="py-12 px-4 text-center text-xs text-muted-foreground"
                      >
                        Студенты не найдены по заданным критериям поиска
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-muted/40 border-t border-border">
                  <tr>
                    <td className="sticky left-0 bg-background/95 backdrop-blur z-20 px-3 py-2 border-r border-border shadow-[2px_0_4px_rgba(0,0,0,0.05)] text-xs font-semibold text-muted-foreground">
                      Верно ответили (%):
                    </td>
                    {questions.map((q, idx) => {
                      const rate = questionAccuracyMap[q.id]?.percent ?? 0;
                      return (
                        <td
                          key={q.id}
                          className="py-1.5 px-1 text-center border-r border-border/60 text-[10px]"
                        >
                          <Tooltip>
                            <TooltipTrigger>
                              <span
                                className={`inline-block font-mono font-semibold px-1 py-0.5 rounded cursor-help ${
                                  rate >= 70
                                    ? "text-primary bg-primary/10"
                                    : rate >= 40
                                      ? "text-muted-foreground bg-muted"
                                      : "text-destructive bg-destructive/10"
                                }`}
                              >
                                {rate}%
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" showArrow={false} className="text-xs p-2">
                              <p className="font-semibold">Вопрос #{idx + 1}</p>
                              <p className="text-[11px] text-muted-foreground">
                                Правильно ответили: {rate}%
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </td>
                      );
                    })}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

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
              <AlertDialogCancel size="xs" disabled={isPending}>
                Отмена
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmReset}
                size="xs"
                disabled={isPending}
              >
                Разрешить
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Academic Protocol & Print Dialog */}
        <TestReportDialog
          open={reportDialogOpen}
          onOpenChange={setReportDialogOpen}
          test={test}
          questions={questions}
          studentsResults={studentsResults}
          questionStats={questionStats}
        />
      </div>
    </TooltipProvider>
  );
}

