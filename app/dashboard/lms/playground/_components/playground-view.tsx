"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { emmetHTML, emmetCSS } from "emmet-monaco-es";
import { PLAYGROUND_TEMPLATES, PlaygroundTemplate } from "../_lib/templates";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Code,
  Play,
  RotateCcw,
  Download,
  Copy,
  Maximize2,
  Minimize2,
  Terminal,
  Trash2,
  Check,
  Sparkles,
  FileCode,
  FileSpreadsheet,
  FileText,
  ChevronDown,
  ChevronUp,
  Eye,
  Palette,
  Loader2,
  Columns2,
} from "lucide-react";

// Dynamically import Monaco Editor to avoid SSR hydration issues
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center h-full text-xs text-muted-foreground gap-2 py-16">
      <Loader2 className="h-5 w-5 animate-spin text-primary" />
      <span>Инициализация VS Code Monaco...</span>
    </div>
  ),
});

interface ConsoleLogItem {
  id: string;
  type: "log" | "warn" | "error" | "info";
  message: string;
  timestamp: string;
}

// Available developer syntax color schemes for Monaco
const MONACO_THEMES = [
  { id: "vs-dark", label: "VS Code Dark", bg: "#1e1e1e" },
  { id: "dracula", label: "Dracula", bg: "#282a36" },
  { id: "one-dark", label: "One Dark", bg: "#21252b" },
  { id: "night-owl", label: "Night Owl", bg: "#011627" },
  { id: "vs", label: "VS Code Light", bg: "#ffffff" },
  { id: "hc-black", label: "High Contrast", bg: "#000000" },
];

// Web development quick color palette
const WEB_COLOR_PALETTE = [
  { name: "Emerald", hex: "#10b981", desc: "Основной акцент" },
  { name: "Teal", hex: "#14b8a6", desc: "Морской циан" },
  { name: "Sky", hex: "#0284c7", desc: "Небесный синий" },
  { name: "Indigo", hex: "#6366f1", desc: "Индиго" },
  { name: "Violet", hex: "#8b5cf6", desc: "Фиолетовый" },
  { name: "Rose", hex: "#f43f5e", desc: "Розовый" },
  { name: "Amber", hex: "#f59e0b", desc: "Янтарный" },
  { name: "Dark 900", hex: "#09090b", desc: "Фон Dark" },
  { name: "Card 800", hex: "#18181b", desc: "Карточка Dark" },
  { name: "Border 700", hex: "#27272a", desc: "Граница Dark" },
  { name: "Text Muted", hex: "#a1a1aa", desc: "Вторичный текст" },
  { name: "White", hex: "#ffffff", desc: "Белый" },
];

