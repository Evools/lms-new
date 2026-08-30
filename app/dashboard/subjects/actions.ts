"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export interface SubjectDTO {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  groupsCount: number;
  createdAt: string;
}

export interface GroupSubjectBindingDTO {
  id: string; // GroupSubject id
  groupId: string;
  groupName: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
}

export interface TeacherOptionDTO {
  id: string;
  name: string;
  email: string;
}

export interface GroupOptionDTO {
  id: string;
  name: string;
}

export async function getSubjectsDataAction() {
  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
      return { subjects: [], bindings: [], teachers: [], groups: [] };
    }

    const [subjects, bindings, teachers, groups] = await Promise.all([
      prisma.subject.findMany({
        orderBy: { name: "asc" },
        include: {
          _count: { select: { groupSubjects: true } },
        },
      }),
      prisma.groupSubject.findMany({
        include: {
          group: { select: { id: true, name: true } },
          subject: { select: { id: true, name: true } },
          teacher: { select: { id: true, name: true } },
        },
        orderBy: [{ group: { name: "asc" } }],
      }),
      prisma.user.findMany({
        where: { role: "TEACHER", isActive: true },
        select: { id: true, name: true, email: true },
        orderBy: { name: "asc" },
      }),
      prisma.group.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]);

    const subjectDTOs: SubjectDTO[] = subjects.map((s) => ({
      id: s.id,
      name: s.name,
      code: s.code,
      description: s.description,
      groupsCount: s._count.groupSubjects,
      createdAt: s.createdAt.toISOString(),
    }));

    const bindingDTOs: GroupSubjectBindingDTO[] = bindings.map((b) => ({
      id: b.id,
      groupId: b.group.id,
      groupName: b.group.name,
      subjectId: b.subject.id,
      subjectName: b.subject.name,
      teacherId: b.teacher.id,
      teacherName: b.teacher.name,
    }));

    return {
      subjects: subjectDTOs,
      bindings: bindingDTOs,
      teachers: teachers as TeacherOptionDTO[],
      groups: groups as GroupOptionDTO[],
    };
  } catch (error) {
    console.error("getSubjectsDataAction error:", error);
    return { subjects: [], bindings: [], teachers: [], groups: [] };
  }
}

/** Create a new subject */
export async function createSubjectAction(data: {
  name: string;
  code?: string;
  description?: string;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Только администратор может создавать дисциплины" };
  }
  if (!data.name.trim()) {
    return { success: false, error: "Укажите название дисциплины" };
  }

  try {
    const existing = await prisma.subject.findFirst({ where: { name: data.name.trim() } });
    if (existing) return { success: false, error: "Дисциплина с таким названием уже существует" };

    await prisma.subject.create({
      data: {
        name: data.name.trim(),
        code: data.code?.trim() || null,
        description: data.description?.trim() || null,
      },
    });
    revalidatePath("/dashboard/subjects");
    return { success: true };
  } catch (error) {
    console.error("createSubjectAction error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Произошла ошибка" };
  }
}

/** Update an existing subject */
export async function updateSubjectAction(
  subjectId: string,
  data: { name: string; code?: string; description?: string }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Только администратор может редактировать дисциплины" };
  }

  try {
    await prisma.subject.update({
      where: { id: subjectId },
      data: {
        name: data.name.trim(),
        code: data.code?.trim() || null,
        description: data.description?.trim() || null,
      },
    });
    revalidatePath("/dashboard/subjects");
    return { success: true };
  } catch (error) {
    console.error("updateSubjectAction error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Произошла ошибка" };
  }
}

/** Delete a subject */
export async function deleteSubjectAction(subjectId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Только администратор может удалять дисциплины" };
  }

  try {
    await prisma.subject.delete({ where: { id: subjectId } });
    revalidatePath("/dashboard/subjects");
    return { success: true };
  } catch (error) {
    console.error("deleteSubjectAction error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Произошла ошибка" };
  }
}

/** Assign a subject to a group with a teacher */
export async function assignSubjectToGroupAction(data: {
  subjectId: string;
  groupId: string;
  teacherId: string;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Только администратор может привязывать дисциплины к группам" };
  }

  try {
    const existing = await prisma.groupSubject.findFirst({
      where: {
        groupId: data.groupId,
        subjectId: data.subjectId,
      },
    });
    if (existing) {
      return { success: false, error: "Эта дисциплина уже привязана к данной группе" };
    }

    await prisma.groupSubject.create({
      data: {
        groupId: data.groupId,
        subjectId: data.subjectId,
        teacherId: data.teacherId,
      },
    });
    revalidatePath("/dashboard/subjects");
    revalidatePath("/dashboard/groups");
    return { success: true };
  } catch (error) {
    console.error("assignSubjectToGroupAction error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Произошла ошибка" };
  }
}

/** Remove subject binding from a group */
export async function removeSubjectFromGroupAction(bindingId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Только администратор может отвязывать дисциплины" };
  }

  try {
    await prisma.groupSubject.delete({ where: { id: bindingId } });
    revalidatePath("/dashboard/subjects");
    revalidatePath("/dashboard/groups");
    return { success: true };
  } catch (error) {
    console.error("removeSubjectFromGroupAction error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Произошла ошибка" };
  }
}
