import React from "react";
import { ExternalLink } from "lucide-react";

/** Helper to format inline markdown tokens: **bold**, *italic*, ~~strikethrough~~, `code`, [title](url) */
function formatInline(text: string): React.ReactNode {
  if (!text) return text;

  const parts: React.ReactNode[] = [];
  const regex = /(\*\*.*?\*\*|\*.*?\*|~~.*?~~|`.*?`|\[.*?\]\(.*?\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyIdx = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(
        <strong key={keyIdx++} className="font-semibold text-foreground">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("*") && token.endsWith("*")) {
      parts.push(<em key={keyIdx++}>{token.slice(1, -1)}</em>);
    } else if (token.startsWith("~~") && token.endsWith("~~")) {
      parts.push(
        <del key={keyIdx++} className="opacity-70">
          {token.slice(2, -2)}
        </del>
      );
    } else if (token.startsWith("`") && token.endsWith("`")) {
      parts.push(
        <code
          key={keyIdx++}
          className="px-1 py-0.5 rounded bg-muted font-mono text-[11px] border"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("[") && token.includes("](")) {
      const titleMatch = token.match(/\[(.*?)\]/);
      const urlMatch = token.match(/\((.*?)\)/);
      if (titleMatch && urlMatch) {
        parts.push(
          <a
            key={keyIdx++}
            href={urlMatch[1]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium inline-flex items-center gap-0.5"
          >
            <span>{titleMatch[1]}</span>
            <ExternalLink className="h-2.5 w-2.5 shrink-0" />
          </a>
        );
      }
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

/** Renders multi-line Markdown text to real React elements with interactive checkbox support */
export function renderMarkdown(
  text: string,
  onToggleCheckbox?: (lineIndex: number) => void
): React.ReactNode {
  if (!text) return null;

  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];

  lines.forEach((line, index) => {
    // Code block toggle
    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        elements.push(
          <pre
            key={index}
            className="p-2.5 rounded-md bg-muted font-mono text-[11px] overflow-x-auto my-2 border border-border"
          >
            <code>{codeBlockLines.join("\n")}</code>
          </pre>
        );
        codeBlockLines = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      return;
    }

    // Headings
    if (line.startsWith("# ")) {
      elements.push(
        <h1 key={index} className="text-base font-semibold my-2 text-foreground">
          {formatInline(line.slice(2))}
        </h1>
      );
      return;
    }
    if (line.startsWith("## ")) {
      elements.push(
        <h2 key={index} className="text-sm font-semibold my-1.5 text-foreground">
          {formatInline(line.slice(3))}
        </h2>
      );
      return;
    }
    if (line.startsWith("### ")) {
      elements.push(
        <h3 key={index} className="text-xs font-semibold my-1 text-foreground">
          {formatInline(line.slice(4))}
        </h3>
      );
      return;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      elements.push(
        <blockquote
          key={index}
          className="border-l-2 border-primary pl-3 py-1 my-1.5 text-muted-foreground italic bg-primary/5 rounded-r"
        >
          {formatInline(line.slice(2))}
        </blockquote>
      );
      return;
    }

    // Horizontal rule
    if (line.trim() === "---" || line.trim() === "***") {
      elements.push(<hr key={index} className="my-2 border-border" />);
      return;
    }

    // Interactive Checkbox Lists
    if (line.startsWith("- [ ] ") || line.startsWith("- [x] ")) {
      const checked = line.startsWith("- [x] ");
      elements.push(
        <div
          key={index}
          onClick={() => onToggleCheckbox && onToggleCheckbox(index)}
          className="flex items-center gap-2 my-1 pl-1 text-xs cursor-pointer select-none group"
        >
          <input
            type="checkbox"
            checked={checked}
            onChange={() => onToggleCheckbox && onToggleCheckbox(index)}
            className="h-3.5 w-3.5 accent-primary rounded cursor-pointer shrink-0"
          />
          <span className={checked ? "line-through opacity-60" : "group-hover:text-primary transition-colors"}>
            {formatInline(line.slice(6))}
          </span>
        </div>
      );
      return;
    }

    // Bullet Lists
    if (line.startsWith("- ") || line.startsWith("* ")) {
      elements.push(
        <li key={index} className="ml-4 list-disc my-0.5 text-xs">
          {formatInline(line.slice(2))}
        </li>
      );
      return;
    }

    // Numbered Lists
    if (/^\d+\.\s/.test(line)) {
      const match = line.match(/^\d+\.\s/);
      const textAfter = line.slice(match![0].length);
      elements.push(
        <li key={index} className="ml-4 list-decimal my-0.5 text-xs">
          {formatInline(textAfter)}
        </li>
      );
      return;
    }

    // Paragraph
    if (line.trim() !== "") {
      elements.push(
        <p key={index} className="my-1 text-xs leading-relaxed">
          {formatInline(line)}
        </p>
      );
    } else {
      elements.push(<div key={index} className="h-1.5" />);
    }
  });

  return <div className="space-y-0.5">{elements}</div>;
}
