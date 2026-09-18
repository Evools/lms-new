"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { SubmissionStatus } from "@prisma/client";
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

export interface SubmissionDTO {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  fileUrl?: string | null;
  comment?: string | null;
  teacherComment?: string | null;
  status: SubmissionStatus;
  submittedAt: string;
  reviewedAt?: string | null;
  grade?: number | null;
}

export interface AssignmentDTO {
  id: string;
  groupSubjectId: string;
  subjectName: string;
  teacherName: string;
  authorName: string;
  title: string;
  description: string;
  fileUrl?: string | null;
  dueDate?: string | null;
  isPublished: boolean;
  createdAt: string;
  submissionsCount: number;
  acceptedCount: number;
  needRevisionCount: number;
  totalStudents: number;
  userSubmission?: SubmissionDTO | null;
  submissions: SubmissionDTO[];
}

export async function getAssignmentsDataAction(groupId?: string) {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id;
    const role = session?.user?.role || "STUDENT";

    // 1. Fetch groups with role-based filtering
    let groupWhere: Record<string, unknown> | undefined = undefined;

    if (role === "STUDENT" && currentUserId) {
      const enrollments = await prisma.groupStudent.findMany({
        where: { studentId: currentUserId },
        select: { groupId: true },
      });
      const studentGroupIds = enrollments.map((e) => e.groupId);
      groupWhere = { id: { in: studentGroupIds } };
    } else if (role === "TEACHER" && currentUserId) {
      groupWhere = {
        OR: [
          { curatorId: currentUserId },
          { groupSubjects: { some: { teacherId: currentUserId } } },
        ],
      };
    }

    const groups = await prisma.group.findMany({
      where: groupWhere,
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    const allowedGroupIds = groups.map((g) => g.id);
    let selectedGroupId = groupId || "";

    if (role === "STUDENT" || role === "TEACHER") {
      if (!selectedGroupId || !allowedGroupIds.includes(selectedGroupId)) {
        selectedGroupId = allowedGroupIds[0] || "";
      }
    } else {
      if (!selectedGroupId) {
        selectedGroupId = groups[0]?.id || "";
      }
    }

    if (!selectedGroupId) {
      return {
        groups: [],
        subjects: [],
        assignments: [],
        selectedGroupId: "",
        canCreate: role === "ADMIN" || role === "TEACHER",
      };
    }

    // 2. Fetch group subjects
    let groupSubjectWhere: Record<string, unknown> = { groupId: selectedGroupId };

    if (role === "TEACHER" && currentUserId && selectedGroupId) {
      const isCurator = await prisma.group.count({
        where: { id: selectedGroupId, curatorId: currentUserId },
      });
      if (!isCurator) {
        groupSubjectWhere.teacherId = currentUserId;
      }
    }

    const groupSubjects = await prisma.groupSubject.findMany({
      where: groupSubjectWhere,
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

    // 3. Count students in selected group
    const totalStudentsInGroup = await prisma.groupStudent.count({
      where: { groupId: selectedGroupId },
    });

    // 4. Fetch assignments for this group and accessible subjects
    const assignmentWhere: Record<string, unknown> = {
      groupSubjectId: { in: groupSubjects.map((gs) => gs.id) },
    };

    if (role === "STUDENT") {
      assignmentWhere.isPublished = true;
    }

    const dbAssignments = await prisma.assignment.findMany({
      where: assignmentWhere,
      include: {
        groupSubject: {
          include: {
            subject: { select: { name: true } },
            teacher: { select: { name: true } },
          },
        },
        author: { select: { name: true } },
        submissions: {
          include: {
            student: { select: { name: true } },
          },
          orderBy: { submittedAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const assignments: AssignmentDTO[] = dbAssignments.map((a) => {
      const submissionsList: SubmissionDTO[] = a.submissions.map((sub) => ({
        id: sub.id,
        assignmentId: sub.assignmentId,
        studentId: sub.studentId,
        studentName: sub.student.name,
        fileUrl: sub.fileUrl,
        comment: sub.comment,
        teacherComment: sub.teacherComment,
        status: sub.status,
        submittedAt: sub.submittedAt.toISOString(),
        reviewedAt: sub.reviewedAt ? sub.reviewedAt.toISOString() : null,
        grade: sub.grade ?? null,
      }));

      const userSub = currentUserId
        ? submissionsList.find((sub) => sub.studentId === currentUserId) || null
        : null;

      const acceptedCount = submissionsList.filter(
        (sub) => sub.status === SubmissionStatus.ACCEPTED
      ).length;
      const needRevisionCount = submissionsList.filter(
        (sub) => sub.status === SubmissionStatus.NEED_REVISION
      ).length;

      return {
        id: a.id,
        groupSubjectId: a.groupSubjectId,
        subjectName: a.groupSubject.subject.name,
        teacherName: a.groupSubject.teacher.name,
        authorName: a.author.name,
        title: a.title,
        description: a.description,
        fileUrl: a.fileUrl,
        dueDate: a.dueDate ? a.dueDate.toISOString() : null,
        isPublished: a.isPublished,
        createdAt: a.createdAt.toISOString(),
        submissionsCount: submissionsList.length,
        acceptedCount,
        needRevisionCount,
        totalStudents: totalStudentsInGroup,
        userSubmission: userSub,
        submissions: submissionsList,
      };
    });

    return {
      groups,
      subjects,
      assignments,
      selectedGroupId,
      canCreate: role === "ADMIN" || role === "TEACHER",
    };
  } catch (error) {
    console.error("Error in getAssignmentsDataAction:", error);
    return {
      groups: [],
      subjects: [],
      assignments: [],
      selectedGroupId: "",
      canCreate: false,
    };
  }
}

/** Create a new assignment for a group subject */
export async function createAssignmentAction(data: {
  groupSubjectId: string;
  title: string;
  description: string;
  dueDate?: string;
  fileUrl?: string;
  isPublished?: boolean;
}) {
  const session = await auth();
  if (
    !session?.user ||
    (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")
  ) {
    return { success: false, error: "Недостаточно прав для создания задания" };
  }

  if (!data.title.trim() || !data.description.trim() || !data.groupSubjectId) {
    return { success: false, error: "Заполните все обязательные поля" };
  }

  try {
    const isPublished = data.isPublished !== undefined ? data.isPublished : true;
    const newAssignment = await prisma.assignment.create({
      data: {
        groupSubjectId: data.groupSubjectId,
        authorId: session.user.id,
        title: data.title.trim(),
        description: data.description.trim(),
        fileUrl: data.fileUrl?.trim() || null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        isPublished,
      },
      include: {
        groupSubject: {
          include: {
            subject: true,
            group: {
              include: {
                students: { select: { studentId: true } },
              },
            },
          },
        },
      },
    });

    // Notify all students in this group only if published
    const students = newAssignment.groupSubject.group.students;
    if (isPublished && students.length > 0) {
      await prisma.notification.createMany({
        data: students.map((s) => ({
          userId: s.studentId,
          title: `Новое задание: ${newAssignment.title}`,
          message: `Опубликовано задание по дисциплине "${newAssignment.groupSubject.subject.name}".`,
          type: "ASSIGNMENT",
          link: "/dashboard/assignments",
        })),
      });
    }

    revalidatePath("/dashboard/assignments");
    return { success: true };
  } catch (error) {
    console.error("Failed to create assignment:", error);
    return { success: false, error: error instanceof Error ? error.message : "Произошла ошибка при создании задания" };
  }
}

/** Toggle assignment publication state */
export async function toggleAssignmentPublishAction(assignmentId: string) {
  const session = await auth();
  if (
    !session?.user ||
    (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")
  ) {
    return { success: false, error: "Недостаточно прав для изменения статуса публикации" };
  }

  try {
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        groupSubject: {
          include: {
            subject: true,
            group: {
              include: {
                students: { select: { studentId: true } },
              },
            },
          },
        },
      },
    });

    if (!assignment) {
      return { success: false, error: "Задание не найдено" };
    }

    const newStatus = !assignment.isPublished;

    const updated = await prisma.assignment.update({
      where: { id: assignmentId },
      data: { isPublished: newStatus },
      select: { id: true, isPublished: true, title: true },
    });

    // If publishing, notify students
    if (newStatus && assignment.groupSubject.group.students.length > 0) {
      await prisma.notification.createMany({
        data: assignment.groupSubject.group.students.map((s) => ({
          userId: s.studentId,
          title: `Новое задание: ${updated.title}`,
          message: `Опубликовано задание по дисциплине "${assignment.groupSubject.subject.name}".`,
          type: "ASSIGNMENT",
          link: "/dashboard/assignments",
        })),
      });
    }

    revalidatePath("/dashboard/assignments");
    return { success: true, isPublished: updated.isPublished };
  } catch (error) {
    console.error("Failed to toggle assignment publish:", error);
    return { success: false, error: error instanceof Error ? error.message : "Произошла ошибка" };
  }
}

/** Delete an assignment */
export async function deleteAssignmentAction(assignmentId: string) {
  const session = await auth();
  if (
    !session?.user ||
    (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")
  ) {
    return { success: false, error: "Недостаточно прав для удаления задания" };
  }

  try {
    await prisma.assignment.delete({
      where: { id: assignmentId },
    });

    revalidatePath("/dashboard/assignments");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete assignment:", error);
    return { success: false, error: error instanceof Error ? error.message : "Произошла ошибка при удалении задания" };
  }
}

/** Student submits homework for an assignment */
export async function submitAssignmentAction(data: {
  assignmentId: string;
  fileUrl?: string;
  comment?: string;
}) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Вы не авторизованы" };
  }

  try {
    const assignment = await prisma.assignment.findUnique({
      where: { id: data.assignmentId },
      select: { isPublished: true },
    });

    if (!assignment || !assignment.isPublished) {
      return { success: false, error: "Задание находится в режиме черновика и временно недоступно" };
    }

    // Block resubmission if work is already ACCEPTED
    const existing = await prisma.assignmentSubmission.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId: data.assignmentId,
          studentId: session.user.id,
        },
      },
    });
    if (existing && existing.status === SubmissionStatus.ACCEPTED) {
      return { success: false, error: "Работа уже принята и не может быть пересдана" };
    }

    await prisma.assignmentSubmission.upsert({
      where: {
        assignmentId_studentId: {
          assignmentId: data.assignmentId,
          studentId: session.user.id,
        },
      },
      update: {
        fileUrl: data.fileUrl?.trim() || null,
        comment: data.comment?.trim() || null,
        status: SubmissionStatus.SUBMITTED,
        submittedAt: new Date(),
        teacherComment: null,
        reviewedAt: null,
        grade: null,
      },
      create: {
        assignmentId: data.assignmentId,
        studentId: session.user.id,
        fileUrl: data.fileUrl?.trim() || null,
        comment: data.comment?.trim() || null,
        status: SubmissionStatus.SUBMITTED,
      },
    });

    // Notify assignment teacher / author
    const assignmentWithAuthor = await prisma.assignment.findUnique({
      where: { id: data.assignmentId },
      include: {
        author: { select: { id: true } },
      },
    });
    if (assignmentWithAuthor?.author?.id && assignmentWithAuthor.author.id !== session.user.id) {
      await prisma.notification.create({
        data: {
          userId: assignmentWithAuthor.author.id,
          title: `${session.user.name || "Студент"} сдал(а) решение`,
          message: `Сдано решение по заданию "${assignmentWithAuthor.title}".`,
          type: "SUBMISSION",
          link: "/dashboard/assignments",
        },
      });
    }

    revalidatePath("/dashboard/assignments");
    return { success: true };
  } catch (error) {
    console.error("Failed to submit assignment:", error);
    return { success: false, error: error instanceof Error ? error.message : "Произошла ошибка при отправке задания" };
  }
}

/** Teacher/Admin reviews & grades a student submission */
export async function reviewSubmissionAction(data: {
  submissionId: string;
  status: SubmissionStatus;
  teacherComment?: string;
  grade?: number | null;
}) {
  const session = await auth();
  if (
    !session?.user ||
    (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")
  ) {
    return { success: false, error: "Недостаточно прав для проверки работы" };
  }

  try {
    const updatedSub = await prisma.assignmentSubmission.update({
      where: { id: data.submissionId },
      data: {
        status: data.status,
        teacherComment: data.teacherComment?.trim() || null,
        reviewedAt: new Date(),
        grade: data.grade ?? null,
      },
      include: {
        assignment: { select: { title: true } },
      },
    });

    // Notify student about review result
    const statusText = data.status === SubmissionStatus.ACCEPTED ? "Принято" : "На доработке";
    const gradeText = data.grade != null ? ` (Оценка: ${data.grade}/5)` : "";
    await prisma.notification.create({
      data: {
        userId: updatedSub.studentId,
        title: `Работа проверена: ${updatedSub.assignment.title}`,
        message: `Статус: ${statusText}${gradeText}.${data.teacherComment ? ` Замечания: ${data.teacherComment}` : ""}`,
        type: "GRADE",
        link: "/dashboard/assignments",
      },
    });

    revalidatePath("/dashboard/assignments");
    return { success: true };
  } catch (error) {
    console.error("Failed to review submission:", error);
    return { success: false, error: error instanceof Error ? error.message : "Произошла ошибка при проверке работы" };
  }
}
