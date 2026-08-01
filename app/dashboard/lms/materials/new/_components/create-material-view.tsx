"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MaterialType } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  ChevronLeft,
  FileText,
  Building2,
  CheckCircle2,
  AlertCircle,
  Plus,
  Video,
  Link2,
  ExternalLink,
  Trash2,
  BookOpen,
  Laptop,
  FlaskConical,
} from "lucide-react";
import { GroupItemDTO, createMaterialAction } from "../../../actions";
import { RichWysiwygEditor, WysiwygTemplate } from "@/components/rich-wysiwyg-editor";

interface CreateMaterialViewProps {
  groups: GroupItemDTO[];
  topics: Array<{ id: string; title: string }>;
  selectedGroupId: string;
  selectedTopicId: string;
}

export interface ResourceLinkItem {
  title: string;
  url: string;
}

const DEFAULT_TEMPLATES: WysiwygTemplate[] = [
  {
    id: "lecture_main",
    name: "Конспект лекции",
    content: `## Теория и ключевые понятия\nПодробное описание теоретического материала занятия.\n\n1. Раздел 1. Введение и базовые определения\n2. Раздел 2. Принципы работы и примеры\n3. Раздел 3. Анализ архитектуры\n\n> **Главный вывод:** Рассматриваемый подход обеспечивает масштабируемость и безопасность системы.\n\n\`\`\`javascript\n// Иллюстративный пример кода\nconst systemStatus = "active";\nconsole.log("Логирование загрузки системы:", systemStatus);\n\`\`\``,
  },
  {
    id: "practice_main",
    name: "Практическое задание",
    content: `## Цели практической работы\nЗакрепление навыков на практике и выполнение задания.\n\n### Пошаговая инструкция:\n- [ ] 1. Инициализировать репозиторий и настроить окружение\n- [ ] 2. Реализовать заданную бизнес-логику\n- [ ] 3. Провести тестирование и проверить типы\n\n> **Важно:** Сохраняйте историю коммитов в Git!`,
  },
];

