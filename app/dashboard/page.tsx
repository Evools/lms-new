import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  CheckSquare,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  Crown,
  Shield,
  FileText,
  Sparkles,
  ChevronRight,
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

  const roleLabels = {
    ADMIN: { label: "Администратор", icon: Shield, variant: "default" as const },
    TEACHER: { label: "Преподаватель", icon: UserCheck, variant: "secondary" as const },
    STUDENT: { label: "Студент", icon: GraduationCap, variant: "outline" as const },
  };

  const currentRoleConfig = roleLabels[role] || roleLabels.STUDENT;
  const RoleIcon = currentRoleConfig.icon;

  return (
    <div className="w-full space-y-4 pb-20 text-xs">
      {/* Page Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold tracking-tight text-foreground">
              Главная панель
            </h1>
            <Badge variant={currentRoleConfig.variant} className="text-[10px] px-1.5 py-0 font-medium gap-1">
              <RoleIcon className="h-3 w-3" />
              {currentRoleConfig.label}
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 capitalize">
            Приветствуем, <strong className="text-foreground">{name || "Пользователь"}</strong> · {todayDate}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {role === "ADMIN" && (
            <>
              <Button size="xs" className="h-8 text-xs gap-1.5" render={<Link href="/dashboard/announcements" />}>
                <Plus className="h-3.5 w-3.5" /> Создать объявление
              </Button>
              <Button size="xs" variant="outline" className="h-8 text-xs gap-1.5" render={<Link href="/dashboard/reports" />}>
                <BarChart3 className="h-3.5 w-3.5" /> Отчёты
              </Button>
            </>
          )}
          {role === "TEACHER" && (
            <>
              <Button size="xs" className="h-8 text-xs gap-1.5" render={<Link href="/dashboard/assignments" />}>
                <ClipboardCheck className="h-3.5 w-3.5" /> Проверка ДЗ (8)
              </Button>
              <Button size="xs" variant="outline" className="h-8 text-xs gap-1.5" render={<Link href="/dashboard/attendance" />}>
                <Calendar className="h-3.5 w-3.5" /> Отметить пары
              </Button>
            </>
          )}
          {role === "STUDENT" && (
            <>
              <Button size="xs" className="h-8 text-xs gap-1.5" render={<Link href="/dashboard/assignments" />}>
                <CheckSquare className="h-3.5 w-3.5" /> Задания
              </Button>
              <Button size="xs" variant="outline" className="h-8 text-xs gap-1.5" render={<Link href="/dashboard/lms" />}>
                <BookOpen className="h-3.5 w-3.5" /> Материалы
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. ADMINISTRATOR DASHBOARD VIEW */}
      {/* ------------------------------------------------------------- */}
      {role === "ADMIN" && (
        <div className="space-y-4">
          {/* Core Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-xl border bg-card p-3 flex items-center justify-between shadow-2xs">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Группы</span>
                <div className="text-lg font-bold text-foreground">12 групп</div>
                <p className="text-[10px] text-muted-foreground">Активные потоки лицея</p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Users className="h-4 w-4" />
              </div>
            </div>

            <div className="rounded-xl border bg-card p-3 flex items-center justify-between shadow-2xs">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Преподаватели</span>
                <div className="text-lg font-bold text-foreground">28 чел.</div>
                <p className="text-[10px] text-muted-foreground">Педагогический состав</p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <UserCheck className="h-4 w-4" />
              </div>
            </div>

            <div className="rounded-xl border bg-card p-3 flex items-center justify-between shadow-2xs">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Студенты</span>
                <div className="text-lg font-bold text-foreground">340 чел.</div>
                <p className="text-[10px] text-muted-foreground">Зачислено в лицей</p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <GraduationCap className="h-4 w-4" />
              </div>
            </div>

            <div className="rounded-xl border bg-card p-3 flex items-center justify-between shadow-2xs">
              <div className="space-y-0.5 min-w-0">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Дежурство сегодня</span>
                <div className="text-xs font-bold text-foreground truncate">Группа ИС-1-25</div>
                <p className="text-[10px] text-primary font-medium truncate">2–3 дежурных на смене</p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                <Clock className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* Interactive Analytics Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-xl border bg-card p-3.5 space-y-3">
              <div className="flex items-center justify-between border-b pb-2.5">
                <div>
                  <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <PieChartIcon className="h-3.5 w-3.5 text-primary" />
                    Соотношение учащихся
                  </div>
                  <p className="text-[10px] text-muted-foreground">Гендерное распределение по лицею</p>
                </div>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0">340 студентов</Badge>
              </div>
              <AdminGenderDistributionChart />
            </div>

            <div className="rounded-xl border bg-card p-3.5 space-y-3">
              <div className="flex items-center justify-between border-b pb-2.5">
                <div>
                  <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <BarChart3 className="h-3.5 w-3.5 text-primary" />
                    Сдача домашних заданий
                  </div>
                  <p className="text-[10px] text-muted-foreground">Сравнение активности по группам (%)</p>
                </div>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0">По группам</Badge>
              </div>
              <AdminGroupPerformanceChart />
            </div>
          </div>

          {/* Admin Main Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left 2 Columns: Announcements & System Activity */}
            <div className="lg:col-span-2 space-y-4">
              <div className="rounded-xl border bg-card overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Megaphone className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-bold text-foreground">Последние объявления</span>
                  </div>
                  <Button variant="ghost" size="xs" className="h-6 text-[10px] text-primary gap-1" render={<Link href="/dashboard/announcements" />}>
                    Все объявления <ArrowUpRight className="h-3 w-3" />
                  </Button>
                </div>
                <div className="p-3 space-y-2">
                  <div className="p-3 border rounded-lg bg-primary/5 border-primary/20 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Sparkles className="h-3 w-3 text-primary" /> Заседание педагогического совета
                      </span>
                      <Badge className="bg-primary text-primary-foreground text-[8px] px-1 py-0">Важное</Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Сегодня в 15:00 состоится заседание в 304 кабинете. Повестка: промежуточная аттестация студентов.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border bg-card overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Activity className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-bold text-foreground">Активность в системе</span>
                  </div>
                  <Badge variant="secondary" className="text-[9px] px-1.5 py-0">Реальное время</Badge>
                </div>
                <div className="divide-y text-xs">
                  <div className="p-3 flex items-center justify-between hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar className="h-5 w-5 border shrink-0">
                        <AvatarFallback className="text-[8px] font-bold bg-primary/10 text-primary">ИИ</AvatarFallback>
                      </Avatar>
                      <span className="text-foreground truncate">
                        <strong>Иванов И.И.</strong> добавил учебный материал в <strong>ИС-1-25</strong>
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0 ml-2">10 мин назад</span>
                  </div>
                  <div className="p-3 flex items-center justify-between hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar className="h-5 w-5 border shrink-0">
                        <AvatarFallback className="text-[8px] font-bold bg-primary/10 text-primary">ПА</AvatarFallback>
                      </Avatar>
                      <span className="text-foreground truncate">
                        <strong>Петров А.</strong> сдал задание по Веб-программированию
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0 ml-2">25 мин назад</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Duty Roster */}
            <div className="space-y-4">
              <div className="rounded-xl border bg-card overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-bold text-foreground">Дежурные сегодня</span>
                  </div>
                  <Button variant="ghost" size="xs" className="h-6 text-[10px] text-primary gap-1" render={<Link href="/dashboard/duty" />}>
                    График <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
                <div className="p-3 space-y-2">
                  <div className="p-2.5 rounded-lg border bg-primary/5 border-primary/20 space-y-1.5">
                    <div className="text-[10px] text-primary font-medium flex items-center justify-between">
                      <span>Группа ИС-1-25</span>
                      <Badge variant="outline" className="text-[8px] px-1 py-0">Сегодня</Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5 border shrink-0">
                          <AvatarFallback className="text-[8px] font-bold bg-primary/15 text-primary">ПА</AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium text-foreground">Петров Алексей</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5 border shrink-0">
                          <AvatarFallback className="text-[8px] font-bold bg-primary/15 text-primary">СА</AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium text-foreground">Сидорова Анна</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. TEACHER DASHBOARD VIEW */}
      {/* ------------------------------------------------------------- */}
      {role === "TEACHER" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border bg-card p-3 flex items-center justify-between shadow-2xs">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Занятия сегодня</span>
                <div className="text-lg font-bold text-foreground">2 пары</div>
                <p className="text-[10px] text-muted-foreground">Кабинеты 204, 308</p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Calendar className="h-4 w-4" />
              </div>
            </div>

            <div className="rounded-xl border bg-card p-3 flex items-center justify-between shadow-2xs">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">На проверку</span>
                <div className="text-lg font-bold text-foreground">8 работ</div>
                <p className="text-[10px] text-muted-foreground">Домашние задания студентов</p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <ClipboardCheck className="h-4 w-4" />
              </div>
            </div>

            <div className="rounded-xl border bg-card p-3 flex items-center justify-between shadow-2xs">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Мои группы</span>
                <div className="text-lg font-bold text-foreground">2 группы</div>
                <p className="text-[10px] text-muted-foreground">ИС-1-25, ИС-2-24</p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Users className="h-4 w-4" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 rounded-xl border bg-card p-3.5 space-y-3">
              <div className="flex items-center justify-between border-b pb-2.5">
                <div>
                  <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <BarChart3 className="h-3.5 w-3.5 text-primary" />
                    Проверка домашних заданий
                  </div>
                  <p className="text-[10px] text-muted-foreground">Статистика за последние 5 недель</p>
                </div>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0">За 5 недель</Badge>
              </div>
              <TeacherOverviewChart />
            </div>

            <div className="rounded-xl border bg-card p-3.5 space-y-3">
              <div className="flex items-center justify-between border-b pb-2.5">
                <div>
                  <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <PieChartIcon className="h-3.5 w-3.5 text-primary" />
                    Успеваемость
                  </div>
                  <p className="text-[10px] text-muted-foreground">Результаты проверок</p>
                </div>
              </div>
              <TeacherGradeDistributionChart />
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. STUDENT DASHBOARD VIEW */}
      {/* ------------------------------------------------------------- */}
      {role === "STUDENT" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border bg-card p-3 flex items-center justify-between shadow-2xs">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Моя группа</span>
                <div className="text-lg font-bold text-foreground">ИС-1-25</div>
                <p className="text-[10px] text-muted-foreground">Информационные системы</p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Users className="h-4 w-4" />
              </div>
            </div>

            <div className="rounded-xl border bg-card p-3 flex items-center justify-between shadow-2xs">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Задания</span>
                <div className="text-lg font-bold text-foreground">2 работы</div>
                <p className="text-[10px] text-muted-foreground">Активные к сдаче</p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <CheckSquare className="h-4 w-4" />
              </div>
            </div>

            <div className="rounded-xl border bg-card p-3 flex items-center justify-between shadow-2xs">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Дежурство сегодня</span>
                <div className="text-xs font-bold text-foreground">Сегодня в смене</div>
                <p className="text-[10px] text-primary font-medium">Контроль чистоты</p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Clock className="h-4 w-4" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 rounded-xl border bg-card p-3.5 space-y-3">
              <div className="flex items-center justify-between border-b pb-2.5">
                <div>
                  <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-primary" />
                    Академический прогресс
                  </div>
                  <p className="text-[10px] text-muted-foreground">Динамика успеваемости и сдачи</p>
                </div>
                <Badge variant="secondary" className="text-[9px] px-1.5 py-0">Ср. балл 4.8</Badge>
              </div>
              <StudentProgressChart />
            </div>

            <div className="rounded-xl border bg-card p-3.5 space-y-3">
              <div className="flex items-center justify-between border-b pb-2.5">
                <div>
                  <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <PieChartIcon className="h-3.5 w-3.5 text-primary" />
                    Посещаемость
                  </div>
                  <p className="text-[10px] text-muted-foreground">За текущий семестр</p>
                </div>
              </div>
              <StudentAttendancePieChart />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
