import crypto from "crypto";
import { ImageVisibility } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  ALLOWED_IMAGE_MIMES,
  MAX_IMAGE_SIZE_BYTES,
  ImageCategory,
  detectImageFormatFromBuffer,
  getImageQuotaForRole,
  normalizeImageCategory,
  sanitizeImageTitle,
} from "./validation";
import {
  deleteImageFromStorage,
  readImageFromStorage,
  saveImageToStorage,
} from "./storage";

export interface ImageQuotaUsage {
  usedBytes: number;
  usedFiles: number;
  maxBytes: number | null;
  maxFiles: number | null;
}

export async function getUserImageQuotaUsage(
  userId: string,
  userRole: string
): Promise<ImageQuotaUsage> {
  const limits = getImageQuotaForRole(userRole);
  const agg = await prisma.storedImage.aggregate({
    where: { uploadedById: userId },
    _sum: { size: true },
    _count: { id: true },
  });

  return {
    usedBytes: agg._sum.size ?? 0,
    usedFiles: agg._count.id ?? 0,
    maxBytes: limits.maxBytes,
    maxFiles: limits.maxFiles,
  };
}

export interface StoredImageDTO {
  id: string;
  url: string;
  title: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  visibility: ImageVisibility;
  category: string;
  uploadedById: string;
  uploadedByName?: string;
  createdAt: string;
}

export function getImageServeUrl(imageId: string): string {
  return `/api/images/${imageId}`;
}

export function mapStoredImageToDTO(img: {
  id: string;
  title: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  visibility: ImageVisibility;
  category: string;
  uploadedById: string;
  createdAt: Date;
  uploadedBy?: { name: string } | null;
}): StoredImageDTO {
  return {
    id: img.id,
    url: getImageServeUrl(img.id),
    title: img.title,
    originalName: img.originalName,
    fileName: img.fileName,
    mimeType: img.mimeType,
    size: img.size,
    width: img.width,
    height: img.height,
    visibility: img.visibility,
    category: img.category,
    uploadedById: img.uploadedById,
    uploadedByName: img.uploadedBy?.name,
    createdAt: img.createdAt.toISOString(),
  };
}

