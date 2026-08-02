"use client";

import React, { useState, useTransition } from "react";
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
} from "lucide-react";
import type { UserProfileDetailsDTO } from "../actions";
import {
  updateProfileDetailsAction,
  updateProfilePasswordAction,
} from "../actions";

interface ProfileViewProps {
  profile: UserProfileDetailsDTO;
}

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

export function ProfileView({ profile }: ProfileViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Profile Form State
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone || "");
  const [avatar, setAvatar] = useState(profile.avatar || "");

  // Password Form State
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  const handleUpdateProfile = () => {
    if (!name.trim()) {
      toast.add({ title: "Укажите имя и фамилию", type: "error" });
      return;
    }
    startTransition(async () => {
      const res = await updateProfileDetailsAction({ name, phone, avatar });
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
            <div className="bg-card border rounded-xl p-3 space-y-1 shadow-xs">
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
                <Mail className="h-3 w-3" /> {profile.email}
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="space-y-1">
              <label className="font-medium text-foreground text-xs">Имя и фамилия *</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Иванов Иван"
                className="h-8 text-xs bg-background"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground text-xs">Телефон связи</label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+996 (555) 00-00-00"
                className="h-8 text-xs bg-background"
              />
            </div>

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
            className="w-full h-8 font-medium mt-1"
          >
            Сохранить данные
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
        </div>
      </div>
    </div>
  );
}
