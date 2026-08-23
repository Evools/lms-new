"use client";

import React, { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  Users,
  CheckCircle2,
  AlertCircle,
  Search,
  BookMarked,
  GraduationCap,
  UserCheck,
  Link2,
  Unlink,
  Layers,
  Filter,
  X,
} from "lucide-react";
import type {
  SubjectDTO,
  GroupSubjectBindingDTO,
  TeacherOptionDTO,
  GroupOptionDTO,
} from "../actions";
import {
  createSubjectAction,
  updateSubjectAction,
  deleteSubjectAction,
  assignSubjectToGroupAction,
  removeSubjectFromGroupAction,
} from "../actions";

interface SubjectsViewProps {
  subjects: SubjectDTO[];
  bindings: GroupSubjectBindingDTO[];
  teachers: TeacherOptionDTO[];
  groups: GroupOptionDTO[];
  isAdmin: boolean;
}

type ViewMode = "by-subject" | "by-group";

export function SubjectsView({
  subjects,
  bindings,
  teachers,
  groups,
  isAdmin,
}: SubjectsViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // View & Filter States
  const [viewMode, setViewMode] = useState<ViewMode>("by-subject");
  const [search, setSearch] = useState("");
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState<string>("ALL");
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>("ALL");

  // Notifications
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modals: Subject CRUD
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const [editTarget, setEditTarget] = useState<SubjectDTO | null>(null);
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<SubjectDTO | null>(null);

  // Modals: Assign Binding
  const [assignSubjectId, setAssignSubjectId] = useState<string | null>(null);
  const [assignGroupId, setAssignGroupId] = useState<string>("");
  const [assignTeacherId, setAssignTeacherId] = useState<string>("");

  // Modals: Remove Binding
  const [removeBindingTarget, setRemoveBindingTarget] = useState<GroupSubjectBindingDTO | null>(null);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
    try {
      toast.add({ title: msg, type: "success" });
    } catch {}
  };

  const handleCreate = () => {
    if (!newName.trim()) {
      setErrorMsg("Укажите название дисциплины");
      return;
    }
    setErrorMsg(null);
    startTransition(async () => {
      const res = await createSubjectAction({
        name: newName,
        code: newCode,
        description: newDesc,
      });
      if (res.success) {
        setIsCreateOpen(false);
        setNewName("");
        setNewCode("");
        setNewDesc("");
        showSuccess("Дисциплина успешно создана!");
        router.refresh();
      } else {
        setErrorMsg(res.error || "Ошибка создания");
      }
    });
  };

  const handleUpdate = () => {
    if (!editTarget || !editName.trim()) {
      setErrorMsg("Укажите название");
      return;
    }
    setErrorMsg(null);
    startTransition(async () => {
      const res = await updateSubjectAction(editTarget.id, {
        name: editName,
        code: editCode,
        description: editDesc,
      });
      if (res.success) {
        setEditTarget(null);
        showSuccess("Дисциплина обновлена!");
        router.refresh();
      } else {
        setErrorMsg(res.error || "Ошибка обновления");
      }
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setErrorMsg(null);
    startTransition(async () => {
      const res = await deleteSubjectAction(deleteTarget.id);
      if (res.success) {
        setDeleteTarget(null);
        showSuccess("Дисциплина удалена!");
        router.refresh();
      } else {
        setErrorMsg(res.error || "Ошибка удаления");
      }
    });
  };

  const openAssignModal = (defaultSubjectId?: string, defaultGroupId?: string) => {
    setAssignSubjectId(defaultSubjectId || subjects[0]?.id || "");
    setAssignGroupId(defaultGroupId || groups[0]?.id || "");
    setAssignTeacherId(teachers[0]?.id || "");
  };

  const handleAssign = () => {
    if (!assignSubjectId || !assignGroupId || !assignTeacherId) {
      setErrorMsg("Заполните все поля");
      return;
    }
    setErrorMsg(null);
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
        setErrorMsg(res.error || "Ошибка привязки");
      }
    });
  };

  const handleRemoveBinding = () => {
    if (!removeBindingTarget) return;
    setErrorMsg(null);
    startTransition(async () => {
      const res = await removeSubjectFromGroupAction(removeBindingTarget.id);
      if (res.success) {
        setRemoveBindingTarget(null);
        showSuccess("Привязка удалена!");
        router.refresh();
      } else {
        setErrorMsg(res.error || "Ошибка отвязки");
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

  // Filtered Subjects
  const filteredSubjects = useMemo(() => {
    return subjects.filter((s) => {
      const q = search.toLowerCase();
      const matchSearch =
        s.name.toLowerCase().includes(q) ||
        (s.code && s.code.toLowerCase().includes(q)) ||
        (s.description && s.description.toLowerCase().includes(q));

      if (!matchSearch) return false;

      const subjectBindings = bindingsBySubject.get(s.id) || [];
      if (selectedGroupFilter !== "ALL") {
        const hasGroup = subjectBindings.some((b) => b.groupId === selectedGroupFilter);
        if (!hasGroup) return false;
      }

      if (selectedTeacherFilter !== "ALL") {
        const hasTeacher = subjectBindings.some((b) => b.teacherId === selectedTeacherFilter);
        if (!hasTeacher) return false;
      }

      return true;
    });
  }, [subjects, search, selectedGroupFilter, selectedTeacherFilter, bindingsBySubject]);

  // Filtered Groups for Group View
  const filteredGroups = useMemo(() => {
    return groups.filter((g) => {
      if (selectedGroupFilter !== "ALL" && g.id !== selectedGroupFilter) return false;

      const groupBindings = bindingsByGroup.get(g.id) || [];
      const q = search.toLowerCase();

      if (!q && selectedTeacherFilter === "ALL") return true;

      const matchGroupName = g.name.toLowerCase().includes(q);
      const matchSubjectInGroup = groupBindings.some(
        (b) =>
          b.subjectName.toLowerCase().includes(q) ||
          b.teacherName.toLowerCase().includes(q)
      );

      if (q && !matchGroupName && !matchSubjectInGroup) return false;

      if (selectedTeacherFilter !== "ALL") {
        const hasTeacher = groupBindings.some((b) => b.teacherId === selectedTeacherFilter);
        if (!hasTeacher) return false;
      }

      return true;
    });
  }, [groups, search, selectedGroupFilter, selectedTeacherFilter, bindingsByGroup]);

  return (
    <div className="space-y-4 w-full text-xs">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-4 rounded-xl border shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <BookMarked className="h-4 w-4" />
            </div>
            <h1 className="text-sm font-bold tracking-tight text-foreground">
              Учебные дисциплины
            </h1>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary font-medium">
              {subjects.length} предметов
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Каталог учебных дисциплин и их привязка к группам с назначением преподавателей
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="xs"
              variant="outline"
              className="h-8 text-xs gap-1.5 font-medium border-primary/30 text-primary hover:bg-primary/10"
              onClick={() => openAssignModal()}
              disabled={subjects.length === 0 || groups.length === 0}
            >
              <Link2 className="h-3.5 w-3.5" /> Назначить в группу
            </Button>
            <Button
              size="xs"
              className="h-8 text-xs gap-1.5 font-medium"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" /> Создать дисциплину
            </Button>
          </div>
        )}
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="p-3 rounded-lg border border-primary/30 bg-primary/10 text-primary text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Filters & View Switcher Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-card p-3 rounded-xl border shadow-2xs">
        {/* Segmented View Switcher */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-muted/60 rounded-lg border text-xs sm:w-[320px]">
          <button
            type="button"
            onClick={() => setViewMode("by-subject")}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-medium transition-colors ${
              viewMode === "by-subject"
                ? "bg-background text-primary shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" /> По дисциплинам
          </button>
          <button
            type="button"
            onClick={() => setViewMode("by-group")}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-medium transition-colors ${
              viewMode === "by-group"
                ? "bg-background text-primary shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="h-3.5 w-3.5" /> По группам
          </button>
        </div>

        {/* Search & Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 flex-1 md:justify-end">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder={viewMode === "by-subject" ? "Поиск дисциплин..." : "Поиск по группам/предметам..."}
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

          <Select value={selectedGroupFilter} onValueChange={setSelectedGroupFilter}>
            <SelectTrigger className="h-8 text-xs w-[140px] bg-background">
              <SelectValue placeholder="Все группы" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">Все группы</SelectItem>
              {groups.map((g) => (
                <SelectItem key={g.id} value={g.id} className="text-xs">{g.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedTeacherFilter} onValueChange={setSelectedTeacherFilter}>
            <SelectTrigger className="h-8 text-xs w-[160px] bg-background">
              <SelectValue placeholder="Все преподаватели" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">Все преподаватели</SelectItem>
              {teachers.map((t) => (
                <SelectItem key={t.id} value={t.id} className="text-xs">{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* VIEW 1: BY SUBJECT (Catalog + attached groups inside) */}
      {viewMode === "by-subject" && (
        <div className="space-y-3">
          {filteredSubjects.length === 0 ? (
            <div className="p-8 text-center bg-card border rounded-xl space-y-2">
              <BookOpen className="h-8 w-8 text-muted-foreground/40 mx-auto" />
              <p className="font-semibold text-foreground">Дисциплины не найдены</p>
              <p className="text-[11px] text-muted-foreground">
                Попробуйте изменить параметры поиска или создайте новую дисциплину
              </p>
              {isAdmin && (
                <Button size="xs" onClick={() => setIsCreateOpen(true)} className="mt-2 font-medium">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Создать дисциплину
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredSubjects.map((s) => {
                const subjectBindings = bindingsBySubject.get(s.id) || [];

                return (
                  <div
                    key={s.id}
                    className="rounded-xl border bg-card p-3.5 flex flex-col justify-between shadow-2xs hover:border-primary/40 transition-colors group space-y-3"
                  >
                    {/* Header of Subject Card */}
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-foreground text-xs truncate block" title={s.name}>
                              {s.name}
                            </span>
                          </div>
                          {s.code && (
                            <span className="inline-block text-[10px] font-mono font-medium text-muted-foreground bg-muted/60 border px-1.5 py-0.2 rounded">
                              {s.code}
                            </span>
                          )}
                        </div>

                        {isAdmin && (
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              size="xs"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-primary rounded-md"
                              onClick={() => {
                                setEditTarget(s);
                                setEditName(s.name);
                                setEditCode(s.code || "");
                                setEditDesc(s.description || "");
                              }}
                              title="Редактировать"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="xs"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive rounded-md"
                              onClick={() => setDeleteTarget(s)}
                              title="Удалить"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>

                      {s.description ? (
                        <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                          {s.description}
                        </p>
                      ) : (
                        <p className="text-[11px] text-muted-foreground/60 italic">
                          Описание не указано
                        </p>
                      )}
                    </div>

                    {/* Assigned Groups & Teachers List */}
                    <div className="pt-2.5 border-t space-y-2">
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
                            <Plus className="h-3 w-3" /> Привязать
                          </button>
                        )}
                      </div>

                      {subjectBindings.length === 0 ? (
                        <div className="p-2.5 rounded-lg bg-muted/30 border border-dashed text-center text-[10px] text-muted-foreground">
                          Дисциплина пока не назначена ни одной группе
                        </div>
                      ) : (
                        <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                          {subjectBindings.map((b) => (
                            <div
                              key={b.id}
                              className="p-1.5 rounded-lg border bg-muted/20 flex items-center justify-between gap-1.5 text-[11px]"
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                <Badge
                                  variant="outline"
                                  className="text-[9px] px-1 py-0 border-primary/30 text-primary font-mono font-semibold shrink-0"
                                >
                                  {b.groupName}
                                </Badge>
                                <span className="text-muted-foreground truncate" title={b.teacherName}>
                                  {b.teacherName}
                                </span>
                              </div>

                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => setRemoveBindingTarget(b)}
                                  className="text-muted-foreground hover:text-destructive p-0.5 rounded transition-colors shrink-0"
                                  title="Отвязать группу"
                                >
                                  <X className="h-3 w-3" />
                                </button>
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

      {/* VIEW 2: BY GROUP (Academic Curriculum per group) */}
      {viewMode === "by-group" && (
        <div className="space-y-3">
          {filteredGroups.length === 0 ? (
            <div className="p-8 text-center bg-card border rounded-xl space-y-2">
              <Users className="h-8 w-8 text-muted-foreground/40 mx-auto" />
              <p className="font-semibold text-foreground">Группы не найдены</p>
              <p className="text-[11px] text-muted-foreground">Измените параметры фильтрации</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredGroups.map((g) => {
                const groupBindings = bindingsByGroup.get(g.id) || [];

                return (
                  <div
                    key={g.id}
                    className="rounded-xl border bg-card p-3.5 flex flex-col justify-between shadow-2xs hover:border-primary/40 transition-colors space-y-3"
                  >
                    {/* Header of Group Card */}
                    <div className="flex items-center justify-between pb-2 border-b">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-md bg-primary/10 text-primary font-bold">
                          <Users className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <span className="font-bold text-foreground text-xs block">
                            Группа {g.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {groupBindings.length} дисциплин в плане
                          </span>
                        </div>
                      </div>

                      {isAdmin && (
                        <Button
                          size="xs"
                          variant="outline"
                          className="h-7 text-[10px] px-2 gap-1 text-primary border-primary/30 hover:bg-primary/10 font-medium"
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
                        <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                          {groupBindings.map((b) => (
                            <div
                              key={b.id}
                              className="p-2 rounded-lg border bg-muted/20 flex items-center justify-between gap-2 text-xs hover:bg-muted/40 transition-colors"
                            >
                              <div className="min-w-0 space-y-0.5">
                                <span className="font-semibold text-foreground truncate block">
                                  {b.subjectName}
                                </span>
                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                  <UserCheck className="h-3 w-3 text-primary shrink-0" />
                                  <span className="truncate">{b.teacherName}</span>
                                </div>
                              </div>

                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => setRemoveBindingTarget(b)}
                                  className="p-1 text-muted-foreground hover:text-destructive rounded transition-colors shrink-0"
                                  title="Убрать предмет из группы"
                                >
                                  <Unlink className="h-3.5 w-3.5" />
                                </button>
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

      {/* Modal: Create Subject */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="p-4 gap-3 text-xs sm:max-w-[420px]">
          <DialogHeader className="pb-2 border-b gap-1 text-left">
            <DialogTitle className="flex items-center gap-2 text-sm font-bold">
              <Plus className="h-4 w-4 text-primary" /> Создать дисциплину
            </DialogTitle>
            <DialogDescription className="text-xs">
              Новый учебный предмет для добавления в каталог лицея
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2.5 py-1">
            <div className="space-y-1">
              <label className="font-medium text-foreground text-xs">Название дисциплины *</label>
              <Input
                placeholder="Например: Разработка интерфейсов на React"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="h-8 text-xs bg-background"
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-foreground text-xs">Код / Шифр (необязательно)</label>
              <Input
                placeholder="Например: WEB-201"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                className="h-8 text-xs bg-background font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-foreground text-xs">Описание (необязательно)</label>
              <Input
                placeholder="Краткое описание курса или рабочей программы..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="h-8 text-xs bg-background"
              />
            </div>
          </div>
          <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
            <Button variant="outline" size="xs" onClick={() => setIsCreateOpen(false)}>
              Отмена
            </Button>
            <Button size="xs" disabled={isPending} onClick={handleCreate}>
              Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Edit Subject */}
      <Dialog open={editTarget !== null} onOpenChange={(open) => !open && setEditTarget(null)}>
        {editTarget && (
          <DialogContent className="p-4 gap-3 text-xs sm:max-w-[420px]">
            <DialogHeader className="pb-2 border-b gap-1 text-left">
              <DialogTitle className="flex items-center gap-2 text-sm font-bold">
                <Pencil className="h-4 w-4 text-primary" /> Редактировать дисциплину
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-2.5 py-1">
              <div className="space-y-1">
                <label className="font-medium text-foreground text-xs">Название дисциплины *</label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-8 text-xs bg-background"
                />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-foreground text-xs">Код / Шифр</label>
                <Input
                  value={editCode}
                  onChange={(e) => setEditCode(e.target.value)}
                  className="h-8 text-xs bg-background font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-foreground text-xs">Описание</label>
                <Input
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="h-8 text-xs bg-background"
                />
              </div>
            </div>
            <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
              <Button variant="outline" size="xs" onClick={() => setEditTarget(null)}>
                Отмена
              </Button>
              <Button size="xs" disabled={isPending} onClick={handleUpdate}>
                Сохранить
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Modal: Delete Subject */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
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
              <Button variant="outline" size="xs" onClick={() => setDeleteTarget(null)}>
                Отмена
              </Button>
              <Button variant="destructive" size="xs" disabled={isPending} onClick={handleDelete}>
                Удалить
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>

      {/* Modal: Assign Subject to Group */}
      <Dialog open={assignSubjectId !== null} onOpenChange={(open) => !open && setAssignSubjectId(null)}>
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
                <label className="font-medium text-foreground text-xs">Дисциплина *</label>
                <Select value={assignSubjectId} onValueChange={setAssignSubjectId}>
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue>{subjects.find((s) => s.id === assignSubjectId)?.name || "Выберите предмет"}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={s.id} className="text-xs">{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground text-xs">Учебная группа *</label>
                <Select value={assignGroupId} onValueChange={setAssignGroupId}>
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue>{groups.find((g) => g.id === assignGroupId)?.name || "Выберите группу"}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={g.id} className="text-xs">{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground text-xs">Преподаватель *</label>
                <Select value={assignTeacherId} onValueChange={setAssignTeacherId}>
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue>{teachers.find((t) => t.id === assignTeacherId)?.name || "Выберите преподавателя"}</SelectValue>
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
              <Button variant="outline" size="xs" onClick={() => setAssignSubjectId(null)}>
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
      <AlertDialog open={removeBindingTarget !== null} onOpenChange={(open) => !open && setRemoveBindingTarget(null)}>
        {removeBindingTarget && (
          <AlertDialogContent className="p-4 gap-3 text-xs sm:max-w-[400px]">
            <AlertDialogHeader className="place-items-start text-left gap-1">
              <AlertDialogTitle className="text-sm font-bold flex items-center gap-2">
                <Unlink className="h-4 w-4 text-destructive" /> Отвязать дисциплину?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
                Вы отвязываете «{removeBindingTarget.subjectName}» от группы {removeBindingTarget.groupName} (преподаватель: {removeBindingTarget.teacherName}).
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
              <Button variant="outline" size="xs" onClick={() => setRemoveBindingTarget(null)}>
                Отмена
              </Button>
              <Button variant="destructive" size="xs" disabled={isPending} onClick={handleRemoveBinding}>
                Отвязать
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>
    </div>
  );
}
