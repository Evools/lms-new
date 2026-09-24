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
  lastDutyTimestamp?: number;
  totalDutiesCount: number;
  completedDutiesCount: number;
  isRecentDuty?: boolean;
  recentDutyNote?: string;
  isDutyExempt?: boolean;
  dutyExemptReason?: string | null;
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

/** Check if current user is authorized to edit/manage duty schedule for given groupId */
export async function checkDutyPermission(groupId: string): Promise<boolean> {
  const session = await auth();
  if (!session?.user) return false;
  if (session.user.role === "ADMIN" || session.user.role === "TEACHER") return true;

  if (!groupId) return false;
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { monitorId: true, deputyMonitorId: true },
  });
  if (!group) return false;

  return group.monitorId === session.user.id || group.deputyMonitorId === session.user.id;
}

export async function getDutyScheduleAction(selectedGroupId?: string): Promise<{
  groups: { id: string; name: string; isDutyEnabled: boolean }[];
  weeklyDays: DayDutyGroupDTO[];
  allSchedules: DutyItemDTO[];
  groupStudents: GroupStudentWithDutyInfo[];
  selectedGroupId: string;
  isDutyEnabled?: boolean;
  canManageDuty?: boolean;
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

    const targetGroupObj = targetGroupId
      ? await prisma.group.findUnique({
          where: { id: targetGroupId },
          select: { id: true, name: true, isDutyEnabled: true, monitorId: true, deputyMonitorId: true },
        })
      : null;
    const targetGroupIsDutyEnabled = targetGroupObj ? targetGroupObj.isDutyEnabled : true;
    const isMonitor = Boolean(userId && targetGroupObj?.monitorId === userId);
    const isDeputyMonitor = Boolean(userId && targetGroupObj?.deputyMonitorId === userId);
    const canManageDuty = role === "ADMIN" || role === "TEACHER" || isMonitor || isDeputyMonitor;

    const now = new Date();
    const monday = getMondayOfCurrentWeek();
    const dayNames = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"];

    const startDate = parseDateToUtc(monday);
    const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
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
          deputyMonitor: { select: { id: true, name: true } },
          students: {
            include: { student: { select: { id: true, name: true, isDutyExempt: true, dutyExemptReason: true } } },
            orderBy: { student: { name: "asc" } },
          },
        },
      });
      if (g) {
        groupStudents = g.students.map((gs) => ({
          id: gs.student.id,
          name: gs.student.name,
          isDutyExempt: gs.student.isDutyExempt,
          dutyExemptReason: gs.student.dutyExemptReason,
          totalDutiesCount: 0,
          completedDutiesCount: 0,
          lastDutyTimestamp: 0,
        }));
        // Ensure monitor and deputyMonitor are present in groupStudents list
        if (g.monitor && !groupStudents.some((s) => s.id === g.monitor!.id)) {
          groupStudents.push({
            id: g.monitor.id,
            name: g.monitor.name,
            isDutyExempt: false,
            dutyExemptReason: null,
            totalDutiesCount: 0,
            completedDutiesCount: 0,
            lastDutyTimestamp: 0,
          });
        }
        if (g.deputyMonitor && !groupStudents.some((s) => s.id === g.deputyMonitor!.id)) {
          groupStudents.push({
            id: g.deputyMonitor.id,
            name: g.deputyMonitor.name,
            isDutyExempt: false,
            dutyExemptReason: null,
            totalDutiesCount: 0,
            completedDutiesCount: 0,
            lastDutyTimestamp: 0,
          });
        }
        if (g.monitor) groupMonitorName = g.monitor.name;
      }
    }

    // Fetch ALL historical duty records across all time for this group to track accurate queue priority
    const allHistoricalDuties = targetGroupId
      ? await prisma.dutySchedule.findMany({
        where: {
          groupId: targetGroupId,
          isLeader: false,
        },
        select: { studentId: true, date: true },
        orderBy: { date: "desc" },
      })
      : [];

    const totalDutyCount: Record<string, number> = {};
    const completedDutyCount: Record<string, number> = {};
    const lastDutyTimestampMap: Record<string, number> = {};
    const lastDutyFormattedMap: Record<string, string> = {};

    groupStudents.forEach((s) => {
      totalDutyCount[s.id] = 0;
      completedDutyCount[s.id] = 0;
      lastDutyTimestampMap[s.id] = 0;
    });

    allHistoricalDuties.forEach((d) => {
      const sDate = new Date(d.date);
      const sUtc = parseDateToUtc(sDate);
      const sTime = sUtc.getTime();

      if (totalDutyCount[d.studentId] !== undefined) {
        totalDutyCount[d.studentId]++;
        if (sTime < todayEndUtc.getTime()) {
          completedDutyCount[d.studentId]++;
        }
      }

      if (!lastDutyTimestampMap[d.studentId] || sTime > lastDutyTimestampMap[d.studentId]) {
        lastDutyTimestampMap[d.studentId] = sTime;
        const dFormatted = sDate.toLocaleDateString("ru-RU", { day: "numeric", month: "numeric" });
        if (sTime === yesterdayUtc.getTime()) {
          lastDutyFormattedMap[d.studentId] = `Вчера (${dFormatted})`;
        } else if (sTime === todayUtc.getTime()) {
          lastDutyFormattedMap[d.studentId] = `Сегодня (${dFormatted})`;
        } else if (sTime > todayUtc.getTime()) {
          lastDutyFormattedMap[d.studentId] = `В плане на ${dFormatted}`;
        } else {
          lastDutyFormattedMap[d.studentId] = dFormatted;
        }
      }
    });

    // Populate groupStudents with accurate historical duty info
    groupStudents = groupStudents.map((s) => {
      const total = totalDutyCount[s.id] || 0;
      const completed = completedDutyCount[s.id] || 0;
      const lastTs = lastDutyTimestampMap[s.id] || 0;
      const lastFormatted = lastDutyFormattedMap[s.id];

      let note = "";
      if (total === 0) {
        note = "Еще не дежурил(а)";
      } else if (lastFormatted?.startsWith("Сегодня")) {
        note = "Дежурит сегодня";
      } else if (lastFormatted?.startsWith("Вчера")) {
        note = `Отдежурил(а) вчера (всего: ${total})`;
      } else if (lastFormatted?.startsWith("В плане")) {
        note = `${lastFormatted} (всего: ${total})`;
      } else {
        note = `Отдежурил(а) ${lastFormatted} (всего: ${total})`;
      }

      return {
        ...s,
        totalDutiesCount: total,
        completedDutiesCount: completed,
        lastDutyTimestamp: lastTs,
        lastDutyDate: lastFormatted || "Еще не дежурил(а)",
        isRecentDuty: total > 0,
        recentDutyNote: note,
      };
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
  const isAllowed = await checkDutyPermission(groupId);
  if (!isAllowed) {
    return { success: false, error: "Недостаточно прав для назначения дежурного" };
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
      // Auto-generate week first with proper FAIR queue
      await generateWeeklyDutyAction(groupId);
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

    // Use upsert on composite unique key to avoid duplicate key violations
    await prisma.dutySchedule.upsert({
      where: {
        groupId_studentId_date: {
          groupId,
          studentId,
          date: targetDate,
        },
      },
      create: {
        groupId,
        studentId,
        date: targetDate,
        isLeader: false,
      },
      update: {
        isLeader: false,
      },
    });

    // Notify student about duty assignment
    try {
      const dateFormatted = targetDate.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
      });
      await prisma.notification.create({
        data: {
          userId: studentId,
          title: "Назначение на дежурство",
          message: `Вы назначены дежурным на ${dateFormatted}.`,
          type: "SYSTEM",
          link: "/dashboard/duty",
        },
      });
    } catch (notifErr) {
      console.error("Failed to notify student about duty:", notifErr);
    }

    revalidatePath("/dashboard/duty");
    revalidatePath(`/dashboard/groups/${groupId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to add duty student:", error);
    return { success: false, error: error instanceof Error ? error.message : "Произошла ошибка при назначении дежурного" };
  }
}

/** Manually remove a student from a duty day */
export async function removeDutyStudentAction(
  groupId: string,
  studentId: string,
  dateStr: string
) {
  const isAllowed = await checkDutyPermission(groupId);
  if (!isAllowed) {
    return { success: false, error: "Недостаточно прав для удаления дежурного" };
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
      // Auto-generate week first with proper FAIR queue
      await generateWeeklyDutyAction(groupId);
    }

    await prisma.dutySchedule.deleteMany({
      where: {
        groupId,
        studentId,
        date: { gte: dayStart, lt: dayEnd },
        isLeader: false,
      },
    });

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
  isDeputyMonitor?: boolean;
  isDutyExempt?: boolean;
  dutyExemptReason?: string | null;
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
        deputyMonitor: { select: { id: true } },
        students: {
          include: { student: { select: { id: true, name: true, isDutyExempt: true, dutyExemptReason: true } } },
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
        isDeputyMonitor: group.deputyMonitor?.id === gs.student.id,
        isDutyExempt: gs.student.isDutyExempt,
        dutyExemptReason: gs.student.dutyExemptReason,
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
  const isAllowed = await checkDutyPermission(groupId);
  if (!isAllowed) {
    return { success: false, error: "Недостаточно прав для замены дежурного" };
  }
  try {
    const targetDate = parseDateToUtc(dateStr);
    const dayStart = targetDate;
    const dayEnd = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000);

    // Check if replacement student is exempt (ЛОВЗ)
    const repStudent = await prisma.user.findUnique({
      where: { id: replacementStudentId },
      select: { isDutyExempt: true, name: true },
    });
    if (repStudent?.isDutyExempt) {
      return { success: false, error: `Студент ${repStudent.name} освобожден(а) от дежурств (статус ЛОВЗ)` };
    }

    // Remove absent student
    await prisma.dutySchedule.deleteMany({
      where: { groupId, studentId: absentStudentId, date: { gte: dayStart, lt: dayEnd } },
    });

    // Add replacement safely with upsert
    await prisma.dutySchedule.upsert({
      where: {
        groupId_studentId_date: {
          groupId,
          studentId: replacementStudentId,
          date: targetDate,
        },
      },
      create: {
        groupId,
        studentId: replacementStudentId,
        date: targetDate,
        isLeader: false,
      },
      update: {
        isLeader: false,
      },
    });

    // Notify replacement student
    try {
      const dateFormatted = targetDate.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
      });
      await prisma.notification.create({
        data: {
          userId: replacementStudentId,
          title: "Назначение на дежурство (замена)",
          message: `Вы назначены дежурным на ${dateFormatted}.`,
          type: "SYSTEM",
          link: "/dashboard/duty",
        },
      });
    } catch (notifErr) {
      console.error("Failed to notify replacement student about duty:", notifErr);
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
  const isAllowed = await checkDutyPermission(groupId);
  if (!isAllowed) {
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
          include: { student: { select: { id: true, name: true, isDutyExempt: true } } },
          orderBy: { student: { name: "asc" } },
        },
      },
    });

    if (!group || group.students.length === 0) {
      return { success: false, error: "В группе нет зачисленных студентов для распределения" };
    }

    // Eligible candidates (excluding ЛОВЗ / permanently exempt students and temporary exclusions)
    const eligibleStudents = group.students.filter(
      (gs) => !gs.student.isDutyExempt && !excludedIds.has(gs.student.id)
    );
    // Deduplicate candidate IDs
    const candidateIds = Array.from(new Set(eligibleStudents.map((gs) => gs.student.id)));

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

    // Calculate perDay: perDayOverride if explicitly provided, otherwise auto (1 for <6, 2 for 6-35, 3 for >35)
    const perDay = perDayOverride && perDayOverride > 0
      ? perDayOverride
      : (candidateIds.length < 6 ? 1 : 2);

    const pastDuties = await prisma.dutySchedule.findMany({
      where: {
        studentId: { in: candidateIds },
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

    const currentWeekDutyCount: Record<string, number> = {};
    candidateIds.forEach((id) => { currentWeekDutyCount[id] = 0; });

    const now = new Date();
    const todayUtc = parseDateToUtc(now);

    // Only delete schedule from today onwards, keeping past days and past replacements of this week intact
    await prisma.dutySchedule.deleteMany({
      where: {
        groupId,
        date: { gte: todayUtc, lt: endDate },
      },
    });

    // Count duties that already took place earlier this week (e.g. manual replacements or completed shifts)
    const thisWeekPastDuties = await prisma.dutySchedule.findMany({
      where: {
        groupId,
        date: { gte: startDate, lt: todayUtc },
        isLeader: false,
      },
      select: { studentId: true, date: true },
    });
    thisWeekPastDuties.forEach((d) => {
      if (currentWeekDutyCount[d.studentId] !== undefined) {
        currentWeekDutyCount[d.studentId] = (currentWeekDutyCount[d.studentId] || 0) + 1;
      }
      const t = new Date(d.date).getTime();
      if (!lastDutyTime[d.studentId] || t > lastDutyTime[d.studentId]) {
        lastDutyTime[d.studentId] = t;
      }
    });

    // Query group attendances for this week to skip students with НБ / ABSENT on specific days
    const groupSubjects = await prisma.groupSubject.findMany({
      where: { groupId },
      select: { id: true },
    });
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
        },
      })
      : [];

    // Map of absent students per date string: key = `${studentId}_${YYYY-MM-DD}`
    const absentStudentsOnDate = new Set<string>();
    weekAttendances.forEach((att) => {
      if (att.status === "ABSENT" || att.status === "EXCUSED") {
        const dStr = formatLocalDateString(new Date(att.date));
        absentStudentsOnDate.add(`${att.studentId}_${dStr}`);
      }
    });

    for (let i = 0; i < 6; i++) {
      if (!activeDays.includes(i)) continue;

      const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
      const targetDate = parseDateToUtc(d);
      const targetTime = targetDate.getTime();

      // If this day has already passed earlier this week, don't overwrite it
      if (targetTime < todayUtc.getTime()) continue;

      const dStr = formatLocalDateString(d);

      // Filter out students who are absent (НБ / Уваж.) on this specific day
      let dayCandidates = candidateIds.filter((id) => !absentStudentsOnDate.has(`${id}_${dStr}`));

      // If all candidates are absent on this day (rare), fallback to all candidate IDs
      if (dayCandidates.length === 0) {
        dayCandidates = [...candidateIds];
      }

      if (algorithm === "FAIR") {
        dayCandidates.sort((a, b) => {
          const weekA = currentWeekDutyCount[a] || 0;
          const weekB = currentWeekDutyCount[b] || 0;

          // 1. Strict anti-repeat in the same week (nobody serves twice in 1 week if others haven't served)
          if (weekA !== weekB) return weekA - weekB;

          const totalA = (pastDutyCount[a] || 0) + weekA;
          const totalB = (pastDutyCount[b] || 0) + weekB;

          const timeA = lastDutyTime[a] || 0;
          const timeB = lastDutyTime[b] || 0;

          // Days elapsed since last duty
          const daysSinceA = timeA > 0 ? Math.floor((targetTime - timeA) / (24 * 60 * 60 * 1000)) : 999;
          const daysSinceB = timeB > 0 ? Math.floor((targetTime - timeB) / (24 * 60 * 60 * 1000)) : 999;

          // 2. Strict Cooldown tiers (for groups of 22-30 students, normal rest is 12-18 days)
          // Tier 4: served <= 2 days ago -> absolute penalty
          // Tier 3: served <= 4 days ago
          // Tier 2: served <= 7 days ago
          // Tier 1: served <= 10 days ago
          // Tier 0: rested >= 11 days or never served -> ready for rotation
          const restPenaltyA = daysSinceA <= 2 ? 4 : daysSinceA <= 4 ? 3 : daysSinceA <= 7 ? 2 : daysSinceA <= 10 ? 1 : 0;
          const restPenaltyB = daysSinceB <= 2 ? 4 : daysSinceB <= 4 ? 3 : daysSinceB <= 7 ? 2 : daysSinceB <= 10 ? 1 : 0;

          if (restPenaltyA !== restPenaltyB) {
            return restPenaltyA - restPenaltyB;
          }

          // 3. Priority for students who have NEVER served duty (total == 0)
          const neverA = totalA === 0 ? 0 : 1;
          const neverB = totalB === 0 ? 0 : 1;
          if (neverA !== neverB) return neverA - neverB;

          // 4. Priority for students with fewer total duties all-time
          if (totalA !== totalB) return totalA - totalB;

          // 5. Priority for students who rested longest (earliest lastDutyTime)
          if (timeA !== timeB) return timeA - timeB;

          // 6. Stable Alphabetical order
          return candidateIds.indexOf(a) - candidateIds.indexOf(b);
        });
      } else if (algorithm === "RANDOM") {
        dayCandidates.sort(() => Math.random() - 0.5);
      } else if (algorithm === "ALPHABETICAL") {
        // Keep alphabetical order
      }

      const dayStudentIds: string[] = [];
      for (const id of dayCandidates) {
        if (dayStudentIds.length >= perDay) break;
        if (!dayStudentIds.includes(id)) {
          dayStudentIds.push(id);
        }
      }

      // Record duty counts & update lastDutyTime
      dayStudentIds.forEach((id) => {
        currentWeekDutyCount[id] = (currentWeekDutyCount[id] || 0) + 1;
        lastDutyTime[id] = targetTime;
      });

      // Create duty entries using upsert
      for (const sid of dayStudentIds) {
        await prisma.dutySchedule.upsert({
          where: {
            groupId_studentId_date: {
              groupId,
              studentId: sid,
              date: targetDate,
            },
          },
          create: { groupId, studentId: sid, date: targetDate, isLeader: false },
          update: { isLeader: false },
        });
      }

      // Create leader/responsible entry if configured (and not absent on this day)
      let effectiveLeaderId = leaderIdToAssign;
      if (effectiveLeaderId && absentStudentsOnDate.has(`${effectiveLeaderId}_${dStr}`)) {
        effectiveLeaderId = null; // Do not assign absent monitor/leader
      }

      if (effectiveLeaderId && !dayStudentIds.includes(effectiveLeaderId)) {
        await prisma.dutySchedule.upsert({
          where: {
            groupId_studentId_date: {
              groupId,
              studentId: effectiveLeaderId,
              date: targetDate,
            },
          },
          create: { groupId, studentId: effectiveLeaderId, date: targetDate, isLeader: true },
          update: { isLeader: true },
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
  if (groupId) {
    const isAllowed = await checkDutyPermission(groupId);
    if (!isAllowed) return { success: false, error: "Недостаточно прав для очистки дежурств" };
  } else {
    const session = await auth();
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
      return { success: false, error: "Недостаточно прав для очистки дежурств" };
    }
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
  const isAllowed = await checkDutyPermission(groupId);
  if (!isAllowed) {
    return { success: false, error: "Недостаточно прав для назначения дежурства" };
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

    await prisma.dutySchedule.upsert({
      where: {
        groupId_studentId_date: {
          groupId,
          studentId,
          date: targetDate,
        },
      },
      create: { groupId, studentId, date: targetDate, isLeader: false },
      update: { isLeader: false },
    });

    // Notify student about disciplinary duty
    try {
      const dateFormatted = targetDate.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
      });
      const reasonText = _reason?.trim() ? ` Причина: ${_reason.trim()}` : "";
      await prisma.notification.create({
        data: {
          userId: studentId,
          title: "Внеочередное дежурство",
          message: `Вам назначено внеочередное дежурство на ${dateFormatted}.${reasonText}`,
          type: "SYSTEM",
          link: "/dashboard/duty",
        },
      });
    } catch (notifErr) {
      console.error("Failed to notify student about disciplinary duty:", notifErr);
    }

    revalidatePath("/dashboard/duty");
    revalidatePath(`/dashboard/groups/${groupId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Произошла ошибка при добавлении дежурства" };
  }
}

export async function toggleGroupDutyAction(groupId: string, isDutyEnabled: boolean) {
  const isAllowed = await checkDutyPermission(groupId);
  if (!isAllowed) {
    return { success: false, error: "Недостаточно прав для настройки дежурств" };
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

/** Toggle student's permanent duty exemption (e.g. ЛОВЗ or medical exemption) */
export async function toggleStudentDutyExemptionAction(
  studentId: string,
  isDutyExempt: boolean,
  dutyExemptReason?: string | null,
  groupId?: string
) {
  if (groupId) {
    const isAllowed = await checkDutyPermission(groupId);
    if (!isAllowed) return { success: false, error: "Недостаточно прав" };
  } else {
    const session = await auth();
    if (
      !session?.user ||
      (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")
    ) {
      return { success: false, error: "Недостаточно прав" };
    }
  }

  try {
    await prisma.user.update({
      where: { id: studentId },
      data: {
        isDutyExempt,
        dutyExemptReason: isDutyExempt ? (dutyExemptReason || "ЛОВЗ") : null,
      },
    });

    // If student is now exempt, remove any upcoming scheduled duties
    if (isDutyExempt) {
      const now = new Date();
      const todayUtc = parseDateToUtc(now);
      await prisma.dutySchedule.deleteMany({
        where: {
          studentId,
          date: { gte: todayUtc },
          isLeader: false,
        },
      });
    }

    revalidatePath("/dashboard/duty");
    if (groupId) {
      revalidatePath(`/dashboard/groups/${groupId}`);
    }
    revalidatePath("/dashboard/groups");
    return { success: true };
  } catch (error) {
    console.error("Error toggling duty exemption:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Ошибка при сохранении статуса освобождения",
    };
  }
}

