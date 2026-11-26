"use client";

import React, { useState, useTransition, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
  List,
  Check,
  RotateCcw,
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
  assignSubjectToGroupsAction,
  updateGroupSubjectBindingAction,
  removeSubjectFromGroupAction,
  toggleSubjectLmsAction,
} from "../actions";

interface SubjectsViewProps {
  subjects: SubjectDTO[];
  bindings: GroupSubjectBindingDTO[];
  teachers: TeacherOptionDTO[];
  groups: GroupOptionDTO[];
  specialties?: SpecialtyOptionDTO[];
  isAdmin: boolean;
}

type ViewMode = "table" | "cards" | "by-group";
type StatusFilterMode = "ALL" | "LMS_ON" | "LMS_OFF" | "UNASSIGNED";

const CATEGORY_CONFIG: Record<
  SubjectCategoryType,
  {
    label: string;
    shortLabel: string;
    badgeClass: string;
  }
> = {
  GENERAL: {
    label: "Общеобразовательный цикл",
    shortLabel: "Общеобразов.",
    badgeClass: "border-border bg-muted/60 text-foreground",
  },
  PROFESSIONAL: {
    label: "Профессиональный цикл",
    shortLabel: "Профессион.",
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
  const [localSubjects, setLocalSubjects] = useState<SubjectDTO[]>(subjects);
  const [pendingLmsIds, setPendingLmsIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setLocalSubjects(subjects);
  }, [subjects]);

  // View & Filter States
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] =
    useState<StatusFilterMode>("ALL");
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
  const [formIsLmsActive, setFormIsLmsActive] = useState<boolean>(false);
  const [createGroupIds, setCreateGroupIds] = useState<string[]>([]);
  const [createTeacherId, setCreateTeacherId] = useState<string>("");
  const [showCreateAssign, setShowCreateAssign] = useState<boolean>(false);

  const [deleteTarget, setDeleteTarget] = useState<SubjectDTO | null>(null);

  // Modals: Assign Binding (supports multiple groups)
  const [assignSubjectId, setAssignSubjectId] = useState<string | null>(null);
  const [assignGroupIds, setAssignGroupIds] = useState<string[]>([]);
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
    setFormIsLmsActive(false);
    setCreateGroupIds([]);
    setCreateTeacherId(teachers[0]?.id || "");
    setShowCreateAssign(false);
    setIsSubjectDialogOpen(true);
  };

  const toggleCreateGroupId = (groupId: string) => {
    setCreateGroupIds((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
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
    setFormIsLmsActive(Boolean(s.isLmsActive));
    setIsSubjectDialogOpen(true);
  };

  const handleToggleSubjectLms = (subjectId: string, newState: boolean) => {
    setLocalSubjects((prev) =>
      prev.map((s) => (s.id === subjectId ? { ...s, isLmsActive: newState } : s))
    );
    setPendingLmsIds((prev) => ({ ...prev, [subjectId]: true }));

    void (async () => {
      try {
        const res = await toggleSubjectLmsAction(subjectId, newState);
        if (res.success) {
          showSuccess(
            newState
              ? "Доступ к курсу открыт для студентов"
              : "Курс скрыт от студентов"
          );
          startTransition(() => {
            router.refresh();
          });
        } else {
          setLocalSubjects((prev) =>
            prev.map((s) =>
              s.id === subjectId ? { ...s, isLmsActive: !newState } : s
            )
          );
          showError(res.error || "Не удалось изменить статус LMS");
        }
      } finally {
        setPendingLmsIds((prev) => {
          const next = { ...prev };
          delete next[subjectId];
          return next;
        });
      }
    })();
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
          isLmsActive: formIsLmsActive,
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
          isLmsActive: formIsLmsActive,
        });
        if (res.success) {
          if (res.subjectId && createGroupIds.length > 0 && createTeacherId) {
            const assignRes = await assignSubjectToGroupsAction({
              subjectId: res.subjectId,
              groupIds: createGroupIds,
              teacherId: createTeacherId,
            });
            if (!assignRes.success) {
              showError(assignRes.error || "Дисциплина создана, но не удалось привязать к группам");
            }
          }
          setIsSubjectDialogOpen(false);
          showSuccess(
            createGroupIds.length > 0
              ? `Дисциплина создана и назначена (${createGroupIds.length} гр.)!`
              : "Дисциплина успешно создана!"
          );
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
    const targetSubjectId = defaultSubjectId || localSubjects[0]?.id || "";
    setAssignSubjectId(targetSubjectId);
    setAssignGroupIds(defaultGroupId ? [defaultGroupId] : []);
    setAssignTeacherId(teachers[0]?.id || "");
  };

  const toggleAssignGroupId = (groupId: string) => {
    setAssignGroupIds((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleAssign = () => {
    if (!assignSubjectId || assignGroupIds.length === 0 || !assignTeacherId) {
      showError("Выберите дисциплину, хотя бы одну группу и преподавателя");
      return;
    }
    startTransition(async () => {
      const res = await assignSubjectToGroupsAction({
        subjectId: assignSubjectId,
        groupIds: assignGroupIds,
        teacherId: assignTeacherId,
      });
      if (res.success) {
        setAssignSubjectId(null);
        setAssignGroupIds([]);
        const count = res.createdCount || 1;
        showSuccess(
          count > 1
            ? `Дисциплина привязана к ${count} группам!`
            : "Дисциплина успешно привязана к группе!"
        );
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
    const totalSubjects = localSubjects.length;
    const generalCount = localSubjects.filter(
      (s) => s.category === "GENERAL"
    ).length;
    const professionalCount = localSubjects.filter(
      (s) => s.category === "PROFESSIONAL"
    ).length;
    const lmsActiveCount = localSubjects.filter((s) => s.isLmsActive).length;
    const unassignedCount = localSubjects.filter(
      (s) => (bindingsBySubject.get(s.id) || []).length === 0
    ).length;
    const activeTeachersCount = new Set(bindings.map((b) => b.teacherId)).size;
    return {
      totalSubjects,
      generalCount,
      professionalCount,
      lmsActiveCount,
      unassignedCount,
      totalBindings: bindings.length,
      activeTeachersCount: activeTeachersCount || teachers.length,
    };
  }, [localSubjects, bindings, bindingsBySubject, teachers]);

  // Filtered Subjects
  const filteredSubjects = useMemo(() => {
    return localSubjects.filter((s) => {
      if (selectedCategory !== "ALL" && s.category !== selectedCategory) {
        return false;
      }

      const subjectBindings = bindingsBySubject.get(s.id) || [];
      if (selectedStatusFilter === "LMS_ON" && !s.isLmsActive) return false;
      if (selectedStatusFilter === "LMS_OFF" && s.isLmsActive) return false;
      if (selectedStatusFilter === "UNASSIGNED" && subjectBindings.length > 0)
        return false;

      const q = search.toLowerCase().trim();
      if (q) {
        const matchSearch =
          s.name.toLowerCase().includes(q) ||
          (s.code && s.code.toLowerCase().includes(q)) ||
          (s.description && s.description.toLowerCase().includes(q)) ||
          (s.specialtyName && s.specialtyName.toLowerCase().includes(q));
        if (!matchSearch) return false;
      }

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
    localSubjects,
    selectedCategory,
    selectedStatusFilter,
    search,
    selectedGroupFilter,
    selectedTeacherFilter,
    bindingsBySubject,
  ]);

  const hasActiveFilters =
    search.trim() !== "" ||
    selectedCategory !== "ALL" ||
    selectedStatusFilter !== "ALL" ||
    selectedGroupFilter !== "ALL" ||
    selectedTeacherFilter !== "ALL";

  const resetFilters = () => {
    setSearch("");
    setSelectedCategory("ALL");
    setSelectedStatusFilter("ALL");
    setSelectedGroupFilter("ALL");
    setSelectedTeacherFilter("ALL");
  };

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
          </div>
          <p className="text-[11px] text-muted-foreground">
            Каталог общеобразовательного и профессионального циклов, нагрузка и закрепление за группами
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/50 border text-[11px]">
            <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-muted-foreground">Дисциплин:</span>
            <span className="font-bold text-foreground">{kpiStats.totalSubjects}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-[11px]">
            <BookMarked className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-primary font-medium">Доступно студентам:</span>
            <span className="font-bold text-primary">{kpiStats.lmsActiveCount}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/50 border text-[11px]">
            <Layers className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-muted-foreground">Привязок:</span>
            <span className="font-bold text-foreground">{kpiStats.totalBindings}</span>
          </div>

          {isAdmin && (
            <>
              <Button
                size="xs"
                variant="outline"
                className="h-8 text-xs gap-1.5 font-medium border-primary/30 text-primary hover:bg-primary/10"
                onClick={() => openAssignModal()}
                disabled={localSubjects.length === 0 || groups.length === 0}
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
            </>
          )}
        </div>
      </div>

      {/* Filters & View Switcher Bar */}
      <div className="bg-card p-3 rounded-xl border space-y-2.5">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
          {/* Official shadcn Tabs View Switcher (3 modes) */}
          <Tabs
            value={viewMode}
            onValueChange={(val) => setViewMode(val as ViewMode)}
          >
            <TabsList className="h-8 p-1 bg-muted/60 border w-full sm:w-auto">
              <TabsTrigger
                value="table"
                className="h-6 px-2.5 text-xs gap-1.5 font-medium"
              >
                <List className="h-3.5 w-3.5 shrink-0" />
                <span>Таблица</span>
              </TabsTrigger>
              <TabsTrigger
                value="cards"
                className="h-6 px-2.5 text-xs gap-1.5 font-medium"
              >
                <LayoutGrid className="h-3.5 w-3.5 shrink-0" />
                <span>Карточки</span>
              </TabsTrigger>
              <TabsTrigger
                value="by-group"
                className="h-6 px-2.5 text-xs gap-1.5 font-medium"
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

        {/* Cycle & Status Filter Pills */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t">
          <div className="flex items-center flex-wrap gap-1.5">
            <span className="text-[11px] text-muted-foreground mr-1">
              Цикл:
            </span>
            {[
              { id: "ALL", label: `Все (${localSubjects.length})` },
              {
                id: "GENERAL",
                label: `Общеобразовательный (${kpiStats.generalCount})`,
              },
              {
                id: "PROFESSIONAL",
                label: `Профессиональный (${kpiStats.professionalCount})`,
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

          {viewMode !== "by-group" && (
            <div className="flex items-center flex-wrap gap-1.5">
              {[
                { id: "ALL" as StatusFilterMode, label: "Все статусы" },
                { id: "LMS_ON" as StatusFilterMode, label: `Доступны (${kpiStats.lmsActiveCount})` },
                { id: "LMS_OFF" as StatusFilterMode, label: "Скрытые" },
                {
                  id: "UNASSIGNED" as StatusFilterMode,
                  label: `Без групп (${kpiStats.unassignedCount})`,
                },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setSelectedStatusFilter(st.id)}
                  className={`h-6 px-2.5 rounded-md text-[11px] font-medium border transition-colors ${
                    selectedStatusFilter === st.id
                      ? "bg-primary/10 text-primary border-primary"
                      : "bg-background text-muted-foreground border-border hover:text-foreground"
                  }`}
                >
                  {st.label}
                </button>
              ))}

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="h-6 px-2 rounded-md text-[11px] font-medium border border-border bg-muted/40 text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                  title="Сбросить все фильтры"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Сбросить</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* VIEW 0: COMPACT TABLE (ТАБЛИЦА) */}
      {viewMode === "table" && (
        <div className="bg-card rounded-xl border overflow-hidden">
          {filteredSubjects.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <BookOpen className="h-8 w-8 text-muted-foreground/40 mx-auto" />
              <p className="font-bold text-foreground">Дисциплины не найдены</p>
              <p className="text-[11px] text-muted-foreground">
                Попробуйте изменить параметры поиска или добавьте новую дисциплину
              </p>
              <div className="flex items-center justify-center gap-2 pt-1">
                {hasActiveFilters && (
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={resetFilters}
                    className="h-8 text-xs font-medium gap-1.5"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Сбросить фильтры
                  </Button>
                )}
                {isAdmin && (
                  <Button
                    size="xs"
                    onClick={openCreateModal}
                    className="h-8 text-xs font-medium gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Добавить дисциплину
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b bg-muted/40 text-[11px] text-muted-foreground font-semibold">
                    <th className="py-2.5 px-3">Дисциплина</th>
                    <th className="py-2.5 px-3">Цикл</th>
                    <th className="py-2.5 px-3">Нагрузка</th>
                    <th className="py-2.5 px-3">Доступ студентам</th>
                    <th className="py-2.5 px-3">Группы и преподаватели</th>
                    {isAdmin && (
                      <th className="py-2.5 px-3 text-right">Действия</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredSubjects.map((s) => {
                    const subjectBindings = bindingsBySubject.get(s.id) || [];
                    const catCfg =
                      CATEGORY_CONFIG[s.category] || CATEGORY_CONFIG.PROFESSIONAL;
                    const isLmsPending = Boolean(pendingLmsIds[s.id]);

                    return (
                      <tr
                        key={s.id}
                        className="hover:bg-muted/20 transition-colors"
                      >
                        <td className="py-2.5 px-3 max-w-[280px]">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {s.code && (
                              <Badge
                                variant="outline"
                                className="font-mono text-[10px] px-1.5 py-0 rounded-md bg-muted/50 text-foreground shrink-0"
                              >
                                {s.code}
                              </Badge>
                            )}
                            <span className="font-semibold text-foreground truncate">
                              {s.name}
                            </span>
                          </div>
                          {s.description && (
                            <p className="text-[11px] text-muted-foreground truncate pt-0.5">
                              {s.description}
                            </p>
                          )}
                        </td>

                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-2 py-0 rounded-md font-medium ${catCfg.badgeClass}`}
                          >
                            {catCfg.shortLabel}
                          </Badge>
                        </td>

                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div className="inline-flex flex-col items-start">
                            <span className="font-mono font-semibold text-foreground text-[11px]">
                              {s.hoursTotal || 72} ч.
                            </span>
                            {s.assessmentType && (
                              <span className="text-[10px] text-muted-foreground">
                                {ASSESSMENT_LABELS[s.assessmentType]}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <button
                            type="button"
                            disabled={!isAdmin || isLmsPending}
                            onClick={() =>
                              handleToggleSubjectLms(s.id, !s.isLmsActive)
                            }
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-medium transition-colors ${
                              s.isLmsActive
                                ? "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20 cursor-pointer"
                                : "bg-muted/40 text-muted-foreground border-border hover:bg-muted hover:text-foreground cursor-pointer"
                            } ${isLmsPending ? "opacity-60" : ""}`}
                            title={
                              isAdmin
                                ? s.isLmsActive
                                  ? "Дисциплина доступна студентам. Нажмите, чтобы скрыть"
                                  : "Дисциплина скрыта от студентов. Нажмите, чтобы открыть доступ"
                                : undefined
                            }
                          >
                            <BookMarked className="h-3 w-3 shrink-0" />
                            <span>{s.isLmsActive ? "Доступен" : "Скрыт"}</span>
                            {s.isLmsActive && s.materialsCount > 0 && (
                              <span className="text-[10px] opacity-75">
                                · {s.materialsCount}
                              </span>
                            )}
                          </button>
                        </td>

                        <td className="py-2.5 px-3 max-w-[340px]">
                          <div className="flex items-center flex-wrap gap-1">
                            {subjectBindings.length === 0 ? (
                              <span className="text-[11px] text-muted-foreground/70 italic">
                                Не назначена
                              </span>
                            ) : (
                              subjectBindings.map((b) => (
                                <button
                                  key={b.id}
                                  type="button"
                                  onClick={() => isAdmin && openEditBindingModal(b)}
                                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border bg-background text-[10.5px] transition-colors ${
                                    isAdmin
                                      ? "hover:border-primary/50 cursor-pointer"
                                      : "cursor-default"
                                  }`}
                                  title={`${b.groupName} — ${b.teacherName}${isAdmin ? " (нажмите для изменения)" : ""}`}
                                >
                                  <span className="font-mono font-semibold text-primary">
                                    {b.groupName}
                                  </span>
                                  <span className="text-muted-foreground truncate max-w-[110px]">
                                    {b.teacherName.split(" ").slice(0, 2).join(" ")}
                                  </span>
                                </button>
                              ))
                            )}
                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => openAssignModal(s.id)}
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md border border-dashed border-primary/40 text-primary text-[10px] font-medium hover:bg-primary/10 transition-colors"
                                title="Привязать к группе"
                              >
                                <Plus className="h-2.5 w-2.5" />
                              </button>
                            )}
                          </div>
                        </td>

                        {isAdmin && (
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            <div className="inline-flex items-center justify-end gap-1">
                              <Button
                                size="xs"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                                onClick={() => openEditSubjectModal(s)}
                                title="Редактировать"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="xs"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                onClick={() => setDeleteTarget(s)}
                                title="Удалить"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

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

                      {/* LMS Status Quick Toggle */}
                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        <button
                          type="button"
                          disabled={!isAdmin || Boolean(pendingLmsIds[s.id])}
                          onClick={() => handleToggleSubjectLms(s.id, !s.isLmsActive)}
                          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10.5px] font-medium transition-colors ${
                            s.isLmsActive
                              ? "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20 cursor-pointer"
                              : "bg-muted/40 text-muted-foreground border-border hover:bg-muted hover:text-foreground cursor-pointer"
                          } ${pendingLmsIds[s.id] ? "opacity-60" : ""}`}
                          title={
                            isAdmin
                              ? s.isLmsActive
                                ? "Курс опубликован в Материалах. Нажмите, чтобы скрыть"
                                : "Курс скрыт из Материалов. Нажмите, чтобы опубликовать"
                              : undefined
                          }
                        >
                          <BookMarked className="h-3 w-3 shrink-0" />
                          <span>{s.isLmsActive ? "Студентам: Доступен" : "Студентам: Скрыт"}</span>
                        </button>

                        {s.isLmsActive && s.materialsCount > 0 ? (
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {s.materialsCount} тем
                          </span>
                        ) : null}
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
                                    {subjObj?.isLmsActive ? (
                                      <span
                                        className="text-[9px] font-medium text-primary bg-primary/10 border border-primary/20 px-1 py-0.2 rounded"
                                        title="Курс доступен студентам"
                                      >
                                        Доступен
                                      </span>
                                    ) : null}
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
        <DialogContent className="p-4 gap-3 text-xs sm:max-w-[600px]">
          <DialogHeader className="pb-2 border-b gap-0.5 text-left">
            <DialogTitle className="flex items-center gap-2 text-sm font-bold">
              {editingSubject ? (
                <>
                  <Pencil className="h-4 w-4 text-primary" /> Редактировать дисциплину
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 text-primary" /> Новая учебная дисциплина
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {/* Group 1: Basic Info */}
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-1 p-1 bg-muted/60 rounded-lg border text-xs">
                <button
                  type="button"
                  onClick={() => setFormCategory("GENERAL")}
                  className={`h-7 px-2.5 rounded-md font-medium text-xs transition-colors flex items-center justify-center gap-1.5 ${
                    formCategory === "GENERAL"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                  <span>Общеобразовательный цикл</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormCategory("PROFESSIONAL")}
                  className={`h-7 px-2.5 rounded-md font-medium text-xs transition-colors flex items-center justify-center gap-1.5 ${
                    formCategory === "PROFESSIONAL"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Layers className="h-3.5 w-3.5 shrink-0" />
                  <span>Профессиональный цикл</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[1fr_130px] gap-2.5">
                <div className="space-y-1 min-w-0">
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

                <div className="space-y-1 min-w-0">
                  <label className="font-medium text-foreground text-xs block">
                    Шифр
                  </label>
                  <Input
                    placeholder="ОП.01"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="h-8 text-xs bg-background font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground text-xs block">
                  Описание
                </label>
                <Input
                  placeholder="Краткое описание курса (необязательно)"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="h-8 text-xs bg-background"
                />
              </div>
            </div>

            {/* Group 2: Curriculum Parameters */}
            <div
              className={`grid gap-2.5 pt-2.5 border-t ${
                specialties.length > 0
                  ? "grid-cols-1 sm:grid-cols-[100px_165px_1fr]"
                  : "grid-cols-2"
              }`}
            >
              <div className="space-y-1 min-w-0">
                <label className="font-medium text-foreground text-xs block">
                  Часов
                </label>
                <Input
                  type="number"
                  min={10}
                  max={600}
                  value={formHours}
                  onChange={(e) => setFormHours(Number(e.target.value) || 72)}
                  className="h-8 text-xs bg-background font-mono"
                />
              </div>

              <div className="space-y-1 min-w-0">
                <label className="font-medium text-foreground text-xs block">
                  Аттестация
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

              {specialties.length > 0 && (
                <div className="space-y-1 min-w-0">
                  <label className="font-medium text-foreground text-xs block">
                    Специальность
                  </label>
                  <Select
                    value={formSpecialtyId}
                    onValueChange={(v) => setFormSpecialtyId(v || "ALL")}
                  >
                    <SelectTrigger className="w-full h-8 text-xs bg-background">
                      <SelectValue>
                        {formSpecialtyId === "ALL"
                          ? "Общая для всех"
                          : specialties.find((sp) => sp.id === formSpecialtyId)
                              ?.name || "Общая для всех"}
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
            </div>

            {/* Group 3: LMS & Optional Group Assignment */}
            <div className="space-y-2.5 pt-2.5 border-t">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-xs text-foreground">
                  Доступен студентам (показывать в обучении)
                </span>
                <Switch
                  size="sm"
                  checked={formIsLmsActive}
                  onCheckedChange={setFormIsLmsActive}
                />
              </div>

              {!editingSubject && groups.length > 0 && (
                <div>
                  {!showCreateAssign ? (
                    <button
                      type="button"
                      onClick={() => setShowCreateAssign(true)}
                      className="text-primary hover:underline text-[11px] font-medium inline-flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Назначить группам сразу</span>
                    </button>
                  ) : (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-xs text-foreground">
                          Группы ({createGroupIds.length})
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setShowCreateAssign(false);
                            setCreateGroupIds([]);
                          }}
                          className="text-[11px] text-muted-foreground hover:text-foreground"
                        >
                          Скрыть
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1.5 max-h-[80px] overflow-y-auto">
                        {groups.map((g) => {
                          const selected = createGroupIds.includes(g.id);
                          return (
                            <button
                              key={g.id}
                              type="button"
                              onClick={() => toggleCreateGroupId(g.id)}
                              className={`h-6 px-2.5 rounded-md border text-[11px] font-medium transition-colors inline-flex items-center gap-1 ${
                                selected
                                  ? "bg-primary/10 text-primary border-primary"
                                  : "bg-background text-muted-foreground border-border hover:text-foreground"
                              }`}
                            >
                              <span>{g.name}</span>
                              {selected && <Check className="h-3 w-3 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>

                      {createGroupIds.length > 0 && (
                        <Select
                          value={createTeacherId}
                          onValueChange={(v) => v && setCreateTeacherId(v)}
                        >
                          <SelectTrigger className="w-full h-8 text-xs bg-background">
                            <SelectValue>
                              {teachers.find((t) => t.id === createTeacherId)?.name ||
                                "Выберите преподавателя"}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {teachers.map((t) => (
                              <SelectItem key={t.id} value={t.id} className="text-xs">
                                {t.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-1">
            <Button
              variant="outline"
              size="xs"
              className="h-7 px-3 text-xs"
              onClick={() => setIsSubjectDialogOpen(false)}
            >
              Отмена
            </Button>
            <Button
              size="xs"
              className="h-7 px-3 text-xs"
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

      {/* Modal: Assign Subject to Group(s) */}
      <Dialog
        open={assignSubjectId !== null}
        onOpenChange={(open) => !open && setAssignSubjectId(null)}
      >
        {assignSubjectId && (() => {
          const existingBoundGroupIds = new Set(
            (bindingsBySubject.get(assignSubjectId) || []).map((b) => b.groupId)
          );
          return (
            <DialogContent className="p-4 gap-3 text-xs sm:max-w-[440px]">
              <DialogHeader className="pb-2 border-b gap-1 text-left">
                <DialogTitle className="flex items-center gap-2 text-sm font-bold">
                  <Link2 className="h-4 w-4 text-primary" /> Назначить предмет группам
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Выберите одну или несколько групп и ведущего преподавателя
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2.5 py-1">
                <div className="space-y-1">
                  <label className="font-medium text-foreground text-xs">
                    Дисциплина *
                  </label>
                  <Select
                    value={assignSubjectId}
                    onValueChange={(v) => {
                      if (!v) return;
                      setAssignSubjectId(v);
                      const boundSet = new Set(
                        (bindingsBySubject.get(v) || []).map((b) => b.groupId)
                      );
                      setAssignGroupIds((prev) => prev.filter((id) => !boundSet.has(id)));
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs bg-background">
                      <SelectValue>
                        {localSubjects.find((s) => s.id === assignSubjectId)?.name ||
                          "Выберите предмет"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {localSubjects.map((s) => (
                        <SelectItem key={s.id} value={s.id} className="text-xs">
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-medium text-foreground text-xs">
                      Учебные группы *
                    </label>
                    {assignGroupIds.length > 0 && (
                      <span className="text-[11px] text-primary font-medium">
                        Выбрано: {assignGroupIds.length}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 max-h-[170px] overflow-y-auto p-1.5 rounded-lg border bg-muted/20">
                    {groups.map((g) => {
                      const alreadyBound = existingBoundGroupIds.has(g.id);
                      const isSelected = assignGroupIds.includes(g.id);
                      return (
                        <button
                          key={g.id}
                          type="button"
                          disabled={alreadyBound}
                          onClick={() => toggleAssignGroupId(g.id)}
                          className={`flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-md border text-left text-xs font-medium transition-colors ${
                            alreadyBound
                              ? "bg-muted/50 text-muted-foreground/60 border-border/50 cursor-not-allowed"
                              : isSelected
                                ? "bg-primary/10 text-primary border-primary"
                                : "bg-background text-foreground border-border hover:border-primary/40"
                          }`}
                        >
                          <span className="truncate">{g.name}</span>
                          {alreadyBound ? (
                            <span className="text-[9.5px] text-muted-foreground shrink-0">
                              привязана
                            </span>
                          ) : isSelected ? (
                            <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
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
                <Button
                  size="xs"
                  disabled={isPending || assignGroupIds.length === 0}
                  onClick={handleAssign}
                >
                  {assignGroupIds.length > 1
                    ? `Назначить (${assignGroupIds.length})`
                    : "Назначить"}
                </Button>
              </DialogFooter>
            </DialogContent>
          );
        })()}
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
