"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  UserPlus,
  Users,
  Search,
  GraduationCap,
  Mail,
  Phone,
  MoreVertical,
  KeyRound,
  Copy,
  Check,
  Edit,
  Send,
  Lock,
  RotateCcw,
  X,
  Trash2,
  FileSpreadsheet,
  UserCheck,
  LayoutGrid,
  List,
  Sparkles,
  ShieldAlert,
  Building2,
} from "lucide-react";
import { deleteStudentsAction } from "../actions";

export interface StudentRegistryItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  groupName: string;
  course: number;
  enrollmentType: "Бюджет" | "Контракт";
  enrollmentDate: string;
  status: "Зачислен" | "Ожидает группы" | "Отчислен";
  accountStatus: "Активен" | "Временный пароль" | "Заблокирован";
  avgGrade: string;
  lastPasswordReset?: string;
}

interface StudentsViewProps {
  userRole: string;
  initialStudents?: StudentRegistryItem[];
}

export function StudentsView({ userRole, initialStudents = [] }: StudentsViewProps) {
  const [students, setStudents] = useState<StudentRegistryItem[]>(initialStudents);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroupFilter, setSelectedGroupFilter] = useState("Все группы");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("Все статусы");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState("Все формы");

  // View Mode: Table vs Grid Cards
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Multi-select & Bulk delete state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [deleteErrorMsg, setDeleteErrorMsg] = useState<string | null>(null);

  // Single item deletion state for dialog
  const [singleDeleteTarget, setSingleDeleteTarget] = useState<StudentRegistryItem | null>(null);

  // Filter students
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesGroup =
      selectedGroupFilter === "Все группы" ||
      s.groupName === selectedGroupFilter;

    const matchesStatus =
      selectedStatusFilter === "Все статусы" || s.status === selectedStatusFilter;

    const matchesType =
      selectedTypeFilter === "Все формы" || s.enrollmentType === selectedTypeFilter;

    return matchesSearch && matchesGroup && matchesStatus && matchesType;
  });

  const isAllSelected =
    filteredStudents.length > 0 &&
    filteredStudents.every((s) => selectedIds.includes(s.id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredStudents.map((s) => s.id));
    }
  };

  const handleToggleSelectStudent = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleConfirmBulkDelete = async () => {
    const targets = singleDeleteTarget ? [singleDeleteTarget.id] : selectedIds;
    if (targets.length === 0) return;

    setIsDeleting(true);
    setDeleteErrorMsg(null);

    const res = await deleteStudentsAction(targets);
    setIsDeleting(false);

    if (res.success) {
      setStudents((prev) => prev.filter((s) => !targets.includes(s.id)));
      if (singleDeleteTarget) {
        setSingleDeleteTarget(null);
      } else {
        setSelectedIds([]);
        setIsConfirmDeleteDialogOpen(false);
      }
    } else {
      setDeleteErrorMsg(res.error || "Ошибка при удалении из базы данных");
    }
  };

  const isAdminOrTeacher = userRole === "ADMIN" || userRole === "TEACHER";

  // Reset Password Dialog State
  const [resetTargetStudent, setResetTargetStudent] = useState<StudentRegistryItem | null>(null);
  const [generatedNewPassword, setGeneratedNewPassword] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  const generateRandomPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$";
    let pass = "Lms";
    for (let i = 0; i < 6; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  const handleOpenResetPassword = (student: StudentRegistryItem) => {
    setResetTargetStudent(student);
    setGeneratedNewPassword(generateRandomPassword());
    setIsCopied(false);
  };

  const handleCopyPassword = () => {
    if (generatedNewPassword) {
      navigator.clipboard.writeText(generatedNewPassword);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleConfirmPasswordReset = () => {
    if (!resetTargetStudent) return;
    setStudents((prev) =>
      prev.map((s) =>
        s.id === resetTargetStudent.id
          ? {
              ...s,
              accountStatus: "Временный пароль",
              lastPasswordReset: new Date().toLocaleDateString("ru-RU"),
            }
          : s
      )
    );
    setResetTargetStudent(null);
  };

  const isAnyFilterActive =
    searchQuery.trim() !== "" ||
    selectedGroupFilter !== "Все группы" ||
    selectedStatusFilter !== "Все статусы" ||
    selectedTypeFilter !== "Все формы";

  const handleResetAllFilters = () => {
    setSearchQuery("");
    setSelectedGroupFilter("Все группы");
    setSelectedStatusFilter("Все статусы");
    setSelectedTypeFilter("Все формы");
  };

  const totalStudentsCount = students.length;
  const activeCount = students.filter((s) => s.accountStatus === "Активен").length;
  const tempPassCount = students.filter((s) => s.accountStatus === "Временный пароль").length;
  const groupsCount = new Set(students.map((s) => s.groupName)).size;

  return (
    <div className="w-full space-y-4 pb-20 text-xs">
      {/* Top Header Bar - Compact */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Студенты и зачисление
            </h1>
            <Badge variant="secondary" className="font-mono text-[10px] px-2 py-0">
              Всего: {totalStudentsCount}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Управление личными карточками, зачислением в группы и аккаунтами учащихся
          </p>
        </div>

        {isAdminOrTeacher && (
          <div className="flex items-center gap-2">
            <Button size="xs" variant="outline" className="h-8 text-xs gap-1.5" render={<Link href="/dashboard/students/new" />}>
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" /> Импорт из Excel
            </Button>
            <Button size="xs" className="h-8 text-xs gap-1.5" render={<Link href="/dashboard/students/new" />}>
              <UserPlus className="h-3.5 w-3.5" /> Зарегистрировать студента
            </Button>
          </div>
        )}
      </div>

      {/* KPI Stats Overview Cards - Pure Shadcn Style */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="shadow-none border">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 pt-3 px-3.5 space-y-0">
            <span className="text-xs font-medium text-muted-foreground">
              Всего зачислено
            </span>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-3 px-3.5 pt-0">
            <div className="text-lg font-bold tracking-tight text-foreground">
              {totalStudentsCount} учащихся
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Учетные записи в базе Лицея
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-none border">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 pt-3 px-3.5 space-y-0">
            <span className="text-xs font-medium text-muted-foreground">
              Активные аккаунты
            </span>
            <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent className="pb-3 px-3.5 pt-0">
            <div className="text-lg font-bold tracking-tight text-foreground">
              {activeCount} аккаунтов
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Подтвержденный вход в систему
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-none border">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 pt-3 px-3.5 space-y-0">
            <span className="text-xs font-medium text-muted-foreground">
              Временные пароли
            </span>
            <KeyRound className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent className="pb-3 px-3.5 pt-0">
            <div className="text-lg font-bold tracking-tight text-foreground">
              {tempPassCount} аккаунтов
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Ожидают смены первого пароля
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Compact Filters Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 bg-muted/20 p-2.5 rounded-xl border">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Поиск по ФИО, email или телефону..."
            className="pl-8 pr-7 h-8 text-xs bg-background"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Group Filter */}
          <Select value={selectedGroupFilter} onValueChange={(val) => val && setSelectedGroupFilter(val)}>
            <SelectTrigger className="h-8 text-xs w-36 bg-background">
              <SelectValue placeholder="Все группы">{selectedGroupFilter}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Все группы">Все группы</SelectItem>
              <SelectItem value="ИС-1-25">ИС-1-25</SelectItem>
              <SelectItem value="ИС-2-24">ИС-2-24</SelectItem>
              <SelectItem value="ПО-1-25">ПО-1-25</SelectItem>
              <SelectItem value="Не распределен">Не распределены</SelectItem>
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={selectedStatusFilter} onValueChange={(val) => val && setSelectedStatusFilter(val)}>
            <SelectTrigger className="h-8 text-xs w-32 bg-background">
              <SelectValue placeholder="Все статусы">{selectedStatusFilter}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Все статусы">Все статусы</SelectItem>
              <SelectItem value="Зачислен">Зачислен</SelectItem>
              <SelectItem value="Ожидает группы">Ожидает группы</SelectItem>
            </SelectContent>
          </Select>

          {/* Financing Filter */}
          <Select value={selectedTypeFilter} onValueChange={(val) => val && setSelectedTypeFilter(val)}>
            <SelectTrigger className="h-8 text-xs w-28 bg-background">
              <SelectValue placeholder="Все формы">{selectedTypeFilter}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Все формы">Все формы</SelectItem>
              <SelectItem value="Бюджет">Бюджет</SelectItem>
              <SelectItem value="Контракт">Контракт</SelectItem>
            </SelectContent>
          </Select>

          {isAnyFilterActive && (
            <Button
              size="xs"
              variant="outline"
              onClick={handleResetAllFilters}
              className="h-8 text-[11px] px-2 text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3 w-3 mr-1" /> Сброс
            </Button>
          )}

          {/* View Mode Switcher */}
          <div className="flex items-center bg-muted/40 p-0.5 rounded-lg border ml-auto sm:ml-0">
            <Button
              size="xs"
              variant={viewMode === "table" ? "default" : "ghost"}
              onClick={() => setViewMode("table")}
              className="h-7 px-2 gap-1 text-[11px]"
            >
              <List className="h-3 w-3" /> Таблица
            </Button>
            <Button
              size="xs"
              variant={viewMode === "grid" ? "default" : "ghost"}
              onClick={() => setViewMode("grid")}
              className="h-7 px-2 gap-1 text-[11px]"
            >
              <LayoutGrid className="h-3 w-3" /> Карточки
            </Button>
          </div>
        </div>
      </div>

      {/* Content: Table View vs Grid Cards View */}
      {viewMode === "table" ? (
        <Card className="border shadow-none overflow-hidden">
          <CardHeader className="py-2.5 px-4 border-b">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                {isAdminOrTeacher && filteredStudents.length > 0 && (
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleToggleSelectAll}
                    aria-label="Выбрать всех"
                  />
                )}
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Приказная ведомость студентов
                </CardTitle>
              </div>

              <Badge variant="outline" className="text-[10px]">
                Записей: {filteredStudents.length}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="divide-y text-xs">
              {filteredStudents.map((st, idx) => (
                <div
                  key={st.id}
                  className={`p-3 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 hover:bg-muted/20 transition-colors ${
                    selectedIds.includes(st.id) ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {isAdminOrTeacher && (
                      <Checkbox
                        checked={selectedIds.includes(st.id)}
                        onCheckedChange={() => handleToggleSelectStudent(st.id)}
                      />
                    )}
                    <span className="text-muted-foreground w-5 text-[11px] font-semibold text-center">{idx + 1}.</span>
                    <Avatar className="h-8 w-8 border shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-[11px]">
                        {st.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="font-semibold text-foreground text-xs flex items-center gap-1.5 flex-wrap">
                        <Link href={`/dashboard/students/${st.id}/edit`} className="hover:underline hover:text-primary transition-colors truncate">
                          {st.name}
                        </Link>
                        <Badge
                          variant={st.enrollmentType === "Бюджет" ? "default" : "secondary"}
                          className="text-[9px] px-1.5 py-0"
                        >
                          {st.enrollmentType}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={
                            st.accountStatus === "Активен"
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 text-[9px] px-1.5 py-0"
                              : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 text-[9px] px-1.5 py-0"
                          }
                        >
                          <Lock className="h-2.5 w-2.5 mr-0.5" />
                          {st.accountStatus}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-muted-foreground text-[11px] mt-0.5">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {st.email}
                        </span>
                        {st.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {st.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 pl-8 lg:pl-0 shrink-0">
                    <div className="text-right">
                      <div className="text-[10px] text-muted-foreground">Группа</div>
                      <Badge variant="outline" className="text-[11px] font-medium px-1.5 py-0">
                        {st.groupName}
                      </Badge>
                    </div>

                    <div className="text-right hidden sm:block">
                      <div className="text-[10px] text-muted-foreground">Зачислен</div>
                      <div className="font-medium text-foreground text-[11px]">{st.enrollmentDate}</div>
                    </div>

                    {isAdminOrTeacher && (
                      <div className="flex items-center gap-1">
                        <Button
                          size="xs"
                          variant="outline"
                          render={<Link href={`/dashboard/students/${st.id}/edit`} />}
                          className="text-[11px] h-7 px-2"
                        >
                          <Edit className="h-3 w-3 mr-1 text-primary" /> Изменить
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" className="h-7 w-7 text-muted-foreground" />}>
                            <MoreVertical className="h-3.5 w-3.5" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuGroup>
                              <DropdownMenuLabel>Действия с аккаунтом</DropdownMenuLabel>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem render={<Link href={`/dashboard/students/${st.id}/edit`} />}>
                              <Edit className="h-3.5 w-3.5 mr-2 text-primary" /> Редактировать данные
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenResetPassword(st)}>
                              <KeyRound className="h-3.5 w-3.5 mr-2 text-amber-500" /> Сбросить пароль
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setSingleDeleteTarget(st)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-2" /> Удалить из БД
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {filteredStudents.length === 0 && (
                <div className="p-8 text-center text-muted-foreground text-xs space-y-2">
                  <Users className="h-7 w-7 mx-auto text-muted-foreground/40" />
                  <div>Студенты не найдены</div>
                  {isAnyFilterActive && (
                    <Button size="xs" variant="outline" onClick={handleResetAllFilters} className="mt-1 text-xs">
                      Сбросить фильтры
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Grid Cards View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredStudents.map((st) => (
            <Card
              key={st.id}
              className={`border shadow-none hover:border-primary/40 transition-all ${
                selectedIds.includes(st.id) ? "border-primary/60 bg-primary/5" : ""
              }`}
            >
              <CardContent className="p-3 space-y-2.5 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {isAdminOrTeacher && (
                      <Checkbox
                        checked={selectedIds.includes(st.id)}
                        onCheckedChange={() => handleToggleSelectStudent(st.id)}
                      />
                    )}
                    <Avatar className="h-8 w-8 border shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-[11px]">
                        {st.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <Link
                        href={`/dashboard/students/${st.id}/edit`}
                        className="font-bold text-xs text-foreground hover:underline hover:text-primary transition-colors line-clamp-1"
                      >
                        {st.name}
                      </Link>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                        <Mail className="h-3 w-3" /> {st.email}
                      </p>
                    </div>
                  </div>

                  <Badge variant="outline" className="text-[10px] font-semibold shrink-0">
                    {st.groupName}
                  </Badge>
                </div>

                <div className="pt-2 border-t space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Форма обучения:</span>
                    <Badge variant={st.enrollmentType === "Бюджет" ? "default" : "secondary"} className="text-[9px] px-1.5 py-0">
                      {st.enrollmentType}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Статус аккаунта:</span>
                    <Badge
                      variant="outline"
                      className={
                        st.accountStatus === "Активен"
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 text-[9px] px-1.5 py-0"
                          : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 text-[9px] px-1.5 py-0"
                      }
                    >
                      <Lock className="h-2.5 w-2.5 mr-0.5" />
                      {st.accountStatus}
                    </Badge>
                  </div>

                  {st.phone && (
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Телефон:</span>
                      <span className="font-medium text-foreground">{st.phone}</span>
                    </div>
                  )}
                </div>

                {isAdminOrTeacher && (
                  <div className="pt-2 border-t flex items-center justify-between gap-1.5">
                    <Button
                      size="xs"
                      variant="outline"
                      render={<Link href={`/dashboard/students/${st.id}/edit`} />}
                      className="flex-1 text-[11px] h-7"
                    >
                      <Edit className="h-3 w-3 mr-1" /> Изменить
                    </Button>

                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => handleOpenResetPassword(st)}
                      className="text-[11px] h-7 text-amber-600 hover:text-amber-700"
                    >
                      <KeyRound className="h-3 w-3 mr-1" /> Пароль
                    </Button>

                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => setSingleDeleteTarget(st)}
                      className="h-7 w-7 text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Floating Sticky Dock for Bulk Selection Actions */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-card border shadow-xl rounded-xl px-4 py-2 flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-200">
          <Badge variant="secondary" className="font-mono text-[11px] px-2 py-0.5">
            Выбрано: {selectedIds.length} чел.
          </Badge>

          <Button
            size="xs"
            variant="destructive"
            onClick={() => setIsConfirmDeleteDialogOpen(true)}
            disabled={isDeleting}
            className="gap-1.5 h-7 text-xs"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {isDeleting ? "Удаление..." : `Удалить из БД (${selectedIds.length})`}
          </Button>

          <Button
            size="xs"
            variant="ghost"
            onClick={() => setSelectedIds([])}
            className="text-[11px] h-7 text-muted-foreground hover:text-foreground"
          >
            Снять выбор
          </Button>
        </div>
      )}

      {/* Dialog for Resetting Password */}
      <Dialog open={resetTargetStudent !== null} onOpenChange={(open) => !open && setResetTargetStudent(null)}>
        {resetTargetStudent && (
          <DialogContent className="sm:max-w-[420px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <KeyRound className="h-4.5 w-4.5 text-primary" /> Сброс пароля студента
              </DialogTitle>
              <DialogDescription className="text-xs">
                Новый временный пароль для <strong>{resetTargetStudent.name}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="p-2.5 rounded-lg border bg-muted/20 space-y-1.5">
                <div className="text-[10px] text-muted-foreground">Временный пароль:</div>
                <div className="flex items-center justify-between bg-background p-2 rounded border">
                  <span className="font-mono text-xs font-bold text-primary">
                    {generatedNewPassword}
                  </span>
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={handleCopyPassword}
                    className="h-6 text-[10px]"
                  >
                    {isCopied ? (
                      <>
                        <Check className="h-3 w-3 mr-1 text-emerald-600" /> Скопировано!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 mr-1" /> Скопировать
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="p-2.5 rounded-lg border bg-primary/5 text-muted-foreground text-[11px] space-y-1">
                <div className="font-semibold text-foreground flex items-center gap-1">
                  <Send className="h-3 w-3 text-primary" /> Логин: {resetTargetStudent.email}
                </div>
                <p>При первом входе будет предложено задать собственный пароль.</p>
              </div>
            </div>

            <DialogFooter>
              <DialogClose render={<Button variant="outline" size="xs" />}>
                Отмена
              </DialogClose>
              <Button size="xs" onClick={handleConfirmPasswordReset}>
                Подтвердить сброс
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Shadcn AlertDialog for Bulk or Single Delete Confirmation */}
      <AlertDialog
        open={isConfirmDeleteDialogOpen || singleDeleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setIsConfirmDeleteDialogOpen(false);
            setSingleDeleteTarget(null);
          }
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" /> Подтверждение удаления
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              {singleDeleteTarget ? (
                <>
                  Вы действительно хотите безвозвратно удалить студента <strong>{singleDeleteTarget.name}</strong> из системы и базы данных?
                </>
              ) : (
                <>
                  Вы действительно хотите безвозвратно удалить выбранных студентов (
                  <strong>{selectedIds.length} чел.</strong>) из системы и базы данных?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {deleteErrorMsg && (
            <div className="text-xs text-destructive bg-destructive/10 p-2.5 rounded border border-destructive/20">
              {deleteErrorMsg}
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} size="sm">
              Отмена
            </AlertDialogCancel>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmBulkDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Удаление..." : "Удалить из БД"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
