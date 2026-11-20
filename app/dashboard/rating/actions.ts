"use server";

import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  QUEST_DEFINITIONS,
  getCurrentPeriodBounds,
  type QuestPeriod,
} from "@/lib/gamification";
import { awardXpOnce, isRatingModuleEnabled } from "@/lib/gamification-server";

export interface RatingStudentDTO {
  id: string;
  name: string;
  groupId: string | null;
  groupName: string;
  xp: number;
  isMe: boolean;
}

export interface RatingQuestDTO {
  id: string;
  period: QuestPeriod;
  title: string;
  desc: string;
  progress: number;
  target: number;
  rewardXp: number;
  claimed: boolean;
}

export interface RatingPageDataDTO {
  groups: { id: string; name: string }[];
  selectedGroupId: string;
  students: RatingStudentDTO[];
  myXp: number;
  myGroupName: string;
  quests: RatingQuestDTO[];
}

async function computeStudentQuestProgress(userId: string): Promise<RatingQuestDTO[]> {
  const { weekStart, monthStart, weekKey, monthKey } = getCurrentPeriodBounds();

  const [monthlySubmissions, monthlyAttendances, monthlyTests, claimedRows] = await Promise.all([
    prisma.assignmentSubmission.findMany({
      where: {
        studentId: userId,
        status: "ACCEPTED",
        reviewedAt: { gte: monthStart },
      },
      select: { reviewedAt: true },
    }),
    prisma.attendance.findMany({
      where: {
        studentId: userId,
        status: "PRESENT",
        date: { gte: monthStart },
      },
      select: { date: true },
    }),
    prisma.testSubmission.findMany({
      where: {
        studentId: userId,
        submittedAt: { gte: monthStart },
      },
      select: { score: true, maxScore: true, submittedAt: true },
    }),
    prisma.xpTransaction.findMany({
      where: {
        userId,
        sourceKey: {
          in: QUEST_DEFINITIONS.map((q) => {
            const pKey = q.period === "weekly" ? weekKey : monthKey;
            return `quest:${userId}:${q.id}:${pKey}`;
          }),
        },
      },
      select: { sourceKey: true },
    }),
  ]);

  const claimedKeys = new Set(claimedRows.map((r) => r.sourceKey));

  const monthlyAcceptedCount = monthlySubmissions.length;
  const weeklyAcceptedCount = monthlySubmissions.filter(
    (s) => s.reviewedAt && s.reviewedAt >= weekStart,
  ).length;

  const monthlyPresentCount = monthlyAttendances.length;
  const weeklyPresentCount = monthlyAttendances.filter((a) => a.date >= weekStart).length;

  const weeklyTests85Count = monthlyTests.filter((t) => {
    if (t.submittedAt < weekStart || t.maxScore <= 0) return false;
    return (t.score / t.maxScore) * 100 >= 85;
  }).length;

  const monthlyTests60Count = monthlyTests.filter((t) => {
    if (t.maxScore <= 0) return false;
    return (t.score / t.maxScore) * 100 >= 60;
  }).length;

  const progressMap: Record<string, number> = {
    "w-assignments-2": weeklyAcceptedCount,
    "w-test-85": weeklyTests85Count,
    "w-present-5": weeklyPresentCount,
    "m-assignments-8": monthlyAcceptedCount,
    "m-present-20": monthlyPresentCount,
    "m-tests-3": monthlyTests60Count,
  };

  return QUEST_DEFINITIONS.map((q) => {
    const pKey = q.period === "weekly" ? weekKey : monthKey;
    const sourceKey = `quest:${userId}:${q.id}:${pKey}`;
    return {
      id: q.id,
      period: q.period,
      title: q.title,
      desc: q.desc,
      progress: Math.min(q.target, progressMap[q.id] ?? 0),
      target: q.target,
      rewardXp: q.rewardXp,
      claimed: claimedKeys.has(sourceKey),
    };
  });
}

function getStudentQuestProgressCached(userId: string) {
  return unstable_cache(
    () => computeStudentQuestProgress(userId),
    ["rating-student-quests", userId],
    { revalidate: 120, tags: [`rating-quests-${userId}`] },
  )();
}

function getGroupLeaderboardCached(groupId: string) {
  return unstable_cache(
    () =>
      prisma.user.findMany({
        where: {
          role: "STUDENT",
          isActive: true,
          studentEnrollments: {
            some: { groupId },
          },
        },
        select: {
          id: true,
          name: true,
          xp: true,
          studentEnrollments: {
            where: { groupId },
            select: {
              group: { select: { id: true, name: true } },
            },
            take: 1,
          },
        },
        orderBy: [{ xp: "desc" }, { name: "asc" }],
        take: 100,
      }),
    ["rating-group-leaderboard", groupId],
    { revalidate: 60, tags: ["rating-leaderboard"] },
  )();
}

const getAllGroupsCached = unstable_cache(
  () =>
    prisma.group.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ["rating-all-groups"],
  { revalidate: 300 },
);

