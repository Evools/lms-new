"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Bold,
  Italic,
  Heading,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Minus,
  Link2,
  Eye,
  Edit3,
  Sparkles,
  Clock,
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

export function RichWysiwygEditor({
  value,
  onChange,
  placeholder = "Введите содержание...",
  minHeight = "320px",
  label,
  templates,
  showStats = true,
  onSubmit,
}: RichWysiwygEditorProps) {
  const [mode, setMode] = useState<"EDIT" | "PREVIEW">("EDIT");
  const [modKey, setModKey] = useState("Ctrl");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      setModKey(isMac ? "⌘" : "Ctrl");
    }
  }, []);

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
    if (isMod && e.key.toLowerCase() === "b") {
      e.preventDefault();
      insertFormatting("**", "**");
    } else if (isMod && e.key.toLowerCase() === "i") {
      e.preventDefault();
      insertFormatting("*", "*");
    } else if (isMod && e.key === "Enter" && onSubmit) {
      e.preventDefault();
      onSubmit();
    }
  };

  // Stats calculation
  const charCount = value.length;
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const readingTimeMin = Math.max(1, Math.ceil(wordCount / 180));

  return (
    <div className="space-y-2 w-full">
      {/* Editor Header & Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
        {label ? (
          <label className="font-semibold text-foreground text-xs">{label}</label>
        ) : (
          <div />
        )}

        <div className="flex flex-wrap items-center gap-2">
          {/* Preset Templates Dropdown / Buttons */}
          {templates && templates.length > 0 && (
            <div className="flex items-center gap-1 text-[11px] mr-2">
              <span className="text-muted-foreground hidden sm:inline-flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-primary" /> Шаблоны:
              </span>
              {templates.map((tpl) => (
                <Button
                  key={tpl.id}
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={() => onChange(tpl.content)}
                  className="h-6 text-[10px] px-2 text-primary border-primary/30 hover:bg-primary/10 font-medium"
                >
                  {tpl.name}
                </Button>
              ))}
            </div>
          )}

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1 p-0.5 bg-muted/60 rounded-lg border text-xs font-medium">
            <button
              type="button"
              onClick={() => setMode("EDIT")}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                mode === "EDIT"
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground font-medium"
              }`}
            >
              <Edit3 className="h-3.5 w-3.5" /> Редактор
            </button>

            <button
              type="button"
              onClick={() => setMode("PREVIEW")}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                mode === "PREVIEW"
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground font-medium"
              }`}
            >
              <Eye className="h-3.5 w-3.5" /> Предпросмотр
            </button>
          </div>
        </div>
      </div>

      {/* Formatting Toolbar (Only in EDIT mode) */}
      {mode === "EDIT" && (
        <div className="flex flex-wrap items-center gap-1 p-1 bg-muted/50 rounded-lg border text-xs">
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

          <div className="h-4 w-px bg-border mx-0.5" />

          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => insertFormatting("\n## ", "\n", "Заголовок раздела")}
            className="h-7 w-7 p-0"
            title="Заголовок H2"
          >
            <Heading className="h-3.5 w-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => insertFormatting("\n- ", "", "Элемент списка")}
            className="h-7 w-7 p-0"
            title="Маркированный список"
          >
            <List className="h-3.5 w-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => insertFormatting("\n1. ", "", "Элемент списка")}
            className="h-7 w-7 p-0"
            title="Нумерованный список"
          >
            <ListOrdered className="h-3.5 w-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => insertFormatting("\n- [ ] ", "", "Задача / Цель")}
            className="h-7 w-7 p-0"
            title="Чеклист задач"
          >
            <CheckSquare className="h-3.5 w-3.5" />
          </Button>

          <div className="h-4 w-px bg-border mx-0.5" />

          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => insertFormatting("\n> ", "\n", "Выделенный текст")}
            className="h-7 w-7 p-0"
            title="Цитата / Важная заметка"
          >
            <Quote className="h-3.5 w-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => insertFormatting("\n```javascript\n", "\n```\n", "// Ваш код")}
            className="h-7 w-7 p-0"
            title="Блок кода"
          >
            <Code className="h-3.5 w-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => insertFormatting("\n\n---\n\n", "")}
            className="h-7 w-7 p-0"
            title="Разделитель"
          >
            <Minus className="h-3.5 w-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => insertFormatting("[Заголовок](", ")")}
            className="h-7 w-7 p-0"
            title="Вставить ссылку"
          >
            <Link2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Editor & Preview Display Canvas */}
      {mode === "EDIT" ? (
        <div className="space-y-1.5">
          <Textarea
            ref={textareaRef}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{ minHeight }}
            className="text-xs bg-background font-mono leading-relaxed p-3.5 border focus:ring-primary shadow-none rounded-lg"
          />

          {showStats && (
            <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
              <div className="flex items-center gap-3">
                <span>
                  Символов: <strong className="font-semibold text-foreground">{charCount}</strong>
                </span>
                <span>
                  Слов: <strong className="font-semibold text-foreground">{wordCount}</strong>
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-primary" /> ~{readingTimeMin} мин на чтение
                </span>
              </div>
              <div className="text-[10px] opacity-70 hidden sm:block font-mono">
                {modKey}+B Жирный | {modKey}+I Курсив
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Live Rendered Markdown Preview */
        <div
          style={{ minHeight }}
          className="p-4 rounded-lg border bg-card text-xs space-y-3 leading-relaxed"
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
              Текст пока не заполнен. Введите содержание в режиме редактора.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
