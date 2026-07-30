"use client";

import React, { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Users,
  UserCheck,
  GraduationCap,
  BookOpen,
  ClipboardCheck,
  Clock,
  Plus,
  Search,
  Trash2,
  AlertTriangle,
  Loader2,
  ChevronRight,
  ShieldCheck,
  UserCheck2,
  Building2,
  FileText,
  Megaphone,
} from "lucide-react";
import { createGroupAction, deleteGroupAction, GroupDTO } from "../actions";

interface GroupsViewProps {
  userRole: "ADMIN" | "TEACHER" | "STUDENT";
  initialGroups?: GroupDTO[];
}

const DEMO_STUDENTS = [
  { id: "s-1", name: "Петров Алексей Сергеевич", role: "MONITOR", phone: "+996 555 12-34-56", email: "petrov@lyceum.edu" },
  { id: "s-2", name: "Сидорова Анна Владимировна", role: "DEPUTY_MONITOR", phone: "+996 700 98-76-54", email: "sidorova@lyceum.edu" },
  { id: "s-3", name: "Иванов Дмитрий Игоревич", role: "STUDENT", phone: "+996 777 45-67-89", email: "ivanov@lyceum.edu" },
  { id: "s-4", name: "Ковалева Мария Андреевна", role: "STUDENT", phone: "+996 500 11-22-33", email: "kovaleva@lyceum.edu" },
  { id: "s-5", name: "Морозов Артём Викторович", role: "STUDENT", phone: "+996 550 33-44-55", email: "morozov@lyceum.edu" },
];

