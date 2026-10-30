"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export interface CreateStudentInput {
  name: string;
  email: string;
  phone?: string;
  password?: string;
  groupName?: string;
  enrollmentType?: string;
  nationalId?: string;
  gender?: string;
  telegram?: string;
  birthDate?: string;
}

export interface StudentDetailDTO {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "STUDENT" | "TEACHER" | "ADMIN";
  groupName: string;
  enrollmentType: "Бюджет" | "Контракт";
  rollNumber?: string | null;
}

export interface StudentListItemDTO {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "STUDENT" | "TEACHER" | "ADMIN";
  groupName: string;
  course: number;
  enrollmentType: "Бюджет" | "Контракт";
  enrollmentDate: string;
  status: "Зачислен" | "Ожидает группы" | "Отчислен";
  accountStatus: "Активен" | "Временный пароль" | "Заблокирован";
  avgGrade: string;
  tempPassword?: string | null;
}

function parseGroupCourse(name: string): number {
  if (!name || name === "Не распределен") return 1;
  const dashMatch = name.match(/[-_](\d)[-_]/);
  if (dashMatch) return parseInt(dashMatch[1], 10);
  const startMatch = name.match(/^(\d)[\s-_]/);
  if (startMatch) return parseInt(startMatch[1], 10);
  const endMatch = name.match(/[\s-_](\d)$/);
  if (endMatch) return parseInt(endMatch[1], 10);
  const anyDigit = name.match(/[^\d]([1-6])[^\d]?/);
  if (anyDigit) return parseInt(anyDigit[1], 10);
  return 1;
}

export async function getStudentsAction(): Promise<StudentListItemDTO[]> {
  try {
    const session = await auth();
    const role = session?.user?.role || "STUDENT";
    const userId = session?.user?.id;

    // Filter by group if student
    let whereUserClause: Record<string, unknown> = {
      role: "STUDENT",
      isActive: true,
    };

    if (role === "STUDENT" && userId) {
      const myEnrollment = await prisma.groupStudent.findFirst({
        where: { studentId: userId },
      });
      if (myEnrollment) {
        whereUserClause = {
          role: "STUDENT",
          isActive: true,
          studentEnrollments: {
            some: {
              groupId: myEnrollment.groupId,
            },
          },
        };
      }
    }

    const list = await prisma.user.findMany({
      where: whereUserClause,
      orderBy: { name: "asc" },
      include: {
        studentEnrollments: {
          include: {
            group: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return list.map((user) => {
      const group = user.studentEnrollments[0]?.group;
      const groupName = group?.name || "Не распределен";
      const course = parseGroupCourse(groupName);

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || "—",
        role: (user.role as "STUDENT" | "TEACHER" | "ADMIN") || "STUDENT",
        groupName,
        course,
        enrollmentType: "Бюджет",
        enrollmentDate: user.createdAt.toLocaleDateString("ru-RU"),
        status: groupName === "Не распределен" ? "Ожидает группы" : "Зачислен",
        accountStatus: (user as any).tempPassword ? "Временный пароль" : "Активен",
        avgGrade: "—",
        tempPassword: (user as any).tempPassword || null,
      };
    });
  } catch (error) {
    console.error("Error fetching students list from DB:", error);
    return [];
  }
}

export async function createStudentAction(input: CreateStudentInput & { role?: "STUDENT" | "TEACHER" | "ADMIN" }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Необходима авторизация" };
    }

    const role = session.user.role || "STUDENT";
    if (role !== "ADMIN" && role !== "TEACHER") {
      return { success: false, error: "Недостаточно прав для регистрации пользователей" };
    }

    if (!input.name.trim() || !input.email.trim()) {
      return { success: false, error: "Укажите ФИО и Email" };
    }

    const cleanEmail = input.email.trim().toLowerCase();

    // Check if user with this email already exists
    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    let studentId = existing?.id;

    if (existing) {
      // Update info if provided
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          name: input.name.trim() || existing.name,
          phone: input.phone?.trim() || existing.phone,
        },
      });
    } else {
      // Hash initial password
      const rawPassword = input.password || "Lms" + Math.random().toString(36).substring(2, 8);
      const hashedPassword = await bcrypt.hash(rawPassword, 10);

      // Create user record in Prisma DB
      const student = await prisma.user.create({
        data: {
          name: input.name.trim(),
          email: cleanEmail,
          phone: input.phone?.trim() || null,
          password: hashedPassword,
          tempPassword: rawPassword,
          role: input.role || "STUDENT",
          isActive: true,
        },
      });
      studentId = student.id;
    }

    // If group name is provided, enroll student into target group
    if (studentId && input.groupName && input.groupName !== "Не распределен") {
      let group = await prisma.group.findFirst({
        where: { name: input.groupName },
      });

      if (!group) {
        let academicYear = await prisma.academicYear.findFirst({
          where: { isCurrent: true },
        });
        if (!academicYear) {
          academicYear = await prisma.academicYear.findFirst({
            orderBy: { createdAt: "desc" },
          });
        }
        if (!academicYear) {
          academicYear = await prisma.academicYear.create({
            data: {
              name: "2025-2026",
              isCurrent: true,
              startDate: new Date("2025-09-01"),
              endDate: new Date("2026-06-30"),
            },
          });
        }

        group = await prisma.group.create({
          data: {
            name: input.groupName,
            academicYearId: academicYear.id,
          },
        });
      }

      if (group) {
        const alreadyLinked = await prisma.groupStudent.findUnique({
          where: {
            groupId_studentId: {
              groupId: group.id,
              studentId,
            },
          },
        });

        if (!alreadyLinked) {
          await prisma.groupStudent.create({
            data: {
              groupId: group.id,
              studentId,
            },
          });
        }
      }
    }

    revalidatePath("/dashboard/students");
    return { success: true, studentId: studentId! };
  } catch (error) {
    console.error("Error creating student in DB:", error);
    return { success: false, error: error instanceof Error ? error.message : "Произошла ошибка" };
  }
}

