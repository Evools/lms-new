"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { MaterialType } from "@prisma/client";
import { revalidatePath } from "next/cache";

export interface GroupItemDTO {
  id: string;
  name: string;
}

export interface GroupSubjectDTO {
  id: string;
  subjectName: string;
  teacherName: string;
}

export interface MaterialDTO {
  id: string;
  topicId: string;
  topicTitle: string;
  authorId: string;
  authorName: string;
  type: MaterialType;
  title: string;
  content?: string | null;
  fileUrl?: string | null;
  linkUrl?: string | null;
  createdAt: string;
}

export interface TopicDTO {
  id: string;
  groupSubjectId: string;
  subjectName: string;
  teacherName: string;
  title: string;
  description?: string | null;
  order: number;
  createdAt: string;
  materialsCount: number;
  assignmentsCount: number;
  testsCount: number;
  materials: MaterialDTO[];
}

export interface TestQuestionDTO {
  id: string;
  testId: string;
  type: "SINGLE" | "MULTIPLE" | "TEXT" | "TRUE_FALSE";
  questionText: string;
  options: string[]; // parsed array
  correctAnswer: string;
  points: number;
  order: number;
}

export interface TestSubmissionDTO {
  id: string;
  testId: string;
  studentId: string;
  studentName: string;
  score: number;
  maxScore: number;
  submittedAt: string;
}

export interface TestDTO {
  id: string;
  groupSubjectId: string;
  subjectName: string;
  topicId?: string | null;
  topicTitle?: string | null;
  teacherName: string;
  authorName: string;
  title: string;
  description?: string | null;
  timeLimit?: number | null;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  isPublished: boolean;
  createdAt: string;
  questionsCount: number;
  totalPoints: number;
  questions: TestQuestionDTO[];
  userSubmission?: TestSubmissionDTO | null;
  submissionsCount: number;
  submissions: TestSubmissionDTO[];
}

// -------------------------------------------------------------
// 1. LMS Overview Hub Data Action
// -------------------------------------------------------------
export async function getLmsOverviewDataAction(groupId?: string) {
  try {
    const session = await auth();
    const role = session?.user?.role || "STUDENT";

    const groups = await prisma.group.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    let selectedGroupId = groupId || "";

    if (!selectedGroupId && session?.user?.id && role === "STUDENT") {
      const enrollment = await prisma.groupStudent.findFirst({
        where: { studentId: session.user.id },
        select: { groupId: true },
      });
      if (enrollment?.groupId) {
        selectedGroupId = enrollment.groupId;
      }
    }

    if (!selectedGroupId) {
      selectedGroupId = groups[0]?.id || "";
    }

    if (!selectedGroupId) {
      return {
        groups: [],
        subjects: [],
        selectedGroupId: "",
        canCreate: role === "ADMIN" || role === "TEACHER",
        stats: { totalTopics: 0, totalMaterials: 0, totalTests: 0 },
        recentTopics: [],
        recentMaterials: [],
        recentTests: [],
      };
    }

    const groupSubjects = await prisma.groupSubject.findMany({
      where: { groupId: selectedGroupId },
      include: {
        subject: { select: { name: true } },
        teacher: { select: { name: true } },
      },
    });

    const groupSubjectIds = groupSubjects.map((gs) => gs.id);

    const [totalTopics, totalMaterials, totalTests, dbTopics] =
      await Promise.all([
        prisma.topic.count({ where: { groupSubjectId: { in: groupSubjectIds } } }),
        prisma.material.count({
          where: { topic: { groupSubjectId: { in: groupSubjectIds } } },
        }),
        prisma.test.count({ where: { groupSubjectId: { in: groupSubjectIds } } }),
        prisma.topic.findMany({
          where: { groupSubjectId: { in: groupSubjectIds } },
          orderBy: { order: "asc" },
          include: {
            groupSubject: { include: { subject: true, teacher: true } },
            materials: { orderBy: { createdAt: "asc" } },
            tests: { include: { questions: true }, orderBy: { createdAt: "asc" } },
          },
        }),
      ]);

    const subjects: GroupSubjectDTO[] = groupSubjects.map((gs) => ({
      id: gs.id,
      subjectName: gs.subject.name,
      teacherName: gs.teacher.name,
    }));

    return {
      groups,
      subjects,
      selectedGroupId,
      canCreate: role === "ADMIN" || role === "TEACHER",
      stats: { totalTopics, totalMaterials, totalTests },
      topicsWithContent: dbTopics.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        order: t.order,
        subjectName: t.groupSubject.subject.name,
        teacherName: t.groupSubject.teacher.name,
        materials: t.materials.map((m) => ({
          id: m.id,
          type: m.type,
          title: m.title,
          content: m.content,
          fileUrl: m.fileUrl,
          linkUrl: m.linkUrl,
        })),
        tests: t.tests.map((test) => ({
          id: test.id,
          title: test.title,
          questionsCount: test.questions.length,
          timeLimit: test.timeLimit,
        })),
      })),
      recentTopics: dbTopics.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        subjectName: t.groupSubject.subject.name,
        teacherName: t.groupSubject.teacher.name,
        materialsCount: t.materials.length,
        createdAt: t.createdAt.toISOString(),
      })),
      recentMaterials: [],
      recentTests: [],
    };
  } catch (err) {
    console.error("getLmsOverviewDataAction error:", err);
    return {
      groups: [],
      subjects: [],
      selectedGroupId: "",
      canCreate: false,
      stats: { totalTopics: 0, totalMaterials: 0, totalTests: 0 },
      recentTopics: [],
      recentMaterials: [],
      recentTests: [],
    };
  }
}

