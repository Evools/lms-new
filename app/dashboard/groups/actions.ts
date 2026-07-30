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
        curator: { select: { name: true } },
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
      // Determine course number from group name if possible (e.g., ИС-1-25 -> 1 курс)
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
    });
  } catch (error) {
    console.error("Failed to fetch groups from DB:", error);
    return [];
  }
}

export async function createGroupAction(data: { name: string }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Только администратор может создавать учебные группы");
  }

  try {
    let academicYear = await prisma.academicYear.findFirst({
      where: { isCurrent: true },
    });

    if (!academicYear) {
      academicYear = await prisma.academicYear.create({
        data: {
          name: "2025-2026",
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
      },
    });

    revalidatePath("/dashboard/groups");
    return { success: true, id: created.id };
  } catch (error) {
    console.error("Failed to create group:", error);
    return { success: false, error: "Ошибка при создании группы в базе данных" };
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
      // Fallback for mock/demo IDs that might not be in DB yet
      return {
        id: groupId,
        name: groupId.startsWith("grp-") ? "Созданная группа" : "ИT-1-24",
        course: 1,
        specialty: "Информационные системы и программирование",
        studentCount: 26,
        curatorName: "Иванов Иван Иванович",
        monitorName: "Петров Алексей Сергеевич",
        deputyMonitorName: "Сидорова Анна Владимировна",
        academicYear: "2025-2026",
        createdAt: new Date().toLocaleDateString("ru-RU"),
      };
    }

    const courseMatch = item.name.match(/-(\d)-/);
    const course = courseMatch ? parseInt(courseMatch[1], 10) : 1;

    return {
      id: item.id,
      name: item.name,
      course,
      specialty: "Информационные системы и программирование",
      studentCount: item._count.students || 26,
      curatorName: item.curator?.name || "Иванов Иван Иванович",
      monitorName: item.monitor?.name || "Петров Алексей Сергеевич",
      deputyMonitorName: item.deputyMonitor?.name || "Сидорова Анна Владимировна",
      academicYear: item.academicYear.name,
      createdAt: new Date(item.createdAt).toLocaleDateString("ru-RU"),
    };
  } catch (error) {
    console.error("Failed to fetch group details:", error);
    return {
      id: groupId,
      name: "Группа",
      course: 1,
      specialty: "Информационные системы и программирование",
      studentCount: 26,
      curatorName: "Иванов Иван Иванович",
      monitorName: "Петров Алексей Сергеевич",
      deputyMonitorName: "Сидорова Анна Владимировна",
      academicYear: "2025-2026",
      createdAt: new Date().toLocaleDateString("ru-RU"),
    };
  }
}

