"use client";

import React, { useState, useTransition } from "react";
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
  ChevronRight,
  Link2,
  Unlink,
  GraduationCap,
  Award,
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

export function SubjectsView({
  subjects,
  bindings,
  teachers,
  groups,
  isAdmin,
}: SubjectsViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Create Subject
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newDesc, setNewDesc] = useState("");

  // Edit Subject
  const [editTarget, setEditTarget] = useState<SubjectDTO | null>(null);
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editDesc, setEditDesc] = useState("");

  // Delete Subject
  const [deleteTarget, setDeleteTarget] = useState<SubjectDTO | null>(null);

  // Assign to Group
  const [assignSubjectId, setAssignSubjectId] = useState<string | null>(null);
  const [assignGroupId, setAssignGroupId] = useState(groups[0]?.id || "");
  const [assignTeacherId, setAssignTeacherId] = useState(teachers[0]?.id || "");

  // Remove Binding
  const [removeBindingTarget, setRemoveBindingTarget] = useState<GroupSubjectBindingDTO | null>(null);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
    try {
      toast.add({ title: msg, type: "success" });
    } catch {}
  };

  const handleCreate = () => {
    if (!newName.trim()) { setErrorMsg("Укажите название дисциплины"); return; }
    setErrorMsg(null);
    startTransition(async () => {
      const res = await createSubjectAction({ name: newName, code: newCode, description: newDesc });
      if (res.success) {
        setIsCreateOpen(false);
        setNewName(""); setNewCode(""); setNewDesc("");
        showSuccess("Дисциплина создана!");
        router.refresh();
      } else {
        setErrorMsg(res.error || "Ошибка");
      }
    });
  };

  const handleUpdate = () => {
    if (!editTarget || !editName.trim()) { setErrorMsg("Укажите название"); return; }
    setErrorMsg(null);
    startTransition(async () => {
      const res = await updateSubjectAction(editTarget.id, { name: editName, code: editCode, description: editDesc });
      if (res.success) {
        setEditTarget(null);
        showSuccess("Дисциплина обновлена!");
        router.refresh();
      } else {
        setErrorMsg(res.error || "Ошибка");
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
        setErrorMsg(res.error || "Ошибка");
      }
    });
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
        showSuccess("Дисциплина привязана к группе!");
        router.refresh();
      } else {
        setErrorMsg(res.error || "Ошибка");
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
        setErrorMsg(res.error || "Ошибка");
      }
    });
  };

  const filteredSubjects = subjects.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.code && s.code.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-3 w-full text-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-3.5 rounded-xl border shadow-xs">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span>Администратор</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-semibold">Дисциплины</span>
          </div>
          <h1 className="text-sm font-bold text-foreground flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" /> Учебные дисциплины
          </h1>
        </div>
        {isAdmin && (
          <Button size="xs" className="h-8 text-xs gap-1.5 font-medium" onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Создать дисциплину
          </Button>
        )}
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="p-3 rounded-lg border border-primary/30 bg-primary/10 text-primary text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Поиск по названию или коду..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 h-8 text-xs bg-card border"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Subjects List */}
        <div className="bg-card border rounded-xl shadow-xs overflow-hidden">
          <div className="p-3.5 border-b flex items-center justify-between">
            <h2 className="font-bold text-foreground flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" /> Список дисциплин
            </h2>
            <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
              {filteredSubjects.length} шт.
            </Badge>
          </div>

          <div className="divide-y max-h-[500px] overflow-y-auto">
            {filteredSubjects.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground italic">
                Дисциплины не найдены
              </div>
            ) : (
              filteredSubjects.map((s) => (
                <div key={s.id} className="p-3 flex items-center justify-between gap-2 hover:bg-muted/20 transition-colors group">
                  <div className="min-w-0">
                    <div className="font-semibold text-foreground truncate">{s.name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {s.code && (
                        <span className="text-[10px] font-mono text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                          {s.code}
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" /> {s.groupsCount} групп
                      </span>
                    </div>
                    {s.description && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{s.description}</p>
                    )}
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="xs"
                        variant="outline"
                        className="h-6 px-2 text-[10px] gap-1 text-primary border-primary/30 hover:bg-primary/10"
                        onClick={() => {
                          setAssignSubjectId(s.id);
                          setAssignGroupId(groups[0]?.id || "");
                          setAssignTeacherId(teachers[0]?.id || "");
                        }}
                        title="Привязать к группе"
                      >
                        <Link2 className="h-3 w-3" /> Привязать
                      </Button>
                      <button
                        type="button"
                        onClick={() => { setEditTarget(s); setEditName(s.name); setEditCode(s.code || ""); setEditDesc(s.description || ""); }}
                        className="p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(s)}
                        className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Bindings List */}
        <div className="bg-card border rounded-xl shadow-xs overflow-hidden">
          <div className="p-3.5 border-b flex items-center justify-between">
            <h2 className="font-bold text-foreground flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-primary" /> Привязки к группам
            </h2>
            <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
              {bindings.length} шт.
            </Badge>
          </div>

          <div className="divide-y max-h-[500px] overflow-y-auto">
            {bindings.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground italic">
                Нет привязок
              </div>
            ) : (
              bindings.map((b) => (
                <div key={b.id} className="p-3 flex items-center justify-between gap-2 hover:bg-muted/20 transition-colors group">
                  <div className="min-w-0 space-y-0.5">
                    <div className="font-semibold text-foreground truncate">{b.subjectName}</div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] border-primary/30 text-primary font-medium">
                        {b.groupName}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Award className="h-3 w-3" /> {b.teacherName}
                      </span>
                    </div>
                  </div>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setRemoveBindingTarget(b)}
                      className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                      title="Удалить привязку"
                    >
                      <Unlink className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal: Create Subject */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="p-4 gap-3 text-xs sm:max-w-[420px]">
          <DialogHeader className="pb-2 border-b gap-1 text-left">
            <DialogTitle className="flex items-center gap-2 text-sm font-bold">
              <Plus className="h-4 w-4 text-primary" /> Создать дисциплину
            </DialogTitle>
            <DialogDescription className="text-xs">Новый учебный предмет для привязки к группам</DialogDescription>
          </DialogHeader>
          <div className="space-y-2.5 py-1">
            <div className="space-y-1">
              <label className="font-medium text-foreground text-xs">Название *</label>
              <Input placeholder="Например: Математика" value={newName} onChange={(e) => setNewName(e.target.value)} className="h-8 text-xs bg-background" />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-foreground text-xs">Код (необязательно)</label>
              <Input placeholder="Например: MATH-101" value={newCode} onChange={(e) => setNewCode(e.target.value)} className="h-8 text-xs bg-background font-mono" />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-foreground text-xs">Описание</label>
              <Input placeholder="Краткое описание дисциплины..." value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="h-8 text-xs bg-background" />
            </div>
          </div>
          <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
            <Button variant="outline" size="xs" onClick={() => setIsCreateOpen(false)}>Отмена</Button>
            <Button size="xs" disabled={isPending} onClick={handleCreate}>Создать</Button>
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
                <label className="font-medium text-foreground text-xs">Название *</label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8 text-xs bg-background" />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-foreground text-xs">Код</label>
                <Input value={editCode} onChange={(e) => setEditCode(e.target.value)} className="h-8 text-xs bg-background font-mono" />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-foreground text-xs">Описание</label>
                <Input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="h-8 text-xs bg-background" />
              </div>
            </div>
            <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
              <Button variant="outline" size="xs" onClick={() => setEditTarget(null)}>Отмена</Button>
              <Button size="xs" disabled={isPending} onClick={handleUpdate}>Сохранить</Button>
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
                Вы удаляете «{deleteTarget.name}». Все привязки к группам будут также удалены (каскадно).
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
              <Button variant="outline" size="xs" onClick={() => setDeleteTarget(null)}>Отмена</Button>
              <Button variant="destructive" size="xs" disabled={isPending} onClick={handleDelete}>Удалить</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>

      {/* Modal: Assign to Group */}
      <Dialog open={assignSubjectId !== null} onOpenChange={(open) => !open && setAssignSubjectId(null)}>
        {assignSubjectId && (
          <DialogContent className="p-4 gap-3 text-xs sm:max-w-[420px]">
            <DialogHeader className="pb-2 border-b gap-1 text-left">
              <DialogTitle className="flex items-center gap-2 text-sm font-bold">
                <Link2 className="h-4 w-4 text-primary" /> Привязать к группе
              </DialogTitle>
              <DialogDescription className="text-xs">
                «{subjects.find((s) => s.id === assignSubjectId)?.name}»
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2.5 py-1">
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
                      <SelectItem key={t.id} value={t.id} className="text-xs">{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
              <Button variant="outline" size="xs" onClick={() => setAssignSubjectId(null)}>Отмена</Button>
              <Button size="xs" disabled={isPending} onClick={handleAssign}>Привязать</Button>
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
                <Unlink className="h-4 w-4 text-destructive" /> Удалить привязку?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
                Убрать «{removeBindingTarget.subjectName}» из группы {removeBindingTarget.groupName}? Главы, материалы и задания в рамках этой связи будут удалены.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
              <Button variant="outline" size="xs" onClick={() => setRemoveBindingTarget(null)}>Отмена</Button>
              <Button variant="destructive" size="xs" disabled={isPending} onClick={handleRemoveBinding}>Удалить</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>
    </div>
  );
}
