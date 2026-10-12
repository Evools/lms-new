"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export interface CompanyPartnerDTO {
  id: string;
  name: string;
  industry: string;
  specialtyFocus?: string | null;
  contactPerson?: string | null;
  position?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  contractNumber?: string | null;
  contractValidUntil?: string | null;
  quotaTotal: number;
  quotaUsed: number;
  notes?: string | null;
}

export interface StudentPracticeRecordDTO {
  id: string;
  studentId?: string | null;
  studentName: string;
  groupId?: string | null;
  groupName: string;
  course: number;
  specialty: string;
  practiceType: "Учебная (ознакомительная)" | "Производственная" | "Преддипломная";
  companyId?: string | null;
  companyName?: string | null;
  collegeMentor?: string | null;
  companyMentor?: string | null;
  startDate: string;
  endDate: string;
  status:
    | "Не распределен"
    | "Направлен"
    | "Проходит практику"
    | "Переведен на другую базу"
    | "Практика завершена";
  feedbackNote?: string | null;
  movements: PracticeMovementDTO[];
}

export interface PracticeMovementDTO {
  id: string;
  date: string;
  type: string;
  fromCompany?: string | null;
  toCompany: string;
  practiceType?: string | null;
  reason: string;
  mentor?: string | null;
}

export interface SpecialtyDiaryPlanDTO {
  id: string;
  groupName: string;
  groupId?: string | null;
  title: string;
  specialty: string;
  course: number;
  practiceType: "Учебная (ознакомительная)" | "Производственная" | "Преддипломная";
  startDate?: string | null;
  dailyHours: number;
  totalDays: number;
  totalHours: number;
  days: DiaryDayTopicDTO[];
}

export interface DiaryDayTopicDTO {
  id: string;
  dayNumber: number;
  section: string;
  topic: string;
  tasksContent: string;
  hours: number;
}

export interface PracticeFullDataResponse {
  companies: CompanyPartnerDTO[];
  students: StudentPracticeRecordDTO[];
  diaryPlans: SpecialtyDiaryPlanDTO[];
  rewrittenDayIds: string[];
  groupsList: {
    id: string;
    name: string;
    course: number;
    specialty: string;
    students?: { id: string; name: string }[];
  }[];
}

