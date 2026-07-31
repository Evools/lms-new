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

export interface DayDutyGroupDTO {
  dateStr: string;
  dayName: string;
  fullDate: string;
  isToday: boolean;
  isSunday: boolean;
  leaderStudent?: { id: string; name: string };
  dutyStudent?: { id: string; name: string };
}

export async function getDutyScheduleAction(selectedGroupId?: string): Promise<{
  groups: { id: string; name: string }[];
  weeklyDays: DayDutyGroupDTO[];
  allSchedules: DutyItemDTO[];
}> {
  try {
    const groups = await prisma.group.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    const targetGroupId = selectedGroupId || groups[0]?.id;

    // Determine current week Monday to Saturday
    const now = new Date();
    const currentDayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon ...
    const distanceToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;

    const monday = new Date(now);
    monday.setDate(now.getDate() + distanceToMonday);
    monday.setHours(0, 0, 0, 0);

    const dayNames = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"];

    // Fetch schedules from DB for current week
    const startDate = new Date(monday);
    const endDate = new Date(monday);
    endDate.setDate(monday.getDate() + 7);

    const dbSchedules = await prisma.dutySchedule.findMany({
      where: {
        date: {
          gte: startDate,
          lt: endDate,
        },
        ...(targetGroupId ? { groupId: targetGroupId } : {}),
      },
      include: {
        student: { select: { id: true, name: true } },
        group: { select: { id: true, name: true } },
      },
      orderBy: { date: "asc" },
    });

    // Also fetch students of group to generate fallback if empty
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

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);

      const dStr = d.toISOString().split("T")[0];
      const isToday = d.toDateString() === now.toDateString();
      const isSunday = i === 6;

      const dayScheds = dbSchedules.filter((s) => new Date(s.date).toISOString().split("T")[0] === dStr);

      const leaderSched = dayScheds.find((s) => s.isLeader);
      const studentSched = dayScheds.find((s) => !s.isLeader);

      let leaderObj = leaderSched ? { id: leaderSched.student.id, name: leaderSched.student.name } : undefined;
      let studentObj = studentSched ? { id: studentSched.student.id, name: studentSched.student.name } : undefined;

      // Fallback if no DB schedule created yet for this day
      if (!isSunday && !studentObj && groupStudents.length > 0) {
        const studentIndex = i % groupStudents.length;
        const candidate = groupStudents[studentIndex];
        if (candidate) {
          studentObj = { id: candidate.id, name: candidate.name };
        }
      }

      if (!isSunday && !leaderObj && groupStudents.length > 0) {
        const leaderCandidate = groupStudents.find((s) => s.name === groupMonitorName) || groupStudents[0];
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
        dutyStudent: isSunday ? undefined : studentObj,
      });
    }

    const allSchedules: DutyItemDTO[] = dbSchedules.map((s) => ({
      id: s.id,
      groupId: s.groupId,
      groupName: s.group.name,
      studentId: s.studentId,
      studentName: s.student.name,
      date: new Date(s.date).toLocaleDateString("ru-RU"),
      dayName: dayNames[new Date(s.date).getDay() === 0 ? 6 : new Date(s.date).getDay() - 1],
      isLeader: s.isLeader,
      isToday: new Date(s.date).toDateString() === now.toDateString(),
    }));

    return {
      groups,
      weeklyDays,
      allSchedules,
    };
  } catch (error) {
    console.error("Failed to fetch duty schedule:", error);
    return { groups: [], weeklyDays: [], allSchedules: [] };
  }
}

export async function generateWeeklyDutyAction(groupId: string) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
    return { success: false, error: "Недостаточно прав для генерации ротации" };
  }

  try {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        monitor: { select: { id: true } },
        students: {
          include: { student: { select: { id: true } } },
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

    // Delete existing schedules for this week and group
    const startDate = new Date(monday);
    const endDate = new Date(monday);
    endDate.setDate(monday.getDate() + 7);

    await prisma.dutySchedule.deleteMany({
      where: {
        groupId,
        date: { gte: startDate, lt: endDate },
      },
    });

    // Create new entries Mon-Sat (6 days)
    for (let i = 0; i < 6; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);

      const dutyStudentId = studentIds[i % studentIds.length];

      // Create student duty
      await prisma.dutySchedule.create({
        data: {
          groupId,
          studentId: dutyStudentId,
          date: d,
          isLeader: false,
        },
      });

      // Create leader duty if different or leader exists
      if (leaderId && leaderId !== dutyStudentId) {
        await prisma.dutySchedule.create({
          data: {
            groupId,
            studentId: leaderId,
            date: d,
            isLeader: true,
          },
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