// -------------------------------------------------------------
// 2. Topics Data & Actions
// -------------------------------------------------------------
export async function getTopicsDataAction(groupId?: string, groupSubjectId?: string) {
  try {
    const session = await auth();
    const role = session?.user?.role || "STUDENT";

    const groups = await prisma.group.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    const selectedGroupId = groupId || groups[0]?.id || "";

    if (!selectedGroupId) {
      return {
        groups: [],
        subjects: [],
        topics: [],
        selectedGroupId: "",
        selectedGroupSubjectId: "",
        canCreate: role === "ADMIN" || role === "TEACHER",
      };
    }

    const groupSubjects = await prisma.groupSubject.findMany({
      where: { groupId: selectedGroupId },
      include: {
        subject: { select: { name: true } },
        teacher: { select: { name: true } },
      },
    });

    const subjects: GroupSubjectDTO[] = groupSubjects.map((gs) => ({
      id: gs.id,
      subjectName: gs.subject.name,
      teacherName: gs.teacher.name,
    }));

    const selectedGroupSubjectId =
      groupSubjectId && groupSubjects.some((s) => s.id === groupSubjectId)
        ? groupSubjectId
        : "";

    const whereClause = selectedGroupSubjectId
      ? { groupSubjectId: selectedGroupSubjectId }
      : { groupSubjectId: { in: groupSubjects.map((gs) => gs.id) } };

    const dbTopics = await prisma.topic.findMany({
      where: whereClause,
      include: {
        groupSubject: {
          include: {
            subject: { select: { name: true } },
            teacher: { select: { name: true } },
          },
        },
        materials: {
          include: { author: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
        },
        assignments: { select: { id: true } },
        tests: { select: { id: true } },
      },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });

    const topics: TopicDTO[] = dbTopics.map((t) => ({
      id: t.id,
      groupSubjectId: t.groupSubjectId,
      subjectName: t.groupSubject.subject.name,
      teacherName: t.groupSubject.teacher.name,
      title: t.title,
      description: t.description,
      order: t.order,
      createdAt: t.createdAt.toISOString(),
      materialsCount: t.materials.length,
      assignmentsCount: t.assignments.length,
      testsCount: t.tests.length,
      materials: t.materials.map((m) => ({
        id: m.id,
        topicId: m.topicId,
        topicTitle: t.title,
        authorId: m.authorId,
        authorName: m.author.name,
        type: m.type,
        title: m.title,
        content: m.content,
        fileUrl: m.fileUrl,
        linkUrl: m.linkUrl,
        createdAt: m.createdAt.toISOString(),
      })),
    }));

    return {
      groups,
      subjects,
      topics,
      selectedGroupId,
      selectedGroupSubjectId,
      canCreate: role === "ADMIN" || role === "TEACHER",
    };
  } catch (err) {
    console.error("getTopicsDataAction error:", err);
    return {
      groups: [],
      subjects: [],
      topics: [],
      selectedGroupId: "",
      selectedGroupSubjectId: "",
      canCreate: false,
    };
  }
}

export async function createTopicAction(data: {
  groupSubjectId: string;
  title: string;
  description?: string;
  order?: number;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
      return { success: false, error: "Недостаточно прав для создания темы" };
    }

    if (!data.groupSubjectId || !data.title.trim()) {
      return { success: false, error: "Укажите дисциплину и название темы" };
    }

    await prisma.topic.create({
      data: {
        groupSubjectId: data.groupSubjectId,
        title: data.title.trim(),
        description: data.description?.trim() || null,
        order: data.order ?? 0,
      },
    });

    revalidatePath("/dashboard/lms/topics");
    revalidatePath("/dashboard/lms");
    return { success: true };
  } catch (err) {
    console.error("createTopicAction error:", err);
    return { success: false, error: "Ошибка при создании темы" };
  }
}

