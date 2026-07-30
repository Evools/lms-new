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
  Users,
  UserCheck,
  GraduationCap,
  BookOpen,
  ClipboardCheck,
  Clock,
  Search,
  ChevronLeft,
  ShieldCheck,
  UserCheck2,
  Building2,
  FileText,
  Megaphone,
  Mail,
  Phone,
  Sparkles,
  Award,
  Calendar,
  Layers,
} from "lucide-react";
import { GroupDTO } from "../../actions";

interface GroupDetailsViewProps {
  group: GroupDTO;
  userRole: "ADMIN" | "TEACHER" | "STUDENT";
}

const DEMO_STUDENTS = [
  { id: "s-1", name: "Петров Алексей Сергеевич", role: "MONITOR", phone: "+996 555 12-34-56", email: "petrov@lyceum.edu", status: "Отличник", avgGrade: "4.9" },
  { id: "s-2", name: "Сидорова Анна Владимировна", role: "DEPUTY_MONITOR", phone: "+996 700 98-76-54", email: "sidorova@lyceum.edu", status: "Хорошист", avgGrade: "4.6" },
  { id: "s-3", name: "Иванов Дмитрий Игоревич", role: "STUDENT", phone: "+996 777 45-67-89", email: "ivanov@lyceum.edu", status: "Хорошист", avgGrade: "4.2" },
  { id: "s-4", name: "Ковалева Мария Андреевна", role: "STUDENT", phone: "+996 500 11-22-33", email: "kovaleva@lyceum.edu", status: "Отличник", avgGrade: "5.0" },
  { id: "s-5", name: "Морозов Артём Викторович", role: "STUDENT", phone: "+996 550 33-44-55", email: "morozov@lyceum.edu", status: "Хорошист", avgGrade: "4.1" },
  { id: "s-6", name: "Ахмедов Руслан Бекболотович", role: "STUDENT", phone: "+996 702 12-88-99", email: "akhmedov@lyceum.edu", status: "Хорошист", avgGrade: "4.4" },
  { id: "s-7", name: "Байкенова Салтанат Нурлановна", role: "STUDENT", phone: "+996 551 66-77-88", email: "baikenova@lyceum.edu", status: "Отличник", avgGrade: "4.8" },
];

const DEMO_SUBJECTS = [
  { id: "sub-1", name: "Веб-программирование", teacher: "Иванов Иван Иванович", hours: "4 ч / нед", room: "Кабинет 302" },
  { id: "sub-2", name: "Базы данных (PostgreSQL / SQL)", teacher: "Сидоров Алексей Петрович", hours: "3 ч / нед", room: "Кабинет 305" },
  { id: "sub-3", name: "Объектно-ориентированное программирование", teacher: "Абдуллаева Гульнара Турсуновна", hours: "4 ч / нед", room: "Кабинет 301" },
  { id: "sub-4", name: "Компьютерные сети", teacher: "Касымов Бахтияр Эрнестович", hours: "2 ч / нед", room: "Лаборатория 2" },
];

const DEMO_ANNOUNCEMENTS = [
  { id: "ann-1", title: "Контрольная работа по веб-разработке", date: "31 июля 2026", text: "Уважаемые студенты, в следующую среду состоится итоговое практическое занятие." },
  { id: "ann-2", title: "Изменение в расписании на пятницу", date: "29 июля 2026", text: "Лекция по базам данных переносится на 2-ю пару в Кабинет 305." },
];

