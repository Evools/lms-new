"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { ALLOWED_CATEGORIES } from "./constants";

export interface DocumentDTO {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  fileUrl: string;
  authorName: string;
  createdAt: string;
}


export async function getDocumentsAction() {
  try {
    const session = await auth();
    if (!session?.user) return { documents: [], canManage: false };

    const docs = await prisma.document.findMany({
      include: { author: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });

    const documents: DocumentDTO[] = docs.map((d) => ({
      id: d.id,
      title: d.title,
      description: d.description,
      category: d.category,
      fileUrl: d.fileUrl,
      authorName: d.author.name,
      createdAt: d.createdAt.toISOString(),
    }));

    const canManage =
      session.user.role === "ADMIN" || session.user.role === "TEACHER";

    return { documents, canManage };
  } catch (error) {
    console.error("getDocumentsAction error:", error);
    return { documents: [], canManage: false };
  }
}

export async function createDocumentAction(data: {
  title: string;
  description?: string;
  category: string;
  fileUrl: string;
}) {
  const session = await auth();
  if (
    !session?.user ||
    (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")
  ) {
    return { success: false, error: "Недостаточно прав" };
  }

  if (!data.title.trim() || !data.fileUrl.trim() || !data.category) {
    return { success: false, error: "Заполните все обязательные поля" };
  }

  try {
    await prisma.document.create({
      data: {
        title: data.title.trim(),
        description: data.description?.trim() || null,
        category: data.category,
        fileUrl: data.fileUrl.trim(),
        authorId: session.user.id,
      },
    });
    revalidatePath("/dashboard/documents");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateDocumentAction(
  documentId: string,
  data: {
    title: string;
    description?: string;
    category: string;
    fileUrl: string;
  }
) {
  const session = await auth();
  if (
    !session?.user ||
    (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")
  ) {
    return { success: false, error: "Недостаточно прав" };
  }

  try {
    await prisma.document.update({
      where: { id: documentId },
      data: {
        title: data.title.trim(),
        description: data.description?.trim() || null,
        category: data.category,
        fileUrl: data.fileUrl.trim(),
      },
    });
    revalidatePath("/dashboard/documents");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteDocumentAction(documentId: string) {
  const session = await auth();
  if (
    !session?.user ||
    (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")
  ) {
    return { success: false, error: "Недостаточно прав" };
  }

  try {
    await prisma.document.delete({ where: { id: documentId } });
    revalidatePath("/dashboard/documents");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
