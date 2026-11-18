"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  ChevronLeft,
  ClipboardList,
  Building2,
  Calendar,
  Paperclip,
  PlusCircle,
  Trash2,
  Eye,
  ExternalLink,
  FileText,
  FolderGit2,
  HelpCircle,
  Code2,
  EyeOff,
  Save,
} from "lucide-react";
import {
  AssignmentEditDTO,
  updateAssignmentAction,
} from "@/app/dashboard/assignments/actions";
import { parseAttachmentLinks } from "@/app/dashboard/assignments/_components/submission-utils";
import { toast } from "@/components/ui/toast";
import { FileUploadZone } from "@/components/file-upload-zone";
import { RichWysiwygEditor } from "@/components/rich-wysiwyg-editor";

export interface GroupOptionDTO {
  id: string;
  name: string;
}

export interface GroupSubjectOptionDTO {
  id: string;
  groupId: string;
  groupName: string;
  subjectName: string;
  teacherName: string;
}

interface EditAssignmentViewProps {
  initialAssignment: AssignmentEditDTO;
  groups: GroupOptionDTO[];
  groupSubjects: GroupSubjectOptionDTO[];
  selectedGroupId: string;
}

const PRESET_TEMPLATES = [
  {
    id: "rest_api",
    name: "REST API & Prisma (Лабораторная)",
    icon: Code2,
    content: `# Лабораторная работа: Разработка REST API на Next.js

## 1. Цель работы
Изучить принципы построения серверных экшенов, интеграции базы данных Prisma и обработки ошибок в современном стек-окружении.

> **Обратите внимание**: Все работы должны сопровождаться чистым кодом и комментариями к ключевым функциям.

---

## 2. Чеклист задач к выполнению
- [ ] Настроить схему базы данных в \`prisma/schema.prisma\`
- [ ] Написать серверный экшен для получения данных
- [ ] Реализовать обработку возможных ошибок с помощью \`try / catch\`
- [ ] Проверить работу типов через команды \`npx tsc --noEmit\`
- [ ] Ознакомиться с документацией проекта

---

## 3. Пример структуры функции
\`\`\`typescript
export async function getSubjectData(id: string) {
  try {
    const data = await prisma.subject.findUnique({ where: { id } });
    return { success: true, data };
  } catch (error) {
    return { success: false, error: "Ошибка загрузки данных" };
  }
}
\`\`\``,
  },
  {
    id: "lab",
    name: "Лабораторная работа (Базовая)",
    icon: FileText,
    content: `# Лабораторная работа: [Тема работы]

## 1. Цель работы
- Изучить базовые концепции и закрепить практические навыки.

## 2. Задания к выполнению
- [ ] Шаг 1: Подготовить рабочее окружение
- [ ] Шаг 2: Написать основной функционал
- [ ] Шаг 3: Проверить корректность обработки ошибок

> **Обратите внимание**: Все работы проверяются на уникальность.`,
  },
  {
    id: "project",
    name: "Практический проект",
    icon: FolderGit2,
    content: `# Практический проект: [Название проекта]

## Требования к проекту
1. Задание выполняется в парах или индивидуально.
2. Проект должен быть загружен в репозиторий GitHub.

## Чеклист проверки
- [ ] Чистый код без ошибок типов
- [ ] Полноценный пользовательский интерфейс
- [ ] Интеграция с базой данных`,
  },
  {
    id: "quiz",
    name: "Контрольные вопросы",
    icon: HelpCircle,
    content: `# Контрольный срез

Подготовьте развернутые письменные ответы на следующие вопросы:
1. Опишите порядок передачи данных между компонентами.
2. Как работают Server Actions в Next.js?

> Ответ прикрепите в виде ссылки на текстовый документ.`,
  },
];