export async function createBulkStudentsAction(studentsList: Array<CreateStudentInput & { role?: "STUDENT" | "TEACHER" | "ADMIN" }>) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Необходима авторизация" };
    }

    const role = session.user.role || "STUDENT";
    if (role !== "ADMIN" && role !== "TEACHER") {
      return { success: false, error: "Недостаточно прав" };
    }

    const validItems = studentsList.filter((s) => s.name && s.email);
    if (validItems.length === 0) {
      return { success: true, count: 0 };
    }

    // 1. Resolve academic year once
    let academicYear = await prisma.academicYear.findFirst({
      where: { isCurrent: true },
    });
    if (!academicYear) {
      academicYear = await prisma.academicYear.findFirst({
        orderBy: { createdAt: "desc" },
      });
    }
    if (!academicYear) {
      academicYear = await prisma.academicYear.create({
        data: {
          name: "2025-2026",
          isCurrent: true,
          startDate: new Date("2025-09-01"),
          endDate: new Date("2026-06-30"),
        },
      });
    }

    // 2. Pre-resolve or create target groups
    const uniqueGroupNames = Array.from(
      new Set(validItems.map((s) => s.groupName).filter((g): g is string => !!g && g !== "Не распределен"))
    );

    const existingGroups = await prisma.group.findMany({
      where: { name: { in: uniqueGroupNames } },
      select: { id: true, name: true },
    });
    const groupMap = new Map<string, string>(existingGroups.map((g) => [g.name, g.id]));

    for (const groupName of uniqueGroupNames) {
      if (!groupMap.has(groupName)) {
        const createdG = await prisma.group.create({
          data: {
            name: groupName,
            academicYearId: academicYear.id,
          },
        });
        groupMap.set(groupName, createdG.id);
      }
    }

    // 3. Pre-fetch existing users by email
    const cleanEmails = validItems.map((s) => s.email.trim().toLowerCase());
    const existingUsers = await prisma.user.findMany({
      where: { email: { in: cleanEmails } },
      select: { id: true, email: true },
    });
    const existingUserMap = new Map<string, string>(
      existingUsers.map((u) => [u.email.toLowerCase(), u.id])
    );

    // 4. Hash passwords in parallel
    const rawPasswords = validItems.map(
      (item) => item.password || "Lms" + Math.random().toString(36).substring(2, 8)
    );
    const hashedPasswords = await Promise.all(
      rawPasswords.map((raw) => bcrypt.hash(raw, 10))
    );

    // 5. Process in concurrent chunks of 10
    let createdCount = 0;
    const CHUNK_SIZE = 10;

    for (let i = 0; i < validItems.length; i += CHUNK_SIZE) {
      const chunk = validItems.slice(i, i + CHUNK_SIZE);
      await Promise.all(
        chunk.map(async (item, idx) => {
          const globalIdx = i + idx;
          const cleanEmail = item.email.trim().toLowerCase();
          const existingId = existingUserMap.get(cleanEmail);
          let studentId = existingId;

          if (existingId) {
            await prisma.user.update({
              where: { id: existingId },
              data: {
                name: item.name.trim(),
                phone: item.phone?.trim() || null,
              },
            });
          } else {
            const student = await prisma.user.create({
              data: {
                name: item.name.trim(),
                email: cleanEmail,
                phone: item.phone?.trim() || null,
                password: hashedPasswords[globalIdx],
                tempPassword: rawPasswords[globalIdx],
                role: item.role || "STUDENT",
                isActive: true,
              },
            });
            studentId = student.id;
          }

          const targetGroupId = item.groupName ? groupMap.get(item.groupName) : undefined;
          if (studentId && targetGroupId) {
            await prisma.groupStudent.upsert({
              where: {
                groupId_studentId: {
                  groupId: targetGroupId,
                  studentId,
                },
              },
              update: {},
              create: {
                groupId: targetGroupId,
                studentId,
              },
            });
          }

          createdCount++;
        })
      );
    }

    revalidatePath("/dashboard/students");
    revalidatePath("/dashboard/groups");
    return { success: true, count: createdCount };
  } catch (error) {
    console.error("Error bulk creating students in DB:", error);
    return { success: false, error: error instanceof Error ? error.message : "Произошла ошибка" };
  }
}

