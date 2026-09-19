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
  ClipboardList,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { AssignmentDTO, SubmissionDTO, reviewSubmissionAction } from "../actions";
import { SubmissionContentDisplay } from "./submission-content-display";

interface TeacherReviewDialogProps {
  assignment: AssignmentDTO | null;
  onClose: () => void;
  onReviewSuccess: () => void;
}

type ReviewStatusFilter = "ALL" | "SUBMITTED" | "ACCEPTED" | "NEED_REVISION";

const PRESET_FEEDBACKS = [
  "Зачтено! Отличная работа.",
  "Всё выполнено корректно и аккуратно.",
  "Требуется исправить замечания и пересдать.",
  "Не удаётся открыть ссылку. Пожалуйста, проверьте права доступа.",
];

export function TeacherReviewDialog({
  assignment,
  onClose,
  onReviewSuccess,
}: TeacherReviewDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [reviewFilter, setReviewFilter] = useState<ReviewStatusFilter>("SUBMITTED");
  const [reviewViewMode, setReviewViewMode] = useState<"focus" | "list">("focus");
  const [submissionSearch, setSubmissionSearch] = useState<string>("");
  const [activeSubmissionId, setActiveSubmissionId] = useState<string | null>(null);
  const [reviewTeacherCommentMap, setReviewTeacherCommentMap] = useState<Record<string, string>>({});
  const [reviewGradeMap, setReviewGradeMap] = useState<Record<string, number | null>>({});
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);

  useEffect(() => {
    if (!assignment) return;
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

  const getFilteredSubmissions = (): SubmissionDTO[] => {
    return assignment.submissions.filter((sub) => {
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

    startTransition(async () => {
      const res = await reviewSubmissionAction({
        submissionId,
        status,
        teacherComment,
        grade,
      });

      if (res.success) {
        toast.add({ title: "Результат проверки сохранён!", type: "success" });

        // Auto advance to next student submission in current filtered queue
        const currentList = getFilteredSubmissions();
        const currentIndex = currentList.findIndex((s) => s.id === submissionId);
        if (currentIndex !== -1 && currentIndex < currentList.length - 1) {
          setActiveSubmissionId(currentList[currentIndex + 1].id);
        }

        onReviewSuccess();
      } else {
        toast.add({ title: res.error || "Ошибка при сохранении результата", type: "error" });
      }
    });
  };

  const filteredSubmissions = getFilteredSubmissions();

  return (
    <Dialog open={assignment !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-4 gap-3 text-xs sm:max-w-[1240px] w-[95vw] max-h-[92vh] overflow-y-auto">
        <DialogHeader className="pb-2 border-b gap-1 place-items-start text-left pr-8">
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b pb-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setReviewFilter("SUBMITTED")}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 cursor-pointer ${
                reviewFilter === "SUBMITTED"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              На проверке (
              {
                assignment.submissions.filter(
                  (s) => s.status === SubmissionStatus.SUBMITTED
                ).length
              }
              )
            </button>

            <button
              type="button"
              onClick={() => setReviewFilter("ACCEPTED")}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 cursor-pointer ${
                reviewFilter === "ACCEPTED"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              Принято ({assignment.acceptedCount})
            </button>

            <button
              type="button"
              onClick={() => setReviewFilter("NEED_REVISION")}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 cursor-pointer ${
                reviewFilter === "NEED_REVISION"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              На доработке ({assignment.needRevisionCount})
            </button>

            <button
              type="button"
              onClick={() => setReviewFilter("ALL")}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                reviewFilter === "ALL"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              Все ({assignment.submissions.length})
            </button>
          </div>

          {/* View Switcher & Progress Bar */}
          <div className="flex items-center gap-3 shrink-0 pt-1 sm:pt-0">
            {/* Focus / List View Switcher */}
            <div className="flex items-center p-0.5 bg-muted/60 rounded-lg border">
              <button
                type="button"
                onClick={() => setReviewViewMode("focus")}
                className={`px-2.5 py-1 rounded-md text-[10px] font-medium border transition-colors cursor-pointer ${
                  reviewViewMode === "focus"
                    ? "bg-background text-primary border-border shadow-xs"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Поочередная проверка
              </button>
              <button
                type="button"
                onClick={() => setReviewViewMode("list")}
                className={`px-2.5 py-1 rounded-md text-[10px] font-medium border transition-colors cursor-pointer ${
                  reviewViewMode === "list"
                    ? "bg-background text-primary border-border shadow-xs"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Список работ
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
              <span>
                {assignment.acceptedCount}/{assignment.submissions.length}
              </span>
              <div className="w-16 bg-muted/80 h-2 rounded-full overflow-hidden border">
                <div
                  className="bg-primary h-full transition-all duration-300"
                  style={{
                    width: `${
                      assignment.submissions.length > 0
                        ? Math.round(
                            (assignment.acceptedCount /
                              assignment.submissions.length) *
                              100
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* FOCUS CONVEYOR WORKFLOW (Master-Detail Mode) */}
        {reviewViewMode === "focus" ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 py-1">
            {/* Left Sidebar: Queue of Students */}
            <div className="md:col-span-4 lg:col-span-3 border rounded-xl p-2.5 bg-muted/20 space-y-2 max-h-[580px] overflow-y-auto">
              <div className="relative">
                <Search className="h-3 w-3 absolute left-2 top-2.5 text-muted-foreground" />
                <Input
                  placeholder="Студент..."
                  value={submissionSearch}
                  onChange={(e) => setSubmissionSearch(e.target.value)}
                  className="h-7 text-[11px] pl-7 bg-background"
                />
              </div>

              <div className="space-y-1">
                {filteredSubmissions.map((sub) => {
                  const isActive = activeSubmissionId === sub.id;
                  return (
                    <div
                      key={sub.id}
                      onClick={() => setActiveSubmissionId(sub.id)}
                      className={`p-2 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between gap-1.5 ${
                        isActive
                          ? "border-primary bg-primary/10 font-bold text-foreground"
                          : "border-border bg-card hover:bg-muted/40 font-normal"
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
            <div className="md:col-span-8 lg:col-span-9 border rounded-xl p-3.5 bg-card space-y-3 flex flex-col justify-between">
              {(() => {
                const activeSub =
                  filteredSubmissions.find((s) => s.id === activeSubmissionId) ||
                  filteredSubmissions[0];
                const activeIdx = filteredSubmissions.findIndex(
                  (s) => s.id === activeSubmissionId
                );

                if (!activeSub) {
                  return (
                    <div className="py-16 text-center text-muted-foreground text-xs space-y-2">
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
                    <div className="space-y-3">
                      {/* Active Student Header Bar */}
                      <div className="flex items-center justify-between gap-2 border-b pb-2.5">
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

                      {/* Submitted Link Box */}
                      {activeSub.fileUrl && (
                        <div className="p-2.5 rounded-xl border bg-muted/30 space-y-1.5">
                          <div className="text-[10px] font-semibold text-muted-foreground flex items-center justify-between">
                            <span>Прикрепленная ссылка студента:</span>
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
                              className="inline-flex items-center gap-1.5 text-xs text-primary font-mono bg-background hover:bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/30 font-bold transition-all truncate flex-1 shadow-xs"
                            >
                              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-primary" />
                              <span className="truncate">{activeSub.fileUrl}</span>
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Multi-File Code / Solution Display */}
                      <SubmissionContentDisplay submission={activeSub} />

                      {/* Quick Preset Feedback Chips */}
                      <div className="space-y-1.5 pt-1">
                        <label className="text-[10px] text-muted-foreground font-medium">
                          Быстрые шаблоны ответов:
                        </label>
                        <div className="flex flex-wrap gap-1">
                          {PRESET_FEEDBACKS.map((chipText, cIdx) => (
                            <button
                              key={cIdx}
                              type="button"
                              onClick={() =>
                                setReviewTeacherCommentMap((prev) => ({
                                  ...prev,
                                  [activeSub.id]: chipText,
                                }))
                              }
                              className="text-[10px] bg-muted/60 hover:bg-primary/10 hover:text-primary px-2 py-0.5 rounded-md border text-muted-foreground transition-colors font-medium cursor-pointer"
                            >
                              {chipText}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Grade Selector */}
                      <div className="space-y-1.5 pt-1">
                        <label className="text-[10px] text-muted-foreground font-medium flex items-center gap-1.5">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> Оценка
                          (1–5):
                        </label>
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
                                className={`h-8 w-8 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                  selected
                                    ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                                    : "bg-muted/60 text-muted-foreground border-border hover:bg-amber-50 hover:text-amber-600 hover:border-amber-300"
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
                              className="text-[10px] text-muted-foreground hover:text-destructive ml-1 cursor-pointer"
                            >
                              сбросить
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Teacher Comment Textarea */}
                      <div className="space-y-1 pt-1">
                        <label className="text-[10px] font-semibold text-foreground">
                          Замечание / Рецензия преподавателя:
                        </label>
                        <Textarea
                          placeholder="Напишите комментарий для студента..."
                          value={reviewTeacherCommentMap[activeSub.id] || ""}
                          onChange={(e) =>
                            setReviewTeacherCommentMap((prev) => ({
                              ...prev,
                              [activeSub.id]: e.target.value,
                            }))
                          }
                          className="text-xs bg-background min-h-[50px]"
                        />
                      </div>
                    </div>

                    {/* Action Footer & Stepper Controls */}
                    <div className="pt-3 border-t flex flex-col sm:flex-row items-center justify-between gap-2">
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Button
                          size="xs"
                          variant="outline"
                          disabled={activeIdx <= 0}
                          onClick={() => {
                            if (activeIdx > 0)
                              setActiveSubmissionId(filteredSubmissions[activeIdx - 1].id);
                          }}
                          className="h-7 w-7 p-0"
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </Button>
                        <span>
                          {activeIdx + 1} из {filteredSubmissions.length}
                        </span>
                        <Button
                          size="xs"
                          variant="outline"
                          disabled={activeIdx >= filteredSubmissions.length - 1}
                          onClick={() => {
                            if (activeIdx < filteredSubmissions.length - 1)
                              setActiveSubmissionId(filteredSubmissions[activeIdx + 1].id);
                          }}
                          className="h-7 w-7 p-0"
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      {activeSub.status === SubmissionStatus.ACCEPTED ? (
                        /* Accepted — can still edit grade/comment */
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5 text-[11px] text-primary font-medium">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Принято</span>
                            {activeSub.reviewedAt && (
                              <span className="text-muted-foreground font-normal">
                                {new Date(activeSub.reviewedAt).toLocaleDateString("ru-RU")}
                              </span>
                            )}
                          </div>
                          <Button
                            size="xs"
                            variant="outline"
                            disabled={isPending}
                            onClick={() =>
                              handleReviewSubmission(activeSub.id, SubmissionStatus.ACCEPTED)
                            }
                            className="h-7 text-xs gap-1 font-medium border-primary/30 text-primary hover:bg-primary/10 ml-auto"
                          >
                            <Check className="h-3.5 w-3.5" /> Обновить
                          </Button>
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
                            className="h-7 text-xs gap-1 border-destructive/30 text-destructive hover:bg-destructive/10 font-medium"
                          >
                            <XCircle className="h-3.5 w-3.5" /> На доработку
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
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
                            className="h-7 text-xs gap-1 border-destructive/30 text-destructive hover:bg-destructive/10 font-medium"
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
                            className="h-7 text-xs gap-1.5 font-medium px-3 shadow-xs"
                          >
                            <Check className="h-3.5 w-3.5" /> Принять и дальше{" "}
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        ) : (
          /* LIST VIEW MODE (All cards stacked) */
          <div className="space-y-2.5 py-1 text-xs max-h-[380px] overflow-y-auto pr-1">
            {filteredSubmissions.map((sub: SubmissionDTO) => (
              <div
                key={sub.id}
                className="p-3 rounded-xl border bg-card hover:border-primary/40 transition-colors space-y-2 shadow-xs"
              >
                <div className="flex items-center justify-between gap-2 border-b pb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                      {sub.studentName ? sub.studentName[0].toUpperCase() : "С"}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-foreground text-xs truncate">
                        {sub.studentName}
                      </div>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span>{new Date(sub.submittedAt).toLocaleString("ru-RU")}</span>
                      </div>
                    </div>
                  </div>

                  <Badge
                    variant="outline"
                    className={`text-[10px] font-semibold border px-2 py-0.5 ${
                      sub.status === SubmissionStatus.ACCEPTED
                        ? "bg-primary/15 text-primary border-primary/30"
                        : sub.status === SubmissionStatus.NEED_REVISION
                          ? "bg-destructive/10 text-destructive border-destructive/30"
                          : "bg-muted/60 text-muted-foreground border-border/50"
                    }`}
                  >
                    {sub.status === SubmissionStatus.ACCEPTED
                      ? "Принято"
                      : sub.status === SubmissionStatus.NEED_REVISION
                        ? "На доработке"
                        : "На проверке"}
                  </Badge>
                </div>

                {/* Submitted Link & Code Solution */}
                <div className="space-y-2 text-xs">
                  {sub.fileUrl && (
                    <div className="flex items-center gap-1.5 p-2 rounded-lg bg-muted/20 border">
                      <span className="text-[10px] text-muted-foreground font-medium">
                        Ссылка на решение:
                      </span>
                      <a
                        href={sub.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline font-mono text-[11px] truncate max-w-[320px]"
                      >
                        <ExternalLink className="h-3 w-3 shrink-0" />
                        <span className="truncate">{sub.fileUrl}</span>
                      </a>
                    </div>
                  )}

                  <SubmissionContentDisplay submission={sub} />
                </div>

                {/* Teacher Feedback & Action Buttons */}
                <div className="pt-1.5 border-t space-y-2">
                  {/* Grade selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground font-medium shrink-0 flex items-center gap-1">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> Оценка:
                    </span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((g) => {
                        const selected = reviewGradeMap[sub.id] === g;
                        return (
                          <button
                            key={g}
                            type="button"
                            onClick={() =>
                              setReviewGradeMap((prev) => ({
                                ...prev,
                                [sub.id]: selected ? null : g,
                              }))
                            }
                            className={`h-6 w-6 rounded-md text-[10px] font-bold border transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer ${
                              selected
                                ? "bg-amber-500 text-white border-amber-500"
                                : "bg-muted/60 text-muted-foreground border-border hover:bg-amber-50 hover:text-amber-600 hover:border-amber-300"
                            }`}
                          >
                            {g}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-muted-foreground">
                      Комментарий преподавателя:
                    </label>
                    <Input
                      placeholder="Замечания или похвала студенту..."
                      value={reviewTeacherCommentMap[sub.id] || ""}
                      onChange={(e) =>
                        setReviewTeacherCommentMap((prev) => ({
                          ...prev,
                          [sub.id]: e.target.value,
                        }))
                      }
                      className="h-7 text-xs bg-background"
                    />
                  </div>

                  {sub.status === SubmissionStatus.ACCEPTED ? (
                    /* Accepted — editable, with Update button */
                    <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
                      <div className="flex items-center gap-1.5 text-[11px] text-primary font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Принято</span>
                        {sub.grade != null && (
                          <span className="inline-flex items-center gap-0.5 text-amber-600 font-bold">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />{" "}
                            {sub.grade}
                          </span>
                        )}
                        {sub.reviewedAt && (
                          <span className="text-muted-foreground font-normal">
                            {new Date(sub.reviewedAt).toLocaleDateString("ru-RU")}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="xs"
                          variant="outline"
                          disabled={isPending}
                          onClick={() =>
                            handleReviewSubmission(sub.id, SubmissionStatus.NEED_REVISION)
                          }
                          className="h-6 text-[10px] gap-1 border-destructive/30 text-destructive hover:bg-destructive/10"
                        >
                          <XCircle className="h-3 w-3" /> На доработку
                        </Button>
                        <Button
                          size="xs"
                          variant="outline"
                          disabled={isPending}
                          onClick={() =>
                            handleReviewSubmission(sub.id, SubmissionStatus.ACCEPTED)
                          }
                          className="h-6 text-[10px] gap-1 border-primary/30 text-primary hover:bg-primary/10"
                        >
                          <Check className="h-3 w-3" /> Обновить
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() =>
                          handleReviewSubmission(sub.id, SubmissionStatus.NEED_REVISION)
                        }
                        className="h-7 text-xs gap-1 border-destructive/30 text-destructive hover:bg-destructive/10 font-medium"
                      >
                        <XCircle className="h-3.5 w-3.5" /> На доработку
                      </Button>

                      <Button
                        size="xs"
                        onClick={() =>
                          handleReviewSubmission(sub.id, SubmissionStatus.ACCEPTED)
                        }
                        className="h-7 text-xs gap-1 font-medium px-3"
                      >
                        <Check className="h-3.5 w-3.5" /> Принять работу
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {filteredSubmissions.length === 0 && (
              <div className="py-8 text-center text-muted-foreground text-xs space-y-1 bg-muted/20 border rounded-xl">
                <ClipboardList className="h-7 w-7 text-muted-foreground/30 mx-auto" />
                <p className="font-semibold text-foreground">Работы по данному фильтру не найдены</p>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
          <Button size="xs" variant="outline" onClick={onClose}>
            Закрыть
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
