"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export interface UserProfileDTO {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  avatar?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface AcademicYearDTO {
  id: string;
  name: string;
  isCurrent: boolean;
  startDate: string;
  endDate: string;
}

export interface SystemStatsDTO {
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalAdmins: number;
  totalGroups: number;
  totalSubjects: number;
  totalMaterials: number;
  totalAssignments: number;
  totalDocuments: number;
}

export interface SystemConfigDTO {
  institutionName: string;
  supportEmail: string;
  supportPhone: string;
  address: string;
  defaultMaxScore: string;
  lessonDurationMinutes: string;
  allowLateSubmissions: boolean;
  allowSelfRegistration: boolean;
  allowedEmailDomain: string;
  maxFileUploadMb: string;
  globalNoticeTitle: string;
  globalNoticeContent: string;
  showGlobalNotice: boolean;
}

const DEFAULT_CONFIG: SystemConfigDTO = {
  institutionName: "Лицей LMS",
  supportEmail: "support@lyceum.ru",
  supportPhone: "+996 (312) 12-34-56",
  address: "г. Бишкек, ул. Ибраимова, д. 115",
  defaultMaxScore: "100",
  lessonDurationMinutes: "45",
  allowLateSubmissions: true,
  allowSelfRegistration: true,
  allowedEmailDomain: "",
  maxFileUploadMb: "50",
  globalNoticeTitle: "",
  globalNoticeContent: "",
  showGlobalNotice: false,
};

export async function getSettingsDataAction() {
  try {
    const session = await auth();
    if (!session?.user) return null;

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatar: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!currentUser) return null;

    const profile: UserProfileDTO = {
      ...currentUser,
      createdAt: currentUser.createdAt.toISOString(),
    };

    // Admin-only data
    let allUsers: UserProfileDTO[] = [];
    let academicYears: AcademicYearDTO[] = [];
    let systemStats: SystemStatsDTO | null = null;
    let systemConfig: SystemConfigDTO = { ...DEFAULT_CONFIG };

    // Fetch system settings for all or admin
    let settingsList: { key: string; value: string }[] = [];
    try {
      if (prisma.systemSetting) {
        settingsList = await prisma.systemSetting.findMany();
      }
    } catch {}
    const settingsMap = new Map(settingsList.map((s) => [s.key, s.value]));
    const getBool = (key: string, fallback: boolean) =>
      settingsMap.has(key) ? settingsMap.get(key) === "true" : fallback;
    const getStr = (key: string, fallback: string) =>
      settingsMap.get(key) ?? fallback;

    systemConfig = {
      institutionName: getStr("institutionName", DEFAULT_CONFIG.institutionName),
      supportEmail: getStr("supportEmail", DEFAULT_CONFIG.supportEmail),
      supportPhone: getStr("supportPhone", DEFAULT_CONFIG.supportPhone),
      address: getStr("address", DEFAULT_CONFIG.address),
      defaultMaxScore: getStr("defaultMaxScore", DEFAULT_CONFIG.defaultMaxScore),
      lessonDurationMinutes: getStr("lessonDurationMinutes", DEFAULT_CONFIG.lessonDurationMinutes),
      allowLateSubmissions: getBool("allowLateSubmissions", DEFAULT_CONFIG.allowLateSubmissions),
      allowSelfRegistration: getBool("allowSelfRegistration", DEFAULT_CONFIG.allowSelfRegistration),
      allowedEmailDomain: getStr("allowedEmailDomain", DEFAULT_CONFIG.allowedEmailDomain),
      maxFileUploadMb: getStr("maxFileUploadMb", DEFAULT_CONFIG.maxFileUploadMb),
      globalNoticeTitle: getStr("globalNoticeTitle", DEFAULT_CONFIG.globalNoticeTitle),
      globalNoticeContent: getStr("globalNoticeContent", DEFAULT_CONFIG.globalNoticeContent),
      showGlobalNotice: getBool("showGlobalNotice", DEFAULT_CONFIG.showGlobalNotice),
    };

    if (session.user.role === "ADMIN") {
      const users = await prisma.user.findMany({
        select: {
          id: true, name: true, email: true, phone: true,
          role: true, avatar: true, isActive: true, createdAt: true,
        },
        orderBy: [{ role: "asc" }, { name: "asc" }],
      });

      const years = await prisma.academicYear.findMany({ orderBy: { startDate: "desc" } });

      const [
        totalUsers, totalStudents, totalTeachers, totalAdmins,
        totalGroups, totalSubjects, totalMaterials, totalAssignments, totalDocuments
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { role: "STUDENT" } }),
        prisma.user.count({ where: { role: "TEACHER" } }),
        prisma.user.count({ where: { role: "ADMIN" } }),
        prisma.group.count(),
        prisma.subject.count(),
        prisma.material.count(),
        prisma.assignment.count(),
        prisma.document.count(),
      ]);

      allUsers = users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }));

      academicYears = years.map((y) => ({
        id: y.id,
        name: y.name,
        isCurrent: y.isCurrent,
        startDate: y.startDate.toISOString(),
        endDate: y.endDate.toISOString(),
      }));

      systemStats = {
        totalUsers,
        totalStudents,
        totalTeachers,
        totalAdmins,
        totalGroups,
        totalSubjects,
        totalMaterials,
        totalAssignments,
        totalDocuments,
      };
    }

    return {
      profile,
      allUsers,
      academicYears,
      systemStats,
      systemConfig,
      role: session.user.role as string,
    };
  } catch (error) {
    console.error("getSettingsDataAction error:", error);
    return null;
  }
}