export async function deleteTopicAction(topicId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
      return { success: false, error: "Недостаточно прав" };
    }

    await prisma.topic.delete({
      where: { id: topicId },
    });

    revalidatePath("/dashboard/lms/materials");
    revalidatePath("/dashboard/lms/topics");
    revalidatePath("/dashboard/lms");
    return { success: true };
  } catch (err) {
    console.error("deleteTopicAction error:", err);
    return { success: false, error: "Ошибка при удалении главы" };
  }
}

export async function updateTopicAction(topicId: string, data: { title: string; description?: string }) {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
      return { success: false, error: "Недостаточно прав для редактирования главы" };
    }

    if (!data.title.trim()) {
      return { success: false, error: "Укажите название главы" };
    }

    await prisma.topic.update({
      where: { id: topicId },
      data: {
        title: data.title.trim(),
        description: data.description?.trim() || null,
      },
    });

    revalidatePath("/dashboard/lms/materials");
    revalidatePath("/dashboard/lms/topics");
    revalidatePath("/dashboard/lms");
    return { success: true };
  } catch (err) {
    console.error("updateTopicAction error:", err);
    return { success: false, error: "Ошибка при обновлении главы" };
  }
}

// -------------------------------------------------------------
// 3. Materials Data & Actions
// -------------------------------------------------------------
export async function getMaterialsDataAction(groupId?: string, topicId?: string, type?: string) {
  try {
    const session = await auth();
    const role = session?.user?.role || "STUDENT";

    const groups = await prisma.group.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    let selectedGroupId = groupId || "";

    if (!selectedGroupId && session?.user?.id && role === "STUDENT") {
      const enrollment = await prisma.groupStudent.findFirst({
        where: { studentId: session.user.id },
        select: { groupId: true },
      });
      if (enrollment?.groupId) {
        selectedGroupId = enrollment.groupId;
      }
    }

    if (!selectedGroupId) {
      selectedGroupId = groups[0]?.id || "";
    }

    if (!selectedGroupId) {
      return {
        groups: [],
        subjects: [],
        topics: [],
        materials: [],
        selectedGroupId: "",
        canCreate: role === "ADMIN" || role === "TEACHER",
      };
    }

    const groupSubjects = await prisma.groupSubject.findMany({
      where: { groupId: selectedGroupId },
      include: {
        subject: { select: { name: true } },
        teacher: { select: { name: true } },
      },
    });

    const subjects: GroupSubjectDTO[] = groupSubjects.map((gs) => ({
      id: gs.id,
      subjectName: gs.subject.name,
      teacherName: gs.teacher.name,
    }));

    const dbTopics = await prisma.topic.findMany({
      where: { groupSubjectId: { in: groupSubjects.map((gs) => gs.id) } },
      orderBy: { order: "asc" },
      include: {
        materials: {
          orderBy: { createdAt: "asc" },
          include: {
            author: { select: { name: true } },
          },
        },
      },
    });

    const topicIds = dbTopics.map((t) => t.id);

    const whereClause: Record<string, unknown> = {
      topicId: topicId ? topicId : { in: topicIds },
    };

    if (type && Object.values(MaterialType).includes(type as MaterialType)) {
      whereClause.type = type as MaterialType;
    }

    const dbMaterials = await prisma.material.findMany({
      where: whereClause,
      include: {
        topic: { select: { title: true } },
        author: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const materials: MaterialDTO[] = dbMaterials.map((m) => ({
      id: m.id,
      topicId: m.topicId,
      topicTitle: m.topic.title,
      authorId: m.authorId,
      authorName: m.author.name,
      type: m.type,
      title: m.title,
      content: m.content,
      fileUrl: m.fileUrl,
      linkUrl: m.linkUrl,
      createdAt: m.createdAt.toISOString(),
    }));

    const topicsWithMaterials = dbTopics.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      order: t.order,
      materials: t.materials.map((m) => ({
        id: m.id,
        topicId: m.topicId,
        topicTitle: t.title,
        authorId: m.authorId,
        authorName: m.author.name,
        type: m.type,
        title: m.title,
        content: m.content,
        fileUrl: m.fileUrl,
        linkUrl: m.linkUrl,
        createdAt: m.createdAt.toISOString(),
      })),
    }));

    return {
      groups,
      subjects,
      topics: dbTopics.map((t) => ({ id: t.id, title: t.title })),
      topicsWithMaterials,
      materials,
      selectedGroupId,
      canCreate: role === "ADMIN" || role === "TEACHER",
    };
  } catch (err) {
    console.error("getMaterialsDataAction error:", err);
    return {
      groups: [],
      subjects: [],
      topics: [],
      materials: [],
      selectedGroupId: "",
      canCreate: false,
    };
  }
}

