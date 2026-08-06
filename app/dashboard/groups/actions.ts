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
  isDutyEnabled?: boolean;
  createdAt: string;
}

export interface GroupStudentDTO {
  id: string;
  name: string;
  email: string;
  phone?: string;
  roleInGroup: "STUDENT" | "MONITOR" | "DEPUTY_MONITOR";
  joinedAt: string;
}

export interface GroupSubjectDTO {
  id: string;
  name: string;
  teacherName: string;
  teacherEmail: string;
}

export interface GroupAnnouncementDTO {
  id: string;
  title: string;
  content: string;
  authorName: string;
  date: string;
  isImportant: boolean;
}

export interface GroupDetailsDTO extends GroupDTO {
  studentsList: GroupStudentDTO[];
  subjectsList: GroupSubjectDTO[];
  announcementsList: GroupAnnouncementDTO[];
}

export async function getGroupsAction(): Promise<GroupDTO[]> {
  try {
    const list = await prisma.group.findMany({
      orderBy: { name: "asc" },
      include: {
        curator: { select: { id: true, name: true } },
        monitor: { select: { id: true, name: true } },
        deputyMonitor: { select: { id: true, name: true } },
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
        isDutyEnabled: item.isDutyEnabled ?? true,
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
        curatorId: !data.curatorId || data.curatorId === "none" || data.curatorId === "unassigned" ? null : data.curatorId,
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
    return { success: false, error: "Только администратор может удалять группы" };
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

export async function getGroupByIdAction(groupId: string): Promise<GroupDetailsDTO | null> {
  try {
    const item = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        curator: { select: { id: true, name: true } },
        monitor: { select: { id: true, name: true } },
        deputyMonitor: { select: { id: true, name: true } },
        academicYear: { select: { name: true } },
        _count: { select: { students: true } },
      },
    });

    if (!item) {
      return null;
    }

    const courseMatch = item.name.match(/-(\d)-/);
    const course = courseMatch ? parseInt(courseMatch[1], 10) : 1;

    // Fetch enrolled students
    const groupStudents = await prisma.groupStudent.findMany({
      where: { groupId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { student: { name: "asc" } },
    });

    const studentsList: GroupStudentDTO[] = groupStudents.map((gs) => {
      let roleInGroup: "STUDENT" | "MONITOR" | "DEPUTY_MONITOR" = "STUDENT";
      if (item.monitorId === gs.student.id) {
        roleInGroup = "MONITOR";
      } else if (item.deputyMonitorId === gs.student.id) {
        roleInGroup = "DEPUTY_MONITOR";
      }

      return {
        id: gs.student.id,
        name: gs.student.name,
        email: gs.student.email,
        phone: gs.student.phone || undefined,
        roleInGroup,
        joinedAt: new Date(gs.joinedAt).toLocaleDateString("ru-RU"),
      };
    });

    // Fetch subjects assigned to group
    const groupSubjects = await prisma.groupSubject.findMany({
      where: { groupId },
      include: {
        subject: { select: { name: true } },
        teacher: { select: { name: true, email: true } },
      },
    });

    const subjectsList: GroupSubjectDTO[] = groupSubjects.map((gs) => ({
      id: gs.id,
      name: gs.subject.name,
      teacherName: gs.teacher.name,
      teacherEmail: gs.teacher.email,
    }));

    // Fetch announcements
    const announcements = await prisma.announcement.findMany({
      where: {
        OR: [
          { targetGroupId: groupId },
          { scope: "ALL" },
        ],
      },
      include: {
        author: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const announcementsList: GroupAnnouncementDTO[] = announcements
      .map((a) => {
        const isImportant = a.title.startsWith("[ВАЖНО]");
        const cleanTitle = a.title.replace(/^\[ВАЖНО\]\s*/, "");
        return {
          id: a.id,
          title: cleanTitle,
          content: a.content,
          authorName: a.author.name,
          date: new Date(a.createdAt).toLocaleDateString("ru-RU"),
          isImportant,
        };
      })
      .sort((a, b) => {
        if (a.isImportant && !b.isImportant) return -1;
        if (!a.isImportant && b.isImportant) return 1;
        return 0;
      });

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
      isDutyEnabled: item.isDutyEnabled ?? true,
      createdAt: new Date(item.createdAt).toLocaleDateString("ru-RU"),
      studentsList,
      subjectsList,
      announcementsList,
    };
  } catch (error) {
    console.error("Failed to fetch group details:", error);
    return null;
  }
}

export async function toggleGroupDutyAction(groupId: string, isDutyEnabled: boolean) {
  const session = await auth();
  if (
    !session?.user ||
    (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")
  ) {
    return { success: false, error: "Недостаточно прав" };
  }
  try {
    await prisma.group.update({
      where: { id: groupId },
      data: { isDutyEnabled },
    });
    revalidatePath(`/dashboard/groups/${groupId}`);
    revalidatePath("/dashboard/groups");
    revalidatePath("/dashboard/duty");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to toggle duty status:", error);
    return { success: false, error: error.message || "Ошибка при изменении статуса дежурства" };
  }
}

export async function removeStudentFromGroupAction(groupId: string, studentId: string) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
    return { success: false, error: "Недостаточно прав для управления составом группы" };
  }

  try {
    await prisma.groupStudent.delete({
      where: {
        groupId_studentId: { groupId, studentId },
      },
    });

    // Reset monitor/deputy if this student was leader
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { monitorId: true, deputyMonitorId: true },
    });

    if (group?.monitorId === studentId) {
      await prisma.group.update({ where: { id: groupId }, data: { monitorId: null } });
    }
    if (group?.deputyMonitorId === studentId) {
      await prisma.group.update({ where: { id: groupId }, data: { deputyMonitorId: null } });
    }

    revalidatePath(`/dashboard/groups/${groupId}`);
    revalidatePath("/dashboard/students");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to remove student from group:", error);
    return { success: false, error: error.message || "Ошибка при исключении студента из группы" };
  }
}

export async function setGroupLeadershipAction(
  groupId: string,
  studentId: string,
  role: "MONITOR" | "DEPUTY_MONITOR" | "NONE"
) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
    return { success: false, error: "Недостаточно прав для отбора старосты" };
  }

  try {
    if (role === "MONITOR") {
      await prisma.group.update({
        where: { id: groupId },
        data: { monitorId: studentId },
      });
    } else if (role === "DEPUTY_MONITOR") {
      await prisma.group.update({
        where: { id: groupId },
        data: { deputyMonitorId: studentId },
      });
    } else {
      const group = await prisma.group.findUnique({ where: { id: groupId } });
      if (group?.monitorId === studentId) {
        await prisma.group.update({ where: { id: groupId }, data: { monitorId: null } });
      }
      if (group?.deputyMonitorId === studentId) {
        await prisma.group.update({ where: { id: groupId }, data: { deputyMonitorId: null } });
      }
    }

    revalidatePath(`/dashboard/groups/${groupId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Failed to update leadership:", error);
    return { success: false, error: error.message || "Ошибка при обновлении статуса старосты" };
  }
}

export async function createGroupAnnouncementAction(
  groupId: string,
  title: string,
  content: string,
  isImportant: boolean = false
) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Требуется авторизация" };
  }

  const finalTitle = isImportant ? `[ВАЖНО] ${title.trim()}` : title.trim();

  try {
    const announcement = await prisma.announcement.create({
      data: {
        title: finalTitle,
        content: content.trim(),
        authorId: session.user.id,
        targetGroupId: groupId,
        scope: "GROUP",
      },
    });

    revalidatePath(`/dashboard/groups/${groupId}`);
    revalidatePath("/dashboard/announcements");
    return { success: true, id: announcement.id };
  } catch (error: any) {
    console.error("Failed to create group announcement:", error);
    return { success: false, error: error.message || "Ошибка при публикации объявления" };
  }
}

export async function updateGroupAnnouncementAction(
  groupId: string,
  announcementId: string,
  title: string,
  content: string,
  isImportant: boolean = false
) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Требуется авторизация" };
  }

  const finalTitle = isImportant ? `[ВАЖНО] ${title.trim()}` : title.trim();

  try {
    await prisma.announcement.update({
      where: { id: announcementId },
      data: {
        title: finalTitle,
        content: content.trim(),
      },
    });

    revalidatePath(`/dashboard/groups/${groupId}`);
    revalidatePath("/dashboard/announcements");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to update group announcement:", error);
    return { success: false, error: error.message || "Ошибка при обновлении объявления" };
  }
}

export async function deleteGroupAnnouncementAction(groupId: string, announcementId: string) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Требуется авторизация" };
  }

  try {
    await prisma.announcement.delete({
      where: { id: announcementId },
    });

    revalidatePath(`/dashboard/groups/${groupId}`);
    revalidatePath("/dashboard/announcements");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete group announcement:", error);
    return { success: false, error: error.message || "Ошибка при удалении объявления" };
  }
}