export async function getStudentByIdAction(id: string): Promise<StudentDetailDTO | null> {
  try {
    const student = await prisma.user.findUnique({
      where: { id },
      include: {
        studentEnrollments: {
          include: { group: true },
        },
      },
    });

    if (!student) {
      return null;
    }

    const groupName = student.studentEnrollments[0]?.group.name || "Не распределен";

    return {
      id: student.id,
      name: student.name,
      email: student.email,
      phone: student.phone || "",
      role: (student.role as "STUDENT" | "TEACHER" | "ADMIN") || "STUDENT",
      groupName,
      enrollmentType: "Бюджет",
      rollNumber: (student as any).rollNumber || null,
    };
  } catch (error) {
    console.error("Error fetching student by ID:", error);
    return null;
  }
}

export async function updateStudentAction(
  id: string,
  input: Partial<CreateStudentInput> & {
    role?: "STUDENT" | "TEACHER" | "ADMIN";
    rollNumber?: string | null;
  }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Необходима авторизация" };
    }

    const role = session.user.role || "STUDENT";
    if (role !== "ADMIN" && role !== "TEACHER") {
      return { success: false, error: "Недостаточно прав для редактирования" };
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Пользователь не найден в БД" };
    }

    // Update User record in Prisma DB
    await prisma.user.update({
      where: { id },
      data: {
        name: input.name?.trim() || existing.name,
        email: input.email?.trim().toLowerCase() || existing.email,
        phone: input.phone !== undefined ? input.phone.trim() || null : existing.phone,
        role: input.role || existing.role,
        ...(input.rollNumber !== undefined ? { rollNumber: input.rollNumber?.trim() || null } : {}),
      },
    });

    if (input.groupName) {
      await prisma.groupStudent.deleteMany({
        where: { studentId: id },
      });

      if (input.groupName !== "Не распределен") {
        const group = await prisma.group.findFirst({
          where: { name: input.groupName },
        });

        if (group) {
          await prisma.groupStudent.create({
            data: {
              groupId: group.id,
              studentId: id,
            },
          });
        }
      }
    }

    revalidatePath("/dashboard/students");
    revalidatePath("/dashboard/groups");
    revalidatePath("/dashboard/scholarship");
    return { success: true };
  } catch (error) {
    console.error("Error updating student:", error);
    return { success: false, error: error instanceof Error ? error.message : "Произошла ошибка" };
  }
}

export async function deleteStudentsAction(ids: string[]) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Необходима авторизация" };
    }

    const role = session.user.role || "STUDENT";
    if (role !== "ADMIN" && role !== "TEACHER") {
      return { success: false, error: "Недостаточно прав для удаления" };
    }

    if (!ids || ids.length === 0) {
      return { success: false, error: "Не выбраны студенты для удаления" };
    }

    await prisma.user.deleteMany({
      where: {
        id: { in: ids },
        role: "STUDENT",
      },
    });

    revalidatePath("/dashboard/students");
    return { success: true, count: ids.length };
  } catch (error) {
    console.error("Error deleting students from DB:", error);
    return { success: false, error: error instanceof Error ? error.message : "Произошла ошибка" };
  }
}

export async function resetPasswordAction(studentId: string, newPassword: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Необходима авторизация" };
    }

    const role = session.user.role || "STUDENT";
    if (role !== "ADMIN" && role !== "TEACHER") {
      return { success: false, error: "Недостаточно прав" };
    }

    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: "Пароль слишком короткий (минимум 6 символов)" };
    }

    const existing = await prisma.user.findUnique({ where: { id: studentId } });
    if (!existing) {
      return { success: false, error: "Пользователь не найден" };
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: studentId },
      data: { password: hashed, tempPassword: newPassword },
    });

    revalidatePath("/dashboard/students");
    revalidatePath("/dashboard/groups");
    return { success: true };
  } catch (error) {
    console.error("Error resetting password:", error);
    return { success: false, error: error instanceof Error ? error.message : "Произошла ошибка" };
  }
}

export interface StudentMonthlyStatItem {
  monthKey: string; // e.g. "2025-10"
  monthLabel: string; // e.g. "Октябрь 2025"
  attendance: {
    total: number;
    present: number;
    late: number;
    absent: number;
    excused: number;
    percent: number;
  };
  scholarship?: {
    status: "EXCELLENT" | "GOOD" | "NO_SCHOLARSHIP";
    statusLabel: string;
    averageGrade: number;
  } | null;
  submissionsCount: number;
  absencesCount: number;
}

export interface StudentSubjectStatItem {
  subjectName: string;
  teacherName?: string | null;
  totalClasses: number;
  presentClasses: number;
  absencesCount: number;
  attendancePercent: number;
  submittedAssignments: number;
  averageGrade?: string | null;
  grades: number[];
}

export interface StudentLanguageItem {
  id: string;
  language: string;
  level: "NATIVE" | "FLUENT" | "CONVERSATIONAL" | "DICTIONARY";
}

