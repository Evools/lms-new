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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Check, ExternalLink, RotateCcw, Send, Star, Timer } from "lucide-react";
import { AssignmentDTO } from "../actions";
import { SubmissionContentDisplay } from "./submission-content-display";

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
        <DialogContent className="p-4 gap-3 text-xs sm:max-w-[1100px] w-[94vw] max-h-[92vh] flex flex-col">
          <DialogHeader className="pb-2 border-b gap-1 place-items-start text-left shrink-0">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="text-[10px] border-primary/30 text-primary bg-primary/5 font-medium"
              >
                {assignment.subjectName}
              </Badge>
            </div>
            <DialogTitle className="text-sm font-bold text-foreground pt-1">
              Мой ответ: {assignment.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Информация о сданном решении, статусе проверки и оценке преподавателя
            </DialogDescription>
          </DialogHeader>

          {mySub ? (
            <div className="space-y-3 py-1 overflow-y-auto flex-1 min-h-0 pr-1">
              {/* Status + Grade */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <Badge
                  variant="outline"
                  className={`text-xs font-semibold border px-3 py-1 inline-flex items-center gap-1.5 ${
                    mySub.status === SubmissionStatus.ACCEPTED
                      ? "bg-primary/15 text-primary border-primary/30"
                      : mySub.status === SubmissionStatus.NEED_REVISION
                        ? "bg-destructive/10 text-destructive border-destructive/30"
                        : "bg-muted/60 text-muted-foreground border-border/50"
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
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {mySub.grade}
                    <span className="text-[10px] font-normal text-amber-500">/5</span>
                  </span>
                )}
                {mySub.reviewedAt && (
                  <span className="text-[10px] text-muted-foreground ml-auto">
                    {new Date(mySub.reviewedAt).toLocaleDateString("ru-RU")}
                  </span>
                )}
              </div>

              {/* Teacher comment — only when exists */}
              {mySub.teacherComment && (
                <div className="p-3 rounded-xl bg-muted/30 border border-l-[3px] border-l-primary text-xs text-foreground leading-relaxed">
                  {mySub.teacherComment}
                </div>
              )}

              {/* Student submission details */}
              <div className="border-t pt-2 space-y-2">
                {mySub.fileUrl && (
                  <div className="p-2 rounded-lg bg-muted/20 border flex items-center justify-between gap-2">
                    <span className="text-[10px] text-muted-foreground font-medium">
                      Ссылка на проект:
                    </span>
                    <a
                      href={mySub.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-primary hover:underline text-xs font-mono truncate max-w-[320px]"
                    >
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{mySub.fileUrl}</span>
                    </a>
                  </div>
                )}
                <SubmissionContentDisplay submission={mySub} />
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground text-xs">
              Вы ещё не сдавали это задание
            </div>
          )}

          <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
            {mySub?.status !== SubmissionStatus.ACCEPTED && (
              <Button
                size="xs"
                onClick={() => {
                  const target = assignment;
                  onClose();
                  onOpenSubmit(target);
                }}
                className="h-7 text-xs gap-1 font-medium"
              >
                <Send className="h-3.5 w-3.5" />
                {mySub ? "Пересдать" : "Сдать ДЗ"}
              </Button>
            )}
            <Button variant="outline" size="xs" onClick={onClose}>
              Закрыть
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}
