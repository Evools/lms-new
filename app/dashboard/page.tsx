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
  CheckCircle2,
  Calendar,
  ArrowUpRight,
  Plus,
  FileCode,
  CheckSquare,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
} from "lucide-react";
import Link from "next/link";
import {
  AdminGenderDistributionChart,
  AdminGroupPerformanceChart,
  TeacherOverviewChart,
  TeacherGradeDistributionChart,
  StudentProgressChart,
  StudentAttendancePieChart,
} from "./_components/dashboard-charts";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { name, role } = session.user;

  // Format today's date in Russian
  const todayDate = new Date().toLocaleDateString("ru-RU", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Панель управления</h1>
          <p className="text-sm text-muted-foreground capitalize">
            Приветствуем, <span className="font-medium text-foreground">{name || "Пользователь"}</span> • {todayDate}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {role === "ADMIN" && (
            <>
              <Button size="sm" render={<Link href="/dashboard/announcements" />}>
                <Plus className="h-4 w-4 mr-1.5" /> Создать объявление
              </Button>
              <Button size="sm" variant="outline" render={<Link href="/dashboard/reports" />}>
                <BarChart3 className="h-4 w-4 mr-1.5" /> Отчёты
              </Button>
            </>
          )}
          {role === "TEACHER" && (
            <>
              <Button size="sm" render={<Link href="/dashboard/assignments" />}>
                <ClipboardCheck className="h-4 w-4 mr-1.5" /> На проверку (8)
              </Button>
              <Button size="sm" variant="outline" render={<Link href="/dashboard/attendance" />}>
                <Calendar className="h-4 w-4 mr-1.5" /> Отметить посещаемость
              </Button>
            </>
          )}
          {role === "STUDENT" && (
            <>
              <Button size="sm" render={<Link href="/dashboard/assignments" />}>
                <CheckSquare className="h-4 w-4 mr-1.5" /> Сдать задание
              </Button>
              <Button size="sm" variant="outline" render={<Link href="/dashboard/lms" />}>
                <BookOpen className="h-4 w-4 mr-1.5" /> Материалы
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. ADMINISTRATOR DASHBOARD VIEW */}
      {/* ------------------------------------------------------------- */}
      {role === "ADMIN" && (
        <div className="space-y-6">
          {/* Core Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border shadow-none">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Группы</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground mt-1">Активных групп в лицее</p>
              </CardContent>
            </Card>

            <Card className="border shadow-none">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Преподаватели</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">28</div>
                <p className="text-xs text-muted-foreground mt-1">Преподавательский состав</p>
              </CardContent>
            </Card>

            <Card className="border shadow-none">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Студенты</CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">340</div>
                <p className="text-xs text-muted-foreground mt-1">Зачисленных студентов</p>
              </CardContent>
            </Card>

            <Card className="border shadow-none">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Дежурство сегодня</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm font-semibold text-foreground">Группа ИС-1-25</div>
                <p className="text-xs text-muted-foreground mt-0.5">Петров А. (Старший)</p>
              </CardContent>
            </Card>
          </div>

          {/* Interactive Analytics Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border shadow-none">
              <CardHeader className="border-b pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <PieChartIcon className="h-4 w-4 text-muted-foreground" />
                    Гендерный состав учащихся
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Соотношение юношей и девушек в лицее
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-[11px]">340 учащихся</Badge>
              </CardHeader>
              <CardContent className="pt-4">
                <AdminGenderDistributionChart />
              </CardContent>
            </Card>

            <Card className="border shadow-none">
              <CardHeader className="border-b pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    Сдача домашних заданий
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Сравнение выполнения заданий по группам (%)
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-[11px]">По группам</Badge>
              </CardHeader>
              <CardContent className="pt-4">
                <AdminGroupPerformanceChart />
              </CardContent>
            </Card>
          </div>

          {/* Admin Main Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Columns: Announcements & System Activity */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border shadow-none">
                <CardHeader className="border-b pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Megaphone className="h-4 w-4 text-primary" />
                    Последние объявления лицея
                  </CardTitle>
                  <Button variant="ghost" size="xs" render={<Link href="/dashboard/announcements" />}>
                    Перейти к объявлениям <ArrowUpRight className="h-3 w-3 ml-1" />
                  </Button>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div className="p-3.5 border rounded-md bg-muted/20 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">Заседание педагогического совета</span>
                      <Badge variant="outline" className="text-[10px]">Преподавателям</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Сегодня в 15:00 состоится заседание в 304 кабинете. Повестка: промежуточная аттестация.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border shadow-none">
                <CardHeader className="border-b pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    Последняя активность в системе
                  </CardTitle>
                  <Badge variant="secondary" className="text-[10px]">В реальном времени</Badge>
                </CardHeader>
                <CardContent className="p-0 divide-y text-xs">
                  <div className="p-3.5 flex items-center justify-between">
                    <div>
                      <span className="font-medium text-foreground">Иванов И.И.</span> добавил учебный материал в группу <span className="font-medium">ИС-1-25</span>
                    </div>
                    <span className="text-muted-foreground text-[11px] shrink-0 ml-2">10 мин назад</span>
                  </div>
                  <div className="p-3.5 flex items-center justify-between">
                    <div>
                      <span className="font-medium text-foreground">Петров А.</span> сдал домашнее задание по Веб-программированию
                    </div>
                    <span className="text-muted-foreground text-[11px] shrink-0 ml-2">25 мин назад</span>
                  </div>
                  <div className="p-3.5 flex items-center justify-between">
                    <div>
                      <span className="font-medium text-foreground">Сидоров А.П.</span> отметила посещаемость группы <span className="font-medium">ИС-2-24</span>
                    </div>
                    <span className="text-muted-foreground text-[11px] shrink-0 ml-2">1 час назад</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Duty Roster */}
            <div className="space-y-6">
              <Card className="border shadow-none">
                <CardHeader className="border-b pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    Сегодняшние дежурные
                  </CardTitle>
                  <CardDescription className="text-xs">Группа ИС-1-25</CardDescription>
                </CardHeader>
                <CardContent className="p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2.5 border rounded-md bg-muted/20">
                    <div>
                      <div className="font-medium text-foreground">Петров Алексей</div>
                      <div className="text-muted-foreground text-[11px]">Староста / Старший дежурный</div>
                    </div>
                    <Badge variant="default" className="text-[10px]">Старший</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2.5 border rounded-md">
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
                <div className="text-2xl font-bold">2 пары</div>
                <p className="text-xs text-muted-foreground mt-1">Кабинеты 204, 308</p>
              </CardContent>
            </Card>

            <Card className="border shadow-none">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium uppercase text-muted-foreground">На проверку</CardTitle>
                <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8 работ</div>
                <p className="text-xs text-muted-foreground mt-1">Домашние задания студентов</p>
              </CardContent>
            </Card>

            <Card className="border shadow-none">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Мои группы</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2 группы</div>
                <p className="text-xs text-muted-foreground mt-1">ИС-1-25, ИС-2-24</p>
              </CardContent>
            </Card>
          </div>

          {/* Teacher Analytics Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border shadow-none">
              <CardHeader className="border-b pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    Сдача и проверка домашних заданий
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Статистика за последние 5 недель
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-[11px]">За 5 недель</Badge>
              </CardHeader>
              <CardContent className="pt-4">
                <TeacherOverviewChart />
              </CardContent>
            </Card>

            <Card className="border shadow-none">
              <CardHeader className="border-b pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <PieChartIcon className="h-4 w-4 text-muted-foreground" />
                  Успеваемость по предметам
                </CardTitle>
                <CardDescription className="text-xs">
                  Распределение результатов
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <TeacherGradeDistributionChart />
              </CardContent>
            </Card>
          </div>

          {/* Teacher Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Columns: Today's Classes & Homework to Check */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border shadow-none">
                <CardHeader className="border-b pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    Сегодняшние занятия
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px]">2 пары</Badge>
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
                <CardHeader className="border-b pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                    Домашние задания на проверку
                  </CardTitle>
                  <Badge variant="secondary" className="text-[10px]">8 Работ</Badge>
                </CardHeader>
                <CardContent className="p-0 divide-y text-xs">
                  <div className="p-3.5 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-foreground">Лабораторная работа #3 (HTML/CSS Grid)</div>
                      <div className="text-muted-foreground">Студент: Петров А. (ИС-1-25)</div>
                    </div>
                    <Button variant="outline" size="xs" render={<Link href="/dashboard/assignments" />}>
                      Проверить <ArrowUpRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Quick Actions & Announcements */}
            <div className="space-y-6">
              <Card className="border shadow-none">
                <CardHeader className="border-b pb-3">
                  <CardTitle className="text-sm font-semibold">Быстрые действия</CardTitle>
                </CardHeader>
                <CardContent className="p-3 space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs" render={<Link href="/dashboard/lms" />}>
                    <Plus className="mr-2 h-3.5 w-3.5" /> Создать тему в LMS
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs" render={<Link href="/dashboard/assignments" />}>
                    <Plus className="mr-2 h-3.5 w-3.5" /> Добавить домашнее задание
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
                <CardContent className="p-3 space-y-2 text-xs">
                  <div className="p-2.5 border rounded-md bg-muted/20">
                    <div className="font-medium text-foreground">Заседание педсовета</div>
                    <div className="text-muted-foreground text-[11px]">Сегодня в 15:00 в кабинте 304</div>
                  </div>
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
                <p className="text-xs text-muted-foreground mt-1">Информационные системы</p>
              </CardContent>
            </Card>

            <Card className="border shadow-none">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Задания к сдаче</CardTitle>
                <CheckSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2 задания</div>
                <p className="text-xs text-muted-foreground mt-1">Активные работы</p>
              </CardContent>
            </Card>

            <Card className="border shadow-none">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Дежурство сегодня</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <Badge variant="default" className="text-xs px-2 py-0.5">
                  Старший дежурный
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">Отвечает за порядок в кабинете</p>
              </CardContent>
            </Card>
          </div>

          {/* Student Analytics Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border shadow-none">
              <CardHeader className="border-b pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    Академический прогресс
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Динамика активности и сдачи заданий
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="text-[11px]">Средний показатель 4.8</Badge>
              </CardHeader>
              <CardContent className="pt-4">
                <StudentProgressChart />
              </CardContent>
            </Card>

            <Card className="border shadow-none">
              <CardHeader className="border-b pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <PieChartIcon className="h-4 w-4 text-muted-foreground" />
                  Посещаемость
                </CardTitle>
                <CardDescription className="text-xs">
                  За текущий семестр
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <StudentAttendancePieChart />
              </CardContent>
            </Card>
          </div>

          {/* Student Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Columns: Homework & Recent LMS Materials */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border shadow-none">
                <CardHeader className="border-b pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                    Мои домашние задания
                  </CardTitle>
                  <Badge variant="secondary" className="text-[10px]">2 активных</Badge>
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

              <Card className="border shadow-none">
                <CardHeader className="border-b pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <FileCode className="h-4 w-4 text-muted-foreground" />
                    Последние учебные материалы (LMS)
                  </CardTitle>
                  <Button variant="ghost" size="xs" render={<Link href="/dashboard/lms" />}>
                    Все <ArrowUpRight className="h-3 w-3 ml-1" />
                  </Button>
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
                  <div className="flex items-center justify-between p-2.5 border rounded-md bg-muted/20">
                    <div>
                      <div className="font-medium text-foreground">Петров Алексей (Вы)</div>
                      <div className="text-muted-foreground text-[11px]">Староста / Старший дежурный</div>
                    </div>
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex items-center justify-between p-2.5 border rounded-md">
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
                <CardContent className="p-3 text-xs space-y-2">
                  <div className="p-2.5 border rounded-md bg-muted/20 space-y-1">
                    <div className="font-medium text-foreground">График консультаций</div>
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
