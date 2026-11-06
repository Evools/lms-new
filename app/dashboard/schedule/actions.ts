"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { GroupScheduleData, DaySchedule } from "./_components/schedule-view";

const SCHEDULE_SETTING_KEY = "lms_schedule_v1";

function createDefaultDaysForWeek(): DaySchedule[] {
  const dayNames = [
    "Понедельник",
    "Вторник",
    "Среда",
    "Четверг",
    "Пятница",
    "Суббота",
  ];

  // Calculate current week's Monday..Saturday dates
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 (Sun) .. 6 (Sat)
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);

  return dayNames.map((dayName, idx) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + idx);

    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = String(d.getFullYear()).slice(-2);

    const fullDateRu = d.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    return {
      dateStr: `${dd}.${mm}.${yy}`,
      dayOfWeek: dayName,
      fullDateRu,
      lessons: [],
    };
  });
}

export async function getSchedulePageDataAction() {
  const session = await auth();
  const userId = session?.user?.id;
  const role = session?.user?.role || "STUDENT";

  const [dbGroups, dbSubjects, dbTeachers, savedSetting, studentEnrollment] =
    await Promise.all([
      prisma.group.findMany({
        orderBy: [{ course: "asc" }, { name: "asc" }],
        include: {
          specialty: { select: { name: true } },
          curator: { select: { name: true } },
          groupSubjects: {
            include: {
              subject: { select: { name: true } },
              teacher: { select: { name: true } },
            },
          },
        },
      }),
      prisma.subject.findMany({
        select: { name: true },
        orderBy: { name: "asc" },
      }),
      prisma.user.findMany({
        where: { role: "TEACHER", isActive: true },
        select: { name: true },
        orderBy: { name: "asc" },
      }),
      prisma.systemSetting.findUnique({
        where: { key: SCHEDULE_SETTING_KEY },
      }),
      role === "STUDENT" && userId
        ? prisma.groupStudent.findFirst({
            where: { studentId: userId },
            select: { groupId: true },
          })
        : Promise.resolve(null),
    ]);

  let savedSchedules: GroupScheduleData[] = [];
  if (savedSetting?.value) {
    try {
      const parsed = JSON.parse(savedSetting.value);
      if (Array.isArray(parsed)) {
        savedSchedules = parsed;
      }
    } catch {
      savedSchedules = [];
    }
  }

  const savedByGroupId = new Map<string, GroupScheduleData>();
  const savedByGroupName = new Map<string, GroupScheduleData>();
  for (const item of savedSchedules) {
    if (item.groupId) savedByGroupId.set(item.groupId, item);
    if (item.groupName) savedByGroupName.set(item.groupName.toLowerCase(), item);
  }

  const defaultDays = createDefaultDaysForWeek();

  // Merge real DB groups with saved schedule data (or build initial lessons from groupSubjects)
  const mergedSchedules: GroupScheduleData[] = dbGroups.map((g) => {
    const existing =
      savedByGroupId.get(g.id) || savedByGroupName.get(g.name.toLowerCase());

    const curatorName = g.curator?.name || "Не назначен";
    const specialtyName = g.specialty?.name || "Общеобразовательная";

    if (existing) {
      return {
        ...existing,
        groupId: g.id,
        groupName: g.name,
        course: g.course,
        specialty: specialtyName,
        curator: curatorName,
        days:
          Array.isArray(existing.days) && existing.days.length === 6
            ? existing.days
            : defaultDays,
      };
    }

    // Build starter schedule from the group's real assigned GroupSubjects (or fallback subjects) in DB
    const subjectPool =
      g.groupSubjects.length >= 3
        ? g.groupSubjects.map((gs) => ({
            subject: gs.subject.name,
            teacher: gs.teacher.name,
          }))
        : [
            ...g.groupSubjects.map((gs) => ({
              subject: gs.subject.name,
              teacher: gs.teacher.name,
            })),
            ...dbSubjects.map((s, idx) => ({
              subject: s.name,
              teacher:
                dbTeachers[idx % Math.max(1, dbTeachers.length)]?.name ||
                curatorName,
            })),
          ];

    const days = defaultDays.map((day, dIdx) => {
      const lessons = [];
      if (subjectPool.length > 0) {
        const pairsForDay = Math.min(3, subjectPool.length);
        const times = ["08:00 – 09:20", "09:30 – 10:50", "11:00 – 12:20"];
        for (let p = 0; p < pairsForDay; p++) {
          const item = subjectPool[(dIdx * 2 + p) % subjectPool.length];
          lessons.push({
            id: `init-${g.id}-${dIdx}-${p + 1}`,
            pairNumber: p + 1,
            time: times[p],
            subject: item.subject,
            room: `каб. ${201 + ((dIdx + p) % 12)}`,
            teacher: item.teacher,
          });
        }
      }
      return {
        ...day,
        lessons,
      };
    });

    return {
      groupId: g.id,
      groupName: g.name,
      course: g.course,
      specialty: specialtyName,
      curator: curatorName,
      shift: "1-я смена (08:00)",
      days,
    };
  });

  const dbSubjectNames = dbSubjects.map((s) => s.name);
  const dbTeacherNames = dbTeachers.map((t) => t.name);

  return {
    schedules: mergedSchedules,
    dbSubjectNames,
    dbTeacherNames,
    defaultGroupId:
      studentEnrollment?.groupId || mergedSchedules[0]?.groupId || "",
    canEdit:
      role === "ADMIN" || role === "TEACHER" || role === "ADMINISTRATION",
  };
}

