"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

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
  fileAttachment?: {
    fileName: string;
    fileSize: string;
    fileUrl: string;
  };
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
      isPinned: false,
      fileAttachment: item.fileUrl
        ? {
            fileName: item.fileUrl.split("/").pop() || "Документ.pdf",
            fileSize: "1.0 MB",
            fileUrl: item.fileUrl,
          }
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
      },
    });

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
        fileUrl: data.fileUrl || null,
      },
    });

    revalidatePath("/dashboard/announcements");
    return { success: true };
  } catch (error) {
    console.error("Failed to update announcement:", error);
    return { success: false, error: "Ошибка при обновлении в базе данных" };
  }
}
