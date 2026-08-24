"use client";

import React, { useState, useTransition, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ClipboardList,
  Building2,
  BookOpen,
  Calendar,
  Bold,
  Italic,
  Heading,
  List,
  ListOrdered,
  Code,
  Quote,
  Link2,
  Paperclip,
  PlusCircle,
  Trash2,
  Eye,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Send,
  Strikethrough,
  Minus,
  CheckSquare,
  Award,
  ExternalLink,
  FileText,
  Clock,
  LayoutTemplate,
  FolderGit2,
  HelpCircle,
  Code2,
} from "lucide-react";
import { GroupItemDTO, GroupSubjectDTO, createAssignmentAction } from "@/app/dashboard/assignments/actions";
import { renderMarkdown } from "@/lib/markdown";
import { toast } from "@/components/ui/toast";

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

interface CreateAssignmentViewProps {
  groups: GroupOptionDTO[];
  groupSubjects: GroupSubjectOptionDTO[];
  defaultGroupId?: string;
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

export function CreateAssignmentView({
  groups = [],
  groupSubjects = [],
  defaultGroupId,
}: CreateAssignmentViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    defaultGroupId || (groups[0]?.id || "")
  );

  // Filter subjects by selected group
  const availableSubjects = groupSubjects.filter(
    (gs) => gs.groupId === selectedGroupId
  );

  const [selectedGroupSubjectId, setSelectedGroupSubjectId] = useState<string>(
    availableSubjects[0]?.id || ""
  );

  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [maxScore, setMaxScore] = useState<string>("100");
  const [mode, setMode] = useState<"EDIT" | "PREVIEW">("EDIT");

  const [attachmentUrls, setAttachmentUrls] = useState<string[]>([""]);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Group change handler
  const handleGroupChange = (gId: string) => {
    setSelectedGroupId(gId);
    const sub = groupSubjects.filter((gs) => gs.groupId === gId);
    setSelectedGroupSubjectId(sub[0]?.id || "");
  };

  const charCount = description.length;
  const wordCount = description.trim() ? description.trim().split(/\s+/).length : 0;
  const readingTimeMin = Math.ceil(wordCount / 180) || 1;

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

