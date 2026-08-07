"use client";

import React, { useState, useTransition } from "react";
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
  Trash2,
  ExternalLink,
  Search,
  Check,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
  deleteNotificationAction,
  clearAllNotificationsAction,
} from "../actions";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  link?: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsViewProps {
  initialNotifications: NotificationItem[];
  initialUnreadCount: number;
}

export function NotificationsView({
  initialNotifications,
  initialUnreadCount,
}: NotificationsViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeType, setActiveType] = useState<"ALL" | "UNREAD" | "TEST" | "ANNOUNCEMENT">("ALL");

  const handleMarkAllRead = () => {
    startTransition(async () => {
      await markAllNotificationsAsReadAction();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      router.refresh();
    });
  };

  const handleClearAll = () => {
    startTransition(async () => {
      await clearAllNotificationsAction();
      setNotifications([]);
      setUnreadCount(0);
      router.refresh();
    });
  };

  const handleMarkRead = (id: string) => {
    startTransition(async () => {
      await markNotificationAsReadAction(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      router.refresh();
    });
  };

  const handleDelete = (id: string, isRead: boolean) => {
    startTransition(async () => {
      await deleteNotificationAction(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (!isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      router.refresh();
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "TEST":
        return <FileCheck2 className="h-4 w-4 text-primary shrink-0" />;
      case "ANNOUNCEMENT":
        return <Megaphone className="h-4 w-4 text-primary shrink-0" />;
      case "ASSIGNMENT":
        return <ClipboardList className="h-4 w-4 text-primary shrink-0" />;
      case "GRADE":
        return <Award className="h-4 w-4 text-emerald-500 shrink-0" />;
      default:
        return <Info className="h-4 w-4 text-primary shrink-0" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "TEST":
        return <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20 font-medium">Тестирование</Badge>;
      case "ANNOUNCEMENT":
        return <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20 font-medium">Объявление</Badge>;
      case "ASSIGNMENT":
        return <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20 font-medium">Домашнее задание</Badge>;
      case "GRADE":
        return <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-600 border-emerald-200 font-medium">Оценка</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] bg-muted text-muted-foreground font-medium">Системное</Badge>;
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.message.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeType === "UNREAD") return !n.isRead;
    if (activeType === "TEST") return n.type === "TEST" || n.type === "ASSIGNMENT";
    if (activeType === "ANNOUNCEMENT") return n.type === "ANNOUNCEMENT";
    return true;
  });

  return (
    <div className="w-full space-y-4 pb-20 text-xs">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold tracking-tight text-foreground flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              Уведомления
            </h1>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-medium">
              {notifications.length} всего
            </Badge>
            {unreadCount > 0 && (
              <Badge variant="default" className="text-[10px] px-1.5 py-0 font-bold">
                {unreadCount} новых
              </Badge>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Персональный журнал событий, системных извещений и обновлений учебного процесса
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {unreadCount > 0 && (
            <Button
              size="xs"
              variant="outline"
              onClick={handleMarkAllRead}
              disabled={isPending}
              className="h-8 text-xs px-2.5 gap-1.5 font-medium border-primary/30 text-primary hover:bg-primary/10"
            >
              <CheckCheck className="h-3.5 w-3.5" /> Прочитать все
            </Button>
          )}

          {notifications.length > 0 && (
            <Button
              size="xs"
              variant="ghost"
              onClick={handleClearAll}
              disabled={isPending}
              className="h-8 text-xs px-2.5 text-muted-foreground hover:text-destructive gap-1.5 font-medium"
            >
              <Trash2 className="h-3.5 w-3.5" /> Очистить все
            </Button>
          )}
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Поиск по событиям..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 text-xs pl-8 bg-background"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 p-0.5 bg-muted/60 rounded-lg border text-[11px] font-medium shrink-0">
          <button
            type="button"
            onClick={() => setActiveType("ALL")}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              activeType === "ALL"
                ? "bg-primary text-primary-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Все ({notifications.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveType("UNREAD")}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              activeType === "UNREAD"
                ? "bg-primary text-primary-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Непрочитанные {unreadCount > 0 && `(${unreadCount})`}
          </button>

          <button
            type="button"
            onClick={() => setActiveType("TEST")}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              activeType === "TEST"
                ? "bg-primary text-primary-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Тесты & Задания
          </button>

          <button
            type="button"
            onClick={() => setActiveType("ANNOUNCEMENT")}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              activeType === "ANNOUNCEMENT"
                ? "bg-primary text-primary-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Объявления
          </button>
        </div>
      </div>

      {/* Notifications Grid/List */}
      <div className="space-y-2.5 pt-1">
        {filteredNotifications.length === 0 ? (
          <div className="p-12 border rounded-xl bg-card text-center space-y-2.5 shadow-2xs">
            <div className="h-10 w-10 rounded-full bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
              <Bell className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-foreground">Уведомлений не найдено</h3>
              <p className="text-[11px] text-muted-foreground">
                {searchQuery
                  ? "По вашему запросу ничего не найдено"
                  : activeType === "UNREAD"
                    ? "У вас нет непрочитанных сообщений"
                    : "В вашем персональном журнале пока нет событий"}
              </p>
            </div>
          </div>
        ) : (
          filteredNotifications.map((n) => (
            <div
              key={n.id}
              className={`p-3.5 border rounded-xl bg-card transition-all space-y-2 ${
                !n.isRead
                  ? "border-l-4 border-l-primary bg-primary/5 shadow-2xs"
                  : "hover:border-muted-foreground/30 shadow-2xs"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="p-2 rounded-lg bg-background border shrink-0 mt-0.5">
                    {getTypeIcon(n.type)}
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-foreground text-xs">
                        {n.title}
                      </span>
                      {getTypeBadge(n.type)}
                      {!n.isRead && (
                        <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed break-words">
                      {n.message}
                    </p>

                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground pt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(n.createdAt).toLocaleDateString("ru-RU", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {n.link && (
                    <Link
                      href={n.link}
                      className="h-7 inline-flex items-center text-xs px-2.5 gap-1 font-medium text-primary border border-primary/30 rounded-md hover:bg-primary/10 transition-colors"
                    >
                      Перейти <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}

                  {!n.isRead && (
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => handleMarkRead(n.id)}
                      disabled={isPending}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-primary rounded-md"
                      title="Отметить прочитанным"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                  )}

                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => handleDelete(n.id, n.isRead)}
                    disabled={isPending}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive rounded-md"
                    title="Удалить уведомление"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
