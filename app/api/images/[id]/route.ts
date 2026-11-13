import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { deleteImageService, getImageForServingService } from "@/lib/images/service";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await auth();

    const result = await getImageForServingService({
      imageId: id,
      userId: session?.user?.id,
      userRole: session?.user?.role,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const ifNoneMatch = req.headers.get("if-none-match");
    if (ifNoneMatch && ifNoneMatch === result.etag) {
      return new NextResponse(null, { status: 304 });
    }

    const cacheControl =
      result.visibility === "PUBLIC"
        ? "public, max-age=31536000, immutable"
        : "private, no-store";

    return new NextResponse(new Uint8Array(result.buffer), {
      status: 200,
      headers: {
        "Content-Type": result.mimeType,
        "Content-Length": String(result.buffer.length),
        "Cache-Control": cacheControl,
        ETag: result.etag,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("GET /api/images/[id] error:", error);
    return NextResponse.json(
      { error: "Ошибка при получении изображения" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const { id } = await context.params;
    const result = await deleteImageService({
      imageId: id,
      userId: session.user.id,
      userRole: session.user.role || "STUDENT",
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, usages: result.usages },
        { status: result.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/images/[id] error:", error);
    return NextResponse.json(
      { error: "Ошибка при удалении изображения" },
      { status: 500 }
    );
  }
}

