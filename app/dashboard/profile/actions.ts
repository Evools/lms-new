"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export interface UserProfileDetailsDTO {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: "ADMIN" | "TEACHER" | "STUDENT";
  avatar?: string | null;
  createdAt: string;
  // Extra role-specific stats
  groupName?: string | null;
  submittedAssignmentsCount?: number;
  attendancePercent?: number;
  createdMaterialsCount?: number;
  createdAssignmentsCount?: number;
}

export async function getProfileDataAction(): Promise<UserProfileDetailsDTO | null> {
  try {
    const session = await auth();
    if (!session?.user) return null;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        studentEnrollments: {
          include: { group: { select: { name: true } } },
        },
        _count: {
          select: {
            submissions: true,
            createdMaterials: true,
            createdAssignments: true,
          },
        },
      },
    });

    if (!user) return null;

    let attendancePercent = 100;
    if (user.role === "STUDENT") {
      const totalAttendances = await prisma.attendance.count({
        where: { studentId: user.id },
      });
      const presentCount = await prisma.attendance.count({
        where: { studentId: user.id, status: { in: ["PRESENT", "LATE"] } },
      });
      if (totalAttendances > 0) {
        attendancePercent = Math.round((presentCount / totalAttendances) * 100);
      }
    }

    const groupStudent = user.studentEnrollments[0];

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
      createdAt: user.createdAt.toISOString(),
      groupName: groupStudent?.group?.name || null,
      submittedAssignmentsCount: user._count.submissions,
      attendancePercent: user.role === "STUDENT" ? attendancePercent : undefined,
      createdMaterialsCount: user._count.createdMaterials,
      createdAssignmentsCount: user._count.createdAssignments,
    };
  } catch (error) {
    console.error("getProfileDataAction error:", error);
    return null;
  }
}

export async function updateProfileDetailsAction(data: {
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
}) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Не авторизован" };

  try {
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    if (!currentUser) return { success: false, error: "Пользователь не найден" };

    const isStudent = currentUser.role === "STUDENT";

    // If student, name cannot be changed (keep existing name from DB)
    let updatedName = currentUser.name;
    if (!isStudent && data.name) {
      if (!data.name.trim()) return { success: false, error: "Укажите имя и фамилию" };
      updatedName = data.name.trim();
    }

    // Validate email if provided
    let updatedEmail = currentUser.email;
    if (data.email && data.email.trim()) {
      const cleanedEmail = data.email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanedEmail)) {
        return { success: false, error: "Некорректный формат email адреса" };
      }

      if (cleanedEmail !== currentUser.email) {
        // Check uniqueness
        const existingUser = await prisma.user.findFirst({
          where: {
            email: cleanedEmail,
            id: { not: currentUser.id },
          },
        });
        if (existingUser) {
          return { success: false, error: "Этот email уже зарегистрирован в системе" };
        }
        updatedEmail = cleanedEmail;
      }
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: updatedName,
        email: updatedEmail,
        phone: data.phone?.trim() || null,
        avatar: data.avatar?.trim() || null,
      },
    });

    revalidatePath("/dashboard/profile");
    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateProfilePasswordAction(data: {
  currentPassword: string;
  newPassword: string;
}) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Не авторизован" };
  if (data.newPassword.length < 6) {
    return { success: false, error: "Новый пароль должен быть не менее 6 символов" };
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return { success: false, error: "Пользователь не найден" };

    const valid = await bcrypt.compare(data.currentPassword, user.password);
    if (!valid) return { success: false, error: "Текущий пароль указан неверно" };

    const hashed = await bcrypt.hash(data.newPassword, 12);
    await prisma.user.update({ where: { id: session.user.id }, data: { password: hashed } });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
