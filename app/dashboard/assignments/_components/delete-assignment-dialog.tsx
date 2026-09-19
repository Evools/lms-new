"use client";

import React from "react";
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
import { AssignmentDTO } from "../actions";

interface DeleteAssignmentDialogProps {
  assignment: AssignmentDTO | null;
  onClose: () => void;
  onConfirmDelete: (assignmentId: string) => void;
  isPending: boolean;
}

export function DeleteAssignmentDialog({
  assignment,
  onClose,
  onConfirmDelete,
  isPending,
}: DeleteAssignmentDialogProps) {
  return (
    <AlertDialog open={assignment !== null} onOpenChange={(open) => !open && onClose()}>
      {assignment && (
        <AlertDialogContent className="p-4 gap-3 text-xs sm:max-w-[400px]">
          <AlertDialogHeader className="place-items-start text-left gap-1">
            <AlertDialogTitle className="text-sm font-bold text-foreground">
              Удалить домашнее задание?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Задание «<span className="font-semibold text-foreground">{assignment.title}</span>» и все сданные студентами решения будут безвозвратно удалены.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
            <AlertDialogCancel disabled={isPending} onClick={onClose} className="h-7 text-xs">
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={() => onConfirmDelete(assignment.id)}
              className="h-7 text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? "Удаление..." : "Удалить"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      )}
    </AlertDialog>
  );
}
