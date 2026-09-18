"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import { Highlight, themes } from "prism-react-renderer";
import { Check, Copy, ExternalLink, ChevronRight } from "lucide-react";

/** Safe sanitize schema allowing details/summary and standard formatting while preventing arbitrary unsafe HTML (scripts, iframes, on* handlers) */
const markdownSanitizeSchema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames || []),
    "details",
    "summary",
    "kbd",
    "mark",
    "sup",
    "sub",
    "abbr",
  ],
  attributes: {
    ...defaultSchema.attributes,
    details: ["open", "className"],
    summary: ["className"],
    code: [...(defaultSchema.attributes?.code || []), "className", "inline"],
    span: [...(defaultSchema.attributes?.span || []), "className"],
    div: [...(defaultSchema.attributes?.div || []), "className"],
    a: [...(defaultSchema.attributes?.a || []), "target", "rel", "className"],
  },
};

/** Normalize language name for Prism */
function normalizeLanguage(lang?: string): string {
  if (!lang) return "typescript";
  const clean = lang.toLowerCase().trim();
  switch (clean) {
    case "js":
    case "javascript":
      return "javascript";
    case "ts":
    case "typescript":
      return "typescript";
    case "tsx":
      return "tsx";
    case "jsx":
      return "jsx";
    case "py":
    case "python":
      return "python";
    case "html":
    case "xml":
    case "svg":
      return "markup";
    case "css":
    case "scss":
    case "sass":
      return "css";
    case "json":
      return "json";
    case "sql":
      return "sql";
    case "bash":
    case "sh":
    case "shell":
    case "zsh":
      return "bash";
    case "cpp":
    case "c":
      return "cpp";
    case "go":
      return "go";
    case "rust":
    case "rs":
      return "rust";
    case "yaml":
    case "yml":
      return "yaml";
    case "markdown":
    case "md":
      return "markdown";
    default:
      return clean || "clike";
  }
}

/** Code block with Prism syntax highlighting and 1-click Copy */
function CodeBlock({
  code,
  language,
}: {
  code: string;
  language: string;
}) {
  const [copied, setCopied] = useState(false);
  const normalizedLang = normalizeLanguage(language);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-2.5 rounded-lg border border-border/80 overflow-hidden bg-[#1e1e1e] text-zinc-100 shadow-sm text-xs">
      {/* Header bar with Language tag and Copy button */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#252526] border-b border-border/40 text-[11px] text-zinc-400 font-mono select-none">
        <span className="uppercase tracking-wider font-semibold text-[10px] text-zinc-300">
          {language || "code"}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="h-6 px-2 rounded hover:bg-zinc-700/60 border border-transparent hover:border-zinc-600/60 text-[11px] text-zinc-300 hover:text-white transition-all flex items-center gap-1.5 font-sans cursor-pointer"
          title="Скопировать код"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Скопировано!</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Копировать</span>
            </>
          )}
        </button>
      </div>

      {/* Highlighted Code */}
      <Highlight theme={themes.vsDark} code={code.trimEnd()} language={normalizedLang}>
        {({ style, tokens, getLineProps, getTokenProps }) => (
          <pre
            style={style}
            className="p-3 m-0 overflow-x-auto font-mono text-[11px] leading-relaxed select-text bg-[#1e1e1e]"
          >
            {tokens.map((line, i) => {
              const lineProps = getLineProps({ line });
              return (
                <div key={i} {...lineProps} className="table-row">
                  <span className="table-cell select-none pr-3 text-right text-zinc-600 font-mono text-[10px] opacity-70 w-6">
                    {i + 1}
                  </span>
                  <span className="table-cell">
                    {line.map((token, key) => {
                      const tokenProps = getTokenProps({ token });
                      return <span key={key} {...tokenProps} />;
                    })}
                  </span>
                </div>
              );
            })}
          </pre>
        )}
      </Highlight>
    </div>
  );
}

interface ElementWithNodeProps {
  children?: React.ReactNode;
  node?: {
    tagName?: string;
  };
}

function isSummaryElement(
  child: React.ReactNode
): child is React.ReactElement<ElementWithNodeProps> {
  if (!React.isValidElement<ElementWithNodeProps>(child)) return false;
  if (child.type === "summary") return true;
  if (typeof child.type === "function" && child.type.name === "summary") return true;
  if (child.props?.node?.tagName === "summary") return true;
  return false;
}

