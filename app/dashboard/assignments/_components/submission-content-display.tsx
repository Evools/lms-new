"use client";

import React, { useState } from "react";
import JSZip from "jszip";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import {
  Copy,
  Check,
  Download,
  Play,
  FileCode,
  MessageSquare,
} from "lucide-react";
import { SubmissionDTO } from "../actions";
import { CodeViewer } from "@/components/ui/code-highlighter";
import {
  detectLanguage,
  parseSubmissionContent,
  SubmissionCodeFile,
} from "./submission-utils";

interface SubmissionContentDisplayProps {
  submission: SubmissionDTO;
}

/** Component to display student submitted code with tabs, language badges, copy buttons & live preview */
export function SubmissionContentDisplay({
  submission,
}: SubmissionContentDisplayProps) {
  const parsed = parseSubmissionContent(submission.comment);
  const [activeFileIdx, setActiveFileIdx] = useState(0);
  const [copiedFile, setCopiedFile] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [showLivePreview, setShowLivePreview] = useState(false);

  const handleCopyFile = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedFile(true);
    toast.add({ title: "Код файла скопирован в буфер", type: "success" });
    setTimeout(() => setCopiedFile(false), 2000);
  };

  const handleDownloadZip = async (files: SubmissionCodeFile[]) => {
    try {
      setIsZipping(true);
      const zip = new JSZip();
      files.forEach((file) => {
        zip.file(file.name, file.code || "");
      });
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const sanitizedName = (submission.studentName || "solution").replace(/\s+/g, "_");
      a.download = `${sanitizedName}_project.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.add({ title: "Архив проекта .zip успешно скачан!", type: "success" });
    } catch (err) {
      console.error("ZIP download error:", err);
      toast.add({ title: "Ошибка при формировании архива", type: "error" });
    } finally {
      setIsZipping(false);
    }
  };

  if (parsed.type === "code" && parsed.files && parsed.files.length > 0) {
    const files = parsed.files;
    const currentFile = files[activeFileIdx] || files[0];
    const htmlFile = files.find((f) => f.name.endsWith(".html") || f.name.endsWith(".htm"));
    const cssFile = files.find((f) => f.name.endsWith(".css"));
    const jsFile = files.find((f) => f.name.endsWith(".js"));

    const combinedHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>${cssFile?.code || ""}</style>
        </head>
        <body style="font-family: sans-serif; padding: 12px; margin: 0;">
          ${htmlFile?.code || ""}
          <script>${jsFile?.code || ""}<\/script>
        </body>
      </html>
    `;

    return (
      <div className="space-y-2">
        <div className="rounded-xl border bg-muted/20 overflow-hidden shadow-xs">
          {/* File Tabs Bar */}
          <div className="flex items-center justify-between px-2 py-1.5 border-b bg-muted/40 gap-2 flex-wrap">
            <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-0.5">
              {files.map((file, idx) => {
                const isActive = (files[activeFileIdx] ? activeFileIdx : 0) === idx;
                const lang = detectLanguage(file.name);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setActiveFileIdx(idx);
                      setShowLivePreview(false);
                    }}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-medium border transition-colors flex items-center gap-1.5 shrink-0 ${
                      isActive && !showLivePreview
                        ? "bg-background text-primary border-border shadow-xs"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    }`}
                  >
                    <FileCode className="h-3.5 w-3.5 text-primary" />
                    <span>{file.name}</span>
                    <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-muted text-muted-foreground font-sans">
                      {lang}
                    </span>
                  </button>
                );
              })}

              {htmlFile && (
                <button
                  type="button"
                  onClick={() => setShowLivePreview(!showLivePreview)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors flex items-center gap-1 shrink-0 ${
                    showLivePreview
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "border-border text-primary hover:bg-primary/10 bg-background"
                  }`}
                >
                  <Play className="h-3 w-3" />
                  <span>Превью</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <Button
                size="xs"
                variant="ghost"
                className="h-6 text-[10px] gap-1 px-2 font-medium"
                onClick={() => handleCopyFile(currentFile.code)}
              >
                {copiedFile ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
                {copiedFile ? "Скопировано!" : "Копировать"}
              </Button>
              <Button
                size="xs"
                variant="outline"
                disabled={isZipping}
                className="h-6 text-[10px] gap-1 px-2 font-medium border-primary/30 text-primary hover:bg-primary/10"
                onClick={() => handleDownloadZip(files)}
              >
                <Download className="h-3 w-3" />
                {isZipping ? "Архивация..." : "Скачать ZIP"}
              </Button>
            </div>
          </div>

          {/* Code Body with Syntax Highlighting or Live Preview */}
          {showLivePreview ? (
            <div className="p-2 bg-white rounded-b-xl min-h-[220px]">
              <iframe
                title="live-preview"
                srcDoc={combinedHtml}
                className="w-full h-[260px] border-0 rounded"
                sandbox="allow-scripts"
              />
            </div>
          ) : (
            <CodeViewer
              code={currentFile.code}
              fileName={currentFile.name}
              maxHeight="320px"
              showLineNumbers={true}
            />
          )}
        </div>

        {parsed.note && (
          <div className="p-2.5 rounded-lg bg-muted/40 text-[11px] text-foreground italic flex items-start gap-1.5">
            <MessageSquare className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
            <span>«{parsed.note}»</span>
          </div>
        )}
      </div>
    );
  }

  // Fallback for regular text comment
  return (
    <div>
      {submission.comment && (
        <div className="p-2.5 rounded-lg bg-muted/40 text-[11px] text-foreground italic flex items-start gap-1.5">
          <MessageSquare className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
          <span>«{submission.comment}»</span>
        </div>
      )}
    </div>
  );
}
