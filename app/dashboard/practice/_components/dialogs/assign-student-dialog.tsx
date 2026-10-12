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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ArrowRightLeft, Building2 } from "lucide-react";
import { CompanyPartner, PracticeType, StudentPracticeRecord } from "../types";

export interface MoveFormData {
  companyId: string;
  practiceType: PracticeType;
  reason: string;
  customReason: string;
  startDate: string;
  endDate: string;
  companyMentor: string;
}

interface AssignStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetStudentsList: StudentPracticeRecord[];
  companies: CompanyPartner[];
  moveForm: MoveFormData;
  setMoveForm: React.Dispatch<React.SetStateAction<MoveFormData>>;
  onSaveMovement: () => void;
}

export function AssignStudentDialog({
  open,
  onOpenChange,
  targetStudentsList,
  companies,
  moveForm,
  setMoveForm,
  onSaveMovement,
}: AssignStudentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-4 gap-3 text-xs sm:max-w-[490px]">
        <DialogHeader className="place-items-start text-left gap-1 pb-2 border-b">
          <DialogTitle className="text-sm font-bold flex items-center gap-1.5">
            <ArrowRightLeft className="h-4 w-4 text-primary" />
            {targetStudentsList.length === 1 && targetStudentsList[0].companyId
              ? "Перевести студента на другую базу"
              : targetStudentsList.length > 1
                ? `Направить выбранных студентов (${targetStudentsList.length})`
                : "Направить студента на практику"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {targetStudentsList.length === 1 ? (
              <>Студент: <strong className="text-foreground">{targetStudentsList[0]?.studentName}</strong> ({targetStudentsList[0]?.groupName})</>
            ) : (
              <>Будут направлены <strong>{targetStudentsList.length}</strong> выбранных студентов</>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {targetStudentsList.length > 1 && (
            <div className="p-2 rounded-lg bg-muted/40 border space-y-1 max-h-24 overflow-y-auto text-[11px]">
              <div className="text-muted-foreground font-medium text-[10px]">Список направляемых студентов:</div>
              <div className="flex flex-wrap gap-1">
                {targetStudentsList.map((st) => (
                  <Badge key={st.id} variant="outline" className="bg-background text-[10px] font-normal">
                    {st.studentName} ({st.groupName})
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {targetStudentsList.length === 1 && targetStudentsList[0].companyName && (
            <div className="p-2.5 rounded-lg bg-muted/40 border space-y-1 text-xs">
              <div className="text-muted-foreground text-[11px]">Текущее место практики:</div>
              <div className="font-bold text-foreground flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-primary" />
                <span>{targetStudentsList[0].companyName}</span>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-foreground">
              {targetStudentsList.length === 1 && targetStudentsList[0].companyId
                ? "Новая база практики (Организация)"
                : "База практики (Организация)"}
            </label>
            <Select
              value={moveForm.companyId}
              onValueChange={(v) => setMoveForm({ ...moveForm, companyId: v })}
            >
              <SelectTrigger className="h-8 text-xs bg-background font-medium">
                <SelectValue placeholder="Выберите организацию">
                  {companies.find((c) => c.id === moveForm.companyId)?.name || "Выберите организацию"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {companies.length === 0 ? (
                  <SelectItem value="__none__" disabled className="text-xs">
                    Нет баз практик (добавьте базу во вкладке «Базы практик»)
                  </SelectItem>
                ) : (
                  companies.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-xs">
                      {c.name} ({c.quotaTotal - c.quotaUsed} мест свободно)
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-foreground">Вид практики</label>
            <Select
              value={moveForm.practiceType}
              onValueChange={(v) => setMoveForm({ ...moveForm, practiceType: v as PracticeType })}
            >
              <SelectTrigger className="h-8 text-xs bg-background">
                <SelectValue placeholder="Вид практики">
                  {moveForm.practiceType}
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
            <label className="text-[11px] font-semibold text-foreground">
              Основание / Причина направления
            </label>
            <Select
              value={moveForm.reason}
              onValueChange={(v) => setMoveForm({ ...moveForm, reason: v })}
            >
              <SelectTrigger className="h-8 text-xs bg-background">
                <SelectValue placeholder="Выберите причину">
                  {moveForm.reason}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Плановое распределение" className="text-xs">Плановое распределение</SelectItem>
                <SelectItem value="По согласованию с работодателем" className="text-xs">По согласованию с работодателем</SelectItem>
                <SelectItem value="По личному заявлению студента" className="text-xs">По личному заявлению студента</SelectItem>
                <SelectItem value="Расширение спектра практических задач" className="text-xs">Расширение спектра практических задач</SelectItem>
                <SelectItem value="Сокращение квоты на предыдущей базе" className="text-xs">Сокращение квоты на предыдущей базе</SelectItem>
                <SelectItem value="Другое (указать вручную)" className="text-xs">Другое (указать вручную)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {moveForm.reason === "Другое (указать вручную)" && (
            <div className="space-y-1">
              <Input
                value={moveForm.customReason}
                onChange={(e) => setMoveForm({ ...moveForm, customReason: e.target.value })}
                placeholder="Введите причину..."
                className="h-8 text-xs bg-background"
                autoFocus
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground">Дата начала</label>
              <Input
                value={moveForm.startDate}
                onChange={(e) => setMoveForm({ ...moveForm, startDate: e.target.value })}
                placeholder="15.10.2026"
                className="h-8 text-xs font-mono bg-background"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground">Дата окончания</label>
              <Input
                value={moveForm.endDate}
                onChange={(e) => setMoveForm({ ...moveForm, endDate: e.target.value })}
                placeholder="05.11.2026"
                className="h-8 text-xs font-mono bg-background"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-foreground">Руководитель от предприятия (Наставник)</label>
            <Input
              value={moveForm.companyMentor}
              onChange={(e) => setMoveForm({ ...moveForm, companyMentor: e.target.value })}
              placeholder="ФИО наставника (или оставьте пустым для автозаполнения)"
              className="h-8 text-xs bg-background"
            />
          </div>
        </div>

        <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
          <Button size="xs" variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button size="xs" onClick={onSaveMovement} className="font-medium">
            {targetStudentsList.length === 1 && targetStudentsList[0].companyId
              ? "Подтвердить перевод"
              : targetStudentsList.length > 1
                ? `Направить (${targetStudentsList.length} чел.)`
                : "Направить студента"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
