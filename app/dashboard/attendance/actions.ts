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
  isDeputyMonitor?: boolean;
  isDutyExempt?: boolean;
}

export interface StudentPeriodStatsDTO {
  studentId: string;
  studentName: string;
  isMonitor: boolean;
  isDeputyMonitor?: boolean;
  totalLessons: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  attendanceRate: number;
}

export interface AttendancePeriodStatsDTO {
  startDate: string;
  endDate: string;
  totalLessons: number;
  groupAttendanceRate: number;
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  totalExcused: number;
  students: StudentPeriodStatsDTO[];
  lessonsByDate: Array<{
    date: string;
    subjectName: string;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    excusedCount: number;
  }>;
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

    // 2. Fetch subjects and group students in parallel
    const isCuratorOfSelectedGroup = selectedGroupObj?.curatorId === currentUserId;
    let subjectWhereClause: Record<string, unknown> = { groupId: selectedGroup };

    if (role === "TEACHER" && currentUserId && !isCuratorOfSelectedGroup) {
      subjectWhereClause.teacherId = currentUserId;
    }

    const [groupSubjects, group] = await Promise.all([
      prisma.groupSubject.findMany({
        where: subjectWhereClause,
        include: {
          subject: { select: { name: true } },
          teacher: { select: { name: true } },
        },
        orderBy: { subject: { name: "asc" } },
      }),
      prisma.group.findUnique({
        where: { id: selectedGroup },
        include: {
          monitor: { select: { id: true } },
          deputyMonitor: { select: { id: true } },
          students: {
            include: {
              student: { select: { id: true, name: true, isDutyExempt: true } },
            },
            orderBy: { student: { name: "asc" } },
          },
        },
      }),
    ]);

    const subjects: GroupSubjectItemDTO[] = groupSubjects.map((gs) => ({
      id: gs.id,
      subjectName: gs.subject.name,
      teacherName: gs.teacher.name,
    }));

    const selectedGroupSubjectId =
      groupSubjectId && subjects.some((s) => s.id === groupSubjectId)
        ? groupSubjectId
        : subjects[0]?.id || "";

    const isMonitor = Boolean(currentUserId && group?.monitor?.id === currentUserId);
    const isDeputyMonitor = Boolean(currentUserId && group?.deputyMonitor?.id === currentUserId);
    const canEdit = role === "ADMIN" || role === "TEACHER" || isMonitor || isDeputyMonitor;

    const students = (group?.students || []).map((gs) => ({
      studentId: gs.student.id,
      studentName: gs.student.name,
      isMonitor: group?.monitor?.id === gs.student.id,
      isDeputyMonitor: group?.deputyMonitor?.id === gs.student.id,
      isDutyExempt: gs.student.isDutyExempt,
    }));

    // 3. Fetch attendance records for selected date and groupSubject
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

    // 4. Fetch duty records for selected date and group
    const targetDateUtc = new Date(
      Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0, 0)
    );
    const nextDayUtc = new Date(targetDateUtc.getTime() + 24 * 60 * 60 * 1000);

    const dbDuties = selectedGroup
      ? await prisma.dutySchedule.findMany({
          where: {
            groupId: selectedGroup,
            date: { gte: targetDateUtc, lt: nextDayUtc },
          },
          select: {
            studentId: true,
            isLeader: true,
          },
        })
      : [];

    const dutyMap: Record<string, { isDuty: boolean; isLeader: boolean }> = {};
    dbDuties.forEach((d) => {
      dutyMap[d.studentId] = {
        isDuty: true,
        isLeader: d.isLeader,
      };
    });

    return {
      groups,
      subjects,
      students,
      attendanceMap,
      dutyMap,
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
      dutyMap: {},
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
      group: { select: { curatorId: true, monitorId: true, deputyMonitorId: true } },
    },
  });
  if (!gs) return false;

  if (session.user.role === "TEACHER") {
    return gs.teacherId === session.user.id || gs.group.curatorId === session.user.id;
  }

  // Check if current user is the monitor or deputy monitor of this group
  return Boolean(
    (gs.group?.monitorId && gs.group.monitorId === session.user.id) ||
    (gs.group?.deputyMonitorId && gs.group.deputyMonitorId === session.user.id)
  );
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

