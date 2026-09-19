"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export interface DutyItemDTO {
  id: string;
  groupId: string;
  groupName: string;
  studentId: string;
  studentName: string;
  date: string;
  dayName: string;
  isLeader: boolean;
  isToday: boolean;
}

export interface DutyStudentDTO {
  id: string;
  name: string;
  isLeader: boolean;
  attendanceStatus?: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED" | null;
  attendanceComment?: string | null;
}

export interface DayDutyGroupDTO {
  dateStr: string;
  dayName: string;
  fullDate: string;
  isToday: boolean;
  isPast: boolean;
  isSunday: boolean;
  /** Leader (e.g. monitor / старший дежурный) */
  leaderStudent?: {
    id: string;
    name: string;
    attendanceStatus?: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED" | null;
    attendanceComment?: string | null;
  };
  /** 2–3 duty students for this day */
  dutyStudents: DutyStudentDTO[];
}

export interface GroupStudentWithDutyInfo {
  id: string;
  name: string;
  lastDutyDate?: string;
  isRecentDuty?: boolean;
  recentDutyNote?: string;
}

/** Format Date to YYYY-MM-DD in local time */
function formatLocalDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Parse string (YYYY-MM-DD or ISO) or Date to UTC midnight Date */
function parseDateToUtc(dateInput: string | Date): Date {
  if (dateInput instanceof Date) {
    return new Date(Date.UTC(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate(), 0, 0, 0, 0));
  }
  const str = String(dateInput).split("T")[0];
  const parts = str.split("-").map(Number);
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0));
  }
  const d = new Date(dateInput);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

/** Get Monday of current week as local date */
function getMondayOfCurrentWeek(): Date {
  const now = new Date();
  const day = now.getDay();
  const distance = day === 0 ? -6 : 1 - day;
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + distance, 0, 0, 0, 0);
}

