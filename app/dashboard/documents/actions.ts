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


export interface WorkflowStudentDTO {
  id: string;
  name: string;
  rollNumber: string;
  group: string;
  attendanceRate: number;
  unexcusedHours: number;
  academicDebts: number;
  specialty?: string;
  course?: number;
  birthYear?: number;
}

export interface WorkflowGroupDTO {
  id: string;
  name: string;
  course: number;
  curatorName?: string;
  specialtyName?: string;
}

export interface WorkflowUserDTO {
  id: string;
  name: string;
  role: string;
}

export async function getDocumentsAction() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role === "STUDENT") {
      return {
        documents: [],
        canManage: false,
        groups: [],
        groupDetails: [],
        students: [],
        currentUser: null,
      };
    }

    const [docs, dbGroups, dbGroupStudents] = await Promise.all([
      prisma.document.findMany({
        include: { author: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.group.findMany({
        select: {
          id: true,
          name: true,
          course: true,
          curator: { select: { id: true, name: true } },
          specialty: { select: { name: true } },
        },
        orderBy: { name: "asc" },
      }),
      prisma.groupStudent.findMany({
        select: {
          group: { select: { name: true } },
          student: {
            select: {
              id: true,
              name: true,
              rollNumber: true,
            },
          },
        },
        orderBy: { student: { name: "asc" } },
      }),
    ]);

    const documents: DocumentDTO[] = docs.map((d) => ({
      id: d.id,
      title: d.title,
      description: d.description,
      category: d.category,
      fileUrl: d.fileUrl,
      authorName: d.author.name,
      createdAt: d.createdAt.toISOString(),
    }));

    const groupDetails: WorkflowGroupDTO[] = dbGroups.map((g) => ({
      id: g.id,
      name: g.name,
      course: g.course,
      curatorName: g.curator?.name || undefined,
      specialtyName: g.specialty?.name || undefined,
    }));
    const groups: string[] = dbGroups.map((g) => g.name);

    const students: WorkflowStudentDTO[] = dbGroupStudents.map((gs) => ({
      id: gs.student.id,
      name: gs.student.name,
      rollNumber: gs.student.rollNumber || "",
      group: gs.group.name,
      attendanceRate: 100,
      unexcusedHours: 0,
      academicDebts: 0,
    }));

    const canManage =
      session.user.role === "ADMIN" ||
      session.user.role === "TEACHER" ||
      session.user.role === "ADMINISTRATION";

    const currentUser: WorkflowUserDTO = {
      id: session.user.id,
      name: session.user.name || "Сотрудник лицея",
      role: session.user.role,
    };

    return { documents, canManage, groups, groupDetails, students, currentUser };
  } catch (error) {
    console.error("getDocumentsAction error:", error);
    return {
      documents: [],
      canManage: false,
      groups: [],
      groupDetails: [],
      students: [],
      currentUser: null,
    };
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
    (session.user.role !== "ADMIN" &&
      session.user.role !== "TEACHER" &&
      session.user.role !== "ADMINISTRATION")
  ) {
    return { success: false, error: "Недостаточно прав" };
  }

  if (!data.title.trim() || !data.fileUrl.trim() || !data.category) {
    return { success: false, error: "Заполните все обязательные поля" };
  }

  try {
    const created = await prisma.document.create({
      data: {
        title: data.title.trim(),
        description: data.description?.trim() || null,
        category: data.category,
        fileUrl: data.fileUrl.trim(),
        authorId: session.user.id,
      },
      include: {
        author: true,
      },
    });
    revalidatePath("/dashboard/documents");
    return {
      success: true,
      document: {
        id: created.id,
        title: created.title,
        description: created.description,
        category: created.category,
        fileUrl: created.fileUrl,
        authorName: created.author.name || "Сотрудник",
        createdAt: created.createdAt.toISOString(),
      },
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Произошла ошибка при создании документа" };
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
    (session.user.role !== "ADMIN" &&
      session.user.role !== "TEACHER" &&
      session.user.role !== "ADMINISTRATION")
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
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Произошла ошибка при обновлении документа" };
  }
}

export async function deleteDocumentAction(documentId: string) {
  const session = await auth();
  if (
    !session?.user ||
    (session.user.role !== "ADMIN" &&
      session.user.role !== "TEACHER" &&
      session.user.role !== "ADMINISTRATION")
  ) {
    return { success: false, error: "Недостаточно прав" };
  }

  try {
    await prisma.document.delete({ where: { id: documentId } });
    revalidatePath("/dashboard/documents");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Произошла ошибка при удалении документа" };
  }
}
