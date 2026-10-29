"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ShieldCheck, Check, X } from "lucide-react";
import type { WorkflowDocument } from "../../../workflow-data";

interface DocumentApprovalDialogProps {
  approvalDoc: WorkflowDocument | null;
  approvalComment: string;
  setApprovalComment: (val: string) => void;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}

export function DocumentApprovalDialog({
  approvalDoc,
  approvalComment,
  setApprovalComment,
  onClose,
  onApprove,
  onReject,
}: DocumentApprovalDialogProps) {
  if (!approvalDoc) return null;

  return (
    <Dialog open={!!approvalDoc} onOpenChange={() => onClose()}>
      <DialogContent className="p-4 gap-3 text-xs sm:max-w-[460px]">
        <DialogHeader className="place-items-start text-left gap-1">
          <DialogTitle className="text-sm font-bold flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Решение администрации лицея
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {approvalDoc.title}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="p-2.5 rounded bg-muted/40 border border-border text-[11px] flex flex-col gap-1">
            <span className="font-medium text-foreground">
              Инициатор рапорта: {approvalDoc.authorName} ({approvalDoc.authorRole})
            </span>
            <span className="text-muted-foreground">
              Учебная группа: {approvalDoc.groupName} • Обучающихся в рапорте: {approvalDoc.students.length}
            </span>
            {approvalDoc.generalReason && (
              <p className="mt-1 text-[11px] text-foreground italic border-l-2 border-primary pl-2">
                «{approvalDoc.generalReason}»
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-medium text-foreground text-xs">
              Резолюция / комментарий к решению:
            </label>
            <Textarea
              value={approvalComment}
              onChange={(e) => setApprovalComment(e.target.value)}
              placeholder="Например: Рапорт рассмотрен администрацией лицея. Подготовить приказ об отчислении."
              rows={3}
              className="text-xs resize-none"
            />
          </div>
        </div>

        <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-8 text-xs"
          >
            Отмена
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onReject}
            className="h-8 text-xs text-destructive hover:bg-destructive/10 border-destructive/30 gap-1.5"
          >
            <X className="h-3.5 w-3.5" />
            Отклонить
          </Button>
          <Button
            size="sm"
            onClick={onApprove}
            className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Check className="h-3.5 w-3.5" />
            Утвердить решение
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
