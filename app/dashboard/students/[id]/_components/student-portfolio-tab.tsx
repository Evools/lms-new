"use client";

import React, { useState, useMemo, useTransition } from "react";
import {
  Trophy,
  Award,
  Medal,
  CheckCircle2,
  Clock,
  ExternalLink,
  Plus,
  Printer,
  Download,
  FileText,
  Trash2,
  Edit2,
  ShieldCheck,
  Building,
  Calendar,
  Filter,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  StudentAchievementDTO,
  StudentCardDTO,
  addStudentAchievementAction,
  updateStudentAchievementAction,
  deleteStudentAchievementAction,
  toggleVerifyAchievementAction,
} from "../../actions";
import {
  AchievementDialog,
  ACHIEVEMENT_CATEGORIES,
  ACHIEVEMENT_LEVELS,
} from "./achievement-dialog";
import { ResumePreviewModal } from "./resume-preview-modal";
import { exportStudentResumeDocx } from "../_lib/export-student-resume";

interface StudentPortfolioTabProps {
  student: StudentCardDTO;
  userRole: "STUDENT" | "TEACHER" | "ADMIN";
}

export function StudentPortfolioTab({ student, userRole }: StudentPortfolioTabProps) {
  const [achievements, setAchievements] = useState<StudentAchievementDTO[]>(
    student.achievements || []
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedLevel, setSelectedLevel] = useState<string>("ALL");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [editingAchievement, setEditingAchievement] =
    useState<StudentAchievementDTO | null>(null);

  const [isPending, startTransition] = useTransition();

  const isPrivileged = userRole === "ADMIN" || userRole === "TEACHER";

  // Computed KPIs
  const stats = useMemo(() => {
    const total = achievements.length;
    const prizes = achievements.filter((a) => {
      if (!a.place) return false;
      const p = a.place.toLowerCase();
      return (
        p.includes("1") ||
        p.includes("2") ||
        p.includes("3") ||
        p.includes("победител") ||
        p.includes("призер") ||
        p.includes("призёр") ||
        p.includes("гран-при")
      );
    }).length;
    const certificates = achievements.filter((a) => a.category === "CERTIFICATE").length;
    const verified = achievements.filter((a) => a.isVerified).length;
    return { total, prizes, certificates, verified };
  }, [achievements]);

  // Filtered achievements
  const filteredAchievements = useMemo(() => {
    return achievements.filter((a) => {
      if (selectedCategory !== "ALL" && a.category !== selectedCategory) return false;
      if (selectedLevel !== "ALL" && a.level !== selectedLevel) return false;
      return true;
    });
  }, [achievements, selectedCategory, selectedLevel]);

  // Handle Save (Add or Edit)
  const handleSaveAchievement = async (data: {
    title: string;
    category: StudentAchievementDTO["category"];
    level: StudentAchievementDTO["level"];
    date: string;
    place?: string;
    issuer?: string;
    description?: string;
    fileUrl?: string;
  }) => {
    if (editingAchievement) {
      const res = await updateStudentAchievementAction(
        editingAchievement.id,
        student.id,
        data
      );
      if (res.success && res.achievement) {
        setAchievements((prev) =>
          prev.map((item) =>
            item.id === editingAchievement.id
              ? {
                  ...item,
                  ...data,
                  date: new Date(data.date).toLocaleDateString("ru-RU"),
                  dateRaw: data.date,
                }
              : item
          )
        );
      }
    } else {
      const res = await addStudentAchievementAction(student.id, data);
      if (res.success && res.achievement) {
        const created = res.achievement;
        const newDTO: StudentAchievementDTO = {
          id: created.id,
          studentId: created.studentId,
          title: created.title,
          category: created.category,
          level: created.level,
          date: created.date.toLocaleDateString("ru-RU"),
          dateRaw: data.date,
          place: created.place,
          issuer: created.issuer,
          description: created.description,
          fileUrl: created.fileUrl,
          isVerified: created.isVerified,
          verifiedBy: created.verifiedBy,
          createdAt: created.createdAt.toLocaleDateString("ru-RU"),
        };
        setAchievements((prev) => [newDTO, ...prev]);
      }
    }
  };

  // Handle Delete
  const handleDeleteAchievement = async (achievementId: string) => {
    if (!confirm("Вы уверены, что хотите удалить это достижение?")) return;
    startTransition(async () => {
      try {
        await deleteStudentAchievementAction(achievementId, student.id);
        setAchievements((prev) => prev.filter((a) => a.id !== achievementId));
      } catch (err: any) {
        alert(err?.message || "Ошибка удаления");
      }
    });
  };

  // Handle Toggle Verification (Curator / Admin)
  const handleToggleVerify = async (achievementId: string) => {
    startTransition(async () => {
      try {
        const res = await toggleVerifyAchievementAction(achievementId, student.id);
        if (res.success) {
          setAchievements((prev) =>
            prev.map((a) =>
              a.id === achievementId
                ? {
                    ...a,
                    isVerified: res.isVerified,
                    verifiedBy: res.isVerified ? "Куратор" : null,
                  }
                : a
            )
          );
        }
      } catch (err: any) {
        alert(err?.message || "Ошибка подтверждения");
      }
    });
  };

  const getCategoryMeta = (cat: StudentAchievementDTO["category"]) => {
    return ACHIEVEMENT_CATEGORIES.find((c) => c.value === cat) || ACHIEVEMENT_CATEGORIES[0];
  };

  const getLevelLabel = (lvl: StudentAchievementDTO["level"]) => {
    return ACHIEVEMENT_LEVELS.find((l) => l.value === lvl)?.label || lvl;
  };

  const getLevelBadgeClass = (lvl: StudentAchievementDTO["level"]) => {
    switch (lvl) {
      case "INTERNATIONAL":
        return "border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300";
      case "NATIONAL":
        return "border-primary/30 bg-primary/10 text-primary";
      case "REGIONAL":
        return "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300";
      case "COLLEGE":
      default:
        return "border-border bg-muted/60 text-muted-foreground";
    }
  };

  return (
    <div className="space-y-4">
      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-xl border bg-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-medium">Всего достижений</span>
            <Trophy className="h-4 w-4 text-primary" />
          </div>
          <span className="text-xl font-bold font-mono text-foreground mt-1">
            {stats.total}
          </span>
          <span className="text-[10px] text-muted-foreground">В личном портфолио</span>
        </div>

        <div className="p-3 rounded-xl border bg-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-medium">Призовых мест</span>
            <Medal className="h-4 w-4 text-amber-500" />
          </div>
          <span className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1">
            {stats.prizes}
          </span>
          <span className="text-[10px] text-muted-foreground">Победитель / 1-3 место</span>
        </div>

        <div className="p-3 rounded-xl border bg-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-medium">Сертификатов и курсов</span>
            <Award className="h-4 w-4 text-sky-500" />
          </div>
          <span className="text-xl font-bold font-mono text-sky-600 dark:text-sky-400 mt-1">
            {stats.certificates}
          </span>
          <span className="text-[10px] text-muted-foreground">Повышение квалификации</span>
        </div>

        <div className="p-3 rounded-xl border bg-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-medium">Подтверждено колледжем</span>
            <CheckCircle2 className="h-4 w-4 text-primary" />
          </div>
          <span className="text-xl font-bold font-mono text-primary mt-1">
            {stats.verified}
          </span>
          <span className="text-[10px] text-muted-foreground">Верифицировано куратором</span>
        </div>
      </div>

      {/* Control Bar: Filters & Actions */}
      <div className="p-3 rounded-xl border bg-card flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border text-xs">
            <button
              type="button"
              onClick={() => setSelectedCategory("ALL")}
              className={`h-6 px-2.5 rounded-md font-medium transition-colors ${
                selectedCategory === "ALL"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Все ({achievements.length})
            </button>
            {ACHIEVEMENT_CATEGORIES.slice(0, 4).map((c) => {
              const count = achievements.filter((a) => a.category === c.value).length;
              if (count === 0 && selectedCategory !== c.value) return null;
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setSelectedCategory(c.value)}
                  className={`h-6 px-2 rounded-md font-medium transition-colors text-[11px] ${
                    selectedCategory === c.value
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {c.label.split("/")[0].trim()} ({count})
                </button>
              );
            })}
          </div>

          {/* Level Filter Select */}
          <div className="w-40">
            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger className="h-7 text-xs bg-background">
                <SelectValue>
                  {selectedLevel === "ALL"
                    ? `Все уровни (${achievements.length})`
                    : `${ACHIEVEMENT_LEVELS.find((l) => l.value === selectedLevel)?.label || "Уровень"} (${
                        achievements.filter((a) => a.level === selectedLevel).length
                      })`}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">
                  Все уровни ({achievements.length})
                </SelectItem>
                {ACHIEVEMENT_LEVELS.map((l) => {
                  const count = achievements.filter((a) => a.level === l.value).length;
                  return (
                    <SelectItem key={l.value} value={l.value} className="text-xs">
                      {l.label} ({count})
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            size="xs"
            variant="outline"
            onClick={() => exportStudentResumeDocx(student, achievements)}
            className="h-7 px-2.5 gap-1 text-xs font-medium border-primary/30 text-primary hover:bg-primary/5"
            title="Скачать официальное резюме и портфолио в Word (.docx)"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Word (.docx)</span>
          </Button>

          <Button
            size="xs"
            variant="outline"
            onClick={() => setIsPreviewModalOpen(true)}
            className="h-7 px-2.5 gap-1 text-xs font-medium"
            title="Открыть предпросмотр резюме в модальном окне"
          >
            <FileText className="h-3.5 w-3.5 text-primary" />
            <span>Превью резюме (PDF)</span>
          </Button>

          <Button
            size="xs"
            onClick={() => {
              setEditingAchievement(null);
              setIsDialogOpen(true);
            }}
            className="h-7 px-2.5 gap-1 text-xs font-medium"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Добавить достижение</span>
          </Button>
        </div>
      </div>

      {/* Achievements List */}
      {filteredAchievements.length === 0 ? (
        <div className="p-8 rounded-xl border bg-card text-center flex flex-col items-center justify-center gap-2">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Trophy className="h-5 w-5" />
          </div>
          <span className="text-xs font-bold text-foreground">В портфолио пока нет записей</span>
          <p className="text-[11px] text-muted-foreground max-w-sm">
            {selectedCategory !== "ALL" || selectedLevel !== "ALL"
              ? "По выбранным фильтрам ничего не найдено. Попробуйте сбросить фильтры."
              : "Добавьте победы в олимпиадах, хакатонах, полученные сертификаты, спортивные награды или волонтёрские проекты."}
          </p>
          <Button
            size="xs"
            onClick={() => {
              setEditingAchievement(null);
              setIsDialogOpen(true);
            }}
            className="h-7 px-3 text-xs mt-2 gap-1 font-medium"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Добавить первое достижение</span>
          </Button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredAchievements.map((item) => {
            const catMeta = getCategoryMeta(item.category);
            const CatIcon = catMeta.icon;

            return (
              <div
                key={item.id}
                className="p-3.5 rounded-xl border bg-card hover:border-primary/40 transition-colors flex flex-col sm:flex-row items-start justify-between gap-3 text-xs"
              >
                {/* Left: Icon & Info */}
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary mt-0.5">
                    <CatIcon className="h-4.5 w-4.5" />
                  </div>

                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-foreground text-xs leading-snug">
                        {item.title}
                      </span>

                      {/* Place / Result Badge */}
                      {item.place && (
                        <Badge
                          variant="outline"
                          className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium text-[10px] gap-1 px-1.5 py-0"
                        >
                          <Medal className="h-2.5 w-2.5 shrink-0" />
                          <span>{item.place}</span>
                        </Badge>
                      )}

                      {/* Verification Status */}
                      {item.isVerified ? (
                        <Badge
                          variant="outline"
                          className="border-primary/30 bg-primary/10 text-primary font-medium text-[10px] gap-1 px-1.5 py-0"
                          title={`Подтверждено: ${item.verifiedBy || "Колледжем"}`}
                        >
                          <CheckCircle2 className="h-2.5 w-2.5 shrink-0" />
                          <span>Подтверждено</span>
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-border bg-muted/60 text-muted-foreground font-medium text-[10px] gap-1 px-1.5 py-0"
                        >
                          <Clock className="h-2.5 w-2.5 shrink-0" />
                          <span>На проверке</span>
                        </Badge>
                      )}
                    </div>

                    {/* Metadata chips */}
                    <div className="flex items-center gap-2 flex-wrap text-[11px] text-muted-foreground">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-medium px-1.5 py-0 ${getLevelBadgeClass(
                          item.level
                        )}`}
                      >
                        {getLevelLabel(item.level)}
                      </Badge>

                      <span className="flex items-center gap-1 font-mono text-[10px]">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {item.date}
                      </span>

                      {item.issuer && (
                        <span className="flex items-center gap-1 text-[11px]">
                          <Building className="h-3 w-3 text-muted-foreground" />
                          <span className="truncate max-w-[200px]">{item.issuer}</span>
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    {item.description && (
                      <p className="text-[11px] text-muted-foreground/90 leading-relaxed pt-0.5">
                        {item.description}
                      </p>
                    )}

                    {/* Certificate link */}
                    {item.fileUrl && (
                      <div className="pt-0.5">
                        <a
                          href={item.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-medium text-primary hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>Посмотреть подтверждающий документ</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1 shrink-0 self-end sm:self-start">
                  {/* Verification toggle for teacher / admin */}
                  {isPrivileged && (
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => handleToggleVerify(item.id)}
                      disabled={isPending}
                      className={`h-6 px-2 text-[10px] gap-1 ${
                        item.isVerified
                          ? "border-primary/40 text-primary hover:bg-primary/5"
                          : "border-border text-muted-foreground hover:text-foreground"
                      }`}
                      title={
                        item.isVerified
                          ? "Снять подтверждение куратора"
                          : "Подтвердить достижение"
                      }
                    >
                      <ShieldCheck className="h-3 w-3" />
                      <span>{item.isVerified ? "Отозвать" : "Подтвердить"}</span>
                    </Button>
                  )}

                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => {
                      setEditingAchievement(item);
                      setIsDialogOpen(true);
                    }}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                    title="Редактировать"
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>

                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => handleDeleteAchievement(item.id)}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                    title="Удалить"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <AchievementDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingAchievement(null);
        }}
        onSave={handleSaveAchievement}
        achievementToEdit={editingAchievement}
      />

      {/* Resume & Portfolio In-Modal Preview */}
      <ResumePreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        student={student}
        achievements={achievements}
      />
    </div>
  );
}
