"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const ROUTE_NAMES: Record<string, string> = {
  dashboard: "Главная",
  announcements: "Объявления",
  groups: "Учебные группы",
  students: "Студенты",
  attendance: "Посещаемость",
  duty: "График дежурств",
  assignments: "Домашние задания",
  lms: "LMS",
  materials: "Материалы",
  tests: "Тесты",
  subjects: "Дисциплины",
  reports: "Отчёты",
  documents: "Документы",
  notifications: "Уведомления",
  profile: "Профиль",
  settings: "Настройки",
  new: "Создание",
  edit: "Редактирование",
  results: "Результаты",
  take: "Прохождение",
};

export function AppHeaderBreadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length <= 1) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage className="text-xs font-medium text-foreground">
              Главная панель
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  // Generate breadcrumb items
  const items = segments.map((segment, index) => {
    const url = "/" + segments.slice(0, index + 1).join("/");
    const isLast = index === segments.length - 1;
    const title = ROUTE_NAMES[segment] || (segment.length > 12 ? `${segment.slice(0, 8)}...` : segment);

    return {
      title,
      url,
      isLast,
    };
  });

  return (
    <Breadcrumb>
      <BreadcrumbList className="text-xs">
        {items.map((item, index) => (
          <React.Fragment key={item.url}>
            {index > 0 && <BreadcrumbSeparator className="h-3.5 w-3.5" />}
            <BreadcrumbItem>
              {item.isLast ? (
                <BreadcrumbPage className="font-medium text-foreground max-w-[160px] truncate">
                  {item.title}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink
                  href={item.url}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.title}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
