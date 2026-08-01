"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  ChevronLeft,
  FileCheck2,
  Building2,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Clock,
  HelpCircle,
  PlusCircle,
  Eye,
  Award,
  Copy,
  Check,
  CheckSquare,
  CircleDot,
  Type,
  ToggleLeft,
  Shuffle,
} from "lucide-react";
import { GroupItemDTO, GroupSubjectDTO, createTestAction } from "../../../actions";

interface CreateTestViewProps {
  groups: GroupItemDTO[];
  subjects: GroupSubjectDTO[];
  topics: Array<{ id: string; title: string }>;
  selectedGroupId: string;
  selectedTopicId: string;
}

export type QuestionType = "SINGLE" | "MULTIPLE" | "TEXT" | "TRUE_FALSE";

export interface QuestionDraft {
  type: QuestionType;
  questionText: string;
  options: string[];
  correctAnswer: string; // JSON string for MULTIPLE, plain string for SINGLE/TEXT/TRUE_FALSE
  points: number;
}

export function CreateTestView({
  groups,
  subjects,
  topics,
  selectedGroupId,
  selectedTopicId,
}: CreateTestViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [groupId, setGroupId] = useState(selectedGroupId);
  const [groupSubjectId, setGroupSubjectId] = useState(subjects[0]?.id || "");
  const [topicId, setTopicId] = useState(selectedTopicId || "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timeLimit, setTimeLimit] = useState<number | "">(15);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleOptions, setShuffleOptions] = useState(false);

  const [isPreview, setIsPreview] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [questionDrafts, setQuestionDrafts] = useState<QuestionDraft[]>([
    {
      type: "SINGLE",
      questionText: "Какой метод протокола HTTP используется для создания нового ресурса на сервере?",
      options: ["GET", "POST", "PUT", "DELETE"],
      correctAnswer: "POST",
      points: 1,
    },
    {
      type: "MULTIPLE",
      questionText: "Выберите все валидные форматы передачи данных в веб-приложениях:",
      options: ["JSON", "XML", "YAML", "MP3"],
      correctAnswer: JSON.stringify(["JSON", "XML", "YAML"]),
      points: 2,
    },
  ]);

  const handleGroupChange = (val: string) => {
    setGroupId(val);
    router.push(`/dashboard/lms/tests/new?group=${val}`);
  };

  const handleAddQuestion = () => {
    setQuestionDrafts((prev) => [
      ...prev,
      {
        type: "SINGLE",
        questionText: "",
        options: ["Вариант 1", "Вариант 2", "Вариант 3", "Вариант 4"],
        correctAnswer: "Вариант 1",
        points: 1,
      },
    ]);
  };

  const handleDuplicateQuestion = (idx: number) => {
    setQuestionDrafts((prev) => {
      const copy = prev.map((q) => ({ ...q, options: [...q.options] }));
      const target = copy[idx];
      copy.splice(idx + 1, 0, {
        ...target,
        options: [...target.options],
      });
      return copy;
    });
  };

  const handleRemoveQuestion = (idx: number) => {
    if (questionDrafts.length === 1) return;
    setQuestionDrafts((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateQuestionType = (qIdx: number, newType: QuestionType) => {
    setQuestionDrafts((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;

        const updated: QuestionDraft = { ...q, type: newType, options: [...q.options] };

        if (newType === "TRUE_FALSE") {
          updated.options = ["Верно", "Неверно"];
          updated.correctAnswer = "Верно";
        } else if (newType === "TEXT") {
          updated.options = [];
          updated.correctAnswer = "";
        } else if (newType === "MULTIPLE") {
          if (updated.options.length === 0) {
            updated.options = ["Вариант 1", "Вариант 2", "Вариант 3", "Вариант 4"];
          }
          updated.correctAnswer = JSON.stringify([updated.options[0] || ""]);
        } else {
          // SINGLE
          if (updated.options.length === 0) {
            updated.options = ["Вариант 1", "Вариант 2", "Вариант 3", "Вариант 4"];
          }
          try {
            const parsed = JSON.parse(updated.correctAnswer);
            updated.correctAnswer = Array.isArray(parsed)
              ? parsed[0] || updated.options[0]
              : updated.correctAnswer || updated.options[0];
          } catch {
            if (!updated.options.includes(updated.correctAnswer)) {
              updated.correctAnswer = updated.options[0] || "";
            }
          }
        }

        return updated;
      })
    );
  };

  const handleUpdateQuestionText = (qIdx: number, text: string) => {
    setQuestionDrafts((prev) =>
      prev.map((q, i) => (i === qIdx ? { ...q, questionText: text } : q))
    );
  };

  const handleUpdateQuestionPoints = (qIdx: number, pts: number) => {
    setQuestionDrafts((prev) =>
      prev.map((q, i) => (i === qIdx ? { ...q, points: Math.max(1, pts) } : q))
    );
  };

  const handleUpdateOptionText = (qIdx: number, optIdx: number, text: string) => {
    setQuestionDrafts((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;

        const oldVal = q.options[optIdx];
        const newOptions = [...q.options];
        newOptions[optIdx] = text;

        let newCorrect = q.correctAnswer;

        if (q.type === "MULTIPLE") {
          try {
            let correctArr: string[] = JSON.parse(q.correctAnswer);
            if (Array.isArray(correctArr)) {
              correctArr = correctArr.map((item) => (item === oldVal ? text : item));
              newCorrect = JSON.stringify(correctArr);
            }
          } catch {
            // ignore
          }
        } else if (q.type === "SINGLE" || q.type === "TRUE_FALSE") {
          if (q.correctAnswer === oldVal) {
            newCorrect = text;
          }
        }

        return {
          ...q,
          options: newOptions,
          correctAnswer: newCorrect,
        };
      })
    );
  };

  const handleAddOption = (qIdx: number) => {
    setQuestionDrafts((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const newOptions = [...q.options, `Вариант ${q.options.length + 1}`];
        return {
          ...q,
          options: newOptions,
        };
      })
    );
  };

  const handleRemoveOption = (qIdx: number, optIdx: number) => {
    setQuestionDrafts((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx || q.options.length <= 2) return q;

        const removedOpt = q.options[optIdx];
        const newOptions = q.options.filter((_, oIdx) => oIdx !== optIdx);
        let newCorrect = q.correctAnswer;

        if (q.type === "MULTIPLE") {
          try {
            let correctArr: string[] = JSON.parse(q.correctAnswer);
            if (Array.isArray(correctArr)) {
              correctArr = correctArr.filter((item) => item !== removedOpt);
              if (correctArr.length === 0 && newOptions.length > 0) {
                correctArr = [newOptions[0]];
              }
              newCorrect = JSON.stringify(correctArr);
            }
          } catch {
            // ignore
          }
        } else {
          if (q.correctAnswer === removedOpt) {
            newCorrect = newOptions[0] || "";
          }
        }

        return {
          ...q,
          options: newOptions,
          correctAnswer: newCorrect,
        };
      })
    );
  };

  const handleToggleOptionCorrect = (qIdx: number, optText: string) => {
    setQuestionDrafts((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;

        let newCorrect = q.correctAnswer;

        if (q.type === "MULTIPLE") {
          let currentArr: string[] = [];
          try {
            currentArr = JSON.parse(q.correctAnswer);
            if (!Array.isArray(currentArr)) currentArr = [];
          } catch {
            currentArr = [];
          }

          if (currentArr.includes(optText)) {
            if (currentArr.length > 1) {
              currentArr = currentArr.filter((item) => item !== optText);
            }
          } else {
            currentArr.push(optText);
          }

          newCorrect = JSON.stringify(currentArr);
        } else {
          newCorrect = optText;
        }

        return {
          ...q,
          correctAnswer: newCorrect,
        };
      })
    );
  };

  const isOptionCorrect = (q: QuestionDraft, optText: string) => {
    if (q.type === "MULTIPLE") {
      try {
        const arr: string[] = JSON.parse(q.correctAnswer);
        return Array.isArray(arr) && arr.includes(optText);
      } catch {
        return false;
      }
    }
    return q.correctAnswer === optText;
  };

  const totalPoints = questionDrafts.reduce((acc, q) => acc + (q.points || 1), 0);

  const handleSubmit = () => {
    if (!groupSubjectId || !title.trim()) {
      setErrorMsg("Укажите дисциплину и название теста");
      return;
    }

    const invalidQ = questionDrafts.find((q) => {
      if (!q.questionText.trim()) return true;
      if (q.type === "TEXT") return !q.correctAnswer.trim();
      return !q.correctAnswer;
    });

    if (invalidQ) {
      setErrorMsg("Заполните тексты вопросов и выберите правильные ответы для всех вопросов");
      return;
    }

    setErrorMsg(null);
    startTransition(async () => {
      const res = await createTestAction({
        groupSubjectId,
        topicId: topicId || undefined,
        title,
        description,
        timeLimit: timeLimit ? Number(timeLimit) : undefined,
        shuffleQuestions,
        shuffleOptions,
        questions: questionDrafts,
      });

      if (res.success) {
        setSuccessMsg("Тест успешно создан и опубликован!");
        setTimeout(() => {
          router.push(`/dashboard/lms/tests?group=${groupId}`);
          router.refresh();
        }, 1000);
      } else {
        setErrorMsg(res.error || "Ошибка при создании теста");
      }
    });
  };

  return (
    <div className="space-y-4 w-full">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-3 bg-card p-4 rounded-xl border shadow-xs">
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/lms/tests?group=${groupId}`}>
            <Button size="xs" variant="outline" className="h-8 w-8 p-0">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-base font-bold text-foreground flex items-center gap-2">
              <FileCheck2 className="h-5 w-5 text-primary" /> Полноценная система тестирования LMS
            </h1>
            <p className="text-xs text-muted-foreground">
              Создание тестов с вариативностью (один выбор, множественный выбор, текстовый ввод, верно/неверно)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="xs"
            variant="outline"
            onClick={() => setIsPreview(!isPreview)}
            className="h-8 text-xs gap-1.5"
          >
            <Eye className="h-3.5 w-3.5 text-primary" /> {isPreview ? "Редактор" : "Предпросмотр"}
          </Button>

          <Button size="xs" disabled={isPending} onClick={handleSubmit} className="h-8 text-xs gap-1.5 font-medium">
            <Plus className="h-3.5 w-3.5" /> Опубликовать тест
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="p-3 rounded-lg border border-primary/30 bg-primary/10 text-primary text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Left Column: Form & Questions Builder */}
        <div className="md:col-span-2 space-y-4">
          <Card className="p-4 border shadow-none rounded-xl space-y-3">
            <div className="space-y-1">
              <label className="font-semibold text-foreground text-xs">Название теста *</label>
              <Input
                placeholder="Например: Рубежное тестирование по курсу 'Веб-программирование'"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-8 text-xs bg-background font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground text-xs">Инструкция / Пояснение к тесту</label>
              <Textarea
                placeholder="Укажите правила сдачи теста, критерии оценивания и особенности вопросов..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-xs bg-background min-h-[70px] leading-relaxed font-sans"
              />
            </div>
          </Card>

          {/* Question Builder / Interactive Preview section */}
          {isPreview ? (
            <Card className="p-4 border shadow-none rounded-xl space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5 text-primary" /> Режим предпросмотра теста
                </h3>
                <Badge variant="outline" className="text-[10px] text-primary border-primary/30 font-medium">
                  Всего: {questionDrafts.length} вопросов ({totalPoints} баллов)
                </Badge>
              </div>

              <div className="space-y-4">
                {questionDrafts.map((q, idx) => (
                  <div key={idx} className="p-3.5 border rounded-xl bg-card space-y-3">
                    <div className="flex items-start justify-between gap-2 border-b pb-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[9px] border-primary/30 text-primary">
                            {q.type === "SINGLE"
                              ? "Один выбор"
                              : q.type === "MULTIPLE"
                                ? "Множественный выбор"
                                : q.type === "TEXT"
                                  ? "Текстовый ответ"
                                  : "Верно/Неверно"}
                          </Badge>
                        </div>
                        <span className="font-bold text-xs text-foreground pt-0.5 block">
                          Вопрос #{idx + 1}: {q.questionText || "Без текста"}
                        </span>
                      </div>
                      <Badge variant="secondary" className="text-[9px] shrink-0 font-normal">
                        +{q.points} б.
                      </Badge>
                    </div>

                    {q.type === "TEXT" ? (
                      <div className="p-3 rounded-lg border bg-background space-y-1">
                        <div className="text-[11px] text-muted-foreground font-medium">Поле для ответа студента:</div>
                        <Input disabled placeholder="Текстовый ответ..." className="h-8 text-xs bg-muted/40" />
                        <div className="text-[10px] text-primary pt-1 font-medium">
                          Правильный ответ: «{q.correctAnswer}»
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {q.options.map((opt, optIdx) => {
                          const isCorrect = isOptionCorrect(q, opt);

                          return (
                            <div
                              key={optIdx}
                              className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-2 transition-all ${
                                isCorrect
                                  ? "border-primary bg-primary/10 font-semibold text-primary"
                                  : "border-border bg-background"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className={`h-4 w-4 rounded-${q.type === "MULTIPLE" ? "md" : "full"} border flex items-center justify-center ${
                                    isCorrect ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"
                                  }`}
                                >
                                  {isCorrect && <Check className="h-3 w-3 stroke-[3]" />}
                                </div>
                                <span>{opt}</span>
                              </div>
                              {isCorrect && (
                                <Badge className="bg-primary text-primary-foreground text-[9px] font-normal">
                                  Верный ответ ✓
                                </Badge>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <Card className="p-4 border shadow-none rounded-xl space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <div className="space-y-0.5">
                  <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <HelpCircle className="h-3.5 w-3.5 text-primary" /> Вопросы теста ({questionDrafts.length})
                  </h3>
                  <p className="text-[11px] text-muted-foreground">Настраивайте тип вопроса, варианты и отмечайте один или несколько верных ответов</p>
                </div>

                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={handleAddQuestion}
                  className="h-7 text-xs gap-1 text-primary border-primary/30 hover:bg-primary/10 font-medium shrink-0"
                >
                  <PlusCircle className="h-3.5 w-3.5" /> Добавить вопрос
                </Button>
              </div>

              <div className="space-y-4">
                {questionDrafts.map((q, qIdx) => (
                  <div key={qIdx} className="p-3.5 border rounded-xl bg-card space-y-3 relative">
                    {/* Question Header: Number, Type Selector, Points, Duplicate, Remove */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                      <div className="flex items-center gap-2">
                        <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                          {qIdx + 1}
                        </span>
                        <span className="font-bold text-xs text-foreground">Вопрос #{qIdx + 1}</span>

                        {/* Question Type Selector Pill */}
                        <div className="grid grid-cols-4 gap-1 p-0.5 bg-muted/60 rounded-lg border text-[11px] font-medium ml-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateQuestionType(qIdx, "SINGLE")}
                            className={`px-2 py-0.5 rounded-md transition-colors flex items-center gap-1 ${
                              q.type === "SINGLE"
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                            title="Один верный ответ (Radio)"
                          >
                            <CircleDot className="h-3 w-3" /> Один выбор
                          </button>

                          <button
                            type="button"
                            onClick={() => handleUpdateQuestionType(qIdx, "MULTIPLE")}
                            className={`px-2 py-0.5 rounded-md transition-colors flex items-center gap-1 ${
                              q.type === "MULTIPLE"
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                            title="Множественный выбор (Checkboxes)"
                          >
                            <CheckSquare className="h-3 w-3" /> Несколько
                          </button>

                          <button
                            type="button"
                            onClick={() => handleUpdateQuestionType(qIdx, "TEXT")}
                            className={`px-2 py-0.5 rounded-md transition-colors flex items-center gap-1 ${
                              q.type === "TEXT"
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                            title="Ввод текста с клавиатуры"
                          >
                            <Type className="h-3 w-3" /> Текст
                          </button>

                          <button
                            type="button"
                            onClick={() => handleUpdateQuestionType(qIdx, "TRUE_FALSE")}
                            className={`px-2 py-0.5 rounded-md transition-colors flex items-center gap-1 ${
                              q.type === "TRUE_FALSE"
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                            title="Да / Нет (Верно / Неверно)"
                          >
                            <ToggleLeft className="h-3 w-3" /> Да/Нет
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <label className="text-[10px] text-muted-foreground font-medium">Баллы:</label>
                          <Input
                            type="number"
                            value={q.points}
                            onChange={(e) => handleUpdateQuestionPoints(qIdx, Number(e.target.value))}
                            className="h-6 w-12 text-[11px] bg-background text-center font-bold"
                          />
                        </div>

                        <Button
                          type="button"
                          size="xs"
                          variant="ghost"
                          onClick={() => handleDuplicateQuestion(qIdx)}
                          className="h-6 px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
                          title="Дублировать вопрос"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>

                        {questionDrafts.length > 1 && (
                          <Button
                            type="button"
                            size="xs"
                            variant="ghost"
                            onClick={() => handleRemoveQuestion(qIdx)}
                            className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10"
                            title="Удалить вопрос"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-muted-foreground">Формулировка вопроса</label>
                      <Input
                        placeholder="Введите текст тестового вопроса..."
                        value={q.questionText}
                        onChange={(e) => handleUpdateQuestionText(qIdx, e.target.value)}
                        className="h-8 text-xs bg-background font-medium"
                      />
                    </div>

                    {/* Options Grid / Answer Config depending on Type */}
                    {q.type === "TEXT" ? (
                      <div className="space-y-1.5 pt-2 border-t">
                        <label className="text-[11px] font-semibold text-primary flex items-center gap-1">
                          <Type className="h-3.5 w-3.5" /> Эталонный верный текстовый ответ (регистр не учитывается)
                        </label>
                        <Input
                          placeholder="Введите точный ответ (например: HTTP, 42, REST)"
                          value={q.correctAnswer}
                          onChange={(e) =>
                            setQuestionDrafts((prev) => {
                              const copy = [...prev];
                              copy[qIdx].correctAnswer = e.target.value;
                              return copy;
                            })
                          }
                          className="h-8 text-xs bg-background font-mono border-primary/50"
                        />
                      </div>
                    ) : (
                      <div className="space-y-2 pt-2 border-t">
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground font-semibold">
                          <span>
                            Варианты ответов (нажмите на галочку слева для выбора{" "}
                            {q.type === "MULTIPLE" ? "верных вариантов" : "верного варианта"}):
                          </span>

                          {q.type !== "TRUE_FALSE" && (
                            <button
                              type="button"
                              onClick={() => handleAddOption(qIdx)}
                              className="text-primary hover:underline text-[11px] font-medium flex items-center gap-1"
                            >
                              <PlusCircle className="h-3 w-3" /> Вариант
                            </button>
                          )}
                        </div>

                        {/* Options List with Stable Layout & Non-Shifting Buttons */}
                        <div className="space-y-2">
                          {q.options.map((opt, optIdx) => {
                            const isCorrect = isOptionCorrect(q, opt);

                            return (
                              <div key={optIdx} className="flex items-center gap-2">
                                {/* Fixed size square toggle button - prevents all layout breaking/shifting */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleOptionCorrect(qIdx, opt)}
                                  className={`w-7 h-7 shrink-0 rounded-md border flex items-center justify-center transition-colors ${
                                    isCorrect
                                      ? "bg-primary border-primary text-primary-foreground"
                                      : "bg-background border-border text-muted-foreground hover:border-primary/50"
                                  }`}
                                  title={isCorrect ? "Верный ответ" : "Отметить как верный"}
                                >
                                  <Check className={`h-3.5 w-3.5 stroke-[3] ${isCorrect ? "opacity-100" : "opacity-0"}`} />
                                </button>

                                <Input
                                  disabled={q.type === "TRUE_FALSE"}
                                  value={opt}
                                  onChange={(e) => handleUpdateOptionText(qIdx, optIdx, e.target.value)}
                                  className={`h-7 text-xs bg-background flex-1 ${
                                    isCorrect ? "border-primary/60 font-semibold text-primary" : ""
                                  }`}
                                />

                                {q.type !== "TRUE_FALSE" && q.options.length > 2 && (
                                  <Button
                                    type="button"
                                    size="xs"
                                    variant="ghost"
                                    onClick={() => handleRemoveOption(qIdx, optIdx)}
                                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive shrink-0"
                                    title="Удалить вариант"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={handleAddQuestion}
                  className="w-full h-8 text-xs gap-1.5 text-primary border-dashed border-primary/40 hover:bg-primary/5 font-medium"
                >
                  <PlusCircle className="h-3.5 w-3.5" /> Добавить ещё один вопрос
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Settings & Summary */}
        <div className="space-y-3 sticky top-20 z-10 self-start">
          <div className="p-3.5 border rounded-xl bg-card space-y-2.5 text-xs shadow-xs">
            <h3 className="text-xs font-bold text-foreground border-b pb-1.5 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-primary" /> Параметры привязки
            </h3>

            <div className="space-y-1">
              <label className="font-medium text-foreground text-xs">Учебная группа *</label>
              <Select value={groupId} onValueChange={handleGroupChange}>
                <SelectTrigger className="h-8 text-xs bg-background font-medium">
                  <SelectValue>{groups.find((g) => g.id === groupId)?.name || "Выберите группу"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.id} className="text-xs">
                      Группа {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground text-xs">Дисциплина *</label>
              <Select value={groupSubjectId} onValueChange={setGroupSubjectId}>
                <SelectTrigger className="h-8 text-xs bg-background font-medium">
                  <SelectValue>{subjects.find((s) => s.id === groupSubjectId)?.subjectName || "Выберите предмет"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-xs">
                      {s.subjectName} ({s.teacherName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground text-xs">Учебная тема (опционально)</label>
              <Select value={topicId} onValueChange={setTopicId}>
                <SelectTrigger className="h-8 text-xs bg-background font-medium">
                  <SelectValue>{topics.find((t) => t.id === topicId)?.title || "Не привязано"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="text-xs">
                    Не привязано к теме
                  </SelectItem>
                  {topics.map((t) => (
                    <SelectItem key={t.id} value={t.id} className="text-xs">
                      {t.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground text-xs flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-primary" /> Лимит времени (минуты)
              </label>
              <Input
                type="number"
                placeholder="15"
                value={timeLimit}
                onChange={(e) => setTimeLimit(e.target.value ? Number(e.target.value) : "")}
                className="h-8 text-xs bg-background font-medium"
              />
              <p className="text-[10px] text-muted-foreground">Оставьте пустым, если тест без таймера</p>
            </div>

            {/* Randomize / Shuffle Toggles */}
            <div className="space-y-1.5 pt-2 border-t text-xs">
              <label className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
                <Shuffle className="h-3.5 w-3.5 text-primary" /> Перемешивание элементов
              </label>

              <div
                onClick={() => setShuffleQuestions(!shuffleQuestions)}
                className={`p-2 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                  shuffleQuestions ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-foreground"
                }`}
              >
                <div className="space-y-0.5">
                  <span className="font-medium text-xs block">Порядок вопросов</span>
                  <span className="text-[10px] text-muted-foreground block">Случайная последовательность</span>
                </div>
                <div className={`w-7 h-4 rounded-full border p-0.5 transition-colors ${shuffleQuestions ? "bg-primary border-primary" : "bg-muted border-border"}`}>
                  <div className={`w-2.5 h-2.5 rounded-full bg-white transition-transform ${shuffleQuestions ? "translate-x-3" : "translate-x-0"}`} />
                </div>
              </div>

              <div
                onClick={() => setShuffleOptions(!shuffleOptions)}
                className={`p-2 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                  shuffleOptions ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-foreground"
                }`}
              >
                <div className="space-y-0.5">
                  <span className="font-medium text-xs block">Варианты ответов</span>
                  <span className="text-[10px] text-muted-foreground block">Случайный порядок вариантов</span>
                </div>
                <div className={`w-7 h-4 rounded-full border p-0.5 transition-colors ${shuffleOptions ? "bg-primary border-primary" : "bg-muted border-border"}`}>
                  <div className={`w-2.5 h-2.5 rounded-full bg-white transition-transform ${shuffleOptions ? "translate-x-3" : "translate-x-0"}`} />
                </div>
              </div>
            </div>

            {/* Summary Stat Box */}
            <div className="p-2.5 rounded-lg border bg-muted/30 space-y-1">
              <div className="text-[11px] font-semibold text-foreground flex items-center justify-between">
                <span>Вопросов в тесте:</span>
                <span className="text-primary font-bold">{questionDrafts.length} шт.</span>
              </div>
              <div className="text-[11px] font-semibold text-foreground flex items-center justify-between">
                <span>Максимальный балл:</span>
                <span className="text-primary font-bold">{totalPoints} б.</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 border-t space-y-1.5">
              <Button size="xs" disabled={isPending} onClick={handleSubmit} className="w-full h-8 text-xs gap-1.5 font-medium">
                <Plus className="h-3.5 w-3.5" /> Опубликовать тест
              </Button>

              <Link href={`/dashboard/lms/tests?group=${groupId}`} className="block">
                <Button size="xs" variant="outline" className="w-full h-8 text-xs">
                  Отмена
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
