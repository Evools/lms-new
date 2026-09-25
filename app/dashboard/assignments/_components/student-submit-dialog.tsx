"use client";

import React, { useState, useEffect, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Link2,
  MessageSquare,
  FileCode,
  Plus,
  Check,
  Copy,
  Clock,
  Send,
  RotateCcw,
  RotateCw,
  Code2,
  Globe,
  FolderOpen,
  Trash2,
} from "lucide-react";
import { AssignmentDTO, submitAssignmentAction } from "../actions";
import { CodeEditor } from "@/components/ui/code-highlighter";
import {
  detectLanguage,
  parseSubmissionContent,
  SubmissionCodeFile,
} from "./submission-utils";

interface StudentSubmitDialogProps {
  assignment: AssignmentDTO | null;
  onClose: () => void;
  onSubmitSuccess: () => void;
}

const DEFAULT_WEB_FILES: SubmissionCodeFile[] = [
  {
    name: "index.html",
    code: `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Мой проект</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="container">
    <h1>Практическая работа</h1>
    <p>Решение задания...</p>
    <button id="btn">Нажать</button>
  </div>

  <script src="script.js"></script>
</body>
</html>`,
  },
  {
    name: "style.css",
    code: `/* Стили проекта */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: system-ui, sans-serif;
  background: #f8fafc;
  color: #0f172a;
  padding: 24px;
}

.container {
  max-width: 540px;
  margin: 0 auto;
  background: #ffffff;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

button {
  margin-top: 12px;
  padding: 8px 16px;
  background: #0284c7;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}`,
  },
  {
    name: "script.js",
    code: `// Скрипты проекта
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("btn");
  if (btn) {
    btn.addEventListener("click", () => {
      alert("Скрипт выполнен успешно!");
    });
  }
});`,
  },
];

