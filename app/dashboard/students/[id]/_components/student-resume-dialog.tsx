"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Languages,
  Wrench,
  UserCheck,
  Briefcase,
  Plus,
  Trash2,
  Check,
  Sparkles,
} from "lucide-react";
import type {
  StudentResumeProfileDTO,
  StudentLanguageItem,
  StudentSkillItem,
  StudentProjectItem,
} from "../../actions";

export const LANGUAGE_LEVEL_LABELS: Record<
  StudentLanguageItem["level"],
  { label: string; shortLabel: string; badgeClass: string }
> = {
  NATIVE: {
    label: "Родной язык",
    shortLabel: "Родной",
    badgeClass: "border-primary/30 bg-primary/10 text-primary",
  },
  FLUENT: {
    label: "Свободно владею (C1–C2)",
    shortLabel: "Свободно (C1–C2)",
    badgeClass:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
  CONVERSATIONAL: {
    label: "Разговорный уровень (B1–B2)",
    shortLabel: "Разговорный (B1–B2)",
    badgeClass:
      "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400",
  },
  DICTIONARY: {
    label: "Базовый / Читаю со словарём (A1–A2)",
    shortLabel: "Со словарём (A1–A2)",
    badgeClass: "border-border bg-muted/60 text-muted-foreground",
  },
};

export const SKILL_LEVEL_LABELS: Record<
  StudentSkillItem["level"],
  { label: string; badgeClass: string }
> = {
  ADVANCED: {
    label: "Уверенно",
    badgeClass: "border-primary/30 bg-primary/10 text-primary",
  },
  INTERMEDIATE: {
    label: "Средний",
    badgeClass:
      "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400",
  },
  BASIC: {
    label: "Базовый",
    badgeClass: "border-border bg-muted/60 text-muted-foreground",
  },
};

const POPULAR_LANGUAGES: Array<{
  language: string;
  defaultLevel: StudentLanguageItem["level"];
}> = [
  { language: "Кыргызский", defaultLevel: "NATIVE" },
  { language: "Русский", defaultLevel: "FLUENT" },
  { language: "Английский", defaultLevel: "DICTIONARY" },
  { language: "Турецкий", defaultLevel: "CONVERSATIONAL" },
  { language: "Немецкий", defaultLevel: "DICTIONARY" },
  { language: "Китайский", defaultLevel: "DICTIONARY" },
  { language: "Казахский", defaultLevel: "CONVERSATIONAL" },
  { language: "Узбекский", defaultLevel: "CONVERSATIONAL" },
];

const HARD_SKILL_CATEGORIES: Array<{ title: string; skills: string[] }> = [
  {
    title: "Веб и программирование",
    skills: [
      "HTML5, CSS3, адаптивная вёрстка",
      "JavaScript / TypeScript",
      "React / Next.js",
      "Python",
      "SQL / Базы данных (PostgreSQL, MySQL)",
      "Git / GitHub",
      "Figma (UI/UX макеты)",
    ],
  },
  {
    title: "Сети и администрирование",
    skills: [
      "Сборка, диагностика и ремонт ПК",
      "Настройка локальных сетей (LAN / Wi-Fi / Маршрутизаторы)",
      "Установка и администрирование Windows / Linux",
      "Информационная безопасность",
      "Техническая поддержка пользователей",
    ],
  },
  {
    title: "Офис и учёт",
    skills: ["MS Office (Word, Excel, PowerPoint)", "1С:Предприятие"],
  },
];

const PRESET_SOFT_SKILLS: string[] = [
  "Ответственность и дисциплинированность",
  "Быстрая обучаемость",
  "Умение работать в команде",
  "Пунктуальность",
  "Внимательность к деталям",
  "Аналитическое мышление",
  "Стрессоустойчивость",
  "Грамотная устная и письменная речь",
];

interface StudentResumeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialProfile: StudentResumeProfileDTO;
  onSave: (profile: StudentResumeProfileDTO) => Promise<void>;
  studentName: string;
}