export interface StudentSkillItem {
  id: string;
  name: string;
  level: "ADVANCED" | "INTERMEDIATE" | "BASIC";
}

export interface StudentProjectItem {
  id: string;
  title: string;
  role: string;
  period: string;
  description: string;
}

export interface StudentResumeProfileDTO {
  desiredPosition: string;
  workFormat: string;
  aboutMe: string;
  githubUrl?: string;
  portfolioUrl?: string;
  telegram?: string;
  driverLicense?: string;
  languages: StudentLanguageItem[];
  hardSkills: StudentSkillItem[];
  softSkills: string[];
  projects: StudentProjectItem[];
  updatedAt?: string;
}

export interface StudentCardDTO {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  avatar?: string | null;
  rollNumber?: string | null;
  role: "STUDENT" | "TEACHER" | "ADMIN";
  roleInGroup: "STUDENT" | "MONITOR" | "DEPUTY_MONITOR";
  isDutyExempt?: boolean;
  dutyExemptReason?: string | null;
  joinedAt: string;
  createdAt: string;
  accountStatus: "Активен" | "Временный пароль";
  tempPassword?: string | null;
  groupId?: string;
  groupName: string;
  course: number;
  specialtyName?: string | null;
  curatorName?: string | null;
  attendance: {
    total: number;
    present: number;
    late: number;
    absent: number;
    excused: number;
    percent: number;
    allAbsences: Array<{
      id: string;
      date: string;
      monthKey: string;
      subjectName: string;
      status: "ABSENT" | "EXCUSED";
      comment?: string | null;
    }>;
  };
  academics: {
    submittedAssignments: number;
    gradedAssignments: number;
    averageGrade?: string | null;
    recentSubmissions: Array<{
      id: string;
      assignmentTitle: string;
      subjectName: string;
      submittedAt: string;
      monthKey: string;
      grade?: number | null;
      status: string;
    }>;
  };
  monthlyStats: StudentMonthlyStatItem[];
  subjectStats: StudentSubjectStatItem[];
  achievements: StudentAchievementDTO[];
  resumeProfile: StudentResumeProfileDTO;
}

export interface StudentAchievementDTO {
  id: string;
  studentId: string;
  title: string;
  category:
    | "OLYMPIAD"
    | "HACKATHON"
    | "CERTIFICATE"
    | "SCIENCE"
    | "SPORT"
    | "CREATIVE"
    | "VOLUNTEER"
    | "OTHER";
  level: "INTERNATIONAL" | "NATIONAL" | "REGIONAL" | "COLLEGE";
  date: string;
  dateRaw: string;
  place?: string | null;
  issuer?: string | null;
  description?: string | null;
  fileUrl?: string | null;
  isVerified: boolean;
  verifiedBy?: string | null;
  createdAt: string;
}

const RU_MONTHS: Record<string, string> = {
  "01": "Январь",
  "02": "Февраль",
  "03": "Март",
  "04": "Апрель",
  "05": "Май",
  "06": "Июнь",
  "07": "Июль",
  "08": "Август",
  "09": "Сентябрь",
  "10": "Октябрь",
  "11": "Ноябрь",
  "12": "Декабрь",
};

function formatRuMonth(monthKey: string): string {
  const [year, m] = monthKey.split("-");
  const monthName = RU_MONTHS[m] || m;
  return `${monthName} ${year}`;
}

const STUDENT_RESUMES_SETTING_KEY = "lms_student_resumes_v1";