export function CreateMaterialView({
  groups,
  topics,
  selectedGroupId,
  selectedTopicId,
}: CreateMaterialViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [groupId, setGroupId] = useState(selectedGroupId);
  const [topicId, setTopicId] = useState(selectedTopicId || topics[0]?.id || "");
  const [type, setType] = useState<MaterialType>(MaterialType.LECTURE);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  // Multiple Video URLs
  const [videoUrls, setVideoUrls] = useState<string[]>([]);

  // Multiple File & Resource Links
  const [resourceLinks, setResourceLinks] = useState<ResourceLinkItem[]>([]);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleGroupChange = (val: string) => {
    setGroupId(val);
    router.push(`/dashboard/lms/materials/new?group=${val}`);
  };

  const handleAddVideoUrl = () => {
    setVideoUrls((prev) => [...prev, ""]);
  };

  const handleUpdateVideoUrl = (index: number, val: string) => {
    setVideoUrls((prev) => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  const handleRemoveVideoUrl = (index: number) => {
    setVideoUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddResourceLink = () => {
    setResourceLinks((prev) => [...prev, { title: "", url: "" }]);
  };

  const handleUpdateResourceLink = (index: number, field: "title" | "url", val: string) => {
    setResourceLinks((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  const handleRemoveResourceLink = (index: number) => {
    setResourceLinks((prev) => prev.filter((_, i) => i !== index));
  };

  const getTypeLabel = (t: MaterialType) => {
    switch (t) {
      case MaterialType.LECTURE:
        return "Лекция";
      case MaterialType.PRACTICE:
        return "Практическая работа";
      case MaterialType.LAB:
        return "Лабораторная работа";
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

  const handleSubmit = () => {
    if (!topicId || topicId === "none" || !title.trim()) {
      setErrorMsg("Укажите главу и заголовок материала");
      return;
    }

    const cleanVideos = videoUrls.map((v) => v.trim()).filter(Boolean);
    const cleanResources = resourceLinks.map((r) => ({ title: r.title.trim(), url: r.url.trim() })).filter((r) => Boolean(r.url));

    setErrorMsg(null);
    startTransition(async () => {
      // Serialize clean videos array into linkUrl
      const linkUrlData = cleanVideos.length > 0 ? JSON.stringify(cleanVideos) : null;
      // Serialize clean resource links into fileUrl
      const fileUrlData = cleanResources.length > 0 ? JSON.stringify(cleanResources) : null;

      const res = await createMaterialAction({
        topicId,
        type,
        title,
        content,
        fileUrl: fileUrlData || undefined,
        linkUrl: linkUrlData || undefined,
      });

      if (res.success) {
        setSuccessMsg("Материал успешно опубликован!");
        setTimeout(() => {
          router.push(`/dashboard/lms/materials?group=${groupId}`);
          router.refresh();
        }, 1000);
      } else {
        setErrorMsg(res.error || "Ошибка при публикации материала");
      }
    });
  };

  return (
    <div className="space-y-4 w-full">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-3 bg-card p-4 rounded-xl border shadow-xs">
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/lms/materials?group=${groupId}`}>
            <Button size="xs" variant="outline" className="h-8 w-8 p-0">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-base font-bold text-foreground flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> Публикация нового материала
            </h1>
            <p className="text-xs text-muted-foreground">
              Создайте урок, прикрепите видеозаписи, полезные файлы и ресурсы
            </p>
          </div>
        </div>

        <Button size="xs" disabled={isPending} onClick={handleSubmit} className="h-8 text-xs gap-1.5 font-medium">
          Опубликовать материал
        </Button>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="p-3 rounded-lg border border-primary/30 bg-primary/10 text-primary text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Form Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Main Content Column */}
        <div className="md:col-span-2 space-y-3">
          {/* Main Title & Basic Form */}
          <div className="p-4 border rounded-xl bg-card space-y-4 text-xs shadow-xs">
            <div className="space-y-1">
              <label className="font-semibold text-foreground text-xs">Заголовок материала *</label>
              <Input
                placeholder="Например: Введение в AutoLayout и адаптивный UI"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-9 text-xs bg-background font-medium"
              />
            </div>

            {/* Video Recordings Section (Multiple Video Links) */}
            <div className="p-3.5 rounded-xl border bg-muted/20 space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                  <Video className="h-4 w-4 text-primary" /> Видеозаписи (YouTube, VK Видео, Rutube)
                </label>
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={handleAddVideoUrl}
                  className="h-7 text-[11px] gap-1 text-primary hover:text-primary"
                >
                  <Plus className="h-3 w-3" /> Добавить видео
                </Button>
              </div>

              {videoUrls.length > 0 ? (
                <div className="space-y-2">
                  {videoUrls.map((url, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={url}
                        onChange={(e) => handleUpdateVideoUrl(idx, e.target.value)}
                        className="h-8 text-xs bg-background font-mono flex-1"
                      />
                      {url.trim() && (
                        <a href={url} target="_blank" rel="noreferrer" className="shrink-0">
                          <Button type="button" size="xs" variant="ghost" className="h-8 text-[11px] gap-1">
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </a>
                      )}
                      <Button
                        type="button"
                        size="xs"
                        variant="ghost"
                        onClick={() => handleRemoveVideoUrl(idx)}
                        className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[11px] text-muted-foreground italic">
                  Видеозаписи не добавлены (опционально)
                </div>
              )}
            </div>

            {/* Attachments & Files Section (Multiple Resource Links) */}
            <div className="p-3.5 rounded-xl border bg-muted/20 space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                  <Link2 className="h-4 w-4 text-primary" /> Файлы и полезные ссылки
                </label>
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={handleAddResourceLink}
                  className="h-7 text-[11px] gap-1 text-primary hover:text-primary"
                >
                  <Plus className="h-3 w-3" /> Добавить ссылку / файл
                </Button>
              </div>

              {resourceLinks.length > 0 ? (
                <div className="space-y-2">
                  {resourceLinks.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                      <Input
                        placeholder="Название ссылки (например, Макет Figma)"
                        value={item.title}
                        onChange={(e) => handleUpdateResourceLink(idx, "title", e.target.value)}
                        className="sm:col-span-5 h-8 text-xs bg-background"
                      />
                      <Input
                        placeholder="https://..."
                        value={item.url}
                        onChange={(e) => handleUpdateResourceLink(idx, "url", e.target.value)}
                        className="sm:col-span-6 h-8 text-xs bg-background font-mono"
                      />
                      <Button
                        type="button"
                        size="xs"
                        variant="ghost"
                        onClick={() => handleRemoveResourceLink(idx)}
                        className="sm:col-span-1 h-8 w-8 p-0 text-destructive hover:bg-destructive/10 shrink-0 justify-self-end"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[11px] text-muted-foreground italic">
                  Ссылки и файлы не прикреплены (опционально)
                </div>
              )}
            </div>

            {/* Rich Editor */}
            <RichWysiwygEditor
              value={content}
              onChange={setContent}
              label="Текст конспекта и содержание занятия"
              placeholder="Введите теоретический материал лекции, инструкции к практике или конспект..."
              minHeight="280px"
              templates={DEFAULT_TEMPLATES}
              onSubmit={handleSubmit}
            />
          </div>
        </div>

        {/* Right Sidebar Column */}
        <div className="space-y-3 sticky top-20 z-10 self-start">
          <div className="p-3.5 border rounded-xl bg-card space-y-3 text-xs shadow-xs">
            <h3 className="text-xs font-bold text-foreground border-b pb-1.5 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-primary" /> Классификация
            </h3>

            <div className="space-y-1">
              <label className="font-medium text-foreground text-xs">Учебная группа *</label>
              <Select value={groupId} onValueChange={handleGroupChange}>
                <SelectTrigger className="h-8 text-xs bg-background font-medium">
                  <SelectValue>{groups.find((g) => g.id === groupId)?.name || "Выберите группу"}</SelectValue>
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
              <label className="font-medium text-foreground text-xs">Глава *</label>
              <Select value={topicId} onValueChange={setTopicId}>
                <SelectTrigger className="h-8 text-xs bg-background font-medium">
                  <SelectValue>{topics.find((t) => t.id === topicId)?.title || "Выберите главу"}</SelectValue>
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
              <label className="font-medium text-foreground text-xs">Категория занятия</label>
              <Select value={type} onValueChange={(val) => setType(val as MaterialType)}>
                <SelectTrigger className="h-8 text-xs bg-background font-medium">
                  <SelectValue>{getTypeLabel(type)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={MaterialType.LECTURE} className="text-xs">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>Лекция</span>
                    </div>
                  </SelectItem>
                  <SelectItem value={MaterialType.PRACTICE} className="text-xs">
                    <div className="flex items-center gap-2">
                      <Laptop className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>Практическая работа</span>
                    </div>
                  </SelectItem>
                  <SelectItem value={MaterialType.LAB} className="text-xs">
                    <div className="flex items-center gap-2">
                      <FlaskConical className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>Лабораторная работа</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Submit Action Buttons */}
            <div className="pt-2 border-t space-y-1.5">
              <Button size="xs" disabled={isPending} onClick={handleSubmit} className="w-full h-8 text-xs gap-1.5 font-medium">
                Опубликовать материал
              </Button>

              <Link href={`/dashboard/lms/materials?group=${groupId}`} className="block">
                <Button size="xs" variant="outline" className="w-full h-8 text-xs">
                  Отмена
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
