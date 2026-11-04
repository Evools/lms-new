"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const TYPING_RECORDS_SETTING_KEY = "lms_typing_records_v1";

export type TypingLanguage = "RU" | "EN" | "CODE";
export type TypingMode =
  | "FREE"
  | "TIME_15"
  | "TIME_30"
  | "TIME_60"
  | "TIME_120"
  | "WORDS_25"
  | "WORDS_50";

export interface TypingAttemptItem {
  id: string;
  studentId: string;
  studentName: string;
  studentAvatar?: string | null;
  groupId: string;
  groupName: string;
  language: TypingLanguage;
  mode: TypingMode;
  cpm: number;
  wpm: number;
  accuracy: number;
  errorsCount: number;
  totalChars: number;
  durationSeconds: number;
  createdAt: string;
}

export interface StudentBestTypingRecord {
  cpm: number;
  wpm: number;
  accuracy: number;
  date: string;
}

export interface StudentTypingProfile {
  studentId: string;
  studentName: string;
  studentAvatar?: string | null;
  groupId: string;
  groupName: string;
  rollNumber?: string | null;
  bestRU?: StudentBestTypingRecord | null;
  bestEN?: StudentBestTypingRecord | null;
  bestCODE?: StudentBestTypingRecord | null;
  totalAttempts: number;
  lastAttemptAt?: string | null;
}

export interface TypingStorePayload {
  attempts: TypingAttemptItem[];
  studentProfiles: Record<string, StudentTypingProfile>;
}

async function getTypingStore(): Promise<TypingStorePayload> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: TYPING_RECORDS_SETTING_KEY },
    });
    if (!setting?.value) {
      return { attempts: [], studentProfiles: {} };
    }
    const parsed = JSON.parse(setting.value);
    return {
      attempts: Array.isArray(parsed.attempts) ? parsed.attempts : [],
      studentProfiles: typeof parsed.studentProfiles === "object" ? parsed.studentProfiles : {},
    };
  } catch (err) {
    console.error("Error reading typing store:", err);
    return { attempts: [], studentProfiles: {} };
  }
}

async function saveTypingStore(payload: TypingStorePayload) {
  try {
    await prisma.systemSetting.upsert({
      where: { key: TYPING_RECORDS_SETTING_KEY },
      update: {
        value: JSON.stringify(payload),
      },
      create: {
        key: TYPING_RECORDS_SETTING_KEY,
        value: JSON.stringify(payload),
      },
    });
  } catch (err) {
    console.error("Error saving typing store:", err);
  }
}

/**
 * Save a completed typing test attempt.
 */