export async function createMaterialAction(data: {
  topicId: string;
  type: MaterialType;
  title: string;
  content?: string;
  fileUrl?: string;
  linkUrl?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
      return { success: false, error: "Недостаточно прав для публикации материала" };
    }

    if (!data.topicId || !data.title.trim() || !data.type) {
      return { success: false, error: "Укажите тему, тип и название материала" };
    }

    await prisma.material.create({
      data: {
        topicId: data.topicId,
        authorId: session.user.id,
        type: data.type,
        title: data.title.trim(),
        content: data.content?.trim() || null,
        fileUrl: data.fileUrl?.trim() || null,
        linkUrl: data.linkUrl?.trim() || null,
      },
    });

    revalidatePath("/dashboard/lms/materials");
    revalidatePath("/dashboard/lms/topics");
    revalidatePath("/dashboard/lms");
    return { success: true };
  } catch (err) {
    console.error("createMaterialAction error:", err);
    return { success: false, error: "Ошибка при публикации материала" };
  }
}

export async function deleteMaterialAction(materialId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
      return { success: false, error: "Недостаточно прав" };
    }

    await prisma.material.delete({
      where: { id: materialId },
    });

    revalidatePath("/dashboard/lms/materials");
    revalidatePath("/dashboard/lms/topics");
    revalidatePath("/dashboard/lms");
    return { success: true };
  } catch (err) {
    console.error("deleteMaterialAction error:", err);
    return { success: false, error: "Ошибка при удалении материала" };
  }
}