// 1. Get All Practice Data
export async function getPracticeFullDataAction(): Promise<PracticeFullDataResponse> {
  let currentUserId: string | undefined;
  try {
    const session = await auth();
    currentUserId = session?.user?.id;
  } catch (e) {
    // Session unavailable in current scope
  }

  try {
    if (!prisma.companyPartner || !prisma.studentPractice || !prisma.practiceDiaryPlan) {
      console.warn("Prisma practice models are not available yet on this client instance.");
      const dbGroups = await prisma.group.findMany({
        select: {
          id: true,
          name: true,
          course: true,
          specialty: { select: { name: true } },
          students: {
            select: {
              student: { select: { id: true, name: true } },
            },
            orderBy: { student: { name: "asc" } },
          },
        },
        orderBy: { name: "asc" },
      });
      return {
        companies: [],
        students: [],
        diaryPlans: [],
        rewrittenDayIds: [],
        groupsList: dbGroups.map((g) => ({
          id: g.id,
          name: g.name,
          course: g.course || 1,
          specialty: g.specialty?.name || "Общая специальность",
          students: g.students.map((gs) => ({ id: gs.student.id, name: gs.student.name })),
        })),
      };
    }

    const [dbCompanies, dbStudents, dbPlans, dbRewritten, dbGroups] = await Promise.all([
      prisma.companyPartner.findMany({
        orderBy: { name: "asc" },
      }),
      prisma.studentPractice.findMany({
        orderBy: { studentName: "asc" },
        include: {
          movements: {
            orderBy: { createdAt: "desc" },
          },
        },
      }),
      prisma.practiceDiaryPlan.findMany({
        orderBy: { groupName: "asc" },
        include: {
          days: {
            orderBy: { dayNumber: "asc" },
          },
        },
      }),
      currentUserId && prisma.practiceRewrittenDay
        ? prisma.practiceRewrittenDay.findMany({
            where: { studentId: currentUserId },
            select: { dayId: true },
          })
        : Promise.resolve([]),
      prisma.group.findMany({
        select: {
          id: true,
          name: true,
          course: true,
          specialty: { select: { name: true } },
          students: {
            select: {
              student: { select: { id: true, name: true } },
            },
            orderBy: { student: { name: "asc" } },
          },
        },
        orderBy: { name: "asc" },
      }),
    ]);

  return {
    companies: dbCompanies.map((c) => ({
      id: c.id,
      name: c.name,
      industry: c.industry,
      specialtyFocus: c.specialtyFocus,
      contactPerson: c.contactPerson,
      position: c.position,
      phone: c.phone,
      email: c.email,
      address: c.address,
      contractNumber: c.contractNumber,
      contractValidUntil: c.contractValidUntil,
      quotaTotal: c.quotaTotal,
      quotaUsed: c.quotaUsed,
      notes: c.notes,
    })),
    students: dbStudents.map((s) => ({
      id: s.id,
      studentId: s.studentId,
      studentName: s.studentName,
      groupId: s.groupId,
      groupName: s.groupName,
      course: s.course,
      specialty: s.specialty,
      practiceType: s.practiceType as any,
      companyId: s.companyId,
      companyName: s.companyName,
      collegeMentor: s.collegeMentor,
      companyMentor: s.companyMentor,
      startDate: s.startDate,
      endDate: s.endDate,
      status: s.status as any,
      feedbackNote: s.feedbackNote,
      movements: s.movements.map((m) => ({
        id: m.id,
        date: m.date,
        type: m.type,
        fromCompany: m.fromCompany,
        toCompany: m.toCompany,
        practiceType: m.practiceType,
        reason: m.reason,
        mentor: m.mentor,
      })),
    })),
    diaryPlans: dbPlans.map((p) => ({
      id: p.id,
      groupName: p.groupName,
      groupId: p.groupId,
      title: p.title,
      specialty: p.specialty,
      course: p.course,
      practiceType: p.practiceType as any,
      startDate: p.startDate,
      dailyHours: p.dailyHours,
      totalDays: p.totalDays,
      totalHours: p.totalHours,
      days: p.days.map((d) => ({
        id: d.id,
        dayNumber: d.dayNumber,
        section: d.section,
        topic: d.topic,
        tasksContent: d.tasksContent,
        hours: d.hours,
      })),
    })),
    rewrittenDayIds: dbRewritten.map((r) => r.dayId),
    groupsList: dbGroups.map((g) => ({
      id: g.id,
      name: g.name,
      course: g.course || 1,
      specialty: g.specialty?.name || "Общая специальность",
      students: g.students.map((gs) => ({ id: gs.student.id, name: gs.student.name })),
    })),
  };
  } catch (error) {
    console.error("Error in getPracticeFullDataAction:", error);
    return {
      companies: [],
      students: [],
      diaryPlans: [],
      rewrittenDayIds: [],
      groupsList: [],
    };
  }
}

// 2. Company CRUD
export async function createCompanyAction(data: {
  name: string;
  industry: string;
  specialtyFocus?: string;
  contactPerson?: string;
  position?: string;
  phone?: string;
  email?: string;
  address?: string;
  contractNumber?: string;
  contractValidUntil?: string;
  quotaTotal: number;
  notes?: string;
}) {
  const session = await auth();
  if (!session?.user || session.user.role === "STUDENT") {
    throw new Error("Недостаточно прав для добавления базы практики");
  }

  const created = await prisma.companyPartner.create({
    data: {
      name: data.name,
      industry: data.industry,
      specialtyFocus: data.specialtyFocus || null,
      contactPerson: data.contactPerson || null,
      position: data.position || null,
      phone: data.phone || null,
      email: data.email || null,
      address: data.address || null,
      contractNumber: data.contractNumber || null,
      contractValidUntil: data.contractValidUntil || null,
      quotaTotal: data.quotaTotal || 0,
      quotaUsed: 0,
      notes: data.notes || null,
    },
  });

  revalidatePath("/dashboard/practice");
  return created;
}

export async function updateCompanyAction(
  id: string,
  data: {
    name: string;
    industry: string;
    specialtyFocus?: string;
    contactPerson?: string;
    position?: string;
    phone?: string;
    email?: string;
    address?: string;
    contractNumber?: string;
    contractValidUntil?: string;
    quotaTotal: number;
    notes?: string;
  }
) {
  const session = await auth();
  if (!session?.user || session.user.role === "STUDENT") {
    throw new Error("Недостаточно прав");
  }

  const updated = await prisma.companyPartner.update({
    where: { id },
    data: {
      name: data.name,
      industry: data.industry,
      specialtyFocus: data.specialtyFocus || null,
      contactPerson: data.contactPerson || null,
      position: data.position || null,
      phone: data.phone || null,
      email: data.email || null,
      address: data.address || null,
      contractNumber: data.contractNumber || null,
      contractValidUntil: data.contractValidUntil || null,
      quotaTotal: data.quotaTotal,
      notes: data.notes || null,
    },
  });

  revalidatePath("/dashboard/practice");
  return updated;
}

