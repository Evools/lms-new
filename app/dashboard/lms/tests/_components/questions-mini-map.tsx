"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CircleDot,
  CheckSquare,
  Type,
  ToggleLeft,
  ListOrdered,
  FormInput,
  Code,
  ArrowUpDown,
  Hash,
  Plus,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  List,
} from "lucide-react";
import { QuestionDraft, QuestionType } from "../new/_components/create-test-view";

interface QuestionsMiniMapProps {
  questions: QuestionDraft[];
  activeIndex?: number;
  onSelectQuestion: (index: number) => void;
  onAddQuestion?: () => void;
}

const TYPE_CONFIG: Record<
  QuestionType,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  SINGLE: { label: "Один выбор", icon: CircleDot },
  MULTIPLE: { label: "Мультивыбор", icon: CheckSquare },
  TEXT: { label: "Текстовый", icon: Type },
  TRUE_FALSE: { label: "Да/Нет", icon: ToggleLeft },
  ORDERING: { label: "Порядок", icon: ListOrdered },
  BLANKS: { label: "Пропуски", icon: FormInput },
  CODE: { label: "Код", icon: Code },
  MATCHING: { label: "Пары", icon: ArrowUpDown },
  NUMERICAL: { label: "Число", icon: Hash },
};

export function isQuestionValid(q: QuestionDraft): boolean {
  if (!q.questionText?.trim()) return false;
  if (q.type === "SINGLE" || q.type === "MULTIPLE" || q.type === "TRUE_FALSE") {
    return Boolean(q.correctAnswer?.trim()) && (q.options?.length ?? 0) >= 2;
  }
  if (q.type === "MATCHING") {
    return (q.options?.length ?? 0) >= 2;
  }
  if (q.type === "BLANKS") {
    return Boolean(q.correctAnswer?.trim());
  }
  if (q.type === "ORDERING") {
    return (q.options?.length ?? 0) >= 2;
  }
  return Boolean(q.correctAnswer?.trim());
}

export function QuestionsMiniMap({
  questions,
  activeIndex,
  onSelectQuestion,
  onAddQuestion,
}: QuestionsMiniMapProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const totalQuestions = questions.length;
  const totalPoints = questions.reduce((acc, q) => acc + (q.points || 1), 0);
  const validQuestionsCount = questions.filter(isQuestionValid).length;
  const isAllValid = totalQuestions > 0 && validQuestionsCount === totalQuestions;

  return (
    <div className="bg-card border rounded-xl p-2.5 text-xs space-y-2 shadow-2xs">
      {/* Compact Header */}
      <div className="flex items-center justify-between gap-1.5">
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-1.5 font-bold text-foreground text-xs hover:text-primary transition-colors cursor-pointer"
        >
          <HelpCircle className="h-3.5 w-3.5 text-primary shrink-0" />
          <span>Навигатор ({validQuestionsCount}/{totalQuestions})</span>
          {isCollapsed ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </button>

        <div className="flex items-center gap-1.5 shrink-0">
          <Badge
            variant="outline"
            className="text-[9px] font-mono border-primary/30 text-primary bg-primary/10 font-medium px-1.5 py-0"
          >
            {totalPoints} б.
          </Badge>

          {!isCollapsed && (
            <div className="flex items-center p-0.5 bg-muted/60 rounded-md border">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`p-1 rounded text-[10px] transition-colors cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-background text-primary shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Сетка номеров"
              >
                <LayoutGrid className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`p-1 rounded text-[10px] transition-colors cursor-pointer ${
                  viewMode === "list"
                    ? "bg-background text-primary shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Список с описанием"
              >
                <List className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Body: Collapsible */}
      {!isCollapsed && (
        <>
          {totalQuestions === 0 ? (
            <div className="py-2 text-center text-[11px] text-muted-foreground italic">
              Вопросы еще не добавлены
            </div>
          ) : viewMode === "grid" ? (
            /* COMPACT PILL GRID (Default: ultra space-saving) */
            <div className="flex flex-wrap gap-1 max-h-[140px] overflow-y-auto pr-0.5 py-0.5">
              {questions.map((q, idx) => {
                const config = TYPE_CONFIG[q.type] || { label: q.type, icon: CircleDot };
                const valid = isQuestionValid(q);
                const isActive = activeIndex === idx;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onSelectQuestion(idx)}
                    title={`#${idx + 1} • ${config.label} (${q.points}б)\n${
                      q.questionText?.trim() || "Текст не заполнен"
                    }\n${valid ? "✓ Заполнен" : "⚠ Требует заполнения"}`}
                    className={`h-7 w-7 rounded-md font-mono text-[11px] font-bold transition-all relative flex items-center justify-center cursor-pointer border ${
                      isActive
                        ? "bg-primary text-primary-foreground border-primary shadow-xs ring-2 ring-primary/30"
                        : valid
                          ? "bg-primary/5 hover:bg-primary/15 text-foreground border-primary/25"
                          : "bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 border-amber-500/40"
                    }`}
                  >
                    <span>{idx + 1}</span>
                    <span
                      className={`absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full ${
                        valid ? "bg-primary" : "bg-amber-500 animate-pulse"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          ) : (
            /* COMPACT LIST VIEW */
            <div className="max-h-[160px] overflow-y-auto space-y-1 pr-1 text-xs">
              {questions.map((q, idx) => {
                const config = TYPE_CONFIG[q.type] || { label: q.type, icon: CircleDot };
                const Icon = config.icon;
                const valid = isQuestionValid(q);
                const isActive = activeIndex === idx;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onSelectQuestion(idx)}
                    className={`w-full text-left px-2 py-1 rounded-md border transition-all flex items-center justify-between gap-1.5 cursor-pointer ${
                      isActive
                        ? "border-primary bg-primary/10 text-primary shadow-2xs"
                        : "border-border bg-muted/20 hover:bg-muted/60 text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <span
                        className={`h-4.5 w-4.5 rounded flex items-center justify-center font-bold text-[9px] shrink-0 font-mono ${
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        {idx + 1}
                      </span>

                      <div className="min-w-0 flex-1 truncate text-[11px]">
                        <span className="text-muted-foreground mr-1">[{config.label}]</span>
                        <span className="font-medium">
                          {q.questionText?.trim() || "(Без текста)"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {q.points}б
                      </span>
                      <div
                        className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                          valid ? "bg-primary" : "bg-amber-500 animate-pulse"
                        }`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Quick Add Button */}
          {onAddQuestion && (
            <div className="pt-1 border-t">
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={onAddQuestion}
                className="w-full h-6 text-[11px] gap-1 border-primary/20 text-primary hover:bg-primary/10 font-medium cursor-pointer"
              >
                <Plus className="h-3 w-3" />
                <span>Добавить вопрос</span>
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
