"use client";

import React, { useState, useEffect, useTransition } from "react";
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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Link2,
  MessageSquare,
  Clock,
  Send,
  RotateCcw,
} from "lucide-react";
import { AssignmentDTO, submitAssignmentAction } from "../actions";
import { parseSubmissionContent } from "./submission-utils";

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

  useEffect(() => {
    if (!assignment) return;
    const existing = assignment.userSubmission;

    if (existing?.comment) {
      const parsed = parseSubmissionContent(existing.comment);
      setSubmitComment(parsed.note || existing.comment || "");
    } else {
      setSubmitComment("");
    }

    setSubmitFileUrl(existing?.fileUrl || "");
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
      <DialogContent className="p-4 gap-3 text-xs sm:max-w-[480px] max-h-[85vh] flex flex-col">
        <DialogHeader className="pb-2 border-b gap-1 place-items-start text-left shrink-0">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-[10px] border-primary/30 text-primary bg-primary/5 font-medium"
            >
              {assignment.subjectName}
            </Badge>
            {assignment.dueDate && (
              <Badge variant="secondary" className="text-[10px] gap-1 shrink-0 font-normal">
                <Clock className="h-3 w-3 text-primary" />
                Срок: {new Date(assignment.dueDate).toLocaleDateString("ru-RU")}
              </Badge>
            )}
          </div>

          <DialogTitle className="text-sm font-bold text-foreground pt-0.5">
            {isResubmission ? "Повторная сдача решения" : "Сдача домашнего задания"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground line-clamp-1">
            {assignment.title}
          </DialogDescription>
        </DialogHeader>

        {/* Teacher Remarks Alert if returning for revision */}
        {assignment.userSubmission?.teacherComment && (
          <div className="p-2.5 rounded-xl border border-primary/25 bg-primary/5 space-y-1 shrink-0">
            <div className="text-[11px] font-semibold text-primary flex items-center gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" /> Замечания преподавателя на доработку:
            </div>
            <p className="text-xs text-foreground leading-relaxed">
              {assignment.userSubmission.teacherComment}
            </p>
          </div>
        )}

        {/* Submission Form */}
        <div className="space-y-3 py-1 flex-1 min-h-0 overflow-y-auto pr-1">
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground text-xs flex items-center gap-1.5">
              <Link2 className="h-3.5 w-3.5 text-primary" /> Ссылка на выполненную работу (URL)
            </label>
            <Input
              placeholder="https://github.com/username/repo или ссылка на Figma / Google Drive"
              value={submitFileUrl}
              onChange={(e) => setSubmitFileUrl(e.target.value)}
              className="h-8 text-xs bg-background font-mono"
            />
            <p className="text-[10px] text-muted-foreground">
              Вставьте ссылку на репозиторий GitHub, макет Figma или файл на диске
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-foreground text-xs flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-primary" /> Комментарий / Описание решения
            </label>
            <Textarea
              placeholder="Опишите, как выполнили задание, что получилось или задайте вопрос преподавателю..."
              value={submitComment}
              onChange={(e) => setSubmitComment(e.target.value)}
              className="text-xs bg-background min-h-[120px] resize-none"
            />
          </div>
        </div>

        {/* Action Footer */}
        <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={onClose}
            disabled={isPending}
            className="h-7 text-xs"
          >
            Отмена
          </Button>

          <Button
            type="button"
            size="xs"
            onClick={handleStudentSubmit}
            disabled={isPending}
            className="h-7 text-xs gap-1.5 font-medium px-3"
          >
            <Send className="h-3.5 w-3.5" />
            <span>{isPending ? "Отправка..." : "Отправить на проверку"}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
