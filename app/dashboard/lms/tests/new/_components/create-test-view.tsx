"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
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
  GripVertical,
  ChevronUp,
  ChevronDown,
  ListOrdered,
  FormInput,
  Code,
  Terminal,
  ArrowUpDown,
  FileUp,
  Layers,
  Hash,
  Sparkles,
} from "lucide-react";
import { GroupItemDTO, GroupSubjectDTO, createTestAction } from "../../../actions";
import { toast } from "@/components/ui/toast";

interface CreateTestViewProps {
  groups: GroupItemDTO[];
  subjects: GroupSubjectDTO[];
  topics: Array<{ id: string; title: string }>;
  selectedGroupId: string;
  selectedTopicId: string;
}

export type QuestionType =
  | "SINGLE"
  | "MULTIPLE"
  | "TEXT"
  | "TRUE_FALSE"
  | "ORDERING"
  | "BLANKS"
  | "CODE"
  | "MATCHING"
  | "NUMERICAL";

export interface QuestionDraft {
  type: QuestionType;
  questionText: string;
  codeSnippet?: string;
  options: any[];
  correctAnswer: string;
  points: number;
}

function cleanBackticks(str: string): string {
  const trimmed = str.trim();
  if (trimmed.startsWith("`") && trimmed.endsWith("`") && trimmed.length >= 2) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

export function parseBulkQuestions(rawText: string): QuestionDraft[] {
  if (!rawText.trim()) return [];

  // Step 1: Split into question blocks intelligently without breaking code blocks
  const normalized = rawText.replace(/\r\n/g, "\n");
  const rawLines = normalized.split("\n");

  const questionBlocks: string[] = [];
  let currentBlockLines: string[] = [];
  let inCodeFence = false;

  // Check if text has numbered questions like "1.", "2)", "#3", "Q1:"
  const hasNumberedQuestions = rawLines.some((line) =>
    /^\s*(\d+[\.\)]|\#\d+|[Qq]\d+[:\.]?)\s+\S/.test(line)
  );

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      inCodeFence = !inCodeFence;
      currentBlockLines.push(line);
      continue;
    }

    if (!inCodeFence) {
      const isNewQuestionStart = hasNumberedQuestions
        ? /^\s*(\d+[\.\)]|\#\d+|[Qq]\d+[:\.]?)\s+\S/.test(line)
        : false;

      if (isNewQuestionStart && currentBlockLines.length > 0) {
        questionBlocks.push(currentBlockLines.join("\n").trim());
        currentBlockLines = [line];
        continue;
      }
    }

    currentBlockLines.push(line);
  }

  if (currentBlockLines.length > 0 && currentBlockLines.some((l) => l.trim())) {
    questionBlocks.push(currentBlockLines.join("\n").trim());
  }

  // If text didn't have numbered questions, fallback to empty-line splitting outside of code fences
  let finalBlocks = questionBlocks;
  if (!hasNumberedQuestions) {
    finalBlocks = [];
    let tempLines: string[] = [];
    let insideFence = false;
    for (const line of rawLines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("```")) {
        insideFence = !insideFence;
        tempLines.push(line);
        continue;
      }
      if (!insideFence && trimmed === "") {
        if (tempLines.some((l) => l.trim())) {
          finalBlocks.push(tempLines.join("\n").trim());
          tempLines = [];
        }
      } else {
        tempLines.push(line);
      }
    }
    if (tempLines.some((l) => l.trim())) {
      finalBlocks.push(tempLines.join("\n").trim());
    }
  }

  const result: QuestionDraft[] = [];

  for (const block of finalBlocks) {
    if (!block.trim()) continue;

    // 1. Extract code block if present (```lang ... ```)
    let blockWithoutCode = block;
    let codeSnippet: string | undefined = undefined;
    const codeMatch = block.match(/```(?:[a-zA-Z0-9_-]*)\n([\s\S]*?)\n```/);
    if (codeMatch) {
      codeSnippet = codeMatch[1].trim();
      blockWithoutCode = block.replace(/```(?:[a-zA-Z0-9_-]*)\n[\s\S]*?\n```/, "");
    }

    const rawBlockLines = blockWithoutCode
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (rawBlockLines.length === 0) continue;

    // 2. Question title (first line, strip "1.", "#1", "Q1.", etc.)
    const firstLine = rawBlockLines[0];
    const questionText = firstLine
      .replace(/^(\d+[\.\)]|\#\d+|[Qq]\d+[:\.]?)\s*/, "")
      .trim();
    if (!questionText) continue;

    const remainingLines = rawBlockLines.slice(1);

    // 3. Check for BLANKS (e.g. "В HTML [HTML] используется...")
    const { blanks } = extractBlanksFromText(questionText);
    if (blanks.length > 0 && remainingLines.length === 0) {
      result.push({
        type: "BLANKS",
        questionText,
        options: blanks,
        correctAnswer: JSON.stringify(blanks),
        points: 2,
      });
      continue;
    }

    // 4. Check for TEXT / Single answer line (e.g. "*echo" or "*Париж" or "Ответ: echo")
    if (
      remainingLines.length === 1 &&
      (remainingLines[0].startsWith("*") ||
        remainingLines[0].startsWith("+") ||
        /^ответ\s*[:=]/i.test(remainingLines[0]))
    ) {
      let ans = remainingLines[0]
        .replace(/^(\*|\+)\s*/, "")
        .replace(/^ответ\s*[:=]\s*/i, "")
        .trim();
      ans = cleanBackticks(ans);
      result.push({
        type: "TEXT",
        questionText,
        options: [],
        correctAnswer: ans,
        points: 1,
      });
      continue;
    }

    // If 0 remaining lines
    if (remainingLines.length === 0) {
      if (codeSnippet) {
        result.push({
          type: "CODE",
          questionText,
          codeSnippet,
          options: ["Вариант 1", "Вариант 2"],
          correctAnswer: "Вариант 1",
          points: 1,
        });
      } else {
        result.push({
          type: "TEXT",
          questionText,
          options: [],
          correctAnswer: "",
          points: 1,
        });
      }
      continue;
    }

    // 5. Check for MATCHING
    // Check Format A (Separate left and right items with same letters e.g. a)... and *a)...)
    const leftLetterMap = new Map<string, string>();
    const rightLetterMap = new Map<string, string>();
    for (const l of remainingLines) {
      const match = l.match(/^(\*|\+)?\s*\(?([a-zA-Z0-9])\)?[ \.]\s*(.*)$/);
      if (match) {
        const isMarked = !!match[1];
        const key = match[2].toLowerCase();
        const val = cleanBackticks(match[3].trim());
        if (isMarked) {
          rightLetterMap.set(key, val);
        } else {
          leftLetterMap.set(key, val);
        }
      }
    }

    const isMatchingFormatA =
      leftLetterMap.size >= 2 &&
      rightLetterMap.size >= 2 &&
      [...leftLetterMap.keys()].some((k) => rightLetterMap.has(k));

    if (isMatchingFormatA) {
      const pairs: Array<{ left: string; right: string }> = [];
      const map: Record<string, string> = {};
      for (const [key, leftVal] of leftLetterMap.entries()) {
        const rightVal = rightLetterMap.get(key) || "";
        pairs.push({ left: leftVal, right: rightVal });
        map[leftVal] = rightVal;
      }
      result.push({
        type: "MATCHING",
        questionText,
        options: pairs,
        correctAnswer: JSON.stringify(map),
        points: 2,
      });
      continue;
    }

    // Check Format B (Single lines with arrows e.g. "Термин -> Определение" or "Термин ➔ Определение" or "Термин : Определение"):
    const matchingArrowLines = remainingLines.filter((l) => {
      const withoutBullet = l.replace(/^(\*|\+)?\s*\(?[a-zA-Z0-9]\)?[\.\)]\s*/, "");
      return /(?:->|➔|=>|\s+:\s+|\s+=\s+)/.test(withoutBullet);
    });
    if (
      matchingArrowLines.length >= 2 &&
      matchingArrowLines.length === remainingLines.length
    ) {
      const pairs: Array<{ left: string; right: string }> = [];
      const map: Record<string, string> = {};
      for (const l of remainingLines) {
        const withoutBullet = l.replace(/^(\*|\+)\s*/, "").replace(/^\(?[a-zA-Z0-9]\)?[ \.]\s*/, "").trim();
        const parts = withoutBullet.split(/(?:->|➔|=>|\s+:\s+|\s+=\s+)/);
        if (parts.length >= 2) {
          const left = cleanBackticks(parts[0].trim());
          const right = cleanBackticks(parts.slice(1).join(":").trim());
          if (left && right) {
            pairs.push({ left, right });
            map[left] = right;
          }
        }
      }
      if (pairs.length >= 2) {
        result.push({
          type: "MATCHING",
          questionText,
          options: pairs,
          correctAnswer: JSON.stringify(map),
          points: 2,
        });
        continue;
      }
    }

    // Parse options lines
    interface ParsedOpt {
      text: string;
      isCorrect: boolean;
    }
    const parsedOptions: ParsedOpt[] = [];

    for (const optLine of remainingLines) {
      let isCorrect = false;
      let cleanOpt = optLine;

      if (cleanOpt.startsWith("*") || cleanOpt.startsWith("+")) {
        isCorrect = true;
        cleanOpt = cleanOpt.substring(1).trim();
      }

      // Strip bullet letters/digits like a), b), 1), A), [x], etc.
      cleanOpt = cleanOpt
        .replace(/^(\([a-zA-Z0-9\*\+]\)|\[[xX \*\+]\]|[a-zA-Z0-9][\.\)]|\-|\•)\s*/, "")
        .trim();

      if (
        cleanOpt.endsWith("*") ||
        cleanOpt.endsWith("(+)") ||
        cleanOpt.endsWith("(верно)") ||
        cleanOpt.endsWith("(правильно)")
      ) {
        isCorrect = true;
        cleanOpt = cleanOpt.replace(/(\*|\(\+\)|\(верно\)|\(правильно\))$/, "").trim();
      }

      cleanOpt = cleanBackticks(cleanOpt);

      if (cleanOpt) {
        parsedOptions.push({ text: cleanOpt, isCorrect });
      }
    }

    const optionsList = parsedOptions.map((o) => o.text);
    const correctOptionsList = parsedOptions.filter((o) => o.isCorrect).map((o) => o.text);

    // 6. Check for TRUE_FALSE
    const lowerOptions = optionsList.map((o) => o.toLowerCase());
    const isTrueFalse =
      optionsList.length === 2 &&
      ((lowerOptions.includes("верно") && lowerOptions.includes("неверно")) ||
        (lowerOptions.includes("да") && lowerOptions.includes("нет")) ||
        (lowerOptions.includes("true") && lowerOptions.includes("false")));

    if (isTrueFalse) {
      const correctVal = correctOptionsList[0] || optionsList[0];
      result.push({
        type: "TRUE_FALSE",
        questionText,
        options: optionsList,
        correctAnswer: correctVal,
        points: 1,
      });
      continue;
    }

    // 7. Check for ORDERING
    const isOrderingTitle = /расставьте|порядок|последовательност|order/i.test(questionText);
    const isAllMarkedWithStar =
      optionsList.length >= 2 &&
      parsedOptions.every((o) => o.isCorrect) &&
      remainingLines.every((l) => l.startsWith("*") || l.startsWith("+"));

    if (isOrderingTitle || isAllMarkedWithStar) {
      result.push({
        type: "ORDERING",
        questionText,
        options: optionsList,
        correctAnswer: JSON.stringify(optionsList),
        points: 2,
      });
      continue;
    }

    // 8. Check for CODE
    if (codeSnippet) {
      const correctVal = correctOptionsList[0] || optionsList[0] || "";
      result.push({
        type: "CODE",
        questionText,
        codeSnippet,
        options: optionsList,
        correctAnswer: correctVal,
        points: 1,
      });
      continue;
    }

    // 9. MULTIPLE vs SINGLE
    if (correctOptionsList.length > 1) {
      result.push({
        type: "MULTIPLE",
        questionText,
        options: optionsList,
        correctAnswer: JSON.stringify(correctOptionsList),
        points: 2,
      });
    } else if (correctOptionsList.length === 1) {
      result.push({
        type: "SINGLE",
        questionText,
        options: optionsList,
        correctAnswer: correctOptionsList[0],
        points: 1,
      });
    } else if (optionsList.length > 0) {
      result.push({
        type: "SINGLE",
        questionText,
        options: optionsList,
        correctAnswer: optionsList[0] || "",
        points: 1,
      });
    }
  }

  return result;
}

