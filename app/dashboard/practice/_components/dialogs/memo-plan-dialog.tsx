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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { BookOpenCheck, GraduationCap, Calendar } from "lucide-react";
import { PracticeType, SpecialtyDiaryPlan } from "../types";

export interface PlanFormData {
  groupName: string;
  title: string;
  specialty: string;
  course: number;
  practiceType: PracticeType;
  startDate: string;
  generateDaysCount: number;
  defaultHours: number;
}

interface MemoPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingPlan: SpecialtyDiaryPlan | null;
  planForm: PlanFormData;
  setPlanForm: React.Dispatch<React.SetStateAction<PlanFormData>>;
  groupsList: string[];
  onSavePlan: () => void;
}

export function MemoPlanDialog({
  open,
  onOpenChange,
  editingPlan,
  planForm,
  setPlanForm,
  groupsList,
  onSavePlan,
}: MemoPlanDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-4 gap-3 text-xs sm:max-w-[480px]">
        <DialogHeader className="place-items-start text-left gap-1 pb-2 border-b">
          <DialogTitle className="text-sm font-bold flex items-center gap-1.5">
            <BookOpenCheck className="h-4 w-4 text-primary" />
            {editingPlan ? "Редактировать параметры памятки группы" : "Создать новую памятку для группы"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {editingPlan
              ? "Измените учебную группу, специальность, курс или расчасовку."
              : "Задайте учебную группу, дату старта и параметры. После создания вы сможете наполнять памятку своими днями и заданиями."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                <GraduationCap className="h-3.5 w-3.5 text-primary" />
                Учебная группа
              </label>
              <Select
                value={planForm.groupName}
                onValueChange={(val) => setPlanForm({ ...planForm, groupName: val })}
              >
                <SelectTrigger className="h-8 text-xs bg-background w-full font-medium">
                  <SelectValue placeholder="Выберите группу...">
                    {planForm.groupName || "Выберите группу..."}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Array.from(new Set([...groupsList, ...(planForm.groupName ? [planForm.groupName] : [])]))
                    .filter(Boolean)
                    .map((g) => (
                      <SelectItem key={g} value={g} className="text-xs">
                        {g}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                Дата старта практики
              </label>
              <Input
                value={planForm.startDate}
                onChange={(e) => setPlanForm({ ...planForm, startDate: e.target.value })}
                placeholder="15.10.2026"
                className="h-8 text-xs bg-background font-mono"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-foreground">Название программы / Памятки</label>
              <span className="text-[10px] text-muted-foreground">Необязательно</span>
            </div>
            <Input
              value={planForm.title}
              onChange={(e) => setPlanForm({ ...planForm, title: e.target.value })}
              placeholder={
                planForm.groupName
                  ? `${planForm.groupName}: ${planForm.specialty || "Специальность"} (${planForm.course} курс)`
                  : "например, ВР-1-26: Веб-разработка (1 курс)"
              }
              className="h-8 text-xs bg-background"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground">Специальность</label>
              <Input
                value={planForm.specialty}
                onChange={(e) => setPlanForm({ ...planForm, specialty: e.target.value })}
                placeholder="Веб-разработка, Сети, Дизайн..."
                className="h-8 text-xs bg-background"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground">Курс (всего 2 курса)</label>
              <div className="grid grid-cols-2 gap-1 bg-muted/60 p-1 rounded-lg border">
                {[1, 2].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setPlanForm({ ...planForm, course: c })}
                    className={`h-6 rounded-md text-xs font-medium transition-colors ${planForm.course === c
                        ? "bg-primary text-primary-foreground border-primary"
                        : "text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    {c} курс
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-foreground">Вид практики</label>
            <Select
              value={planForm.practiceType}
              onValueChange={(v) => setPlanForm({ ...planForm, practiceType: v as PracticeType })}
            >
              <SelectTrigger className="h-8 text-xs bg-background">
                <SelectValue placeholder="Вид практики">
                  {planForm.practiceType}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Учебная (ознакомительная)" className="text-xs">Учебная (ознакомительная)</SelectItem>
                <SelectItem value="Производственная" className="text-xs">Производственная</SelectItem>
                <SelectItem value="Преддипломная" className="text-xs">Преддипломная</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-foreground">Норма часов в день (по умолчанию для новых дней)</label>
            <Input
              type="number"
              min={1}
              max={12}
              value={planForm.defaultHours}
              onChange={(e) =>
                setPlanForm({ ...planForm, defaultHours: parseInt(e.target.value, 10) || 6 })
              }
              className="h-8 text-xs bg-background font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        </div>

        <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
          <Button size="xs" variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button
            size="xs"
            onClick={onSavePlan}
            disabled={!planForm.specialty.trim() || !planForm.groupName.trim()}
            className="font-medium"
          >
            {editingPlan ? "Сохранить изменения" : "Создать памятку"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
