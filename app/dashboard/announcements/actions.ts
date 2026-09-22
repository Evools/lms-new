"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export interface FileAttachmentItemDTO {
  id: string;
  fileName: string;
  fileSize: string;
  fileUrl: string;
}

export interface AnnouncementItemDTO {
  id: string;
  title: string;
  body: string;
  authorName: string;
  authorRole: "ADMIN" | "TEACHER";
  authorAvatar?: string;
  targetAudience: "LYCEUM" | "GROUP" | "TEACHERS";
  groupName?: string;
  createdAt: string;
  isPinned?: boolean;
  files?: FileAttachmentItemDTO[];
}

export async function getAnnouncementsAction(): Promise<AnnouncementItemDTO[]> {
  try {
    const list = await prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: {
            name: true,
            role: true,
            avatar: true,
          },
        },
        targetGroup: {
          select: {
            name: true,
          },
        },
      },
    });

    if (list.length === 0) {
      return [];
    }

    return list.map((item) => ({
      id: item.id,
      title: item.title,
      body: item.content,
      authorName: item.author.name,
      authorRole: item.author.role === "ADMIN" ? "ADMIN" : "TEACHER",
      authorAvatar: item.author.avatar || undefined,
      targetAudience:
        item.scope === "TEACHERS"
          ? "TEACHERS"
          : item.scope === "GROUP"
          ? "GROUP"
          : "LYCEUM",
      groupName: item.targetGroup?.name || undefined,
      createdAt: new Date(item.createdAt).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      }),
      isPinned: item.isPinned,
      files: item.fileUrl
        ? item.fileUrl.split(", ").map((fileName, idx) => ({
            id: `file-${item.id}-${idx}`,
            fileName: fileName.trim(),
            fileSize: "1.0 MB",
            fileUrl: "#",
          }))
        : undefined,
    }));
  } catch (error) {
    console.error("Failed to fetch announcements from DB:", error);
    // Fallback if DB is not active
    return [];
  }
}

export async function createAnnouncementAction(data: {
  title: string;
  body: string;
  targetAudience: "LYCEUM" | "GROUP" | "TEACHERS";
  fileUrl?: string;
  isPinned?: boolean;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Необходима авторизация");
  }

  try {
    const scope =
      data.targetAudience === "TEACHERS"
        ? "TEACHERS"
        : data.targetAudience === "GROUP"
        ? "GROUP"
        : "ALL";

    const created = await prisma.announcement.create({
      data: {
        authorId: session.user.id,
        title: data.title,
        content: data.body,
        scope,
        fileUrl: data.fileUrl || null,
        isPinned: data.isPinned ?? false,
      },
    });

    // Notify users based on scope
    try {
      let recipientIds: string[] = [];

      if (scope === "ALL") {
        const users = await prisma.user.findMany({
          where: { isActive: true, id: { not: session.user.id } },
          select: { id: true },
        });
        recipientIds = users.map((u) => u.id);
      } else if (scope === "TEACHERS") {
        const teachers = await prisma.user.findMany({
          where: { role: "TEACHER", isActive: true, id: { not: session.user.id } },
          select: { id: true },
        });
        recipientIds = teachers.map((u) => u.id);
      }

      if (recipientIds.length > 0) {
        const snippet =
          created.content.length > 120
            ? `${created.content.slice(0, 117)}...`
            : created.content;

        await prisma.notification.createMany({
          data: recipientIds.map((userId) => ({
            userId,
            title: `Объявление: ${created.title}`,
            message: snippet,
            type: "ANNOUNCEMENT",
            link: "/dashboard/announcements",
          })),
        });
      }
    } catch (notifErr) {
      console.error("Failed to create announcement notifications:", notifErr);
    }

    revalidatePath("/dashboard/announcements");
    return { success: true, id: created.id };
  } catch (error) {
    console.error("Failed to create announcement:", error);
    return { success: false, error: "Ошибка при сохранении в базу данных" };
  }
}

export async function deleteAnnouncementAction(id: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Необходима авторизация");
  }

  try {
    await prisma.announcement.delete({
      where: { id },
    });
    revalidatePath("/dashboard/announcements");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete announcement:", error);
    return { success: false, error: "Ошибка при удалении из базы данных" };
  }
}

export async function updateAnnouncementAction(
  id: string,
  data: {
    title: string;
    body: string;
    targetAudience: "LYCEUM" | "GROUP" | "TEACHERS";
    fileUrl?: string;
    isPinned?: boolean;
  }
) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Необходима авторизация");
  }

  try {
    const scope =
      data.targetAudience === "TEACHERS"
        ? "TEACHERS"
        : data.targetAudience === "GROUP"
        ? "GROUP"
        : "ALL";

    await prisma.announcement.update({
      where: { id },
      data: {
        title: data.title,
        content: data.body,
        scope,
        ...(data.fileUrl !== undefined && { fileUrl: data.fileUrl || null }),
        isPinned: data.isPinned ?? false,
      },
    });

    revalidatePath("/dashboard/announcements");
    return { success: true };
  } catch (error) {
    console.error("Failed to update announcement:", error);
    return { success: false, error: "Ошибка при обновлении в базе данных" };
  }
}