export async function uploadImageService(params: {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  title?: string;
  category?: string;
  visibility?: ImageVisibility;
  uploadedById: string;
  userRole: string;
}): Promise<{ success: true; image: StoredImageDTO } | { success: false; error: string; status: number }> {
  const { buffer, originalName, mimeType, uploadedById, userRole } = params;

  if (!buffer || buffer.length === 0) {
    return { success: false, error: "Файл пуст или поврежден", status: 400 };
  }

  if (buffer.length > MAX_IMAGE_SIZE_BYTES) {
    return {
      success: false,
      error: `Размер файла (${(buffer.length / (1024 * 1024)).toFixed(1)} МБ) превышает лимит 5 МБ`,
      status: 400,
    };
  }

  if (mimeType && !ALLOWED_IMAGE_MIMES.has(mimeType.toLowerCase())) {
    return {
      success: false,
      error: "Неподдерживаемый тип файла. Разрешены JPG, PNG, WEBP, GIF и AVIF.",
      status: 400,
    };
  }

  // Verify actual binary magic bytes (guards against spoofed extensions/MIME)
  const detectedFormat = detectImageFormatFromBuffer(buffer);
  if (!detectedFormat) {
    return {
      success: false,
      error: "Содержимое файла не соответствует допустимому изображению (JPG, PNG, WEBP, GIF, AVIF)",
      status: 400,
    };
  }

  const category: ImageCategory = normalizeImageCategory(params.category);
  // Students can only upload PRIVATE images (e.g. avatars) unless explicitly allowed
  const requestedVisibility: ImageVisibility =
    params.visibility === "PRIVATE" || category === "student_photo"
      ? "PRIVATE"
      : userRole === "STUDENT" && category !== "avatar"
        ? "PRIVATE"
        : params.visibility || "PUBLIC";

  let optimizedBuffer: Buffer = buffer;
  let finalMimeType = mimeType || `image/${detectedFormat === "jpeg" ? "jpeg" : detectedFormat}`;
  let ext: string = detectedFormat === "jpeg" ? "jpg" : detectedFormat;
  let width: number | null = null;
  let height: number | null = null;

  try {
    const { default: sharp } = await import("sharp");
    const metadata = await sharp(buffer, { animated: detectedFormat === "gif" }).metadata();
    const isAnimatedGif = detectedFormat === "gif" && (metadata.pages || 1) > 1;

    if (isAnimatedGif) {
      optimizedBuffer = buffer;
      finalMimeType = "image/gif";
      ext = "gif";
      width = metadata.width ?? null;
      height = metadata.height ?? null;
    } else {
      const processed = await sharp(buffer)
        .rotate() // Auto-orient based on EXIF and strip EXIF metadata
        .resize({
          width: 1600,
          height: 1600,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 80, effort: 5 })
        .toBuffer({ resolveWithObject: true });

      optimizedBuffer = processed.data;
      finalMimeType = "image/webp";
      ext = "webp";
      width = processed.info.width ?? null;
      height = processed.info.height ?? null;
    }
  } catch (err) {
    console.warn("Sharp optimization unavailable, storing validated original image:", err);
  }

  const quota = await getUserImageQuotaUsage(uploadedById, userRole);
  if (quota.maxFiles !== null && quota.usedFiles >= quota.maxFiles) {
    return {
      success: false,
      error: `Достигнут лимит количества изображений (${quota.maxFiles} шт.). Удалите неиспользуемые файлы.`,
      status: 413,
    };
  }
  if (quota.maxBytes !== null && quota.usedBytes + optimizedBuffer.length > quota.maxBytes) {
    const maxMb = Math.round(quota.maxBytes / (1024 * 1024));
    return {
      success: false,
      error: `Превышена квота хранилища (${maxMb} МБ). Удалите неиспользуемые изображения.`,
      status: 413,
    };
  }

  const uuid = crypto.randomUUID();
  const fileName = `${uuid}.${ext}`;
  const visibilityFolder = requestedVisibility === "PRIVATE" ? "private" : "public";
  const storageKey = `${visibilityFolder}/${category}/${fileName}`;
  const cleanTitle = params.title?.trim() || sanitizeImageTitle(originalName);

  const storageResult = await saveImageToStorage(optimizedBuffer, storageKey, finalMimeType);

  const created = await prisma.storedImage.create({
    data: {
      title: cleanTitle.slice(0, 120),
      originalName: originalName.normalize("NFC").slice(0, 200),
      fileName,
      storageKey,
      mimeType: finalMimeType,
      size: optimizedBuffer.length,
      width,
      height,
      visibility: requestedVisibility,
      category,
      isR2: storageResult.isR2,
      externalUrl: storageResult.externalUrl,
      uploadedById,
    },
    include: {
      uploadedBy: { select: { name: true } },
    },
  });

  return {
    success: true,
    image: mapStoredImageToDTO(created),
  };
}

