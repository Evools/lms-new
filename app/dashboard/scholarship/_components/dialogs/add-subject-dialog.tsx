"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookMarked, Plus } from "lucide-react";

interface AddSubjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableDefaultSubjects: string[];
  currentSubjects: string[];
  onAddSubject: (subjectName: string) => void;
}

export function AddSubjectDialog({
  open,
  onOpenChange,
  availableDefaultSubjects,
  currentSubjects,
  onAddSubject,
}: AddSubjectDialogProps) {
  const [customName, setCustomName] = useState("");

  const unusedDefaults = availableDefaultSubjects.filter(
    (subj) => !currentSubjects.includes(subj)
  );

  const handleSubmitCustom = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = customName.trim();
    if (!trimmed) return;
    if (currentSubjects.includes(trimmed)) return;
    onAddSubject(trimmed);
    setCustomName("");
    onOpenChange(false);
  };

  const handleSelectDefault = (subj: string) => {
    onAddSubject(subj);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-4 gap-3 text-xs sm:max-w-[420px]">
        <DialogHeader className="place-items-start text-left gap-1 pb-2 border-b">
          <DialogTitle className="text-sm font-bold flex items-center gap-1.5">
            <BookMarked className="h-4 w-4 text-primary" />
            Добавить предмет в ведомость месяца
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Выберите дисциплину из учебного плана группы или введите собственное название.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {unusedDefaults.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-foreground">
                Предметы группы (по учебному плану):
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 bg-muted/30 border rounded-lg">
                {unusedDefaults.map((subj) => (
                  <button
                    key={subj}
                    type="button"
                    onClick={() => handleSelectDefault(subj)}
                    className="h-6 px-2 text-xs rounded border border-border bg-background hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-1 font-medium"
                  >
                    <Plus className="h-3 w-3" />
                    <span>{subj}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmitCustom} className="space-y-1.5">
            <label className="text-[11px] font-semibold text-foreground">
              Или введите название предмета вручную:
            </label>
            <div className="flex gap-2">
              <Input
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="например, Веб-разработка"
                className="h-8 text-xs bg-background flex-1"
                autoFocus
              />
              <Button
                type="submit"
                size="xs"
                disabled={!customName.trim() || currentSubjects.includes(customName.trim())}
                className="h-8 px-3 font-medium"
              >
                Добавить
              </Button>
            </div>
          </form>
        </div>

        <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
          <Button size="xs" variant="outline" onClick={() => onOpenChange(false)}>
            Закрыть
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