function buildDefaultStudentResumeProfile(
  specialtyName?: string | null,
  groupName?: string | null
): StudentResumeProfileDTO {
  const spec = specialtyName || "Информационные системы и программирование";
  const isNetworkOrAdmin =
    spec.toLowerCase().includes("сет") ||
    (groupName || "").toUpperCase().includes("СИТ");

  return {
    desiredPosition: isNetworkOrAdmin
      ? "Младший системный / сетевой администратор (IT-специалист)"
      : "Junior Frontend / Web-разработчик (Стажёр)",
    workFormat: "Стажировка / Производственная практика / Полный или неполный день",
    aboutMe: `Студент Профессионального лицея №98 по направлению «${spec}». Ответственно подхожу к выполнению учебных и практических задач, быстро осваиваю новые технологии и инструменты, умею работать как самостоятельно, так и в команде.`,
    githubUrl: "",
    portfolioUrl: "",
    telegram: "",
    driverLicense: "Нет",
    languages: [
      { id: "lang-ky", language: "Кыргызский", level: "NATIVE" },
      { id: "lang-ru", language: "Русский", level: "FLUENT" },
      { id: "lang-en", language: "Английский", level: "DICTIONARY" },
    ],
    hardSkills: isNetworkOrAdmin
      ? [
          { id: "sk-1", name: "Настройка локальных сетей (LAN / Wi-Fi / TCP/IP)", level: "ADVANCED" },
          { id: "sk-2", name: "Сборка, диагностика и обслуживание ПК", level: "ADVANCED" },
          { id: "sk-3", name: "Установка и администрирование Windows / Linux", level: "INTERMEDIATE" },
          { id: "sk-4", name: "Информационная безопасность и резервное копирование", level: "INTERMEDIATE" },
          { id: "sk-5", name: "MS Office (Word, Excel, PowerPoint)", level: "ADVANCED" },
        ]
      : [
          { id: "sk-1", name: "HTML5, CSS3, адаптивная вёрстка", level: "ADVANCED" },
          { id: "sk-2", name: "JavaScript / TypeScript", level: "INTERMEDIATE" },
          { id: "sk-3", name: "React / Next.js", level: "INTERMEDIATE" },
          { id: "sk-4", name: "Git / GitHub (командная разработка)", level: "INTERMEDIATE" },
          { id: "sk-5", name: "Базы данных SQL (PostgreSQL / MySQL)", level: "BASIC" },
          { id: "sk-6", name: "Figma и работа с макетами", level: "INTERMEDIATE" },
        ],
    softSkills: [
      "Ответственность и дисциплинированность",
      "Быстрая обучаемость",
      "Умение работать в команде",
      "Пунктуальность",
      "Внимательность к деталям",
    ],
    projects: [
      {
        id: "proj-1",
        title: "Учебная и производственная практика (ПЛ №98)",
        role: isNetworkOrAdmin ? "Технический специалист / Практикант" : "Разработчик учебных проектов",
        period: "2025 – 2026 уч. год",
        description: isNetworkOrAdmin
          ? "Обслуживание компьютерных классов, настройка сетевого оборудования, установка ОС и прикладного ПО."
          : "Разработка веб-интерфейсов, вёрстка многостраничных сайтов, работа с базами данных и системами контроля версий.",
      },
    ],
  };
}