export async function updateMaterialAction(
  materialId: string,
  data: {
    topicId?: string;
    type?: MaterialType;
    title?: string;
    content?: string;
    fileUrl?: string;
    linkUrl?: string;
  }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
      return { success: false, error: "Недостаточно прав для редактирования материала" };
    }

    if (!data.title?.trim()) {
      return { success: false, error: "Укажите название материала" };
    }

    await prisma.material.update({
      where: { id: materialId },
      data: {
        topicId: data.topicId,
        type: data.type,
        title: data.title.trim(),
        content: data.content?.trim() || null,
        fileUrl: data.fileUrl?.trim() || null,
        linkUrl: data.linkUrl?.trim() || null,
      },
    });

    revalidatePath("/dashboard/lms/materials");
    revalidatePath("/dashboard/lms/topics");
    revalidatePath("/dashboard/lms");
    return { success: true };
  } catch (err) {
    console.error("updateMaterialAction error:", err);
    return { success: false, error: "Ошибка при обновлении материала" };
  }
}

export async function getMaterialForEditAction(materialId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
      return { success: false, error: "Недостаточно прав" };
    }

    const material = await prisma.material.findUnique({
      where: { id: materialId },
      include: {
        topic: {
          include: {
            groupSubject: true,
          },
        },
      },
    });

    if (!material) {
      return { success: false, error: "Материал не найден" };
    }

    return {
      success: true,
      material: {
        id: material.id,
        topicId: material.topicId,
        groupId: material.topic.groupSubject.groupId,
        type: material.type,
        title: material.title,
        content: material.content || "",
        fileUrl: material.fileUrl || "",
        linkUrl: material.linkUrl || "",
      },
    };
  } catch (err) {
    console.error("getMaterialForEditAction error:", err);
    return { success: false, error: "Ошибка при получении данных материала" };
  }
}

