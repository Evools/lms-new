"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  Calendar,
  Building2,
  MoreVertical,
  CheckCircle2,
  Clock,
  Filter,
  FileSpreadsheet,
  ArrowRightLeft,
  UserX,
  FileText,
  BadgeCheck,
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
  avgGrade: string;
}

const INITIAL_REGISTRY: StudentRegistryItem[] = [
  { id: "st-101", name: "Петров Алексей Сергеевич", email: "petrov@lyceum.edu", phone: "+996 555 12-34-56", groupName: "ИС-1-25", course: 1, enrollmentType: "Бюджет", enrollmentDate: "01.09.2025", status: "Зачислен", avgGrade: "4.9" },
  { id: "st-102", name: "Сидорова Анна Владимировна", email: "sidorova@lyceum.edu", phone: "+996 700 98-76-54", groupName: "ИС-1-25", course: 1, enrollmentType: "Контракт", enrollmentDate: "01.09.2025", status: "Зачислен", avgGrade: "4.6" },
  { id: "st-103", name: "Иванов Дмитрий Игоревич", email: "ivanov@lyceum.edu", phone: "+996 777 45-67-89", groupName: "ИС-1-25", course: 1, enrollmentType: "Бюджет", enrollmentDate: "01.09.2025", status: "Зачислен", avgGrade: "4.2" },
  { id: "st-104", name: "Ковалева Мария Андреевна", email: "kovaleva@lyceum.edu", phone: "+996 500 11-22-33", groupName: "ИС-2-24", course: 2, enrollmentType: "Бюджет", enrollmentDate: "01.09.2024", status: "Зачислен", avgGrade: "5.0" },
  { id: "st-105", name: "Морозов Артём Викторович", email: "morozov@lyceum.edu", phone: "+996 550 33-44-55", groupName: "ИС-2-24", course: 2, enrollmentType: "Контракт", enrollmentDate: "01.09.2024", status: "Зачислен", avgGrade: "4.1" },
  { id: "st-106", name: "Алиева Айдана Нурбековна", email: "alieva@lyceum.edu", phone: "+996 708 11-44-77", groupName: "Не распределен", course: 1, enrollmentType: "Контракт", enrollmentDate: "28.07.2026", status: "Ожидает группы", avgGrade: "—" },
  { id: "st-107", name: "Султанов Тимур Русланович", email: "sultanov@lyceum.edu", phone: "+996 559 88-99-00", groupName: "Не распределен", course: 1, enrollmentType: "Бюджет", enrollmentDate: "29.07.2026", status: "Ожидает группы", avgGrade: "—" },
];

interface StudentsViewProps {
  userRole: "ADMIN" | "TEACHER" | "STUDENT";
}

