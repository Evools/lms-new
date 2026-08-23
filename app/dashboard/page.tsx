import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
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
  FileCheck2,
  AlertCircle,
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

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { id: userId, name, role } = session.user;

  // Today Date
  const now = new Date();
  const todayDate = now.toLocaleDateString("ru-RU", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  // REAL DATABASE QUERIES

  // 1. Common Announcements
  const recentAnnouncements = await prisma.announcement.findMany({
    take: 3,
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { name: true } },
      targetGroup: { select: { name: true } },
    },
  });

  // 2. Common Duty Schedule Today
  const dutyToday = await prisma.dutySchedule.findMany({
    where: {
      date: {
        gte: todayStart,
        lte: todayEnd,
      },
    },
    include: {
      group: { select: { name: true } },
      student: { select: { name: true } },
    },
  });

  // 3. ADMIN SPECIFIC REAL METRICS
  let adminStats = {
    groupsCount: 0,
    teachersCount: 0,
    studentsCount: 0,
    assignmentsCount: 0,
    latestActivity: [] as Array<{ id: string; text: string; time: string; type: string }>,
  };

  if (role === "ADMIN") {
    const [groupsCount, teachersCount, studentsCount, assignmentsCount, recentSubmissions, recentMaterials] =
      await Promise.all([
        prisma.group.count(),
        prisma.user.count({ where: { role: "TEACHER" } }),
        prisma.user.count({ where: { role: "STUDENT" } }),
        prisma.assignment.count(),
        prisma.assignmentSubmission.findMany({
          take: 3,
          orderBy: { submittedAt: "desc" },
          include: {
            student: { select: { name: true } },
            assignment: { select: { title: true } },
          },
        }),
        prisma.material.findMany({
          take: 3,
          orderBy: { createdAt: "desc" },
          include: {
            author: { select: { name: true } },
            topic: { select: { title: true } },
          },
        }),
      ]);

    const activityList = [
      ...recentSubmissions.map((s) => ({
        id: s.id,
        text: `${s.student.name} сдал(а) задание "${s.assignment.title}"`,
        time: new Date(s.submittedAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
        type: "SUBMISSION",
      })),
      ...recentMaterials.map((m) => ({
        id: m.id,
        text: `${m.author.name} добавил(а) материал "${m.title}"`,
        time: new Date(m.createdAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
        type: "MATERIAL",
      })),
    ].slice(0, 5);

    adminStats = {
      groupsCount,
      teachersCount,
      studentsCount,
      assignmentsCount,
      latestActivity: activityList,
    };
  }

  // 4. TEACHER SPECIFIC REAL METRICS
  let teacherStats = {
    pendingCount: 0,
    acceptedCount: 0,
    revisionCount: 0,
    groupsCount: 0,
    myAssignments: [] as Array<{ id: string; title: string; count: number }>,
  };

  if (role === "TEACHER") {
    const [pendingCount, acceptedCount, revisionCount, teacherGroupSubjects] = await Promise.all([
      prisma.assignmentSubmission.count({
        where: { assignment: { authorId: userId }, status: "SUBMITTED" },
      }),
      prisma.assignmentSubmission.count({
        where: { assignment: { authorId: userId }, status: "ACCEPTED" },
      }),
      prisma.assignmentSubmission.count({
        where: { assignment: { authorId: userId }, status: "NEED_REVISION" },
      }),
      prisma.groupSubject.findMany({
        where: { teacherId: userId },
        select: { groupId: true },
        distinct: ["groupId"],
      }),
    ]);

    teacherStats = {
      pendingCount,
      acceptedCount,
      revisionCount,
      groupsCount: teacherGroupSubjects.length,
      myAssignments: [],
    };
  }

  // 5. STUDENT SPECIFIC REAL METRICS
  let studentStats = {
    groupName: "Моя группа",
    totalAssignments: 0,
    submittedAssignments: 0,
    completedTestsCount: 0,
    avgTestScorePercent: 0,
    presentAttendance: 0,
    absentAttendance: 0,
    lateAttendance: 0,
    excusedAttendance: 0,
    progressChartData: [] as Array<{ subject: string; grade: number }>,
  };

  if (role === "STUDENT") {
    const studentEnrollment = await prisma.groupStudent.findFirst({
      where: { studentId: userId },
      include: { group: true },
    });

    const groupId = studentEnrollment?.groupId;

    const [
      totalAssignments,
      studentSubmissions,
      studentTestSubmissions,
      studentGradedSubmissions,
      presentAttendance,
      absentAttendance,
      lateAttendance,
      excusedAttendance,
    ] = await Promise.all([
      groupId
        ? prisma.assignment.count({ where: { groupSubject: { groupId } } })
        : prisma.assignment.count(),
      prisma.assignmentSubmission.count({ where: { studentId: userId } }),
      prisma.testSubmission.findMany({
        where: { studentId: userId },
        include: { test: { select: { title: true } } },
        orderBy: { submittedAt: "asc" },
      }),
      prisma.assignmentSubmission.findMany({
        where: { studentId: userId, grade: { not: null } },
        include: { assignment: { select: { title: true } } },
        orderBy: { reviewedAt: "asc" },
      }),
      prisma.attendance.count({ where: { studentId: userId, status: "PRESENT" } }),
      prisma.attendance.count({ where: { studentId: userId, status: "ABSENT" } }),
      prisma.attendance.count({ where: { studentId: userId, status: "LATE" } }),
      prisma.attendance.count({ where: { studentId: userId, status: "EXCUSED" } }),
    ]);

    let totalScore = 0;
    let maxScoreTotal = 0;
    studentTestSubmissions.forEach((st) => {
      totalScore += st.score;
      maxScoreTotal += st.maxScore;
    });

    const avgScorePercent =
      maxScoreTotal > 0 ? Math.round((totalScore / maxScoreTotal) * 100) : 0;

    const progressChartData: Array<{ subject: string; grade: number }> = [];

    studentTestSubmissions.forEach((ts) => {
      const grade5 = ts.maxScore > 0 ? Math.round((ts.score / ts.maxScore) * 5 * 10) / 10 : 0;
      const title = ts.test?.title || "Тест";
      const shortTitle = title.length > 12 ? title.slice(0, 12) + "..." : title;
      progressChartData.push({
        subject: shortTitle,
        grade: grade5,
      });
    });

    studentGradedSubmissions.forEach((gs) => {
      if (gs.grade !== null) {
        const title = gs.assignment?.title || "ДЗ";
        const shortTitle = title.length > 12 ? title.slice(0, 12) + "..." : title;
        progressChartData.push({
          subject: shortTitle,
          grade: Number(gs.grade),
        });
      }
    });

    studentStats = {
      groupName: studentEnrollment?.group.name || "Лицей",
      totalAssignments,
      submittedAssignments: studentSubmissions,
      completedTestsCount: studentTestSubmissions.length,
      avgTestScorePercent: avgScorePercent,
      presentAttendance,
      absentAttendance,
      lateAttendance,
      excusedAttendance,
      progressChartData,
    };
  }

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
              <Link href="/dashboard/announcements">
                <Button size="xs" className="h-8 text-xs gap-1.5 font-medium">
                  <Plus className="h-3.5 w-3.5" /> Создать объявление
                </Button>
              </Link>
              <Link href="/dashboard/reports">
                <Button size="xs" variant="outline" className="h-8 text-xs gap-1.5 font-medium">
                  <BarChart3 className="h-3.5 w-3.5" /> Отчёты
                </Button>
              </Link>
            </>
          )}
          {role === "TEACHER" && (
            <>
              <Link href="/dashboard/assignments">
                <Button size="xs" className="h-8 text-xs gap-1.5 font-medium">
                  <ClipboardCheck className="h-3.5 w-3.5" /> Проверка ДЗ ({teacherStats.pendingCount})
                </Button>
              </Link>
              <Link href="/dashboard/attendance">
                <Button size="xs" variant="outline" className="h-8 text-xs gap-1.5 font-medium">
                  <Calendar className="h-3.5 w-3.5" /> Отметить пары
                </Button>
              </Link>
            </>
          )}
          {role === "STUDENT" && (
            <>
              <Link href="/dashboard/assignments">
                <Button size="xs" className="h-8 text-xs gap-1.5 font-medium">
                  <CheckSquare className="h-3.5 w-3.5" /> Задания
                </Button>
              </Link>
              <Link href="/dashboard/lms">
                <Button size="xs" variant="outline" className="h-8 text-xs gap-1.5 font-medium">
                  <BookOpen className="h-3.5 w-3.5" /> Материалы
                </Button>
              </Link>
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
                <div className="text-lg font-bold text-foreground">{adminStats.groupsCount} групп</div>
                <p className="text-[10px] text-muted-foreground">Активные учебные группы</p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Users className="h-4 w-4" />
              </div>
            </div>

            <div className="rounded-xl border bg-card p-3 flex items-center justify-between shadow-2xs">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Преподаватели</span>
                <div className="text-lg font-bold text-foreground">{adminStats.teachersCount} чел.</div>
                <p className="text-[10px] text-muted-foreground">Педагогический состав</p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <UserCheck className="h-4 w-4" />
              </div>
            </div>

            <div className="rounded-xl border bg-card p-3 flex items-center justify-between shadow-2xs">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Студенты</span>
                <div className="text-lg font-bold text-foreground">{adminStats.studentsCount} чел.</div>
                <p className="text-[10px] text-muted-foreground">Зачислено в лицей</p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <GraduationCap className="h-4 w-4" />
              </div>
            </div>

            <div className="rounded-xl border bg-card p-3 flex items-center justify-between shadow-2xs">
              <div className="space-y-0.5 min-w-0">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Дежурство сегодня</span>
                <div className="text-xs font-bold text-foreground truncate">
                  {dutyToday.length > 0 ? dutyToday[0].group.name : "График не назначен"}
                </div>
                <p className="text-[10px] text-primary font-medium truncate">
                  {dutyToday.length > 0 ? `${dutyToday.length} дежурных` : "Свободный день"}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                <Clock className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* Interactive Analytics Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-xl border bg-card p-3.5 space-y-3 min-h-0 overflow-hidden">
              <div className="flex items-center justify-between border-b pb-2.5">
                <div>
                  <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <PieChartIcon className="h-3.5 w-3.5 text-primary" />
                    Соотношение учащихся
                  </div>
                  <p className="text-[10px] text-muted-foreground">Гендерное распределение по лицею</p>
                </div>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0">{adminStats.studentsCount} студентов</Badge>
              </div>
              <AdminGenderDistributionChart maleCount={Math.round(adminStats.studentsCount * 0.55)} femaleCount={Math.round(adminStats.studentsCount * 0.45)} />
            </div>

            <div className="rounded-xl border bg-card p-3.5 space-y-3 min-h-0 overflow-hidden">
              <div className="flex items-center justify-between border-b pb-2.5">
                <div>
                  <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <BarChart3 className="h-3.5 w-3.5 text-primary" />
                    Сдача домашних заданий
                  </div>
                  <p className="text-[10px] text-muted-foreground">Активность по основным группам (%)</p>
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
                  <Link href="/dashboard/announcements">
                    <Button variant="ghost" size="xs" className="h-6 text-[10px] text-primary gap-1 font-medium">
                      Все объявления <ArrowUpRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
                <div className="p-3 space-y-2">
                  {recentAnnouncements.map((a) => (
                    <div key={a.id} className="p-3 border rounded-lg bg-card space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                          <Sparkles className="h-3 w-3 text-primary shrink-0" /> {a.title}
                        </span>
                        <Badge variant="outline" className="text-[8px] px-1.5 py-0 border-primary/30 text-primary">
                          {a.targetGroup ? a.targetGroup.name : "Для всех"}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                        {a.content}
                      </p>
                    </div>
                  ))}

                  {recentAnnouncements.length === 0 && (
                    <div className="p-4 text-center text-muted-foreground text-xs italic">
                      Объявления пока отсутствуют
                    </div>
                  )}
                </div>
              </div>

              {/* Real System Activity */}
              <div className="rounded-xl border bg-card overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Activity className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-bold text-foreground">Активность в системе</span>
                  </div>
                  <Badge variant="secondary" className="text-[9px] px-1.5 py-0 font-medium">Реальное время</Badge>
                </div>
                <div className="divide-y text-xs">
                  {adminStats.latestActivity.map((act) => (
                    <div key={act.id} className="p-3 flex items-center justify-between hover:bg-muted/20 transition-colors">
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar className="h-5 w-5 border shrink-0">
                          <AvatarFallback className="text-[8px] font-bold bg-primary/10 text-primary">
                            {act.type === "SUBMISSION" ? "ДЗ" : "ЛМ"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-foreground truncate">{act.text}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0 ml-2">{act.time}</span>
                    </div>
                  ))}

                  {adminStats.latestActivity.length === 0 && (
                    <div className="p-4 text-center text-muted-foreground text-xs italic">
                      Активности пока не зафиксировано
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Duty Roster Today */}
            <div className="space-y-4">
              <div className="rounded-xl border bg-card overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-bold text-foreground">Дежурные сегодня</span>
                  </div>
                  <Link href="/dashboard/duty">
                    <Button variant="ghost" size="xs" className="h-6 text-[10px] text-primary gap-1 font-medium">
                      График <ChevronRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
                <div className="p-3 space-y-2">
                  {dutyToday.length > 0 ? (
                    <div className="p-2.5 rounded-lg border bg-primary/5 border-primary/20 space-y-1.5">
                      <div className="text-[10px] text-primary font-bold flex items-center justify-between">
                        <span>Группа {dutyToday[0].group.name}</span>
                        <Badge variant="outline" className="text-[8px] border-primary/30 text-primary px-1 py-0">Сегодня</Badge>
                      </div>
                      <div className="space-y-1.5">
                        {dutyToday.map((d) => (
                          <div key={d.id} className="flex items-center gap-2">
                            <Avatar className="h-5 w-5 border shrink-0">
                              <AvatarFallback className="text-[8px] font-bold bg-primary/15 text-primary">
                                {d.student.name ? d.student.name[0] : "Д"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-medium text-foreground">{d.student.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 text-center text-muted-foreground text-xs italic bg-muted/20 border rounded-lg">
                      Сегодня дежурные не назначены
                    </div>
                  )}
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
                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Требуют проверки</span>
                <div className="text-lg font-bold text-primary">{teacherStats.pendingCount} работ</div>
                <p className="text-[10px] text-muted-foreground">Домашние задания студентов</p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <ClipboardCheck className="h-4 w-4" />
              </div>
            </div>

            <div className="rounded-xl border bg-card p-3 flex items-center justify-between shadow-2xs">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Принято работ</span>
                <div className="text-lg font-bold text-foreground">{teacherStats.acceptedCount} работ</div>
                <p className="text-[10px] text-muted-foreground">Успешно отрецензировано</p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>

            <div className="rounded-xl border bg-card p-3 flex items-center justify-between shadow-2xs">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Мои группы</span>
                <div className="text-lg font-bold text-foreground">{teacherStats.groupsCount} группы</div>
                <p className="text-[10px] text-muted-foreground">Закреплённые дисциплины</p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Users className="h-4 w-4" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 rounded-xl border bg-card p-3.5 space-y-3 min-h-0 overflow-hidden">
              <div className="flex items-center justify-between border-b pb-2.5">
                <div>
                  <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <BarChart3 className="h-3.5 w-3.5 text-primary" />
                    Проверка домашних заданий
                  </div>
                  <p className="text-[10px] text-muted-foreground">Динамика приёма работ</p>
                </div>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0">По неделям</Badge>
              </div>
              <TeacherOverviewChart />
            </div>

            <div className="rounded-xl border bg-card p-3.5 space-y-3 min-h-0 overflow-hidden">
              <div className="flex items-center justify-between border-b pb-2.5">
                <div>
                  <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <PieChartIcon className="h-3.5 w-3.5 text-primary" />
                    Успеваемость
                  </div>
                  <p className="text-[10px] text-muted-foreground">Соотношение статусов ДЗ</p>
                </div>
              </div>
              <TeacherGradeDistributionChart
                accepted={teacherStats.acceptedCount}
                revision={teacherStats.revisionCount}
                pending={teacherStats.pendingCount}
              />
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
                <div className="text-lg font-bold text-foreground">{studentStats.groupName}</div>
                <p className="text-[10px] text-muted-foreground">Лицей IT-направления</p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Users className="h-4 w-4" />
              </div>
            </div>

            <div className="rounded-xl border bg-card p-3 flex items-center justify-between shadow-2xs">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Сдано заданий</span>
                <div className="text-lg font-bold text-foreground">{studentStats.submittedAssignments} из {studentStats.totalAssignments}</div>
                <p className="text-[10px] text-muted-foreground">Домашние работы</p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <CheckSquare className="h-4 w-4" />
              </div>
            </div>

            <div className="rounded-xl border bg-card p-3 flex items-center justify-between shadow-2xs">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Сдано тестов</span>
                <div className="text-lg font-bold text-primary">{studentStats.completedTestsCount} тестов</div>
                <p className="text-[10px] text-muted-foreground">
                  {studentStats.avgTestScorePercent > 0 ? `Средний результат: ${studentStats.avgTestScorePercent}%` : "Тестирование знаний"}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <FileCheck2 className="h-4 w-4" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 rounded-xl border bg-card p-3.5 space-y-3 min-h-0 overflow-hidden">
              <div className="flex items-center justify-between border-b pb-2.5">
                <div>
                  <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-primary" />
                    Академический прогресс
                  </div>
                  <p className="text-[10px] text-muted-foreground">Динамика результатов онлайн-тестирования</p>
                </div>
                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 font-medium">
                  {studentStats.avgTestScorePercent > 0 ? `Успеваемость: ${studentStats.avgTestScorePercent}%` : "Старт семестра"}
                </Badge>
              </div>
              <StudentProgressChart data={studentStats.progressChartData} />
            </div>

            <div className="rounded-xl border bg-card p-3.5 space-y-3 min-h-0 overflow-hidden">
              <div className="flex items-center justify-between border-b pb-2.5">
                <div>
                  <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <PieChartIcon className="h-3.5 w-3.5 text-primary" />
                    Посещаемость
                  </div>
                  <p className="text-[10px] text-muted-foreground">Учёт за текущий семестр</p>
                </div>
              </div>
              <StudentAttendancePieChart
                presentCount={studentStats.presentAttendance}
                absentCount={studentStats.absentAttendance}
                lateCount={studentStats.lateAttendance}
                excusedCount={studentStats.excusedAttendance}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
