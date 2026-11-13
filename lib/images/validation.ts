export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB per uploaded file

export interface ImageQuotaLimit {
  maxBytes: number | null;
  maxFiles: number | null;
}

export function getImageQuotaForRole(role: string): ImageQuotaLimit {
  if (role === "ADMIN") {
    return { maxBytes: null, maxFiles: null };
  }
  if (role === "TEACHER" || role === "ADMINISTRATION") {
    return {
      maxBytes: 100 * 1024 * 1024, // 100 MB per teacher/master
      maxFiles: 300,
    };
  }
  return {
    maxBytes: 20 * 1024 * 1024, // 20 MB per student
    maxFiles: 30,
  };
}

export const ALLOWED_IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

export const IMAGE_CATEGORIES = [
  "material",
  "assignment",
  "student_photo",
  "avatar",
  "profile",
  "cover",
  "other",
] as const;

export type ImageCategory = (typeof IMAGE_CATEGORIES)[number];

export type DetectedImageFormat = "jpeg" | "png" | "webp" | "gif" | "avif";

/**
 * Inspect magic bytes in the file buffer to verify the actual image format.
 * Prevents uploading disguised HTML, SVG, PHP, or executable files.
 */
export function detectImageFormatFromBuffer(buffer: Buffer): DetectedImageFormat | null {
  if (!buffer || buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpeg";
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "png";
  }

  // GIF: GIF87a or GIF89a
  const header6 = buffer.subarray(0, 6).toString("ascii");
  if (header6 === "GIF87a" || header6 === "GIF89a") {
    return "gif";
  }

  // WEBP: RIFF....WEBP
  const riff = buffer.subarray(0, 4).toString("ascii");
  const webp = buffer.subarray(8, 12).toString("ascii");
  if (riff === "RIFF" && webp === "WEBP") {
    return "webp";
  }

  // AVIF: ....ftypavif or ....ftypavis
  const ftyp = buffer.subarray(4, 8).toString("ascii");
  const brand = buffer.subarray(8, 12).toString("ascii");
  if (ftyp === "ftyp" && (brand === "avif" || brand === "avis")) {
    return "avif";
  }

  return null;
}

/** Build a clean human-readable title from an uploaded filename */
export function sanitizeImageTitle(rawName: string): string {
  const normalized = (rawName || "Изображение").normalize("NFC");
  const withoutExt = normalized.replace(/\.[^.]+$/, "");
  const cleaned = withoutExt
    .replace(/[_-]+/g, " ")
    .replace(/[^\p{L}\p{N}\s.,()—–-]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.slice(0, 120) || "Изображение";
}

export function normalizeImageCategory(raw?: string | null): ImageCategory {
  if (!raw) return "material";
  const lower = raw.trim().toLowerCase();
  return (IMAGE_CATEGORIES as readonly string[]).includes(lower)
    ? (lower as ImageCategory)
    : "other";
}