export async function deleteCompanyAction(id: string) {
  const session = await auth();
  if (!session?.user || session.user.role === "STUDENT") {
    throw new Error("Недостаточно прав");
  }

  await prisma.companyPartner.delete({
    where: { id },
  });

  revalidatePath("/dashboard/practice");
  return { success: true };
}

// 3. Assign / Move Students
export async function assignStudentsAction(data: {
  studentIds: string[];
  companyId: string;
  practiceType: string;
  reason: string;
  startDate: string;
  endDate: string;
  companyMentor: string;
}) {
  const session = await auth();
  if (!session?.user || session.user.role === "STUDENT") {
    throw new Error("Недостаточно прав");
  }

  const targetCompany = await prisma.companyPartner.findUnique({
    where: { id: data.companyId },
  });
  if (!targetCompany) throw new Error("База практики не найдена");

  const todayStr = new Date().toLocaleDateString("ru-RU");

  for (const stId of data.studentIds) {
    const student = await prisma.studentPractice.findUnique({
      where: { id: stId },
    });
    if (!student) continue;

    const fromCompany = student.companyName || undefined;
    const isTransfer = Boolean(student.companyId && student.companyId !== data.companyId);
    const moveType = isTransfer ? "Перевод на другую базу" : "Первичное направление";

    // Update old company quota if moving
    if (student.companyId && student.companyId !== data.companyId) {
      await prisma.companyPartner.update({
        where: { id: student.companyId },
        data: { quotaUsed: { decrement: 1 } },
      }).catch(() => {});
    }

    // Update student record
    await prisma.studentPractice.update({
      where: { id: stId },
      data: {
        companyId: targetCompany.id,
        companyName: targetCompany.name,
        practiceType: data.practiceType,
        companyMentor: data.companyMentor || student.companyMentor,
        startDate: data.startDate || student.startDate,
        endDate: data.endDate || student.endDate,
        status: isTransfer ? "Переведен на другую базу" : "Проходит практику",
        movements: {
          create: {
            date: todayStr,
            type: moveType,
            fromCompany: fromCompany,
            toCompany: targetCompany.name,
            practiceType: data.practiceType,
            reason: data.reason,
            mentor: data.companyMentor || student.companyMentor,
          },
        },
      },
    });

    // Increment new company quota
    await prisma.companyPartner.update({
      where: { id: targetCompany.id },
      data: { quotaUsed: { increment: 1 } },
    });
  }

  revalidatePath("/dashboard/practice");
  return { success: true };
}

// 4. Toggle Student Complete Practice
export async function toggleCompletePracticeAction(studentId: string) {
  const session = await auth();
  if (!session?.user || session.user.role === "STUDENT") {
    throw new Error("Недостаточно прав");
  }

  const student = await prisma.studentPractice.findUnique({
    where: { id: studentId },
  });
  if (!student) throw new Error("Студент не найден");

  const newStatus =
    student.status === "Практика завершена" ? "Проходит практику" : "Практика завершена";

  const todayStr = new Date().toLocaleDateString("ru-RU");

  await prisma.studentPractice.update({
    where: { id: studentId },
    data: {
      status: newStatus,
      movements: {
        create: {
          date: todayStr,
          type: newStatus === "Практика завершена" ? "Завершение практики" : "Возобновление практики",
          fromCompany: student.companyName,
          toCompany: student.companyName || "Колледж",
          practiceType: student.practiceType,
          reason: newStatus === "Практика завершена" ? "Успешное завершение установленного срока практики" : "Возврат статуса куратором",
          mentor: student.companyMentor,
        },
      },
    },
  });

  revalidatePath("/dashboard/practice");
  return { success: true, newStatus };
}

