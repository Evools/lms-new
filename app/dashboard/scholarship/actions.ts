"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { ScholarshipGroupInfo, SavedScholarshipRecord } from "./_components/types";
import { formatMonthKeyToLabel, getCurrentMonthKey } from "./_lib/scholarship-calculator";

export async function getScholarshipDataAction(groupIdParam?: string, monthParam?: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Не авторизован");
  }

  // Strict role check: students NEVER have access
  if (session.user.role === "STUDENT") {
    throw new Error("У студентов нет доступа к формированию стипендии");
  }

  const isTeacher = session.user.role === "TEACHER";
  const teacherId = session.user.id;

  // Teachers can only view groups they curate or teach
  const groupWhereFilter = isTeacher
    ? {
        OR: [
          { curatorId: teacherId },
          { groupSubjects: { some: { teacherId } } },
        ],
      }
    : {};

  // 1. Fetch allowed groups with students and subjects (1 single optimized query)
  const hasRollNumberField =
    (prisma as any)._runtimeDataModel?.models?.User?.fields?.some(
      (f: any) => f.name === "rollNumber"
    ) ?? true;

  const groupsRaw = await prisma.group.findMany({
    where: groupWhereFilter,
    include: {
      specialty: { select: { name: true } },
      curator: {
        select: { id: true, name: true },
      },
      students: {
        include: {
          student: {
            select: {
              id: true,
              name: true,
              avatar: true,
              ...(hasRollNumberField ? { rollNumber: true } : {}),
            },
          },
        },
        orderBy: {
          student: { name: "asc" },
        },
      },
      groupSubjects: {
        select: {
          subject: { select: { name: true } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const groups: ScholarshipGroupInfo[] = groupsRaw.map((g) => ({
    id: g.id,
    name: g.name,
    course: g.course,
    specialtyName: g.specialty?.name || undefined,
    curatorName: g.curator?.name || undefined,
    students: g.students.map((gs) => ({
      id: gs.student.id,
      name: gs.student.name,
      avatar: gs.student.avatar,
      rollNumber: (gs.student as any).rollNumber || undefined,
    })),
    defaultSubjects: g.groupSubjects.map((gs) => gs.subject.name),
  }));

  const activeGroupId =
    groupIdParam && groups.some((g) => g.id === groupIdParam)
      ? groupIdParam
      : groups[0]?.id || "";

  const activeMonth = monthParam || getCurrentMonthKey();

  // 2. Fetch saved record if exists (1 single query by unique compound index)
  let savedRecord: SavedScholarshipRecord | null = null;
  if (activeGroupId && activeMonth && prisma.scholarshipRecord) {
    const found = await prisma.scholarshipRecord.findUnique({
      where: {
        groupId_month: {
          groupId: activeGroupId,
          month: activeMonth,
        },
      },
    });

    if (found) {
      savedRecord = {
        id: found.id,
        groupId: found.groupId,
        month: found.month,
        monthLabel: found.monthLabel,
        subjects: Array.isArray(found.subjects) ? (found.subjects as string[]) : [],
        gradesData: (found.gradesData as any) || {},
        updatedAt: found.updatedAt.toISOString(),
      };
    }
  }

  return {
    groups,
    activeGroupId,
    activeMonth,
    savedRecord,
  };
}

export async function saveScholarshipRecordAction(data: {
  groupId: string;
  month: string;
  monthLabel?: string;
  subjects: string[];
  gradesData: Record<string, any>;
  rollNumbers?: Record<string, string>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role === "STUDENT") {
    throw new Error("У студентов нет доступа к редактированию стипендии");
  }

  // Teacher permission check: can only edit own groups
  if (session.user.role === "TEACHER") {
    const isTeacherGroup = await prisma.group.findFirst({
      where: {
        id: data.groupId,
        OR: [
          { curatorId: session.user.id },
          { groupSubjects: { some: { teacherId: session.user.id } } },
        ],
      },
      select: { id: true },
    });
    if (!isTeacherGroup) {
      throw new Error("Вы можете редактировать ведомость только для своей группы");
    }
  }

  const monthLabel = data.monthLabel || formatMonthKeyToLabel(data.month);

  // 1. Single instant upsert query to database (1 query)
  const upserted = await prisma.scholarshipRecord.upsert({
    where: {
      groupId_month: {
        groupId: data.groupId,
        month: data.month,
      },
    },
    update: {
      monthLabel,
      subjects: data.subjects,
      gradesData: data.gradesData,
    },
    create: {
      groupId: data.groupId,
      month: data.month,
      monthLabel,
      subjects: data.subjects,
      gradesData: data.gradesData,
    },
  });

  revalidatePath("/dashboard/scholarship");

  return {
    success: true,
    record: {
      id: upserted.id,
      groupId: upserted.groupId,
      month: upserted.month,
      monthLabel: upserted.monthLabel,
      subjects: Array.isArray(upserted.subjects) ? (upserted.subjects as string[]) : [],
      gradesData: upserted.gradesData,
      updatedAt: upserted.updatedAt.toISOString(),
    },
  };
}

/**
 * Permanently update a single student's roll number in their User record
 */
export async function updateStudentRollNumberAction(studentId: string, rollNumber: string) {
  const session = await auth();
  if (!session?.user || session.user.role === "STUDENT") {
    throw new Error("Недостаточно прав");
  }

  const hasRollNumber =
    (prisma as any)._runtimeDataModel?.models?.User?.fields?.some(
      (f: any) => f.name === "rollNumber"
    ) ?? true;

  if (hasRollNumber) {
    await prisma.user.update({
      where: { id: studentId },
      data: { rollNumber: rollNumber.trim() },
    });
  }

  revalidatePath("/dashboard/scholarship");
  return { success: true };
}
