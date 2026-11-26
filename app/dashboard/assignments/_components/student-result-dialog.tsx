"use client";

import React from "react";
import { SubmissionStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Check,
  Clock,
  Download,
  ExternalLink,
  MessageSquare,
  RotateCcw,
  Send,
  Star,
  Timer,
  User,
} from "lucide-react";
import { AssignmentDTO } from "../actions";
import { SubmissionContentDisplay } from "./submission-content-display";
import { getResourceMeta } from "@/lib/resource-utils";

interface StudentResultDialogProps {
  assignment: AssignmentDTO | null;
  onClose: () => void;
  onOpenSubmit: (assignment: AssignmentDTO) => void;
}

export function StudentResultDialog({
  assignment,
  onClose,
  onOpenSubmit,
}: StudentResultDialogProps) {
  const mySub = assignment?.userSubmission;

  return (
    <Dialog open={assignment !== null} onOpenChange={(open) => !open && onClose()}>
      {assignment && (
        <DialogContent className="p-5 gap-4 text-xs sm:max-w-[700px] max-h-[85vh] flex flex-col">
          <DialogHeader className="pb-3 border-b gap-1 place-items-start text-left shrink-0">
            <div className="flex items-center gap-2 flex-wrap text-[11px]">
              <span className="font-medium text-primary">{assignment.subjectName}</span>
              <span className="text-muted-foreground/50">·</span>
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <User className="h-3 w-3" />
                {assignment.teacherName}
              </span>
            </div>
            <DialogTitle className="text-sm font-bold text-foreground pt-0.5 leading-snug">
              {assignment.title}
            </DialogTitle>
          </DialogHeader>

          {mySub ? (
            <div className="space-y-4 overflow-y-auto flex-1 min-h-0 pr-1">
              {/* Compact Status + Grade + Dates Strip */}
              <div className="rounded-md border border-border bg-muted/30 px-3 py-2 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant="outline"
                    className={`h-6 px-2.5 text-xs font-medium border rounded-md inline-flex items-center gap-1.5 ${
                      mySub.status === SubmissionStatus.ACCEPTED
                        ? "bg-primary/10 text-primary border-primary/25"
                        : mySub.status === SubmissionStatus.NEED_REVISION
                          ? "bg-destructive/10 text-destructive border-destructive/25"
                          : "bg-muted/60 text-muted-foreground border-border/60"
                    }`}
                  >
                    {mySub.status === SubmissionStatus.ACCEPTED ? (
                      <>
                        <Check className="h-3.5 w-3.5" /> Принято
                      </>
                    ) : mySub.status === SubmissionStatus.NEED_REVISION ? (
                      <>
                        <RotateCcw className="h-3.5 w-3.5" /> На доработке
                      </>
                    ) : (
                      <>
                        <Timer className="h-3.5 w-3.5" /> На проверке
                      </>
                    )}
                  </Badge>

                  {mySub.grade != null && (
                    <span className="h-6 px-2.5 inline-flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 border border-primary/25 rounded-md">
                      <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                      <span>Оценка: {mySub.grade}</span>
                    </span>
                  )}
                </div>

                {(mySub.submittedAt || mySub.reviewedAt) && (
                  <div className="flex items-center gap-3 flex-wrap text-[11px] text-muted-foreground">
                    {mySub.submittedAt && (
                      <span className="inline-flex items-center gap-1 tabular-nums">
                        <Clock className="h-3 w-3 shrink-0" />
                        Сдано: {new Date(mySub.submittedAt).toLocaleDateString("ru-RU")}
                      </span>
                    )}
                    {mySub.reviewedAt && (
                      <span className="inline-flex items-center gap-1 tabular-nums">
                        <Check className="h-3 w-3 shrink-0 text-primary" />
                        Проверено: {new Date(mySub.reviewedAt).toLocaleDateString("ru-RU")}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Teacher Comment */}
              {mySub.teacherComment && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-primary">
                    <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                    <span>Комментарий преподавателя</span>
                  </div>
                  <div className="rounded-md bg-primary/5 border border-primary/20 px-3.5 py-2.5 text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                    {mySub.teacherComment}
                  </div>
                </div>
              )}

              {/* Student Submission */}
              <div className="space-y-2 pt-3 border-t border-border/70">
                <div className="text-[11px] font-medium text-muted-foreground">
                  Ваше решение
                </div>
                {mySub.fileUrl && (() => {
                  const meta = getResourceMeta(mySub.fileUrl);
                  return (
                    <div className="px-3 py-2 rounded-md bg-muted/25 border border-border flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="p-1.5 rounded-md bg-background border border-border text-primary shrink-0">
                          {meta.icon}
                        </div>
                        <div className="min-w-0 flex-1 flex items-center gap-2">
                          <span className="font-medium text-foreground text-xs truncate" title={meta.title}>
                            {meta.title}
                          </span>
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal shrink-0 rounded-md">
                            {meta.badge}
                          </Badge>
                        </div>
                      </div>
                      <a
                        href={mySub.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-primary/25 bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-[11px] shrink-0 font-medium"
                      >
                        {meta.isDownloadable ? (
                          <>
                            <Download className="h-3 w-3" />
                            <span>Скачать</span>
                          </>
                        ) : (
                          <>
                            <ExternalLink className="h-3 w-3" />
                            <span>Открыть</span>
                          </>
                        )}
                      </a>
                    </div>
                  );
                })()}
                <SubmissionContentDisplay submission={mySub} />
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground text-xs">
              Вы ещё не сдавали это задание
            </div>
          )}

          <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-1">
            {mySub?.status !== SubmissionStatus.ACCEPTED && (
              <Button
                size="xs"
                onClick={() => {
                  const target = assignment;
                  onClose();
                  onOpenSubmit(target);
                }}
                className="h-7 rounded-md text-xs gap-1 font-medium px-3 cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
                {mySub ? "Пересдать" : "Сдать ДЗ"}
              </Button>
            )}
            <Button
              variant="outline"
              size="xs"
              onClick={onClose}
              className="h-7 rounded-md text-xs px-3 cursor-pointer"
            >
              Закрыть
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}
