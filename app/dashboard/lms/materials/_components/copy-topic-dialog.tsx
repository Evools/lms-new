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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Copy,
  Building2,
  BookMarked,
  Layers,
  Loader2,
  Check,
  FileText,
} from "lucide-react";
import {
  CopyTargetGroupDTO,
  getAvailableGroupsForCopyAction,
  copyTopicToGroupsAction,
} from "@/app/dashboard/lms/actions";
import { toast } from "@/components/ui/toast";

interface CopyTopicDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topic: {
    id: string;
    title: string;
    subjectName?: string;
    materials?: unknown[];
  } | null;
  currentGroupId?: string;
}

export function CopyTopicDialog({
  open,
  onOpenChange,
  topic,
  currentGroupId,
}: CopyTopicDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [targetGroups, setTargetGroups] = useState<CopyTargetGroupDTO[]>([]);

  // Selected GroupSubject IDs to copy to
  const [selectedGroupSubjectIds, setSelectedGroupSubjectIds] = useState<string[]>([]);
  const [copyMaterials, setCopyMaterials] = useState(true);

  // Load target groups when dialog opens
  useEffect(() => {
    if (open) {
      setLoadingGroups(true);
      getAvailableGroupsForCopyAction()
        .then((res) => {
          if (res.success && res.groups) {
            setTargetGroups(res.groups);
            // Default select matching subjects in other groups
            const defaultSelected: string[] = [];
            res.groups.forEach((g) => {
              if (g.id !== currentGroupId) {
                const match = g.subjects.find((s) => s.subjectName === topic?.subjectName);
                if (match) {
                  defaultSelected.push(match.id);
                }
              }
            });
            setSelectedGroupSubjectIds(defaultSelected);
          } else {
            toast.add({ title: res.error || "Не удалось загрузить список групп", type: "error" });
          }
        })
        .finally(() => {
          setLoadingGroups(false);
        });
    } else {
      setSelectedGroupSubjectIds([]);
      setCopyMaterials(true);
    }
  }, [open, currentGroupId, topic]);

  const toggleGroupSubject = (gsId: string) => {
    setSelectedGroupSubjectIds((prev) =>
      prev.includes(gsId) ? prev.filter((id) => id !== gsId) : [...prev, gsId]
    );
  };

  const handleCopy = () => {
    if (!topic) return;
    if (selectedGroupSubjectIds.length === 0) {
      toast.add({ title: "Выберите хотя бы одну группу/предмет", type: "error" });
      return;
    }

    startTransition(async () => {
      const res = await copyTopicToGroupsAction({
        topicId: topic.id,
        targetGroupSubjectIds: selectedGroupSubjectIds,
        copyMaterials,
      });

      if (res.success) {
        toast.add({
          title: `Глава успешно скопирована в ${res.copiedTopicsCount || selectedGroupSubjectIds.length} групп(ы)!`,
          type: "success",
        });
        onOpenChange(false);
        router.refresh();
      } else {
        toast.add({ title: res.error || "Ошибка при копировании главы", type: "error" });
      }
    });
  };

  const materialsCount = topic?.materials?.length || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-4 gap-3 text-xs sm:max-w-[440px] max-w-[calc(100vw-2rem)] overflow-hidden">
        <DialogHeader className="gap-1 text-left min-w-0">
          <DialogTitle className="text-sm font-bold flex items-center gap-1.5 text-foreground truncate">
            <Copy className="h-4 w-4 text-primary shrink-0" />
            <span className="truncate">Копировать главу в другие группы</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground truncate">
            Дублирование целой темы и её материалов в другие учебные группы
          </DialogDescription>
        </DialogHeader>

        {topic && (
          <div className="p-2.5 rounded-lg bg-muted/40 border space-y-1 min-w-0 overflow-hidden">
            <div className="flex items-center gap-1.5 min-w-0">
              <Layers className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="font-semibold text-foreground text-xs truncate flex-1 min-w-0">
                {topic.title}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap min-w-0">
              {topic.subjectName && <span className="truncate max-w-[200px]">Предмет: {topic.subjectName}</span>}
              <span>• Материалов: {materialsCount}</span>
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
            <p className="text-xs font-semibold">Нет доступных групп</p>
            <p className="text-[11px]">У вас нет доступа к другим группам для копирования</p>
          </div>
        ) : (
          <div className="space-y-3 pt-1 min-w-0 overflow-hidden">
            <div className="space-y-1.5 min-w-0">
              <label className="text-xs font-medium text-foreground flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>Целевые группы и предметы</span>
                </span>
                <span className="text-[11px] text-muted-foreground shrink-0">
                  Выбрано: {selectedGroupSubjectIds.length}
                </span>
              </label>

              <div className="max-h-[190px] overflow-y-auto space-y-2 pr-1 border rounded-lg p-2 bg-background/50 min-w-0">
                {targetGroups.map((grp) => {
                  const isCurrent = grp.id === currentGroupId;

                  return (
                    <div key={grp.id} className="space-y-1 min-w-0">
                      <div className="text-[11px] font-semibold text-foreground flex items-center gap-1 px-1 text-muted-foreground truncate">
                        <Building2 className="h-3 w-3 text-primary shrink-0" />
                        <span className="truncate">Группа {grp.name} {isCurrent ? "(Текущая)" : ""}</span>
                      </div>

                      <div className="space-y-1 pl-2 min-w-0">
                        {grp.subjects.map((subj) => {
                          const isChecked = selectedGroupSubjectIds.includes(subj.id);
                          const isMatchingSubject = subj.subjectName === topic?.subjectName;

                          return (
                            <label
                              key={subj.id}
                              onClick={() => toggleGroupSubject(subj.id)}
                              className={`flex items-center justify-between p-1.5 rounded-md border text-xs cursor-pointer transition-colors gap-2 min-w-0 ${
                                isChecked
                                  ? "bg-primary/10 border-primary/40 text-primary font-medium"
                                  : "bg-card border-border/60 hover:bg-muted/40 text-foreground"
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate min-w-0 flex-1">
                                <Checkbox
                                  checked={isChecked}
                                  onCheckedChange={() => toggleGroupSubject(subj.id)}
                                  className="h-3.5 w-3.5 shrink-0"
                                />
                                <span className="truncate">{subj.subjectName}</span>
                              </div>

                              <div className="flex items-center gap-1 shrink-0 text-[10px] text-muted-foreground">
                                {isMatchingSubject && (
                                  <Badge
                                    variant="outline"
                                    className="text-[9px] px-1 py-0 h-4 border-primary/30 text-primary font-normal"
                                  >
                                    Совпадение
                                  </Badge>
                                )}
                                <span className="truncate max-w-[100px]">{subj.teacherName}</span>
                              </div>
                            </label>
                          );
                        })}

                        {grp.subjects.length === 0 && (
                          <div className="text-[10px] text-muted-foreground italic px-1 py-0.5">
                            Нет добавленных дисциплин
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Option to copy materials */}
            {materialsCount > 0 && (
              <label
                onClick={() => setCopyMaterials(!copyMaterials)}
                className="flex items-center gap-2 p-2 rounded-lg border bg-muted/30 cursor-pointer select-none"
              >
                <Checkbox
                  checked={copyMaterials}
                  onCheckedChange={(checked) => setCopyMaterials(!!checked)}
                  className="h-3.5 w-3.5"
                />
                <div className="text-xs text-foreground">
                  <span className="font-medium">Копировать вложенные материалы</span>
                  <span className="text-[11px] text-muted-foreground block">
                    Будут скопированы все {materialsCount} материалов этой главы
                  </span>
                </div>
              </label>
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
            disabled={isPending || selectedGroupSubjectIds.length === 0}
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
                <span>Копировать главу</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
