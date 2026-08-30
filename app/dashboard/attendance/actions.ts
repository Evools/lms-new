"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { AttendanceStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

export interface GroupItemDTO {
  id: string;
  name: string;
}

export interface GroupSubjectItemDTO {
  id: string;
  subjectName: string;
  teacherName: string;
}

export interface StudentAttendanceDTO {
  studentId: string;
  studentName: string;
  status: AttendanceStatus;
  comment: string;
  isMonitor: boolean;
}

export async function getAttendanceDataAction(
  groupId?: string,
  groupSubjectId?: string,
  dateStr?: string
) {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id;
    const role = session?.user?.role || "STUDENT";

    // 1. Fetch relevant groups based on role
    let groupWhereClause: Record<string, unknown> = {};

    if (role === "STUDENT" && currentUserId) {
      const enrollments = await prisma.groupStudent.findMany({
        where: { studentId: currentUserId },
        select: { groupId: true },
      });
      groupWhereClause = { id: { in: enrollments.map((e) => e.groupId) } };
    } else if (role === "TEACHER" && currentUserId) {
      // Teacher sees groups where they teach a subject OR where they are the curator (master)
      const taughtGroupSubjects = await prisma.groupSubject.findMany({
        where: { teacherId: currentUserId },
        select: { groupId: true },
      });
      const taughtGroupIds = taughtGroupSubjects.map((gs) => gs.groupId);

      groupWhereClause = {
        OR: [
          { id: { in: taughtGroupIds } },
          { curatorId: currentUserId },
        ],
      };
    }

    const groups = await prisma.group.findMany({
      where: groupWhereClause,
      select: { id: true, name: true, curatorId: true },
      orderBy: { name: "asc" },
    });

    const selectedGroupObj = groups.find((g) => g.id === groupId) || groups[0];
    const selectedGroup = selectedGroupObj?.id;

    if (!selectedGroup) {
      return {
        groups: [],
        subjects: [],
        students: [],
        attendanceMap: {},
        selectedGroupId: "",
        selectedGroupSubjectId: "",
        dateStr: dateStr || new Date().toISOString().split("T")[0],
        canEdit: false,
      };
    }

    // 2. Fetch subjects for selected group (filtered for teacher unless curator or admin)
    const isCuratorOfSelectedGroup = selectedGroupObj?.curatorId === currentUserId;
    let subjectWhereClause: Record<string, unknown> = { groupId: selectedGroup };

    if (role === "TEACHER" && currentUserId && !isCuratorOfSelectedGroup) {
      // If regular teacher (not curator of this group), show only subjects taught by this teacher
      subjectWhereClause.teacherId = currentUserId;
    }

    const groupSubjects = await prisma.groupSubject.findMany({
      where: subjectWhereClause,
      include: {
        subject: { select: { name: true } },
        teacher: { select: { name: true } },
      },
      orderBy: { subject: { name: "asc" } },
    });

    const subjects: GroupSubjectItemDTO[] = groupSubjects.map((gs) => ({
      id: gs.id,
      subjectName: gs.subject.name,
      teacherName: gs.teacher.name,
    }));

    const selectedGroupSubjectId =
      groupSubjectId && subjects.some((s) => s.id === groupSubjectId)
        ? groupSubjectId
        : subjects[0]?.id || "";

    // 3. Fetch students of selected group & monitor info
    const group = await prisma.group.findUnique({
      where: { id: selectedGroup },
      include: {
        monitor: { select: { id: true } },
        students: {
          include: {
            student: { select: { id: true, name: true } },
          },
          orderBy: { student: { name: "asc" } },
        },
      },
    });

    const isMonitor = Boolean(currentUserId && group?.monitor?.id === currentUserId);
    const canEdit = role === "ADMIN" || role === "TEACHER" || isMonitor;

    const students = (group?.students || []).map((gs) => ({
      studentId: gs.student.id,
      studentName: gs.student.name,
      isMonitor: group?.monitor?.id === gs.student.id,
    }));

    // 4. Fetch attendance records for selected date and groupSubject
    const targetDateStr = dateStr || new Date().toISOString().split("T")[0];
    const targetDate = new Date(targetDateStr);
    const nextDay = new Date(targetDate);
    nextDay.setDate(targetDate.getDate() + 1);

    const dbAttendances = selectedGroupSubjectId
      ? await prisma.attendance.findMany({
          where: {
            groupSubjectId: selectedGroupSubjectId,
            date: { gte: targetDate, lt: nextDay },
          },
        })
      : [];

    const attendanceMap: Record<string, { status: AttendanceStatus; comment: string }> = {};
    dbAttendances.forEach((a) => {
      attendanceMap[a.studentId] = {
        status: a.status,
        comment: a.comment || "",
      };
    });

    return {
      groups,
      subjects,
      students,
      attendanceMap,
      selectedGroupId: selectedGroup,
      selectedGroupSubjectId,
      dateStr: targetDateStr,
      canEdit,
    };
  } catch (error) {
    console.error("Error in getAttendanceDataAction:", error);
    return {
      groups: [],
      subjects: [],
      students: [],
      attendanceMap: {},
      selectedGroupId: "",
      selectedGroupSubjectId: "",
      dateStr: dateStr || new Date().toISOString().split("T")[0],
      canEdit: false,
    };
  }
}

