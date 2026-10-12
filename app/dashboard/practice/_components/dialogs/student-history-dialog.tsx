"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { History, ArrowRight, Building2, ArrowRightLeft } from "lucide-react";
import { StudentPracticeRecord } from "../types";

interface StudentHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: StudentPracticeRecord | null;
  onOpenMoveSingle: (student: StudentPracticeRecord) => void;
}

export function StudentHistoryDialog({
  open,
  onOpenChange,
  student,
  onOpenMoveSingle,
}: StudentHistoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-4 gap-3 text-xs sm:max-w-[540px] max-h-[85vh] overflow-y-auto">
        <DialogHeader className="place-items-start text-left gap-1 pb-2 border-b">
          <DialogTitle className="text-sm font-bold flex items-center gap-1.5">
            <History className="h-4 w-4 text-primary" />
            История перемещений студента
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Студент: <strong className="text-foreground">{student?.studentName}</strong> ({student?.groupName})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {!student?.movements || student.movements.length === 0 ? (
            <div className="py-6 text-center text-muted-foreground text-xs">
              Перемещений не зафиксировано. Студент ещё не направлялся на практику.
            </div>
          ) : (
            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
              {student.movements.map((mov) => (
                <div key={mov.id} className="relative space-y-1">
                  <div className="absolute -left-6 top-1 h-3 w-3 rounded-full border-2 border-background bg-primary" />
                  <div className="flex items-center justify-between gap-2">
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-semibold ${mov.type === "Перевод на другую базу"
                          ? "bg-muted/80 text-foreground border-border"
                          : "bg-primary/10 text-primary border-primary/30"
                        }`}
                    >
                      {mov.type}
                    </Badge>
                    <span className="text-[10px] font-mono text-muted-foreground">{mov.date}</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-muted/40 border space-y-1 text-xs">
                    {mov.fromCompany ? (
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-muted-foreground line-through">{mov.fromCompany}</span>
                        <ArrowRight className="h-3 w-3 text-primary shrink-0" />
                        <strong className="text-foreground">{mov.toCompany}</strong>
                      </div>
                    ) : (
                      <div className="font-bold text-foreground flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5 text-primary" />
                        <span>{mov.toCompany}</span>
                      </div>
                    )}

                    <div className="text-[11px] text-muted-foreground">
                      Вид: <span className="font-medium text-foreground">{mov.practiceType}</span>
                      {mov.mentor && <span> • Наставник: <strong className="text-foreground">{mov.mentor}</strong></span>}
                    </div>

                    <div className="text-[10px] text-muted-foreground/90 bg-background/80 p-1.5 rounded border mt-1">
                      <strong>Основание:</strong> {mov.reason}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-row justify-between items-center gap-2 pt-2 border-t mt-2">
          <Button
            size="xs"
            variant="outline"
            onClick={() => {
              if (student) {
                onOpenChange(false);
                onOpenMoveSingle(student);
              }
            }}
            className="gap-1 text-primary border-primary/40 hover:bg-primary/10"
          >
            <ArrowRightLeft className="h-3 w-3" />
            <span>Сменить базу / Перевести</span>
          </Button>
          <Button size="xs" variant="outline" onClick={() => onOpenChange(false)}>
            Закрыть
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
