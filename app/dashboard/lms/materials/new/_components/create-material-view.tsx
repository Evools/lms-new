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
  CheckCircle2,
  AlertCircle,
  Plus,
  Video,
  Link2,
  FileCode,
  ExternalLink,
  BookOpen,
  Laptop,
  GraduationCap,
  Sparkles,
  Info,
} from "lucide-react";
import { GroupItemDTO, createMaterialAction } from "../../../actions";
import { RichWysiwygEditor, WysiwygTemplate } from "@/components/rich-wysiwyg-editor";

interface CreateMaterialViewProps {
  groups: GroupItemDTO[];
  topics: Array<{ id: string; title: string }>;
  selectedGroupId: string;
  selectedTopicId: string;
}

const LECTURE_TEMPLATES: WysiwygTemplate[] = [
  {
    id: "lecture_main",
    name: "Конспект лекции",
    content: `## Теория и ключевые понятия\nПодробное описание теоретического материала занятия.\n\n1. Раздел 1. Введение и базовые определения\n2. Раздел 2. Принципы работы и примеры\n3. Раздел 3. Анализ архитектуры\n\n> **Главный вывод:** Рассматриваемый подход обеспечивает масштабируемость и безопасность системы.\n\n\`\`\`javascript\n// Иллюстративный пример кода\nconst systemStatus = "active";\nconsole.log("Логирование загрузки системы:", systemStatus);\n\`\`\``,
  },
];

const PRACTICE_TEMPLATES: WysiwygTemplate[] = [
  {
    id: "practice_main",
    name: "Практикум / Лабораторная",
    content: `## Цели практической работы\nЗакрепление навыков на практике и выполнение задания.\n\n### Пошаговая инструкция:\n- [ ] 1. Инициализировать репозиторий и настроить окружение\n- [ ] 2. Реализовать заданную бизнес-логику\n- [ ] 3. Провести тестирование и проверить типы\n\n> **Важно:** Сохраняйте историю коммитов в Git!`,
  },
];

const VIDEO_TEMPLATES: WysiwygTemplate[] = [
  {
    id: "video_notes",
    name: "Таймкоды к видео",
    content: `## Описание видеоурока\nКраткая аннотация и ключевые таймкоды к видеозаписи.\n\n### Таймкоды занятия:\n- **00:00** — Введение и постановка задачи\n- **05:30** — Разбор теоретического блока\n- **18:45** — Пошаговое написание кода\n- **32:10** — Ответы на частые вопросы и подведение итогов`,
  },
];

