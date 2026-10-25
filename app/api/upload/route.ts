import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { validateUploadFile, uploadFileToStorage } from "@/lib/r2";

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const { role, id: userId } = session.user;

    // 2. Parse Multipart Form Data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "materials";

    if (!file) {
      return NextResponse.json({ error: "Файл не прикреплен" }, { status: 400 });
    }

    // 3. Permission checks by folder
    const validFolders = ["materials", "assignments", "submissions", "documents", "avatars"] as const;
    const targetFolder = validFolders.includes(folder as any) ? (folder as (typeof validFolders)[number]) : "materials";

    // Students are only allowed to upload into submissions and avatars
    if (role === "STUDENT" && targetFolder !== "submissions" && targetFolder !== "avatars") {
      return NextResponse.json(
        { error: "У студентов нет прав на загрузку материалов или общих заданий" },
        { status: 403 }
      );
    }

    // 4. Validate file against security limits (size, extension, banned executables)
    const validation = validateUploadFile(file, role || "STUDENT", targetFolder);
    if (!validation.valid || !validation.safeName) {
      return NextResponse.json({ error: validation.error || "Недопустимый файл" }, { status: 400 });
    }

    // 5. Convert to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 6. Partition path (students get their own subfolder in submissions)
    const storagePath = targetFolder === "submissions" ? `submissions/${userId}` : targetFolder;

    // 7. Upload to Storage (Cloudflare R2, with local fallback)
    const result = await uploadFileToStorage(
      buffer,
      storagePath,
      validation.safeName,
      file.type || "application/octet-stream",
      file.name
    );

    return NextResponse.json({
      success: true,
      url: result.url,
      key: result.key,
      isR2: result.isR2,
      fileName: file.name,
      safeName: validation.safeName,
      size: file.size,
      mimeType: file.type,
    });
  } catch (error: any) {
    console.error("Upload error in /api/upload:", error);
    return NextResponse.json(
      { error: error?.message || "Внутренняя ошибка сервера при загрузке файла" },
      { status: 500 }
    );
  }
}
