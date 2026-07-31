"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export interface GroupDTO {
  id: string;
  name: string;
  course: number;
  specialty: string;
  studentCount: number;
  curatorId?: string;
  curatorName?: string;
  monitorName?: string;
  deputyMonitorName?: string;
  academicYear: string;
  createdAt: string;
}

export interface GroupStudentDTO {
  id: string;
  name: string;
  email: string;
  phone?: string;
  roleInGroup: "STUDENT" | "MONITOR" | "DEPUTY_MONITOR";
}

export interface GroupDetailsDTO extends GroupDTO {
  studentsList: GroupStudentDTO[];
  subjectsList: {
    id: string;
    name: string;
    teacherName: string;
  }[];
  activeDutyRoster: {
    date: string;
    seniorStudent: string;
    dutyStudent: string;
  };
}

export async function getGroupsAction(): Promise<GroupDTO[]> {
  try {
    const list = await prisma.group.findMany({
      orderBy: { name: "asc" },
      include: {
        curator: { select: { id: true, name: true } },
        monitor: { select: { name: true } },
        deputyMonitor: { select: { name: true } },
        academicYear: { select: { name: true } },
        _count: { select: { students: true } },
      },
    });

    if (list.length === 0) {
      return [];
    }

    return list.map((item) => {
      const courseMatch = item.name.match(/-(\d)-/);
      const course = courseMatch ? parseInt(courseMatch[1], 10) : 1;

      return {
        id: item.id,
        name: item.name,
        course,
        specialty: "Информационные системы и программирование",
        studentCount: item._count.students,
        curatorId: item.curator?.id || undefined,
        curatorName: item.curator?.name || undefined,
        monitorName: item.monitor?.name || undefined,
        deputyMonitorName: item.deputyMonitor?.name || undefined,
        academicYear: item.academicYear.name,
        createdAt: new Date(item.createdAt).toLocaleDateString("ru-RU"),
      };
    });
  } catch (error) {
    console.error("Failed to fetch groups from DB:", error);
    return [];
  }
}

export async function getTeachersListAction() {
  try {
    const teachers = await prisma.user.findMany({
      where: { role: "TEACHER" },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    });
    return teachers;
  } catch (error) {
    console.error("Failed to fetch teachers list:", error);
    return [];
  }
}

export async function createGroupAction(data: {
  name: string;
  curatorId?: string;
  academicYearName?: string;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Только администратор может создавать учебные группы" };
  }

  try {
    const existingGroup = await prisma.group.findFirst({
      where: { name: data.name.trim() },
    });

    if (existingGroup) {
      return { success: false, error: `Группа с названием "${data.name.trim()}" уже существует в базе данных` };
    }

    let academicYear = await prisma.academicYear.findFirst({
      where: { isCurrent: true },
    });

    if (!academicYear) {
      academicYear = await prisma.academicYear.create({
        data: {
          name: data.academicYearName || "2025-2026",
          isCurrent: true,
          startDate: new Date("2025-09-01"),
          endDate: new Date("2026-06-30"),
        },
      });
    }

    const created = await prisma.group.create({
      data: {
        name: data.name.trim(),
        academicYearId: academicYear.id,
        curatorId: data.curatorId || undefined,
      },
    });

    revalidatePath("/dashboard/groups");
    return { success: true, id: created.id };
  } catch (error: any) {
    console.error("Failed to create group:", error);
    return { success: false, error: error.message || "Ошибка при создании группы в базе данных" };
  }
}

export async function updateGroupAction(
  groupId: string,
  data: {
    name: string;
    curatorId?: string;
    academicYearName?: string;
  }
) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
    return { success: false, error: "Недостаточно прав для редактирования группы" };
  }

  try {
    const existingOther = await prisma.group.findFirst({
      where: {
        name: data.name.trim(),
        NOT: { id: groupId },
      },
    });

    if (existingOther) {
      return { success: false, error: `Группа с названием "${data.name.trim()}" уже существует в базе данных` };
    }

    await prisma.group.update({
      where: { id: groupId },
      data: {
        name: data.name.trim(),
        curatorId: !data.curatorId || data.curatorId === "none" ? null : data.curatorId,
      },
    });

    revalidatePath("/dashboard/groups");
    revalidatePath(`/dashboard/groups/${groupId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Failed to update group:", error);
    return { success: false, error: error.message || "Ошибка при обновлении группы в базе данных" };
  }
}

export async function deleteGroupAction(groupId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Только администратор может удалять группы");
  }

  try {
    await prisma.group.delete({
      where: { id: groupId },
    });

    revalidatePath("/dashboard/groups");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete group:", error);
    return { success: false, error: "Ошибка при удалении группы из базы данных" };
  }
}

export async function getGroupByIdAction(groupId: string): Promise<GroupDTO | null> {
  try {
    const item = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        curator: { select: { name: true } },
        monitor: { select: { name: true } },
        deputyMonitor: { select: { name: true } },
        academicYear: { select: { name: true } },
        _count: { select: { students: true } },
      },
    });

    if (!item) {
      return null;
    }

    const courseMatch = item.name.match(/-(\d)-/);
    const course = courseMatch ? parseInt(courseMatch[1], 10) : 1;

    return {
      id: item.id,
      name: item.name,
      course,
      specialty: "Информационные системы и программирование",
      studentCount: item._count.students,
      curatorName: item.curator?.name || undefined,
      monitorName: item.monitor?.name || undefined,
      deputyMonitorName: item.deputyMonitor?.name || undefined,
      academicYear: item.academicYear.name,
      createdAt: new Date(item.createdAt).toLocaleDateString("ru-RU"),
    };
  } catch (error) {
    console.error("Failed to fetch group details:", error);
    return null;
  }
}
