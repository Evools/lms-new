"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Users,
  UserCheck,
  GraduationCap,
  BookOpen,
  ClipboardCheck,
  Search,
  ChevronLeft,
  ShieldCheck,
  UserCheck2,
  Megaphone,
  Mail,
  Phone,
  Award,
  Calendar,
  Plus,
  TrendingUp,
  MoreVertical,
  RefreshCw,
  Check,
  X,
  AlertTriangle,
  UserX,
  Edit,
} from "lucide-react";
import { GroupDTO } from "../../actions";

interface GroupDetailsViewProps {
  group: GroupDTO;
  userRole: "ADMIN" | "TEACHER" | "STUDENT";
}

export interface StudentItem {
  id: string;
  name: string;
  role: "MONITOR" | "DEPUTY_MONITOR" | "STUDENT";
  phone: string;
  email: string;
  status: "Отличник" | "Хорошист" | "Успевает";
  avgGrade: string;
  attendance: string;
  isPresentToday: boolean;
  dutyCount: number;
}

export interface SmartDutyItem {
  id: string;
  day: string;
  dateStr: string;
  isToday?: boolean;
  isSunday?: boolean;
  seniorName: string;
  dutyName: string;
  seniorPresent: boolean;
  dutyPresent: boolean;
  completionStatus: "ПРОДЕЖУРИЛ" | "НЕ_ПРОДЕЖУРИЛ" | "ОТСУТСТВОВАЛ" | "ОЖИДАЕТ";
  replacedNote?: string;
}

const INITIAL_STUDENTS: StudentItem[] = [
  { id: "s-1", name: "Петров Алексей Сергеевич", role: "MONITOR", phone: "+996 555 12-34-56", email: "petrov@lyceum.edu", status: "Отличник", avgGrade: "4.9", attendance: "98%", isPresentToday: true, dutyCount: 2 },
  { id: "s-2", name: "Сидорова Анна Владимировна", role: "DEPUTY_MONITOR", phone: "+996 700 98-76-54", email: "sidorova@lyceum.edu", status: "Хорошист", avgGrade: "4.6", attendance: "95%", isPresentToday: true, dutyCount: 1 },
  { id: "s-3", name: "Иванов Дмитрий Игоревич", role: "STUDENT", phone: "+996 777 45-67-89", email: "ivanov@lyceum.edu", status: "Хорошист", avgGrade: "4.2", attendance: "92%", isPresentToday: false, dutyCount: 1 },
  { id: "s-4", name: "Ковалева Мария Андреевна", role: "STUDENT", phone: "+996 500 11-22-33", email: "kovaleva@lyceum.edu", status: "Отличник", avgGrade: "5.0", attendance: "100%", isPresentToday: true, dutyCount: 0 },
  { id: "s-5", name: "Морозов Артём Викторович", role: "STUDENT", phone: "+996 550 33-44-55", email: "morozov@lyceum.edu", status: "Хорошист", avgGrade: "4.1", attendance: "90%", isPresentToday: true, dutyCount: 0 },
  { id: "s-6", name: "Ахмедов Руслан Бекболотович", role: "STUDENT", phone: "+996 702 12-88-99", email: "akhmedov@lyceum.edu", status: "Хорошист", avgGrade: "4.4", attendance: "94%", isPresentToday: true, dutyCount: 0 },
  { id: "s-7", name: "Байкенова Салтанат Нурлановна", role: "STUDENT", phone: "+996 551 66-77-88", email: "baikenova@lyceum.edu", status: "Отличник", avgGrade: "4.8", attendance: "97%", isPresentToday: true, dutyCount: 0 },
];

const DEMO_SUBJECTS = [
  { id: "sub-1", name: "Веб-программирование (Next.js & React)", teacher: "Иванов Иван Иванович", hours: "4 ч / нед", room: "Кабинет 302", status: "Активен" },
  { id: "sub-2", name: "Базы данных (PostgreSQL & Prisma)", teacher: "Сидоров Алексей Петрович", hours: "3 ч / нед", room: "Кабинет 305", status: "Активен" },
  { id: "sub-3", name: "Объектно-ориентированное программирование", teacher: "Абдуллаева Гульнара Турсуновна", hours: "4 ч / нед", room: "Кабинет 301", status: "Активен" },
  { id: "sub-4", name: "Компьютерные сети и безопасность", teacher: "Касымов Бахтияр Эрнестович", hours: "2 ч / нед", room: "Лаборатория 2", status: "Активен" },
];