export function parseQuestionCode(fullText: string): { title: string; code?: string } {
  if (!fullText) return { title: "" };
  const match = fullText.match(/^([\s\S]*?)\n```(?:[a-z]*)\n([\s\S]*?)\n```$/);
  if (match) {
    return { title: match[1].trim(), code: match[2].trim() };
  }
  return { title: fullText };
}

export function extractBlanksFromText(text: string): { templateParts: string[]; blanks: string[] } {
  if (!text) return { templateParts: [""], blanks: [] };
  const regex = /\[(.*?)\]/g;
  const templateParts: string[] = [];
  const blanks: string[] = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    templateParts.push(text.substring(lastIndex, match.index));
    blanks.push(match[1]);
    lastIndex = regex.lastIndex;
  }
  templateParts.push(text.substring(lastIndex));
  return { templateParts, blanks };
}

const FORMAT_ITEMS = [
  {
    id: "single",
    icon: CircleDot,
    label: "Один правильный ответ",
    example: `1. Вопрос?
a) Вариант 1
*b) Правильный ответ
c) Вариант 3`,
  },
  {
    id: "multiple",
    icon: CheckSquare,
    label: "Несколько правильных",
    example: `2. Вопрос с несколькими ответами?
*a) Правильный 1
b) Неверный
*c) Правильный 2
d) Неверный`,
  },
  {
    id: "truefalse",
    icon: ToggleLeft,
    label: "Да / Нет",
    example: `3. Земля — третья планета?
*Верно
Неверно`,
  },
  {
    id: "text",
    icon: Type,
    label: "Свободный текст",
    example: `4. Столица Франции?
*Париж`,
  },
  {
    id: "ordering",
    icon: ListOrdered,
    label: "Последовательность",
    example: `5. Расставьте шаги по порядку:
*a) Шаг 1: Анализ
*b) Шаг 2: Разработка
*c) Шаг 3: Тестирование`,
  },
  {
    id: "blanks",
    icon: FormInput,
    label: "Пропуски",
    example: `6. [HTML] используется для разметки,\nа [CSS] — для стилей страниц.`,
  },
  {
    id: "code",
    icon: Code,
    label: "Код / Сниппет",
    example: `7. Что выведет код?\n\`\`\`\nconst x = 5 + 3;\nconsole.log(x);\n\`\`\`\n*a) 8\nb) 53\nc) undefined`,
  },
  {
    id: "matching",
    icon: ArrowUpDown,
    label: "Сопоставление",
    example: `8. Сопоставьте термины:\na) GET\nb) POST\nc) DELETE\n*a) Получить данные\n*b) Создать ресурс\n*c) Удалить ресурс`,
  },
  {
    id: "numerical",
    icon: Hash,
    label: "Числовой ответ",
    example: `9. Сколько байт в одном килобайте?\n*1024`,
  },
] as const;

