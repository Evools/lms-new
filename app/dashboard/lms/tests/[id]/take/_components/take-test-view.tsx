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
  Clock,
  Send,
  ArrowLeft,
  Building2,
  Check,
  X,
  Trophy,
  Eye,
  ChevronUp,
  ChevronDown,
  ListOrdered,
  FormInput,
  ShieldAlert,
  Hash,
  Layers,
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

  const [studentAnswers, setStudentAnswers] = useState<Record<string, string>>(() => {
    return test.userSubmission?.answers || {};
  });

  const [tabSwitches, setTabSwitches] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(SWITCH_KEY);
      return stored ? Number(stored) : 0;
    }
    return 0;
  });

  const [testResult, setTestResult] = useState<{ score: number; maxScore: number } | null>(
    test.userSubmission ? { score: test.userSubmission.score, maxScore: test.userSubmission.maxScore } : null
  );

  const initialSeconds = test.timeLimit && !isTeacherOrAdmin ? test.timeLimit * 60 : null;
  const [secondsLeft, setSecondsLeft] = useState<number | null>(initialSeconds);
  const [isInitialized, setIsInitialized] = useState(false);

  // Focus lost & tab switch detection
  useEffect(() => {
    if (isTeacherOrAdmin || testResult || !isInitialized) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitches((prev) => {
          const next = prev + 1;
          localStorage.setItem(SWITCH_KEY, String(next));
          return next;
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isTeacherOrAdmin, testResult, isInitialized]);

  // Window beforeunload safety guard
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

  // Restore state and persistent timer from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined" || isTeacherOrAdmin) {
      setIsInitialized(true);
      return;
    }

    if (test.userSubmission) {
      localStorage.removeItem(START_KEY);
      localStorage.removeItem(ANSWERS_KEY);
      localStorage.removeItem(SWITCH_KEY);
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

    // Restore timer based on start timestamp
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

  // Persist answers when updated
  useEffect(() => {
    if (!isInitialized || testResult || isTeacherOrAdmin || typeof window === "undefined") return;
    localStorage.setItem(ANSWERS_KEY, JSON.stringify(studentAnswers));
  }, [studentAnswers, isInitialized, testResult, isTeacherOrAdmin]);

  // Live Timer Countdown Interval
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
        const updated = exists
          ? currentArr.filter((o) => o !== option)
          : [...currentArr, option];
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

  const handleSubmit = async () => {
    if (testResult || isPending) return;

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
        toast.add({ title: "Тест успешно завершен!", type: "success" });
        router.refresh();
      } else {
        toast.add({ title: res.error || "Ошибка при отправке ответов", type: "error" });
      }
    });
  };

  const totalQuestions = test.questions.length;
  const answeredCount = Object.keys(studentAnswers).filter((k) => !k.startsWith("_")).length;
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

  return (
    <div className="space-y-4 w-full pb-12">
      {/* Header */}
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
            <Badge variant="secondary" className="text-[10px] font-normal">
              {test.subjectName}
            </Badge>
            {isTeacherOrAdmin && (
              <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
                <Eye className="h-3 w-3 mr-1" /> Режим просмотра
              </Badge>
            )}
          </div>

          <h1 className="text-base font-bold text-foreground tracking-tight flex items-center gap-2">
            {test.title}
          </h1>

          <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
            <span>Преподаватель: <strong className="text-foreground">{test.teacherName}</strong></span>
            <span>•</span>
            <span>Вопросов: <strong className="text-foreground">{totalQuestions}</strong></span>
            <span>•</span>
            <span>Всего баллов: <strong className="text-foreground">{totalMaxPoints}</strong></span>
          </div>
        </div>

        {/* Live Timer Widget (Students only) */}
        {!isTeacherOrAdmin && !isSubmitted && secondsLeft !== null && (
          <div className="flex items-center gap-3 bg-card p-2 rounded-lg border shadow-xs self-start sm:self-center">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                Осталось времени
              </span>
              <div className={`px-2 py-0.5 rounded-md font-mono text-xs font-bold border flex items-center gap-1.5 ${timerColorClass}`}>
                <Clock className="h-3.5 w-3.5" />
                {formatTimer(secondsLeft)}
              </div>
            </div>
            {/* Mini Progress Bar */}
            <div className="w-12 h-2 bg-muted rounded-full overflow-hidden border">
              <div
                className={`h-full transition-all duration-1000 ${
                  timeProgress > 50 ? "bg-primary" : timeProgress > 20 ? "bg-amber-500" : "bg-destructive"
                }`}
                style={{ width: `${timeProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Tab Switch Warning Banner (For Students while taking test) */}
      {!isTeacherOrAdmin && !isSubmitted && tabSwitches > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-2.5 rounded-xl text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>
              Зафиксировано переключение на другие вкладки: <strong>{tabSwitches}</strong> раз(а).
            </span>
          </div>
          <span className="text-[10px] opacity-80">Данные сохраняются в результатах</span>
        </div>
      )}

      {/* Post Submission Results Screen */}
      {isSubmitted ? (
        <Card className="p-6 sm:p-7 bg-card border shadow-xs space-y-5 text-center rounded-2xl">
          <div className="flex flex-col items-center space-y-2">
            <div className="w-13 h-13 rounded-full bg-primary/15 text-primary flex items-center justify-center border border-primary/30 shadow-2xs">
              <Trophy className="h-6 w-6 stroke-[2.5]" />
            </div>
            <h2 className="text-base font-bold text-foreground">Тест успешно завершен!</h2>
            <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
              Ваши ответы зафиксированы и проверены автоматической системой лицея.
            </p>
          </div>

          {/* Score Badge */}
          <div className="inline-flex items-center justify-center gap-4 bg-muted/40 p-3.5 sm:p-4 rounded-xl border mx-auto w-full max-w-xs">
            <div className="text-left space-y-0.5 flex-1">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Итоговый балл
              </span>
              <div className="text-xl font-bold text-foreground">
                {(testResult?.score ?? test.userSubmission?.score ?? 0).toFixed(1)}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  / {testResult?.maxScore ?? test.userSubmission?.maxScore ?? totalMaxPoints} б.
                </span>
              </div>
            </div>

            <div className="h-8 w-px bg-border shrink-0" />

            <div className="text-left space-y-0.5 flex-1">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Успеваемость
              </span>
              <div className="text-xl font-bold text-primary">
                {Math.round(
                  ((testResult?.score ?? test.userSubmission?.score ?? 0) /
                    ((testResult?.maxScore ?? test.userSubmission?.maxScore ?? totalMaxPoints) || 1)) *
                    100
                )}
                %
              </div>
            </div>
          </div>

          <div className="pt-1 flex justify-center gap-3">
            <Link href="/dashboard/lms/tests">
              <Button size="xs" variant="outline" className="h-8 px-4 text-xs gap-1.5 font-medium">
                <ArrowLeft className="h-3.5 w-3.5" /> Вернуться к списку тестов
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        /* Active Test Taking View */
        <div className="space-y-4">
          {/* Questions List */}
          <div className="space-y-4">
            {test.questions.map((q, qIdx) => {
              const { title: qTitle, code: qCode } = parseQuestionCode(q.questionText);
              const selectedVal = studentAnswers[q.id] || "";
              let selectedMultiple: string[] = [];
              if (q.type === "MULTIPLE") {
                try {
                  selectedMultiple = selectedVal ? JSON.parse(selectedVal) : [];
                } catch {
                  selectedMultiple = [];
                }
              }

              let currentOrderingList: string[] = [];
              if (q.type === "ORDERING") {
                try {
                  currentOrderingList = selectedVal ? JSON.parse(selectedVal) : (Array.isArray(q.options) ? q.options.map(String) : []);
                } catch {
                  currentOrderingList = Array.isArray(q.options) ? q.options.map(String) : [];
                }
              }

              let currentBlankList: string[] = [];
              if (q.type === "BLANKS") {
                try {
                  currentBlankList = selectedVal ? JSON.parse(selectedVal) : [];
                } catch {
                  currentBlankList = [];
                }
              }

              let currentMatchingMap: Record<string, string> = {};
              if (q.type === "MATCHING") {
                try {
                  currentMatchingMap = selectedVal ? JSON.parse(selectedVal) : {};
                } catch {
                  currentMatchingMap = {};
                }
              }

              return (
                <Card key={q.id} className="p-4 bg-card border shadow-xs space-y-3">
                  {/* Question Header */}
                  <div className="flex items-center justify-between gap-2 border-b pb-2.5">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs font-bold px-2 py-0.5 border-primary/30 text-primary">
                        #{qIdx + 1}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                        {q.type === "MULTIPLE"
                          ? "Множественный выбор"
                          : q.type === "TRUE_FALSE"
                            ? "Верно / Неверно"
                            : q.type === "ORDERING"
                              ? "Упорядочивание"
                              : q.type === "BLANKS"
                                ? "Заполнение пропусков"
                                : q.type === "MATCHING"
                                  ? "Сопоставление пар"
                                  : q.type === "NUMERICAL"
                                    ? "Числовой ответ"
                                    : q.type === "CODE"
                                      ? "Код"
                                      : q.type === "TEXT"
                                        ? "Текстовый ответ"
                                        : "Один ответ"}
                      </span>
                    </div>

                    <span className="text-xs font-mono font-bold text-muted-foreground">
                      {q.points} {q.points === 1 ? "балл" : "балла"}
                    </span>
                  </div>

                  {/* Question Content */}
                  <div className="space-y-2">
                    <div className="text-xs text-foreground font-semibold leading-relaxed whitespace-pre-wrap">
                      {qTitle}
                    </div>

                    {qCode && (
                      <div className="bg-muted/80 text-foreground font-mono text-[11px] p-3 rounded-lg border overflow-x-auto leading-normal">
                        <pre>{qCode}</pre>
                      </div>
                    )}
                  </div>

                  {/* Question Answer Inputs */}
                  <div className="pt-2">
                    {q.type === "TEXT" ? (
                      <Input
                        placeholder="Введите ваш ответ..."
                        disabled={isTeacherOrAdmin}
                        value={selectedVal}
                        onChange={(e) =>
                          setStudentAnswers((prev) => ({
                            ...prev,
                            [q.id]: e.target.value,
                          }))
                        }
                        className="h-9 text-xs bg-background font-medium"
                      />
                    ) : q.type === "NUMERICAL" ? (
                      <div className="space-y-1 max-w-xs">
                        <div className="flex items-center gap-1.5">
                          <Hash className="h-4 w-4 text-primary" />
                          <Input
                            type="text"
                            placeholder="Например: 9.8"
                            disabled={isTeacherOrAdmin}
                            value={selectedVal}
                            onChange={(e) =>
                              setStudentAnswers((prev) => ({
                                ...prev,
                                [q.id]: e.target.value,
                              }))
                            }
                            className="h-9 text-xs font-mono bg-background"
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground">Введите точное число или с точкой</span>
                      </div>
                    ) : q.type === "MATCHING" ? (
                      /* MATCHING PAIRS */
                      <div className="space-y-2">
                        <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                          <Layers className="h-3.5 w-3.5 text-primary" /> Сопоставьте элементы слева с элементами справа:
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          {(Array.isArray(q.options) ? q.options : []).map((pair: unknown, pIdx: number) => {
                            const leftKey = typeof pair === "object" && pair !== null && "left" in pair ? String((pair as { left: unknown }).left || "") : String(pair || "");
                            const rightOptions = Array.isArray(q.options)
                              ? q.options.map((o: unknown) => (typeof o === "object" && o !== null && "right" in o ? String((o as { right: unknown }).right || "") : String(o || "")))
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
                                    onChange={(e) => handleMatchingChange(q.id, leftKey, e.target.value)}
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
                    ) : q.type === "ORDERING" ? (
                      <div className="space-y-2">
                        <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                          <ListOrdered className="h-3.5 w-3.5 text-primary" /> Расставьте варианты в правильной последовательности:
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

                              {!isTeacherOrAdmin && !test.userSubmission && (
                                <div className="flex items-center gap-0.5">
                                  <Button
                                    type="button"
                                    size="xs"
                                    variant="ghost"
                                    disabled={itemIdx === 0}
                                    onClick={() => handleOrderingMove(q.id, currentOrderingList, itemIdx, itemIdx - 1)}
                                    className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                                  >
                                    <ChevronUp className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    type="button"
                                    size="xs"
                                    variant="ghost"
                                    disabled={itemIdx === currentOrderingList.length - 1}
                                    onClick={() => handleOrderingMove(q.id, currentOrderingList, itemIdx, itemIdx + 1)}
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
                    ) : q.type === "BLANKS" ? (
                      <div className="space-y-2">
                        <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                          <FormInput className="h-3.5 w-3.5 text-primary" /> Впишите пропущенные слова по порядку:
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(Array.isArray(q.options) ? q.options : []).map((rawOpt, blankIdx: number) => {
                            const opt = typeof rawOpt === "string" ? rawOpt : (typeof rawOpt === "object" && rawOpt !== null && "left" in rawOpt ? rawOpt.left : String(rawOpt));
                            return (
                              <div key={blankIdx} className="space-y-1">
                                <label className="text-[10px] font-medium text-muted-foreground">
                                  Пропуск #{blankIdx + 1}
                                </label>
                                <Input
                                  placeholder={`Ответ на пропуск #${blankIdx + 1}...`}
                                  disabled={isTeacherOrAdmin}
                                  value={isTeacherOrAdmin ? opt : currentBlankList[blankIdx] || ""}
                                  onChange={(e) => handleBlankChange(q.id, q.options.length, blankIdx, e.target.value)}
                                  className="h-8 text-xs bg-background font-medium"
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      /* SINGLE, MULTIPLE, TRUE_FALSE */
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(Array.isArray(q.options) ? q.options : []).map((rawOpt, optIdx: number) => {
                          const opt = typeof rawOpt === "string" ? rawOpt : (typeof rawOpt === "object" && rawOpt !== null && "left" in rawOpt ? (rawOpt as { left: string }).left : String(rawOpt));
                          let isSelected =
                            q.type === "MULTIPLE"
                              ? selectedMultiple.includes(opt)
                              : selectedVal === opt;

                          let isCorrectOpt = false;
                          if (isTeacherOrAdmin && q.correctAnswer) {
                            if (q.type === "MULTIPLE") {
                              try {
                                const correctArr: string[] = JSON.parse(q.correctAnswer);
                                isCorrectOpt = correctArr.includes(opt);
                              } catch {}
                            } else {
                              isCorrectOpt = q.correctAnswer === opt;
                            }
                          }

                          return (
                            <div
                              key={optIdx}
                              onClick={() => handleOptionSelect(q.id, opt, q.type)}
                              className={`p-3 rounded-lg border text-xs font-medium transition-all flex items-center justify-between ${
                                isTeacherOrAdmin
                                  ? isCorrectOpt
                                    ? "bg-primary/15 border-primary/40 text-primary font-semibold"
                                    : "bg-background border-border text-muted-foreground opacity-70"
                                  : isSelected
                                    ? "bg-primary/10 border-primary text-primary font-semibold shadow-xs cursor-pointer"
                                    : "bg-background hover:bg-muted/50 border-border text-foreground cursor-pointer"
                              }`}
                            >
                              <span className="truncate flex-1 pr-2">{opt}</span>
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
            })}
          </div>

          {/* Bottom Action Footer (For Students Only) */}
          {!isTeacherOrAdmin && (
            <div className="flex items-center justify-between p-3.5 bg-card border rounded-xl shadow-xs">
              <span className="text-xs text-muted-foreground">
                Заполнено {answeredCount} из {totalQuestions} вопросов
              </span>
              <Button size="xs" disabled={isPending} onClick={handleSubmit} className="h-8 px-4 text-xs font-bold gap-1.5 shadow-xs">
                <Send className="h-3.5 w-3.5" /> Завершить и сдать тест
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
