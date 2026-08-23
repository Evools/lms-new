"use client";

import * as React from "react";
import { NavMain, NavMainSection } from "@/components/nav-main";
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
  GraduationCap,
  FileCheck2,
  BookMarked,
  FolderOpen,
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
  const role = user.role || "STUDENT";

  const teams = [
    {
      name: "Лицей LMS",
      logo: <GraduationCap className="h-4 w-4" />,
      plan: "Учебный год 2026-2027",
    },
  ];

  const getNavSections = (): NavMainSection[] => {
    // 1. ADMINISTRATOR ROLE
    if (role === "ADMIN") {
      return [
        {
          groupLabel: "Обзор",
          items: [
            {
              title: "Главная панель",
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
          groupLabel: "Учебный процесс",
          items: [
            {
              title: "Группы и студенты",
              url: "/dashboard/groups",
              icon: <Users className="h-4 w-4" />,
              items: [
                {
                  title: "Учебные группы",
                  url: "/dashboard/groups",
                },
                {
                  title: "База студентов",
                  url: "/dashboard/students",
                },
              ],
            },
            {
              title: "Посещаемость",
              url: "/dashboard/attendance",
              icon: <CalendarCheck className="h-4 w-4" />,
            },
            {
              title: "График дежурств",
              url: "/dashboard/duty",
              icon: <Clock className="h-4 w-4" />,
            },
          ],
        },
        {
          groupLabel: "Обучение (LMS)",
          items: [
            {
              title: "Домашние задания",
              url: "/dashboard/assignments",
              icon: <ClipboardList className="h-4 w-4" />,
            },
            {
              title: "Учебные материалы",
              url: "/dashboard/lms/materials",
              icon: <BookOpen className="h-4 w-4" />,
            },
            {
              title: "Тесты и опросы",
              url: "/dashboard/lms/tests",
              icon: <FileCheck2 className="h-4 w-4" />,
            },
            {
              title: "Дисциплины",
              url: "/dashboard/subjects",
              icon: <BookMarked className="h-4 w-4" />,
            },
          ],
        },
        {
          groupLabel: "Управление",
          items: [
            {
              title: "Аналитика & Отчёты",
              url: "/dashboard/reports",
              icon: <BarChart3 className="h-4 w-4" />,
            },
            {
              title: "Документы лицея",
              url: "/dashboard/documents",
              icon: <FileText className="h-4 w-4" />,
            },
          ],
        },
      ];
    }

    // 2. TEACHER ROLE
    if (role === "TEACHER") {
      return [
        {
          groupLabel: "Обзор",
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
          groupLabel: "Учебный процесс",
          items: [
            {
              title: "Учебные группы",
              url: "/dashboard/groups",
              icon: <Users className="h-4 w-4" />,
            },
            {
              title: "Посещаемость пар",
              url: "/dashboard/attendance",
              icon: <CalendarCheck className="h-4 w-4" />,
            },
            {
              title: "График дежурств",
              url: "/dashboard/duty",
              icon: <Clock className="h-4 w-4" />,
            },
          ],
        },
        {
          groupLabel: "Обучение (LMS)",
          items: [
            {
              title: "Проверка заданий",
              url: "/dashboard/assignments",
              icon: <ClipboardList className="h-4 w-4" />,
            },
            {
              title: "Учебные материалы",
              url: "/dashboard/lms/materials",
              icon: <BookOpen className="h-4 w-4" />,
            },
            {
              title: "Тесты и опросы",
              url: "/dashboard/lms/tests",
              icon: <FileCheck2 className="h-4 w-4" />,
            },
            {
              title: "Дисциплины",
              url: "/dashboard/subjects",
              icon: <BookMarked className="h-4 w-4" />,
            },
          ],
        },
        {
          groupLabel: "Управление",
          items: [
            {
              title: "Документы лицея",
              url: "/dashboard/documents",
              icon: <FileText className="h-4 w-4" />,
            },
          ],
        },
      ];
    }

    // 3. STUDENT ROLE
    return [
      {
        groupLabel: "Обзор",
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
        groupLabel: "Моё обучение",
        items: [
          {
            title: "Мои задания",
            url: "/dashboard/assignments",
            icon: <ClipboardList className="h-4 w-4" />,
          },
          {
            title: "Учебные материалы",
            url: "/dashboard/lms/materials",
            icon: <BookOpen className="h-4 w-4" />,
          },
          {
            title: "Тесты & Опросы",
            url: "/dashboard/lms/tests",
            icon: <FileCheck2 className="h-4 w-4" />,
          },
        ],
      },
      {
        groupLabel: "Группа и расписание",
        items: [
          {
            title: "Моя группа",
            url: "/dashboard/groups",
            icon: <Users className="h-4 w-4" />,
          },
          {
            title: "Посещаемость",
            url: "/dashboard/attendance",
            icon: <CalendarCheck className="h-4 w-4" />,
          },
          {
            title: "График дежурств",
            url: "/dashboard/duty",
            icon: <Clock className="h-4 w-4" />,
          },
          {
            title: "Документы лицея",
            url: "/dashboard/documents",
            icon: <FileText className="h-4 w-4" />,
          },
        ],
      },
    ];
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border/80 bg-sidebar" {...props}>
      <SidebarHeader className="border-b p-2">
        <TeamSwitcher teams={teams} />
      </SidebarHeader>
      <SidebarContent className="gap-0 py-2 px-2">
        <NavMain sections={getNavSections()} />
      </SidebarContent>
      <SidebarFooter className="border-t p-2">
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
