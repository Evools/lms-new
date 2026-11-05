"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Layout,
  Grid,
  Trophy,
  Check,
  Copy,
  RotateCcw,
  Plus,
  Trash2,
  Sparkles,
  ArrowRight,
  ArrowDown,
  Info,
  Maximize2,
  Minimize2,
  ChevronRight,
  Code,
  Sliders,
  Compass,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface FlexItem {
  id: number;
  label: string;
  order: number;
  flexGrow: number;
  flexShrink: number;
  flexBasis: string;
  alignSelf: "auto" | "flex-start" | "center" | "flex-end" | "stretch";
  width?: string;
  height?: string;
  colorScheme: "emerald" | "sky" | "violet" | "amber";
}

interface Mission {
  id: number;
  title: string;
  level: "Начальный" | "Базовый" | "Продвинутый";
  description: string;
  hint: string;
  targetLayout: "flex" | "grid";
  initialState: {
    display: "flex" | "grid";
    flexDirection?: "row" | "column" | "row-reverse" | "column-reverse";
    justifyContent?: string;
    alignItems?: string;
    flexWrap?: "nowrap" | "wrap" | "wrap-reverse";
    gap: number;
    gridTemplateColumns?: string;
    itemCount: number;
  };
  validate: (state: {
    display: "flex" | "grid";
    flexDirection: string;
    justifyContent: string;
    alignItems: string;
    flexWrap: string;
    gap: number;
    gridTemplateColumns: string;
    items: FlexItem[];
  }) => boolean;
}

const MISSIONS: Mission[] = [
  {
    id: 1,
    title: "Идеальный центр (Dead Center)",
    level: "Начальный",
    description: "Разместите карточку строго по центру контейнера как по горизонтали, так и по вертикали.",
    hint: "Используйте комбинацию justify-content: center и align-items: center.",
    targetLayout: "flex",
    initialState: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "flex-start",
      alignItems: "flex-start",
      flexWrap: "nowrap",
      gap: 12,
      itemCount: 1,
    },
    validate: (s) => s.display === "flex" && s.justifyContent === "center" && s.alignItems === "center",
  },
  {
    id: 2,
    title: "Шапка навигации (Navbar)",
    level: "Начальный",
    description: "Разнесите элементы к противоположным краям (как логотип и кнопки профиля) и выровняйте по вертикальному центру.",
    hint: "Установите justify-content: space-between и align-items: center.",
    targetLayout: "flex",
    initialState: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "flex-start",
      alignItems: "flex-start",
      flexWrap: "nowrap",
      gap: 12,
      itemCount: 2,
    },
    validate: (s) => s.display === "flex" && s.justifyContent === "space-between" && s.alignItems === "center",
  },
  {
    id: 3,
    title: "Мобильный стек (Column Layout)",
    level: "Базовый",
    description: "Перестройте элементы в вертикальную колонку с отступом между блоками не менее 16px.",
    hint: "Установите flex-direction: column и отрегулируйте слайдер gap до 16px или больше.",
    targetLayout: "flex",
    initialState: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "flex-start",
      alignItems: "stretch",
      flexWrap: "nowrap",
      gap: 8,
      itemCount: 3,
    },
    validate: (s) => s.display === "flex" && s.flexDirection === "column" && s.gap >= 16,
  },
  {
    id: 4,
    title: "Плиточный каталог с переносом (Wrap)",
    level: "Базовый",
    description: "Включите перенос элементов на новую строку при нехватке места и распределите их равномерно.",
    hint: "Включите flex-wrap: wrap и выберите justify-content: space-around или space-evenly.",
    targetLayout: "flex",
    initialState: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "flex-start",
      alignItems: "stretch",
      flexWrap: "nowrap",
      gap: 12,
      itemCount: 5,
    },
    validate: (s) =>
      s.display === "flex" &&
      s.flexWrap === "wrap" &&
      (s.justifyContent === "space-around" || s.justifyContent === "space-evenly"),
  },
  {
    id: 5,
    title: "Выделяющийся элемент (Align Self)",
    level: "Продвинутый",
    description: "Выделите Блок №2 и прижмите индивидуально только его к нижней границе контейнера.",
    hint: "Кликните по Блоку 2 в панели элементов и задайте свойство align-self: flex-end.",
    targetLayout: "flex",
    initialState: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "flex-start",
      flexWrap: "nowrap",
      gap: 16,
      itemCount: 3,
    },
    validate: (s) => {
      const item2 = s.items.find((i) => i.id === 2);
      return s.display === "flex" && item2 !== undefined && item2.alignSelf === "flex-end";
    },
  },
  {
    id: 6,
    title: "Адаптивная CSS Grid сетка",
    level: "Продвинутый",
    description: "Переключитесь на CSS Grid и создайте 3 равные колонки (1fr 1fr 1fr) с межстрочным шагом 16px.",
    hint: "Переключите режим контейнера на CSS Grid, выберите шаблон 3 колонок (1fr 1fr 1fr) и установите gap: 16px.",
    targetLayout: "grid",
    initialState: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 8,
      itemCount: 6,
    },
    validate: (s) => s.display === "grid" && s.gridTemplateColumns === "1fr 1fr 1fr" && s.gap === 16,
  },
];