export function PlaygroundView() {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("counter");
  const [activeTab, setActiveTab] = useState<"html" | "css" | "js">("html");

  const [htmlCode, setHtmlCode] = useState<string>("");
  const [cssCode, setCssCode] = useState<string>("");
  const [jsCode, setJsCode] = useState<string>("");

  const [selectedThemeId, setSelectedThemeId] = useState<string>("vs-dark");
  const [autoRun, setAutoRun] = useState<boolean>(true);
  const [logs, setLogs] = useState<ConsoleLogItem[]>([]);
  const [isConsoleOpen, setIsConsoleOpen] = useState<boolean>(false);
  const [consoleHeight, setConsoleHeight] = useState<number>(200);

  // Layout View Modes: Split 50/50 | Only Editor | Only Preview
  const [viewMode, setViewMode] = useState<"split" | "editor" | "preview">("split");
  const [isWorkspaceFullscreen, setIsWorkspaceFullscreen] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const [showTemplateSelector, setShowTemplateSelector] = useState<boolean>(false);
  const [showThemeSelector, setShowThemeSelector] = useState<boolean>(false);
  const [showColorPalette, setShowColorPalette] = useState<boolean>(false);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isDraggingConsoleRef = useRef<boolean>(false);
  const startDragYRef = useRef<number>(0);
  const startHeightRef = useRef<number>(200);

  // Initialize from template or localStorage
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("lms_web_playground_monaco_theme_v1");
      if (savedTheme && MONACO_THEMES.some((t) => t.id === savedTheme)) {
        setSelectedThemeId(savedTheme);
      }

      const saved = localStorage.getItem("lms_web_playground_code_v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.html !== undefined && parsed.css !== undefined && parsed.js !== undefined) {
          setHtmlCode(parsed.html);
          setCssCode(parsed.css);
          setJsCode(parsed.js);
          if (parsed.templateId) setSelectedTemplateId(parsed.templateId);
          return;
        }
      }
    } catch {
      // ignore
    }

    const defaultTpl = PLAYGROUND_TEMPLATES.find((t) => t.id === "counter") || PLAYGROUND_TEMPLATES[0];
    setHtmlCode(defaultTpl.html);
    setCssCode(defaultTpl.css);
    setJsCode(defaultTpl.js);
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    if (!htmlCode && !cssCode && !jsCode) return;
    try {
      localStorage.setItem(
        "lms_web_playground_code_v1",
        JSON.stringify({
          templateId: selectedTemplateId,
          html: htmlCode,
          css: cssCode,
          js: jsCode,
        })
      );
    } catch {
      // ignore storage quota error
    }
  }, [htmlCode, cssCode, jsCode, selectedTemplateId]);

  // Escape key exits fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isWorkspaceFullscreen) {
        setIsWorkspaceFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isWorkspaceFullscreen]);

  const changeTheme = (themeId: string) => {
    setSelectedThemeId(themeId);
    setShowThemeSelector(false);
    try {
      localStorage.setItem("lms_web_playground_monaco_theme_v1", themeId);
    } catch {
      // ignore
    }
  };

  // Configure custom themes and Emmet in Monaco before it mounts
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEditorWillMount = (monaco: any) => {
    // Register Emmet for HTML and CSS
    try {
      emmetHTML(monaco, ["html"]);
      emmetCSS(monaco, ["css"]);
    } catch {
      // ignore if already registered
    }

    // 1. Dracula Theme
    monaco.editor.defineTheme("dracula", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6272a4", fontStyle: "italic" },
        { token: "keyword", foreground: "ff79c6" },
        { token: "string", foreground: "f1fa8c" },
        { token: "number", foreground: "bd93f9" },
        { token: "tag", foreground: "ff79c6" },
        { token: "attribute.name", foreground: "50fa7b" },
        { token: "attribute.value", foreground: "f1fa8c" },
      ],
      colors: {
        "editor.background": "#282a36",
        "editor.foreground": "#f8f8f2",
        "editorCursor.foreground": "#50fa7b",
        "editor.lineHighlightBackground": "#44475a40",
      },
    });

    // 2. One Dark Theme
    monaco.editor.defineTheme("one-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "5c6370", fontStyle: "italic" },
        { token: "keyword", foreground: "c678dd" },
        { token: "string", foreground: "98c379" },
        { token: "number", foreground: "d19a66" },
        { token: "tag", foreground: "e06c75" },
        { token: "attribute.name", foreground: "d19a66" },
      ],
      colors: {
        "editor.background": "#21252b",
        "editor.foreground": "#abb2bf",
        "editorCursor.foreground": "#528bff",
        "editor.lineHighlightBackground": "#2c313a",
      },
    });

    // 3. Night Owl Theme
    monaco.editor.defineTheme("night-owl", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "637777", fontStyle: "italic" },
        { token: "keyword", foreground: "c792ea" },
        { token: "string", foreground: "ecc48d" },
        { token: "number", foreground: "f78c6c" },
        { token: "tag", foreground: "7fdbca" },
        { token: "attribute.name", foreground: "addb67" },
      ],
      colors: {
        "editor.background": "#011627",
        "editor.foreground": "#d6deeb",
        "editorCursor.foreground": "#80cbc4",
        "editor.lineHighlightBackground": "#01121f",
      },
    });
  };

  // Load a new template
  const loadTemplate = (template: PlaygroundTemplate) => {
    setSelectedTemplateId(template.id);
    setHtmlCode(template.html);
    setCssCode(template.css);
    setJsCode(template.js);
    setLogs([]);
    setShowTemplateSelector(false);
  };

  // Build sandboxed HTML document
  const generateSrcDoc = useCallback(() => {
    const consoleInterceptor = `
      <script>
        (function() {
          function sendToParent(type, args) {
            try {
              var formatted = Array.prototype.slice.call(args).map(function(arg) {
                if (typeof arg === 'object' && arg !== null) {
                  try { return JSON.stringify(arg); } catch(e) { return String(arg); }
                }
                return String(arg);
              }).join(' ');

              window.parent.postMessage({
                type: 'PLAYGROUND_CONSOLE',
                level: type,
                message: formatted,
                time: new Date().toLocaleTimeString()
              }, '*');
            } catch(e) {}
          }

          var originalLog = console.log;
          var originalWarn = console.warn;
          var originalError = console.error;
          var originalInfo = console.info;

          console.log = function() {
            sendToParent('log', arguments);
            if (originalLog) originalLog.apply(console, arguments);
          };
          console.warn = function() {
            sendToParent('warn', arguments);
            if (originalWarn) originalWarn.apply(console, arguments);
          };
          console.error = function() {
            sendToParent('error', arguments);
            if (originalError) originalError.apply(console, arguments);
          };
          console.info = function() {
            sendToParent('info', arguments);
            if (originalInfo) originalInfo.apply(console, arguments);
          };

          window.onerror = function(msg, url, line) {
            sendToParent('error', ['[Ошибка JS, строка ' + line + ']: ' + msg]);
            return false;
          };
        })();
      <\/script>
    `;

    return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    ${cssCode}
  </style>
  ${consoleInterceptor}
</head>
<body>
  ${htmlCode}
  <script>
    try {
      ${jsCode}
    } catch (err) {
      console.error(err.message);
    }
  <\/script>
</body>
</html>`;
  }, [htmlCode, cssCode, jsCode]);

  const [srcDoc, setSrcDoc] = useState<string>("");

  const refreshPreview = useCallback(() => {
    setSrcDoc(generateSrcDoc());
  }, [generateSrcDoc]);

  // Debounced auto-run
  useEffect(() => {
    if (!autoRun) return;
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      refreshPreview();
    }, 450);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [htmlCode, cssCode, jsCode, autoRun, refreshPreview]);

  // Listen to messages from the iframe console
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "PLAYGROUND_CONSOLE") {
        const { level, message, time } = event.data;
        setLogs((prev) => [
          ...prev.slice(-99),
          {
            id: Math.random().toString(36).substring(2, 9),
            type: level || "log",
            message: message || "",
            timestamp: time || new Date().toLocaleTimeString(),
          },
        ]);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Drag handler for console resizing
  const startResizeConsole = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingConsoleRef.current = true;
    startDragYRef.current = e.clientY;
    startHeightRef.current = consoleHeight;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingConsoleRef.current) return;
      const deltaY = startDragYRef.current - moveEvent.clientY;
      const newHeight = Math.min(Math.max(startHeightRef.current + deltaY, 90), 550);
      setConsoleHeight(newHeight);
    };

    const handleMouseUp = () => {
      isDraggingConsoleRef.current = false;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  // Download complete single HTML project file
  const handleDownloadHtml = () => {
    const blob = new Blob([generateSrcDoc()], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `project-${selectedTemplateId || "code"}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Copy active code to clipboard
  const handleCopyCode = async () => {
    const code = activeTab === "html" ? htmlCode : activeTab === "css" ? cssCode : jsCode;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Copy color hex
  const handleCopyColor = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedColor(hex);
    setTimeout(() => setCopiedColor(null), 1500);
  };

  // Active code value and language for Monaco
  const activeCodeValue = useMemo(() => {
    if (activeTab === "html") return htmlCode;
    if (activeTab === "css") return cssCode;
    return jsCode;
  }, [activeTab, htmlCode, cssCode, jsCode]);

  const activeLanguage = useMemo(() => {
    if (activeTab === "html") return "html";
    if (activeTab === "css") return "css";
    return "javascript";
  }, [activeTab]);

  const handleCodeChange = (val: string) => {
    if (activeTab === "html") setHtmlCode(val);
    else if (activeTab === "css") setCssCode(val);
    else setJsCode(val);
  };

  const currentTemplate = PLAYGROUND_TEMPLATES.find((t) => t.id === selectedTemplateId);
  const currentThemeObj = MONACO_THEMES.find((t) => t.id === selectedThemeId) || MONACO_THEMES[0];

  return (
    <div
      className={`space-y-2.5 pb-6 transition-all ${
        isWorkspaceFullscreen
          ? "fixed inset-0 z-50 bg-background p-2.5 flex flex-col h-screen overflow-hidden pb-2.5"
          : ""
      }`}
    >
      {/* Sleek, Single-Row Professional IDE Header Bar */}
      <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl border bg-card shrink-0 h-11 text-xs">
        {/* LEFT: Project / Template Selector with clean breadcrumb style */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 shrink-0 text-primary font-bold text-xs">
            <Code className="h-4 w-4" />
            <span className="hidden sm:inline">Playground</span>
          </div>

          <span className="text-muted-foreground/40 hidden sm:inline">•</span>

          {/* Template Selector Trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowTemplateSelector(!showTemplateSelector);
                setShowThemeSelector(false);
                setShowColorPalette(false);
              }}
              className="flex items-center gap-1.5 h-7 px-2 rounded-md hover:bg-muted/70 transition-colors font-medium text-foreground text-xs border border-transparent hover:border-border truncate max-w-[200px] sm:max-w-[260px]"
              title="Сменить учебный проект / шаблон"
            >
              <Sparkles className="h-3 w-3 text-primary shrink-0" />
              <span className="truncate">{currentTemplate?.title || "Шаблон"}</span>
              <ChevronDown className="h-3 w-3 opacity-60 shrink-0" />
            </button>

            {showTemplateSelector && (
              <div className="absolute left-0 mt-1 w-72 rounded-xl border bg-popover p-1.5 shadow-md z-50 text-xs animate-in fade-in-50 zoom-in-95">
                <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Учебные шаблоны лицея
                </div>
                <div className="space-y-0.5 mt-1 max-h-72 overflow-y-auto">
                  {PLAYGROUND_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => loadTemplate(tpl)}
                      className={`w-full text-left p-2 rounded-lg transition-colors flex flex-col gap-0.5 ${
                        selectedTemplateId === tpl.id
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "hover:bg-muted/70 text-foreground"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs">{tpl.title}</span>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-muted text-muted-foreground border">
                          {tpl.category}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground line-clamp-1">{tpl.description}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CENTER: Compact Layout Controls (Split | Code | Preview + Fullscreen) */}
        <div className="flex items-center gap-1 shrink-0">
          <div className="flex items-center bg-muted/70 p-0.5 rounded-lg border text-xs">
            <button
              type="button"
              onClick={() => setViewMode("split")}
              className={`flex items-center gap-1 h-6 px-2 rounded-md font-medium transition-colors ${
                viewMode === "split"
                  ? "bg-background text-foreground shadow-2xs border border-border/80"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Сплит 50/50: Редактор и Превью"
            >
              <Columns2 className="h-3 w-3" />
              <span className="hidden md:inline">Сплит</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("editor")}
              className={`flex items-center gap-1 h-6 px-2 rounded-md font-medium transition-colors ${
                viewMode === "editor"
                  ? "bg-background text-foreground shadow-2xs border border-border/80"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Только редактор кода на весь экран"
            >
              <Code className="h-3 w-3" />
              <span className="hidden md:inline">Код</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("preview")}
              className={`flex items-center gap-1 h-6 px-2 rounded-md font-medium transition-colors ${
                viewMode === "preview"
                  ? "bg-background text-foreground shadow-2xs border border-border/80"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Только живой предпросмотр"
            >
              <Eye className="h-3 w-3" />
              <span className="hidden md:inline">Превью</span>
            </button>
          </div>

          <Button
            size="xs"
            variant={isWorkspaceFullscreen ? "secondary" : "ghost"}
            onClick={() => setIsWorkspaceFullscreen(!isWorkspaceFullscreen)}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            title={isWorkspaceFullscreen ? "Выйти из полноэкранного режима (Esc)" : "Развернуть всю песочницу на весь экран"}
          >
            {isWorkspaceFullscreen ? <Minimize2 className="h-3.5 w-3.5 text-primary" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </Button>
        </div>

        {/* RIGHT: Neatly Grouped Toolset (Appearance, Actions, Execution) */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Group 1: Appearance (Theme & CSS Colors) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowThemeSelector(!showThemeSelector);
                setShowTemplateSelector(false);
                setShowColorPalette(false);
              }}
              className="flex items-center gap-1.5 h-7 px-2 rounded-md border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              title="Цветовая тема редактора Monaco"
            >
              <div className="h-2.5 w-2.5 rounded-full border border-border shrink-0" style={{ background: currentThemeObj.bg }} />
              <span className="hidden lg:inline">{currentThemeObj.label}</span>
              <ChevronDown className="h-3 w-3 opacity-60 shrink-0" />
            </button>

            {showThemeSelector && (
              <div className="absolute right-0 mt-1 w-48 rounded-xl border bg-popover p-1.5 shadow-md z-50 text-xs animate-in fade-in-50 zoom-in-95">
                <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Тема редактора
                </div>
                <div className="space-y-0.5 mt-1">
                  {MONACO_THEMES.map((th) => (
                    <button
                      key={th.id}
                      type="button"
                      onClick={() => changeTheme(th.id)}
                      className={`w-full text-left px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between ${
                        selectedThemeId === th.id
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-muted text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full border border-zinc-700" style={{ background: th.bg }} />
                        <span>{th.label}</span>
                      </div>
                      {selectedThemeId === th.id && <Check className="h-3 w-3 text-primary" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick CSS Palette Popover */}
          <div className="relative">
            <Button
              size="xs"
              variant="outline"
              onClick={() => {
                setShowColorPalette(!showColorPalette);
                setShowTemplateSelector(false);
                setShowThemeSelector(false);
              }}
              className="h-7 px-2 text-xs font-medium text-muted-foreground hover:text-foreground gap-1"
              title="Палитра CSS-цветов (HEX)"
            >
              <Palette className="h-3 w-3 text-primary" />
              <span className="hidden xl:inline">Цвета</span>
            </Button>

            {showColorPalette && (
              <div className="absolute right-0 mt-1 w-60 rounded-xl border bg-popover p-2 shadow-md z-50 text-xs animate-in fade-in-50 zoom-in-95">
                <div className="px-1 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                  <span>CSS Цвета (HEX)</span>
                  <span className="text-[9px] text-muted-foreground font-normal">клик — копировать</span>
                </div>
                <div className="grid grid-cols-2 gap-1 mt-1.5">
                  {WEB_COLOR_PALETTE.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => handleCopyColor(c.hex)}
                      className="flex items-center gap-1.5 p-1 rounded-md hover:bg-muted transition-colors text-left text-[11px]"
                    >
                      <span
                        className="h-3.5 w-3.5 rounded-full border border-border shrink-0"
                        style={{ background: c.hex }}
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium text-foreground truncate">{c.name}</span>
                        <span className="font-mono text-[9px] text-muted-foreground">
                          {copiedColor === c.hex ? "Скопировано!" : c.hex}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="h-4 w-px bg-border/60 mx-0.5 hidden sm:block" />

          {/* Group 2: Project Actions (Download, Copy, Reset) */}
          <div className="flex items-center">
            <Button
              size="xs"
              variant="ghost"
              onClick={handleDownloadHtml}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              title="Скачать готовый index.html на компьютер"
            >
              <Download className="h-3.5 w-3.5" />
            </Button>

            <Button
              size="xs"
              variant="ghost"
              onClick={handleCopyCode}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              title={copied ? "Скопировано!" : "Скопировать код текущей вкладки"}
            >
              {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>

            <Button
              size="xs"
              variant="ghost"
              onClick={() => {
                const tpl = PLAYGROUND_TEMPLATES.find((t) => t.id === selectedTemplateId) || PLAYGROUND_TEMPLATES[0];
                loadTemplate(tpl);
              }}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              title="Сбросить код к исходному шаблону"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="h-4 w-px bg-border/60 mx-0.5" />

          {/* Group 3: Execution (Auto-Run & Manual Run) */}
          <button
            type="button"
            onClick={() => {
              setAutoRun(!autoRun);
              if (!autoRun) refreshPreview();
            }}
            className={`flex items-center gap-1.5 h-7 px-2 rounded-md border text-xs font-medium transition-colors ${
              autoRun
                ? "bg-primary/10 border-primary text-primary"
                : "bg-muted/40 border-border text-muted-foreground hover:text-foreground"
            }`}
            title="Автоматический запуск кода при наборе текста"
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${autoRun ? "bg-primary animate-pulse" : "bg-muted-foreground"}`}
            />
            <span className="hidden sm:inline">Авто</span>
          </button>

          <Button
            size="xs"
            onClick={refreshPreview}
            className="h-7 px-2.5 text-xs font-medium gap-1 bg-primary text-primary-foreground"
            title="Выполнить код сейчас"
          >
            <Play className="h-3 w-3" />
            <span>Запуск</span>
          </Button>
        </div>
      </div>

      {/* Main Workspace Split: Code Editor (Left) & Preview (Right) */}
      <div
        className={`flex-1 transition-all ${
          viewMode === "split"
            ? "grid grid-cols-1 lg:grid-cols-2 gap-2.5"
            : "flex flex-col"
        } ${isWorkspaceFullscreen ? "h-[calc(100vh-65px)] min-h-0" : ""}`}
      >
        {/* LEFT PANEL: Monaco VS Code Multi-Tab Editor */}
        {(viewMode === "split" || viewMode === "editor") && (
          <div
            className={`flex flex-col rounded-xl border overflow-hidden transition-colors ${
              viewMode === "editor" ? "w-full" : ""
            } ${
              isWorkspaceFullscreen
                ? "h-full min-h-0"
                : "min-h-[480px] h-[calc(100vh-200px)] max-h-[780px]"
            }`}
            style={{ backgroundColor: currentThemeObj.bg }}
          >
            {/* Editor Tab Header */}
            <div className="flex items-center justify-between border-b border-border/40 bg-black/15 px-2 py-1 shrink-0">
              <div className="flex items-center gap-1">
                {/* HTML Tab */}
                <button
                  type="button"
                  onClick={() => setActiveTab("html")}
                  className={`flex items-center gap-1.5 h-6 px-2.5 rounded-md text-xs font-medium transition-colors ${
                    activeTab === "html"
                      ? "bg-primary text-primary-foreground shadow-2xs"
                      : "text-zinc-400 hover:text-zinc-100 hover:bg-white/10"
                  }`}
                >
                  <FileCode className="h-3 w-3" />
                  <span>index.html</span>
                </button>

                {/* CSS Tab */}
                <button
                  type="button"
                  onClick={() => setActiveTab("css")}
                  className={`flex items-center gap-1.5 h-6 px-2.5 rounded-md text-xs font-medium transition-colors ${
                    activeTab === "css"
                      ? "bg-primary text-primary-foreground shadow-2xs"
                      : "text-zinc-400 hover:text-zinc-100 hover:bg-white/10"
                  }`}
                >
                  <FileSpreadsheet className="h-3 w-3" />
                  <span>style.css</span>
                </button>

                {/* JS Tab */}
                <button
                  type="button"
                  onClick={() => setActiveTab("js")}
                  className={`flex items-center gap-1.5 h-6 px-2.5 rounded-md text-xs font-medium transition-colors ${
                    activeTab === "js"
                      ? "bg-primary text-primary-foreground shadow-2xs"
                      : "text-zinc-400 hover:text-zinc-100 hover:bg-white/10"
                  }`}
                >
                  <FileText className="h-3 w-3" />
                  <span>script.js</span>
                </button>
              </div>

              {/* Editor Info Badge */}
              <div className="text-[10px] font-mono text-zinc-400 px-2 flex items-center gap-2">
                <span className="text-primary font-medium">Emmet</span>
                <span className="opacity-40">•</span>
                <span className="hidden sm:inline">.class, #id + Tab</span>
              </div>
            </div>

            {/* Monaco VS Code Editor Body */}
            <div className="relative flex-1 h-full w-full overflow-hidden">
              <MonacoEditor
                height="100%"
                language={activeLanguage}
                value={activeCodeValue}
                theme={selectedThemeId}
                onChange={(val) => handleCodeChange(val || "")}
                beforeMount={handleEditorWillMount}
                options={{
                  minimap: { enabled: false },
                  fontSize: 12,
                  lineNumbers: "on",
                  wordWrap: "on",
                  scrollBeyondLastLine: false,
                  tabSize: 2,
                  automaticLayout: true,
                  fontFamily:
                    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  padding: { top: 8, bottom: 8 },
                  formatOnPaste: true,
                  formatOnType: true,
                  suggestOnTriggerCharacters: true,
                  acceptSuggestionOnEnter: "on",
                  tabCompletion: "on",
                  snippetSuggestions: "top",
                  quickSuggestions: { other: true, comments: false, strings: true },
                  parameterHints: { enabled: true },
                  autoClosingBrackets: "always",
                  autoClosingQuotes: "always",
                  autoClosingDelete: "always",
                  renderWhitespace: "selection",
                }}
              />
            </div>
          </div>
        )}

        {/* RIGHT PANEL: Live Sandbox Preview + Resizable Interactive Console */}
        {(viewMode === "split" || viewMode === "preview") && (
          <div
            className={`flex flex-col rounded-xl border bg-card overflow-hidden transition-all ${
              viewMode === "preview" ? "w-full" : ""
            } ${
              isWorkspaceFullscreen
                ? "h-full min-h-0"
                : "min-h-[480px] h-[calc(100vh-200px)] max-h-[780px]"
            }`}
          >
            {/* Preview Header Bar */}
            <div className="flex items-center justify-between border-b bg-muted/40 px-3 py-1 shrink-0 h-8">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Eye className="h-3.5 w-3.5 text-primary" />
                  <span>Живой предпросмотр</span>
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" title="Песочница активна" />
              </div>

              {/* Console Toggle Button */}
              <Button
                size="xs"
                variant={isConsoleOpen ? "secondary" : "ghost"}
                onClick={() => setIsConsoleOpen(!isConsoleOpen)}
                className={`h-6 px-2 text-xs font-medium gap-1.5 ${
                  logs.some((l) => l.type === "error") ? "text-destructive border border-destructive/30" : ""
                }`}
                title="Открыть / скрыть встроенную веб-консоль"
              >
                <Terminal className="h-3 w-3" />
                <span>Консоль</span>
                {logs.length > 0 && (
                  <span className="text-[10px] px-1 rounded-full bg-muted font-mono">{logs.length}</span>
                )}
              </Button>
            </div>

            {/* Sandboxed iframe */}
            <div className="relative flex-1 bg-white overflow-hidden">
              <iframe
                ref={iframeRef}
                srcDoc={srcDoc}
                title="Playground Live Preview"
                sandbox="allow-scripts allow-modals"
                className="w-full h-full border-0 bg-white"
              />
            </div>

            {/* Built-in Resizable Web Console Drawer */}
            {isConsoleOpen && (
              <div
                style={{ height: `${consoleHeight}px` }}
                className="border-t bg-zinc-950 text-zinc-100 flex flex-col shrink-0 font-mono text-xs transition-none"
              >
                {/* Drag handle to resize console height */}
                <div
                  onMouseDown={startResizeConsole}
                  className="h-2 w-full bg-zinc-900 border-b border-zinc-800 hover:bg-primary/40 cursor-row-resize flex items-center justify-center transition-colors select-none group"
                  title="Потяните вверх или вниз, чтобы изменить высоту консоли"
                >
                  <div className="w-10 h-0.5 rounded-full bg-zinc-600 group-hover:bg-primary transition-colors" />
                </div>

                {/* Console Header Bar */}
                <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-1 bg-zinc-900/90 shrink-0">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-3 w-3 text-primary" />
                    <span className="text-[11px] font-semibold tracking-wide">Web Console</span>
                    <span className="text-[10px] text-zinc-400">({logs.length} сообщений)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {/* Quick height toggle */}
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => setConsoleHeight((prev) => (prev > 260 ? 160 : 380))}
                      className="h-5 px-1.5 text-[10px] text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 gap-1"
                      title={consoleHeight > 260 ? "Сжать консоль" : "Увеличить консоль"}
                    >
                      {consoleHeight > 260 ? (
                        <>
                          <ChevronDown className="h-2.5 w-2.5" />
                          <span>Сжать ({consoleHeight}px)</span>
                        </>
                      ) : (
                        <>
                          <ChevronUp className="h-2.5 w-2.5" />
                          <span>Увеличить ({consoleHeight}px)</span>
                        </>
                      )}
                    </Button>

                    {/* Clear console */}
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => setLogs([])}
                      className="h-5 px-1.5 text-[10px] text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 gap-1"
                      title="Очистить консоль"
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                      <span>Очистить</span>
                    </Button>
                  </div>
                </div>

                {/* Console Log List */}
                <div className="flex-1 p-2 overflow-y-auto space-y-1">
                  {logs.length === 0 ? (
                    <div className="text-zinc-500 text-[11px] italic p-2">
                      Логи консоли чисты. Вызовы console.log(), console.warn() и ошибки отобразятся здесь.
                    </div>
                  ) : (
                    logs.map((log) => (
                      <div
                        key={log.id}
                        className={`flex items-start gap-2 text-[11px] px-1.5 py-0.5 rounded leading-relaxed ${
                          log.type === "error"
                            ? "bg-red-950/40 text-red-300 border-l-2 border-red-500"
                            : log.type === "warn"
                            ? "bg-amber-950/40 text-amber-300 border-l-2 border-amber-500"
                            : "text-zinc-300 border-l-2 border-primary/40"
                        }`}
                      >
                        <span className="text-zinc-500 text-[10px] select-none shrink-0">{log.timestamp}</span>
                        <span className="break-all font-mono whitespace-pre-wrap">{log.message}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
