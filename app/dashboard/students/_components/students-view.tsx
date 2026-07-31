"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
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
  Eye,
  EyeOff,
  Sparkles,
  Copy,
  Check,
  Edit,
  Send,
  Lock,
  RotateCcw,
  X,
  BadgeCheck,
  ArrowRightLeft,
} from "lucide-react";

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

const INITIAL_REGISTRY: StudentRegistryItem[] = [
  { id: "st-101", name: "Петров Алексей Сергеевич", email: "petrov@lyceum.edu", phone: "+996 555 12-34-56", groupName: "ИС-1-25", course: 1, enrollmentType: "Бюджет", enrollmentDate: "01.09.2025", status: "Зачислен", accountStatus: "Активен", avgGrade: "4.9", lastPasswordReset: "15.01.2026" },
  { id: "st-102", name: "Сидорова Анна Владимировна", email: "sidorova@lyceum.edu", phone: "+996 700 98-76-54", groupName: "ИС-1-25", course: 1, enrollmentType: "Контракт", enrollmentDate: "01.09.2025", status: "Зачислен", accountStatus: "Активен", avgGrade: "4.6", lastPasswordReset: "20.02.2026" },
  { id: "st-103", name: "Иванов Дмитрий Игоревич", email: "ivanov@lyceum.edu", phone: "+996 777 45-67-89", groupName: "ИС-1-25", course: 1, enrollmentType: "Бюджет", enrollmentDate: "01.09.2025", status: "Зачислен", accountStatus: "Временный пароль", avgGrade: "4.2", lastPasswordReset: "28.07.2026" },
  { id: "st-104", name: "Ковалева Мария Андреевна", email: "kovaleva@lyceum.edu", phone: "+996 500 11-22-33", groupName: "ИС-2-24", course: 2, enrollmentType: "Бюджет", enrollmentDate: "01.09.2024", status: "Зачислен", accountStatus: "Активен", avgGrade: "5.0", lastPasswordReset: "10.05.2026" },
  { id: "st-105", name: "Морозов Артём Викторович", email: "morozov@lyceum.edu", phone: "+996 550 33-44-55", groupName: "ИС-2-24", course: 2, enrollmentType: "Контракт", enrollmentDate: "01.09.2024", status: "Зачислен", accountStatus: "Активен", avgGrade: "4.1" },
  { id: "st-106", name: "Алиева Айдана Нурбековна", email: "alieva@lyceum.edu", phone: "+996 708 11-44-77", groupName: "Не распределен", course: 1, enrollmentType: "Контракт", enrollmentDate: "28.07.2026", status: "Ожидает группы", accountStatus: "Временный пароль", avgGrade: "—" },
  { id: "st-107", name: "Султанов Тимур Русланович", email: "sultanov@lyceum.edu", phone: "+996 559 88-99-00", groupName: "Не распределен", course: 1, enrollmentType: "Бюджет", enrollmentDate: "29.07.2026", status: "Ожидает группы", accountStatus: "Временный пароль", avgGrade: "—" },
];

interface StudentsViewProps {
  userRole: "ADMIN" | "TEACHER" | "STUDENT";
}

