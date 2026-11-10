"use client";

import React, { useState, useEffect, useTransition } from "react";
import { SubmissionStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  CheckCircle2,
  Clock,
  ExternalLink,
  Check,
  XCircle,
  Copy,
  ArrowRight,
  CheckCheck,
  Star,
  ChevronDown,
  Download,
} from "lucide-react";
import { AssignmentDTO, SubmissionDTO, reviewSubmissionAction } from "../actions";
import { SubmissionContentDisplay } from "./submission-content-display";
import { getResourceMeta } from "@/lib/resource-utils";

interface TeacherReviewDialogProps {
  assignment: AssignmentDTO | null;
  onClose: () => void;
  onReviewSuccess: () => void;
  onSubmissionReviewed?: (
    assignmentId: string,
    submissionId: string,
    status: SubmissionStatus,
    teacherComment?: string,
    grade?: number | null
  ) => void;
}

type ReviewStatusFilter = "ALL" | "SUBMITTED" | "ACCEPTED" | "NEED_REVISION";

const PRESET_FEEDBACKS = [
  {
    badge: "Отлично",
    label: "Зачтено! Отличная работа",
    text: "Зачтено! Отличная работа, всё выполнено верно и в полном объёме.",
  },
  {
    badge: "Всё верно",
    label: "Корректно и аккуратно",
    text: "Всё выполнено корректно и аккуратно. Задание принято.",
  },
  {
    badge: "На доработку",
    label: "Требуются исправления",
    text: "Требуется исправить замечания и прислать решение на повторную проверку.",
  },
  {
    badge: "Нет доступа",
    label: "Проблема с доступом к ссылке",
    text: "Не удаётся открыть ссылку/файл. Пожалуйста, откройте права доступа.",
  },
  {
    badge: "Неполное",
    label: "Неполное решение",
    text: "Решение неполное. Пожалуйста, выполните все пункты технического задания.",
  },
];

