import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { deleteImagesBulkService } from "@/lib/images/service";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const body = (await req.json()) as { ids?: unknown };
    const ids = Array.isArray(body?.ids)
      ? body.ids.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      : [];

    if (ids.length === 0) {
      return NextResponse.json(
        { error: "Не выбраны изображения для удаления" },
        { status: 400 }
      );
    }

    const result = await deleteImagesBulkService({
      imageIds: ids,
      userId: session.user.id,
      userRole: session.user.role || "STUDENT",
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("POST /api/images/bulk-delete error:", error);
    return NextResponse.json(
      { error: "Ошибка при пакетном удалении изображений" },
      { status: 500 }
    );
  }
}

