import { NextRequest, NextResponse } from "next/server";
import { ImageVisibility } from "@prisma/client";
import { auth } from "@/lib/auth";
import {
  getUserImageQuotaUsage,
  listImagesService,
  uploadImageService,
} from "@/lib/images/service";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || undefined;
    const category = searchParams.get("category") || undefined;
    const visibilityParam = searchParams.get("visibility");
    const limitParam = Number(searchParams.get("limit") || "60");

    const visibility: ImageVisibility | "ALL" | undefined =
      visibilityParam === "PUBLIC" || visibilityParam === "PRIVATE" || visibilityParam === "ALL"
        ? visibilityParam
        : undefined;

    const role = session.user.role || "STUDENT";
    const [images, quota] = await Promise.all([
      listImagesService({
        userId: session.user.id,
        userRole: role,
        query,
        category,
        visibility,
        limit: Number.isFinite(limitParam) ? limitParam : 60,
      }),
      getUserImageQuotaUsage(session.user.id, role),
    ]);

    return NextResponse.json({ images, quota });
  } catch (error) {
    console.error("GET /api/images error:", error);
    return NextResponse.json(
      { error: "Не удалось загрузить список изображений" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const title = (formData.get("title") as string | null) || undefined;
    const category = (formData.get("category") as string | null) || "material";
    const visibilityRaw = (formData.get("visibility") as string | null) || undefined;

    if (!file) {
      return NextResponse.json({ error: "Файл изображения не выбран" }, { status: 400 });
    }

    const visibility: ImageVisibility | undefined =
      visibilityRaw === "PRIVATE"
        ? "PRIVATE"
        : visibilityRaw === "PUBLIC"
          ? "PUBLIC"
          : undefined;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await uploadImageService({
      buffer,
      originalName: file.name || "image",
      mimeType: file.type,
      title,
      category,
      visibility,
      uploadedById: session.user.id,
      userRole: session.user.role || "STUDENT",
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ success: true, image: result.image }, { status: 201 });
  } catch (error) {
    console.error("POST /api/images error:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера при загрузке изображения" },
      { status: 500 }
    );
  }
}

