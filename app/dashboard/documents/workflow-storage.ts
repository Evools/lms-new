import { prisma } from "@/lib/prisma";
import type { WorkflowDocument } from "./workflow-data";

const WORKFLOW_DOCS_SETTING_KEY = "lms_workflow_documents_v1";
const KYLYCHBEKOV_DOC_ID = "doc_kylychbekov_erzhan_sit_k";

export interface WorkflowStorePayload {
  documents: WorkflowDocument[];
  deletedIds: string[];
}

const globalForWorkflowStore = globalThis as unknown as {
  workflowStoreCache?: WorkflowStorePayload;
};

function cleanDocuments(
  docs: WorkflowDocument[],
  deletedIdsSet: Set<string>
): WorkflowDocument[] {
  const seen = new Set<string>();
  const result: WorkflowDocument[] = [];
  for (const d of docs) {
    if (
      !d ||
      typeof d.id !== "string" ||
      d.id.startsWith("wf-seed-") ||
      deletedIdsSet.has(d.id) ||
      seen.has(d.id)
    ) {
      continue;
    }
    seen.add(d.id);
    result.push({
      ...d,
      approvalSteps: Array.isArray(d.approvalSteps)
        ? d.approvalSteps.map((step) => ({
            ...step,
            roleTitle:
              step.roleTitle === "Зам. директора по УПР / Педсовет"
                ? "Администрация лицея (Зам. директора по УПР)"
                : step.roleTitle,
            comment:
              step.comment === "Решение утверждено педагогическим советом"
                ? "Решение утверждено администрацией лицея"
                : step.comment,
          }))
        : [],
    });
  }
  return result;
}

async function buildKylychbekovDocumentFromDb(): Promise<WorkflowDocument> {
  let studentName = "Кылычбеков Эржан Кубатбекович";
  let studentId = "student-kylychbekov";
  let rollNumber = "1880";
  let groupName = "СИТ-К-26";
  let authorName = "Вопольский Виктор Владимирович";
  let authorId = "curator-sit-k";
  let unexcusedHours = 28;
  let attendanceRate = 53;

  try {
    const gs = await prisma.groupStudent.findFirst({
      where: {
        student: {
          name: { contains: "Кылычбеков", mode: "insensitive" },
        },
      },
      include: {
        student: true,
        group: {
          include: {
            curator: true,
            classTeacher: true,
          },
        },
      },
    });

    if (gs) {
      studentName = gs.student.name;
      studentId = gs.student.id;
      rollNumber = gs.student.rollNumber || "";
      groupName = gs.group.name;
      const teacher = gs.group.curator || gs.group.classTeacher;
      if (teacher) {
        authorName = teacher.name;
        authorId = teacher.id;
      }

      const attCounts = await prisma.attendance.groupBy({
        by: ["status"],
        where: { studentId: gs.student.id },
        _count: { id: true },
      });
      let total = 0;
      let absent = 0;
      let attended = 0;
      for (const row of attCounts) {
        total += row._count.id;
        if (row.status === "ABSENT") absent += row._count.id;
        else attended += row._count.id;
      }
      if (total > 0) {
        unexcusedHours = absent * 2;
        attendanceRate = Math.round((attended / total) * 100);
      }
    }
  } catch {}

  return {
    id: KYLYCHBEKOV_DOC_ID,
    docNumber: "РАП-2026/018",
    templateId: "expulsion_single",
    title: `Рапорт на отчисление одного студента — ${studentName}`,
    category: "REPORTS",
    categoryLabel: "Рапорты и служебные",
    status: "PENDING_APPROVAL",
    groupName,
    students: [
      {
        id: studentId,
        name: studentName,
        rollNumber,
        group: groupName,
        attendanceRate,
        unexcusedHours,
        debts: 0,
        individualReason: "",
      },
    ],
    authorId,
    authorName,
    authorRole: "Мастер группы",
    signatoryName: authorName,
    signatoryTitle: "Мастер группы",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    addressee: "Директору Профессионального лицея №98\nСагынбековой Ч. М.",
    generalReason:
      "За систематическое непосещение учебных занятий без уважительной причины и невыполнение требований образовательной программы.",
    descriptionText: `Довожу до вашего сведения, что студент учебной группы ${groupName} ${studentName} систематически нарушает учебную дисциплину и правила внутреннего распорядка лицея.\n\nПо данным электронного журнала посещаемости LMS, за текущий учебный период обучающийся пропустил ${unexcusedHours} часов учебных занятий без уважительной причины.\n\nПроведённые куратором индивидуальные профилактические беседы, неоднократные письменные предупреждения и вызовы родителей (законных представителей) на комиссию по профилактике правонарушений положительных результатов не дали.\n\nНа основании Устава лицея и Положения о порядке перевода, отчисления и восстановления обучающихся, ходатайствую об отчислении студента ${studentName} из состава обучающихся лицея за систематические пропуски учебных занятий.`,
    approvalSteps: [
      {
        stepIndex: 1,
        role: "CURATOR",
        roleTitle: "Мастер группы (куратор)",
        name: authorName,
        status: "APPROVED",
        date: new Date().toLocaleDateString("ru-RU"),
        comment: "Рапорт сформирован и передан в администрацию лицея.",
      },
      {
        stepIndex: 2,
        role: "ADMINISTRATION",
        roleTitle: "Администрация лицея (Зам. директора по УПР)",
        name: "Тоялиева М. Р.",
        status: "PENDING",
      },
    ],
    currentApprovalStepIndex: 1,
    isArchived: false,
  };
}

