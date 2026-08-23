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

    // 1. Fetch all groups
    const groups = await prisma.group.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    const selectedGroup = groupId || groups[0]?.id;

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

    // 2. Fetch subjects for selected group
    const groupSubjects = await prisma.groupSubject.findMany({
      where: { groupId: selectedGroup },
      include: {
        subject: { select: { name: true } },
        teacher: { select: { name: true } },
      },
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

  if (session.user.role === "ADMIN" || session.user.role === "TEACHER") {
    return true;
  }

  // Check if current user is the monitor of this group
  const gs = await prisma.groupSubject.findUnique({
    where: { id: groupSubjectId },
    select: { group: { select: { monitorId: true } } },
  });

  return Boolean(gs?.group?.monitorId && gs.group.monitorId === session.user.id);
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
  } catch (error: any) {
    console.error("Failed to save student attendance:", error);
    return { success: false, error: error.message };
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
  } catch (error: any) {
    console.error("Failed to save batch attendance:", error);
    return { success: false, error: error.message };
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
  } catch (error: any) {
    console.error("Failed to clear attendance:", error);
    return { success: false, error: error.message };
  }
}
