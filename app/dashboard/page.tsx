import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import {
  Shield,
  UserCheck,
  GraduationCap,
  LogOut,
  Sparkles,
  Building2,
  Users,
  BookOpen,
  Calendar,
  Bell,
  FileText,
} from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { name, email, role } = session.user;

  const roleBadges = {
    ADMIN: { label: "Администратор", color: "bg-amber-500/10 text-amber-400 border-amber-500/20", icon: Shield },
    TEACHER: { label: "Преподаватель", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: UserCheck },
    STUDENT: { label: "Студент", color: "bg-sky-500/10 text-sky-400 border-sky-500/20", icon: GraduationCap },
  };

  const currentRole = roleBadges[role] || roleBadges.STUDENT;
  const RoleIcon = currentRole.icon;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans selection:bg-indigo-500 selection:text-white">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Navigation Bar */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-md">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <span>Лицей LMS</span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono">
                  v0.1
                </span>
              </h1>
              <p className="text-xs text-slate-400">Цифровая экосистема лицея</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 pr-2 border-r border-slate-800">
              <div className="text-right">
                <div className="text-sm font-semibold text-slate-200">{name}</div>
                <div className="text-xs text-slate-400">{email}</div>
              </div>
              <div className={`px-2.5 py-1 rounded-lg border text-xs font-medium flex items-center gap-1.5 ${currentRole.color}`}>
                <RoleIcon className="w-3.5 h-3.5" />
                <span>{currentRole.label}</span>
              </div>
            </div>

            <form action={logoutAction}>
              <button
                type="submit"
                className="p-2 rounded-xl bg-slate-800/60 hover:bg-red-950/40 hover:text-red-400 text-slate-400 border border-slate-700/50 hover:border-red-800/50 transition-all cursor-pointer"
                title="Выйти из аккаунта"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </header>

        {/* Welcome Section */}
        <div className="relative p-8 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900/80 to-purple-950/60 border border-indigo-500/20 overflow-hidden shadow-2xl">
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Успешный вход в систему</span>
            </div>
            
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Добро пожаловать, {name}!
            </h2>
            
            <p className="text-sm text-slate-300 leading-relaxed">
              Вы вошли в систему под ролью{" "}
              <span className="font-semibold text-indigo-300">{currentRole.label}</span>. Система авторизации Auth.js настроена и работает с PostgreSQL & Prisma ORM.
            </p>
          </div>
        </div>

        {/* Quick Action Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
            <div className="p-2 w-fit rounded-lg bg-indigo-500/10 text-indigo-400">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-200 text-base">Группы</h3>
            <p className="text-xs text-slate-400">Управление учебными группами, составом и старостами</p>
          </div>

          <div className="p-5 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
            <div className="p-2 w-fit rounded-lg bg-purple-500/10 text-purple-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-200 text-base">LMS & Материалы</h3>
            <p className="text-xs text-slate-400">Темы, лекции, домашние задания и прикрепленные файлы</p>
          </div>

          <div className="p-5 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
            <div className="p-2 w-fit rounded-lg bg-emerald-500/10 text-emerald-400">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-200 text-base">Посещаемость & Дежурства</h3>
            <p className="text-xs text-slate-400">Учет посещаемости и автоматическое распределение дежурных</p>
          </div>

          <div className="p-5 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
            <div className="p-2 w-fit rounded-lg bg-amber-500/10 text-amber-400">
              <Bell className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-200 text-base">Объявления & Документы</h3>
            <p className="text-xs text-slate-400">Публикация объявлений и архив лицейских документов</p>
          </div>
        </div>
      </div>
    </div>
  );
}