// 5. Diary Plan CRUD
export async function saveDiaryPlanAction(data: {
  id?: string;
  groupName: string;
  title: string;
  specialty: string;
  course: number;
  practiceType: string;
  startDate?: string;
  generateDaysCount?: number;
  defaultHours?: number;
}) {
  const session = await auth();
  if (!session?.user || session.user.role === "STUDENT") {
    throw new Error("Недостаточно прав");
  }

  if (data.id) {
    const updated = await prisma.practiceDiaryPlan.update({
      where: { id: data.id },
      data: {
        groupName: data.groupName,
        title: data.title || `Памятка практики для группы ${data.groupName}`,
        specialty: data.specialty,
        course: data.course,
        practiceType: data.practiceType,
        startDate: data.startDate,
      },
    });
    revalidatePath("/dashboard/practice");
    return updated;
  }

  // Create new plan with initial generated days
  const daysCount = data.generateDaysCount || 15;
  const hoursPerDay = data.defaultHours || 6;
  const totalHours = daysCount * hoursPerDay;

  const generatedDays = Array.from({ length: daysCount }).map((_, idx) => ({
    dayNumber: idx + 1,
    section:
      idx < 2
        ? "Раздел 1. Вводный инструктаж и рабочее окружение"
        : idx < daysCount - 2
        ? "Раздел 2. Практическая подготовка и выполнение заданий"
        : "Раздел 3. Оформление отчетности и защита дневника",
    topic:
      idx === 0
        ? "Инструктаж по технике безопасности и правила внутреннего распорядка"
        : idx === 1
        ? "Подготовка рабочего места и настройка программного окружения"
        : idx === daysCount - 1
        ? "Оформление дневника практики и защита выполненных работ"
        : `Выполнение производственных заданий (День #${idx + 1})`,
    tasksContent:
      idx === 0
        ? "Прохождение вводного инструктажа по ТБ и пожарной безопасности на предприятии."
        : idx === daysCount - 1
        ? "Окончательное оформление физического дневника практики, составление отчета."
        : `Выполнение практических задач в соответствии с заданием руководителя практики.`,
    hours: hoursPerDay,
    order: idx + 1,
  }));

  const created = await prisma.practiceDiaryPlan.create({
    data: {
      groupName: data.groupName,
      title: data.title || `Памятка практики для группы ${data.groupName}`,
      specialty: data.specialty,
      course: data.course,
      practiceType: data.practiceType,
      startDate: data.startDate || new Date().toLocaleDateString("ru-RU"),
      dailyHours: hoursPerDay,
      totalDays: daysCount,
      totalHours: totalHours,
      days: {
        create: generatedDays,
      },
    },
  });

  revalidatePath("/dashboard/practice");
  return created;
}

export async function deleteDiaryPlanAction(id: string) {
  const session = await auth();
  if (!session?.user || session.user.role === "STUDENT") {
    throw new Error("Недостаточно прав");
  }

  await prisma.practiceDiaryPlan.delete({
    where: { id },
  });

  revalidatePath("/dashboard/practice");
  return { success: true };
}

// 6. Day Topic CRUD
export async function saveDayTopicAction(data: {
  planId: string;
  dayId?: string;
  dayNumber: number;
  section: string;
  topic: string;
  tasksContent: string;
  hours: number;
}) {
  const session = await auth();
  if (!session?.user || session.user.role === "STUDENT") {
    throw new Error("Недостаточно прав");
  }

  if (data.dayId) {
    await prisma.practiceDiaryDay.update({
      where: { id: data.dayId },
      data: {
        section: data.section,
        topic: data.topic,
        tasksContent: data.tasksContent,
        hours: data.hours,
      },
    });
  } else {
    await prisma.practiceDiaryDay.create({
      data: {
        planId: data.planId,
        dayNumber: data.dayNumber,
        section: data.section,
        topic: data.topic,
        tasksContent: data.tasksContent,
        hours: data.hours,
        order: data.dayNumber,
      },
    });
  }

  // Recalculate plan totals
  const allDays = await prisma.practiceDiaryDay.findMany({
    where: { planId: data.planId },
  });
  const totalHours = allDays.reduce((acc, d) => acc + (d.hours || 0), 0);

  await prisma.practiceDiaryPlan.update({
    where: { id: data.planId },
    data: {
      totalDays: allDays.length,
      totalHours: totalHours,
    },
  });

  revalidatePath("/dashboard/practice");
  return { success: true };
}

