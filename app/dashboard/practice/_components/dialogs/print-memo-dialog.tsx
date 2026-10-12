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
import { SpecialtyDiaryPlan } from "../types";

interface SectionSummaryItem {
  section: string;
  daysCount: number;
  hoursCount: number;
  percent: number;
}

interface PrintMemoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentDiaryPlan: SpecialtyDiaryPlan | null;
  sectionHoursSummary: SectionSummaryItem[];
  calculatedDates: string[];
}

export function PrintMemoDialog({
  open,
  onOpenChange,
  currentDiaryPlan,
  sectionHoursSummary,
  calculatedDates,
}: PrintMemoDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-5 gap-3.5 text-xs sm:max-w-[780px] max-h-[92vh] overflow-y-auto">
        <DialogHeader className="place-items-start text-left gap-1 pb-2 border-b">
          <div className="flex items-center justify-between w-full">
            <DialogTitle className="text-sm font-bold flex items-center gap-1.5">
              <Printer className="h-4 w-4 text-primary" />
              Печать: Календарно-тематический план и расчасовка практики
            </DialogTitle>
            <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">
              Утверждённый план
            </Badge>
          </div>
        </DialogHeader>

        {currentDiaryPlan && (
          <div className="p-6 bg-background rounded-lg border space-y-4 text-foreground font-serif leading-relaxed text-xs">
            <div className="text-center space-y-1 border-b pb-3">
              <div className="font-bold text-xs uppercase tracking-wide">ПРОФЕССИОНАЛЬНЫЙ ЛИЦЕЙ / КОЛЛЕДЖ</div>
              <div className="font-bold text-sm">
                КАЛЕНДАРНО-ТЕМАТИЧЕСКИЙ ПЛАН И РАСЧАСОВКА ПРАКТИКИ
              </div>
              <div className="text-xs font-bold text-primary font-sans pt-0.5">
                УЧЕБНАЯ ГРУППА: «{currentDiaryPlan.groupName}»
              </div>
              <div className="text-[11px] text-muted-foreground font-sans">
                Специальность: <strong>«{currentDiaryPlan.specialty}»</strong> ({currentDiaryPlan.course} курс) • {currentDiaryPlan.practiceType} практика
              </div>
              <div className="text-[10px] text-muted-foreground font-sans">
                Период практики: с <strong>{calculatedDates[0]}</strong> по <strong>{calculatedDates[calculatedDates.length - 1]}</strong> (Всего {currentDiaryPlan.days.length} дн. / {currentDiaryPlan.totalHours} ак. ч.)
              </div>
            </div>

            {/* Summary Hours Breakdown Table */}
            <div className="space-y-1 font-sans">
              <div className="font-bold text-[11px]">Сводное распределение часов по разделам (Расчасовка):</div>
              <table className="w-full text-[10px] border-collapse border border-foreground/30">
                <thead>
                  <tr className="bg-muted/40 border-b border-foreground/30">
                    <th className="p-1.5 border-r border-foreground/30 text-left">Раздел программы практики</th>
                    <th className="p-1.5 border-r border-foreground/30 text-center w-20">Дней</th>
                    <th className="p-1.5 border-r border-foreground/30 text-center w-24">Академ. часы</th>
                    <th className="p-1.5 text-center w-20">Доля (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-foreground/20">
                  {sectionHoursSummary.map((sec, idx) => (
                    <tr key={idx}>
                      <td className="p-1.5 border-r border-foreground/30 font-medium">{sec.section}</td>
                      <td className="p-1.5 border-r border-foreground/30 text-center font-mono">{sec.daysCount} дн.</td>
                      <td className="p-1.5 border-r border-foreground/30 text-center font-mono font-bold">{sec.hoursCount} ч.</td>
                      <td className="p-1.5 text-center font-mono">{sec.percent}%</td>
                    </tr>
                  ))}
                  <tr className="bg-muted/20 font-bold border-t border-foreground/30">
                    <td className="p-1.5 border-r border-foreground/30">ИТОГО ПО ПРОГРАММЕ:</td>
                    <td className="p-1.5 border-r border-foreground/30 text-center font-mono">{currentDiaryPlan.days.length} дн.</td>
                    <td className="p-1.5 border-r border-foreground/30 text-center font-mono">{currentDiaryPlan.totalHours} ч.</td>
                    <td className="p-1.5 text-center font-mono">100%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Day-by-Day Table */}
            <div className="space-y-1 font-sans pt-2">
              <div className="font-bold text-[11px]">Календарно-тематический график заполнения дневника по дням:</div>
              <table className="w-full text-[10px] border-collapse border border-foreground/30 font-sans">
                <thead>
                  <tr className="bg-muted/40 border-b border-foreground/30 text-foreground">
                    <th className="p-1.5 border-r border-foreground/30 text-center w-10">№ дня</th>
                    <th className="p-1.5 border-r border-foreground/30 text-center w-20">Дата</th>
                    <th className="p-1.5 border-r border-foreground/30 text-left">Тема и содержание выполненных работ</th>
                    <th className="p-1.5 text-center w-12">Часы</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-foreground/20">
                  {currentDiaryPlan.days.map((d, i) => (
                    <tr key={d.id}>
                      <td className="p-1.5 border-r border-foreground/30 text-center font-bold">{d.dayNumber}</td>
                      <td className="p-1.5 border-r border-foreground/30 text-center font-mono">{calculatedDates[i]}</td>
                      <td className="p-1.5 border-r border-foreground/30">
                        <div className="font-bold">{d.topic}</div>
                        <div className="text-[9px] text-muted-foreground">{d.tasksContent}</div>
                      </td>
                      <td className="p-1.5 text-center font-mono">{d.hours} ч.</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 mt-2 border-t text-[10px] font-sans">
              <div>
                <div>Зав. учебно-производственной частью: ___________________</div>
              </div>
              <div className="text-right">
                <div>Руководитель практики от колледжа: ___________________</div>
              </div>
            </div>
          </div>
        )}

        {!currentDiaryPlan && (
          <div className="py-12 text-center text-muted-foreground text-xs space-y-1">
            <p className="font-semibold text-foreground">Памятка не выбрана</p>
            <p>Выберите существующую памятку группы или создайте новую для печати.</p>
          </div>
        )}

        <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
          <Button size="xs" variant="outline" onClick={() => onOpenChange(false)}>
            Закрыть
          </Button>
          <Button
            size="xs"
            disabled={!currentDiaryPlan}
            onClick={() => {
              window.print();
            }}
            className="gap-1.5 font-medium"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Распечатать памятку</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