// -------------------------------------------------------------
// 4. Tests Data & Actions
// -------------------------------------------------------------
export async function getTestsDataAction(groupId?: string, topicId?: string) {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id;
    const role = session?.user?.role || "STUDENT";

    const groups = await prisma.group.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    let selectedGroupId = groupId || "";

    if (!selectedGroupId && currentUserId && role === "STUDENT") {
      const enrollment = await prisma.groupStudent.findFirst({
        where: { studentId: currentUserId },
        select: { groupId: true },
      });
      if (enrollment?.groupId) {
        selectedGroupId = enrollment.groupId;
      }
    }

    if (!selectedGroupId) {
      selectedGroupId = groups[0]?.id || "";
    }

    if (!selectedGroupId) {
      return {
        groups: [],
        subjects: [],
        topics: [],
        tests: [],
        selectedGroupId: "",
        canCreate: role === "ADMIN" || role === "TEACHER",
      };
    }

    const groupSubjects = await prisma.groupSubject.findMany({
      where: { groupId: selectedGroupId },
      include: {
        subject: { select: { name: true } },
        teacher: { select: { name: true } },
      },
    });

    const subjects: GroupSubjectDTO[] = groupSubjects.map((gs) => ({
      id: gs.id,
      subjectName: gs.subject.name,
      teacherName: gs.teacher.name,
    }));

    const dbTopics = await prisma.topic.findMany({
      where: { groupSubjectId: { in: groupSubjects.map((gs) => gs.id) } },
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    });

    const whereClause: Record<string, unknown> = {
      groupSubjectId: { in: groupSubjects.map((gs) => gs.id) },
    };

    if (topicId) {
      whereClause.topicId = topicId;
    }

    const dbTests = await prisma.test.findMany({
      where: whereClause,
      include: {
        groupSubject: { include: { subject: { select: { name: true } }, teacher: { select: { name: true } } } },
        topic: { select: { title: true } },
        author: { select: { name: true } },
        questions: { orderBy: { order: "asc" } },
        submissions: {
          include: { student: { select: { name: true } } },
          orderBy: { submittedAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const tests: TestDTO[] = dbTests.map((t) => {
      const userSub = currentUserId ? t.submissions.find((s) => s.studentId === currentUserId) : null;
      const totalPoints = t.questions.reduce((acc, q) => acc + (q.points || 1), 0);

      const parsedQuestions: TestQuestionDTO[] = t.questions.map((q) => {
        let parsedOptions: string[] = [];
        try {
          parsedOptions = JSON.parse(q.options);
        } catch {
          parsedOptions = [];
        }
        return {
          id: q.id,
          testId: q.testId,
          type: (q.type as "SINGLE" | "MULTIPLE" | "TEXT" | "TRUE_FALSE") || "SINGLE",
          questionText: q.questionText,
          options: parsedOptions,
          correctAnswer: q.correctAnswer,
          points: q.points,
          order: q.order,
        };
      });

      const parsedSubmissions: TestSubmissionDTO[] = t.submissions.map((s) => ({
        id: s.id,
        testId: s.testId,
        studentId: s.studentId,
        studentName: s.student.name,
        score: s.score,
        maxScore: s.maxScore,
        submittedAt: s.submittedAt.toISOString(),
      }));

      return {
        id: t.id,
        groupSubjectId: t.groupSubjectId,
        subjectName: t.groupSubject.subject.name,
        topicId: t.topicId,
        topicTitle: t.topic?.title || null,
        teacherName: t.groupSubject.teacher.name,
        authorName: t.author.name,
        title: t.title,
        description: t.description,
        timeLimit: t.timeLimit,
        shuffleQuestions: t.shuffleQuestions ?? false,
        shuffleOptions: t.shuffleOptions ?? false,
        isPublished: t.isPublished,
        createdAt: t.createdAt.toISOString(),
        questionsCount: t.questions.length,
        totalPoints,
        questions: parsedQuestions,
        userSubmission: userSub
          ? {
              id: userSub.id,
              testId: userSub.testId,
              studentId: userSub.studentId,
              studentName: userSub.student.name,
              score: userSub.score,
              maxScore: userSub.maxScore,
              submittedAt: userSub.submittedAt.toISOString(),
            }
          : null,
        submissionsCount: t.submissions.length,
        submissions: parsedSubmissions,
      };
    });

    return {
      groups,
      subjects,
      topics: dbTopics,
      tests,
      selectedGroupId,
      canCreate: role === "ADMIN" || role === "TEACHER",
    };
  } catch (err) {
    console.error("getTestsDataAction error:", err);
    return {
      groups: [],
      subjects: [],
      topics: [],
      tests: [],
      selectedGroupId: "",
      canCreate: false,
    };
  }
}

export async function createTestAction(data: {
  groupSubjectId: string;
  topicId?: string;
  title: string;
  description?: string;
  timeLimit?: number;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  questions: {
    type?: "SINGLE" | "MULTIPLE" | "TEXT" | "TRUE_FALSE";
    questionText: string;
    options: string[];
    correctAnswer: string;
    points?: number;
  }[];
}) {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
      return { success: false, error: "Недостаточно прав для создания теста" };
    }

    if (!data.groupSubjectId || !data.title.trim() || !data.questions || data.questions.length === 0) {
      return { success: false, error: "Укажите дисциплину, название и добавьте хотя бы 1 вопрос" };
    }

    const test = await prisma.test.create({
      data: {
        // Create new test with shuffle options and multi-type questions
        groupSubjectId: data.groupSubjectId,
        topicId: data.topicId || null,
        authorId: session.user.id,
        title: data.title.trim(),
        description: data.description?.trim() || null,
        timeLimit: data.timeLimit ? Number(data.timeLimit) : null,
        shuffleQuestions: !!data.shuffleQuestions,
        shuffleOptions: !!data.shuffleOptions,
        questions: {
          create: data.questions.map((q, idx) => ({
            type: q.type || "SINGLE",
            questionText: q.questionText.trim(),
            options: JSON.stringify(q.options.filter((o) => o.trim().length > 0)),
            correctAnswer: q.correctAnswer.trim(),
            points: q.points ? Number(q.points) : 1,
            order: idx,
          })),
        },
      },
    });

    revalidatePath("/dashboard/lms/tests");
    revalidatePath("/dashboard/lms");
    return { success: true, testId: test.id };
  } catch (err) {
    console.error("createTestAction error:", err);
    return { success: false, error: "Ошибка при создании теста" };
  }
}

export async function getTestForEditAction(testId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Не авторизован" };
    }

    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        groupSubject: {
          include: {
            group: true,
            subject: true,
          },
        },
        questions: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!test) {
      return { success: false, error: "Тест не найден" };
    }

    const parsedQuestions = test.questions.map((q) => {
      let opts: string[] = [];
      try {
        opts = JSON.parse(q.options);
      } catch {
        opts = [];
      }
      return {
        id: q.id,
        type: (q.type as any) || "SINGLE",
        questionText: q.questionText,
        options: opts,
        correctAnswer: q.correctAnswer,
        points: q.points,
      };
    });

    return {
      success: true,
      test: {
        id: test.id,
        title: test.title,
        description: test.description || "",
        timeLimit: test.timeLimit,
        shuffleQuestions: test.shuffleQuestions,
        shuffleOptions: test.shuffleOptions,
        groupId: test.groupSubject.groupId,
        groupSubjectId: test.groupSubjectId,
        topicId: test.topicId || "",
        questions: parsedQuestions,
      },
    };
  } catch (err) {
    console.error("getTestForEditAction error:", err);
    return { success: false, error: "Ошибка при получении теста" };
  }
}