function BulkImportFormatsAccordion({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [openItemId, setOpenItemId] = React.useState<string | null>(null);

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      {/* Root toggle */}
      <button
        type="button"
        onClick={() => { setIsOpen((v) => !v); setOpenItemId(null); }}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-foreground hover:bg-muted/50 transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <Layers className="h-3 w-3 text-primary" />
          Поддерживаемые форматы
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Grid trick: smooth height transition without JS measurement */}
      <div
        className="transition-[grid-template-rows] duration-200 ease-out"
        style={{ display: "grid", gridTemplateRows: isOpen ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="border-t divide-y">
            {FORMAT_ITEMS.map((item) => {
              const Icon = item.icon;
              const isItemOpen = openItemId === item.id;
              return (
                <div key={item.id}>
                  <button
                    type="button"
                    onClick={() => setOpenItemId(isItemOpen ? null : item.id)}
                    className="w-full flex items-center justify-between px-3 py-2 text-[11px] hover:bg-muted/40 transition-colors"
                  >
                    <span className="flex items-center gap-1.5 text-foreground">
                      <Icon className="h-3 w-3 text-primary shrink-0" />
                      {item.label}
                    </span>
                    <ChevronDown
                      className={`h-3 w-3 text-muted-foreground transition-transform duration-200 ${isItemOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {/* Inner grid trick for sub-items */}
                  <div
                    className="transition-[grid-template-rows] duration-150 ease-out"
                    style={{ display: "grid", gridTemplateRows: isItemOpen ? "1fr" : "0fr" }}
                  >
                    <div className="overflow-hidden">
                      <pre className="text-[10px] font-mono text-muted-foreground bg-background px-3 py-2.5 leading-relaxed whitespace-pre-wrap border-t">
                        {item.example}
                      </pre>
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="px-3 py-2 bg-primary/5">
              <p className="text-[10px] text-primary/80 leading-relaxed">
                Отметьте правильные варианты символом <span className="font-mono font-bold">*</span> в начале строки.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
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

  const [groupId, setGroupId] = useState(selectedGroupId || groups[0]?.id || "");
  const [groupSubjectId, setGroupSubjectId] = useState(subjects[0]?.id || "");
  const [topicId, setTopicId] = useState(selectedTopicId || "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timeLimit, setTimeLimit] = useState<number | "">(15);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleOptions, setShuffleOptions] = useState(false);

  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [bulkImportText, setBulkImportText] = useState("");
  const [isFormatsOpen, setIsFormatsOpen] = useState(false);

  const [isPreview, setIsPreview] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [previewAnswers, setPreviewAnswers] = useState<Record<number, string>>({});

  const handlePreviewSelect = (qIdx: number, opt: string, type: QuestionType) => {
    if (type === "MULTIPLE") {
      let currentArr: string[] = [];
      try {
        currentArr = previewAnswers[qIdx] ? JSON.parse(previewAnswers[qIdx]) : [];
      } catch {
        currentArr = [];
      }
      const exists = currentArr.includes(opt);
      const updated = exists ? currentArr.filter((item) => item !== opt) : [...currentArr, opt];
      setPreviewAnswers((prev) => ({ ...prev, [qIdx]: JSON.stringify(updated) }));
    } else {
      setPreviewAnswers((prev) => ({ ...prev, [qIdx]: opt }));
    }
  };

  // Sync selected group and first subject if missing or updated
  React.useEffect(() => {
    if (selectedGroupId && groupId !== selectedGroupId) {
      setGroupId(selectedGroupId);
    } else if (!groupId && groups[0]?.id) {
      setGroupId(groups[0].id);
    }
  }, [selectedGroupId, groups]);

  React.useEffect(() => {
    if (subjects.length > 0 && (!groupSubjectId || !subjects.some((s) => s.id === groupSubjectId))) {
      setGroupSubjectId(subjects[0].id);
    }
  }, [subjects, groupSubjectId]);

  // DnD States
  const [draggedQuestionIdx, setDraggedQuestionIdx] = useState<number | null>(null);
  const [dragOverQuestionIdx, setDragOverQuestionIdx] = useState<number | null>(null);
  const [draggedOption, setDraggedOption] = useState<{ qIdx: number; optIdx: number } | null>(null);
  const [dragOverOption, setDragOverOption] = useState<{ qIdx: number; optIdx: number } | null>(null);

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

  const handleMoveQuestion = (fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx || fromIdx < 0 || toIdx < 0 || fromIdx >= questionDrafts.length || toIdx >= questionDrafts.length) return;
    setQuestionDrafts((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIdx, 1);
      updated.splice(toIdx, 0, moved);
      return updated;
    });
  };

  const handleMoveOption = (qIdx: number, fromOptIdx: number, toOptIdx: number) => {
    if (fromOptIdx === toOptIdx || fromOptIdx < 0 || toOptIdx < 0) return;
    setQuestionDrafts((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx || fromOptIdx >= q.options.length || toOptIdx >= q.options.length) return q;
        const newOptions = [...q.options];
        const [moved] = newOptions.splice(fromOptIdx, 1);
        newOptions.splice(toOptIdx, 0, moved);
        return { ...q, options: newOptions };
      })
    );
  };

  const handleAddQuestionAt = (atIndex?: number) => {
    const newQ: QuestionDraft = {
      type: "SINGLE",
      questionText: "",
      options: ["Вариант 1", "Вариант 2", "Вариант 3", "Вариант 4"],
      correctAnswer: "Вариант 1",
      points: 1,
    };

    let targetIdx = questionDrafts.length;
    setQuestionDrafts((prev) => {
      const copy = [...prev];
      if (typeof atIndex === "number" && atIndex >= 0 && atIndex <= copy.length) {
        copy.splice(atIndex, 0, newQ);
        targetIdx = atIndex;
      } else {
        copy.push(newQ);
        targetIdx = copy.length - 1;
      }
      return copy;
    });

    setTimeout(() => {
      const el = document.getElementById(`question-card-${targetIdx}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        const input = el.querySelector("input") as HTMLInputElement | null;
        if (input) input.focus();
      }
    }, 80);
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
        } else if (newType === "ORDERING") {
          if (updated.options.length < 2) {
            updated.options = ["Этап 1: Инициализация проекта", "Этап 2: Написание кода", "Этап 3: Тестирование и деплой"];
          }
          updated.correctAnswer = JSON.stringify(updated.options);
        } else if (newType === "BLANKS") {
          if (updated.options.length === 0) {
            updated.options = ["значение1", "значение2"];
          }
          updated.correctAnswer = JSON.stringify(updated.options);
        } else if (newType === "CODE") {
          if (updated.options.length === 0) {
            updated.options = ["10", "20", "undefined", "Error"];
          }
          if (!updated.codeSnippet) {
            updated.codeSnippet = "const a = 10;\nconst b = 20;\nconsole.log(a + b);";
          }
          updated.correctAnswer = updated.options[0] || "";
        } else if (newType === "MULTIPLE") {
          if (updated.options.length === 0) {
            updated.options = ["Вариант 1", "Вариант 2", "Вариант 3", "Вариант 4"];
          }
          updated.correctAnswer = JSON.stringify([updated.options[0] || ""]);
        } else if (newType === "MATCHING") {
          updated.options = [
            { left: "Термин A", right: "Определение 1" },
            { left: "Термин B", right: "Определение 2" },
          ];
          updated.correctAnswer = JSON.stringify({ "Термин A": "Определение 1", "Термин B": "Определение 2" });
        } else if (newType === "NUMERICAL") {
          updated.options = [];
          updated.correctAnswer = JSON.stringify({ value: 10, tolerance: 0.1 });
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

  const handleApplyBulkImport = () => {
    if (!bulkImportText.trim()) return;
    const parsed = parseBulkQuestions(bulkImportText);
    if (parsed.length === 0) {
      toast.add({ title: "Не удалось распознать вопросы. Проверьте формат текста.", type: "error" });
      return;
    }
    setQuestionDrafts((prev) => {
      const isInitialDefaults =
        prev.length === 2 &&
        prev[0].questionText.includes("Какой метод протокола HTTP") &&
        prev[1].questionText.includes("Выберите все валидные форматы");
      const isSingleEmpty = prev.length === 1 && !prev[0].questionText.trim();
      if (isInitialDefaults || isSingleEmpty) {
        return parsed;
      }
      return [...prev, ...parsed];
    });
    setBulkImportText("");
    setIsBulkImportOpen(false);
    toast.add({ title: `Успешно импортировано вопросов: ${parsed.length}`, type: "success" });
  };

  const handleAddMatchingPair = (qIdx: number) => {
    setQuestionDrafts((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const currentPairs = Array.isArray(q.options) ? [...q.options] : [];
        const nextIdx = currentPairs.length + 1;
        const newPairs = [...currentPairs, { left: `Термин ${nextIdx}`, right: `Определение ${nextIdx}` }];
        const map: Record<string, string> = {};
        newPairs.forEach((p: any) => {
          if (p && typeof p === "object" && p.left) map[p.left] = p.right || "";
        });
        return { ...q, options: newPairs, correctAnswer: JSON.stringify(map) };
      })
    );
  };

  const handleUpdateMatchingPair = (qIdx: number, pIdx: number, key: "left" | "right", val: string) => {
    setQuestionDrafts((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const currentPairs = Array.isArray(q.options) ? [...q.options] : [];
        const updatedPairs = currentPairs.map((p, idx) => (idx === pIdx ? { ...p, [key]: val } : p));
        const map: Record<string, string> = {};
        updatedPairs.forEach((p: any) => {
          if (p && typeof p === "object" && p.left) map[p.left] = p.right || "";
        });
        return { ...q, options: updatedPairs, correctAnswer: JSON.stringify(map) };
      })
    );
  };

  const handleRemoveMatchingPair = (qIdx: number, pIdx: number) => {
    setQuestionDrafts((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const currentPairs = Array.isArray(q.options) ? [...q.options] : [];
        if (currentPairs.length <= 1) return q;
        const updatedPairs = currentPairs.filter((_, idx) => idx !== pIdx);
        const map: Record<string, string> = {};
        updatedPairs.forEach((p: any) => {
          if (p && typeof p === "object" && p.left) map[p.left] = p.right || "";
        });
        return { ...q, options: updatedPairs, correctAnswer: JSON.stringify(map) };
      })
    );
  };

  const handleUpdateNumerical = (qIdx: number, field: "value" | "tolerance", val: string) => {
    setQuestionDrafts((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        let currentObj = { value: 0, tolerance: 0 };
        try {
          currentObj = JSON.parse(q.correctAnswer || "{}");
        } catch {}
        const numVal = parseFloat(val) || 0;
        const updatedObj = { ...currentObj, [field]: numVal };
        return { ...q, correctAnswer: JSON.stringify(updatedObj) };
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
      toast.add({ title: "Укажите дисциплину и название теста", type: "error" });
      return;
    }

    const invalidQ = questionDrafts.find((q) => {
      if (!q.questionText.trim()) return true;
      if (q.type === "TEXT") return !q.correctAnswer.trim();
      return !q.correctAnswer;
    });

    if (invalidQ) {
      toast.add({ title: "Заполните тексты вопросов и выберите правильные ответы для всех вопросов", type: "error" });
      return;
    }

    const preparedQuestions = questionDrafts.map((q) => {
      if (q.type === "CODE" && q.codeSnippet && q.codeSnippet.trim()) {
        return {
          ...q,
          questionText: `${q.questionText.trim()}\n\`\`\`\n${q.codeSnippet.trim()}\n\`\`\``,
        };
      }
      return q;
    });

    startTransition(async () => {
      const res = await createTestAction({
        groupSubjectId,
        topicId: topicId || undefined,
        title,
        description,
        timeLimit: timeLimit ? Number(timeLimit) : undefined,
        shuffleQuestions,
        shuffleOptions,
        questions: preparedQuestions,
      });

      if (res.success) {
        toast.add({ title: "Тест успешно создан и опубликован!", type: "success" });
        setTimeout(() => {
          router.push(`/dashboard/lms/tests?group=${groupId}`);
          router.refresh();
        }, 600);
      } else {
        toast.add({ title: res.error || "Ошибка при создании теста", type: "error" });
      }
    });
  };

  return (
    <div className="space-y-3 w-full">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-3 bg-card p-3 rounded-xl border shadow-xs">
        <div className="flex items-center gap-2.5">
          <Link href={`/dashboard/lms/tests?group=${groupId}`}>
            <Button size="xs" variant="outline" className="h-7 w-7 p-0">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-sm font-bold text-foreground flex items-center gap-2">
              <FileCheck2 className="h-4 w-4 text-primary" /> Конструктор тестов и опросов (LMS)
            </h1>
            <p className="text-[11px] text-muted-foreground">
              Создайте интерактивное тестирование с баллами, таймером и вопросами
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="xs"
            type="button"
            variant="outline"
            onClick={() => setIsBulkImportOpen(true)}
            className="h-7 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
          >
            <Sparkles className="h-3.5 w-3.5" /> Быстрый импорт
          </Button>

          <Button
            size="xs"
            type="button"
            variant="outline"
            onClick={() => setIsPreview(!isPreview)}
            className="h-7 text-xs gap-1.5"
          >
            <Eye className="h-3.5 w-3.5 text-primary" /> {isPreview ? "Редактор" : "Предпросмотр"}
          </Button>

          <Button size="xs" disabled={isPending} onClick={handleSubmit} className="h-7 text-xs gap-1.5 font-medium px-3">
            <Plus className="h-3.5 w-3.5" /> Опубликовать тест
          </Button>
        </div>
      </div>


      {/* Bulk Import — Sheet (right drawer) */}
      <Sheet
        open={isBulkImportOpen}
        onOpenChange={(o) => {
          setIsBulkImportOpen(o);
          if (!o) setIsFormatsOpen(false);
        }}
      >
        <SheetContent
          side="right"
          showCloseButton={false}
          className="!w-full sm:!max-w-2xl lg:!max-w-3xl flex flex-col p-0 gap-0"
        >
          {/* Header */}
          <div className="p-4 border-b shrink-0">
            <SheetTitle className="text-sm font-bold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Быстрый импорт вопросов
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground mt-0.5">
              Вставьте текст с вопросами. Система автоматически определит тип и правильные ответы.
            </SheetDescription>
          </div>

          {/* Body */}
          <div className="flex-1 flex flex-col p-4 gap-3 min-h-0 overflow-y-auto">
            {/* Textarea — blurs when formats open */}
            <div
              className={`flex-1 flex flex-col gap-1.5 min-h-0 transition-all duration-200 ${
                isFormatsOpen ? "blur-sm opacity-50 pointer-events-none select-none" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-foreground">Текст для импорта</p>
                {bulkImportText.trim() && (
                  <span className="text-[11px] text-muted-foreground">
                    ~{bulkImportText.trim().split(/\n\s*\n/).filter(Boolean).length} вопр.
                  </span>
                )}
              </div>
              <Textarea
                placeholder={"1. Какой метод HTTP используется для создания ресурса?\na) GET\n*b) POST\nc) PUT\n\n2. Столица Франции?\n*a) Париж\nb) Берлин"}
                value={bulkImportText}
                onChange={(e) => setBulkImportText(e.target.value)}
                className="flex-1 min-h-[160px] text-xs font-mono bg-background resize-none"
              />
            </div>

            {/* Accordion: formats */}
            <div className="shrink-0">
              <BulkImportFormatsAccordion isOpen={isFormatsOpen} setIsOpen={setIsFormatsOpen} />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-3 border-t bg-background shrink-0">
            <Button
              size="xs"
              variant="ghost"
              onClick={() => setIsBulkImportOpen(false)}
              className="h-7 text-xs"
            >
              Отмена
            </Button>
            <Button
              size="xs"
              onClick={handleApplyBulkImport}
              disabled={!bulkImportText.trim()}
              className="h-7 px-4 text-xs font-medium gap-1.5"
            >
              <FileUp className="h-3.5 w-3.5" /> Импортировать вопросы
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
        {/* Left Column: Form & Questions Builder */}
        <div className="md:col-span-2 space-y-2.5">
          <div className="p-3 border rounded-xl bg-card space-y-2 text-xs shadow-xs">
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
                className="text-xs bg-background min-h-[50px] leading-relaxed font-sans"
              />
            </div>
          </div>

          {/* Question Builder / Interactive Preview section */}
          {isPreview ? (
            <div className="p-3.5 border rounded-xl bg-card space-y-3 text-xs shadow-xs">
              <div className="flex items-center justify-between border-b pb-2">
                <div className="space-y-0.5">
                  <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5 text-primary" /> Симуляция прохождения теста (Предпросмотр)
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Кликайте по вариантам ответа, чтобы проверить работу теста от лица студента
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px] text-primary border-primary/30 font-medium">
                  Всего: {questionDrafts.length} вопросов ({totalPoints} баллов)
                </Badge>
              </div>

              <div className="space-y-4">
                {questionDrafts.map((q, qIdx) => {
                  const selectedVal = previewAnswers[qIdx] || "";
                  let selectedMultiple: string[] = [];
                  if (q.type === "MULTIPLE") {
                    try {
                      selectedMultiple = selectedVal ? JSON.parse(selectedVal) : [];
                    } catch {
                      selectedMultiple = [];
                    }
                  }

                  const parsedCode = parseQuestionCode(q.questionText);
                  const codeToDisplay = q.type === "CODE" ? (q.codeSnippet || parsedCode.code) : parsedCode.code;
                  const titleToDisplay = parsedCode.title || q.questionText;

                  return (
                    <div key={qIdx} className="p-3.5 border rounded-xl bg-card space-y-3">
                      <div className="flex items-start justify-between gap-2 border-b pb-2">
                        <div className="space-y-1.5 w-full">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[9px] border-primary/30 text-primary font-medium">
                              {q.type === "SINGLE"
                                ? "Один выбор"
                                : q.type === "MULTIPLE"
                                  ? "Множественный выбор"
                                  : q.type === "TEXT"
                                    ? "Текстовый ответ"
                                    : q.type === "TRUE_FALSE"
                                      ? "Да/Нет"
                                      : q.type === "ORDERING"
                                        ? "Последовательность"
                                        : q.type === "BLANKS"
                                          ? "Пропуски"
                                          : "Код / Сниппет"}
                            </Badge>
                          </div>
                          <span className="font-bold text-xs text-foreground block">
                            Вопрос #{qIdx + 1}: {titleToDisplay || "Без текста"}
                          </span>
                          {codeToDisplay && (
                            <div className="font-mono bg-slate-950 text-emerald-400 p-3 rounded-lg border text-xs leading-relaxed overflow-x-auto my-1.5">
                              <pre className="font-mono whitespace-pre-wrap">{codeToDisplay}</pre>
                            </div>
                          )}
                        </div>
                        <Badge variant="secondary" className="text-[9px] shrink-0 font-normal">
                          +{q.points} б.
                        </Badge>
                      </div>

                      {/* Interactive Options Rendering in Preview Mode */}
                      {q.type === "TEXT" ? (
                        <div className="p-3 rounded-lg border bg-background space-y-1.5">
                          <div className="text-[11px] text-muted-foreground font-medium">Поле для ответа студента:</div>
                          <Input
                            placeholder="Введите ваш текстовый ответ..."
                            value={selectedVal}
                            onChange={(e) => handlePreviewSelect(qIdx, e.target.value, "TEXT")}
                            className="h-8 text-xs bg-background font-medium"
                          />
                          <div className="text-[10px] text-primary pt-1 font-semibold flex items-center gap-1">
                            <Check className="h-3 w-3" /> Эталонный правильный ответ: «{q.correctAnswer}»
                          </div>
                        </div>
                      ) : q.type === "BLANKS" ? (
                        <div className="p-3.5 rounded-lg border bg-background space-y-2">
                          <div className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1.5">
                            <FormInput className="h-3.5 w-3.5 text-primary" /> Заполните пропуски в тексте:
                          </div>
                          {(() => {
                            const { templateParts, blanks } = extractBlanksFromText(q.questionText);
                            return (
                              <div className="text-xs leading-relaxed flex flex-wrap items-center gap-1 text-foreground bg-muted/30 p-3 rounded-lg border">
                                {templateParts.map((part, pIdx) => (
                                  <React.Fragment key={pIdx}>
                                    <span>{part}</span>
                                    {pIdx < blanks.length && (
                                      <Input
                                        placeholder={`[пропуск #${pIdx + 1}]`}
                                        value={
                                          previewAnswers[qIdx]
                                            ? (JSON.parse(previewAnswers[qIdx] || "[]")[pIdx] || "")
                                            : ""
                                        }
                                        onChange={(e) => {
                                          let currentList: string[] = [];
                                          try {
                                            currentList = previewAnswers[qIdx]
                                              ? JSON.parse(previewAnswers[qIdx])
                                              : Array(blanks.length).fill("");
                                          } catch {
                                            currentList = Array(blanks.length).fill("");
                                          }
                                          currentList[pIdx] = e.target.value;
                                          setPreviewAnswers((prev) => ({
                                            ...prev,
                                            [qIdx]: JSON.stringify(currentList),
                                          }));
                                        }}
                                        className="h-6 w-28 text-xs font-semibold bg-background border-primary/40 inline-block px-2 text-center"
                                      />
                                    )}
                                  </React.Fragment>
                                ))}
                              </div>
                            );
                          })()}
                          <div className="text-[10px] text-primary font-semibold flex items-center gap-1 pt-1">
                            <Check className="h-3 w-3" /> Эталонные пропуски: {q.options.map((b, i) => `#${i + 1}: «${b}»`).join(", ")}
                          </div>
                        </div>
                      ) : q.type === "ORDERING" ? (
                        <div className="p-3.5 rounded-lg border bg-background space-y-2">
                          <div className="text-[11px] text-muted-foreground font-semibold flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <ListOrdered className="h-3.5 w-3.5 text-primary" /> Выстройте элементы в нужный порядок (стрелочками ▲ / ▼):
                            </span>
                          </div>
                          <div className="space-y-1.5">
                            {(previewAnswers[qIdx]
                              ? JSON.parse(previewAnswers[qIdx])
                              : q.options
                            ).map((optText: string, optIdx: number, arr: string[]) => (
                              <div
                                key={optIdx}
                                className="p-2.5 rounded-lg border bg-card flex items-center justify-between text-xs font-medium"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="h-5 w-5 rounded-md bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                                    {optIdx + 1}
                                  </span>
                                  <span>{optText}</span>
                                </div>
                                <div className="flex items-center gap-0.5">
                                  <Button
                                    type="button"
                                    size="xs"
                                    variant="ghost"
                                    disabled={optIdx === 0}
                                    onClick={() => {
                                      const updated = [...arr];
                                      const [moved] = updated.splice(optIdx, 1);
                                      updated.splice(optIdx - 1, 0, moved);
                                      setPreviewAnswers((prev) => ({
                                        ...prev,
                                        [qIdx]: JSON.stringify(updated),
                                      }));
                                    }}
                                    className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                                  >
                                    <ChevronUp className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    type="button"
                                    size="xs"
                                    variant="ghost"
                                    disabled={optIdx === arr.length - 1}
                                    onClick={() => {
                                      const updated = [...arr];
                                      const [moved] = updated.splice(optIdx, 1);
                                      updated.splice(optIdx + 1, 0, moved);
                                      setPreviewAnswers((prev) => ({
                                        ...prev,
                                        [qIdx]: JSON.stringify(updated),
                                      }));
                                    }}
                                    className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                                  >
                                    <ChevronDown className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : q.type === "MATCHING" ? (
                        <div className="p-3.5 rounded-lg border bg-background space-y-2">
                          <div className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1.5">
                            <Layers className="h-3.5 w-3.5 text-primary" /> Сопоставьте элементы:
                          </div>
                          <div className="space-y-2">
                            {(Array.isArray(q.options) ? q.options : []).map((pair: any, pIdx: number) => {
                              const leftVal = typeof pair === "object" ? pair.left : pair;
                              const rightVal = typeof pair === "object" ? pair.right : "";
                              return (
                                <div key={pIdx} className="p-2.5 rounded-lg border bg-card flex items-center justify-between gap-3 text-xs">
                                  <span className="font-medium text-foreground">{leftVal}</span>
                                  <span className="text-muted-foreground font-bold">➔</span>
                                  <span className="font-semibold text-primary">{rightVal}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : q.type === "NUMERICAL" ? (
                        <div className="p-3.5 rounded-lg border bg-background space-y-2">
                          <div className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1.5">
                            <Hash className="h-3.5 w-3.5 text-primary" /> Числовой ответ:
                          </div>
                          {(() => {
                            let numObj = { value: 0, tolerance: 0 };
                            try {
                              numObj = JSON.parse(q.correctAnswer || "{}");
                            } catch {}
                            return (
                              <div className="p-2.5 rounded-lg border bg-card flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Эталонное значение:</span>
                                <span className="font-mono font-bold text-primary">
                                  {numObj.value} {numObj.tolerance ? `(± ${numObj.tolerance})` : ""}
                                </span>
                              </div>
                            );
                          })()}
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {q.options.map((opt, optIdx) => {
                            const optText = typeof opt === "object" ? (opt.left ? `${opt.left} ➔ ${opt.right}` : JSON.stringify(opt)) : String(opt);
                            const isCorrect = isOptionCorrect(q, optText);
                            const isSelected =
                              q.type === "MULTIPLE"
                                ? selectedMultiple.includes(optText)
                                : selectedVal === optText;

                            return (
                              <div
                                key={optIdx}
                                onClick={() => handlePreviewSelect(qIdx, optText, q.type)}
                                className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-2 cursor-pointer transition-all ${
                                  isSelected
                                    ? "border-primary bg-primary/10 font-semibold text-primary shadow-xs"
                                    : isCorrect
                                      ? "border-primary/40 bg-primary/5 text-foreground"
                                      : "border-border bg-background text-foreground hover:bg-muted/40"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`h-4 w-4 rounded-${q.type === "MULTIPLE" ? "md" : "full"} border flex items-center justify-center ${
                                      isSelected
                                        ? "border-primary bg-primary text-primary-foreground"
                                        : "border-muted-foreground/40"
                                    }`}
                                  >
                                    {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                                  </div>
                                  <span>{optText}</span>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  {isSelected && (
                                    <Badge variant="outline" className="text-[9px] border-primary text-primary bg-primary/10 font-bold">
                                      Выбрано вами
                                    </Badge>
                                  )}
                                  {isCorrect && (
                                    <Badge className="bg-primary text-primary-foreground text-[9px] font-normal">
                                      ✓ Эталонный ответ
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-3.5 border rounded-xl bg-card space-y-3 text-xs shadow-xs">
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
                  onClick={() => handleAddQuestionAt()}
                  className="h-7 text-xs gap-1 text-primary border-primary/30 hover:bg-primary/10 font-medium shrink-0"
                >
                  <PlusCircle className="h-3.5 w-3.5" /> Добавить вопрос
                </Button>
              </div>

              <div className="space-y-4">
                {questionDrafts.map((q, qIdx) => {
                  const isDraggingQ = draggedQuestionIdx === qIdx;
                  const isOverQ = dragOverQuestionIdx === qIdx;

                  return (
                    <React.Fragment key={qIdx}>
                      <div
                        id={`question-card-${qIdx}`}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", qIdx.toString());
                          setDraggedQuestionIdx(qIdx);
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                        }}
                        onDragEnter={() => setDragOverQuestionIdx(qIdx)}
                        onDragEnd={() => {
                          setDraggedQuestionIdx(null);
                          setDragOverQuestionIdx(null);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (draggedQuestionIdx !== null && draggedQuestionIdx !== qIdx) {
                            handleMoveQuestion(draggedQuestionIdx, qIdx);
                          }
                          setDraggedQuestionIdx(null);
                          setDragOverQuestionIdx(null);
                        }}
                        className={`p-3.5 border rounded-xl bg-card space-y-3 relative transition-all ${
                          isDraggingQ ? "opacity-40 scale-[0.99] border-dashed border-primary" : ""
                        } ${isOverQ && !isDraggingQ ? "border-2 border-primary bg-primary/5 shadow-sm" : ""}`}
                      >
                        {/* Question Header: Drag Handle, Order, Type Selector, Points, Copy, Move, Remove */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {/* Drag Handle */}
                            <div
                              className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                              title="Перетащите для изменения порядка вопросов"
                            >
                              <GripVertical className="h-4 w-4" />
                            </div>

                            <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                              {qIdx + 1}
                            </span>
                            <span className="font-bold text-xs text-foreground">Вопрос #{qIdx + 1}</span>

                            {/* Quick Up/Down Move Buttons */}
                            <div className="flex items-center gap-0.5">
                              <Button
                                type="button"
                                size="xs"
                                variant="ghost"
                                disabled={qIdx === 0}
                                onClick={() => handleMoveQuestion(qIdx, qIdx - 1)}
                                className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
                                title="Переместить вверх"
                              >
                                <ChevronUp className="h-3 w-3" />
                              </Button>
                              <Button
                                type="button"
                                size="xs"
                                variant="ghost"
                                disabled={qIdx === questionDrafts.length - 1}
                                onClick={() => handleMoveQuestion(qIdx, qIdx + 1)}
                                className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
                                title="Переместить вниз"
                              >
                                <ChevronDown className="h-3 w-3" />
                              </Button>
                            </div>

                            {/* Question Type Selector Pills */}
                            <div className="flex flex-wrap gap-1 p-0.5 bg-muted/60 rounded-lg border text-[11px] font-medium ml-1">
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
                              
                              <button
                                type="button"
                                onClick={() => handleUpdateQuestionType(qIdx, "ORDERING")}
                                className={`px-2 py-0.5 rounded-md transition-colors flex items-center gap-1 ${
                                  q.type === "ORDERING"
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                                title="Расстановка элементов в правильном порядке"
                              >
                                <ListOrdered className="h-3 w-3" /> Последовательность
                              </button>

                              <button
                                type="button"
                                onClick={() => handleUpdateQuestionType(qIdx, "BLANKS")}
                                className={`px-2 py-0.5 rounded-md transition-colors flex items-center gap-1 ${
                                  q.type === "BLANKS"
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                                title="Заполнение пропущенных слов [слово]"
                              >
                                <FormInput className="h-3 w-3" /> Пропуски
                              </button>

                              <button
                                type="button"
                                onClick={() => handleUpdateQuestionType(qIdx, "CODE")}
                                className={`px-2 py-0.5 rounded-md transition-colors flex items-center gap-1 ${
                                  q.type === "CODE"
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                                title="Фрагмент кода и вопрос по нему"
                              >
                                <Code className="h-3 w-3" /> Код / Сниппет
                              </button>

                              <button
                                type="button"
                                onClick={() => handleUpdateQuestionType(qIdx, "MATCHING")}
                                className={`px-2 py-0.5 rounded-md transition-colors flex items-center gap-1 ${
                                  q.type === "MATCHING"
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                                title="Сопоставление пар элементов (термин <-> определение)"
                              >
                                <Layers className="h-3 w-3" /> Сопоставление
                              </button>

                              <button
                                type="button"
                                onClick={() => handleUpdateQuestionType(qIdx, "NUMERICAL")}
                                className={`px-2 py-0.5 rounded-md transition-colors flex items-center gap-1 ${
                                  q.type === "NUMERICAL"
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                                title="Числовой ответ с допустимой погрешностью"
                              >
                                <Hash className="h-3 w-3" /> Число
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
                            placeholder={
                              q.type === "BLANKS"
                                ? "Пример: В JavaScript переменная объявляется через [const] или [let]"
                                : q.type === "CODE"
                                  ? "Пример: Что напечатает эта программа в консоль?"
                                  : "Введите текст тестового вопроса..."
                            }
                            value={q.questionText}
                            onChange={(e) => handleUpdateQuestionText(qIdx, e.target.value)}
                            className="h-8 text-xs bg-background font-medium"
                          />
                        </div>

                        {/* Code Snippet Editor for CODE type */}
                        {q.type === "CODE" && (
                          <div className="space-y-1 pt-1">
                            <label className="text-[11px] font-semibold text-primary flex items-center gap-1">
                              <Terminal className="h-3.5 w-3.5" /> Фрагмент кода (Code Snippet)
                            </label>
                            <Textarea
                              placeholder="// Вставьте исходный код программы..."
                              value={q.codeSnippet || ""}
                              onChange={(e) =>
                                setQuestionDrafts((prev) => {
                                  const copy = [...prev];
                                  copy[qIdx].codeSnippet = e.target.value;
                                  return copy;
                                })
                              }
                              className="text-xs font-mono bg-slate-950 text-emerald-400 p-3 rounded-lg border min-h-[90px] leading-relaxed"
                            />
                          </div>
                        )}

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
                        ) : q.type === "BLANKS" ? (
                          <div className="space-y-2 pt-2 border-t">
                            <div className="p-3 rounded-lg border bg-primary/5 space-y-2">
                              <div className="text-[11px] font-semibold text-primary flex items-center gap-1.5">
                                <FormInput className="h-4 w-4 text-primary" /> Инструкция по созданию пропусков в тексте:
                              </div>
                              <p className="text-[11px] text-muted-foreground leading-relaxed">
                                Пишите формулировку вопроса и выделяйте нужные правильные пропущенные слова <strong>в квадратных скобках `[слово]`</strong>. 
                                Система автоматически сделает их скрытыми полями ввода для студентов.
                              </p>

                              {(() => {
                                const { blanks } = extractBlanksFromText(q.questionText);
                                if (blanks.length === 0) {
                                  return (
                                    <div className="text-[11px] text-primary/80 font-medium bg-primary/10 p-2 rounded border border-primary/20">
                                      ⚠️ Вы ещё не выделили ни одного пропуска. Добавьте в текст скобки `[слово]`, например: <i>«Столица Франции — [Париж]»</i>.
                                    </div>
                                  );
                                }

                                return (
                                  <div className="space-y-1 pt-1 border-t border-primary/20">
                                    <div className="text-[11px] font-semibold text-foreground">
                                      Автоматически обнаружено верных пропусков ({blanks.length} шт.):
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                    {blanks.map((b, bIdx) => (
                                        <Badge key={bIdx} variant="outline" className="text-[10px] bg-background border-primary text-primary font-mono font-bold">
                                          Пропуск #{bIdx + 1}: «{b}»
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        ) : q.type === "MATCHING" ? (
                          <div className="space-y-2 pt-2 border-t">
                            <div className="flex items-center justify-between text-[11px] text-muted-foreground font-semibold">
                              <span className="flex items-center gap-1 text-primary">
                                <Layers className="h-3.5 w-3.5" /> Пары для сопоставления (Слева термин — Справа определение):
                              </span>
                              <button
                                type="button"
                                onClick={() => handleAddMatchingPair(qIdx)}
                                className="text-primary hover:underline text-[11px] font-medium flex items-center gap-1"
                              >
                                <PlusCircle className="h-3 w-3" /> Добавить пару
                              </button>
                            </div>

                            <div className="space-y-2">
                              {(Array.isArray(q.options) ? q.options : []).map((pair: any, pIdx: number) => {
                                const leftVal = typeof pair === "object" ? pair.left : pair;
                                const rightVal = typeof pair === "object" ? pair.right : "";
                                return (
                                  <div key={pIdx} className="flex items-center gap-2">
                                    <span className="h-6 w-6 rounded-md bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                                      {pIdx + 1}
                                    </span>

                                    <Input
                                      placeholder="Термин / Элемент слева..."
                                      value={leftVal}
                                      onChange={(e) => handleUpdateMatchingPair(qIdx, pIdx, "left", e.target.value)}
                                      className="h-7 text-xs bg-background flex-1 font-medium"
                                    />

                                    <span className="text-muted-foreground font-bold">➔</span>

                                    <Input
                                      placeholder="Определение / Пара справа..."
                                      value={rightVal}
                                      onChange={(e) => handleUpdateMatchingPair(qIdx, pIdx, "right", e.target.value)}
                                      className="h-7 text-xs bg-background flex-1 font-medium"
                                    />

                                    {Array.isArray(q.options) && q.options.length > 1 && (
                                      <Button
                                        type="button"
                                        size="xs"
                                        variant="ghost"
                                        onClick={() => handleRemoveMatchingPair(qIdx, pIdx)}
                                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive shrink-0"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : q.type === "NUMERICAL" ? (
                          <div className="space-y-2 pt-2 border-t">
                            <label className="text-[11px] font-semibold text-primary flex items-center gap-1">
                              <Hash className="h-3.5 w-3.5" /> Числовой эталонный ответ и допустимая погрешность
                            </label>
                            {(() => {
                              let numObj = { value: 10, tolerance: 0.1 };
                              try {
                                numObj = JSON.parse(q.correctAnswer || "{}");
                              } catch {}
                              return (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg border bg-muted/20">
                                  <div className="space-y-1">
                                    <label className="text-[10px] text-muted-foreground font-medium">
                                      Точное числовое значение:
                                    </label>
                                    <Input
                                      type="number"
                                      step="any"
                                      placeholder="Например: 9.8"
                                      value={numObj.value ?? 0}
                                      onChange={(e) => handleUpdateNumerical(qIdx, "value", e.target.value)}
                                      className="h-8 text-xs font-mono bg-background"
                                    />
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-[10px] text-muted-foreground font-medium">
                                      Допустимая погрешность (± Δ):
                                    </label>
                                    <Input
                                      type="number"
                                      step="any"
                                      placeholder="Например: 0.05"
                                      value={numObj.tolerance ?? 0}
                                      onChange={(e) => handleUpdateNumerical(qIdx, "tolerance", e.target.value)}
                                      className="h-8 text-xs font-mono bg-background"
                                    />
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        ) : q.type === "ORDERING" ? (
                          <div className="space-y-2 pt-2 border-t">
                            <div className="flex items-center justify-between text-[11px] text-muted-foreground font-semibold">
                              <span className="flex items-center gap-1 text-primary">
                                <ListOrdered className="h-3.5 w-3.5" /> Элементы в верном эталонном порядке:
                              </span>
                              <button
                                type="button"
                                onClick={() => handleAddOption(qIdx)}
                                className="text-primary hover:underline text-[11px] font-medium flex items-center gap-1"
                              >
                                <PlusCircle className="h-3 w-3" /> Элемент
                              </button>
                            </div>

                            <div className="space-y-2">
                              {q.options.map((opt, optIdx) => (
                                <div key={optIdx} className="flex items-center gap-2">
                                  <span className="h-6 w-6 rounded-md bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                                    {optIdx + 1}
                                  </span>

                                  <Input
                                    value={opt}
                                    onChange={(e) => handleUpdateOptionText(qIdx, optIdx, e.target.value)}
                                    className="h-7 text-xs bg-background flex-1 font-medium"
                                  />

                                  {q.options.length > 2 && (
                                    <Button
                                      type="button"
                                      size="xs"
                                      variant="ghost"
                                      onClick={() => handleRemoveOption(qIdx, optIdx)}
                                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive shrink-0"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2 pt-2 border-t">
                            <div className="flex items-center justify-between text-[11px] text-muted-foreground font-semibold">
                              <span className="flex items-center gap-1">
                                Варианты ответов (нажмите на галочку для выбора{" "}
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

                            <div className="space-y-2">
                              {q.options.map((opt, optIdx) => {
                                const isCorrect = isOptionCorrect(q, opt);
                                const isDraggingOpt = draggedOption?.qIdx === qIdx && draggedOption?.optIdx === optIdx;
                                const isOverOpt = dragOverOption?.qIdx === qIdx && dragOverOption?.optIdx === optIdx;

                                return (
                                  <div
                                    key={optIdx}
                                    draggable={q.type !== "TRUE_FALSE"}
                                    onDragStart={(e) => {
                                      e.stopPropagation();
                                      setDraggedOption({ qIdx, optIdx });
                                    }}
                                    onDragOver={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                    }}
                                    onDragEnter={(e) => {
                                      e.stopPropagation();
                                      setDragOverOption({ qIdx, optIdx });
                                    }}
                                    onDragEnd={(e) => {
                                      e.stopPropagation();
                                      setDraggedOption(null);
                                      setDragOverOption(null);
                                    }}
                                    onDrop={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      if (
                                        draggedOption &&
                                        draggedOption.qIdx === qIdx &&
                                        draggedOption.optIdx !== optIdx
                                      ) {
                                        handleMoveOption(qIdx, draggedOption.optIdx, optIdx);
                                      }
                                      setDraggedOption(null);
                                      setDragOverOption(null);
                                    }}
                                    className={`flex items-center gap-2 p-1 rounded-lg border transition-all ${
                                      isDraggingOpt ? "opacity-40 border-dashed border-primary" : "border-transparent"
                                    } ${isOverOpt && !isDraggingOpt ? "bg-primary/10 border-primary" : ""}`}
                                  >
                                    {q.type !== "TRUE_FALSE" && (
                                      <div
                                        className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground shrink-0"
                                        title="Перетащите для изменения порядка вариантов"
                                      >
                                        <GripVertical className="h-3.5 w-3.5" />
                                      </div>
                                    )}

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

                    {/* Quick Insert Divider Between Questions */}
                    <div className="flex items-center justify-center py-0.5 group">
                      <button
                        type="button"
                        onClick={() => handleAddQuestionAt(qIdx + 1)}
                        className="h-6 px-3 text-[10px] rounded-full border border-dashed border-primary/30 bg-background text-primary opacity-50 group-hover:opacity-100 hover:border-primary hover:bg-primary/10 transition-all font-semibold flex items-center gap-1 shadow-2xs cursor-pointer"
                        title={`Вставить новый вопрос между #${qIdx + 1} и #${qIdx + 2}`}
                      >
                        <PlusCircle className="h-3 w-3" /> Вставить вопрос после #{qIdx + 1}
                      </button>
                    </div>
                  </React.Fragment>
                );
              })}

              <Button
                type="button"
                size="xs"
                variant="outline"
                onClick={() => handleAddQuestionAt()}
                className="w-full h-8 text-xs gap-1.5 text-primary border-dashed border-primary/40 hover:bg-primary/5 font-medium"
              >
                <PlusCircle className="h-3.5 w-3.5" /> Добавить еще один вопрос в конец
              </Button>
              </div>
            </div>
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
