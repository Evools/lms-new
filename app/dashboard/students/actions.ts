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

export async function getStudentsAction(): Promise<StudentListItemDTO[]> {
  try {
    const list = await prisma.user.findMany({
      where: { role: "STUDENT" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        studentEnrollments: {
          take: 1,
          select: {
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
      const courseMatch = groupName.match(/-(\d)-/);
      const course = courseMatch ? parseInt(courseMatch[1], 10) : 1;

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

    if (existing) {
      return { success: false, error: "Пользователь с такой почтой уже существует" };
    }

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

    // If group name is provided, enroll student into target group
    if (input.groupName && input.groupName !== "Не распределен") {
      const group = await prisma.group.findFirst({
        where: { name: input.groupName },
      });

      if (group) {
        await prisma.groupStudent.create({
          data: {
            groupId: group.id,
            studentId: student.id,
          },
        });
      }
    }

    revalidatePath("/dashboard/students");
    return { success: true, studentId: student.id };
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
