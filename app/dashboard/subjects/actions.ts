"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type SubjectCategoryType = "GENERAL" | "PROFESSIONAL";

export type SubjectAssessmentType =
  | "EXAM"
  | "DIFF_CREDIT"
  | "CREDIT"
  | "PRACTICE_WORK";

export interface SubjectExtraMeta {
  category: SubjectCategoryType;
  hoursTotal: number;
  assessmentType: SubjectAssessmentType;
  specialtyId?: string | null;
}

export interface SubjectDTO {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  category: SubjectCategoryType;
  hoursTotal: number;
  assessmentType: SubjectAssessmentType;
  specialtyId?: string | null;
  specialtyName?: string | null;
  groupsCount: number;
  materialsCount: number;
  assignmentsCount: number;
  createdAt: string;
}

export interface GroupSubjectBindingDTO {
  id: string; // GroupSubject id
  groupId: string;
  groupName: string;
  groupCourse: number;
  groupSpecialty?: string | null;
  subjectId: string;
  subjectName: string;
  subjectCode?: string | null;
  subjectCategory: SubjectCategoryType;
  subjectHours: number;
  teacherId: string;
  teacherName: string;
}

export interface TeacherOptionDTO {
  id: string;
  name: string;
  email: string;
}

export interface GroupOptionDTO {
  id: string;
  name: string;
  course: number;
  specialtyName?: string | null;
}

export interface SpecialtyOptionDTO {
  id: string;
  name: string;
  code?: string | null;
}

const SUBJECTS_META_KEY = "lms_subjects_meta_v1";

function canManageSubjects(role?: string | null): boolean {
  return role === "ADMIN" || role === "ADMINISTRATION" || role === "TEACHER";
}

function normalizeCategory(raw?: string | null): SubjectCategoryType {
  if (raw === "GENERAL") return "GENERAL";
  return "PROFESSIONAL";
}

function inferSubjectMeta(
  name: string,
  code?: string | null
): SubjectExtraMeta {
  const lower = name.toLowerCase();
  const codeUpper = (code || "").toUpperCase();

  if (
    lower.includes("язык") ||
    lower.includes("литератур") ||
    lower.includes("истори") ||
    lower.includes("геометр") ||
    lower.includes("алгебр") ||
    lower.includes("математ") ||
    lower.includes("физик") ||
    lower.includes("биолог") ||
    lower.includes("географ") ||
    lower.includes("хими") ||
    lower.includes("физкультур") ||
    lower.includes("физическая культура") ||
    codeUpper.startsWith("ОД") ||
    codeUpper.startsWith("ООД")
  ) {
    return {
      category: "GENERAL",
      hoursTotal: 72,
      assessmentType: "DIFF_CREDIT",
      specialtyId: null,
    };
  }

  return {
    category: "PROFESSIONAL",
    hoursTotal: 108,
    assessmentType: "EXAM",
    specialtyId: null,
  };
}

async function readSubjectsMetaMap(): Promise<Record<string, SubjectExtraMeta>> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: SUBJECTS_META_KEY },
    });
    if (!setting?.value) return {};
    const parsed = JSON.parse(setting.value);
    if (parsed && typeof parsed === "object") {
      return parsed as Record<string, SubjectExtraMeta>;
    }
    return {};
  } catch {
    return {};
  }
}

async function writeSubjectsMetaMap(
  map: Record<string, SubjectExtraMeta>
): Promise<void> {
  await prisma.systemSetting.upsert({
    where: { key: SUBJECTS_META_KEY },
    update: { value: JSON.stringify(map) },
    create: {
      key: SUBJECTS_META_KEY,
      value: JSON.stringify(map),
    },
  });
}