export async function getStudentCardDataAction(studentId: string): Promise<StudentCardDTO | null> {
  try {
    const session = await auth();
    if (!session?.user) return null;

    const [user, attendanceRecords, submissions, rawAchievements, resumesSetting] = await Promise.all([
      prisma.user.findUnique({
        where: { id: studentId },
        include: {
          studentEnrollments: {
            include: {
              group: {
                include: {
                  specialty: { select: { name: true } },
                  curator: { select: { name: true } },
                },
              },
            },
          },
        },
      }),
      prisma.attendance.findMany({
        where: { studentId },
        select: {
          id: true,
          status: true,
          date: true,
          comment: true,
          groupSubjectId: true,
          groupSubject: {
            select: {
              subject: { select: { name: true } },
            },
          },
        },
        orderBy: { date: "desc" },
        take: 300,
      }),
      prisma.assignmentSubmission.findMany({
        where: { studentId },
        select: {
          id: true,
          grade: true,
          status: true,
          submittedAt: true,
          assignment: {
            select: {
              title: true,
              groupSubject: {
                select: {
                  subject: { select: { name: true } },
                },
              },
            },
          },
        },
        orderBy: { submittedAt: "desc" },
        take: 50,
      }),
      prisma.studentAchievement.findMany({
        where: { studentId },
        orderBy: { date: "desc" },
      }),
      prisma.systemSetting
        ? prisma.systemSetting.findUnique({
            where: { key: STUDENT_RESUMES_SETTING_KEY },
          })
        : Promise.resolve(null),
    ]);

    if (!user) return null;

    const enrollment = user.studentEnrollments[0];
    const group = enrollment?.group;

    let roleInGroup: "STUDENT" | "MONITOR" | "DEPUTY_MONITOR" = "STUDENT";
    if (group) {
      if (group.monitorId === user.id) {
        roleInGroup = "MONITOR";
      } else if (group.deputyMonitorId === user.id) {
        roleInGroup = "DEPUTY_MONITOR";
      }
    }

    // Fetch group subjects and scholarship records if group exists
    const [groupSubjects, scholarshipRecords] = await Promise.all([
      group?.id
        ? prisma.groupSubject.findMany({
            where: { groupId: group.id },
            include: {
              subject: { select: { name: true } },
              teacher: { select: { name: true } },
            },
            orderBy: { subject: { name: "asc" } },
          })
        : [],
      group?.id && prisma.scholarshipRecord
        ? prisma.scholarshipRecord.findMany({
            where: { groupId: group.id },
            orderBy: { month: "desc" },
          })
        : [],
    ]);

    // 1. All-time attendance
    const totalAttendance = attendanceRecords.length;
    const present = attendanceRecords.filter((a) => a.status === "PRESENT").length;
    const late = attendanceRecords.filter((a) => a.status === "LATE").length;
    const absent = attendanceRecords.filter((a) => a.status === "ABSENT").length;
    const excused = attendanceRecords.filter((a) => a.status === "EXCUSED").length;
    const percent =
      totalAttendance > 0 ? Math.round(((present + late) / totalAttendance) * 100) : 100;

    const allAbsences = attendanceRecords
      .filter((a) => a.status === "ABSENT" || a.status === "EXCUSED")
      .map((a) => {
        const monthKey = a.date.toISOString().slice(0, 7);
        return {
          id: a.id,
          date: a.date.toLocaleDateString("ru-RU"),
          monthKey,
          subjectName: a.groupSubject?.subject?.name || "Дисциплина",
          status: a.status as "ABSENT" | "EXCUSED",
          comment: a.comment,
        };
      });

    // 2. Academics & Submissions
    const graded = submissions.filter((s) => typeof s.grade === "number");
    const avgGrade =
      graded.length > 0
        ? (graded.reduce((acc, curr) => acc + (curr.grade || 0), 0) / graded.length).toFixed(1)
        : null;

    const recentSubmissions = submissions.map((s) => ({
      id: s.id,
      assignmentTitle: s.assignment.title,
      subjectName: s.assignment.groupSubject.subject.name,
      submittedAt: s.submittedAt.toLocaleDateString("ru-RU"),
      monthKey: s.submittedAt.toISOString().slice(0, 7),
      grade: s.grade,
      status: s.status,
    }));

    // 3. Monthly Breakdown (По месяцам)
    const distinctMonthsSet = new Set<string>();
    attendanceRecords.forEach((a) => distinctMonthsSet.add(a.date.toISOString().slice(0, 7)));
    submissions.forEach((s) => distinctMonthsSet.add(s.submittedAt.toISOString().slice(0, 7)));
    scholarshipRecords.forEach((sr) => distinctMonthsSet.add(sr.month));

    // If empty, add current month
    if (distinctMonthsSet.size === 0) {
      const currentMonthKey = new Date().toISOString().slice(0, 7);
      distinctMonthsSet.add(currentMonthKey);
    }

    const sortedMonthKeys = Array.from(distinctMonthsSet).sort().reverse();

    const monthlyStats: StudentMonthlyStatItem[] = sortedMonthKeys.map((monthKey) => {
      const monthAttendances = attendanceRecords.filter(
        (a) => a.date.toISOString().slice(0, 7) === monthKey
      );
      const mTotal = monthAttendances.length;
      const mPresent = monthAttendances.filter((a) => a.status === "PRESENT").length;
      const mLate = monthAttendances.filter((a) => a.status === "LATE").length;
      const mAbsent = monthAttendances.filter((a) => a.status === "ABSENT").length;
      const mExcused = monthAttendances.filter((a) => a.status === "EXCUSED").length;
      const mPercent = mTotal > 0 ? Math.round(((mPresent + mLate) / mTotal) * 100) : 100;

      const mSubmissions = submissions.filter(
        (s) => s.submittedAt.toISOString().slice(0, 7) === monthKey
      ).length;

      // Scholarship for this month
      let scholarshipInfo = null;
      const monthRecord = scholarshipRecords.find((r) => r.month === monthKey);
      if (monthRecord && monthRecord.gradesData && typeof monthRecord.gradesData === "object") {
        const studentGrades = (monthRecord.gradesData as Record<string, any>)[user.id];
        if (studentGrades) {
          const status = studentGrades.status as "EXCELLENT" | "GOOD" | "NO_SCHOLARSHIP";
          const count3 = Number(studentGrades.count3) || 0;
          const count2 = Number(studentGrades.count2) || 0;
          const statusReason = typeof studentGrades.statusReason === "string" ? studentGrades.statusReason : "";

          let statusLabel = "Без стипендии";
          if (status === "EXCELLENT") {
            statusLabel = "Повышенная стипендия (на «5»)";
          } else if (status === "GOOD") {
            statusLabel = "Обычная стипендия (на «4» и «5»)";
          } else if (count3 > 0 || count2 > 0) {
            statusLabel = "Снят(а) со стипендии (есть оценка ниже 4)";
          } else if (statusReason) {
            statusLabel = statusReason;
          } else {
            statusLabel = "Стипендия не назначена";
          }
          scholarshipInfo = {
            status,
            statusLabel,
            averageGrade: typeof studentGrades.averageGrade === "number" ? studentGrades.averageGrade : 0,
          };
        }
      }

      return {
        monthKey,
        monthLabel: formatRuMonth(monthKey),
        attendance: {
          total: mTotal,
          present: mPresent,
          late: mLate,
          absent: mAbsent,
          excused: mExcused,
          percent: mPercent,
        },
        scholarship: scholarshipInfo,
        submissionsCount: mSubmissions,
        absencesCount: mAbsent + mExcused,
      };
    });

    // 4. Subject Breakdown (По дисциплинам)
    const subjectsMap = new Map<string, {
      subjectName: string;
      teacherName?: string | null;
      totalClasses: number;
      presentClasses: number;
      absencesCount: number;
      grades: number[];
      submissionsCount: number;
    }>();

    // Seed from groupSubjects if available
    groupSubjects.forEach((gs) => {
      subjectsMap.set(gs.subject.name, {
        subjectName: gs.subject.name,
        teacherName: gs.teacher?.name || null,
        totalClasses: 0,
        presentClasses: 0,
        absencesCount: 0,
        grades: [],
        submissionsCount: 0,
      });
    });

    // Add attendance data to subjects
    attendanceRecords.forEach((a) => {
      const subjName = a.groupSubject?.subject?.name || "Дисциплина";
      if (!subjectsMap.has(subjName)) {
        subjectsMap.set(subjName, {
          subjectName: subjName,
          teacherName: null,
          totalClasses: 0,
          presentClasses: 0,
          absencesCount: 0,
          grades: [],
          submissionsCount: 0,
        });
      }
      const item = subjectsMap.get(subjName)!;
      item.totalClasses++;
      if (a.status === "PRESENT" || a.status === "LATE") {
        item.presentClasses++;
      } else if (a.status === "ABSENT" || a.status === "EXCUSED") {
        item.absencesCount++;
      }
    });

    // Add submissions & grades to subjects
    submissions.forEach((s) => {
      const subjName = s.assignment?.groupSubject?.subject?.name;
      if (subjName) {
        if (!subjectsMap.has(subjName)) {
          subjectsMap.set(subjName, {
            subjectName: subjName,
            teacherName: null,
            totalClasses: 0,
            presentClasses: 0,
            absencesCount: 0,
            grades: [],
            submissionsCount: 0,
          });
        }
        const item = subjectsMap.get(subjName)!;
        item.submissionsCount++;
        if (typeof s.grade === "number") {
          item.grades.push(s.grade);
        }
      }
    });

    const subjectStats: StudentSubjectStatItem[] = Array.from(subjectsMap.values()).map((subj) => {
      const avg =
        subj.grades.length > 0
          ? (subj.grades.reduce((a, b) => a + b, 0) / subj.grades.length).toFixed(1)
          : null;
      const attPercent =
        subj.totalClasses > 0
          ? Math.round((subj.presentClasses / subj.totalClasses) * 100)
          : 100;

      return {
        subjectName: subj.subjectName,
        teacherName: subj.teacherName,
        totalClasses: subj.totalClasses,
        presentClasses: subj.presentClasses,
        absencesCount: subj.absencesCount,
        attendancePercent: attPercent,
        submittedAssignments: subj.submissionsCount,
        averageGrade: avg,
        grades: subj.grades,
      };
    });

    let resumeProfile: StudentResumeProfileDTO = buildDefaultStudentResumeProfile(
      group?.specialty?.name,
      group?.name
    );

    if (resumesSetting?.value) {
      try {
        const parsed = JSON.parse(resumesSetting.value);
        if (parsed && typeof parsed === "object" && parsed[studentId]) {
          resumeProfile = {
            ...resumeProfile,
            ...parsed[studentId],
          };
        }
      } catch {}
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      rollNumber: (user as any).rollNumber || null,
      role: (user.role as "STUDENT" | "TEACHER" | "ADMIN") || "STUDENT",
      roleInGroup,
      isDutyExempt: user.isDutyExempt,
      dutyExemptReason: user.dutyExemptReason,
      joinedAt: enrollment
        ? new Date(enrollment.joinedAt).toLocaleDateString("ru-RU")
        : user.createdAt.toLocaleDateString("ru-RU"),
      createdAt: user.createdAt.toLocaleDateString("ru-RU"),
      accountStatus: user.tempPassword ? "Временный пароль" : "Активен",
      tempPassword: user.tempPassword || null,
      groupId: group?.id,
      groupName: group?.name || "Не распределен",
      course: group?.course ?? 1,
      specialtyName: group?.specialty?.name || null,
      curatorName: group?.curator?.name || null,
      attendance: {
        total: totalAttendance,
        present,
        late,
        absent,
        excused,
        percent,
        allAbsences,
      },
      academics: {
        submittedAssignments: submissions.length,
        gradedAssignments: graded.length,
        averageGrade: avgGrade,
        recentSubmissions,
      },
      monthlyStats,
      subjectStats,
      achievements: rawAchievements.map((a) => ({
        id: a.id,
        studentId: a.studentId,
        title: a.title,
        category: a.category as StudentAchievementDTO["category"],
        level: a.level as StudentAchievementDTO["level"],
        date: a.date.toLocaleDateString("ru-RU"),
        dateRaw: a.date.toISOString().slice(0, 10),
        place: a.place,
        issuer: a.issuer,
        description: a.description,
        fileUrl: a.fileUrl,
        isVerified: a.isVerified,
        verifiedBy: a.verifiedBy,
        createdAt: a.createdAt.toLocaleDateString("ru-RU"),
      })),
      resumeProfile,
    };
  } catch (error) {
    console.error("getStudentCardDataAction error:", error);
    return null;
  }
}