export function GroupsView({ userRole, initialGroups = [] }: GroupsViewProps) {
  const [groups, setGroups] = useState<GroupDTO[]>(initialGroups);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<number | "ALL">("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<GroupDTO | null>(null);
  const [activeTab, setActiveTab] = useState<"STUDENTS" | "SUBJECTS" | "DUTY">("STUDENTS");
  const [isPending, startTransition] = useTransition();

  const isAdmin = userRole === "ADMIN";

  // Filter groups
  const filteredGroups = groups.filter((g) => {
    const matchesSearch =
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.curatorName && g.curatorName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCourse = selectedCourseFilter === "ALL" || g.course === selectedCourseFilter;

    return matchesSearch && matchesCourse;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    const nameVal = newGroupName.trim();

    const createdItem: GroupDTO = {
      id: `grp-${Date.now()}`,
      name: nameVal,
      course: 1,
      specialty: "Информационные системы и программирование",
      studentCount: 0,
      curatorName: "Не назначен",
      academicYear: "2025-2026",
      createdAt: new Date().toLocaleDateString("ru-RU"),
    };

    setGroups([createdItem, ...groups]);
    setNewGroupName("");
    setIsCreateOpen(false);

    startTransition(async () => {
      await createGroupAction({ name: nameVal });
    });
  };

  const confirmDeleteGroup = () => {
    if (!deletingGroupId) return;

    const targetId = deletingGroupId;
    setGroups((prev) => prev.filter((g) => g.id !== targetId));
    setDeletingGroupId(null);

    startTransition(async () => {
      await deleteGroupAction(targetId);
    });
  };

  return (
    <div className="w-full space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Учебные группы</h1>
          <p className="text-sm text-muted-foreground">
            Управление группами лицея, составом студентов, старостами и расписанием
          </p>
        </div>

        {isAdmin && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger render={<Button size="sm" />}>
              <Plus className="h-4 w-4 mr-1.5" /> Создать новую группу
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px]">
              <form onSubmit={handleCreateSubmit}>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-base">
                    <Users className="h-5 w-5 text-primary" />
                    Новая учебная группа
                  </DialogTitle>
                  <DialogDescription>
                    Введите название новой группы (например: ИС-1-25)
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Название группы *</label>
                    <Input
                      placeholder="Например: ИС-1-25"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <DialogFooter>
                  <DialogClose render={<Button variant="outline" type="button" />}>
                    Отмена
                  </DialogClose>
                  <Button type="submit" disabled={isPending}>
                    {isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                    Создать группу
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Delete Group Alert Dialog */}
      <AlertDialog open={!!deletingGroupId} onOpenChange={(open) => !open && setDeletingGroupId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Удалить группу?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Вы действительно хотите удалить эту учебную группу? Все привязанные данные будут откреплены.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDeleteGroup}>
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Course Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Button
            size="xs"
            variant={selectedCourseFilter === "ALL" ? "default" : "outline"}
            onClick={() => setSelectedCourseFilter("ALL")}
          >
            Все группы ({groups.length})
          </Button>
          <Button
            size="xs"
            variant={selectedCourseFilter === 1 ? "default" : "outline"}
            onClick={() => setSelectedCourseFilter(1)}
          >
            1 Курс
          </Button>
          <Button
            size="xs"
            variant={selectedCourseFilter === 2 ? "default" : "outline"}
            onClick={() => setSelectedCourseFilter(2)}
          >
            2 Курс
          </Button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Поиск по названию или куратору..."
            className="pl-9 h-9 text-xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGroups.map((group) => (
          <Card
            key={group.id}
            className="border shadow-none hover:border-primary/50 transition-all cursor-pointer group"
            onClick={() => setSelectedGroup(group)}
          >
            <CardHeader className="pb-3 border-b">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                      {group.name}
                    </CardTitle>
                    <Badge variant="secondary" className="text-[10px]">
                      {group.course} курс
                    </Badge>
                  </div>
                  <CardDescription className="text-xs mt-0.5 line-clamp-1">
                    {group.specialty}
                  </CardDescription>
                </div>

                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingGroupId(group.id);
                    }}
                    className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Удалить группу"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="pt-4 space-y-3 text-xs">
              {/* Stats */}
              <div className="flex items-center justify-between text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4 text-primary" />
                  <span>Студентов:</span>
                  <span className="font-semibold text-foreground">{group.studentCount}</span>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  {group.academicYear}
                </Badge>
              </div>

              {/* Leadership info */}
              <div className="space-y-1.5 pt-2 border-t text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Куратор:</span>
                  <span className="font-medium text-foreground">{group.curatorName || "Не назначен"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Староста:</span>
                  <span className="font-medium text-foreground">{group.monitorName || "Не назначен"}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end text-xs text-primary font-medium group-hover:translate-x-0.5 transition-transform">
                <span>Подробнее о группе</span>
                <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredGroups.length === 0 && (
        <Card className="border shadow-none p-12 text-center">
          <div className="flex justify-center mb-3">
            <Users className="h-10 w-10 text-muted-foreground/50" />
          </div>
          <h3 className="text-base font-semibold text-foreground">Группы не найдены</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            По вашему запросу не найдено ни одной группы. Измените параметры поиска или создайте новую группу.
          </p>
        </Card>
      )}

      {/* Group Details Modal Dialog */}
      <Dialog open={!!selectedGroup} onOpenChange={(open) => !open && setSelectedGroup(null)}>
        {selectedGroup && (
          <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-xl font-bold flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Группа {selectedGroup.name}
                  </DialogTitle>
                  <DialogDescription className="text-xs mt-0.5">
                    {selectedGroup.specialty} • {selectedGroup.course} курс • {selectedGroup.academicYear}
                  </DialogDescription>
                </div>
                <Badge className="bg-primary text-primary-foreground text-xs">
                  {selectedGroup.studentCount} студентов
                </Badge>
              </div>
            </DialogHeader>

            {/* Leadership Overview Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-md bg-muted/40 border text-xs">
              <div>
                <div className="text-[10px] text-muted-foreground uppercase font-semibold">Классный руководитель</div>
                <div className="font-semibold text-foreground mt-0.5 flex items-center gap-1.5">
                  <UserCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                  {selectedGroup.curatorName || "Иванов И.И."}
                </div>
              </div>

              <div>
                <div className="text-[10px] text-muted-foreground uppercase font-semibold">Староста группы</div>
                <div className="font-semibold text-foreground mt-0.5 flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                  {selectedGroup.monitorName || "Петров Алексей"}
                </div>
              </div>

              <div>
                <div className="text-[10px] text-muted-foreground uppercase font-semibold">Зам. старосты</div>
                <div className="font-semibold text-foreground mt-0.5 flex items-center gap-1.5">
                  <UserCheck2 className="h-3.5 w-3.5 text-primary shrink-0" />
                  {selectedGroup.deputyMonitorName || "Сидорова Анна"}
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-2 border-b pb-2">
              <Button
                size="xs"
                variant={activeTab === "STUDENTS" ? "default" : "ghost"}
                onClick={() => setActiveTab("STUDENTS")}
              >
                Студенты ({selectedGroup.studentCount || 26})
              </Button>
              <Button
                size="xs"
                variant={activeTab === "SUBJECTS" ? "default" : "ghost"}
                onClick={() => setActiveTab("SUBJECTS")}
              >
                Предметы & Преподаватели
              </Button>
              <Button
                size="xs"
                variant={activeTab === "DUTY" ? "default" : "ghost"}
                onClick={() => setActiveTab("DUTY")}
              >
                Дежурство сегодня
              </Button>
            </div>

            {/* Tab 1: Students & Leadership Roster */}
            {activeTab === "STUDENTS" && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-foreground pb-1">Список студентов группы</div>
                <div className="border rounded-md divide-y text-xs">
                  {DEMO_STUDENTS.map((student, idx) => (
                    <div key={student.id} className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground w-4 text-[11px] font-medium">{idx + 1}.</span>
                        <Avatar className="h-7 w-7 border">
                          <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
                            {student.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-foreground">{student.name}</div>
                          <div className="text-[10px] text-muted-foreground">{student.email}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {student.role === "MONITOR" && (
                          <Badge className="bg-primary text-primary-foreground text-[10px]">
                            Староста
                          </Badge>
                        )}
                        {student.role === "DEPUTY_MONITOR" && (
                          <Badge variant="secondary" className="text-[10px]">
                            Зам. старосты
                          </Badge>
                        )}
                        {student.role === "STUDENT" && (
                          <Badge variant="outline" className="text-[10px]">
                            Студент
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 2: Subjects & Teachers */}
            {activeTab === "SUBJECTS" && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-foreground pb-1">Изучаемые дисциплины</div>
                <div className="border rounded-md divide-y text-xs">
                  <div className="p-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-foreground">Веб-программирование</div>
                      <div className="text-muted-foreground text-[11px]">Преподаватель: Иванов И.И.</div>
                    </div>
                    <Badge variant="outline" className="text-[10px]">4 часа в неделю</Badge>
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-foreground">Базы данных (PostgreSQL / SQL)</div>
                      <div className="text-muted-foreground text-[11px]">Преподаватель: Сидоров А.П.</div>
                    </div>
                    <Badge variant="outline" className="text-[10px]">3 часа в неделю</Badge>
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-foreground">Объектно-ориентированное программирование</div>
                      <div className="text-muted-foreground text-[11px]">Преподаватель: Абдуллаева Г.Т.</div>
                    </div>
                    <Badge variant="outline" className="text-[10px]">4 часа в неделю</Badge>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Duty Roster */}
            {activeTab === "DUTY" && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-foreground pb-1">Сегодняшний наряд по дежурству</div>
                <div className="space-y-2 text-xs">
                  <div className="p-3 border rounded-md bg-muted/20 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-foreground">Петров Алексей Сергеевич</div>
                      <div className="text-muted-foreground text-[11px]">Старший дежурный</div>
                    </div>
                    <Badge className="bg-primary text-primary-foreground text-[10px]">Старший</Badge>
                  </div>
                  <div className="p-3 border rounded-md flex items-center justify-between">
                    <div>
                      <div className="font-medium text-foreground">Сидорова Анна Владимировна</div>
                      <div className="text-muted-foreground text-[11px]">Дежурный</div>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">Дежурный</Badge>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setSelectedGroup(null)}>
                Закрыть
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