export async function getSubjectsDataAction() {
  try {
    const session = await auth();
    if (!session?.user || !canManageSubjects(session.user.role)) {
      return {
        subjects: [],
        bindings: [],
        teachers: [],
        groups: [],
        specialties: [],
      };
    }

    const [subjects, bindings, teachers, groups, specialties, metaMap] =
      await Promise.all([
        prisma.subject.findMany({
          orderBy: { name: "asc" },
          include: {
            groupSubjects: {
              include: {
                _count: {
                  select: {
                    topics: true,
                    assignments: true,
                  },
                },
              },
            },
          },
        }),
        prisma.groupSubject.findMany({
          include: {
            group: {
              select: {
                id: true,
                name: true,
                course: true,
                specialty: { select: { name: true } },
              },
            },
            subject: { select: { id: true, name: true, code: true } },
            teacher: { select: { id: true, name: true } },
          },
          orderBy: [{ group: { name: "asc" } }],
        }),
        prisma.user.findMany({
          where: { role: "TEACHER", isActive: true },
          select: { id: true, name: true, email: true },
          orderBy: { name: "asc" },
        }),
        prisma.group.findMany({
          select: {
            id: true,
            name: true,
            course: true,
            specialty: { select: { name: true } },
          },
          orderBy: [{ course: "asc" }, { name: "asc" }],
        }),
        prisma.specialty.findMany({
          select: { id: true, name: true, code: true },
          orderBy: { name: "asc" },
        }),
        readSubjectsMetaMap(),
      ]);

    const specialtyById = new Map(specialties.map((sp) => [sp.id, sp.name]));

    const subjectDTOs: SubjectDTO[] = subjects.map((s) => {
      const savedMeta = metaMap[s.id];
      const fallback = inferSubjectMeta(s.name, s.code);
      const category = savedMeta?.category
        ? normalizeCategory(savedMeta.category)
        : fallback.category;
      const hoursTotal = savedMeta?.hoursTotal || fallback.hoursTotal;
      const assessmentType =
        savedMeta?.assessmentType || fallback.assessmentType;
      const specialtyId = savedMeta?.specialtyId || null;

      let materialsCount = 0;
      let assignmentsCount = 0;
      for (const gs of s.groupSubjects) {
        materialsCount += gs._count.topics;
        assignmentsCount += gs._count.assignments;
      }

      return {
        id: s.id,
        name: s.name,
        code: s.code,
        description: s.description,
        category,
        hoursTotal,
        assessmentType,
        specialtyId,
        specialtyName: specialtyId ? specialtyById.get(specialtyId) || null : null,
        groupsCount: s.groupSubjects.length,
        materialsCount,
        assignmentsCount,
        createdAt: s.createdAt.toISOString(),
      };
    });

    const subjectMap = new Map(subjectDTOs.map((s) => [s.id, s]));

    const bindingDTOs: GroupSubjectBindingDTO[] = bindings.map((b) => {
      const subj = subjectMap.get(b.subject.id);
      return {
        id: b.id,
        groupId: b.group.id,
        groupName: b.group.name,
        groupCourse: b.group.course,
        groupSpecialty: b.group.specialty?.name || null,
        subjectId: b.subject.id,
        subjectName: b.subject.name,
        subjectCode: b.subject.code,
        subjectCategory: subj?.category || "PROFESSIONAL",
        subjectHours: subj?.hoursTotal || 72,
        teacherId: b.teacher.id,
        teacherName: b.teacher.name,
      };
    });

    return {
      subjects: subjectDTOs,
      bindings: bindingDTOs,
      teachers: teachers as TeacherOptionDTO[],
      groups: groups.map((g) => ({
        id: g.id,
        name: g.name,
        course: g.course,
        specialtyName: g.specialty?.name || null,
      })) as GroupOptionDTO[],
      specialties: specialties as SpecialtyOptionDTO[],
    };
  } catch (error) {
    console.error("getSubjectsDataAction error:", error);
    return {
      subjects: [],
      bindings: [],
      teachers: [],
      groups: [],
      specialties: [],
    };
  }
}

/** Create a new subject */
export async function createSubjectAction(data: {
  name: string;
  code?: string;
  description?: string;
  category?: SubjectCategoryType;
  hoursTotal?: number;
  assessmentType?: SubjectAssessmentType;
  specialtyId?: string | null;
}) {
  const session = await auth();
  if (!session?.user || !canManageSubjects(session.user.role)) {
    return { success: false, error: "Недостаточно прав для создания дисциплины" };
  }
  if (!data.name.trim()) {
    return { success: false, error: "Укажите название дисциплины" };
  }

  try {
    const existing = await prisma.subject.findFirst({
      where: { name: data.name.trim() },
    });
    if (existing)
      return {
        success: false,
        error: "Дисциплина с таким названием уже существует",
      };

    const created = await prisma.subject.create({
      data: {
        name: data.name.trim(),
        code: data.code?.trim() || null,
        description: data.description?.trim() || null,
      },
    });

    const metaMap = await readSubjectsMetaMap();
    const fallback = inferSubjectMeta(created.name, created.code);
    metaMap[created.id] = {
      category: data.category ? normalizeCategory(data.category) : fallback.category,
      hoursTotal:
        Number(data.hoursTotal) > 0 ? Number(data.hoursTotal) : fallback.hoursTotal,
      assessmentType: data.assessmentType || fallback.assessmentType,
      specialtyId:
        data.specialtyId && data.specialtyId !== "ALL" ? data.specialtyId : null,
    };
    await writeSubjectsMetaMap(metaMap);

    revalidatePath("/dashboard/subjects");
    revalidatePath("/dashboard/schedule");
    revalidatePath("/dashboard/groups");
    return { success: true };
  } catch (error) {
    console.error("createSubjectAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Произошла ошибка",
    };
  }
}