export function GroupDetailsView({ group, userRole }: GroupDetailsViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"STUDENTS" | "SUBJECTS" | "DUTY" | "ANNOUNCEMENTS">("STUDENTS");
  const [searchStudent, setSearchStudent] = useState("");

  const filteredStudents = DEMO_STUDENTS.filter(
    (s) =>
      s.name.toLowerCase().includes(searchStudent.toLowerCase()) ||
      s.email.toLowerCase().includes(searchStudent.toLowerCase())
  );

  return (
    <div className="w-full space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/dashboard/groups" className="hover:text-foreground transition-colors flex items-center gap-1">
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>Группы</span>
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">{group.name}</span>
        </div>

        <Button
          variant="outline"
          size="xs"
          onClick={() => router.push("/dashboard/groups")}
          className="text-xs"
        >
          <ChevronLeft className="h-3.5 w-3.5 mr-1" /> К списку групп
        </Button>
      </div>

      {/* Main Header Banner */}
      <Card className="border bg-gradient-to-r from-primary/10 via-primary/5 to-background shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary text-primary-foreground shadow-sm">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                      Группа {group.name}
                    </h1>
                    <Badge variant="default" className="text-xs">
                      {group.course} Курс
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {group.specialty}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-background/80 backdrop-blur-sm border px-3 py-2 rounded-lg text-center">
                <div className="text-[10px] text-muted-foreground uppercase font-semibold">Студентов</div>
                <div className="text-base font-bold text-primary flex items-center justify-center gap-1">
                  <GraduationCap className="h-4 w-4" />
                  {group.studentCount || DEMO_STUDENTS.length}
                </div>
              </div>

              <div className="bg-background/80 backdrop-blur-sm border px-3 py-2 rounded-lg text-center">
                <div className="text-[10px] text-muted-foreground uppercase font-semibold">Учебный год</div>
                <div className="text-base font-bold text-foreground flex items-center justify-center gap-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {group.academicYear}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leadership Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border shadow-none bg-card hover:border-primary/40 transition-colors">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground uppercase font-semibold">Классный руководитель</div>
              <div className="text-sm font-semibold text-foreground mt-0.5">
                {group.curatorName || "Иванов Иван Иванович"}
              </div>
              <div className="text-[11px] text-muted-foreground">Преподаватель спецдисциплин</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-none bg-card hover:border-primary/40 transition-colors">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground uppercase font-semibold">Староста группы</div>
              <div className="text-sm font-semibold text-foreground mt-0.5">
                {group.monitorName || "Петров Алексей Сергеевич"}
              </div>
              <div className="text-[11px] text-muted-foreground">Телефон: +996 555 12-34-56</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-none bg-card hover:border-primary/40 transition-colors">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <UserCheck2 className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground uppercase font-semibold">Заместитель старосты</div>
              <div className="text-sm font-semibold text-foreground mt-0.5">
                {group.deputyMonitorName || "Сидорова Анна Владимировна"}
              </div>
              <div className="text-[11px] text-muted-foreground">Телефон: +996 700 98-76-54</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b pb-2">
        <Button
          size="sm"
          variant={activeTab === "STUDENTS" ? "default" : "ghost"}
          onClick={() => setActiveTab("STUDENTS")}
          className="text-xs font-medium"
        >
          <GraduationCap className="h-4 w-4 mr-1.5" />
          Студенты ({DEMO_STUDENTS.length})
        </Button>
        <Button
          size="sm"
          variant={activeTab === "SUBJECTS" ? "default" : "ghost"}
          onClick={() => setActiveTab("SUBJECTS")}
          className="text-xs font-medium"
        >
          <BookOpen className="h-4 w-4 mr-1.5" />
          Дисциплины & Преподаватели
        </Button>
        <Button
          size="sm"
          variant={activeTab === "DUTY" ? "default" : "ghost"}
          onClick={() => setActiveTab("DUTY")}
          className="text-xs font-medium"
        >
          <ClipboardCheck className="h-4 w-4 mr-1.5" />
          График дежурства
        </Button>
        <Button
          size="sm"
          variant={activeTab === "ANNOUNCEMENTS" ? "default" : "ghost"}
          onClick={() => setActiveTab("ANNOUNCEMENTS")}
          className="text-xs font-medium"
        >
          <Megaphone className="h-4 w-4 mr-1.5" />
          Объявления ({DEMO_ANNOUNCEMENTS.length})
        </Button>
      </div>

      {/* Tab Content: STUDENTS */}
      {activeTab === "STUDENTS" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по ФИО или почте..."
                className="pl-9 h-9 text-xs"
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
              />
            </div>
            <div className="text-xs text-muted-foreground">
              Всего в ведомости: <span className="font-semibold text-foreground">{filteredStudents.length}</span>
            </div>
          </div>

          <Card className="border shadow-none">
            <div className="divide-y text-xs">
              {filteredStudents.map((student, idx) => (
                <div key={student.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground w-6 text-xs font-semibold">{idx + 1}.</span>
                    <Avatar className="h-9 w-9 border">
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                        {student.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold text-foreground text-sm">{student.name}</div>
                      <div className="flex items-center gap-3 text-muted-foreground text-[11px] mt-0.5">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {student.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {student.phone}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pl-9 sm:pl-0">
                    <Badge variant="outline" className="text-[11px] font-medium">
                      Успеваемость: {student.avgGrade}
                    </Badge>

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
                      <Badge variant="outline" className="text-[10px] text-muted-foreground">
                        Студент
                      </Badge>
                    )}
                  </div>
                </div>
              ))}

              {filteredStudents.length === 0 && (
                <div className="p-8 text-center text-muted-foreground text-xs">
                  Студенты не найдены по запросу "{searchStudent}"
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Tab Content: SUBJECTS */}
      {activeTab === "SUBJECTS" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DEMO_SUBJECTS.map((sub) => (
              <Card key={sub.id} className="border shadow-none hover:border-primary/40 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-primary shrink-0" />
                      {sub.name}
                    </CardTitle>
                    <Badge variant="secondary" className="text-[10px]">
                      {sub.hours}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="text-xs space-y-2 pt-1">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Преподаватель:</span>
                    <span className="font-medium text-foreground">{sub.teacher}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground border-t pt-2">
                    <span>Аудитория:</span>
                    <span className="font-medium text-foreground">{sub.room}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content: DUTY */}
      {activeTab === "DUTY" && (
        <div className="space-y-4">
          <Card className="border shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-primary" />
                Наряд по дежурству в учебном корпусе
              </CardTitle>
              <CardDescription className="text-xs">
                Назначенные дежурные на сегодня ({new Date().toLocaleDateString("ru-RU")})
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-4 rounded-lg border bg-primary/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 border">
                    <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs">
                      ПА
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-bold text-foreground text-sm">Петров Алексей Сергеевич</div>
                    <div className="text-xs text-muted-foreground">Старший дежурный по этажу</div>
                  </div>
                </div>
                <Badge className="bg-primary text-primary-foreground text-xs w-fit">
                  Старший дежурный
                </Badge>
              </div>

              <div className="p-4 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 border">
                    <AvatarFallback className="bg-muted text-muted-foreground font-bold text-xs">
                      СА
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-bold text-foreground text-sm">Сидорова Анна Владимировна</div>
                    <div className="text-xs text-muted-foreground">Дежурный по аудитории</div>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs w-fit">
                  Дежурный
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab Content: ANNOUNCEMENTS */}
      {activeTab === "ANNOUNCEMENTS" && (
        <div className="space-y-4">
          {DEMO_ANNOUNCEMENTS.map((ann) => (
            <Card key={ann.id} className="border shadow-none">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Megaphone className="h-4 w-4 text-primary shrink-0" />
                    {ann.title}
                  </CardTitle>
                  <span className="text-[11px] text-muted-foreground">{ann.date}</span>
                </div>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                {ann.text}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
