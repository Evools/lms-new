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
  topicsCount?: number;
  materialsCount?: number;
}

export interface MaterialDTO {
  id: string;
  topicId: string;
  topicTitle: string;
  subjectName?: string;
  teacherName?: string;
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

export type QuestionTypeDTO =
  | "SINGLE"
  | "MULTIPLE"
  | "TEXT"
  | "TRUE_FALSE"
  | "ORDERING"
  | "BLANKS"
  | "CODE"
  | "MATCHING"
  | "NUMERICAL";

export interface TestQuestionDTO {
  id: string;
  testId: string;
  type: QuestionTypeDTO;
  questionText: string;
  options: any[]; // parsed array or pair objects
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
    const userId = session?.user?.id;

    // For students — only show their own group(s)
    let studentGroupIds: string[] | null = null;
    if (role === "STUDENT" && userId) {
      const enrollments = await prisma.groupStudent.findMany({
        where: { studentId: userId },
        select: { groupId: true },
      });
      studentGroupIds = enrollments.map((e) => e.groupId);
    }

    const groups = await prisma.group.findMany({
      where: studentGroupIds ? { id: { in: studentGroupIds } } : undefined,
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    let selectedGroupId = groupId || "";

    if (role === "STUDENT" && userId) {
      // Students can only access their own group
      if (!selectedGroupId || !studentGroupIds?.includes(selectedGroupId)) {
        selectedGroupId = studentGroupIds?.[0] || groups[0]?.id || "";
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
    const userId = session?.user?.id;

    // For students — only show their own group(s)
    let studentGroupIds: string[] | null = null;
    if (role === "STUDENT" && userId) {
      const enrollments = await prisma.groupStudent.findMany({
        where: { studentId: userId },
        select: { groupId: true },
      });
      studentGroupIds = enrollments.map((e) => e.groupId);
    }

    const groups = await prisma.group.findMany({
      where: studentGroupIds ? { id: { in: studentGroupIds } } : undefined,
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    let selectedGroupId = groupId || "";

    if (role === "STUDENT" && userId) {
      // Students can only access their own group
      if (!selectedGroupId || !studentGroupIds?.includes(selectedGroupId)) {
        selectedGroupId = studentGroupIds?.[0] || groups[0]?.id || "";
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
    const userId = session?.user?.id;

    // For students — only show their own group(s)
    let studentGroupIds: string[] | null = null;
    if (role === "STUDENT" && userId) {
      const enrollments = await prisma.groupStudent.findMany({
        where: { studentId: userId },
        select: { groupId: true },
      });
      studentGroupIds = enrollments.map((e) => e.groupId);
    }

    const groups = await prisma.group.findMany({
      where: studentGroupIds ? { id: { in: studentGroupIds } } : undefined,
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    let selectedGroupId = groupId || "";

    if (role === "STUDENT" && userId) {
      // Students can only access their own group
      if (!selectedGroupId || !studentGroupIds?.includes(selectedGroupId)) {
        selectedGroupId = studentGroupIds?.[0] || groups[0]?.id || "";
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
        topics: {
          include: {
            materials: { select: { id: true } },
          },
        },
      },
    });

    const subjects: GroupSubjectDTO[] = groupSubjects.map((gs) => ({
      id: gs.id,
      subjectName: gs.subject.name,
      teacherName: gs.teacher.name,
      topicsCount: gs.topics.length,
      materialsCount: gs.topics.reduce((acc, t) => acc + t.materials.length, 0),
    }));

    const dbTopics = await prisma.topic.findMany({
      where: { groupSubjectId: { in: groupSubjects.map((gs) => gs.id) } },
      orderBy: { order: "asc" },
      include: {
        groupSubject: {
          include: {
            subject: { select: { name: true } },
            teacher: { select: { name: true } },
          },
        },
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
        topic: {
          include: {
            groupSubject: {
              include: {
                subject: { select: { name: true } },
                teacher: { select: { name: true } },
              },
            },
          },
        },
        author: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const materials: MaterialDTO[] = dbMaterials.map((m) => ({
      id: m.id,
      topicId: m.topicId,
      topicTitle: m.topic.title,
      subjectName: m.topic.groupSubject.subject.name,
      teacherName: m.topic.groupSubject.teacher.name,
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
      subjectName: t.groupSubject.subject.name,
      teacherName: t.groupSubject.teacher.name,
      materials: t.materials.map((m) => ({
        id: m.id,
        topicId: m.topicId,
        topicTitle: t.title,
        subjectName: t.groupSubject.subject.name,
        teacherName: t.groupSubject.teacher.name,
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
  groupId?: string;
  topicId?: string;
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

    if (!data.title.trim() || !data.type) {
      return { success: false, error: "Укажите название и тип материала" };
    }

    let targetTopicId = data.topicId;

    // If no topic selected, auto-resolve or create "Общие материалы" topic for this group
    if (!targetTopicId || targetTopicId === "none" || targetTopicId === "auto") {
      if (!data.groupId) {
        return { success: false, error: "Укажите учебную группу или главу" };
      }

      // Find first groupSubject for this group
      let groupSubject = await prisma.groupSubject.findFirst({
        where: { groupId: data.groupId },
      });

      // If no groupSubject exists yet, assign a default subject
      if (!groupSubject) {
        let defaultSubject = await prisma.subject.findFirst({
          where: { name: "Общие дисциплины" },
        });

        if (!defaultSubject) {
          defaultSubject = await prisma.subject.create({
            data: {
              name: "Общие дисциплины",
              code: "GEN-101",
              description: "Общие учебные материалы и дисциплины группы",
            },
          });
        }

        groupSubject = await prisma.groupSubject.create({
          data: {
            groupId: data.groupId,
            subjectId: defaultSubject.id,
            teacherId: session.user.id,
          },
        });
      }

      // Find or create default "Общие материалы" topic
      let defaultTopic = await prisma.topic.findFirst({
        where: {
          groupSubjectId: groupSubject.id,
          title: "Общие материалы",
        },
      });

      if (!defaultTopic) {
        defaultTopic = await prisma.topic.create({
          data: {
            groupSubjectId: groupSubject.id,
            title: "Общие материалы",
            description: "Раздел для общих учебных материалов и конспектов",
            order: 0,
          },
        });
      }

      targetTopicId = defaultTopic.id;
    }

    const createdMaterial = await prisma.material.create({
      data: {
        topicId: targetTopicId,
        authorId: session.user.id,
        type: data.type,
        title: data.title.trim(),
        content: data.content?.trim() || null,
        fileUrl: data.fileUrl?.trim() || null,
        linkUrl: data.linkUrl?.trim() || null,
      },
      include: {
        topic: {
          select: {
            id: true,
            groupSubjectId: true,
          },
        },
      },
    });

    revalidatePath("/dashboard/lms/materials");
    revalidatePath("/dashboard/lms/topics");
    revalidatePath("/dashboard/lms");
    return {
      success: true,
      materialId: createdMaterial.id,
      topicId: targetTopicId,
      subjectId: createdMaterial.topic?.groupSubjectId || undefined,
    };
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

    const updated = await prisma.material.update({
      where: { id: materialId },
      data: {
        topicId: data.topicId,
        type: data.type,
        title: data.title.trim(),
        content: data.content?.trim() || null,
        fileUrl: data.fileUrl?.trim() || null,
        linkUrl: data.linkUrl?.trim() || null,
      },
      include: {
        topic: {
          include: {
            groupSubject: true,
          },
        },
      },
    });

    revalidatePath("/dashboard/lms/materials");
    revalidatePath("/dashboard/lms/topics");
    revalidatePath("/dashboard/lms");
    return {
      success: true,
      materialId: updated.id,
      groupId: updated.topic.groupSubject.groupId,
      subjectId: updated.topic.groupSubject.id,
    };
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
        subjectId: material.topic.groupSubject.id,
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

    // For students — only show their own group(s)
    let studentGroupIds: string[] | null = null;
    if (role === "STUDENT" && currentUserId) {
      const enrollments = await prisma.groupStudent.findMany({
        where: { studentId: currentUserId },
        select: { groupId: true },
      });
      studentGroupIds = enrollments.map((e) => e.groupId);
    }

    const groups = await prisma.group.findMany({
      where: studentGroupIds ? { id: { in: studentGroupIds } } : undefined,
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    let selectedGroupId = groupId || "";

    if (role === "STUDENT" && currentUserId) {
      // Students can only access their own group
      if (!selectedGroupId || !studentGroupIds?.includes(selectedGroupId)) {
        selectedGroupId = studentGroupIds?.[0] || groups[0]?.id || "";
      }
    } else {
      if (!selectedGroupId) {
        selectedGroupId = groups[0]?.id || "";
      }
    }

    if (!selectedGroupId) {
      return {
        groups,
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
    type?: QuestionTypeDTO;
    questionText: string;
    options: any[];
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

    let finalTopicId: string | null = null;
    if (data.topicId && data.topicId !== "none") {
      const topicExists = await prisma.topic.findUnique({
        where: { id: data.topicId },
        select: { id: true },
      });
      if (topicExists) {
        finalTopicId = topicExists.id;
      }
    }

    const test = await prisma.test.create({
      data: {
        // Create new test with shuffle options and multi-type questions
        groupSubjectId: data.groupSubjectId,
        topicId: finalTopicId,
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
            options: JSON.stringify(
              q.options.filter((o) => (typeof o === "string" ? o.trim().length > 0 : !!o))
            ),
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

    const userRole = session.user.role || "STUDENT";
    const isTeacherOrAdmin = userRole === "ADMIN" || userRole === "TEACHER";

    const existingSubmission = await prisma.testSubmission.findUnique({
      where: {
        testId_studentId: {
          testId,
          studentId: session.user.id,
        },
      },
    });

    let savedAnswers: Record<string, string> = {};
    if (existingSubmission?.answers) {
      try {
        savedAnswers = JSON.parse(existingSubmission.answers);
      } catch {}
    }

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
        options: test.shuffleOptions && !existingSubmission ? [...opts].sort(() => Math.random() - 0.5) : opts,
        points: q.points || 1,
        correctAnswer: isTeacherOrAdmin || existingSubmission ? q.correctAnswer : undefined,
      };
    });

    if (test.shuffleQuestions && !existingSubmission) {
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
        userRole,
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
              answers: savedAnswers,
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
      options: any[];
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

    let finalTopicId: string | null = null;
    if (data.topicId && data.topicId !== "none") {
      const topicExists = await prisma.topic.findUnique({
        where: { id: data.topicId },
        select: { id: true },
      });
      if (topicExists) {
        finalTopicId = topicExists.id;
      }
    }

    await prisma.test.update({
      where: { id: testId },
      data: {
        groupSubjectId: data.groupSubjectId,
        topicId: finalTopicId,
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
        options: JSON.stringify(
          q.options.filter((o) => (typeof o === "string" ? o.trim().length > 0 : !!o))
        ),
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
  answers: Record<string, string>; // questionId -> selectedOption/JSON
  tabSwitches?: number;
}) {
  try {
    const session = await auth();
    const studentId = session?.user?.id;

    if (!studentId) {
      return { success: false, error: "Вы должны быть авторизованы" };
    }

    const userRole = session?.user?.role || "STUDENT";
    if (userRole === "ADMIN" || userRole === "TEACHER") {
      return {
        success: false,
        error: "Администратор и Преподаватель не могут сдавать тест. Доступен только режим просмотра.",
      };
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

      if (!studentAnswer || !String(studentAnswer).trim()) return;

      const qType = (q.type || "SINGLE").toUpperCase();

      if (qType === "MULTIPLE") {
        try {
          const correctArr: string[] = JSON.parse(q.correctAnswer).map((s: string) => s.trim().toLowerCase());
          const studentArr: string[] = JSON.parse(studentAnswer).map((s: string) => s.trim().toLowerCase());
          if (correctArr.length > 0 && Array.isArray(studentArr)) {
            let correctMatches = 0;
            let wrongSelections = 0;
            studentArr.forEach((opt) => {
              if (correctArr.includes(opt)) correctMatches++;
              else wrongSelections++;
            });
            // Partial credit: (correct matches - wrong choices) / total correct answers
            const ratio = Math.max(0, (correctMatches - wrongSelections) / correctArr.length);
            const earned = Math.round(ratio * qPoints * 100) / 100;
            userScore += earned;
          }
        } catch {
          if (studentAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()) {
            userScore += qPoints;
          }
        }
      } else if (qType === "MATCHING") {
        try {
          let correctPairs: Record<string, string> = {};
          try {
            correctPairs = JSON.parse(q.correctAnswer);
          } catch {
            correctPairs = {};
          }
          let studentPairs: Record<string, string> = {};
          try {
            studentPairs = JSON.parse(studentAnswer);
          } catch {
            studentPairs = {};
          }
          const keys = Object.keys(correctPairs);
          if (keys.length > 0) {
            let matched = 0;
            keys.forEach((k) => {
              if (studentPairs[k] && studentPairs[k].trim().toLowerCase() === correctPairs[k].trim().toLowerCase()) {
                matched++;
              }
            });
            const ratio = matched / keys.length;
            const earned = Math.round(ratio * qPoints * 100) / 100;
            userScore += earned;
          }
        } catch {}
      } else if (qType === "NUMERICAL") {
        try {
          let targetVal = 0;
          let tolerance = 0;
          try {
            const parsed = JSON.parse(q.correctAnswer);
            targetVal = Number(parsed.value ?? parsed.val ?? parsed);
            tolerance = Number(parsed.tolerance ?? 0);
          } catch {
            targetVal = Number(q.correctAnswer.replace(",", "."));
          }
          const studentVal = Number(String(studentAnswer).replace(",", "."));
          if (!isNaN(studentVal) && !isNaN(targetVal)) {
            if (Math.abs(studentVal - targetVal) <= (tolerance || 0.0001)) {
              userScore += qPoints;
            }
          }
        } catch {}
      } else if (qType === "ORDERING") {
        try {
          const correctArr: string[] = JSON.parse(q.correctAnswer).map((s: string) => s.trim());
          const studentArr: string[] = JSON.parse(studentAnswer).map((s: string) => s.trim());
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
      } else if (qType === "BLANKS") {
        try {
          const correctArr: string[] = JSON.parse(q.correctAnswer).map((s: string) => s.trim().toLowerCase());
          const studentArr: string[] = JSON.parse(studentAnswer).map((s: string) => s.trim().toLowerCase());
          if (correctArr.length > 0 && Array.isArray(studentArr)) {
            let matches = 0;
            correctArr.forEach((c, idx) => {
              if (studentArr[idx] && studentArr[idx] === c) {
                matches++;
              }
            });
            const ratio = matches / correctArr.length;
            userScore += Math.round(ratio * qPoints * 100) / 100;
          }
        } catch {
          if (studentAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()) {
            userScore += qPoints;
          }
        }
      } else if (qType === "TEXT") {
        if (studentAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()) {
          userScore += qPoints;
        }
      } else {
        // SINGLE, TRUE_FALSE, CODE
        if (studentAnswer.trim() === q.correctAnswer.trim()) {
          userScore += qPoints;
        }
      }
    });

    userScore = Math.round(userScore * 100) / 100;

    await prisma.testSubmission.create({
      data: {
        testId: data.testId,
        studentId: studentId,
        score: userScore,
        maxScore,
        answers: JSON.stringify({
          ...data.answers,
          ...(data.tabSwitches ? { _tabSwitches: data.tabSwitches } : {}),
        }),
      },
    });

    revalidatePath("/dashboard/lms/tests");
    revalidatePath(`/dashboard/lms/tests/${data.testId}/results`);
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

export async function getTestResultsAction(testId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
      return { success: false, error: "Недостаточно прав для просмотра результатов" };
    }

    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        groupSubject: {
          include: {
            subject: true,
            group: {
              include: {
                students: {
                  include: {
                    student: true,
                  },
                },
              },
            },
          },
        },
        questions: {
          orderBy: { order: "asc" },
        },
        submissions: {
          include: {
            student: true,
          },
          orderBy: { submittedAt: "desc" },
        },
      },
    });

    if (!test) {
      return { success: false, error: "Тест не найден" };
    }

    const totalMaxPoints = test.questions.reduce((sum: number, q: { points: number }) => sum + (q.points || 1), 0);

    // Get all enrolled students in this group
    const enrolledStudentsMap = new Map<string, string>();
    test.groupSubject.group.students.forEach((gs: { student: { id: string; name: string | null } }) => {
      if (gs.student) {
        enrolledStudentsMap.set(gs.student.id, gs.student.name || "Студент");
      }
    });

    // Also include any student who submitted (even if not in current group list)
    test.submissions.forEach((sub: { student: { id: string; name: string | null }; studentId: string }) => {
      if (sub.student && !enrolledStudentsMap.has(sub.student.id)) {
        enrolledStudentsMap.set(sub.student.id, sub.student.name || "Студент");
      }
    });

    const submissionsByStudent = new Map<string, (typeof test.submissions)[0]>();
    test.submissions.forEach((sub: (typeof test.submissions)[0]) => {
      if (!submissionsByStudent.has(sub.studentId)) {
        submissionsByStudent.set(sub.studentId, sub);
      }
    });

    const studentsResults = Array.from(enrolledStudentsMap.entries()).map(([studentId, studentName]) => {
      const sub = submissionsByStudent.get(studentId);
      if (!sub) {
        return {
          studentId,
          studentName,
          submissionId: null,
          hasSubmitted: false,
          score: 0,
          maxScore: totalMaxPoints,
          percent: 0,
          submittedAt: null,
          tabSwitches: 0,
          answersMap: {} as Record<string, { answer: string; isCorrect: boolean; isPartial?: boolean; pointsAwarded: number }>,
        };
      }

      let parsedUserAnswers: Record<string, any> = {};
      try {
        parsedUserAnswers = JSON.parse(sub.answers || "{}");
      } catch {
        parsedUserAnswers = {};
      }

      const tabSwitches = Number(parsedUserAnswers._tabSwitches || 0);

      const answersMap: Record<string, { answer: string; isCorrect: boolean; isPartial?: boolean; pointsAwarded: number }> = {};

      test.questions.forEach((q: { id: string; type: string; correctAnswer: string; points: number }) => {
        const userAns = parsedUserAnswers[q.id] !== undefined ? parsedUserAnswers[q.id] : "";
        const qPoints = q.points || 1;
        const qType = (q.type || "SINGLE").toUpperCase();
        let isCorrect = false;
        let isPartial = false;
        let pointsAwarded = 0;

        if (qType === "MULTIPLE") {
          try {
            const correctArr: string[] = JSON.parse(q.correctAnswer).map((s: string) => s.trim().toLowerCase());
            const userArr: string[] = typeof userAns === "string" && userAns ? JSON.parse(userAns).map((s: string) => s.trim().toLowerCase()) : [];
            if (correctArr.length > 0 && Array.isArray(userArr)) {
              let correctMatches = 0;
              let wrongSelections = 0;
              userArr.forEach((opt) => {
                if (correctArr.includes(opt)) correctMatches++;
                else wrongSelections++;
              });
              const ratio = Math.max(0, (correctMatches - wrongSelections) / correctArr.length);
              pointsAwarded = Math.round(ratio * qPoints * 100) / 100;
              if (ratio === 1) isCorrect = true;
              else if (ratio > 0) isPartial = true;
            }
          } catch {
            isCorrect = String(userAns).trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
            pointsAwarded = isCorrect ? qPoints : 0;
          }
        } else if (qType === "MATCHING") {
          try {
            const correctPairs: Record<string, string> = JSON.parse(q.correctAnswer);
            const studentPairs: Record<string, string> = typeof userAns === "string" && userAns ? JSON.parse(userAns) : {};
            const keys = Object.keys(correctPairs);
            if (keys.length > 0) {
              let matched = 0;
              keys.forEach((k) => {
                if (studentPairs[k] && studentPairs[k].trim().toLowerCase() === correctPairs[k].trim().toLowerCase()) {
                  matched++;
                }
              });
              const ratio = matched / keys.length;
              pointsAwarded = Math.round(ratio * qPoints * 100) / 100;
              if (ratio === 1) isCorrect = true;
              else if (ratio > 0) isPartial = true;
            }
          } catch {}
        } else if (qType === "NUMERICAL") {
          try {
            let targetVal = 0;
            let tolerance = 0;
            try {
              const parsed = JSON.parse(q.correctAnswer);
              targetVal = Number(parsed.value ?? parsed.val ?? parsed);
              tolerance = Number(parsed.tolerance ?? 0);
            } catch {
              targetVal = Number(q.correctAnswer.replace(",", "."));
            }
            const studentVal = Number(String(userAns).replace(",", "."));
            if (!isNaN(studentVal) && !isNaN(targetVal)) {
              if (Math.abs(studentVal - targetVal) <= (tolerance || 0.0001)) {
                isCorrect = true;
                pointsAwarded = qPoints;
              }
            }
          } catch {}
        } else if (qType === "ORDERING" || qType === "BLANKS") {
          try {
            const correctArr: string[] = JSON.parse(q.correctAnswer);
            const userArr: string[] = typeof userAns === "string" && userAns ? JSON.parse(userAns) : [];
            isCorrect =
              Array.isArray(correctArr) &&
              Array.isArray(userArr) &&
              JSON.stringify(correctArr) === JSON.stringify(userArr);
            pointsAwarded = isCorrect ? qPoints : 0;
          } catch {
            isCorrect = false;
          }
        } else {
          isCorrect = String(userAns).trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
          pointsAwarded = isCorrect ? qPoints : 0;
        }

        answersMap[q.id] = {
          answer: typeof userAns === "object" ? JSON.stringify(userAns) : String(userAns),
          isCorrect,
          isPartial,
          pointsAwarded,
        };
      });

      const maxScore = sub.maxScore || totalMaxPoints || 1;
      const percent = Math.round((sub.score / maxScore) * 100);

      return {
        studentId,
        studentName,
        submissionId: sub.id,
        hasSubmitted: true,
        score: sub.score,
        maxScore,
        percent,
        submittedAt: sub.submittedAt.toISOString(),
        tabSwitches,
        answersMap,
      };
    });

    // Sort students by name alphabetically
    studentsResults.sort((a, b) => a.studentName.localeCompare(b.studentName, "ru"));

    // Calculate aggregated question stats
    const submittedResults = studentsResults.filter((s) => s.hasSubmitted);
    const submittedCount = submittedResults.length;

    const questionStats = test.questions.map((q: any, idx: number) => {
      let fullCorrectCount = 0;
      let partialCount = 0;
      let wrongCount = 0;
      let totalEarned = 0;
      const qPoints = q.points || 1;

      submittedResults.forEach((s) => {
        const a = s.answersMap[q.id];
        if (a) {
          if (a.isCorrect) fullCorrectCount++;
          else if (a.isPartial) partialCount++;
          else wrongCount++;
          totalEarned += a.pointsAwarded;
        } else {
          wrongCount++;
        }
      });

      const maxPossibleForQ = submittedCount * qPoints;
      const accuracyPercent =
        maxPossibleForQ > 0 ? Math.round((totalEarned / maxPossibleForQ) * 100) : 0;

      return {
        questionId: q.id,
        questionNumber: idx + 1,
        questionText: q.questionText,
        type: q.type,
        points: qPoints,
        fullCorrectCount,
        partialCount,
        wrongCount,
        accuracyPercent,
      };
    });

    // Analytics summary
    const scores = submittedResults.map((s) => s.percent).sort((a, b) => a - b);
    const avgPercent = submittedCount > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / submittedCount) : 0;
    const medianPercent =
      scores.length === 0
        ? 0
        : scores.length % 2 === 1
          ? scores[Math.floor(scores.length / 2)]
          : Math.round((scores[scores.length / 2 - 1] + scores[scores.length / 2]) / 2);

    const sortedByAccuracy = [...questionStats].sort((a, b) => a.accuracyPercent - b.accuracyPercent);
    const hardestQuestion = sortedByAccuracy.length > 0 ? sortedByAccuracy[0] : null;
    const easiestQuestion = sortedByAccuracy.length > 0 ? sortedByAccuracy[sortedByAccuracy.length - 1] : null;

    const scoreDistribution = [
      { range: "0–39%", label: "Неуд (0–39%)", count: submittedResults.filter((s) => s.percent < 40).length, fill: "var(--chart-5)" },
      { range: "40–59%", label: "Удовл (40–59%)", count: submittedResults.filter((s) => s.percent >= 40 && s.percent < 60).length, fill: "var(--chart-3)" },
      { range: "60–79%", label: "Хор (60–79%)", count: submittedResults.filter((s) => s.percent >= 60 && s.percent < 80).length, fill: "var(--chart-2)" },
      { range: "80–100%", label: "Отл (80–100%)", count: submittedResults.filter((s) => s.percent >= 80).length, fill: "var(--chart-1)" },
    ];

    return {
      success: true,
      test: {
        id: test.id,
        title: test.title,
        description: test.description || "",
        groupName: test.groupSubject.group.name,
        subjectName: test.groupSubject.subject.name,
        timeLimit: test.timeLimit,
        totalMaxPoints,
      },
      questions: test.questions.map((q: any) => {
        let opts: any[] = [];
        try {
          opts = JSON.parse(q.options);
        } catch {
          opts = [];
        }
        return {
          id: q.id,
          type: q.type,
          questionText: q.questionText,
          options: opts,
          correctAnswer: q.correctAnswer,
          points: q.points,
        };
      }),
      studentsResults,
      analytics: {
        totalEnrolled: studentsResults.length,
        submittedCount,
        avgPercent,
        medianPercent,
        highestPercent: scores.length > 0 ? Math.max(...scores) : 0,
        lowestPercent: scores.length > 0 ? Math.min(...scores) : 0,
        hardestQuestion,
        easiestQuestion,
        scoreDistribution,
      },
      questionStats,
    };
  } catch (err) {
    console.error("getTestResultsAction error:", err);
    return { success: false, error: "Ошибка при получении результатов теста" };
  }
}

export async function resetTestSubmissionAction(submissionId: string, testId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
      return { success: false, error: "Недостаточно прав для выполнения действия" };
    }

    await prisma.testSubmission.delete({
      where: { id: submissionId },
    });

    revalidatePath("/dashboard/lms/tests");
    revalidatePath(`/dashboard/lms/tests/${testId}/results`);
    return { success: true };
  } catch (err) {
    console.error("resetTestSubmissionAction error:", err);
    return { success: false, error: "Ошибка при сбросе работы студента" };
  }
}
