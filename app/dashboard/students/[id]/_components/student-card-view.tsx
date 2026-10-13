"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "@/components/ui/toast";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  UserCheck,
  CalendarCheck,
  BookOpen,
  ArrowLeft,
  Mail,
  Phone,
  Hash,
  Crown,
  ShieldCheck,
  Accessibility,
  Building2,
  Calendar,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Clock,
  Edit,
  KeyRound,
  Save,
  Check,
  Copy,
  Eye,
  EyeOff,
  GraduationCap,
  Award,
  Layers,
  LayoutDashboard,
  Filter,
  RotateCcw,
  BookMarked,
  FileCheck,
} from "lucide-react";
import { StudentCardDTO, resetPasswordAction } from "../../actions";
import { updateStudentRollNumberInGroupAction } from "@/app/dashboard/groups/actions";

interface StudentCardViewProps {
  student: StudentCardDTO;
  userRole: string;
}

export function StudentCardView({ student, userRole }: StudentCardViewProps) {
  const router = useRouter();
  const isAdminOrTeacher = userRole === "ADMIN" || userRole === "TEACHER";

  // Active Main Tab
  const [activeTab, setActiveTab] = useState<"overview" | "monthly" | "subjects">("overview");

  // Selected Month filter ("ALL" or specific "YYYY-MM")
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>("ALL");

  // Roll number edit state
  const [currentRollNumber, setCurrentRollNumber] = useState(student.rollNumber || "");
  const [isRollNumberModalOpen, setIsRollNumberModalOpen] = useState(false);
  const [rollNumberInput, setRollNumberInput] = useState(student.rollNumber || "");
  const [isSavingRollNumber, setIsSavingRollNumber] = useState(false);

  // Password reset modal state
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [passwordMode, setPasswordMode] = useState<"auto" | "manual">("auto");
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [manualPassword, setManualPassword] = useState("");
  const [showManualPassword, setShowManualPassword] = useState(false);
  const [isCopiedPassword, setIsCopiedPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [tempPassword, setTempPassword] = useState(student.tempPassword);

  // Filter for absences
  const [absenceFilter, setAbsenceFilter] = useState<"ALL" | "ABSENT" | "EXCUSED">("ALL");

  const generateRandomPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$";
    let pass = "Lms";
    for (let i = 0; i < 6; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  const handleOpenResetPassword = () => {
    setPasswordMode("auto");
    setGeneratedPassword(generateRandomPassword());
    setManualPassword("");
    setShowManualPassword(false);
    setIsCopiedPassword(false);
    setIsResetPasswordOpen(true);
  };

  const handleCopyPassword = (text: string) => {
    if (text) {
      navigator.clipboard.writeText(text);
      setIsCopiedPassword(true);
      setTimeout(() => setIsCopiedPassword(false), 2000);
    }
  };

  const handleConfirmResetPassword = async () => {
    const passwordToSet = passwordMode === "auto" ? generatedPassword : manualPassword.trim();
    if (!passwordToSet || passwordToSet.length < 6) {
      toast.add({ title: "Пароль должен содержать не менее 6 символов", type: "error" });
      return;
    }

    setIsResettingPassword(true);
    try {
      const res = await resetPasswordAction(student.id, passwordToSet);
      if (res.success) {
        setTempPassword(passwordToSet);
        toast.add({
          title: `Новый пароль для ${student.name} успешно установлен`,
          type: "success",
        });
        setIsResetPasswordOpen(false);
      } else {
        toast.add({ title: res.error || "Ошибка сброса пароля", type: "error" });
      }
    } catch (err: any) {
      toast.add({ title: err?.message || "Ошибка сервера", type: "error" });
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleSaveRollNumber = async () => {
    setIsSavingRollNumber(true);
    try {
      const res = await updateStudentRollNumberInGroupAction(
        student.id,
        rollNumberInput,
        student.groupId
      );
      if (res.success) {
        setCurrentRollNumber(rollNumberInput.trim());
        toast.add({
          title: "Поименный номер сохранен",
          type: "success",
        });
        setIsRollNumberModalOpen(false);
      } else {
        toast.add({ title: res.error || "Ошибка сохранения", type: "error" });
      }
    } catch (err: any) {
      toast.add({ title: err?.message || "Ошибка сервера", type: "error" });
    } finally {
      setIsSavingRollNumber(false);
    }
  };

  // Active month stats object (if specific month chosen)
  const activeMonthStat = useMemo(() => {
    if (selectedMonthKey === "ALL") return null;
    return student.monthlyStats.find((m) => m.monthKey === selectedMonthKey) || null;
  }, [selectedMonthKey, student.monthlyStats]);

  // Reactive KPI values based on selectedMonthKey
  const currentKPIs = useMemo(() => {
    if (activeMonthStat) {
      return {
        total: activeMonthStat.attendance.total,
        present: activeMonthStat.attendance.present,
        absent: activeMonthStat.attendance.absent,
        excused: activeMonthStat.attendance.excused,
        late: activeMonthStat.attendance.late,
        percent: activeMonthStat.attendance.percent,
        label: activeMonthStat.monthLabel,
      };
    }
    return {
      total: student.attendance.total,
      present: student.attendance.present,
      absent: student.attendance.absent,
      excused: student.attendance.excused,
      late: student.attendance.late,
      percent: student.attendance.percent,
      label: "Все месяцы (Всё время)",
    };
  }, [activeMonthStat, student.attendance]);

  // Filtered absences (by month and status)
  const filteredAbsences = useMemo(() => {
    return student.attendance.allAbsences.filter((ab) => {
      if (selectedMonthKey !== "ALL" && ab.monthKey !== selectedMonthKey) {
        return false;
      }
      if (absenceFilter === "ALL") return true;
      return ab.status === absenceFilter;
    });
  }, [student.attendance.allAbsences, selectedMonthKey, absenceFilter]);

  // Filtered submissions (by month)
  const filteredSubmissions = useMemo(() => {
    if (selectedMonthKey === "ALL") return student.academics.recentSubmissions;
    return student.academics.recentSubmissions.filter((s) => s.monthKey === selectedMonthKey);
  }, [student.academics.recentSubmissions, selectedMonthKey]);

  const backUrl = student.groupId
    ? `/dashboard/groups/${student.groupId}`
    : `/dashboard/students`;

  return (
    <div className="space-y-4 text-xs pb-12">
      {/* Breadcrumb Navigation */}
      <Breadcrumb className="text-xs">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Панель</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          {student.groupId ? (
            <>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard/groups">Группы</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href={`/dashboard/groups/${student.groupId}`}>
                  {student.groupName}
                </BreadcrumbLink>
              </BreadcrumbItem>
            </>
          ) : (
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard/students">Студенты</BreadcrumbLink>
            </BreadcrumbItem>
          )}
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{student.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          variant="outline"
          size="xs"
          className="h-8 text-xs gap-1.5"
          onClick={() => (student.groupId ? router.push(backUrl) : router.back())}
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Назад
        </Button>

        {isAdminOrTeacher && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="xs"
              className="h-8 text-xs gap-1.5"
              onClick={() => {
                setRollNumberInput(currentRollNumber);
                setIsRollNumberModalOpen(true);
              }}
            >
              <Hash className="h-3.5 w-3.5 text-primary" /> Поименный номер (П/Н)
            </Button>
            <Button
              variant="outline"
              size="xs"
              className="h-8 text-xs gap-1.5"
              onClick={handleOpenResetPassword}
            >
              <KeyRound className="h-3.5 w-3.5 text-primary" /> Сбросить пароль
            </Button>
            <Button
              size="xs"
              className="h-8 text-xs gap-1.5"
              render={<Link href={`/dashboard/students/${student.id}/edit`} />}
            >
              <Edit className="h-3.5 w-3.5" /> Редактировать профиль
            </Button>
          </div>
        )}
      </div>

      {/* Hero Student Profile Card */}
      <div className="p-4 rounded-xl border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <Avatar className="h-16 w-16 border shrink-0 bg-background">
            <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
              {student.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base font-bold text-foreground truncate">
                {student.name}
              </h1>
              {currentRollNumber ? (
                <Badge variant="outline" className="font-mono text-[10px] px-2 py-0 border-primary/30 text-primary bg-primary/5 font-semibold">
                  П/Н {currentRollNumber}
                </Badge>
              ) : (
                <Badge variant="outline" className="font-mono text-[10px] px-2 py-0 text-muted-foreground border-dashed">
                  П/Н не присвоен
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="truncate">{student.email}</span>
              </span>
              {student.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>{student.phone}</span>
                </span>
              )}
              {student.groupId && (
                <Link
                  href={`/dashboard/groups/${student.groupId}`}
                  className="flex items-center gap-1 text-foreground hover:text-primary hover:underline transition-colors font-medium"
                >
                  <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>{student.groupName}</span>
                </Link>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {student.roleInGroup === "MONITOR" && (
                <Badge className="bg-primary text-primary-foreground text-[10px] px-2 py-0.5 gap-1 font-medium">
                  <Crown className="h-3 w-3 shrink-0" /> Староста
                </Badge>
              )}
              {student.roleInGroup === "DEPUTY_MONITOR" && (
                <Badge variant="secondary" className="text-[10px] px-2 py-0.5 gap-1 font-medium">
                  <ShieldCheck className="h-3 w-3 shrink-0" /> Зам. старосты
                </Badge>
              )}
              {student.roleInGroup === "STUDENT" && (
                <Badge variant="outline" className="text-[10px] px-2 py-0.5 font-medium">
                  Студент
                </Badge>
              )}
              {student.isDutyExempt && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-2 py-0.5 gap-1 font-medium border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400"
                  title={student.dutyExemptReason || "Освобожден от дежурств (ЛОВЗ)"}
                >
                  <Accessibility className="h-3 w-3 shrink-0" /> ЛОВЗ (освобожден)
                </Badge>
              )}
              <Badge
                variant="outline"
                className={`text-[10px] px-2 py-0.5 font-medium ${
                  tempPassword
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    : "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {tempPassword ? "Временный пароль" : "Активен"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Curator / enrollment info snippet */}
        <div className="sm:border-l sm:pl-4 flex flex-col justify-center space-y-1 text-xs text-muted-foreground shrink-0">
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <span>Зачислен:</span>
            <span className="font-medium text-foreground">{student.joinedAt}</span>
          </div>
          {student.curatorName && (
            <div className="flex items-center justify-between sm:justify-start gap-2">
              <span>Куратор:</span>
              <span className="font-medium text-foreground">{student.curatorName}</span>
            </div>
          )}
          {tempPassword && isAdminOrTeacher && (
            <div className="flex items-center justify-between sm:justify-start gap-2 font-mono text-[11px] bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 text-amber-700 dark:text-amber-300">
              <span>Пароль:</span>
              <span className="font-bold">{tempPassword}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-1.5 p-1 bg-muted/50 rounded-lg border text-xs">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-1.5 h-7 px-3 rounded-md font-medium transition-colors ${
            activeTab === "overview"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <LayoutDashboard className="h-3.5 w-3.5" />
          <span>Сводка и посещаемость</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("monthly")}
          className={`flex items-center gap-1.5 h-7 px-3 rounded-md font-medium transition-colors ${
            activeTab === "monthly"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <CalendarDays className="h-3.5 w-3.5" />
          <span>По месяцам ({student.monthlyStats.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("subjects")}
          className={`flex items-center gap-1.5 h-7 px-3 rounded-md font-medium transition-colors ${
            activeTab === "subjects"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <BookMarked className="h-3.5 w-3.5" />
          <span>По дисциплинам ({student.subjectStats.length})</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW & ATTENDANCE */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          {/* Quick Month Filter Bar */}
          <div className="p-3 rounded-xl border bg-card flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="font-semibold text-foreground">Период статистики:</span>
              <span className="text-muted-foreground">{currentKPIs.label}</span>
            </div>

            <div className="flex items-center flex-wrap gap-1">
              <button
                type="button"
                onClick={() => setSelectedMonthKey("ALL")}
                className={`h-6 px-2.5 rounded-md font-medium text-[11px] transition-colors border ${
                  selectedMonthKey === "ALL"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground hover:text-foreground border-border"
                }`}
              >
                Все месяцы
              </button>
              {student.monthlyStats.map((m) => (
                <button
                  key={m.monthKey}
                  type="button"
                  onClick={() => setSelectedMonthKey(m.monthKey)}
                  className={`h-6 px-2.5 rounded-md font-medium text-[11px] transition-colors border ${
                    selectedMonthKey === m.monthKey
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground hover:text-foreground border-border"
                  }`}
                >
                  {m.monthLabel}
                </button>
              ))}
            </div>
          </div>

          {/* Monthly Scholarship Status Alert Banner (if month is selected and data exists) */}
          {activeMonthStat && activeMonthStat.scholarship && (
            <div
              className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                activeMonthStat.scholarship.status === "EXCELLENT"
                  ? "bg-primary/5 border-primary/30"
                  : activeMonthStat.scholarship.status === "GOOD"
                  ? "bg-emerald-500/5 border-emerald-500/30"
                  : "bg-rose-500/5 border-rose-500/30"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Award
                  className={`h-5 w-5 shrink-0 ${
                    activeMonthStat.scholarship.status === "EXCELLENT"
                      ? "text-primary"
                      : activeMonthStat.scholarship.status === "GOOD"
                      ? "text-emerald-600"
                      : "text-rose-600"
                  }`}
                />
                <div>
                  <div className="font-semibold text-foreground text-xs">
                    Стипендиальная ведомость за {activeMonthStat.monthLabel}:{" "}
                    <span
                      className={
                        activeMonthStat.scholarship.status === "EXCELLENT"
                          ? "text-primary font-bold"
                          : activeMonthStat.scholarship.status === "GOOD"
                          ? "text-emerald-600 font-bold"
                          : "text-rose-600 font-bold"
                      }
                    >
                      {activeMonthStat.scholarship.statusLabel}
                    </span>
                  </div>
                  {activeMonthStat.scholarship.averageGrade > 0 && (
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      Средний балл по ведомости:{" "}
                      <span className="font-mono font-bold text-foreground">
                        {activeMonthStat.scholarship.averageGrade.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <Button
                variant="outline"
                size="xs"
                className="h-6 text-[10px] px-2 shrink-0 gap-1"
                render={<Link href="/dashboard/scholarship" />}
              >
                Ведомость стипендий
              </Button>
            </div>
          )}

          {/* Main Grid: Attendance & Absences */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left Column (2 spans): Attendance Breakdown & Absences Log */}
            <div className="lg:col-span-2 space-y-3">
              <div className="rounded-xl border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between border-b pb-2.5">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <CalendarCheck className="h-4 w-4 text-primary" />
                    Посещаемость и пропуски ({currentKPIs.label})
                  </span>
                  <span className="text-[11px] text-muted-foreground font-medium">
                    Всего занятий: {currentKPIs.total}
                  </span>
                </div>

                {/* 4 Attendance KPI Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-lg border bg-background flex flex-col justify-between">
                    <span className="text-[11px] text-muted-foreground font-medium">Всего занятий</span>
                    <span className="text-xl font-bold font-mono text-foreground mt-1">
                      {currentKPIs.total}
                    </span>
                    <span className="text-[10px] text-muted-foreground">В электронном журнале</span>
                  </div>

                  <div className="p-3 rounded-lg border bg-emerald-500/5 border-emerald-500/30 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                        Присутствовал
                      </span>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    </div>
                    <span className="text-xl font-bold font-mono text-emerald-600 mt-1">
                      {currentKPIs.present}
                    </span>
                    <span className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80">Посещенные пары</span>
                  </div>

                  <div className="p-3 rounded-lg border bg-rose-500/5 border-rose-500/30 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-rose-700 dark:text-rose-400 font-semibold">
                        Пропуски (Н/Б)
                      </span>
                      <XCircle className="h-3.5 w-3.5 text-rose-600" />
                    </div>
                    <span className="text-xl font-bold font-mono text-rose-600 mt-1">
                      {currentKPIs.absent + currentKPIs.excused}
                    </span>
                    <span className="text-[10px] text-rose-700/80 dark:text-rose-400/80">
                      {currentKPIs.excused > 0
                        ? `Н/Б: ${currentKPIs.absent} | Уваж: ${currentKPIs.excused}`
                        : `Неуважительных: ${currentKPIs.absent}`}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg border bg-primary/5 border-primary/30 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-primary font-semibold">Посещаемость</span>
                      <Clock className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-xl font-bold font-mono text-primary mt-1">
                      {currentKPIs.percent}%
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {currentKPIs.late > 0 ? `Опозданий: ${currentKPIs.late}` : "Без опозданий"}
                    </span>
                  </div>
                </div>

                {/* Detailed Absences Log */}
                <div className="pt-2 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-foreground">
                        Журнал пропусков студента
                      </span>
                      {selectedMonthKey !== "ALL" && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {currentKPIs.label}
                        </Badge>
                      )}
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border text-[11px]">
                      <button
                        type="button"
                        onClick={() => setAbsenceFilter("ALL")}
                        className={`h-6 px-2.5 rounded-md font-medium transition-colors ${
                          absenceFilter === "ALL"
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Все ({currentKPIs.absent + currentKPIs.excused})
                      </button>
                      <button
                        type="button"
                        onClick={() => setAbsenceFilter("ABSENT")}
                        className={`h-6 px-2.5 rounded-md font-medium transition-colors ${
                          absenceFilter === "ABSENT"
                            ? "bg-rose-600 text-white"
                            : "text-muted-foreground hover:text-rose-600"
                        }`}
                      >
                        Н/Б ({currentKPIs.absent})
                      </button>
                      <button
                        type="button"
                        onClick={() => setAbsenceFilter("EXCUSED")}
                        className={`h-6 px-2.5 rounded-md font-medium transition-colors ${
                          absenceFilter === "EXCUSED"
                            ? "bg-sky-600 text-white"
                            : "text-muted-foreground hover:text-sky-600"
                        }`}
                      >
                        Уважительные ({currentKPIs.excused})
                      </button>
                    </div>
                  </div>

                  {filteredAbsences.length === 0 ? (
                    <div className="p-4 rounded-lg border bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 text-xs flex items-center justify-center gap-2 text-center">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                      <span>
                        {selectedMonthKey !== "ALL"
                          ? `За ${currentKPIs.label} у студента нет зафиксированных пропусков!`
                          : student.attendance.allAbsences.length === 0
                          ? "У студента нет ни одного пропуска занятий (100% посещаемость)!"
                          : "Пропусков по выбранному фильтру не найдено."}
                      </span>
                    </div>
                  ) : (
                    <div className="rounded-lg border overflow-hidden">
                      <div className="grid grid-cols-[100px_1fr_130px] items-center gap-3 px-3 py-2 bg-muted/40 border-b text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        <span>Дата</span>
                        <span>Дисциплина / Причина</span>
                        <span className="text-right">Статус</span>
                      </div>
                      <div className="divide-y text-xs">
                        {filteredAbsences.map((ab) => (
                          <div
                            key={ab.id}
                            className="grid grid-cols-[100px_1fr_130px] items-center gap-3 px-3 py-2.5 hover:bg-muted/10 transition-colors"
                          >
                            <span className="font-mono text-muted-foreground text-[11px] font-medium">
                              {ab.date}
                            </span>
                            <div className="min-w-0">
                              <div className="font-medium text-foreground truncate">
                                {ab.subjectName}
                              </div>
                              {ab.comment && (
                                <div className="text-[11px] text-muted-foreground italic truncate">
                                  Причина: {ab.comment}
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <Badge
                                variant="outline"
                                className={`text-[9px] px-2 py-0.5 font-medium ${
                                  ab.status === "EXCUSED"
                                    ? "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400"
                                    : "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                }`}
                              >
                                {ab.status === "EXCUSED" ? "Уважительная" : "Н/Б (Неявка)"}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column (1 span): Academics, Group & Status Details */}
            <div className="space-y-3">
              {/* Academics & Submissions Card */}
              <div className="rounded-xl border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4 text-primary" /> Успеваемость
                  </span>
                  {student.academics.averageGrade && (
                    <span className="text-[10px] font-mono font-bold text-primary px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20">
                      Ср. балл: {student.academics.averageGrade}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg border bg-background">
                    <span className="text-[10px] text-muted-foreground block">Сдано работ</span>
                    <span className="text-lg font-bold text-foreground mt-0.5 block">
                      {selectedMonthKey !== "ALL"
                        ? filteredSubmissions.length
                        : student.academics.submittedAssignments}
                    </span>
                    <span className="text-[9px] text-muted-foreground">
                      {selectedMonthKey !== "ALL" ? currentKPIs.label : "Всего заданий"}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg border bg-background">
                    <span className="text-[10px] text-muted-foreground block">Проверено</span>
                    <span className="text-lg font-bold text-primary mt-0.5 block">
                      {selectedMonthKey !== "ALL"
                        ? filteredSubmissions.filter((s) => typeof s.grade === "number").length
                        : student.academics.gradedAssignments}
                    </span>
                    <span className="text-[9px] text-muted-foreground">С выставленной оценкой</span>
                  </div>
                </div>

                {/* Recent Submissions List */}
                {filteredSubmissions.length > 0 ? (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-semibold text-muted-foreground block">
                      {selectedMonthKey !== "ALL"
                        ? `Сданные работы за ${currentKPIs.label}:`
                        : "Недавние работы студента:"}
                    </span>
                    <div className="divide-y border rounded-lg overflow-hidden bg-background">
                      {filteredSubmissions.slice(0, 5).map((sub) => (
                        <div key={sub.id} className="p-2 flex items-center justify-between gap-2 text-[11px]">
                          <div className="min-w-0">
                            <div className="font-medium text-foreground truncate">{sub.assignmentTitle}</div>
                            <div className="text-[10px] text-muted-foreground truncate">{sub.subjectName}</div>
                          </div>
                          <div className="shrink-0 text-right">
                            {typeof sub.grade === "number" ? (
                              <Badge variant="outline" className="font-mono font-bold text-[10px] px-1.5 py-0 text-primary border-primary/30 bg-primary/5">
                                Оценка: {sub.grade}
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                                На проверке
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-lg border bg-muted/20 text-muted-foreground text-[11px] text-center">
                    Сданных работ пока нет
                  </div>
                )}
              </div>

              {/* Group & Academic Info Card */}
              <div className="rounded-xl border bg-card p-4 space-y-3">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5 border-b pb-2">
                  <GraduationCap className="h-4 w-4 text-primary" /> Академические данные
                </span>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between py-1 border-b">
                    <span className="text-muted-foreground">Учебная группа:</span>
                    {student.groupId ? (
                      <Link
                        href={`/dashboard/groups/${student.groupId}`}
                        className="font-bold text-foreground hover:text-primary hover:underline transition-colors"
                      >
                        {student.groupName} ({student.course} курс)
                      </Link>
                    ) : (
                      <span className="font-medium text-foreground">{student.groupName}</span>
                    )}
                  </div>

                  {student.specialtyName && (
                    <div className="flex items-center justify-between py-1 border-b">
                      <span className="text-muted-foreground">Специальность:</span>
                      <span className="font-medium text-foreground text-right max-w-[200px] truncate" title={student.specialtyName}>
                        {student.specialtyName}
                      </span>
                    </div>
                  )}

                  {student.curatorName && (
                    <div className="flex items-center justify-between py-1 border-b">
                      <span className="text-muted-foreground">Куратор группы:</span>
                      <span className="font-medium text-foreground">{student.curatorName}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between py-1 border-b">
                    <span className="text-muted-foreground">Поименный номер:</span>
                    <span className="font-mono font-bold text-foreground">
                      {currentRollNumber ? `№ ${currentRollNumber}` : "Не назначен"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b">
                    <span className="text-muted-foreground">Статус в группе:</span>
                    <span className="font-medium text-foreground">
                      {student.roleInGroup === "MONITOR"
                        ? "Староста"
                        : student.roleInGroup === "DEPUTY_MONITOR"
                        ? "Зам. старосты"
                        : "Студент"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <span className="text-muted-foreground">График дежурства:</span>
                    <span className="font-medium text-foreground">
                      {student.isDutyExempt ? (
                        <span className="text-sky-600 dark:text-sky-400 font-semibold">Освобожден (ЛОВЗ)</span>
                      ) : (
                        "В общем графике"
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MONTHLY BREAKDOWN (ПО МЕСЯЦАМ) */}
      {activeTab === "monthly" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border bg-card space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
              <div>
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  Помесячная сводка посещаемости и стипендий
                </h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Полная хронология посещений занятий, пропусков и стипендиальных решений по месяцам
                </p>
              </div>

              {student.monthlyStats.length > 0 && (
                <Badge variant="outline" className="text-xs px-2.5 py-1 font-medium">
                  Всего периодов: {student.monthlyStats.length}
                </Badge>
              )}
            </div>

            {student.monthlyStats.length === 0 ? (
              <div className="p-6 rounded-lg border bg-muted/10 text-center text-muted-foreground text-xs">
                Помесячных данных пока не зафиксировано
              </div>
            ) : (
              <div className="rounded-lg border overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b bg-muted/40 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      <th className="p-2.5">Месяц</th>
                      <th className="p-2.5 text-center">Всего пар</th>
                      <th className="p-2.5 text-center">Явка (было)</th>
                      <th className="p-2.5 text-center">Пропуски (Н/Б)</th>
                      <th className="p-2.5 text-center">Уваж.</th>
                      <th className="p-2.5 text-center">% Посещаемости</th>
                      <th className="p-2.5 text-center">Сдано заданий</th>
                      <th className="p-2.5">Стипендия</th>
                      <th className="p-2.5 text-right">Действие</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {student.monthlyStats.map((item) => {
                      const att = item.attendance;
                      const hasScholarship = !!item.scholarship;

                      return (
                        <tr
                          key={item.monthKey}
                          className="hover:bg-muted/10 transition-colors"
                        >
                          <td className="p-2.5 font-semibold text-foreground whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                              <span>{item.monthLabel}</span>
                            </div>
                          </td>

                          <td className="p-2.5 text-center font-mono font-medium text-foreground">
                            {att.total}
                          </td>

                          <td className="p-2.5 text-center font-mono font-bold text-emerald-600">
                            {att.present}
                          </td>

                          <td className="p-2.5 text-center font-mono font-bold text-rose-600">
                            {att.absent}
                          </td>

                          <td className="p-2.5 text-center font-mono text-sky-600">
                            {att.excused}
                          </td>

                          <td className="p-2.5 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <span
                                className={`font-mono font-bold ${
                                  att.percent >= 85
                                    ? "text-emerald-600"
                                    : att.percent >= 70
                                    ? "text-amber-600"
                                    : "text-rose-600"
                                }`}
                              >
                                {att.percent}%
                              </span>
                              <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden hidden sm:block">
                                <div
                                  className={`h-full ${
                                    att.percent >= 85
                                      ? "bg-emerald-600"
                                      : att.percent >= 70
                                      ? "bg-amber-600"
                                      : "bg-rose-600"
                                  }`}
                                  style={{ width: `${att.percent}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          <td className="p-2.5 text-center font-mono text-foreground">
                            {item.submissionsCount}
                          </td>

                          <td className="p-2.5">
                            {hasScholarship ? (
                              <Badge
                                variant="outline"
                                className={`text-[10px] px-2 py-0.5 font-medium whitespace-nowrap ${
                                  item.scholarship?.status === "EXCELLENT"
                                    ? "border-primary/40 bg-primary/10 text-primary"
                                    : item.scholarship?.status === "GOOD"
                                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                    : "border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                }`}
                              >
                                {item.scholarship?.statusLabel}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-[11px]">—</span>
                            )}
                          </td>

                          <td className="p-2.5 text-right whitespace-nowrap">
                            <Button
                              variant="outline"
                              size="xs"
                              className="h-6 text-[10px] px-2"
                              onClick={() => {
                                setSelectedMonthKey(item.monthKey);
                                setActiveTab("overview");
                              }}
                            >
                              Подробнее
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SUBJECT BREAKDOWN (ПО ДИСЦИПЛИНАМ) */}
      {activeTab === "subjects" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border bg-card space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
              <div>
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <BookMarked className="h-4 w-4 text-primary" />
                  Успеваемость и посещаемость по дисциплинам
                </h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Сводная ведомость посещения занятий, сданных работ и полученных оценок по предметам
                </p>
              </div>

              <Badge variant="outline" className="text-xs px-2.5 py-1 font-medium">
                Предметов: {student.subjectStats.length}
              </Badge>
            </div>

            {student.subjectStats.length === 0 ? (
              <div className="p-6 rounded-lg border bg-muted/10 text-center text-muted-foreground text-xs">
                Дисциплины для данной группы пока не назначены
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {student.subjectStats.map((subj) => (
                  <div
                    key={subj.subjectName}
                    className="p-3.5 rounded-lg border bg-background hover:border-primary/40 transition-colors space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-bold text-xs text-foreground truncate">
                          {subj.subjectName}
                        </h3>
                        <p className="text-[11px] text-muted-foreground truncate">
                          Преподаватель: {subj.teacherName || "Не назначен"}
                        </p>
                      </div>

                      {subj.averageGrade && (
                        <div className="shrink-0 text-right">
                          <span className="font-mono text-xs font-bold text-primary px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                            Ср. балл: {subj.averageGrade}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Stats Pill Matrix */}
                    <div className="grid grid-cols-3 gap-2 text-center text-[11px] pt-1 border-t">
                      <div className="p-1.5 rounded bg-muted/40 border">
                        <span className="text-[10px] text-muted-foreground block">Занятий</span>
                        <span className="font-mono font-bold text-foreground">
                          {subj.totalClasses}
                        </span>
                      </div>

                      <div className="p-1.5 rounded bg-rose-500/5 border border-rose-500/20">
                        <span className="text-[10px] text-rose-700 dark:text-rose-400 block">Пропусков</span>
                        <span className="font-mono font-bold text-rose-600">
                          {subj.absencesCount}
                        </span>
                      </div>

                      <div className="p-1.5 rounded bg-emerald-500/5 border border-emerald-500/20">
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block">Посещаемость</span>
                        <span className="font-mono font-bold text-emerald-600">
                          {subj.attendancePercent}%
                        </span>
                      </div>
                    </div>

                    {/* Grades List */}
                    <div className="pt-1 flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">Оценки:</span>
                      {subj.grades.length > 0 ? (
                        <div className="flex items-center gap-1 flex-wrap justify-end">
                          {subj.grades.map((grade, idx) => (
                            <span
                              key={idx}
                              className={`h-5 w-5 rounded flex items-center justify-center font-mono font-bold text-[10px] border ${
                                grade >= 4
                                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                                  : grade === 3
                                  ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                                  : "bg-rose-500/10 text-rose-600 border-rose-500/30"
                              }`}
                            >
                              {grade}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic text-[10px]">
                          Оценок пока нет
                        </span>
                      )}
                    </div>

                    {/* Submissions count */}
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground border-t pt-1.5">
                      <span>Сдано заданий:</span>
                      <span className="font-medium text-foreground">
                        {subj.submittedAssignments}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dialog for Quick Editing Student Roll Number (П/Н) */}
      <Dialog open={isRollNumberModalOpen} onOpenChange={setIsRollNumberModalOpen}>
        <DialogContent className="p-4 gap-3 text-xs sm:max-w-[380px]">
          <DialogHeader className="pb-2 border-b text-left gap-1">
            <DialogTitle className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Hash className="h-4 w-4 text-primary" />
              Поименный номер (П/Н)
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Студент: <span className="font-semibold text-foreground">{student.name}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-1">
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                Поименный номер в сводном журнале
              </label>
              <Input
                value={rollNumberInput}
                onChange={(e) => setRollNumberInput(e.target.value)}
                placeholder="Например, 3969"
                className="h-8 text-xs font-mono bg-background"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSaveRollNumber();
                  }
                }}
              />
              <p className="text-[10px] text-muted-foreground">
                Номер отображается в ведомостях стипендий, приказах и карточке группы.
              </p>
            </div>
          </div>

          <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
            <Button
              variant="outline"
              size="xs"
              className="h-8 text-xs px-3"
              onClick={() => setIsRollNumberModalOpen(false)}
              disabled={isSavingRollNumber}
            >
              Отмена
            </Button>
            <Button
              size="xs"
              className="h-8 text-xs px-3 gap-1.5"
              onClick={handleSaveRollNumber}
              disabled={isSavingRollNumber}
            >
              <Save className="h-3.5 w-3.5" />
              {isSavingRollNumber ? "Сохранение..." : "Сохранить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for Resetting Student Password */}
      <Dialog open={isResetPasswordOpen} onOpenChange={setIsResetPasswordOpen}>
        <DialogContent className="p-4 gap-3 text-xs sm:max-w-[400px]">
          <DialogHeader className="pb-2 border-b text-left gap-1">
            <DialogTitle className="flex items-center gap-2 text-sm font-bold text-foreground">
              <KeyRound className="h-4 w-4 text-primary" />
              Сброс пароля студента
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Студент: <span className="font-semibold text-foreground">{student.name}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-1">
            {/* Toggle auto / manual */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-muted/60 rounded-lg border text-xs">
              <button
                type="button"
                onClick={() => setPasswordMode("auto")}
                className={`py-1 rounded font-medium transition-colors ${
                  passwordMode === "auto" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
                }`}
              >
                Случайный пароль
              </button>
              <button
                type="button"
                onClick={() => setPasswordMode("manual")}
                className={`py-1 rounded font-medium transition-colors ${
                  passwordMode === "manual" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
                }`}
              >
                Ввести вручную
              </button>
            </div>

            {passwordMode === "auto" ? (
              <div className="p-2.5 rounded-lg border bg-muted/20 flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-foreground">{generatedPassword}</span>
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={() => handleCopyPassword(generatedPassword)}
                  className="h-6 text-[10px]"
                >
                  {isCopiedPassword ? (
                    <>
                      <Check className="h-3 w-3 mr-1 text-emerald-600" /> Скопировано
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 mr-1" /> Скопировать
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-foreground">Новый пароль (от 6 символов)</label>
                <div className="relative">
                  <Input
                    type={showManualPassword ? "text" : "password"}
                    value={manualPassword}
                    onChange={(e) => setManualPassword(e.target.value)}
                    placeholder="Введите пароль..."
                    className="h-8 text-xs font-mono pr-8"
                  />
                  <button
                    type="button"
                    onClick={() => setShowManualPassword(!showManualPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showManualPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
            <Button
              variant="outline"
              size="xs"
              className="h-8 text-xs px-3"
              onClick={() => setIsResetPasswordOpen(false)}
              disabled={isResettingPassword}
            >
              Отмена
            </Button>
            <Button
              size="xs"
              className="h-8 text-xs px-3 gap-1.5"
              onClick={handleConfirmResetPassword}
              disabled={isResettingPassword || (passwordMode === "manual" && manualPassword.trim().length < 6)}
            >
              {isResettingPassword ? "Сохранение..." : "Установить пароль"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
