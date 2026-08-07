"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getNotificationsAction(limit?: number) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Не авторизован", notifications: [], unreadCount: 0 };
    }

    const userId = session.user.id;

    // Check if user has any notifications, if not - create initial welcome notifications
    const count = await prisma.notification.count({ where: { userId } });
    if (count === 0) {
      await prisma.notification.createMany({
        data: [
          {
            userId,
            title: "Добро пожаловать в LMS!",
            message: "Вы успешно вошли в учебный портал. Здесь будут отображаться важные события и системные сообщения.",
            type: "SYSTEM",
            link: "/dashboard",
          },
          {
            userId,
            title: "Доступны новые материалы и тесты",
            message: "Проверьте раздел LMS для ознакомления с актуальными материалами занятий и тестированиями.",
            type: "TEST",
            link: "/dashboard/lms/tests",
          },
          {
            userId,
            title: "Актуальное расписание занятий",
            message: "Ознакомьтесь с информацией в разделе Объявления и графика процесса обучения.",
            type: "ANNOUNCEMENT",
            link: "/dashboard/announcements",
          },
        ],
      });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    return {
      success: true,
      unreadCount,
      notifications: notifications.map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        link: n.link || undefined,
        type: n.type,
        isRead: n.isRead,
        createdAt: n.createdAt.toISOString(),
      })),
    };
  } catch (err) {
    console.error("getNotificationsAction error:", err);
    return { success: false, error: "Ошибка при получении уведомлений", notifications: [], unreadCount: 0 };
  }
}

export async function markNotificationAsReadAction(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Не авторизован" };
    }

    await prisma.notification.update({
      where: { id, userId: session.user.id },
      data: { isRead: true },
    });

    revalidatePath("/dashboard/notifications");
    return { success: true };
  } catch (err) {
    console.error("markNotificationAsReadAction error:", err);
    return { success: false, error: "Ошибка при обновлении" };
  }
}

export async function markAllNotificationsAsReadAction() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Не авторизован" };
    }

    await prisma.notification.updateMany({
      where: { userId: session.user.id, isRead: false },
      data: { isRead: true },
    });

    revalidatePath("/dashboard/notifications");
    return { success: true };
  } catch (err) {
    console.error("markAllNotificationsAsReadAction error:", err);
    return { success: false, error: "Ошибка при обновлении" };
  }
}

export async function deleteNotificationAction(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Не авторизован" };
    }

    await prisma.notification.delete({
      where: { id, userId: session.user.id },
    });

    revalidatePath("/dashboard/notifications");
    return { success: true };
  } catch (err) {
    console.error("deleteNotificationAction error:", err);
    return { success: false, error: "Ошибка при удалении" };
  }
}

export async function clearAllNotificationsAction() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Не авторизован" };
    }

    await prisma.notification.deleteMany({
      where: { userId: session.user.id },
    });

    revalidatePath("/dashboard/notifications");
    return { success: true };
  } catch (err) {
    console.error("clearAllNotificationsAction error:", err);
    return { success: false, error: "Ошибка при очистке" };
  }
}
