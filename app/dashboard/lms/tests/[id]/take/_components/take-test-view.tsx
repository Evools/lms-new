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
} from "lucide-react";
import { submitTestAnswersAction } from "@/app/dashboard/lms/actions";

interface QuestionItem {
  id: string;
  type: "SINGLE" | "MULTIPLE" | "TEXT" | "TRUE_FALSE";
  questionText: string;
  options: string[];
  points: number;
}

interface TestTakeData {
  id: string;
  title: string;
  description: string;
  timeLimit?: number | null;
  subjectName: string;
  teacherName: string;
  questions: QuestionItem[];
  userSubmission?: {
    id: string;
    score: number;
    maxScore: number;
    submittedAt: string;
  } | null;
}

interface TakeTestViewProps {
  test: TestTakeData;
}

export function TakeTestView({ test }: TakeTestViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [studentAnswers, setStudentAnswers] = useState<Record<string, string>>({});
  const [testResult, setTestResult] = useState<{ score: number; maxScore: number } | null>(
    test.userSubmission ? { score: test.userSubmission.score, maxScore: test.userSubmission.maxScore } : null
  );

  // Timer logic (if timeLimit is set and not already submitted)
  const initialSeconds = test.timeLimit ? test.timeLimit * 60 : null;
  const [secondsLeft, setSecondsLeft] = useState<number | null>(initialSeconds);

  useEffect(() => {
    if (testResult || secondsLeft === null) return;
    if (secondsLeft <= 0) {
      handleSubmit();
      return;
    }
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft, testResult]);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleOptionSelect = (questionId: string, option: string, type: string) => {
    if (testResult || isPending) return;

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
    if (testResult || isPending) return;

    startTransition(async () => {
      const res = await submitTestAnswersAction({
        testId: test.id,
        answers: studentAnswers,
      });

      if (res.success) {
        toast.add({ title: "Тест успешно сдан!", type: "success" });
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

  return (
    <div className="space-y-4 w-full text-xs pb-12">
      {/* Top Header Bar */}
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
          {secondsLeft !== null && !isAlreadySubmitted && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/20 rounded-lg text-primary font-bold font-mono text-xs">
              <Clock className="h-3.5 w-3.5" />
              <span>{formatTimer(secondsLeft)}</span>
            </div>
          )}

          <Link href="/dashboard/lms/tests">
            <Button size="xs" variant="outline" className="h-7 text-xs gap-1">
              <ArrowLeft className="h-3 w-3" /> Назад к тестам
            </Button>
          </Link>
        </div>
      </div>

      {/* Test Result Screen Banner */}
      {isAlreadySubmitted && (
        <div className="p-4 rounded-xl border border-primary/30 bg-primary/10 space-y-2 text-xs shadow-xs">
          <div className="flex items-center justify-between">
            <div className="font-bold text-primary flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-5 w-5" /> Результаты тестирования
            </div>
            <Badge className="bg-primary text-primary-foreground text-xs px-2.5 py-0.5 font-bold">
              {testResult?.score ?? test.userSubmission?.score} из {testResult?.maxScore ?? test.userSubmission?.maxScore} баллов
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Вы уже прошли данный тест. Ответы сохранены в системе и отправлены преподавателю. Повторная сдача запрещена.
          </p>
        </div>
      )}

      {/* Progress Bar */}
      {!isAlreadySubmitted && (
        <div className="bg-card border p-3 rounded-xl space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-muted-foreground">Прогресс ответов:</span>
            <span className="text-primary font-bold">
              {answeredCount} из {totalQuestions} вопросов
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

      {/* Questions List */}
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

              {/* Question Answers */}
              <div className="space-y-2 pt-1">
                {q.type === "TEXT" ? (
                  <Input
                    placeholder="Введите ответ на вопрос..."
                    disabled={isAlreadySubmitted}
                    value={selectedVal}
                    onChange={(e) => handleOptionSelect(q.id, e.target.value, "TEXT")}
                    className="h-8 text-xs bg-background font-medium max-w-md"
                  />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options.map((opt, optIdx) => {
                      const isSelected =
                        q.type === "MULTIPLE"
                          ? selectedMultiple.includes(opt)
                          : selectedVal === opt;

                      return (
                        <div
                          key={optIdx}
                          onClick={() => handleOptionSelect(q.id, opt, q.type)}
                          className={`p-2.5 rounded-lg border text-xs font-medium cursor-pointer transition-all flex items-center justify-between ${
                            isSelected
                              ? "bg-primary/10 border-primary text-primary font-semibold shadow-xs"
                              : "bg-background hover:bg-muted/50 border-border text-foreground"
                          } ${isAlreadySubmitted ? "cursor-not-allowed opacity-90" : ""}`}
                        >
                          <span className="truncate flex-1 pr-2">{opt}</span>
                          <div
                            className={`h-4 w-4 rounded-full border flex items-center justify-center text-[9px] shrink-0 ${
                              isSelected
                                ? "bg-primary text-primary-foreground border-primary"
                                : "border-muted-foreground/40"
                            }`}
                          >
                            {isSelected && "✓"}
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

      {/* Bottom Submit Action */}
      {!isAlreadySubmitted && (
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
  );
}
