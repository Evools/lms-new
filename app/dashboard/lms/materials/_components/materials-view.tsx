"use client";

import React, { useState, useEffect, useTransition } from "react";
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
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  ArrowLeft,
  FileText,
  Plus,
  Building2,
  BookOpen,
  Laptop,
  FlaskConical,
  Trash2,
  Pencil,
  Link2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  BookMarked,
  Video,
} from "lucide-react";
import {
  GroupItemDTO,
  GroupSubjectDTO,
  MaterialDTO,
  createTopicAction,
  updateTopicAction,
  deleteTopicAction,
  deleteMaterialAction,
} from "@/app/dashboard/lms/actions";
import { renderMarkdown } from "@/lib/markdown";
import { toast } from "@/components/ui/toast";

export interface TopicWithMaterialsDTO {
  id: string;
  title: string;
  description?: string | null;
  order: number;
  subjectName?: string;
  teacherName?: string;
  materials: MaterialDTO[];
}

interface MaterialsViewProps {
  groups: GroupItemDTO[];
  subjects: GroupSubjectDTO[];
  topics: Array<{ id: string; title: string }>;
  topicsWithMaterials?: TopicWithMaterialsDTO[];
  materials: MaterialDTO[];
  selectedGroupId: string;
  selectedSubjectIdProp?: string | null;
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
  selectedSubjectIdProp = null,
  canCreate,
}: MaterialsViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const currentGroupObj = groups.find((g) => g.id === selectedGroupId);

  // Selected Subject Filter State (null = show subjects grid, string = show subject materials)
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(selectedSubjectIdProp || null);

  useEffect(() => {
    setSelectedSubjectId(selectedSubjectIdProp || null);
  }, [selectedSubjectIdProp]);

  const currentSubjectObj = subjects.find((s) => s.id === selectedSubjectId);

  const handleGroupChange = (newGroupId: string) => {
    setSelectedSubjectId(null);
    router.push(`/dashboard/lms/materials?group=${newGroupId}`);
  };

  const handleSelectSubject = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    router.push(`/dashboard/lms/materials?group=${selectedGroupId}&subject=${subjectId}`);
    const subj = subjects.find((s) => s.id === subjectId);
    if (subj) {
      const firstMatOfSubj = materials.find((m) => m.subjectName === subj.subjectName);
      if (firstMatOfSubj) {
        setActiveMaterial(firstMatOfSubj);
      }
    }
  };

  const handleBackToSubjects = () => {
    setSelectedSubjectId(null);
    router.push(`/dashboard/lms/materials?group=${selectedGroupId}`);
  };

  const displayTopics = topicsWithMaterials.filter((t) => {
    if (!currentSubjectObj) return true;
    return t.subjectName === currentSubjectObj.subjectName;
  });

  const displayMaterials = materials.filter((m) => {
    if (!currentSubjectObj) return true;
    return m.subjectName === currentSubjectObj.subjectName;
  });

  // Active Selected Material State
  const initialActiveMat = displayMaterials[0] || materials[0] || null;
  const [activeMaterial, setActiveMaterial] = useState<MaterialDTO | null>(initialActiveMat);

  // Expanded Chapter State
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    topicsWithMaterials.forEach((t) => {
      initial[t.id] = true;
    });
    return initial;
  });

  // Create Chapter (Topic) Modal State
  const [isCreateChapterOpen, setIsCreateChapterOpen] = useState(false);
  const [newChapterSubjectId, setNewChapterSubjectId] = useState(subjects[0]?.id || "");
  const [newChapterTitle, setNewChapterTitle] = useState("");

  // Edit Chapter Modal State
  const [editChapterTarget, setEditChapterTarget] = useState<TopicWithMaterialsDTO | null>(null);
  const [editChapterTitle, setEditChapterTitle] = useState("");

  // Delete Chapter Alert State
  const [deleteChapterTarget, setDeleteChapterTarget] = useState<TopicWithMaterialsDTO | null>(null);

  // Delete Material Alert State
  const [deleteMaterialTarget, setDeleteMaterialTarget] = useState<MaterialDTO | null>(null);

  // Alerts
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const toggleTopicExpand = (topicId: string) => {
    setExpandedTopics((prev) => ({
      ...prev,
      [topicId]: !prev[topicId],
    }));
  };

  // Chapter Handlers
  const handleCreateChapter = () => {
    if (!newChapterTitle.trim() || !newChapterSubjectId) {
      toast.add({ title: "Укажите дисциплину и название главы", type: "error" });
      return;
    }

    startTransition(async () => {
      const res = await createTopicAction({
        groupSubjectId: newChapterSubjectId,
        title: newChapterTitle,
      });

      if (res.success) {
        toast.add({ title: "Глава успешно создана!", type: "success" });
        setIsCreateChapterOpen(false);
        setNewChapterTitle("");
        router.refresh();
      } else {
        toast.add({ title: res.error || "Ошибка при создании главы", type: "error" });
      }
    });
  };

  const handleOpenEditChapter = (topic: TopicWithMaterialsDTO) => {
    setEditChapterTarget(topic);
    setEditChapterTitle(topic.title);
  };

  const handleUpdateChapter = () => {
    if (!editChapterTarget || !editChapterTitle.trim()) {
      toast.add({ title: "Укажите название главы", type: "error" });
      return;
    }

    startTransition(async () => {
      const res = await updateTopicAction(editChapterTarget.id, {
        title: editChapterTitle,
      });

      if (res.success) {
        toast.add({ title: "Глава успешно обновлена!", type: "success" });
        setEditChapterTarget(null);
        router.refresh();
      } else {
        toast.add({ title: res.error || "Ошибка при обновлении главы", type: "error" });
      }
    });
  };

  const handleDeleteChapter = () => {
    if (!deleteChapterTarget) return;

    startTransition(async () => {
      const res = await deleteTopicAction(deleteChapterTarget.id);

      if (res.success) {
        toast.add({ title: "Глава успешно удалена!", type: "success" });
        setDeleteChapterTarget(null);
        router.refresh();
      } else {
        toast.add({ title: res.error || "Ошибка при удалении главы", type: "error" });
      }
    });
  };

  // Material Handlers
  const handleDeleteMaterial = () => {
    if (!deleteMaterialTarget) return;

    startTransition(async () => {
      const res = await deleteMaterialAction(deleteMaterialTarget.id);
      if (res.success) {
        toast.add({ title: "Материал удален!", type: "success" });
        if (activeMaterial?.id === deleteMaterialTarget.id) {
          setActiveMaterial(materials.find((m) => m.id !== deleteMaterialTarget.id) || null);
        }
        setDeleteMaterialTarget(null);
        router.refresh();
      } else {
        toast.add({ title: res.error || "Ошибка при удалении материала", type: "error" });
      }
    });
  };

  // Helper to extract YouTube video embed URL
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

  // Helper to parse multiple video URLs from linkUrl
  const parseVideoUrls = (linkUrlStr?: string | null): string[] => {
    if (!linkUrlStr) return [];
    try {
      const parsed = JSON.parse(linkUrlStr);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {}
    if (linkUrlStr.includes("youtube.com") || linkUrlStr.includes("youtu.be")) {
      return [linkUrlStr];
    }
    return [];
  };

  // Helper to parse multiple resource links from fileUrl
  const parseResourceLinks = (fileUrlStr?: string | null, linkUrlStr?: string | null): string[] => {
    const list: string[] = [];

    if (fileUrlStr) {
      try {
        const parsed = JSON.parse(fileUrlStr);
        if (Array.isArray(parsed)) {
          parsed.forEach((item: any) => {
            if (typeof item === "string" && item.trim()) list.push(item.trim());
            else if (item && item.url) list.push(item.url);
          });
        } else if (typeof fileUrlStr === "string") {
          list.push(fileUrlStr);
        }
      } catch {
        list.push(fileUrlStr);
      }
    }

    if (linkUrlStr && !linkUrlStr.startsWith("[")) {
      if (!linkUrlStr.includes("youtube.com") && !linkUrlStr.includes("youtu.be")) {
        list.push(linkUrlStr);
      }
    }

    return list;
  };

  const currentMat = activeMaterial || materials[0] || null;
  const parsedVideos = parseVideoUrls(currentMat?.linkUrl);
  const parsedResources = parseResourceLinks(currentMat?.fileUrl, currentMat?.linkUrl);

  const getMaterialTypeLabel = (t: MaterialType) => {
    switch (t) {
      case MaterialType.LECTURE:
        return "Лекция";
      case MaterialType.PRACTICE:
        return "Практика";
      case MaterialType.LAB:
        return "Лабораторная";
      default:
        return "Урок";
    }
  };

  const getMaterialTypeIcon = (t: MaterialType) => {
    switch (t) {
      case MaterialType.LECTURE:
        return <BookOpen className="h-3 w-3 text-primary shrink-0" />;
      case MaterialType.PRACTICE:
        return <Laptop className="h-3 w-3 text-primary shrink-0" />;
      case MaterialType.LAB:
        return <FlaskConical className="h-3 w-3 text-primary shrink-0" />;
      default:
        return <FileText className="h-3 w-3 text-primary shrink-0" />;
    }
  };

  return (
    <div className="space-y-4 w-full text-xs">
      {/* STEP 1: SUBJECTS CATALOG VIEW (When no subject is selected) */}
      {!selectedSubjectId ? (
        <div className="space-y-4">
          {/* Top Header Bar with Group Selector */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-3.5 rounded-xl border shadow-2xs">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span>Учебный процесс</span>
                <ChevronRight className="h-3 w-3" />
                <span>#{currentGroupObj?.name || "Группа"}</span>
                <ChevronRight className="h-3 w-3" />
                <span className="text-foreground font-semibold">Предметы</span>
              </div>
              <h1 className="text-sm font-bold text-foreground flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                Учебные дисциплины группы {currentGroupObj?.name}
              </h1>
            </div>

            {/* Group Selector Dropdown */}
            <div className="flex items-center gap-2 shrink-0">
              <Building2 className="h-4 w-4 text-primary shrink-0" />
              <Select value={selectedGroupId} onValueChange={handleGroupChange}>
                <SelectTrigger className="h-8 text-xs font-semibold bg-background sm:w-[200px]">
                  <SelectValue>{currentGroupObj ? `Группа ${currentGroupObj.name}` : "Выберите группу"}</SelectValue>
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

          {/* Subjects Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <BookMarked className="h-4 w-4 text-primary" /> Доступные дисциплины ({subjects.length})
              </h2>
              <span className="text-[11px] text-muted-foreground">
                Выберите предмет для перехода к лекциям и материалам
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {subjects.map((subj) => (
                <div
                  key={subj.id}
                  onClick={() => handleSelectSubject(subj.id)}
                  className="p-4 rounded-xl border bg-card hover:border-primary/60 hover:shadow-xs transition-all cursor-pointer space-y-3 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <BookMarked className="h-5 w-5" />
                    </div>
                    <Badge variant="outline" className="text-[10px] bg-muted font-medium">
                      {subj.topicsCount ?? 0} тем
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-bold text-foreground text-sm group-hover:text-primary transition-colors truncate">
                      {subj.subjectName}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate">
                      Преподаватель: {subj.teacherName}
                    </p>
                  </div>

                  <div className="pt-2 border-t flex items-center justify-between text-xs text-primary font-medium">
                    <span>Открыть материалы</span>
                    <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              ))}

              {subjects.length === 0 && (
                <div className="col-span-full p-12 border rounded-xl bg-card text-center space-y-2 text-muted-foreground">
                  <BookMarked className="h-8 w-8 text-muted-foreground/30 mx-auto" />
                  <p className="font-semibold text-foreground text-xs">Дисциплины не назначены</p>
                  <p className="text-[11px]">У этой группы пока нет добавленных предметов</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* STEP 2: SELECTED SUBJECT MATERIALS READER */
        <div className="space-y-3">
          {/* Header Action Bar with Back Button */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-3 rounded-xl border shadow-2xs">
            <div className="flex items-center gap-3 flex-wrap">
              <Button
                size="xs"
                variant="outline"
                onClick={handleBackToSubjects}
                className="h-7 text-xs px-2.5 gap-1.5 text-muted-foreground hover:text-foreground font-medium"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Назад к предметам
              </Button>
              <div className="h-4 w-px bg-border hidden sm:block" />
              <div className="flex items-center gap-2">
                <BookMarked className="h-4 w-4 text-primary" />
                <span className="font-bold text-foreground text-xs">{currentSubjectObj?.subjectName}</span>
                <span className="text-[11px] text-muted-foreground">• Преподаватель: {currentSubjectObj?.teacherName}</span>
              </div>
            </div>

            {/* Quick Switch Subject Dropdown */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[11px] text-muted-foreground">Предмет:</span>
              <Select value={selectedSubjectId} onValueChange={handleSelectSubject}>
                <SelectTrigger className="h-7 text-xs font-semibold bg-background sm:w-[200px]">
                  <SelectValue>{currentSubjectObj?.subjectName}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-xs">
                      {s.subjectName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* MAIN READER AREA (Topics Sidebar + Content) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
            {/* LEFT SIDEBAR: CHAPTERS & MATERIALS TREE FOR THIS SUBJECT */}
            <div className="md:col-span-4 lg:col-span-3 bg-card rounded-xl border p-3.5 space-y-3 shadow-xs sticky top-16 max-h-[calc(100vh-5rem)] overflow-y-auto z-10">
          {/* Header */}
          <div className="flex items-center justify-between border-b pb-2">
            <div>
              <h2 className="text-xs font-bold text-foreground">Материалы</h2>
              <p className="text-[11px] text-muted-foreground">{materials.length} материалов</p>
            </div>
          </div>

          {/* Action Buttons */}
          {canCreate && (
            <div className="space-y-2">
              <Link
                href={`/dashboard/lms/materials/new?group=${selectedGroupId}${selectedSubjectId ? `&subject=${selectedSubjectId}` : ""}`}
                className="block"
              >
                <Button size="xs" className="w-full h-8 text-xs gap-1.5 font-medium shadow-xs">
                  <Plus className="h-3.5 w-3.5" /> Добавить материал
                </Button>
              </Link>

              <Button
                type="button"
                size="xs"
                variant="outline"
                onClick={() => setIsCreateChapterOpen(true)}
                className="w-full h-8 text-xs gap-1.5 text-foreground hover:text-primary font-medium"
              >
                <BookMarked className="h-3.5 w-3.5 text-primary" /> Создать главу
              </Button>
            </div>
          )}

          {/* Chapters Accordion List */}
          <div className="space-y-1 pt-1 overflow-y-auto pr-1">
            {displayTopics.map((topic, topicIdx) => {
              const isExpanded = expandedTopics[topic.id] ?? true;
              const topicMats = topic.materials || [];

              return (
                <div key={topic.id} className="space-y-0.5">
                  {/* Chapter Header Item */}
                  <div className="p-2 rounded-lg hover:bg-muted/60 transition-colors flex items-center justify-between group select-none">
                    <div
                      onClick={() => toggleTopicExpand(topic.id)}
                      className="cursor-pointer flex-1 truncate space-y-0.5"
                    >
                      <span className="text-xs font-bold text-foreground truncate block">
                        {topicIdx + 1}. {topic.title}
                      </span>
                      {topic.subjectName && (
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-primary/5 text-primary border-primary/20 font-medium">
                          {topic.subjectName}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10px] text-muted-foreground mr-1">
                        {topicMats.length} ресурсов
                      </span>

                      {canCreate && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditChapter(topic);
                            }}
                            className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                            title="Редактировать главу"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteChapterTarget(topic);
                            }}
                            className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            title="Удалить главу"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}

                      <ChevronDown
                        onClick={() => toggleTopicExpand(topic.id)}
                        className={`h-3.5 w-3.5 text-muted-foreground cursor-pointer transition-transform duration-200 ${
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
                            className={`p-2 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-all group/mat ${
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

                            <div className="flex items-center gap-1 shrink-0">
                              {canCreate && (
                                <div className="opacity-0 group-hover/mat:opacity-100 transition-opacity flex items-center gap-0.5">
                                  <Link
                                    href={`/dashboard/lms/materials/${mat.id}/edit?group=${selectedGroupId}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-0.5 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors inline-flex items-center justify-center"
                                    title="Редактировать материал"
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </Link>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeleteMaterialTarget(mat);
                                    }}
                                    className="p-0.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                    title="Удалить материал"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              )}

                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                {getMaterialTypeIcon(mat.type)}
                                <span>{getMaterialTypeLabel(mat.type)}</span>
                              </span>
                            </div>
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
        <div className="md:col-span-8 lg:col-span-9 bg-card rounded-xl border p-3 sm:p-4 space-y-4 shadow-xs">
          {currentMat ? (
            <div className="space-y-4">
              {/* Active Material Header */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 border-b pb-3">
                <div className="space-y-1.5 min-w-0">
                  <h2 className="text-base font-bold text-foreground leading-tight break-words">{currentMat.title}</h2>
                  <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-[10px] border-primary/30 text-primary font-medium flex items-center gap-1">
                      {getMaterialTypeIcon(currentMat.type)}
                      <span>{getMaterialTypeLabel(currentMat.type)}</span>
                    </Badge>

                    {currentMat.subjectName && (
                      <Badge variant="secondary" className="text-[10px] font-semibold text-foreground flex items-center gap-1">
                        <BookMarked className="h-3 w-3 text-primary" />
                        <span>{currentMat.subjectName}</span>
                      </Badge>
                    )}

                    <span>Глава: {currentMat.topicTitle}</span>
                    <span>• Преподаватель: {currentMat.teacherName || currentMat.authorName}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-2 text-xs text-muted-foreground pt-2 sm:pt-0 border-t sm:border-t-0 shrink-0">
                  <span className="text-[11px]">
                    {new Date(currentMat.createdAt).toLocaleDateString("ru-RU", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </span>

                  {canCreate && (
                    <div className="flex items-center gap-1">
                      <Link href={`/dashboard/lms/materials/${currentMat.id}/edit?group=${selectedGroupId}${selectedSubjectId ? `&subject=${selectedSubjectId}` : ""}`}>
                        <Button
                          size="xs"
                          variant="outline"
                          className="h-7 text-xs px-2 gap-1 text-muted-foreground hover:text-primary"
                          title="Редактировать материал"
                        >
                          <Pencil className="h-3.5 w-3.5" /> <span className="text-xs">Редактировать</span>
                        </Button>
                      </Link>

                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => setDeleteMaterialTarget(currentMat)}
                        className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                        title="Удалить материал"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Multiple Video Players */}
              {parsedVideos.length > 0 && (
                <div className="space-y-3">
                  {parsedVideos.map((vidUrl, idx) => {
                    const embedUrl = getYouTubeEmbedUrl(vidUrl);
                    if (!embedUrl) return null;
                    return (
                      <div key={idx} className="aspect-video w-full rounded-xl overflow-hidden bg-black shadow-sm border border-border">
                        <iframe
                          src={embedUrl}
                          title={`${currentMat.title} - Видео ${idx + 1}`}
                          className="w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* RENDER WYSIWYG MARKDOWN CONTENT PROPERLY */}
              {currentMat.content && (
                <div className="p-4 rounded-xl border bg-background text-xs leading-relaxed text-foreground space-y-2">
                  {renderMarkdown(currentMat.content)}
                </div>
              )}

              {/* Multiple Resources & Files */}
              {parsedResources.length > 0 && (
                <div className="p-3.5 rounded-xl border bg-muted/30 space-y-2 text-xs">
                  <div className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                    <ExternalLink className="h-3.5 w-3.5 text-primary" /> Ссылки и прикреплённые ресурсы ({parsedResources.length}):
                  </div>

                  <div className="flex flex-col gap-2 pt-1">
                    {parsedResources.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg border bg-card hover:bg-muted/60 transition-colors text-primary font-mono text-xs flex items-center justify-between group truncate"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Link2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                          <span className="truncate">{url}</span>
                        </div>
                        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors ml-2" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-16 text-center text-muted-foreground text-xs space-y-2">
              <BookOpen className="h-8 w-8 text-muted-foreground/40 mx-auto" />
              <div className="font-semibold text-foreground">Материал не выбран</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )}

      {/* Modal 1: Quick Create Chapter (Topic) */}
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

      {/* Modal 2: Edit Chapter Modal */}
      <Dialog open={editChapterTarget !== null} onOpenChange={(open) => !open && setEditChapterTarget(null)}>
        {editChapterTarget && (
          <DialogContent className="p-4 gap-3 text-xs sm:max-w-[420px]">
            <DialogHeader className="pb-2 border-b gap-1 text-left">
              <DialogTitle className="flex items-center gap-2 text-sm font-bold text-foreground">
                <Pencil className="h-4 w-4 text-primary" /> Редактирование главы
              </DialogTitle>
              <DialogDescription className="text-xs">
                Изменение названия главы «{editChapterTarget.title}»
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-1 text-xs">
              <div className="space-y-1">
                <label className="font-medium text-foreground text-xs">Название главы *</label>
                <Input
                  value={editChapterTitle}
                  onChange={(e) => setEditChapterTitle(e.target.value)}
                  className="h-8 text-xs bg-background font-medium"
                />
              </div>
            </div>

            <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
              <Button variant="outline" size="xs" onClick={() => setEditChapterTarget(null)}>
                Отмена
              </Button>
              <Button size="xs" disabled={isPending} onClick={handleUpdateChapter}>
                Сохранить
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Modal 3: Delete Chapter AlertDialog */}
      <AlertDialog open={deleteChapterTarget !== null} onOpenChange={(open) => !open && setDeleteChapterTarget(null)}>
        {deleteChapterTarget && (
          <AlertDialogContent className="p-4 gap-3 text-xs sm:max-w-[400px]">
            <AlertDialogHeader className="place-items-start text-left gap-1">
              <AlertDialogTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <Trash2 className="h-4 w-4 text-destructive" /> Удалить главу?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
                Вы действительно хотите удалить главу «{deleteChapterTarget.title}»? Все прикреплённые материалы будут также удалены.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
              <Button variant="outline" size="xs" onClick={() => setDeleteChapterTarget(null)}>
                Отмена
              </Button>
              <Button
                size="xs"
                variant="destructive"
                disabled={isPending}
                onClick={handleDeleteChapter}
              >
                Удалить
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>

      {/* Modal 4: Delete Material AlertDialog */}
      <AlertDialog open={deleteMaterialTarget !== null} onOpenChange={(open) => !open && setDeleteMaterialTarget(null)}>
        {deleteMaterialTarget && (
          <AlertDialogContent className="p-4 gap-3 text-xs sm:max-w-[400px]">
            <AlertDialogHeader className="place-items-start text-left gap-1">
              <AlertDialogTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <Trash2 className="h-4 w-4 text-destructive" /> Удалить материал?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
                Вы действительно хотите удалить материал «{deleteMaterialTarget.title}»?
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
              <Button variant="outline" size="xs" onClick={() => setDeleteMaterialTarget(null)}>
                Отмена
              </Button>
              <Button
                size="xs"
                variant="destructive"
                disabled={isPending}
                onClick={handleDeleteMaterial}
              >
                Удалить
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>
    </div>
  );
}
