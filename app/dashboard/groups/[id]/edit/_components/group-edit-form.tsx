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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
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
  Save,
  Plus,
} from "lucide-react";
import { updateGroupAction, GroupDTO } from "@/app/dashboard/groups/actions";
import { createSpecialtyAction } from "@/app/dashboard/specialties/actions";

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

interface SpecialtyOption {
  id: string;
  name: string;
  code?: string | null;
}

interface GroupEditFormProps {
  group: GroupDTO;
  userRole: string;
  teachersList?: TeacherOption[];
  academicYearsList?: AcademicYearOption[];
  specialtiesList?: SpecialtyOption[];
}

export function GroupEditForm({
  group,
  userRole,
  teachersList = [],
  academicYearsList = [],
  specialtiesList = [],
}: GroupEditFormProps) {
  const router = useRouter();

  const [groupName, setGroupName] = useState(group.name);
  const [course, setCourse] = useState(String(group.course || 1));
  const [specialties, setSpecialties] = useState<SpecialtyOption[]>(specialtiesList);
  const [specialtyId, setSpecialtyId] = useState<string>(group.specialtyId || "unassigned");
  const [curatorId, setCuratorId] = useState<string>(group.curatorId || "unassigned");
  const [academicYear, setAcademicYear] = useState(group.academicYear || "2025-2026");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Quick Add Specialty Dialog
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickCode, setQuickCode] = useState("");
  const [quickName, setQuickName] = useState("");
  const [quickDescription, setQuickDescription] = useState("");
  const [quickError, setQuickError] = useState<string | null>(null);
  const [isQuickSaving, setIsQuickSaving] = useState(false);

  const selectedCurator = teachersList.find((t) => t.id === curatorId);
  const selectedSpecialty = specialties.find((s) => s.id === specialtyId);

  const handleQuickAddSpecialty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName.trim()) {
      setQuickError("Укажите наименование специальности");
      return;
    }

    setIsQuickSaving(true);
    setQuickError(null);

    const res = await createSpecialtyAction({
      name: quickName.trim(),
      code: quickCode.trim() || undefined,
      description: quickDescription.trim() || undefined,
    });

    setIsQuickSaving(false);

    if (!res.success || !res.specialty) {
      setQuickError(res.error || "Не удалось сохранить специальность");
      return;
    }

    const newOption: SpecialtyOption = {
      id: res.specialty.id,
      name: res.specialty.name,
      code: res.specialty.code,
    };

    setSpecialties((prev) => [...prev, newOption]);
    setSpecialtyId(newOption.id);
    setIsQuickAddOpen(false);
    setQuickName("");
    setQuickCode("");
    setQuickDescription("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await updateGroupAction(group.id, {
      name: groupName.trim(),
      curatorId: !curatorId || curatorId === "unassigned" || curatorId === "none" ? undefined : curatorId,
      specialtyId: !specialtyId || specialtyId === "unassigned" ? undefined : specialtyId,
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
    <div className="space-y-3 pb-6 text-xs w-full">
      {/* Header & Breadcrumbs */}
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
                <BreadcrumbLink href={`/dashboard/groups/${group.id}`} className="text-[11px]">
                  {group.name}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-[11px]">Редактирование</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-foreground">
              Редактирование группы «{group.name}»
            </h1>
            <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary bg-primary/5 px-2 py-0">
              ID: {group.id.slice(-6)}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link href={`/dashboard/groups/${group.id}`}>
            <Button variant="outline" size="xs" className="h-8 text-xs gap-1.5 font-medium px-3">
              <ArrowLeft className="h-3.5 w-3.5" /> Назад к группе
            </Button>
          </Link>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-2.5 rounded-lg border border-primary/30 bg-primary/10 text-primary text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
          <div>
            <div className="font-semibold text-xs">Изменения успешно сохранены!</div>
            <div className="text-[11px] opacity-90">Перенаправление в реестр групп...</div>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-2.5 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
          <div>
            <div className="font-semibold text-xs">Не удалось сохранить изменения</div>
            <div className="text-[11px] opacity-90">{errorMessage}</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Main Edit Form */}
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
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="h-8 text-xs bg-background font-medium"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Формат: [Код специальности]-[Курс]-[Год] (например: {group.name})
                  </p>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-foreground">Курс обучения</Label>
                  <Select value={course} onValueChange={setCourse}>
                    <SelectTrigger className="h-8 text-xs bg-background font-medium">
                      <SelectValue>{course ? `${course} курс` : "Выберите курс"}</SelectValue>
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
                      <SelectValue>{academicYear ? `${academicYear} учебный год` : "Выберите учебный год"}</SelectValue>
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

                <div className="space-y-1 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-foreground">
                      Специальность / Направление подготовки
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() => setIsQuickAddOpen(true)}
                      className="h-6 px-2 text-[11px] text-primary hover:text-primary hover:bg-primary/10 font-medium gap-1"
                    >
                      <Plus className="h-3 w-3" /> Добавить в справочник
                    </Button>
                  </div>
                  <Select value={specialtyId} onValueChange={setSpecialtyId}>
                    <SelectTrigger className="h-8 text-xs bg-background font-medium">
                      <SelectValue>
                        {selectedSpecialty
                          ? `${selectedSpecialty.code ? `${selectedSpecialty.code} — ` : ""}${selectedSpecialty.name}`
                          : "Не выбрана"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned" className="text-xs">
                        Не выбрана
                      </SelectItem>
                      {specialties.map((s) => (
                        <SelectItem key={s.id} value={s.id} className="text-xs">
                          {s.code ? `${s.code} — ` : ""}
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground">
                    Данные берутся из справочника специальностей лицея
                  </p>
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
                      <SelectValue>
                        {selectedCurator ? `${selectedCurator.name} (${selectedCurator.email})` : "Не назначен"}
                      </SelectValue>
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
              <Link href={`/dashboard/groups/${group.id}`}>
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
                  <>Сохранение...</>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" /> Сохранить изменения
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Right Sidebar: Live Preview */}
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
                <div className="text-[11px] text-muted-foreground line-clamp-2">
                  {selectedSpecialty ? (
                    <span>
                      {selectedSpecialty.code && (
                        <span className="font-mono text-primary font-medium mr-1">
                          [{selectedSpecialty.code}]
                        </span>
                      )}
                      {selectedSpecialty.name}
                    </span>
                  ) : (
                    <span className="italic">Специальность не выбрана</span>
                  )}
                </div>
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
                    {group.studentCount} зачислено
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Add Specialty Dialog */}
      <Dialog open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen}>
        <DialogContent className="p-4 gap-3 text-xs sm:max-w-[400px]">
          <DialogHeader className="gap-1 text-left">
            <DialogTitle className="text-sm font-bold text-foreground">
              Добавить специальность в справочник
            </DialogTitle>
            <DialogDescription className="text-[11px] text-muted-foreground">
              Новая специальность сохранится в базе данных и сразу будет выбрана для группы
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleQuickAddSpecialty} className="space-y-3">
            {quickError && (
              <div className="p-2 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-[11px] flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{quickError}</span>
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-foreground">Код специальности</Label>
              <Input
                placeholder="09.02.07"
                value={quickCode}
                onChange={(e) => setQuickCode(e.target.value)}
                className="h-8 text-xs bg-background font-mono"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-foreground">
                Наименование специальности <span className="text-primary">*</span>
              </Label>
              <Input
                required
                placeholder="Информационные системы и программирование"
                value={quickName}
                onChange={(e) => setQuickName(e.target.value)}
                className="h-8 text-xs bg-background font-medium"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-foreground">Краткое описание</Label>
              <Input
                placeholder="Квалификация или направление"
                value={quickDescription}
                onChange={(e) => setQuickDescription(e.target.value)}
                className="h-8 text-xs bg-background font-medium"
              />
            </div>

            <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={() => setIsQuickAddOpen(false)}
                className="h-6 px-2.5 text-xs font-medium"
              >
                Отмена
              </Button>
              <Button
                type="submit"
                size="xs"
                disabled={isQuickSaving || !quickName.trim()}
                className="h-6 px-2.5 text-xs font-medium"
              >
                {isQuickSaving ? "Сохранение..." : "Добавить и выбрать"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