/** Update an existing subject */
export async function updateSubjectAction(
  subjectId: string,
  data: {
    name: string;
    code?: string;
    description?: string;
    category?: SubjectCategoryType;
    hoursTotal?: number;
    assessmentType?: SubjectAssessmentType;
    specialtyId?: string | null;
  }
) {
  const session = await auth();
  if (!session?.user || !canManageSubjects(session.user.role)) {
    return {
      success: false,
      error: "Недостаточно прав для редактирования дисциплины",
    };
  }
  if (!data.name.trim()) {
    return { success: false, error: "Укажите название дисциплины" };
  }

  try {
    const duplicate = await prisma.subject.findFirst({
      where: {
        name: data.name.trim(),
        NOT: { id: subjectId },
      },
    });
    if (duplicate) {
      return {
        success: false,
        error: "Дисциплина с таким названием уже существует",
      };
    }

    const updated = await prisma.subject.update({
      where: { id: subjectId },
      data: {
        name: data.name.trim(),
        code: data.code?.trim() || null,
        description: data.description?.trim() || null,
      },
    });

    const metaMap = await readSubjectsMetaMap();
    const prev = metaMap[subjectId] || inferSubjectMeta(updated.name, updated.code);
    metaMap[subjectId] = {
      category: data.category
        ? normalizeCategory(data.category)
        : normalizeCategory(prev.category),
      hoursTotal:
        typeof data.hoursTotal === "number" && data.hoursTotal > 0
          ? data.hoursTotal
          : prev.hoursTotal,
      assessmentType: data.assessmentType || prev.assessmentType,
      specialtyId:
        data.specialtyId === undefined
          ? prev.specialtyId
          : data.specialtyId && data.specialtyId !== "ALL"
            ? data.specialtyId
            : null,
    };
    await writeSubjectsMetaMap(metaMap);

    revalidatePath("/dashboard/subjects");
    revalidatePath("/dashboard/schedule");
    revalidatePath("/dashboard/groups");
    return { success: true };
  } catch (error) {
    console.error("updateSubjectAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Произошла ошибка",
    };
  }
}

/** Delete a subject */
export async function deleteSubjectAction(subjectId: string) {
  const session = await auth();
  if (!session?.user || !canManageSubjects(session.user.role)) {
    return { success: false, error: "Недостаточно прав для удаления дисциплины" };
  }

  try {
    await prisma.subject.delete({ where: { id: subjectId } });
    const metaMap = await readSubjectsMetaMap();
    if (metaMap[subjectId]) {
      delete metaMap[subjectId];
      await writeSubjectsMetaMap(metaMap);
    }
    revalidatePath("/dashboard/subjects");
    revalidatePath("/dashboard/schedule");
    revalidatePath("/dashboard/groups");
    return { success: true };
  } catch (error) {
    console.error("deleteSubjectAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Произошла ошибка",
    };
  }
}

/** Assign a subject to a group with a teacher */
export async function assignSubjectToGroupAction(data: {
  subjectId: string;
  groupId: string;
  teacherId: string;
}) {
  const session = await auth();
  if (!session?.user || !canManageSubjects(session.user.role)) {
    return { success: false, error: "Недостаточно прав для привязки дисциплины" };
  }

  try {
    const existing = await prisma.groupSubject.findFirst({
      where: {
        groupId: data.groupId,
        subjectId: data.subjectId,
      },
    });
    if (existing) {
      return {
        success: false,
        error: "Эта дисциплина уже привязана к данной группе",
      };
    }

    await prisma.groupSubject.create({
      data: {
        groupId: data.groupId,
        subjectId: data.subjectId,
        teacherId: data.teacherId,
      },
    });
    revalidatePath("/dashboard/subjects");
    revalidatePath("/dashboard/groups");
    revalidatePath("/dashboard/schedule");
    return { success: true };
  } catch (error) {
    console.error("assignSubjectToGroupAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Произошла ошибка",
    };
  }
}

/** Update an existing group-subject binding */
export async function updateGroupSubjectBindingAction(
  bindingId: string,
  data: {
    subjectId: string;
    groupId: string;
    teacherId: string;
  }
) {
  const session = await auth();
  if (!session?.user || !canManageSubjects(session.user.role)) {
    return { success: false, error: "Недостаточно прав для обновления привязки" };
  }

  try {
    const duplicate = await prisma.groupSubject.findFirst({
      where: {
        groupId: data.groupId,
        subjectId: data.subjectId,
        NOT: { id: bindingId },
      },
    });
    if (duplicate) {
      return {
        success: false,
        error: "Такая привязка дисциплины к группе уже существует",
      };
    }

    await prisma.groupSubject.update({
      where: { id: bindingId },
      data: {
        subjectId: data.subjectId,
        groupId: data.groupId,
        teacherId: data.teacherId,
      },
    });
    revalidatePath("/dashboard/subjects");
    revalidatePath("/dashboard/groups");
    revalidatePath("/dashboard/schedule");
    return { success: true };
  } catch (error) {
    console.error("updateGroupSubjectBindingAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Произошла ошибка",
    };
  }
}

/** Remove subject binding from a group */
export async function removeSubjectFromGroupAction(bindingId: string) {
  const session = await auth();
  if (!session?.user || !canManageSubjects(session.user.role)) {
    return { success: false, error: "Недостаточно прав для отвязки дисциплины" };
  }

  try {
    await prisma.groupSubject.delete({ where: { id: bindingId } });
    revalidatePath("/dashboard/subjects");
    revalidatePath("/dashboard/groups");
    revalidatePath("/dashboard/schedule");
    return { success: true };
  } catch (error) {
    console.error("removeSubjectFromGroupAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Произошла ошибка",
    };
  }
}