export function StudentSubmitDialog({
  assignment,
  onClose,
  onSubmitSuccess,
}: StudentSubmitDialogProps) {
  const [isPending, startTransition] = useTransition();

  // Mode: "link" (Priority 1) or "code" (Priority 2)
  const [submissionMode, setSubmissionMode] = useState<"link" | "code">("link");
  const [activeCodeTab, setActiveCodeTab] = useState<"editor" | "preview">("editor");

  const [submitFileUrl, setSubmitFileUrl] = useState<string>("");
  const [submitComment, setSubmitComment] = useState<string>("");

  const [submitFiles, setSubmitFiles] = useState<SubmissionCodeFile[]>(DEFAULT_WEB_FILES);
  const [activeFileIdx, setActiveFileIdx] = useState<number>(0);
  const [copiedCurrentCode, setCopiedCurrentCode] = useState<boolean>(false);
  const [previewKey, setPreviewKey] = useState<number>(0);

  const [isAddingFile, setIsAddingFile] = useState<boolean>(false);
  const [newFileNameInput, setNewFileNameInput] = useState<string>("");

  useEffect(() => {
    if (!assignment) return;
    const existing = assignment.userSubmission;

    if (existing?.comment) {
      const parsed = parseSubmissionContent(existing.comment);
      if (parsed.type === "code" && parsed.files && parsed.files.length > 0) {
        setSubmissionMode("code");
        setSubmitFiles(parsed.files);
        setSubmitComment(parsed.note || "");
        setActiveFileIdx(0);
      } else {
        setSubmissionMode("link");
        setSubmitComment(parsed.note || existing.comment || "");
      }
    } else if (existing?.fileUrl) {
      setSubmissionMode("link");
      setSubmitComment("");
    } else {
      // Default priority: link submission
      setSubmissionMode("link");
      setSubmitFiles(DEFAULT_WEB_FILES);
      setSubmitComment("");
      setActiveFileIdx(0);
    }

    setSubmitFileUrl(existing?.fileUrl || "");
    setActiveCodeTab("editor");
    setIsAddingFile(false);
    setNewFileNameInput("");
  }, [assignment]);

  const handleAddNewFile = () => {
    const trimmed = newFileNameInput.trim();
    if (!trimmed) {
      toast.add({
        title: "Введите имя файла (например: script.js или styles.css)",
        type: "error",
      });
      return;
    }
    if (submitFiles.some((f) => f.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.add({ title: "Файл с таким именем уже существует", type: "error" });
      return;
    }
    const updated = [...submitFiles, { name: trimmed, code: "" }];
    setSubmitFiles(updated);
    setActiveFileIdx(updated.length - 1);
    setNewFileNameInput("");
    setIsAddingFile(false);
    toast.add({ title: `Файл ${trimmed} создан`, type: "success" });
  };

  const handleRemoveFile = (idx: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (submitFiles.length <= 1) {
      toast.add({ title: "В проекте должен оставаться хотя бы один файл", type: "error" });
      return;
    }
    const fileName = submitFiles[idx]?.name;
    setSubmitFiles((prev) => prev.filter((_, i) => i !== idx));
    if (activeFileIdx >= idx) {
      setActiveFileIdx(Math.max(0, activeFileIdx - 1));
    }
    toast.add({ title: `Файл ${fileName} удален`, type: "default" });
  };

  const handleUpdateCurrentCode = (newCode: string) => {
    setSubmitFiles((prev) => {
      const copy = [...prev];
      if (copy[activeFileIdx]) {
        copy[activeFileIdx] = { ...copy[activeFileIdx], code: newCode };
      }
      return copy;
    });
  };

  const handleCopyCurrentFile = () => {
    const currentCode = submitFiles[activeFileIdx]?.code || "";
    navigator.clipboard.writeText(currentCode);
    setCopiedCurrentCode(true);
    toast.add({ title: "Код текущего файла скопирован", type: "success" });
    setTimeout(() => setCopiedCurrentCode(false), 2000);
  };

  const handleStudentSubmit = () => {
    if (!assignment) return;

    let payloadComment = submitComment.trim();
    let finalFileUrl: string | undefined = undefined;

    if (submissionMode === "code") {
      const validFiles = submitFiles.filter((f) => f.name && f.code.trim());
      if (validFiles.length === 0 && !submitComment.trim()) {
        toast.add({
          title: "Напишите код решения или добавьте пояснение",
          type: "error",
        });
        return;
      }
      payloadComment = JSON.stringify({
        type: "code",
        files: validFiles.length > 0 ? validFiles : submitFiles,
        note: submitComment.trim(),
      });
    } else {
      if (!submitFileUrl.trim() && !submitComment.trim()) {
        toast.add({
          title: "Укажите ссылку на выполненную работу или комментарий",
          type: "error",
        });
        return;
      }
      finalFileUrl = submitFileUrl.trim() || undefined;
    }

    startTransition(async () => {
      const res = await submitAssignmentAction({
        assignmentId: assignment.id,
        fileUrl: finalFileUrl,
        comment: payloadComment || undefined,
      });

      if (res.success) {
        toast.add({
          title: "Решение успешно отправлено на проверку!",
          type: "success",
        });
        onSubmitSuccess();
        onClose();
      } else {
        toast.add({
          title: res.error || "Не удалось отправить решение",
          type: "error",
        });
      }
    });
  };

  const currentFile =
    submitFiles[activeFileIdx] || submitFiles[0] || { name: "index.html", code: "" };
  const htmlFile = submitFiles.find(
    (f) => f.name && (f.name.endsWith(".html") || f.name.endsWith(".htm"))
  );
  const cssFile = submitFiles.find((f) => f.name && f.name.endsWith(".css"));
  const jsFile = submitFiles.find((f) => f.name && f.name.endsWith(".js"));

  const combinedHtmlPreview = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>${cssFile?.code || ""}</style>
      </head>
      <body style="padding: 16px; font-family: system-ui, sans-serif; margin: 0; background: #ffffff;">
        ${htmlFile?.code || ""}
        <script>${jsFile?.code || ""}<\/script>
      </body>
    </html>
  `;

  const isResubmission = Boolean(assignment?.userSubmission);
  const currentCodeLines = (currentFile.code || "").split("\n").length;
  const currentCodeChars = (currentFile.code || "").length;

  return (
    <Dialog open={assignment !== null} onOpenChange={(open) => !open && onClose()}>
      {assignment && (
        <DialogContent
          className={`p-4 sm:p-5 gap-3 text-xs w-[96vw] max-h-[94vh] flex flex-col transition-all duration-200 ${
            submissionMode === "code"
              ? "sm:max-w-[1040px] h-[92vh]"
              : "sm:max-w-[580px]"
          }`}
        >
          {/* Dialog Header with Right Margin for Close Button */}
          <DialogHeader className="pb-2 border-b gap-1 place-items-start text-left shrink-0 pr-10">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className="text-[10px] border-primary/30 text-primary bg-primary/5 font-medium"
              >
                {assignment.subjectName}
              </Badge>
              {assignment.dueDate && (
                <Badge variant="secondary" className="text-[10px] gap-1 shrink-0 font-normal">
                  <Clock className="h-3 w-3 text-primary" />
                  Срок: {new Date(assignment.dueDate).toLocaleDateString("ru-RU")}
                </Badge>
              )}
            </div>

            <DialogTitle className="text-sm font-bold text-foreground pt-0.5">
              {isResubmission ? "Повторная сдача решения" : "Сдача домашнего задания"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground line-clamp-1">
              {assignment.title}
            </DialogDescription>
          </DialogHeader>

          {/* Teacher Remarks Alert */}
          {assignment.userSubmission?.teacherComment && (
            <div className="p-2.5 rounded-xl border border-primary/25 bg-primary/5 space-y-1 shrink-0">
              <div className="text-[11px] font-semibold text-primary flex items-center gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" /> Замечания преподавателя на доработку:
              </div>
              <p className="text-xs text-foreground leading-relaxed">
                {assignment.userSubmission.teacherComment}
              </p>
            </div>
          )}

          {/* Primary Mode Switcher: Link (Priority 1) vs Code IDE (Priority 2) */}
          <div className="flex items-center justify-between gap-2 border-b pb-2 shrink-0">
            <div className="inline-flex items-center p-0.5 bg-muted/60 rounded-lg border text-xs">
              <button
                type="button"
                onClick={() => setSubmissionMode("link")}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                  submissionMode === "link"
                    ? "bg-background text-primary shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Link2 className="h-3.5 w-3.5" /> Отправить ссылку
              </button>
              <button
                type="button"
                onClick={() => setSubmissionMode("code")}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                  submissionMode === "code"
                    ? "bg-background text-primary shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Code2 className="h-3.5 w-3.5" /> Встроенный код (IDE)
              </button>
            </div>

            {submissionMode === "code" && (
              <div className="inline-flex items-center p-0.5 bg-muted/40 rounded-lg border text-xs">
                <button
                  type="button"
                  onClick={() => setActiveCodeTab("editor")}
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium transition-all flex items-center gap-1 cursor-pointer ${
                    activeCodeTab === "editor"
                      ? "bg-background text-primary shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Code2 className="h-3 w-3" /> Редактор
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCodeTab("preview")}
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium transition-all flex items-center gap-1 cursor-pointer ${
                    activeCodeTab === "preview"
                      ? "bg-background text-primary shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Globe className="h-3 w-3" /> Превью
                </button>
              </div>
            )}
          </div>

          {/* Body Content */}
          <div className="flex-1 min-h-0 flex flex-col space-y-2.5 overflow-y-auto pr-1">
            {/* MODE 1 (PRIORITY): DIRECT EXTERNAL LINK SUBMISSION */}
            {submissionMode === "link" && (
              <div className="space-y-3.5 py-2">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                    <Link2 className="h-3.5 w-3.5 text-primary" /> Ссылка на выполненную работу (URL) *
                  </label>
                  <Input
                    placeholder="https://github.com/username/project или ссылка на Figma / Google Drive"
                    value={submitFileUrl}
                    onChange={(e) => setSubmitFileUrl(e.target.value)}
                    className="h-8 text-xs bg-background font-mono"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Укажите публичную ссылку на репозиторий GitHub, макет Figma или облачный диск
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5 text-primary" /> Комментарий к решению (опционально)
                  </label>
                  <Textarea
                    placeholder="Опишите, как выполнили задание, что получилось или задайте вопрос преподавателю..."
                    value={submitComment}
                    onChange={(e) => setSubmitComment(e.target.value)}
                    className="text-xs bg-background min-h-[140px] resize-none"
                  />
                </div>
              </div>
            )}

            {/* MODE 2: CODE IDE */}
            {submissionMode === "code" && (
              <>
                {/* SUBTAB 2.1: Code Editor & Sidebar */}
                {activeCodeTab === "editor" && (
                  <div className="flex-1 min-h-0 flex flex-col space-y-2">
                    {/* 2-Column Spacious IDE Layout: Sidebar Files + Code Editor */}
                    <div className="border border-border/80 rounded-xl bg-card overflow-hidden shadow-xs flex flex-col sm:flex-row flex-1 min-h-[380px]">
                      {/* LEFT SIDEBAR: File Explorer & File Creation */}
                      <div className="sm:w-56 w-full border-b sm:border-b-0 sm:border-r border-border/80 bg-muted/20 flex flex-col shrink-0">
                        {/* Sidebar Header */}
                        <div className="p-2.5 border-b bg-muted/40 flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-semibold text-[11px] text-foreground">
                            <FolderOpen className="h-3.5 w-3.5 text-primary" />
                            <span>Файлы проекта ({submitFiles.length})</span>
                          </div>
                        </div>

                        {/* Files List */}
                        <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5 min-h-0">
                          {submitFiles.map((file, idx) => {
                            const isActive = activeFileIdx === idx;
                            const lang = detectLanguage(file.name);
                            return (
                              <div
                                key={idx}
                                onClick={() => setActiveFileIdx(idx)}
                                className={`group px-2.5 py-1.5 rounded-md text-[11px] font-mono font-medium transition-colors flex items-center justify-between cursor-pointer ${
                                  isActive
                                    ? "bg-primary/10 text-primary border border-primary/30"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-transparent"
                                }`}
                              >
                                <div className="flex items-center gap-1.5 min-w-0 truncate">
                                  <FileCode className="h-3.5 w-3.5 shrink-0 text-primary" />
                                  <span className="truncate">{file.name}</span>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  <span className="text-[8px] uppercase px-1 py-0.2 rounded bg-muted text-muted-foreground font-sans font-medium">
                                    {lang}
                                  </span>
                                  {submitFiles.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={(e) => handleRemoveFile(idx, e)}
                                      className="opacity-0 group-hover:opacity-100 hover:text-destructive p-0.5 rounded transition-opacity"
                                      title="Удалить файл"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Dedicated Create File Section */}
                        <div className="p-2 border-t bg-muted/30">
                          {isAddingFile ? (
                            <div className="space-y-1.5">
                              <Input
                                autoFocus
                                placeholder="script.js, style.css..."
                                value={newFileNameInput}
                                onChange={(e) => setNewFileNameInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleAddNewFile();
                                  } else if (e.key === "Escape") {
                                    setIsAddingFile(false);
                                  }
                                }}
                                className="h-7 text-[11px] px-2 py-0 font-mono bg-background"
                              />
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  size="xs"
                                  variant="outline"
                                  className="h-5 px-2 text-[10px]"
                                  onClick={() => setIsAddingFile(false)}
                                >
                                  Отмена
                                </Button>
                                <Button
                                  size="xs"
                                  className="h-5 px-2 text-[10px]"
                                  onClick={handleAddNewFile}
                                >
                                  <Check className="h-3 w-3 mr-0.5" /> Создать
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              type="button"
                              size="xs"
                              variant="outline"
                              onClick={() => setIsAddingFile(true)}
                              className="w-full h-7 text-[11px] gap-1 font-medium bg-background hover:bg-muted"
                            >
                              <Plus className="h-3.5 w-3.5 text-primary" /> Новый файл
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* RIGHT COLUMN: Code Editor */}
                      <div className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e]">
                        {/* Editor Header Bar */}
                        <div className="flex items-center justify-between px-3 py-1.5 bg-[#252526] border-b border-zinc-800 text-zinc-300">
                          <div className="flex items-center gap-2 min-w-0 truncate">
                            <FileCode className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                            <span className="font-mono text-xs font-semibold text-white truncate">
                              {currentFile.name}
                            </span>
                            <span className="text-[10px] uppercase text-zinc-500 font-sans">
                              ({detectLanguage(currentFile.name)})
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              size="xs"
                              variant="ghost"
                              className="h-6 text-[10px] gap-1 px-2 font-medium text-zinc-400 hover:text-white hover:bg-zinc-800"
                              onClick={handleCopyCurrentFile}
                            >
                              {copiedCurrentCode ? (
                                <Check className="h-3 w-3 text-sky-400" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                              <span>{copiedCurrentCode ? "Скопировано" : "Копировать"}</span>
                            </Button>
                          </div>
                        </div>

                        {/* Code Editor */}
                        <div className="flex-1 min-h-0 relative">
                          <CodeEditor
                            value={currentFile.code || ""}
                            onChange={handleUpdateCurrentCode}
                            fileName={currentFile.name || "index.html"}
                            placeholder={`// Напишите или вставьте код для файла ${currentFile.name}...`}
                            height="100%"
                          />
                        </div>

                        {/* Editor Footer Status Bar */}
                        <div className="flex items-center justify-between px-3 py-1 bg-[#181818] border-t border-zinc-800 text-[10px] text-zinc-400 font-mono select-none">
                          <div className="flex items-center gap-2">
                            <span>Строк: {currentCodeLines}</span>
                            <span>•</span>
                            <span>Символов: {currentCodeChars}</span>
                          </div>
                          <span className="uppercase text-sky-400 font-medium">UTF-8</span>
                        </div>
                      </div>
                    </div>

                    {/* Only Note / Comment Field for Code Mode */}
                    <div className="space-y-1 pt-0.5 shrink-0">
                      <label className="font-medium text-muted-foreground text-[11px] flex items-center gap-1">
                        <MessageSquare className="h-3 w-3 text-primary" /> Пояснение к решению (опционально)
                      </label>
                      <Input
                        placeholder="Краткое описание выполненной работы или комментарий преподавателю..."
                        value={submitComment}
                        onChange={(e) => setSubmitComment(e.target.value)}
                        className="h-7 text-xs bg-background"
                      />
                    </div>
                  </div>
                )}

                {/* SUBTAB 2.2: Live Browser Preview */}
                {activeCodeTab === "preview" && (
                  <div className="flex-1 min-h-0 flex flex-col space-y-2">
                    <div className="border border-border/80 rounded-xl bg-card overflow-hidden shadow-xs flex-1 min-h-[380px] flex flex-col">
                      {/* Browser Mockup Header */}
                      <div className="flex items-center justify-between px-3 py-1.5 border-b bg-muted/40 gap-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-rose-400/80" />
                          <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
                        </div>

                        <div className="flex-1 max-w-sm mx-auto flex items-center gap-1.5 px-2 py-0.5 bg-background border rounded-md text-[11px] text-muted-foreground font-mono">
                          <Globe className="h-3 w-3 text-primary shrink-0" />
                          <span className="truncate">http://localhost:3000/preview.html</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            size="xs"
                            variant="ghost"
                            className="h-6 text-[10px] gap-1 px-2 font-medium"
                            onClick={() => {
                              setPreviewKey((k) => k + 1);
                              toast.add({ title: "Превью обновлено", type: "default" });
                            }}
                          >
                            <RotateCw className="h-3 w-3" />
                            <span>Обновить</span>
                          </Button>
                        </div>
                      </div>

                      {/* Browser Frame */}
                      <div className="flex-1 bg-white p-2 relative overflow-hidden">
                        {htmlFile ? (
                          <iframe
                            key={previewKey}
                            title="submission-live-preview"
                            srcDoc={combinedHtmlPreview}
                            className="w-full h-full border-0 rounded bg-white"
                            sandbox="allow-scripts"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-center p-4 text-muted-foreground space-y-2">
                            <FileCode className="h-8 w-8 text-primary opacity-60" />
                            <p className="text-xs font-medium text-foreground">
                              Нет HTML-файла для живого веб-превью
                            </p>
                            <p className="text-[11px]">
                              Для интерактивного просмотра добавьте файл с расширением <code className="bg-muted px-1 rounded">index.html</code> во вкладке «Редактор».
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Info Note under Preview */}
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1 shrink-0">
                      <span>Живое исполнение HTML, CSS и JavaScript в изолированной песочнице</span>
                      <button
                        type="button"
                        onClick={() => setActiveCodeTab("editor")}
                        className="text-primary hover:underline font-medium"
                      >
                        ← Вернуться к редактору
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Dialog Footer */}
          <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-0 shrink-0">
            <Button variant="outline" size="xs" onClick={onClose} className="h-7 text-xs">
              Отмена
            </Button>
            <Button
              size="xs"
              disabled={isPending}
              onClick={handleStudentSubmit}
              className="h-7 text-xs gap-1.5 font-medium px-3"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{isPending ? "Отправка..." : isResubmission ? "Отправить на проверку" : "Сдать задание"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}
