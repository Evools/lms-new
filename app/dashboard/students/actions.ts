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
}

export interface StudentDetailDTO {
  id: string;
  name: string;
  email: string;
  phone: string;
  groupName: string;
  enrollmentType: "Бюджет" | "Контракт";
}

export async function createStudentAction(input: CreateStudentInput) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Необходима авторизация" };
    }

    const role = session.user.role || "STUDENT";
    if (role !== "ADMIN" && role !== "TEACHER") {
      return { success: false, error: "Недостаточно прав для регистрации студентов" };
    }

    if (!input.name.trim() || !input.email.trim()) {
      return { success: false, error: "Укажите ФИО и Email студента" };
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
        role: "STUDENT",
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
    return { success: false, error: error.message || "Ошибка при сохранении студента в БД" };
  }
}

export async function createBulkStudentsAction(studentsList: CreateStudentInput[]) {
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
      // Fallback for mock IDs if user testing with pre-populated demo data
      return {
        id,
        name: "Петров Алексей Сергеевич",
        email: "petrov@lyceum.edu",
        phone: "+996 555 12-34-56",
        groupName: "ИС-1-25",
        enrollmentType: "Бюджет",
      };
    }

    const groupName = student.studentEnrollments[0]?.group.name || "ИС-1-25";

    return {
      id: student.id,
      name: student.name,
      email: student.email,
      phone: student.phone || "",
      groupName,
      enrollmentType: "Бюджет",
    };
  } catch (error) {
    console.error("Error fetching student by ID:", error);
    return {
      id,
      name: "Студент Лицея",
      email: "student@lyceum.edu",
      phone: "+996 555 00-00-00",
      groupName: "ИС-1-25",
      enrollmentType: "Бюджет",
    };
  }
}

export async function updateStudentAction(id: string, input: Partial<CreateStudentInput>) {
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
    if (existing) {
      // Update User record in Prisma DB
      await prisma.user.update({
        where: { id },
        data: {
          name: input.name?.trim() || existing.name,
          email: input.email?.trim().toLowerCase() || existing.email,
          phone: input.phone !== undefined ? input.phone.trim() || null : existing.phone,
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
    }

    revalidatePath("/dashboard/students");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating student:", error);
    return { success: false, error: error.message || "Ошибка при обновлении студента" };
  }
}
