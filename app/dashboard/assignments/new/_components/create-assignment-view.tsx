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
} from "lucide-react";
import { createAssignmentAction } from "../../actions";
import { renderMarkdown } from "@/lib/markdown";

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

interface AttachmentLink {
  title: string;
  url: string;
}

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

  const [attachmentLinks, setAttachmentLinks] = useState<AttachmentLink[]>([
    { title: "", url: "" },
  ]);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Group change handler
  const handleGroupChange = (gId: string) => {
    setSelectedGroupId(gId);
    const sub = groupSubjects.filter((gs) => gs.groupId === gId);
    setSelectedGroupSubjectId(sub[0]?.id || "");
  };

  // Smart Enter Key Handler for Lists & Checklists
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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

  // Attachment Link Handlers
  const handleAddAttachmentLink = () => {
    setAttachmentLinks((prev) => [...prev, { title: "", url: "" }]);
  };

  const handleRemoveAttachmentLink = (index: number) => {
    setAttachmentLinks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateAttachmentLink = (
    index: number,
    field: "title" | "url",
    value: string
  ) => {
    setAttachmentLinks((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Submit Handler
  const handleSubmit = () => {
    if (!title.trim()) {
      setErrorMsg("Укажите заголовок задания");
      return;
    }
    if (!description.trim()) {
      setErrorMsg("Укажите описание и требования к заданию");
      return;
    }
    if (!selectedGroupSubjectId) {
      setErrorMsg("Выберите учебную дисциплину");
      return;
    }

    const validLinks = attachmentLinks.filter((l) => l.url.trim().length > 0);
    const serializedFileUrl = validLinks.length > 0 ? JSON.stringify(validLinks) : undefined;

    setErrorMsg(null);
    startTransition(async () => {
      const res = await createAssignmentAction({
        groupSubjectId: selectedGroupSubjectId,
        title,
        description,
        dueDate: dueDate || undefined,
        fileUrl: serializedFileUrl,
      });

      if (res.success) {
        router.push(`/dashboard/assignments?group=${selectedGroupId}`);
        router.refresh();
      } else {
        setErrorMsg(res.error || "Ошибка сохранения задания");
      }
    });
  };

  return (
    <div className="w-full space-y-4 pb-12 text-xs">
      {/* Navigation Topbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-4 rounded-xl border">
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/assignments?group=${selectedGroupId}`}
            className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-muted"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" /> Кабинет публикации задания
            </h1>
            <p className="text-xs text-muted-foreground">
              Профессиональная студия составления домашних заданий с WYSIWYG-редактором
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/dashboard/assignments?group=${selectedGroupId}`}>
            <Button variant="outline" size="xs" className="h-8 text-xs font-medium">
              Отмена
            </Button>
          </Link>
          <Button
            size="xs"
            disabled={isPending}
            onClick={handleSubmit}
            className="h-8 text-xs gap-1.5 font-medium"
          >
            <Send className="h-3.5 w-3.5" />
            {isPending ? "Публикация..." : "Опубликовать задание"}
          </Button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Full-width Grid: Left = Editor Canvas (2 cols), Right = Settings Panel (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Title & Main WYSIWYG Editor Canvas */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border shadow-none p-4 space-y-3">
            {/* Assignment Title Field */}
            <div className="space-y-1">
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
            <div className="space-y-2 pt-2">
              <div className="flex flex-wrap items-center justify-between gap-2 bg-muted/40 p-2 rounded-lg border">
                {/* Editor / Preview Mode Pills */}
                <div className="flex items-center gap-1 bg-background p-0.5 rounded-md border text-xs">
                  <button
                    type="button"
                    onClick={() => setMode("EDIT")}
                    className={`px-3 py-1 rounded text-[11px] font-medium transition-all flex items-center gap-1.5 ${
                      mode === "EDIT"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Edit3 className="h-3.5 w-3.5" /> WYSIWYG Редактор
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("PREVIEW")}
                    className={`px-3 py-1 rounded text-[11px] font-medium transition-all flex items-center gap-1.5 ${
                      mode === "PREVIEW"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Eye className="h-3.5 w-3.5" /> Предпросмотр
                  </button>
                </div>

                {/* Rich Formatting Toolbar */}
                {mode === "EDIT" && (
                  <div className="flex flex-wrap items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() => insertFormatting("**", "**")}
                      className="h-7 w-7 p-0 shadow-none"
                      title="Жирный шрифт (**текст**)"
                    >
                      <Bold className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() => insertFormatting("*", "*")}
                      className="h-7 w-7 p-0 shadow-none"
                      title="Курсив (*текст*)"
                    >
                      <Italic className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() => insertFormatting("~~", "~~")}
                      className="h-7 w-7 p-0 shadow-none"
                      title="Зачёркнутый текст (~~текст~~)"
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
                      title="Цитата / Выделенный блок"
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
                <Textarea
                  ref={textareaRef}
                  placeholder={`Опишите подробные инструкции к выполнению задания...\n\nПример составления:\n## 1. Цель работы\nИзучить основы построения компонентов на Next.js.\n\n## 2. Порядок выполнения\n- [ ] Создать схему базы данных\n- [ ] Написать серверный экшен\n- [ ] Добавить обработку ошибок\n\n> Задание сдать в виде ссылки на GitHub репозиторий.`}
                  value={description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="text-xs bg-background min-h-[380px] font-mono leading-relaxed p-4 border focus:ring-primary shadow-none"
                />
              ) : (
                <div className="min-h-[380px] p-5 border rounded-lg bg-card text-xs space-y-3 leading-relaxed">
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
        <div className="space-y-4">
          {/* Metadata Card */}
          <Card className="border shadow-none p-4 space-y-3">
            <CardHeader className="p-0 pb-2 border-b">
              <CardTitle className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-primary" /> Параметры публикации
              </CardTitle>
            </CardHeader>

            <div className="space-y-3 text-xs">
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

              <div className="grid grid-cols-2 gap-2">
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
          </Card>

          {/* Attachments Card */}
          <Card className="border shadow-none p-4 space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <CardTitle className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Paperclip className="h-4 w-4 text-primary" /> Материалы & Ссылки
              </CardTitle>
              <Button
                type="button"
                size="xs"
                variant="outline"
                onClick={handleAddAttachmentLink}
                className="h-6 px-2 text-[10px] gap-1 text-primary border-primary/30 hover:bg-primary/10 shadow-none font-medium"
              >
                <PlusCircle className="h-3 w-3" /> Ссылка
              </Button>
            </div>

            <div className="space-y-2">
              {attachmentLinks.map((link, idx) => (
                <div key={idx} className="p-2 border rounded-lg bg-muted/20 space-y-1.5">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-medium text-muted-foreground">Ресурс #{idx + 1}</span>
                    {attachmentLinks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachmentLink(idx)}
                        className="text-destructive hover:text-destructive/80 p-0.5"
                        title="Удалить ссылку"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  <Input
                    placeholder="Название (например: Файл PDF)"
                    value={link.title}
                    onChange={(e) => handleUpdateAttachmentLink(idx, "title", e.target.value)}
                    className="h-7 text-xs bg-background shadow-none"
                  />
                  <Input
                    placeholder="https://..."
                    value={link.url}
                    onChange={(e) => handleUpdateAttachmentLink(idx, "url", e.target.value)}
                    className="h-7 text-xs bg-background font-mono text-[11px] shadow-none"
                  />
                </div>
              ))}
            </div>
          </Card>

          {/* Publishing Actions Card */}
          <Card className="border shadow-none p-4 space-y-2">
            <Button
              size="xs"
              disabled={isPending}
              onClick={handleSubmit}
              className="w-full h-9 text-xs gap-2 font-medium shadow-none"
            >
              <Send className="h-4 w-4" />
              {isPending ? "Публикация..." : "Опубликовать задание"}
            </Button>

            <Link href={`/dashboard/assignments?group=${selectedGroupId}`} className="block w-full">
              <Button variant="outline" size="xs" className="w-full h-8 text-xs font-medium shadow-none">
                Отмена и возврат
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
