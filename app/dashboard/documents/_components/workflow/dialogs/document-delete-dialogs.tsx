"use client";

import React from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import type { WorkflowDocument } from "../../../workflow-data";
import type { DocumentDTO } from "../../../actions";

interface DocumentDeleteDialogsProps {
  deleteWorkflowDocTarget: WorkflowDocument | null;
  onCloseWorkflowDelete: () => void;
  onConfirmWorkflowDelete: () => void;

  deleteRegDocTarget: DocumentDTO | null;
  onCloseRegDelete: () => void;
  onConfirmRegDelete: () => void;
  isRegSubmitting: boolean;
}

export function DocumentDeleteDialogs({
  deleteWorkflowDocTarget,
  onCloseWorkflowDelete,
  onConfirmWorkflowDelete,
  deleteRegDocTarget,
  onCloseRegDelete,
  onConfirmRegDelete,
  isRegSubmitting,
}: DocumentDeleteDialogsProps) {
  return (
    <>
      {/* Delete Workflow Doc Modal */}
      <AlertDialog
        open={!!deleteWorkflowDocTarget}
        onOpenChange={(open) => !open && onCloseWorkflowDelete()}
      >
        <AlertDialogContent className="p-4 gap-3 text-xs sm:max-w-[400px]">
          <AlertDialogHeader className="place-items-start text-left gap-1">
            <AlertDialogTitle className="text-sm font-bold flex items-center gap-1.5 text-destructive">
              <Trash2 className="h-4 w-4" />
              Удалить документ?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Вы действительно хотите удалить документ «{deleteWorkflowDocTarget?.title}»? Это действие нельзя будет отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
            <Button
              variant="outline"
              size="xs"
              onClick={onCloseWorkflowDelete}
              className="h-6 px-2.5 text-xs"
            >
              Отмена
            </Button>
            <Button
              variant="destructive"
              size="xs"
              onClick={onConfirmWorkflowDelete}
              className="h-6 px-2.5 text-xs"
            >
              Удалить
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Regulatory Doc Modal */}
      <AlertDialog
        open={!!deleteRegDocTarget}
        onOpenChange={(open) => !open && onCloseRegDelete()}
      >
        <AlertDialogContent className="p-4 gap-3 text-xs sm:max-w-[400px]">
          <AlertDialogHeader className="place-items-start text-left gap-1">
            <AlertDialogTitle className="text-sm font-bold flex items-center gap-1.5 text-destructive">
              <Trash2 className="h-4 w-4" />
              Удалить нормативный документ?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Вы действительно хотите удалить «{deleteRegDocTarget?.title}» из официального репозитория лицея?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
            <Button
              variant="outline"
              size="xs"
              onClick={onCloseRegDelete}
              disabled={isRegSubmitting}
              className="h-6 px-2.5 text-xs"
            >
              Отмена
            </Button>
            <Button
              variant="destructive"
              size="xs"
              onClick={onConfirmRegDelete}
              disabled={isRegSubmitting}
              className="h-6 px-2.5 text-xs"
            >
              {isRegSubmitting ? "Удаление..." : "Удалить"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