export function StudentsView({ userRole }: StudentsViewProps) {
  const [students, setStudents] = useState<StudentRegistryItem[]>(INITIAL_REGISTRY);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroupFilter, setSelectedGroupFilter] = useState("Все группы");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("Все статусы");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState("Все формы");

  // Enrollment & Account Creation Form State
  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false);
  const [enrollName, setEnrollName] = useState("");
  const [enrollEmail, setEnrollEmail] = useState("");
  const [enrollPhone, setEnrollPhone] = useState("");
  const [enrollGroup, setEnrollGroup] = useState("ИС-1-25");
  const [enrollType, setEnrollType] = useState<"Бюджет" | "Контракт">("Бюджет");
  const [enrollPassword, setEnrollPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(true);

  // Reset Password Dialog State
  const [resetTargetStudent, setResetTargetStudent] = useState<StudentRegistryItem | null>(null);
  const [generatedNewPassword, setGeneratedNewPassword] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  // Edit Student Dialog State
  const [editTargetStudent, setEditTargetStudent] = useState<StudentRegistryItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editGroup, setEditGroup] = useState("");
  const [editType, setEditType] = useState<"Бюджет" | "Контракт">("Бюджет");

  const isAdminOrTeacher = userRole === "ADMIN" || userRole === "TEACHER";

  const generateRandomPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$";
    let pass = "Lms";
    for (let i = 0; i < 6; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  const handleGenerateEnrollPassword = () => {
    setEnrollPassword(generateRandomPassword());
  };

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

  const totalEnrolled = students.filter((s) => s.status === "Зачислен").length;
  const tempPassCount = students.filter((s) => s.accountStatus === "Временный пароль").length;

  const handleEnrollSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollName.trim()) return;

    const finalEmail = enrollEmail.trim() || `${enrollName.toLowerCase().split(" ")[0]}@lyceum.edu`;

    const created: StudentRegistryItem = {
      id: `st-${Date.now()}`,
      name: enrollName.trim(),
      email: finalEmail,
      phone: enrollPhone.trim() || "+996 555 00-00-00",
      groupName: enrollGroup,
      course: enrollGroup === "ИС-2-24" ? 2 : 1,
      enrollmentType: enrollType,
      enrollmentDate: new Date().toLocaleDateString("ru-RU"),
      status: enrollGroup === "Не распределен" ? "Ожидает группы" : "Зачислен",
      accountStatus: mustChangePassword ? "Временный пароль" : "Активен",
      avgGrade: "4.5",
      lastPasswordReset: new Date().toLocaleDateString("ru-RU"),
    };

    setStudents([created, ...students]);
    setEnrollName("");
    setEnrollEmail("");
    setEnrollPhone("");
    setEnrollPassword("");
    setIsEnrollDialogOpen(false);
  };

  const handleOpenResetPassword = (student: StudentRegistryItem) => {
    setResetTargetStudent(student);
    setGeneratedNewPassword(generateRandomPassword());
    setIsCopied(false);
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

  const handleCopyPassword = () => {
    if (generatedNewPassword) {
      navigator.clipboard.writeText(generatedNewPassword);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleOpenEditStudent = (student: StudentRegistryItem) => {
    setEditTargetStudent(student);
    setEditName(student.name);
    setEditEmail(student.email);
    setEditPhone(student.phone);
    setEditGroup(student.groupName);
    setEditType(student.enrollmentType);
  };

  const handleSaveEditStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTargetStudent) return;

    setStudents((prev) =>
      prev.map((s) =>
        s.id === editTargetStudent.id
          ? {
              ...s,
              name: editName.trim(),
              email: editEmail.trim(),
              phone: editPhone.trim(),
              groupName: editGroup,
              enrollmentType: editType,
              status: editGroup === "Не распределен" ? "Ожидает группы" : "Зачислен",
            }
          : s
      )
    );
    setEditTargetStudent(null);
  };

  const handleChangeStudentGroup = (studentId: string, newGroupName: string) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId
          ? {
              ...s,
              groupName: newGroupName,
              status: newGroupName === "Не распределен" ? "Ожидает группы" : "Зачислен",
            }
          : s
      )
    );
  };

  return (
    <div className="w-full space-y-4 text-xs">
      {/* Header Bar - Compact */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Зачисление и аккаунты студентов
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Регистрация личных аккаунтов, генерация паролей и учет зачисления
          </p>
        </div>

        {isAdminOrTeacher && (
          <Button size="xs" className="h-8 text-xs" render={<Link href="/dashboard/students/new" />}>
            <UserPlus className="h-3.5 w-3.5 mr-1.5" /> Зарегистрировать студента
          </Button>
        )}
      </div>

      {/* KPI Stats Overview - Compact */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border shadow-none">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
              <GraduationCap className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground uppercase font-semibold">Всего зачислено</div>
              <div className="text-base font-bold text-foreground mt-0.5">{totalEnrolled} студентов</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-none">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
              <KeyRound className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground uppercase font-semibold">Временных паролей</div>
              <div className="text-base font-bold text-foreground mt-0.5">{tempPassCount} аккаунтов</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-none">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
              <BadgeCheck className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground uppercase font-semibold">Система авторизации</div>
              <div className="text-xs font-bold text-foreground mt-0.5">Активна & Безопасна</div>
            </div>
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
        </div>
      </div>

      {/* Student Registry Table List - Compact */}
      <Card className="border shadow-none overflow-hidden">
        <CardHeader className="py-2.5 px-4 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Приказная ведомость студентов
            </CardTitle>
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
                className="p-3 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-muted-foreground w-5 text-[11px] font-semibold text-center">{idx + 1}.</span>
                  <Avatar className="h-8 w-8 border shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-[11px]">
                      {st.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="font-semibold text-foreground text-xs flex items-center gap-1.5 flex-wrap">
                      <span className="truncate">{st.name}</span>
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
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {st.phone}
                      </span>
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
                        onClick={() => handleOpenResetPassword(st)}
                        className="text-[11px] h-7 px-2"
                      >
                        <KeyRound className="h-3 w-3 mr-1 text-primary" /> Сброс пароля
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
                          <DropdownMenuItem onClick={() => handleOpenResetPassword(st)}>
                            <KeyRound className="h-3.5 w-3.5 mr-2 text-primary" /> Сбросить пароль
                          </DropdownMenuItem>
                          <DropdownMenuItem render={<Link href={`/dashboard/students/${st.id}/edit`} />}>
                            <Edit className="h-3.5 w-3.5 mr-2 text-primary" /> Редактировать данные
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleChangeStudentGroup(st.id, "ИС-1-25")}>
                            <ArrowRightLeft className="h-3.5 w-3.5 mr-2 text-primary" /> Перевести в ИС-1-25
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleChangeStudentGroup(st.id, "ИС-2-24")}>
                            <ArrowRightLeft className="h-3.5 w-3.5 mr-2 text-primary" /> Перевести в ИС-2-24
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
    </div>
  );
}