export async function getDutyScheduleAction(selectedGroupId?: string): Promise<{
  groups: { id: string; name: string; isDutyEnabled: boolean }[];
  weeklyDays: DayDutyGroupDTO[];
  allSchedules: DutyItemDTO[];
  groupStudents: GroupStudentWithDutyInfo[];
  selectedGroupId: string;
  isDutyEnabled?: boolean;
}> {
  try {
    const session = await auth();
    const role = session?.user?.role || "STUDENT";
    const userId = session?.user?.id;

    let groupWhere: Record<string, unknown> | undefined = undefined;

    if (role === "STUDENT" && userId) {
      const enrollments = await prisma.groupStudent.findMany({
        where: { studentId: userId },
        select: { groupId: true },
      });
      const studentGroupIds = enrollments.map((e) => e.groupId);
      groupWhere = { id: { in: studentGroupIds } };
    } else if (role === "TEACHER" && userId) {
      groupWhere = {
        OR: [
          { curatorId: userId },
          { groupSubjects: { some: { teacherId: userId } } },
        ],
      };
    }

    const groups = await prisma.group.findMany({
      where: groupWhere,
      select: { id: true, name: true, isDutyEnabled: true },
      orderBy: { name: "asc" },
    });

    const allowedGroupIds = groups.map((g) => g.id);
    let targetGroupId = selectedGroupId || "";

    if (role === "STUDENT" && userId) {
      if (!targetGroupId || !allowedGroupIds.includes(targetGroupId)) {
        targetGroupId = allowedGroupIds[0] || "";
      }
    } else {
      if (!targetGroupId) {
        targetGroupId = allowedGroupIds[0] || groups[0]?.id || "";
      }
    }

    const targetGroupObj = groups.find((g) => g.id === targetGroupId) || (targetGroupId ? await prisma.group.findUnique({ where: { id: targetGroupId }, select: { id: true, name: true, isDutyEnabled: true } }) : null);
    const targetGroupIsDutyEnabled = targetGroupObj ? targetGroupObj.isDutyEnabled : true;

    const now = new Date();
    const monday = getMondayOfCurrentWeek();
    const dayNames = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"];

    const startDate = parseDateToUtc(monday);
    const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(startDate.getTime() - 14 * 24 * 60 * 60 * 1000);
    const todayUtc = parseDateToUtc(now);
    const yesterdayUtc = new Date(todayUtc.getTime() - 24 * 60 * 60 * 1000);
    const todayEndUtc = new Date(todayUtc.getTime() + 24 * 60 * 60 * 1000);

    let groupStudents: GroupStudentWithDutyInfo[] = [];
    let groupMonitorName = "";
    if (targetGroupId) {
      const g = await prisma.group.findUnique({
        where: { id: targetGroupId },
        include: {
          monitor: { select: { id: true, name: true } },
          students: {
            include: { student: { select: { id: true, name: true } } },
            orderBy: { student: { name: "asc" } },
          },
        },
      });
      if (g) {
        groupStudents = g.students.map((gs) => ({
          id: gs.student.id,
          name: gs.student.name,
        }));
        if (g.monitor) groupMonitorName = g.monitor.name;
      }
    }

    // Fetch all historical duty records before current week to ensure fair queue across weeks/holidays
    const pastGroupDuties = targetGroupId
      ? await prisma.dutySchedule.findMany({
        where: {
          groupId: targetGroupId,
          date: { lt: startDate },
          isLeader: false,
        },
        select: { studentId: true, date: true },
        orderBy: { date: "desc" },
      })
      : [];

    const pastDutyCount: Record<string, number> = {};
    const lastDutyTime: Record<string, number> = {};
    groupStudents.forEach((s) => {
      pastDutyCount[s.id] = 0;
      lastDutyTime[s.id] = 0;
    });
    pastGroupDuties.forEach((d) => {
      if (pastDutyCount[d.studentId] !== undefined) {
        pastDutyCount[d.studentId] = (pastDutyCount[d.studentId] || 0) + 1;
      }
      if (!lastDutyTime[d.studentId]) {
        lastDutyTime[d.studentId] = new Date(d.date).getTime();
      }
    });

    let dbSchedules = await prisma.dutySchedule.findMany({
      where: {
        date: { gte: startDate, lt: endDate },
        ...(targetGroupId ? { groupId: targetGroupId } : {}),
      },
      include: {
        student: { select: { id: true, name: true } },
        group: { select: { id: true, name: true } },
      },
      orderBy: { date: "asc" },
    });

    // Query group attendances for this week to reflect real-time attendance in duty roster
    const groupSubjects = targetGroupId
      ? await prisma.groupSubject.findMany({
          where: { groupId: targetGroupId },
          select: { id: true },
        })
      : [];
    const groupSubjectIds = groupSubjects.map((gs) => gs.id);

    const weekAttendances = groupSubjectIds.length > 0
      ? await prisma.attendance.findMany({
          where: {
            groupSubjectId: { in: groupSubjectIds },
            date: { gte: startDate, lt: endDate },
          },
          select: {
            studentId: true,
            date: true,
            status: true,
            comment: true,
          },
        })
      : [];

    // Helper map: key = `${studentId}_${dayDateStr}`
    const attendanceByStudentAndDay = new Map<
      string,
      { status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED"; comment: string | null }
    >();
    weekAttendances.forEach((att) => {
      const attDateStr = formatLocalDateString(new Date(att.date));
      const key = `${att.studentId}_${attDateStr}`;
      const existing = attendanceByStudentAndDay.get(key);
      // Priority: ABSENT > EXCUSED > LATE > PRESENT
      if (
        !existing ||
        att.status === "ABSENT" ||
        (att.status === "EXCUSED" && existing.status !== "ABSENT") ||
        (att.status === "LATE" && existing.status === "PRESENT")
      ) {
        attendanceByStudentAndDay.set(key, {
          status: att.status as any,
          comment: att.comment,
        });
      }
    });

    // Calculate recentDutyMap with real DB data
    const recentDutyRecords = targetGroupId
      ? await prisma.dutySchedule.findMany({
        where: {
          groupId: targetGroupId,
          date: { gte: fourteenDaysAgo, lt: endDate },
          isLeader: false,
        },
        select: { studentId: true, date: true },
        orderBy: { date: "desc" },
      })
      : [];

    const recentDutyMap = new Map<string, { dateStr: string; note: string }>();
    recentDutyRecords.forEach((s) => {
      if (!recentDutyMap.has(s.studentId)) {
        const d = new Date(s.date);
        const dUtc = parseDateToUtc(d);
        const dFormatted = d.toLocaleDateString("ru-RU", { day: "numeric", month: "numeric" });
        let note = `Отдежурил(а) ${dFormatted}`;
        if (dUtc.getTime() === yesterdayUtc.getTime()) {
          note = `Отдежурил(а) вчера (${dFormatted})`;
        } else if (dUtc.getTime() === todayUtc.getTime()) {
          note = `Дежурит сегодня (${dFormatted})`;
        } else if (dUtc.getTime() > todayUtc.getTime()) {
          note = `В плане на ${dFormatted}`;
        }
        recentDutyMap.set(s.studentId, {
          dateStr: dFormatted,
          note,
        });
      }
    });

    // Populate groupStudents with updated recentDutyInfo
    groupStudents = groupStudents.map((s) => {
      const rec = recentDutyMap.get(s.id);
      return {
        ...s,
        lastDutyDate: rec?.dateStr,
        isRecentDuty: !!rec,
        recentDutyNote: rec?.note,
      };
    });

    const weeklyDays: DayDutyGroupDTO[] = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
      const dStr = formatLocalDateString(d);
      const dayUtc = parseDateToUtc(d);
      const dayUtcNext = new Date(dayUtc.getTime() + 24 * 60 * 60 * 1000);

      const isToday =
        now.getFullYear() === d.getFullYear() &&
        now.getMonth() === d.getMonth() &&
        now.getDate() === d.getDate();
      const isSunday = i === 6;

      const dayScheds = dbSchedules.filter((s) => {
        const sDate = new Date(s.date);
        return sDate >= dayUtc && sDate < dayUtcNext;
      });

      const leaderSched = dayScheds.find((s) => s.isLeader);
      const dutyScheds = dayScheds.filter((s) => !s.isLeader);

      const rawLeaderObj = leaderSched
        ? { id: leaderSched.student.id, name: leaderSched.student.name }
        : groupMonitorName && groupStudents.length > 0
          ? groupStudents.find((s) => s.name === groupMonitorName)
          : undefined;

      const leaderAtt = rawLeaderObj
        ? attendanceByStudentAndDay.get(`${rawLeaderObj.id}_${dStr}`)
        : undefined;

      const leaderObj = rawLeaderObj
        ? {
            id: rawLeaderObj.id,
            name: rawLeaderObj.name,
            attendanceStatus: leaderAtt?.status || null,
            attendanceComment: leaderAtt?.comment || null,
          }
        : undefined;

      const dutyStudents: DutyStudentDTO[] = dutyScheds.map((s) => {
        const att = attendanceByStudentAndDay.get(`${s.student.id}_${dStr}`);
        return {
          id: s.student.id,
          name: s.student.name,
          isLeader: false,
          attendanceStatus: att?.status || null,
          attendanceComment: att?.comment || null,
        };
      });

      const isPast = dayUtc.getTime() < todayUtc.getTime() && !isToday;

      weeklyDays.push({
        dateStr: d.toLocaleDateString("ru-RU", { day: "numeric", month: "numeric" }),
        dayName: dayNames[i],
        fullDate: dStr,
        isToday,
        isPast,
        isSunday,
        leaderStudent: isSunday ? undefined : leaderObj,
        dutyStudents: isSunday ? [] : dutyStudents,
      });
    }

    const allSchedules: DutyItemDTO[] = dbSchedules.map((s) => ({
      id: s.id,
      groupId: s.groupId,
      groupName: s.group.name,
      studentId: s.studentId,
      studentName: s.student.name,
      date: new Date(s.date).toLocaleDateString("ru-RU"),
      dayName:
        dayNames[
        new Date(s.date).getDay() === 0 ? 6 : new Date(s.date).getDay() - 1
        ],
      isLeader: s.isLeader,
      isToday: new Date(s.date).toDateString() === now.toDateString(),
    }));

    return {
      groups,
      weeklyDays,
      allSchedules,
      groupStudents,
      selectedGroupId: targetGroupId,
      isDutyEnabled: targetGroupIsDutyEnabled,
    };
  } catch (error) {
    console.error("Failed to fetch duty schedule:", error);
    return {
      groups: [],
      weeklyDays: [],
      allSchedules: [],
      groupStudents: [],
      selectedGroupId: "",
    };
  }
}

