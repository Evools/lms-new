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
import { Plus, Layers } from "lucide-react";
import { DiaryDayTopic, SpecialtyDiaryPlan } from "../types";

export interface DayTopicFormData {
  dayNumber: number;
  section: string;
  topic: string;
  tasksContent: string;
  hours: number;
}

interface DayTopicDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingDayTopic: DiaryDayTopic | null;
  currentDiaryPlan: SpecialtyDiaryPlan | null;
  dayTopicForm: DayTopicFormData;
  setDayTopicForm: React.Dispatch<React.SetStateAction<DayTopicFormData>>;
  isCustomSection: boolean;
  setIsCustomSection: (val: boolean) => void;
  availablePlanSections: string[];
  onSaveDayTopic: () => void;
}

export function DayTopicDialog({
  open,
  onOpenChange,
  editingDayTopic,
  currentDiaryPlan,
  dayTopicForm,
  setDayTopicForm,
  isCustomSection,
  setIsCustomSection,
  availablePlanSections,
  onSaveDayTopic,
}: DayTopicDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-4 gap-3 text-xs sm:max-w-[500px]">
        <DialogHeader className="place-items-start text-left gap-1 pb-2 border-b">
          <DialogTitle className="text-sm font-bold flex items-center gap-1.5">
            <Plus className="h-4 w-4 text-primary" />
            {editingDayTopic ? `Редактировать запись: День ${editingDayTopic.dayNumber}` : "Добавить новый день в памятку"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Группа: <strong className="text-foreground">{currentDiaryPlan?.groupName}</strong> • {currentDiaryPlan?.specialty} ({currentDiaryPlan?.course} курс)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground">Номер дня (№)</label>
              <Input
                type="number"
                min={1}
                value={dayTopicForm.dayNumber}
                onChange={(e) =>
                  setDayTopicForm({ ...dayTopicForm, dayNumber: parseInt(e.target.value, 10) || 1 })
                }
                className="h-8 text-xs font-mono bg-background [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground">Количество часов</label>
              <Input
                type="number"
                min={1}
                max={12}
                value={dayTopicForm.hours}
                onChange={(e) =>
                  setDayTopicForm({ ...dayTopicForm, hours: parseInt(e.target.value, 10) || 6 })
                }
                className="h-8 text-xs font-mono bg-background [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                <Layers className="h-3.5 w-3.5 text-primary" />
                Раздел программы
              </label>
              <button
                type="button"
                onClick={() => setIsCustomSection(!isCustomSection)}
                className="text-[10px] text-primary hover:underline font-medium"
              >
                {isCustomSection ? "Выбрать из списка" : "+ Свой раздел"}
              </button>
            </div>

            {isCustomSection ? (
              <Input
                value={dayTopicForm.section}
                onChange={(e) => setDayTopicForm({ ...dayTopicForm, section: e.target.value })}
                placeholder="Введите название нового раздела..."
                className="h-8 text-xs bg-background font-medium"
                autoFocus
              />
            ) : (
              <Select
                value={dayTopicForm.section}
                onValueChange={(val) => {
                  if (val === "__NEW__") {
                    setIsCustomSection(true);
                  } else {
                    setDayTopicForm({ ...dayTopicForm, section: val });
                  }
                }}
              >
                <SelectTrigger className="h-8 text-xs bg-background w-full font-medium">
                  <SelectValue placeholder="Выберите раздел программы..." />
                </SelectTrigger>
                <SelectContent>
                  {Array.from(new Set([...availablePlanSections, ...(dayTopicForm.section ? [dayTopicForm.section] : [])]))
                    .filter(Boolean)
                    .map((sec) => (
                      <SelectItem key={sec} value={sec} className="text-xs">
                        {sec}
                      </SelectItem>
                    ))}
                  <SelectItem value="__NEW__" className="text-xs text-primary font-medium">
                    + Создать новый раздел...
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-foreground">Тема занятия / Индивидуальное задание</label>
            <Input
              value={dayTopicForm.topic}
              onChange={(e) => setDayTopicForm({ ...dayTopicForm, topic: e.target.value })}
              placeholder="например, Разработка адаптивной формы регистрации пользователей"
              className="h-8 text-xs bg-background font-medium"
              autoFocus={!isCustomSection}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-foreground">
              Краткое содержание выполненных работ (текст для студента)
            </label>
            <textarea
              value={dayTopicForm.tasksContent}
              onChange={(e) => setDayTopicForm({ ...dayTopicForm, tasksContent: e.target.value })}
              placeholder="Подробный перечень действий, которые студент перепишет в дневник..."
              rows={4}
              className="w-full p-2.5 text-xs bg-background border border-border focus:border-primary focus:outline-none rounded-lg leading-relaxed resize-none"
            />
          </div>
        </div>

        <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
          <Button size="xs" variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button
            size="xs"
            onClick={onSaveDayTopic}
            disabled={!dayTopicForm.topic.trim() || !dayTopicForm.section.trim()}
            className="font-medium"
          >
            {editingDayTopic ? "Сохранить запись" : "Добавить день"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
