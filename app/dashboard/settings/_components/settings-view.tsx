"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Settings,
  User,
  Lock,
  Users,
  CalendarDays,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Shield,
  GraduationCap,
  Award,
  Plus,
  ToggleLeft,
  ToggleRight,
  BookOpen,
  ClipboardList,
  FileText,
  BarChart3,
  Building2,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  Globe,
  Sliders,
  Megaphone,
  Bell,
  HelpCircle,
  Check,
} from "lucide-react";
import type {
  UserProfileDTO,
  AcademicYearDTO,
  SystemStatsDTO,
  SystemConfigDTO,
} from "../actions";
import {
  updateProfileAction,
  changePasswordAction,
  toggleUserActiveAction,
  changeUserRoleAction,
  createUserAction,
  setCurrentAcademicYearAction,
  createAcademicYearAction,
  updateAcademicYearAction,
  deleteAcademicYearAction,
  updateSystemConfigAction,
} from "../actions";

interface SettingsViewProps {
  profile: UserProfileDTO;
  allUsers: UserProfileDTO[];
  academicYears: AcademicYearDTO[];
  systemStats: SystemStatsDTO | null;
  systemConfig: SystemConfigDTO;
  role: string;
}

type Tab =
  | "profile"
  | "security"
  | "organization"
  | "learning"
  | "access"
  | "notice"
  | "users"
  | "academic"
  | "system";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Администратор",
  TEACHER: "Преподаватель",
  STUDENT: "Студент",
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950 dark:text-rose-400 dark:border-rose-800",
  TEACHER: "bg-primary/10 text-primary border-primary/20",
  STUDENT: "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800",
};

