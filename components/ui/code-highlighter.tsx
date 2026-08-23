"use client";

import React, { useRef } from "react";
import { Highlight, themes } from "prism-react-renderer";

export function getPrismLanguage(fileName: string): string {
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
  code: string;
  fileName?: string;
  maxHeight?: string;
  showLineNumbers?: boolean;
  className?: string;
}

export function CodeViewer({
  code,
  fileName = "code.js",
  maxHeight = "360px",
  showLineNumbers = true,
  className = "",
}: CodeViewerProps) {
  const language = getPrismLanguage(fileName);
  const displayCode = code.trim().length > 0 ? code : "// Файл пуст";

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
  value: string;
  onChange: (val: string) => void;
  fileName?: string;
  placeholder?: string;
  minHeight?: string;
  maxHeight?: string;
}

export function CodeEditor({
  value,
  onChange,
  fileName = "index.html",
  placeholder = "// Напишите или вставьте код сюда...",
  minHeight = "220px",
  maxHeight = "360px",
}: CodeEditorProps) {
  const language = getPrismLanguage(fileName);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);

  // Synchronize scrolling between overlay textarea and syntax highlighted pre
  const handleScroll = () => {
    if (textareaRef.current && preRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
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
      const updated = value.substring(0, start) + "  " + value.substring(end);
      onChange(updated);

      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      });
    }
  };

  const lines = value.split("\n");
  const lineCount = lines.length;

  return (
    <div className="relative font-mono text-xs bg-zinc-950 text-zinc-100 rounded-b-xl border border-zinc-800 overflow-hidden shadow-inner flex">
      {/* Line Numbers Gutter */}
      <div className="select-none py-3 px-2 text-right text-zinc-600 font-mono text-[10px] border-r border-zinc-800/80 bg-zinc-950/90 shrink-0 w-8">
        {Array.from({ length: Math.max(1, lineCount) }).map((_, i) => (
          <div key={i} className="leading-5 h-5">
            {i + 1}
          </div>
        ))}
      </div>

      {/* Editor & Highlight Container */}
      <div className="relative flex-1 overflow-hidden" style={{ minHeight, maxHeight }}>
        {/* Syntax Highlighted Layer */}
        <Highlight theme={themes.vsDark} code={value || " "} language={language}>
          {({ style, tokens, getLineProps, getTokenProps }) => (
            <pre
              ref={preRef}
              style={{ ...style, minHeight, maxHeight }}
              aria-hidden="true"
              className="p-3 m-0 overflow-auto font-mono text-xs leading-5 whitespace-pre select-none pointer-events-none absolute inset-0 bg-transparent"
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
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          placeholder={placeholder}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          style={{
            minHeight,
            maxHeight,
            color: "transparent",
            caretColor: "#38bdf8",
            WebkitTextFillColor: "transparent",
          }}
          className="p-3 m-0 w-full font-mono text-xs leading-5 whitespace-pre select-text resize-none bg-transparent focus:outline-none absolute inset-0 overflow-auto placeholder:text-zinc-600"
        />
      </div>
    </div>
  );
}
