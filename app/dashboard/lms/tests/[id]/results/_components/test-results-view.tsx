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
  User,
  FileText,
  Users,
  Building2,
  Clock,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { resetTestSubmissionAction } from "@/app/dashboard/lms/actions";

interface QuestionDTO {
  id: string;
  type?: string;
  questionText: string;
  options: string[];
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
  answersMap: Record<
    string,
    { answer: string; isCorrect: boolean; pointsAwarded: number }
  >;
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
}

export function TestResultsView({
  test,
  questions,
  studentsResults,
}: TestResultsViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

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

  const submittedCount = studentsResults.filter((s) => s.hasSubmitted).length;
  const avgPercent =
    submittedCount > 0
      ? Math.round(
          studentsResults
            .filter((s) => s.hasSubmitted)
            .reduce((acc, s) => acc + s.percent, 0) / submittedCount
        )
      : 0;

  return (
    <TooltipProvider>
      <div className="space-y-4 w-full pb-10">
        {/* Header Navigation & Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3.5 rounded-xl border shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
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

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
            <Button
              size="xs"
              variant="outline"
              onClick={handleRefresh}
              disabled={isPending}
              className="h-8 text-xs gap-1.5 font-medium border-primary/30 text-primary hover:bg-primary/5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />
              Обновить статистику
            </Button>
          </div>
        </div>

        {/* Matrix Results Table */}
        <div className="border rounded-xl bg-card shadow-xs overflow-hidden">
          <div className="p-3 border-b bg-muted/30 flex items-center justify-between">
            <h2 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Матрица результатов
            </h2>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5 font-bold text-[#00C853]">
                <div className="w-4 h-4 rounded-full bg-[#00C853] text-white flex items-center justify-center">
                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                </div>
                Верно
              </span>
              <span className="flex items-center gap-1.5 font-bold text-[#FF2D55]">
                <div className="w-4 h-4 rounded-full bg-[#FF2D55] text-white flex items-center justify-center">
                  <X className="h-2.5 w-2.5 stroke-[3]" />
                </div>
                Ошибка
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <RotateCcw className="h-3.5 w-3.5" /> Сбросить попытку
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
                      : student.percent === 100
                        ? "bg-[#D1F7C4] text-[#0F6B20] border-[#0F6B20]/20 font-bold"
                        : student.percent >= 80
                          ? "bg-[#FFE6C7] text-[#9E4D00] border-[#9E4D00]/20 font-bold"
                          : "bg-[#FDE8E8] text-[#C81E1E] border-[#C81E1E]/20 font-bold";

                  const leftBorderStyle =
                    !student.hasSubmitted
                      ? "border-l-border"
                      : student.percent >= 80
                        ? "border-l-[#00C853]"
                        : "border-l-[#FF2D55]";

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
                            <span className="font-semibold text-foreground text-xs block truncate">
                              {student.studentName}
                            </span>
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

                              <span className="font-mono font-bold text-xs text-foreground min-w-[45px] text-right">
                                {student.score.toFixed(2)}
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

                        const tooltipAlign = qIdx <= 1 ? "start" : qIdx >= questions.length - 2 ? "end" : "center";

                        return (
                          <td
                            key={q.id}
                            className={`py-1.5 px-1 text-center border-r transition-colors ${
                              isCorrect
                                ? "bg-[#EEFBF4] hover:bg-[#E2F7EB]"
                                : "bg-[#FDE8E8] hover:bg-[#FCD8D8]"
                            }`}
                          >
                            <Tooltip>
                              <TooltipTrigger>
                                <div className="w-full h-7 flex items-center justify-center cursor-help">
                                  {isCorrect ? (
                                    <div className="w-5 h-5 rounded-full bg-[#00C853] text-white flex items-center justify-center shadow-2xs">
                                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                                    </div>
                                  ) : (
                                    <div className="w-5 h-5 rounded-full bg-[#FF2D55] text-white flex items-center justify-center shadow-2xs">
                                      <X className="h-3.5 w-3.5 stroke-[3]" />
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
                                          ? "bg-[#EEFBF4] text-[#00C853] border-[#00C853]/30"
                                          : "bg-[#FDE8E8] text-[#FF2D55] border-[#FF2D55]/30"
                                      }`}
                                    >
                                      {isCorrect ? (
                                        <>
                                          <Check className="h-3 w-3 stroke-[3]" /> Верно (+1 б.)
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
                                        isCorrect ? "text-[#00C853]" : "text-[#FF2D55]"
                                      }`}
                                    >
                                      {ansData.answer || "Нет ответа"}
                                    </span>
                                  </div>

                                  <div className="flex items-start gap-1">
                                    <span className="text-muted-foreground font-semibold shrink-0 flex items-center gap-1">
                                      <CheckCircle2 className="h-3 w-3 text-[#00C853] shrink-0" /> Верный ответ:
                                    </span>
                                    <span className="text-[#00C853] font-bold break-words">
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
