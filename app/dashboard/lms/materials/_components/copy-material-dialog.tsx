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
  Check,
  FileText,
  BookOpen,
  Laptop,
  FlaskConical,
  Plus,
} from "lucide-react";
import {
  MaterialDTO,
  CopyTargetGroupDTO,
  getAvailableGroupsForCopyAction,
  copyMaterialToGroupsAction,
} from "@/app/dashboard/lms/actions";
import { toast } from "@/components/ui/toast";
import { MaterialType } from "@prisma/client";

interface CopyMaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material: MaterialDTO | null;
  currentGroupId?: string;
}

export function CopyMaterialDialog({
  open,
  onOpenChange,
  material,
  currentGroupId,
}: CopyMaterialDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [targetGroups, setTargetGroups] = useState<CopyTargetGroupDTO[]>([]);

  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [selectedGroupSubjectId, setSelectedGroupSubjectId] = useState<string>("");
  const [selectedTopicOption, setSelectedTopicOption] = useState<string>("auto");

  // Load target groups when dialog opens
  useEffect(() => {
    if (open) {
      setLoadingGroups(true);
      getAvailableGroupsForCopyAction()
        .then((res) => {
          if (res.success && res.groups) {
            setTargetGroups(res.groups);
            // Default select first other group if possible
            const otherGroups = res.groups.filter((g) => g.id !== currentGroupId);
            const initialGroup = otherGroups[0] || res.groups[0];
            if (initialGroup) {
              setSelectedGroupId(initialGroup.id);
              // Pick first subject or matching subject name
              const matchingSubject =
                initialGroup.subjects.find((s) => s.subjectName === material?.subjectName) ||
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
      setSelectedTopicOption("auto");
    }
  }, [open, currentGroupId, material]);

  const activeGroup = targetGroups.find((g) => g.id === selectedGroupId);
  const activeSubject = activeGroup?.subjects.find((s) => s.id === selectedGroupSubjectId);

  const handleGroupSelect = (groupId: string) => {
    setSelectedGroupId(groupId);
    const grp = targetGroups.find((g) => g.id === groupId);
    if (grp) {
      const match =
        grp.subjects.find((s) => s.subjectName === material?.subjectName) || grp.subjects[0];
      setSelectedGroupSubjectId(match?.id || "");
      setSelectedTopicOption("auto");
    }
  };

  const handleSubjectSelect = (gsId: string) => {
    setSelectedGroupSubjectId(gsId);
    setSelectedTopicOption("auto");
  };

  const handleCopy = () => {
    if (!material) return;
    if (!selectedGroupId || !selectedGroupSubjectId) {
      toast.add({ title: "Выберите целевую группу и предмет", type: "error" });
      return;
    }

    startTransition(async () => {
      const isAuto = selectedTopicOption === "auto";
      const res = await copyMaterialToGroupsAction({
        materialId: material.id,
        targets: [
          {
            groupId: selectedGroupId,
            groupSubjectId: selectedGroupSubjectId,
            topicId: isAuto ? undefined : selectedTopicOption,
            createTopicTitle: isAuto ? material.topicTitle : undefined,
          },
        ],
      });

      if (res.success) {
        toast.add({
          title: `Материал скопирован в группу ${activeGroup?.name || ""}!`,
          type: "success",
        });
        onOpenChange(false);
        router.refresh();
      } else {
        toast.add({ title: res.error || "Ошибка при копировании материала", type: "error" });
      }
    });
  };

  const getMaterialTypeIcon = (type?: MaterialType) => {
    switch (type) {
      case MaterialType.LECTURE:
        return <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />;
      case MaterialType.PRACTICE:
        return <Laptop className="h-3.5 w-3.5 text-primary shrink-0" />;
      case MaterialType.LAB:
        return <FlaskConical className="h-3.5 w-3.5 text-primary shrink-0" />;
      default:
        return <FileText className="h-3.5 w-3.5 text-primary shrink-0" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-4 gap-3 text-xs sm:max-w-[440px] max-w-[calc(100vw-2rem)] overflow-hidden">
        <DialogHeader className="gap-1 text-left min-w-0">
          <DialogTitle className="text-sm font-bold flex items-center gap-1.5 text-foreground truncate">
            <Copy className="h-4 w-4 text-primary shrink-0" />
            <span className="truncate">Копировать материал</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground truncate">
            Дублирование материала в учебную программу другой группы
          </DialogDescription>
        </DialogHeader>

        {material && (
          <div className="p-2.5 rounded-lg bg-muted/40 border space-y-1 min-w-0 overflow-hidden">
            <div className="flex items-center gap-1.5 min-w-0">
              {getMaterialTypeIcon(material.type)}
              <span className="font-semibold text-foreground text-xs truncate flex-1 min-w-0">
                {material.title}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap min-w-0">
              {material.subjectName && <span className="truncate max-w-[200px]">Предмет: {material.subjectName}</span>}
              <span className="truncate max-w-[200px]">• Глава: {material.topicTitle}</span>
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

            {/* 3. Target Chapter Select */}
            {activeSubject && (
              <div className="space-y-1 min-w-0">
                <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>Глава / Раздел</span>
                </label>
                <Select
                  value={selectedTopicOption}
                  onValueChange={setSelectedTopicOption}
                  disabled={isPending}
                >
                  <SelectTrigger className="h-8 text-xs font-medium bg-background min-w-0 max-w-full">
                    <SelectValue>
                      {selectedTopicOption === "auto"
                        ? `Создать главу «${material?.topicTitle || "Новая глава"}»`
                        : activeSubject.topics.find((t) => t.id === selectedTopicOption)?.title ||
                          "Выберите главу"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto" className="text-xs text-primary font-medium">
                      <div className="flex items-center gap-1.5 truncate min-w-0">
                        <Plus className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="truncate">Создать главу «{material?.topicTitle || "Новая глава"}»</span>
                      </div>
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
                <span>Копировать</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
