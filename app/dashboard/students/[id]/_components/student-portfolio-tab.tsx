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
  Download,
  FileText,
  Trash2,
  Edit2,
  ShieldCheck,
  Building,
  Calendar,
  Languages,
  Wrench,
  Briefcase,
  UserCheck,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
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
  StudentResumeProfileDTO,
  addStudentAchievementAction,
  updateStudentAchievementAction,
  deleteStudentAchievementAction,
  toggleVerifyAchievementAction,
  saveStudentResumeProfileAction,
} from "../../actions";
import {
  AchievementDialog,
  ACHIEVEMENT_CATEGORIES,
  ACHIEVEMENT_LEVELS,
} from "./achievement-dialog";
import {
  StudentResumeDialog,
  LANGUAGE_LEVEL_LABELS,
  SKILL_LEVEL_LABELS,
} from "./student-resume-dialog";
import { ResumePreviewModal } from "./resume-preview-modal";
import { exportStudentResumeDocx } from "../_lib/export-student-resume";

interface StudentPortfolioTabProps {
  student: StudentCardDTO;
  userRole: string;
}

export function StudentPortfolioTab({
  student,
  userRole,
}: StudentPortfolioTabProps) {
  const [achievements, setAchievements] = useState<StudentAchievementDTO[]>(
    student.achievements || []
  );
  const [resumeProfile, setResumeProfile] = useState<StudentResumeProfileDTO>(
    student.resumeProfile
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedLevel, setSelectedLevel] = useState<string>("ALL");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isResumeDialogOpen, setIsResumeDialogOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [editingAchievement, setEditingAchievement] =
    useState<StudentAchievementDTO | null>(null);

  const [isPending, startTransition] = useTransition();

  const isPrivileged =
    userRole === "ADMIN" ||
    userRole === "TEACHER" ||
    userRole === "ADMINISTRATION";

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
    const certificates = achievements.filter(
      (a) => a.category === "CERTIFICATE"
    ).length;
    const verified = achievements.filter((a) => a.isVerified).length;
    return { total, prizes, certificates, verified };
  }, [achievements]);

  // Filtered achievements
  const filteredAchievements = useMemo(() => {
    return achievements.filter((a) => {
      if (selectedCategory !== "ALL" && a.category !== selectedCategory)
        return false;
      if (selectedLevel !== "ALL" && a.level !== selectedLevel) return false;
      return true;
    });
  }, [achievements, selectedCategory, selectedLevel]);

  const handleSaveResumeProfile = async (
    updatedProfile: StudentResumeProfileDTO
  ) => {
    setResumeProfile(updatedProfile);
    const res = await saveStudentResumeProfileAction(student.id, updatedProfile);
    if (res.success && res.resumeProfile) {
      setResumeProfile(res.resumeProfile);
      toast.add({
        title: "Резюме студента сохранено",
        type: "success",
      });
    } else {
      toast.add({
        title: res.error || "Ошибка сохранения резюме",
        type: "error",
      });
    }
  };

  // Handle Save (Add or Edit Achievement)
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
        const res = await toggleVerifyAchievementAction(
          achievementId,
          student.id
        );
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
    return (
      ACHIEVEMENT_CATEGORIES.find((c) => c.value === cat) ||
      ACHIEVEMENT_CATEGORIES[0]
    );
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

  const studentWithResume: StudentCardDTO = {
    ...student,
    resumeProfile,
  };

  return (
    <div className="space-y-4">
      {/* ================================================================ */}
      {/* БЛОК 1: РЕЗЮМЕ СТУДЕНТА (ЯЗЫКИ, НАВЫКИ, О СЕБЕ, ПРАКТИКА)        */}
      {/* ================================================================ */}
      <div className="rounded-xl border bg-card p-4 space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary shrink-0" />
              <h2 className="text-sm font-bold text-foreground">
                Резюме и профессиональный профиль студента
              </h2>
              <Badge
                variant="outline"
                className="text-[10px] border-primary/30 bg-primary/5 text-primary"
              >
                Языков: {resumeProfile.languages.length} • Навыков:{" "}
                {resumeProfile.hardSkills.length}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Желаемая должность:{" "}
              <span className="font-semibold text-foreground">
                {resumeProfile.desiredPosition || "Не указана"}
              </span>{" "}
              ({resumeProfile.workFormat || "Полный / неполный день"})
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="xs"
              variant="outline"
              onClick={() =>
                exportStudentResumeDocx(studentWithResume, achievements)
              }
              className="h-7 px-2.5 gap-1 text-xs font-medium border-primary/30 text-primary hover:bg-primary/5 cursor-pointer"
              title="Скачать официальное резюме и портфолио в Word (.docx)"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Скачать Word (.docx)</span>
            </Button>

            <Button
              size="xs"
              variant="outline"
              onClick={() => setIsPreviewModalOpen(true)}
              className="h-7 px-2.5 gap-1 text-xs font-medium cursor-pointer"
              title="Открыть предпросмотр резюме на листе А4"
            >
              <FileText className="h-3.5 w-3.5 text-primary" />
              <span>Бланк резюме (PDF / Печать)</span>
            </Button>

            <Button
              size="xs"
              onClick={() => setIsResumeDialogOpen(true)}
              className="h-7 px-3 gap-1.5 text-xs font-medium bg-primary text-primary-foreground cursor-pointer"
            >
              <Edit2 className="h-3.5 w-3.5" />
              <span>Редактировать резюме</span>
            </Button>
          </div>
        </div>

        {/* Grid: Languages + Hard Skills + Soft Skills & About */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Column 1: Languages */}
          <div className="p-3 rounded-lg border border-border bg-background space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Languages className="h-3.5 w-3.5 text-primary" />
                Знание языков ({resumeProfile.languages.length})
              </span>
              <button
                type="button"
                onClick={() => setIsResumeDialogOpen(true)}
                className="text-[10px] text-primary hover:underline font-medium cursor-pointer"
              >
                Изменить
              </button>
            </div>

            {resumeProfile.languages.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">
                Языки не указаны
              </p>
            ) : (
              <div className="space-y-1.5">
                {resumeProfile.languages.map((lang) => {
                  const meta =
                    LANGUAGE_LEVEL_LABELS[lang.level] ||
                    LANGUAGE_LEVEL_LABELS.CONVERSATIONAL;
                  return (
                    <div
                      key={lang.id}
                      className="flex items-center justify-between gap-2 p-2 rounded-md border border-border bg-muted/20"
                    >
                      <span className="font-semibold text-foreground text-xs">
                        {lang.language}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-2 py-0 font-medium ${meta.badgeClass}`}
                      >
                        {meta.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Extra contacts / info */}
            {(resumeProfile.telegram ||
              resumeProfile.githubUrl ||
              resumeProfile.driverLicense) && (
              <div className="pt-2 border-t space-y-1 text-[11px] text-muted-foreground">
                {resumeProfile.telegram && (
                  <div className="flex items-center justify-between">
                    <span>Telegram:</span>
                    <span className="font-mono text-foreground">
                      {resumeProfile.telegram}
                    </span>
                  </div>
                )}
                {resumeProfile.githubUrl && (
                  <div className="flex items-center justify-between">
                    <span>GitHub:</span>
                    <a
                      href={resumeProfile.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline truncate max-w-[160px] flex items-center gap-1"
                    >
                      <Globe className="h-3 w-3 shrink-0" />
                      <span>Профиль</span>
                    </a>
                  </div>
                )}
                {resumeProfile.driverLicense && (
                  <div className="flex items-center justify-between">
                    <span>Вод. удостоверение:</span>
                    <span className="text-foreground font-medium">
                      {resumeProfile.driverLicense}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Column 2: Hard Skills (Что умеет) */}
          <div className="p-3 rounded-lg border border-border bg-background space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Wrench className="h-3.5 w-3.5 text-primary" />
                Профессиональные навыки ({resumeProfile.hardSkills.length})
              </span>
              <button
                type="button"
                onClick={() => setIsResumeDialogOpen(true)}
                className="text-[10px] text-primary hover:underline font-medium cursor-pointer"
              >
                Добавить навыки
              </button>
            </div>

            {resumeProfile.hardSkills.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">
                Профессиональные навыки ещё не указаны
              </p>
            ) : (
              <div className="space-y-1.5">
                {resumeProfile.hardSkills.map((sk) => {
                  const meta =
                    SKILL_LEVEL_LABELS[sk.level] ||
                    SKILL_LEVEL_LABELS.INTERMEDIATE;
                  return (
                    <div
                      key={sk.id}
                      className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md border border-border bg-muted/20"
                    >
                      <span className="text-foreground font-medium text-[11px] leading-tight">
                        {sk.name}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 shrink-0 font-medium ${meta.badgeClass}`}
                      >
                        {meta.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Column 3: About Me, Soft Skills & Practice */}
          <div className="p-3 rounded-lg border border-border bg-background space-y-3 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div>
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-1">
                  <UserCheck className="h-3.5 w-3.5 text-primary" />О себе и
                  профессиональная цель
                </span>
                <p className="text-[11px] text-muted-foreground leading-relaxed bg-muted/20 p-2 rounded border border-border">
                  {resumeProfile.aboutMe || "Описание не заполнено"}
                </p>
              </div>

              {resumeProfile.softSkills.length > 0 && (
                <div>
                  <span className="text-[11px] font-bold text-foreground block mb-1.5">
                    Личные и деловые качества:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {resumeProfile.softSkills.map((soft) => (
                      <Badge
                        key={soft}
                        variant="outline"
                        className="text-[10px] px-2 py-0.5 font-normal bg-muted/40"
                      >
                        {soft}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {resumeProfile.projects.length > 0 && (
                <div className="pt-1 border-t space-y-1.5">
                  <span className="text-[11px] font-bold text-foreground flex items-center gap-1">
                    <Briefcase className="h-3 w-3 text-primary" />
                    Практика и учебные проекты:
                  </span>
                  {resumeProfile.projects.map((pr) => (
                    <div
                      key={pr.id}
                      className="p-2 rounded border border-border bg-muted/20 text-[11px]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-foreground">
                          {pr.title}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                          {pr.period}
                        </span>
                      </div>
                      <div className="text-[10px] text-primary font-medium">
                        {pr.role}
                      </div>
                      {pr.description && (
                        <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">
                          {pr.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* БЛОК 2: ВНЕУЧЕБНЫЕ ДОСТИЖЕНИЯ, ОЛИМПИАДЫ И СЕРТИФИКАТЫ           */}
      {/* ================================================================ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-xl border bg-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-medium">Всего достижений</span>
            <Trophy className="h-4 w-4 text-primary" />
          </div>
          <span className="text-xl font-bold font-mono text-foreground mt-1">
            {stats.total}
          </span>
          <span className="text-[10px] text-muted-foreground">
            В личном портфолио
          </span>
        </div>

        <div className="p-3 rounded-xl border bg-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-medium">Призовых мест</span>
            <Medal className="h-4 w-4 text-primary" />
          </div>
          <span className="text-xl font-bold font-mono text-primary mt-1">
            {stats.prizes}
          </span>
          <span className="text-[10px] text-muted-foreground">
            Победитель / 1–3 место
          </span>
        </div>

        <div className="p-3 rounded-xl border bg-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-medium">
              Сертификатов и курсов
            </span>
            <Award className="h-4 w-4 text-sky-500" />
          </div>
          <span className="text-xl font-bold font-mono text-sky-600 dark:text-sky-400 mt-1">
            {stats.certificates}
          </span>
          <span className="text-[10px] text-muted-foreground">
            Повышение квалификации
          </span>
        </div>

        <div className="p-3 rounded-xl border bg-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-medium">
              Подтверждено лицеем
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <span className="text-xl font-bold font-mono text-emerald-600 mt-1">
            {stats.verified}
          </span>
          <span className="text-[10px] text-muted-foreground">
            Верифицировано куратором
          </span>
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
              const count = achievements.filter(
                (a) => a.category === c.value
              ).length;
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
            <Select
              value={selectedLevel}
              onValueChange={(val) => setSelectedLevel(val || "ALL")}
            >
              <SelectTrigger className="h-7 text-xs bg-background">
                <SelectValue>
                  {selectedLevel === "ALL"
                    ? `Все уровни (${achievements.length})`
                    : `${
                        ACHIEVEMENT_LEVELS.find(
                          (l) => l.value === selectedLevel
                        )?.label || "Уровень"
                      } (${
                        achievements.filter((a) => a.level === selectedLevel)
                          .length
                      })`}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">
                  Все уровни ({achievements.length})
                </SelectItem>
                {ACHIEVEMENT_LEVELS.map((l) => {
                  const count = achievements.filter(
                    (a) => a.level === l.value
                  ).length;
                  return (
                    <SelectItem
                      key={l.value}
                      value={l.value}
                      className="text-xs"
                    >
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
            onClick={() => {
              setEditingAchievement(null);
              setIsDialogOpen(true);
            }}
            className="h-7 px-2.5 gap-1 text-xs font-medium cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Добавить достижение / сертификат</span>
          </Button>
        </div>
      </div>

      {/* Achievements List */}
      {filteredAchievements.length === 0 ? (
        <div className="p-8 rounded-xl border bg-card text-center flex flex-col items-center justify-center gap-2">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Trophy className="h-5 w-5" />
          </div>
          <span className="text-xs font-bold text-foreground">
            В портфолио пока нет записей о грамотах и сертификатах
          </span>
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
                          className="border-primary/30 bg-primary/10 text-primary font-medium text-[10px] gap-1 px-1.5 py-0"
                        >
                          <Medal className="h-2.5 w-2.5 shrink-0" />
                          <span>{item.place}</span>
                        </Badge>
                      )}

                      {/* Verification Status */}
                      {item.isVerified ? (
                        <Badge
                          variant="outline"
                          className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium text-[10px] gap-1 px-1.5 py-0"
                          title={`Подтверждено: ${
                            item.verifiedBy || "Лицеем"
                          }`}
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
                          <span className="truncate max-w-[200px]">
                            {item.issuer}
                          </span>
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
                      <span>
                        {item.isVerified ? "Отозвать" : "Подтвердить"}
                      </span>
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

      {/* Resume Profile Edit Dialog */}
      <StudentResumeDialog
        isOpen={isResumeDialogOpen}
        onClose={() => setIsResumeDialogOpen(false)}
        initialProfile={resumeProfile}
        onSave={handleSaveResumeProfile}
        studentName={student.name}
      />

      {/* Add / Edit Achievement Dialog */}
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
        student={studentWithResume}
        achievements={achievements}
      />
    </div>
  );
}