export async function getTestForTakeAction(testId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Не авторизован" };
    }

    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        groupSubject: {
          include: {
            subject: { select: { name: true } },
            teacher: { select: { name: true } },
          },
        },
        questions: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!test) {
      return { success: false, error: "Тест не найден" };
    }

    const existingSubmission = await prisma.testSubmission.findUnique({
      where: {
        testId_studentId: {
          testId,
          studentId: session.user.id,
        },
      },
    });

    let questionsToUse = test.questions.map((q) => {
      let opts: string[] = [];
      try {
        opts = JSON.parse(q.options);
      } catch {
        opts = [];
      }
      return {
        id: q.id,
        type: (q.type as any) || "SINGLE",
        questionText: q.questionText,
        options: test.shuffleOptions ? [...opts].sort(() => Math.random() - 0.5) : opts,
        points: q.points || 1,
      };
    });

    if (test.shuffleQuestions) {
      questionsToUse = questionsToUse.sort(() => Math.random() - 0.5);
    }

    return {
      success: true,
      test: {
        id: test.id,
        title: test.title,
        description: test.description || "",
        timeLimit: test.timeLimit,
        subjectName: test.groupSubject.subject.name,
        teacherName: test.groupSubject.teacher.name,
        questions: questionsToUse,
        userSubmission: existingSubmission
          ? {
              id: existingSubmission.id,
              testId: existingSubmission.testId,
              studentId: existingSubmission.studentId,
              studentName: session.user.name || "",
              score: existingSubmission.score,
              maxScore: existingSubmission.maxScore,
              submittedAt: existingSubmission.submittedAt.toISOString(),
            }
          : null,
      },
    };
  } catch (err) {
    console.error("getTestForTakeAction error:", err);
    return { success: false, error: "Ошибка при загрузке теста" };
  }
}

