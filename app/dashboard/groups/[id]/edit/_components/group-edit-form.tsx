"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Users,
  ArrowLeft,
  GraduationCap,
  Sparkles,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  Edit,
  Save,
  BookOpen,
} from "lucide-react";
import { GroupDTO, updateGroupAction } from "../../../actions";

interface TeacherOption {
  id: string;
  name: string;
  email: string;
}

interface AcademicYearOption {
  id: string;
  name: string;
  isCurrent?: boolean;
}

interface GroupEditFormProps {
  group: GroupDTO;
  userRole: string;
  teachersList?: TeacherOption[];
  academicYearsList?: AcademicYearOption[];
}

export function GroupEditForm({
  group,
  userRole,
  teachersList = [],
  academicYearsList = [],
}: GroupEditFormProps) {
  const router = useRouter();

  const [groupName, setGroupName] = useState(group.name);
  const [course, setCourse] = useState(String(group.course || 1));
  const [specialty, setSpecialty] = useState(group.specialty || "Информационные системы и программирование");
  const [curatorId, setCuratorId] = useState<string>(group.curatorId || "unassigned");
  const [academicYear, setAcademicYear] = useState(group.academicYear || "2025-2026");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedCurator = teachersList.find((t) => t.id === curatorId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await updateGroupAction(group.id, {
      name: groupName.trim(),
      curatorId: !curatorId || curatorId === "unassigned" || curatorId === "none" ? undefined : curatorId,
      academicYearName: academicYear,
    });

    setIsSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.error || "Ошибка при обновлении группы в базе данных");
      return;
    }

    setSuccessMessage(true);
    setTimeout(() => {
      router.push("/dashboard/groups");
    }, 1200);
  };

  return (
    <div className="space-y-6 pb-16 text-xs">
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
                <BreadcrumbLink href="/dashboard/groups">Учебные группы</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Редактирование {group.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Edit className="h-6 w-6 text-primary" /> Редактирование группы {group.name}
            </h1>
            <Badge variant="outline" className="gap-1 border-primary/30 text-primary">
              ID: {group.id}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" render={<Link href="/dashboard/groups" />}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Назад к списку
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 flex items-center gap-3 animate-in fade-in duration-200">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div>
            <div className="font-semibold text-sm">Данные группы «{groupName}» успешно сохранены!</div>
            <div className="text-xs opacity-90">Перенаправление на страницу реестра групп...</div>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive flex items-center gap-3 animate-in fade-in duration-200">
          <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
          <div>
            <div className="font-semibold text-sm">Не удалось сохранить изменения</div>
            <div className="text-xs opacity-90">{errorMessage}</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form Area */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1: Basic Group Details */}
            <Card className="shadow-xs border">
              <CardHeader className="pb-3 border-b bg-muted/20">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Users className="h-4.5 w-4.5 text-primary" /> Название и Квалификация
                </CardTitle>
                <CardDescription className="text-xs">
                  Изменение названия группы и академических параметров
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-xs font-medium text-foreground">
                    Шифр / Название группы <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    required
                    placeholder="Например: ПО-1-25"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">Курс обучения</Label>
                  <Select value={course} onValueChange={setCourse}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Выберите курс" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 курс</SelectItem>
                      <SelectItem value="2">2 курс</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">Учебный год</Label>
                  <Select value={academicYear} onValueChange={setAcademicYear}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Выберите учебный год" />
                    </SelectTrigger>
                    <SelectContent>
                      {academicYearsList && academicYearsList.length > 0 ? (
                        academicYearsList.map((y) => (
                          <SelectItem key={y.id} value={y.name} className="text-xs">
                            {y.name} учебный год {y.isCurrent ? "(Текущий)" : ""}
                          </SelectItem>
                        ))
                      ) : (
                        <>
                          <SelectItem value="2025-2026" className="text-xs">2025-2026 учебный год</SelectItem>
                          <SelectItem value="2026-2027" className="text-xs">2026-2027 учебный год</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-xs font-medium text-foreground">Специальность / Направление</Label>
                  <Select value={specialty} onValueChange={setSpecialty}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Выберите специальность" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Информационные системы и программирование">
                        Информационные системы и программирование
                      </SelectItem>
                      <SelectItem value="Программное обеспечение вычислительной техники">
                        Программное обеспечение вычислительной техники
                      </SelectItem>
                      <SelectItem value="Сетевое и системное администрирование">
                        Сетевое и системное администрирование
                      </SelectItem>
                      <SelectItem value="Дизайн и компьютерная графика">
                        Дизайн и компьютерная графика
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Section 2: Curator Assignment */}
            <Card className="shadow-xs border">
              <CardHeader className="pb-3 border-b bg-muted/20">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <UserCheck className="h-4.5 w-4.5 text-primary" /> Курирование группы
                </CardTitle>
                <CardDescription className="text-xs">
                  Назначение или смена классного руководителя из состава преподавателей
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">Куратор группы</Label>
                  <Select value={curatorId} onValueChange={setCuratorId}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Выберите куратора" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned" className="text-xs">Не назначен</SelectItem>
                      {teachersList.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.name} ({teacher.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
              <Button variant="outline" type="button" render={<Link href="/dashboard/groups" />}>
                Отмена
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !groupName.trim()}
                className="w-full sm:w-auto h-9 text-xs gap-2"
              >
                {isSubmitting ? (
                  <>Сохранение в БД...</>
                ) : (
                  <>
                    <Save className="h-4 w-4" /> Сохранить изменения
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Right Sidebar: Live Preview Card */}
        <div className="space-y-6">
          <div className="sticky top-20 z-10">
            <Card className="border shadow-none">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" /> Предпросмотр изменений
                </CardTitle>
              </CardHeader>

              <CardContent className="pt-5 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-foreground">
                      {groupName.trim() || "Название группы"}
                    </h3>
                    <Badge variant="outline" className="text-xs font-mono">
                      {course} курс
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {specialty}
                  </p>
                </div>

                <div className="pt-3 border-t space-y-2 text-xs">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <UserCheck className="h-3.5 w-3.5" /> Куратор:
                    </span>
                    <span className="font-semibold text-foreground">
                      {selectedCurator ? selectedCurator.name : (group.curatorName || "Не назначен")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" /> Учебный год:
                    </span>
                    <span className="font-medium text-foreground">{academicYear}</span>
                  </div>

                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" /> Студенты:
                    </span>
                    <Badge variant="secondary" className="text-[10px]">
                      {group.studentCount} зачислено
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