const INITIAL_SMART_DUTY: SmartDutyItem[] = [
  { id: "d-1", day: "Понедельник", dateStr: "27.07", seniorName: "Петров Алексей Сергеевич", dutyName: "Сидорова Анна Владимировна", seniorPresent: true, dutyPresent: true, completionStatus: "ПРОДЕЖУРИЛ" },
  { id: "d-2", day: "Вторник", dateStr: "28.07", seniorName: "Петров Алексей Сергеевич", dutyName: "Ковалева Мария Андреевна", seniorPresent: true, dutyPresent: true, completionStatus: "ПРОДЕЖУРИЛ" },
  { id: "d-3", day: "Среда (Сегодня)", dateStr: "31.07", isToday: true, seniorName: "Петров Алексей Сергеевич", dutyName: "Иванов Дмитрий Игоревич", seniorPresent: true, dutyPresent: false, completionStatus: "ОТСУТСТВОВАЛ", replacedNote: "Иванов Д. отсутствует по посещаемости. Требуется авто-замена!" },
  { id: "d-4", day: "Четверг", dateStr: "01.08", seniorName: "Сидорова Анна Владимировна", dutyName: "Морозов Артём Викторович", seniorPresent: true, dutyPresent: true, completionStatus: "ОЖИДАЕТ" },
  { id: "d-5", day: "Пятница", dateStr: "02.08", seniorName: "Петров Алексей Сергеевич", dutyName: "Ахмедов Руслан Бекболотович", seniorPresent: true, dutyPresent: true, completionStatus: "ОЖИДАЕТ" },
  { id: "d-6", day: "Суббота", dateStr: "03.08", seniorName: "Сидорова Анна Владимировна", dutyName: "Байкенова Салтанат Нурлановна", seniorPresent: true, dutyPresent: true, completionStatus: "ОЖИДАЕТ" },
  { id: "d-7", day: "Воскресенье", dateStr: "04.08", isSunday: true, seniorName: "— Выходной —", dutyName: "— Выходной —", seniorPresent: false, dutyPresent: false, completionStatus: "ОЖИДАЕТ" },
];

const INITIAL_ANNOUNCEMENTS = [
  { id: "ann-1", title: "Контрольная работа по веб-разработке", date: "31 июля 2026", tag: "Экзамен", text: "Уважаемые студенты, в среду состоится итоговая практическая проверка знаний по React компонентам." },
  { id: "ann-2", title: "Изменение в расписании пар", date: "29 июля 2026", tag: "Расписание", text: "Лекция по базам данных переносится на 2-ю пару в Кабинет 305." },
];

