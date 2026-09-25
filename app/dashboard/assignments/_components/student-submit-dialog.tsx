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
  Code,
  ExternalLink,
  MessageSquare,
  Sparkles,
  FileCode,
  Plus,
  Check,
  X,
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

export function StudentSubmitDialog({
  assignment,
  onClose,
  onSubmitSuccess,
}: StudentSubmitDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [submitMode, setSubmitMode] = useState<"code" | "url">("code");
  const [submitFileUrl, setSubmitFileUrl] = useState<string>("");
  const [submitComment, setSubmitComment] = useState<string>("");
  const [submitFiles, setSubmitFiles] = useState<SubmissionCodeFile[]>([
    { name: "index.html", code: "" },
    { name: "style.css", code: "" },
    { name: "script.js", code: "" },
  ]);
  const [activeSubmitFileIdx, setActiveSubmitFileIdx] = useState<number>(0);
  const [newFileNameInput, setNewFileNameInput] = useState<string>("");
  const [isAddingFile, setIsAddingFile] = useState<boolean>(false);

  useEffect(() => {
    if (!assignment) return;
    const existing = assignment.userSubmission;
    if (existing?.comment) {
      const parsed = parseSubmissionContent(existing.comment);
      if (parsed.type === "code" && parsed.files && parsed.files.length > 0) {
        setSubmitMode("code");
        setSubmitFiles(parsed.files);
        setSubmitComment(parsed.note || "");
        setActiveSubmitFileIdx(0);
      } else {
        setSubmitMode("url");
        setSubmitComment(parsed.note || existing.comment || "");
      }
    } else {
      setSubmitMode("code");
      setSubmitFiles([
        { name: "index.html", code: "" },
        { name: "style.css", code: "" },
        { name: "script.js", code: "" },
      ]);
      setSubmitComment("");
      setActiveSubmitFileIdx(0);
    }
    setSubmitFileUrl(existing?.fileUrl || "");
    setIsAddingFile(false);
    setNewFileNameInput("");
  }, [assignment]);

  const handleApplyTemplate = (templateType: "web" | "react" | "php" | "python") => {
    switch (templateType) {
      case "web":
        setSubmitFiles([
          {
            name: "index.html",
            code: '<!DOCTYPE html>\n<html lang="ru">\n<head>\n  <meta charset="UTF-8">\n  <title>Мой проект</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <h1>Привет, Лицей!</h1>\n  \n  <script src="script.js"></script>\n</body>\n</html>',
          },
          {
            name: "style.css",
            code: "/* Стили страницы */\n* {\n  box-sizing: border-box;\n}\n\nbody {\n  margin: 0;\n  padding: 20px;\n  font-family: sans-serif;\n}",
          },
          {
            name: "script.js",
            code: '// JavaScript логика\nconsole.log("Страница успешно загружена!");',
          },
        ]);
        break;
      case "react":
        setSubmitFiles([
          {
            name: "App.tsx",
            code: 'import React, { useState } from "react";\n\nexport default function App() {\n  const [count, setCount] = useState(0);\n\n  return (\n    <div className="p-4 space-y-3">\n      <h1 className="text-xl font-bold">React Приложение</h1>\n      <button onClick={() => setCount(c => c + 1)} className="px-3 py-1 bg-blue-500 text-white rounded">\n        Счетчик: {count}\n      </button>\n    </div>\n  );\n}',
          },
          {
            name: "types.ts",
            code: "export interface UserItem {\n  id: string;\n  name: string;\n  status: boolean;\n}",
          },
        ]);
        break;
      case "php":
        setSubmitFiles([
          {
            name: "index.php",
            code: '<?php\nrequire_once "db.php";\n\n$title = "Главная страница";\necho "<h1>" . htmlspecialchars($title) . "</h1>";\n?>',
          },
          {
            name: "db.php",
            code: '<?php\n// Настройки подключения к БД\n$host = "localhost";\n$dbname = "lms_db";\n$user = "root";\n$pass = "";\n\ntry {\n    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $pass);\n} catch (PDOException $e) {\n    die("Ошибка: " . $e->getMessage());\n}\n?>',
          },
        ]);
        break;
      case "python":
        setSubmitFiles([
          {
            name: "main.py",
            code: 'def main():\n    print("Программа запущена успешно!")\n    numbers = [1, 2, 3, 4, 5]\n    squared = [x**2 for x in numbers]\n    print("Результат обработки:", squared)\n\nif __name__ == "__main__":\n    main()',
          },
        ]);
        break;
    }
    setActiveSubmitFileIdx(0);
    toast.add({ title: "Шаблон файлов применён", type: "success" });
  };

  const handleAddNewFile = () => {
    const trimmed = newFileNameInput.trim();
    if (!trimmed) {
      toast.add({
        title: "Укажите имя файла (например: App.tsx или style.css)",
        type: "error",
      });
      return;
    }
    if (submitFiles.some((f) => f.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.add({ title: "Файл с таким именем уже существует", type: "error" });
      return;
    }
    setSubmitFiles((prev) => [...prev, { name: trimmed, code: "" }]);
    setActiveSubmitFileIdx(submitFiles.length);
    setNewFileNameInput("");
    setIsAddingFile(false);
  };

  const handleRemoveFile = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (submitFiles.length <= 1) {
      toast.add({ title: "Должен остаться хотя бы один файл", type: "error" });
      return;
    }
    setSubmitFiles((prev) => prev.filter((_, i) => i !== idx));
    if (activeSubmitFileIdx >= idx) {
      setActiveSubmitFileIdx(Math.max(0, activeSubmitFileIdx - 1));
    }
  };

  const handleUpdateCurrentFileCode = (newCode: string) => {
    setSubmitFiles((prev) => {
      const copy = [...prev];
      if (copy[activeSubmitFileIdx]) {
        copy[activeSubmitFileIdx] = { ...copy[activeSubmitFileIdx], code: newCode };
      }
      return copy;
    });
  };

  const handleStudentSubmit = () => {
    if (!assignment) return;

    let payloadComment = submitComment;

    if (submitMode === "code") {
      const validFiles = submitFiles.filter((f) => f.name.trim() && f.code.trim());
      if (validFiles.length === 0 && !submitFileUrl.trim() && !submitComment.trim()) {
        toast.add({
          title: "Напишите или вставьте код хотя бы в один файл",
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
          title: "Укажите ссылку на выполненное задание или напишите комментарий",
          type: "error",
        });
        return;
      }
    }

    startTransition(async () => {
      const res = await submitAssignmentAction({
        assignmentId: assignment.id,
        fileUrl: submitFileUrl,
        comment: payloadComment,
      });

      if (res.success) {
        toast.add({ title: "Решение успешно отправлено на проверку!", type: "success" });
        onSubmitSuccess();
        onClose();
      } else {
        toast.add({ title: res.error || "Не удалось отправить решение", type: "error" });
      }
    });
  };

  return (
    <Dialog open={assignment !== null} onOpenChange={(open) => !open && onClose()}>
      {assignment && (
        <DialogContent className="p-4 gap-3 text-xs sm:max-w-[1100px] w-[94vw] max-h-[92vh] flex flex-col">
          <DialogHeader className="pb-2 border-b gap-1 place-items-start text-left shrink-0">
            <Badge
              variant="outline"
              className="text-[10px] border-primary/30 text-primary bg-primary/5 font-medium"
            >
              {assignment.subjectName}
            </Badge>
            <DialogTitle className="text-sm font-bold text-foreground">
              Сдача решения: {assignment.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Добавьте код проекта по файлам (HTML, CSS, JS, PHP, React, TS, Python) или прикрепите внешнюю ссылку
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-1 text-xs overflow-y-auto flex-1 min-h-0 pr-1">
            {/* Show teacher's previous feedback to student when resubmitting */}
            {assignment?.userSubmission?.teacherComment && (
              <div className="p-3 rounded-xl border border-primary/20 bg-primary/5 space-y-1">
                <div className="text-[10px] font-semibold text-primary flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5" /> Замечания преподавателя:
                </div>
                <p className="text-xs text-foreground leading-relaxed">
                  {assignment.userSubmission.teacherComment}
                </p>
                {assignment.userSubmission.reviewedAt && (
                  <p className="text-[10px] text-muted-foreground">
                    Проверено: {new Date(assignment.userSubmission.reviewedAt).toLocaleString("ru-RU")}
                  </p>
                )}
              </div>
            )}

            {/* Mode Toggle */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-muted/60 rounded-lg border text-xs">
              <button
                type="button"
                onClick={() => setSubmitMode("code")}
                className={`py-1.5 px-3 rounded-md text-xs font-medium border transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                  submitMode === "code"
                    ? "bg-background text-primary border-border shadow-xs"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Code className="h-3.5 w-3.5" /> Редактор кода (Файлы)
              </button>
              <button
                type="button"
                onClick={() => setSubmitMode("url")}
                className={`py-1.5 px-3 rounded-md text-xs font-medium border transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                  submitMode === "url"
                    ? "bg-background text-primary border-border shadow-xs"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <ExternalLink className="h-3.5 w-3.5" /> Ссылка (GitHub / Drive)
              </button>
            </div>

            {/* Code Mode */}
            {submitMode === "code" && (
              <div className="space-y-2.5">
                {/* Template Presets Bar */}
                <div className="flex items-center justify-between gap-2 flex-wrap text-[11px]">
                  <span className="text-muted-foreground font-medium flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-primary" /> Быстрые шаблоны:
                  </span>
                  <div className="flex items-center gap-1 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleApplyTemplate("web")}
                      className="px-2 py-0.5 rounded-md border bg-muted/30 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors text-[10px] font-medium cursor-pointer"
                    >
                      HTML/CSS/JS
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyTemplate("react")}
                      className="px-2 py-0.5 rounded-md border bg-muted/30 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors text-[10px] font-medium cursor-pointer"
                    >
                      React (TSX)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyTemplate("php")}
                      className="px-2 py-0.5 rounded-md border bg-muted/30 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors text-[10px] font-medium cursor-pointer"
                    >
                      PHP + SQL
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyTemplate("python")}
                      className="px-2 py-0.5 rounded-md border bg-muted/30 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors text-[10px] font-medium cursor-pointer"
                    >
                      Python
                    </button>
                  </div>
                </div>

                {/* Multi-file Editor Container */}
                <div className="border rounded-xl bg-card overflow-hidden shadow-xs space-y-0">
                  {/* Tabs Header */}
                  <div className="flex items-center justify-between px-2 py-1.5 border-b bg-muted/40 gap-2 flex-wrap">
                    <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-0.5">
                      {submitFiles.map((file, idx) => {
                        const isActive = activeSubmitFileIdx === idx;
                        const lang = detectLanguage(file.name);
                        return (
                          <div
                            key={idx}
                            onClick={() => setActiveSubmitFileIdx(idx)}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-medium border transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
                              isActive
                                ? "bg-background text-primary border-border shadow-xs"
                                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/60"
                            }`}
                          >
                            <FileCode className="h-3 w-3 text-primary" />
                            <span>{file.name}</span>
                            <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-muted text-muted-foreground font-sans">
                              {lang}
                            </span>
                            {submitFiles.length > 1 && (
                              <button
                                type="button"
                                onClick={(e) => handleRemoveFile(idx, e)}
                                className="text-muted-foreground hover:text-destructive p-0.5 rounded transition-colors ml-0.5 cursor-pointer"
                                title="Удалить файл"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        );
                      })}

                      {/* Add File Button / Popover Input */}
                      {isAddingFile ? (
                        <div className="flex items-center gap-1 shrink-0 bg-background border rounded-md px-1.5 py-0.5">
                          <Input
                            autoFocus
                            placeholder="App.tsx, api.php..."
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
                            className="h-6 text-[10px] w-28 px-1 py-0 font-mono"
                          />
                          <Button
                            size="xs"
                            variant="ghost"
                            className="h-5 px-1.5 text-[10px]"
                            onClick={handleAddNewFile}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            size="xs"
                            variant="ghost"
                            className="h-5 px-1.5 text-[10px]"
                            onClick={() => setIsAddingFile(false)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          size="xs"
                          variant="outline"
                          onClick={() => setIsAddingFile(true)}
                          className="h-6 text-[10px] gap-1 px-2 font-medium shrink-0 cursor-pointer"
                        >
                          <Plus className="h-3 w-3" /> Файл
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Syntax-Highlighted Code Editor */}
                  <CodeEditor
                    value={submitFiles[activeSubmitFileIdx]?.code || ""}
                    onChange={handleUpdateCurrentFileCode}
                    fileName={submitFiles[activeSubmitFileIdx]?.name || "index.html"}
                    placeholder={`// Вставьте или напишите код для файла ${submitFiles[activeSubmitFileIdx]?.name || ""}...`}
                    minHeight="260px"
                    maxHeight="460px"
                  />
                </div>

                {/* Optional Note & External URL */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div className="space-y-1">
                    <label className="font-medium text-foreground text-xs">
                      Пояснение к коду (необязательно)
                    </label>
                    <Input
                      placeholder="Например: Добавил анимацию и адаптив..."
                      value={submitComment}
                      onChange={(e) => setSubmitComment(e.target.value)}
                      className="h-8 text-xs bg-background"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-medium text-foreground text-xs">
                      Ссылка на GitHub / Demo (необязательно)
                    </label>
                    <Input
                      placeholder="https://github.com/..."
                      value={submitFileUrl}
                      onChange={(e) => setSubmitFileUrl(e.target.value)}
                      className="h-8 text-xs bg-background font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* URL Mode */}
            {submitMode === "url" && (
              <div className="space-y-2.5">
                <div className="space-y-1">
                  <label className="font-medium text-foreground text-xs">
                    Ссылка на выполненную работу (URL) *
                  </label>
                  <Input
                    placeholder="https://github.com/username/project или ссылка на Figma/Диск"
                    value={submitFileUrl}
                    onChange={(e) => setSubmitFileUrl(e.target.value)}
                    className="h-8 text-xs bg-background font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-foreground text-xs">
                    Комментарий к решению (опционально)
                  </label>
                  <Textarea
                    placeholder="Опишите особенности выполнения задания или вопросы преподавателю..."
                    value={submitComment}
                    onChange={(e) => setSubmitComment(e.target.value)}
                    className="text-xs bg-background min-h-[90px]"
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
            <Button variant="outline" size="xs" onClick={onClose}>
              Отмена
            </Button>
            <Button size="xs" disabled={isPending} onClick={handleStudentSubmit}>
              {isPending ? "Отправка..." : "Отправить решение"}
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}