/** Admin: Update system configuration */
export async function updateSystemConfigAction(data: Partial<SystemConfigDTO>) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Только администратор может изменять системные настройки" };
  }

  try {
    const entries = Object.entries(data);
    for (const [key, val] of entries) {
      if (val !== undefined) {
        await prisma.systemSetting.upsert({
          where: { key },
          update: { value: String(val) },
          create: { key, value: String(val) },
        });
      }
    }

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/** Update current user profile */
export async function updateProfileAction(data: {
  name: string;
  phone?: string;
  avatar?: string;
}) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Не авторизован" };
  if (!data.name.trim()) return { success: false, error: "Укажите имя" };

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: data.name.trim(),
        phone: data.phone?.trim() || null,
        avatar: data.avatar?.trim() || null,
      },
    });
    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/** Change current user password */
export async function changePasswordAction(data: {
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
    if (!valid) return { success: false, error: "Текущий пароль неверный" };

    const hashed = await bcrypt.hash(data.newPassword, 12);
    await prisma.user.update({ where: { id: session.user.id }, data: { password: hashed } });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/** Admin: toggle user active status */
export async function toggleUserActiveAction(userId: string, isActive: boolean) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Только администратор" };
  }
  if (userId === session.user.id) {
    return { success: false, error: "Нельзя деактивировать себя" };
  }

  try {
    await prisma.user.update({ where: { id: userId }, data: { isActive } });
    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/** Admin: change user role */
export async function changeUserRoleAction(userId: string, role: "ADMIN" | "TEACHER" | "STUDENT") {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Только администратор" };
  }
  if (userId === session.user.id) {
    return { success: false, error: "Нельзя изменить свою роль" };
  }

  try {
    await prisma.user.update({ where: { id: userId }, data: { role } });
    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/** Admin: update user details */
export async function updateUserAction(
  userId: string,
  data: {
    name: string;
    email: string;
    role: "ADMIN" | "TEACHER" | "STUDENT";
    phone?: string;
    password?: string;
  }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Только администратор может редактировать данные сотрудников" };
  }
  if (!data.name.trim() || !data.email.trim()) {
    return { success: false, error: "Укажите имя и email" };
  }

  try {
    const cleanEmail = data.email.trim().toLowerCase();
    const existing = await prisma.user.findFirst({
      where: {
        email: cleanEmail,
        id: { not: userId },
      },
    });
    if (existing) {
      return { success: false, error: "Этот email уже зарегистрирован другим пользователем" };
    }

    const updateData: Record<string, unknown> = {
      name: data.name.trim(),
      email: cleanEmail,
      role: data.role,
      phone: data.phone?.trim() || null,
    };

    if (data.password && data.password.trim().length >= 6) {
      updateData.password = await bcrypt.hash(data.password.trim(), 12);
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/** Admin: create new user */
export async function createUserAction(data: {
  name: string;
  email: string;
  password: string;
  role: "ADMIN" | "TEACHER" | "STUDENT";
  phone?: string;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Только администратор" };
  }
  if (!data.name.trim() || !data.email.trim() || !data.password) {
    return { success: false, error: "Заполните все поля" };
  }
  if (data.password.length < 6) {
    return { success: false, error: "Пароль минимум 6 символов" };
  }

  try {
    const exists = await prisma.user.findUnique({ where: { email: data.email.trim().toLowerCase() } });
    if (exists) return { success: false, error: "Пользователь с таким email уже существует" };

    const hashed = await bcrypt.hash(data.password, 12);
    await prisma.user.create({
      data: {
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        password: hashed,
        role: data.role,
        phone: data.phone?.trim() || null,
      },
    });
    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/** Admin: bulk create users from Excel / CSV */
export async function createBulkUsersAction(
  users: Array<{
    name: string;
    email: string;
    role: "ADMIN" | "TEACHER" | "STUDENT";
    phone?: string;
    password?: string;
  }>
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Только администратор" };
  }
  if (!users || users.length === 0) {
    return { success: false, error: "Список пользователей пуст" };
  }

  try {
    let createdCount = 0;
    for (const u of users) {
      if (!u.name?.trim() || !u.email?.trim()) continue;
      const cleanEmail = u.email.trim().toLowerCase();

      const exists = await prisma.user.findUnique({ where: { email: cleanEmail } });
      if (exists) continue;

      const rawPass = u.password && u.password.length >= 6 ? u.password : "Lms2026!";
      const hashed = await bcrypt.hash(rawPass, 10);

      await prisma.user.create({
        data: {
          name: u.name.trim(),
          email: cleanEmail,
          password: hashed,
          role: u.role || "STUDENT",
          phone: u.phone?.trim() || null,
        },
      });
      createdCount++;
    }

    revalidatePath("/dashboard/settings");
    return { success: true, count: createdCount };
  } catch (error: any) {
    return { success: false, error: error.message || "Ошибка при массовом импорте" };
  }
}

/** Admin: update academic year */
export async function setCurrentAcademicYearAction(yearId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Только администратор" };
  }

  try {
    await prisma.academicYear.updateMany({ data: { isCurrent: false } });
    await prisma.academicYear.update({ where: { id: yearId }, data: { isCurrent: true } });
    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/** Admin: create academic year */
export async function createAcademicYearAction(data: {
  name: string;
  startDate: string;
  endDate: string;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Только администратор" };
  }

  try {
    const exists = await prisma.academicYear.findUnique({ where: { name: data.name.trim() } });
    if (exists) return { success: false, error: "Учебный год уже существует" };

    await prisma.academicYear.create({
      data: {
        name: data.name.trim(),
        isCurrent: false,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      },
    });
    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/** Admin: update academic year */
export async function updateAcademicYearAction(
  yearId: string,
  data: {
    name: string;
    startDate: string;
    endDate: string;
  }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Только администратор" };
  }

  try {
    await prisma.academicYear.update({
      where: { id: yearId },
      data: {
        name: data.name.trim(),
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      },
    });
    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/** Admin: delete academic year */
export async function deleteAcademicYearAction(yearId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Только администратор" };
  }

  try {
    const year = await prisma.academicYear.findUnique({ where: { id: yearId } });
    if (!year) return { success: false, error: "Учебный год не найден" };

    if (year.isCurrent) {
      return { success: false, error: "Нельзя удалить текущий учебный год" };
    }

    await prisma.academicYear.delete({ where: { id: yearId } });
    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