const INITIAL_ITEMS: FlexItem[] = [
  { id: 1, label: "Блок 1", order: 0, flexGrow: 0, flexShrink: 1, flexBasis: "auto", alignSelf: "auto", colorScheme: "emerald" },
  { id: 2, label: "Блок 2", order: 0, flexGrow: 0, flexShrink: 1, flexBasis: "auto", alignSelf: "auto", colorScheme: "sky" },
  { id: 3, label: "Блок 3", order: 0, flexGrow: 0, flexShrink: 1, flexBasis: "auto", alignSelf: "auto", colorScheme: "violet" },
];

export function LayoutLabView() {
  const [activeMode, setActiveMode] = useState<"sandbox" | "missions">("sandbox");
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Container State
  const [displayMode, setDisplayMode] = useState<"flex" | "grid">("flex");
  const [flexDirection, setFlexDirection] = useState<"row" | "column" | "row-reverse" | "column-reverse">("row");
  const [justifyContent, setJustifyContent] = useState<string>("flex-start");
  const [alignItems, setAlignItems] = useState<string>("stretch");
  const [flexWrap, setFlexWrap] = useState<"nowrap" | "wrap" | "wrap-reverse">("nowrap");
  const [gap, setGap] = useState<number>(12);

  // Grid Specific
  const [gridColumns, setGridColumns] = useState<string>("repeat(3, 1fr)");

  // Items State
  const [items, setItems] = useState<FlexItem[]>(INITIAL_ITEMS);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(1);

  // Missions State
  const [currentMissionIdx, setCurrentMissionIdx] = useState<number>(0);
  const [completedMissionIds, setCompletedMissionIds] = useState<number[]>([]);
  const [missionStatus, setMissionStatus] = useState<"idle" | "success" | "error">("idle");
  const [missionMessage, setMissionMessage] = useState<string>("");

  // Code Copy State
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Load completed missions from storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("lms_css_lab_missions_v1");
      if (saved) {
        setCompletedMissionIds(JSON.parse(saved));
      }
    } catch {}
  }, []);

  const saveProgress = (newCompleted: number[]) => {
    setCompletedMissionIds(newCompleted);
    try {
      localStorage.setItem("lms_css_lab_missions_v1", JSON.stringify(newCompleted));
    } catch {}
  };

  // Switch mission
  const loadMission = (idx: number) => {
    const mission = MISSIONS[idx];
    if (!mission) return;

    setCurrentMissionIdx(idx);
    setMissionStatus("idle");
    setMissionMessage("");

    setDisplayMode(mission.initialState.display);
    if (mission.initialState.flexDirection) setFlexDirection(mission.initialState.flexDirection);
    if (mission.initialState.justifyContent) setJustifyContent(mission.initialState.justifyContent);
    if (mission.initialState.alignItems) setAlignItems(mission.initialState.alignItems);
    if (mission.initialState.flexWrap) setFlexWrap(mission.initialState.flexWrap);
    setGap(mission.initialState.gap);
    if (mission.initialState.gridTemplateColumns) setGridColumns(mission.initialState.gridTemplateColumns);

    // Generate items for mission
    const colors: FlexItem["colorScheme"][] = ["emerald", "sky", "violet", "amber"];
    const newItems: FlexItem[] = Array.from({ length: mission.initialState.itemCount }, (_, i) => ({
      id: i + 1,
      label: `Блок ${i + 1}`,
      order: 0,
      flexGrow: 0,
      flexShrink: 1,
      flexBasis: "auto",
      alignSelf: "auto",
      colorScheme: colors[i % colors.length],
    }));
    setItems(newItems);
    setSelectedItemId(1);
  };

  // Check current mission
  const checkMission = () => {
    const current = MISSIONS[currentMissionIdx];
    const isPassing = current.validate({
      display: displayMode,
      flexDirection,
      justifyContent,
      alignItems,
      flexWrap,
      gap,
      gridTemplateColumns: gridColumns,
      items,
    });

    if (isPassing) {
      setMissionStatus("success");
      setMissionMessage("Отлично! Условия задания полностью выполнены.");
      if (!completedMissionIds.includes(current.id)) {
        const updated = [...completedMissionIds, current.id];
        saveProgress(updated);
      }
    } else {
      setMissionStatus("error");
      setMissionMessage(`Пока не сходится. Подсказка: ${current.hint}`);
    }
  };

  // Add / Remove item
  const addItem = () => {
    if (items.length >= 8) return;
    const colors: FlexItem["colorScheme"][] = ["emerald", "sky", "violet", "amber"];
    const newId = items.length > 0 ? Math.max(...items.map((i) => i.id)) + 1 : 1;
    const newItem: FlexItem = {
      id: newId,
      label: `Блок ${newId}`,
      order: 0,
      flexGrow: 0,
      flexShrink: 1,
      flexBasis: "auto",
      alignSelf: "auto",
      colorScheme: colors[(newId - 1) % colors.length],
    };
    setItems([...items, newItem]);
    setSelectedItemId(newId);
  };

  const removeItem = () => {
    if (items.length <= 1) return;
    const filtered = items.slice(0, -1);
    setItems(filtered);
    if (selectedItemId === items[items.length - 1].id) {
      setSelectedItemId(filtered[filtered.length - 1].id);
    }
  };

  const resetSandbox = () => {
    setDisplayMode("flex");
    setFlexDirection("row");
    setJustifyContent("flex-start");
    setAlignItems("stretch");
    setFlexWrap("nowrap");
    setGap(12);
    setGridColumns("repeat(3, 1fr)");
    setItems(INITIAL_ITEMS);
    setSelectedItemId(1);
  };

  // Current selected item
  const currentItem = items.find((i) => i.id === selectedItemId);

  const updateCurrentItem = (updates: Partial<FlexItem>) => {
    if (!selectedItemId) return;
    setItems((prev) => prev.map((item) => (item.id === selectedItemId ? { ...item, ...updates } : item)));
  };

  // Generated CSS Code
  const generatedCss = useMemo(() => {
    if (displayMode === "flex") {
      let code = `.container {\n  display: flex;\n  flex-direction: ${flexDirection};\n  justify-content: ${justifyContent};\n  align-items: ${alignItems};\n  flex-wrap: ${flexWrap};\n  gap: ${gap}px;\n}`;
      const customizedItems = items.filter(
        (i) => i.order !== 0 || i.flexGrow !== 0 || i.flexShrink !== 1 || i.flexBasis !== "auto" || i.alignSelf !== "auto"
      );
      if (customizedItems.length > 0) {
        code += "\n\n/* Индивидуальные стили элементов */";
        customizedItems.forEach((it) => {
          code += `\n.item:nth-child(${it.id}) {`;
          if (it.order !== 0) code += `\n  order: ${it.order};`;
          if (it.flexGrow !== 0) code += `\n  flex-grow: ${it.flexGrow};`;
          if (it.flexShrink !== 1) code += `\n  flex-shrink: ${it.flexShrink};`;
          if (it.flexBasis !== "auto") code += `\n  flex-basis: ${it.flexBasis};`;
          if (it.alignSelf !== "auto") code += `\n  align-self: ${it.alignSelf};`;
          code += `\n}`;
        });
      }
      return code;
    } else {
      return `.container {\n  display: grid;\n  grid-template-columns: ${gridColumns};\n  gap: ${gap}px;\n  align-items: ${alignItems};\n}`;
    }
  }, [displayMode, flexDirection, justifyContent, alignItems, flexWrap, gap, gridColumns, items]);

  const copyCssToClipboard = () => {
    navigator.clipboard.writeText(generatedCss);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1500);
  };

  const isMainAxisHorizontal = flexDirection === "row" || flexDirection === "row-reverse";

  return (
    <div
      className={`space-y-2.5 pb-6 transition-all ${
        isFullscreen
          ? "fixed inset-0 z-50 bg-background p-3 flex flex-col h-screen overflow-hidden pb-3"
          : ""
      }`}
    >
      {/* Sleek Top Header Bar */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border bg-card shrink-0 text-xs">
        {/* Left: Branding & Tag */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 font-bold text-primary text-xs">
            <Layout className="h-4 w-4" />
            <span>CSS Лаборатория</span>
          </div>
          <span className="text-muted-foreground/40 hidden sm:inline">•</span>
          <span className="text-[11px] text-muted-foreground hidden sm:inline">
            Интерактивный тренажёр Flexbox & Grid
          </span>
        </div>

        {/* Center: Mode Toggle (Pill style, static font-weight) */}
        <div className="flex items-center bg-muted/70 p-0.5 rounded-lg border text-xs">
          <button
            type="button"
            onClick={() => setActiveMode("sandbox")}
            className={`flex items-center gap-1.5 h-6 px-3 rounded-md font-medium transition-colors ${
              activeMode === "sandbox"
                ? "bg-background text-foreground border border-border/80"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sliders className="h-3 w-3" />
            <span>Лаборатория</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveMode("missions");
              loadMission(currentMissionIdx);
            }}
            className={`flex items-center gap-1.5 h-6 px-3 rounded-md font-medium transition-colors ${
              activeMode === "missions"
                ? "bg-background text-foreground border border-border/80"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Trophy className="h-3 w-3 text-amber-500" />
            <span>Миссии</span>
            {completedMissionIds.length > 0 && (
              <span className="text-[9px] px-1 py-0.2 rounded-full bg-primary/10 text-primary border border-primary/20">
                {completedMissionIds.length}/{MISSIONS.length}
              </span>
            )}
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          <Button
            size="xs"
            variant="ghost"
            onClick={resetSandbox}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
            title="Сбросить все параметры"
          >
            <RotateCcw className="h-3 w-3" />
            <span className="hidden md:inline">Сброс</span>
          </Button>

          <Button
            size="xs"
            variant={isFullscreen ? "secondary" : "ghost"}
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            title={isFullscreen ? "Выйти из полного экрана" : "На весь экран"}
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5 text-primary" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {/* Missions Top Panel (Only when Missions mode is active) */}
      {activeMode === "missions" && (
        <div className="p-3 rounded-xl border bg-card text-xs space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-foreground">
                Миссия {MISSIONS[currentMissionIdx].id} из {MISSIONS.length}: {MISSIONS[currentMissionIdx].title}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
                {MISSIONS[currentMissionIdx].level}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {MISSIONS.map((m, idx) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => loadMission(idx)}
                  className={`h-6 w-6 rounded-md text-[11px] font-medium border flex items-center justify-center transition-colors ${
                    currentMissionIdx === idx
                      ? "border-primary bg-primary text-primary-foreground"
                      : completedMissionIds.includes(m.id)
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                  title={m.title}
                >
                  {completedMissionIds.includes(m.id) ? <Check className="h-3 w-3" /> : m.id}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <p className="text-muted-foreground leading-relaxed">
              {MISSIONS[currentMissionIdx].description}
            </p>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="xs"
                variant="default"
                onClick={checkMission}
                className="h-7 px-3 text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Проверить решение</span>
              </Button>

              {currentMissionIdx < MISSIONS.length - 1 && (
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => loadMission(currentMissionIdx + 1)}
                  className="h-7 px-2 text-xs gap-1"
                >
                  <span>Далее</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>

          {missionStatus !== "idle" && (
            <div
              className={`p-2 rounded-lg border text-xs flex items-center gap-2 animate-in fade-in-50 ${
                missionStatus === "success"
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                  : "bg-destructive/10 text-destructive border-destructive/20"
              }`}
            >
              {missionStatus === "success" ? (
                <Sparkles className="h-4 w-4 shrink-0 text-emerald-500" />
              ) : (
                <Info className="h-4 w-4 shrink-0 text-destructive" />
              )}
              <span className="font-medium">{missionMessage}</span>
            </div>
          )}
        </div>
      )}

      {/* Main 2-Column Work Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-[560px]">
        {/* LEFT COLUMN: Controls & Inspectors (5 cols) */}
        <div className="lg:col-span-5 space-y-3 flex flex-col">
          {/* Box 1: Container Layout Properties */}
          <div className="p-3.5 rounded-xl border bg-card text-xs space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-1.5 font-bold text-foreground">
                <Sliders className="h-3.5 w-3.5 text-primary" />
                <span>Свойства контейнера</span>
              </div>

              {/* Mode switch: Flex / Grid */}
              <div className="flex items-center bg-muted/60 p-0.5 rounded-md border text-[11px]">
                <button
                  type="button"
                  onClick={() => setDisplayMode("flex")}
                  className={`px-2 py-0.5 rounded font-medium transition-colors ${
                    displayMode === "flex" ? "bg-background text-primary border border-border" : "text-muted-foreground"
                  }`}
                >
                  Flexbox
                </button>
                <button
                  type="button"
                  onClick={() => setDisplayMode("grid")}
                  className={`px-2 py-0.5 rounded font-medium transition-colors ${
                    displayMode === "grid" ? "bg-background text-primary border border-border" : "text-muted-foreground"
                  }`}
                >
                  CSS Grid
                </button>
              </div>
            </div>

            {displayMode === "flex" ? (
              <div className="space-y-2.5">
                {/* flex-direction */}
                <div>
                  <div className="flex items-center justify-between text-muted-foreground mb-1 text-[11px]">
                    <span className="font-medium text-foreground">flex-direction:</span>
                    <span className="font-mono text-[10px] text-primary">{flexDirection}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 text-[11px]">
                    {(["row", "column", "row-reverse", "column-reverse"] as const).map((dir) => (
                      <button
                        key={dir}
                        type="button"
                        onClick={() => setFlexDirection(dir)}
                        className={`py-1 px-1.5 rounded-md border text-center font-medium transition-colors truncate ${
                          flexDirection === dir
                            ? "bg-primary/10 text-primary border-primary"
                            : "border-border text-muted-foreground hover:bg-muted/70"
                        }`}
                      >
                        {dir}
                      </button>
                    ))}
                  </div>
                </div>

                {/* justify-content */}
                <div>
                  <div className="flex items-center justify-between text-muted-foreground mb-1 text-[11px]">
                    <span className="font-medium text-foreground">justify-content:</span>
                    <span className="font-mono text-[10px] text-primary">{justifyContent}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-[11px]">
                    {["flex-start", "center", "flex-end", "space-between", "space-around", "space-evenly"].map((jc) => (
                      <button
                        key={jc}
                        type="button"
                        onClick={() => setJustifyContent(jc)}
                        className={`py-1 px-1 rounded-md border text-center font-medium transition-colors truncate text-[10px] ${
                          justifyContent === jc
                            ? "bg-primary/10 text-primary border-primary"
                            : "border-border text-muted-foreground hover:bg-muted/70"
                        }`}
                      >
                        {jc}
                      </button>
                    ))}
                  </div>
                </div>

                {/* align-items */}
                <div>
                  <div className="flex items-center justify-between text-muted-foreground mb-1 text-[11px]">
                    <span className="font-medium text-foreground">align-items:</span>
                    <span className="font-mono text-[10px] text-primary">{alignItems}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-[11px]">
                    {["stretch", "center", "flex-start", "flex-end", "baseline"].map((ai) => (
                      <button
                        key={ai}
                        type="button"
                        onClick={() => setAlignItems(ai)}
                        className={`py-1 px-1 rounded-md border text-center font-medium transition-colors truncate text-[10px] ${
                          alignItems === ai
                            ? "bg-primary/10 text-primary border-primary"
                            : "border-border text-muted-foreground hover:bg-muted/70"
                        }`}
                      >
                        {ai}
                      </button>
                    ))}
                  </div>
                </div>

                {/* flex-wrap & gap */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t">
                  <div>
                    <label className="block text-[11px] font-medium text-foreground mb-1">flex-wrap:</label>
                    <div className="grid grid-cols-3 gap-1 text-[10px]">
                      {(["nowrap", "wrap", "wrap-reverse"] as const).map((w) => (
                        <button
                          key={w}
                          type="button"
                          onClick={() => setFlexWrap(w)}
                          className={`py-1 px-1 rounded border text-center font-medium transition-colors truncate ${
                            flexWrap === w
                              ? "bg-primary/10 text-primary border-primary"
                              : "border-border text-muted-foreground hover:bg-muted/70"
                          }`}
                        >
                          {w}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1 text-[11px]">
                      <label className="font-medium text-foreground">gap:</label>
                      <span className="font-mono text-[10px] text-primary">{gap}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="48"
                      step="4"
                      value={gap}
                      onChange={(e) => setGap(parseInt(e.target.value, 10))}
                      className="w-full accent-primary h-1.5 cursor-pointer mt-1.5"
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* Grid Controls */
              <div className="space-y-2.5">
                <div>
                  <div className="flex items-center justify-between text-muted-foreground mb-1 text-[11px]">
                    <span className="font-medium text-foreground">grid-template-columns:</span>
                    <span className="font-mono text-[10px] text-primary">{gridColumns}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[11px]">
                    {[
                      { label: "2 Колонки", val: "1fr 1fr" },
                      { label: "3 Колонки", val: "1fr 1fr 1fr" },
                      { label: "Адаптивная", val: "repeat(auto-fit, minmax(100px, 1fr))" },
                      { label: "Боковая + Контент", val: "140px 1fr" },
                    ].map((gc) => (
                      <button
                        key={gc.val}
                        type="button"
                        onClick={() => setGridColumns(gc.val)}
                        className={`py-1.5 px-2 rounded-md border text-center font-medium transition-colors text-[10px] truncate ${
                          gridColumns === gc.val
                            ? "bg-primary/10 text-primary border-primary"
                            : "border-border text-muted-foreground hover:bg-muted/70"
                        }`}
                      >
                        {gc.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1 text-[11px]">
                    <label className="font-medium text-foreground">Расстояние (gap):</label>
                    <span className="font-mono text-[10px] text-primary">{gap}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="48"
                    step="4"
                    value={gap}
                    onChange={(e) => setGap(parseInt(e.target.value, 10))}
                    className="w-full accent-primary h-1.5 cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Box 2: Item Inspector (Selected Block) */}
          <div className="p-3.5 rounded-xl border bg-card text-xs space-y-2.5">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-1.5 font-bold text-foreground">
                <Compass className="h-3.5 w-3.5 text-primary" />
                <span>Элементы (Flex Items)</span>
              </div>

              {/* Add / Remove buttons */}
              <div className="flex items-center gap-1">
                <Button
                  size="xs"
                  variant="outline"
                  onClick={removeItem}
                  disabled={items.length <= 1}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  title="Удалить последний элемент"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={addItem}
                  disabled={items.length >= 8}
                  className="h-6 px-2 text-[10px] gap-1 text-primary hover:bg-primary/10"
                  title="Добавить новый блок"
                >
                  <Plus className="h-3 w-3" />
                  <span>Блок</span>
                </Button>
              </div>
            </div>

            {/* Item Selector Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {items.map((it) => (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => setSelectedItemId(it.id)}
                  className={`h-6 px-2 rounded-md font-medium text-[11px] border shrink-0 transition-colors ${
                    selectedItemId === it.id
                      ? "bg-primary/10 text-primary border-primary"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {it.label}
                </button>
              ))}
            </div>

            {/* Selected item specific controls */}
            {currentItem && (
              <div className="bg-muted/40 p-2.5 rounded-lg border space-y-2 text-[11px]">
                <div className="flex items-center justify-between font-medium text-foreground">
                  <span>Свойства {currentItem.label}:</span>
                  <span className="font-mono text-[10px] text-muted-foreground">ID: #{currentItem.id}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-muted-foreground">flex-grow (расширение):</label>
                    <div className="flex items-center gap-1 mt-0.5">
                      {[0, 1, 2, 3].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => updateCurrentItem({ flexGrow: val })}
                          className={`flex-1 py-0.5 rounded text-[10px] border font-medium ${
                            currentItem.flexGrow === val
                              ? "bg-primary text-primary-foreground border-primary"
                              : "border-border text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-muted-foreground">align-self (поперек):</label>
                    <select
                      value={currentItem.alignSelf}
                      onChange={(e) =>
                        updateCurrentItem({
                          alignSelf: e.target.value as FlexItem["alignSelf"],
                        })
                      }
                      className="w-full mt-0.5 bg-background border border-border rounded p-1 text-[10px] font-mono outline-none text-foreground"
                    >
                      <option value="auto">auto</option>
                      <option value="flex-start">flex-start</option>
                      <option value="center">center</option>
                      <option value="flex-end">flex-end</option>
                      <option value="stretch">stretch</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/60">
                  <div>
                    <label className="text-[10px] text-muted-foreground">порядок (order):</label>
                    <div className="flex items-center gap-1 mt-0.5">
                      {[-1, 0, 1, 2].map((ord) => (
                        <button
                          key={ord}
                          type="button"
                          onClick={() => updateCurrentItem({ order: ord })}
                          className={`flex-1 py-0.5 rounded text-[10px] border font-medium ${
                            currentItem.order === ord
                              ? "bg-primary text-primary-foreground border-primary"
                              : "border-border text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          {ord}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-muted-foreground">базовый размер (basis):</label>
                    <div className="flex items-center gap-1 mt-0.5">
                      {["auto", "80px", "140px"].map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => updateCurrentItem({ flexBasis: b })}
                          className={`flex-1 py-0.5 rounded text-[9px] border font-medium truncate ${
                            currentItem.flexBasis === b
                              ? "bg-primary text-primary-foreground border-primary"
                              : "border-border text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Box 3: Generated CSS Code Box */}
          <div className="p-3.5 rounded-xl border bg-card text-xs space-y-2 flex-1 flex flex-col">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-foreground">
                <Code className="h-3.5 w-3.5 text-primary" />
                <span>Сгенерированный CSS</span>
              </div>
              <Button
                size="xs"
                variant="outline"
                onClick={copyCssToClipboard}
                className="h-6 px-2 text-[10px] gap-1 text-muted-foreground hover:text-foreground"
              >
                {copiedCode ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
                <span>{copiedCode ? "Скопировано!" : "Копировать"}</span>
              </Button>
            </div>

            <pre className="p-2.5 rounded-lg bg-zinc-950 text-emerald-400 font-mono text-[11px] overflow-x-auto leading-relaxed border border-border/80 flex-1 min-h-[90px]">
              {generatedCss}
            </pre>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Stage / Canvas (7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-2">
          {/* Top Axis Bar Indicator */}
          <div className="flex items-center justify-between px-3 py-1.5 rounded-lg border bg-card text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground text-[11px]">Оси координат:</span>
              <div className="flex items-center gap-1 text-[11px] text-primary">
                {isMainAxisHorizontal ? <ArrowRight className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                <span className="font-medium">
                  Главная (Main): {isMainAxisHorizontal ? "Горизонтальная (X)" : "Вертикальная (Y)"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-[11px] text-muted-foreground hidden sm:flex">
              {isMainAxisHorizontal ? <ArrowDown className="h-3 w-3" /> : <ArrowRight className="h-3 w-3" />}
              <span>Поперечная (Cross): {isMainAxisHorizontal ? "Y" : "X"}</span>
            </div>
          </div>

          {/* Interactive Stage Box */}
          <div className="relative flex-1 min-h-[460px] rounded-xl border border-dashed border-border/80 bg-zinc-950/60 p-4 overflow-hidden flex flex-col shadow-inner">
            {/* Background Blueprint Grid Lines */}
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)",
                backgroundSize: "24px 24px",
              }}
            />

            {/* Container Stage Element */}
            <div
              className="w-full flex-1 rounded-lg border border-primary/20 bg-primary/[0.02] p-3 transition-all duration-300 relative"
              style={
                displayMode === "flex"
                  ? {
                      display: "flex",
                      flexDirection,
                      justifyContent,
                      alignItems,
                      flexWrap,
                      gap: `${gap}px`,
                    }
                  : {
                      display: "grid",
                      gridTemplateColumns: gridColumns,
                      gap: `${gap}px`,
                      alignItems,
                    }
              }
            >
              {items.map((it) => {
                const isSelected = selectedItemId === it.id;

                // Color themes for blocks
                const colorMap = {
                  emerald: "bg-emerald-500/10 border-emerald-500/40 text-emerald-400 hover:border-emerald-400",
                  sky: "bg-sky-500/10 border-sky-500/40 text-sky-400 hover:border-sky-400",
                  violet: "bg-violet-500/10 border-violet-500/40 text-violet-400 hover:border-violet-400",
                  amber: "bg-amber-500/10 border-amber-500/40 text-amber-400 hover:border-amber-400",
                };

                return (
                  <div
                    key={it.id}
                    onClick={() => setSelectedItemId(it.id)}
                    style={{
                      order: it.order,
                      flexGrow: it.flexGrow,
                      flexShrink: it.flexShrink,
                      flexBasis: it.flexBasis !== "auto" ? it.flexBasis : undefined,
                      alignSelf: it.alignSelf !== "auto" ? it.alignSelf : undefined,
                      minWidth: "80px",
                      minHeight: "72px",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                    className={`p-3 rounded-lg border cursor-pointer select-none flex flex-col justify-between relative group ${
                      colorMap[it.colorScheme]
                    } ${isSelected ? "border-primary ring-1 ring-primary bg-primary/20" : ""}`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-xs">{it.label}</span>
                      {isSelected && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-primary text-primary-foreground font-semibold">
                          Активен
                        </span>
                      )}
                    </div>

                    <div className="font-mono text-[9px] opacity-70 mt-2 space-y-0.5">
                      {it.flexGrow > 0 && <div>grow: {it.flexGrow}</div>}
                      {it.alignSelf !== "auto" && <div>self: {it.alignSelf}</div>}
                      {it.order !== 0 && <div>order: {it.order}</div>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Stage bottom info bar */}
            <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground border-t pt-2 border-border/40">
              <span className="font-mono">
                {displayMode === "flex" ? `display: flex; gap: ${gap}px;` : `display: grid; gap: ${gap}px;`}
              </span>
              <span className="italic text-[10px]">Кликните на любой блок на сцене для настройки</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