/** Smooth animated Accordion component for Markdown details/summary */
function MarkdownAccordion({
  open: initialOpen,
  className = "",
  children,
}: {
  open?: boolean | string;
  className?: string;
  children?: React.ReactNode;
}) {
  const isDefaultOpen =
    initialOpen === "" ||
    initialOpen === true ||
    initialOpen === "open" ||
    initialOpen === "true";
  const [isOpen, setIsOpen] = useState(isDefaultOpen);

  const childArray = React.Children.toArray(children);
  const summaryElement = childArray.find(isSummaryElement);
  const otherChildren = summaryElement
    ? childArray.filter((c) => c !== summaryElement)
    : childArray;

  const summaryContent = summaryElement
    ? summaryElement.props.children
    : "Подробнее";

  return (
    <div
      className={`my-2.5 rounded-lg border border-border/80 bg-card overflow-hidden text-xs shadow-2xs transition-colors ${className || ""}`}
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className={`w-full flex items-center gap-2 px-3 py-2 cursor-pointer font-medium text-foreground bg-muted/30 hover:bg-muted/60 transition-colors select-none text-left ${
          isOpen ? "border-b border-border/60" : ""
        }`}
      >
        <ChevronRight
          className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ease-out ${
            isOpen ? "rotate-90 text-primary" : "text-muted-foreground"
          }`}
        />
        <span className="flex-1 leading-snug">{summaryContent}</span>
      </button>

      <div
        className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          {otherChildren.length > 0 && (
            <div className="p-3 pt-2.5 space-y-2 bg-background/50 text-foreground/90">
              {otherChildren}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export interface MarkdownViewerProps {
  content: string;
  className?: string;
  onToggleCheckbox?: (lineIndex: number) => void;
}

export function MarkdownViewer({
  content,
  className = "",
}: MarkdownViewerProps) {
  if (!content) return null;

  return (
    <div className={`text-xs leading-relaxed text-foreground space-y-2 select-text ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, markdownSanitizeSchema]]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-sm font-bold text-foreground mt-3 mb-1.5 first:mt-0 tracking-tight">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xs font-bold text-foreground mt-2.5 mb-1 tracking-tight">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xs font-semibold text-foreground mt-2 mb-1">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-[11px] font-semibold text-foreground mt-1.5 mb-0.5">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="my-1.5 leading-relaxed text-foreground/90 first:mt-0 last:mb-0">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          del: ({ children }) => <del className="opacity-60 line-through">{children}</del>,
          blockquote: ({ children }) => {
            return (
              <blockquote className="border-l-2 border-primary pl-3 py-1.5 my-2.5 bg-primary/5 rounded-r text-xs text-foreground/90 leading-relaxed">
                {children}
              </blockquote>
            );
          },
          ul: ({ children }) => (
            <ul className="list-disc pl-5 my-1.5 space-y-0.5 text-xs text-foreground/90 marker:text-primary">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 my-1.5 space-y-0.5 text-xs text-foreground/90 marker:text-primary font-mono marker:font-sans">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="text-xs leading-relaxed">{children}</li>,
          hr: () => <hr className="my-3 border-border/60" />,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium inline-flex items-center gap-0.5"
            >
              <span>{children}</span>
              <ExternalLink className="h-2.5 w-2.5 shrink-0" />
            </a>
          ),
          details: ({ children, open, className }) => (
            <MarkdownAccordion open={open as boolean | string | undefined} className={className}>
              {children}
            </MarkdownAccordion>
          ),
          summary: ({ children }) => <>{children}</>,
          table: ({ children }) => (
            <div className="my-2.5 overflow-x-auto rounded-lg border border-border/80 bg-card">
              <table className="w-full text-xs text-left border-collapse min-w-full">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted/60 text-foreground font-semibold border-b border-border/80">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-border/40 bg-card">{children}</tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-muted/30 transition-colors">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 text-[11px] font-semibold text-foreground">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-1.5 text-xs text-foreground/90 align-top">
              {children}
            </td>
          ),
          input: ({ type, checked }) => {
            if (type === "checkbox") {
              return (
                <span
                  className={`inline-flex items-center justify-center h-3.5 w-3.5 rounded-[4px] border mr-1.5 align-middle select-none ${
                    checked
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border bg-background"
                  }`}
                >
                  {checked && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                </span>
              );
            }
            return null;
          },
          code: ({ className, children, node: _node, ...props }) => {
            const match = /language-(\w+)/.exec(className || "");
            const isCodeBlock = match || String(children).includes("\n");

            if (isCodeBlock) {
              return (
                <CodeBlock
                  code={String(children).replace(/\n$/, "")}
                  language={match ? match[1] : ""}
                />
              );
            }

            return (
              <code
                className="px-1.5 py-0.5 rounded bg-muted font-mono text-[11px] text-primary border border-border/40 font-medium"
                {...props}
              >
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

/**
 * Backward-compatible helper to render markdown text in any component.
 */
export function renderMarkdown(
  text: string,
  onToggleCheckbox?: (lineIndex: number) => void
): React.ReactNode {
  if (!text) return null;
  return <MarkdownViewer content={text} onToggleCheckbox={onToggleCheckbox} />;
}