export function TeacherReviewDialog({
  assignment,
  onClose,
  onReviewSuccess,
  onSubmissionReviewed,
}: TeacherReviewDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [submissions, setSubmissions] = useState<SubmissionDTO[]>([]);
  const [reviewFilter, setReviewFilter] = useState<ReviewStatusFilter>("SUBMITTED");
  const [submissionSearch, setSubmissionSearch] = useState<string>("");
  const [activeSubmissionId, setActiveSubmissionId] = useState<string | null>(null);
  const [reviewTeacherCommentMap, setReviewTeacherCommentMap] = useState<Record<string, string>>({});
  const [reviewGradeMap, setReviewGradeMap] = useState<Record<string, number | null>>({});
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);

  useEffect(() => {
    if (!assignment) return;
    setSubmissions(assignment.submissions);
    const initialComments: Record<string, string> = {};
    const initialGrades: Record<string, number | null> = {};
    assignment.submissions.forEach((s) => {
      initialComments[s.id] = s.teacherComment || "";
      initialGrades[s.id] = s.grade ?? null;
    });
    setReviewTeacherCommentMap(initialComments);
    setReviewGradeMap(initialGrades);

    const pendingSub = assignment.submissions.find(
      (s) => s.status === SubmissionStatus.SUBMITTED
    );
    if (pendingSub) {
      setReviewFilter("SUBMITTED");
      setActiveSubmissionId(pendingSub.id);
    } else {
      setReviewFilter("ALL");
      setActiveSubmissionId(assignment.submissions[0]?.id || null);
    }
  }, [assignment]);

  if (!assignment) return null;

  const submittedCount = submissions.filter(
    (s) => s.status === SubmissionStatus.SUBMITTED
  ).length;
  const acceptedCount = submissions.filter(
    (s) => s.status === SubmissionStatus.ACCEPTED
  ).length;
  const needRevisionCount = submissions.filter(
    (s) => s.status === SubmissionStatus.NEED_REVISION
  ).length;

  const getFilteredSubmissions = (subsList: SubmissionDTO[] = submissions): SubmissionDTO[] => {
    return subsList.filter((sub) => {
      const matchesSearch =
        !submissionSearch ||
        sub.studentName.toLowerCase().includes(submissionSearch.toLowerCase());
      if (!matchesSearch) return false;

      if (reviewFilter === "SUBMITTED") return sub.status === SubmissionStatus.SUBMITTED;
      if (reviewFilter === "ACCEPTED") return sub.status === SubmissionStatus.ACCEPTED;
      if (reviewFilter === "NEED_REVISION") return sub.status === SubmissionStatus.NEED_REVISION;
      return true;
    });
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleReviewSubmission = (submissionId: string, status: SubmissionStatus) => {
    const teacherComment = reviewTeacherCommentMap[submissionId] || "";
    const grade = reviewGradeMap[submissionId] ?? null;

    const prevSubmissions = submissions;
    const currentFiltered = getFilteredSubmissions(submissions);
    const currentIndex = currentFiltered.findIndex((s) => s.id === submissionId);

    // Calculate next active submission ID for conveyor workflow
    let nextActiveId: string | null = activeSubmissionId;
    if (reviewFilter === "SUBMITTED") {
      const remaining = currentFiltered.filter((s) => s.id !== submissionId);
      if (remaining.length > 0) {
        nextActiveId = (remaining[currentIndex] || remaining[remaining.length - 1]).id;
      } else {
        nextActiveId = null;
      }
    } else if (currentIndex !== -1 && currentIndex < currentFiltered.length - 1) {
      nextActiveId = currentFiltered[currentIndex + 1].id;
    }

    // Optimistic local state update in dialog
    const updatedSubmissions = submissions.map((sub) =>
      sub.id === submissionId
        ? {
            ...sub,
            status,
            teacherComment,
            grade,
            reviewedAt: new Date().toISOString(),
          }
        : sub
    );
    setSubmissions(updatedSubmissions);
    if (nextActiveId !== activeSubmissionId) {
      setActiveSubmissionId(nextActiveId);
    }

    // Real-time parent update
    if (assignment) {
      onSubmissionReviewed?.(
        assignment.id,
        submissionId,
        status,
        teacherComment,
        grade
      );
    }

    if (status === SubmissionStatus.NEED_REVISION) {
      toast.add({ title: "Работа отправлена на доработку!", type: "info" });
    } else if (status === SubmissionStatus.ACCEPTED) {
      toast.add({ title: "Работа успешно принята!", type: "success" });
    }

    startTransition(async () => {
      const res = await reviewSubmissionAction({
        submissionId,
        status,
        teacherComment,
        grade,
      });

      if (res.success) {
        onReviewSuccess();
      } else {
        // Rollback on server error
        setSubmissions(prevSubmissions);
        toast.add({
          title: res.error || "Ошибка при сохранении результата",
          type: "error",
        });
      }
    });
  };

  const handleFilterChange = (newFilter: ReviewStatusFilter) => {
    setReviewFilter(newFilter);
    const nextList = submissions.filter((sub) => {
      const matchesSearch =
        !submissionSearch ||
        sub.studentName.toLowerCase().includes(submissionSearch.toLowerCase());
      if (!matchesSearch) return false;

      if (newFilter === "SUBMITTED") return sub.status === SubmissionStatus.SUBMITTED;
      if (newFilter === "ACCEPTED") return sub.status === SubmissionStatus.ACCEPTED;
      if (newFilter === "NEED_REVISION") return sub.status === SubmissionStatus.NEED_REVISION;
      return true;
    });
    setActiveSubmissionId(nextList[0]?.id || null);
  };

  const filteredSubmissions = getFilteredSubmissions();

  return (
    <Dialog open={assignment !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-4 gap-3 text-xs sm:max-w-[1240px] w-[95vw] h-[88vh] max-h-[900px] flex flex-col overflow-hidden">
        <DialogHeader className="pb-2 border-b gap-1 place-items-start text-left pr-8 shrink-0">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-[10px] border-primary/30 text-primary bg-primary/5 font-semibold"
            >
              {assignment.subjectName}
            </Badge>
            <span className="text-[11px] text-muted-foreground">
              Всего в группе: {assignment.totalStudents} чел.
            </span>
          </div>
          <DialogTitle className="text-sm font-bold text-foreground pt-0.5">
            Кабинет проверки: {assignment.title}
          </DialogTitle>
        </DialogHeader>

        {/* Filter Tabs Header & View Switcher */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b pb-2.5 shrink-0">
          <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border text-xs shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => handleFilterChange("SUBMITTED")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                reviewFilter === "SUBMITTED"
                  ? "bg-background text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              На проверке ({submittedCount})
            </button>

            <button
              type="button"
              onClick={() => handleFilterChange("ACCEPTED")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                reviewFilter === "ACCEPTED"
                  ? "bg-background text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Принято ({acceptedCount})
            </button>

            <button
              type="button"
              onClick={() => handleFilterChange("NEED_REVISION")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                reviewFilter === "NEED_REVISION"
                  ? "bg-background text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              На доработке ({needRevisionCount})
            </button>

            <button
              type="button"
              onClick={() => handleFilterChange("ALL")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                reviewFilter === "ALL"
                  ? "bg-background text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Все ({submissions.length})
            </button>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium shrink-0 pt-1 sm:pt-0">
            <span>Проверено:</span>
            <span className="font-semibold text-foreground">
              {acceptedCount}/{submissions.length}
            </span>
            <div className="w-20 bg-muted/80 h-2 rounded-full overflow-hidden border ml-1">
              <div
                className="bg-primary h-full transition-all duration-300"
                style={{
                  width: `${
                    submissions.length > 0
                      ? Math.round((acceptedCount / submissions.length) * 100)
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Conveyor Workflow (Queue on Left, Workspace on Right) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 py-1 flex-1 min-h-0 overflow-hidden">
            {/* Left Sidebar: Queue of Students */}
            <div className="md:col-span-4 lg:col-span-3 border rounded-xl p-2.5 bg-muted/20 flex flex-col h-full min-h-0 space-y-2">
              <div className="relative shrink-0">
                <Search className="h-3 w-3 absolute left-2 top-2.5 text-muted-foreground" />
                <Input
                  placeholder="Студент..."
                  value={submissionSearch}
                  onChange={(e) => setSubmissionSearch(e.target.value)}
                  className="h-7 text-[11px] pl-7 bg-background"
                />
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto space-y-1 pr-0.5">
                {filteredSubmissions.map((sub) => {
                  const isActive = activeSubmissionId === sub.id;
                  return (
                    <div
                      key={sub.id}
                      onClick={() => setActiveSubmissionId(sub.id)}
                      className={`p-2 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between gap-1.5 ${
                        isActive
                          ? "border-primary bg-primary/10 text-primary font-medium"
                          : "border-border bg-card hover:bg-muted/40 text-foreground font-medium"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px] shrink-0">
                          {sub.studentName ? sub.studentName[0].toUpperCase() : "С"}
                        </div>
                        <span className="truncate text-[11px]">{sub.studentName}</span>
                      </div>

                      <div
                        className={`h-2 w-2 rounded-full shrink-0 ${
                          sub.status === SubmissionStatus.ACCEPTED
                            ? "bg-primary"
                            : sub.status === SubmissionStatus.NEED_REVISION
                              ? "bg-destructive"
                              : "bg-primary/50 animate-pulse"
                        }`}
                      />
                    </div>
                  );
                })}

                {filteredSubmissions.length === 0 && (
                  <div className="py-6 text-center text-muted-foreground text-[11px]">
                    По данному фильтру студенты не найдены
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel: Focused Active Student Card */}
            <div className="md:col-span-8 lg:col-span-9 border rounded-xl bg-card flex flex-col h-full min-h-0 overflow-hidden">
              {(() => {
                const activeSub =
                  filteredSubmissions.find((s) => s.id === activeSubmissionId) ||
                  filteredSubmissions[0];

                if (!activeSub) {
                  return (
                    <div className="h-full min-h-[260px] flex flex-col items-center justify-center text-center text-muted-foreground text-xs space-y-2 my-auto p-4">
                      <CheckCheck className="h-10 w-10 text-primary/40 mx-auto" />
                      <p className="font-bold text-foreground">
                        В этой категории все работы проверены!
                      </p>
                      <p className="text-[11px]">
                        Выберите другой фильтр сверху или вернитесь к списку
                      </p>
                    </div>
                  );
                }

                return (
                  <>
                    {/* Fixed Active Student Header Bar */}
                    <div className="flex items-center justify-between gap-2 p-3 border-b bg-card shrink-0">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                          {activeSub.studentName
                            ? activeSub.studentName[0].toUpperCase()
                            : "С"}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-foreground text-xs truncate">
                            {activeSub.studentName}
                          </div>
                          <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span>
                              Сдано:{" "}
                              {new Date(activeSub.submittedAt).toLocaleString("ru-RU")}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-semibold border px-2 py-0.5 ${
                            activeSub.status === SubmissionStatus.ACCEPTED
                              ? "bg-primary/15 text-primary border-primary/30"
                              : activeSub.status === SubmissionStatus.NEED_REVISION
                                ? "bg-destructive/10 text-destructive border-destructive/30"
                                : "bg-muted/60 text-muted-foreground border-border/50"
                          }`}
                        >
                          {activeSub.status === SubmissionStatus.ACCEPTED
                            ? "Принято"
                            : activeSub.status === SubmissionStatus.NEED_REVISION
                              ? "На доработке"
                              : "На проверке"}
                        </Badge>
                      </div>
                    </div>

                    {/* Scrollable Middle Solution Area */}
                    <div className="p-3.5 space-y-3 flex-1 min-h-0 overflow-y-auto">
                      {/* Submitted Link / File Box */}
                      {activeSub.fileUrl && (() => {
                        const meta = getResourceMeta(activeSub.fileUrl);
                        return (
                          <div className="p-2.5 rounded-xl border bg-muted/30 space-y-1.5">
                            <div className="text-[10px] font-semibold text-muted-foreground flex items-center justify-between">
                              <span>Прикрепленное решение студента:</span>
                              <button
                                type="button"
                                onClick={() => handleCopyUrl(activeSub.fileUrl || "")}
                                className="text-primary hover:underline text-[10px] flex items-center gap-1 cursor-pointer"
                              >
                                <Copy className="h-3 w-3" />{" "}
                                {copiedUrl ? "Скопировано!" : "Скопировать"}
                              </button>
                            </div>

                            <div className="flex items-center gap-2">
                              <a
                                href={activeSub.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-between gap-2 text-xs bg-background hover:bg-muted/40 p-2 rounded-lg border border-border transition-all flex-1 min-w-0"
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <div className="p-1 rounded-md bg-muted text-primary shrink-0">
                                    {meta.icon}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <span className="font-semibold text-foreground text-xs truncate" title={meta.title}>
                                        {meta.title}
                                      </span>
                                      <Badge variant="secondary" className="text-[9px] px-1 py-0 font-normal shrink-0">
                                        {meta.badge}
                                      </Badge>
                                    </div>
                                    <div className="text-[10px] text-muted-foreground truncate" title={meta.subtitle}>
                                      {meta.subtitle}
                                    </div>
                                  </div>
                                </div>
                                <div className="p-1 text-primary shrink-0">
                                  {meta.isDownloadable ? (
                                    <Download className="h-4 w-4" />
                                  ) : (
                                    <ExternalLink className="h-4 w-4" />
                                  )}
                                </div>
                              </a>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Multi-File Code / Solution Display */}
                      <SubmissionContentDisplay submission={activeSub} />
                    </div>

                    {/* Fixed Dedicated Review & Grading Bar (Always in view!) */}
                    <div className="p-3 border-t bg-muted/20 shrink-0 space-y-2.5">
                      {/* Top Row: Star Grade (left) + Preset Templates (right) */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        {/* Grade Selector (1–5) */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-xs font-medium text-foreground flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 fill-primary text-primary" /> Оценка:
                          </span>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((g) => {
                              const selected = reviewGradeMap[activeSub.id] === g;
                              return (
                                <button
                                  key={g}
                                  type="button"
                                  onClick={() =>
                                    setReviewGradeMap((prev) => ({
                                      ...prev,
                                      [activeSub.id]: selected ? null : g,
                                    }))
                                  }
                                  className={`h-7 w-7 rounded-md text-xs font-bold border transition-all cursor-pointer ${
                                    selected
                                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                                      : "bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                                  }`}
                                >
                                  {g}
                                </button>
                              );
                            })}
                            {reviewGradeMap[activeSub.id] != null && (
                              <button
                                type="button"
                                onClick={() =>
                                  setReviewGradeMap((prev) => ({
                                    ...prev,
                                    [activeSub.id]: null,
                                  }))
                                }
                                className="text-[11px] text-muted-foreground hover:text-destructive px-1 cursor-pointer ml-0.5"
                              >
                                сбросить
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Quick Preset Feedback Templates */}
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-[11px] text-muted-foreground font-medium shrink-0">
                            Шаблоны:
                          </span>
                          <div className="flex items-center gap-1 flex-wrap">
                            {PRESET_FEEDBACKS.slice(0, 3).map((tmpl, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() =>
                                  setReviewTeacherCommentMap((prev) => ({
                                    ...prev,
                                    [activeSub.id]: tmpl.text,
                                  }))
                                }
                                className="text-[11px] bg-background hover:bg-primary/10 hover:text-primary hover:border-primary/40 px-2 py-0.5 rounded-md border border-border text-foreground transition-colors font-medium cursor-pointer"
                                title={tmpl.text}
                              >
                                {tmpl.badge}
                              </button>
                            ))}

                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={
                                  <Button
                                    type="button"
                                    size="xs"
                                    variant="outline"
                                    className="h-6 px-2 text-[11px] gap-1 font-medium border-border hover:bg-muted/60"
                                  />
                                }
                              >
                                <span>Ещё...</span>
                                <ChevronDown className="h-3 w-3 text-muted-foreground" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-80 text-xs p-1">
                                <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                  Готовые шаблоны рецензий
                                </div>
                                {PRESET_FEEDBACKS.map((tmpl, idx) => (
                                  <DropdownMenuItem
                                    key={idx}
                                    onClick={() =>
                                      setReviewTeacherCommentMap((prev) => ({
                                        ...prev,
                                        [activeSub.id]: tmpl.text,
                                      }))
                                    }
                                    className="py-1.5 px-2 cursor-pointer flex flex-col items-start gap-0.5 rounded-md"
                                  >
                                    <div className="flex items-center justify-between w-full">
                                      <span className="font-medium text-foreground text-xs">{tmpl.label}</span>
                                      <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                        {tmpl.badge}
                                      </span>
                                    </div>
                                    <span className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                                      {tmpl.text}
                                    </span>
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>

                      {/* Middle: Comfortable Multi-line Textarea */}
                      <div>
                        <Textarea
                          rows={4}
                          placeholder="Напишите замечание или рецензию для студента (или выберите шаблон выше)..."
                          value={reviewTeacherCommentMap[activeSub.id] || ""}
                          onChange={(e) =>
                            setReviewTeacherCommentMap((prev) => ({
                              ...prev,
                              [activeSub.id]: e.target.value,
                            }))
                          }
                          className="w-full text-xs bg-background min-h-[110px] max-h-[220px] resize-y p-3 rounded-lg border border-border focus-visible:border-primary leading-relaxed"
                        />
                      </div>

                      {/* Bottom Row: Status Indicator & Action Buttons */}
                      <div className="flex items-center justify-between pt-0.5">
                        <div className="text-[11px] text-muted-foreground">
                          {reviewGradeMap[activeSub.id] ? (
                            <span className="text-primary font-medium">
                              Оценка: {reviewGradeMap[activeSub.id]}
                            </span>
                          ) : (
                            <span>Без оценки</span>
                          )}
                        </div>

                        {activeSub.status === SubmissionStatus.ACCEPTED ? (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Button
                              size="xs"
                              variant="outline"
                              disabled={isPending}
                              onClick={() =>
                                handleReviewSubmission(
                                  activeSub.id,
                                  SubmissionStatus.NEED_REVISION
                                )
                              }
                              className="h-8 text-xs gap-1 border-destructive/30 text-destructive hover:bg-destructive/10 font-medium px-3"
                            >
                              <XCircle className="h-3.5 w-3.5" /> На доработку
                            </Button>
                            <Button
                              size="xs"
                              variant="outline"
                              disabled={isPending}
                              onClick={() =>
                                handleReviewSubmission(activeSub.id, SubmissionStatus.ACCEPTED)
                              }
                              className="h-8 text-xs gap-1 font-medium border-primary/30 text-primary hover:bg-primary/10 px-3"
                            >
                              <Check className="h-3.5 w-3.5" /> Обновить
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Button
                              size="xs"
                              variant="outline"
                              disabled={isPending}
                              onClick={() =>
                                handleReviewSubmission(
                                  activeSub.id,
                                  SubmissionStatus.NEED_REVISION
                                )
                              }
                              className="h-8 text-xs gap-1 border-destructive/30 text-destructive hover:bg-destructive/10 font-medium px-3"
                            >
                              <XCircle className="h-3.5 w-3.5" /> На доработку
                            </Button>

                            <Button
                              size="xs"
                              disabled={isPending}
                              onClick={() =>
                                handleReviewSubmission(
                                  activeSub.id,
                                  SubmissionStatus.ACCEPTED
                                )
                              }
                              className="h-8 text-xs gap-1.5 font-medium px-3.5 shadow-xs"
                            >
                              <Check className="h-3.5 w-3.5" /> Принять и дальше{" "}
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

        <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
          <Button size="xs" variant="outline" onClick={onClose}>
            Закрыть
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
