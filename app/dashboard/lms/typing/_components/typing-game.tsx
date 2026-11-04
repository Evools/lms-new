"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  generateTypingText,
  TypingLanguage,
  TypingMode,
  TypingContentType,
  getCpmVerdict,
  areTypingCharsEqual,
} from "../_lib/text-generator";
import { saveTypingAttemptAction, TypingAttemptItem } from "../actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  RotateCcw,
  Zap,
  Gauge,
  Percent,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Play,
  Award,
  Globe,
  Loader2,
  Code,
  BookOpen,
  CaseSensitive,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface TypingGameProps {
  onAttemptSaved?: (attempt: TypingAttemptItem) => void;
}

interface CompletedWord {
  target: string;
  typed: string;
  isCorrect: boolean;
  charErrors: number;
}

export function TypingGame({ onAttemptSaved }: TypingGameProps) {
  const [language, setLanguage] = useState<TypingLanguage>("RU");
  const [contentType, setContentType] = useState<TypingContentType>("TEXT");
  const [mode, setMode] = useState<TypingMode>("TIME_30");
  const [showHelp, setShowHelp] = useState<boolean>(false);

  // Game state
  const [targetText, setTargetText] = useState<string>("");
  const [targetWords, setTargetWords] = useState<string[]>([]);
  const [currentWordIdx, setCurrentWordIdx] = useState<number>(0);
  const [currentInput, setCurrentInput] = useState<string>("");
  const [completedWords, setCompletedWords] = useState<CompletedWord[]>([]);

  const [isStarted, setIsStarted] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedResult, setSavedResult] = useState<TypingAttemptItem | null>(null);
  const [layoutWarning, setLayoutWarning] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const wordsContainerRef = useRef<HTMLDivElement>(null);
  const activeWordRef = useRef<HTMLSpanElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Initialize or reset game text
  const initGame = useCallback(
    (newLang = language, newMode = mode, newType = contentType) => {
      if (timerRef.current) clearInterval(timerRef.current);
      const text = generateTypingText(newLang, newMode, newType);
      const words = text.trim().split(/\s+/).filter(Boolean);

      setTargetText(text);
      setTargetWords(words);
      setCurrentWordIdx(0);
      setCurrentInput("");
      setCompletedWords([]);
      setIsStarted(false);
      setIsFinished(false);
      setSavedResult(null);
      setLayoutWarning(null);
      startTimeRef.current = null;
      setElapsedSeconds(0);

      if (newMode === "TIME_15") setTimeLeft(15);
      else if (newMode === "TIME_30") setTimeLeft(30);
      else if (newMode === "TIME_60") setTimeLeft(60);
      else if (newMode === "TIME_120") setTimeLeft(120);
      else setTimeLeft(0);

      setTimeout(() => inputRef.current?.focus(), 50);
    },
    [language, mode, contentType]
  );

  useEffect(() => {
    initGame(language, mode, contentType);
  }, [language, mode, contentType, initGame]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Auto-scroll active word into view smoothly
  useEffect(() => {
    if (activeWordRef.current && wordsContainerRef.current) {
      const container = wordsContainerRef.current;
      const el = activeWordRef.current;
      const elTop = el.offsetTop - container.offsetTop;
      if (elTop > 60 || elTop < 0) {
        container.scrollTo({ top: Math.max(0, elTop - 30), behavior: "smooth" });
      }
    }
  }, [currentWordIdx]);

  // Compute live statistics based on completed words + active word
  const stats = useMemo(() => {
    let correctChars = 0;
    let errorChars = 0;

    for (const w of completedWords) {
      if (w.isCorrect) {
        correctChars += w.target.length + 1; // +1 for the space
      } else {
        errorChars += Math.max(1, w.charErrors);
        const minLen = Math.min(w.target.length, w.typed.length);
        for (let i = 0; i < minLen; i++) {
          if (w.typed[i]?.toLowerCase() === w.target[i]?.toLowerCase()) {
            correctChars++;
          }
        }
      }
    }

    const currentTarget = targetWords[currentWordIdx] || "";
    for (let i = 0; i < currentInput.length; i++) {
      const typedChar = currentInput[i];
      const targetChar = currentTarget[i];
      if (areTypingCharsEqual(typedChar, targetChar, language === "CODE")) {
        correctChars++;
      } else {
        errorChars++;
      }
    }

    const totalTyped = correctChars + errorChars;
    const accuracy = totalTyped > 0 ? (correctChars / totalTyped) * 100 : 100;

    const timeSpent = Math.max(1, elapsedSeconds);
    const minutes = timeSpent / 60;
    const cpm = Math.round(correctChars / minutes);
    const wpm = Math.round(cpm / 5);

    return {
      correctChars,
      errorChars,
      totalTyped,
      accuracy,
      cpm,
      wpm,
      timeSpent,
    };
  }, [completedWords, currentInput, currentWordIdx, targetWords, language, elapsedSeconds]);

  // End test and persist result
  const finishGame = useCallback(
    async (finalElapsed: number, overrideWords = completedWords, overrideInput = currentInput) => {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsFinished(true);

      let correctChars = 0;
      let errorChars = 0;

      for (const w of overrideWords) {
        if (w.isCorrect) {
          correctChars += w.target.length + 1;
        } else {
          errorChars += Math.max(1, w.charErrors);
          const minLen = Math.min(w.target.length, w.typed.length);
          for (let i = 0; i < minLen; i++) {
            if (w.typed[i]?.toLowerCase() === w.target[i]?.toLowerCase()) {
              correctChars++;
            }
          }
        }
      }

      if (overrideInput.length > 0) {
        const curTarget = targetWords[currentWordIdx] || "";
        for (let i = 0; i < overrideInput.length; i++) {
          const tChar = overrideInput[i];
          const trgChar = curTarget[i];
          if (areTypingCharsEqual(tChar, trgChar, language === "CODE")) {
            correctChars++;
          } else {
            errorChars++;
          }
        }
      }

      const totalTyped = correctChars + errorChars;
      const accuracy = totalTyped > 0 ? (correctChars / totalTyped) * 100 : 100;
      const minutes = Math.max(1, finalElapsed) / 60;
      const cpm = Math.round(correctChars / minutes);
      const wpm = Math.round(cpm / 5);

      if (totalTyped >= 5) {
        setIsSaving(true);
        try {
          const res = await saveTypingAttemptAction({
            language,
            mode,
            cpm,
            wpm,
            accuracy,
            errorsCount: errorChars,
            totalChars: totalTyped,
            durationSeconds: finalElapsed,
          });
          if (res?.attempt) {
            setSavedResult(res.attempt);
            onAttemptSaved?.(res.attempt);
          }
        } catch (e) {
          console.error("Failed to save typing attempt", e);
        } finally {
          setIsSaving(false);
        }
      }
    },
    [completedWords, currentInput, targetWords, currentWordIdx, language, mode, onAttemptSaved]
  );

  // Start timer on first keystroke
  const startTimerIfNeeded = () => {
    if (isStarted) return;
    setIsStarted(true);
    startTimeRef.current = Date.now();

    const isTimeMode = mode.startsWith("TIME_");
    const duration =
      mode === "TIME_15"
        ? 15
        : mode === "TIME_30"
        ? 30
        : mode === "TIME_60"
        ? 60
        : 120;

    timerRef.current = setInterval(() => {
      if (!startTimeRef.current) return;
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsedSeconds(elapsed);

      if (isTimeMode) {
        const remaining = duration - elapsed;
        if (remaining <= 0) {
          setTimeLeft(0);
          finishGame(duration);
        } else {
          setTimeLeft(remaining);
        }
      }
    }, 1000);
  };

  // Keyboard navigation and spacebar commit
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isFinished) return;

    if (e.key === " " || e.code === "Space") {
      e.preventDefault();
      if (!currentInput.trim()) return;

      startTimerIfNeeded();

      const currentTarget = targetWords[currentWordIdx] || "";
      const typed = currentInput.trim();

      // Normalize words: tolerant to punctuation, dashes, and letter case
      const stripPunct = (s: string) =>
        s
          .replace(/[.,!?:;—"']/g, "")
          .replace(/[—–−]/g, "-")
          .replace(/ё/g, "е")
          .toLowerCase();

      const isExactMatch =
        language === "CODE"
          ? typed === currentTarget
          : areTypingCharsEqual(typed, currentTarget, false);

      const isLooseMatch = !isExactMatch && stripPunct(typed) === stripPunct(currentTarget);
      const isCorrect = isExactMatch || isLooseMatch;

      let charErrors = 0;
      for (let i = 0; i < Math.max(currentTarget.length, typed.length); i++) {
        const c1 = currentTarget[i];
        const c2 = typed[i];
        if (!areTypingCharsEqual(c2, c1, language === "CODE")) {
          charErrors++;
        }
      }

      const nextCompleted = [
        ...completedWords,
        {
          target: currentTarget,
          typed,
          isCorrect,
          charErrors,
        },
      ];
      setCompletedWords(nextCompleted);
      setCurrentInput("");

      if (currentWordIdx >= targetWords.length - 1) {
        const elapsed = startTimeRef.current
          ? Math.floor((Date.now() - startTimeRef.current) / 1000)
          : 1;
        finishGame(Math.max(1, elapsed), nextCompleted, "");
      } else {
        setCurrentWordIdx((prev) => prev + 1);
      }
      return;
    }

    if (e.key === "Backspace" && currentInput === "" && currentWordIdx > 0) {
      e.preventDefault();
      const prevIdx = currentWordIdx - 1;
      const prevWord = completedWords[prevIdx];
      if (prevWord) {
        setCurrentWordIdx(prevIdx);
        setCurrentInput(prevWord.typed);
        setCompletedWords((prev) => prev.slice(0, prevIdx));
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isFinished) return;
    const val = e.target.value;

    if (val.endsWith(" ")) {
      return;
    }

    startTimerIfNeeded();

    if (language === "EN" && /[а-яА-ЯёЁ]/.test(val)) {
      setLayoutWarning("Включена русская раскладка! Переключитесь на английский язык");
    } else if (language === "RU" && /[a-zA-Z]/.test(val)) {
      setLayoutWarning("Включена английская раскладка! Переключитесь на русский язык");
    } else {
      setLayoutWarning(null);
    }

    setCurrentInput(val);
  };

  const verdict = useMemo(() => getCpmVerdict(stats.cpm), [stats.cpm]);

  return (
    <div className="space-y-3">
      {/* Top Configuration Controls */}
      <div className="bg-card border rounded-xl p-3 flex flex-wrap items-center justify-between gap-2.5 shadow-2xs">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Languages pill */}
          <div className="flex items-center gap-0.5 bg-muted/60 p-0.5 rounded-lg border text-xs">
            <button
              type="button"
              onClick={() => {
                setLanguage("RU");
                initGame("RU", mode, contentType);
              }}
              className={`flex items-center gap-1.5 h-6 px-2.5 rounded-md font-medium transition-colors ${
                language === "RU"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Globe className="h-3 w-3" />
              <span>Русский</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setLanguage("EN");
                initGame("EN", mode, contentType);
              }}
              className={`flex items-center gap-1.5 h-6 px-2.5 rounded-md font-medium transition-colors ${
                language === "EN"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Globe className="h-3 w-3" />
              <span>English</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setLanguage("CODE");
                initGame("CODE", mode, contentType);
              }}
              className={`flex items-center gap-1.5 h-6 px-2.5 rounded-md font-medium transition-colors ${
                language === "CODE"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Code className="h-3 w-3" />
              <span>Web Code</span>
            </button>
          </div>

          {/* Content Type: Тексты vs Слова (только для языков RU / EN) */}
          {language !== "CODE" && (
            <div className="flex items-center gap-0.5 bg-muted/60 p-0.5 rounded-lg border text-xs">
              <button
                type="button"
                onClick={() => {
                  setContentType("TEXT");
                  initGame(language, mode, "TEXT");
                }}
                className={`flex items-center gap-1 h-6 px-2 rounded-md font-medium transition-colors ${
                  contentType === "TEXT"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Осмысленные статьи, цитаты и тексты об IT и программировании"
              >
                <BookOpen className="h-3 w-3" />
                <span>Тексты</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setContentType("WORDS");
                  initGame(language, mode, "WORDS");
                }}
                className={`flex items-center gap-1 h-6 px-2 rounded-md font-medium transition-colors ${
                  contentType === "WORDS"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Случайный набор отдельных слов"
              >
                <CaseSensitive className="h-3 w-3" />
                <span>Слова</span>
              </button>
            </div>
          )}

          {/* Mode pill */}
          <div className="flex items-center gap-0.5 bg-muted/60 p-0.5 rounded-lg border text-xs">
            <button
              type="button"
              onClick={() => {
                setMode("FREE");
                initGame(language, "FREE", contentType);
              }}
              className={`flex items-center gap-1 h-6 px-2.5 rounded-md font-medium transition-colors ${
                mode === "FREE"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Без обратного отсчета — вы просто печатаете в своем темпе, а система сама все рассчитает"
            >
              <Clock className="h-3 w-3" />
              <span>Без таймера</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("TIME_15");
                initGame(language, "TIME_15", contentType);
              }}
              className={`h-6 px-2 rounded-md font-medium transition-colors ${
                mode === "TIME_15"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              15с
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("TIME_30");
                initGame(language, "TIME_30", contentType);
              }}
              className={`h-6 px-2 rounded-md font-medium transition-colors ${
                mode === "TIME_30"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              30с
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("TIME_60");
                initGame(language, "TIME_60", contentType);
              }}
              className={`h-6 px-2 rounded-md font-medium transition-colors ${
                mode === "TIME_60"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              60с
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("WORDS_25");
                initGame(language, "WORDS_25", contentType);
              }}
              className={`h-6 px-2 rounded-md font-medium transition-colors ${
                mode === "WORDS_25"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              25 слов
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("WORDS_50");
                initGame(language, "WORDS_50", contentType);
              }}
              className={`h-6 px-2 rounded-md font-medium transition-colors ${
                mode === "WORDS_50"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              50 слов
            </button>
          </div>
        </div>

        {/* Right action buttons: Help toggle and Reload */}
        <div className="flex items-center gap-1.5">
          <Button
            size="xs"
            variant="ghost"
            onClick={() => setShowHelp(!showHelp)}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
            title="Инструкция: как устроен тренажер"
          >
            <HelpCircle className="h-3.5 w-3.5 text-primary" />
            <span className="hidden sm:inline">Как печатать?</span>
            {showHelp ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>

          <Button
            size="xs"
            variant="outline"
            onClick={() => initGame(language, mode, contentType)}
            className="h-7 px-2.5 gap-1.5 text-xs font-medium"
            title="Сгенерировать другой текст / перезапуск"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Другой текст</span>
          </Button>
        </div>
      </div>

      {/* Collapsible How It Works Guide Banner */}
      {showHelp && (
        <div className="p-3 rounded-xl border border-primary/20 bg-primary/5 text-xs text-foreground space-y-1.5 animate-in fade-in duration-150">
          <div className="font-semibold text-primary flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5" />
            <span>Как устроен клавиатурный тренажер лицея:</span>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground text-[11px] list-disc list-inside">
            <li>
              Набирайте текст слово за словом. Нажимайте <strong className="text-foreground">Пробел</strong>, чтобы зафиксировать слово и перейти к следующему.
            </li>
            <li>
              Опечатка в одном слове <strong className="text-foreground">не ломает</strong> остальной текст — вы продолжаете печатать свободно.
            </li>
            <li>
              Таймер и подсчет скорости запускаются <strong className="text-foreground">автоматически</strong> с первого нажатия клавиши.
            </li>
            <li>
              Ваш лучший результат автоматически сохраняется в <strong className="text-foreground">рейтинг группы и портфолио</strong> лицея.
            </li>
          </ul>
        </div>
      )}

      {/* Keyboard Layout Warning Banner */}
      {layoutWarning && (
        <div className="p-2 px-3 rounded-lg border border-destructive/40 bg-destructive/10 text-destructive flex items-center gap-2 text-xs font-medium animate-in fade-in duration-150">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{layoutWarning}</span>
        </div>
      )}

      {/* Live Metrics Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="p-2.5 rounded-xl border bg-card flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
              <Clock className="h-3 w-3 text-primary" />
              <span>{mode.startsWith("TIME_") ? "Осталось" : "Прошло"}</span>
            </div>
            <div className="font-mono text-xl font-bold text-foreground">
              {mode.startsWith("TIME_") ? `${timeLeft}с` : `${elapsedSeconds}с`}
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-muted-foreground">
              Слово: {Math.min(currentWordIdx + 1, targetWords.length)}/{targetWords.length}
            </span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl border bg-card flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
              <Gauge className="h-3 w-3 text-primary" />
              <span>Скорость (CPM)</span>
            </div>
            <div className="font-mono text-xl font-bold text-foreground">
              {stats.cpm}{" "}
              <span className="text-[11px] font-normal text-muted-foreground">зн/м</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-mono text-muted-foreground">{stats.wpm} WPM</span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl border bg-card flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
              <Percent className="h-3 w-3 text-primary" />
              <span>Точность</span>
            </div>
            <div className="font-mono text-xl font-bold text-foreground">
              {stats.accuracy.toFixed(1)}%
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-muted-foreground">Ошибок: {stats.errorChars}</span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl border bg-card flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
              <Zap className="h-3 w-3 text-primary" />
              <span>Уровень</span>
            </div>
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 font-medium ${verdict.badgeClass}`}
            >
              {verdict.label}
            </Badge>
          </div>
        </div>
      </div>

      {/* Interactive Typing Arena (Monkeytype Tokenized Engine) */}
      <div
        className="relative p-5 rounded-2xl border bg-card/60 backdrop-blur-xs min-h-[190px] flex flex-col justify-center cursor-text select-none overflow-hidden transition-all shadow-2xs focus-within:border-primary"
        onClick={() => inputRef.current?.focus()}
      >
        {/* Hidden capture input */}
        <input
          ref={inputRef}
          type="text"
          value={currentInput}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={isFinished}
          className="absolute inset-0 opacity-0 cursor-default -z-10"
          autoFocus
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />

        {/* Word Token Stream Display */}
        <div
          ref={wordsContainerRef}
          className="font-mono text-base sm:text-lg leading-relaxed flex flex-wrap gap-x-2 gap-y-2 max-h-[145px] overflow-y-hidden content-start transition-all"
        >
          {targetWords.map((word, wordIndex) => {
            const isCompleted = wordIndex < currentWordIdx;
            const isCurrent = wordIndex === currentWordIdx;
            const completedInfo = isCompleted ? completedWords[wordIndex] : null;

            if (isCompleted && completedInfo) {
              return (
                <span
                  key={wordIndex}
                  className={`inline-block ${
                    completedInfo.isCorrect
                      ? "text-foreground font-medium"
                      : "text-destructive underline decoration-destructive/70 font-medium"
                  }`}
                >
                  {completedInfo.typed}
                </span>
              );
            }

            if (isCurrent) {
              const targetChars = word.split("");
              const typedChars = currentInput.split("");
              const maxLen = Math.max(targetChars.length, typedChars.length);

              return (
                <span
                  ref={activeWordRef}
                  key={wordIndex}
                  className="inline-block relative"
                >
                  {Array.from({ length: maxLen }).map((_, charIdx) => {
                    const targetChar = targetChars[charIdx];
                    const typedChar = typedChars[charIdx];
                    const isCaretHere = charIdx === typedChars.length;

                    if (!targetChar && typedChar) {
                      return (
                        <span
                          key={charIdx}
                          className="bg-destructive/30 text-destructive font-bold underline"
                        >
                          {typedChar}
                        </span>
                      );
                    }

                    const isCharTyped = charIdx < typedChars.length;
                    const isMatch =
                      isCharTyped &&
                      areTypingCharsEqual(typedChar, targetChar, language === "CODE");

                    let charClass = "text-muted-foreground/60";
                    if (isCharTyped) {
                      charClass = isMatch
                        ? "text-primary font-bold"
                        : "bg-destructive/25 text-destructive font-bold rounded-xs";
                    }

                    return (
                      <span
                        key={charIdx}
                        className={`relative inline-block ${charClass} ${
                          isCaretHere ? "border-l-2 border-primary animate-pulse" : ""
                        }`}
                      >
                        {targetChar}
                      </span>
                    );
                  })}
                  {typedChars.length >= targetChars.length && (
                    <span className="inline-block border-l-2 border-primary animate-pulse h-4 align-middle" />
                  )}
                </span>
              );
            }

            return (
              <span key={wordIndex} className="inline-block text-muted-foreground/40">
                {word}
              </span>
            );
          })}
        </div>

        {/* Start Hint */}
        {!isStarted && !isFinished && (
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground animate-pulse">
            <Play className="h-3.5 w-3.5 text-primary" />
            <span>Начните вводить текст — нажимайте Пробел для перехода к следующему слову</span>
          </div>
        )}

        {/* Finish early button (visible when test is in progress and some words typed) */}
        {isStarted && !isFinished && completedWords.length >= 2 && (
          <div className="mt-3 flex items-center justify-between text-xs border-t pt-2.5">
            <span className="text-[11px] text-muted-foreground font-mono">
              Введено: {completedWords.length} слов • Текущий темп:{" "}
              <strong className="text-primary">{stats.cpm}</strong> зн/мин
            </span>
            <Button
              size="xs"
              variant="outline"
              onClick={() => {
                const elapsed = startTimeRef.current
                  ? Math.floor((Date.now() - startTimeRef.current) / 1000)
                  : 1;
                finishGame(Math.max(1, elapsed));
              }}
              className="h-6 text-[11px] gap-1 px-2.5 font-medium border-primary/30 text-primary hover:bg-primary/10"
              title="Завершить тест сейчас и зафиксировать результат"
            >
              <CheckCircle2 className="h-3 w-3" />
              <span>Завершить и рассчитать</span>
            </Button>
          </div>
        )}
      </div>

      {/* Completion Modal / Card */}
      {isFinished && (
        <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-primary/20 pb-2.5">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              <div>
                <h3 className="text-sm font-bold text-foreground">Тест завершен! Отличный результат</h3>
                <p className="text-[11px] text-muted-foreground">
                  Язык: {language === "RU" ? "Русский" : language === "EN" ? "English" : "Web Code"} • Режим: {mode === "FREE" ? "Без таймера" : mode.startsWith("TIME_") ? `${mode.replace("TIME_", "")} сек` : `${mode.replace("WORDS_", "")} слов`} • Затрачено: {stats.timeSpent} сек
                </p>
              </div>
            </div>

            <Badge variant="outline" className={`text-xs px-2.5 py-1 font-bold ${verdict.badgeClass}`}>
              {verdict.label}
            </Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono">
            <div className="p-2 rounded-lg border bg-background">
              <div className="text-[10px] text-muted-foreground font-sans">Скорость (CPM)</div>
              <div className="text-2xl font-bold text-primary">{stats.cpm}</div>
              <div className="text-[10px] text-muted-foreground">знаков/мин</div>
            </div>

            <div className="p-2 rounded-lg border bg-background">
              <div className="text-[10px] text-muted-foreground font-sans">Скорость (WPM)</div>
              <div className="text-2xl font-bold text-foreground">{stats.wpm}</div>
              <div className="text-[10px] text-muted-foreground">слов/мин</div>
            </div>

            <div className="p-2 rounded-lg border bg-background">
              <div className="text-[10px] text-muted-foreground font-sans">Точность</div>
              <div className="text-2xl font-bold text-foreground">{stats.accuracy.toFixed(1)}%</div>
              <div className="text-[10px] text-muted-foreground">{stats.errorChars} опечаток</div>
            </div>

            <div className="p-2 rounded-lg border bg-background">
              <div className="text-[10px] text-muted-foreground font-sans">Всего знаков</div>
              <div className="text-2xl font-bold text-foreground">{stats.totalTyped}</div>
              <div className="text-[10px] text-muted-foreground">введено</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-primary/20 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
              {isSaving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  <span>Сохранение результата в рейтинг лицея...</span>
                </>
              ) : savedResult ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-foreground">
                    Результат зафиксирован в базе лицея и в вашем портфолио!
                  </span>
                </>
              ) : (
                <span>Введено менее 5 символов, результат не сохранен</span>
              )}
            </div>

            <Button
              size="xs"
              onClick={() => initGame(language, mode, contentType)}
              className="h-7 px-3 gap-1.5 text-xs font-medium"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Пройти снова</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