export async function saveStudentResumeProfileAction(
  studentId: string,
  profile: StudentResumeProfileDTO
) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Не авторизован" };
  }

  const isSelf = session.user.id === studentId;
  const isPrivileged =
    session.user.role === "ADMIN" ||
    session.user.role === "TEACHER" ||
    session.user.role === "ADMINISTRATION";

  if (!isSelf && !isPrivileged) {
    return { success: false, error: "Недостаточно прав для сохранения резюме" };
  }

  try {
    let allResumes: Record<string, StudentResumeProfileDTO> = {};
    const existingSetting = await prisma.systemSetting.findUnique({
      where: { key: STUDENT_RESUMES_SETTING_KEY },
    });
    if (existingSetting?.value) {
      try {
        const parsed = JSON.parse(existingSetting.value);
        if (parsed && typeof parsed === "object") {
          allResumes = parsed;
        }
      } catch {}
    }

    const updatedProfile: StudentResumeProfileDTO = {
      ...profile,
      updatedAt: new Date().toLocaleDateString("ru-RU"),
    };
    allResumes[studentId] = updatedProfile;

    await prisma.systemSetting.upsert({
      where: { key: STUDENT_RESUMES_SETTING_KEY },
      update: { value: JSON.stringify(allResumes) },
      create: {
        key: STUDENT_RESUMES_SETTING_KEY,
        value: JSON.stringify(allResumes),
      },
    });

    revalidatePath(`/dashboard/students/${studentId}`);
    return { success: true, resumeProfile: updatedProfile };
  } catch (err) {
    console.error("saveStudentResumeProfileAction error:", err);
    return { success: false, error: "Ошибка сохранения резюме в БД" };
  }
}

