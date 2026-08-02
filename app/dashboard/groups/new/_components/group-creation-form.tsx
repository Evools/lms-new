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
  FolderPlus,
  BookOpen,
} from "lucide-react";
import { createGroupAction } from "../../actions";

interface TeacherOption {
  id: string;
  name: string;
  email: string;
}

interface GroupCreationFormProps {
  teachersList?: TeacherOption[];
}

export function GroupCreationForm({ teachersList = [] }: GroupCreationFormProps) {
  const router = useRouter();

  const [groupName, setGroupName] = useState("");
  const [course, setCourse] = useState("1");
  const [specialty, setSpecialty] = useState("Информационные системы и программирование");
  const [curatorId, setCuratorId] = useState<string>("unassigned");
  const [academicYear, setAcademicYear] = useState("2025-2026");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedCurator = teachersList.find((t) => t.id === curatorId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await createGroupAction({
      name: groupName.trim(),
      curatorId: !curatorId || curatorId === "unassigned" || curatorId === "none" ? undefined : curatorId,
      academicYearName: academicYear,
    });

    setIsSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.error || "Ошибка при создании группы в базе данных");
      return;
    }

    setSuccessMessage(true);
    setTimeout(() => {
      router.push("/dashboard/groups");
    }, 1200);
  };

  return (
    <div className="space-y-3 pb-6 text-xs w-full">
      {/* Header Bar & Breadcrumbs */}
      <div className="bg-card p-3 rounded-xl border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard" className="text-[11px]">Панель</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard/groups" className="text-[11px]">Группы</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-[11px]">Новая группа</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <FolderPlus className="h-4 w-4" />
            </div>
            <h1 className="text-sm font-bold text-foreground">
              Создание академической группы
            </h1>
            <Badge variant="outline" className="text-[10px] border-primary/30 text-primary bg-primary/5 font-semibold px-2 py-0">
              Новый поток
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link href="/dashboard/groups">
            <Button variant="outline" size="xs" className="h-8 text-xs gap-1.5 font-medium px-3">
              <ArrowLeft className="h-3.5 w-3.5" /> Назад к списку
            </Button>
          </Link>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-2.5 rounded-lg border border-primary/30 bg-primary/10 text-primary text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
          <div>
            <div className="font-semibold text-xs">Группа «{groupName}» успешно создана!</div>
            <div className="text-[11px] opacity-90">Перенаправление на страницу реестра групп...</div>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-2.5 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
          <div>
            <div className="font-semibold text-xs">Не удалось создать группу</div>
            <div className="text-[11px] opacity-90">{errorMessage}</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Main Form Area */}
        <div className="lg:col-span-2 space-y-3">
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Section 1: Basic Group Details */}
            <Card className="border shadow-none rounded-xl">
              <CardHeader className="p-3 border-b bg-muted/20">
                <CardTitle className="text-xs font-semibold flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" /> Параметры и квалификация группы
                </CardTitle>
                <CardDescription className="text-[11px]">
                  Шифр академической группы, курс и привязка специальности
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1 md:col-span-2">
                  <Label className="text-xs font-semibold text-foreground">
                    Шифр / Название группы <span className="text-primary">*</span>
                  </Label>
                  <Input
                    required
                    placeholder="Например: ИС-1-25 или ПО-2-24"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="h-8 text-xs bg-background font-medium"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Формат: [Код специальности]-[Курс]-[Год] (например: ИС-1-25)
                  </p>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-foreground">Курс обучения</Label>
                  <Select value={course} onValueChange={setCourse}>
                    <SelectTrigger className="h-8 text-xs bg-background font-medium">
                      <SelectValue placeholder="Выберите курс" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1" className="text-xs">1 курс</SelectItem>
                      <SelectItem value="2" className="text-xs">2 курс</SelectItem>
                      <SelectItem value="3" className="text-xs">3 курс</SelectItem>
                      <SelectItem value="4" className="text-xs">4 курс</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-foreground">Учебный год</Label>
                  <Select value={academicYear} onValueChange={setAcademicYear}>
                    <SelectTrigger className="h-8 text-xs bg-background font-medium">
                      <SelectValue placeholder="Выберите учебный год" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2025-2026" className="text-xs">2025-2026 учебный год</SelectItem>
                      <SelectItem value="2026-2027" className="text-xs">2026-2027 учебный год</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1 md:col-span-2">
                  <Label className="text-xs font-semibold text-foreground">Специальность / Направление</Label>
                  <Select value={specialty} onValueChange={setSpecialty}>
                    <SelectTrigger className="h-8 text-xs bg-background font-medium">
                      <SelectValue placeholder="Выберите специальность" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Информационные системы и программирование" className="text-xs">
                        Информационные системы и программирование
                      </SelectItem>
                      <SelectItem value="Программное обеспечение вычислительной техники" className="text-xs">
                        Программное обеспечение вычислительной техники
                      </SelectItem>
                      <SelectItem value="Сетевое и системное администрирование" className="text-xs">
                        Сетевое и системное администрирование
                      </SelectItem>
                      <SelectItem value="Дизайн и компьютерная графика" className="text-xs">
                        Дизайн и компьютерная графика
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Section 2: Curator Assignment */}
            <Card className="border shadow-none rounded-xl">
              <CardHeader className="p-3 border-b bg-muted/20">
                <CardTitle className="text-xs font-semibold flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-primary" /> Курирование группы
                </CardTitle>
                <CardDescription className="text-[11px]">
                  Назначение классного руководителя / куратора из преподавательского состава
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-foreground">Куратор группы</Label>
                  <Select value={curatorId} onValueChange={setCuratorId}>
                    <SelectTrigger className="h-8 text-xs bg-background font-medium">
                      <SelectValue placeholder="Выберите куратора" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned" className="text-xs">Не назначен</SelectItem>
                      {teachersList.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id} className="text-xs">
                          {teacher.name} ({teacher.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <Link href="/dashboard/groups">
                <Button variant="outline" type="button" size="xs" className="h-8 text-xs px-3 font-medium">
                  Отмена
                </Button>
              </Link>
              <Button
                type="submit"
                size="xs"
                disabled={isSubmitting || !groupName.trim()}
                className="h-8 text-xs gap-1.5 font-medium px-4"
              >
                {isSubmitting ? (
                  <>Создание...</>
                ) : (
                  <>
                    <FolderPlus className="h-3.5 w-3.5" /> Создать группу
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Right Sidebar: Live Group Preview Card */}
        <div className="space-y-3">
          <Card className="border shadow-none rounded-xl">
            <CardHeader className="p-3 border-b">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> Предпросмотр карточки
              </CardTitle>
            </CardHeader>

            <CardContent className="p-3 space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-foreground truncate">
                    {groupName.trim() || "Название группы"}
                  </h3>
                  <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary bg-primary/5">
                    {course} курс
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-1">
                  {specialty}
                </p>
              </div>

              <div className="pt-2 border-t space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <UserCheck className="h-3.5 w-3.5 text-primary" /> Куратор:
                  </span>
                  <span className="font-semibold text-foreground truncate max-w-[120px]">
                    {selectedCurator ? selectedCurator.name : "Не назначен"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-primary" /> Учебный год:
                  </span>
                  <span className="font-medium text-foreground">{academicYear}</span>
                </div>

                <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-primary" /> Студенты:
                  </span>
                  <Badge variant="secondary" className="text-[9px] px-1.5 py-0 font-normal">
                    0 зачислено
                  </Badge>
                </div>
              </div>

              <div className="p-2.5 rounded-lg border bg-muted/20 text-[11px] text-muted-foreground space-y-1">
                <div className="font-semibold text-foreground flex items-center gap-1 text-[11px]">
                  <BookOpen className="h-3.5 w-3.5 text-primary" /> Реестр потоков
                </div>
                <p className="text-[10px] leading-tight">
                  После создания группы вы сможете зачислять в неё студентов и назначать дисциплины.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
