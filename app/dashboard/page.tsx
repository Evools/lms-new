import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  UserCheck,
  GraduationCap,
  BookOpen,
  ClipboardCheck,
  Clock,
  Megaphone,
  Activity,
  FileText,
  CheckCircle2,
  Calendar,
  ArrowUpRight,
  Plus,
  AlertCircle,
  FileCode,
  CheckSquare,
} from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { name, role } = session.user;

  return (
    <div className="w-full space-y-6">
      {/* ROLE-BASED DASHBOARD CONTENT ACCORDING TO TECHNICAL SPECIFICATION */}

      {/* ------------------------------------------------------------- */}
      {/* 1. ADMINISTRATOR DASHBOARD VIEW */}
      {/* ------------------------------------------------------------- */}
      {role === "ADMIN" && (
        <div className="space-y-6">
          {/* Admin Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border shadow-none">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Группы</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">Всего учебных групп</p>
              </CardContent>
            </Card>

            <Card className="border shadow-none">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Преподаватели</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">28</div>
                <p className="text-xs text-muted-foreground">Преподавательский состав</p>
              </CardContent>
            </Card>

            <Card className="border shadow-none">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Студенты</CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">340</div>
                <p className="text-xs text-muted-foreground">Зачисленных учащихся</p>
              </CardContent>
            </Card>

            <Card className="border shadow-none">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Предметы</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">16</div>
                <p className="text-xs text-muted-foreground">Дисциплин в программе</p>
              </CardContent>
            </Card>
          </div>

          {/* Admin Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Columns: Activity & Announcements */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border shadow-none">
                <CardHeader className="border-b pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    Последние действия в системе
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 divide-y text-xs">
                  <div className="p-3 flex items-center justify-between">
                    <div>
                      <span className="font-medium text-foreground">Иванов И.И.</span> добавил материал «Лекция 4: CSS Grid» в группу ИС-1-25
                    </div>
                    <span className="text-muted-foreground text-[11px] shrink-0 ml-2">10 мин назад</span>
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <div>
                      <span className="font-medium text-foreground">Петров А.</span> сдал домашнее задание по Веб-программированию
                    </div>
                    <span className="text-muted-foreground text-[11px] shrink-0 ml-2">25 мин назад</span>
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <div>
                      <span className="font-medium text-foreground">Сидоров А.П.</span> отметила посещаемость группы ИС-2-24
                    </div>
                    <span className="text-muted-foreground text-[11px] shrink-0 ml-2">1 час назад</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border shadow-none">
                <CardHeader className="border-b pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Megaphone className="h-4 w-4 text-muted-foreground" />
                    Объявления лицея
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div className="p-3 border rounded-md bg-muted/20 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">Заседание педагогического совета</span>
                      <Badge variant="outline" className="text-[10px]">Преподавателям</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Сегодня в 15:00 состоится плановое заседание в 304 кабинете.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Duty roster for today */}
            <div className="space-y-6">
              <Card className="border shadow-none">
                <CardHeader className="border-b pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    Дежурные сегодня
                  </CardTitle>
                  <CardDescription className="text-xs">Группа ИС-1-25</CardDescription>
                </CardHeader>
                <CardContent className="p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 border rounded-md">
                    <div>
                      <div className="font-medium text-foreground">Петров Алексей</div>
                      <div className="text-muted-foreground text-[11px]">Староста / Старший дежурный</div>
                    </div>
                    <Badge variant="default" className="text-[10px]">Старший</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded-md">
                    <div>
                      <div className="font-medium text-foreground">Сидорова Анна</div>
                      <div className="text-muted-foreground text-[11px]">Дежурный</div>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">Дежурный</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. TEACHER DASHBOARD VIEW */}
      {/* ------------------------------------------------------------- */}
      {role === "TEACHER" && (
        <div className="space-y-6">
          {/* Teacher Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border shadow-none">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Занятия сегодня</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4</div>
                <p className="text-xs text-muted-foreground">Пары по расписанию</p>
              </CardContent>
            </Card>

            <Card className="border shadow-none">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium uppercase text-muted-foreground">На проверку</CardTitle>
                <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8</div>
                <p className="text-xs text-muted-foreground">Выполненных домашних заданий</p>
              </CardContent>
            </Card>

            <Card className="border shadow-none">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Мои группы</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2</div>
                <p className="text-xs text-muted-foreground">Закрепленные учебные группы</p>
              </CardContent>
            </Card>
          </div>

          {/* Teacher Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Columns: Classes today & Assignments to review */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border shadow-none">
                <CardHeader className="border-b pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    Сегодняшние занятия
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 divide-y text-xs">
                  <div className="p-4 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-sm">1 пара — Веб-программирование</div>
                      <div className="text-muted-foreground">Группа: ИС-1-25 | Кабинет: 204</div>
                    </div>
                    <Button variant="outline" size="sm" render={<Link href="/dashboard/attendance" />}>
                      Посещаемость
                    </Button>
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-sm">2 пара — Базы данных</div>
                      <div className="text-muted-foreground">Группа: ИС-2-24 | Кабинет: 308</div>
                    </div>
                    <Button variant="outline" size="sm" render={<Link href="/dashboard/attendance" />}>
                      Посещаемость
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border shadow-none">
                <CardHeader className="border-b pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                    Домашние задания на проверку
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 divide-y text-xs">
                  <div className="p-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-foreground">Лабораторная работа #3 (HTML/CSS)</div>
                      <div className="text-muted-foreground">Студент: Петров А. (ИС-1-25)</div>
                    </div>
                    <Button variant="ghost" size="xs" render={<Link href="/dashboard/assignments" />}>
                      Проверить <ArrowUpRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Quick actions & Announcements */}
            <div className="space-y-6">
              <Card className="border shadow-none">
                <CardHeader className="border-b pb-3">
                  <CardTitle className="text-sm font-semibold">Быстрые действия</CardTitle>
                </CardHeader>
                <CardContent className="p-3 space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs" render={<Link href="/dashboard/lms" />}>
                    <Plus className="mr-2 h-3.5 w-3.5" /> Создать новую тему LMS
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs" render={<Link href="/dashboard/assignments" />}>
                    <Plus className="mr-2 h-3.5 w-3.5" /> Создать домашнее задание
                  </Button>
                </CardContent>
              </Card>

              <Card className="border shadow-none">
                <CardHeader className="border-b pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Megaphone className="h-4 w-4 text-muted-foreground" />
                    Объявления
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-2 text-xs">
                  <p className="text-muted-foreground">
                    Заседание педсовета сегодня в 15:00.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. STUDENT DASHBOARD VIEW */}
      {/* ------------------------------------------------------------- */}
      {role === "STUDENT" && (
        <div className="space-y-6">
          {/* Student Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border shadow-none">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Моя группа</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">ИС-1-25</div>
                <p className="text-xs text-muted-foreground">Специальность «Информационные системы»</p>
              </CardContent>
            </Card>

            <Card className="border shadow-none">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Задания к сдаче</CardTitle>
                <CheckSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2</div>
                <p className="text-xs text-muted-foreground">Активные домашние задания</p>
              </CardContent>
            </Card>

            <Card className="border shadow-none">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Дежурство сегодня</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <Badge variant="default" className="text-xs font-medium px-2 py-1">
                  Старший дежурный
                </Badge>
                <p className="text-xs text-muted-foreground mt-1.5">Отвечает за порядок в группе</p>
              </CardContent>
            </Card>
          </div>

          {/* Student Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Columns: Recent Materials & Homework */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border shadow-none">
                <CardHeader className="border-b pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <FileCode className="h-4 w-4 text-muted-foreground" />
                    Последние учебные материалы
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 divide-y text-xs">
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-sm">Лекция #4: Верстка на CSS Grid</div>
                      <div className="text-muted-foreground">Предмет: Веб-программирование | Преподаватель: Иванов И.И.</div>
                    </div>
                    <Badge variant="outline" className="text-[10px]">PDF</Badge>
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-sm">Практическое руководство по SQL JOIN</div>
                      <div className="text-muted-foreground">Предмет: Базы данных | Преподаватель: Сидоров А.П.</div>
                    </div>
                    <Badge variant="outline" className="text-[10px]">Документ</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="border shadow-none">
                <CardHeader className="border-b pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                    Мои домашние задания
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 divide-y text-xs">
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-sm">Создание адаптивного макета на Tailwind</div>
                      <div className="text-muted-foreground">Срок сдачи: До 5 августа 23:59</div>
                    </div>
                    <Button size="sm" variant="outline" render={<Link href="/dashboard/assignments" />}>
                      Загрузить решение
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Duty Status & Announcements */}
            <div className="space-y-6">
              <Card className="border shadow-none">
                <CardHeader className="border-b pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    Дежурство группы сегодня
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 border rounded-md bg-muted/20">
                    <div>
                      <div className="font-semibold text-foreground">Петров Алексей (Вы)</div>
                      <div className="text-muted-foreground text-[11px]">Старший дежурный</div>
                    </div>
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded-md">
                    <div>
                      <div className="font-medium text-foreground">Сидорова Анна</div>
                      <div className="text-muted-foreground text-[11px]">Дежурный</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border shadow-none">
                <CardHeader className="border-b pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Megaphone className="h-4 w-4 text-muted-foreground" />
                    Объявления
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 text-xs space-y-2">
                  <div className="p-2.5 border rounded-md bg-muted/20 space-y-1">
                    <div className="font-semibold text-foreground">График консультаций перед сессией</div>
                    <p className="text-muted-foreground">
                      Консультации по веб-программированию проходят по четвергам в 14:00.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
