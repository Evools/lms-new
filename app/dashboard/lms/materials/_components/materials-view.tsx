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
  FileText,
  Plus,
  Search,
  Building2,
  BookOpen,
  User,
  Trash2,
  Video,
  Link2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  FolderKanban,
  FileCode,
  Eye,
} from "lucide-react";
import { GroupItemDTO, GroupSubjectDTO, MaterialDTO, createMaterialAction, deleteMaterialAction } from "@/app/dashboard/lms/actions";

interface MaterialsViewProps {
  groups: GroupItemDTO[];
  subjects: GroupSubjectDTO[];
  topics: Array<{ id: string; title: string }>;
  materials: MaterialDTO[];
  selectedGroupId: string;
  selectedTopicId: string;
  selectedType: string;
  canCreate: boolean;
}

export function MaterialsView({
  groups,
  topics,
  materials,
  selectedGroupId,
  selectedTopicId,
  selectedType,
  canCreate,
}: MaterialsViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [searchQuery, setSearchQuery] = useState("");
  const [viewTargetMaterial, setViewTargetMaterial] = useState<MaterialDTO | null>(null);

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTopicId, setNewTopicId] = useState(selectedTopicId || topics[0]?.id || "");
  const [newType, setNewType] = useState<MaterialType>(MaterialType.LECTURE);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newFileUrl, setNewFileUrl] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const currentGroupObj = groups.find((g) => g.id === selectedGroupId);

  const handleGroupChange = (val: string) => {
    router.push(`/dashboard/lms/materials?group=${val}`);
  };

  const handleTopicChange = (val: string) => {
    const topicParam = val === "all" ? "" : `&topic=${val}`;
    const typeParam = selectedType ? `&type=${selectedType}` : "";
    router.push(`/dashboard/lms/materials?group=${selectedGroupId}${topicParam}${typeParam}`);
  };

  const handleTypeChange = (val: string) => {
    const topicParam = selectedTopicId ? `&topic=${selectedTopicId}` : "";
    const typeParam = val === "all" ? "" : `&type=${val}`;
    router.push(`/dashboard/lms/materials?group=${selectedGroupId}${topicParam}${typeParam}`);
  };

  const handleCreateMaterial = () => {
    if (!newTopicId || !newTitle.trim() || !newType) {
      setErrorMsg("Укажите тему, название и тип материала");
      return;
    }

    setErrorMsg(null);
    startTransition(async () => {
      const res = await createMaterialAction({
        topicId: newTopicId,
        type: newType,
        title: newTitle,
        content: newContent,
        fileUrl: newFileUrl,
        linkUrl: newLinkUrl,
      });

      if (res.success) {
        setSuccessMsg("Материал успешно опубликован!");
        setIsCreateOpen(false);
        setNewTitle("");
        setNewContent("");
        setNewFileUrl("");
        setNewLinkUrl("");
        router.refresh();
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setErrorMsg(res.error || "Ошибка при создании материала");
      }
    });
  };

  const handleDeleteMaterial = (id: string) => {
    if (!confirm("Вы уверены, что хотите удалить этот учебный материал?")) return;

    startTransition(async () => {
      const res = await deleteMaterialAction(id);
      if (res.success) {
        setSuccessMsg("Материал удален");
        router.refresh();
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setErrorMsg(res.error || "Не удалось удалить материал");
      }
    });
  };

  const filteredMaterials = materials.filter((m) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return m.title.toLowerCase().includes(query) || m.topicTitle.toLowerCase().includes(query);
  });

  const getMaterialIcon = (type: MaterialType) => {
    switch (type) {
      case MaterialType.LECTURE:
      case MaterialType.PRACTICE:
      case MaterialType.LAB:
      case MaterialType.DOCUMENT:
        return <FileText className="h-4 w-4 text-primary" />;
      case MaterialType.VIDEO:
        return <Video className="h-4 w-4 text-primary" />;
      case MaterialType.LINK:
        return <Link2 className="h-4 w-4 text-primary" />;
      default:
        return <FileCode className="h-4 w-4 text-primary" />;
    }
  };

  const getTypeLabel = (type: MaterialType) => {
    switch (type) {
      case MaterialType.LECTURE:
        return "Лекция";
      case MaterialType.PRACTICE:
        return "Практика";
      case MaterialType.LAB:
        return "Лабораторная";
      case MaterialType.VIDEO:
        return "Видео";
      case MaterialType.PDF:
        return "PDF Документ";
      case MaterialType.DOCUMENT:
        return "Методичка";
      case MaterialType.LINK:
        return "Ссылка";
      default:
        return "Материал";
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-4 rounded-xl border shadow-xs">
        <div className="space-y-0.5">
          <h1 className="text-base font-bold text-foreground flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" /> Лекции, Практики и Материалы LMS
          </h1>
          <p className="text-xs text-muted-foreground">
            Электронная библиотека учебных конспектов, презентаций, методичек и ссылок
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canCreate && (
            <Link href={`/dashboard/lms/materials/new?group=${selectedGroupId}&topic=${selectedTopicId}`}>
              <Button size="xs" className="h-8 text-xs gap-1.5 font-medium">
                <Plus className="h-3.5 w-3.5" /> Добавить материал
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-card p-3 rounded-xl border items-center">
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
            <FolderKanban className="h-3.5 w-3.5 text-primary" /> Учебная тема
          </label>
          <Select value={selectedTopicId || "all"} onValueChange={handleTopicChange}>
            <SelectTrigger className="h-8 text-xs font-semibold bg-background">
              <SelectValue>
                {topics.find((t) => t.id === selectedTopicId)?.title || "Все темы"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs font-medium">
                Все темы
              </SelectItem>
              {topics.map((t) => (
                <SelectItem key={t.id} value={t.id} className="text-xs">
                  {t.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5 text-primary" /> Тип материала
          </label>
          <Select value={selectedType || "all"} onValueChange={handleTypeChange}>
            <SelectTrigger className="h-8 text-xs font-semibold bg-background">
              <SelectValue>{selectedType ? getTypeLabel(selectedType as MaterialType) : "Все типы"}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs font-medium">
                Все типы
              </SelectItem>
              {Object.values(MaterialType).map((t) => (
                <SelectItem key={t} value={t} className="text-xs">
                  {getTypeLabel(t)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground">Поиск материалов</label>
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Название материала..."
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

      {/* Materials Compact Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredMaterials.map((mat) => (
          <Card
            key={mat.id}
            onClick={() => setViewTargetMaterial(mat)}
            className="p-3.5 border shadow-none hover:border-primary/50 hover:shadow-xs transition-all duration-200 flex flex-col justify-between space-y-3 bg-card rounded-xl group cursor-pointer"
          >
            {/* Top Meta Row */}
            <div className="flex items-center justify-between gap-2 border-b pb-2">
              <Badge variant="outline" className="text-[10px] border-primary/30 text-primary bg-primary/5 font-medium px-2 py-0.5 shrink-0">
                {getTypeLabel(mat.type)}
              </Badge>

              <span className="text-[10px] text-muted-foreground font-normal truncate max-w-[140px]">
                {mat.topicTitle}
              </span>
            </div>

            {/* Title & Preview Content */}
            <div className="space-y-1 flex-1">
              <h3 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5 line-clamp-1">
                {getMaterialIcon(mat.type)}
                <span className="truncate">{mat.title}</span>
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed font-normal">
                {mat.content ? mat.content.replace(/[#*`_~\-\[\]()]/g, " ").trim() : "Нажмите для просмотра материала..."}
              </p>
            </div>

            {/* Footer Row */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1 truncate max-w-[120px]">
                <User className="h-3 w-3 text-muted-foreground shrink-0" /> {mat.authorName}
              </span>

              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => setViewTargetMaterial(mat)}
                  className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground"
                >
                  <Eye className="h-3.5 w-3.5 text-primary" />
                </Button>

                {(mat.fileUrl || mat.linkUrl) && (
                  <a
                    href={mat.fileUrl || mat.linkUrl || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-medium bg-primary/10 px-2 py-1 rounded-md"
                  >
                    <ExternalLink className="h-3 w-3" /> Открыть
                  </a>
                )}

                {canCreate && (
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => handleDeleteMaterial(mat.id)}
                    className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                    title="Удалить материал"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}

        {filteredMaterials.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground text-xs bg-card border rounded-xl space-y-2">
            <FileText className="h-8 w-8 text-muted-foreground/40 mx-auto" />
            <p className="font-semibold text-foreground">Материалы не найдены</p>
            <p className="text-[11px] text-muted-foreground">По выбранным фильтрам материалы ещё не были опубликованы</p>
          </div>
        )}
      </div>

      {/* Modal 0: View Material Dialog */}
      <Dialog open={viewTargetMaterial !== null} onOpenChange={(open) => !open && setViewTargetMaterial(null)}>
        {viewTargetMaterial && (
          <DialogContent className="p-4 gap-3 text-xs sm:max-w-[550px]">
            <DialogHeader className="pb-2 border-b gap-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] border-primary/30 text-primary font-medium">
                  {getTypeLabel(viewTargetMaterial.type)}
                </Badge>
                <span className="text-[11px] text-muted-foreground font-normal">
                  Тема: {viewTargetMaterial.topicTitle}
                </span>
              </div>
              <DialogTitle className="text-sm font-bold text-foreground pt-1">
                {viewTargetMaterial.title}
              </DialogTitle>
              <DialogDescription className="text-[11px] text-muted-foreground">
                Автор: {viewTargetMaterial.authorName} • Дата: {new Date(viewTargetMaterial.createdAt).toLocaleDateString("ru-RU")}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-1 text-xs">
              {viewTargetMaterial.content && (
                <div className="p-3 border rounded-lg bg-card text-foreground whitespace-pre-wrap leading-relaxed">
                  {viewTargetMaterial.content}
                </div>
              )}

              {(viewTargetMaterial.fileUrl || viewTargetMaterial.linkUrl) && (
                <div className="pt-2 border-t space-y-1.5">
                  <div className="font-semibold text-foreground text-xs">Ссылка / Файл материала:</div>
                  <a
                    href={viewTargetMaterial.fileUrl || viewTargetMaterial.linkUrl || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium bg-primary/10 px-3 py-1.5 rounded-md border border-primary/20"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span className="font-mono truncate max-w-[400px]">
                      {viewTargetMaterial.fileUrl || viewTargetMaterial.linkUrl}
                    </span>
                  </a>
                </div>
              )}
            </div>

            <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
              <Button size="xs" variant="outline" onClick={() => setViewTargetMaterial(null)}>
                Закрыть
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Modal 1: Create Material Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="p-4 gap-3 text-xs sm:max-w-[480px]">
          <DialogHeader className="pb-2 border-b gap-1">
            <DialogTitle className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Plus className="h-4 w-4 text-primary" /> Публикация учебного материала
            </DialogTitle>
            <DialogDescription className="text-xs">
              Выберите тему, тип материала, введите конспект или прикрепите ссылку
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-1 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-medium text-foreground text-xs">Учебная тема</label>
                <Select value={newTopicId} onValueChange={setNewTopicId}>
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue>{topics.find((t) => t.id === newTopicId)?.title || "Выберите тему"}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {topics.map((t) => (
                      <SelectItem key={t.id} value={t.id} className="text-xs">
                        {t.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground text-xs">Тип материала</label>
                <Select value={newType} onValueChange={(val) => setNewType(val as MaterialType)}>
                  <SelectTrigger className="h-8 text-xs bg-background font-medium">
                    <SelectValue>{getTypeLabel(newType)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(MaterialType).map((t) => (
                      <SelectItem key={t} value={t} className="text-xs">
                        {getTypeLabel(t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground text-xs">Заголовок материала</label>
              <Input
                placeholder="Например: Презентация к лекции по теме 1"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="h-8 text-xs bg-background font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground text-xs">Текстовый конспект / тезисы</label>
              <Textarea
                placeholder="Вставьте текст лекции, инструкции к практике или описание..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="text-xs bg-background min-h-[90px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="font-medium text-foreground text-xs">Ссылка на файл (Drive/PDF)</label>
                <Input
                  placeholder="https://drive.google.com/..."
                  value={newFileUrl}
                  onChange={(e) => setNewFileUrl(e.target.value)}
                  className="h-8 text-xs bg-background font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground text-xs">Внешняя ссылка (Видео/Figma)</label>
                <Input
                  placeholder="https://..."
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  className="h-8 text-xs bg-background font-mono"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
            <Button variant="outline" size="xs" onClick={() => setIsCreateOpen(false)}>
              Отмена
            </Button>
            <Button size="xs" disabled={isPending} onClick={handleCreateMaterial}>
              Опубликовать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
