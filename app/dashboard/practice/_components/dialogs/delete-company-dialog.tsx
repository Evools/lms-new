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
import { Trash2, AlertTriangle, Building2 } from "lucide-react";
import { CompanyPartner } from "../types";

interface DeleteCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: CompanyPartner | null;
  assignedStudentsCount?: number;
  onConfirm: () => void;
}

export function DeleteCompanyDialog({
  open,
  onOpenChange,
  company,
  assignedStudentsCount = 0,
  onConfirm,
}: DeleteCompanyDialogProps) {
  if (!company) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="p-4 gap-3 text-xs sm:max-w-[420px]">
        <AlertDialogHeader className="place-items-start text-left gap-1.5">
          <AlertDialogTitle className="text-sm font-bold flex items-center gap-1.5 text-foreground">
            <Trash2 className="h-4 w-4 text-destructive" />
            <span>Удалить базу практики?</span>
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Вы действительно хотите удалить организацию{" "}
            <strong className="text-foreground">«{company.name}»</strong> из списка баз практик?
          </AlertDialogDescription>
        </AlertDialogHeader>

        {assignedStudentsCount > 0 && (
          <div className="flex items-start gap-2 p-2.5 rounded-lg border border-destructive/30 bg-destructive/5 text-destructive text-[11px] leading-snug">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Внимание:</span> в этой организации сейчас распределено{" "}
              <strong>{assignedStudentsCount}</strong> студ. При удалении их распределение будет сброшено в статус «Не распределен».
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
