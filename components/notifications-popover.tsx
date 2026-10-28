"use client";

import React, { useState, useEffect, useTransition, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  Megaphone,
  FileCheck2,
  ClipboardList,
  Award,
  Info,
  ChevronRight,
  Building2,
  Clock,
  FileText,
  CalendarCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import {
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
} from "@/app/dashboard/notifications/actions";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  link?: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsPopoverProps {
  initialUnreadCount?: number;
  initialNotifications?: NotificationItem[];
}

function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "только что";
  if (diffMin < 60) return `${diffMin} мин назад`;
  if (diffHours < 24) return `${diffHours} ч назад`;
  if (diffDays === 1) return "Вчера";
  if (diffDays < 7) return `${diffDays} дн назад`;

  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "short",
  });
}

export function NotificationsPopover({
  initialUnreadCount = 0,
  initialNotifications = [],
}: NotificationsPopoverProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    setUnreadCount(initialUnreadCount);
  }, [initialUnreadCount]);

  useEffect(() => {
    setNotifications(initialNotifications);
  }, [initialNotifications]);

  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Optimistic update: instant UI without extra DB fetch
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

    startTransition(async () => {
      await markAllNotificationsAsReadAction();
    });
  };

  const handleNotificationClick = (n: NotificationItem) => {
    if (!n.isRead) {
      // Optimistic update: instant UI without extra DB fetch
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, isRead: true } : item))
      );
      markNotificationAsReadAction(n.id);
    }
    setIsOpen(false);
    if (n.link) {
      router.push(n.link);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "TEST":
        return <FileCheck2 className="h-3.5 w-3.5 text-primary shrink-0" />;
      case "ANNOUNCEMENT":
        return <Megaphone className="h-3.5 w-3.5 text-primary shrink-0" />;
      case "ASSIGNMENT":
        return <ClipboardList className="h-3.5 w-3.5 text-primary shrink-0" />;
      case "GRADE":
      case "SCHOLARSHIP":
        return <Award className="h-3.5 w-3.5 text-primary shrink-0" />;
      case "PRACTICE":
        return <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />;
      case "DUTY":
        return <Clock className="h-3.5 w-3.5 text-primary shrink-0" />;
      case "DOCUMENT":
        return <FileText className="h-3.5 w-3.5 text-primary shrink-0" />;
      case "ATTENDANCE":
        return <CalendarCheck className="h-3.5 w-3.5 text-primary shrink-0" />;
      default:
        return <Info className="h-3.5 w-3.5 text-primary shrink-0" />;
    }
  };

  const displayedNotifications = useMemo(() => {
    if (filter === "unread") {
      return notifications.filter((n) => !n.isRead);
    }
    return notifications;
  }, [notifications, filter]);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger
        render={
          <Button
            size="icon-sm"
            variant="ghost"
            className="relative size-8 p-0 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
            title="Уведомления"
          />
        }
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-80 p-0 text-xs rounded-lg border border-border bg-popover text-popover-foreground z-50 overflow-hidden"
      >
        {/* Header */}
        <div className="p-3 border-b bg-muted/40 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-sm font-bold text-foreground">
              <Bell className="h-3.5 w-3.5 text-primary" />
              <span>Уведомления</span>
              {unreadCount > 0 && (
                <Badge variant="default" className="text-[10px] h-4 px-1.5 font-medium">
                  {unreadCount}
                </Badge>
              )}
            </div>

            {unreadCount > 0 && (
              <Button
                size="xs"
                variant="ghost"
                onClick={handleMarkAllRead}
                disabled={isPending}
                className="h-6 px-2 text-[11px] text-muted-foreground hover:text-primary gap-1 rounded-md cursor-pointer"
                title="Прочитать все"
              >
                <CheckCheck className="h-3 w-3" /> Все прочитаны
              </Button>
            )}
          </div>

          {/* Segmented Pill Toggle */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-muted/60 rounded-lg border text-xs">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFilter("all");
              }}
              className={`h-6 rounded-md font-medium transition-colors cursor-pointer ${
                filter === "all"
                  ? "bg-background text-primary border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Все
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFilter("unread");
              }}
              className={`h-6 rounded-md font-medium transition-colors cursor-pointer ${
                filter === "unread"
                  ? "bg-background text-primary border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Непрочитанные {unreadCount > 0 ? `(${unreadCount})` : ""}
            </button>
          </div>
        </div>

        {/* List */}
        <div className="max-h-[300px] overflow-y-auto divide-y divide-border/60">
          {displayedNotifications.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground space-y-1">
              <Bell className="h-6 w-6 text-muted-foreground/40 mx-auto" />
              <p className="font-medium text-foreground">
                {filter === "unread" ? "Нет непрочитанных уведомлений" : "Нет уведомлений"}
              </p>
              <p className="text-[11px]">
                {filter === "unread"
                  ? "Вы прочитали все уведомления"
                  : "Все важные события появятся здесь"}
              </p>
            </div>
          ) : (
            displayedNotifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`p-3 transition-colors cursor-pointer flex items-start gap-2.5 hover:bg-muted/50 ${
                  !n.isRead
                    ? "bg-primary/5 border-l-2 border-l-primary"
                    : "opacity-80"
                }`}
              >
                <div className="mt-0.5 p-1 rounded-md bg-background border border-border shrink-0">
                  {getTypeIcon(n.type)}
                </div>

                <div className="space-y-0.5 flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="font-medium text-foreground text-xs truncate block">
                      {n.title}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] text-muted-foreground">
                        {formatRelativeTime(n.createdAt)}
                      </span>
                      {!n.isRead && (
                        <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 leading-snug font-normal">
                    {n.message}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-2 border-t bg-muted/20 text-center">
          <Link
            href="/dashboard/notifications"
            onClick={() => setIsOpen(false)}
            className="inline-flex items-center justify-center gap-1 text-[11px] font-medium text-primary hover:underline py-1"
          >
            Все уведомления <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
