"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MaterialType } from "@prisma/client";
import { Card } from "@/components/ui/card";
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
  FolderKanban,
  CheckCircle2,
  AlertCircle,
  Plus,
  Video,
  Link2,
  FileCode,
  ExternalLink,
  FileSpreadsheet,
  BookOpen,
  Laptop,
  GraduationCap,
} from "lucide-react";
import { GroupItemDTO, createMaterialAction } from "../../../actions";
import { RichWysiwygEditor, WysiwygTemplate } from "@/components/rich-wysiwyg-editor";

interface CreateMaterialViewProps {
  groups: GroupItemDTO[];
  topics: Array<{ id: string; title: string }>;
  selectedGroupId: string;
  selectedTopicId: string;
}

const MATERIAL_TEMPLATES: WysiwygTemplate[] = [
  {
    id: "lecture",
    name: "Конспект лекции",
    content: `## Теория и ключевые понятия\nПодробное описание теоретического материала занятия.\n\n1. Раздел 1. Введение и базовые определения\n2. Раздел 2. Принципы работы и примеры\n3. Раздел 3. Анализ архитектуры\n\n> **Главный вывод:** Рассматриваемый подход обеспечивает масштабируемость и безопасность системы.\n\n\`\`\`javascript\n// Иллюстративный пример кода\nconst systemStatus = "active";\nconsole.log("Логирование загрузки системы:", systemStatus);\n\`\`\``,
  },
  {
    id: "practice",
    name: "Практикум",
    content: `## Цели практической работы\nЗакрепление навыков на практике и выполнение задания.\n\n### Пошаговая инструкция:\n- [ ] 1. Инициализировать репозиторий и настроить окружение\n- [ ] 2. Реализовать заданную бизнес-логику\n- [ ] 3. Провести тестирование и проверить типы\n\n> **Важно:** Сохраняйте историю коммитов в Git!`,
  },
  {
    id: "video_notes",
    name: "Заметки к видео",
    content: `## Описание видеоурока\nКраткая аннотация и ключевые таймкоды к видеозаписи.\n\n### Таймкоды занятия:\n- **00:00** — Введение и постановка задачи\n- **05:30** — Разбор теоретического блока\n- **18:45** — Пошаговое написание кода\n- **32:10** — Ответы на частые вопросы и подведение итогов`,
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
  const [fileUrl, setFileUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleGroupChange = (val: string) => {
    setGroupId(val);
    router.push(`/dashboard/lms/materials/new?group=${val}`);
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
    if (!topicId || topicId === "none" || !title.trim() || !type) {
      setErrorMsg("Укажите тему урока, заголовок и тип материала");
      return;
    }

    setErrorMsg(null);
    startTransition(async () => {
      const res = await createMaterialAction({
        topicId,
        type,
        title,
        content,
        fileUrl,
        linkUrl,
      });

      if (res.success) {
        setSuccessMsg("Учебный материал успешно опубликован!");
        setTimeout(() => {
          router.push(`/dashboard/lms/materials?group=${groupId}`);
          router.refresh();
        }, 1000);
      } else {
        setErrorMsg(res.error || "Ошибка при создании материала");
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
              <FileText className="h-5 w-5 text-primary" /> Публикация учебного материала
            </h1>
            <p className="text-xs text-muted-foreground">
              Создание лекций, практических пособий, прикрепление видеоуроков, презентаций и файлов
            </p>
          </div>
        </div>

        <Button size="xs" disabled={isPending} onClick={handleSubmit} className="h-8 text-xs gap-1.5 font-medium">
          <Plus className="h-3.5 w-3.5" /> Опубликовать материал
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Left Column: Format Selector & Main Editor */}
        <div className="md:col-span-2 space-y-4">
          {/* Format / Type Segmented Selector Bar */}
          <Card className="p-4 border shadow-none rounded-xl space-y-2">
            <label className="font-semibold text-foreground text-xs block">
              Выберите формат публикуемого материала *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { type: MaterialType.LECTURE, label: "Лекция", icon: BookOpen },
                { type: MaterialType.PRACTICE, label: "Практика", icon: Laptop },
                { type: MaterialType.LAB, label: "Лабораторная", icon: GraduationCap },
                { type: MaterialType.VIDEO, label: "Видеоурок", icon: Video },
                { type: MaterialType.PDF, label: "PDF Файл", icon: FileText },
                { type: MaterialType.DOCUMENT, label: "Методичка", icon: FileCode },
                { type: MaterialType.LINK, label: "Ссылка", icon: Link2 },
              ].map((item) => {
                const IconComp = item.icon;
                const isSelected = type === item.type;

                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setType(item.type)}
                    className={`p-2.5 rounded-lg border text-left flex items-center gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? "border-primary bg-primary/10 text-primary font-medium shadow-xs"
                        : "border-border bg-card text-foreground hover:bg-muted/40 font-medium"
                    }`}
                  >
                    <IconComp className={`h-4 w-4 shrink-0 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="text-xs truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Main Content Card */}
          <Card className="p-4 border shadow-none rounded-xl space-y-4">
            <div className="space-y-1">
              <label className="font-semibold text-foreground text-xs">Заголовок материала *</label>
              <Input
                placeholder="Например: Лекция 1. Основы RESTful архитектуры и методы HTTP"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-8 text-xs bg-background font-medium"
              />
            </div>

            {/* Adapted Inputs Based on Format */}
            {type === MaterialType.VIDEO && (
              <div className="space-y-1 p-3 rounded-lg border bg-primary/5">
                <label className="font-semibold text-primary text-xs flex items-center gap-1.5">
                  <Video className="h-4 w-4" /> Ссылка на видеозапись (YouTube, VK Видео, Rutube)
                </label>
                <Input
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="h-8 text-xs bg-background font-mono border-primary/40"
                />
              </div>
            )}

            {(type === MaterialType.PDF || type === MaterialType.DOCUMENT) && (
              <div className="space-y-1 p-3 rounded-lg border bg-primary/5">
                <label className="font-semibold text-primary text-xs flex items-center gap-1.5">
                  <FileText className="h-4 w-4" /> Ссылка на файл документа (Google Drive, Yandex.Disk)
                </label>
                <Input
                  placeholder="https://drive.google.com/file/d/..."
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  className="h-8 text-xs bg-background font-mono border-primary/40"
                />
              </div>
            )}

            {type === MaterialType.LINK && (
              <div className="space-y-1 p-3 rounded-lg border bg-primary/5">
                <label className="font-semibold text-primary text-xs flex items-center gap-1.5">
                  <Link2 className="h-4 w-4" /> Внешняя ссылка на веб-ресурс (URL)
                </label>
                <Input
                  placeholder="https://developer.mozilla.org/ru/docs/Web/HTTP"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="h-8 text-xs bg-background font-mono border-primary/40"
                />
              </div>
            )}

            {/* Reusable Rich WYSIWYG Editor */}
            <RichWysiwygEditor
              value={content}
              onChange={setContent}
              label="Текст лекции / конспект / описание задания"
              placeholder="Введите подробное содержание лекции, методические указания, примеры кода или формулировку практики..."
              minHeight="300px"
              templates={MATERIAL_TEMPLATES}
              onSubmit={handleSubmit}
            />

            {/* Additional Links Card */}
            {type !== MaterialType.VIDEO && type !== MaterialType.LINK && (
              <div className="pt-2 border-t space-y-3">
                <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Link2 className="h-3.5 w-3.5 text-primary" /> Дополнительные прикрепеленные ресурсы (опционально)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-medium text-muted-foreground text-[11px]">Облачный файл (Google Drive / Yandex)</label>
                    <Input
                      placeholder="https://drive.google.com/..."
                      value={fileUrl}
                      onChange={(e) => setFileUrl(e.target.value)}
                      className="h-8 text-xs bg-background font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-medium text-muted-foreground text-[11px]">Внешняя вебресурс-ссылка</label>
                    <Input
                      placeholder="https://..."
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      className="h-8 text-xs bg-background font-mono"
                    />
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Settings & Metadata */}
        <div className="space-y-3 sticky top-20 z-10 self-start">
          <div className="p-3.5 border rounded-xl bg-card space-y-2.5 text-xs shadow-xs">
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
              <label className="font-medium text-foreground text-xs">Учебная тема (Урок) *</label>
              <Select value={topicId} onValueChange={setTopicId}>
                <SelectTrigger className="h-8 text-xs bg-background font-medium">
                  <SelectValue>{topics.find((t) => t.id === topicId)?.title || "Выберите тему"}</SelectValue>
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

            {/* Selected Format Summary Badge */}
            <div className="p-2.5 rounded-lg border bg-muted/30 space-y-1">
              <div className="text-[11px] font-semibold text-foreground flex items-center justify-between">
                <span>Формат материала:</span>
                <Badge variant="outline" className="text-[10px] border-primary/30 text-primary font-medium">
                  {getTypeLabel(type)}
                </Badge>
              </div>
            </div>

            {/* Submit Action Buttons */}
            <div className="pt-2 border-t space-y-1.5">
              <Button size="xs" disabled={isPending} onClick={handleSubmit} className="w-full h-8 text-xs gap-1.5 font-medium">
                <Plus className="h-3.5 w-3.5" /> Опубликовать материал
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