export function StudentsView({ userRole }: StudentsViewProps) {
  const [students, setStudents] = useState<StudentRegistryItem[]>(INITIAL_REGISTRY);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroupFilter, setSelectedGroupFilter] = useState("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ALL");

  // Enrollment Form State
  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false);
  const [enrollName, setEnrollName] = useState("");
  const [enrollEmail, setEnrollEmail] = useState("");
  const [enrollPhone, setEnrollPhone] = useState("");
  const [enrollGroup, setEnrollGroup] = useState("ИС-1-25");
  const [enrollType, setEnrollType] = useState<"Бюджет" | "Контракт">("Бюджет");

  const isAdminOrTeacher = userRole === "ADMIN" || userRole === "TEACHER";

  // Filter students
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesGroup =
      selectedGroupFilter === "ALL" ||
      (selectedGroupFilter === "UNASSIGNED" && s.groupName === "Не распределен") ||
      s.groupName === selectedGroupFilter;

    const matchesStatus =
      selectedStatusFilter === "ALL" || s.status === selectedStatusFilter;

    return matchesSearch && matchesGroup && matchesStatus;
  });

  const totalEnrolled = students.filter((s) => s.status === "Зачислен").length;
  const pendingCount = students.filter((s) => s.status === "Ожидает группы").length;

  const handleEnrollSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollName.trim()) return;

    const created: StudentRegistryItem = {
      id: `st-${Date.now()}`,
      name: enrollName.trim(),
      email: enrollEmail.trim() || `student${Date.now()}@lyceum.edu`,
      phone: enrollPhone.trim() || "+996 555 00-00-00",
      groupName: enrollGroup,
      course: enrollGroup === "ИС-2-24" ? 2 : 1,
      enrollmentType: enrollType,
      enrollmentDate: new Date().toLocaleDateString("ru-RU"),
      status: enrollGroup === "Не распределен" ? "Ожидает группы" : "Зачислен",
      avgGrade: "4.5",
    };

    setStudents([created, ...students]);
    setEnrollName("");
    setEnrollEmail("");
    setEnrollPhone("");
    setIsEnrollDialogOpen(false);
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
    <div className="w-full space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <UserPlus className="h-6 w-6 text-primary" />
            Зачисление и учет студентов
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Управление личными делами студентов, процедура зачисления и распределения по группам
          </p>
        </div>

        {isAdminOrTeacher && (
          <Dialog open={isEnrollDialogOpen} onOpenChange={setIsEnrollDialogOpen}>
            <DialogTrigger render={<Button size="sm" />}>
              <UserPlus className="h-4 w-4 mr-1.5" /> Зачислить нового студента
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
              <form onSubmit={handleEnrollSubmit}>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-base">
                    <UserPlus className="h-5 w-5 text-primary" /> Зачисление абитуриента / студента
                  </DialogTitle>
                  <DialogDescription>
                    Заполните анкетные данные для приказирования о зачислении в лицей
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-3.5 py-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">ФИО Студента *</label>
                    <Input
                      placeholder="Например: Касымов Бактыбек Замирович"
                      value={enrollName}
                      onChange={(e) => setEnrollName(e.target.value)}
                      required
                      className="h-8.5 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="font-semibold text-foreground">Электронная почта</label>
                      <Input
                        type="email"
                        placeholder="kasymov@lyceum.edu"
                        value={enrollEmail}
                        onChange={(e) => setEnrollEmail(e.target.value)}
                        className="h-8.5 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-foreground">Телефон</label>
                      <Input
                        placeholder="+996 555 00-11-22"
                        value={enrollPhone}
                        onChange={(e) => setEnrollPhone(e.target.value)}
                        className="h-8.5 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="font-semibold text-foreground">Учебная группа</label>
                      <Select value={enrollGroup} onValueChange={(val) => val && setEnrollGroup(val)}>
                        <SelectTrigger className="w-full h-8.5">
                          <SelectValue placeholder="Выберите группу" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ИС-1-25">ИС-1-25 (1 Курс)</SelectItem>
                          <SelectItem value="ИС-2-24">ИС-2-24 (2 Курс)</SelectItem>
                          <SelectItem value="Не распределен">Не распределен (Резерв)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-foreground">Форма финансирования</label>
                      <Select value={enrollType} onValueChange={(val) => val && setEnrollType(val as any)}>
                        <SelectTrigger className="w-full h-8.5">
                          <SelectValue placeholder="Форма" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Бюджет">Бюджет</SelectItem>
                          <SelectItem value="Контракт">Контракт</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <DialogClose render={<Button variant="outline" type="button" size="xs" />}>
                    Отмена
                  </DialogClose>
                  <Button type="submit" size="xs">Подтвердить зачисление</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border shadow-none bg-gradient-to-r from-primary/10 via-primary/5 to-background">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary text-primary-foreground">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground uppercase font-semibold">Всего зачислено</div>
              <div className="text-xl font-bold text-foreground mt-0.5">{totalEnrolled} студентов</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-none">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground uppercase font-semibold">Ожидают группы</div>
              <div className="text-xl font-bold text-foreground mt-0.5">{pendingCount} абитуриентов</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-none">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <BadgeCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground uppercase font-semibold">Формирование приказа</div>
              <div className="text-sm font-bold text-foreground mt-0.5">2026-2027 Учебный год</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-muted/20 p-3 rounded-xl border">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по ФИО, email или телефону..."
            className="pl-9 h-9 text-xs bg-background"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedGroupFilter} onValueChange={(val) => val && setSelectedGroupFilter(val)}>
            <SelectTrigger className="h-9 text-xs w-44 bg-background">
              <SelectValue placeholder="Фильтр по группе" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Все группы</SelectItem>
              <SelectItem value="ИС-1-25">ИС-1-25</SelectItem>
              <SelectItem value="ИС-2-24">ИС-2-24</SelectItem>
              <SelectItem value="UNASSIGNED">Не распределены</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedStatusFilter} onValueChange={(val) => val && setSelectedStatusFilter(val)}>
            <SelectTrigger className="h-9 text-xs w-40 bg-background">
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Все статусы</SelectItem>
              <SelectItem value="Зачислен">Зачислен</SelectItem>
              <SelectItem value="Ожидает группы">Ожидает группы</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Registry Table List */}
      <Card className="border shadow-none overflow-hidden">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Приказная ведомость студентов
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              Записей: {filteredStudents.length}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="divide-y text-xs">
            {filteredStudents.map((st, idx) => (
              <div
                key={st.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <span className="text-muted-foreground w-6 text-xs font-semibold text-center">{idx + 1}.</span>
                  <Avatar className="h-9 w-9 border shadow-2xs">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                      {st.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-foreground text-sm flex items-center gap-2">
                      {st.name}
                      <Badge
                        variant={st.enrollmentType === "Бюджет" ? "default" : "secondary"}
                        className="text-[10px]"
                      >
                        {st.enrollmentType}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground text-[11px] mt-0.5">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {st.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {st.phone}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pl-9 sm:pl-0">
                  <div className="text-right">
                    <div className="text-[10px] text-muted-foreground">Группа</div>
                    <Badge variant="outline" className="text-xs font-medium">
                      {st.groupName}
                    </Badge>
                  </div>

                  <div className="text-right hidden sm:block">
                    <div className="text-[10px] text-muted-foreground">Дата зачисления</div>
                    <div className="font-semibold text-foreground">{st.enrollmentDate}</div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] text-muted-foreground">Статус</div>
                    <Badge
                      className={
                        st.status === "Зачислен"
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 text-[10px]"
                          : "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20 text-[10px]"
                      }
                    >
                      {st.status}
                    </Badge>
                  </div>

                  {isAdminOrTeacher && (
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" className="h-7 w-7 text-muted-foreground" />}>
                        <MoreVertical className="h-3.5 w-3.5" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuGroup>
                          <DropdownMenuLabel>Распределение</DropdownMenuLabel>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleChangeStudentGroup(st.id, "ИС-1-25")}>
                          <ArrowRightLeft className="h-3.5 w-3.5 mr-2 text-primary" /> Перевести в ИС-1-25
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleChangeStudentGroup(st.id, "ИС-2-24")}>
                          <ArrowRightLeft className="h-3.5 w-3.5 mr-2 text-primary" /> Перевести в ИС-2-24
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))}

            {filteredStudents.length === 0 && (
              <div className="p-10 text-center text-muted-foreground text-xs space-y-2">
                <Users className="h-8 w-8 mx-auto text-muted-foreground/40" />
                <div>Студенты не найдены</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
