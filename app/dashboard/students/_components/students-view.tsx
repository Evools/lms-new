"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
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
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
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
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { deleteStudentsAction } from "../actions";

export interface StudentRegistryItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  role?: "STUDENT" | "TEACHER" | "ADMIN";
  groupName: string;
  course: number;
  enrollmentType: "Бюджет" | "Контракт";
  enrollmentDate: string;
  status: "Зачислен" | "Ожидает группы" | "Отчислен";
  accountStatus: "Активен" | "Временный пароль" | "Заблокирован";
  avgGrade: string;
  lastPasswordReset?: string;
}

export interface DBGroupItem {
  id: string;
  name: string;
  course: number;
}

interface StudentsViewProps {
  userRole: string;
  initialStudents?: StudentRegistryItem[];
  dbGroups?: DBGroupItem[];
}

export function StudentsView({ userRole, initialStudents = [], dbGroups = [] }: StudentsViewProps) {
  const [students, setStudents] = useState<StudentRegistryItem[]>(initialStudents);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroupFilter, setSelectedGroupFilter] = useState("Все группы");

  const filterGroupNames = Array.from(
    new Set([
      ...dbGroups.map((g) => g.name),
      ...students.map((s) => s.groupName).filter(Boolean),
    ])
  ).sort();

  const [selectedStatusFilter, setSelectedStatusFilter] = useState("Все статусы");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState("Все формы");

  // Multi-select & Bulk delete state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [deleteErrorMsg, setDeleteErrorMsg] = useState<string | null>(null);

  // Single item deletion state for dialog
  const [singleDeleteTarget, setSingleDeleteTarget] = useState<StudentRegistryItem | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Reset page to 1 when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedGroupFilter, selectedStatusFilter, selectedTypeFilter, pageSize]);

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

  const totalPages = Math.ceil(filteredStudents.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + pageSize);

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

  return (
    <div className="w-full space-y-4 pb-20 text-xs">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold tracking-tight text-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Студенты и зачисление
            </h1>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-medium">
              {totalStudentsCount} всего
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Управление реестром учащихся, группами и учетными записями
          </p>
        </div>

        {isAdminOrTeacher && (
          <div className="flex items-center gap-2 shrink-0">
            <Button size="xs" variant="outline" className="h-8 text-xs gap-1.5" render={<Link href="/dashboard/students/new" />}>
              <FileSpreadsheet className="h-3.5 w-3.5 text-primary" /> Импорт из Excel
            </Button>
            <Button size="xs" className="h-8 text-xs gap-1.5" render={<Link href="/dashboard/students/new" />}>
              <UserPlus className="h-3.5 w-3.5" /> Добавить студента
            </Button>
          </div>
        )}
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border bg-card p-3 flex items-center justify-between shadow-2xs">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Всего зачислено</span>
            <div className="text-base font-bold text-foreground">{totalStudentsCount} чел.</div>
          </div>
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <GraduationCap className="h-3.5 w-3.5" />
          </div>
        </div>

        <div className="rounded-xl border bg-card p-3 flex items-center justify-between shadow-2xs">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Активные аккаунты</span>
            <div className="text-base font-bold text-foreground">{activeCount} чел.</div>
          </div>
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <UserCheck className="h-3.5 w-3.5" />
          </div>
        </div>

        <div className="rounded-xl border bg-card p-3 flex items-center justify-between shadow-2xs">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Временные пароли</span>
            <div className="text-base font-bold text-foreground">{tempPassCount} чел.</div>
          </div>
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <KeyRound className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>

      {/* Filters Toolbar & View Toggle */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 bg-muted/20 p-2 rounded-xl border">
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
              <SelectValue>{selectedGroupFilter}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Все группы">Все группы</SelectItem>
              {filterGroupNames.map((gName) => (
                <SelectItem key={gName} value={gName}>
                  {gName}
                </SelectItem>
              ))}
              <SelectItem value="Не распределен">Не распределены</SelectItem>
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={selectedStatusFilter} onValueChange={(val) => val && setSelectedStatusFilter(val)}>
            <SelectTrigger className="h-8 text-xs w-32 bg-background">
              <SelectValue>{selectedStatusFilter}</SelectValue>
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
              <SelectValue>{selectedTypeFilter}</SelectValue>
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
        </div>
      </div>

      {/* Main Content: Table View */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="border-b overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/40 border-b text-[11px] font-semibold text-muted-foreground">
              <tr>
                {isAdminOrTeacher && (
                  <th className="py-2.5 px-3 text-center w-8">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleToggleSelectAll}
                      aria-label="Выбрать всех"
                    />
                  </th>
                )}
                <th className="py-2.5 px-2.5 text-center w-8">№</th>
                <th className="py-2.5 px-3 min-w-[200px]">Студент</th>
                <th className="py-2.5 px-3 min-w-[100px]">Группа</th>
                <th className="py-2.5 px-3 min-w-[100px]">Форма</th>
                <th className="py-2.5 px-3 min-w-[120px]">Телефон</th>
                <th className="py-2.5 px-3 min-w-[120px]">Статус</th>
                {isAdminOrTeacher && <th className="py-2.5 px-3 text-right min-w-[90px]"></th>}
              </tr>
            </thead>
            <tbody className="divide-y text-xs">
              {paginatedStudents.map((st, idx) => (
                <tr
                  key={st.id}
                  className={`hover:bg-muted/20 transition-colors ${
                    selectedIds.includes(st.id) ? "bg-primary/5" : ""
                  }`}
                >
                  {isAdminOrTeacher && (
                    <td className="py-2.5 px-3 text-center">
                      <Checkbox
                        checked={selectedIds.includes(st.id)}
                        onCheckedChange={() => handleToggleSelectStudent(st.id)}
                      />
                    </td>
                  )}
                  <td className="py-2.5 px-2.5 text-center text-muted-foreground font-mono text-[10px]">{startIndex + idx + 1}</td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar className="h-6 w-6 border shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-[9px]">
                          {st.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <Link href={`/dashboard/students/${st.id}/edit`} className="font-semibold text-xs text-foreground hover:underline hover:text-primary transition-colors block truncate">
                          {st.name}
                        </Link>
                        <div className="text-[10px] text-muted-foreground font-mono truncate">{st.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <Badge variant="outline" className="text-[9px] font-medium px-1.5 py-0">
                      {st.groupName}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-3">
                    <Badge
                      variant={st.enrollmentType === "Бюджет" ? "default" : "secondary"}
                      className="text-[9px] px-1.5 py-0 font-medium"
                    >
                      {st.enrollmentType}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground">
                    {st.phone || "—"}
                  </td>
                  <td className="py-2.5 px-3">
                    <Badge
                      variant="outline"
                      className={
                        st.accountStatus === "Активен"
                          ? "bg-primary/10 text-primary border-primary/20 text-[9px] px-1.5 py-0 font-medium"
                          : "bg-muted text-muted-foreground text-[9px] px-1.5 py-0 font-medium"
                      }
                    >
                      {st.accountStatus}
                    </Badge>
                  </td>
                  {isAdminOrTeacher && (
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon-xs"
                          variant="ghost"
                          render={<Link href={`/dashboard/students/${st.id}/edit`} />}
                          className="h-6 w-6 text-muted-foreground hover:text-primary"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" className="h-6 w-6 text-muted-foreground" />}>
                            <MoreVertical className="h-3 w-3" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuGroup>
                              <DropdownMenuLabel>Управление аккаунтом</DropdownMenuLabel>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem render={<Link href={`/dashboard/students/${st.id}/edit`} />}>
                              <Edit className="h-3.5 w-3.5 mr-2 text-primary" /> Редактировать данные
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenResetPassword(st)}>
                              <KeyRound className="h-3.5 w-3.5 mr-2 text-primary" /> Сбросить пароль
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setSingleDeleteTarget(st)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-2" /> Удалить из базы
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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

      {/* Pagination Controls Footer */}
      {filteredStudents.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 px-1 border-t text-xs text-muted-foreground">
          <div className="flex items-center gap-3 flex-wrap">
            <span>
              Показано{" "}
              <strong className="font-semibold text-foreground">
                {startIndex + 1}–{Math.min(startIndex + pageSize, filteredStudents.length)}
              </strong>{" "}
              из <strong className="font-semibold text-foreground">{filteredStudents.length}</strong> записей
            </span>

            <div className="flex items-center gap-1.5 pl-2 border-l">
              <span className="text-[11px]">На странице:</span>
              <Select
                value={String(pageSize)}
                onValueChange={(val) => val && setPageSize(Number(val))}
              >
                <SelectTrigger className="h-7 text-xs w-20 bg-background px-2.5">
                  <SelectValue>{pageSize}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              size="icon-xs"
              variant="outline"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="h-7 w-7"
              title="Первая страница"
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon-xs"
              variant="outline"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="h-7 w-7"
              title="Предыдущая страница"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>

            <span className="px-2 text-[11px] font-medium text-foreground">
              Стр. {currentPage} из {totalPages}
            </span>

            <Button
              size="icon-xs"
              variant="outline"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="h-7 w-7"
              title="Следующая страница"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon-xs"
              variant="outline"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="h-7 w-7"
              title="Последняя страница"
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Floating Sticky Dock for Bulk Selection Actions */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-card border shadow-xl rounded-xl px-4 py-2 flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-200">
          <Badge variant="secondary" className="font-mono text-[10px] px-2 py-0.5 font-medium">
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
            {isDeleting ? "Удаление..." : `Удалить (${selectedIds.length})`}
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
          <DialogContent className="p-4 gap-3 text-xs sm:max-w-[420px]">
            <DialogHeader className="pb-2 border-b gap-1">
              <DialogTitle className="flex items-center gap-2 text-sm font-bold text-foreground">
                <KeyRound className="h-4 w-4 text-primary" /> Сброс пароля студента
              </DialogTitle>
              <DialogDescription className="text-xs">
                Новый временный пароль для <strong>{resetTargetStudent.name}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-1 text-xs">
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

            <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
              <Button variant="outline" size="xs" onClick={() => setResetTargetStudent(null)}>
                Отмена
              </Button>
              <Button size="xs" onClick={handleConfirmPasswordReset}>
                Подтвердить
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* AlertDialog for Bulk or Single Delete Confirmation */}
      <AlertDialog
        open={isConfirmDeleteDialogOpen || singleDeleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setIsConfirmDeleteDialogOpen(false);
            setSingleDeleteTarget(null);
          }
        }}
      >
        <AlertDialogContent className="p-4 gap-3 text-xs sm:max-w-[400px]">
          <AlertDialogHeader className="text-left place-items-start gap-1">
            <AlertDialogTitle className="flex items-center gap-2 text-sm font-bold text-destructive">
              <AlertTriangle className="h-4 w-4" /> Подтверждение удаления
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              {singleDeleteTarget ? (
                <>
                  Вы действительно хотите безвозвратно удалить студента <strong>{singleDeleteTarget.name}</strong> из системы?
                </>
              ) : (
                <>
                  Вы действительно хотите безвозвратно удалить выбранных студентов (
                  <strong>{selectedIds.length} чел.</strong>) из системы?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {deleteErrorMsg && (
            <div className="text-xs text-destructive bg-destructive/10 p-2.5 rounded border border-destructive/20">
              {deleteErrorMsg}
            </div>
          )}

          <AlertDialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
            <AlertDialogCancel disabled={isDeleting} className="h-7 text-xs px-3">
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleConfirmBulkDelete}
              disabled={isDeleting}
              className="h-7 text-xs px-3"
            >
              {isDeleting ? "Удаление..." : "Удалить"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
