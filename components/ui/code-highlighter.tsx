"use client";

import React, { useRef } from "react";
import { Highlight, themes } from "prism-react-renderer";

export function getPrismLanguage(fileName?: string | null): string {
  if (!fileName || typeof fileName !== "string") return "clike";
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  switch (ext) {
    case "html":
    case "htm":
    case "svg":
    case "xml":
      return "markup";
    case "css":
    case "scss":
    case "sass":
      return "css";
    case "js":
    case "mjs":
    case "cjs":
      return "javascript";
    case "ts":
      return "typescript";
    case "tsx":
      return "tsx";
    case "jsx":
      return "jsx";
    case "py":
      return "python";
    case "sql":
      return "sql";
    case "json":
      return "json";
    case "cpp":
    case "c":
      return "cpp";
    case "go":
      return "go";
    case "rs":
      return "rust";
    case "yml":
    case "yaml":
      return "yaml";
    case "md":
      return "markdown";
    case "php":
    case "java":
    default:
      return "clike";
  }
}

interface CodeViewerProps {
  code?: string | null;
  fileName?: string;
  maxHeight?: string;
  showLineNumbers?: boolean;
  className?: string;
}

export function CodeViewer({
  code = "",
  fileName = "code.js",
  maxHeight = "360px",
  showLineNumbers = true,
  className = "",
}: CodeViewerProps) {
  const safeCode = typeof code === "string" ? code : String(code || "");
  const language = getPrismLanguage(fileName);
  const displayCode = safeCode.trim().length > 0 ? safeCode : "// Файл пуст";

  return (
    <Highlight theme={themes.vsDark} code={displayCode} language={language}>
      {({ style, tokens, getLineProps, getTokenProps }) => (
        <pre
          style={{ ...style, maxHeight }}
          className={`font-mono text-xs overflow-auto p-3 m-0 rounded-b-xl border-0 select-text leading-relaxed ${className}`}
        >
          {tokens.map((line, i) => {
            const { key: _lineKey, ...lineProps } = getLineProps({ line });
            return (
              <div key={i} {...lineProps} className="table-row">
                {showLineNumbers && (
                  <span className="table-cell select-none pr-3 text-right text-zinc-500 font-mono text-[10px] opacity-70 w-7">
                    {i + 1}
                  </span>
                )}
                <span className="table-cell">
                  {line.map((token, key) => {
                    const { key: _tokenKey, ...tokenProps } = getTokenProps({ token });
                    return <span key={key} {...tokenProps} />;
                  })}
                </span>
              </div>
            );
          })}
        </pre>
      )}
    </Highlight>
  );
}

interface CodeEditorProps {
  value?: string | null;
  onChange: (val: string) => void;
  fileName?: string;
  placeholder?: string;
  height?: string;
}

export function CodeEditor({
  value = "",
  onChange,
  fileName = "index.html",
  placeholder = "// Напишите или вставьте код сюда...",
  height = "320px",
}: CodeEditorProps) {
  const safeValue = typeof value === "string" ? value : String(value || "");
  const language = getPrismLanguage(fileName);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    if (preRef.current) {
      preRef.current.scrollTop = target.scrollTop;
      preRef.current.scrollLeft = target.scrollLeft;
    }
    if (gutterRef.current) {
      gutterRef.current.scrollTop = target.scrollTop;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Tab key indent (2 spaces)
    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const updated = safeValue.substring(0, start) + "  " + safeValue.substring(end);
      onChange(updated);

      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      });
    }
  };

  const lines = safeValue.split("\n");
  const lineCount = lines.length;

  const sharedEditorStyle: React.CSSProperties = {
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    fontSize: "12px",
    lineHeight: "20px",
    tabSize: 2,
    letterSpacing: "0px",
    wordSpacing: "normal",
  };

  return (
    <div
      style={{ height }}
      className="relative font-mono text-xs bg-[#1e1e1e] text-zinc-100 rounded-b-xl border border-zinc-800 overflow-hidden shadow-inner flex w-full"
    >
      {/* Line Numbers Gutter (Synced with Textarea Scroll) */}
      <div
        ref={gutterRef}
        style={sharedEditorStyle}
        className="select-none py-3 px-2 text-right text-zinc-500 font-mono text-[11px] border-r border-zinc-800/90 bg-[#1e1e1e] shrink-0 w-10 overflow-hidden"
      >
        {Array.from({ length: Math.max(1, lineCount) }).map((_, i) => (
          <div key={i} className="leading-5 h-5 text-[11px]">
            {i + 1}
          </div>
        ))}
      </div>

      {/* Editor & Highlight Container */}
      <div className="relative flex-1 h-full overflow-hidden">
        {/* Syntax Highlighted Layer */}
        <Highlight theme={themes.vsDark} code={safeValue || " "} language={language}>
          {({ style, tokens, getLineProps, getTokenProps }) => (
            <pre
              ref={preRef}
              style={{
                ...style,
                ...sharedEditorStyle,
                height: "100%",
                padding: "12px",
                margin: 0,
              }}
              aria-hidden="true"
              className="overflow-hidden whitespace-pre select-none pointer-events-none absolute inset-0 bg-transparent border-0"
            >
              {tokens.map((line, i) => {
                const { key: _lineKey, ...lineProps } = getLineProps({ line });
                return (
                  <div key={i} {...lineProps} className="leading-5 h-5">
                    {line.map((token, key) => {
                      const { key: _tokenKey, ...tokenProps } = getTokenProps({ token });
                      return <span key={key} {...tokenProps} />;
                    })}
                  </div>
                );
              })}
            </pre>
          )}
        </Highlight>

        {/* Interactive Textarea Layer */}
        <textarea
          ref={textareaRef}
          value={safeValue}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          placeholder={placeholder}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          style={{
            ...sharedEditorStyle,
            padding: "12px",
            margin: 0,
            color: "transparent",
            caretColor: "#38bdf8",
            WebkitTextFillColor: "transparent",
          }}
          className="w-full h-full whitespace-pre select-text resize-none bg-transparent focus:outline-none absolute inset-0 overflow-auto placeholder:text-zinc-600"
        />
      </div>
    </div>
  );
}

