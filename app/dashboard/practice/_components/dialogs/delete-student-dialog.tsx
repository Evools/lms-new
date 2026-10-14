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
import { Trash2, AlertTriangle } from "lucide-react";
import { StudentPracticeRecord } from "../types";

interface DeleteStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student?: StudentPracticeRecord | null;
  count?: number;
  onConfirm: () => void;
}

export function DeleteStudentDialog({
  open,
  onOpenChange,
  student,
  count,
  onConfirm,
}: DeleteStudentDialogProps) {
  const isBatch = !student && (count || 0) > 0;
  const isAssigned = student?.companyName;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="p-4 gap-3 text-xs sm:max-w-[400px]">
        <AlertDialogHeader className="place-items-start text-left gap-1">
          <AlertDialogTitle className="text-sm font-bold flex items-center gap-1.5 text-foreground">
            <Trash2 className="h-4 w-4 text-destructive" />
            <span>
              {isBatch
                ? `Удалить выбранных студентов (${count})?`
                : "Удалить студента с практики?"}
            </span>
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
            {isBatch ? (
              <>
                Вы собираетесь удалить <strong className="text-foreground">{count}</strong> студ. из реестра практики. Вся история их перемещений будет удалена, а занятые квоты в организациях освобождены.
              </>
            ) : (
              <>
                Вы действительно хотите исключить студента{" "}
                <strong className="text-foreground">{student?.studentName}</strong> ({student?.groupName}) из практики?
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {!isBatch && isAssigned && (
          <div className="flex items-start gap-2 p-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[11px] leading-snug">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <div>
              Студент сейчас прикреплен к <strong className="font-semibold">{student.companyName}</strong>. Место в квоте организации будет автоматически освобождено.
            </div>
          </div>
        )}

        <AlertDialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
          <AlertDialogCancel
            variant="outline"
            size="xs"
            className="h-7 px-3 text-xs"
          >
            Отмена
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            size="xs"
            onClick={onConfirm}
            className="h-7 px-3 text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Удалить
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