export function EditAssignmentView({
  initialAssignment,
  groups = [],
  groupSubjects = [],
  selectedGroupId: initialSelectedGroupId,
}: EditAssignmentViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    initialAssignment.groupId || initialSelectedGroupId || groups[0]?.id || ""
  );

  const availableSubjects = groupSubjects.filter(
    (gs) => gs.groupId === selectedGroupId
  );

  const [selectedGroupSubjectId, setSelectedGroupSubjectId] = useState<string>(
    initialAssignment.groupSubjectId || availableSubjects[0]?.id || ""
  );

  const [title, setTitle] = useState<string>(initialAssignment.title || "");
  const [description, setDescription] = useState<string>(
    initialAssignment.description || ""
  );
  const [dueDate, setDueDate] = useState<string>(initialAssignment.dueDate || "");
  const [isPublished, setIsPublished] = useState<boolean>(
    initialAssignment.isPublished
  );

  const initialParsedUrls = parseAttachmentLinks(initialAssignment.fileUrl);
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>(
    initialParsedUrls.length > 0 ? initialParsedUrls : [""]
  );

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [modKey, setModKey] = useState<string>("Alt");
  const [enterModKey, setEnterModKey] = useState<string>("Ctrl");

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform || "");
      if (isMac) {
        setModKey("Cmd ⌘ + Shift ⇧");
        setEnterModKey("Cmd ⌘");
      } else {
        setModKey("Ctrl + Shift");
        setEnterModKey("Ctrl");
      }
    }
  }, []);

  const handleGroupChange = (gId: string) => {
    setSelectedGroupId(gId);
    const sub = groupSubjects.filter((gs) => gs.groupId === gId);
    setSelectedGroupSubjectId(sub[0]?.id || "");
  };

  const handleAddAttachmentUrl = () => {
    setAttachmentUrls((prev) => [...prev, ""]);
  };

  const handleRemoveAttachmentUrl = (index: number) => {
    setAttachmentUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateAttachmentUrl = (index: number, value: string) => {
    setAttachmentUrls((prev) => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  };

  const handleSubmit = (targetPublish?: boolean) => {
    const finalPublish = targetPublish !== undefined ? targetPublish : isPublished;
    if (!title.trim()) {
      toast.add({ title: "Укажите заголовок задания", type: "error" });
      return;
    }
    if (!description.trim()) {
      toast.add({ title: "Укажите описание и требования к заданию", type: "error" });
      return;
    }
    if (!selectedGroupSubjectId) {
      toast.add({ title: "Выберите учебную дисциплину", type: "error" });
      return;
    }

    const validUrls = attachmentUrls.map((u) => u.trim()).filter(Boolean);
    const serializedFileUrl = validUrls.length > 0 ? JSON.stringify(validUrls) : undefined;

    startTransition(async () => {
      const res = await updateAssignmentAction({
        id: initialAssignment.id,
        groupSubjectId: selectedGroupSubjectId,
        title,
        description,
        dueDate: dueDate || undefined,
        fileUrl: serializedFileUrl,
        isPublished: finalPublish,
      });

      if (res.success) {
        toast.add({
          title: finalPublish
            ? "Изменения сохранены и опубликованы!"
            : "Задание сохранено как черновик!",
          type: "success",
        });
        router.push(`/dashboard/assignments?group=${selectedGroupId}`);
        router.refresh();
      } else {
        toast.add({ title: res.error || "Ошибка сохранения задания", type: "error" });
      }
    });
  };

  return (
    <div className="w-full space-y-3 pb-4 text-xs">
      {/* Navigation Topbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3 rounded-xl border shadow-xs">
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/assignments?group=${selectedGroupId}`}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div className="space-y-0.5">
            <h1 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <ClipboardList className="h-4 w-4 text-primary" /> Редактирование задания
            </h1>
            <p className="text-[11px] text-muted-foreground">
              Измените заголовок, описание, прикреплённые материалы или параметры публикации
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Left = Editor (2 cols), Right = Settings (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-3">
          <Card className="border shadow-none p-3 space-y-2.5">
            {/* Title Field */}
            <div className="space-y-1">
              <label className="font-medium text-muted-foreground text-[10px] uppercase tracking-wider">
                Название домашнего задания
              </label>
              <Input
                placeholder="Введите заголовок задания..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-9 text-xs font-semibold bg-background border-primary/20 focus:border-primary shadow-none"
              />
            </div>

            {/* Unified Rich WYSIWYG Editor (same as Materials) */}
            <RichWysiwygEditor
              value={description}
              onChange={setDescription}
              label="Описание и требования к заданию"
              placeholder="Опишите подробные инструкции к заданию..."
              minHeight="320px"
              imageCategory="assignment"
              templates={PRESET_TEMPLATES.map(({ id, name, content }) => ({
                id,
                name,
                content,
              }))}
              onSubmit={() => handleSubmit(isPublished)}
            />
          </Card>
        </div>

        {/* Right Column: Settings */}
        <div className="space-y-2.5 sticky top-20 z-10 self-start">
          {/* Metadata Card */}
          <div className="rounded-xl border bg-card p-3 space-y-2 text-xs shadow-xs">
            <CardHeader className="p-0 pb-1.5 border-b">
              <CardTitle className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-primary" /> Параметры публикации
              </CardTitle>
            </CardHeader>

            <div className="space-y-2 text-xs">
              <div className="space-y-1">
                <label className="font-medium text-foreground text-xs">Учебная группа</label>
                <Select value={selectedGroupId} onValueChange={handleGroupChange}>
                  <SelectTrigger className="h-8 text-xs font-medium bg-background shadow-none">
                    <SelectValue>
                      {groups.find((g) => g.id === selectedGroupId)?.name ||
                        "Выберите группу"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={g.id} className="text-xs font-medium">
                        Группа {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground text-xs">
                  Учебная дисциплина
                </label>
                <Select
                  value={selectedGroupSubjectId}
                  onValueChange={setSelectedGroupSubjectId}
                >
                  <SelectTrigger className="h-8 text-xs font-medium bg-background shadow-none">
                    <SelectValue>
                      {availableSubjects.find((s) => s.id === selectedGroupSubjectId)
                        ?.subjectName || "Выберите предмет"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {availableSubjects.map((s) => (
                      <SelectItem key={s.id} value={s.id} className="text-xs font-medium">
                        {s.subjectName} ({s.teacherName})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground text-xs flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-primary" /> Срок сдачи (Дедлайн)
                </label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="h-8 text-xs bg-background font-medium shadow-none"
                />
              </div>

              <div className="pt-2 border-t">
                <div className="flex items-center justify-between gap-2 py-0.5">
                  <label
                    htmlFor="assignment-publish-switch"
                    className="text-xs font-medium text-foreground cursor-pointer flex items-center gap-1.5"
                  >
                    {isPublished ? (
                      <>
                        <Eye className="h-3.5 w-3.5 text-primary" />
                        <span>Опубликовано</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>Черновик</span>
                      </>
                    )}
                  </label>
                  <Switch
                    id="assignment-publish-switch"
                    checked={isPublished}
                    onCheckedChange={(checked) => setIsPublished(checked)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Attachments Card */}
          <Card className="border shadow-none p-3 space-y-2.5">
            <div className="flex items-center justify-between border-b pb-1.5">
              <CardTitle className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Paperclip className="h-4 w-4 text-primary" /> Материалы & Ссылки
              </CardTitle>
              <Button
                type="button"
                size="xs"
                variant="outline"
                onClick={handleAddAttachmentUrl}
                className="h-6 px-2 text-[10px] gap-1 text-primary border-primary/30 hover:bg-primary/10 shadow-none font-medium"
              >
                <PlusCircle className="h-3 w-3" /> Ссылка
              </Button>
            </div>

            <FileUploadZone
              folder="assignments"
              onUploadSuccess={(meta) => {
                setAttachmentUrls((prev) => [...prev.filter(Boolean), meta.url]);
              }}
              maxSizeMb={100}
              label="Прикрепить файл к заданию"
              description="Методичка PDF, Word, архив с заготовкой кода ZIP"
            />

            <div className="space-y-2">
              {attachmentUrls.map((url, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    placeholder="https://..."
                    value={url}
                    onChange={(e) => handleUpdateAttachmentUrl(idx, e.target.value)}
                    className="h-7 text-xs bg-background shadow-none font-mono flex-1"
                  />
                  {url.trim() && (
                    <a href={url} target="_blank" rel="noreferrer" className="shrink-0">
                      <Button
                        type="button"
                        size="xs"
                        variant="ghost"
                        className="h-7 w-7 p-0 shadow-none"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachmentUrl(idx)}
                    className="text-destructive hover:text-destructive/80 p-0.5 shrink-0"
                    title="Удалить ссылку"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </Card>

          {/* Actions */}
          <div className="flex flex-col gap-1.5">
            <Button
              size="xs"
              disabled={isPending}
              onClick={() => handleSubmit(isPublished)}
              className="w-full h-8 text-xs gap-1.5 font-medium shadow-none"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{isPending ? "Сохранение..." : "Сохранить изменения"}</span>
            </Button>

            <Link
              href={`/dashboard/assignments?group=${selectedGroupId}`}
              className="block w-full"
            >
              <Button
                variant="outline"
                size="xs"
                className="w-full h-8 text-xs font-medium shadow-none"
              >
                Отмена и возврат
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