export async function readWorkflowStore(): Promise<WorkflowStorePayload> {
  const memPayload = globalForWorkflowStore.workflowStoreCache || null;

  let dbDocs: WorkflowDocument[] = [];
  let dbDeletedIds: string[] = [];
  try {
    if (prisma.systemSetting) {
      const wfSetting = await prisma.systemSetting.findUnique({
        where: { key: WORKFLOW_DOCS_SETTING_KEY },
      });
      if (wfSetting?.value) {
        const parsed = JSON.parse(wfSetting.value);
        if (Array.isArray(parsed)) {
          dbDocs = parsed;
        } else if (parsed && Array.isArray(parsed.documents)) {
          dbDocs = parsed.documents;
          dbDeletedIds = Array.isArray(parsed.deletedIds) ? parsed.deletedIds : [];
        }
      }
    }
  } catch {}

  const deletedIdsSet = new Set<string>([
    ...(memPayload?.deletedIds || []),
    ...dbDeletedIds,
  ]);

  let combinedDocs = cleanDocuments(
    [...(memPayload?.documents || []), ...dbDocs],
    deletedIdsSet
  );

  if (
    !deletedIdsSet.has(KYLYCHBEKOV_DOC_ID) &&
    !combinedDocs.some(
      (d) => d.id === KYLYCHBEKOV_DOC_ID || d.title.includes("Кылычбеков")
    )
  ) {
    const kylychbekovDoc = await buildKylychbekovDocumentFromDb();
    combinedDocs = [kylychbekovDoc, ...combinedDocs];
    await writeWorkflowStore({
      documents: combinedDocs,
      deletedIds: Array.from(deletedIdsSet),
    });
    return {
      documents: combinedDocs,
      deletedIds: Array.from(deletedIdsSet),
    };
  }

  const payload: WorkflowStorePayload = {
    documents: combinedDocs,
    deletedIds: Array.from(deletedIdsSet),
  };

  globalForWorkflowStore.workflowStoreCache = payload;
  return payload;
}

export async function writeWorkflowStore(
  payload: WorkflowStorePayload
): Promise<WorkflowDocument[]> {
  const deletedIdsSet = new Set<string>(payload.deletedIds || []);
  const cleanedDocs = cleanDocuments(payload.documents || [], deletedIdsSet);
  const finalPayload: WorkflowStorePayload = {
    documents: cleanedDocs,
    deletedIds: Array.from(deletedIdsSet),
  };

  globalForWorkflowStore.workflowStoreCache = finalPayload;

  try {
    if (prisma.systemSetting) {
      await prisma.systemSetting.upsert({
        where: { key: WORKFLOW_DOCS_SETTING_KEY },
        update: { value: JSON.stringify(finalPayload) },
        create: {
          key: WORKFLOW_DOCS_SETTING_KEY,
          value: JSON.stringify(finalPayload),
        },
      });
    }
  } catch (err) {
    console.error("Failed syncing workflow store to DB:", err);
  }

  return cleanedDocs;
}
