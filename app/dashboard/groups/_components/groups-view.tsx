"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  ChevronRight,
  Edit,
  Crown,
  UserCheck,
  LayoutGrid,
  List,
  Sparkles,
  BookOpen,
  ArrowUpRight,
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
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isAdmin = userRole === "ADMIN";

  // Filter groups
  const filteredGroups = groups.filter((g) => {
    const matchesSearch =
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.curatorName && g.curatorName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (g.specialty && g.specialty.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCourse = selectedCourseFilter === "ALL" || g.course === selectedCourseFilter;

    return matchesSearch && matchesCourse;
  });

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
    <div className="w-full space-y-4 pb-20 text-xs">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold tracking-tight text-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Учебные группы
            </h1>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-medium">
              {groups.length} всего
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Управление учебными потоками, кураторами, старостами и составами групп
          </p>
        </div>

        {isAdmin && (
          <Button size="xs" className="h-8 text-xs gap-1.5 shrink-0" render={<Link href="/dashboard/groups/new" />}>
            <Plus className="h-3.5 w-3.5" /> Создать группу
          </Button>
        )}
      </div>

      {/* Delete Group Alert Dialog */}
      <AlertDialog open={!!deletingGroupId} onOpenChange={(open) => !open && setDeletingGroupId(null)}>
        <AlertDialogContent className="p-4 gap-3 text-xs sm:max-w-[400px]">
          <AlertDialogHeader className="text-left place-items-start gap-1">
            <AlertDialogTitle className="flex items-center gap-2 text-sm font-bold text-destructive">
              <AlertTriangle className="h-4 w-4" /> Удаление группы
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Вы действительно хотите удалить эту группу? Все привязанные данные будут откреплены.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
            <AlertDialogCancel className="h-7 text-xs px-3">Отмена</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={confirmDeleteGroup}
              className="h-7 text-xs px-3"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Course Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {(["ALL", 1, 2, 3, 4] as const).map((courseVal) => {
            const isActive = selectedCourseFilter === courseVal;
            const label = courseVal === "ALL" ? `Все (${groups.length})` : `${courseVal} курс`;
            return (
              <button
                key={String(courseVal)}
                type="button"
                onClick={() => setSelectedCourseFilter(courseVal)}
                className={`px-2.5 py-1 rounded-md text-xs transition-colors font-medium whitespace-nowrap ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Controls: Search & Layout Toggle */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-60">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Поиск по названию или куратору..."
              className="pl-8 h-8 text-xs bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-0.5 p-0.5 bg-muted/60 rounded-md border shrink-0">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`p-1 rounded-sm transition-all ${
                viewMode === "table"
                  ? "bg-background text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Таблица"
            >
              <List className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-1 rounded-sm transition-all ${
                viewMode === "grid"
                  ? "bg-background text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Сетка карточек"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* TABLE VIEW */}
      {viewMode === "table" && (
        <div className="rounded-xl border overflow-hidden">
          <div className="grid grid-cols-[1.5fr_1.5fr_110px_1fr_1fr_90px] items-center gap-3 px-3 py-2 bg-muted/40 border-b text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            <span>Группа</span>
            <span>Специальность</span>
            <span>Студенты</span>
            <span>Куратор</span>
            <span>Староста</span>
            <span className="text-right">Действия</span>
          </div>

          <div className="divide-y">
            {filteredGroups.map((group) => (
              <div
                key={group.id}
                onClick={() => router.push(`/dashboard/groups/${group.id}`)}
                className="grid grid-cols-[1.5fr_1.5fr_110px_1fr_1fr_90px] items-center gap-3 px-3 py-2.5 hover:bg-muted/20 transition-colors cursor-pointer group"
              >
                {/* Group Name & Course */}
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 border border-primary/20">
                    {group.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors truncate flex items-center gap-1.5">
                      {group.name}
                      <Badge variant="outline" className="text-[9px] px-1 py-0 font-normal">
                        {group.course} курс
                      </Badge>
                    </div>
                    <div className="text-[10px] text-muted-foreground">{group.academicYear}</div>
                  </div>
                </div>

                {/* Specialty */}
                <div className="text-xs text-muted-foreground truncate">
                  {group.specialty || "Не указана"}
                </div>

                {/* Student Count */}
                <div className="flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="font-medium text-xs text-foreground">{group.studentCount}</span>
                  <span className="text-[10px] text-muted-foreground">студ.</span>
                </div>

                {/* Curator */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <UserCheck className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className={`text-xs truncate ${group.curatorName ? "text-foreground font-medium" : "text-muted-foreground/60"}`}>
                    {group.curatorName || "Не назначен"}
                  </span>
                </div>

                {/* Monitor */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <Crown className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className={`text-xs truncate ${group.monitorName ? "text-foreground font-medium" : "text-muted-foreground/60"}`}>
                    {group.monitorName || "Не назначен"}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="h-7 w-7 text-muted-foreground hover:text-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/dashboard/groups/${group.id}`);
                    }}
                    title="Перейти к группе"
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Button>

                  {isAdmin && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="h-7 w-7 text-muted-foreground hover:text-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dashboard/groups/${group.id}/edit`);
                        }}
                        title="Редактировать"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingGroupId(group.id);
                        }}
                        title="Удалить"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GRID CARDS VIEW */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredGroups.map((group) => (
            <div
              key={group.id}
              onClick={() => router.push(`/dashboard/groups/${group.id}`)}
              className="rounded-xl border bg-card p-3.5 hover:border-primary/40 transition-all cursor-pointer space-y-3 group"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2 border-b pb-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 border border-primary/20">
                    {group.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                      <span className="truncate">{group.name}</span>
                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0 font-normal shrink-0">
                        {group.course} курс
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                      {group.specialty || "Не указана"}
                    </p>
                  </div>
                </div>

                {isAdmin && (
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="h-6 w-6 text-muted-foreground hover:text-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/dashboard/groups/${group.id}/edit`);
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingGroupId(group.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Stats & Leadership */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="flex items-center gap-1.5 text-[11px]">
                    <GraduationCap className="h-3.5 w-3.5 text-primary" />
                    Состав: <strong className="text-foreground">{group.studentCount} студ.</strong>
                  </span>
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                    {group.academicYear}
                  </Badge>
                </div>

                <div className="p-2 rounded-lg bg-muted/30 space-y-1 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <UserCheck className="h-3 w-3" /> Куратор:
                    </span>
                    <span className={`font-medium truncate max-w-[140px] ${group.curatorName ? "text-foreground" : "text-muted-foreground/60"}`}>
                      {group.curatorName || "Не назначен"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Crown className="h-3 w-3 text-primary" /> Староста:
                    </span>
                    <span className={`font-medium truncate max-w-[140px] ${group.monitorName ? "text-foreground" : "text-muted-foreground/60"}`}>
                      {group.monitorName || "Не назначен"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer Link */}
              <div className="pt-1 flex items-center justify-between text-[11px] text-primary font-medium">
                <span>Подробнее о группе</span>
                <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredGroups.length === 0 && (
        <div className="rounded-xl border p-12 text-center space-y-2">
          <Users className="h-8 w-8 mx-auto text-muted-foreground/40" />
          <h3 className="text-sm font-semibold text-foreground">Группы не найдены</h3>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            По вашему запросу не найдено ни одной группы. Сбросьте поиск или создайте новую группу.
          </p>
        </div>
      )}
    </div>
  );
}
