import path from "path";
import fs from "fs/promises";
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getR2Client } from "@/lib/r2";

/**
 * Persistent storage root outside `public/`.
 * In Docker, mount a persistent volume to `/app/storage` or set `IMAGE_STORAGE_DIR`.
 */
export function getImageStorageRoot(): string {
  if (process.env.IMAGE_STORAGE_DIR) {
    return path.resolve(process.env.IMAGE_STORAGE_DIR);
  }
  return path.join(process.cwd(), "storage", "images");
}

function resolveSafeLocalPath(storageKey: string): string {
  const root = getImageStorageRoot();
  const normalizedKey = storageKey.replace(/^\/+/, "");
  const resolved = path.resolve(root, normalizedKey);
  if (!resolved.startsWith(root + path.sep) && resolved !== root) {
    throw new Error("Недопустимый путь к файлу изображения");
  }
  return resolved;
}

export async function saveImageToStorage(
  buffer: Buffer,
  storageKey: string,
  contentType: string
): Promise<{ isR2: boolean; externalUrl: string | null }> {
  const r2 = getR2Client();
  if (r2) {
    await r2.client.send(
      new PutObjectCommand({
        Bucket: r2.bucket,
        Key: storageKey,
        Body: buffer,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
      })
    );
    return {
      isR2: true,
      externalUrl: `${r2.publicUrl}/${storageKey}`,
    };
  }

  const localPath = resolveSafeLocalPath(storageKey);
  await fs.mkdir(path.dirname(localPath), { recursive: true });
  await fs.writeFile(localPath, buffer);
  return { isR2: false, externalUrl: null };
}

export async function readImageFromStorage(
  storageKey: string,
  isR2: boolean
): Promise<Buffer | null> {
  if (isR2) {
    const r2 = getR2Client();
    if (!r2) return null;
    try {
      const res = await r2.client.send(
        new GetObjectCommand({
          Bucket: r2.bucket,
          Key: storageKey,
        })
      );
      if (!res.Body) return null;
      const bytes = await res.Body.transformToByteArray();
      return Buffer.from(bytes);
    } catch {
      return null;
    }
  }

  try {
    const localPath = resolveSafeLocalPath(storageKey);
    return await fs.readFile(localPath);
  } catch {
    return null;
  }
}

export async function deleteImageFromStorage(
  storageKey: string,
  isR2: boolean
): Promise<boolean> {
  if (isR2) {
    const r2 = getR2Client();
    if (!r2) return false;
    try {
      await r2.client.send(
        new DeleteObjectCommand({
          Bucket: r2.bucket,
          Key: storageKey,
        })
      );
      return true;
    } catch {
      return false;
    }
  }

  try {
    const localPath = resolveSafeLocalPath(storageKey);
    await fs.unlink(localPath);
    return true;
  } catch {
    return false;
  }
}

