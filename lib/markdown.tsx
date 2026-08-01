import React from "react";
import { ExternalLink, Check } from "lucide-react";

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
          className="px-1 py-0.5 rounded bg-muted font-mono text-[11px] border border-border/60 text-primary font-medium"
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

/** Syntax Highlighter for Code Block Lines */
function highlightCodeLine(line: string, key: number): React.ReactNode {
  if (!line.trim()) {
    return <div key={key} className="h-4" />;
  }

  // Comments // ... or # ...
  if (line.trim().startsWith("//") || line.trim().startsWith("#")) {
    return (
      <div key={key} className="text-muted-foreground/60 italic leading-relaxed">
        {line}
      </div>
    );
  }

  const tokens: React.ReactNode[] = [];
  const regex =
    /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|\/\/[^\n]*|\b(?:export|default|async|function|const|let|var|return|try|catch|import|from|if|else|await|new|type|interface|enum|class|extends|implements)\b|\b(?:true|false|null|undefined|\d+)\b|\b[a-zA-Z_]\w*(?=\s*\())/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let subKey = 0;

  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(line.substring(lastIndex, match.index));
    }

    const token = match[0];

    if (token.startsWith("//")) {
      tokens.push(
        <span key={subKey++} className="text-muted-foreground/60 italic">
          {token}
        </span>
      );
    } else if (
      (token.startsWith('"') && token.endsWith('"')) ||
      (token.startsWith("'") && token.endsWith("'")) ||
      (token.startsWith("`") && token.endsWith("`"))
    ) {
      tokens.push(
        <span key={subKey++} className="text-primary font-medium">
          {token}
        </span>
      );
    } else if (
      /^(export|default|async|function|const|let|var|return|try|catch|import|from|if|else|await|new|type|interface|enum|class|extends|implements)$/.test(
        token
      )
    ) {
      tokens.push(
        <span key={subKey++} className="text-primary font-semibold">
          {token}
        </span>
      );
    } else if (/^(true|false|null|undefined|\d+)$/.test(token)) {
      tokens.push(
        <span key={subKey++} className="text-foreground font-medium opacity-90">
          {token}
        </span>
      );
    } else if (/^[a-zA-Z_]\w*$/.test(token)) {
      tokens.push(
        <span key={subKey++} className="text-foreground font-medium">
          {token}
        </span>
      );
    } else {
      tokens.push(token);
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < line.length) {
    tokens.push(line.substring(lastIndex));
  }

  return (
    <div key={key} className="leading-relaxed whitespace-pre font-mono">
      {tokens.length > 0 ? tokens : line}
    </div>
  );
}

/** Renders multi-line Markdown text to real React elements with interactive checkbox & code syntax highlighting */
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
          <div
            key={index}
            className="p-3 rounded-lg bg-muted/60 font-mono text-[11px] overflow-x-auto my-3 border border-border/80 text-foreground whitespace-pre leading-relaxed font-mono select-text"
          >
            {codeBlockLines.map((cLine, idx) => highlightCodeLine(cLine, idx))}
          </div>
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
          className="border-l-2 border-primary pl-3 py-1.5 my-2 text-muted-foreground italic bg-primary/5 rounded-r text-xs"
        >
          {formatInline(line.slice(2))}
        </blockquote>
      );
      return;
    }

    // Horizontal rule
    if (line.trim() === "---" || line.trim() === "***") {
      elements.push(<hr key={index} className="my-3 border-border/60" />);
      return;
    }

    // Interactive Checkbox Lists
    if (line.startsWith("- [ ] ") || line.startsWith("- [x] ")) {
      const checked = line.startsWith("- [x] ");
      elements.push(
        <div
          key={index}
          onClick={() => onToggleCheckbox && onToggleCheckbox(index)}
          className="flex items-center gap-2 my-1.5 pl-0.5 text-xs cursor-pointer select-none group"
        >
          <div
            className={`h-4 w-4 rounded-[4px] border flex items-center justify-center shrink-0 transition-all ${
              checked
                ? "bg-primary text-primary-foreground border-primary"
                : "border-input bg-background group-hover:border-primary/60"
            }`}
          >
            {checked && <Check className="h-3 w-3 stroke-[3]" />}
          </div>
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