/** Get aggregated attendance statistics for a given group, date range and optional subject */
export async function getAttendancePeriodStatsAction(
  groupId: string,
  startDateStr: string,
  endDateStr: string,
  groupSubjectId?: string
): Promise<{ success: boolean; data?: AttendancePeriodStatsDTO; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Не авторизован" };
    }

    if (!groupId || !startDateStr || !endDateStr) {
      return { success: false, error: "Укажите группу и диапазон дат" };
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    const endDateInclusive = new Date(endDate);
    endDateInclusive.setDate(endDate.getDate() + 1);

    // 1. Fetch group students
    const group = await prisma.group.findUnique({
      where: { id: groupId },
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

    if (!group) {
      return { success: false, error: "Группа не найдена" };
    }

    const students = group.students.map((gs) => ({
      studentId: gs.student.id,
      studentName: gs.student.name,
      isMonitor: group.monitor?.id === gs.student.id,
    }));

    // 2. Build where filter for attendances
    const whereClause: Record<string, unknown> = {
      date: {
        gte: startDate,
        lt: endDateInclusive,
      },
    };

    if (groupSubjectId && groupSubjectId !== "all") {
      whereClause.groupSubjectId = groupSubjectId;
    } else {
      whereClause.groupSubject = {
        groupId,
      };
    }

    // 3. Query all attendance entries in range
    const records = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        groupSubject: {
          include: {
            subject: { select: { name: true } },
          },
        },
      },
      orderBy: { date: "asc" },
    });

    // 4. Aggregations per student
    const studentStatsMap: Record<
      string,
      {
        total: number;
        present: number;
        absent: number;
        late: number;
        excused: number;
      }
    > = {};

    students.forEach((st) => {
      studentStatsMap[st.studentId] = {
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
      };
    });

    // Group-level totals
    let totalGroupPresent = 0;
    let totalGroupAbsent = 0;
    let totalGroupLate = 0;
    let totalGroupExcused = 0;

    // Track dates & lessons
    const lessonsByDateMap: Record<
      string,
      {
        date: string;
        subjectName: string;
        presentCount: number;
        absentCount: number;
        lateCount: number;
        excusedCount: number;
      }
    > = {};

    records.forEach((rec) => {
      const studentId = rec.studentId;
      if (!studentStatsMap[studentId]) {
        studentStatsMap[studentId] = {
          total: 0,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
        };
      }

      studentStatsMap[studentId].total += 1;

      const dateKey = `${rec.date.toISOString().split("T")[0]}_${rec.groupSubjectId}`;
      if (!lessonsByDateMap[dateKey]) {
        lessonsByDateMap[dateKey] = {
          date: rec.date.toISOString().split("T")[0],
          subjectName: rec.groupSubject?.subject?.name || "Занятие",
          presentCount: 0,
          absentCount: 0,
          lateCount: 0,
          excusedCount: 0,
        };
      }

      switch (rec.status) {
        case AttendanceStatus.PRESENT:
          studentStatsMap[studentId].present += 1;
          totalGroupPresent += 1;
          lessonsByDateMap[dateKey].presentCount += 1;
          break;
        case AttendanceStatus.ABSENT:
          studentStatsMap[studentId].absent += 1;
          totalGroupAbsent += 1;
          lessonsByDateMap[dateKey].absentCount += 1;
          break;
        case AttendanceStatus.LATE:
          studentStatsMap[studentId].late += 1;
          totalGroupLate += 1;
          lessonsByDateMap[dateKey].lateCount += 1;
          break;
        case AttendanceStatus.EXCUSED:
          studentStatsMap[studentId].excused += 1;
          totalGroupExcused += 1;
          lessonsByDateMap[dateKey].excusedCount += 1;
          break;
      }
    });

    // Max lessons recorded for any student or total unique lessons in period
    const totalRecordedLessons = Object.keys(lessonsByDateMap).length;

    const studentResultList: StudentPeriodStatsDTO[] = students.map((st) => {
      const s = studentStatsMap[st.studentId] || {
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
      };

      const attendedScore = s.present + s.late + s.excused;
      const rate = s.total > 0 ? Math.round((attendedScore / s.total) * 100) : 100;

      return {
        studentId: st.studentId,
        studentName: st.studentName,
        isMonitor: st.isMonitor,
        totalLessons: s.total,
        presentCount: s.present,
        absentCount: s.absent,
        lateCount: s.late,
        excusedCount: s.excused,
        attendanceRate: rate,
      };
    });

    const allEntries = totalGroupPresent + totalGroupAbsent + totalGroupLate + totalGroupExcused;
    const groupAttended = totalGroupPresent + totalGroupLate + totalGroupExcused;
    const groupRate = allEntries > 0 ? Math.round((groupAttended / allEntries) * 100) : 100;

    const statsDto: AttendancePeriodStatsDTO = {
      startDate: startDateStr,
      endDate: endDateStr,
      totalLessons: totalRecordedLessons,
      groupAttendanceRate: groupRate,
      totalPresent: totalGroupPresent,
      totalAbsent: totalGroupAbsent,
      totalLate: totalGroupLate,
      totalExcused: totalGroupExcused,
      students: studentResultList,
      lessonsByDate: Object.values(lessonsByDateMap).sort((a, b) => a.date.localeCompare(b.date)),
    };

    return { success: true, data: statsDto };
  } catch (error) {
    console.error("Failed to fetch attendance period stats:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Произошла ошибка при загрузке статистики",
    };
  }
}

