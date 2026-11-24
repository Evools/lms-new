"use client";

import React, { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import {
  User,
  Lock,
  ChevronRight,
  Shield,
  GraduationCap,
  Award,
  Eye,
  EyeOff,
  BookOpen,
  ClipboardList,
  CalendarCheck,
  Building2,
  Mail,
  Phone,
  Calendar,
  Sparkles,
  Hash,
  Link2,
  Unlink,
  CheckCircle2,
} from "lucide-react";
import type { UserProfileDetailsDTO } from "../actions";
import {
  updateProfileDetailsAction,
  updateProfilePasswordAction,
  startGoogleLinkAction,
  unlinkGoogleAction,
} from "../actions";

interface ProfileViewProps {
  profile: UserProfileDetailsDTO;
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Администратор",
  ADMINISTRATION: "Администрация лицея",
  TEACHER: "Преподаватель",
  STUDENT: "Студент",
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950 dark:text-rose-400 dark:border-rose-800",
  ADMINISTRATION: "bg-primary/10 text-primary border-primary/20",
  TEACHER: "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800",
  STUDENT: "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800",
};

function GoogleIcon({ className = "h-3.5 w-3.5 shrink-0" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export function ProfileView({ profile }: ProfileViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Profile Form State
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone || "");
  const [avatar, setAvatar] = useState(profile.avatar || "");

  // Password Form State
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  const isStudent = profile.role === "STUDENT";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const linked = params.get("googleLinked");
    const googleErr = params.get("googleError");
    if (linked === "1") {
      toast.add({ title: "Google-аккаунт успешно привязан", type: "success" });
      router.replace("/dashboard/profile");
    } else if (googleErr === "already_linked") {
      toast.add({ title: "Этот Google-аккаунт уже привязан к другому пользователю", type: "error" });
      router.replace("/dashboard/profile");
    }
  }, [router]);

  const handleUnlinkGoogle = () => {
    startTransition(async () => {
      const res = await unlinkGoogleAction();
      if (res.success) {
        toast.add({ title: "Google-аккаунт отвязан", type: "success" });
        router.refresh();
      } else {
        toast.add({ title: res.error || "Ошибка отвязки Google-аккаунта", type: "error" });
      }
    });
  };

  const handleUpdateProfile = () => {
    if (!isStudent && !name.trim()) {
      toast.add({ title: "Укажите имя и фамилию", type: "error" });
      return;
    }
    if (!email.trim()) {
      toast.add({ title: "Укажите email адрес", type: "error" });
      return;
    }

    startTransition(async () => {
      const res = await updateProfileDetailsAction({
        name: isStudent ? undefined : name,
        email,
        phone,
        avatar,
      });
      if (res.success) {
        toast.add({ title: "Данные профиля обновлены", type: "success" });
        router.refresh();
      } else {
        toast.add({ title: res.error || "Ошибка обновления профиля", type: "error" });
      }
    });
  };

  const handleChangePassword = () => {
    if (!currentPwd || !newPwd) {
      toast.add({ title: "Заполните все поля пароля", type: "error" });
      return;
    }
    if (newPwd !== confirmPwd) {
      toast.add({ title: "Новый пароль и подтверждение не совпадают", type: "error" });
      return;
    }
    if (newPwd.length < 6) {
      toast.add({ title: "Пароль должен содержать не менее 6 символов", type: "error" });
      return;
    }
    startTransition(async () => {
      const res = await updateProfilePasswordAction({ currentPassword: currentPwd, newPassword: newPwd });
      if (res.success) {
        toast.add({ title: "Пароль успешно изменён", type: "success" });
        setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
      } else {
        toast.add({ title: res.error || "Ошибка смены пароля", type: "error" });
      }
    });
  };

  return (
    <div className="space-y-3 w-full text-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-3.5 rounded-xl border shadow-xs">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span>Лицей LMS</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-semibold">Мой профиль</span>
          </div>
          <h1 className="text-sm font-bold text-foreground flex items-center gap-2">
            <User className="h-4 w-4 text-primary" /> Мой профиль
          </h1>
        </div>
        <Badge variant="outline" className={`text-[10px] font-semibold border ${ROLE_COLORS[profile.role] || ""}`}>
          {ROLE_LABELS[profile.role] || profile.role}
        </Badge>
      </div>

      {/* Profile Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {profile.role === "STUDENT" ? (
          <>
            <div className="bg-card border rounded-xl p-3 space-y-1 shadow-xs">
              <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5 text-primary" /> Моя группа
              </div>
              <div className="text-sm font-bold text-foreground truncate">
                {profile.groupName || "Не назначена"}
              </div>
            </div>
            <div className="bg-card border rounded-xl p-3 space-y-1 shadow-xs">
              <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Hash className="h-3.5 w-3.5 text-primary" /> Поименный № (П/Н)
              </div>
              <div className="text-sm font-bold text-foreground font-mono">
                {profile.rollNumber || "—"}
              </div>
            </div>
            <div className="bg-card border rounded-xl p-3 space-y-1 shadow-xs">
              <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                <ClipboardList className="h-3.5 w-3.5 text-primary" /> Сдано ДЗ
              </div>
              <div className="text-sm font-bold text-primary">
                {profile.submittedAssignmentsCount ?? 0} работ
              </div>
            </div>
            <div className="bg-card border rounded-xl p-3 space-y-1 shadow-xs">
              <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                <CalendarCheck className="h-3.5 w-3.5 text-primary" /> Посещаемость
              </div>
              <div className="text-sm font-bold text-primary">
                {profile.attendancePercent ?? 100}%
              </div>
            </div>
            <div className="bg-card border rounded-xl p-3 space-y-1 shadow-xs col-span-2 sm:col-span-1">
              <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-primary" /> Зарегистрирован
              </div>
              <div className="text-sm font-bold text-foreground">
                {new Date(profile.createdAt).toLocaleDateString("ru-RU")}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="bg-card border rounded-xl p-3 space-y-1 shadow-xs">
              <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5 text-primary" /> Материалов
              </div>
              <div className="text-sm font-bold text-primary">
                {profile.createdMaterialsCount ?? 0}
              </div>
            </div>
            <div className="bg-card border rounded-xl p-3 space-y-1 shadow-xs">
              <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                <ClipboardList className="h-3.5 w-3.5 text-primary" /> Создано ДЗ
              </div>
              <div className="text-sm font-bold text-primary">
                {profile.createdAssignmentsCount ?? 0}
              </div>
            </div>
            <div className="bg-card border rounded-xl p-3 space-y-1 shadow-xs">
              <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Shield className="h-3.5 w-3.5 text-primary" /> Системная роль
              </div>
              <div className="text-sm font-bold text-foreground">
                {ROLE_LABELS[profile.role]}
              </div>
            </div>
            <div className="bg-card border rounded-xl p-3 space-y-1 shadow-xs">
              <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-primary" /> Регистрация
              </div>
              <div className="text-sm font-bold text-foreground">
                {new Date(profile.createdAt).toLocaleDateString("ru-RU")}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Grid: Details & Password */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Profile Details Card */}
        <div className="bg-card border rounded-xl p-4 space-y-3 shadow-xs">
          <h2 className="font-bold text-foreground flex items-center gap-2 pb-2 border-b">
            <User className="h-4 w-4 text-primary" /> Личные данные
          </h2>

          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-full border-2 border-primary/30 bg-muted flex items-center justify-center overflow-hidden shrink-0">
              {avatar ? (
                <img src={avatar} alt="avatar" className="h-full w-full object-cover" />
              ) : (
                <span className="text-lg font-bold text-muted-foreground">
                  {profile.name.slice(0, 1).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-foreground text-sm truncate">{profile.name}</div>
              <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                <Mail className="h-3 w-3" /> {email}
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            {/* Full Name Field */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-medium text-foreground text-xs">
                  Имя и фамилия {isStudent ? "" : "*"}
                </label>
                {isStudent && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Lock className="h-3 w-3" /> Фиксируется администрацией
                  </span>
                )}
              </div>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isStudent}
                placeholder="Иванов Иван"
                className={`h-8 text-xs ${
                  isStudent ? "bg-muted/50 text-muted-foreground cursor-not-allowed opacity-80" : "bg-background"
                }`}
              />
            </div>

            {/* Email Field */}
            <div className="space-y-1">
              <label className="font-medium text-foreground text-xs">Email для входа и уведомлений *</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.com"
                className="h-8 text-xs bg-background"
              />
            </div>

            {/* Phone Field */}
            <div className="space-y-1">
              <label className="font-medium text-foreground text-xs">Телефон связи</label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+996 (555) 00-00-00"
                className="h-8 text-xs bg-background"
              />
            </div>

            {/* Avatar URL Field */}
            <div className="space-y-1">
              <label className="font-medium text-foreground text-xs">Ссылка на аватар (URL)</label>
              <Input
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="https://..."
                className="h-8 text-xs bg-background font-mono"
              />
            </div>
          </div>

          <Button
            size="xs"
            disabled={isPending}
            onClick={handleUpdateProfile}
            className="w-full h-8 font-medium mt-1 cursor-pointer"
          >
            {isPending ? "Сохранение..." : "Сохранить данные"}
          </Button>
        </div>

        {/* Change Password Card */}
        <div className="bg-card border rounded-xl p-4 space-y-3 shadow-xs">
          <h2 className="font-bold text-foreground flex items-center gap-2 pb-2 border-b">
            <Lock className="h-4 w-4 text-primary" /> Безопасность & Смена пароля
          </h2>

          <div className="space-y-2.5">
            <div className="space-y-1">
              <label className="font-medium text-foreground text-xs">Текущий пароль *</label>
              <div className="relative">
                <Input
                  type={showPwd ? "text" : "password"}
                  value={currentPwd}
                  onChange={(e) => setCurrentPwd(e.target.value)}
                  placeholder="••••••••"
                  className="h-8 text-xs bg-background pr-8"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
                >
                  {showPwd ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground text-xs">Новый пароль *</label>
              <Input
                type={showPwd ? "text" : "password"}
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                placeholder="Минимум 6 символов"
                className="h-8 text-xs bg-background"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground text-xs">Подтвердите новый пароль *</label>
              <Input
                type={showPwd ? "text" : "password"}
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
                placeholder="Повторите новый пароль"
                className={`h-8 text-xs bg-background ${
                  confirmPwd && confirmPwd !== newPwd ? "border-destructive" : ""
                }`}
              />
            </div>
          </div>

          <Button
            size="xs"
            disabled={isPending}
            onClick={handleChangePassword}
            className="w-full h-8 font-medium mt-1"
          >
            Изменить пароль
          </Button>

          {/* Google Account Linking */}
          <div className="pt-3 mt-1 border-t space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 font-medium text-foreground text-xs">
                <Link2 className="h-3.5 w-3.5 text-primary" />
                <span>Вход через Google</span>
              </div>
              {profile.googleEmail && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 h-5 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 gap-1"
                >
                  <CheckCircle2 className="h-3 w-3" /> Привязан
                </Badge>
              )}
            </div>

            {profile.googleEmail ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 rounded-lg border border-border bg-muted/30 px-2.5 py-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-background">
                    <GoogleIcon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-medium text-muted-foreground leading-none mb-0.5">
                      Google-аккаунт
                    </div>
                    <div className="text-xs font-medium text-foreground truncate">
                      {profile.googleEmail}
                    </div>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  disabled={isPending}
                  onClick={handleUnlinkGoogle}
                  className="w-full h-8 rounded-md font-medium gap-1.5 cursor-pointer hover:text-destructive hover:border-destructive/40 hover:bg-destructive/5 transition-colors"
                >
                  <Unlink className="h-3.5 w-3.5" />
                  Отвязать Google-аккаунт
                </Button>
              </div>
            ) : (
              <form action={startGoogleLinkAction} className="space-y-1.5">
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Привяжите Google-аккаунт, чтобы входить в систему в один клик без ввода пароля.
                </p>
                <Button
                  type="submit"
                  variant="outline"
                  size="xs"
                  disabled={isPending}
                  className="w-full h-8 rounded-md font-medium gap-2 cursor-pointer"
                >
                  <GoogleIcon className="h-3.5 w-3.5 shrink-0" />
                  Привязать Google-аккаунт
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
