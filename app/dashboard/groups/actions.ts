"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export interface AdditionalTeacherDTO {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string | null;
}

export interface GroupDTO {
  id: string;
  name: string;
  course: number;
  specialty: string;
  specialtyId?: string;
  specialtyCode?: string;
  studentCount: number;
  curatorId?: string;
  curatorName?: string;
  classTeacherId?: string;
  classTeacherName?: string;
  additionalTeachers?: AdditionalTeacherDTO[];
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
  tempPassword?: string | null;
  isDutyExempt?: boolean;
  dutyExemptReason?: string | null;
  rollNumber?: string | null;
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
  additionalTeachers: AdditionalTeacherDTO[];
}

function parseGroupCourse(name: string): number {
  if (!name) return 1;
  // Format: ИС-1-25 or ПО-2-24 (number between dashes)
  const dashMatch = name.match(/[-_](\d)[-_]/);
  if (dashMatch) return parseInt(dashMatch[1], 10);

  // Format: 1-ИС or 2 ПО (leading number)
  const startMatch = name.match(/^(\d)[\s-_]/);
  if (startMatch) return parseInt(startMatch[1], 10);

  // Format: ИС-2 or ПО 3 (trailing single digit)
  const endMatch = name.match(/[\s-_](\d)$/);
  if (endMatch) return parseInt(endMatch[1], 10);

  return 1;
}