export async function saveTypingAttemptAction(data: {
  language: TypingLanguage;
  mode: TypingMode;
  cpm: number;
  wpm: number;
  accuracy: number;
  errorsCount: number;
  totalChars: number;
  durationSeconds: number;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Не авторизован");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      studentEnrollments: {
        include: { group: { select: { id: true, name: true } } },
      },
    },
  });

  if (!user) {
    throw new Error("Пользователь не найден");
  }

  const enrollment = user.studentEnrollments[0];
  const groupId = enrollment?.group?.id || "general";
  const groupName = enrollment?.group?.name || "Лицей";

  const newAttempt: TypingAttemptItem = {
    id: `type_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    studentId: user.id,
    studentName: user.name || "Учащийся",
    studentAvatar: user.avatar,
    groupId,
    groupName,
    language: data.language,
    mode: data.mode,
    cpm: Math.round(data.cpm),
    wpm: Math.round(data.wpm),
    accuracy: Number(data.accuracy.toFixed(1)),
    errorsCount: data.errorsCount,
    totalChars: data.totalChars,
    durationSeconds: Math.round(data.durationSeconds),
    createdAt: new Date().toISOString(),
  };

  const store = await getTypingStore();

  // 1. Keep last 500 attempts in history
  store.attempts.unshift(newAttempt);
  if (store.attempts.length > 500) {
    store.attempts = store.attempts.slice(0, 500);
  }

  // 2. Update Student Profile record
  const existingProfile = store.studentProfiles[user.id] || {
    studentId: user.id,
    studentName: user.name || "Учащийся",
    studentAvatar: user.avatar,
    groupId,
    groupName,
    rollNumber: (user as any).rollNumber || null,
    totalAttempts: 0,
  };

  existingProfile.totalAttempts = (existingProfile.totalAttempts || 0) + 1;
  existingProfile.lastAttemptAt = newAttempt.createdAt;
  existingProfile.groupId = groupId;
  existingProfile.groupName = groupName;

  const candidateRecord: StudentBestTypingRecord = {
    cpm: newAttempt.cpm,
    wpm: newAttempt.wpm,
    accuracy: newAttempt.accuracy,
    date: newAttempt.createdAt,
  };

  if (data.language === "RU") {
    if (!existingProfile.bestRU || candidateRecord.cpm > existingProfile.bestRU.cpm) {
      existingProfile.bestRU = candidateRecord;
    }
  } else if (data.language === "EN") {
    if (!existingProfile.bestEN || candidateRecord.cpm > existingProfile.bestEN.cpm) {
      existingProfile.bestEN = candidateRecord;
    }
  } else if (data.language === "CODE") {
    if (!existingProfile.bestCODE || candidateRecord.cpm > existingProfile.bestCODE.cpm) {
      existingProfile.bestCODE = candidateRecord;
    }
  }

  store.studentProfiles[user.id] = existingProfile;

  await saveTypingStore(store);

  revalidatePath("/dashboard/lms/typing");
  revalidatePath(`/dashboard/students/${user.id}`);

  return {
    success: true,
    attempt: newAttempt,
    profile: existingProfile,
  };
}

/**
 * Get typing module initial data, leaderboard, and group results for teachers.
 */
export async function getTypingDataAction(selectedGroupId?: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  const userId = session.user.id;
  const userRole = session.user.role || "STUDENT";
  const isTeacherOrAdmin = userRole === "ADMIN" || userRole === "TEACHER" || userRole === "ADMINISTRATION";

  // Fetch all groups for filter dropdown
  const [groups, currentUser] = await Promise.all([
    prisma.group.findMany({
      select: {
        id: true,
        name: true,
        course: true,
        students: {
          select: {
            student: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      include: {
        studentEnrollments: {
          include: { group: { select: { id: true, name: true } } },
        },
      },
    }),
  ]);

  const userGroupId = currentUser?.studentEnrollments[0]?.group?.id || groups[0]?.id;
  const activeGroupId = selectedGroupId || userGroupId;

  const store = await getTypingStore();

  // Top 20 Leaderboard (Best CPM by language)
  const allProfiles = Object.values(store.studentProfiles);

  const topRU = [...allProfiles]
    .filter((p) => p.bestRU && p.bestRU.cpm > 0)
    .sort((a, b) => (b.bestRU?.cpm || 0) - (a.bestRU?.cpm || 0))
    .slice(0, 20);

  const topEN = [...allProfiles]
    .filter((p) => p.bestEN && p.bestEN.cpm > 0)
    .sort((a, b) => (b.bestEN?.cpm || 0) - (a.bestEN?.cpm || 0))
    .slice(0, 20);

  const topCODE = [...allProfiles]
    .filter((p) => p.bestCODE && p.bestCODE.cpm > 0)
    .sort((a, b) => (b.bestCODE?.cpm || 0) - (a.bestCODE?.cpm || 0))
    .slice(0, 20);

  // Current student's recent attempts (last 15)
  const myRecentAttempts = store.attempts
    .filter((a) => a.studentId === userId)
    .slice(0, 15);

  const myProfile = store.studentProfiles[userId] || null;

  // If teacher or admin, calculate group analytics
  let groupAnalytics = null;
  const targetGroup = groups.find((g) => g.id === activeGroupId) || groups[0];

  if (targetGroup) {
    const groupStudents = targetGroup.students.map((s) => s.student);

    const studentRows = groupStudents.map((st) => {
      const prof = store.studentProfiles[st.id];
      return {
        studentId: st.id,
        studentName: st.name,
        studentAvatar: st.avatar,
        bestRU: prof?.bestRU || null,
        bestEN: prof?.bestEN || null,
        bestCODE: prof?.bestCODE || null,
        totalAttempts: prof?.totalAttempts || 0,
        lastAttemptAt: prof?.lastAttemptAt || null,
      };
    });

    const activeCount = studentRows.filter((s) => s.totalAttempts > 0).length;

    // Calculate group average CPM (among active students)
    const ruAverages = studentRows
      .filter((s) => s.bestRU?.cpm)
      .map((s) => s.bestRU!.cpm);
    const groupAvgCpm =
      ruAverages.length > 0
        ? Math.round(ruAverages.reduce((a, b) => a + b, 0) / ruAverages.length)
        : 0;

    const groupTotalTests = studentRows.reduce((acc, s) => acc + s.totalAttempts, 0);

    // Find best student in group
    const topInGroup = [...studentRows]
      .filter((s) => s.bestRU?.cpm)
      .sort((a, b) => (b.bestRU?.cpm || 0) - (a.bestRU?.cpm || 0))[0] || null;

    groupAnalytics = {
      groupId: targetGroup.id,
      groupName: targetGroup.name,
      totalStudents: groupStudents.length,
      activeStudentsCount: activeCount,
      groupAvgCpm,
      groupTotalTests,
      topStudent: topInGroup
        ? {
            name: topInGroup.studentName,
            cpm: topInGroup.bestRU?.cpm || 0,
            accuracy: topInGroup.bestRU?.accuracy || 0,
          }
        : null,
      students: studentRows,
    };
  }

  return {
    currentUserId: userId,
    userRole,
    isTeacherOrAdmin,
    activeGroupId,
    groups: groups.map((g) => ({
      id: g.id,
      name: g.name,
      studentsCount: g.students.length,
    })),
    leaderboard: {
      topRU,
      topEN,
      topCODE,
    },
    myProfile,
    myRecentAttempts,
    groupAnalytics,
  };
}

