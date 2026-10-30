"use client";

import React, { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  Users,
  Search,
  BookMarked,
  UserCheck,
  Link2,
  Unlink,
  X,
  Clock,
  GraduationCap,
  Layers,
  LayoutGrid,
  Wrench,
} from "lucide-react";
import type {
  SubjectDTO,
  SubjectCategoryType,
  SubjectAssessmentType,
  GroupSubjectBindingDTO,
  TeacherOptionDTO,
  GroupOptionDTO,
  SpecialtyOptionDTO,
} from "../actions";
import {
  createSubjectAction,
  updateSubjectAction,
  deleteSubjectAction,
  assignSubjectToGroupAction,
  updateGroupSubjectBindingAction,
  removeSubjectFromGroupAction,
} from "../actions";

interface SubjectsViewProps {
  subjects: SubjectDTO[];
  bindings: GroupSubjectBindingDTO[];
  teachers: TeacherOptionDTO[];
  groups: GroupOptionDTO[];
  specialties?: SpecialtyOptionDTO[];
  isAdmin: boolean;
}

type ViewMode = "cards" | "by-group";

const CATEGORY_CONFIG: Record<
  SubjectCategoryType,
  {
    label: string;
    badgeClass: string;
  }
> = {
  GENERAL: {
    label: "Общеобразовательный цикл",
    badgeClass:
      "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  },
  PROFESSIONAL: {
    label: "Профессиональный цикл",
    badgeClass: "border-primary/30 bg-primary/10 text-primary",
  },
};

const ASSESSMENT_LABELS: Record<SubjectAssessmentType, string> = {
  EXAM: "Экзамен",
  DIFF_CREDIT: "Диф. зачёт",
  CREDIT: "Зачёт",
  PRACTICE_WORK: "Защита практики",
};

const HOURS_PRESETS = [36, 54, 72, 108, 144];

export function SubjectsView({
  subjects,
  bindings,
  teachers,
  groups,
  specialties = [],
  isAdmin,
}: SubjectsViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // View & Filter States
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedTeacherFilter, setSelectedTeacherFilter] =
    useState<string>("ALL");
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>("ALL");

  // Modals: Subject Create / Edit
  const [isSubjectDialogOpen, setIsSubjectDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectDTO | null>(null);
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formCategory, setFormCategory] =
    useState<SubjectCategoryType>("PROFESSIONAL");
  const [formHours, setFormHours] = useState<number>(72);
  const [formAssessment, setFormAssessment] =
    useState<SubjectAssessmentType>("DIFF_CREDIT");
  const [formSpecialtyId, setFormSpecialtyId] = useState<string>("ALL");

  const [deleteTarget, setDeleteTarget] = useState<SubjectDTO | null>(null);

  // Modals: Assign Binding
  const [assignSubjectId, setAssignSubjectId] = useState<string | null>(null);
  const [assignGroupId, setAssignGroupId] = useState<string>("");
  const [assignTeacherId, setAssignTeacherId] = useState<string>("");

  // Modals: Edit Existing Binding
  const [editBindingTarget, setEditBindingTarget] =
    useState<GroupSubjectBindingDTO | null>(null);
  const [editBindingSubjectId, setEditBindingSubjectId] = useState<string>("");
  const [editBindingGroupId, setEditBindingGroupId] = useState<string>("");
  const [editBindingTeacherId, setEditBindingTeacherId] = useState<string>("");

  // Modals: Remove Binding
  const [removeBindingTarget, setRemoveBindingTarget] =
    useState<GroupSubjectBindingDTO | null>(null);

  const showSuccess = (msg: string) => {
    toast.add({ title: msg, type: "success" });
  };

  const showError = (msg: string) => {
    toast.add({ title: msg, type: "error" });
  };

  const openCreateModal = () => {
    setEditingSubject(null);
    setFormName("");
    setFormCode("");
    setFormDesc("");
    setFormCategory("PROFESSIONAL");
    setFormHours(72);
    setFormAssessment("DIFF_CREDIT");
    setFormSpecialtyId("ALL");
    setIsSubjectDialogOpen(true);
  };

  const openEditSubjectModal = (s: SubjectDTO) => {
    setEditingSubject(s);
    setFormName(s.name);
    setFormCode(s.code || "");
    setFormDesc(s.description || "");
    setFormCategory(s.category === "GENERAL" ? "GENERAL" : "PROFESSIONAL");
    setFormHours(s.hoursTotal || 72);
    setFormAssessment(s.assessmentType || "DIFF_CREDIT");
    setFormSpecialtyId(s.specialtyId || "ALL");
    setIsSubjectDialogOpen(true);
  };

  const openEditBindingModal = (b: GroupSubjectBindingDTO) => {
    setEditBindingTarget(b);
    setEditBindingSubjectId(b.subjectId);
    setEditBindingGroupId(b.groupId);
    setEditBindingTeacherId(b.teacherId);
  };

  const handleSaveSubject = () => {
    if (!formName.trim()) {
      showError("Укажите название дисциплины");
      return;
    }

    startTransition(async () => {
      if (editingSubject) {
        const res = await updateSubjectAction(editingSubject.id, {
          name: formName,
          code: formCode,
          description: formDesc,
          category: formCategory,
          hoursTotal: Number(formHours) || 72,
          assessmentType: formAssessment,
          specialtyId: formSpecialtyId === "ALL" ? null : formSpecialtyId,
        });
        if (res.success) {
          setIsSubjectDialogOpen(false);
          setEditingSubject(null);
          showSuccess("Дисциплина успешно обновлена!");
          router.refresh();
        } else {
          showError(res.error || "Ошибка обновления");
        }
      } else {
        const res = await createSubjectAction({
          name: formName,
          code: formCode,
          description: formDesc,
          category: formCategory,
          hoursTotal: Number(formHours) || 72,
          assessmentType: formAssessment,
          specialtyId: formSpecialtyId === "ALL" ? null : formSpecialtyId,
        });
        if (res.success) {
          setIsSubjectDialogOpen(false);
          showSuccess("Дисциплина успешно создана!");
          router.refresh();
        } else {
          showError(res.error || "Ошибка создания");
        }
      }
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      const res = await deleteSubjectAction(deleteTarget.id);
      if (res.success) {
        setDeleteTarget(null);
        showSuccess("Дисциплина удалена!");
        router.refresh();
      } else {
        showError(res.error || "Ошибка удаления");
      }
    });
  };

  const openAssignModal = (
    defaultSubjectId?: string,
    defaultGroupId?: string
  ) => {
    setAssignSubjectId(defaultSubjectId || subjects[0]?.id || "");
    setAssignGroupId(defaultGroupId || groups[0]?.id || "");
    setAssignTeacherId(teachers[0]?.id || "");
  };

  const handleAssign = () => {
    if (!assignSubjectId || !assignGroupId || !assignTeacherId) {
      showError("Заполните все поля");
      return;
    }
    startTransition(async () => {
      const res = await assignSubjectToGroupAction({
        subjectId: assignSubjectId,
        groupId: assignGroupId,
        teacherId: assignTeacherId,
      });
      if (res.success) {
        setAssignSubjectId(null);
        showSuccess("Дисциплина успешно привязана к группе!");
        router.refresh();
      } else {
        showError(res.error || "Ошибка привязки");
      }
    });
  };

  const handleUpdateBinding = () => {
    if (
      !editBindingTarget ||
      !editBindingSubjectId ||
      !editBindingGroupId ||
      !editBindingTeacherId
    ) {
      showError("Заполните все поля");
      return;
    }
    startTransition(async () => {
      const res = await updateGroupSubjectBindingAction(editBindingTarget.id, {
        subjectId: editBindingSubjectId,
        groupId: editBindingGroupId,
        teacherId: editBindingTeacherId,
      });
      if (res.success) {
        setEditBindingTarget(null);
        showSuccess("Привязка дисциплины и преподавателя обновлена!");
        router.refresh();
      } else {
        showError(res.error || "Ошибка обновления привязки");
      }
    });
  };

  const handleRemoveBinding = () => {
    if (!removeBindingTarget) return;
    startTransition(async () => {
      const res = await removeSubjectFromGroupAction(removeBindingTarget.id);
      if (res.success) {
        setRemoveBindingTarget(null);
        showSuccess("Привязка удалена!");
        router.refresh();
      } else {
        showError(res.error || "Ошибка отвязки");
      }
    });
  };

  // Maps for quick group lookup
  const bindingsBySubject = useMemo(() => {
    const map = new Map<string, GroupSubjectBindingDTO[]>();
    for (const b of bindings) {
      if (!map.has(b.subjectId)) map.set(b.subjectId, []);
      map.get(b.subjectId)!.push(b);
    }
    return map;
  }, [bindings]);

  const bindingsByGroup = useMemo(() => {
    const map = new Map<string, GroupSubjectBindingDTO[]>();
    for (const b of bindings) {
      if (!map.has(b.groupId)) map.set(b.groupId, []);
      map.get(b.groupId)!.push(b);
    }
    return map;
  }, [bindings]);

  // Summary KPIs
  const kpiStats = useMemo(() => {
    const totalSubjects = subjects.length;
    const generalCount = subjects.filter(
      (s) => s.category === "GENERAL"
    ).length;
    const professionalCount = subjects.filter(
      (s) => s.category === "PROFESSIONAL"
    ).length;
    const activeTeachersCount = new Set(bindings.map((b) => b.teacherId)).size;
    return {
      totalSubjects,
      generalCount,
      professionalCount,
      totalBindings: bindings.length,
      activeTeachersCount: activeTeachersCount || teachers.length,
    };
  }, [subjects, bindings, teachers]);

  // Filtered Subjects
  const filteredSubjects = useMemo(() => {
    return subjects.filter((s) => {
      if (selectedCategory !== "ALL" && s.category !== selectedCategory) {
        return false;
      }

      const q = search.toLowerCase().trim();
      if (q) {
        const matchSearch =
          s.name.toLowerCase().includes(q) ||
          (s.code && s.code.toLowerCase().includes(q)) ||
          (s.description && s.description.toLowerCase().includes(q)) ||
          (s.specialtyName && s.specialtyName.toLowerCase().includes(q));
        if (!matchSearch) return false;
      }

      const subjectBindings = bindingsBySubject.get(s.id) || [];
      if (selectedGroupFilter !== "ALL") {
        const hasGroup = subjectBindings.some(
          (b) => b.groupId === selectedGroupFilter
        );
        if (!hasGroup) return false;
      }

      if (selectedTeacherFilter !== "ALL") {
        const hasTeacher = subjectBindings.some(
          (b) => b.teacherId === selectedTeacherFilter
        );
        if (!hasTeacher) return false;
      }

      return true;
    });
  }, [
    subjects,
    selectedCategory,
    search,
    selectedGroupFilter,
    selectedTeacherFilter,
    bindingsBySubject,
  ]);

  // Filtered Groups for Group View
  const filteredGroups = useMemo(() => {
    return groups.filter((g) => {
      if (selectedGroupFilter !== "ALL" && g.id !== selectedGroupFilter)
        return false;

      const groupBindings = bindingsByGroup.get(g.id) || [];
      const q = search.toLowerCase().trim();

      if (selectedCategory !== "ALL") {
        const hasCat = groupBindings.some(
          (b) => b.subjectCategory === selectedCategory
        );
        if (!hasCat) return false;
      }

      if (!q && selectedTeacherFilter === "ALL") return true;

      const matchGroupName =
        g.name.toLowerCase().includes(q) ||
        (g.specialtyName && g.specialtyName.toLowerCase().includes(q));
      const matchSubjectInGroup = groupBindings.some(
        (b) =>
          b.subjectName.toLowerCase().includes(q) ||
          b.teacherName.toLowerCase().includes(q) ||
          (b.subjectCode && b.subjectCode.toLowerCase().includes(q))
      );

      if (q && !matchGroupName && !matchSubjectInGroup) return false;

      if (selectedTeacherFilter !== "ALL") {
        const hasTeacher = groupBindings.some(
          (b) => b.teacherId === selectedTeacherFilter
        );
        if (!hasTeacher) return false;
      }

      return true;
    });
  }, [
    groups,
    search,
    selectedCategory,
    selectedGroupFilter,
    selectedTeacherFilter,
    bindingsByGroup,
  ]);

  return (
    <div className="space-y-3 pb-6 w-full text-xs">
      {/* Top Header with Breadcrumbs */}
      <div className="bg-card p-3.5 rounded-xl border flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="space-y-1">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard" className="text-[11px]">
                  Панель
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-[11px]">
                  Учебные дисциплины
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <BookMarked className="h-4 w-4" />
            </div>
            <h1 className="text-sm font-bold tracking-tight text-foreground">
              Учебные дисциплины
            </h1>
            <Badge
              variant="outline"
              className="text-[10px] px-2 py-0 border-primary/30 text-primary bg-primary/5 font-medium"
            >
              {subjects.length} всего
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Каталог общеобразовательного и профессионального циклов, нагрузка и закрепление за группами
          </p>
        </div>

        {isAdmin && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              size="xs"
              variant="outline"
              className="h-8 text-xs gap-1.5 font-medium border-primary/30 text-primary hover:bg-primary/10"
              onClick={() => openAssignModal()}
              disabled={subjects.length === 0 || groups.length === 0}
            >
              <Link2 className="h-3.5 w-3.5" />
              <span>Назначить группе</span>
            </Button>
            <Button
              size="xs"
              className="h-8 text-xs gap-1.5 font-medium"
              onClick={openCreateModal}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Добавить дисциплину</span>
            </Button>
          </div>
        )}
      </div>

      {/* 4 Compact KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-xl border bg-card flex items-center justify-between">
          <div>
            <p className="text-[11px] text-muted-foreground">Всего дисциплин</p>
            <p className="text-base font-bold text-foreground mt-0.5">
              {kpiStats.totalSubjects} предм.
            </p>
          </div>
          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <BookOpen className="h-4 w-4" />
          </div>
        </div>

        <div className="p-3 rounded-xl border bg-card flex items-center justify-between">
          <div>
            <p className="text-[11px] text-muted-foreground">
              Общеобразовательный цикл
            </p>
            <p className="text-base font-bold text-foreground mt-0.5">
              {kpiStats.generalCount} предм.
            </p>
          </div>
          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <GraduationCap className="h-4 w-4" />
          </div>
        </div>

        <div className="p-3 rounded-xl border bg-card flex items-center justify-between">
          <div>
            <p className="text-[11px] text-muted-foreground">
              Профессиональный цикл
            </p>
            <p className="text-base font-bold text-primary mt-0.5">
              {kpiStats.professionalCount} предм.
            </p>
          </div>
          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Wrench className="h-4 w-4" />
          </div>
        </div>

        <div className="p-3 rounded-xl border bg-card flex items-center justify-between">
          <div>
            <p className="text-[11px] text-muted-foreground">
              Назначений в группы
            </p>
            <p className="text-base font-bold text-foreground mt-0.5">
              {kpiStats.totalBindings} привязок
            </p>
          </div>
          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Layers className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Filters & View Switcher Bar */}
      <div className="bg-card p-3 rounded-xl border space-y-2.5">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
          {/* Official shadcn Tabs View Switcher (2 modes) */}
          <Tabs
            value={viewMode}
            onValueChange={(val) =>
              setViewMode(val as "cards" | "by-group")
            }
          >
            <TabsList className="h-8 p-1 bg-muted/60 border w-full sm:w-auto">
              <TabsTrigger
                value="cards"
                className="h-6 px-3 text-xs gap-1.5 font-medium"
              >
                <LayoutGrid className="h-3.5 w-3.5 shrink-0" />
                <span>По дисциплинам</span>
              </TabsTrigger>
              <TabsTrigger
                value="by-group"
                className="h-6 px-3 text-xs gap-1.5 font-medium"
              >
                <Users className="h-3.5 w-3.5 shrink-0" />
                <span>По группам</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Search & Dropdowns */}
          <div className="flex flex-wrap items-center gap-2 flex-1 lg:justify-end">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Поиск дисциплины, шифра, группы..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-xs bg-background border"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <Select
              value={selectedGroupFilter}
              onValueChange={(v) => setSelectedGroupFilter(v || "ALL")}
            >
              <SelectTrigger className="h-8 text-xs w-[145px] bg-background">
                <SelectValue placeholder="Все группы">
                  {selectedGroupFilter === "ALL"
                    ? "Все группы"
                    : groups.find((g) => g.id === selectedGroupFilter)?.name ||
                      "Все группы"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">
                  Все группы
                </SelectItem>
                {groups.map((g) => (
                  <SelectItem key={g.id} value={g.id} className="text-xs">
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedTeacherFilter}
              onValueChange={(v) => setSelectedTeacherFilter(v || "ALL")}
            >
              <SelectTrigger className="h-8 text-xs w-[180px] bg-background">
                <SelectValue placeholder="Все преподаватели">
                  {selectedTeacherFilter === "ALL"
                    ? "Все преподаватели"
                    : teachers.find((t) => t.id === selectedTeacherFilter)
                        ?.name || "Все преподаватели"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">
                  Все преподаватели
                </SelectItem>
                {teachers.map((t) => (
                  <SelectItem key={t.id} value={t.id} className="text-xs">
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 2 Cycle Filter Pills */}
        <div className="flex items-center flex-wrap gap-1.5 pt-2 border-t">
          <span className="text-[11px] text-muted-foreground mr-1">
            Учебный цикл:
          </span>
          {[
            { id: "ALL", label: `Все дисциплины (${subjects.length})` },
            {
              id: "GENERAL",
              label: `Общеобразовательный цикл (${kpiStats.generalCount})`,
            },
            {
              id: "PROFESSIONAL",
              label: `Профессиональный цикл (${kpiStats.professionalCount})`,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedCategory(tab.id)}
              className={`h-6 px-2.5 rounded-md text-[11px] font-medium border transition-colors ${
                selectedCategory === tab.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* VIEW 1: SUBJECT CARDS (ПО ДИСЦИПЛИНАМ) */}
      {viewMode === "cards" && (
        <div className="space-y-3">
          {filteredSubjects.length === 0 ? (
            <div className="p-8 text-center bg-card border rounded-xl space-y-2">
              <BookOpen className="h-8 w-8 text-muted-foreground/40 mx-auto" />
              <p className="font-bold text-foreground">Дисциплины не найдены</p>
              <p className="text-[11px] text-muted-foreground">
                Попробуйте изменить параметры поиска или добавьте новую дисциплину
              </p>
              {isAdmin && (
                <Button
                  size="xs"
                  onClick={openCreateModal}
                  className="mt-1 h-8 text-xs font-medium gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Добавить дисциплину
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredSubjects.map((s) => {
                const subjectBindings = bindingsBySubject.get(s.id) || [];
                const catCfg =
                  CATEGORY_CONFIG[s.category] || CATEGORY_CONFIG.PROFESSIONAL;

                return (
                  <div
                    key={s.id}
                    className="rounded-xl border bg-card p-3.5 flex flex-col justify-between hover:border-primary/40 transition-colors space-y-3"
                  >
                    <div className="space-y-2">
                      {/* Top badges + actions */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center flex-wrap gap-1.5">
                          {s.code && (
                            <Badge
                              variant="outline"
                              className="font-mono text-[10px] px-1.5 py-0 bg-muted/50 text-foreground"
                            >
                              {s.code}
                            </Badge>
                          )}
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-2 py-0 font-medium ${catCfg.badgeClass}`}
                          >
                            {catCfg.label}
                          </Badge>
                        </div>

                        {isAdmin && (
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              size="xs"
                              variant="outline"
                              className="h-6 px-2 gap-1 text-[11px] font-medium"
                              onClick={() => openEditSubjectModal(s)}
                            >
                              <Pencil className="h-3 w-3 text-primary" />
                              <span>Изменить</span>
                            </Button>
                            <Button
                              size="xs"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                              onClick={() => setDeleteTarget(s)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>

                      <div>
                        <h3 className="text-xs font-bold text-foreground leading-snug">
                          {s.name}
                        </h3>
                        {s.description ? (
                          <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                            {s.description}
                          </p>
                        ) : (
                          <p className="text-[11px] text-muted-foreground/60 italic mt-0.5">
                            Описание не указано
                          </p>
                        )}
                      </div>

                      {/* Hours & Assessment strip */}
                      <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg border bg-muted/20 text-[11px]">
                        <span className="flex items-center gap-1 font-mono font-bold text-foreground">
                          <Clock className="h-3 w-3 text-primary" />
                          {s.hoursTotal || 72} ч.
                        </span>
                        {s.assessmentType && (
                          <span className="text-muted-foreground font-medium text-[11px]">
                            {ASSESSMENT_LABELS[s.assessmentType]}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Assigned Groups & Teachers List */}
                    <div className="pt-2.5 border-t space-y-2 mt-auto">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-foreground flex items-center gap-1">
                          <Users className="h-3 w-3 text-primary" />
                          Группы ({subjectBindings.length})
                        </span>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => openAssignModal(s.id)}
                            className="text-primary hover:underline text-[10px] font-medium flex items-center gap-0.5"
                          >
                            <Plus className="h-3 w-3" /> Привязать группу
                          </button>
                        )}
                      </div>

                      {subjectBindings.length === 0 ? (
                        <div className="p-2 rounded-lg bg-muted/30 border border-dashed text-center text-[10px] text-muted-foreground">
                          Дисциплина пока не назначена ни одной группе
                        </div>
                      ) : (
                        <div className="space-y-1 max-h-[140px] overflow-y-auto pr-1">
                          {subjectBindings.map((b) => (
                            <div
                              key={b.id}
                              className="p-1.5 rounded-lg border bg-background flex items-center justify-between gap-1.5 text-[11px]"
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                <Badge
                                  variant="outline"
                                  className="text-[9px] px-1.5 py-0 border-primary/30 text-primary font-mono font-semibold shrink-0"
                                >
                                  {b.groupName}
                                </Badge>
                                <span
                                  className="text-muted-foreground truncate"
                                  title={b.teacherName}
                                >
                                  {b.teacherName}
                                </span>
                              </div>

                              {isAdmin && (
                                <div className="flex items-center gap-0.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => openEditBindingModal(b)}
                                    className="text-muted-foreground hover:text-primary p-0.5 rounded"
                                    title="Изменить преподавателя или группу"
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setRemoveBindingTarget(b)}
                                    className="text-muted-foreground hover:text-destructive p-0.5 rounded"
                                    title="Отвязать группу"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: BY GROUP (ПО ГРУППАМ) */}
      {viewMode === "by-group" && (
        <div className="space-y-3">
          {filteredGroups.length === 0 ? (
            <div className="p-8 text-center bg-card border rounded-xl space-y-2">
              <Users className="h-8 w-8 text-muted-foreground/40 mx-auto" />
              <p className="font-semibold text-foreground">Группы не найдены</p>
              <p className="text-[11px] text-muted-foreground">
                Измените параметры фильтрации
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredGroups.map((g) => {
                const groupBindings = bindingsByGroup.get(g.id) || [];
                const groupHoursTotal = groupBindings.reduce(
                  (acc, b) => acc + (b.subjectHours || 72),
                  0
                );

                return (
                  <div
                    key={g.id}
                    className="rounded-xl border bg-card p-3.5 flex flex-col justify-between hover:border-primary/40 transition-colors space-y-3"
                  >
                    {/* Header of Group Card */}
                    <div className="flex items-start justify-between pb-2.5 border-b gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <Users className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-foreground text-xs">
                              {g.name}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-[9px] px-1.5 py-0 font-mono"
                            >
                              {g.course} курс
                            </Badge>
                          </div>
                          <span className="text-[10px] text-muted-foreground truncate block">
                            {g.specialtyName || "Общий профиль"} •{" "}
                            {groupBindings.length} предм. ({groupHoursTotal} ч.)
                          </span>
                        </div>
                      </div>

                      {isAdmin && (
                        <Button
                          size="xs"
                          variant="outline"
                          className="h-7 text-[10px] px-2 gap-1 text-primary border-primary/30 hover:bg-primary/10 font-medium shrink-0"
                          onClick={() => openAssignModal(undefined, g.id)}
                        >
                          <Plus className="h-3 w-3" /> Предмет
                        </Button>
                      )}
                    </div>

                    {/* Curriculum items in this group */}
                    <div className="space-y-1.5 flex-1 min-h-[80px]">
                      {groupBindings.length === 0 ? (
                        <div className="p-4 rounded-lg bg-muted/30 border border-dashed text-center text-[11px] text-muted-foreground italic">
                          В этой группе пока нет закреплённых предметов
                        </div>
                      ) : (
                        <div className="space-y-1.5 max-h-[240px] overflow-y-auto pr-1">
                          {groupBindings.map((b) => {
                            const subjObj = subjects.find(
                              (s) => s.id === b.subjectId
                            );
                            return (
                              <div
                                key={b.id}
                                className="p-2 rounded-lg border bg-background flex items-center justify-between gap-2 text-xs hover:border-primary/30 transition-colors"
                              >
                                <div className="min-w-0 space-y-0.5">
                                  <div className="flex items-center gap-1.5">
                                    {b.subjectCode && (
                                      <span className="font-mono text-[9.5px] text-muted-foreground bg-muted px-1 rounded">
                                        {b.subjectCode}
                                      </span>
                                    )}
                                    <span
                                      className="font-semibold text-foreground truncate cursor-pointer hover:text-primary"
                                      onClick={() =>
                                        subjObj && openEditSubjectModal(subjObj)
                                      }
                                      title="Нажмите, чтобы редактировать дисциплину"
                                    >
                                      {b.subjectName}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                    <span className="flex items-center gap-1 truncate">
                                      <UserCheck className="h-3 w-3 text-primary shrink-0" />
                                      {b.teacherName}
                                    </span>
                                    <span className="font-mono text-[9.5px] shrink-0">
                                      • {b.subjectHours} ч.
                                    </span>
                                  </div>
                                </div>

                                {isAdmin && (
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => openEditBindingModal(b)}
                                      className="p-1 text-muted-foreground hover:text-primary rounded transition-colors"
                                      title="Сменить преподавателя или предмет"
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setRemoveBindingTarget(b)}
                                      className="p-1 text-muted-foreground hover:text-destructive rounded transition-colors"
                                      title="Убрать предмет из группы"
                                    >
                                      <Unlink className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal: Unified Create / Edit Subject */}
      <Dialog open={isSubjectDialogOpen} onOpenChange={setIsSubjectDialogOpen}>
        <DialogContent className="p-5 gap-4 text-xs sm:max-w-[560px]">
          <DialogHeader className="pb-3 border-b gap-1 text-left">
            <DialogTitle className="flex items-center gap-2 text-sm font-bold">
              {editingSubject ? (
                <>
                  <Pencil className="h-4 w-4 text-primary" /> Обновить учебную дисциплину
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 text-primary" /> Новая учебная дисциплина
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Укажите учебный цикл, наименование, часы и форму контроля
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-1">
            {/* 2-Option Segmented Pill Toggle for Cycle */}
            <div className="space-y-1.5">
              <label className="font-medium text-foreground text-xs block">
                Учебный цикл дисциплины
              </label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-muted/60 rounded-lg border text-xs">
                <button
                  type="button"
                  onClick={() => setFormCategory("GENERAL")}
                  className={`h-8 px-3 rounded-md font-medium text-xs transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${
                    formCategory === "GENERAL"
                      ? "bg-background text-primary border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                  <span>Общеобразовательный цикл</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormCategory("PROFESSIONAL")}
                  className={`h-8 px-3 rounded-md font-medium text-xs transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${
                    formCategory === "PROFESSIONAL"
                      ? "bg-background text-primary border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Layers className="h-3.5 w-3.5 shrink-0" />
                  <span>Профессиональный цикл</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-[140px_1fr] gap-3">
              <div className="space-y-1.5 min-w-0">
                <label className="font-medium text-foreground text-xs block">
                  Код / Шифр
                </label>
                <Input
                  placeholder="Напр: ОП.01"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  className="h-8 text-xs bg-background font-mono"
                />
              </div>

              <div className="space-y-1.5 min-w-0">
                <label className="font-medium text-foreground text-xs block">
                  Название дисциплины *
                </label>
                <Input
                  placeholder="Например: Веб-программирование"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="h-8 text-xs bg-background"
                />
              </div>
            </div>

            <div className="grid grid-cols-[1fr_200px] gap-3">
              <div className="space-y-1.5 min-w-0">
                <label className="font-medium text-foreground text-xs block">
                  Объём нагрузки (часов)
                </label>
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    min={10}
                    max={600}
                    value={formHours}
                    onChange={(e) => setFormHours(Number(e.target.value) || 72)}
                    className="h-8 text-xs bg-background font-mono w-20 shrink-0"
                  />
                  <div className="flex items-center gap-1 flex-wrap">
                    {[36, 72, 108, 144].map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setFormHours(h)}
                        className={`h-8 px-2 rounded-md border text-[11px] font-mono font-medium transition-colors ${
                          formHours === h
                            ? "border-primary bg-primary/10 text-primary"
                            : "bg-background text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {h}ч
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 min-w-0">
                <label className="font-medium text-foreground text-xs block">
                  Форма аттестации
                </label>
                <Select
                  value={formAssessment}
                  onValueChange={(v) =>
                    v && setFormAssessment(v as SubjectAssessmentType)
                  }
                >
                  <SelectTrigger className="w-full h-8 text-xs bg-background">
                    <SelectValue>{ASSESSMENT_LABELS[formAssessment]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EXAM" className="text-xs">
                      Экзамен
                    </SelectItem>
                    <SelectItem value="DIFF_CREDIT" className="text-xs">
                      Диф. зачёт
                    </SelectItem>
                    <SelectItem value="CREDIT" className="text-xs">
                      Зачёт
                    </SelectItem>
                    <SelectItem value="PRACTICE_WORK" className="text-xs">
                      Защита практики
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {specialties.length > 0 && (
              <div className="space-y-1.5">
                <label className="font-medium text-foreground text-xs block">
                  Направление / Специальность
                </label>
                <Select
                  value={formSpecialtyId}
                  onValueChange={(v) => setFormSpecialtyId(v || "ALL")}
                >
                  <SelectTrigger className="w-full h-8 text-xs bg-background">
                    <SelectValue>
                      {formSpecialtyId === "ALL"
                        ? "Общая для всех специальностей"
                        : specialties.find((sp) => sp.id === formSpecialtyId)
                            ?.name || "Общая для всех специальностей"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL" className="text-xs">
                      Общая для всех специальностей
                    </SelectItem>
                    {specialties.map((sp) => (
                      <SelectItem key={sp.id} value={sp.id} className="text-xs">
                        {sp.code ? `${sp.code} — ` : ""}
                        {sp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="font-medium text-foreground text-xs block">
                Краткое описание (необязательно)
              </label>
              <Input
                placeholder="Основные темы и формируемые навыки..."
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                className="h-8 text-xs bg-background"
              />
            </div>
          </div>

          <DialogFooter className="flex flex-row justify-end gap-2 pt-3 border-t mt-1">
            <Button
              variant="outline"
              size="xs"
              className="h-8 px-3 text-xs"
              onClick={() => setIsSubjectDialogOpen(false)}
            >
              Отмена
            </Button>
            <Button
              size="xs"
              className="h-8 px-4 text-xs"
              disabled={isPending}
              onClick={handleSaveSubject}
            >
              {editingSubject ? "Сохранить" : "Создать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Edit Existing Group-Subject Binding */}
      <Dialog
        open={editBindingTarget !== null}
        onOpenChange={(open) => !open && setEditBindingTarget(null)}
      >
        {editBindingTarget && (
          <DialogContent className="p-5 gap-4 text-xs sm:max-w-[480px]">
            <DialogHeader className="pb-3 border-b gap-1 text-left">
              <DialogTitle className="flex items-center gap-2 text-sm font-bold">
                <Pencil className="h-4 w-4 text-primary" /> Изменить привязку дисциплины
              </DialogTitle>
              <DialogDescription className="text-xs">
                Смена ведущего преподавателя, группы или дисциплины
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-1">
              <div className="space-y-1.5">
                <label className="font-medium text-foreground text-xs block">
                  Дисциплина *
                </label>
                <Select
                  value={editBindingSubjectId}
                  onValueChange={(v) => v && setEditBindingSubjectId(v)}
                >
                  <SelectTrigger className="w-full h-8 text-xs bg-background">
                    <SelectValue>
                      {subjects.find((s) => s.id === editBindingSubjectId)
                        ?.name || "Выберите предмет"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={s.id} className="text-xs">
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-foreground text-xs block">
                  Учебная группа *
                </label>
                <Select
                  value={editBindingGroupId}
                  onValueChange={(v) => v && setEditBindingGroupId(v)}
                >
                  <SelectTrigger className="w-full h-8 text-xs bg-background">
                    <SelectValue>
                      {groups.find((g) => g.id === editBindingGroupId)?.name ||
                        "Выберите группу"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={g.id} className="text-xs">
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-foreground text-xs block">
                  Преподаватель *
                </label>
                <Select
                  value={editBindingTeacherId}
                  onValueChange={(v) => v && setEditBindingTeacherId(v)}
                >
                  <SelectTrigger className="w-full h-8 text-xs bg-background">
                    <SelectValue>
                      {teachers.find((t) => t.id === editBindingTeacherId)
                        ?.name || "Выберите преподавателя"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((t) => (
                      <SelectItem key={t.id} value={t.id} className="text-xs">
                        {t.name} ({t.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="flex flex-row justify-between gap-2 pt-3 border-t mt-1">
              <Button
                variant="outline"
                size="xs"
                className="h-8 px-3 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => {
                  const target = editBindingTarget;
                  setEditBindingTarget(null);
                  setRemoveBindingTarget(target);
                }}
              >
                Отвязать от группы
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="xs"
                  className="h-8 px-3 text-xs"
                  onClick={() => setEditBindingTarget(null)}
                >
                  Отмена
                </Button>
                <Button
                  size="xs"
                  className="h-8 px-4 text-xs"
                  disabled={isPending}
                  onClick={handleUpdateBinding}
                >
                  Сохранить
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Modal: Delete Subject */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        {deleteTarget && (
          <AlertDialogContent className="p-4 gap-3 text-xs sm:max-w-[400px]">
            <AlertDialogHeader className="place-items-start text-left gap-1">
              <AlertDialogTitle className="text-sm font-bold flex items-center gap-2">
                <Trash2 className="h-4 w-4 text-destructive" /> Удалить дисциплину?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
                Вы собираетесь удалить «{deleteTarget.name}». Все привязки к группам, материалы и задания по этой дисциплине будут удалены.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
              <Button
                variant="outline"
                size="xs"
                onClick={() => setDeleteTarget(null)}
              >
                Отмена
              </Button>
              <Button
                variant="destructive"
                size="xs"
                disabled={isPending}
                onClick={handleDelete}
              >
                Удалить
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>

      {/* Modal: Assign Subject to Group */}
      <Dialog
        open={assignSubjectId !== null}
        onOpenChange={(open) => !open && setAssignSubjectId(null)}
      >
        {assignSubjectId && (
          <DialogContent className="p-4 gap-3 text-xs sm:max-w-[420px]">
            <DialogHeader className="pb-2 border-b gap-1 text-left">
              <DialogTitle className="flex items-center gap-2 text-sm font-bold">
                <Link2 className="h-4 w-4 text-primary" /> Назначить предмет группе
              </DialogTitle>
              <DialogDescription className="text-xs">
                Привязка дисциплины к учебной группе с назначением преподавателя
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2.5 py-1">
              <div className="space-y-1">
                <label className="font-medium text-foreground text-xs">
                  Дисциплина *
                </label>
                <Select
                  value={assignSubjectId}
                  onValueChange={(v) => v && setAssignSubjectId(v)}
                >
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue>
                      {subjects.find((s) => s.id === assignSubjectId)?.name ||
                        "Выберите предмет"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={s.id} className="text-xs">
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground text-xs">
                  Учебная группа *
                </label>
                <Select
                  value={assignGroupId}
                  onValueChange={(v) => v && setAssignGroupId(v)}
                >
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue>
                      {groups.find((g) => g.id === assignGroupId)?.name ||
                        "Выберите группу"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={g.id} className="text-xs">
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground text-xs">
                  Преподаватель *
                </label>
                <Select
                  value={assignTeacherId}
                  onValueChange={(v) => v && setAssignTeacherId(v)}
                >
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue>
                      {teachers.find((t) => t.id === assignTeacherId)?.name ||
                        "Выберите преподавателя"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((t) => (
                      <SelectItem key={t.id} value={t.id} className="text-xs">
                        {t.name} ({t.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
              <Button
                variant="outline"
                size="xs"
                onClick={() => setAssignSubjectId(null)}
              >
                Отмена
              </Button>
              <Button size="xs" disabled={isPending} onClick={handleAssign}>
                Назначить
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Modal: Remove Binding */}
      <AlertDialog
        open={removeBindingTarget !== null}
        onOpenChange={(open) => !open && setRemoveBindingTarget(null)}
      >
        {removeBindingTarget && (
          <AlertDialogContent className="p-4 gap-3 text-xs sm:max-w-[400px]">
            <AlertDialogHeader className="place-items-start text-left gap-1">
              <AlertDialogTitle className="text-sm font-bold flex items-center gap-2">
                <Unlink className="h-4 w-4 text-destructive" /> Отвязать дисциплину?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
                Вы отвязываете «{removeBindingTarget.subjectName}» от группы{" "}
                {removeBindingTarget.groupName} (преподаватель:{" "}
                {removeBindingTarget.teacherName}).
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
              <Button
                variant="outline"
                size="xs"
                onClick={() => setRemoveBindingTarget(null)}
              >
                Отмена
              </Button>
              <Button
                variant="destructive"
                size="xs"
                disabled={isPending}
                onClick={handleRemoveBinding}
              >
                Отвязать
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>
    </div>
  );
}
