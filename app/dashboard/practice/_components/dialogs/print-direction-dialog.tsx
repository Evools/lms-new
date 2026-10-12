"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer } from "lucide-react";
import { StudentPracticeRecord } from "../types";

interface PrintDirectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: StudentPracticeRecord | null;
}

export function PrintDirectionDialog({
  open,
  onOpenChange,
  record,
}: PrintDirectionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-5 gap-3.5 text-xs sm:max-w-[700px] max-h-[92vh] overflow-y-auto">
        <DialogHeader className="place-items-start text-left gap-1 pb-2 border-b">
          <div className="flex items-center justify-between w-full">
            <DialogTitle className="text-sm font-bold flex items-center gap-1.5">
              <Printer className="h-4 w-4 text-primary" />
              Печать: Направление на базу практики
            </DialogTitle>
            <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">
              Бланк № 2026/ПР-СТУД
            </Badge>
          </div>
        </DialogHeader>

        <div className="p-6 bg-background rounded-lg border space-y-4 text-foreground font-serif leading-relaxed text-xs shadow-2xs">
          <div className="text-center space-y-1 border-b pb-3">
            <div className="font-bold text-xs uppercase tracking-wide">
              Министерство образования и науки Кыргызской Республики
            </div>
            <div className="font-bold text-sm">ПРОФЕССИОНАЛЬНЫЙ ЛИЦЕЙ / КОЛЛЕДЖ</div>
            <div className="text-[10px] text-muted-foreground italic">Учебно-производственная часть</div>
          </div>

          <div className="text-center font-bold text-sm uppercase my-2">
            НАПРАВЛЕНИЕ НА ПРАКТИКУ
          </div>

          <div className="space-y-2">
            <p>
              Выдано учащемуся(ейся) группы <strong>{record?.groupName}</strong>, курса <strong>{record?.course}</strong>, специальности <strong>«{record?.specialty}»</strong>:
            </p>
            <p className="font-bold text-sm text-center py-1 bg-muted/20 border rounded font-sans">
              {record?.studentName}
            </p>
            <p>
              Направляется для прохождения <strong>{record?.practiceType}</strong> практики на базу практики:
            </p>
            <p className="font-bold text-center py-1 font-sans">
              «{record?.companyName}»
            </p>
            <p>
              Срок прохождения практики: с <strong>{record?.startDate}</strong> по <strong>{record?.endDate}</strong>.
            </p>
            <p>
              Руководитель практики от колледжа: <strong>{record?.collegeMentor}</strong>
            </p>
            <p>
              Руководитель практики от предприятия: <strong>{record?.companyMentor || "Назначается приказом организации"}</strong>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-6 mt-4 border-t text-[11px] font-sans">
            <div>
              <div>Зам. директора по УПР:</div>
              <div className="mt-4 border-b border-foreground/40 w-32" />
              <div className="text-[9px] text-muted-foreground mt-0.5">М.П. / Подпись</div>
            </div>
            <div className="text-right">
              <div>Руководитель предприятия:</div>
              <div className="mt-4 border-b border-foreground/40 w-32 ml-auto" />
              <div className="text-[9px] text-muted-foreground mt-0.5">М.П. / Подпись</div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
          <Button size="xs" variant="outline" onClick={() => onOpenChange(false)}>
            Закрыть
          </Button>
          <Button
            size="xs"
            onClick={() => {
              window.print();
            }}
            className="gap-1.5 font-medium"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Распечатать / PDF</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