/** Manually add a student to a specific duty day */
export async function addDutyStudentAction(
  groupId: string,
  studentId: string,
  dateStr: string
) {
  const session = await auth();
  if (
    !session?.user ||
    (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")
  ) {
    return { success: false, error: "Недостаточно прав" };
  }
  try {
    const targetDate = parseDateToUtc(dateStr);
    const dayStart = targetDate;
    const dayEnd = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000);

    const weekMonday = getMondayOfCurrentWeek();
    const weekStart = parseDateToUtc(weekMonday);
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

    const existingWeekRecords = await prisma.dutySchedule.count({
      where: {
        groupId,
        date: { gte: weekStart, lt: weekEnd },
      },
    });

    if (existingWeekRecords === 0) {
      // Materialize auto-generated week first so all days are saved
      const group = await prisma.group.findUnique({
        where: { id: groupId },
        include: {
          students: { select: { studentId: true } },
        },
      });

      if (group && group.students.length > 0) {
        const studentIds = group.students.map((s) => s.studentId);
        const perDay = Math.min(studentIds.length, studentIds.length >= 6 ? 3 : 2);
        const dutyCounts: Record<string, number> = {};
        studentIds.forEach((id) => { dutyCounts[id] = 0; });

        for (let i = 0; i < 6; i++) {
          const d = new Date(weekMonday.getFullYear(), weekMonday.getMonth(), weekMonday.getDate() + i);
          const dayDate = parseDateToUtc(d);

          const candidates = [...studentIds].sort((a, b) => {
            const diff = (dutyCounts[a] || 0) - (dutyCounts[b] || 0);
            return diff !== 0 ? diff : studentIds.indexOf(a) - studentIds.indexOf(b);
          });

          for (let k = 0; k < perDay; k++) {
            const candId = candidates[k];
            if (candId) {
              dutyCounts[candId]++;
              await prisma.dutySchedule.create({
                data: {
                  groupId,
                  studentId: candId,
                  date: dayDate,
                  isLeader: false,
                },
              });
            }
          }
        }
      }
    }

    // Check not already assigned on this exact day as regular duty student
    const existing = await prisma.dutySchedule.findFirst({
      where: {
        groupId,
        studentId,
        date: { gte: dayStart, lt: dayEnd },
        isLeader: false,
      },
    });
    if (existing) return { success: false, error: "Студент уже назначен на этот день" };

    await prisma.dutySchedule.create({
      data: { groupId, studentId, date: targetDate, isLeader: false },
    });
    revalidatePath("/dashboard/duty");
    revalidatePath(`/dashboard/groups/${groupId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Произошла ошибка при назначении дежурного" };
  }
}

/** Manually remove a student from a duty day */
export async function removeDutyStudentAction(
  groupId: string,
  studentId: string,
  dateStr: string
) {
  const session = await auth();
  if (
    !session?.user ||
    (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")
  ) {
    return { success: false, error: "Недостаточно прав" };
  }
  try {
    const targetDate = parseDateToUtc(dateStr);
    const dayStart = targetDate;
    const dayEnd = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000);

    const weekMonday = getMondayOfCurrentWeek();
    const weekStart = parseDateToUtc(weekMonday);
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

    const existingWeekRecords = await prisma.dutySchedule.count({
      where: {
        groupId,
        date: { gte: weekStart, lt: weekEnd },
      },
    });

    if (existingWeekRecords === 0) {
      // Materialize the auto-generated week into DB without the removed student
      const group = await prisma.group.findUnique({
        where: { id: groupId },
        include: {
          students: { select: { studentId: true } },
        },
      });

      if (group && group.students.length > 0) {
        const studentIds = group.students.map((s) => s.studentId);
        const perDay = Math.min(studentIds.length, studentIds.length >= 6 ? 3 : 2);
        const dutyCounts: Record<string, number> = {};
        studentIds.forEach((id) => { dutyCounts[id] = 0; });

        for (let i = 0; i < 6; i++) {
          const d = new Date(weekMonday.getFullYear(), weekMonday.getMonth(), weekMonday.getDate() + i);
          const dayDate = parseDateToUtc(d);
          const isTargetDay = dayDate.getTime() === targetDate.getTime();

          const candidates = [...studentIds].sort((a, b) => {
            const diff = (dutyCounts[a] || 0) - (dutyCounts[b] || 0);
            return diff !== 0 ? diff : studentIds.indexOf(a) - studentIds.indexOf(b);
          });

          for (let k = 0; k < perDay; k++) {
            const candId = candidates[k];
            if (candId) {
              dutyCounts[candId]++;
              // Skip the removed student on the target day
              if (isTargetDay && candId === studentId) {
                continue;
              }
              await prisma.dutySchedule.create({
                data: {
                  groupId,
                  studentId: candId,
                  date: dayDate,
                  isLeader: false,
                },
              });
            }
          }
        }
      }
    } else {
      await prisma.dutySchedule.deleteMany({
        where: {
          groupId,
          studentId,
          date: { gte: dayStart, lt: dayEnd },
          isLeader: false,
        },
      });
    }

    revalidatePath("/dashboard/duty");
    revalidatePath(`/dashboard/groups/${groupId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Произошла ошибка при удалении дежурного" };
  }
}

export interface AllGroupsTodayDutyDTO {
  groupId: string;
  groupName: string;
  leaderStudent?: { id: string; name: string };
  dutyStudents: { id: string; name: string }[];
}

export interface StudentDutyStatDTO {
  studentId: string;
  studentName: string;
  completedDutiesCount: number;
  scheduledDutiesCount: number;
  totalDutiesCount: number;
  lastDutyDate?: string;
  isMonitor: boolean;
}

/** Fetch today's duty roster for ALL groups in the school */
export async function getAllGroupsTodayDutyAction(): Promise<AllGroupsTodayDutyDTO[]> {
  try {
    const now = new Date();
    const todayUtc = parseDateToUtc(now);
    const todayEndUtc = new Date(todayUtc.getTime() + 24 * 60 * 60 * 1000);

    const groups = await prisma.group.findMany({
      select: {
        id: true,
        name: true,
        monitor: { select: { id: true, name: true } },
        dutySchedules: {
          where: {
            date: { gte: todayUtc, lt: todayEndUtc },
          },
          include: {
            student: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return groups.map((g) => {
      const leaderSched = g.dutySchedules.find((s) => s.isLeader);
      const dutyScheds = g.dutySchedules.filter((s) => !s.isLeader);

      return {
        groupId: g.id,
        groupName: g.name,
        leaderStudent: leaderSched
          ? { id: leaderSched.student.id, name: leaderSched.student.name }
          : g.monitor
            ? { id: g.monitor.id, name: g.monitor.name }
            : undefined,
        dutyStudents: dutyScheds.map((s) => ({
          id: s.student.id,
          name: s.student.name,
        })),
      };
    });
  } catch (error) {
    console.error("Error in getAllGroupsTodayDutyAction:", error);
    return [];
  }
}

/** Fetch duty statistics for all students in a specific group */
export async function getGroupDutyStatsAction(groupId: string): Promise<StudentDutyStatDTO[]> {
  try {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        monitor: { select: { id: true } },
        students: {
          include: { student: { select: { id: true, name: true } } },
          orderBy: { student: { name: "asc" } },
        },
      },
    });

    if (!group) return [];

    const now = new Date();
    const todayUtc = parseDateToUtc(now);
    const yesterdayUtc = new Date(todayUtc.getTime() - 24 * 60 * 60 * 1000);
    const todayEndUtc = new Date(todayUtc.getTime() + 24 * 60 * 60 * 1000);

    const allGroupSchedules = await prisma.dutySchedule.findMany({
      where: { groupId },
      select: { studentId: true, date: true, isLeader: true },
      orderBy: { date: "desc" },
    });

    const completedCounts: Record<string, number> = {};
    const scheduledCounts: Record<string, number> = {};
    const lastCompletedDates: Record<string, string> = {};

    allGroupSchedules.forEach((s) => {
      const sDate = new Date(s.date);
      const sUtc = parseDateToUtc(sDate);
      const isCompleted = sUtc.getTime() < todayEndUtc.getTime();

      if (isCompleted) {
        completedCounts[s.studentId] = (completedCounts[s.studentId] || 0) + 1;
        if (!lastCompletedDates[s.studentId]) {
          const dFormatted = sDate.toLocaleDateString("ru-RU", {
            day: "numeric",
            month: "numeric",
          });
          if (sUtc.getTime() === yesterdayUtc.getTime()) {
            lastCompletedDates[s.studentId] = `Вчера (${dFormatted})`;
          } else if (sUtc.getTime() === todayUtc.getTime()) {
            lastCompletedDates[s.studentId] = `Сегодня (${dFormatted})`;
          } else {
            lastCompletedDates[s.studentId] = dFormatted;
          }
        }
      } else {
        scheduledCounts[s.studentId] = (scheduledCounts[s.studentId] || 0) + 1;
      }
    });

    return group.students.map((gs) => {
      const completed = completedCounts[gs.student.id] || 0;
      const scheduled = scheduledCounts[gs.student.id] || 0;
      return {
        studentId: gs.student.id,
        studentName: gs.student.name,
        completedDutiesCount: completed,
        scheduledDutiesCount: scheduled,
        totalDutiesCount: completed + scheduled,
        lastDutyDate: lastCompletedDates[gs.student.id] || "Еще не дежурил(а)",
        isMonitor: group.monitor?.id === gs.student.id,
      };
    });
  } catch (error) {
    console.error("Error in getGroupDutyStatsAction:", error);
    return [];
  }
}

/** Replace an absent student with another for a duty day */
export async function replaceDutyStudentAction(
  groupId: string,
  absentStudentId: string,
  replacementStudentId: string,
  dateStr: string
) {
  const session = await auth();
  if (
    !session?.user ||
    (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")
  ) {
    return { success: false, error: "Недостаточно прав" };
  }
  try {
    const targetDate = parseDateToUtc(dateStr);
    const dayStart = targetDate;
    const dayEnd = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000);

    // Remove absent student
    await prisma.dutySchedule.deleteMany({
      where: { groupId, studentId: absentStudentId, date: { gte: dayStart, lt: dayEnd }, isLeader: false },
    });
    // Add replacement (avoid duplicate)
    const existing = await prisma.dutySchedule.findFirst({
      where: { groupId, studentId: replacementStudentId, date: { gte: dayStart, lt: dayEnd }, isLeader: false },
    });
    if (!existing) {
      await prisma.dutySchedule.create({
        data: { groupId, studentId: replacementStudentId, date: targetDate, isLeader: false },
      });
    }
    revalidatePath("/dashboard/duty");
    revalidatePath(`/dashboard/groups/${groupId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Произошла ошибка при замене дежурного" };
  }
}

export interface DutySettingsOptions {
  isDutyEnabled?: boolean;
  perDay?: number; // 1 | 2 | 3 | 4 | 5
  activeDays?: number[]; // 0 = Mon, 1 = Tue, 2 = Wed, 3 = Thu, 4 = Fri, 5 = Sat
  includeLeader?: boolean;
  responsibleMode?: "NONE" | "MONITOR" | "DEPUTY" | "CUSTOM";
  customResponsibleStudentId?: string;
  algorithm?: "FAIR" | "ALPHABETICAL" | "RANDOM";
  excludedStudentIds?: string[];
}

export async function generateWeeklyDutyAction(
  groupId: string,
  options?: number | DutySettingsOptions
) {
  const session = await auth();
  if (
    !session?.user ||
    (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")
  ) {
    return { success: false, error: "Недостаточно прав для генерации ротации" };
  }

  try {
    const opts: DutySettingsOptions = typeof options === "number" ? { perDay: options } : (options || {});

    const monday = getMondayOfCurrentWeek();
    const startDate = parseDateToUtc(monday);
    const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);

    if (opts.isDutyEnabled !== undefined) {
      await prisma.group.update({
        where: { id: groupId },
        data: { isDutyEnabled: opts.isDutyEnabled },
      });

      if (opts.isDutyEnabled === false) {
        await prisma.dutySchedule.deleteMany({
          where: { groupId, date: { gte: startDate, lt: endDate } },
        });
        revalidatePath("/dashboard/duty");
        revalidatePath(`/dashboard/groups/${groupId}`);
        return { success: true };
      }
    }
    const perDayOverride = opts.perDay;
    const activeDays = opts.activeDays || [0, 1, 2, 3, 4, 5];
    const includeLeader = opts.includeLeader ?? true;
    const algorithm = opts.algorithm || "FAIR";
    const excludedIds = new Set(opts.excludedStudentIds || []);

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        monitor: { select: { id: true } },
        deputyMonitor: { select: { id: true } },
        students: {
          include: { student: { select: { id: true, name: true } } },
          orderBy: { student: { name: "asc" } },
        },
      },
    });

    if (!group || group.students.length === 0) {
      return { success: false, error: "В группе нет зачисленных студентов для распределения" };
    }

    // Eligible candidates (excluding exempted students)
    const eligibleStudents = group.students.filter((gs) => !excludedIds.has(gs.student.id));
    const candidateIds = eligibleStudents.map((gs) => gs.student.id);

    if (candidateIds.length === 0) {
      return { success: false, error: "Все студенты группы исключены из дежурства" };
    }

    // Determine responsible / senior duty student ID
    let leaderIdToAssign: string | null = null;
    if (opts.responsibleMode === "NONE") {
      leaderIdToAssign = null;
    } else if (opts.responsibleMode === "DEPUTY") {
      leaderIdToAssign = group.deputyMonitor?.id || group.monitor?.id || null;
    } else if (opts.responsibleMode === "CUSTOM" && opts.customResponsibleStudentId) {
      leaderIdToAssign = opts.customResponsibleStudentId;
    } else if (opts.responsibleMode === "MONITOR" || includeLeader) {
      leaderIdToAssign = group.monitor?.id || null;
    }

    // Calculate perDay: perDayOverride if explicitly provided, otherwise auto (1 for <6, 2 for <18, 3 for ≥18)
    const perDay = perDayOverride && perDayOverride > 0
      ? perDayOverride
      : (candidateIds.length < 6 ? 1 : candidateIds.length < 18 ? 2 : 3);

    const pastDuties = await prisma.dutySchedule.findMany({
      where: {
        groupId,
        date: { lt: startDate },
        isLeader: false,
      },
      select: { studentId: true, date: true },
      orderBy: { date: "desc" },
    });

    const pastDutyCount: Record<string, number> = {};
    const lastDutyTime: Record<string, number> = {};
    candidateIds.forEach((id) => {
      pastDutyCount[id] = 0;
      lastDutyTime[id] = 0;
    });
    pastDuties.forEach((d) => {
      if (pastDutyCount[d.studentId] !== undefined) {
        pastDutyCount[d.studentId] = (pastDutyCount[d.studentId] || 0) + 1;
      }
      if (!lastDutyTime[d.studentId]) {
        lastDutyTime[d.studentId] = new Date(d.date).getTime();
      }
    });

    const dutyCount: Record<string, number> = {};
    candidateIds.forEach((id) => { dutyCount[id] = 0; });

    await prisma.dutySchedule.deleteMany({
      where: { groupId, date: { gte: startDate, lt: endDate } },
    });

    for (let i = 0; i < 6; i++) {
      if (!activeDays.includes(i)) continue;

      const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
      const targetDate = parseDateToUtc(d);

      let candidates = [...candidateIds];

      if (algorithm === "FAIR") {
        candidates.sort((a, b) => {
          const scoreA = (pastDutyCount[a] || 0) * 100 + (dutyCount[a] || 0) * 10;
          const scoreB = (pastDutyCount[b] || 0) * 100 + (dutyCount[b] || 0) * 10;
          if (scoreA !== scoreB) return scoreA - scoreB;

          const timeA = lastDutyTime[a] || 0;
          const timeB = lastDutyTime[b] || 0;
          if (timeA !== timeB) return timeA - timeB;

          return candidateIds.indexOf(a) - candidateIds.indexOf(b);
        });
      } else if (algorithm === "RANDOM") {
        candidates.sort(() => Math.random() - 0.5);
      } else if (algorithm === "ALPHABETICAL") {
        // Already sorted alphabetically
      }

      const dayStudentIds: string[] = [];
      for (const id of candidates) {
        if (dayStudentIds.length >= perDay) break;
        dayStudentIds.push(id);
      }

      // Record duty counts
      dayStudentIds.forEach((id) => { dutyCount[id]++; });

      // Create duty entries
      for (const sid of dayStudentIds) {
        await prisma.dutySchedule.create({
          data: { groupId, studentId: sid, date: targetDate, isLeader: false },
        });
      }

      // Create leader/responsible entry if configured
      if (leaderIdToAssign && !dayStudentIds.includes(leaderIdToAssign)) {
        await prisma.dutySchedule.create({
          data: { groupId, studentId: leaderIdToAssign, date: targetDate, isLeader: true },
        });
      }
    }

    revalidatePath("/dashboard/duty");
    revalidatePath(`/dashboard/groups/${groupId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to generate duty schedule:", error);
    return { success: false, error: error instanceof Error ? error.message : "Ошибка при генерации графика дежурств" };
  }
}

/** Mark a student as absent locally (no DB change — use replaceDutyStudentAction to swap in DB) */
export async function markDutyAbsentAction(
  _groupId: string,
  _studentId: string,
  _dateStr: string
) {
  return { success: true };
}

/** Clear duty schedule */
export async function clearDutyScheduleAction(groupId?: string) {
  const session = await auth();
  if (
    !session?.user ||
    (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")
  ) {
    return { success: false, error: "Недостаточно прав для очистки дежурств" };
  }

  try {
    if (groupId) {
      await prisma.dutySchedule.deleteMany({
        where: { groupId },
      });
    } else {
      await prisma.dutySchedule.deleteMany({});
    }

    revalidatePath("/dashboard/duty");
    if (groupId) {
      revalidatePath(`/dashboard/groups/${groupId}`);
    }
    return { success: true };
  } catch (error) {
    console.error("clearDutyScheduleAction error:", error);
    return { success: false, error: "Ошибка при очистке дежурств" };
  }
}

/** Assign a student to duty as a disciplinary penalty */
export async function addDisciplinaryDutyAction(
  groupId: string,
  studentId: string,
  dateStr: string,
  _reason: string
) {
  const session = await auth();
  if (
    !session?.user ||
    (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")
  ) {
    return { success: false, error: "Недостаточно прав" };
  }
  try {
    const targetDate = parseDateToUtc(dateStr);
    const dayStart = targetDate;
    const dayEnd = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000);

    const existing = await prisma.dutySchedule.findFirst({
      where: {
        groupId,
        studentId,
        date: { gte: dayStart, lt: dayEnd },
        isLeader: false,
      },
    });
    if (existing) {
      return { success: false, error: "Студент уже назначен на дежурство в этот день" };
    }

    await prisma.dutySchedule.create({
      data: { groupId, studentId, date: targetDate, isLeader: false },
    });

    revalidatePath("/dashboard/duty");
    revalidatePath(`/dashboard/groups/${groupId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Произошла ошибка при добавлении дежурства" };
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
    revalidatePath("/dashboard/duty");
    revalidatePath(`/dashboard/groups/${groupId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Ошибка изменения статуса дежурств" };
  }
}
