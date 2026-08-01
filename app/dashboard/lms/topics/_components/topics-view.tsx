"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MaterialType } from "@prisma/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  FolderKanban,
  Plus,
  Search,
  Building2,
  BookOpen,
  User,
  Trash2,
  FileText,
  Video,
  Link2,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  ClipboardList,
} from "lucide-react";
import { GroupItemDTO, GroupSubjectDTO, TopicDTO, MaterialDTO, createTopicAction, deleteTopicAction } from "@/app/dashboard/lms/actions";

interface TopicsViewProps {
  groups: GroupItemDTO[];
  subjects: GroupSubjectDTO[];
  topics: TopicDTO[];
  selectedGroupId: string;
  selectedGroupSubjectId: string;
  canCreate: boolean;
}

export function TopicsView({
  groups,
  subjects,
  topics,
  selectedGroupId,
  selectedGroupSubjectId,
  canCreate,
}: TopicsViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [searchQuery, setSearchQuery] = useState("");
  const [expandedTopicIds, setExpandedTopicIds] = useState<Record<string, boolean>>({});

  // Create topic modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newGroupSubjectId, setNewGroupSubjectId] = useState(selectedGroupSubjectId || subjects[0]?.id || "");
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newOrder, setNewOrder] = useState<number>(topics.length + 1);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const currentGroupObj = groups.find((g) => g.id === selectedGroupId);

  const handleGroupChange = (val: string) => {
    router.push(`/dashboard/lms/topics?group=${val}`);
  };

  const handleSubjectChange = (val: string) => {
    if (val === "all") {
      router.push(`/dashboard/lms/topics?group=${selectedGroupId}`);
    } else {
      router.push(`/dashboard/lms/topics?group=${selectedGroupId}&subject=${val}`);
    }
  };

  const toggleExpandTopic = (id: string) => {
    setExpandedTopicIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateTopic = () => {
    if (!newGroupSubjectId || !newTitle.trim()) {
      setErrorMsg("Заполните предмет и название темы");
      return;
    }

    setErrorMsg(null);
    startTransition(async () => {
      const res = await createTopicAction({
        groupSubjectId: newGroupSubjectId,
        title: newTitle,
        description: newDescription,
        order: newOrder,
      });

      if (res.success) {
        setSuccessMsg("Тема успешно создана!");
        setIsCreateOpen(false);
        setNewTitle("");
        setNewDescription("");
        router.refresh();
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setErrorMsg(res.error || "Ошибка при создании темы");
      }
    });
  };

  const handleDeleteTopic = (id: string) => {
    if (!confirm("Вы уверены, что хотите удалить эту тему со всеми материалами?")) return;

    startTransition(async () => {
      const res = await deleteTopicAction(id);
      if (res.success) {
        setSuccessMsg("Тема удалена");
        router.refresh();
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setErrorMsg(res.error || "Не удалось удалить тему");
      }
    });
  };

  const filteredTopics = topics.filter((t) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return t.title.toLowerCase().includes(query) || t.subjectName.toLowerCase().includes(query);
  });

  const getMaterialIcon = (type: MaterialType) => {
    switch (type) {
      case MaterialType.LECTURE:
      case MaterialType.PRACTICE:
      case MaterialType.LAB:
      case MaterialType.DOCUMENT:
        return <FileText className="h-3.5 w-3.5 text-primary" />;
      case MaterialType.VIDEO:
        return <Video className="h-3.5 w-3.5 text-primary" />;
      case MaterialType.LINK:
        return <Link2 className="h-3.5 w-3.5 text-primary" />;
      default:
        return <FileText className="h-3.5 w-3.5 text-primary" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-4 rounded-xl border shadow-xs">
        <div className="space-y-0.5">
          <h1 className="text-base font-bold text-foreground flex items-center gap-2">
            <FolderKanban className="h-5 w-5 text-primary" /> Темы и Уроки (Модули LMS)
          </h1>
          <p className="text-xs text-muted-foreground">
            Учебная программа по предметам: порядок тем, уроки, лекции и материалы
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canCreate && (
            <Link href={`/dashboard/lms/topics/new?group=${selectedGroupId}&subject=${selectedGroupSubjectId}`}>
              <Button size="xs" className="h-8 text-xs gap-1.5 font-medium">
                <Plus className="h-3.5 w-3.5" /> Создать тему
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Group & Subject Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-card p-3 rounded-xl border items-center">
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
            <Building2 className="h-3.5 w-3.5 text-primary" /> Группа
          </label>
          <Select value={selectedGroupId} onValueChange={handleGroupChange}>
            <SelectTrigger className="h-8 text-xs font-semibold bg-background">
              <SelectValue>{currentGroupObj?.name || "Выберите группу"}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {groups.map((g) => (
                <SelectItem key={g.id} value={g.id} className="text-xs">
                  Группа {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5 text-primary" /> Предмет
          </label>
          <Select value={selectedGroupSubjectId || "all"} onValueChange={handleSubjectChange}>
            <SelectTrigger className="h-8 text-xs font-semibold bg-background">
              <SelectValue>
                {subjects.find((s) => s.id === selectedGroupSubjectId)?.subjectName || "Все предметы"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs font-medium">
                Все предметы
              </SelectItem>
              {subjects.map((s) => (
                <SelectItem key={s.id} value={s.id} className="text-xs">
                  {s.subjectName} ({s.teacherName})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground">Поиск по темам</label>
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Название темы..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 text-xs pl-8 bg-background"
            />
          </div>
        </div>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="p-3 rounded-lg border border-primary/30 bg-primary/10 text-primary text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Topics Accordion List */}
      <div className="space-y-3">
        {filteredTopics.map((topic, index) => {
          const isExpanded = expandedTopicIds[topic.id] !== false; // expanded by default

          return (
            <Card key={topic.id} className="border shadow-none rounded-xl overflow-hidden">
              {/* Topic Header Row */}
              <div
                onClick={() => toggleExpandTopic(topic.id)}
                className="p-3.5 bg-card hover:bg-muted/40 transition-colors flex items-center justify-between gap-3 cursor-pointer select-none"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                    #{topic.order || index + 1}
                  </div>
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-[10px] border-primary/30 text-primary font-medium px-2 py-0.5">
                        {topic.subjectName}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-normal">
                        <User className="h-3 w-3 text-muted-foreground" /> {topic.teacherName}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-foreground truncate">{topic.title}</h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="secondary" className="text-[10px] font-normal gap-1 hidden sm:inline-flex">
                    <FileText className="h-3 w-3 text-primary" /> {topic.materialsCount} мат.
                  </Badge>

                  {canCreate && (
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTopic(topic.id);
                      }}
                      className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                      title="Удалить тему"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}

                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Topic Expanded Details & Materials List */}
              {isExpanded && (
                <div className="p-3.5 pt-2 border-t bg-muted/20 space-y-3">
                  {topic.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed bg-background p-2.5 rounded-lg border">
                      {topic.description}
                    </p>
                  )}

                  {/* Materials Under Topic */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground font-semibold px-1">
                      <span>Материалы к уроку ({topic.materials.length}):</span>
                      {canCreate && (
                        <Link href={`/dashboard/lms/materials?group=${selectedGroupId}&topic=${topic.id}`}>
                          <span className="text-primary hover:underline font-medium flex items-center gap-1 cursor-pointer">
                            <Plus className="h-3 w-3" /> Добавить материал
                          </span>
                        </Link>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {topic.materials.map((mat: MaterialDTO) => (
                        <div
                          key={mat.id}
                          className="p-2.5 rounded-lg border bg-background flex items-center justify-between gap-2 hover:border-primary/40 transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {getMaterialIcon(mat.type)}
                            <span className="text-xs font-medium text-foreground truncate">{mat.title}</span>
                          </div>

                          {(mat.fileUrl || mat.linkUrl) && (
                            <a
                              href={mat.fileUrl || mat.linkUrl || "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline text-[11px] font-medium flex items-center gap-1 shrink-0 bg-primary/10 px-2 py-0.5 rounded-md"
                            >
                              <ExternalLink className="h-3 w-3" /> Открыть
                            </a>
                          )}
                        </div>
                      ))}

                      {topic.materials.length === 0 && (
                        <div className="col-span-full py-4 text-center text-muted-foreground text-xs italic bg-background rounded-lg border">
                          К этой теме ещё не прикреплены материалы
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          );
        })}

        {filteredTopics.length === 0 && (
          <div className="py-12 text-center text-muted-foreground text-xs bg-card border rounded-xl space-y-2">
            <FolderKanban className="h-8 w-8 text-muted-foreground/40 mx-auto" />
            <p className="font-semibold text-foreground">Темы не найдены</p>
            <p className="text-[11px] text-muted-foreground">Для этой группы или предмета темы ещё не добавлены</p>
          </div>
        )}
      </div>

      {/* Modal: Create Topic */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="p-4 gap-3 text-xs sm:max-w-[440px]">
          <DialogHeader className="pb-2 border-b gap-1">
            <DialogTitle className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Plus className="h-4 w-4 text-primary" /> Создание новой темы (урока)
            </DialogTitle>
            <DialogDescription className="text-xs">
              Укажите учебную дисциплину, порядок и заголовок темы
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-1 text-xs">
            <div className="space-y-1">
              <label className="font-medium text-foreground text-xs">Учебная дисциплина</label>
              <Select value={newGroupSubjectId} onValueChange={setNewGroupSubjectId}>
                <SelectTrigger className="h-8 text-xs bg-background">
                  <SelectValue>
                    {subjects.find((s) => s.id === newGroupSubjectId)?.subjectName || "Выберите предмет"}
                  </SelectValue>
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

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2 space-y-1">
                <label className="font-medium text-foreground text-xs">Название темы</label>
                <Input
                  placeholder="Например: Тема 1. Введение в REST API"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="h-8 text-xs bg-background"
                />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-foreground text-xs">Порядковый №</label>
                <Input
                  type="number"
                  value={newOrder}
                  onChange={(e) => setNewOrder(Number(e.target.value))}
                  className="h-8 text-xs bg-background font-medium"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground text-xs">Описание (опционально)</label>
              <Textarea
                placeholder="Укажите краткие тезисы урока или содержание темы..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="text-xs bg-background min-h-[80px]"
              />
            </div>
          </div>

          <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
            <Button variant="outline" size="xs" onClick={() => setIsCreateOpen(false)}>
              Отмена
            </Button>
            <Button size="xs" disabled={isPending} onClick={handleCreateTopic}>
              Создать тему
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
