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
        accountStatus: "Активен",
        avgGrade: "—",
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
  } catch (error: any) {
    console.error("Error creating student in DB:", error);
    return { success: false, error: error.message || "Ошибка при сохранении в БД" };
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

    let createdCount = 0;

    for (const item of studentsList) {
      if (!item.name || !item.email) continue;
      const res = await createStudentAction(item);
      if (res.success) {
        createdCount++;
      }
    }

    revalidatePath("/dashboard/students");
    return { success: true, count: createdCount };
  } catch (error: any) {
    console.error("Error bulk creating students in DB:", error);
    return { success: false, error: error.message || "Ошибка при массовом сохранении в БД" };
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
    };
  } catch (error) {
    console.error("Error fetching student by ID:", error);
    return null;
  }
}

export async function updateStudentAction(
  id: string,
  input: Partial<CreateStudentInput> & { role?: "STUDENT" | "TEACHER" | "ADMIN" }
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
    return { success: true };
  } catch (error: any) {
    console.error("Error updating student:", error);
    return { success: false, error: error.message || "Ошибка при обновлении студента" };
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
  } catch (error: any) {
    console.error("Error deleting students from DB:", error);
    return { success: false, error: error.message || "Ошибка при удалении из БД" };
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
      data: { password: hashed },
    });

    revalidatePath("/dashboard/students");
    return { success: true };
  } catch (error: any) {
    console.error("Error resetting password:", error);
    return { success: false, error: error.message || "Ошибка при смене пароля" };
  }
}

