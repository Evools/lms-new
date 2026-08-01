"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MaterialType } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  FileText,
  Plus,
  Building2,
  BookOpen,
  Trash2,
  Link2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  BookMarked,
  ExternalLinkIcon,
} from "lucide-react";
import { GroupItemDTO, GroupSubjectDTO, MaterialDTO, createTopicAction, deleteMaterialAction } from "@/app/dashboard/lms/actions";
import { renderMarkdown } from "@/lib/markdown";

export interface TopicWithMaterialsDTO {
  id: string;
  title: string;
  description?: string | null;
  order: number;
  materials: MaterialDTO[];
}

interface MaterialsViewProps {
  groups: GroupItemDTO[];
  subjects: GroupSubjectDTO[];
  topics: Array<{ id: string; title: string }>;
  topicsWithMaterials?: TopicWithMaterialsDTO[];
  materials: MaterialDTO[];
  selectedGroupId: string;
  selectedTopicId: string;
  selectedType: string;
  canCreate: boolean;
}

export function MaterialsView({
  groups,
  subjects,
  topicsWithMaterials = [],
  materials,
  selectedGroupId,
  canCreate,
}: MaterialsViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const currentGroupObj = groups.find((g) => g.id === selectedGroupId);

  // Active Selected Material State
  const initialActiveMat = materials[0] || null;
  const [activeMaterial, setActiveMaterial] = useState<MaterialDTO | null>(initialActiveMat);

  // Expanded Chapter State
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    topicsWithMaterials.forEach((t) => {
      initial[t.id] = true;
    });
    return initial;
  });

  // Create Chapter (Topic) Quick Modal State
  const [isCreateChapterOpen, setIsCreateChapterOpen] = useState(false);
  const [newChapterSubjectId, setNewChapterSubjectId] = useState(subjects[0]?.id || "");
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleGroupChange = (val: string) => {
    router.push(`/dashboard/lms/materials?group=${val}`);
  };

  const toggleTopicExpand = (topicId: string) => {
    setExpandedTopics((prev) => ({
      ...prev,
      [topicId]: !prev[topicId],
    }));
  };

  const handleCreateChapter = () => {
    if (!newChapterTitle.trim() || !newChapterSubjectId) {
      setErrorMsg("Укажите дисциплину и название главы");
      return;
    }

    setErrorMsg(null);
    startTransition(async () => {
      const res = await createTopicAction({
        groupSubjectId: newChapterSubjectId,
        title: newChapterTitle,
      });

      if (res.success) {
        setSuccessMsg("Глава успешно создана!");
        setIsCreateChapterOpen(false);
        setNewChapterTitle("");
        router.refresh();
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setErrorMsg(res.error || "Ошибка при создании главы");
      }
    });
  };

  const handleDeleteMaterial = (id: string) => {
    if (!confirm("Вы уверены, что хотите удалить этот учебный материал?")) return;

    startTransition(async () => {
      const res = await deleteMaterialAction(id);
      if (res.success) {
        setSuccessMsg("Материал удален");
        if (activeMaterial?.id === id) {
          setActiveMaterial(materials.find((m) => m.id !== id) || null);
        }
        router.refresh();
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setErrorMsg(res.error || "Не удалось удалить материал");
      }
    });
  };

  // Helper to extract YouTube video ID for embedded player
  const getYouTubeEmbedUrl = (urlStr?: string | null) => {
    if (!urlStr) return null;
    try {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = urlStr.match(regExp);
      return match && match[2].length === 11
        ? `https://www.youtube.com/embed/${match[2]}`
        : null;
    } catch {
      return null;
    }
  };

  const currentMat = activeMaterial || materials[0] || null;
  const youtubeEmbedUrl = getYouTubeEmbedUrl(currentMat?.linkUrl || currentMat?.content);

  const getMaterialTypeLabel = (t: MaterialType) => {
    switch (t) {
      case MaterialType.LECTURE:
        return "Лекция";
      case MaterialType.PRACTICE:
        return "Практика";
      case MaterialType.LAB:
        return "Лабораторная";
      case MaterialType.VIDEO:
        return "Видеоурок";
      case MaterialType.PDF:
        return "PDF Документ";
      case MaterialType.DOCUMENT:
        return "Методичка";
      case MaterialType.LINK:
        return "Внешняя ссылка";
      default:
        return "Материал";
    }
  };

  return (
    <div className="space-y-3 w-full">
      {/* Top Breadcrumb & Page Title Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-3.5 rounded-xl border shadow-xs">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span>Преподаватель</span>
            <ChevronRight className="h-3 w-3" />
            <span>Группы</span>
            <ChevronRight className="h-3 w-3" />
            <span>#{currentGroupObj?.name || "Группа"}</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-semibold">Материалы</span>
          </div>
          <h1 className="text-sm font-bold text-foreground">
            Материалы группы {currentGroupObj?.name || "LMS"}
          </h1>
        </div>

        {/* Group Selector Dropdown */}
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary shrink-0" />
          <Select value={selectedGroupId} onValueChange={handleGroupChange}>
            <SelectTrigger className="h-8 text-xs font-semibold bg-background sm:w-[220px]">
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

      {/* MAIN LAYOUT MATCHING USER FIGMA SCREENSHOT (Sidebar + Content View) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
        {/* LEFT SIDEBAR: CHAPTERS & MATERIALS TREE */}
        <div className="md:col-span-4 lg:col-span-3 bg-card rounded-xl border p-3.5 space-y-3 shadow-xs">
          {/* Header */}
          <div className="flex items-center justify-between border-b pb-2">
            <div>
              <h2 className="text-xs font-bold text-foreground">Материалы</h2>
              <p className="text-[11px] text-muted-foreground">{materials.length} материалов</p>
            </div>
          </div>

          {/* Action Buttons */}
          {canCreate && (
            <div className="space-y-1.5">
              <Link href={`/dashboard/lms/materials/new?group=${selectedGroupId}`}>
                <Button size="xs" className="w-full h-8 text-xs gap-1.5 font-medium shadow-xs">
                  <Plus className="h-3.5 w-3.5" /> Добавить материал
                </Button>
              </Link>

              <Button
                type="button"
                size="xs"
                variant="outline"
                onClick={() => setIsCreateChapterOpen(true)}
                className="w-full h-7 text-xs gap-1.5 text-foreground hover:text-primary font-normal"
              >
                <BookMarked className="h-3.5 w-3.5 text-primary" /> Создать главу
              </Button>
            </div>
          )}

          {/* Chapters Accordion List */}
          <div className="space-y-1 pt-1 max-h-[600px] overflow-y-auto pr-1">
            {topicsWithMaterials.map((topic, topicIdx) => {
              const isExpanded = expandedTopics[topic.id] ?? true;
              const topicMats = topic.materials || [];

              return (
                <div key={topic.id} className="space-y-0.5">
                  {/* Chapter Header Item */}
                  <div
                    onClick={() => toggleTopicExpand(topic.id)}
                    className="p-2 rounded-lg hover:bg-muted/60 transition-colors flex items-center justify-between cursor-pointer group select-none"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">
                        {topicIdx + 1}. {topic.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-muted-foreground">{topicMats.length} ресурсов</span>
                      <ChevronDown
                        className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${
                          isExpanded ? "rotate-0" : "-rotate-90"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Nested Materials Items under this Chapter */}
                  {isExpanded && (
                    <div className="pl-2 space-y-0.5 border-l border-border/60 ml-2">
                      {topicMats.map((mat, matIdx) => {
                        const isSelected = currentMat?.id === mat.id;

                        return (
                          <div
                            key={mat.id}
                            onClick={() => setActiveMaterial(mat)}
                            className={`p-2 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-all ${
                              isSelected
                                ? "bg-primary/10 text-primary font-medium border-l-4 border-l-primary shadow-xs"
                                : "text-foreground hover:bg-muted/40 font-normal"
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate pr-1">
                              <span className="text-[11px] truncate">
                                {matIdx + 1}. {mat.title}
                              </span>
                            </div>

                            <span className="text-[10px] text-muted-foreground shrink-0">
                              {mat.type === MaterialType.VIDEO ? "Видео" : "Урок"}
                            </span>
                          </div>
                        );
                      })}

                      {topicMats.length === 0 && (
                        <div className="py-2 pl-2 text-[10px] text-muted-foreground italic">
                          Нет материалов в этой главе
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {topicsWithMaterials.length === 0 && (
              <div className="py-8 text-center text-xs text-muted-foreground italic">
                Главы еще не созданы
              </div>
            )}
          </div>
        </div>

        {/* RIGHT MAIN AREA: SELECTED MATERIAL CONTENT VIEWER */}
        <div className="md:col-span-8 lg:col-span-9 bg-card rounded-xl border p-4 space-y-4 shadow-xs">
          {currentMat ? (
            <div className="space-y-4">
              {/* Active Material Header */}
              <div className="flex items-start justify-between gap-3 border-b pb-3">
                <div className="space-y-1">
                  <h2 className="text-base font-bold text-foreground">{currentMat.title}</h2>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-[10px] border-primary/30 text-primary font-medium">
                      {getMaterialTypeLabel(currentMat.type)}
                    </Badge>
                    <span>Глава: {currentMat.topicTitle}</span>
                    <span>• Автор: {currentMat.authorName}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                  <span className="text-[11px]">
                    {new Date(currentMat.createdAt).toLocaleString("ru-RU", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>

                  {canCreate && (
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => handleDeleteMaterial(currentMat.id)}
                      className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                      title="Удалить материал"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Video Player Section */}
              {youtubeEmbedUrl ? (
                <div className="aspect-video w-full rounded-xl overflow-hidden bg-black shadow-sm border border-border">
                  <iframe
                    src={youtubeEmbedUrl}
                    title={currentMat.title}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : currentMat.linkUrl && (currentMat.linkUrl.includes("youtube.com") || currentMat.linkUrl.includes("youtu.be")) ? (
                <div className="aspect-video w-full rounded-xl overflow-hidden bg-black shadow-sm border border-border">
                  <iframe
                    src={getYouTubeEmbedUrl(currentMat.linkUrl) || currentMat.linkUrl}
                    title={currentMat.title}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : null}

              {/* RENDER WYSIWYG MARKDOWN CONTENT PROPERLY */}
              {currentMat.content && (
                <div className="p-4 rounded-xl border bg-background text-xs leading-relaxed text-foreground space-y-2">
                  {renderMarkdown(currentMat.content)}
                </div>
              )}

              {/* External File & Resource Links */}
              {(currentMat.fileUrl || currentMat.linkUrl) && (
                <div className="p-3 rounded-xl border bg-muted/30 space-y-2 text-xs">
                  <div className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                    <ExternalLink className="h-3.5 w-3.5 text-primary" /> Ссылки и прикреплённые ресурсы:
                  </div>

                  <div className="flex flex-col gap-1.5">
                    {currentMat.linkUrl && (
                      <a
                        href={currentMat.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline font-mono text-[11px] flex items-center gap-1.5"
                      >
                        <Link2 className="h-3.5 w-3.5 shrink-0" /> {currentMat.linkUrl}
                      </a>
                    )}

                    {currentMat.fileUrl && (
                      <a
                        href={currentMat.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline font-mono text-[11px] flex items-center gap-1.5"
                      >
                        <FileText className="h-3.5 w-3.5 shrink-0" /> {currentMat.fileUrl}
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-16 text-center text-muted-foreground text-xs space-y-2">
              <BookOpen className="h-8 w-8 text-muted-foreground/40 mx-auto" />
              <div className="font-semibold text-foreground">Материал не выбран</div>
              <p className="text-[11px]">Выберите главу и кликните по материалу слева в списке для просмотра.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Quick Create Chapter (Topic) */}
      <Dialog open={isCreateChapterOpen} onOpenChange={setIsCreateChapterOpen}>
        <DialogContent className="p-4 gap-3 text-xs sm:max-w-[420px]">
          <DialogHeader className="pb-2 border-b gap-1 text-left">
            <DialogTitle className="flex items-center gap-2 text-sm font-bold text-foreground">
              <BookMarked className="h-4 w-4 text-primary" /> Создать главу курса
            </DialogTitle>
            <DialogDescription className="text-xs">
              Глава объединяет лекции и практические уроки по теме
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-1 text-xs">
            <div className="space-y-1">
              <label className="font-medium text-foreground text-xs">Дисциплина *</label>
              <Select value={newChapterSubjectId} onValueChange={setNewChapterSubjectId}>
                <SelectTrigger className="h-8 text-xs bg-background">
                  <SelectValue>{subjects.find((s) => s.id === newChapterSubjectId)?.subjectName || "Выберите предмет"}</SelectValue>
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
              <label className="font-medium text-foreground text-xs">Название главы *</label>
              <Input
                placeholder="Например: Figma, HTML & CSS, Изучение Grid"
                value={newChapterTitle}
                onChange={(e) => setNewChapterTitle(e.target.value)}
                className="h-8 text-xs bg-background font-medium"
              />
            </div>
          </div>

          <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
            <Button variant="outline" size="xs" onClick={() => setIsCreateChapterOpen(false)}>
              Отмена
            </Button>
            <Button size="xs" disabled={isPending} onClick={handleCreateChapter}>
              Создать главу
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
