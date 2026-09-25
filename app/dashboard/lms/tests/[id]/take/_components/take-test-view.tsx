"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
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
  Clock,
  Send,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Check,
  Trophy,
  Eye,
  ChevronUp,
  ChevronDown,
  ListOrdered,
  FormInput,
  ShieldAlert,
  Hash,
  Layers,
  Bookmark,
  ListFilter,
  Info,
} from "lucide-react";
import { submitTestAnswersAction } from "@/app/dashboard/lms/actions";

export type QuestionType =
  | "SINGLE"
  | "MULTIPLE"
  | "TEXT"
  | "TRUE_FALSE"
  | "ORDERING"
  | "BLANKS"
  | "CODE"
  | "MATCHING"
  | "NUMERICAL";

export type TakeQuestionOption = string | { left: string; right: string };

interface QuestionItem {
  id: string;
  type: QuestionType;
  questionText: string;
  options: TakeQuestionOption[];
  points: number;
  correctAnswer?: string;
  explanation?: string;
}

interface TestTakeData {
  id: string;
  title: string;
  description: string;
  timeLimit?: number | null;
  subjectName: string;
  teacherName: string;
  userRole?: string;
  questions: QuestionItem[];
  userSubmission?: {
    id: string;
    score: number;
    maxScore: number;
    submittedAt: string;
    answers?: Record<string, string>;
  } | null;
}

interface TakeTestViewProps {
  test: TestTakeData;
}

const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];

function parseQuestionCode(fullText: string): { title: string; code?: string } {
  if (!fullText) return { title: "" };
  const match = fullText.match(/^([\s\S]*?)\n```(?:[a-z]*)\n([\s\S]*?)\n```$/);
  if (match) {
    return { title: match[1].trim(), code: match[2].trim() };
  }
  return { title: fullText };
}

