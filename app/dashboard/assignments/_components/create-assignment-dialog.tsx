"use client";

import React, { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Eye, EyeOff } from "lucide-react";
import { GroupSubjectDTO, createAssignmentAction } from "../actions";

interface CreateAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjects: GroupSubjectDTO[];
  onSuccess: () => void;
}

export function CreateAssignmentDialog({
  open,
  onOpenChange,
  subjects,
  onSuccess,
}: CreateAssignmentDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [newGroupSubjectId, setNewGroupSubjectId] = useState<string>(subjects[0]?.id || "");
  const [newTitle, setNewTitle] = useState<string>("");
  const [newDescription, setNewDescription] = useState<string>("");
  const [newDueDate, setNewDueDate] = useState<string>("");
  const [newIsPublished, setNewIsPublished] = useState<boolean>(true);

  const handleCreateAssignment = () => {
    if (!newGroupSubjectId || !newTitle.trim()) {
      toast.add({
        title: "Заполните обязательные поля: Дисциплина и Заголовок",
        type: "error",
      });
      return;
    }

    startTransition(async () => {
      const res = await createAssignmentAction({
        groupSubjectId: newGroupSubjectId,
        title: newTitle,
        description: newDescription,
        dueDate: newDueDate || undefined,
        isPublished: newIsPublished,
      });

      if (res.success) {
        onOpenChange(false);
        setNewTitle("");
        setNewDescription("");
        setNewDueDate("");
        setNewIsPublished(true);
        toast.add({
          title: newIsPublished
            ? "Домашнее задание успешно опубликовано!"
            : "Черновик задания сохранён!",
          type: "success",
        });
        onSuccess();
      } else {
        toast.add({ title: res.error || "Не удалось создать задание", type: "error" });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-4 gap-3 text-xs sm:max-w-[600px] max-h-[88vh] overflow-y-auto">
        <DialogHeader className="pb-2 border-b gap-1 place-items-start text-left">
          <DialogTitle className="flex items-center gap-2 text-sm font-bold text-foreground">
            <Plus className="h-4 w-4 text-primary" /> Публикация нового задания
          </DialogTitle>
          <DialogDescription className="text-xs">
            Заполните основные параметры и прикрепите описание
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="font-medium text-foreground text-xs">Дисциплина *</label>
              <Select
                value={newGroupSubjectId || subjects[0]?.id || ""}
                onValueChange={setNewGroupSubjectId}
              >
                <SelectTrigger className="h-8 text-xs bg-background">
                  <SelectValue placeholder="Выберите дисциплину" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-xs">
                      {s.subjectName} ({s.teacherName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground text-xs">Срок сдачи (Дедлайн)</label>
              <Input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="h-8 text-xs bg-background"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-medium text-foreground text-xs">Заголовок задания *</label>
            <Input
              placeholder="Например: Домашнее задание №3. Списки и кортежи"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="h-8 text-xs bg-background font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="font-medium text-foreground text-xs">Описание и требования</label>
            <Textarea
              placeholder="Подробное описание задачи..."
              value={newDescription}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setNewDescription(e.target.value)
              }
              className="text-xs bg-background min-h-[100px]"
            />
          </div>

          <div className="pt-2 border-t text-xs">
            <div className="flex items-center justify-between gap-2 py-0.5">
              <label
                htmlFor="modal-assignment-publish-switch"
                className="text-xs font-medium text-foreground cursor-pointer flex items-center gap-1.5"
              >
                {newIsPublished ? (
                  <>
                    <Eye className="h-3.5 w-3.5 text-primary" />
                    <span>Опубликовано</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Черновик</span>
                  </>
                )}
              </label>
              <Switch
                id="modal-assignment-publish-switch"
                checked={newIsPublished}
                onCheckedChange={(checked) => setNewIsPublished(checked)}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
          <Button variant="outline" size="xs" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button size="xs" disabled={isPending} onClick={handleCreateAssignment}>
            {isPending ? "Создание..." : "Создать задание"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
