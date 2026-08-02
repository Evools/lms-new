"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
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
import Link from "next/link";
import {
  Settings,
  User,
  UserCheck,
  Lock,
  Users,
  CalendarDays,
  ChevronRight,
  Shield,
  GraduationCap,
  Award,
  Plus,
  BookOpen,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  Globe,
  Sliders,
  Megaphone,
  Bell,
  Search,
  Building2,
  FileText,
  ClipboardList,
  Download,
  Upload,
  FileSpreadsheet,
  X,
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
  createBulkUsersAction,
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

type Tab = "system" | "users" | "academic";

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

export function SettingsView({
  profile,
  allUsers,
  academicYears,
  systemStats,
  systemConfig,
  role,
}: SettingsViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isAdmin = role === "ADMIN";
  const [activeTab, setActiveTab] = useState<Tab>("system");

  // Profile State
  const [profileName, setProfileName] = useState(profile.name);
  const [profilePhone, setProfilePhone] = useState(profile.phone || "");
  const [profileAvatar, setProfileAvatar] = useState(profile.avatar || "");

  // Password State
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  // User Search & Create State
  const [userSearch, setUserSearch] = useState("");
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<"ADMIN" | "TEACHER" | "STUDENT">("TEACHER");
  const [newUserPhone, setNewUserPhone] = useState("");

  // User Creation & Import Dialog State
  const [createUserMode, setCreateUserMode] = useState<"single" | "excel">("single");
  const [bulkText, setBulkText] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [parsedUsers, setParsedUsers] = useState<
    Array<{ name: string; email: string; role: "ADMIN" | "TEACHER"; phone?: string }>
  >([]);

  const handleDownloadTemplate = () => {
    const headers = "ФИО,Email,Роль,Телефон\n";
    const row1 = "Петрова Анна Сергеевна,petrova@lyceum.ru,TEACHER,+996 (700) 222-334\n";
    const row2 = "Сидоров Алексей Владимирович,sidorov@lyceum.ru,ADMIN,+996 (770) 333-445\n";
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + encodeURIComponent(headers + row1 + row2);

    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", "shablon_importa_sotrudnikov.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);

    try {
      const text = await file.text();
      handleParseBulkText(text);
    } catch (err) {
      toast.add({ title: "Не удалось прочитать файл", type: "error" });
    }
  };

  const handleGeneratePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$";
    let pass = "Lms";
    for (let i = 0; i < 6; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewUserPassword(pass);
  };

  const handleParseBulkText = (text: string) => {
    setBulkText(text);
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    const parsed: Array<{ name: string; email: string; role: "ADMIN" | "TEACHER"; phone?: string }> = [];

    for (const line of lines) {
      const parts = line.split(/[,;\t]/).map((p) => p.trim());
      if (parts.length >= 2) {
        const name = parts[0];
        const email = parts[1];
        if (name.toLowerCase().includes("фио") || email.toLowerCase().includes("email")) {
          continue; // Skip CSV Header Row
        }
        let roleInput = (parts[2] || "").toUpperCase();
        let role: "ADMIN" | "TEACHER" = "TEACHER";
        if (roleInput.includes("ADMIN") || roleInput.includes("АДМИН")) role = "ADMIN";

        const phone = parts[3] || undefined;
        if (name && email.includes("@")) {
          parsed.push({ name, email, role, phone });
        }
      }
    }
    setParsedUsers(parsed);
  };

  const handleBulkImportSubmit = () => {
    if (parsedUsers.length === 0) {
      toast.add({ title: "Укажите хотя бы одного пользователя для импорта", type: "error" });
      return;
    }

    startTransition(async () => {
      const res = await createBulkUsersAction(parsedUsers);
      if (res.success) {
        setIsCreateUserOpen(false);
        setBulkText("");
        setParsedUsers([]);
        toast.add({ title: `Успешно импортировано пользователей: ${res.count}`, type: "success" });
        router.refresh();
      } else {
        toast.add({ title: res.error || "Ошибка массового импорта", type: "error" });
      }
    });
  };

  // Academic Year State
  const [isCreateYearOpen, setIsCreateYearOpen] = useState(false);
  const [newYearName, setNewYearName] = useState("");
  const [newYearStart, setNewYearStart] = useState("");
  const [newYearEnd, setNewYearEnd] = useState("");

  const [editYearTarget, setEditYearTarget] = useState<AcademicYearDTO | null>(null);
  const [editYearName, setEditYearName] = useState("");
  const [editYearStart, setEditYearStart] = useState("");
  const [editYearEnd, setEditYearEnd] = useState("");

  const [deleteYearTarget, setDeleteYearTarget] = useState<AcademicYearDTO | null>(null);

  // System Config State
  const [instName, setInstName] = useState(systemConfig?.institutionName || "");
  const [instEmail, setInstEmail] = useState(systemConfig?.supportEmail || "");
  const [instPhone, setInstPhone] = useState(systemConfig?.supportPhone || "");
  const [instAddress, setInstAddress] = useState(systemConfig?.address || "");

  const [defScore, setDefScore] = useState(systemConfig?.defaultMaxScore || "100");
  const [lessonDuration, setLessonDuration] = useState(systemConfig?.lessonDurationMinutes || "45");
  const [allowLate, setAllowLate] = useState(systemConfig?.allowLateSubmissions ?? true);
  const [allowSelfReg, setAllowSelfReg] = useState(systemConfig?.allowSelfRegistration ?? true);

  const [noticeTitle, setNoticeTitle] = useState(systemConfig?.globalNoticeTitle || "");
  const [noticeContent, setNoticeContent] = useState(systemConfig?.globalNoticeContent || "");
  const [showNotice, setShowNotice] = useState(systemConfig?.showGlobalNotice ?? false);

  // Profile Handlers
  const handleUpdateProfile = () => {
    if (!profileName.trim()) {
      toast.add({ title: "Укажите имя и фамилию", type: "error" });
      return;
    }
    startTransition(async () => {
      const res = await updateProfileAction({ name: profileName, phone: profilePhone, avatar: profileAvatar });
      if (res.success) {
        toast.add({ title: "Профиль обновлён", type: "success" });
        router.refresh();
      } else {
        toast.add({ title: res.error || "Ошибка обновления профиля", type: "error" });
      }
    });
  };

  const handleChangePassword = () => {
    if (!currentPwd || !newPwd) {
      toast.add({ title: "Заполните поля паролей", type: "error" });
      return;
    }
    if (newPwd !== confirmPwd) {
      toast.add({ title: "Пароли не совпадают", type: "error" });
      return;
    }
    if (newPwd.length < 6) {
      toast.add({ title: "Минимальная длина пароля — 6 символов", type: "error" });
      return;
    }
    startTransition(async () => {
      const res = await changePasswordAction({ currentPassword: currentPwd, newPassword: newPwd });
      if (res.success) {
        toast.add({ title: "Пароль успешно изменён", type: "success" });
        setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
      } else {
        toast.add({ title: res.error || "Ошибка смены пароля", type: "error" });
      }
    });
  };

  // User Handlers
  const handleToggleUser = (userId: string, targetActiveState: boolean) => {
    startTransition(async () => {
      const res = await toggleUserActiveAction(userId, targetActiveState);
      if (res.success) {
        toast.add({
          title: targetActiveState ? "Пользователь активирован" : "Пользователь заблокирован",
          type: "success",
        });
        router.refresh();
      } else {
        toast.add({ title: res.error || "Ошибка изменения статуса", type: "error" });
      }
    });
  };

  const handleChangeRole = (userId: string, newRole: "ADMIN" | "TEACHER" | "STUDENT") => {
    startTransition(async () => {
      const res = await changeUserRoleAction(userId, newRole);
      if (res.success) {
        toast.add({ title: "Роль пользователя обновлена", type: "success" });
        router.refresh();
      } else {
        toast.add({ title: res.error || "Ошибка смены роли", type: "error" });
      }
    });
  };

  const handleCreateUser = () => {
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword) {
      toast.add({ title: "Заполните обязательные поля", type: "error" });
      return;
    }
    startTransition(async () => {
      const res = await createUserAction({
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole,
        phone: newUserPhone,
      });
      if (res.success) {
        setIsCreateUserOpen(false);
        setNewUserName(""); setNewUserEmail(""); setNewUserPassword(""); setNewUserPhone("");
        toast.add({ title: "Пользователь успешно создан", type: "success" });
        router.refresh();
      } else {
        toast.add({ title: res.error || "Ошибка создания пользователя", type: "error" });
      }
    });
  };

  // Academic Year Handlers
  const handleSetCurrentYear = (yearId: string) => {
    startTransition(async () => {
      const res = await setCurrentAcademicYearAction(yearId);
      if (res.success) {
        toast.add({ title: "Текущий учебный год изменён", type: "success" });
        router.refresh();
      } else {
        toast.add({ title: res.error || "Ошибка", type: "error" });
      }
    });
  };

  const handleCreateYear = () => {
    if (!newYearName.trim() || !newYearStart || !newYearEnd) {
      toast.add({ title: "Укажите название и даты учебного года", type: "error" });
      return;
    }
    startTransition(async () => {
      const res = await createAcademicYearAction({ name: newYearName, startDate: newYearStart, endDate: newYearEnd });
      if (res.success) {
        setIsCreateYearOpen(false);
        setNewYearName(""); setNewYearStart(""); setNewYearEnd("");
        toast.add({ title: "Учебный год создан", type: "success" });
        router.refresh();
      } else {
        toast.add({ title: res.error || "Ошибка", type: "error" });
      }
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
      toast.add({ title: "Заполните все поля", type: "error" });
      return;
    }
    startTransition(async () => {
      const res = await updateAcademicYearAction(editYearTarget.id, {
        name: editYearName,
        startDate: editYearStart,
        endDate: editYearEnd,
      });
      if (res.success) {
        setEditYearTarget(null);
        toast.add({ title: "Учебный год обновлён", type: "success" });
        router.refresh();
      } else {
        toast.add({ title: res.error || "Ошибка", type: "error" });
      }
    });
  };

  const handleDeleteYear = () => {
    if (!deleteYearTarget) return;
    startTransition(async () => {
      const res = await deleteAcademicYearAction(deleteYearTarget.id);
      if (res.success) {
        setDeleteYearTarget(null);
        toast.add({ title: "Учебный год удалён", type: "success" });
        router.refresh();
      } else {
        toast.add({ title: res.error || "Ошибка", type: "error" });
      }
    });
  };

  // Instant Toggle Handler for System Switches
  const handleToggleSystemSwitch = (key: keyof SystemConfigDTO, val: boolean, labelMsg: string) => {
    if (key === "allowLateSubmissions") setAllowLate(val);
    if (key === "allowSelfRegistration") setAllowSelfReg(val);
    if (key === "showGlobalNotice") setShowNotice(val);

    startTransition(async () => {
      const res = await updateSystemConfigAction({ [key]: val });
      if (res.success) {
        toast.add({ title: labelMsg, type: "success" });
        router.refresh();
      } else {
        toast.add({ title: res.error || "Ошибка сохранения", type: "error" });
      }
    });
  };

  // Save Text Fields Handler for System Settings
  const handleSaveSystemFields = () => {
    startTransition(async () => {
      const res = await updateSystemConfigAction({
        institutionName: instName,
        supportEmail: instEmail,
        supportPhone: instPhone,
        address: instAddress,
        defaultMaxScore: defScore,
        lessonDurationMinutes: lessonDuration,
        globalNoticeTitle: noticeTitle,
        globalNoticeContent: noticeContent,
      });
      if (res.success) {
        toast.add({ title: "Настройки системы сохранены", type: "success" });
        router.refresh();
      } else {
        toast.add({ title: res.error || "Ошибка сохранения", type: "error" });
      }
    });
  };

  const [userRoleFilter, setUserRoleFilter] = useState<"STAFF" | "TEACHER" | "ADMIN">("STAFF");

  const filteredUsers = allUsers.filter((u) => {
    if (u.role !== "TEACHER" && u.role !== "ADMIN") return false;

    const matchesSearch =
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase());

    if (!matchesSearch) return false;

    if (userRoleFilter === "TEACHER") return u.role === "TEACHER";
    if (userRoleFilter === "ADMIN") return u.role === "ADMIN";

    return true;
  });

  const TABS: { key: Tab; label: string; icon: React.ReactNode; adminOnly?: boolean }[] = [
    { key: "system" as Tab, label: "Настройки системы", icon: <Globe className="h-3.5 w-3.5" />, adminOnly: true },
    { key: "users" as Tab, label: "Сотрудники и доступы", icon: <Users className="h-3.5 w-3.5" />, adminOnly: true },
    { key: "academic" as Tab, label: "Учебные годы", icon: <CalendarDays className="h-3.5 w-3.5" />, adminOnly: true },
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
            <Settings className="h-4 w-4 text-primary" /> Настройки LMS
          </h1>
        </div>
        <Badge variant="outline" className={`text-[10px] font-semibold border ${ROLE_COLORS[profile.role] || ""}`}>
          {ROLE_LABELS[profile.role] || profile.role}
        </Badge>
      </div>

      {/* Navigation Tabs */}
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
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: System Settings (Admin Only) */}
      {activeTab === "system" && isAdmin && (
        <div className="space-y-3">
          {/* Instant Switches Card */}
          <div className="bg-card border rounded-xl p-4 space-y-3 shadow-xs">
            <h2 className="font-bold text-foreground flex items-center gap-2 pb-2 border-b">
              <Sliders className="h-4 w-4 text-primary" /> Быстрые переключатели системы
            </h2>

            <div className="space-y-2">
              <div className="p-3 border rounded-lg bg-muted/20 flex items-center justify-between gap-3">
                <label htmlFor="allow-self-reg" className="space-y-0.5 cursor-pointer flex-1">
                  <div className="font-semibold text-foreground text-xs">Самостоятельная регистрация студентов</div>
                  <div className="text-[11px] text-muted-foreground">
                    Разрешить новым студентам самостоятельно регистрироваться на странице входа (/register)
                  </div>
                </label>
                <Switch
                  id="allow-self-reg"
                  checked={allowSelfReg}
                  disabled={isPending}
                  onCheckedChange={(checked) =>
                    handleToggleSystemSwitch("allowSelfRegistration", checked, checked ? "Самостоятельная регистрация включена" : "Самостоятельная регистрация отключена")
                  }
                />
              </div>

              <div className="p-3 border rounded-lg bg-muted/20 flex items-center justify-between gap-3">
                <label htmlFor="allow-late" className="space-y-0.5 cursor-pointer flex-1">
                  <div className="font-semibold text-foreground text-xs">Приём домашних заданий после дедлайна</div>
                  <div className="text-[11px] text-muted-foreground">
                    Разрешить студентам отправлять решения позже срока (с пометкой «Сдано с опозданием»)
                  </div>
                </label>
                <Switch
                  id="allow-late"
                  checked={allowLate}
                  disabled={isPending}
                  onCheckedChange={(checked) =>
                    handleToggleSystemSwitch("allowLateSubmissions", checked, checked ? "Приём после дедлайна разрешён" : "Приём после дедлайна запрещён")
                  }
                />
              </div>

              <div className="p-3 border rounded-lg bg-muted/20 flex items-center justify-between gap-3">
                <label htmlFor="show-notice" className="space-y-0.5 cursor-pointer flex-1">
                  <div className="font-semibold text-foreground text-xs">Системный баннер объявления</div>
                  <div className="text-[11px] text-muted-foreground">
                    Отображать сквозное важное сообщение для всех студентов и преподавателей
                  </div>
                </label>
                <Switch
                  id="show-notice"
                  checked={showNotice}
                  disabled={isPending}
                  onCheckedChange={(checked) =>
                    handleToggleSystemSwitch("showGlobalNotice", checked, checked ? "Системный баннер включён" : "Системный баннер отключён")
                  }
                />
              </div>
            </div>
          </div>

          {/* System Parameters & Banner Text Card */}
          <div className="bg-card border rounded-xl p-4 space-y-3 shadow-xs">
            <h2 className="font-bold text-foreground flex items-center gap-2 pb-2 border-b">
              <Globe className="h-4 w-4 text-primary" /> Параметры заведения и системного баннера
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-medium text-foreground text-xs">Название учебного заведения *</label>
                <Input value={instName} onChange={(e) => setInstName(e.target.value)} placeholder="Лицей №15" className="h-8 text-xs bg-background" />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-foreground text-xs">Email техподдержки</label>
                <Input value={instEmail} onChange={(e) => setInstEmail(e.target.value)} placeholder="support@lyceum.ru" className="h-8 text-xs bg-background font-mono" />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-foreground text-xs">Телефон связи</label>
                <Input value={instPhone} onChange={(e) => setInstPhone(e.target.value)} placeholder="+996 (312) 00-00-00" className="h-8 text-xs bg-background" />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-foreground text-xs">Физический адрес</label>
                <Input value={instAddress} onChange={(e) => setInstAddress(e.target.value)} placeholder="г. Бишкек, ул..." className="h-8 text-xs bg-background" />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-foreground text-xs">Макс. балл за ДЗ по умолчанию</label>
                <Input type="number" value={defScore} onChange={(e) => setDefScore(e.target.value)} className="h-8 text-xs bg-background" />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-foreground text-xs">Длительность урока (минут)</label>
                <Input type="number" value={lessonDuration} onChange={(e) => setLessonDuration(e.target.value)} className="h-8 text-xs bg-background" />
              </div>
            </div>

            {/* Global Notice Text */}
            <div className="pt-2 border-t space-y-2">
              <h3 className="font-bold text-foreground text-xs flex items-center gap-1.5">
                <Megaphone className="h-3.5 w-3.5 text-primary" /> Текст системного объявления
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Input
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  placeholder="Заголовок баннера..."
                  className="h-8 text-xs bg-background font-semibold"
                />
                <Input
                  value={noticeContent}
                  onChange={(e) => setNoticeContent(e.target.value)}
                  placeholder="Подробный текст баннера..."
                  className="h-8 text-xs bg-background"
                />
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
            </div>

            <Button size="xs" disabled={isPending} onClick={handleSaveSystemFields} className="w-full h-8 font-medium">
              Сохранить параметры системы
            </Button>
          </div>
        </div>
      )}

      {/* Tab: Users Management (Admin Only) */}
      {activeTab === "users" && isAdmin && (
        <div className="space-y-3">
          <div className="p-3 border rounded-xl bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <UserCheck className="h-4 w-4 text-primary" /> Сотрудники и преподаватели лицея
              </div>
              <p className="text-[11px] text-muted-foreground">
                Управление аккаунтами педагогов и администраторов. Зачисление студентов производится в разделе{" "}
                <Link href="/dashboard/students/new" className="text-primary font-semibold hover:underline">
                  Зачисление студентов
                </Link>
                .
              </p>
            </div>
            <Button size="xs" className="h-8 gap-1.5 font-medium shrink-0" onClick={() => setIsCreateUserOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> Добавить преподавателя / сотрудника
            </Button>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Поиск по имени или email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="h-8 text-xs bg-card pl-8"
              />
            </div>

            {/* Role Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-card border rounded-lg shadow-2xs overflow-x-auto text-xs">
              <button
                type="button"
                onClick={() => setUserRoleFilter("STAFF")}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                  userRoleFilter === "STAFF"
                    ? "bg-primary text-primary-foreground shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                }`}
              >
                Все сотрудники ({allUsers.filter((u) => u.role === "TEACHER" || u.role === "ADMIN").length})
              </button>
              <button
                type="button"
                onClick={() => setUserRoleFilter("TEACHER")}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                  userRoleFilter === "TEACHER"
                    ? "bg-primary text-primary-foreground shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                }`}
              >
                Преподаватели ({allUsers.filter((u) => u.role === "TEACHER").length})
              </button>
              <button
                type="button"
                onClick={() => setUserRoleFilter("ADMIN")}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                  userRoleFilter === "ADMIN"
                    ? "bg-primary text-primary-foreground shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                }`}
              >
                Администраторы ({allUsers.filter((u) => u.role === "ADMIN").length})
              </button>
            </div>
          </div>

          <div className="bg-card border rounded-xl overflow-hidden shadow-xs">
            <div className="p-3.5 border-b flex items-center justify-between">
              <h2 className="font-bold text-foreground flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                {userRoleFilter === "STAFF" && "Все сотрудники и преподаватели"}
                {userRoleFilter === "TEACHER" && "Преподавательский состав"}
                {userRoleFilter === "ADMIN" && "Администраторы системы"}
              </h2>
              <span className="text-[11px] text-muted-foreground font-medium">{filteredUsers.length} чел.</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/30 text-muted-foreground">
                    <th className="text-left py-2 px-3.5 font-medium">Имя</th>
                    <th className="text-left py-2 px-2 font-medium">Email</th>
                    <th className="text-center py-2 px-2 font-medium">Роль</th>
                    <th className="text-center py-2 px-2 font-medium">Статус аккаунта</th>
                    <th className="text-right py-2 px-3.5 font-medium">Активен (Switch)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="py-2.5 px-3.5 font-medium text-foreground">{u.name}</td>
                      <td className="py-2.5 px-2 text-muted-foreground font-mono text-[10px]">{u.email}</td>
                      <td className="py-2.5 px-2 text-center">
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
                            </SelectContent>
                          </Select>
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <Badge variant="outline" className={`text-[9px] border-0 ${u.isActive ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                          {u.isActive ? "Активен" : "Заблокирован"}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3.5 text-right">
                        {u.id !== profile.id && (
                          <div className="flex items-center justify-end">
                            <Switch
                              checked={u.isActive}
                              disabled={isPending}
                              onCheckedChange={(checked) => handleToggleUser(u.id, checked)}
                              title={u.isActive ? "Заблокировать" : "Активировать"}
                            />
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-muted-foreground italic">
                        Пользователи не найдены
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Academic Years (Admin Only) */}
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

      {/* Modal: Create User / Bulk Import */}
      <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
        <DialogContent className="p-4 gap-3 text-xs sm:max-w-[650px]">
          <DialogHeader className="pb-2 border-b gap-1.5 place-items-start text-left">
            <DialogTitle className="flex items-center gap-2 text-sm font-bold">
              <UserCheck className="h-4 w-4 text-primary" /> Регистрация преподавателя или сотрудника
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Добавление преподавательского состава и администраторов системы
            </DialogDescription>

            {/* Mode Switcher Pills */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-muted/60 rounded-lg border text-xs w-full mt-1">
              <button
                type="button"
                onClick={() => setCreateUserMode("single")}
                className={`py-1.5 px-3 rounded-md text-xs font-medium transition-all ${
                  createUserMode === "single"
                    ? "bg-background text-foreground shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Анкета одного сотрудника
              </button>
              <button
                type="button"
                onClick={() => setCreateUserMode("excel")}
                className={`py-1.5 px-3 rounded-md text-xs font-medium transition-all ${
                  createUserMode === "excel"
                    ? "bg-background text-primary shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Массовый импорт (Excel / CSV)
              </button>
            </div>
          </DialogHeader>

          {/* Mode 1: Single User Form */}
          {createUserMode === "single" && (
            <div className="space-y-3 py-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-medium text-xs text-foreground font-semibold">ФИО сотрудника полностью *</label>
                  <Input
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="Петров Алексей Сергеевич"
                    className="h-8 text-xs bg-background font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-xs text-foreground font-semibold">Email *</label>
                  <Input
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="teacher@lyceum.ru"
                    className="h-8 text-xs bg-background font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-xs text-foreground font-semibold">Роль в лицее *</label>
                  <Select value={newUserRole} onValueChange={(v) => setNewUserRole(v as any)}>
                    <SelectTrigger className="h-8 text-xs bg-background font-medium">
                      <SelectValue>{ROLE_LABELS[newUserRole]}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TEACHER" className="text-xs font-medium">Преподаватель</SelectItem>
                      <SelectItem value="ADMIN" className="text-xs font-medium">Администратор</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-medium text-xs text-foreground">Пароль *</label>
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="text-[10px] text-primary hover:underline font-medium"
                    >
                      Сгенерировать
                    </button>
                  </div>
                  <Input
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder="Минимум 6 символов"
                    className="h-8 text-xs bg-background font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-xs text-foreground">Телефон</label>
                  <Input
                    value={newUserPhone}
                    onChange={(e) => setNewUserPhone(e.target.value)}
                    placeholder="+996 (555) 00-00-00"
                    className="h-8 text-xs bg-background"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Mode 2: Bulk Import (Excel / CSV) */}
          {createUserMode === "excel" && (
            <div className="space-y-3 py-1">
              {/* Template Download & Instruction Card */}
              <div className="p-3 rounded-xl border bg-muted/20 space-y-2 text-xs">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="space-y-0.5">
                    <div className="font-semibold text-foreground flex items-center gap-1.5">
                      <FileSpreadsheet className="h-4 w-4 text-primary" /> Файл шаблона для импорта
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Заполните таблицу сотрудников (Столбцы: ФИО, Email, Роль: TEACHER/ADMIN, Телефон)
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={handleDownloadTemplate}
                    className="h-8 text-xs gap-1.5 text-primary border-primary/30 hover:bg-primary/10 font-medium px-3 shrink-0"
                  >
                    <Download className="h-3.5 w-3.5" /> Скачать шаблон (.csv)
                  </Button>
                </div>
              </div>

              {/* Drag & Drop File Upload Area */}
              <div className="space-y-1">
                <label className="font-semibold text-xs text-foreground">Загрузить готовый файл</label>
                <label className="border-2 border-dashed border-border rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all bg-card text-center relative">
                  <input
                    type="file"
                    accept=".csv,.txt,.tsv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Upload className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-foreground">
                      {uploadedFileName ? (
                        <span className="text-primary font-bold flex items-center gap-1">
                          <FileSpreadsheet className="h-3.5 w-3.5" /> {uploadedFileName}
                        </span>
                      ) : (
                        "Выберите или перетащите файл (.csv, .xlsx, .txt)"
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground pt-0.5">
                      {uploadedFileName ? "Файл выбран и готов к обработке" : "Нажмите для выбора сохраненного файла с компьютера"}
                    </div>
                  </div>
                </label>
              </div>

              {/* Parsed Preview Table */}
              {parsedUsers.length > 0 ? (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-foreground flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-primary" /> Распознано пользователей: {parsedUsers.length}
                    </span>
                    <Badge variant="outline" className="text-[9px] border-primary/30 text-primary bg-primary/5 font-semibold">
                      Готовы к импорту
                    </Badge>
                  </div>

                  <div className="max-h-[160px] overflow-y-auto border rounded-lg bg-card divide-y text-xs">
                    {parsedUsers.map((u, idx) => (
                      <div key={idx} className="p-2 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-medium text-foreground truncate">{u.name}</div>
                          <div className="text-[10px] text-muted-foreground font-mono truncate">{u.email} {u.phone && `• ${u.phone}`}</div>
                        </div>
                        <Badge variant="outline" className={`text-[9px] border shrink-0 ${ROLE_COLORS[u.role] || ""}`}>
                          {ROLE_LABELS[u.role] || u.role}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-lg border border-dashed bg-muted/10 text-center text-muted-foreground text-[11px]">
                  Выберите файл шаблона выше. Список распознанных пользователей появится здесь.
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
            <Button variant="outline" size="xs" onClick={() => setIsCreateUserOpen(false)}>
              Отмена
            </Button>
            {createUserMode === "single" ? (
              <Button size="xs" disabled={isPending} onClick={handleCreateUser}>
                Создать пользователя
              </Button>
            ) : (
              <Button
                size="xs"
                disabled={isPending || parsedUsers.length === 0}
                onClick={handleBulkImportSubmit}
              >
                Импортировать ({parsedUsers.length})
              </Button>
            )}
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
