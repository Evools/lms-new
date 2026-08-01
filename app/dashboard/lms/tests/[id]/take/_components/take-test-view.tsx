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
  FileCheck2,
  Clock,
  Send,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Award,
  ArrowLeft,
  Building2,
  User,
  Check,
  X,
  XCircle,
  BookOpen,
  Sparkles,
  Trophy,
  BarChart2,
  Eye,
} from "lucide-react";
import { submitTestAnswersAction } from "@/app/dashboard/lms/actions";

interface QuestionItem {
  id: string;
  type: "SINGLE" | "MULTIPLE" | "TEXT" | "TRUE_FALSE";
  questionText: string;
  options: string[];
  points: number;
  correctAnswer?: string;
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

export function TakeTestView({ test }: TakeTestViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isTeacherOrAdmin = test.userRole === "ADMIN" || test.userRole === "TEACHER";

  const START_KEY = `test_start_${test.id}`;
  const ANSWERS_KEY = `test_answers_${test.id}`;

  const [studentAnswers, setStudentAnswers] = useState<Record<string, string>>(() => {
    return test.userSubmission?.answers || {};
  });

  const [testResult, setTestResult] = useState<{ score: number; maxScore: number } | null>(
    test.userSubmission ? { score: test.userSubmission.score, maxScore: test.userSubmission.maxScore } : null
  );

  const initialSeconds = test.timeLimit && !isTeacherOrAdmin ? test.timeLimit * 60 : null;
  const [secondsLeft, setSecondsLeft] = useState<number | null>(initialSeconds);
  const [isInitialized, setIsInitialized] = useState(false);

  // Restore state and persistent timer from localStorage on mount (for students only)
  useEffect(() => {
    if (typeof window === "undefined" || isTeacherOrAdmin) {
      setIsInitialized(true);
      return;
    }

    if (test.userSubmission) {
      localStorage.removeItem(START_KEY);
      localStorage.removeItem(ANSWERS_KEY);
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

  // Persist answers when updated (for students)
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
      setSecondsLeft((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft, isInitialized, testResult, isTeacherOrAdmin]);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
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

  const handleSubmit = () => {
    if (testResult || isPending || test.userSubmission || isTeacherOrAdmin) return;

    startTransition(async () => {
      const res = await submitTestAnswersAction({
        testId: test.id,
        answers: studentAnswers,
      });

      if (typeof window !== "undefined") {
        localStorage.removeItem(START_KEY);
        localStorage.removeItem(ANSWERS_KEY);
      }

      if (res.success && res.score !== undefined && res.maxScore !== undefined) {
        setTestResult({ score: res.score, maxScore: res.maxScore });
        toast.add({ title: `Тест сдан! Ваш результат: ${res.score} из ${res.maxScore}`, type: "success" });
        router.refresh();
      } else {
        toast.add({ title: res.error || "Ошибка сдачи теста", type: "error" });
      }
    });
  };

  const answeredCount = Object.keys(studentAnswers).filter(
    (k) => studentAnswers[k] && studentAnswers[k] !== "[]"
  ).length;

  const totalQuestions = test.questions.length;
  const isAlreadySubmitted = !!test.userSubmission || !!testResult;

  const currentScore = testResult?.score ?? test.userSubmission?.score ?? 0;
  const currentMaxScore = testResult?.maxScore ?? test.userSubmission?.maxScore ?? (totalQuestions || 1);
  const scorePercent = currentMaxScore > 0 ? Math.round((currentScore / currentMaxScore) * 100) : 0;

  return (
    <div className="space-y-4 w-full text-xs pb-12">
      {/* Teacher / Admin Preview Notice */}
      {isTeacherOrAdmin && (
        <div className="p-3 rounded-xl border border-primary/30 bg-primary/10 text-primary text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 font-bold">
            <Eye className="h-4 w-4 text-primary" /> Режим просмотра теста (Преподаватель / Администратор)
          </div>
          <span className="text-[11px] font-normal text-muted-foreground">Сдача теста доступна только студентам</span>
        </div>
      )}

      {/* Top Sticky Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-3.5 rounded-xl border shadow-xs sticky top-16 z-20">
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/lms/tests"
            className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] border-primary/30 text-primary font-medium px-2 py-0.5">
                {test.subjectName}
              </Badge>
              <span className="text-[11px] text-muted-foreground">Преподаватель: {test.teacherName}</span>
            </div>
            <h1 className="text-sm font-bold text-foreground truncate max-w-[400px]">{test.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {secondsLeft !== null && !isAlreadySubmitted && !isTeacherOrAdmin && (
            <div
              className={`flex items-center gap-1.5 px-3 py-1 border rounded-lg font-bold font-mono text-xs ${
                secondsLeft < 180
                  ? "bg-destructive/10 text-destructive border-destructive/30 animate-pulse"
                  : "bg-primary/10 border-primary/20 text-primary"
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>{formatTimer(secondsLeft)}</span>
            </div>
          )}

          <Link href="/dashboard/lms/tests">
            <Button size="xs" variant="outline" className="h-7 text-xs gap-1 font-medium">
              <ArrowLeft className="h-3 w-3" /> Все тесты
            </Button>
          </Link>
        </div>
      </div>

      {/* COMPLETED TEST RESULTS SCREEN (For Students after submission) */}
      {isAlreadySubmitted ? (
        <div className="space-y-4">
          {/* Hero Score Card */}
          <div className="bg-card border rounded-xl p-6 space-y-4 shadow-xs text-center relative overflow-hidden">
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-72 h-72 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

            <div className="flex flex-col items-center justify-center space-y-2.5 relative z-10">
              <div className="h-14 w-14 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary shadow-xs">
                <Trophy className="h-7 w-7" />
              </div>

              <div className="space-y-1">
                <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Ваш итоговый результат</div>
                <div className="text-3xl font-black text-foreground">
                  {currentScore} <span className="text-sm font-normal text-muted-foreground">из {currentMaxScore} баллов</span>
                </div>
              </div>

              <Badge
                variant="outline"
                className={`text-xs px-3 py-1 font-bold border ${
                  scorePercent >= 75
                    ? "bg-primary/15 text-primary border-primary/30"
                    : scorePercent >= 50
                      ? "bg-primary/10 text-primary border-primary/20"
                      : "bg-destructive/10 text-destructive border-destructive/30"
                }`}
              >
                {scorePercent}% — {scorePercent >= 75 ? "Отличный результат!" : scorePercent >= 50 ? "Зачтено" : "Попробуйте ещё раз в следующий раз"}
              </Badge>

              {test.userSubmission?.submittedAt && (
                <div className="text-[11px] text-muted-foreground pt-1">
                  Сдано: {new Date(test.userSubmission.submittedAt).toLocaleString("ru-RU")}
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-3 pt-3 border-t relative z-10">
              <Link href="/dashboard/lms/tests">
                <Button size="xs" variant="outline" className="h-8 px-4 text-xs font-medium gap-1.5">
                  <ArrowLeft className="h-3.5 w-3.5" /> Вернуться к тестам
                </Button>
              </Link>
              <Link href="/dashboard/lms/materials">
                <Button size="xs" className="h-8 px-4 text-xs font-medium gap-1.5 shadow-xs">
                  <BookOpen className="h-3.5 w-3.5" /> Учебные материалы
                </Button>
              </Link>
            </div>
          </div>

          {/* Detailed Question Review Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-bold text-foreground flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-primary" /> Разбор вопросов и ответов
              </h2>
              <span className="text-[11px] text-muted-foreground">{test.questions.length} вопросов</span>
            </div>

            {test.questions.map((q, qIdx) => {
              const selectedVal = studentAnswers[q.id] || "";
              let selectedMultiple: string[] = [];
              if (q.type === "MULTIPLE") {
                try {
                  selectedMultiple = selectedVal ? JSON.parse(selectedVal) : [];
                } catch {
                  selectedMultiple = [];
                }
              }

              let isCorrect = false;
              if (q.correctAnswer) {
                if (q.type === "MULTIPLE") {
                  try {
                    const correctArr: string[] = JSON.parse(q.correctAnswer).map((s: string) => s.trim()).sort();
                    const studentArr: string[] = selectedMultiple.map((s: string) => s.trim()).sort();
                    isCorrect =
                      correctArr.length === studentArr.length &&
                      correctArr.every((val, idx) => val === studentArr[idx]);
                  } catch {}
                } else if (q.type === "TEXT") {
                  isCorrect = selectedVal.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
                } else {
                  isCorrect = selectedVal.trim() === q.correctAnswer.trim();
                }
              }

              return (
                <Card key={q.id} className="p-4 border shadow-none bg-card rounded-xl space-y-3">
                  <div className="flex items-start justify-between gap-2 border-b pb-2">
                    <div className="flex items-start gap-2">
                      <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                        {qIdx + 1}
                      </span>
                      <h3 className="text-xs font-bold text-foreground leading-snug">{q.questionText}</h3>
                    </div>

                    <Badge
                      variant="outline"
                      className={`text-[10px] border font-bold shrink-0 ${
                        isCorrect
                          ? "bg-primary/15 text-primary border-primary/30"
                          : "bg-destructive/10 text-destructive border-destructive/30"
                      }`}
                    >
                      {isCorrect ? `+${q.points} б.` : "0 б."}
                    </Badge>
                  </div>

                  <div className="space-y-2 pt-1">
                    {q.type === "TEXT" ? (
                      <div className="space-y-1">
                        <Input
                          placeholder="Ответ..."
                          disabled
                          value={selectedVal}
                          className="h-8 text-xs bg-background font-medium max-w-md"
                        />
                        {q.correctAnswer && (
                          <div className="text-[11px] text-muted-foreground pt-1">
                            Правильный ответ: <strong className="text-primary font-semibold">{q.correctAnswer}</strong>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((opt, optIdx) => {
                          const isSelected =
                            q.type === "MULTIPLE"
                              ? selectedMultiple.includes(opt)
                              : selectedVal === opt;

                          let isCorrectOpt = false;
                          if (q.correctAnswer) {
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
                              className={`p-2.5 rounded-lg border text-xs font-medium flex items-center justify-between ${
                                isCorrectOpt
                                  ? "bg-primary/15 border-primary/40 text-primary font-semibold"
                                  : isSelected
                                    ? "bg-destructive/10 border-destructive/30 text-destructive font-semibold"
                                    : "bg-background border-border text-muted-foreground opacity-60"
                              }`}
                            >
                              <span className="truncate flex-1 pr-2">{opt}</span>
                              <div
                                className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                                  isCorrectOpt
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : isSelected
                                      ? "bg-destructive text-destructive-foreground border-destructive"
                                      : "border-muted-foreground/30"
                                }`}
                              >
                                {isCorrectOpt ? (
                                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                                ) : isSelected ? (
                                  <X className="h-2.5 w-2.5 stroke-[3]" />
                                ) : null}
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
        </div>
      ) : (
        /* ACTIVE TEST TAKING / PREVIEW MODE */
        <div className="space-y-4">
          {/* Progress Bar / Questions Header */}
          {!isTeacherOrAdmin && (
            <div className="bg-card border p-3.5 rounded-xl space-y-2 shadow-xs">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <HelpCircle className="h-3.5 w-3.5 text-primary" /> Прогресс выполнения
                </span>
                <span className="text-primary font-bold">
                  Отвечено {answeredCount} из {totalQuestions} вопросов
                </span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300 rounded-full"
                  style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Active Questions List */}
          <div className="space-y-3">
            {test.questions.map((q, qIdx) => {
              const selectedVal = studentAnswers[q.id] || "";
              let selectedMultiple: string[] = [];
              if (q.type === "MULTIPLE") {
                try {
                  selectedMultiple = selectedVal ? JSON.parse(selectedVal) : [];
                } catch {
                  selectedMultiple = [];
                }
              }

              return (
                <Card key={q.id} className="p-4 border shadow-none bg-card rounded-xl space-y-3">
                  <div className="flex items-start justify-between gap-2 border-b pb-2">
                    <div className="flex items-start gap-2">
                      <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                        {qIdx + 1}
                      </span>
                      <h3 className="text-xs font-bold text-foreground leading-snug">{q.questionText}</h3>
                    </div>
                    <Badge variant="outline" className="text-[10px] border-primary/20 text-muted-foreground font-normal shrink-0">
                      {q.points} {q.points === 1 ? "балл" : "балла"}
                    </Badge>
                  </div>

                  {/* Option Inputs */}
                  <div className="space-y-2 pt-1">
                    {q.type === "TEXT" ? (
                      <div className="space-y-1">
                        <Input
                          placeholder={isTeacherOrAdmin ? "Пример ответа..." : "Введите ваш ответ..."}
                          disabled={isTeacherOrAdmin}
                          value={isTeacherOrAdmin ? q.correctAnswer || "" : selectedVal}
                          onChange={(e) => handleOptionSelect(q.id, e.target.value, "TEXT")}
                          className="h-8 text-xs bg-background font-medium max-w-md"
                        />
                        {isTeacherOrAdmin && q.correctAnswer && (
                          <div className="text-[11px] text-muted-foreground pt-1">
                            Правильный ответ: <strong className="text-primary font-semibold">{q.correctAnswer}</strong>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((opt, optIdx) => {
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