export function TakeTestView({ test }: TakeTestViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isTeacherOrAdmin = test.userRole === "ADMIN" || test.userRole === "TEACHER";

  const START_KEY = `test_start_${test.id}`;
  const ANSWERS_KEY = `test_answers_${test.id}`;
  const SWITCH_KEY = `test_switches_${test.id}`;
  const FLAGGED_KEY = `test_flagged_${test.id}`;

  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [viewMode, setViewMode] = useState<"focus" | "list">("focus");
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  const [studentAnswers, setStudentAnswers] = useState<Record<string, string>>(() => {
    return test.userSubmission?.answers || {};
  });

  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(FLAGGED_KEY);
        return stored ? JSON.parse(stored) : {};
      } catch {
        return {};
      }
    }
    return {};
  });

  const [tabSwitches, setTabSwitches] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(SWITCH_KEY);
      return stored ? Number(stored) : 0;
    }
    return 0;
  });

  const [testResult, setTestResult] = useState<{ score: number; maxScore: number } | null>(
    test.userSubmission
      ? { score: test.userSubmission.score, maxScore: test.userSubmission.maxScore }
      : null
  );

  const initialSeconds = test.timeLimit && !isTeacherOrAdmin ? test.timeLimit * 60 : null;
  const [secondsLeft, setSecondsLeft] = useState<number | null>(initialSeconds);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isWindowBlurred, setIsWindowBlurred] = useState(false);

  // Tab visibility & Window Focus / Anti-Screenshot Detection
  useEffect(() => {
    if (isTeacherOrAdmin || testResult || !isInitialized) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsWindowBlurred(true);
        setTabSwitches((prev) => {
          const next = prev + 1;
          localStorage.setItem(SWITCH_KEY, String(next));
          return next;
        });
      }
    };

    const handleBlur = () => {
      setIsWindowBlurred(true);
    };

    const handleFocus = () => {
      setIsWindowBlurred(false);
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      toast.add({ title: "Контекстное меню заблокировано", type: "warning" });
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      toast.add({ title: "Копирование материалов теста запрещено", type: "error" });
    };

    const handlePaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (!target || (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA")) {
        e.preventDefault();
        toast.add({ title: "Вставка заблокирована", type: "warning" });
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // PrintScreen key detection
      if (e.key === "PrintScreen") {
        e.preventDefault();
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText("");
        }
        setIsWindowBlurred(true);
        toast.add({ title: "Скриншот экрана заблокирован", type: "error" });
        return;
      }

      // Block Ctrl+P / Cmd+P, Ctrl+S / Cmd+S, Ctrl+U / Cmd+U, Ctrl+C / Cmd+C (outside inputs), F12
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA");

      if (
        (isCtrlOrCmd && (e.key === "p" || e.key === "P" || e.key === "s" || e.key === "S" || e.key === "u" || e.key === "U")) ||
        e.key === "F12"
      ) {
        e.preventDefault();
        toast.add({ title: "Действие заблокировано в целях безопасности", type: "warning" });
      } else if (isCtrlOrCmd && (e.key === "c" || e.key === "C" || e.key === "a" || e.key === "A") && !isInput) {
        e.preventDefault();
        toast.add({ title: "Копирование запрещено", type: "error" });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("cut", handleCopy);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("cut", handleCopy);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isTeacherOrAdmin, testResult, isInitialized, SWITCH_KEY]);

  // Prevent accidental unload
  useEffect(() => {
    if (isTeacherOrAdmin || testResult || !isInitialized) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Вы уверены, что хотите покинуть страницу? Прогресс теста может быть не сохранен.";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isTeacherOrAdmin, testResult, isInitialized]);

  // Restore on mount
  useEffect(() => {
    if (typeof window === "undefined" || isTeacherOrAdmin) {
      setIsInitialized(true);
      return;
    }

    if (test.userSubmission) {
      localStorage.removeItem(START_KEY);
      localStorage.removeItem(ANSWERS_KEY);
      localStorage.removeItem(SWITCH_KEY);
      localStorage.removeItem(FLAGGED_KEY);
      if (test.userSubmission.answers) {
        setStudentAnswers(test.userSubmission.answers);
      }
      setIsInitialized(true);
      return;
    }

    // Restore answers
    const storedAnswersStr = localStorage.getItem(ANSWERS_KEY);
    if (storedAnswersStr) {
      try {
        setStudentAnswers(JSON.parse(storedAnswersStr));
      } catch {}
    }

    // Restore timer
    if (test.timeLimit) {
      let startTime = localStorage.getItem(START_KEY);
      const now = Date.now();
      if (!startTime) {
        startTime = now.toString();
        localStorage.setItem(START_KEY, startTime);
      }

      const elapsedSec = Math.floor((now - Number(startTime)) / 1000);
      const totalSec = test.timeLimit * 60;
      const remainingSec = Math.max(0, totalSec - elapsedSec);
      setSecondsLeft(remainingSec);

      if (remainingSec <= 0 && !testResult) {
        handleSubmit();
      }
    }

    setIsInitialized(true);
  }, [test.id]);

  // Persist answers
  useEffect(() => {
    if (!isInitialized || testResult || isTeacherOrAdmin || typeof window === "undefined") return;
    localStorage.setItem(ANSWERS_KEY, JSON.stringify(studentAnswers));
  }, [studentAnswers, isInitialized, testResult, isTeacherOrAdmin, ANSWERS_KEY]);

  // Persist flagged
  useEffect(() => {
    if (!isInitialized || testResult || isTeacherOrAdmin || typeof window === "undefined") return;
    localStorage.setItem(FLAGGED_KEY, JSON.stringify(flaggedQuestions));
  }, [flaggedQuestions, isInitialized, testResult, isTeacherOrAdmin, FLAGGED_KEY]);

  // Timer countdown
  useEffect(() => {
    if (!isInitialized || testResult || secondsLeft === null || isTeacherOrAdmin) return;
    if (secondsLeft <= 0) {
      handleSubmit();
      return;
    }
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev !== null && prev > 0) {
          if (prev === 60) {
            toast.add({ title: "Внимание: осталась 1 минута до завершения теста!", type: "error" });
          }
          return prev - 1;
        }
        return 0;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft, isInitialized, testResult, isTeacherOrAdmin]);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleFlag = (questionId: string) => {
    setFlaggedQuestions((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const handleOrderingMove = (questionId: string, options: string[], fromIdx: number, toIdx: number) => {
    if (testResult || isPending || test.userSubmission || isTeacherOrAdmin) return;
    if (fromIdx === toIdx || fromIdx < 0 || toIdx < 0) return;
    const currentAnswerStr = studentAnswers[questionId];
    let currentList: string[] = [];
    try {
      currentList = currentAnswerStr ? JSON.parse(currentAnswerStr) : [...options];
    } catch {
      currentList = [...options];
    }
    const updated = [...currentList];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);
    setStudentAnswers((prev) => ({
      ...prev,
      [questionId]: JSON.stringify(updated),
    }));
  };

  const handleMatchingChange = (questionId: string, leftKey: string, rightVal: string) => {
    if (testResult || isPending || test.userSubmission || isTeacherOrAdmin) return;
    let currentMap: Record<string, string> = {};
    try {
      currentMap = studentAnswers[questionId] ? JSON.parse(studentAnswers[questionId]) : {};
    } catch {
      currentMap = {};
    }
    const updated = { ...currentMap, [leftKey]: rightVal };
    setStudentAnswers((prev) => ({
      ...prev,
      [questionId]: JSON.stringify(updated),
    }));
  };

  const handleBlankChange = (questionId: string, optionsCount: number, blankIdx: number, val: string) => {
    if (testResult || isPending || test.userSubmission || isTeacherOrAdmin) return;
    const currentAnswerStr = studentAnswers[questionId];
    let currentList: string[] = [];
    try {
      currentList = currentAnswerStr ? JSON.parse(currentAnswerStr) : Array(optionsCount).fill("");
    } catch {
      currentList = Array(optionsCount).fill("");
    }
    while (currentList.length < optionsCount) {
      currentList.push("");
    }
    currentList[blankIdx] = val;
    setStudentAnswers((prev) => ({
      ...prev,
      [questionId]: JSON.stringify(currentList),
    }));
  };

  const handleOptionSelect = (questionId: string, option: string, type: string) => {
    if (testResult || isPending || test.userSubmission || isTeacherOrAdmin) return;

    if (type === "MULTIPLE") {
      try {
        const currentArr: string[] = studentAnswers[questionId]
          ? JSON.parse(studentAnswers[questionId])
          : [];
        const exists = currentArr.includes(option);
        const updated = exists ? currentArr.filter((o) => o !== option) : [...currentArr, option];
        setStudentAnswers((prev) => ({
          ...prev,
          [questionId]: JSON.stringify(updated),
        }));
      } catch {
        setStudentAnswers((prev) => ({
          ...prev,
          [questionId]: JSON.stringify([option]),
        }));
      }
    } else {
      setStudentAnswers((prev) => ({
        ...prev,
        [questionId]: option,
      }));
    }
  };

  const isQuestionAnswered = (q: QuestionItem): boolean => {
    const ans = studentAnswers[q.id];
    if (!ans) return false;
    if (q.type === "MULTIPLE") {
      try {
        const parsed = JSON.parse(ans);
        return Array.isArray(parsed) && parsed.length > 0;
      } catch {
        return false;
      }
    }
    if (q.type === "ORDERING") {
      return Boolean(ans);
    }
    if (q.type === "BLANKS") {
      try {
        const parsed = JSON.parse(ans);
        return Array.isArray(parsed) && parsed.some((v) => String(v).trim().length > 0);
      } catch {
        return false;
      }
    }
    if (q.type === "MATCHING") {
      try {
        const parsed = JSON.parse(ans);
        return typeof parsed === "object" && parsed !== null && Object.keys(parsed).length > 0;
      } catch {
        return false;
      }
    }
    return String(ans).trim().length > 0;
  };

  const handleSubmit = async () => {
    if (testResult || isPending) return;
    setIsSubmitModalOpen(false);

    startTransition(async () => {
      const res = await submitTestAnswersAction({
        testId: test.id,
        answers: studentAnswers,
        tabSwitches,
      });

      if (res.success && res.score !== undefined && res.maxScore !== undefined) {
        setTestResult({ score: res.score, maxScore: res.maxScore });
        localStorage.removeItem(START_KEY);
        localStorage.removeItem(ANSWERS_KEY);
        localStorage.removeItem(SWITCH_KEY);
        localStorage.removeItem(FLAGGED_KEY);
        toast.add({ title: "Тест успешно завершен!", type: "success" });
        router.refresh();
      } else {
        toast.add({ title: res.error || "Ошибка при отправке ответов", type: "error" });
      }
    });
  };

  const totalQuestions = test.questions.length;
  const answeredCount = test.questions.filter(isQuestionAnswered).length;
  const unansweredCount = totalQuestions - answeredCount;
  const flaggedCount = Object.values(flaggedQuestions).filter(Boolean).length;
  const totalSeconds = test.timeLimit ? test.timeLimit * 60 : 0;
  const timeProgress =
    totalSeconds > 0 && secondsLeft !== null
      ? Math.max(0, Math.min(100, Math.round((secondsLeft / totalSeconds) * 100)))
      : 100;

  const timerColorClass =
    timeProgress > 50
      ? "text-primary border-primary/30 bg-primary/10"
      : timeProgress > 20
        ? "text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10"
        : "text-destructive border-destructive/30 bg-destructive/10 animate-pulse";

  const totalMaxPoints = test.questions.reduce((sum, q) => sum + (q.points || 1), 0);
  const isSubmitted = Boolean(testResult || test.userSubmission);

  const currentQuestion = test.questions[activeQuestionIdx] || test.questions[0];

  const jumpToFirstUnanswered = () => {
    setIsSubmitModalOpen(false);
    const firstUnansweredIdx = test.questions.findIndex((q) => !isQuestionAnswered(q));
    if (firstUnansweredIdx !== -1) {
      setActiveQuestionIdx(firstUnansweredIdx);
      setViewMode("focus");
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (isSubmitted || isSubmitModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.tagName === "SELECT"
      ) {
        return;
      }

      if (e.key === "ArrowRight" && activeQuestionIdx < totalQuestions - 1) {
        setActiveQuestionIdx((prev) => prev + 1);
      } else if (e.key === "ArrowLeft" && activeQuestionIdx > 0) {
        setActiveQuestionIdx((prev) => prev - 1);
      } else if (e.key === "f" || e.key === "F" || e.key === "а" || e.key === "А") {
        if (currentQuestion) {
          toggleFlag(currentQuestion.id);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeQuestionIdx, totalQuestions, isSubmitted, isSubmitModalOpen, currentQuestion]);

  return (
    <div className={`space-y-4 w-full max-w-full min-w-0 pb-16 relative ${!isTeacherOrAdmin && !isSubmitted ? "select-none" : ""}`}>
      {/* Global Print Protection */}
      <style jsx global>{`
        @media print {
          body {
            display: none !important;
          }
        }
      `}</style>

      {/* Anti-Screenshot Privacy Shield Overlay */}
      {isWindowBlurred && !isTeacherOrAdmin && !isSubmitted && (
        <div
          onClick={() => setIsWindowBlurred(false)}
          className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex flex-col items-center justify-center gap-3 p-4 text-center cursor-pointer select-none animate-in fade-in duration-200"
        >
          <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
            <ShieldAlert className="h-6 w-6 stroke-[2]" />
          </div>
          <div className="space-y-1 max-w-sm">
            <h3 className="text-sm font-bold text-foreground">Защита содержимого теста</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Окно браузера потеряло фокус. Нажмите в любую точку экрана, чтобы продолжить выполнение теста.
            </p>
          </div>
          <Button
            size="xs"
            onClick={(e) => {
              e.stopPropagation();
              setIsWindowBlurred(false);
            }}
            className="mt-1 h-7 px-3 text-xs bg-primary text-primary-foreground font-medium"
          >
            Вернуться к тесту
          </Button>
        </div>
      )}

      {/* Subtle Anti-Photo Watermark */}
      {!isTeacherOrAdmin && !isSubmitted && (
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-[0.025] select-none flex flex-wrap gap-20 p-8 items-center justify-center text-foreground font-mono text-[11px] font-bold uppercase rotate-[-20deg]">
          {Array.from({ length: 24 }).map((_, i) => (
            <span key={i} className="whitespace-nowrap">
              Лицей LMS • ID: {test.id.slice(0, 8)} • {new Date().toLocaleDateString()}
            </span>
          ))}
        </div>
      )}

      {/* Top Header & Context Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3 rounded-xl border relative z-10">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <Link href="/dashboard/lms/tests">
              <Button
                size="xs"
                variant="ghost"
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> К тестам
              </Button>
            </Link>
            <span className="text-muted-foreground">•</span>
            <Badge variant="secondary" className="text-[10px] font-normal">
              {test.subjectName}
            </Badge>
            {isTeacherOrAdmin && (
              <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
                <Eye className="h-3 w-3 mr-1" /> Режим предпросмотра
              </Badge>
            )}
          </div>

          <h1 className="text-sm font-bold text-foreground tracking-tight flex items-center gap-2">
            {test.title}
          </h1>

          <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-muted-foreground">
            <span>Преподаватель: <strong className="text-foreground">{test.teacherName}</strong></span>
            <span>•</span>
            <span>Вопросов: <strong className="text-foreground">{totalQuestions}</strong></span>
            <span>•</span>
            <span>Всего баллов: <strong className="text-foreground">{totalMaxPoints}</strong></span>
          </div>
        </div>

        {/* Live Timer Widget (Students only) */}
        {!isTeacherOrAdmin && !isSubmitted && secondsLeft !== null && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="flex items-center gap-3 bg-card p-2 rounded-lg border self-start sm:self-center shrink-0 cursor-help transition-colors hover:bg-muted/30 text-left">
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                      Осталось времени
                    </span>
                  </div>
                  <div
                    className={`px-2.5 py-0.5 rounded-md font-mono text-xs font-bold border flex items-center gap-1.5 ${timerColorClass}`}
                  >
                    <Clock className="h-3.5 w-3.5" />
                    {formatTimer(secondsLeft)}
                  </div>
                </div>
                <div className="w-12 h-2 bg-muted rounded-full overflow-hidden border">
                  <div
                    className={`h-full transition-all duration-1000 ${
                      timeProgress > 50 ? "bg-primary" : timeProgress > 20 ? "bg-amber-500" : "bg-destructive"
                    }`}
                    style={{ width: `${timeProgress}%` }}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs text-xs p-2.5">
                <div className="font-semibold text-foreground mb-0.5 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-primary" /> Непрерывный отсчёт
                </div>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  Таймер работает в реальном времени. Закрытие вкладки или перезагрузка страницы не останавливают и не сбрасывают время.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Tab Switch Warning Banner */}
      {!isTeacherOrAdmin && !isSubmitted && tabSwitches > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-2.5 rounded-xl text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>
              Зафиксировано переключение на другие вкладки: <strong>{tabSwitches}</strong> раз(а).
            </span>
          </div>
          <span className="text-[10px] opacity-80">Данные сохраняются в ведомости</span>
        </div>
      )}

      {/* SUBMISSION RESULTS SCREEN */}
      {isSubmitted ? (
        <Card className="p-6 sm:p-7 space-y-6 text-center">
          <div className="flex flex-col items-center space-y-2">
            <div className="w-14 h-14 rounded-full bg-primary/15 text-primary flex items-center justify-center border border-primary/30">
              <Trophy className="h-7 w-7 stroke-[2.5]" />
            </div>
            <h2 className="text-base font-bold text-foreground">Тест успешно завершен!</h2>
            <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
              Ваши ответы зафиксированы и проверены автоматической системой лицея.
            </p>
          </div>

          {/* Score KPI Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-lg mx-auto">
            <div className="bg-muted/40 p-3 rounded-xl border text-left space-y-0.5">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Набрано баллов
              </span>
              <div className="text-lg font-bold text-foreground">
                {(testResult?.score ?? test.userSubmission?.score ?? 0).toFixed(1)}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  / {testResult?.maxScore ?? test.userSubmission?.maxScore ?? totalMaxPoints}
                </span>
              </div>
            </div>

            <div className="bg-muted/40 p-3 rounded-xl border text-left space-y-0.5">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Результат
              </span>
              <div className="text-lg font-bold text-primary">
                {Math.round(
                  ((testResult?.score ?? test.userSubmission?.score ?? 0) /
                    ((testResult?.maxScore ?? test.userSubmission?.maxScore ?? totalMaxPoints) || 1)) *
                    100
                )}
                %
              </div>
            </div>

            <div className="bg-muted/40 p-3 rounded-xl border text-left space-y-0.5 col-span-2 sm:col-span-1">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Вопросов
              </span>
              <div className="text-lg font-bold text-foreground">
                {totalQuestions}
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-center gap-3">
            <Link href="/dashboard/lms/tests">
              <Button size="xs" variant="outline" className="h-8 px-4 text-xs gap-1.5 font-medium">
                <ArrowLeft className="h-3.5 w-3.5" /> Вернуться к списку тестов
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        /* ACTIVE TEST TAKING WORKSPACE (2-COLUMN FOCUS LAYOUT) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start w-full max-w-full min-w-0">
          {/* LEFT COLUMN: ACTIVE QUESTION CARD */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-3 min-w-0">
            {/* Mode Switcher & Progress Summary */}
            <div className="flex items-center justify-between gap-2 bg-card p-2 rounded-xl border text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground font-medium">
                  Вопрос <strong className="text-foreground">{activeQuestionIdx + 1}</strong> из {totalQuestions}
                </span>
                <span className="text-muted-foreground">•</span>
                <span className="text-[11px] text-primary font-medium">
                  Отвечено: {answeredCount}/{totalQuestions}
                </span>
              </div>

              <div className="flex items-center bg-muted p-0.5 rounded-lg border text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode("focus")}
                  className={`px-2 py-0.5 rounded-md font-medium text-[11px] transition-all ${
                    viewMode === "focus"
                      ? "bg-card text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  По одному
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`px-2 py-0.5 rounded-md font-medium text-[11px] transition-all ${
                    viewMode === "list"
                      ? "bg-card text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Все вопросы
                </button>
              </div>
            </div>

            {/* Mobile / Tablet Horizontal Question Carousel */}
            <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
              {test.questions.map((q, idx) => {
                const isAnswered = isQuestionAnswered(q);
                const isFlagged = flaggedQuestions[q.id];
                const isActive = idx === activeQuestionIdx;

                let pillStyle = "bg-muted/30 text-muted-foreground border-border hover:bg-muted/60";
                if (isActive) {
                  pillStyle = "bg-primary text-primary-foreground border-primary font-bold";
                } else if (isFlagged) {
                  pillStyle = "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold";
                } else if (isAnswered) {
                  pillStyle = "bg-primary/15 text-primary border-primary/30 font-bold";
                }

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setActiveQuestionIdx(idx)}
                    className={`h-7 min-w-[32px] px-1.5 rounded-lg border text-xs font-mono shrink-0 transition-all flex items-center justify-center gap-0.5 ${pillStyle}`}
                  >
                    {isFlagged && <Bookmark className="h-2.5 w-2.5 fill-current" />}
                    <span>{idx + 1}</span>
                  </button>
                );
              })}
            </div>

            {/* MAIN QUESTION DISPLAY */}
            {viewMode === "focus" ? (
              /* Single Question Focus Mode */
              <QuestionCard
                question={currentQuestion}
                index={activeQuestionIdx}
                totalQuestions={totalQuestions}
                studentAnswers={studentAnswers}
                isFlagged={Boolean(flaggedQuestions[currentQuestion.id])}
                isTeacherOrAdmin={Boolean(isTeacherOrAdmin)}
                onToggleFlag={() => toggleFlag(currentQuestion.id)}
                onOptionSelect={(opt) => handleOptionSelect(currentQuestion.id, opt, currentQuestion.type)}
                onBlankChange={(cnt, bIdx, val) => handleBlankChange(currentQuestion.id, cnt, bIdx, val)}
                onOrderingMove={(fromIdx, toIdx) =>
                  handleOrderingMove(
                    currentQuestion.id,
                    Array.isArray(currentQuestion.options) ? currentQuestion.options.map(String) : [],
                    fromIdx,
                    toIdx
                  )
                }
                onMatchingChange={(lKey, rVal) => handleMatchingChange(currentQuestion.id, lKey, rVal)}
                onTextChange={(val) =>
                  setStudentAnswers((prev) => ({
                    ...prev,
                    [currentQuestion.id]: val,
                  }))
                }
              />
            ) : (
              /* All Questions List Mode */
              <div className="space-y-4">
                {test.questions.map((q, qIdx) => (
                  <QuestionCard
                    key={q.id}
                    question={q}
                    index={qIdx}
                    totalQuestions={totalQuestions}
                    studentAnswers={studentAnswers}
                    isFlagged={Boolean(flaggedQuestions[q.id])}
                    isTeacherOrAdmin={Boolean(isTeacherOrAdmin)}
                    onToggleFlag={() => toggleFlag(q.id)}
                    onOptionSelect={(opt) => handleOptionSelect(q.id, opt, q.type)}
                    onBlankChange={(cnt, bIdx, val) => handleBlankChange(q.id, cnt, bIdx, val)}
                    onOrderingMove={(fromIdx, toIdx) =>
                      handleOrderingMove(
                        q.id,
                        Array.isArray(q.options) ? q.options.map(String) : [],
                        fromIdx,
                        toIdx
                      )
                    }
                    onMatchingChange={(lKey, rVal) => handleMatchingChange(q.id, lKey, rVal)}
                    onTextChange={(val) =>
                      setStudentAnswers((prev) => ({
                        ...prev,
                        [q.id]: val,
                      }))
                    }
                  />
                ))}
              </div>
            )}

            {/* Navigation Buttons (Focus Mode) */}
            {viewMode === "focus" && (
              <div className="flex items-center justify-between gap-2 p-3 bg-card border rounded-xl">
                <Button
                  size="xs"
                  variant="outline"
                  disabled={activeQuestionIdx === 0}
                  onClick={() => setActiveQuestionIdx((prev) => Math.max(0, prev - 1))}
                  className="h-8 px-3 text-xs gap-1 font-medium"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Назад
                </Button>

                <div className="flex items-center gap-1.5">
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => toggleFlag(currentQuestion.id)}
                    className={`h-8 px-2.5 text-xs gap-1 font-medium transition-colors ${
                      flaggedQuestions[currentQuestion.id]
                        ? "border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    title="Пометить вопрос флажком (клавиша F)"
                  >
                    <Bookmark className={`h-3.5 w-3.5 ${flaggedQuestions[currentQuestion.id] ? "fill-current" : ""}`} />
                    <span className="hidden sm:inline">
                      {flaggedQuestions[currentQuestion.id] ? "Отложен" : "Отложить"}
                    </span>
                  </Button>

                  {activeQuestionIdx < totalQuestions - 1 ? (
                    <Button
                      size="xs"
                      onClick={() => setActiveQuestionIdx((prev) => Math.min(totalQuestions - 1, prev + 1))}
                      className="h-8 px-3 text-xs gap-1 font-medium bg-primary text-primary-foreground"
                    >
                      Следующий <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  ) : (
                    <Button
                      size="xs"
                      onClick={() => setIsSubmitModalOpen(true)}
                      className="h-8 px-3 text-xs gap-1 font-bold bg-primary text-primary-foreground"
                    >
                      <Send className="h-3.5 w-3.5" /> Завершить тест
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: QUESTION PALETTE & SIDEBAR (STICKY) */}
          <div className="lg:col-span-4 xl:col-span-3 space-y-3 sticky top-20 self-start min-w-0">
            <Card className="p-3.5 space-y-3.5">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <ListFilter className="h-3.5 w-3.5 text-primary" /> Навигация по тесту
                </h3>
                <span className="text-[11px] font-semibold text-muted-foreground font-mono">
                  {answeredCount}/{totalQuestions}
                </span>
              </div>

              {/* Mini Summary Chips */}
              <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                  <div className="font-bold text-xs">{answeredCount}</div>
                  <div className="text-[9px] uppercase tracking-wider">Отвечено</div>
                </div>
                <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
                  <div className="font-bold text-xs">{flaggedCount}</div>
                  <div className="text-[9px] uppercase tracking-wider">Отложено</div>
                </div>
                <div className="p-1.5 rounded-lg bg-muted border text-muted-foreground">
                  <div className="font-bold text-xs">{unansweredCount}</div>
                  <div className="text-[9px] uppercase tracking-wider">Осталось</div>
                </div>
              </div>

              {/* Continuous Timer Notice (when timeLimit is set) */}
              {test.timeLimit && !isTeacherOrAdmin && (
                <div className="p-2.5 rounded-lg bg-muted/40 border text-[11px] space-y-1">
                  <div className="flex items-center justify-between font-semibold text-foreground">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-primary" /> Лимит: {test.timeLimit} мин
                    </span>
                    {secondsLeft !== null && (
                      <span className="font-mono text-xs text-primary font-bold">
                        {formatTimer(secondsLeft)}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    Отсчёт времени идёт непрерывно. Выход из браузера или перезагрузка страницы не приостанавливают таймер.
                  </p>
                </div>
              )}

              {/* Question 1..N Number Grid */}
              <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-5 gap-1.5 pt-1">
                {test.questions.map((q, idx) => {
                  const isAnswered = isQuestionAnswered(q);
                  const isFlagged = flaggedQuestions[q.id];
                  const isActive = idx === activeQuestionIdx && viewMode === "focus";

                  let btnStyle = "bg-muted/30 hover:bg-muted/60 text-muted-foreground border-border";
                  if (isActive) {
                    btnStyle = "bg-primary text-primary-foreground border-primary font-bold";
                  } else if (isFlagged) {
                    btnStyle = "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold";
                  } else if (isAnswered) {
                    btnStyle = "bg-primary/15 text-primary border-primary/30 font-bold hover:bg-primary/25";
                  }

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => {
                        setActiveQuestionIdx(idx);
                        if (viewMode === "list") {
                          const el = document.getElementById(`question-card-${q.id}`);
                          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                        }
                      }}
                      className={`h-8 rounded-lg border text-xs font-mono transition-all flex items-center justify-center relative ${btnStyle}`}
                      title={`Вопрос #${idx + 1} (${q.points} б.)`}
                    >
                      <span>{idx + 1}</span>
                      {isFlagged && (
                        <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-amber-500 text-white flex items-center justify-center">
                          <Bookmark className="h-2 w-2 fill-current" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Submit CTA */}
              {!isTeacherOrAdmin && (
                <div className="pt-2 border-t space-y-1.5">
                  <Button
                    size="xs"
                    disabled={isPending}
                    onClick={() => setIsSubmitModalOpen(true)}
                    className="w-full h-8 text-xs font-bold gap-1.5 bg-primary text-primary-foreground"
                  >
                    <Send className="h-3.5 w-3.5" /> Завершить тест
                  </Button>
                  <p className="text-[10px] text-muted-foreground text-center">
                    Вы сможете проверить ответы перед окончательной отправкой
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* SMART SUBMISSION CONFIRMATION MODAL */}
      <AlertDialog open={isSubmitModalOpen} onOpenChange={setIsSubmitModalOpen}>
        <AlertDialogContent className="p-4 gap-3 text-xs sm:max-w-[400px] place-items-start text-left">
          <AlertDialogHeader className="text-left gap-1">
            <AlertDialogTitle className="text-sm font-bold flex items-center gap-1.5 text-foreground">
              <Send className="h-4 w-4 text-primary" /> Завершить прохождение теста?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground space-y-2">
              <p>Вы собираетесь отправить работу на автоматическую проверку.</p>

              {/* Stats Breakdown */}
              <div className="bg-muted/50 p-2.5 rounded-lg border space-y-1 text-foreground">
                <div className="flex items-center justify-between text-xs">
                  <span>Отвечено на вопросов:</span>
                  <strong className="text-primary">{answeredCount} из {totalQuestions}</strong>
                </div>
                {flaggedCount > 0 && (
                  <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400">
                    <span>Отложено на потом:</span>
                    <strong>{flaggedCount}</strong>
                  </div>
                )}
                {unansweredCount > 0 && (
                  <div className="flex items-center justify-between text-xs text-destructive">
                    <span>Осталось без ответа:</span>
                    <strong>{unansweredCount}</strong>
                  </div>
                )}
                {secondsLeft !== null && !isTeacherOrAdmin && (
                  <div className="flex items-center justify-between text-xs pt-1 border-t text-muted-foreground">
                    <span>Осталось времени:</span>
                    <strong className="font-mono text-foreground">{formatTimer(secondsLeft)}</strong>
                  </div>
                )}
              </div>

              {unansweredCount > 0 && (
                <p className="text-amber-600 dark:text-amber-400 text-[11px] font-medium">
                  Внимание: за неотвеченные вопросы баллы не начисляются.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2 w-full">
            {unansweredCount > 0 ? (
              <>
                <AlertDialogCancel className="h-6 px-2.5 text-xs">
                  Отмена
                </AlertDialogCancel>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={jumpToFirstUnanswered}
                  className="h-6 px-2.5 text-xs border-primary/30 text-primary hover:bg-primary/5 font-medium"
                >
                  К пропущенным
                </Button>
                <AlertDialogAction
                  onClick={handleSubmit}
                  className="h-6 px-2.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                >
                  Всё равно сдать
                </AlertDialogAction>
              </>
            ) : (
              <>
                <AlertDialogCancel className="h-6 px-2.5 text-xs">
                  Проверить ещё
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleSubmit}
                  className="h-6 px-2.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                >
                  Отправить
                </AlertDialogAction>
              </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ----------------------------------------------------------------------
// SUB-COMPONENT: QUESTION CARD
// ----------------------------------------------------------------------
interface QuestionCardProps {
  question: QuestionItem;
  index: number;
  totalQuestions: number;
  studentAnswers: Record<string, string>;
  isFlagged: boolean;
  isTeacherOrAdmin: boolean;
  onToggleFlag: () => void;
  onOptionSelect: (opt: string) => void;
  onBlankChange: (count: number, idx: number, val: string) => void;
  onOrderingMove: (from: number, to: number) => void;
  onMatchingChange: (left: string, right: string) => void;
  onTextChange: (val: string) => void;
}

function QuestionCard({
  question,
  index,
  totalQuestions,
  studentAnswers,
  isFlagged,
  isTeacherOrAdmin,
  onToggleFlag,
  onOptionSelect,
  onBlankChange,
  onOrderingMove,
  onMatchingChange,
  onTextChange,
}: QuestionCardProps) {
  const { title: qTitle, code: qCode } = parseQuestionCode(question.questionText);
  const selectedVal = studentAnswers[question.id] || "";

  let selectedMultiple: string[] = [];
  if (question.type === "MULTIPLE") {
    try {
      selectedMultiple = selectedVal ? JSON.parse(selectedVal) : [];
    } catch {
      selectedMultiple = [];
    }
  }

  let currentOrderingList: string[] = [];
  if (question.type === "ORDERING") {
    try {
      currentOrderingList = selectedVal
        ? JSON.parse(selectedVal)
        : Array.isArray(question.options)
          ? question.options.map(String)
          : [];
    } catch {
      currentOrderingList = Array.isArray(question.options) ? question.options.map(String) : [];
    }
  }

  let currentBlankList: string[] = [];
  if (question.type === "BLANKS") {
    try {
      currentBlankList = selectedVal ? JSON.parse(selectedVal) : [];
    } catch {
      currentBlankList = [];
    }
  }

  let currentMatchingMap: Record<string, string> = {};
  if (question.type === "MATCHING") {
    try {
      currentMatchingMap = selectedVal ? JSON.parse(selectedVal) : {};
    } catch {
      currentMatchingMap = {};
    }
  }

  const typeLabels: Record<QuestionType, string> = {
    SINGLE: "Один ответ",
    MULTIPLE: "Множественный выбор",
    TRUE_FALSE: "Верно / Неверно",
    ORDERING: "Упорядочивание",
    BLANKS: "Заполнение пропусков",
    MATCHING: "Сопоставление пар",
    NUMERICAL: "Числовой ответ",
    CODE: "Код",
    TEXT: "Текстовый ответ",
  };

  return (
    <Card id={`question-card-${question.id}`} className="p-4 space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b pb-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs font-bold px-2 py-0.5 border-primary/30 text-primary bg-primary/5">
            Вопрос #{index + 1}
          </Badge>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
            {typeLabels[question.type]}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-muted-foreground">
            {question.points} {question.points === 1 ? "балл" : "балла"}
          </span>
          <Button
            size="xs"
            variant="ghost"
            onClick={onToggleFlag}
            className={`h-6 w-6 p-0 rounded-md transition-colors ${
              isFlagged ? "text-amber-500 hover:text-amber-600 bg-amber-500/10" : "text-muted-foreground hover:text-foreground"
            }`}
            title="Отложить вопрос на потом"
          >
            <Bookmark className={`h-3.5 w-3.5 ${isFlagged ? "fill-current" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Question Statement */}
      <div className="space-y-2.5">
        <div className="text-xs text-foreground font-semibold leading-relaxed whitespace-pre-wrap">
          {qTitle}
        </div>

        {qCode && (
          <div className="bg-muted/80 text-foreground font-mono text-[11px] p-3 rounded-lg border overflow-x-auto leading-normal">
            <pre>{qCode}</pre>
          </div>
        )}
      </div>

      {/* Question Inputs */}
      <div className="pt-1">
        {question.type === "TEXT" ? (
          <Input
            placeholder="Введите ваш ответ..."
            disabled={isTeacherOrAdmin}
            value={selectedVal}
            onChange={(e) => onTextChange(e.target.value)}
            className="h-9 text-xs bg-background font-medium"
          />
        ) : question.type === "NUMERICAL" ? (
          <div className="space-y-1 max-w-xs">
            <div className="flex items-center gap-1.5">
              <Hash className="h-4 w-4 text-primary" />
              <Input
                type="text"
                placeholder="Например: 9.8"
                disabled={isTeacherOrAdmin}
                value={selectedVal}
                onChange={(e) => onTextChange(e.target.value)}
                className="h-9 text-xs font-mono bg-background"
              />
            </div>
            <span className="text-[10px] text-muted-foreground">Введите точное число</span>
          </div>
        ) : question.type === "MATCHING" ? (
          <div className="space-y-2">
            <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
              <Layers className="h-3.5 w-3.5 text-primary" /> Сопоставьте элементы:
            </div>
            <div className="grid grid-cols-1 gap-2">
              {(Array.isArray(question.options) ? question.options : []).map((pair: unknown, pIdx: number) => {
                const leftKey =
                  typeof pair === "object" && pair !== null && "left" in pair
                    ? String((pair as { left: unknown }).left || "")
                    : String(pair || "");
                const rightOptions = Array.isArray(question.options)
                  ? question.options.map((o: unknown) =>
                      typeof o === "object" && o !== null && "right" in o
                        ? String((o as { right: unknown }).right || "")
                        : String(o || "")
                    )
                  : [];
                return (
                  <div
                    key={pIdx}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg border bg-muted/20 text-xs"
                  >
                    <span className="font-semibold text-foreground flex-1">{leftKey}</span>
                    <div className="sm:w-60">
                      <select
                        disabled={isTeacherOrAdmin}
                        value={currentMatchingMap[leftKey] || ""}
                        onChange={(e) => onMatchingChange(leftKey, e.target.value)}
                        className="w-full h-8 text-xs rounded-md border bg-background px-2 font-medium"
                      >
                        <option value="">-- Выберите пару --</option>
                        {rightOptions.map((rOpt: string, rIdx: number) => (
                          <option key={rIdx} value={rOpt}>
                            {rOpt}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : question.type === "ORDERING" ? (
          <div className="space-y-2">
            <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
              <ListOrdered className="h-3.5 w-3.5 text-primary" /> Расставьте в правильном порядке:
            </div>
            <div className="space-y-1.5">
              {currentOrderingList.map((itemText, itemIdx) => (
                <div
                  key={itemIdx}
                  className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/20 text-xs font-medium"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0 font-mono">
                      {itemIdx + 1}
                    </span>
                    <span>{itemText}</span>
                  </div>

                  {!isTeacherOrAdmin && (
                    <div className="flex items-center gap-0.5">
                      <Button
                        type="button"
                        size="xs"
                        variant="ghost"
                        disabled={itemIdx === 0}
                        onClick={() => onOrderingMove(itemIdx, itemIdx - 1)}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="xs"
                        variant="ghost"
                        disabled={itemIdx === currentOrderingList.length - 1}
                        onClick={() => onOrderingMove(itemIdx, itemIdx + 1)}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : question.type === "BLANKS" ? (
          <div className="space-y-2">
            <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
              <FormInput className="h-3.5 w-3.5 text-primary" /> Впишите пропущенные слова:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(Array.isArray(question.options) ? question.options : []).map((rawOpt, blankIdx: number) => {
                const opt =
                  typeof rawOpt === "string"
                    ? rawOpt
                    : typeof rawOpt === "object" && rawOpt !== null && "left" in rawOpt
                      ? (rawOpt as { left: string }).left
                      : String(rawOpt);
                return (
                  <div key={blankIdx} className="space-y-1">
                    <label className="text-[10px] font-medium text-muted-foreground">
                      Пропуск #{blankIdx + 1}
                    </label>
                    <Input
                      placeholder={`Ответ #${blankIdx + 1}...`}
                      disabled={isTeacherOrAdmin}
                      value={isTeacherOrAdmin ? opt : currentBlankList[blankIdx] || ""}
                      onChange={(e) => onBlankChange(question.options.length, blankIdx, e.target.value)}
                      className="h-8 text-xs bg-background font-medium"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* SINGLE, MULTIPLE, TRUE_FALSE, CODE */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(Array.isArray(question.options) ? question.options : []).map((rawOpt, optIdx: number) => {
              const opt =
                typeof rawOpt === "string"
                  ? rawOpt
                  : typeof rawOpt === "object" && rawOpt !== null && "left" in rawOpt
                    ? (rawOpt as { left: string }).left
                    : String(rawOpt);

              const isSelected =
                question.type === "MULTIPLE"
                  ? selectedMultiple.includes(opt)
                  : selectedVal === opt;

              let isCorrectOpt = false;
              if (isTeacherOrAdmin && question.correctAnswer) {
                if (question.type === "MULTIPLE") {
                  try {
                    const correctArr: string[] = JSON.parse(question.correctAnswer);
                    isCorrectOpt = correctArr.includes(opt);
                  } catch {}
                } else {
                  isCorrectOpt = question.correctAnswer === opt;
                }
              }

              const letterBadge = OPTION_LETTERS[optIdx] || String(optIdx + 1);

              return (
                <div
                  key={optIdx}
                  onClick={() => onOptionSelect(opt)}
                  className={`p-3 rounded-xl border text-xs font-medium transition-all flex items-center justify-between gap-2.5 ${
                    isTeacherOrAdmin
                      ? isCorrectOpt
                        ? "bg-primary/15 border-primary/40 text-primary"
                        : "bg-background border-border text-muted-foreground opacity-70"
                      : isSelected
                        ? "bg-primary/10 border-primary text-primary cursor-pointer"
                        : "bg-background hover:bg-muted/50 border-border text-foreground cursor-pointer"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span
                      className={`h-6 w-6 rounded-lg text-[10px] font-mono font-bold flex items-center justify-center shrink-0 border ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted/60 text-muted-foreground border-border"
                      }`}
                    >
                      {letterBadge}
                    </span>
                    <span className="truncate flex-1">{opt}</span>
                  </div>

                  <div
                    className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                      isTeacherOrAdmin
                        ? isCorrectOpt
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-muted-foreground/30"
                        : isSelected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-muted-foreground/40"
                    }`}
                  >
                    {isTeacherOrAdmin
                      ? isCorrectOpt && <Check className="h-2.5 w-2.5 stroke-[3]" />
                      : isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
