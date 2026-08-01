"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  GraduationCap,
  Sparkles,
  Calendar,
  ShieldCheck,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Save,
  Edit,
} from "lucide-react";
import { StudentDetailDTO, updateStudentAction } from "../../../actions";

export interface DBGroupItem {
  id: string;
  name: string;
  course: number;
}

interface StudentEditFormProps {
  student: StudentDetailDTO;
  userRole: string;
  dbGroups?: DBGroupItem[];
}

export function StudentEditForm({ student, userRole, dbGroups = [] }: StudentEditFormProps) {
  const router = useRouter();

  const groupsList = dbGroups.length > 0
    ? dbGroups.map((g) => g.name)
    : ["ИС-1-25", "ИС-2-24", "ПО-1-25"];

  const [fullName, setFullName] = useState(student.name);
  const [email, setEmail] = useState(student.email);
  const [phone, setPhone] = useState(student.phone || "");
  const [selectedRole, setSelectedRole] = useState<"STUDENT" | "TEACHER" | "ADMIN">(student.role || "STUDENT");
  const [gender, setGender] = useState<"Мужской" | "Женский">("Мужской");
  const [group, setGroup] = useState(student.groupName || "ИС-1-25");
  const [enrollmentType, setEnrollmentType] = useState<"Бюджет" | "Контракт">(student.enrollmentType || "Бюджет");

  const [birthDate, setBirthDate] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [telegram, setTelegram] = useState("");
  const [address, setAddress] = useState("");
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const getInitials = (name: string) => {
    if (!name.trim()) return "СТ";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await updateStudentAction(student.id, {
        name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        role: selectedRole,
        groupName: group,
        enrollmentType: enrollmentType,
      });

      setIsSubmitting(false);

      if (!res.success) {
        setErrorMessage(res.error || "Ошибка при обновлении данных");
        return;
      }

      setSuccessMessage(true);
      setTimeout(() => {
        router.push("/dashboard/students");
      }, 1000);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message || "Ошибка соединения с сервером");
    }
  };

  return (
    <div className="w-full space-y-4 pb-20 text-xs">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b">
        <div>
          <Breadcrumb className="mb-1">
            <BreadcrumbList className="text-[10px]">
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">Главная</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard/students">Студенты</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-semibold">Редактирование</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold tracking-tight text-foreground flex items-center gap-2">
              <Edit className="h-4 w-4 text-primary" />
              Редактирование профиля студента
            </h1>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-medium">
              ID: {student.id.slice(0, 8)}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button size="xs" variant="outline" className="h-8 text-xs gap-1.5" render={<Link href="/dashboard/students" />}>
            <ArrowLeft className="h-3.5 w-3.5" /> Назад к списку
          </Button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
          <Button size="xs" variant="ghost" className="h-6 text-[10px]" onClick={() => setErrorMessage(null)}>
            Закрыть
          </Button>
        </div>
      )}

      {successMessage && (
        <div className="p-3 rounded-lg border border-primary/30 bg-primary/10 text-primary flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
            <span className="font-semibold">Изменения успешно сохранены в базе данных!</span>
          </div>
          <Button size="xs" variant="outline" className="h-6 text-[10px]" onClick={() => router.push("/dashboard/students")}>
            К списку
          </Button>
        </div>
      )}

      {/* Main Form Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-4">
          
          {/* Personal Info Card */}
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
              <span className="text-xs font-bold text-foreground flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-primary" /> Личные данные
              </span>
            </div>
            <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2 space-y-1">
                <label className="font-medium text-foreground text-xs">
                  ФИО студента <span className="text-destructive">*</span>
                </label>
                <Input
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground text-xs flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-muted-foreground" /> Дата рождения
                </label>
                <Input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground text-xs">Пол</label>
                <Select value={gender} onValueChange={(val: "Мужской" | "Женский") => setGender(val)}>
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue>{gender}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Мужской" className="text-xs">Мужской</SelectItem>
                    <SelectItem value="Женский" className="text-xs">Женский</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="font-medium text-foreground text-xs flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-muted-foreground" /> ПИН / Паспорт
                </label>
                <Input
                  placeholder="20105200501234"
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Contact Info Card */}
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
              <span className="text-xs font-bold text-foreground flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-primary" /> Контактные данные
              </span>
            </div>
            <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="font-medium text-foreground text-xs">
                  Email <span className="text-destructive">*</span>
                </label>
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground text-xs flex items-center gap-1">
                  <Phone className="h-3 w-3 text-muted-foreground" /> Телефон
                </label>
                <Input
                  type="tel"
                  placeholder="+996 555 12-34-56"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground text-xs">Telegram</label>
                <Input
                  placeholder="@username"
                  value={telegram}
                  onChange={(e) => setTelegram(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground text-xs flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-muted-foreground" /> Адрес
                </label>
                <Input
                  placeholder="г. Бишкек"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Academic Info Card */}
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
              <span className="text-xs font-bold text-foreground flex items-center gap-2">
                <GraduationCap className="h-3.5 w-3.5 text-primary" /> Академические данные
              </span>
            </div>
            <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="font-medium text-foreground text-xs">
                  Группа <span className="text-destructive">*</span>
                </label>
                <Select value={group} onValueChange={setGroup}>
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue>{group}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {groupsList.map((gName) => (
                      <SelectItem key={gName} value={gName} className="text-xs">
                        {gName}
                      </SelectItem>
                    ))}
                    <SelectItem value="Не распределен" className="text-xs">Не распределен</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground text-xs">Форма обучения</label>
                <Select value={enrollmentType} onValueChange={(val: "Бюджет" | "Контракт") => setEnrollmentType(val)}>
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue>{enrollmentType}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Бюджет" className="text-xs">Бюджетная основа</SelectItem>
                    <SelectItem value="Контракт" className="text-xs">Контрактная основа</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="font-medium text-foreground text-xs flex items-center gap-1.5 font-semibold">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Роль пользователя в системе <span className="text-destructive">*</span>
                </label>
                <Select value={selectedRole} onValueChange={(val: "STUDENT" | "TEACHER" | "ADMIN") => setSelectedRole(val)}>
                  <SelectTrigger className="h-8 text-xs bg-background font-medium">
                    <SelectValue>
                      {selectedRole === "STUDENT" ? "Студент" : selectedRole === "TEACHER" ? "Преподаватель" : "Администратор"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STUDENT" className="text-xs font-medium">Студент</SelectItem>
                    <SelectItem value="TEACHER" className="text-xs font-medium">Преподаватель</SelectItem>
                    <SelectItem value="ADMIN" className="text-xs font-medium">Администратор</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="xs"
              className="h-8 text-xs"
              onClick={() => router.push("/dashboard/students")}
              disabled={isSubmitting}
            >
              Отмена
            </Button>
            <Button size="xs" type="submit" disabled={isSubmitting || !fullName.trim()} className="h-8 text-xs gap-1.5">
              <Save className="h-3.5 w-3.5" /> {isSubmitting ? "Сохранение..." : "Сохранить изменения"}
            </Button>
          </div>
        </form>

        {/* Right Column: Profile Preview Widget */}
        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-3.5 space-y-3 text-xs sticky top-4">
            <div className="text-xs font-bold text-foreground border-b pb-2 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Карточка профиля
            </div>

            <div className="flex flex-col items-center text-center space-y-2 py-2">
              <Avatar className="h-14 w-14 border shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-base">
                  {getInitials(fullName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-bold text-xs text-foreground line-clamp-1">
                  {fullName.trim() || "Фамилия Имя Отчество"}
                </h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {email || "student@lyceum.edu"}
                </p>
              </div>

              <div className="flex items-center gap-1 pt-1">
                <Badge variant="default" className="text-[9px] px-1.5 py-0 font-medium">
                  {group}
                </Badge>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-medium">
                  {enrollmentType}
                </Badge>
              </div>
            </div>

            <div className="border-t pt-2 space-y-1.5 text-[10px]">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>ID:</span>
                <span className="font-mono text-foreground font-semibold">{student.id.slice(0, 8)}...</span>
              </div>
              {phone && (
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Телефон:</span>
                  <span className="font-medium text-foreground">{phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
