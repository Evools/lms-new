import { NextRequest, NextResponse } from "next/server";
import type { WorkflowDocument } from "@/app/dashboard/documents/workflow-data";
import {
  readWorkflowStore,
  writeWorkflowStore,
} from "@/app/dashboard/documents/workflow-storage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const store = await readWorkflowStore();
    return NextResponse.json(
      {
        success: true,
        documents: store.documents,
        deletedIds: store.deletedIds,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/workflow-documents error:", error);
    return NextResponse.json(
      { success: false, documents: [], deletedIds: [] },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const store = await readWorkflowStore();
    const deletedIdsSet = new Set(store.deletedIds);

    // Support batch sync ({ docs })
    if (Array.isArray(body?.docs)) {
      const existingIds = new Set(store.documents.map((d) => d.id));
      const newDocs = (body.docs as WorkflowDocument[]).filter(
        (d) =>
          d &&
          typeof d.id === "string" &&
          !d.id.startsWith("wf-seed-") &&
          !deletedIdsSet.has(d.id) &&
          !existingIds.has(d.id)
      );
      const updated = await writeWorkflowStore({
        documents: [...newDocs, ...store.documents],
        deletedIds: store.deletedIds,
      });
      return NextResponse.json({
        success: true,
        documents: updated,
        deletedIds: store.deletedIds,
      });
    }

    const doc = body?.doc as WorkflowDocument | undefined;
    if (!doc || !doc.id) {
      return NextResponse.json(
        { success: false, error: "Некорректные данные документа" },
        { status: 400 }
      );
    }

    // If explicitly saving/updating a single doc, ensure it's not blocked by deletedIds
    deletedIdsSet.delete(doc.id);
    const idx = store.documents.findIndex((d) => d.id === doc.id);
    const nextDocs =
      idx >= 0
        ? store.documents.map((d) => (d.id === doc.id ? doc : d))
        : [doc, ...store.documents];

    const updated = await writeWorkflowStore({
      documents: nextDocs,
      deletedIds: Array.from(deletedIdsSet),
    });

    return NextResponse.json({
      success: true,
      documents: updated,
      deletedIds: Array.from(deletedIdsSet),
    });
  } catch (error) {
    console.error("POST /api/workflow-documents error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Ошибка сохранения документа",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const docId = searchParams.get("id");
    if (!docId) {
      return NextResponse.json(
        { success: false, error: "Не указан ID документа" },
        { status: 400 }
      );
    }

    const store = await readWorkflowStore();
    const nextDeletedIds = Array.from(new Set([...store.deletedIds, docId]));
    const nextDocs = store.documents.filter((d) => d.id !== docId);

    const updated = await writeWorkflowStore({
      documents: nextDocs,
      deletedIds: nextDeletedIds,
    });

    return NextResponse.json({
      success: true,
      documents: updated,
      deletedIds: nextDeletedIds,
    });
  } catch (error) {
    console.error("DELETE /api/workflow-documents error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Ошибка удаления документа",
      },
      { status: 500 }
    );
  }
}
