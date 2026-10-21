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

    const studentIds = dbGroupStudents.map((gs) => gs.student.id);

    // Высокопроизводительная агрегация на уровне СУБД (GROUP BY):
    // возвращает только сгруппированные счётчики, не выгружая тысячи строк в память Node.js
    const attendanceStats =
      studentIds.length > 0
        ? await prisma.attendance.groupBy({
            by: ["studentId", "status"],
            where: { studentId: { in: studentIds } },
            _count: { id: true },
          })
        : [];

    const statsMap = new Map<
      string,
      { total: number; absent: number; present: number; late: number; excused: number }
    >();

    attendanceStats.forEach((row) => {
      let st = statsMap.get(row.studentId);
      if (!st) {
        st = { total: 0, absent: 0, present: 0, late: 0, excused: 0 };
        statsMap.set(row.studentId, st);
      }
      const count = row._count.id;
      st.total += count;
      if (row.status === "ABSENT") st.absent += count;
      else if (row.status === "EXCUSED") st.excused += count;
      else if (row.status === "LATE") st.late += count;
      else if (row.status === "PRESENT") st.present += count;
    });

    const students: WorkflowStudentDTO[] = dbGroupStudents.map((gs) => {
      const st = statsMap.get(gs.student.id);
      // В системе профессионального образования 1 пропуск (пара/урок) = 2 академических часа
      const unexcusedHours = (st?.absent || 0) * 2;
      const total = st?.total || 0;
      const attended = (st?.present || 0) + (st?.late || 0) + (st?.excused || 0);
      const attendanceRate = total > 0 ? Math.round((attended / total) * 100) : 100;

      return {
        id: gs.student.id,
        name: gs.student.name,
        rollNumber: gs.student.rollNumber || "",
        group: gs.group.name,
        attendanceRate,
        unexcusedHours,
        academicDebts: 0,
      };
    });

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