export async function updateTestAction(
  testId: string,
  data: {
    groupSubjectId: string;
    topicId?: string;
    title: string;
    description?: string;
    timeLimit?: number;
    shuffleQuestions?: boolean;
    shuffleOptions?: boolean;
    questions: Array<{
      type?: string;
      questionText: string;
      options: string[];
      correctAnswer: string;
      points?: number;
    }>;
  }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Не авторизован" };
    }

    if (!data.groupSubjectId || !data.title.trim() || !data.questions || data.questions.length === 0) {
      return { success: false, error: "Укажите дисциплину, название и добавьте хотя бы 1 вопрос" };
    }

    await prisma.test.update({
      where: { id: testId },
      data: {
        groupSubjectId: data.groupSubjectId,
        topicId: data.topicId || null,
        title: data.title.trim(),
        description: data.description?.trim() || null,
        timeLimit: data.timeLimit ? Number(data.timeLimit) : null,
        shuffleQuestions: !!data.shuffleQuestions,
        shuffleOptions: !!data.shuffleOptions,
      },
    });

    await prisma.testQuestion.deleteMany({
      where: { testId },
    });

    await prisma.testQuestion.createMany({
      data: data.questions.map((q, idx) => ({
        testId,
        type: q.type || "SINGLE",
        questionText: q.questionText.trim(),
        options: JSON.stringify(q.options.filter((o) => o.trim().length > 0)),
        correctAnswer: q.correctAnswer.trim(),
        points: q.points ? Number(q.points) : 1,
        order: idx,
      })),
    });

    revalidatePath("/dashboard/lms/tests");
    revalidatePath("/dashboard/lms");
    return { success: true };
  } catch (err) {
    console.error("updateTestAction error:", err);
    return { success: false, error: "Ошибка при обновлении теста" };
  }
}

export async function submitTestAnswersAction(data: {
  testId: string;
  answers: Record<string, string>; // questionId -> selectedOption
}) {
  try {
    const session = await auth();
    const studentId = session?.user?.id;

    if (!studentId) {
      return { success: false, error: "Вы должны быть авторизованы" };
    }

    const test = await prisma.test.findUnique({
      where: { id: data.testId },
      include: { questions: true },
    });

    if (!test) {
      return { success: false, error: "Тест не найден" };
    }

    const existingSubmission = await prisma.testSubmission.findUnique({
      where: {
        testId_studentId: {
          testId: data.testId,
          studentId: studentId,
        },
      },
    });

    if (existingSubmission) {
      return {
        success: false,
        error: "Вы уже проходили этот тест. Повторное прохождение запрещено.",
      };
    }

    let userScore = 0;
    let maxScore = 0;

    test.questions.forEach((q) => {
      const qPoints = q.points || 1;
      maxScore += qPoints;
      const studentAnswer = data.answers[q.id];

      if (!studentAnswer) return;

      const qType = q.type || "SINGLE";

      if (qType === "MULTIPLE") {
        try {
          const correctArr: string[] = JSON.parse(q.correctAnswer).map((s: string) => s.trim()).sort();
          const studentArr: string[] = JSON.parse(studentAnswer).map((s: string) => s.trim()).sort();
          if (
            correctArr.length === studentArr.length &&
            correctArr.every((val, index) => val === studentArr[index])
          ) {
            userScore += qPoints;
          }
        } catch {
          if (studentAnswer.trim() === q.correctAnswer.trim()) {
            userScore += qPoints;
          }
        }
      } else if (qType === "TEXT") {
        if (studentAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()) {
          userScore += qPoints;
        }
      } else {
        if (studentAnswer.trim() === q.correctAnswer.trim()) {
          userScore += qPoints;
        }
      }
    });

    await prisma.testSubmission.create({
      data: {
        testId: data.testId,
        studentId: studentId,
        score: userScore,
        maxScore,
        answers: JSON.stringify(data.answers),
      },
    });

    revalidatePath("/dashboard/lms/tests");
    return { success: true, score: userScore, maxScore };
  } catch (err) {
    console.error("submitTestAnswersAction error:", err);
    return { success: false, error: "Ошибка при отправке ответов" };
  }
}

export async function deleteTestAction(testId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
      return { success: false, error: "Недостаточно прав" };
    }

    await prisma.test.delete({
      where: { id: testId },
    });

    revalidatePath("/dashboard/lms/tests");
    revalidatePath("/dashboard/lms");
    return { success: true };
  } catch (err) {
    console.error("deleteTestAction error:", err);
    return { success: false, error: "Ошибка при удалении теста" };
  }
}
