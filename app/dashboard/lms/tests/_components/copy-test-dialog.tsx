"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Copy,
  Building2,
  BookMarked,
  Layers,
  Loader2,
  FileCheck2,
  HelpCircle,
  Clock,
} from "lucide-react";
import {
  TestDTO,
  CopyTargetGroupDTO,
  getAvailableGroupsForCopyAction,
  copyTestToGroupsAction,
} from "@/app/dashboard/lms/actions";
import { toast } from "@/components/ui/toast";

interface CopyTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  test: TestDTO | null;
  currentGroupId?: string;
}

export function CopyTestDialog({
  open,
  onOpenChange,
  test,
  currentGroupId,
}: CopyTestDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [targetGroups, setTargetGroups] = useState<CopyTargetGroupDTO[]>([]);

  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [selectedGroupSubjectId, setSelectedGroupSubjectId] = useState<string>("");
  const [selectedTopicId, setSelectedTopicId] = useState<string>("none");

  useEffect(() => {
    if (open) {
      setLoadingGroups(true);
      getAvailableGroupsForCopyAction()
        .then((res) => {
          if (res.success && res.groups) {
            setTargetGroups(res.groups);
            const otherGroups = res.groups.filter((g) => g.id !== currentGroupId);
            const initialGroup = otherGroups[0] || res.groups[0];
            if (initialGroup) {
              setSelectedGroupId(initialGroup.id);
              const matchingSubject =
                initialGroup.subjects.find((s) => s.subjectName === test?.subjectName) ||
                initialGroup.subjects[0];
              if (matchingSubject) {
                setSelectedGroupSubjectId(matchingSubject.id);
              }
            }
          } else {
            toast.add({ title: res.error || "Не удалось загрузить список групп", type: "error" });
          }
        })
        .finally(() => {
          setLoadingGroups(false);
        });
    } else {
      setSelectedGroupId("");
      setSelectedGroupSubjectId("");
      setSelectedTopicId("none");
    }
  }, [open, currentGroupId, test]);

  const activeGroup = targetGroups.find((g) => g.id === selectedGroupId);
  const activeSubject = activeGroup?.subjects.find((s) => s.id === selectedGroupSubjectId);

  const handleGroupSelect = (groupId: string) => {
    setSelectedGroupId(groupId);
    const grp = targetGroups.find((g) => g.id === groupId);
    if (grp) {
      const match =
        grp.subjects.find((s) => s.subjectName === test?.subjectName) || grp.subjects[0];
      setSelectedGroupSubjectId(match?.id || "");
      setSelectedTopicId("none");
    }
  };

  const handleSubjectSelect = (gsId: string) => {
    setSelectedGroupSubjectId(gsId);
    setSelectedTopicId("none");
  };

  const handleCopy = () => {
    if (!test) return;
    if (!selectedGroupId || !selectedGroupSubjectId) {
      toast.add({ title: "Выберите целевую группу и предмет", type: "error" });
      return;
    }

    startTransition(async () => {
      const res = await copyTestToGroupsAction({
        testId: test.id,
        targets: [
          {
            groupId: selectedGroupId,
            groupSubjectId: selectedGroupSubjectId,
            topicId: selectedTopicId === "none" ? undefined : selectedTopicId,
          },
        ],
      });

      if (res.success) {
        toast.add({
          title: `Тест успешно скопирован в группу ${activeGroup?.name || ""}!`,
          type: "success",
        });
        onOpenChange(false);
        router.refresh();
      } else {
        toast.add({ title: res.error || "Ошибка при копировании теста", type: "error" });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-4 gap-3 text-xs sm:max-w-[440px] max-w-[calc(100vw-2rem)] overflow-hidden">
        <DialogHeader className="gap-1 text-left min-w-0">
          <DialogTitle className="text-sm font-bold flex items-center gap-1.5 text-foreground truncate">
            <Copy className="h-4 w-4 text-primary shrink-0" />
            <span className="truncate">Копировать тест</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground truncate">
            Дублирование тестирования со всеми вопросами в другую учебную группу
          </DialogDescription>
        </DialogHeader>

        {test && (
          <div className="p-2.5 rounded-lg bg-muted/40 border space-y-1 min-w-0 overflow-hidden">
            <div className="flex items-center gap-1.5 min-w-0">
              <FileCheck2 className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="font-semibold text-foreground text-xs truncate flex-1 min-w-0">
                {test.title}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap min-w-0">
              {test.subjectName && <span className="truncate max-w-[180px]">Предмет: {test.subjectName}</span>}
              <span>• Вопросов: {test.questionsCount}</span>
              {test.timeLimit && (
                <span className="flex items-center gap-0.5">
                  • <Clock className="h-3 w-3 inline text-muted-foreground shrink-0" /> {test.timeLimit} мин
                </span>
              )}
            </div>
          </div>
        )}

        {loadingGroups ? (
          <div className="py-8 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-xs">Загрузка доступных групп...</span>
          </div>
        ) : targetGroups.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground space-y-1">
            <p className="text-xs font-semibold">Нет доступных целевых групп</p>
            <p className="text-[11px]">У вас нет доступа к другим группам для копирования</p>
          </div>
        ) : (
          <div className="space-y-3 pt-1 min-w-0 overflow-hidden">
            {/* 1. Target Group Select */}
            <div className="space-y-1 min-w-0">
              <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>Целевая группа</span>
              </label>
              <Select
                value={selectedGroupId}
                onValueChange={handleGroupSelect}
                disabled={isPending}
              >
                <SelectTrigger className="h-8 text-xs font-medium bg-background min-w-0 max-w-full">
                  <SelectValue>
                    {activeGroup
                      ? `Группа ${activeGroup.name}${activeGroup.id === currentGroupId ? " (Текущая)" : ""}`
                      : "Выберите группу"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {targetGroups.map((g) => (
                    <SelectItem key={g.id} value={g.id} className="text-xs">
                      <span className="truncate">
                        Группа {g.name} {g.id === currentGroupId ? "(Текущая)" : ""}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 2. Target Subject Select */}
            {activeGroup && (
              <div className="space-y-1 min-w-0">
                <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <BookMarked className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>Дисциплина в целевой группе</span>
                </label>
                {activeGroup.subjects.length > 0 ? (
                  <Select
                    value={selectedGroupSubjectId}
                    onValueChange={handleSubjectSelect}
                    disabled={isPending}
                  >
                    <SelectTrigger className="h-8 text-xs font-medium bg-background min-w-0 max-w-full">
                      <SelectValue>
                        {activeSubject
                          ? `${activeSubject.subjectName} (${activeSubject.teacherName})`
                          : "Выберите предмет"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {activeGroup.subjects.map((s) => (
                        <SelectItem key={s.id} value={s.id} className="text-xs">
                          <span className="truncate">
                            {s.subjectName} ({s.teacherName})
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-2 border rounded-lg text-muted-foreground text-[11px]">
                    В этой группе еще нет дисциплин
                  </div>
                )}
              </div>
            )}

            {/* 3. Target Topic Select */}
            {activeSubject && (
              <div className="space-y-1 min-w-0">
                <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>Привязать к главе (опционально)</span>
                </label>
                <Select
                  value={selectedTopicId}
                  onValueChange={setSelectedTopicId}
                  disabled={isPending}
                >
                  <SelectTrigger className="h-8 text-xs font-medium bg-background min-w-0 max-w-full">
                    <SelectValue>
                      {selectedTopicId === "none"
                        ? "Без привязки к главе (Общий тест)"
                        : activeSubject.topics.find((t) => t.id === selectedTopicId)?.title ||
                          "Выберите главу"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-xs">
                      <span className="truncate">Без привязки к главе (Общий тест)</span>
                    </SelectItem>
                    {activeSubject.topics.map((t) => (
                      <SelectItem key={t.id} value={t.id} className="text-xs">
                        <span className="truncate">{t.title}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-1">
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="h-8 text-xs px-3 font-medium"
          >
            Отмена
          </Button>
          <Button
            type="button"
            size="xs"
            onClick={handleCopy}
            disabled={isPending || !selectedGroupId || !selectedGroupSubjectId}
            className="h-8 text-xs px-3 font-medium gap-1.5"
          >
            {isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Копирование...</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Копировать тест</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
