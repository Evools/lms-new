"use client";

import * as React from "react";
import { NavMain, NavMainSection } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
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
  Folder,
} from "lucide-react";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: {
    name: string;
    email: string;
    role: "ADMIN" | "TEACHER" | "STUDENT";
    avatar?: string | null;
  };
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const teams = [
    {
      name: "Лицей LMS",
      logo: <Building2 className="h-4 w-4" />,
      plan: "Учебный год 2026-2027",
    },
  ];

  const navSections: NavMainSection[] = [
    {
      groupLabel: "Главное",
      items: [
        {
          title: "Главная",
          url: "/dashboard",
          icon: <LayoutDashboard className="h-4 w-4" />,
        },
        {
          title: "Объявления",
          url: "/dashboard/announcements",
          icon: <Megaphone className="h-4 w-4" />,
        },
      ],
    },
    {
      groupLabel: "Обучение",
      items: [
        {
          title: "Группы",
          url: "/dashboard/groups",
          icon: <Users className="h-4 w-4" />,
          items: [
            { title: "Все группы", url: "/dashboard/groups" },
            { title: "Группа ИС-1-25", url: "/dashboard/groups/is-1-25" },
            { title: "Группа ИС-2-24", url: "/dashboard/groups/is-2-24" },
          ],
        },
        {
          title: "LMS & Материалы",
          url: "/dashboard/lms",
          icon: <BookOpen className="h-4 w-4" />,
          items: [
            { title: "Темы & Уроки", url: "/dashboard/lms/topics" },
            { title: "Тесты & Опросы", url: "/dashboard/lms/tests" },
            { title: "Лекции & Практики", url: "/dashboard/lms/materials" },
          ],
        },
        {
          title: "Посещаемость",
          url: "/dashboard/attendance",
          icon: <CalendarCheck className="h-4 w-4" />,
        },
        {
          title: "Домашние задания",
          url: "/dashboard/assignments",
          icon: <ClipboardList className="h-4 w-4" />,
        },
        {
          title: "Дежурства",
          url: "/dashboard/duty",
          icon: <Clock className="h-4 w-4" />,
        },
      ],
    },
    {
      groupLabel: "Система",
      items: [
        {
          title: "Отчёты",
          url: "/dashboard/reports",
          icon: <BarChart3 className="h-4 w-4" />,
        },
        {
          title: "Документы",
          url: "/dashboard/documents",
          icon: <FileText className="h-4 w-4" />,
        },
        {
          title: "Настройки",
          url: "/dashboard/settings",
          icon: <Settings className="h-4 w-4" />,
        },
      ],
    },
  ];

  const quickGroups = [
    {
      name: "Группа ИС-1-25",
      url: "/dashboard/groups/is-1-25",
      icon: <Folder className="h-4 w-4" />,
    },
    {
      name: "Группа ИС-2-24",
      url: "/dashboard/groups/is-2-24",
      icon: <Folder className="h-4 w-4" />,
    },
  ];

  return (
    <Sidebar collapsible="icon" className="border-r border-border/80" {...props}>
      <SidebarHeader className="border-b p-2">
        <TeamSwitcher teams={teams} />
      </SidebarHeader>
      <SidebarContent className="gap-0 py-2">
        <NavMain sections={navSections} />
        <NavProjects projects={quickGroups} />
      </SidebarContent>
      <SidebarFooter className="border-t p-2">
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
