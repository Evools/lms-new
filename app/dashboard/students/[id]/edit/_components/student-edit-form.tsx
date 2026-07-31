"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Building2,
  Calendar,
  ShieldCheck,
  FileText,
  HeartHandshake,
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
  const [gender, setGender] = useState<"Мужской" | "Женский">("Мужской");
  const [group, setGroup] = useState(student.groupName || "ИС-1-25");
  const [enrollmentType, setEnrollmentType] = useState<"Бюджет" | "Контракт">(student.enrollmentType || "Бюджет");

  const [birthDate, setBirthDate] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [telegram, setTelegram] = useState("");
  const [address, setAddress] = useState("");
  const [parentName, setParentName] = useState("");
  const [parentRelation, setParentRelation] = useState("Мать");
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
    <div className="space-y-6 pb-12">
      {/* Header & Breadcrumbs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <Breadcrumb className="mb-2">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">Панель</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard/students">Студенты</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Редактирование профиля</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Редактирование студента
            </h1>
            <Badge variant="secondary" className="gap-1 font-mono">
              ID: {student.id.slice(0, 8)}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" render={<Link href="/dashboard/students" />}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Назад к списку
          </Button>
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-semibold text-sm">Ошибка сохранения в БД</p>
              <p className="text-xs opacity-90">{errorMessage}</p>
            </div>
          </div>
          <Button size="xs" variant="ghost" onClick={() => setErrorMessage(null)}>
            Закрыть
          </Button>
        </div>
      )}

      {successMessage && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <div>
              <p className="font-semibold text-sm">Изменения успешно сохранены!</p>
              <p className="text-xs opacity-90">Данные студента в базе данных обновлены.</p>
            </div>
          </div>
          <Button size="xs" variant="outline" className="border-emerald-500/30 hover:bg-emerald-500/20" onClick={() => router.push("/dashboard/students")}>
            К списку студентов
          </Button>
        </div>
      )}

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form Column */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
          
          {/* Personal Info Card */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <User className="h-4 w-4 text-primary" /> Личные данные
              </CardTitle>
              <CardDescription className="text-xs">
                Редактирование ФИО, даты рождения и личных параметров
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-1.5">
                <Label className="text-xs font-medium text-foreground">
                  ФИО студента <span className="text-red-500">*</span>
                </Label>
                <Input
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" /> Дата рождения
                </Label>
                <Input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Пол</Label>
                <Select value={gender} onValueChange={(val: "Мужской" | "Женский") => setGender(val)}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Выберите пол" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Мужской">Мужской</SelectItem>
                    <SelectItem value="Женский">Женский</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" /> ПИН / ИИН / Номер паспорта
                </Label>
                <Input
                  placeholder="20105200501234"
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  className="h-9"
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Info Card */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" /> Контактные данные
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" /> Телефон студента
                </Label>
                <Input
                  type="tel"
                  placeholder="+996 555 12-34-56"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Telegram / WhatsApp</Label>
                <Input
                  placeholder="@username"
                  value={telegram}
                  onChange={(e) => setTelegram(e.target.value)}
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> Адрес проживания
                </Label>
                <Input
                  placeholder="г. Бишкек"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="h-9"
                />
              </div>
            </CardContent>
          </Card>

          {/* Academic & Enrollment Info Card */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" /> Академические данные
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">
                  Академическая группа <span className="text-red-500">*</span>
                </Label>
                <Select value={group} onValueChange={setGroup}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Выберите группу" />
                  </SelectTrigger>
                  <SelectContent>
                    {groupsList.map((gName) => (
                      <SelectItem key={gName} value={gName}>
                        {gName}
                      </SelectItem>
                    ))}
                    <SelectItem value="Не распределен">Не распределен (Резерв)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Форма обучения</Label>
                <Select value={enrollmentType} onValueChange={(val: "Бюджет" | "Контракт") => setEnrollmentType(val)}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Форма" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Бюджет">Бюджетная основа</SelectItem>
                    <SelectItem value="Контракт">Контрактная основа</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Parent / Guardian Card */}
          <Card className="shadow-sm border-dashed">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <HeartHandshake className="h-4 w-4 text-primary" /> Родители / Доверенное лицо
                </CardTitle>
                <Badge variant="outline" className="text-[10px] text-muted-foreground font-normal">
                  Необязательно
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">ФИО представителя</Label>
                <Input
                  placeholder="Иванова Ольга Петровна"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Телефон представителя</Label>
                <Input
                  type="tel"
                  placeholder="+996 700 98-76-54"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  className="h-9"
                />
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/students")}
              disabled={isSubmitting}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={isSubmitting || !fullName.trim()} className="gap-2">
              <Save className="h-4 w-4" /> {isSubmitting ? "Сохранение..." : "Сохранить изменения"}
            </Button>
          </div>
        </form>

        {/* Right Column: Profile Preview Widget */}
        <div className="space-y-6">
          <div className="sticky top-20 z-10">
            <Card className="shadow-md border-primary/20 bg-gradient-to-b from-card via-card to-primary/5">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Карточка профиля
                </CardTitle>
              </CardHeader>

              <CardContent className="pt-6 space-y-5">
                <div className="flex flex-col items-center text-center space-y-2">
                  <Avatar className="h-20 w-20 border-2 border-primary/30 shadow-inner">
                    <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                      {getInitials(fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-bold text-base text-foreground line-clamp-1">
                      {fullName.trim() || "Фамилия Имя Отчество"}
                    </h3>
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5 mt-0.5">
                      <Mail className="h-3 w-3" /> {email || "student@lyceum.edu"}
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-1.5 pt-1">
                    <Badge variant="default" className="text-[11px]">
                      {group}
                    </Badge>
                    <Badge variant="outline" className="text-[11px]">
                      {enrollmentType}
                    </Badge>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>ID в БД:</span>
                    <span className="font-mono text-foreground font-semibold">{student.id.slice(0, 10)}...</span>
                  </div>

                  {phone && (
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Телефон:</span>
                      <span className="font-medium text-foreground">{phone}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Пол:</span>
                    <span className="font-medium text-foreground">{gender}</span>
                  </div>

                  {parentName && (
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Представитель:</span>
                      <span className="font-medium text-foreground truncate max-w-[140px]">{parentName}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