export async function getRatingPageDataAction(requestedGroupId?: string): Promise<RatingPageDataDTO> {
  const [session, enabled] = await Promise.all([auth(), isRatingModuleEnabled()]);
  if (!session?.user || !enabled) {
    return {
      groups: [],
      selectedGroupId: "",
      students: [],
      myXp: 0,
      myGroupName: "—",
      quests: [],
    };
  }

  const userId = session.user.id;
  const role = session.user.role || "STUDENT";

  let groups: { id: string; name: string }[] = [];

  if (role === "STUDENT") {
    const enrollments = await prisma.groupStudent.findMany({
      where: { studentId: userId },
      select: { group: { select: { id: true, name: true } } },
    });
    groups = enrollments.map((e) => e.group);
  } else if (role === "TEACHER") {
    groups = await prisma.group.findMany({
      where: {
        OR: [
          { curatorId: userId },
          { classTeacherId: userId },
          { groupSubjects: { some: { teacherId: userId } } },
        ],
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  } else {
    groups = await getAllGroupsCached();
  }

  const selectedGroupId =
    requestedGroupId && groups.some((g) => g.id === requestedGroupId)
      ? requestedGroupId
      : groups[0]?.id || "";

  if (!selectedGroupId) {
    return {
      groups,
      selectedGroupId: "",
      students: [],
      myXp: 0,
      myGroupName: "Без группы",
      quests: role === "STUDENT" ? await getStudentQuestProgressCached(userId) : [],
    };
  }

  const [studentRows, quests] = await Promise.all([
    getGroupLeaderboardCached(selectedGroupId),
    role === "STUDENT" ? getStudentQuestProgressCached(userId) : Promise.resolve([]),
  ]);

  const students: RatingStudentDTO[] = studentRows.map((row) => {
    const firstGroup = row.studentEnrollments[0]?.group;
    return {
      id: row.id,
      name: row.name,
      groupId: firstGroup?.id ?? selectedGroupId,
      groupName: firstGroup?.name ?? groups.find((g) => g.id === selectedGroupId)?.name ?? "Без группы",
      xp: row.xp,
      isMe: row.id === userId,
    };
  });

  const me = students.find((s) => s.isMe);
  const selectedGroupName =
    groups.find((g) => g.id === selectedGroupId)?.name ?? "Без группы";

  return {
    groups,
    selectedGroupId,
    students,
    myXp: me?.xp ?? 0,
    myGroupName: me?.groupName ?? selectedGroupName,
    quests,
  };
}

export async function claimQuestRewardAction(questId: string): Promise<{
  success: boolean;
  error?: string;
  rewardXp?: number;
}> {
  const [session, enabled] = await Promise.all([auth(), isRatingModuleEnabled()]);
  if (!session?.user) {
    return { success: false, error: "Требуется авторизация" };
  }
  if (!enabled) {
    return { success: false, error: "Модуль рейтинга отключён администратором" };
  }

  if (session.user.role !== "STUDENT") {
    return { success: false, error: "Квесты доступны только студентам" };
  }

  const userId = session.user.id;
  const questDef = QUEST_DEFINITIONS.find((q) => q.id === questId);
  if (!questDef) {
    return { success: false, error: "Квест не найден" };
  }

  const quests = await computeStudentQuestProgress(userId);
  const currentQuest = quests.find((q) => q.id === questId);
  if (!currentQuest || currentQuest.progress < currentQuest.target) {
    return { success: false, error: "Условия квеста ещё не выполнены" };
  }
  if (currentQuest.claimed) {
    return { success: false, error: "Награда за этот квест уже получена" };
  }

  const { weekKey, monthKey } = getCurrentPeriodBounds();
  const pKey = questDef.period === "weekly" ? weekKey : monthKey;
  const sourceKey = `quest:${userId}:${questDef.id}:${pKey}`;

  const result = await awardXpOnce({
    userId,
    amount: questDef.rewardXp,
    reason: `Квест: ${questDef.title}`,
    sourceKey,
  });

  if (!result.awarded) {
    return { success: false, error: "Награда уже была начислена" };
  }

  revalidatePath("/dashboard/rating");
  return { success: true, rewardXp: questDef.rewardXp };
}

export async function resetRatingProgressAction(groupId?: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Только администратор может сбрасывать рейтинг" };
  }

  try {
    if (groupId) {
      const enrollments = await prisma.groupStudent.findMany({
        where: { groupId },
        select: { studentId: true },
      });
      const studentIds = enrollments.map((e) => e.studentId);

      if (studentIds.length > 0) {
        await prisma.$transaction([
          prisma.xpTransaction.deleteMany({
            where: { userId: { in: studentIds } },
          }),
          prisma.user.updateMany({
            where: { id: { in: studentIds } },
            data: { xp: 0 },
          }),
        ]);
        studentIds.forEach((id) => {
          try {
            revalidateTag(`rating-quests-${id}`, "max");
          } catch {
            // ignore
          }
        });
      }
    } else {
      await prisma.$transaction([
        prisma.xpTransaction.deleteMany({}),
        prisma.user.updateMany({
          where: { xp: { not: 0 } },
          data: { xp: 0 },
        }),
      ]);
    }

    try {
      revalidateTag("rating-leaderboard", "max");
    } catch {
      // ignore
    }
    revalidatePath("/dashboard/rating");
    return { success: true };
  } catch (err) {
    console.error("resetRatingProgressAction error:", err);
    return { success: false, error: "Не удалось сбросить прогресс рейтинга" };
  }
}
