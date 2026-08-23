"use client";

import React, { useState, useEffect, useTransition } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import {
  getNotificationsAction,
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
} from "@/app/dashboard/notifications/actions";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  link?: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export function NotificationsPopover() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const fetchNotifications = async () => {
    const res = await getNotificationsAction(5);
    if (res.success) {
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    startTransition(async () => {
      await markAllNotificationsAsReadAction();
      await fetchNotifications();
    });
  };

  const handleNotificationClick = async (n: NotificationItem) => {
    if (!n.isRead) {
      await markNotificationAsReadAction(n.id);
      fetchNotifications();
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
        return <Award className="h-3.5 w-3.5 text-emerald-500 shrink-0" />;
      default:
        return <Info className="h-3.5 w-3.5 text-primary shrink-0" />;
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger
        render={
          <Button
            size="xs"
            variant="ghost"
            className="relative h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground"
            title="Уведомления"
          />
        }
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground shadow-2xs">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-80 p-0 text-xs shadow-xl rounded-xl border border-border bg-popover text-popover-foreground z-50 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b bg-muted/40">
          <div className="flex items-center gap-1.5 font-bold text-foreground">
            <Bell className="h-3.5 w-3.5 text-primary" />
            <span>Уведомления</span>
            {unreadCount > 0 && (
              <Badge variant="default" className="text-[9px] h-4 px-1.5 font-bold">
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
              className="h-6 px-1.5 text-[10px] text-muted-foreground hover:text-primary gap-1"
              title="Прочитать все"
            >
              <CheckCheck className="h-3 w-3" /> Все прочитаны
            </Button>
          )}
        </div>

        {/* List */}
        <div className="max-h-[300px] overflow-y-auto divide-y divide-border/60">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground space-y-1">
              <Bell className="h-6 w-6 text-muted-foreground/40 mx-auto" />
              <p className="font-medium text-foreground">Нет уведомлений</p>
              <p className="text-[11px]">Все важные события появятся здесь</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`p-3 transition-colors cursor-pointer flex items-start gap-2.5 hover:bg-muted/50 ${
                  !n.isRead ? "bg-primary/5 font-medium" : "opacity-85"
                }`}
              >
                <div className="mt-0.5 p-1 rounded-md bg-background border shrink-0">
                  {getTypeIcon(n.type)}
                </div>

                <div className="space-y-0.5 flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-semibold text-foreground text-xs truncate block">
                      {n.title}
                    </span>
                    {!n.isRead && (
                      <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    )}
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
            className="inline-flex items-center justify-center gap-1 text-[11px] font-semibold text-primary hover:underline py-1"
          >
             Все уведомления <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