export function StudentResumeDialog({
  isOpen,
  onClose,
  initialProfile,
  onSave,
  studentName,
}: StudentResumeDialogProps) {
  const [activeSection, setActiveSection] = useState<
    "general" | "skills" | "languages" | "projects"
  >("general");

  const [formData, setFormData] = useState<StudentResumeProfileDTO>(initialProfile);
  const [newLangName, setNewLangName] = useState("");
  const [newLangLevel, setNewLangLevel] =
    useState<StudentLanguageItem["level"]>("CONVERSATIONAL");

  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillLevel, setNewSkillLevel] =
    useState<StudentSkillItem["level"]>("INTERMEDIATE");

  const [newSoftSkill, setNewSoftSkill] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData(initialProfile);
    }
  }, [isOpen, initialProfile]);

  const handleAddOrToggleLanguage = (
    languageName: string,
    defaultLevel: StudentLanguageItem["level"] = "CONVERSATIONAL"
  ) => {
    const clean = languageName.trim();
    if (!clean) return;
    setFormData((prev) => {
      const exists = prev.languages.some(
        (l) => l.language.toLowerCase() === clean.toLowerCase()
      );
      if (exists) {
        return prev;
      }
      return {
        ...prev,
        languages: [
          ...prev.languages,
          {
            id: `lang-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
            language: clean,
            level: defaultLevel,
          },
        ],
      };
    });
    setNewLangName("");
  };

  const handleUpdateLanguageLevel = (
    id: string,
    level: StudentLanguageItem["level"]
  ) => {
    setFormData((prev) => ({
      ...prev,
      languages: prev.languages.map((l) => (l.id === id ? { ...l, level } : l)),
    }));
  };

  const handleRemoveLanguage = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      languages: prev.languages.filter((l) => l.id !== id),
    }));
  };

  const handleAddHardSkill = (
    skillName: string,
    level: StudentSkillItem["level"] = "INTERMEDIATE"
  ) => {
    const clean = skillName.trim();
    if (!clean) return;
    setFormData((prev) => {
      if (
        prev.hardSkills.some((s) => s.name.toLowerCase() === clean.toLowerCase())
      ) {
        return prev;
      }
      return {
        ...prev,
        hardSkills: [
          ...prev.hardSkills,
          {
            id: `sk-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
            name: clean,
            level,
          },
        ],
      };
    });
    setNewSkillName("");
  };

  const handleUpdateHardSkillLevel = (
    id: string,
    level: StudentSkillItem["level"]
  ) => {
    setFormData((prev) => ({
      ...prev,
      hardSkills: prev.hardSkills.map((s) =>
        s.id === id ? { ...s, level } : s
      ),
    }));
  };

  const handleRemoveHardSkill = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      hardSkills: prev.hardSkills.filter((s) => s.id !== id),
    }));
  };

  const handleToggleSoftSkill = (skill: string) => {
    const clean = skill.trim();
    if (!clean) return;
    setFormData((prev) => {
      const exists = prev.softSkills.includes(clean);
      return {
        ...prev,
        softSkills: exists
          ? prev.softSkills.filter((s) => s !== clean)
          : [...prev.softSkills, clean],
      };
    });
  };

  const handleAddProject = () => {
    const newProj: StudentProjectItem = {
      id: `proj-${Date.now()}`,
      title: "",
      role: "Практикант / Исполнитель",
      period: "2026 г.",
      description: "",
    };
    setFormData((prev) => ({
      ...prev,
      projects: [...prev.projects, newProj],
    }));
  };

  const handleUpdateProject = (
    id: string,
    field: keyof StudentProjectItem,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === id ? { ...p, [field]: value } : p
      ),
    }));
  };

  const handleRemoveProject = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      projects: prev.projects.filter((p) => p.id !== id),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-0 gap-0 text-xs w-[95vw] sm:max-w-[960px] h-[85vh] sm:h-[640px] max-h-[88vh] flex flex-col overflow-hidden">
        <DialogHeader className="px-5 py-3.5 border-b gap-0.5 place-items-start text-left shrink-0">
          <DialogTitle className="text-sm font-bold flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-primary" />
            Настройка резюме — {studentName}
          </DialogTitle>
          <DialogDescription className="text-[11px] text-muted-foreground">
            Заполните разделы резюме для портфолио и экспорта в Word / PDF
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="grid grid-cols-1 md:grid-cols-[210px_1fr] flex-1 min-h-0">
            {/* Left Category Navigation */}
            <aside className="border-b md:border-b-0 md:border-r bg-muted/20 p-2.5 flex md:flex-col gap-1 overflow-x-auto md:overflow-y-auto shrink-0">
              <button
                type="button"
                onClick={() => setActiveSection("general")}
                className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-md text-left transition-colors cursor-pointer shrink-0 ${
                  activeSection === "general"
                    ? "bg-primary/10 text-primary border border-primary/25"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <UserCheck className="h-3.5 w-3.5 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-medium truncate">Основное</div>
                    <div className="text-[10px] opacity-75 hidden md:block truncate">
                      Цель, о себе, контакты
                    </div>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveSection("skills")}
                className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-md text-left transition-colors cursor-pointer shrink-0 ${
                  activeSection === "skills"
                    ? "bg-primary/10 text-primary border border-primary/25"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Wrench className="h-3.5 w-3.5 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-medium truncate">Навыки</div>
                    <div className="text-[10px] opacity-75 hidden md:block truncate">
                      Hard & Soft skills
                    </div>
                  </div>
                </div>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 shrink-0">
                  {formData.hardSkills.length}
                </Badge>
              </button>

              <button
                type="button"
                onClick={() => setActiveSection("languages")}
                className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-md text-left transition-colors cursor-pointer shrink-0 ${
                  activeSection === "languages"
                    ? "bg-primary/10 text-primary border border-primary/25"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Languages className="h-3.5 w-3.5 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-medium truncate">Языки</div>
                    <div className="text-[10px] opacity-75 hidden md:block truncate">
                      Уровень владения
                    </div>
                  </div>
                </div>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 shrink-0">
                  {formData.languages.length}
                </Badge>
              </button>

              <button
                type="button"
                onClick={() => setActiveSection("projects")}
                className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-md text-left transition-colors cursor-pointer shrink-0 ${
                  activeSection === "projects"
                    ? "bg-primary/10 text-primary border border-primary/25"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Briefcase className="h-3.5 w-3.5 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-medium truncate">Практика</div>
                    <div className="text-[10px] opacity-75 hidden md:block truncate">
                      Опыт и проекты
                    </div>
                  </div>
                </div>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 shrink-0">
                  {formData.projects.length}
                </Badge>
              </button>
            </aside>

            {/* Right Content Area */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* SECTION 1: LANGUAGES */}
          {activeSection === "languages" && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-lg border border-border bg-muted/20 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">
                    Быстрый выбор языка
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Выбрано: {formData.languages.length}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_LANGUAGES.map((item) => {
                    const isAdded = formData.languages.some(
                      (l) =>
                        l.language.toLowerCase() === item.language.toLowerCase()
                    );
                    return (
                      <button
                        key={item.language}
                        type="button"
                        onClick={() =>
                          handleAddOrToggleLanguage(
                            item.language,
                            item.defaultLevel
                          )
                        }
                        className={`h-6 px-2.5 rounded-md border text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                          isAdded
                            ? "border-primary/40 bg-primary/10 text-primary"
                            : "border-border bg-background text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {isAdded ? (
                          <Check className="h-3 w-3 shrink-0" />
                        ) : (
                          <Plus className="h-3 w-3 shrink-0" />
                        )}
                        <span>{item.language}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Current Languages List + Custom Input */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-foreground">
                  Выбранные языки и уровень владения
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Другой язык (например: Корейский, Арабский)..."
                    value={newLangName}
                    onChange={(e) => setNewLangName(e.target.value)}
                    className="h-8 text-xs flex-1 bg-background"
                  />
                  <div className="w-52 shrink-0">
                    <Select
                      value={newLangLevel}
                      onValueChange={(val) =>
                        setNewLangLevel(
                          (val as StudentLanguageItem["level"]) || "CONVERSATIONAL"
                        )
                      }
                    >
                      <SelectTrigger className="h-8 text-xs bg-background">
                        <SelectValue>
                          {LANGUAGE_LEVEL_LABELS[newLangLevel].shortLabel}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="text-xs">
                        <SelectItem value="NATIVE">Родной язык</SelectItem>
                        <SelectItem value="FLUENT">Свободно владею (C1–C2)</SelectItem>
                        <SelectItem value="CONVERSATIONAL">
                          Разговорный (B1–B2)
                        </SelectItem>
                        <SelectItem value="DICTIONARY">
                          Базовый / Со словарём (A1–A2)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    size="xs"
                    onClick={() =>
                      handleAddOrToggleLanguage(newLangName, newLangLevel)
                    }
                    disabled={!newLangName.trim()}
                    className="h-8 px-3 text-xs gap-1 shrink-0 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Добавить
                  </Button>
                </div>

                {formData.languages.length === 0 ? (
                  <div className="p-4 rounded-lg border border-dashed text-center text-muted-foreground">
                    Языки ещё не выбраны. Выберите из списка выше или добавьте вручную.
                  </div>
                ) : (
                  <div className="divide-y border rounded-lg bg-card">
                    {formData.languages.map((lang) => (
                      <div
                        key={lang.id}
                        className="px-3 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <span className="font-medium text-foreground text-xs truncate">
                          {lang.language}
                        </span>

                        <div className="flex items-center gap-1 shrink-0 flex-wrap">
                          {(
                            [
                              { key: "NATIVE", label: "Родной" },
                              { key: "FLUENT", label: "Свободно" },
                              { key: "CONVERSATIONAL", label: "Разговорный" },
                              { key: "DICTIONARY", label: "Базовый" },
                            ] as const
                          ).map((lvl) => (
                            <button
                              key={lvl.key}
                              type="button"
                              onClick={() =>
                                handleUpdateLanguageLevel(lang.id, lvl.key)
                              }
                              className={`h-6 px-2.5 rounded-md border text-[11px] font-medium transition-colors cursor-pointer ${
                                lang.level === lvl.key
                                  ? "bg-primary/15 text-primary border-primary/40"
                                  : "bg-background text-muted-foreground hover:text-foreground border-border"
                              }`}
                            >
                              {lvl.label}
                            </button>
                          ))}

                          <button
                            type="button"
                            onClick={() => handleRemoveLanguage(lang.id)}
                            className="h-6 w-6 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer ml-1"
                            title="Удалить язык"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION 2: HARD & SOFT SKILLS */}
          {activeSection === "skills" && (
            <div className="space-y-4">
              {/* Categorized Preset Hard Skills */}
              <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">
                    Быстрый выбор навыков по категориям
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Выбрано: {formData.hardSkills.length}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {HARD_SKILL_CATEGORIES.map((category) => (
                    <div key={category.title} className="space-y-1.5">
                      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        {category.title}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {category.skills.map((preset) => {
                          const isAdded = formData.hardSkills.some(
                            (s) => s.name.toLowerCase() === preset.toLowerCase()
                          );
                          return (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => handleAddHardSkill(preset, "INTERMEDIATE")}
                              className={`h-6 px-2.5 rounded-md border text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                                isAdded
                                  ? "border-primary/40 bg-primary/10 text-primary"
                                  : "border-border bg-background text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              {isAdded ? (
                                <Check className="h-3 w-3 shrink-0" />
                              ) : (
                                <Plus className="h-3 w-3 shrink-0" />
                              )}
                              <span>{preset}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Skill Input */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-foreground">
                  Выбранные навыки и уровень владения
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Добавить свой навык (например: MikroTik, Photoshop)..."
                    value={newSkillName}
                    onChange={(e) => setNewSkillName(e.target.value)}
                    className="h-8 text-xs flex-1"
                  />
                  <div className="w-36 shrink-0">
                    <Select
                      value={newSkillLevel}
                      onValueChange={(val) =>
                        setNewSkillLevel(
                          (val as StudentSkillItem["level"]) || "INTERMEDIATE"
                        )
                      }
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue>
                          {SKILL_LEVEL_LABELS[newSkillLevel].label}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="text-xs">
                        <SelectItem value="ADVANCED">Уверенно</SelectItem>
                        <SelectItem value="INTERMEDIATE">Средний</SelectItem>
                        <SelectItem value="BASIC">Базовый</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    size="xs"
                    onClick={() =>
                      handleAddHardSkill(newSkillName, newSkillLevel)
                    }
                    disabled={!newSkillName.trim()}
                    className="h-8 px-3 text-xs gap-1 shrink-0 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Добавить
                  </Button>
                </div>

                {/* Selected Hard Skills List */}
                <div className="divide-y border rounded-lg bg-card">
                  {formData.hardSkills.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      Навыки ещё не добавлены. Выберите из категорий выше или добавьте свой.
                    </div>
                  ) : (
                    formData.hardSkills.map((sk) => (
                      <div
                        key={sk.id}
                        className="p-2.5 flex items-center justify-between gap-2"
                      >
                        <span className="font-medium text-foreground truncate">
                          {sk.name}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          {(["ADVANCED", "INTERMEDIATE", "BASIC"] as const).map(
                            (lvl) => (
                              <button
                                key={lvl}
                                type="button"
                                onClick={() =>
                                  handleUpdateHardSkillLevel(sk.id, lvl)
                                }
                                className={`h-6 px-2 rounded-md border text-[10px] font-medium transition-colors cursor-pointer ${
                                  sk.level === lvl
                                    ? "bg-primary/15 text-primary border-primary/40"
                                    : "bg-background text-muted-foreground hover:text-foreground border-border"
                                }`}
                              >
                                {SKILL_LEVEL_LABELS[lvl].label}
                              </button>
                            )
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveHardSkill(sk.id)}
                            className="h-6 w-6 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                            title="Удалить навык"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Soft Skills */}
              <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-2.5">
                <span className="text-xs font-semibold text-foreground block">
                  Личные и деловые качества (Soft Skills)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_SOFT_SKILLS.map((soft) => {
                    const active = formData.softSkills.includes(soft);
                    return (
                      <button
                        key={soft}
                        type="button"
                        onClick={() => handleToggleSoftSkill(soft)}
                        className={`h-6 px-2.5 rounded-md border text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                          active
                            ? "border-primary/40 bg-primary/10 text-primary"
                            : "border-border bg-background text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {active && <Check className="h-3 w-3 shrink-0" />}
                        <span>{soft}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Добавить личное качество..."
                    value={newSoftSkill}
                    onChange={(e) => setNewSoftSkill(e.target.value)}
                    className="h-8 text-xs flex-1 bg-background"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    disabled={!newSoftSkill.trim()}
                    onClick={() => {
                      handleToggleSoftSkill(newSoftSkill);
                      setNewSoftSkill("");
                    }}
                    className="h-8 px-3 text-xs cursor-pointer"
                  >
                    Добавить
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: GENERAL & ABOUT ME */}
          {activeSection === "general" && (
            <div className="space-y-3.5">
              {/* Block 1: Target Role & Format */}
              <div className="p-3.5 rounded-lg border border-border bg-muted/20 space-y-3">
                <div className="text-xs font-semibold text-foreground">
                  Цель и формат работы
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">
                      Желаемая должность / Направление практики
                    </label>
                    <Input
                      value={formData.desiredPosition}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          desiredPosition: e.target.value,
                        }))
                      }
                      placeholder="Например: Junior Web-разработчик"
                      className="h-8 text-xs bg-background"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">
                      Формат работы / стажировки
                    </label>
                    <Input
                      value={formData.workFormat}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          workFormat: e.target.value,
                        }))
                      }
                      placeholder="Стажировка / Полный или неполный день"
                      className="h-8 text-xs bg-background"
                    />
                  </div>
                </div>
              </div>

              {/* Block 2: About Me */}
              <div className="p-3.5 rounded-lg border border-border bg-muted/20 space-y-2">
                <label className="text-xs font-semibold text-foreground block">
                  О себе (краткая характеристика)
                </label>
                <Textarea
                  rows={4}
                  value={formData.aboutMe}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      aboutMe: e.target.value,
                    }))
                  }
                  placeholder="Расскажите о своих сильных сторонах, интересе к профессии и готовности к практике..."
                  className="text-xs resize-none bg-background"
                />
              </div>

              {/* Block 3: Contacts */}
              <div className="p-3.5 rounded-lg border border-border bg-muted/20 space-y-2.5">
                <div className="text-xs font-semibold text-foreground">
                  Контакты и ссылки
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">
                      GitHub / GitLab (если есть)
                    </label>
                    <Input
                      value={formData.githubUrl || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          githubUrl: e.target.value,
                        }))
                      }
                      placeholder="https://github.com/..."
                      className="h-8 text-xs bg-background"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">
                      Telegram для связи
                    </label>
                    <Input
                      value={formData.telegram || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          telegram: e.target.value,
                        }))
                      }
                      placeholder="@username"
                      className="h-8 text-xs bg-background"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: PROJECTS & PRACTICE */}
          {activeSection === "projects" && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">
                  Учебная / производственная практика и выполненные проекты:
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={handleAddProject}
                  className="h-7 px-2.5 text-xs gap-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Добавить место практики / проект
                </Button>
              </div>

              {formData.projects.length === 0 ? (
                <div className="p-4 rounded-lg border border-dashed text-center text-muted-foreground">
                  Записи о практике и учебных проектах пока не добавлены.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {formData.projects.map((proj) => (
                    <div
                      key={proj.id}
                      className="p-3.5 rounded-lg border border-border bg-muted/20 space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <Input
                          value={proj.title}
                          onChange={(e) =>
                            handleUpdateProject(proj.id, "title", e.target.value)
                          }
                          placeholder="Название организации практики или учебного проекта"
                          className="h-7 text-xs font-medium flex-1"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveProject(proj.id)}
                          className="h-7 w-7 inline-flex items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer shrink-0"
                          title="Удалить"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          value={proj.role}
                          onChange={(e) =>
                            handleUpdateProject(proj.id, "role", e.target.value)
                          }
                          placeholder="Роль / должность (например: Практикант)"
                          className="h-7 text-xs"
                        />
                        <Input
                          value={proj.period}
                          onChange={(e) =>
                            handleUpdateProject(
                              proj.id,
                              "period",
                              e.target.value
                            )
                          }
                          placeholder="Период (например: 2025 – 2026)"
                          className="h-7 text-xs"
                        />
                      </div>

                      <Textarea
                        rows={2}
                        value={proj.description}
                        onChange={(e) =>
                          handleUpdateProject(
                            proj.id,
                            "description",
                            e.target.value
                          )
                        }
                        placeholder="Что именно выполнял и какие навыки применил на практике..."
                        className="text-xs resize-none"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
            </div>
          </div>

          <DialogFooter className="flex flex-row justify-end gap-2 px-5 py-3 border-t shrink-0 bg-background">
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={onClose}
              className="h-7 px-3 text-xs cursor-pointer"
            >
              Отмена
            </Button>
            <Button
              type="submit"
              size="xs"
              disabled={isSaving}
              className="h-7 px-3 text-xs bg-primary text-primary-foreground cursor-pointer"
            >
              {isSaving ? "Сохранение..." : "Сохранить резюме"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