const LINK_TEMPLATES: WysiwygTemplate[] = [
  {
    id: "link_notes",
    name: "Описание ресурса",
    content: `## Обзор веб-ресурса / Статьи\nОписание материала и почему его нужно изучить студенту.\n\n### Ключевые тезисы статьи:\n- Главные рекомендации автора\n- Практические примеры реализации\n- Ссылки на спецификацию`,
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

    if (type === MaterialType.VIDEO && !linkUrl.trim()) {
      setErrorMsg("Укажите ссылку на видеозапись");
      return;
    }

    if ((type === MaterialType.PDF || type === MaterialType.DOCUMENT) && !fileUrl.trim() && !content.trim()) {
      setErrorMsg("Укажите ссылку на файл документа или добавьте текстовое описание");
      return;
    }

    if (type === MaterialType.LINK && !linkUrl.trim()) {
      setErrorMsg("Укажите адрес внешней ссылки (URL)");
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

  const getActiveTemplates = (): WysiwygTemplate[] => {
    switch (type) {
      case MaterialType.VIDEO:
        return VIDEO_TEMPLATES;
      case MaterialType.LINK:
        return LINK_TEMPLATES;
      case MaterialType.PRACTICE:
      case MaterialType.LAB:
        return PRACTICE_TEMPLATES;
      default:
        return LECTURE_TEMPLATES;
    }
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
              <FileText className="h-5 w-5 text-primary" /> Адаптивный конструктор материалов LMS
            </h1>
            <p className="text-xs text-muted-foreground">
              Формат публикаций автоматически настраивает поля ввода и инструменты под тип материала
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
        {/* Left Column: Format Selector & Dynamic Workspace */}
        <div className="md:col-span-2 space-y-4">
          {/* Format / Type Segmented Selector Bar */}
          <Card className="p-4 border shadow-none rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-foreground text-xs block">
                Выберите формат публикуемого материала *
              </label>
              <Badge variant="outline" className="text-[10px] border-primary/30 text-primary font-medium">
                Формат: {getTypeLabel(type)}
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { type: MaterialType.LECTURE, label: "Лекция", icon: BookOpen, desc: "Конспект урока" },
                { type: MaterialType.PRACTICE, label: "Практика", icon: Laptop, desc: "Задание и код" },
                { type: MaterialType.LAB, label: "Лабораторная", icon: GraduationCap, desc: "Отчёт и замеры" },
                { type: MaterialType.VIDEO, label: "Видеоурок", icon: Video, desc: "Плеер и таймкоды" },
                { type: MaterialType.PDF, label: "PDF Документ", icon: FileText, desc: "Файл из облака" },
                { type: MaterialType.DOCUMENT, label: "Методичка", icon: FileCode, desc: "Методическое пособие" },
                { type: MaterialType.LINK, label: "Внешняя ссылка", icon: Link2, desc: "Веб-страница / Статья" },
              ].map((item) => {
                const IconComp = item.icon;
                const isSelected = type === item.type;

                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setType(item.type)}
                    className={`p-2.5 rounded-lg border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                      isSelected
                        ? "border-primary bg-primary/10 text-primary shadow-xs"
                        : "border-border bg-card text-foreground hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <IconComp className={`h-4 w-4 shrink-0 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                      <span className="text-xs font-medium truncate">{item.label}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground line-clamp-1">{item.desc}</span>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* DYNAMIC WORKSPACE CARD - ADAPTS FUNCTIONALLY PER FORMAT */}
          <Card className="p-4 border shadow-none rounded-xl space-y-4">
            <div className="space-y-1">
              <label className="font-semibold text-foreground text-xs">Заголовок материала *</label>
              <Input
                placeholder={
                  type === MaterialType.VIDEO
                    ? "Например: Видеоурок. Разработка REST API на Next.js (Часть 1)"
                    : type === MaterialType.PDF || type === MaterialType.DOCUMENT
                      ? "Например: Методическое пособие по курсу 'Веб-программирование'"
                      : type === MaterialType.LINK
                        ? "Например: Официальная документация MDN: HTTP Протокол"
                        : type === MaterialType.PRACTICE || type === MaterialType.LAB
                          ? "Например: Практикум №1. Создание схемы данных и экшенов"
                          : "Например: Лекция 1. Архитектура веб-приложений и сетевые протоколы"
                }
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-8 text-xs bg-background font-medium"
              />
            </div>

            {/* DYNAMIC HERO FIELD 1: VIDEO URL */}
            {type === MaterialType.VIDEO && (
              <div className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-primary text-xs flex items-center gap-1.5">
                    <Video className="h-4 w-4" /> Ссылка на видеозапись (YouTube, VK Видео, Rutube) *
                  </label>
                  <span className="text-[10px] text-muted-foreground">Интегрируется прямо в плейлист группы</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    className="h-8 text-xs bg-background font-mono border-primary/40 flex-1"
                  />
                  {linkUrl.trim() && (
                    <a href={linkUrl} target="_blank" rel="noreferrer" className="shrink-0">
                      <Button type="button" size="xs" variant="outline" className="h-8 text-[11px] gap-1">
                        Проверить <ExternalLink className="h-3 w-3" />
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* DYNAMIC HERO FIELD 2: CLOUD DOCUMENT URL */}
            {(type === MaterialType.PDF || type === MaterialType.DOCUMENT) && (
              <div className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-primary text-xs flex items-center gap-1.5">
                    <FileText className="h-4 w-4" /> Ссылка на файл документа (Google Drive, Yandex.Disk) *
                  </label>
                  <span className="text-[10px] text-muted-foreground">Прямой доступ для скачивания студентами</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="https://drive.google.com/file/d/.../view"
                    value={fileUrl}
                    onChange={(e) => setFileUrl(e.target.value)}
                    className="h-8 text-xs bg-background font-mono border-primary/40 flex-1"
                  />
                  {fileUrl.trim() && (
                    <a href={fileUrl} target="_blank" rel="noreferrer" className="shrink-0">
                      <Button type="button" size="xs" variant="outline" className="h-8 text-[11px] gap-1">
                        Открыть файл <ExternalLink className="h-3 w-3" />
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* DYNAMIC HERO FIELD 3: EXTERNAL WEB LINK */}
            {type === MaterialType.LINK && (
              <div className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-primary text-xs flex items-center gap-1.5">
                    <Link2 className="h-4 w-4" /> Внешняя адресная ссылка на веб-ресурс (URL) *
                  </label>
                  <span className="text-[10px] text-muted-foreground">Открывается в отдельном окне</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="https://developer.mozilla.org/ru/docs/Web/HTTP"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    className="h-8 text-xs bg-background font-mono border-primary/40 flex-1"
                  />
                  {linkUrl.trim() && (
                    <a href={linkUrl} target="_blank" rel="noreferrer" className="shrink-0">
                      <Button type="button" size="xs" variant="outline" className="h-8 text-[11px] gap-1">
                        Перейти <ExternalLink className="h-3 w-3" />
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* DYNAMIC HERO FIELD 4: PRACTICE STARTER REPO */}
            {(type === MaterialType.PRACTICE || type === MaterialType.LAB) && (
              <div className="p-3 rounded-lg border bg-muted/40 space-y-1.5">
                <label className="font-medium text-foreground text-xs flex items-center gap-1.5">
                  <Laptop className="h-3.5 w-3.5 text-primary" /> Ссылка на заготовку / репозиторий проекта (опционально)
                </label>
                <Input
                  placeholder="https://github.com/your-org/starter-template"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="h-8 text-xs bg-background font-mono"
                />
              </div>
            )}

            {/* REUSABLE WYSIWYG EDITOR - TAILORED FOR THE SELECTED FORMAT */}
            <RichWysiwygEditor
              value={content}
              onChange={setContent}
              label={
                type === MaterialType.VIDEO
                  ? "Конспект и таймкоды к видеозаписи"
                  : type === MaterialType.PDF || type === MaterialType.DOCUMENT
                    ? "Аннотация, содержание и инструкции к файлу"
                    : type === MaterialType.LINK
                      ? "Описание ресурса и вопросы для изучения"
                      : type === MaterialType.PRACTICE || type === MaterialType.LAB
                        ? "Формулировка задания и требования к выполнению"
                        : "Текст лекции и конспект занятия"
              }
              placeholder={
                type === MaterialType.VIDEO
                  ? "Укажите ключевые моменты видеозаписи, таймкоды и дополнительные пояснения..."
                  : type === MaterialType.PDF || type === MaterialType.DOCUMENT
                    ? "Опишите о чём данный документ, какие главы необходимо прочесть студенту..."
                    : type === MaterialType.LINK
                      ? "Опишите полезность данного ресурса и основные выводы статьи..."
                      : "Введите подробный текст лекции, методические указания и примеры кода..."
              }
              minHeight="280px"
              templates={getActiveTemplates()}
              onSubmit={handleSubmit}
            />

            {/* SECONDARY ATTACHMENT FIELDS FOR LECTURE MODE */}
            {type === MaterialType.LECTURE && (
              <div className="pt-2 border-t space-y-3">
                <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Link2 className="h-3.5 w-3.5 text-primary" /> Прикреплённые файлы и внешние ссылки к лекции
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-medium text-muted-foreground text-[11px]">Файл презентации / конспекта (Google / Yandex)</label>
                    <Input
                      placeholder="https://drive.google.com/..."
                      value={fileUrl}
                      onChange={(e) => setFileUrl(e.target.value)}
                      className="h-8 text-xs bg-background font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-medium text-muted-foreground text-[11px]">Дополнительная веб-ссылка</label>
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
