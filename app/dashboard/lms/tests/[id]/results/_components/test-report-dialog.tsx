"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Printer,
  FileText,
  Building2,
  BookOpen,
  User,
  Calendar,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Layers,
  Award,
  Sparkles,
  Download,
  X,
} from "lucide-react";

export interface QuestionDTO {
  id: string;
  type?: string;
  questionText: string;
  options: unknown;
  correctAnswer: string;
  points: number;
}

export interface StudentResultDTO {
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

export interface QuestionStatDTO {
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

interface TestReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  test: {
    id: string;
    title: string;
    description?: string;
    groupName: string;
    subjectName: string;
    teacherName?: string;
    timeLimit: number | null;
    totalMaxPoints: number;
  };
  questions: QuestionDTO[];
  studentsResults: StudentResultDTO[];
  questionStats?: QuestionStatDTO[];
}

export function formatCorrectAnswerText(
  type: string | undefined,
  correctAnswer: string,
  options?: unknown
): string {
  if (!correctAnswer) return "—";
  const qType = (type || "SINGLE").toUpperCase();

  // Try parsing options if provided
  let parsedOptions: Array<{ id?: string; text?: string; isCorrect?: boolean }> = [];
  if (Array.isArray(options)) {
    parsedOptions = options;
  } else if (typeof options === "string") {
    try {
      parsedOptions = JSON.parse(options);
    } catch {
      parsedOptions = [];
    }
  }

  if (qType === "MULTIPLE" || qType === "ORDERING" || qType === "BLANKS") {
    try {
      const parsed = JSON.parse(correctAnswer);
      if (Array.isArray(parsed)) {
        if (parsedOptions.length > 0) {
          const resolved = parsed.map((item) => {
            const found = parsedOptions.find(
              (o) => o.id === item || o.text === item || String(o) === String(item)
            );
            return found?.text || String(item);
          });
          return resolved.join("; ");
        }
        return parsed.join("; ");
      }
    } catch {}
  }

  if (qType === "NUMERICAL") {
    try {
      const parsed = JSON.parse(correctAnswer);
      if (typeof parsed === "object" && parsed !== null) {
        const val = parsed.value ?? parsed.val ?? parsed;
        const tol = parsed.tolerance ?? 0;
        return tol > 0 ? `${val} (±${tol})` : `${val}`;
      }
    } catch {}
  }

  if (qType === "MATCHING") {
    try {
      const parsed = JSON.parse(correctAnswer);
      if (typeof parsed === "object" && parsed !== null) {
        return Object.entries(parsed)
          .map(([k, v]) => `${k} → ${v}`)
          .join("; ");
      }
    } catch {}
  }

  // Resolve single choice text if option matching
  if (parsedOptions.length > 0) {
    const found = parsedOptions.find(
      (o) => o.id === correctAnswer || o.text === correctAnswer || String(o) === String(correctAnswer)
    );
    if (found?.text) {
      return found.text;
    }
  }

  return String(correctAnswer);
}

export function formatNameWithInitials(fullName?: string): string {
  if (!fullName) return "________________";
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "________________";
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) {
    return `${parts[0]} ${parts[1][0].toUpperCase()}.`;
  }
  return `${parts[0]} ${parts[1][0].toUpperCase()}.${parts[2][0].toUpperCase()}.`;
}

export function getGradeLabel(percent: number): {
  grade: number;
  label: string;
  badgeClass: string;
} {
  if (percent >= 85) {
    return { grade: 5, label: "5 (Отлично)", badgeClass: "text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30" };
  }
  if (percent >= 70) {
    return { grade: 4, label: "4 (Хорошо)", badgeClass: "text-blue-700 dark:text-blue-400 bg-blue-500/10 border-blue-500/30" };
  }
  if (percent >= 50) {
    return { grade: 3, label: "3 (Удовл.)", badgeClass: "text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/30" };
  }
  return { grade: 2, label: "2 (Неуд.)", badgeClass: "text-destructive bg-destructive/10 border-destructive/30" };
}

