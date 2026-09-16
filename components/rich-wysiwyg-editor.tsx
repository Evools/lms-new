"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  FileCode,
  Minus,
  Link2,
  Image as ImageIcon,
  Table as TableIcon,
  Eye,
  Edit3,
  Sparkles,
  Clock,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  ChevronDown,
} from "lucide-react";
import { renderMarkdown } from "@/lib/markdown";

export interface WysiwygTemplate {
  id: string;
  name: string;
  content: string;
}

interface RichWysiwygEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  label?: string;
  templates?: WysiwygTemplate[];
  showStats?: boolean;
  onSubmit?: () => void;
}

type EditorMode = "EDIT" | "PREVIEW";

export function RichWysiwygEditor({
  value,
  onChange,
  placeholder = "Введите содержание конспекта или занятия...",
  minHeight = "320px",
  label,
  templates,
  showStats = true,
  onSubmit,
}: RichWysiwygEditorProps) {
  const [mode, setMode] = useState<EditorMode>("EDIT");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [modKey, setModKey] = useState("Ctrl");
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      setModKey(isMac ? "⌘" : "Ctrl");
    }
  }, []);

  // Handle ESC to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  const insertFormatting = (before: string, after: string = "", defaultText: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) {
      onChange(value + before + defaultText + after);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end) || defaultText;
    const replacement = before + selectedText + after;

    const newText = value.substring(0, start) + replacement + value.substring(end);
    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      );
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isMod = e.metaKey || e.ctrlKey;

    // Bold: ⌘+B
    if (isMod && e.key.toLowerCase() === "b") {
      e.preventDefault();
      insertFormatting("**", "**", "жирный текст");
      return;
    }

    // Italic: ⌘+I
    if (isMod && e.key.toLowerCase() === "i") {
      e.preventDefault();
      insertFormatting("*", "*", "курсив");
      return;
    }

    // Link: ⌘+K
    if (isMod && e.key.toLowerCase() === "k") {
      e.preventDefault();
      insertFormatting("[Текст ссылки](", ")", "https://");
      return;
    }

    // Submit: ⌘+Enter
    if (isMod && e.key === "Enter" && onSubmit) {
      e.preventDefault();
      onSubmit();
      return;
    }

    // Tab indentation
    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      if (e.shiftKey) {
        // Shift+Tab: Unindent
        const lines = value.substring(0, start).split("\n");
        const currentLine = lines[lines.length - 1];
        if (currentLine.startsWith("  ")) {
          const lineStart = start - currentLine.length;
          const newText = value.substring(0, lineStart) + currentLine.substring(2) + value.substring(start);
          onChange(newText);
          setTimeout(() => {
            textarea.setSelectionRange(Math.max(0, start - 2), Math.max(0, end - 2));
          }, 0);
        }
      } else {
        // Tab: Indent 2 spaces
        const newText = value.substring(0, start) + "  " + value.substring(end);
        onChange(newText);
        setTimeout(() => {
          textarea.setSelectionRange(start + 2, start + 2);
        }, 0);
      }
    }
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Stats calculation
  const charCount = value.length;
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const lineCount = value ? value.split("\n").length : 0;
  const readingTimeMin = Math.max(1, Math.ceil(wordCount / 180));

  const insertTable = () => {
    const tableTemplate =
      "\n| Заголовок 1 | Заголовок 2 | Заголовок 3 |\n| :--- | :--- | :--- |\n| Данные 1 | Данные 2 | Данные 3 |\n| Данные 4 | Данные 5 | Данные 6 |\n";
    insertFormatting(tableTemplate, "");
  };

  return (
    <div
      className={`space-y-2 w-full transition-all ${
        isFullscreen
          ? "fixed inset-0 z-50 bg-background p-6 flex flex-col justify-between overflow-hidden shadow-2xl"
          : ""
      }`}
    >
      {/* Editor Header & Top Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
        <div className="flex items-center gap-2">
          {label ? (
            <label className="font-semibold text-foreground text-xs">{label}</label>
          ) : (
            <span className="font-semibold text-foreground text-xs">Редактор конспекта</span>
          )}

          {isFullscreen && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
              Полноэкранный режим (ESC для выхода)
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Preset Templates Dropdown Menu */}
          {templates && templates.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger
                className="h-7 text-xs gap-1.5 font-medium border border-primary/30 text-primary hover:bg-primary/10 rounded-md px-2.5 inline-flex items-center justify-center cursor-pointer transition-colors"
                title="Выбрать готовый шаблон"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Шаблоны</span>
                <ChevronDown className="h-3 w-3 opacity-60" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="text-xs w-52">
                {templates.map((tpl) => (
                  <DropdownMenuItem
                    key={tpl.id}
                    onClick={() => onChange(tpl.content)}
                    className="cursor-pointer text-xs py-1.5 font-medium"
                  >
                    {tpl.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Mode Switcher Tabs (2 tabs: Редактор / Предпросмотр) */}
          <div className="grid grid-cols-2 gap-0.5 p-0.5 bg-muted/60 rounded-lg border text-xs font-medium">
            <button
              type="button"
              onClick={() => setMode("EDIT")}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 text-[11px] ${
                mode === "EDIT"
                  ? "bg-background text-primary shadow-2xs font-medium"
                  : "text-muted-foreground hover:text-foreground font-medium"
              }`}
              title="Редактирование текста"
            >
              <Edit3 className="h-3 w-3" /> Редактор
            </button>

            <button
              type="button"
              onClick={() => setMode("PREVIEW")}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 text-[11px] ${
                mode === "PREVIEW"
                  ? "bg-background text-primary shadow-2xs font-medium"
                  : "text-muted-foreground hover:text-foreground font-medium"
              }`}
              title="Предпросмотр форматирования"
            >
              <Eye className="h-3 w-3" /> Предпросмотр
            </button>
          </div>

          {/* Fullscreen Button */}
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            title={isFullscreen ? "Выйти из полноэкранного режима" : "Во весь экран"}
          >
            {isFullscreen ? (
              <Minimize2 className="h-3.5 w-3.5 text-primary" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>

      {/* Formatting Toolbar (Only in EDIT mode) */}
      {mode === "EDIT" && (
        <div className="flex flex-wrap items-center gap-1 p-1 bg-muted/40 rounded-lg border text-xs">
          {/* Text Styling */}
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => insertFormatting("**", "**", "жирный текст")}
            className="h-7 w-7 p-0"
            title={`Жирный (${modKey}+B)`}
          >
            <Bold className="h-3.5 w-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => insertFormatting("*", "*", "курсив")}
            className="h-7 w-7 p-0"
            title={`Курсив (${modKey}+I)`}
          >
            <Italic className="h-3.5 w-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => insertFormatting("~~", "~~", "зачёркнутый текст")}
            className="h-7 w-7 p-0"
            title="Зачёркнутый"
          >
            <Strikethrough className="h-3.5 w-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => insertFormatting("`", "`", "код")}
            className="h-7 w-7 p-0"
            title="Инлайн-код"
          >
            <Code className="h-3.5 w-3.5" />
          </Button>

          <div className="h-4 w-px bg-border mx-0.5" />

          {/* Headings */}
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => insertFormatting("\n# ", "\n", "Заголовок 1")}
            className="h-7 w-7 p-0"
            title="Заголовок H1"
          >
            <Heading1 className="h-3.5 w-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => insertFormatting("\n## ", "\n", "Заголовок раздела")}
            className="h-7 w-7 p-0"
            title="Заголовок H2"
          >
            <Heading2 className="h-3.5 w-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => insertFormatting("\n### ", "\n", "Подраздел")}
            className="h-7 w-7 p-0"
            title="Заголовок H3"
          >
            <Heading3 className="h-3.5 w-3.5" />
          </Button>

          <div className="h-4 w-px bg-border mx-0.5" />

          {/* Lists */}
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => insertFormatting("\n- ", "", "Пункт списка")}
            className="h-7 w-7 p-0"
            title="Маркированный список"
          >
            <List className="h-3.5 w-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => insertFormatting("\n1. ", "", "Пункт списка")}
            className="h-7 w-7 p-0"
            title="Нумерованный список"
          >
            <ListOrdered className="h-3.5 w-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => insertFormatting("\n- [ ] ", "", "Задача к выполнению")}
            className="h-7 w-7 p-0"
            title="Чек-лист задач"
          >
            <CheckSquare className="h-3.5 w-3.5" />
          </Button>

          <div className="h-4 w-px bg-border mx-0.5" />

          {/* Blocks */}
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => insertFormatting("\n> ", "\n", "Цитата или важная мысль")}
            className="h-7 w-7 p-0"
            title="Цитата"
          >
            <Quote className="h-3.5 w-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => insertFormatting("\n```javascript\n", "\n```\n", "// Пример кода\nconsole.log('Hello World');")}
            className="h-7 w-7 p-0"
            title="Блок кода с подсветкой синтаксиса"
          >
            <FileCode className="h-3.5 w-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={insertTable}
            className="h-7 w-7 p-0"
            title="Вставить таблицу"
          >
            <TableIcon className="h-3.5 w-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => insertFormatting("[Текст ссылки](", ")", "https://")}
            className="h-7 w-7 p-0"
            title={`Ссылка (${modKey}+K)`}
          >
            <Link2 className="h-3.5 w-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => insertFormatting("![Описание изображения](", ")", "https://")}
            className="h-7 w-7 p-0"
            title="Изображение"
          >
            <ImageIcon className="h-3.5 w-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => insertFormatting("\n\n---\n\n", "")}
            className="h-7 w-7 p-0"
            title="Разделительная линия"
          >
            <Minus className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Editor & Preview Display Canvas */}
      <div className={`w-full ${isFullscreen ? "flex-1 overflow-hidden min-h-0" : ""}`}>
        {/* MODE 1: EDIT */}
        {mode === "EDIT" && (
          <div className="space-y-1.5 h-full flex flex-col">
            <Textarea
              ref={textareaRef}
              placeholder={placeholder}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{ minHeight: isFullscreen ? "100%" : minHeight }}
              className={`text-xs bg-background font-mono leading-relaxed p-3.5 border focus:ring-primary shadow-none rounded-lg ${
                isFullscreen ? "flex-1 resize-none h-full" : ""
              }`}
            />
          </div>
        )}

        {/* MODE 2: PREVIEW */}
        {mode === "PREVIEW" && (
          <div
            style={{ minHeight: isFullscreen ? "100%" : minHeight }}
            className={`p-4 rounded-lg border bg-card text-xs space-y-3 leading-relaxed overflow-y-auto ${
              isFullscreen ? "h-full" : ""
            }`}
          >
            {value ? (
              renderMarkdown(value, (lineIndex) => {
                const lines = value.split("\n");
                const targetLine = lines[lineIndex];
                if (!targetLine) return;
                if (targetLine.startsWith("- [ ] ")) {
                  lines[lineIndex] = targetLine.replace("- [ ] ", "- [x] ");
                } else if (targetLine.startsWith("- [x] ")) {
                  lines[lineIndex] = targetLine.replace("- [x] ", "- [ ] ");
                }
                onChange(lines.join("\n"));
              })
            ) : (
              <div className="text-muted-foreground italic text-center py-12 text-xs">
                Текст пока не заполнен. Переключитесь в режим «Редактор» для ввода.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Stats & Utility Actions */}
      {showStats && (
        <div className="flex flex-wrap items-center justify-between text-[11px] text-muted-foreground px-1 pt-1">
          <div className="flex items-center gap-3">
            <span>
              Символов: <strong className="font-semibold text-foreground">{charCount}</strong>
            </span>
            <span>
              Слов: <strong className="font-semibold text-foreground">{wordCount}</strong>
            </span>
            <span>
              Строк: <strong className="font-semibold text-foreground">{lineCount}</strong>
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-primary" /> ~{readingTimeMin} мин на чтение
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyMarkdown}
              className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 font-medium transition-colors"
              title="Скопировать исходный текст"
            >
              {copied ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
              <span>{copied ? "Скопировано!" : "Скопировать"}</span>
            </button>

            <span className="text-border">|</span>

            <div className="text-[10px] opacity-70 hidden sm:block font-mono">
              {modKey}+B Жирный | {modKey}+I Курсив | {modKey}+K Ссылка | Tab Отступ
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