export async function saveScheduleDataAction(schedules: GroupScheduleData[]) {
  const session = await auth();
  if (
    !session?.user ||
    (session.user.role !== "ADMIN" &&
      session.user.role !== "TEACHER" &&
      session.user.role !== "ADMINISTRATION")
  ) {
    return { success: false, error: "Недостаточно прав для сохранения расписания" };
  }

  try {
    await prisma.systemSetting.upsert({
      where: { key: SCHEDULE_SETTING_KEY },
      update: { value: JSON.stringify(schedules) },
      create: {
        key: SCHEDULE_SETTING_KEY,
        value: JSON.stringify(schedules),
      },
    });

    revalidatePath("/dashboard/schedule");
    return { success: true };
  } catch (err) {
    console.error("saveScheduleDataAction error:", err);
    return { success: false, error: "Ошибка сохранения расписания в БД" };
  }
}

export interface HeaderLessonItem {
  id: string;
  pairNumber: number;
  time: string;
  subject: string;
  room: string;
  teacher?: string;
  status: "past" | "active" | "upcoming";
  minutesLeft?: number;
}

export interface HeaderStatusDTO {
  dayName: string;
  fullDate: string;
  groupName?: string;
  selectedGroupId?: string;
  allGroups?: Array<{ id: string; name: string }>;
  currentLesson: HeaderLessonItem | null;
  nextLesson: HeaderLessonItem | null;
  isBreak: boolean;
  breakMinutesLeft?: number;
  lessonsToday: HeaderLessonItem[];
  role: string;
}