export function SettingsView({ profile, allUsers, academicYears, systemStats, systemConfig, role }: SettingsViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isAdmin = role === "ADMIN";
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Profile
  const [profileName, setProfileName] = useState(profile.name);
  const [profilePhone, setProfilePhone] = useState(profile.phone || "");
  const [profileAvatar, setProfileAvatar] = useState(profile.avatar || "");

  // Password
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  // Create User
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<"ADMIN" | "TEACHER" | "STUDENT">("STUDENT");
  const [newUserPhone, setNewUserPhone] = useState("");

  // Academic Year
  const [isCreateYearOpen, setIsCreateYearOpen] = useState(false);
  const [newYearName, setNewYearName] = useState("");
  const [newYearStart, setNewYearStart] = useState("");
  const [newYearEnd, setNewYearEnd] = useState("");

  const [editYearTarget, setEditYearTarget] = useState<AcademicYearDTO | null>(null);
  const [editYearName, setEditYearName] = useState("");
  const [editYearStart, setEditYearStart] = useState("");
  const [editYearEnd, setEditYearEnd] = useState("");

  const [deleteYearTarget, setDeleteYearTarget] = useState<AcademicYearDTO | null>(null);

  // User search
  const [userSearch, setUserSearch] = useState("");

  // System Config State
  const [instName, setInstName] = useState(systemConfig?.institutionName || "");
  const [instEmail, setInstEmail] = useState(systemConfig?.supportEmail || "");
  const [instPhone, setInstPhone] = useState(systemConfig?.supportPhone || "");
  const [instAddress, setInstAddress] = useState(systemConfig?.address || "");

  const [defScore, setDefScore] = useState(systemConfig?.defaultMaxScore || "100");
  const [lessonDuration, setLessonDuration] = useState(systemConfig?.lessonDurationMinutes || "45");
  const [allowLate, setAllowLate] = useState(systemConfig?.allowLateSubmissions ?? true);

  const [allowSelfReg, setAllowSelfReg] = useState(systemConfig?.allowSelfRegistration ?? true);
  const [emailDomain, setEmailDomain] = useState(systemConfig?.allowedEmailDomain || "");
  const [maxFileMb, setMaxFileMb] = useState(systemConfig?.maxFileUploadMb || "50");

  const [noticeTitle, setNoticeTitle] = useState(systemConfig?.globalNoticeTitle || "");
  const [noticeContent, setNoticeContent] = useState(systemConfig?.globalNoticeContent || "");
  const [showNotice, setShowNotice] = useState(systemConfig?.showGlobalNotice ?? false);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
    setErrorMsg(null);
  };
  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 4000);
  };

  const handleUpdateProfile = () => {
    if (!profileName.trim()) { showError("Укажите имя"); return; }
    startTransition(async () => {
      const res = await updateProfileAction({ name: profileName, phone: profilePhone, avatar: profileAvatar });
      if (res.success) { showSuccess("Профиль обновлён!"); router.refresh(); }
      else showError(res.error || "Ошибка");
    });
  };

  const handleChangePassword = () => {
    if (!currentPwd || !newPwd) { showError("Заполните все поля"); return; }
    if (newPwd !== confirmPwd) { showError("Пароли не совпадают"); return; }
    if (newPwd.length < 6) { showError("Минимум 6 символов"); return; }
    startTransition(async () => {
      const res = await changePasswordAction({ currentPassword: currentPwd, newPassword: newPwd });
      if (res.success) {
        showSuccess("Пароль изменён!");
        setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
      } else showError(res.error || "Ошибка");
    });
  };

  const handleToggleUser = (userId: string, currentActive: boolean) => {
    startTransition(async () => {
      const res = await toggleUserActiveAction(userId, !currentActive);
      if (res.success) { showSuccess("Статус пользователя изменён!"); router.refresh(); }
      else showError(res.error || "Ошибка");
    });
  };

  const handleChangeRole = (userId: string, newRole: "ADMIN" | "TEACHER" | "STUDENT") => {
    startTransition(async () => {
      const res = await changeUserRoleAction(userId, newRole);
      if (res.success) { showSuccess("Роль изменена!"); router.refresh(); }
      else showError(res.error || "Ошибка");
    });
  };

  const handleCreateUser = () => {
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword) {
      showError("Заполните все поля"); return;
    }
    startTransition(async () => {
      const res = await createUserAction({
        name: newUserName, email: newUserEmail,
        password: newUserPassword, role: newUserRole, phone: newUserPhone,
      });
      if (res.success) {
        setIsCreateUserOpen(false);
        setNewUserName(""); setNewUserEmail(""); setNewUserPassword(""); setNewUserPhone("");
        showSuccess("Пользователь создан!");
        router.refresh();
      } else showError(res.error || "Ошибка");
    });
  };

  const handleSetCurrentYear = (yearId: string) => {
    startTransition(async () => {
      const res = await setCurrentAcademicYearAction(yearId);
      if (res.success) { showSuccess("Учебный год установлен!"); router.refresh(); }
      else showError(res.error || "Ошибка");
    });
  };

  const handleCreateYear = () => {
    if (!newYearName.trim() || !newYearStart || !newYearEnd) {
      showError("Заполните все поля"); return;
    }
    startTransition(async () => {
      const res = await createAcademicYearAction({ name: newYearName, startDate: newYearStart, endDate: newYearEnd });
      if (res.success) {
        setIsCreateYearOpen(false);
        setNewYearName(""); setNewYearStart(""); setNewYearEnd("");
        showSuccess("Учебный год добавлен!");
        router.refresh();
      } else showError(res.error || "Ошибка");
    });
  };

  const handleOpenEditYear = (y: AcademicYearDTO) => {
    setEditYearTarget(y);
    setEditYearName(y.name);
    setEditYearStart(y.startDate ? new Date(y.startDate).toISOString().slice(0, 10) : "");
    setEditYearEnd(y.endDate ? new Date(y.endDate).toISOString().slice(0, 10) : "");
  };

  const handleUpdateYear = () => {
    if (!editYearTarget || !editYearName.trim() || !editYearStart || !editYearEnd) {
      showError("Заполните все поля"); return;
    }
    startTransition(async () => {
      const res = await updateAcademicYearAction(editYearTarget.id, {
        name: editYearName,
        startDate: editYearStart,
        endDate: editYearEnd,
      });
      if (res.success) {
        setEditYearTarget(null);
        showSuccess("Учебный год обновлён!");
        router.refresh();
      } else showError(res.error || "Ошибка");
    });
  };

  const handleDeleteYear = () => {
    if (!deleteYearTarget) return;
    startTransition(async () => {
      const res = await deleteAcademicYearAction(deleteYearTarget.id);
      if (res.success) {
        setDeleteYearTarget(null);
        showSuccess("Учебный год удалён!");
        router.refresh();
      } else showError(res.error || "Ошибка");
    });
  };

  const handleSaveConfig = (data: Partial<SystemConfigDTO>, successMessage: string) => {
    startTransition(async () => {
      const res = await updateSystemConfigAction(data);
      if (res.success) {
        showSuccess(successMessage);
        router.refresh();
      } else {
        showError(res.error || "Ошибка сохранения настроек");
      }
    });
  };

  const filteredUsers = allUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const TABS: { key: Tab; label: string; icon: React.ReactNode; adminOnly?: boolean }[] = [
    { key: "profile" as Tab, label: "Профиль", icon: <User className="h-3.5 w-3.5" /> },
    { key: "security" as Tab, label: "Безопасность", icon: <Lock className="h-3.5 w-3.5" /> },
    { key: "organization" as Tab, label: "Организация", icon: <Globe className="h-3.5 w-3.5" />, adminOnly: true },
    { key: "learning" as Tab, label: "Обучение", icon: <Sliders className="h-3.5 w-3.5" />, adminOnly: true },
    { key: "access" as Tab, label: "Документы & Доступ", icon: <Shield className="h-3.5 w-3.5" />, adminOnly: true },
    { key: "notice" as Tab, label: "Объявление над сайтом", icon: <Megaphone className="h-3.5 w-3.5" />, adminOnly: true },
    { key: "users" as Tab, label: "Пользователи", icon: <Users className="h-3.5 w-3.5" />, adminOnly: true },
    { key: "academic" as Tab, label: "Учебный год", icon: <CalendarDays className="h-3.5 w-3.5" />, adminOnly: true },
    { key: "system" as Tab, label: "Статистика", icon: <BarChart3 className="h-3.5 w-3.5" />, adminOnly: true },
  ].filter((t) => !t.adminOnly || isAdmin);

  return (
    <div className="space-y-3 w-full text-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-3.5 rounded-xl border shadow-xs">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span>Лицей LMS</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-semibold">Настройки</span>
          </div>
          <h1 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Settings className="h-4 w-4 text-primary" /> Настройки системы
          </h1>
        </div>
        <Badge variant="outline" className={`text-[10px] font-semibold border ${ROLE_COLORS[profile.role] || ""}`}>
          {ROLE_LABELS[profile.role] || profile.role}
        </Badge>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="p-3 rounded-lg border border-primary/30 bg-primary/10 text-primary text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" /><span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" /><span>{errorMsg}</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 p-1 bg-card border rounded-xl shadow-xs overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Profile */}
      {activeTab === "profile" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-card border rounded-xl p-4 space-y-3 shadow-xs">
            <h2 className="font-bold text-foreground flex items-center gap-2 pb-2 border-b">
              <User className="h-4 w-4 text-primary" /> Личные данные
            </h2>

            {/* Avatar preview */}
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full border-2 border-primary/30 bg-muted flex items-center justify-center overflow-hidden shrink-0">
                {profileAvatar ? (
                  <img src={profileAvatar} alt="avatar" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-base font-bold text-muted-foreground">
                    {profile.name.slice(0, 1).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-foreground truncate">{profile.name}</div>
                <div className="text-[10px] text-muted-foreground">{profile.email}</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="space-y-1">
                <label className="font-medium text-foreground text-xs">Имя и фамилия *</label>
                <Input value={profileName} onChange={(e) => setProfileName(e.target.value)} className="h-8 text-xs bg-background" />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-foreground text-xs">Телефон</label>
                <Input value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} placeholder="+7 (XXX) XXX-XX-XX" className="h-8 text-xs bg-background" />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-foreground text-xs">Ссылка на аватар</label>
                <Input value={profileAvatar} onChange={(e) => setProfileAvatar(e.target.value)} placeholder="https://..." className="h-8 text-xs bg-background font-mono" />
              </div>
            </div>

            <Button size="xs" disabled={isPending} onClick={handleUpdateProfile} className="w-full h-8 font-medium">
              Сохранить профиль
            </Button>
          </div>

          <div className="bg-card border rounded-xl p-4 space-y-3 shadow-xs">
            <h2 className="font-bold text-foreground flex items-center gap-2 pb-2 border-b">
              <Shield className="h-4 w-4 text-primary" /> Информация об аккаунте
            </h2>
            <div className="space-y-2.5">
              {[
                { label: "Email", value: profile.email },
                { label: "Роль", value: ROLE_LABELS[profile.role] || profile.role },
                { label: "Статус", value: profile.isActive ? "Активен" : "Заблокирован" },
                { label: "Дата регистрации", value: new Date(profile.createdAt).toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" }) },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-1.5 border-b last:border-0">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium text-foreground">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Security */}
      {activeTab === "security" && (
        <div className="bg-card border rounded-xl p-4 space-y-3 shadow-xs">
          <h2 className="font-bold text-foreground flex items-center gap-2 pb-2 border-b">
            <Lock className="h-4 w-4 text-primary" /> Смена пароля
          </h2>
          <div className="space-y-2">
            <div className="space-y-1">
              <label className="font-medium text-foreground text-xs">Текущий пароль *</label>
              <div className="relative">
                <Input
                  type={showPwd ? "text" : "password"}
                  value={currentPwd}
                  onChange={(e) => setCurrentPwd(e.target.value)}
                  className="h-8 text-xs bg-background pr-8"
                />
                <button type="button" onClick={() => setShowPwd((v) => !v)} className="absolute right-2 top-2 text-muted-foreground hover:text-foreground">
                  {showPwd ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <label className="font-medium text-foreground text-xs">Новый пароль *</label>
              <Input type={showPwd ? "text" : "password"} value={newPwd} onChange={(e) => setNewPwd(e.target.value)} className="h-8 text-xs bg-background" />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-foreground text-xs">Подтвердите пароль *</label>
              <Input
                type={showPwd ? "text" : "password"}
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
                className={`h-8 text-xs bg-background ${confirmPwd && confirmPwd !== newPwd ? "border-destructive" : ""}`}
              />
              {confirmPwd && confirmPwd !== newPwd && (
                <p className="text-[10px] text-destructive">Пароли не совпадают</p>
              )}
            </div>
          </div>
          <Button size="xs" disabled={isPending} onClick={handleChangePassword} className="w-full h-8 font-medium">
            Изменить пароль
          </Button>
        </div>
      )}

      {/* Tab: Organization (Admin only) */}
      {activeTab === "organization" && isAdmin && (
        <div className="bg-card border rounded-xl p-4 space-y-3 shadow-xs">
          <h2 className="font-bold text-foreground flex items-center gap-2 pb-2 border-b">
            <Globe className="h-4 w-4 text-primary" /> Данные учебного заведения
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-medium text-foreground text-xs">Название учебного заведения *</label>
              <Input
                value={instName}
                onChange={(e) => setInstName(e.target.value)}
                placeholder="например: Лицей №15 или Колледж ИТ"
                className="h-8 text-xs bg-background"
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-foreground text-xs">Email службы поддержки</label>
              <Input
                value={instEmail}
                onChange={(e) => setInstEmail(e.target.value)}
                placeholder="support@lyceum.ru"
                className="h-8 text-xs bg-background font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-foreground text-xs">Телефон связи</label>
              <Input
                value={instPhone}
                onChange={(e) => setInstPhone(e.target.value)}
                placeholder="+7 (495) 123-45-67"
                className="h-8 text-xs bg-background"
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-foreground text-xs">Физический адрес</label>
              <Input
                value={instAddress}
                onChange={(e) => setInstAddress(e.target.value)}
                placeholder="г. Москва, ул..."
                className="h-8 text-xs bg-background"
              />
            </div>
          </div>
          <Button
            size="xs"
            disabled={isPending}
            onClick={() =>
              handleSaveConfig(
                {
                  institutionName: instName,
                  supportEmail: instEmail,
                  supportPhone: instPhone,
                  address: instAddress,
                },
                "Данные заведения сохранены!"
              )
            }
            className="h-8 font-medium"
          >
            Сохранить настройки заведения
          </Button>
        </div>
      )}

      {/* Tab: Learning parameters (Admin only) */}
      {activeTab === "learning" && isAdmin && (
        <div className="bg-card border rounded-xl p-4 space-y-3 shadow-xs">
          <h2 className="font-bold text-foreground flex items-center gap-2 pb-2 border-b">
            <Sliders className="h-4 w-4 text-primary" /> Параметры учебного процесса & Оценивания
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-medium text-foreground text-xs">Балл за ДЗ по умолчанию (Max)</label>
              <Input
                type="number"
                value={defScore}
                onChange={(e) => setDefScore(e.target.value)}
                className="h-8 text-xs bg-background"
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-foreground text-xs">Длительность академического часа (мин)</label>
              <Input
                type="number"
                value={lessonDuration}
                onChange={(e) => setLessonDuration(e.target.value)}
                className="h-8 text-xs bg-background"
              />
            </div>
          </div>

          <div className="p-3 border rounded-lg bg-muted/20 flex items-center justify-between gap-3">
            <label htmlFor="allow-late" className="space-y-0.5 cursor-pointer flex-1">
              <div className="font-semibold text-foreground text-xs">Приём работ после дедлайна</div>
              <div className="text-[11px] text-muted-foreground">
                Разрешить студентам отправлять домашние задания позже срока (с пометкой «Сдано с опозданием»)
              </div>
            </label>
            <Switch
              id="allow-late"
              checked={allowLate}
              onCheckedChange={(checked) => setAllowLate(!!checked)}
            />
          </div>

          <Button
            size="xs"
            disabled={isPending}
            onClick={() =>
              handleSaveConfig(
                {
                  defaultMaxScore: defScore,
                  lessonDurationMinutes: lessonDuration,
                  allowLateSubmissions: allowLate,
                },
                "Параметры учебного процесса сохранены!"
              )
            }
            className="h-8 font-medium"
          >
            Сохранить параметры обучения
          </Button>
        </div>
      )}

      {/* Tab: Access & Registration (Admin only) */}
      {activeTab === "access" && isAdmin && (
        <div className="bg-card border rounded-xl p-4 space-y-3 shadow-xs">
          <h2 className="font-bold text-foreground flex items-center gap-2 pb-2 border-b">
            <Shield className="h-4 w-4 text-primary" /> Безопасность, Доступ и Файлы
          </h2>

          <div className="p-3 border rounded-lg bg-muted/20 flex items-center justify-between gap-3">
            <label htmlFor="allow-self-reg" className="space-y-0.5 cursor-pointer flex-1">
              <div className="font-semibold text-foreground text-xs">Самостоятельная регистрация</div>
              <div className="text-[11px] text-muted-foreground">
                Разрешить студентам самостоятельно создавать аккаунты на странице входа (/register)
              </div>
            </label>
            <Switch
              id="allow-self-reg"
              checked={allowSelfReg}
              onCheckedChange={(checked) => setAllowSelfReg(!!checked)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-medium text-foreground text-xs">Разрешённый домен Email для регистрации</label>
              <Input
                value={emailDomain}
                onChange={(e) => setEmailDomain(e.target.value)}
                placeholder="например: lyceum.ru (оставьте пустым для любых)"
                className="h-8 text-xs bg-background font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground text-xs">Максимальный размер загружаемых файлов (МБ)</label>
              <Input
                type="number"
                value={maxFileMb}
                onChange={(e) => setMaxFileMb(e.target.value)}
                placeholder="50"
                className="h-8 text-xs bg-background"
              />
            </div>
          </div>

          <Button
            size="xs"
            disabled={isPending}
            onClick={() =>
              handleSaveConfig(
                {
                  allowSelfRegistration: allowSelfReg,
                  allowedEmailDomain: emailDomain,
                  maxFileUploadMb: maxFileMb,
                },
                "Параметры доступа сохранены!"
              )
            }
            className="h-8 font-medium"
          >
            Сохранить настройки доступа
          </Button>
        </div>
      )}

      {/* Tab: System Notice Banner (Admin only) */}
      {activeTab === "notice" && isAdmin && (
        <div className="bg-card border rounded-xl p-4 space-y-3 shadow-xs">
          <h2 className="font-bold text-foreground flex items-center gap-2 pb-2 border-b">
            <Megaphone className="h-4 w-4 text-primary" /> Системное объявление для всех пользователей
          </h2>

          <div className="p-3 border rounded-lg bg-muted/20 flex items-center justify-between gap-3">
            <label htmlFor="show-notice" className="space-y-0.5 cursor-pointer flex-1">
              <div className="font-semibold text-foreground text-xs">Показывать баннер на сайте</div>
              <div className="text-[11px] text-muted-foreground">
                Включить отображение важного сообщения над главным меню для всех студентов и преподавателей
              </div>
            </label>
            <Switch
              id="show-notice"
              checked={showNotice}
              onCheckedChange={(checked) => setShowNotice(!!checked)}
            />
          </div>

          <div className="space-y-2">
            <div className="space-y-1">
              <label className="font-medium text-foreground text-xs">Заголовок объявления</label>
              <Input
                value={noticeTitle}
                onChange={(e) => setNoticeTitle(e.target.value)}
                placeholder="например: Внимание! Технический перерыв 15 августа"
                className="h-8 text-xs bg-background font-semibold"
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-foreground text-xs">Текст сообщения</label>
              <Input
                value={noticeContent}
                onChange={(e) => setNoticeContent(e.target.value)}
                placeholder="Напишите подробное сообщение..."
                className="h-8 text-xs bg-background"
              />
            </div>
          </div>

          {showNotice && (noticeTitle || noticeContent) && (
            <div className="p-3 rounded-lg border border-primary/30 bg-primary/10 space-y-1 text-xs">
              <div className="font-bold text-primary flex items-center gap-1.5">
                <Bell className="h-3.5 w-3.5" /> Предпросмотр баннера:
              </div>
              <div className="font-semibold text-foreground">{noticeTitle || "Без заголовка"}</div>
              <div className="text-[11px] text-muted-foreground">{noticeContent || "Без текста"}</div>
            </div>
          )}

          <Button
            size="xs"
            disabled={isPending}
            onClick={() =>
              handleSaveConfig(
                {
                  globalNoticeTitle: noticeTitle,
                  globalNoticeContent: noticeContent,
                  showGlobalNotice: showNotice,
                },
                "Системное объявление обновлено!"
              )
            }
            className="h-8 font-medium"
          >
            Сохранить объявление
          </Button>
        </div>
      )}

      {/* Tab: Users (Admin only) */}
      {activeTab === "users" && isAdmin && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="relative flex-1">
              <Input
                placeholder="Поиск пользователей..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="h-8 text-xs bg-card pl-3"
              />
            </div>
            <Button size="xs" className="h-8 gap-1.5 font-medium" onClick={() => setIsCreateUserOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> Создать пользователя
            </Button>
          </div>

          <div className="bg-card border rounded-xl overflow-hidden shadow-xs">
            <div className="p-3.5 border-b flex items-center justify-between">
              <h2 className="font-bold text-foreground flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" /> Все пользователи
              </h2>
              <span className="text-[11px] text-muted-foreground">{filteredUsers.length} чел.</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/30 text-muted-foreground">
                    <th className="text-left py-2 px-3.5 font-medium">Имя</th>
                    <th className="text-left py-2 px-2 font-medium">Email</th>
                    <th className="text-center py-2 px-2 font-medium">Роль</th>
                    <th className="text-center py-2 px-2 font-medium">Статус</th>
                    <th className="text-right py-2 px-3.5 font-medium">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="py-2 px-3.5 font-medium text-foreground">{u.name}</td>
                      <td className="py-2 px-2 text-muted-foreground font-mono text-[10px]">{u.email}</td>
                      <td className="py-2 px-2 text-center">
                        {u.id === profile.id ? (
                          <Badge variant="outline" className={`text-[9px] border ${ROLE_COLORS[u.role] || ""}`}>
                            {ROLE_LABELS[u.role] || u.role}
                          </Badge>
                        ) : (
                          <Select
                            value={u.role}
                            onValueChange={(val) => handleChangeRole(u.id, val as any)}
                            disabled={isPending}
                          >
                            <SelectTrigger className="h-6 text-[10px] px-2 border-primary/20 w-auto min-w-[110px]">
                              <SelectValue>{ROLE_LABELS[u.role] || u.role}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ADMIN" className="text-xs">Администратор</SelectItem>
                              <SelectItem value="TEACHER" className="text-xs">Преподаватель</SelectItem>
                              <SelectItem value="STUDENT" className="text-xs">Студент</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </td>
                      <td className="py-2 px-2 text-center">
                        <Badge variant="outline" className={`text-[9px] border-0 ${u.isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                          {u.isActive ? "Активен" : "Заблокирован"}
                        </Badge>
                      </td>
                      <td className="py-2 px-3.5 text-right">
                        {u.id !== profile.id && (
                          <button
                            type="button"
                            onClick={() => handleToggleUser(u.id, u.isActive)}
                            disabled={isPending}
                            className={`p-1 rounded transition-colors ${u.isActive ? "text-amber-500 hover:bg-amber-50" : "text-primary hover:bg-primary/10"}`}
                            title={u.isActive ? "Заблокировать" : "Активировать"}
                          >
                            {u.isActive
                              ? <ToggleRight className="h-4 w-4" />
                              : <ToggleLeft className="h-4 w-4" />}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Academic Year (Admin only) */}
      {activeTab === "academic" && isAdmin && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button size="xs" className="h-8 gap-1.5 font-medium" onClick={() => setIsCreateYearOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> Добавить учебный год
            </Button>
          </div>

          <div className="bg-card border rounded-xl overflow-hidden shadow-xs">
            <div className="p-3.5 border-b">
              <h2 className="font-bold text-foreground flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" /> Учебные годы
              </h2>
            </div>
            <div className="divide-y">
              {academicYears.map((y) => (
                <div key={y.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-muted/20 transition-colors">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{y.name}</span>
                      {y.isCurrent && (
                        <Badge className="text-[9px] bg-primary text-primary-foreground border-0">Текущий</Badge>
                      )}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {new Date(y.startDate).toLocaleDateString("ru-RU")} — {new Date(y.endDate).toLocaleDateString("ru-RU")}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!y.isCurrent && (
                      <Button
                        size="xs"
                        variant="outline"
                        disabled={isPending}
                        onClick={() => handleSetCurrentYear(y.id)}
                        className="h-6 px-2 text-[10px] font-medium text-primary border-primary/30 hover:bg-primary/10"
                      >
                        Сделать текущим
                      </Button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleOpenEditYear(y)}
                      className="p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                      title="Редактировать"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    {!y.isCurrent && (
                      <button
                        type="button"
                        onClick={() => setDeleteYearTarget(y)}
                        className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        title="Удалить"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {academicYears.length === 0 && (
                <div className="py-10 text-center text-muted-foreground italic">
                  Учебные годы не добавлены
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: System Stats (Admin only) */}
      {activeTab === "system" && isAdmin && systemStats && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Пользователей", value: systemStats.totalUsers, icon: <Users className="h-4 w-4" /> },
              { label: "Студентов", value: systemStats.totalStudents, icon: <GraduationCap className="h-4 w-4" /> },
              { label: "Преподавателей", value: systemStats.totalTeachers, icon: <Award className="h-4 w-4" /> },
              { label: "Администраторов", value: systemStats.totalAdmins, icon: <Shield className="h-4 w-4" /> },
              { label: "Учебных групп", value: systemStats.totalGroups, icon: <Building2 className="h-4 w-4" /> },
              { label: "Дисциплин", value: systemStats.totalSubjects, icon: <BookOpen className="h-4 w-4" /> },
              { label: "Материалов", value: systemStats.totalMaterials, icon: <BookOpen className="h-4 w-4" /> },
              { label: "Заданий", value: systemStats.totalAssignments, icon: <ClipboardList className="h-4 w-4" /> },
            ].map((item) => (
              <div key={item.label} className="bg-card border rounded-xl p-3 flex items-center justify-between gap-2 shadow-xs">
                <div>
                  <div className="text-[10px] text-muted-foreground">{item.label}</div>
                  <div className="text-lg font-bold text-primary">{item.value}</div>
                </div>
                <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  {item.icon}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-card border rounded-xl p-4 space-y-2 shadow-xs">
            <h2 className="font-bold text-foreground flex items-center gap-2 pb-2 border-b">
              <Settings className="h-4 w-4 text-primary" /> О системе
            </h2>
            <div className="space-y-1.5">
              {[
                { label: "Платформа", value: "Лицей LMS" },
                { label: "Технологии", value: "Next.js, Prisma, PostgreSQL, NextAuth" },
                { label: "База данных", value: "PostgreSQL" },
                { label: "Документов в архиве", value: `${systemStats.totalDocuments} шт.` },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-1.5 border-b last:border-0">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium text-foreground">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create User */}
      <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
        <DialogContent className="p-4 gap-3 text-xs sm:max-w-[420px]">
          <DialogHeader className="pb-2 border-b gap-1 text-left">
            <DialogTitle className="flex items-center gap-2 text-sm font-bold">
              <Plus className="h-4 w-4 text-primary" /> Создать пользователя
            </DialogTitle>
            <DialogDescription className="text-xs">Новый аккаунт в системе</DialogDescription>
          </DialogHeader>
          <div className="space-y-2.5 py-1">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1 col-span-2">
                <label className="font-medium text-xs">Имя и фамилия *</label>
                <Input value={newUserName} onChange={(e) => setNewUserName(e.target.value)} placeholder="Иванов Иван" className="h-8 text-xs bg-background" />
              </div>
              <div className="space-y-1 col-span-2">
                <label className="font-medium text-xs">Email *</label>
                <Input type="email" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} placeholder="user@lyceum.ru" className="h-8 text-xs bg-background" />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-xs">Пароль *</label>
                <Input type="password" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} className="h-8 text-xs bg-background" />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-xs">Роль *</label>
                <Select value={newUserRole} onValueChange={(v) => setNewUserRole(v as any)}>
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue>{ROLE_LABELS[newUserRole]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STUDENT" className="text-xs">Студент</SelectItem>
                    <SelectItem value="TEACHER" className="text-xs">Преподаватель</SelectItem>
                    <SelectItem value="ADMIN" className="text-xs">Администратор</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 col-span-2">
                <label className="font-medium text-xs">Телефон</label>
                <Input value={newUserPhone} onChange={(e) => setNewUserPhone(e.target.value)} placeholder="+7..." className="h-8 text-xs bg-background" />
              </div>
            </div>
          </div>
          <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
            <Button variant="outline" size="xs" onClick={() => setIsCreateUserOpen(false)}>Отмена</Button>
            <Button size="xs" disabled={isPending} onClick={handleCreateUser}>Создать</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Create Academic Year */}
      <Dialog open={isCreateYearOpen} onOpenChange={setIsCreateYearOpen}>
        <DialogContent className="p-4 gap-3 text-xs sm:max-w-[380px]">
          <DialogHeader className="pb-2 border-b gap-1 text-left">
            <DialogTitle className="flex items-center gap-2 text-sm font-bold">
              <CalendarDays className="h-4 w-4 text-primary" /> Добавить учебный год
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2.5 py-1">
            <div className="space-y-1">
              <label className="font-medium text-xs">Название *</label>
              <Input value={newYearName} onChange={(e) => setNewYearName(e.target.value)} placeholder="2026-2027" className="h-8 text-xs bg-background" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="font-medium text-xs">Начало *</label>
                <Input type="date" value={newYearStart} onChange={(e) => setNewYearStart(e.target.value)} className="h-8 text-xs bg-background" />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-xs">Конец *</label>
                <Input type="date" value={newYearEnd} onChange={(e) => setNewYearEnd(e.target.value)} className="h-8 text-xs bg-background" />
              </div>
            </div>
          </div>
          <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
            <Button variant="outline" size="xs" onClick={() => setIsCreateYearOpen(false)}>Отмена</Button>
            <Button size="xs" disabled={isPending} onClick={handleCreateYear}>Добавить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Edit Academic Year */}
      <Dialog open={editYearTarget !== null} onOpenChange={(open) => !open && setEditYearTarget(null)}>
        {editYearTarget && (
          <DialogContent className="p-4 gap-3 text-xs sm:max-w-[380px]">
            <DialogHeader className="pb-2 border-b gap-1 text-left">
              <DialogTitle className="flex items-center gap-2 text-sm font-bold">
                <Pencil className="h-4 w-4 text-primary" /> Редактировать учебный год
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-2.5 py-1">
              <div className="space-y-1">
                <label className="font-medium text-xs">Название *</label>
                <Input value={editYearName} onChange={(e) => setEditYearName(e.target.value)} placeholder="2026-2027" className="h-8 text-xs bg-background" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-medium text-xs">Начало *</label>
                  <Input type="date" value={editYearStart} onChange={(e) => setEditYearStart(e.target.value)} className="h-8 text-xs bg-background" />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-xs">Конец *</label>
                  <Input type="date" value={editYearEnd} onChange={(e) => setEditYearEnd(e.target.value)} className="h-8 text-xs bg-background" />
                </div>
              </div>
            </div>
            <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
              <Button variant="outline" size="xs" onClick={() => setEditYearTarget(null)}>Отмена</Button>
              <Button size="xs" disabled={isPending} onClick={handleUpdateYear}>Сохранить</Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Modal: Delete Academic Year */}
      <AlertDialog open={deleteYearTarget !== null} onOpenChange={(open) => !open && setDeleteYearTarget(null)}>
        {deleteYearTarget && (
          <AlertDialogContent className="p-4 gap-3 text-xs sm:max-w-[400px]">
            <AlertDialogHeader className="place-items-start text-left gap-1">
              <AlertDialogTitle className="text-sm font-bold flex items-center gap-2">
                <Trash2 className="h-4 w-4 text-destructive" /> Удалить учебный год?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
                Вы действительно хотите удалить «{deleteYearTarget.name}»? Все связанные учебные группы будут также удалены.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
              <Button variant="outline" size="xs" onClick={() => setDeleteYearTarget(null)}>Отмена</Button>
              <Button variant="destructive" size="xs" disabled={isPending} onClick={handleDeleteYear}>Удалить</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>
    </div>
  );
}