export async function listImagesService(params: {
  userId: string;
  userRole: string;
  query?: string;
  category?: string;
  visibility?: ImageVisibility | "ALL";
  limit?: number;
}): Promise<StoredImageDTO[]> {
  const { userId, userRole, query, category, visibility, limit = 60 } = params;

  const whereClauses: Record<string, unknown>[] = [];

  // Role-based access control:
  // - ADMIN sees all platform images
  // - TEACHER / ADMINISTRATION / other users see only their own uploaded images
  if (userRole !== "ADMIN") {
    whereClauses.push({ uploadedById: userId });
  }

  if (visibility && visibility !== "ALL") {
    whereClauses.push({ visibility });
  }

  if (category && category !== "ALL") {
    whereClauses.push({ category });
  }

  if (query && query.trim()) {
    const q = query.trim();
    whereClauses.push({
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { originalName: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  const rows = await prisma.storedImage.findMany({
    where: whereClauses.length > 0 ? { AND: whereClauses } : undefined,
    include: {
      uploadedBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(limit, 1), 120),
  });

  return rows.map(mapStoredImageToDTO);
}

export async function getImageForServingService(params: {
  imageId: string;
  userId?: string;
  userRole?: string;
}): Promise<
  | { success: true; buffer: Buffer; mimeType: string; visibility: ImageVisibility; etag: string }
  | { success: false; status: number; error: string }
> {
  const record = await prisma.storedImage.findUnique({
    where: { id: params.imageId },
  });

  if (!record) {
    return { success: false, status: 404, error: "Изображение не найдено" };
  }

  // Enforce private image access control
  if (record.visibility === "PRIVATE") {
    if (!params.userId) {
      return { success: false, status: 401, error: "Требуется авторизация" };
    }
    const isAllowed =
      params.userRole === "ADMIN" ||
      record.uploadedById === params.userId;
    if (!isAllowed) {
      return { success: false, status: 403, error: "Нет доступа к приватному изображению" };
    }
  }

  const buffer = await readImageFromStorage(record.storageKey, record.isR2);
  if (!buffer) {
    return { success: false, status: 404, error: "Файл изображения отсутствует в хранилище" };
  }

  return {
    success: true,
    buffer,
    mimeType: record.mimeType,
    visibility: record.visibility,
    etag: `"${record.fileName}"`,
  };
}

/** Check if an image URL is currently referenced in materials, assignments, announcements, topics, or user avatars */
export async function findImageUsages(imageId: string): Promise<string[]> {
  const urlNeedle = `/api/images/${imageId}`;
  const usages: string[] = [];

  const [materials, assignments, announcements, topics, users] = await Promise.all([
    prisma.material.findMany({
      where: {
        OR: [
          { content: { contains: urlNeedle } },
          { fileUrl: { contains: urlNeedle } },
        ],
      },
      select: { title: true },
      take: 5,
    }),
    prisma.assignment.findMany({
      where: {
        OR: [
          { description: { contains: urlNeedle } },
          { fileUrl: { contains: urlNeedle } },
        ],
      },
      select: { title: true },
      take: 5,
    }),
    prisma.announcement.findMany({
      where: { content: { contains: urlNeedle } },
      select: { title: true },
      take: 3,
    }),
    prisma.topic.findMany({
      where: { description: { contains: urlNeedle } },
      select: { title: true },
      take: 3,
    }),
    prisma.user.findMany({
      where: { avatar: { contains: urlNeedle } },
      select: { name: true },
      take: 3,
    }),
  ]);

  materials.forEach((m) => usages.push(`Материал: «${m.title}»`));
  assignments.forEach((a) => usages.push(`Задание: «${a.title}»`));
  announcements.forEach((a) => usages.push(`Объявление: «${a.title}»`));
  topics.forEach((t) => usages.push(`Тема: «${t.title}»`));
  users.forEach((u) => usages.push(`Профиль: ${u.name}`));

  return usages;
}

export async function deleteImageService(params: {
  imageId: string;
  userId: string;
  userRole: string;
}): Promise<{ success: true } | { success: false; status: number; error: string; usages?: string[] }> {
  const record = await prisma.storedImage.findUnique({
    where: { id: params.imageId },
  });

  if (!record) {
    return { success: false, status: 404, error: "Изображение не найдено" };
  }

  const canDelete = params.userRole === "ADMIN" || record.uploadedById === params.userId;
  if (!canDelete) {
    return { success: false, status: 403, error: "Нет прав на удаление этого изображения" };
  }

  const usages = await findImageUsages(record.id);
  if (usages.length > 0) {
    return {
      success: false,
      status: 409,
      error: `Нельзя удалить: изображение используется (${usages[0]})`,
      usages,
    };
  }

  await deleteImageFromStorage(record.storageKey, record.isR2);
  await prisma.storedImage.delete({ where: { id: record.id } });

  return { success: true };
}