export async function getHeaderCurrentStatusAction(
  requestedGroupId?: string
): Promise<HeaderStatusDTO | null> {
  try {
    const session = await auth();
    if (!session?.user) return null;

    const role = session.user.role || "STUDENT";
    const userId = session.user.id;
    const userName = session.user.name || "";

    const now = new Date();
    const dayIndex = now.getDay();
    const dayNames = [
      "Воскресенье",
      "Понедельник",
      "Вторник",
      "Среда",
      "Четверг",
      "Пятница",
      "Суббота",
    ];
    const dayName = dayNames[dayIndex];
    const fullDate = now.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      weekday: "long",
    });

    // 1. Fetch saved schedule, all groups, and user enrollment in parallel
    const [savedSetting, enrollment, allDbGroups] = await Promise.all([
      prisma.systemSetting.findUnique({
        where: { key: SCHEDULE_SETTING_KEY },
      }),
      userId
        ? prisma.groupStudent.findFirst({
            where: { studentId: userId },
            include: { group: true },
          })
        : Promise.resolve(null),
      prisma.group.findMany({
        select: { id: true, name: true },
        orderBy: [{ course: "asc" }, { name: "asc" }],
      }),
    ]);

    let savedSchedules: GroupScheduleData[] = [];
    if (savedSetting?.value) {
      try {
        const parsed = JSON.parse(savedSetting.value);
        if (Array.isArray(parsed)) savedSchedules = parsed;
      } catch {}
    }

    // Determine target group based on requestedGroupId or user role
    let targetGroup = requestedGroupId
      ? allDbGroups.find((g) => g.id === requestedGroupId)
      : null;

    if (!targetGroup) {
      if (role === "STUDENT" && enrollment) {
        targetGroup = enrollment.group;
      } else {
        targetGroup = allDbGroups[0] || null;
      }
    }

    const targetGroupId = targetGroup?.id;
    const groupName = targetGroup?.name || "Лицей";

    // 2. Find lessons for today
    let rawLessonsToday: any[] = [];

    // Find schedule for the chosen group
    const targetSched = savedSchedules.find(
      (s) =>
        s.groupId === targetGroupId ||
        s.groupName?.toLowerCase() === groupName.toLowerCase()
    );
    const dayData = targetSched?.days?.find(
      (day) => day.dayOfWeek?.toLowerCase() === dayName.toLowerCase()
    );
    if (dayData?.lessons) {
      rawLessonsToday = dayData.lessons;
    }

    // Standard lyceum bell schedule intervals (minutes from 00:00)
    const BELL_INTERVALS = [
      { pairNumber: 1, start: 8 * 60, end: 9 * 60 + 20, timeStr: "08:00 – 09:20" },
      { pairNumber: 2, start: 9 * 60 + 30, end: 10 * 60 + 50, timeStr: "09:30 – 10:50" },
      { pairNumber: 3, start: 11 * 60, end: 12 * 60 + 20, timeStr: "11:00 – 12:20" },
      { pairNumber: 4, start: 12 * 60 + 50, end: 14 * 60 + 10, timeStr: "12:50 – 14:10" },
      { pairNumber: 5, start: 14 * 60 + 20, end: 15 * 60 + 40, timeStr: "14:20 – 15:40" },
      { pairNumber: 6, start: 15 * 60 + 50, end: 17 * 60 + 10, timeStr: "15:50 – 17:10" },
    ];

    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    let currentLesson: HeaderLessonItem | null = null;
    let nextLesson: HeaderLessonItem | null = null;
    let isBreak = false;
    let breakMinutesLeft: number | undefined = undefined;

    const lessonsToday: HeaderLessonItem[] = rawLessonsToday
      .filter((l) => Boolean(l.subject && l.subject.trim()))
      .map((l, idx) => {
        const pairNum = l.pairNumber || idx + 1;
        const interval =
          BELL_INTERVALS.find((b) => b.pairNumber === pairNum) || BELL_INTERVALS[idx] || {
            start: 8 * 60 + idx * 80,
            end: 8 * 60 + (idx + 1) * 80,
            timeStr: l.time || "08:00 – 09:20",
          };

        let status: HeaderLessonItem["status"] = "upcoming";
        let minutesLeft: number | undefined = undefined;

        if (currentMinutes > interval.end) {
          status = "past";
        } else if (currentMinutes >= interval.start && currentMinutes <= interval.end) {
          status = "active";
          minutesLeft = interval.end - currentMinutes;
        } else {
          status = "upcoming";
        }

        const item: HeaderLessonItem = {
          id: l.id || `hl-${pairNum}`,
          pairNumber: pairNum,
          time: l.time || interval.timeStr,
          subject: l.subject,
          room: l.room || "каб. —",
          teacher: l.teacher,
          status,
          minutesLeft,
        };

        if (status === "active") {
          currentLesson = item;
        }

        return item;
      });

    // Check if currently on a break between pairs
    if (!currentLesson && lessonsToday.length > 0) {
      const upcoming = lessonsToday.find((l) => l.status === "upcoming");
      if (upcoming) {
        nextLesson = upcoming;
        const upcomingInterval = BELL_INTERVALS.find((b) => b.pairNumber === upcoming.pairNumber);
        if (upcomingInterval && currentMinutes < upcomingInterval.start) {
          const diff = upcomingInterval.start - currentMinutes;
          if (diff <= 35) {
            isBreak = true;
            breakMinutesLeft = diff;
          }
        }
      }
    }

    return {
      dayName,
      fullDate,
      groupName,
      selectedGroupId: targetGroupId,
      allGroups: role === "STUDENT" ? undefined : allDbGroups,
      currentLesson,
      nextLesson,
      isBreak,
      breakMinutesLeft,
      lessonsToday,
      role,
    };
  } catch (error) {
    console.error("getHeaderCurrentStatusAction error:", error);
    return null;
  }
}
