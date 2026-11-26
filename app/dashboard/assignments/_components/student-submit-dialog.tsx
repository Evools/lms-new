"use client";

import React, { useState, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Link2,
  MessageSquare,
  Clock,
  Send,
  RotateCcw,
  UploadCloud,
} from "lucide-react";
import { AssignmentDTO, submitAssignmentAction } from "../actions";
import { parseSubmissionContent } from "./submission-utils";
import { FileUploadZone } from "@/components/file-upload-zone";

interface StudentSubmitDialogProps {
  assignment: AssignmentDTO | null;
  onClose: () => void;
  onSubmitSuccess: () => void;
}

export function StudentSubmitDialog({
  assignment,
  onClose,
  onSubmitSuccess,
}: StudentSubmitDialogProps) {
  const [isPending, startTransition] = useTransition();

  const [submitFileUrl, setSubmitFileUrl] = useState<string>("");
  const [submitComment, setSubmitComment] = useState<string>("");
  const [attachMode, setAttachMode] = useState<"file" | "link">("file");

  useEffect(() => {
    if (!assignment) return;
    const existing = assignment.userSubmission;

    if (existing?.comment) {
      const parsed = parseSubmissionContent(existing.comment);
      setSubmitComment(parsed.note || existing.comment || "");
    } else {
      setSubmitComment("");
    }

    const existingUrl = existing?.fileUrl || "";
    setSubmitFileUrl(existingUrl);
    if (existingUrl && existingUrl.startsWith("http") && !existingUrl.includes("/uploads/")) {
      setAttachMode("link");
    } else {
      setAttachMode("file");
    }
  }, [assignment]);

  const handleStudentSubmit = () => {
    if (!assignment) return;

    if (!submitFileUrl.trim() && !submitComment.trim()) {
      toast.add({
        title: "Укажите ссылку на выполненную работу или напишите комментарий к решению",
        type: "error",
      });
      return;
    }

    startTransition(async () => {
      const res = await submitAssignmentAction({
        assignmentId: assignment.id,
        fileUrl: submitFileUrl.trim() || undefined,
        comment: submitComment.trim() || undefined,
      });

      if (res.success) {
        toast.add({
          title: "Решение успешно отправлено на проверку!",
          type: "success",
        });
        onSubmitSuccess();
        onClose();
      } else {
        toast.add({
          title: res.error || "Не удалось отправить решение",
          type: "error",
        });
      }
    });
  };

  if (!assignment) return null;

  const isResubmission = Boolean(assignment.userSubmission);

  return (
    <Dialog open={assignment !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-5 gap-4 text-xs sm:max-w-[700px] max-h-[85vh] flex flex-col">
        <DialogHeader className="pb-3 border-b gap-1 place-items-start text-left shrink-0">
          <div className="flex items-center gap-2 flex-wrap text-[11px]">
            <span className="font-medium text-primary">{assignment.subjectName}</span>
            {assignment.dueDate && (
              <>
                <span className="text-muted-foreground/50">·</span>
                <span className="inline-flex items-center gap-1 text-muted-foreground tabular-nums">
                  <Clock className="h-3 w-3 shrink-0" />
                  Срок: {new Date(assignment.dueDate).toLocaleDateString("ru-RU")}
                </span>
              </>
            )}
          </div>

          <DialogTitle className="text-sm font-bold text-foreground pt-0.5 leading-snug">
            {isResubmission ? "Повторная сдача решения" : "Сдача домашнего задания"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-snug">
            {assignment.title}
          </DialogDescription>
        </DialogHeader>

        {/* Teacher Remarks Alert if returning for revision */}
        {assignment.userSubmission?.teacherComment && (
          <div className="p-3 rounded-md border border-primary/25 bg-primary/5 space-y-1 shrink-0">
            <div className="text-[11px] font-medium text-primary flex items-center gap-1.5">
              <RotateCcw className="h-3.5 w-3.5 shrink-0" />
              <span>Замечания преподавателя на доработку</span>
            </div>
            <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
              {assignment.userSubmission.teacherComment}
            </p>
          </div>
        )}

        {/* Submission Form */}
        <div className="space-y-4 flex-1 min-h-0 overflow-y-auto pr-1">
          {/* Attachment Mode Switcher */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="font-medium text-foreground text-xs">Способ прикрепления</span>
              <div className="grid grid-cols-2 gap-1 p-0.5 bg-muted/60 rounded-md border border-border text-xs w-[220px]">
                <button
                  type="button"
                  onClick={() => setAttachMode("file")}
                  className={`flex items-center justify-center gap-1.5 py-1 px-2 rounded-sm font-medium transition-colors cursor-pointer ${
                    attachMode === "file"
                      ? "bg-background text-primary border border-border/60"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <UploadCloud className="h-3.5 w-3.5" />
                  <span>Файл</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAttachMode("link")}
                  className={`flex items-center justify-center gap-1.5 py-1 px-2 rounded-sm font-medium transition-colors cursor-pointer ${
                    attachMode === "link"
                      ? "bg-background text-primary border border-border/60"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Link2 className="h-3.5 w-3.5" />
                  <span>Ссылка</span>
                </button>
              </div>
            </div>

            {attachMode === "file" ? (
              <div className="space-y-1.5">
                <FileUploadZone
                  folder="submissions"
                  value={
                    submitFileUrl.startsWith("http") &&
                    !submitFileUrl.includes("github.com") &&
                    !submitFileUrl.includes("figma.com")
                      ? submitFileUrl
                      : submitFileUrl.startsWith("/uploads/")
                        ? submitFileUrl
                        : ""
                  }
                  onUploadSuccess={(meta) => setSubmitFileUrl(meta.url)}
                  onRemove={() => setSubmitFileUrl("")}
                  maxSizeMb={25}
                  label="Выберите файл работы"
                  description="PDF, ZIP-архив с кодом, Word или изображение (до 25 МБ)"
                />
              </div>
            ) : (
              <div className="space-y-1.5 rounded-md border border-border bg-muted/20 p-3">
                <label className="font-medium text-foreground text-xs flex items-center gap-1.5">
                  <Link2 className="h-3.5 w-3.5 text-primary" />
                  <span>Ссылка на проект (GitHub, Figma, Google Диск)</span>
                </label>
                <Input
                  placeholder="https://github.com/username/repo или ссылка на Google Диск"
                  value={submitFileUrl}
                  onChange={(e) => setSubmitFileUrl(e.target.value)}
                  className="h-8 text-xs bg-background font-mono rounded-md"
                />
              </div>
            )}
          </div>

          <div className="space-y-1.5 pt-1 border-t border-border/70">
            <label className="font-medium text-foreground text-xs flex items-center gap-1.5 pt-2">
              <MessageSquare className="h-3.5 w-3.5 text-primary" />
              <span>Комментарий к решению</span>
            </label>
            <Textarea
              placeholder="Опишите, как выполнили задание, что получилось или задайте вопрос преподавателю..."
              value={submitComment}
              onChange={(e) => setSubmitComment(e.target.value)}
              className="text-xs bg-background min-h-[110px] resize-none rounded-md"
            />
          </div>
        </div>

        {/* Action Footer */}
        <DialogFooter className="flex flex-row justify-end gap-2 pt-3 border-t shrink-0">
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={onClose}
            disabled={isPending}
            className="h-7 rounded-md text-xs px-3 cursor-pointer"
          >
            Отмена
          </Button>

          <Button
            type="button"
            size="xs"
            onClick={handleStudentSubmit}
            disabled={isPending}
            className="h-7 rounded-md text-xs gap-1.5 font-medium px-3 cursor-pointer"
          >
            <Send className="h-3.5 w-3.5" />
            <span>{isPending ? "Отправка..." : "Отправить на проверку"}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
