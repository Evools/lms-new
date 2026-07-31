"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  GraduationCap,
  Plus,
  Search,
  Trash2,
  AlertTriangle,
  Loader2,
  ChevronRight,
  Edit,
} from "lucide-react";
import { createGroupAction, deleteGroupAction, GroupDTO } from "../actions";

interface GroupsViewProps {
  userRole: "ADMIN" | "TEACHER" | "STUDENT";
  initialGroups?: GroupDTO[];
}

export function GroupsView({ userRole, initialGroups = [] }: GroupsViewProps) {
  const router = useRouter();
  const [groups, setGroups] = useState<GroupDTO[]>(initialGroups);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<number | "ALL">("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);
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
          <Button size="sm" render={<Link href="/dashboard/groups/new" />}>
            <Plus className="h-4 w-4 mr-1.5" /> Создать новую группу
          </Button>
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
          <div
            key={group.id}
            onClick={() => router.push(`/dashboard/groups/${group.id}`)}
            className="block group cursor-pointer"
          >
            <Card className="border shadow-none hover:border-primary/50 transition-all cursor-pointer h-full">
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
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        render={<Link href={`/dashboard/groups/${group.id}/edit`} />}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className="text-muted-foreground hover:text-primary"
                        title="Редактировать группу"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDeletingGroupId(group.id);
                        }}
                        className="text-muted-foreground hover:text-destructive"
                        title="Удалить группу"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
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
                    <span className={`font-medium ${group.curatorName ? "text-foreground" : "text-muted-foreground/70"}`}>
                      {group.curatorName || "Не назначен"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Староста:</span>
                    <span className={`font-medium ${group.monitorName ? "text-foreground" : "text-muted-foreground/70"}`}>
                      {group.monitorName || "Не назначен"}
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end text-xs text-primary font-medium group-hover:translate-x-0.5 transition-transform">
                  <span>Подробнее о группе</span>
                  <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </div>
              </CardContent>
            </Card>
          </div>
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
    </div>
  );
}