export async function getGroupsAction(): Promise<GroupDTO[]> {
  try {
    const session = await auth();
    const role = session?.user?.role || "STUDENT";
    const userId = session?.user?.id;

    // Filter groups by user role:
    // - ADMIN: sees all groups
    // - TEACHER: sees groups where they are curator, class teacher, additional teacher, OR teach a subject
    // - STUDENT: sees only groups where they are enrolled
    let whereClause: Record<string, unknown> | undefined = undefined;
    if (role === "STUDENT" && userId) {
      const enrollments = await prisma.groupStudent.findMany({
        where: { studentId: userId },
        select: { groupId: true },
      });
      whereClause = { id: { in: enrollments.map((e) => e.groupId) } };
    } else if (role === "TEACHER" && userId) {
      whereClause = {
        OR: [
          { curatorId: userId },
          { classTeacherId: userId },
          { additionalTeachers: { some: { teacherId: userId } } },
          { groupSubjects: { some: { teacherId: userId } } },
        ],
      };
    }

    const list = await prisma.group.findMany({
      where: whereClause,
      orderBy: { name: "asc" },
      include: {
        specialty: { select: { id: true, name: true, code: true } },
        curator: { select: { id: true, name: true } },
        classTeacher: { select: { id: true, name: true } },
        additionalTeachers: {
          include: {
            teacher: { select: { id: true, name: true, email: true } },
          },
        },
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
      const course = item.course ?? parseGroupCourse(item.name);

      return {
        id: item.id,
        name: item.name,
        course,
        specialty: item.specialty?.name || "Не указана",
        specialtyId: item.specialty?.id || undefined,
        specialtyCode: item.specialty?.code || undefined,
        studentCount: item._count.students,
        curatorId: item.curator?.id || undefined,
        curatorName: item.curator?.name || undefined,
        classTeacherId: item.classTeacher?.id || undefined,
        classTeacherName: item.classTeacher?.name || undefined,
        additionalTeachers: item.additionalTeachers?.map((gt) => ({
          id: gt.teacher.id,
          name: gt.teacher.name,
          email: gt.teacher.email,
        })) || [],
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

export async function getAcademicYearsListAction() {
  try {
    const years = await prisma.academicYear.findMany({
      orderBy: [{ isCurrent: "desc" }, { startDate: "desc" }],
      select: { id: true, name: true, isCurrent: true },
    });
    return years;
  } catch (error) {
    console.error("Failed to fetch academic years list:", error);
    return [];
  }
}

export async function getSpecialtiesListAction() {
  try {
    const specialties = await prisma.specialty.findMany({
      orderBy: [{ code: "asc" }, { name: "asc" }],
      select: { id: true, name: true, code: true },
    });
    return specialties;
  } catch (error) {
    console.error("Failed to fetch specialties list:", error);
    return [];
  }
}

export async function createGroupAction(data: {
  name: string;
  course?: number;
  curatorId?: string;
  classTeacherId?: string;
  additionalTeacherIds?: string[];
  specialtyId?: string;
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

    const cleanSpecialtyId =
      !data.specialtyId || data.specialtyId === "unassigned" || data.specialtyId === "none"
        ? undefined
        : data.specialtyId;

    const cleanCuratorId =
      !data.curatorId || data.curatorId === "unassigned" || data.curatorId === "none"
        ? undefined
        : data.curatorId;

    const cleanClassTeacherId =
      !data.classTeacherId || data.classTeacherId === "unassigned" || data.classTeacherId === "none"
        ? undefined
        : data.classTeacherId;

    const created = await prisma.group.create({
      data: {
        name: data.name.trim(),
        course: data.course ?? 1,
        academicYearId: academicYear.id,
        curatorId: cleanCuratorId,
        classTeacherId: cleanClassTeacherId,
        specialtyId: cleanSpecialtyId,
        additionalTeachers:
          data.additionalTeacherIds && data.additionalTeacherIds.length > 0
            ? {
                create: data.additionalTeacherIds.map((tid) => ({
                  teacherId: tid,
                })),
              }
            : undefined,
      },
    });

    revalidatePath("/dashboard/groups");
    return { success: true, id: created.id };
  } catch (error) {
    console.error("Failed to create group:", error);
    return { success: false, error: error instanceof Error ? error.message : "Ошибка при создании группы в базе данных" };
  }
}

export async function updateGroupAction(
  groupId: string,
  data: {
    name: string;
    course?: number;
    curatorId?: string;
    classTeacherId?: string;
    additionalTeacherIds?: string[];
    specialtyId?: string;
    academicYearName?: string;
  }
) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
    return { success: false, error: "Недостаточно прав для редактирования группы" };
  }

  if (session.user.role === "TEACHER") {
    const hasAccess = await prisma.group.findFirst({
      where: {
        id: groupId,
        OR: [
          { curatorId: session.user.id },
          { classTeacherId: session.user.id },
          { additionalTeachers: { some: { teacherId: session.user.id } } },
          { groupSubjects: { some: { teacherId: session.user.id } } },
        ],
      },
    });
    if (!hasAccess) {
      return { success: false, error: "Вы можете редактировать только закрепленные за вами группы" };
    }
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

    const cleanSpecialtyId =
      !data.specialtyId || data.specialtyId === "unassigned" || data.specialtyId === "none"
        ? null
        : data.specialtyId;

    const cleanCuratorId =
      !data.curatorId || data.curatorId === "none" || data.curatorId === "unassigned"
        ? null
        : data.curatorId;

    const cleanClassTeacherId =
      !data.classTeacherId || data.classTeacherId === "none" || data.classTeacherId === "unassigned"
        ? null
        : data.classTeacherId;

    await prisma.$transaction(async (tx) => {
      await tx.group.update({
        where: { id: groupId },
        data: {
          name: data.name.trim(),
          ...(data.course !== undefined ? { course: data.course } : {}),
          curatorId: cleanCuratorId,
          classTeacherId: cleanClassTeacherId,
          specialtyId: cleanSpecialtyId,
        },
      });

      if (data.additionalTeacherIds !== undefined) {
        await tx.groupTeacher.deleteMany({
          where: { groupId },
        });

        if (data.additionalTeacherIds.length > 0) {
          await tx.groupTeacher.createMany({
            data: data.additionalTeacherIds.map((tid) => ({
              groupId,
              teacherId: tid,
            })),
          });
        }
      }
    });

    revalidatePath("/dashboard/groups");
    revalidatePath(`/dashboard/groups/${groupId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to update group:", error);
    return { success: false, error: error instanceof Error ? error.message : "Ошибка при обновлении группы в базе данных" };
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
        specialty: { select: { id: true, name: true, code: true } },
        curator: { select: { id: true, name: true, email: true, phone: true } },
        classTeacher: { select: { id: true, name: true, email: true, phone: true } },
        additionalTeachers: {
          include: {
            teacher: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
          },
        },
        monitor: { select: { id: true, name: true } },
        deputyMonitor: { select: { id: true, name: true } },
        academicYear: { select: { name: true } },
        _count: { select: { students: true } },
      },
    });

    const session = await auth();
    const role = session?.user?.role || "STUDENT";
    const userId = session?.user?.id;

    // Check access permissions:
    // - ADMIN: can view any group
    // - TEACHER: can view if curator, class teacher, additional teacher, or teaches a subject to this group
    // - STUDENT: can only view if enrolled in this group
    if (role === "STUDENT" && userId) {
      const isEnrolled = await prisma.groupStudent.findUnique({
        where: {
          groupId_studentId: {
            groupId,
            studentId: userId,
          },
        },
      });
      if (!isEnrolled) return null;
    } else if (role === "TEACHER" && userId) {
      const hasAccess = await prisma.group.findFirst({
        where: {
          id: groupId,
          OR: [
            { curatorId: userId },
            { classTeacherId: userId },
            { additionalTeachers: { some: { teacherId: userId } } },
            { groupSubjects: { some: { teacherId: userId } } },
          ],
        },
      });
      if (!hasAccess) return null;
    }

    if (!item) {
      return null;
    }

    const course = item.course ?? parseGroupCourse(item.name);

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
            tempPassword: true,
            isDutyExempt: true,
            dutyExemptReason: true,
            rollNumber: true,
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
        tempPassword: gs.student.tempPassword || null,
        isDutyExempt: gs.student.isDutyExempt,
        dutyExemptReason: gs.student.dutyExemptReason,
        rollNumber: (gs.student as any).rollNumber || null,
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
      specialty: item.specialty?.name || "Не указана",
      specialtyId: item.specialty?.id || undefined,
      specialtyCode: item.specialty?.code || undefined,
      studentCount: item._count.students,
      curatorId: item.curator?.id || undefined,
      curatorName: item.curator?.name || undefined,
      classTeacherId: item.classTeacher?.id || undefined,
      classTeacherName: item.classTeacher?.name || undefined,
      additionalTeachers:
        item.additionalTeachers?.map((gt) => ({
          id: gt.teacher.id,
          name: gt.teacher.name,
          email: gt.teacher.email,
          phone: gt.teacher.phone || undefined,
          avatar: gt.teacher.avatar || undefined,
        })) || [],
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

  if (session.user.role === "TEACHER") {
    const hasAccess = await prisma.group.findFirst({
      where: {
        id: groupId,
        OR: [
          { curatorId: session.user.id },
          { classTeacherId: session.user.id },
          { additionalTeachers: { some: { teacherId: session.user.id } } },
          { groupSubjects: { some: { teacherId: session.user.id } } },
        ],
      },
    });
    if (!hasAccess) {
      return { success: false, error: "У вас нет доступа к управлению дежурством этой группы" };
    }
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
  } catch (error) {
    console.error("Failed to toggle duty status:", error);
    return { success: false, error: error instanceof Error ? error.message : "Ошибка при изменении статуса дежурства" };
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
  } catch (error) {
    console.error("Failed to remove student from group:", error);
    return { success: false, error: error instanceof Error ? error.message : "Ошибка при исключении студента из группы" };
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
  } catch (error) {
    console.error("Failed to update leadership:", error);
    return { success: false, error: error instanceof Error ? error.message : "Ошибка при обновлении статуса старосты" };
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
  } catch (error) {
    console.error("Failed to create group announcement:", error);
    return { success: false, error: error instanceof Error ? error.message : "Ошибка при публикации объявления" };
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
  } catch (error) {
    console.error("Failed to update group announcement:", error);
    return { success: false, error: error instanceof Error ? error.message : "Ошибка при обновлении объявления" };
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
  } catch (error) {
    console.error("Failed to delete group announcement:", error);
    return { success: false, error: error instanceof Error ? error.message : "Ошибка при удалении объявления" };
  }
}

export async function updateStudentRollNumberInGroupAction(
  studentId: string,
  rollNumber: string,
  groupId?: string
) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Требуется авторизация" };
  }

  try {
    const trimmed = rollNumber.trim();
    await prisma.user.update({
      where: { id: studentId },
      data: {
        rollNumber: trimmed ? trimmed : null,
      },
    });

    if (groupId) {
      revalidatePath(`/dashboard/groups/${groupId}`);
    }
    revalidatePath("/dashboard/scholarship");
    revalidatePath("/dashboard/students");
    return { success: true };
  } catch (error) {
    console.error("Failed to update student roll number:", error);
    return { success: false, error: error instanceof Error ? error.message : "Ошибка при обновлении поименного номера" };
  }
}

export interface StudentCardDTO {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  avatar?: string | null;
  rollNumber?: string | null;
  roleInGroup: "STUDENT" | "MONITOR" | "DEPUTY_MONITOR";
  isDutyExempt?: boolean;
  dutyExemptReason?: string | null;
  joinedAt: string;
  createdAt: string;
  accountStatus: "Активен" | "Временный пароль";
  tempPassword?: string | null;
  groupName: string;
  attendance: {
    total: number;
    present: number;
    late: number;
    absent: number;
    excused: number;
    percent: number;
    recentAbsences: Array<{
      date: string;
      subjectName: string;
      status: "ABSENT" | "EXCUSED";
      comment?: string | null;
    }>;
  };
  academics: {
    submittedAssignments: number;
    averageGrade?: string | null;
  };
}

export async function getStudentCardDataAction(
  studentId: string,
  groupId: string
): Promise<StudentCardDTO | null> {
  const session = await auth();
  if (!session?.user) return null;

  try {
    const [student, group, attendanceRecords, submissions] = await Promise.all([
      prisma.user.findUnique({
        where: { id: studentId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatar: true,
          tempPassword: true,
          isDutyExempt: true,
          dutyExemptReason: true,
          rollNumber: true,
          createdAt: true,
        },
      }),
      prisma.group.findUnique({
        where: { id: groupId },
        select: {
          name: true,
          monitorId: true,
          deputyMonitorId: true,
          students: {
            where: { studentId },
            select: { joinedAt: true },
          },
        },
      }),
      prisma.attendance.findMany({
        where: { studentId },
        select: {
          status: true,
          date: true,
          comment: true,
          groupSubject: {
            select: {
              subject: { select: { name: true } },
            },
          },
        },
        orderBy: { date: "desc" },
        take: 150,
      }),
      prisma.assignmentSubmission.findMany({
        where: { studentId },
        select: { grade: true },
      }),
    ]);

    if (!student || !group) return null;

    let roleInGroup: "STUDENT" | "MONITOR" | "DEPUTY_MONITOR" = "STUDENT";
    if (group.monitorId === student.id) {
      roleInGroup = "MONITOR";
    } else if (group.deputyMonitorId === student.id) {
      roleInGroup = "DEPUTY_MONITOR";
    }

    const totalAttendance = attendanceRecords.length;
    const present = attendanceRecords.filter((a) => a.status === "PRESENT").length;
    const late = attendanceRecords.filter((a) => a.status === "LATE").length;
    const absent = attendanceRecords.filter((a) => a.status === "ABSENT").length;
    const excused = attendanceRecords.filter((a) => a.status === "EXCUSED").length;
    const percent =
      totalAttendance > 0 ? Math.round(((present + late) / totalAttendance) * 100) : 100;

    const recentAbsences = attendanceRecords
      .filter((a) => a.status === "ABSENT" || a.status === "EXCUSED")
      .slice(0, 5)
      .map((a) => ({
        date: a.date.toLocaleDateString("ru-RU"),
        subjectName: a.groupSubject?.subject?.name || "Дисциплина",
        status: a.status as "ABSENT" | "EXCUSED",
        comment: a.comment,
      }));

    const gradedSubmissions = submissions.filter((s) => typeof s.grade === "number");
    const avgGrade =
      gradedSubmissions.length > 0
        ? (
            gradedSubmissions.reduce((acc, curr) => acc + (curr.grade || 0), 0) /
            gradedSubmissions.length
          ).toFixed(1)
        : null;

    const joinedAtDate = group.students[0]?.joinedAt || student.createdAt;

    return {
      id: student.id,
      name: student.name,
      email: student.email,
      phone: student.phone,
      avatar: student.avatar,
      rollNumber: (student as any).rollNumber || null,
      roleInGroup,
      isDutyExempt: student.isDutyExempt,
      dutyExemptReason: student.dutyExemptReason,
      joinedAt: new Date(joinedAtDate).toLocaleDateString("ru-RU"),
      createdAt: student.createdAt.toLocaleDateString("ru-RU"),
      accountStatus: student.tempPassword ? "Временный пароль" : "Активен",
      tempPassword: student.tempPassword || null,
      groupName: group.name,
      attendance: {
        total: totalAttendance,
        present,
        late,
        absent,
        excused,
        percent,
        recentAbsences,
      },
      academics: {
        submittedAssignments: submissions.length,
        averageGrade: avgGrade,
      },
    };
  } catch (error) {
    console.error("Failed to fetch student card data:", error);
    return null;
  }
}


