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
  ListCollapse,
  Upload,
  FolderOpen,
  Loader2,
} from "lucide-react";
import { renderMarkdown } from "@/lib/markdown";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { ImageLibraryDialog, LibraryImageItem } from "@/components/images/image-library-dialog";

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const latestValueRef = useRef(value);
  latestValueRef.current = value;

  const cursorPosRef = useRef<{
    start: number;
    end: number;
    scrollTop: number;
    windowScrollX: number;
    windowScrollY: number;
    snapshotValue: string;
  }>({
    start: 0,
    end: 0,
    scrollTop: 0,
    windowScrollX: 0,
    windowScrollY: 0,
    snapshotValue: value,
  });

  // Image insertion & context menu state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isUrlDialogOpen, setIsUrlDialogOpen] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState("https://");
  const [imageAltInput, setImageAltInput] = useState("Описание изображения");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const captureCursorPosition = () => {
    const textarea = textareaRef.current;
    const currentValue = latestValueRef.current;
    const windowScrollX = typeof window !== "undefined" ? window.scrollX : 0;
    const windowScrollY = typeof window !== "undefined" ? window.scrollY : 0;

    if (textarea) {
      cursorPosRef.current = {
        start: textarea.selectionStart ?? currentValue.length,
        end: textarea.selectionEnd ?? currentValue.length,
        scrollTop: textarea.scrollTop,
        windowScrollX,
        windowScrollY,
        snapshotValue: currentValue,
      };
    } else {
      cursorPosRef.current = {
        start: currentValue.length,
        end: currentValue.length,
        scrollTop: 0,
        windowScrollX,
        windowScrollY,
        snapshotValue: currentValue,
      };
    }
  };

  const insertTextAtSavedCursor = (textToInsert: string) => {
    const currentValue = latestValueRef.current;
    const saved = cursorPosRef.current;

    let start = Math.min(saved.start, currentValue.length);
    let end = Math.min(saved.end, currentValue.length);

    // Adjust saved offsets if the user edited text before the saved cursor during async upload
    if (saved.snapshotValue !== currentValue) {
      const oldText = saved.snapshotValue;
      let commonPrefix = 0;
      const minLen = Math.min(oldText.length, currentValue.length);
      while (commonPrefix < minLen && oldText[commonPrefix] === currentValue[commonPrefix]) {
        commonPrefix++;
      }
      if (commonPrefix < saved.start) {
        const delta = currentValue.length - oldText.length;
        start = Math.max(0, Math.min(currentValue.length, saved.start + delta));
        end = Math.max(start, Math.min(currentValue.length, saved.end + delta));
      }
    }

    const newText = currentValue.substring(0, start) + textToInsert + currentValue.substring(end);
    latestValueRef.current = newText;
    onChange(newText);

    const nextCursor = start + textToInsert.length;
    const targetScrollTop = textareaRef.current ? textareaRef.current.scrollTop : saved.scrollTop;
    const targetWindowX = typeof window !== "undefined" ? window.scrollX : saved.windowScrollX;
    const targetWindowY = typeof window !== "undefined" ? window.scrollY : saved.windowScrollY;

    cursorPosRef.current = {
      start: nextCursor,
      end: nextCursor,
      scrollTop: targetScrollTop,
      windowScrollX: targetWindowX,
      windowScrollY: targetWindowY,
      snapshotValue: newText,
    };

    const restoreFocusAndScroll = () => {
      const el = textareaRef.current;
      if (el) {
        el.focus({ preventScroll: true });
        el.setSelectionRange(nextCursor, nextCursor);
        el.scrollTop = targetScrollTop;
      }
      if (typeof window !== "undefined") {
        window.scrollTo({ left: targetWindowX, top: targetWindowY, behavior: "instant" as ScrollBehavior });
      }
    };

    requestAnimationFrame(() => {
      restoreFocusAndScroll();
      requestAnimationFrame(restoreFocusAndScroll);
    });
  };

  const handleUploadAndInsertImage = async (file: File) => {
    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", "material");
      formData.append("visibility", "PUBLIC");

      const res = await fetch("/api/images", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.image) {
        toast.add({ title: data.error || "Ошибка загрузки изображения", type: "error" });
        return;
      }

      const img: LibraryImageItem = data.image;
      const alt = (img.title || "Описание изображения").replace(/[\[\]]/g, "");
      insertTextAtSavedCursor(`![${alt}](${img.url})`);
      toast.add({ title: "Изображение загружено и вставлено", type: "success" });
    } catch {
      toast.add({ title: "Ошибка сети при загрузке изображения", type: "error" });
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Close context menu on outside click, Escape, or scroll
  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setContextMenu(null);
    };
    window.addEventListener("click", close);
    window.addEventListener("scroll", close, true);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("keydown", onKey);
    };
  }, [contextMenu]);

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
            onClick={() =>
              insertFormatting(
                "\n<details>\n<summary>Заголовок спойлера / этапа</summary>\n\n",
                "\n\n</details>\n",
                "Содержимое скрытого блока (текст, код, подсказки)..."
              )
            }
            className="h-7 w-7 p-0"
            title="Сворачиваемый блок (спойлер / этап)"
          >
            <ListCollapse className="h-3.5 w-3.5" />
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

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onMouseDown={captureCursorPosition}
                  className="h-7 w-7 p-0"
                  title="Вставить изображение (или ПКМ в редакторе)"
                  disabled={isUploadingImage}
                />
              }
            >
              {isUploadingImage ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              ) : (
                <ImageIcon className="h-3.5 w-3.5" />
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-60 text-xs p-1">
              <DropdownMenuItem
                onClick={() => fileInputRef.current?.click()}
                className="text-xs gap-2 py-1.5 cursor-pointer font-medium"
              >
                <Upload className="h-3.5 w-3.5 text-primary" />
                <span>Загрузить и вставить изображение</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setIsLibraryOpen(true)}
                className="text-xs gap-2 py-1.5 cursor-pointer font-medium"
              >
                <FolderOpen className="h-3.5 w-3.5 text-primary" />
                <span>Вставить из загруженных</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setImageUrlInput("https://");
                  setImageAltInput("Описание изображения");
                  setIsUrlDialogOpen(true);
                }}
                className="text-xs gap-2 py-1.5 cursor-pointer font-medium"
              >
                <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Вставить по ссылке</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

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
              onMouseDown={(e) => {
                if (e.button === 2) {
                  captureCursorPosition();
                }
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                captureCursorPosition();
                const menuW = 248;
                const menuH = 124;
                const x = Math.min(e.clientX, window.innerWidth - menuW - 8);
                const y = Math.min(e.clientY, window.innerHeight - menuH - 8);
                setContextMenu({ x: Math.max(8, x), y: Math.max(8, y) });
              }}
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
              {modKey}+B Жирный | {modKey}+I Курсив | {modKey}+K Ссылка | ПКМ Изображение
            </div>
          </div>
        </div>
      )}

      {/* Hidden File Input for Direct Image Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUploadAndInsertImage(file);
        }}
      />

      {/* Right-Click Context Menu inside Markdown Editor */}
      {contextMenu && (
        <div
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
          className="fixed z-50 w-60 rounded-lg border border-border bg-popover p-1 text-xs text-popover-foreground"
        >
          <button
            type="button"
            onClick={() => {
              setContextMenu(null);
              fileInputRef.current?.click();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-muted text-left font-medium transition-colors cursor-pointer"
          >
            <Upload className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>Загрузить и вставить изображение</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setContextMenu(null);
              setIsLibraryOpen(true);
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-muted text-left font-medium transition-colors cursor-pointer"
          >
            <FolderOpen className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>Вставить из загруженных</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setContextMenu(null);
              setImageUrlInput("https://");
              setImageAltInput("Описание изображения");
              setIsUrlDialogOpen(true);
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-muted text-left font-medium transition-colors cursor-pointer"
          >
            <Link2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span>Вставить по ссылке</span>
          </button>
        </div>
      )}

      {/* Image Library Dialog */}
      <ImageLibraryDialog
        open={isLibraryOpen}
        onOpenChange={setIsLibraryOpen}
        category="material"
        visibility="PUBLIC"
        onSelect={(img) => {
          const alt = (img.title || "Описание изображения").replace(/[\[\]]/g, "");
          insertTextAtSavedCursor(`![${alt}](${img.url})`);
        }}
      />

      {/* Insert Image by URL Dialog */}
      <Dialog open={isUrlDialogOpen} onOpenChange={setIsUrlDialogOpen}>
        <DialogContent className="p-4 gap-3 text-xs sm:max-w-[420px] border border-border">
          <DialogHeader className="p-0 pb-2 border-b border-border gap-1 text-left">
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-primary" />
              <span>Вставить изображение по ссылке</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1">
              <label className="font-medium text-foreground text-xs">URL изображения *</label>
              <Input
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                placeholder="https://example.com/image.webp"
                className="h-8 text-xs bg-background"
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-foreground text-xs">Описание (alt)</label>
              <Input
                value={imageAltInput}
                onChange={(e) => setImageAltInput(e.target.value)}
                placeholder="Описание изображения"
                className="h-8 text-xs bg-background"
              />
            </div>
          </div>
          <DialogFooter className="p-0 pt-2 border-t border-border flex flex-row justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => setIsUrlDialogOpen(false)}
              className="h-7 px-2.5 text-xs"
            >
              Отмена
            </Button>
            <Button
              type="button"
              size="xs"
              disabled={!imageUrlInput.trim() || imageUrlInput.trim() === "https://"}
              onClick={() => {
                const url = imageUrlInput.trim();
                const alt = (imageAltInput.trim() || "Описание изображения").replace(/[\[\]]/g, "");
                insertTextAtSavedCursor(`![${alt}](${url})`);
                setIsUrlDialogOpen(false);
              }}
              className="h-7 px-3 text-xs font-medium cursor-pointer"
            >
              Вставить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
