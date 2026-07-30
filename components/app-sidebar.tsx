"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { logoutAction } from "@/app/actions/auth";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  Clock,
  Megaphone,
  FileText,
  BarChart3,
  Settings,
  Building2,
  LogOut,
  Shield,
  UserCheck,
  GraduationCap,
} from "lucide-react";

interface AppSidebarProps {
  user: {
    name: string;
    email: string;
    role: "ADMIN" | "TEACHER" | "STUDENT";
  };
}

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();

  const navigationItems = [
    { title: "Главная", url: "/dashboard", icon: LayoutDashboard },
    { title: "Группы", url: "/dashboard/groups", icon: Users },
    { title: "LMS & Материалы", url: "/dashboard/lms", icon: BookOpen },
    { title: "Посещаемость", url: "/dashboard/attendance", icon: CalendarCheck },
    { title: "Домашние задания", url: "/dashboard/assignments", icon: ClipboardList },
    { title: "Дежурства", url: "/dashboard/duty", icon: Clock },
    { title: "Объявления", url: "/dashboard/announcements", icon: Megaphone },
    { title: "Документы", url: "/dashboard/documents", icon: FileText },
    { title: "Отчёты", url: "/dashboard/reports", icon: BarChart3 },
    { title: "Настройки", url: "/dashboard/settings", icon: Settings },
  ];

  const roleConfigs = {
    ADMIN: { label: "Админ", variant: "default" as const, icon: Shield },
    TEACHER: { label: "Учитель", variant: "secondary" as const, icon: UserCheck },
    STUDENT: { label: "Студент", variant: "outline" as const, icon: GraduationCap },
  };

  const currentRole = roleConfigs[user.role] || roleConfigs.STUDENT;
  const RoleIcon = currentRole.icon;

  const userInitials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "U";

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Building2 className="h-4 w-4" />
          </div>
          <div className="flex flex-col gap-0.5 leading-none">
            <span className="font-semibold text-sm tracking-tight">Лицей LMS</span>
            <span className="text-[11px] text-muted-foreground">Цифровая платформа</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground px-4">
            Навигация
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const isActive = pathname === item.url;
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.title}
                      className="rounded-md"
                      render={<Link href={item.url} />}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar size="sm" className="shrink-0">
              <AvatarFallback className="rounded-md text-xs font-semibold">{userInitials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold truncate leading-tight">{user.name}</span>
              <div className="flex items-center gap-1 mt-0.5">
                <Badge variant={currentRole.variant} className="text-[10px] px-1.5 py-0 rounded-md">
                  <RoleIcon className="h-2.5 w-2.5 mr-0.5" />
                  {currentRole.label}
                </Badge>
              </div>
            </div>
          </div>

          <form action={logoutAction} className="shrink-0">
            <button
              type="submit"
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Выйти"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