export function GroupDetailsView({ group, userRole }: GroupDetailsViewProps) {
  const router = useRouter();
  const [students, setStudents] = useState<StudentItem[]>(INITIAL_STUDENTS);
  const [weeklyDuty, setWeeklyDuty] = useState<SmartDutyItem[]>(INITIAL_SMART_DUTY);
  const [announcements, setAnnouncements] = useState(INITIAL_ANNOUNCEMENTS);
  const [activeTab, setActiveTab] = useState<"STUDENTS" | "SUBJECTS" | "DUTY" | "ANNOUNCEMENTS">("STUDENTS");

  const [monitorName] = useState(group.monitorName || "Не назначен");
  const [deputyMonitorName] = useState(group.deputyMonitorName || "Не назначен");

  const [selectedDutyDayIndex, setSelectedDutyDayIndex] = useState<number | null>(null);
  const [editingSeniorName, setEditingSeniorName] = useState("");
  const [editingDutyName, setEditingDutyName] = useState("");

  const [searchStudent, setSearchStudent] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "MONITORS" | "STUDENTS">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "EXCELLENT" | "GOOD">("ALL");

  const [isAddAnnOpen, setIsAddAnnOpen] = useState(false);
  const [newAnnTitle, setNewAnnTitle] = useState("");
  const [newAnnTag, setNewAnnTag] = useState("Общее");
  const [newAnnText, setNewAnnText] = useState("");

  const isAdminTeacherOrMonitor =
    userRole === "ADMIN" ||
    userRole === "TEACHER" ||
    students.some(s => s.role === "MONITOR" || s.role === "DEPUTY_MONITOR");

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchStudent.toLowerCase()) ||
      s.email.toLowerCase().includes(searchStudent.toLowerCase()) ||
      s.phone.toLowerCase().includes(searchStudent.toLowerCase());

    const matchesRole =
      roleFilter === "ALL" ||
      (roleFilter === "MONITORS" && (s.role === "MONITOR" || s.role === "DEPUTY_MONITOR")) ||
      (roleFilter === "STUDENTS" && s.role === "STUDENT");

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "EXCELLENT" && s.status === "Отличник") ||
      (statusFilter === "GOOD" && s.status === "Хорошист");

    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalCount = students.length;
  const excellentCount = students.filter((s) => s.status === "Отличник").length;
  const avgGpa = (students.reduce((acc, s) => acc + parseFloat(s.avgGrade), 0) / totalCount).toFixed(2);

  const setStudentRoleQuick = (studentId: string, newRole: "MONITOR" | "DEPUTY_MONITOR" | "STUDENT") => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) return { ...s, role: newRole };
        if (newRole === "MONITOR" && s.role === "MONITOR") return { ...s, role: "STUDENT" };
        if (newRole === "DEPUTY_MONITOR" && s.role === "DEPUTY_MONITOR") return { ...s, role: "STUDENT" };
        return s;
      })
    );
  };

  const handleAutoReplaceDuty = (index: number) => {
    const targetDuty = weeklyDuty[index];
    const candidate = students
      .filter(s => s.isPresentToday && s.name !== targetDuty.seniorName && s.name !== targetDuty.dutyName)
      .sort((a, b) => a.dutyCount - b.dutyCount)[0];

    if (!candidate) return;

    const updated = [...weeklyDuty];
    updated[index] = {
      ...updated[index],
      dutyName: candidate.name,
      dutyPresent: true,
      completionStatus: "ОЖИДАЕТ",
      replacedNote: `Автоматически заменен на присутствующего: ${candidate.name}`,
    };

    setStudents(prev => prev.map(s => s.id === candidate.id ? { ...s, dutyCount: s.dutyCount + 1 } : s));
    setWeeklyDuty(updated);
  };

  const handleUpdateCompletionStatus = (index: number, newStatus: "ПРОДЕЖУРИЛ" | "НЕ_ПРОДЕЖУРИЛ" | "ОТСУТСТВОВАЛ") => {
    const updated = [...weeklyDuty];
    updated[index] = {
      ...updated[index],
      completionStatus: newStatus,
      replacedNote:
        newStatus === "ОТСУТСТВОВАЛ"
          ? "Студент отсутствовал сегодня по посещаемости. Требуется авто-замена!"
          : undefined,
    };
    setWeeklyDuty(updated);
  };

  const handleGenerateSmartRotation = () => {
    const availableStudents = [...students].sort((a, b) => a.dutyCount - b.dutyCount);
    let studentIndex = 0;

    const newRoster = weeklyDuty.map(item => {
      if (item.isSunday) {
        return {
          ...item,
          seniorName: "— Выходной —",
          dutyName: "— Выходной —",
          completionStatus: "ОЖИДАЕТ" as const,
        };
      }

      const senior = monitorName;
      const dutyStudent = availableStudents[studentIndex % availableStudents.length];
      studentIndex++;

      return {
        ...item,
        seniorName: senior,
        dutyName: dutyStudent.name,
        seniorPresent: true,
        dutyPresent: dutyStudent.isPresentToday,
        completionStatus: dutyStudent.isPresentToday ? ("ОЖИДАЕТ" as const) : ("ОТСУТСТВОВАЛ" as const),
        replacedNote: dutyStudent.isPresentToday
          ? undefined
          : `Студент ${dutyStudent.name} отсутствует в системе посещаемости. Нажмите «Авто-замена»`,
      };
    });

    setWeeklyDuty(newRoster);
  };

  const handleOpenEditDuty = (index: number) => {
    setSelectedDutyDayIndex(index);
    setEditingSeniorName(weeklyDuty[index].seniorName);
    setEditingDutyName(weeklyDuty[index].dutyName);
  };

  const handleSaveDuty = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDutyDayIndex === null) return;

    const updated = [...weeklyDuty];
    updated[selectedDutyDayIndex] = {
      ...updated[selectedDutyDayIndex],
      seniorName: editingSeniorName,
      dutyName: editingDutyName,
    };

    setWeeklyDuty(updated);
    setSelectedDutyDayIndex(null);
  };

  const handleAddAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnTitle.trim()) return;

    const created = {
      id: `ann-${Date.now()}`,
      title: newAnnTitle.trim(),
      date: new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" }),
      tag: newAnnTag,
      text: newAnnText.trim(),
    };

    setAnnouncements([created, ...announcements]);
    setNewAnnTitle("");
    setNewAnnText("");
    setIsAddAnnOpen(false);
  };

  return (
    <div className="w-full space-y-4 text-xs">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/dashboard/groups" className="hover:text-primary transition-colors flex items-center gap-1">
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>Группы</span>
          </Link>
          <span>/</span>
          <span className="text-foreground font-semibold">{group.name}</span>
        </div>

        <div className="flex items-center gap-2">
          {(userRole === "ADMIN" || userRole === "TEACHER") && (
            <Button
              variant="outline"
              size="xs"
              render={<Link href={`/dashboard/groups/${group.id}/edit`} />}
              className="text-xs h-7 gap-1"
            >
              <Edit className="h-3.5 w-3.5" /> Редактировать группу
            </Button>
          )}
          <Button
            variant="outline"
            size="xs"
            onClick={() => router.push("/dashboard/groups")}
            className="text-xs h-7"
          >
            <ChevronLeft className="h-3.5 w-3.5 mr-1" /> К списку групп
          </Button>
        </div>
      </div>

      {/* Compact Main Header Visual Card */}
      <Card className="border bg-gradient-to-r from-primary/10 via-primary/5 to-background shadow-2xs overflow-hidden">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary text-primary-foreground shadow-2xs">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight text-foreground">
                    Группа {group.name}
                  </h1>
                  <Badge className="bg-primary text-primary-foreground text-[10px] px-2 py-0">
                    {group.course} Курс
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {group.specialty}
                </p>
              </div>
            </div>

            {/* Quick KPI Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-background/90 border p-2.5 rounded-xl text-center shadow-2xs">
                <div className="text-[10px] text-muted-foreground uppercase font-semibold">Всего студентов</div>
                <div className="text-base font-extrabold text-primary flex items-center justify-center gap-1 mt-0.5">
                  <GraduationCap className="h-3.5 w-3.5" />
                  {totalCount}
                </div>
              </div>

              <div className="bg-background/90 border p-2.5 rounded-xl text-center shadow-2xs">
                <div className="text-[10px] text-muted-foreground uppercase font-semibold">Средний балл</div>
                <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1 mt-0.5">
                  <TrendingUp className="h-3.5 w-3.5" />
                  {avgGpa}
                </div>
              </div>

              <div className="bg-background/90 border p-2.5 rounded-xl text-center shadow-2xs">
                <div className="text-[10px] text-muted-foreground uppercase font-semibold">Отличников</div>
                <div className="text-base font-extrabold text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1 mt-0.5">
                  <Award className="h-3.5 w-3.5" />
                  {excellentCount}
                </div>
              </div>

              <div className="bg-background/90 border p-2.5 rounded-xl text-center shadow-2xs">
                <div className="text-[10px] text-muted-foreground uppercase font-semibold">Учебный год</div>
                <div className="text-xs font-bold text-foreground flex items-center justify-center gap-1 mt-0.5">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  {group.academicYear}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leadership Roster Overview - Compact */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="border shadow-none">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
              <UserCheck className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] text-muted-foreground uppercase font-semibold">
                Куратор группы
              </div>
              <div className="text-xs font-semibold text-foreground truncate mt-0.5">
                {group.curatorName || "Иванов Иван Иванович"}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-none">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
              <ShieldCheck className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] text-muted-foreground uppercase font-semibold">
                Староста группы
              </div>
              <div className="text-xs font-semibold text-foreground truncate mt-0.5">
                {monitorName}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-none">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
              <UserCheck2 className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] text-muted-foreground uppercase font-semibold">
                Заместитель старосты
              </div>
              <div className="text-xs font-semibold text-foreground truncate mt-0.5">
                {deputyMonitorName}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
        <div className="flex items-center gap-1 overflow-x-auto">
          <Button
            size="xs"
            variant={activeTab === "STUDENTS" ? "default" : "ghost"}
            onClick={() => setActiveTab("STUDENTS")}
            className="text-xs font-medium h-8"
          >
            <GraduationCap className="h-3.5 w-3.5 mr-1.5" />
            Студенты ({students.length})
          </Button>
          <Button
            size="xs"
            variant={activeTab === "SUBJECTS" ? "default" : "ghost"}
            onClick={() => setActiveTab("SUBJECTS")}
            className="text-xs font-medium h-8"
          >
            <BookOpen className="h-3.5 w-3.5 mr-1.5" />
            Дисциплины ({DEMO_SUBJECTS.length})
          </Button>
          <Button
            size="xs"
            variant={activeTab === "DUTY" ? "default" : "ghost"}
            onClick={() => setActiveTab("DUTY")}
            className="text-xs font-medium h-8"
          >
            <ClipboardCheck className="h-3.5 w-3.5 mr-1.5" />
            Умный график дежурства
          </Button>
          <Button
            size="xs"
            variant={activeTab === "ANNOUNCEMENTS" ? "default" : "ghost"}
            onClick={() => setActiveTab("ANNOUNCEMENTS")}
            className="text-xs font-medium h-8"
          >
            <Megaphone className="h-3.5 w-3.5 mr-1.5" />
            Объявления ({announcements.length})
          </Button>
        </div>

        {activeTab === "ANNOUNCEMENTS" && (
          <Dialog open={isAddAnnOpen} onOpenChange={setIsAddAnnOpen}>
            <DialogTrigger render={<Button size="xs" variant="outline" className="h-8 text-xs" />}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Добавить объявление
            </DialogTrigger>
            <DialogContent className="sm:max-w-[440px]">
              <form onSubmit={handleAddAnnouncement}>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-base">
                    <Megaphone className="h-4.5 w-4.5 text-primary" /> Новое объявление
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    Опубликуйте уведомление для группы {group.name}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Заголовок *</label>
                    <Input
                      placeholder="Перенос занятия..."
                      value={newAnnTitle}
                      onChange={(e) => setNewAnnTitle(e.target.value)}
                      required
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Категория</label>
                    <Select value={newAnnTag} onValueChange={(val) => val && setNewAnnTag(val)}>
                      <SelectTrigger className="w-full h-8 text-xs">
                        <SelectValue placeholder="Выберите категорию" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Общее">Общее</SelectItem>
                        <SelectItem value="Расписание">Расписание</SelectItem>
                        <SelectItem value="Экзамен">Экзамен / КР</SelectItem>
                        <SelectItem value="Важное">Важное</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Текст объявления</label>
                    <textarea
                      rows={3}
                      placeholder="Подробный текст..."
                      value={newAnnText}
                      onChange={(e) => setNewAnnText(e.target.value)}
                      className="w-full p-2 rounded-md border text-xs bg-background text-foreground outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose render={<Button variant="outline" type="button" size="xs" />}>
                    Отмена
                  </DialogClose>
                  <Button type="submit" size="xs">Опубликовать</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Tab 1: STUDENTS */}
      {activeTab === "STUDENTS" && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-muted/20 p-2.5 rounded-xl border">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Поиск по ФИО, email или телефону..."
                className="pl-8 h-8 text-xs bg-background"
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-1 bg-background border p-1 rounded-lg">
              <Button
                size="xs"
                variant={roleFilter === "ALL" ? "default" : "ghost"}
                onClick={() => setRoleFilter("ALL")}
                className="text-[11px] h-6 px-2"
              >
                Все
              </Button>
              <Button
                size="xs"
                variant={roleFilter === "MONITORS" ? "default" : "ghost"}
                onClick={() => setRoleFilter("MONITORS")}
                className="text-[11px] h-6 px-2"
              >
                Старосты
              </Button>
              <Button
                size="xs"
                variant={statusFilter === "EXCELLENT" ? "default" : "ghost"}
                onClick={() => setStatusFilter(statusFilter === "EXCELLENT" ? "ALL" : "EXCELLENT")}
                className="text-[11px] h-6 px-2"
              >
                Отличники
              </Button>
            </div>
          </div>

          <Card className="border shadow-none overflow-hidden">
            <div className="divide-y text-xs">
              {filteredStudents.map((student, idx) => (
                <div
                  key={student.id}
                  className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground w-5 text-[11px] font-semibold text-center">{idx + 1}.</span>
                    <Avatar className="h-8 w-8 border shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-[11px]">
                        {student.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                        {student.name}
                        {student.status === "Отличник" && (
                          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-[9px] px-1.5 py-0 border-emerald-500/20">
                            ★ Отличник
                          </Badge>
                        )}
                        {student.isPresentToday ? (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[9px] px-1.5 py-0">
                            Присутствует
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[9px] px-1.5 py-0">
                            Отсутствует
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-muted-foreground text-[11px] mt-0.5">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {student.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {student.phone}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pl-8 sm:pl-0">
                    <div className="text-right">
                      <div className="text-[10px] text-muted-foreground">Ср. балл</div>
                      <div className="font-bold text-primary text-xs">{student.avgGrade}</div>
                    </div>

                    <div className="flex items-center gap-1">
                      {student.role === "MONITOR" && <Badge className="text-[9px] px-1.5 py-0">Староста</Badge>}
                      {student.role === "DEPUTY_MONITOR" && <Badge variant="secondary" className="text-[9px] px-1.5 py-0">Зам. старосты</Badge>}

                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" className="h-7 w-7 text-muted-foreground" />}>
                          <MoreVertical className="h-3.5 w-3.5" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuGroup>
                            <DropdownMenuLabel>Назначение роли</DropdownMenuLabel>
                          </DropdownMenuGroup>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setStudentRoleQuick(student.id, "MONITOR")}>
                            <ShieldCheck className="h-3.5 w-3.5 mr-2 text-primary" /> Сделать старостой
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setStudentRoleQuick(student.id, "DEPUTY_MONITOR")}>
                            <UserCheck2 className="h-3.5 w-3.5 mr-2 text-primary" /> Сделать зам. старосты
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Tab 2: SUBJECTS */}
      {activeTab === "SUBJECTS" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {DEMO_SUBJECTS.map((sub) => (
            <Card key={sub.id} className="border shadow-none">
              <CardHeader className="p-3 border-b">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xs font-bold flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />
                      {sub.name}
                    </CardTitle>
                    <CardDescription className="text-[11px] mt-0.5">
                      {sub.hours} • {sub.room}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">{sub.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-3 text-xs flex items-center justify-between text-muted-foreground">
                <span>Преподаватель:</span>
                <span className="font-semibold text-foreground">{sub.teacher}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tab 3: SMART DUTY SCHEDULE */}
      {activeTab === "DUTY" && (
        <Card className="border shadow-none">
          <CardHeader className="py-2.5 px-4 border-b">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <ClipboardCheck className="h-4.5 w-4.5 text-primary" />
                  Недельный наряд дежурства с контролем посещаемости
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Автоматический отбор присутствующих студентов группы {group.name} (без воскресенья)
                </CardDescription>
              </div>

              {isAdminTeacherOrMonitor && (
                <Button
                  size="xs"
                  onClick={handleGenerateSmartRotation}
                  className="bg-primary text-primary-foreground font-semibold shadow-2xs text-xs shrink-0 h-7"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1" /> Сформировать умный график
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y text-xs">
              {weeklyDuty.map((item, idx) => (
                <div
                  key={item.id}
                  className={`p-3 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 ${
                    item.isToday ? "bg-primary/5 border-l-4 border-l-primary" : item.isSunday ? "bg-muted/30 opacity-70" : ""
                  }`}
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="font-bold text-foreground text-xs flex items-center gap-1.5">
                      <span>{item.day} ({item.dateStr})</span>
                      {item.isToday && <Badge className="text-[9px] px-1.5 py-0">Сегодня</Badge>}
                      {item.isSunday && <Badge variant="outline" className="text-[9px] px-1.5 py-0">Выходной</Badge>}
                    </div>

                    {!item.isSunday ? (
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
                        <div>
                          <span className="text-muted-foreground">Старший: </span>
                          <span className="font-semibold text-foreground">{item.seniorName}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Дежурный: </span>
                          <span className="font-semibold text-foreground">{item.dutyName}</span>
                          {!item.dutyPresent && (
                            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[9px] px-1.5 py-0">
                              <UserX className="h-3 w-3 mr-0.5" /> Отсутствует
                            </Badge>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-muted-foreground text-[11px] italic">
                        Дежурство по воскресеньям не проводится
                      </div>
                    )}

                    {item.replacedNote && (
                      <div className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium pt-0.5">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        {item.replacedNote}
                      </div>
                    )}
                  </div>

                  {!item.isSunday && (
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant={
                          item.completionStatus === "ПРОДЕЖУРИЛ"
                            ? "default"
                            : item.completionStatus === "ОТСУТСТВОВАЛ"
                            ? "destructive"
                            : item.completionStatus === "НЕ_ПРОДЕЖУРИЛ"
                            ? "destructive"
                            : "outline"
                        }
                        className={item.completionStatus === "ПРОДЕЖУРИЛ" ? "bg-emerald-600 text-white text-[10px] px-1.5 py-0" : "text-[10px] px-1.5 py-0"}
                      >
                        {item.completionStatus === "ПРОДЕЖУРИЛ" && "✓ Продежурил"}
                        {item.completionStatus === "ОТСУТСТВОВАЛ" && "Отсутствовал"}
                        {item.completionStatus === "НЕ_ПРОДЕЖУРИЛ" && "Не продежурил"}
                        {item.completionStatus === "ОЖИДАЕТ" && "Наряд активен"}
                      </Badge>

                      {isAdminTeacherOrMonitor && (
                        <div className="flex items-center gap-1">
                          {!item.dutyPresent && (
                            <Button
                              size="xs"
                              variant="default"
                              onClick={() => handleAutoReplaceDuty(idx)}
                              className="text-[10px] h-6 bg-amber-600 hover:bg-amber-700 text-white px-2"
                            >
                              <RefreshCw className="h-3 w-3 mr-1" /> Авто-замена
                            </Button>
                          )}

                          <DropdownMenu>
                            <DropdownMenuTrigger render={<Button variant="outline" size="xs" className="h-6 text-[11px] px-2" />}>
                              Отметка <MoreVertical className="h-3 w-3 ml-0.5" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuGroup>
                                <DropdownMenuLabel>Отметка о дежурстве</DropdownMenuLabel>
                              </DropdownMenuGroup>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleUpdateCompletionStatus(idx, "ПРОДЕЖУРИЛ")}>
                                <Check className="h-3.5 w-3.5 mr-2 text-emerald-600" /> Продежурил (Сдал)
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateCompletionStatus(idx, "ОТСУТСТВОВАЛ")}>
                                <UserX className="h-3.5 w-3.5 mr-2 text-amber-600" /> Отсутствовал в корпусе
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateCompletionStatus(idx, "НЕ_ПРОДЕЖУРИЛ")}>
                                <X className="h-3.5 w-3.5 mr-2 text-destructive" /> Не продежурил
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleOpenEditDuty(idx)}>
                                <Edit className="h-3.5 w-3.5 mr-2 text-primary" /> Ручной выбор дежурного
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 4: ANNOUNCEMENTS */}
      {activeTab === "ANNOUNCEMENTS" && (
        <div className="space-y-3">
          {announcements.map((ann) => (
            <Card key={ann.id} className="border shadow-none">
              <CardHeader className="p-3 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-xs font-bold flex items-center gap-1.5">
                      <Megaphone className="h-3.5 w-3.5 text-primary shrink-0" />
                      {ann.title}
                    </CardTitle>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{ann.tag}</Badge>
                  </div>
                  <span className="text-[11px] text-muted-foreground">{ann.date}</span>
                </div>
              </CardHeader>
              <CardContent className="p-3 text-xs text-muted-foreground leading-relaxed pt-2">
                {ann.text}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