  // Insert Template
  const handleApplyTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tmpl = PRESET_TEMPLATES.find((t) => t.id === templateId);
    if (tmpl) {
      setDescription(tmpl.content);
    }
  };

  // Smart Key Handler: Shortcuts + Auto Lists
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd+Enter or Ctrl+Enter -> Publish
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
      return;
    }

    // Cmd+Shift+B or Ctrl+Shift+B -> Bold
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "b") {
      e.preventDefault();
      insertFormatting("**", "**");
      return;
    }

    // Cmd+Shift+I or Ctrl+Shift+I -> Italic
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "i") {
      e.preventDefault();
      insertFormatting("*", "*");
      return;
    }

    if (e.key !== "Enter" || e.shiftKey) return;

    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursor = textarea.selectionStart;
    const textBeforeCursor = description.substring(0, cursor);
    const textAfterCursor = description.substring(cursor);

    // Find current line text
    const lastLineStart = textBeforeCursor.lastIndexOf("\n") + 1;
    const currentLine = textBeforeCursor.substring(lastLineStart);

    // 1. Checklist: - [ ] or - [x]
    const checklistMatch = currentLine.match(/^(\s*-\s*\[[ x]\]\s*)(.*)/i);
    if (checklistMatch) {
      e.preventDefault();
      const prefix = checklistMatch[1];
      const content = checklistMatch[2];

      if (!content.trim()) {
        const newText = description.substring(0, lastLineStart) + textAfterCursor;
        setDescription(newText);
        setTimeout(() => textarea.setSelectionRange(lastLineStart, lastLineStart), 10);
        return;
      }

      const indent = prefix.match(/^\s*/)?.[0] || "";
      const nextPrefix = `\n${indent}- [ ] `;
      const newText = textBeforeCursor + nextPrefix + textAfterCursor;
      setDescription(newText);
      const newCursor = cursor + nextPrefix.length;
      setTimeout(() => textarea.setSelectionRange(newCursor, newCursor), 10);
      return;
    }

    // 2. Bullet list: - or *
    const bulletMatch = currentLine.match(/^(\s*[-*]\s+)(.*)/);
    if (bulletMatch) {
      e.preventDefault();
      const prefix = bulletMatch[1];
      const content = bulletMatch[2];

      if (!content.trim()) {
        const newText = description.substring(0, lastLineStart) + textAfterCursor;
        setDescription(newText);
        setTimeout(() => textarea.setSelectionRange(lastLineStart, lastLineStart), 10);
        return;
      }

      const nextPrefix = `\n${prefix}`;
      const newText = textBeforeCursor + nextPrefix + textAfterCursor;
      setDescription(newText);
      const newCursor = cursor + nextPrefix.length;
      setTimeout(() => textarea.setSelectionRange(newCursor, newCursor), 10);
      return;
    }

    // 3. Numbered list: N.
    const numMatch = currentLine.match(/^(\s*)(\d+)(\.\s+)(.*)/);
    if (numMatch) {
      e.preventDefault();
      const indent = numMatch[1];
      const num = parseInt(numMatch[2], 10);
      const dot = numMatch[3];
      const content = numMatch[4];

      if (!content.trim()) {
        const newText = description.substring(0, lastLineStart) + textAfterCursor;
        setDescription(newText);
        setTimeout(() => textarea.setSelectionRange(lastLineStart, lastLineStart), 10);
        return;
      }

      const nextPrefix = `\n${indent}${num + 1}${dot}`;
      const newText = textBeforeCursor + nextPrefix + textAfterCursor;
      setDescription(newText);
      const newCursor = cursor + nextPrefix.length;
      setTimeout(() => textarea.setSelectionRange(newCursor, newCursor), 10);
      return;
    }

    // 4. Quote: >
    const quoteMatch = currentLine.match(/^(\s*>\s+)(.*)/);
    if (quoteMatch) {
      e.preventDefault();
      const prefix = quoteMatch[1];
      const content = quoteMatch[2];

      if (!content.trim()) {
        const newText = description.substring(0, lastLineStart) + textAfterCursor;
        setDescription(newText);
        setTimeout(() => textarea.setSelectionRange(lastLineStart, lastLineStart), 10);
        return;
      }

      const nextPrefix = `\n${prefix}`;
      const newText = textBeforeCursor + nextPrefix + textAfterCursor;
      setDescription(newText);
      const newCursor = cursor + nextPrefix.length;
      setTimeout(() => textarea.setSelectionRange(newCursor, newCursor), 10);
      return;
    }
  };

  // Rich WYSIWYG Formatting Helpers
  const insertFormatting = (prefix: string, suffix: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selection = description.substring(start, end) || "текст";
    const replacement = `${prefix}${selection}${suffix}`;

    const newText =
      description.substring(0, start) + replacement + description.substring(end);
    setDescription(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selection.length
      );
    }, 50);
  };

  // Attachment URL Handlers
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

  // Submit Handler
  const handleSubmit = () => {
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
      const res = await createAssignmentAction({
        groupSubjectId: selectedGroupSubjectId,
        title,
        description,
        dueDate: dueDate || undefined,
        fileUrl: serializedFileUrl,
      });

      if (res.success) {
        toast.add({ title: "Задание успешно создано!", type: "success" });
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
              <ClipboardList className="h-4 w-4 text-primary" /> Создание домашнего задания
            </h1>
            <p className="text-[11px] text-muted-foreground">
              Заполните заголовок, расширенное описание, прикрепите файлы и укажите дедлайн
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/dashboard/assignments?group=${selectedGroupId}`}>
            <Button variant="outline" size="xs" className="h-7 text-xs font-medium">
              Отмена
            </Button>
          </Link>
          <Button
            size="xs"
            disabled={isPending}
            onClick={handleSubmit}
            className="h-8 text-xs gap-1.5 font-medium"
            title="Опубликовать (Ctrl + Enter)"
            data-tour="assignment-new-submit"
          >
            <Send className="h-3.5 w-3.5" />
            {isPending ? "Публикация..." : "Опубликовать задание"}
          </Button>
        </div>
      </div>

      {/* Full-width Grid: Left = Editor Canvas (2 cols), Right = Settings Panel (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Left Column: Title & Main WYSIWYG Editor Canvas */}
        <div className="lg:col-span-2 space-y-3">
          <Card className="border shadow-none p-3 space-y-2.5">
            {/* Assignment Title Field */}
            <div className="space-y-1" data-tour="assignment-new-title">
              <label className="font-medium text-muted-foreground text-[10px] uppercase tracking-wider">
                Название домашнего задания
              </label>
              <Input
                placeholder="Введите заголовок (например: Лабораторная работа №3. Настройка Next.js и Prisma)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-9 text-xs font-semibold bg-background border-primary/20 focus:border-primary shadow-none"
              />
            </div>

            {/* WYSIWYG Visual Editor Controls */}
            <div className="space-y-2" data-tour="assignment-new-editor">
              <div className="bg-muted/40 p-2.5 rounded-lg border space-y-2">
                {/* Top Control Bar: Mode Toggle & Templates Dropdown */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                  <div className="flex items-center gap-1 bg-background p-0.5 rounded-md border text-xs">
                    <button
                      type="button"
                      onClick={() => setMode("EDIT")}
                      className={`px-3 py-1 rounded text-[11px] font-medium transition-all flex items-center gap-1.5 ${mode === "EDIT"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                      <Edit3 className="h-3.5 w-3.5" /> WYSIWYG Редактор
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode("PREVIEW")}
                      className={`px-3 py-1 rounded text-[11px] font-medium transition-all flex items-center gap-1.5 ${mode === "PREVIEW"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                      <Eye className="h-3.5 w-3.5" /> Предпросмотр
                    </button>
                  </div>

                  {/* Clean Templates Selector */}
                  <div className="flex items-center gap-1.5" data-tour="assignment-new-templates">
                    <Select value={selectedTemplateId} onValueChange={handleApplyTemplate}>
                      <SelectTrigger className="h-7 text-[11px] font-medium bg-background shadow-none border-border text-foreground gap-1.5 min-w-[170px]">
                        <LayoutTemplate className="h-3 w-3 text-primary shrink-0" />
                        <span>
                          {PRESET_TEMPLATES.find((t) => t.id === selectedTemplateId)?.name || "Выбрать шаблон"}
                        </span>
                      </SelectTrigger>
                      <SelectContent>
                        {PRESET_TEMPLATES.map((t) => {
                          const IconComponent = t.icon;
                          return (
                            <SelectItem key={t.id} value={t.id} className="text-xs font-medium pl-7">
                              <span className="flex items-center gap-2">
                                <IconComponent className="h-3.5 w-3.5 text-primary shrink-0" />
                                <span>{t.name}</span>
                              </span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Pure Formatting Icons Toolbar */}
                {mode === "EDIT" && (
                  <div className="flex flex-wrap items-center gap-1 pt-0.5">

                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() => insertFormatting("**", "**")}
                      className="h-7 w-7 p-0 shadow-none"
                      title="Жирный (Ctrl+B)"
                    >
                      <Bold className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() => insertFormatting("*", "*")}
                      className="h-7 w-7 p-0 shadow-none"
                      title="Курсив (Ctrl+I)"
                    >
                      <Italic className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() => insertFormatting("~~", "~~")}
                      className="h-7 w-7 p-0 shadow-none"
                      title="Зачёркнутый"
                    >
                      <Strikethrough className="h-3.5 w-3.5" />
                    </Button>
                    <div className="h-4 w-px bg-border mx-0.5" />
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() => insertFormatting("\n# ", "\n")}
                      className="h-7 w-7 p-0 font-semibold text-[10px] shadow-none"
                      title="Заголовок H1"
                    >
                      H1
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() => insertFormatting("\n## ", "\n")}
                      className="h-7 w-7 p-0 font-semibold text-[10px] shadow-none"
                      title="Заголовок H2"
                    >
                      H2
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() => insertFormatting("\n### ", "\n")}
                      className="h-7 w-7 p-0 font-semibold text-[10px] shadow-none"
                      title="Заголовок H3"
                    >
                      H3
                    </Button>
                    <div className="h-4 w-px bg-border mx-0.5" />
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() => insertFormatting("\n- ", "\n- ")}
                      className="h-7 w-7 p-0 shadow-none"
                      title="Маркированный список"
                    >
                      <List className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() => insertFormatting("\n1. ", "\n2. ")}
                      className="h-7 w-7 p-0 shadow-none"
                      title="Нумерованный список"
                    >
                      <ListOrdered className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() => insertFormatting("\n- [ ] ", "\n- [ ] ")}
                      className="h-7 w-7 p-0 shadow-none"
                      title="Чеклист задач"
                    >
                      <CheckSquare className="h-3.5 w-3.5" />
                    </Button>
                    <div className="h-4 w-px bg-border mx-0.5" />
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() => insertFormatting("\n> ", "\n")}
                      className="h-7 w-7 p-0 shadow-none"
                      title="Цитата"
                    >
                      <Quote className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() => insertFormatting("```\n", "\n```")}
                      className="h-7 w-7 p-0 shadow-none"
                      title="Блок кода"
                    >
                      <Code className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() => insertFormatting("\n\n---\n\n", "")}
                      className="h-7 w-7 p-0 shadow-none"
                      title="Разделитель"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() => insertFormatting("[Ссылка](", ")")}
                      className="h-7 w-7 p-0 shadow-none"
                      title="Вставить ссылку"
                    >
                      <Link2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Editor Workspace Canvas */}
              {mode === "EDIT" ? (
                <div className="space-y-1.5">
                  <Textarea
                    ref={textareaRef}
                    placeholder={`Опишите подробные инструкции к выполнению задания...\n\nПример составления:\n## 1. Цель работы\nИзучить основы построения компонентов на Next.js.\n\n## 2. Порядок выполнения\n- [ ] Создать схему базы данных\n- [ ] Написать серверный экшен\n- [ ] Добавить обработку ошибок\n\n> Задание сдать в виде ссылки на GitHub репозиторий.`}
                    value={description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="text-xs bg-background min-h-[280px] font-mono leading-relaxed p-3 border focus:ring-primary shadow-none"
                  />
                  {/* Live Text Stats Bar */}
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
                    <div className="flex items-center gap-3">
                      <span>Символов: <strong className="font-semibold text-foreground">{charCount}</strong></span>
                      <span>Слов: <strong className="font-semibold text-foreground">{wordCount}</strong></span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-primary" /> ~{readingTimeMin} мин на чтение
                      </span>
                    </div>
                    <div className="text-[10px] opacity-70 hidden sm:block">
                      Горячие клавиши: <kbd className="px-1 py-0.5 bg-muted border rounded">{modKey}+B</kbd> Жирный | <kbd className="px-1 py-0.5 bg-muted border rounded">{modKey}+I</kbd> Курсив | <kbd className="px-1 py-0.5 bg-muted border rounded">{enterModKey}+Enter</kbd> Опубликовать
                    </div>
                  </div>
                </div>
              ) : (
                <div className="min-h-[280px] p-4 border rounded-lg bg-card text-xs space-y-2 leading-relaxed">
                  {description ? (
                    renderMarkdown(description, (lineIndex) => {
                      const lines = description.split("\n");
                      const targetLine = lines[lineIndex];
                      if (!targetLine) return;
                      if (targetLine.startsWith("- [ ] ")) {
                        lines[lineIndex] = targetLine.replace("- [ ] ", "- [x] ");
                      } else if (targetLine.startsWith("- [x] ")) {
                        lines[lineIndex] = targetLine.replace("- [x] ", "- [ ] ");
                      }
                      setDescription(lines.join("\n"));
                    })
                  ) : (
                    <div className="text-muted-foreground italic text-center py-12 text-xs">
                      Введите текст задания в редакторе для предпросмотра...
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Settings, Metadata & Attachments Sidebar */}
        <div className="space-y-2.5 sticky top-20 z-10 self-start">
          {/* Metadata Card */}
          <div className="rounded-xl border bg-card p-3 space-y-2 text-xs shadow-xs" data-tour="assignment-new-group-subject">
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
                    <SelectValue>{groups.find((g) => g.id === selectedGroupId)?.name || "Выберите группу"}</SelectValue>
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
                <label className="font-medium text-foreground text-xs">Учебная дисциплина</label>
                <Select value={selectedGroupSubjectId} onValueChange={setSelectedGroupSubjectId}>
                  <SelectTrigger className="h-8 text-xs font-medium bg-background shadow-none">
                    <SelectValue>
                      {availableSubjects.find((s) => s.id === selectedGroupSubjectId)?.subjectName || "Выберите предмет"}
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

              <div className="grid grid-cols-2 gap-2" data-tour="assignment-new-deadline">
                <div className="space-y-1">
                  <label className="font-medium text-foreground text-xs flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-primary" /> Срок сдачи
                  </label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="h-8 text-xs bg-background font-medium shadow-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-foreground text-xs flex items-center gap-1">
                    <Award className="h-3 w-3 text-primary" /> Балл (Max)
                  </label>
                  <Input
                    type="number"
                    value={maxScore}
                    onChange={(e) => setMaxScore(e.target.value)}
                    className="h-8 text-xs bg-background font-medium shadow-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Attachments Card */}
          <Card className="border shadow-none p-3 space-y-2.5" data-tour="assignment-new-attachments">
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
                      <Button type="button" size="xs" variant="ghost" className="h-7 w-7 p-0 shadow-none">
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

          {/* Publishing Actions Card */}
          <div className="flex flex-col gap-1.5">
            <Button
              size="xs"
              disabled={isPending}
              onClick={handleSubmit}
              className="w-full h-8 text-xs gap-1.5 font-medium shadow-none"
            >
              <Send className="h-3.5 w-3.5" />
              {isPending ? "Публикация..." : "Опубликовать задание"}
            </Button>

            <Link href={`/dashboard/assignments?group=${selectedGroupId}`} className="block w-full">
              <Button variant="outline" size="xs" className="w-full h-8 text-xs font-medium shadow-none">
                Отмена и возврат
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
