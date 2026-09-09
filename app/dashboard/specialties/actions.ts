"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export interface SpecialtyDTO {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  groupsCount: number;
  createdAt: string;
}

export interface SpecialtyOptionDTO {
  id: string;
  name: string;
  code?: string | null;
}

export async function getSpecialtiesAction(): Promise<SpecialtyDTO[]> {
  try {
    const specialties = await prisma.specialty.findMany({
      orderBy: [{ code: "asc" }, { name: "asc" }],
      include: {
        _count: { select: { groups: true } },
      },
    });

    return specialties.map((s) => ({
      id: s.id,
      name: s.name,
      code: s.code,
      description: s.description,
      groupsCount: s._count.groups,
      createdAt: s.createdAt.toLocaleDateString("ru-RU"),
    }));
  } catch (error) {
    console.error("Failed to fetch specialties:", error);
    return [];
  }
}

export async function getSpecialtiesListAction(): Promise<SpecialtyOptionDTO[]> {
  try {
    const specialties = await prisma.specialty.findMany({
      orderBy: [{ code: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        code: true,
      },
    });
    return specialties;
  } catch (error) {
    console.error("Failed to fetch specialties list:", error);
    return [];
  }
}

export async function createSpecialtyAction(data: {
  name: string;
  code?: string;
  description?: string;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Только администратор может создавать специальности" };
  }

  const cleanName = data.name.trim();
  const cleanCode = data.code?.trim() || null;
  const cleanDesc = data.description?.trim() || null;

  if (!cleanName) {
    return { success: false, error: "Название специальности обязательно" };
  }

  try {
    const existingByName = await prisma.specialty.findFirst({
      where: { name: cleanName },
    });
    if (existingByName) {
      return { success: false, error: `Специальность «${cleanName}» уже существует` };
    }

    if (cleanCode) {
      const existingByCode = await prisma.specialty.findFirst({
        where: { code: cleanCode },
      });
      if (existingByCode) {
        return { success: false, error: `Специальность с кодом «${cleanCode}» уже существует` };
      }
    }

    const created = await prisma.specialty.create({
      data: {
        name: cleanName,
        code: cleanCode,
        description: cleanDesc,
      },
    });

    revalidatePath("/dashboard/specialties");
    revalidatePath("/dashboard/groups");
    revalidatePath("/dashboard/groups/new");

    return {
      success: true,
      specialty: {
        id: created.id,
        name: created.name,
        code: created.code,
      },
    };
  } catch (error) {
    console.error("Failed to create specialty:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Ошибка при создании специальности в БД",
    };
  }
}

export async function updateSpecialtyAction(
  id: string,
  data: {
    name: string;
    code?: string;
    description?: string;
  }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Только администратор может редактировать специальности" };
  }

  const cleanName = data.name.trim();
  const cleanCode = data.code?.trim() || null;
  const cleanDesc = data.description?.trim() || null;

  if (!cleanName) {
    return { success: false, error: "Название специальности обязательно" };
  }

  try {
    const existingName = await prisma.specialty.findFirst({
      where: {
        name: cleanName,
        NOT: { id },
      },
    });
    if (existingName) {
      return { success: false, error: `Специальность с таким названием уже существует` };
    }

    if (cleanCode) {
      const existingCode = await prisma.specialty.findFirst({
        where: {
          code: cleanCode,
          NOT: { id },
        },
      });
      if (existingCode) {
        return { success: false, error: `Специальность с кодом «${cleanCode}» уже существует` };
      }
    }

    await prisma.specialty.update({
      where: { id },
      data: {
        name: cleanName,
        code: cleanCode,
        description: cleanDesc,
      },
    });

    revalidatePath("/dashboard/specialties");
    revalidatePath("/dashboard/groups");
    return { success: true };
  } catch (error) {
    console.error("Failed to update specialty:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Ошибка при обновлении специальности",
    };
  }
}

export async function deleteSpecialtyAction(id: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Только администратор может удалять специальности" };
  }

  try {
    const count = await prisma.group.count({
      where: { specialtyId: id },
    });

    if (count > 0) {
      return {
        success: false,
        error: `Невозможно удалить специальность: к ней привязано групп — ${count}. Сначала отвяжите или перенесите группы.`,
      };
    }

    await prisma.specialty.delete({
      where: { id },
    });

    revalidatePath("/dashboard/specialties");
    revalidatePath("/dashboard/groups");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete specialty:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Ошибка при удалении специальности",
    };
  }
}