export async function deleteDayTopicAction(planId: string, dayId: string) {
  const session = await auth();
  if (!session?.user || session.user.role === "STUDENT") {
    throw new Error("Недостаточно прав");
  }

  await prisma.practiceDiaryDay.delete({
    where: { id: dayId },
  });

  // Reindex remaining days
  const remainingDays = await prisma.practiceDiaryDay.findMany({
    where: { planId },
    orderBy: { dayNumber: "asc" },
  });

  for (let i = 0; i < remainingDays.length; i++) {
    await prisma.practiceDiaryDay.update({
      where: { id: remainingDays[i].id },
      data: { dayNumber: i + 1, order: i + 1 },
    });
  }

  const totalHours = remainingDays.reduce((acc, d) => acc + (d.hours || 0), 0);
  await prisma.practiceDiaryPlan.update({
    where: { id: planId },
    data: {
      totalDays: remainingDays.length,
      totalHours: totalHours,
    },
  });

  revalidatePath("/dashboard/practice");
  return { success: true };
}

// 7. Student Rewritten Days Tracking
export async function toggleDayRewrittenAction(dayId: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false };

  const studentId = session.user.id;

  const existing = await prisma.practiceRewrittenDay.findUnique({
    where: {
      studentId_dayId: { studentId, dayId },
    },
  });

  if (existing) {
    await prisma.practiceRewrittenDay.delete({
      where: { id: existing.id },
    });
    return { success: true, isRewritten: false };
  } else {
    await prisma.practiceRewrittenDay.create({
      data: { studentId, dayId },
    });
    return { success: true, isRewritten: true };
  }
}

export async function resetRewrittenDaysAction(dayIds: string[]) {
  const session = await auth();
  if (!session?.user?.id) return { success: false };

  const studentId = session.user.id;

  await prisma.practiceRewrittenDay.deleteMany({
    where: {
      studentId,
      dayId: { in: dayIds },
    },
  });

  return { success: true };
}

// 8. Enroll Students to Practice Action
export async function enrollStudentsToPracticeAction(data: {
  selectedStudents: { studentId: string; studentName: string }[];
  groupId: string;
  groupName: string;
  course: number;
  specialty: string;
  practiceType: "Учебная (ознакомительная)" | "Производственная" | "Преддипломная";
  startDate: string;
  endDate: string;
  companyId?: string | null;
  collegeMentor?: string | null;
  companyMentor?: string | null;
}) {
  const session = await auth();
  if (!session?.user || session.user.role === "STUDENT") {
    throw new Error("Недостаточно прав для зачисления студентов на практику");
  }

  let targetCompany: any = null;
  if (data.companyId) {
    targetCompany = await prisma.companyPartner.findUnique({
      where: { id: data.companyId },
    });
  }

  const todayStr = new Date().toLocaleDateString("ru-RU");
  const createdRecords: any[] = [];

  for (const st of data.selectedStudents) {
    // Check if already exists for this practice type
    const existing = await prisma.studentPractice.findFirst({
      where: {
        studentName: st.studentName,
        groupName: data.groupName,
        practiceType: data.practiceType,
      },
    });

    if (existing) {
      continue;
    }

    const isAssigned = Boolean(targetCompany);
    const status = isAssigned ? "Проходит практику" : "Не распределен";

    const record = await prisma.studentPractice.create({
      data: {
        studentId: st.studentId,
        studentName: st.studentName,
        groupId: data.groupId,
        groupName: data.groupName,
        course: data.course,
        specialty: data.specialty,
        practiceType: data.practiceType,
        companyId: targetCompany?.id || null,
        companyName: targetCompany?.name || null,
        collegeMentor: data.collegeMentor || null,
        companyMentor: data.companyMentor || targetCompany?.contactPerson || null,
        startDate: data.startDate,
        endDate: data.endDate,
        status,
        movements: isAssigned
          ? {
              create: {
                date: todayStr,
                type: "Первичное направление",
                toCompany: targetCompany.name,
                practiceType: data.practiceType,
                reason: `Зачисление и плановое распределение группы ${data.groupName} на практику`,
                mentor: data.companyMentor || targetCompany?.contactPerson,
              },
            }
          : undefined,
      },
      include: {
        movements: true,
      },
    });

    createdRecords.push(record);
  }

  if (targetCompany && createdRecords.length > 0) {
    await prisma.companyPartner.update({
      where: { id: targetCompany.id },
      data: { quotaUsed: { increment: createdRecords.length } },
    });
  }

  revalidatePath("/dashboard/practice");
  return {
    success: true,
    enrolledCount: createdRecords.length,
    records: createdRecords,
  };
}
