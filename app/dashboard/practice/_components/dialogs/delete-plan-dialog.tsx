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
import { Trash2, AlertTriangle, BookOpenCheck } from "lucide-react";
import { SpecialtyDiaryPlan } from "../types";

interface DeletePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: SpecialtyDiaryPlan | null;
  onConfirm: () => void;
}

export function DeletePlanDialog({
  open,
  onOpenChange,
  plan,
  onConfirm,
}: DeletePlanDialogProps) {
  if (!plan) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="p-4 gap-3 text-xs sm:max-w-[420px]">
        <AlertDialogHeader className="place-items-start text-left gap-1.5">
          <AlertDialogTitle className="text-sm font-bold flex items-center gap-1.5 text-foreground">
            <Trash2 className="h-4 w-4 text-destructive" />
            <span>Удалить памятку группы?</span>
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Вы действительно хотите удалить памятку для группы{" "}
            <strong className="text-foreground">«{plan.groupName}»</strong> ({plan.specialty}, {plan.course} курс)?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex items-start gap-2 p-2.5 rounded-lg border border-destructive/30 bg-destructive/5 text-destructive text-[11px] leading-snug">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Внимание:</span> все {plan.days.length} дней программы практики, темы и расчасовка для этой группы будут удалены из базы.
          </div>
        </div>

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
            Удалить памятку
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
