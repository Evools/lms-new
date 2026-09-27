"use client";

import React, { useState } from "react";
import { MessageSquare, FileCode, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { SubmissionDTO } from "../actions";
import { parseSubmissionContent } from "./submission-utils";
import { CodeViewer } from "@/components/ui/code-highlighter";

interface SubmissionContentDisplayProps {
  submission: SubmissionDTO;
}

/** Displays student submission notes and legacy code attachments if present */
export function SubmissionContentDisplay({
  submission,
}: SubmissionContentDisplayProps) {
  const parsed = parseSubmissionContent(submission.comment);
  const [activeFileIdx, setActiveFileIdx] = useState(0);
  const [copiedFile, setCopiedFile] = useState(false);

  const handleCopyFile = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedFile(true);
    toast.add({ title: "Код скопирован в буфер", type: "success" });
    setTimeout(() => setCopiedFile(false), 2000);
  };

  const hasCodeFiles = parsed.type === "code" && parsed.files && parsed.files.length > 0;
  const currentFile = hasCodeFiles ? parsed.files![activeFileIdx] || parsed.files![0] : null;

  return (
    <div className="space-y-2">
      {/* Student Note / Comment */}
      {parsed.note && (
        <div className="p-3 rounded-xl bg-muted/30 border text-xs text-foreground leading-relaxed space-y-1">
          <div className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1.5">
            <MessageSquare className="h-3 w-3 text-primary" /> Комментарий студента к решению:
          </div>
          <p className="whitespace-pre-wrap">{parsed.note}</p>
        </div>
      )}

      {/* Legacy Code Files Display (if previously submitted with files) */}
      {hasCodeFiles && currentFile && (
        <div className="rounded-xl border bg-card overflow-hidden shadow-xs">
          <div className="flex items-center justify-between px-2.5 py-1.5 border-b bg-muted/40 gap-2">
            <div className="flex items-center gap-1 overflow-x-auto">
              {parsed.files!.map((file, idx) => {
                const isActive = activeFileIdx === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveFileIdx(idx)}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-mono border transition-colors flex items-center gap-1 shrink-0 ${
                      isActive
                        ? "bg-background text-primary border-border shadow-xs"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <FileCode className="h-3 w-3 text-primary" />
                    <span>{file.name}</span>
                  </button>
                );
              })}
            </div>

            <Button
              size="xs"
              variant="ghost"
              className="h-6 text-[10px] gap-1 px-2 font-medium"
              onClick={() => handleCopyFile(currentFile.code)}
            >
              {copiedFile ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
              {copiedFile ? "Скопировано!" : "Копировать"}
            </Button>
          </div>

          <CodeViewer
            code={currentFile.code}
            fileName={currentFile.name}
            maxHeight="240px"
            showLineNumbers={true}
          />
        </div>
      )}
    </div>
  );
}
