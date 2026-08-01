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
}

export interface DayDutyGroupDTO {
  dateStr: string;
  dayName: string;
  fullDate: string;
  isToday: boolean;
  isSunday: boolean;
  /** Leader (e.g. monitor / старший дежурный) */
  leaderStudent?: { id: string; name: string };
  /** 2–3 duty students for this day */
  dutyStudents: DutyStudentDTO[];
}

export async function getDutyScheduleAction(selectedGroupId?: string): Promise<{
  groups: { id: string; name: string }[];
  weeklyDays: DayDutyGroupDTO[];
  allSchedules: DutyItemDTO[];
  groupStudents: { id: string; name: string }[];
}> {
  try {
    const groups = await prisma.group.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    const targetGroupId = selectedGroupId || groups[0]?.id;

    const now = new Date();
    const currentDayOfWeek = now.getDay();
    const distanceToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;

    const monday = new Date(now);
    monday.setDate(now.getDate() + distanceToMonday);
    monday.setHours(0, 0, 0, 0);

    const dayNames = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"];

    const startDate = new Date(monday);
    const endDate = new Date(monday);
    endDate.setDate(monday.getDate() + 7);

    const dbSchedules = await prisma.dutySchedule.findMany({
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

    let groupStudents: { id: string; name: string }[] = [];
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
        groupStudents = g.students.map((gs) => gs.student);
        if (g.monitor) groupMonitorName = g.monitor.name;
      }
    }

    const weeklyDays: DayDutyGroupDTO[] = [];
    const fallbackDutyCount: Record<string, number> = {};
    if (groupStudents.length > 0) {
      groupStudents.forEach((s) => { fallbackDutyCount[s.id] = 0; });
    }

    const hasAnyDbSchedule = dbSchedules.length > 0;

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);

      const dStr = d.toISOString().split("T")[0];
      const isToday = d.toDateString() === now.toDateString();
      const isSunday = i === 6;

      const dayScheds = dbSchedules.filter(
        (s) => new Date(s.date).toISOString().split("T")[0] === dStr
      );

      const leaderSched = dayScheds.find((s) => s.isLeader);
      const dutyScheds = dayScheds.filter((s) => !s.isLeader);

      let leaderObj = leaderSched
        ? { id: leaderSched.student.id, name: leaderSched.student.name }
        : undefined;

      let dutyStudents: DutyStudentDTO[] = dutyScheds.map((s) => ({
        id: s.student.id,
        name: s.student.name,
        isLeader: false,
      }));

      // Fallback: compute fair rotation ONLY if no DB schedule exists at all for this week
      if (!hasAnyDbSchedule && !isSunday && dutyStudents.length === 0 && groupStudents.length > 0) {
        const perDay = Math.min(groupStudents.length, groupStudents.length >= 6 ? 3 : 2);
        const candidates = [...groupStudents].sort((a, b) => {
          const diff = (fallbackDutyCount[a.id] || 0) - (fallbackDutyCount[b.id] || 0);
          return diff !== 0 ? diff : groupStudents.indexOf(a) - groupStudents.indexOf(b);
        });

        for (let k = 0; k < perDay; k++) {
          const candidate = candidates[k];
          if (candidate) {
            dutyStudents.push({ id: candidate.id, name: candidate.name, isLeader: false });
            fallbackDutyCount[candidate.id] = (fallbackDutyCount[candidate.id] || 0) + 1;
          }
        }
      }

      if (!hasAnyDbSchedule && !isSunday && !leaderObj && groupStudents.length > 0) {
        const leaderCandidate =
          groupStudents.find((s) => s.name === groupMonitorName) || groupStudents[0];
        if (leaderCandidate) {
          leaderObj = { id: leaderCandidate.id, name: leaderCandidate.name };
        }
      }

      weeklyDays.push({
        dateStr: d.toLocaleDateString("ru-RU", { day: "numeric", month: "numeric" }),
        dayName: dayNames[i],
        fullDate: dStr,
        isToday,
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

    return { groups, weeklyDays, allSchedules, groupStudents };
  } catch (error) {
    console.error("Failed to fetch duty schedule:", error);
    return { groups: [], weeklyDays: [], allSchedules: [], groupStudents: [] };
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
    const date = new Date(dateStr);
    // Check not already assigned
    const existing = await prisma.dutySchedule.findFirst({
      where: { groupId, studentId, date },
    });
    if (existing) return { success: false, error: "Студент уже назначен на этот день" };

    await prisma.dutySchedule.create({
      data: { groupId, studentId, date, isLeader: false },
    });
    revalidatePath("/dashboard/duty");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
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
    const date = new Date(dateStr);
    const nextDay = new Date(date);
    nextDay.setDate(date.getDate() + 1);

    await prisma.dutySchedule.deleteMany({
      where: {
        groupId,
        studentId,
        date: { gte: date, lt: nextDay },
      },
    });

    revalidatePath("/dashboard/duty");
    revalidatePath(`/dashboard/groups/${groupId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
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
    const date = new Date(dateStr);
    const nextDay = new Date(date);
    nextDay.setDate(date.getDate() + 1);

    // Remove absent student
    await prisma.dutySchedule.deleteMany({
      where: { groupId, studentId: absentStudentId, date: { gte: date, lt: nextDay }, isLeader: false },
    });
    // Add replacement (avoid duplicate)
    const existing = await prisma.dutySchedule.findFirst({
      where: { groupId, studentId: replacementStudentId, date },
    });
    if (!existing) {
      await prisma.dutySchedule.create({
        data: { groupId, studentId: replacementStudentId, date, isLeader: false },
      });
    }
    revalidatePath("/dashboard/duty");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function generateWeeklyDutyAction(groupId: string) {
  const session = await auth();
  if (
    !session?.user ||
    (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")
  ) {
    return { success: false, error: "Недостаточно прав для генерации ротации" };
  }

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

    if (!group || group.students.length === 0) {
      return { success: false, error: "В группе нет зачисленных студентов для распределения" };
    }

    const now = new Date();
    const currentDayOfWeek = now.getDay();
    const distanceToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;

    const monday = new Date(now);
    monday.setDate(now.getDate() + distanceToMonday);
    monday.setHours(0, 0, 0, 0);

    const studentIds = group.students.map((gs) => gs.student.id);
    const leaderId = group.monitor?.id || studentIds[0];

    // 2 duty students per day if <6 students, 3 if ≥6
    const perDay = studentIds.length >= 6 ? 3 : 2;

    // Smart no-repeat assignment:
    // Track duty count per student; each day pick those with lowest count (prefer 0).
    // This ensures everyone duties at most once per week when group is large enough.
    const dutyCount: Record<string, number> = {};
    studentIds.forEach((id) => { dutyCount[id] = 0; });

    const startDate = new Date(monday);
    const endDate = new Date(monday);
    endDate.setDate(monday.getDate() + 7);

    await prisma.dutySchedule.deleteMany({
      where: { groupId, date: { gte: startDate, lt: endDate } },
    });

    for (let i = 0; i < 6; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);

      // Sort candidates: prefer students with 0 duties, then alphabetically (stable order)
      const candidates = [...studentIds].sort((a, b) => {
        const diff = dutyCount[a] - dutyCount[b];
        return diff !== 0 ? diff : studentIds.indexOf(a) - studentIds.indexOf(b);
      });

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
          data: { groupId, studentId: sid, date: d, isLeader: false },
        });
      }

      // Create leader entry (always the monitor, not counted in perDay)
      if (leaderId && !dayStudentIds.includes(leaderId)) {
        await prisma.dutySchedule.create({
          data: { groupId, studentId: leaderId, date: d, isLeader: true },
        });
      }
    }

    revalidatePath("/dashboard/duty");
    revalidatePath(`/dashboard/groups/${groupId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Failed to generate duty schedule:", error);
    return { success: false, error: error.message || "Ошибка при генерации графика дежурств" };
  }
}

/** Mark a student as absent locally (no DB change — use replaceDutyStudentAction to swap in DB) */
export async function markDutyAbsentAction(
  _groupId: string,
  _studentId: string,
  _dateStr: string
) {
  // Absence is tracked in client state only.
  // Actual DB change happens when the user picks a replacement via replaceDutyStudentAction.
  return { success: true };
}
