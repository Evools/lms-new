import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  BookOpen,
  Calendar,
  Bell,
  CheckCircle2,
  Shield,
  UserCheck,
  GraduationCap,
  FileText,
  Clock,
  ArrowUpRight,
  ClipboardList,
} from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { name, role } = session.user;

  const roleConfigs = {
    ADMIN: { label: "Администратор", icon: Shield },
    TEACHER: { label: "Преподаватель", icon: UserCheck },
    STUDENT: { label: "Студент", icon: GraduationCap },
  };

  const currentRole = roleConfigs[role] || roleConfigs.STUDENT;

  return (
    <div className="w-full space-y-6">
      {/* Banner Card */}
      <Card className="w-full rounded-md border bg-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <h2 className="text-lg font-semibold tracking-tight">Панель управления лицеем</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Вход выполнен под аккаунтом <span className="font-medium text-foreground">{name}</span> ({currentRole.label})
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-md text-xs">
              Инструкция пользователя
            </Button>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        <Card className="rounded-md border p-4 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Группы</span>
            <Users className="h-4 w-4" />
          </div>
          <div className="text-2xl font-bold">12</div>
          <p className="text-[11px] text-muted-foreground">Активные учебные группы</p>
        </Card>

        <Card className="rounded-md border p-4 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Преподаватели</span>
            <UserCheck className="h-4 w-4" />
          </div>
          <div className="text-2xl font-bold">28</div>
          <p className="text-[11px] text-muted-foreground">Педагогический состав</p>
        </Card>

        <Card className="rounded-md border p-4 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Студенты</span>
            <GraduationCap className="h-4 w-4" />
          </div>
          <div className="text-2xl font-bold">340</div>
          <p className="text-[11px] text-muted-foreground">Зачисленные учащиеся</p>
        </Card>

        <Card className="rounded-md border p-4 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Задания</span>
            <ClipboardList className="h-4 w-4" />
          </div>
          <div className="text-2xl font-bold">45</div>
          <p className="text-[11px] text-muted-foreground">Активные домашние задания</p>
        </Card>
      </div>

      {/* Core Modules & Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        {/* Main Workspace Column */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="rounded-md border">
            <CardHeader className="border-b pb-3">
              <CardTitle className="text-sm font-semibold">Мои группы и предметы</CardTitle>
              <CardDescription className="text-xs">Быстрый доступ к учебным материалам и журналам</CardDescription>
            </CardHeader>
            <CardContent className="p-0 divide-y">
              <div className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                <div className="space-y-0.5">
                  <div className="text-sm font-medium">ИС-1-25 — Веб-программирование</div>
                  <div className="text-xs text-muted-foreground">Преподаватель: Иванов И.И. | Студентов: 24</div>
                </div>
                <Button variant="ghost" size="xs" className="rounded-md">
                  Открыть <ArrowUpRight className="h-3 w-3 ml-1" />
                </Button>
              </div>

              <div className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                <div className="space-y-0.5">
                  <div className="text-sm font-medium">ИС-2-24 — Базы данных</div>
                  <div className="text-xs text-muted-foreground">Преподаватель: Сидоров А.П. | Студентов: 26</div>
                </div>
                <Button variant="ghost" size="xs" className="rounded-md">
                  Открыть <ArrowUpRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-md border">
            <CardHeader className="border-b pb-3">
              <CardTitle className="text-sm font-semibold">Последние объявления лицея</CardTitle>
              <CardDescription className="text-xs">Официальная информация для преподавателей и учащихся</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="p-3 border rounded-md bg-muted/30 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">Подготовка к педагогическому совету</span>
                  <span className="text-[11px] text-muted-foreground">Сегодня, 14:00</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Все преподаватели приглашаются на заседание педсовета в 304 кабинете.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Side Info Column */}
        <div className="space-y-4">
          <Card className="rounded-md border">
            <CardHeader className="border-b pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Дежурные сегодня
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 border rounded-md">
                <div>
                  <div className="font-medium">Петров Алексей</div>
                  <div className="text-muted-foreground text-[11px]">Старший дежурный (ИС-1-25)</div>
                </div>
                <Badge variant="outline" className="text-[10px] rounded-md">Старший</Badge>
              </div>
              <div className="flex items-center justify-between p-2 border rounded-md">
                <div>
                  <div className="font-medium">Сидорова Анна</div>
                  <div className="text-muted-foreground text-[11px]">Дежурный (ИС-1-25)</div>
                </div>
                <Badge variant="ghost" className="text-[10px] rounded-md">Дежурный</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-md border">
            <CardHeader className="border-b pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Быстрый доступ
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-1 text-xs">
              <Button variant="ghost" className="w-full justify-start rounded-md h-8 text-xs">
                <BookOpen className="h-3.5 w-3.5 mr-2" /> Учебные материалы (LMS)
              </Button>
              <Button variant="ghost" className="w-full justify-start rounded-md h-8 text-xs">
                <Calendar className="h-3.5 w-3.5 mr-2" /> Журнал посещаемости
              </Button>
              <Button variant="ghost" className="w-full justify-start rounded-md h-8 text-xs">
                <Bell className="h-3.5 w-3.5 mr-2" /> Документы лицея
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
