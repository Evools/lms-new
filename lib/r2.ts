import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import path from "path";
import fs from "fs/promises";

// 1. Size Constraints (in bytes)
export const MAX_STUDENT_FILE_SIZE = 25 * 1024 * 1024; // 25 MB for student homework
export const MAX_TEACHER_FILE_SIZE = 100 * 1024 * 1024; // 100 MB for teacher materials/assignments

// 2. Allowed Extensions & Mime Types
export const ALLOWED_EXTENSIONS = new Set([
  // Documents
  "pdf", "docx", "doc", "xlsx", "xls", "pptx", "ppt", "txt", "csv", "rtf", "odt",
  // Archives
  "zip", "rar", "7z", "tar", "gz",
  // Images
  "png", "jpg", "jpeg", "webp", "gif", "svg",
  // Code & Data
  "json", "sql", "py", "js", "ts", "jsx", "tsx", "html", "css", "cpp", "c", "cs", "java", "md"
]);

// 3. Strictly Banned Executable & Danger Extensions
export const BANNED_EXTENSIONS = new Set([
  "exe", "bat", "cmd", "sh", "vbs", "php", "phtml", "phar", "jar", "apk", "msi",
  "bin", "scr", "com", "ps1", "wsf", "hta", "reg", "cgi", "pl", "asp", "aspx"
]);

export interface UploadValidationResult {
  valid: boolean;
  error?: string;
  safeName?: string;
}

/**
 * Validates file safety, role limits, and extension restrictions
 */
export function validateUploadFile(
  file: File,
  userRole: string,
  targetFolder: "materials" | "assignments" | "submissions" | "documents" | "avatars"
): UploadValidationResult {
  // Check file presence
  if (!file || file.size === 0) {
    return { valid: false, error: "Файл пуст или не был выбран" };
  }

  // Size Limit check based on role
  const maxSize = userRole === "STUDENT" ? MAX_STUDENT_FILE_SIZE : MAX_TEACHER_FILE_SIZE;
  const maxMb = Math.round(maxSize / (1024 * 1024));

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Размер файла (${(file.size / (1024 * 1024)).toFixed(1)} МБ) превышает лимит ${maxMb} МБ`,
    };
  }

  // Extract and sanitize extension with NFC normalization (fixes macOS decomposed letters like 'й')
  const originalName = (file.name || "unnamed").normalize("NFC");
  const parts = originalName.split(".");
  if (parts.length < 2) {
    return { valid: false, error: "Файлы без расширения запрещены к загрузке" };
  }

  const ext = parts.pop()?.toLowerCase() || "";

  // Check banned extensions
  if (BANNED_EXTENSIONS.has(ext)) {
    return {
      valid: false,
      error: `Загрузка исполняемых файлов (.${ext}) строго запрещена в целях безопасности`,
    };
  }

  // Check allowed extensions
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return {
      valid: false,
      error: `Формат .${ext} не поддерживается. Разрешены документы (PDF, Word, Excel, PPTX), архивы (ZIP, RAR, 7Z), изображения и файлы кода.`,
    };
  }

  // Clean filename: remove unsafe path characters (\, /, :, *, ?, ", <, >, |), keep valid Cyrillic & Latin
  const rawBaseName = parts.join(".").slice(0, 80);
  const safeBaseName = rawBaseName
    .replace(/[/\\?%*:|"<>]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_");
  const safeName = `${safeBaseName}.${ext}`;

  return { valid: true, safeName };
}

/**
 * Initialize Cloudflare R2 S3 Client
 */
export function getR2Client(): { client: S3Client; bucket: string; publicUrl: string } | null {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) {
    return null;
  }

  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return { client, bucket, publicUrl };
}

/**
 * Uploads a file buffer to Cloudflare R2, with local storage fallback if R2 credentials are not configured
 */
export async function uploadFileToStorage(
  fileBuffer: Buffer,
  folder: string,
  fileName: string,
  contentType: string,
  originalName?: string
): Promise<{ url: string; key: string; isR2: boolean }> {
  const r2 = getR2Client();
  const uuid = crypto.randomUUID();
  const objectKey = `${folder}/${uuid}-${fileName}`;

  // Human-readable original filename for download
  const downloadName = (originalName || fileName).trim();
  const encodedName = encodeURIComponent(downloadName);
  const asciiFallback = downloadName.replace(/[^\x20-\x7E]/g, "_");
  const contentDisposition = `inline; filename="${asciiFallback}"; filename*=UTF-8''${encodedName}`;

  // If Cloudflare R2 is configured, upload directly to R2
  if (r2) {
    const command = new PutObjectCommand({
      Bucket: r2.bucket,
      Key: objectKey,
      Body: fileBuffer,
      ContentType: contentType || "application/octet-stream",
      ContentDisposition: contentDisposition,
    });

    await r2.client.send(command);
    const url = `${r2.publicUrl}/${objectKey}`;
    return { url, key: objectKey, isR2: true };
  }

  // Fallback: Local storage in public/uploads for local development
  const uploadDir = path.join(process.cwd(), "public", "uploads", folder);
  await fs.mkdir(uploadDir, { recursive: true });

  const safeLocalFileName = `${uuid}-${fileName}`;
  const filePath = path.join(uploadDir, safeLocalFileName);
  await fs.writeFile(filePath, fileBuffer);

  const localUrl = `/uploads/${folder}/${safeLocalFileName}`;
  return { url: localUrl, key: objectKey, isR2: false };
}

/**
 * Delete a file from Cloudflare R2 (or local fallback)
 */
export async function deleteFileFromStorage(keyOrUrl: string): Promise<boolean> {
  try {
    const r2 = getR2Client();

    // Check if it's local URL
    if (keyOrUrl.startsWith("/uploads/")) {
      const localPath = path.join(process.cwd(), "public", keyOrUrl);
      await fs.unlink(localPath);
      return true;
    }

    // Extract object key from public URL if full URL was passed
    let key = keyOrUrl;
    if (r2?.publicUrl && key.startsWith(r2.publicUrl)) {
      key = key.replace(`${r2.publicUrl}/`, "");
    }

    if (r2) {
      await r2.client.send(
        new DeleteObjectCommand({
          Bucket: r2.bucket,
          Key: key,
        })
      );
      return true;
    }

    return false;
  } catch (err) {
    console.error("Failed to delete file from storage:", err);
    return false;
  }
}
