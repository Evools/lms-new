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
import { Input } from "@/components/ui/input";
import { Settings2, Check, X, Edit2, Trash2, Plus } from "lucide-react";
import { SpecialtyDiaryPlan } from "../types";

export interface NewSectionFormData {
  name: string;
  daysCount: number;
  hoursPerDay: number;
}

interface SectionSummaryItem {
  section: string;
  daysCount: number;
  hoursCount: number;
  percent: number;
}

interface SectionsManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentDiaryPlan: SpecialtyDiaryPlan | null;
  sectionHoursSummary: SectionSummaryItem[];
  editingSectionTarget: string | null;
  setEditingSectionTarget: (val: string | null) => void;
  editingSectionName: string;
  setEditingSectionName: (val: string) => void;
  onRenameSection: (oldName: string, newName: string) => void;
  onUpdateSectionHours: (section: string, hours: number) => void;
  onDeleteSection: (section: string) => void;
  newSectionForm: NewSectionFormData;
  setNewSectionForm: React.Dispatch<React.SetStateAction<NewSectionFormData>>;
  onAddSectionWithDays: () => void;
}

export function SectionsManagerDialog({
  open,
  onOpenChange,
  currentDiaryPlan,
  sectionHoursSummary,
  editingSectionTarget,
  setEditingSectionTarget,
  editingSectionName,
  setEditingSectionName,
  onRenameSection,
  onUpdateSectionHours,
  onDeleteSection,
  newSectionForm,
  setNewSectionForm,
  onAddSectionWithDays,
}: SectionsManagerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-4 gap-3 text-xs sm:max-w-[640px] max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0 place-items-start text-left gap-1 pb-2 border-b">
          <DialogTitle className="text-sm font-bold flex items-center gap-1.5">
            <Settings2 className="h-4 w-4 text-primary" />
            Настройка учебно-тематического плана и разделов
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Группа: <strong className="text-foreground">{currentDiaryPlan?.groupName}</strong> • {currentDiaryPlan?.specialty} ({currentDiaryPlan?.course} курс).
            Здесь вы можете изменить названия разделов, перераспределить часы или добавить новый раздел.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex flex-col space-y-3 py-1">
          {/* 1. Existing Sections Table (SCROLLABLE CONTAINER) */}
          <div className="flex-1 min-h-0 flex flex-col space-y-1.5">
            <div className="shrink-0 flex items-center justify-between text-[11px] font-semibold text-foreground">
              <span>Текущие разделы и распределение часов:</span>
              <span className="font-mono text-muted-foreground text-[10px]">
                Всего разделов: {sectionHoursSummary.length}
              </span>
            </div>

            {/* Only this table container scrolls */}
            <div className="border rounded-lg overflow-y-auto max-h-[220px] sm:max-h-[250px] bg-background">
              <table className="w-full text-xs border-collapse">
                <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur border-b text-[11px] text-muted-foreground shadow-xs">
                  <tr>
                    <th className="p-2 text-left border-r font-semibold">Раздел программы</th>
                    <th className="p-2 text-center w-16 border-r font-semibold">Дней</th>
                    <th className="p-2 text-center w-24 border-r font-semibold">Норма (ч./дн.)</th>
                    <th className="p-2 text-center w-20 border-r font-semibold">Всего</th>
                    <th className="p-2 text-center w-20 font-semibold">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-xs">
                  {sectionHoursSummary.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-muted-foreground">
                        В плане пока нет разделов.
                      </td>
                    </tr>
                  ) : (
                    sectionHoursSummary.map((sec, idx) => {
                      const isEditingThis = editingSectionTarget === sec.section;
                      const currentHoursPerDay = Math.round(sec.hoursCount / sec.daysCount) || 6;

                      return (
                        <tr key={idx} className="hover:bg-muted/10 transition-colors">
                          {/* Section Name */}
                          <td className="p-2 border-r align-middle">
                            {isEditingThis ? (
                              <div className="flex items-center gap-1.5">
                                <Input
                                  value={editingSectionName}
                                  onChange={(e) => setEditingSectionName(e.target.value)}
                                  className="h-7 text-xs bg-background"
                                  autoFocus
                                />
                                <Button
                                  size="xs"
                                  onClick={() => onRenameSection(sec.section, editingSectionName)}
                                  className="h-7 px-2 text-xs shrink-0"
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="xs"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingSectionTarget(null);
                                    setEditingSectionName("");
                                  }}
                                  className="h-7 px-1.5 text-xs shrink-0 text-muted-foreground"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between gap-1.5">
                                <span className="font-medium text-foreground leading-snug">{sec.section}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingSectionTarget(sec.section);
                                    setEditingSectionName(sec.section);
                                  }}
                                  className="p-1 text-muted-foreground hover:text-primary rounded shrink-0 transition-colors"
                                  title="Переименовать раздел"
                                >
                                  <Edit2 className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                          </td>

                          {/* Days */}
                          <td className="p-2 text-center border-r font-mono font-medium text-muted-foreground align-middle">
                            {sec.daysCount} дн.
                          </td>

                          {/* Hours per Day Quick Selector */}
                          <td className="p-2 text-center border-r align-middle">
                            <select
                              value={currentHoursPerDay}
                              onChange={(e) =>
                                onUpdateSectionHours(sec.section, parseInt(e.target.value, 10) || 6)
                              }
                              className="h-6 px-1.5 rounded border border-border bg-background text-[11px] font-mono text-center focus:outline-none focus:border-primary"
                              title="Изменить норму часов для всех дней этого раздела"
                            >
                              {[4, 5, 6, 7, 8].map((h) => (
                                <option key={h} value={h}>
                                  {h} ч./дн.
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* Total Hours */}
                          <td className="p-2 text-center border-r font-mono font-bold text-primary align-middle">
                            {sec.hoursCount} ч.
                          </td>

                          {/* Delete section */}
                          <td className="p-2 text-center align-middle">
                            <button
                              type="button"
                              onClick={() => onDeleteSection(sec.section)}
                              className="p-1 text-muted-foreground hover:text-destructive rounded transition-colors"
                              title="Удалить раздел и его дни из плана"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. Add New Section Form (FIXED/NON-SCROLLING BLOCK) */}
          <div className="shrink-0 p-3 bg-muted/20 rounded-lg border space-y-2.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
              <Plus className="h-3.5 w-3.5 text-primary" />
              <span>Добавить новый раздел в учебный план:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[10px] text-muted-foreground font-medium">Наименование нового раздела</label>
                <Input
                  value={newSectionForm.name}
                  onChange={(e) => setNewSectionForm({ ...newSectionForm, name: e.target.value })}
                  placeholder="например, Раздел: Серверная разработка и базы данных"
                  className="h-7 text-xs bg-background"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground font-medium">Кол-во дней</label>
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={newSectionForm.daysCount}
                  onChange={(e) =>
                    setNewSectionForm({
                      ...newSectionForm,
                      daysCount: parseInt(e.target.value, 10) || 1,
                    })
                  }
                  className="h-7 text-xs font-mono bg-background [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground font-medium">Часов в день</label>
                <Input
                  type="number"
                  min={1}
                  max={12}
                  value={newSectionForm.hoursPerDay}
                  onChange={(e) =>
                    setNewSectionForm({
                      ...newSectionForm,
                      hoursPerDay: parseInt(e.target.value, 10) || 6,
                    })
                  }
                  className="h-7 text-xs font-mono bg-background [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-muted-foreground">
                Добавит <strong>{newSectionForm.daysCount}</strong> дн. по {newSectionForm.hoursPerDay} ч. (+{newSectionForm.daysCount * newSectionForm.hoursPerDay} ч. к общему итогу)
              </span>
              <Button
                size="xs"
                onClick={onAddSectionWithDays}
                disabled={!newSectionForm.name.trim()}
                className="h-7 px-3 text-xs gap-1 font-medium"
              >
                <Plus className="h-3 w-3" />
                <span>Добавить раздел</span>
              </Button>
            </div>
          </div>

          {/* 3. Summary Footer Card (FIXED BLOCK) */}
          <div className="shrink-0 p-2.5 rounded-lg bg-primary/5 border border-primary/20 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Итоговая расчасовка программы:</span>
            <span className="font-bold font-mono text-primary">
              {currentDiaryPlan?.days.length} рабочих дней • {currentDiaryPlan?.totalHours} академических часов
            </span>
          </div>
        </div>

        <DialogFooter className="shrink-0 flex flex-row justify-end gap-2 pt-2 border-t mt-1">
          <Button size="xs" onClick={() => onOpenChange(false)} className="font-medium">
            Готово
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
