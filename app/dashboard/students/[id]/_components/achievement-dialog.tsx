"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Trophy,
  Code,
  Award,
  BookOpen,
  Medal,
  Palette,
  HeartHandshake,
  Bookmark,
  Calendar,
  Building,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { StudentAchievementDTO } from "../../actions";

export const ACHIEVEMENT_CATEGORIES: Array<{
  value: StudentAchievementDTO["category"];
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { value: "OLYMPIAD", label: "Олимпиада / Конкурс", icon: Trophy },
  { value: "HACKATHON", label: "Хакатон / IT-чемпионат", icon: Code },
  { value: "CERTIFICATE", label: "Сертификат / Курс", icon: Award },
  { value: "SCIENCE", label: "Наука / Доклад / Статья", icon: BookOpen },
  { value: "SPORT", label: "Спорт", icon: Medal },
  { value: "CREATIVE", label: "Творчество / Культура", icon: Palette },
  { value: "VOLUNTEER", label: "Волонтёрство / Проект", icon: HeartHandshake },
  { value: "OTHER", label: "Прочее", icon: Bookmark },
];

export const ACHIEVEMENT_LEVELS: Array<{
  value: StudentAchievementDTO["level"];
  label: string;
}> = [
  { value: "INTERNATIONAL", label: "Международный" },
  { value: "NATIONAL", label: "Республиканский / Всероссийский" },
  { value: "REGIONAL", label: "Областной / Городской" },
  { value: "COLLEGE", label: "Внутриколледжный" },
];

interface AchievementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    title: string;
    category: StudentAchievementDTO["category"];
    level: StudentAchievementDTO["level"];
    date: string;
    place?: string;
    issuer?: string;
    description?: string;
    fileUrl?: string;
  }) => Promise<void>;
  achievementToEdit?: StudentAchievementDTO | null;
}

export function AchievementDialog({
  isOpen,
  onClose,
  onSave,
  achievementToEdit,
}: AchievementDialogProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<StudentAchievementDTO["category"]>("OLYMPIAD");
  const [level, setLevel] = useState<StudentAchievementDTO["level"]>("COLLEGE");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [place, setPlace] = useState("");
  const [issuer, setIssuer] = useState("");
  const [description, setDescription] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (achievementToEdit) {
      setTitle(achievementToEdit.title);
      setCategory(achievementToEdit.category);
      setLevel(achievementToEdit.level);
      setDate(achievementToEdit.dateRaw || new Date().toISOString().slice(0, 10));
      setPlace(achievementToEdit.place || "");
      setIssuer(achievementToEdit.issuer || "");
      setDescription(achievementToEdit.description || "");
      setFileUrl(achievementToEdit.fileUrl || "");
    } else {
      setTitle("");
      setCategory("OLYMPIAD");
      setLevel("COLLEGE");
      setDate(new Date().toISOString().slice(0, 10));
      setPlace("");
      setIssuer("");
      setDescription("");
      setFileUrl("");
    }
    setError(null);
  }, [achievementToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Укажите наименование достижения");
      return;
    }
    if (!date) {
      setError("Укажите дату");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSave({
        title: title.trim(),
        category,
        level,
        date,
        place: place.trim() || undefined,
        issuer: issuer.trim() || undefined,
        description: description.trim() || undefined,
        fileUrl: fileUrl.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || "Ошибка при сохранении достижения");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentCategoryMeta = ACHIEVEMENT_CATEGORIES.find((c) => c.value === category);
  const CurrentCategoryIcon = currentCategoryMeta?.icon;
  const currentLevelMeta = ACHIEVEMENT_LEVELS.find((l) => l.value === level);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-4 gap-3 text-xs sm:max-w-[560px]">
        <DialogHeader className="gap-1 text-left">
          <DialogTitle className="text-sm font-bold flex items-center gap-1.5 text-foreground">
            <Trophy className="h-4 w-4 text-primary" />
            <span>
              {achievementToEdit ? "Редактировать достижение" : "Добавить достижение в портфолио"}
            </span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-[11px]">
              {error}
            </div>
          )}

          {/* Title */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-foreground">
              Наименование достижения / мероприятия <span className="text-destructive">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: Хакатон «Digital Wave 2026», Олимпиада по веб-разработке"
              className="h-8 text-xs"
              required
            />
          </div>

          {/* Category & Level in 2 columns */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-foreground">Категория</label>
              <Select
                value={category}
                onValueChange={(val) => setCategory(val as StudentAchievementDTO["category"])}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue>
                    {currentCategoryMeta ? (
                      <span className="flex items-center gap-1.5 truncate">
                        {CurrentCategoryIcon && (
                          <CurrentCategoryIcon className="h-3.5 w-3.5 text-primary shrink-0" />
                        )}
                        <span>{currentCategoryMeta.label}</span>
                      </span>
                    ) : (
                      "Выберите категорию"
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {ACHIEVEMENT_CATEGORIES.map((c) => {
                    const Icon = c.icon;
                    return (
                      <SelectItem key={c.value} value={c.value} className="text-xs">
                        <span className="flex items-center gap-1.5">
                          <Icon className="h-3 w-3 text-primary" />
                          <span>{c.label}</span>
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-foreground">Уровень</label>
              <Select
                value={level}
                onValueChange={(val) => setLevel(val as StudentAchievementDTO["level"])}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue>
                    {currentLevelMeta ? currentLevelMeta.label : "Выберите уровень"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {ACHIEVEMENT_LEVELS.map((l) => (
                    <SelectItem key={l.value} value={l.value} className="text-xs">
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Place/Result & Date in 2 columns */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-foreground">
                Результат / Занятое место
              </label>
              <Input
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                placeholder="1 место, Победитель, Сертификат"
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-foreground">
                Дата получения <span className="text-destructive">*</span>
              </label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-8 text-xs"
                required
              />
            </div>
          </div>

          {/* Issuer / Organization */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-foreground">
              Организатор / Кем выдано
            </label>
            <Input
              value={issuer}
              onChange={(e) => setIssuer(e.target.value)}
              placeholder="Министерство образования, IT-Park, Яндекс, Coursera"
              className="h-8 text-xs"
            />
          </div>

          {/* Certificate link / File URL */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-foreground">
              Ссылка на подтверждение / скан грамоты / сертификат
            </label>
            <Input
              type="url"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder="https://drive.google.com/... или ссылка на сертификат"
              className="h-8 text-xs"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-foreground">
              Краткое описание / За какой проект или работу
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Опишите суть работы, проект, тему статьи или роль в команде..."
              className="text-xs min-h-[60px] resize-none"
              rows={2}
            />
          </div>

          <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-7 px-3 text-xs"
            >
              Отмена
            </Button>
            <Button
              type="submit"
              size="xs"
              disabled={isSubmitting}
              className="h-7 px-3 text-xs gap-1 font-medium"
            >
              <Sparkles className="h-3 w-3" />
              <span>{isSubmitting ? "Сохранение..." : "Сохранить"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