/**
 * Add an achievement to the student's portfolio
 */
export async function addStudentAchievementAction(
  studentId: string,
  data: {
    title: string;
    category: StudentAchievementDTO["category"];
    level: StudentAchievementDTO["level"];
    date: string;
    place?: string;
    issuer?: string;
    description?: string;
    fileUrl?: string;
  }
) {
  const session = await auth();
  if (!session?.user) throw new Error("Не авторизован");

  const isSelf = session.user.id === studentId;
  const isPrivileged = session.user.role === "ADMIN" || session.user.role === "TEACHER";
  if (!isSelf && !isPrivileged) throw new Error("Недостаточно прав для добавления");

  const achievement = await prisma.studentAchievement.create({
    data: {
      studentId,
      title: data.title.trim(),
      category: data.category,
      level: data.level,
      date: new Date(data.date),
      place: data.place?.trim() || null,
      issuer: data.issuer?.trim() || null,
      description: data.description?.trim() || null,
      fileUrl: data.fileUrl?.trim() || null,
      isVerified: isPrivileged,
      verifiedBy: isPrivileged ? session.user.name || session.user.email : null,
    },
  });

  revalidatePath(`/dashboard/students/${studentId}`);
  return { success: true, achievement };
}

/**
 * Update an existing achievement
 */
export async function updateStudentAchievementAction(
  achievementId: string,
  studentId: string,
  data: {
    title: string;
    category: StudentAchievementDTO["category"];
    level: StudentAchievementDTO["level"];
    date: string;
    place?: string;
    issuer?: string;
    description?: string;
    fileUrl?: string;
  }
) {
  const session = await auth();
  if (!session?.user) throw new Error("Не авторизован");

  const isPrivileged = session.user.role === "ADMIN" || session.user.role === "TEACHER";
  const existing = await prisma.studentAchievement.findUnique({
    where: { id: achievementId },
    select: { studentId: true },
  });

  if (!existing) throw new Error("Достижение не найдено");
  if (existing.studentId !== session.user.id && !isPrivileged) {
    throw new Error("Недостаточно прав для редактирования");
  }

  const updated = await prisma.studentAchievement.update({
    where: { id: achievementId },
    data: {
      title: data.title.trim(),
      category: data.category,
      level: data.level,
      date: new Date(data.date),
      place: data.place?.trim() || null,
      issuer: data.issuer?.trim() || null,
      description: data.description?.trim() || null,
      fileUrl: data.fileUrl?.trim() || null,
    },
  });

  revalidatePath(`/dashboard/students/${studentId}`);
  return { success: true, achievement: updated };
}

/**
 * Delete an achievement
 */
export async function deleteStudentAchievementAction(achievementId: string, studentId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Не авторизован");

  const isPrivileged = session.user.role === "ADMIN" || session.user.role === "TEACHER";
  const existing = await prisma.studentAchievement.findUnique({
    where: { id: achievementId },
    select: { studentId: true },
  });

  if (!existing) throw new Error("Достижение не найдено");
  if (existing.studentId !== session.user.id && !isPrivileged) {
    throw new Error("Недостаточно прав для удаления");
  }

  await prisma.studentAchievement.delete({ where: { id: achievementId } });
  revalidatePath(`/dashboard/students/${studentId}`);
  return { success: true };
}

/**
 * Toggle verification of an achievement by curator/teacher/admin
 */
export async function toggleVerifyAchievementAction(achievementId: string, studentId: string) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
    throw new Error("Только куратор или администратор может подтверждать достижения");
  }

  const existing = await prisma.studentAchievement.findUnique({
    where: { id: achievementId },
  });
  if (!existing) throw new Error("Достижение не найдено");

  const updated = await prisma.studentAchievement.update({
    where: { id: achievementId },
    data: {
      isVerified: !existing.isVerified,
      verifiedBy: !existing.isVerified ? session.user.name || session.user.email : null,
    },
  });

  revalidatePath(`/dashboard/students/${studentId}`);
  return { success: true, isVerified: updated.isVerified };
}