/** Check if current user is authorized to edit attendance for given groupSubjectId */
async function checkEditPermission(groupSubjectId: string) {
  const session = await auth();
  if (!session?.user) return false;

  if (session.user.role === "ADMIN") {
    return true;
  }

  const gs = await prisma.groupSubject.findUnique({
    where: { id: groupSubjectId },
    select: {
      teacherId: true,
      group: { select: { curatorId: true, monitorId: true } },
    },
  });
  if (!gs) return false;

  if (session.user.role === "TEACHER") {
    return gs.teacherId === session.user.id || gs.group.curatorId === session.user.id;
  }

  // Check if current user is the monitor of this group
  return Boolean(gs.group?.monitorId && gs.group.monitorId === session.user.id);
}

/** Save or update attendance status for a single student */
export async function saveStudentAttendanceAction(
  groupSubjectId: string,
  studentId: string,
  dateStr: string,
  status: AttendanceStatus,
  comment?: string
) {
  const isAllowed = await checkEditPermission(groupSubjectId);
  if (!isAllowed) {
    return { success: false, error: "Недостаточно прав для отметки посещаемости" };
  }

  try {
    const date = new Date(dateStr);

    await prisma.attendance.upsert({
      where: {
        groupSubjectId_studentId_date: {
          groupSubjectId,
          studentId,
          date,
        },
      },
      update: {
        status,
        comment: comment || null,
      },
      create: {
        groupSubjectId,
        studentId,
        date,
        status,
        comment: comment || null,
      },
    });

    revalidatePath("/dashboard/attendance");
    return { success: true };
  } catch (error) {
    console.error("Failed to save student attendance:", error);
    return { success: false, error: error instanceof Error ? error.message : "Произошла ошибка при сохранении посещаемости" };
  }
}

/** Batch save attendance for all students in class in a single transaction */
export async function saveBatchAttendanceAction(
  groupSubjectId: string,
  dateStr: string,
  records: { studentId: string; status: AttendanceStatus; comment?: string }[]
) {
  const isAllowed = await checkEditPermission(groupSubjectId);
  if (!isAllowed) {
    return { success: false, error: "Недостаточно прав для сохранения" };
  }

  if (!records.length) {
    return { success: true };
  }

  try {
    const date = new Date(dateStr);

    const ops = records.map((rec) =>
      prisma.attendance.upsert({
        where: {
          groupSubjectId_studentId_date: {
            groupSubjectId,
            studentId: rec.studentId,
            date,
          },
        },
        update: {
          status: rec.status,
          comment: rec.comment || null,
        },
        create: {
          groupSubjectId,
          studentId: rec.studentId,
          date,
          status: rec.status,
          comment: rec.comment || null,
        },
      })
    );

    await prisma.$transaction(ops);

    revalidatePath("/dashboard/attendance");
    return { success: true };
  } catch (error) {
    console.error("Failed to save batch attendance:", error);
    return { success: false, error: error instanceof Error ? error.message : "Произошла ошибка при сохранении посещаемости" };
  }
}

/** Clear / Annul all attendance records for a group subject on a given date */
export async function clearAttendanceAction(
  groupSubjectId: string,
  dateStr: string
) {
  const isAllowed = await checkEditPermission(groupSubjectId);
  if (!isAllowed) {
    return { success: false, error: "Недостаточно прав для аннулирования посещаемости" };
  }

  try {
    const targetDate = new Date(dateStr);
    const nextDay = new Date(targetDate);
    nextDay.setDate(targetDate.getDate() + 1);

    await prisma.attendance.deleteMany({
      where: {
        groupSubjectId,
        date: {
          gte: targetDate,
          lt: nextDay,
        },
      },
    });

    revalidatePath("/dashboard/attendance");
    return { success: true };
  } catch (error) {
    console.error("Failed to clear attendance:", error);
    return { success: false, error: error instanceof Error ? error.message : "Произошла ошибка при очистке посещаемости" };
  }
}