export function TestReportDialog({
  open,
  onOpenChange,
  test,
  questions,
  studentsResults,
  questionStats = [],
}: TestReportDialogProps) {
  const [includeAnswerKey, setIncludeAnswerKey] = useState(true);
  const [includeAcademicGrades, setIncludeAcademicGrades] = useState(true);
  const [includeQuestionStats, setIncludeQuestionStats] = useState(true);
  const [includeSignatures, setIncludeSignatures] = useState(true);

  const submittedStudents = studentsResults.filter((s) => s.hasSubmitted);
  const submittedCount = submittedStudents.length;
  const totalStudents = studentsResults.length;
  const turnoutPercent = totalStudents > 0 ? Math.round((submittedCount / totalStudents) * 100) : 0;

  const avgPercent =
    submittedCount > 0
      ? Math.round(submittedStudents.reduce((acc, s) => acc + s.percent, 0) / submittedCount)
      : 0;

  const avgScore =
    submittedCount > 0
      ? (submittedStudents.reduce((acc, s) => acc + s.score, 0) / submittedCount).toFixed(1)
      : "0";

  const handlePrint = () => {
    const printDoc = document.getElementById("printable-protocol-document");
    if (!printDoc) {
      window.print();
      return;
    }

    const existingFrame = document.getElementById("print-protocol-frame");
    if (existingFrame) {
      existingFrame.remove();
    }

    const iframe = document.createElement("iframe");
    iframe.id = "print-protocol-frame";
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.visibility = "hidden";
    document.body.appendChild(iframe);

    // Extract all stylesheets and style rules from parent document
    const stylesHtml = Array.from(document.querySelectorAll("link[rel='stylesheet'], style"))
      .map((el) => el.outerHTML)
      .join("\n");

    const frameDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (frameDoc) {
      frameDoc.open();
      frameDoc.write(`
        <!DOCTYPE html>
        <html class="${document.documentElement.className || "light"}" style="color-scheme: light;">
          <head>
            <meta charset="utf-8">
            <title>Протокол результатов тестирования - ${test.title}</title>
            ${stylesHtml}
            <style>
              @page {
                size: A4 portrait;
                margin: 10mm 10mm;
              }
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
                box-sizing: border-box;
              }
              html, body {
                background: #ffffff !important;
                color: #0f172a !important;
                margin: 0 !important;
                padding: 4px !important;
                width: 100% !important;
              }
              #printable-protocol-document {
                box-shadow: none !important;
                border: 1px solid #e2e8f0 !important;
                padding: 24px !important;
                background: #ffffff !important;
                max-width: 100% !important;
                width: 100% !important;
                margin: 0 auto !important;
              }
              .break-before-page {
                page-break-before: always;
                break-before: page;
              }
              .break-inside-avoid {
                page-break-inside: avoid;
                break-inside: avoid;
              }
              table {
                page-break-inside: auto;
              }
              tr {
                page-break-inside: avoid;
                break-inside: avoid;
              }
              thead {
                display: table-header-group;
              }
              .print\\:hidden {
                display: none !important;
              }
            </style>
          </head>
          <body class="bg-white text-foreground font-sans">
            <div id="printable-protocol-document" class="bg-card text-card-foreground p-6 rounded-xl border shadow-xs max-w-[850px] mx-auto space-y-6 font-sans text-xs">
              ${printDoc.innerHTML}
            </div>
          </body>
        </html>
      `);
      frameDoc.close();

      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          iframe.remove();
        }, 2000);
      }, 300);
      return;
    }

    window.print();
  };

  const currentDateFormatted = new Date().toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <style>{`
        @media print {
          html, body {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
          }
          body > * {
            display: none !important;
          }
          body > [data-slot="dialog-portal"],
          body > [data-slot="dialog-portal"] * {
            display: block !important;
            visibility: visible !important;
          }
          [data-slot="dialog-overlay"] {
            display: none !important;
          }
          [data-slot="dialog-content"] {
            position: static !important;
            display: block !important;
            max-width: 100% !important;
            max-height: none !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            transform: none !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
            inset: auto !important;
          }
          .print\\:hidden,
          [data-slot="dialog-close"] {
            display: none !important;
          }
          #printable-protocol-document {
            display: block !important;
            position: static !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            color: black !important;
            border: none !important;
            box-shadow: none !important;
          }
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          thead {
            display: table-header-group;
          }
        }
      `}</style>
      <DialogContent showCloseButton={false} className="p-0 gap-0 max-w-4xl w-[95vw] sm:max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-xs">
        {/* Modal Top Control Bar (Hidden on print) */}
        <div className="p-3.5 border-b bg-muted/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 print:hidden shrink-0">
          <div className="space-y-0.5 pr-2">
            <DialogTitle className="text-sm font-bold flex items-center gap-1.5 text-foreground">
              <Printer className="h-4 w-4 text-primary" /> Протокол результатов тестирования к ведомости
            </DialogTitle>
            <p className="text-[11px] text-muted-foreground">
              Официальный протокол с оценками и приложением с ключами правильных ответов для ведомости и отчетов
            </p>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end shrink-0">
            <Button
              size="xs"
              variant="default"
              onClick={handlePrint}
              className="h-8 px-3 text-xs gap-1.5 font-medium bg-primary text-primary-foreground shadow-xs"
            >
              <Printer className="h-3.5 w-3.5" /> Распечатать / Сохранить в PDF
            </Button>
            <Button
              size="xs"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground rounded-md"
              title="Закрыть окно"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Options Toolbar (Hidden on print) */}
        <div className="px-4 py-2.5 bg-card border-b flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground print:hidden shrink-0">
          <span className="font-semibold text-foreground flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-primary" /> Параметры бланка:
          </span>

          <label className="flex items-center gap-1.5 cursor-pointer hover:text-foreground transition-colors">
            <Switch
              checked={includeAnswerKey}
              onCheckedChange={setIncludeAnswerKey}
              className="scale-75 origin-left"
            />
            <span>Ключи и верные ответы</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer hover:text-foreground transition-colors">
            <Switch
              checked={includeAcademicGrades}
              onCheckedChange={setIncludeAcademicGrades}
              className="scale-75 origin-left"
            />
            <span>5-балльная шкала (5/4/3/2)</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer hover:text-foreground transition-colors">
            <Switch
              checked={includeQuestionStats}
              onCheckedChange={setIncludeQuestionStats}
              className="scale-75 origin-left"
            />
            <span>Статистика по вопросам</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer hover:text-foreground transition-colors">
            <Switch
              checked={includeSignatures}
              onCheckedChange={setIncludeSignatures}
              className="scale-75 origin-left"
            />
            <span>Блок подписей</span>
          </label>
        </div>

        {/* Scrollable Printable Document Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-muted/20">
          <div
            id="printable-protocol-document"
            className="bg-card text-card-foreground p-6 sm:p-8 rounded-xl border shadow-xs max-w-[850px] mx-auto space-y-6 font-sans text-xs"
          >
            {/* 1. Official Header */}
            <div className="border-b pb-4 space-y-3">
              <div className="text-center space-y-1">
                <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                  Учебно-методическая документация • Электронная ведомость
                </p>
                <h1 className="text-base font-bold text-foreground uppercase tracking-tight">
                  ПРОТОКОЛ РЕЗУЛЬТАТОВ КОМПЬЮТЕРНОГО ТЕСТИРОВАНИЯ
                </h1>
                <p className="text-xs font-semibold text-primary">
                  «{test.title}»
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs pt-2 text-muted-foreground">
                <div className="flex items-baseline gap-1">
                  <span className="font-semibold text-foreground min-w-[110px]">
                    Дисциплина:
                  </span>
                  <span className="font-medium text-foreground truncate">
                    {test.subjectName}
                  </span>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="font-semibold text-foreground min-w-[110px]">
                    Учебная группа:
                  </span>
                  <span className="font-medium text-foreground">
                    {test.groupName}
                  </span>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="font-semibold text-foreground min-w-[110px]">
                    Преподаватель:
                  </span>
                  <span className="font-medium text-foreground">
                    {test.teacherName || "—"}
                  </span>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="font-semibold text-foreground min-w-[110px]">
                    Дата формирования:
                  </span>
                  <span className="font-medium text-foreground">
                    {currentDateFormatted}
                  </span>
                </div>

                {test.timeLimit && (
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold text-foreground min-w-[110px]">
                      Лимит времени:
                    </span>
                    <span className="font-medium text-foreground">
                      {test.timeLimit} мин.
                    </span>
                  </div>
                )}

                <div className="flex items-baseline gap-1">
                  <span className="font-semibold text-foreground min-w-[110px]">
                    Максимальный балл:
                  </span>
                  <span className="font-bold text-foreground">
                    {test.totalMaxPoints} б.
                  </span>
                </div>
              </div>

              {/* Summary KPIs Row */}
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 bg-muted/40 rounded-lg border text-center text-xs">
                <div>
                  <div className="text-[10px] text-muted-foreground">Всего студентов</div>
                  <div className="font-bold text-sm text-foreground">{totalStudents} чел.</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground">Сдали тест (явка)</div>
                  <div className="font-bold text-sm text-foreground">
                    {submittedCount} ({turnoutPercent}%)
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground">Средний балл</div>
                  <div className="font-bold text-sm text-foreground">
                    {avgScore} / {test.totalMaxPoints}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground">Средний процент</div>
                  <div className="font-bold text-sm text-primary">{avgPercent}%</div>
                </div>
              </div>
            </div>

            {/* 2. Students Results Table */}
            <div className="space-y-2">
              <h2 className="font-bold text-xs uppercase tracking-wide text-foreground flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-primary" />
                1. Сводная ведомость результатов студентов
              </h2>

              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/60 text-[10px] font-bold text-foreground uppercase border-b">
                      <th className="py-2 px-2.5 text-center w-8 border-r">№</th>
                      <th className="py-2 px-3 border-r">ФИО Студента</th>
                      <th className="py-2 px-2 text-center border-r w-24">Статус</th>
                      <th className="py-2 px-2 text-center border-r w-20">Баллы</th>
                      <th className="py-2 px-2 text-center border-r w-16">%</th>
                      {includeAcademicGrades && (
                        <th className="py-2 px-2 text-center border-r w-28">
                          Оценка
                        </th>
                      )}
                      <th className="py-2 px-2 text-center w-32">Дата сдачи</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentsResults.map((s, idx) => {
                      const grade = getGradeLabel(s.percent);

                      return (
                        <tr
                          key={s.studentId}
                          className="border-b last:border-b-0 hover:bg-muted/20"
                        >
                          <td className="py-1.5 px-2 text-center font-mono text-[11px] border-r text-muted-foreground">
                            {idx + 1}
                          </td>
                          <td className="py-1.5 px-3 font-medium text-foreground border-r">
                            {s.studentName}
                            {s.tabSwitches && s.tabSwitches > 0 ? (
                              <span className="ml-1.5 text-[10px] text-destructive font-normal">
                                ({s.tabSwitches} перекл.)
                              </span>
                            ) : null}
                          </td>
                          <td className="py-1.5 px-2 text-center border-r">
                            {s.hasSubmitted ? (
                              <span className="text-[10px] text-emerald-600 font-semibold">
                                Сдано
                              </span>
                            ) : (
                              <span className="text-[10px] text-muted-foreground italic">
                                Не сдавал
                              </span>
                            )}
                          </td>
                          <td className="py-1.5 px-2 text-center font-mono font-bold border-r text-foreground">
                            {s.hasSubmitted ? s.score.toFixed(1) : "—"}
                          </td>
                          <td className="py-1.5 px-2 text-center font-mono border-r text-foreground">
                            {s.hasSubmitted ? `${s.percent}%` : "—"}
                          </td>
                          {includeAcademicGrades && (
                            <td className="py-1.5 px-2 text-center border-r">
                              {s.hasSubmitted ? (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${grade.badgeClass}`}>
                                  {grade.label}
                                </span>
                              ) : (
                                <span className="text-[10px] text-muted-foreground">—</span>
                              )}
                            </td>
                          )}
                          <td className="py-1.5 px-2 text-center text-[10px] text-muted-foreground">
                            {s.submittedAt
                              ? new Date(s.submittedAt).toLocaleDateString("ru-RU", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. Attachment: Question Specification & Answer Key */}
            {includeAnswerKey && (
              <div className="space-y-2 pt-4 break-before-page">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-xs uppercase tracking-wide text-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                    2. Приложение к ведомости: Спецификация и ключ верных ответов
                  </h2>
                  <span className="text-[10px] text-muted-foreground">
                    Всего заданий: {questions.length} • Макс. сумма: {test.totalMaxPoints} б.
                  </span>
                </div>

                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-muted/60 text-[10px] font-bold text-foreground uppercase border-b">
                        <th className="py-2 px-2 text-center w-8 border-r">№</th>
                        <th className="py-2 px-3 border-r min-w-[200px]">Текст вопроса</th>
                        <th className="py-2 px-2 text-center border-r w-24">Тип задания</th>
                        <th className="py-2 px-3 border-r min-w-[160px]">
                          Эталонный верный ответ
                        </th>
                        <th className="py-2 px-2 text-center border-r w-14">Балл</th>
                        {includeQuestionStats && (
                          <th className="py-2 px-2 text-center w-20">Решаемость</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {questions.map((q, idx) => {
                        const stat = questionStats.find((s) => s.questionId === q.id);
                        const answerText = formatCorrectAnswerText(q.type, q.correctAnswer, q.options);
                        const qTypeLabel =
                          q.type === "MULTIPLE"
                            ? "Множественный"
                            : q.type === "NUMERICAL"
                              ? "Числовой"
                              : q.type === "TEXT"
                                ? "Текстовый"
                                : q.type === "ORDERING"
                                  ? "Порядок"
                                  : q.type === "MATCHING"
                                    ? "Сопоставление"
                                    : "Одиночный выбор";

                        return (
                          <tr
                            key={q.id}
                            className="border-b last:border-b-0 align-top hover:bg-muted/20"
                          >
                            <td className="py-2 px-2 text-center font-mono font-bold text-[11px] border-r text-foreground">
                              {idx + 1}
                            </td>
                            <td className="py-2 px-3 border-r text-foreground leading-relaxed">
                              {q.questionText}
                            </td>
                            <td className="py-2 px-2 text-center text-[10px] text-muted-foreground border-r">
                              {qTypeLabel}
                            </td>
                            <td className="py-2 px-3 font-semibold text-primary border-r leading-relaxed break-words">
                              {answerText}
                            </td>
                            <td className="py-2 px-2 text-center font-mono font-bold border-r text-foreground">
                              {q.points}
                            </td>
                            {includeQuestionStats && (
                              <td className="py-2 px-2 text-center font-mono text-[11px] text-foreground">
                                {stat ? `${stat.accuracyPercent}%` : "—"}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 4. Official Signatures Block */}
            {includeSignatures && (
              <div className="pt-6 border-t space-y-4 break-inside-avoid">
                <div className="grid grid-cols-2 gap-8 text-xs">
                  <div className="space-y-2">
                    <div className="text-muted-foreground font-medium">Преподаватель:</div>
                    <div className="flex items-end justify-between border-b border-foreground/60 pb-1 pt-3 gap-2">
                      <span className="text-[10px] text-muted-foreground shrink-0">Подпись: ____________</span>
                      <span className="font-semibold text-foreground font-mono text-[11px] truncate">
                        / {formatNameWithInitials(test.teacherName)} /
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-muted-foreground font-medium">Заведующий кафедрой / отделением:</div>
                    <div className="flex items-end justify-between border-b border-foreground/60 pb-1 pt-3 gap-2">
                      <span className="text-[10px] text-muted-foreground shrink-0">Подпись: ____________</span>
                      <span className="font-semibold text-foreground font-mono text-[11px] truncate">
                        / ________________ /
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-center text-muted-foreground pt-3 border-t border-border/50">
                  Документ сгенерирован автоматически системой LMS • Дата: {currentDateFormatted}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Bottom Footer (Hidden on print) */}
        <div className="p-3 border-t bg-muted/30 flex items-center justify-between gap-2 print:hidden shrink-0">
          <span className="text-[11px] text-muted-foreground">
            Совет: В окне печати выберите <strong>«Сохранить как PDF»</strong> или отправьте на принтер
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="xs"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-7 px-3 text-xs"
            >
              Закрыть
            </Button>
            <Button
              size="xs"
              variant="default"
              onClick={handlePrint}
              className="h-7 px-3 text-xs gap-1.5 font-medium bg-primary text-primary-foreground"
            >
              <Printer className="h-3.5 w-3.5" /> Печать
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
