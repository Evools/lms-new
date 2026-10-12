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
import { RotateCcw } from "lucide-react";

interface ResetConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupName?: string;
  onConfirm: () => void;
}

export function ResetConfirmDialog({
  open,
  onOpenChange,
  groupName,
  onConfirm,
}: ResetConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="p-4 gap-3 text-xs sm:max-w-[400px]">
        <AlertDialogHeader className="place-items-start text-left gap-1">
          <AlertDialogTitle className="text-sm font-bold flex items-center gap-1.5 text-foreground">
            <RotateCcw className="h-4 w-4 text-destructive" />
            <span>Сбросить отметки?</span>
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs text-muted-foreground">
            Сбросить отметки переписанных дней для этой группы ({groupName || "текущей группы"})? Это действие очистит отметки готовности в дневнике практики.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
          <AlertDialogCancel variant="outline" size="xs" className="h-7 px-3 text-xs">
            Отмена
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            size="xs"
            onClick={onConfirm}
            className="h-7 px-3 text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Сбросить
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
