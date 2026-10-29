"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import {
  FileText,
  Plus,
  ShieldCheck,
  FileSignature,
  Layers,
} from "lucide-react";
import type {
  DocumentDTO,
  WorkflowStudentDTO,
  WorkflowGroupDTO,
  WorkflowUserDTO,
} from "../actions";
import {
  createDocumentAction,
  deleteDocumentAction,
  getWorkflowDocumentsAction,
  upsertWorkflowDocumentAction,
  deleteWorkflowDocumentAction,
  syncLocalWorkflowDocumentsAction,
} from "../actions";
import {
  WorkflowDocument,
  DocumentTemplateItem,
  DOCUMENT_TEMPLATES,
  substituteVariables,
} from "../workflow-data";
import {
  TabType,
  CharBlocksState,
} from "./workflow/workflow-types";
import {
  generateOfficialDocumentHtml,
  printHtmlContent,
  exportDocumentDocx,
} from "./workflow/document-print-utils";
import { DocumentPreviewDialog } from "./workflow/dialogs/document-preview-dialog";
import { DocumentApprovalDialog } from "./workflow/dialogs/document-approval-dialog";
import { TemplatePreviewDialog } from "./workflow/dialogs/template-preview-dialog";
import { RegulatoryUploadDialog } from "./workflow/dialogs/regulatory-upload-dialog";
import { DocumentDeleteDialogs } from "./workflow/dialogs/document-delete-dialogs";
import { WorkflowOverviewTab } from "./workflow/tabs/workflow-overview-tab";
import { WorkflowRegistryTab } from "./workflow/tabs/workflow-registry-tab";
import { WorkflowTemplatesTab } from "./workflow/tabs/workflow-templates-tab";
import { WorkflowArchiveTab } from "./workflow/tabs/workflow-archive-tab";
import { WorkflowCreatorTab } from "./workflow/tabs/workflow-creator-tab";

interface DocumentsWorkflowViewProps {
  documents: DocumentDTO[];
  initialWorkflowDocs?: WorkflowDocument[];
  canManage: boolean;
  availableGroups?: string[];
  groupDetails?: WorkflowGroupDTO[];
  availableStudents?: WorkflowStudentDTO[];
  currentUser?: WorkflowUserDTO | null;
}

export function DocumentsWorkflowView({
  documents: initialRegulatoryDocs,
  initialWorkflowDocs = [],
  canManage,
  availableGroups = [],
  availableStudents = [],
  currentUser = null,
}: DocumentsWorkflowViewProps) {
  const groups = useMemo(() => availableGroups, [availableGroups]);
  const students = useMemo(() => availableStudents, [availableStudents]);
  const canApprove =
    currentUser?.role === "ADMIN" || currentUser?.role === "ADMINISTRATION";

  // Navigation state
  const [activeTab, setActiveTab] = useState<TabType>("OVERVIEW");

  // Workflow documents state (PostgreSQL DB + local server store single source of truth via /api/workflow-documents)
  const [workflowDocs, setWorkflowDocs] = useState<WorkflowDocument[]>(
    () => initialWorkflowDocs.filter((d) => !d.id.startsWith("wf-seed-"))
  );
  const workflowDocsRef = React.useRef<WorkflowDocument[]>(workflowDocs);
  useEffect(() => {
    workflowDocsRef.current = workflowDocs;
  }, [workflowDocs]);
  const isMutatingRef = React.useRef(false);

  const refreshFromServer = React.useCallback(async () => {
    if (isMutatingRef.current) return;
    try {
      // Collect any client-side documents from memory or legacy localStorage keys so nothing created in an open tab is lost
      const candidateDocs: WorkflowDocument[] = [...workflowDocsRef.current];
      if (typeof window !== "undefined") {
        for (const key of ["lms_workflow_documents_v2", "lms_workflow_documents_v1"]) {
          const saved = localStorage.getItem(key);
          if (saved) {
            localStorage.removeItem(key);
            try {
              const parsed = JSON.parse(saved);
              if (Array.isArray(parsed)) {
                candidateDocs.push(...parsed);
              }
            } catch {}
          }
        }
      }

      const validLocalDocs = candidateDocs.filter(
        (d) => d && typeof d.id === "string" && !d.id.startsWith("wf-seed-")
      );

      if (validLocalDocs.length > 0) {
        const syncRes = await fetch("/api/workflow-documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ docs: validLocalDocs }),
          cache: "no-store",
        });
        if (syncRes.ok && !isMutatingRef.current) {
          const syncData = await syncRes.json();
          if (syncData?.success && Array.isArray(syncData.documents) && !isMutatingRef.current) {
            setWorkflowDocs(syncData.documents);
            return;
          }
        }
      }

      const res = await fetch("/api/workflow-documents", {
        method: "GET",
        cache: "no-store",
      });
      if (!res.ok || isMutatingRef.current) return;
      const data = await res.json();
      if (data?.success && Array.isArray(data.documents) && !isMutatingRef.current) {
        setWorkflowDocs(data.documents);
      }
    } catch {}
  }, []);

  // Live sync from PostgreSQL on mount, window focus, and every 4s
  useEffect(() => {
    refreshFromServer();

    const handleFocus = () => {
      refreshFromServer();
    };
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        refreshFromServer();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        refreshFromServer();
      }
    }, 4000);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.clearInterval(intervalId);
    };
  }, [refreshFromServer]);

  // Deletion targets
  const [deleteWorkflowDocTarget, setDeleteWorkflowDocTarget] =
    useState<WorkflowDocument | null>(null);
  const [deleteRegDocTarget, setDeleteRegDocTarget] =
    useState<DocumentDTO | null>(null);

  // Regulatory documents state
  const [regulatoryDocs, setRegulatoryDocs] = useState(initialRegulatoryDocs);
  const [isCreateRegDocOpen, setIsCreateRegDocOpen] = useState(false);
  const [newRegTitle, setNewRegTitle] = useState("");
  const [newRegCategory, setNewRegCategory] = useState("Методички");
  const [newRegUrl, setNewRegUrl] = useState("");
  const [newRegDescription, setNewRegDescription] = useState("");
  const [isRegDocSubmitting, setIsRegDocSubmitting] = useState(false);

  // Modal targets
  const [previewDoc, setPreviewDoc] = useState<WorkflowDocument | null>(null);
  const [approvalDoc, setApprovalDoc] = useState<WorkflowDocument | null>(null);
  const [approvalComment, setApprovalComment] = useState("");
  const [previewingTemplate, setPreviewingTemplate] =
    useState<DocumentTemplateItem | null>(null);

  // Document Creator Wizard State
  const [creatorStep, setCreatorStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedTemplate, setSelectedTemplate] =
    useState<DocumentTemplateItem>(DOCUMENT_TEMPLATES[0]);
  const [creatorGroup, setCreatorGroup] = useState<string>(groups[0] || "");
  const [creatorSelectedStudentIds, setCreatorSelectedStudentIds] = useState<string[]>([]);

  useEffect(() => {
    if (!creatorGroup && groups.length > 0) {
      setCreatorGroup(groups[0]);
    }
  }, [groups, creatorGroup]);

  const [creatorIndividualReasons, setCreatorIndividualReasons] = useState<
    Record<string, string>
  >({});
  const [enableIndividualReasons, setEnableIndividualReasons] = useState(false);
  const [creatorGeneralReason, setCreatorGeneralReason] = useState(
    DOCUMENT_TEMPLATES[0].defaultReason
  );
  const [creatorAddressee, setCreatorAddressee] = useState(
    DOCUMENT_TEMPLATES[0].defaultAddressee
  );
  const [creatorDescription, setCreatorDescription] = useState(
    "На основании устава лицея ходатайствую об отчислении вышеуказанных студентов из состава обучающихся за академическую неуспеваемость и систематические пропуски занятий."
  );
  const [creatorSignatory, setCreatorSignatory] = useState<string>(
    currentUser?.name || "Вопольский Виктор Владимирович"
  );
  const [creatorSignatoryRole, setCreatorSignatoryRole] = useState<string>(
    currentUser?.role === "TEACHER"
      ? "Мастер группы"
      : currentUser?.role === "ADMINISTRATION"
        ? "Администрация лицея"
        : "Куратор группы"
  );

  useEffect(() => {
    if (currentUser?.name && (!creatorSignatory || creatorSignatory === "Мастер группы")) {
      setCreatorSignatory(currentUser.name);
    }
  }, [currentUser, creatorSignatory]);

  const [studentSearchInCreator, setStudentSearchInCreator] = useState("");

  // Modular constructor blocks for Характеристика на студента (ХАР-01)
  const [charBlocks, setCharBlocks] = useState<CharBlocksState>({
    academic: true,
    professional: true,
    personal: true,
    social: true,
    habits: true,
    purpose: true,
    signCurator: true,
    signViceDirector: true,
  });

  const generateCharacteristicBody = (
    blocks: CharBlocksState,
    student?: WorkflowStudentDTO,
    groupName?: string,
    targetAddressee?: string
  ) => {
    const studentName = student?.name || "Асанов Азамат Бакытович";
    const grp = groupName || student?.group || creatorGroup;
    const specialty =
      student?.specialty || "Информационные системы и программирование";
    const attendance = String(student?.attendanceRate ?? 95);

    const paragraphs: string[] = [];
    paragraphs.push(
      `Характеристика выдана студенту ${studentName}, обучающемуся в Профессиональном лицее №98 по специальности ${specialty}, учебная группа ${grp}.`
    );

    if (blocks.academic) {
      paragraphs.push(
        `За время обучения в лицее ${studentName} зарекомендовал себя как дисциплинированный, ответственный и добросовестный учащийся. К выполнению учебного плана и поручений куратора относится с высокой степенью осознанности. Академических задолженностей не имеет, учебную программу осваивает на «хорошо» и «отлично». Текущий показатель посещаемости учебных занятий составляет ${attendance}%, пропусков без уважительной причины не допускает.`
      );
    }

    if (blocks.professional) {
      paragraphs.push(
        `В процессе освоения теоретических и практических дисциплин проявляет выраженный интерес к будущей специальности, аналитический склад ума и стремление к углублению профессиональных навыков. Неоднократно принимал участие в профессиональных олимпиадах и конкурсах профмастерства лицея.`
      );
    }

    if (blocks.personal) {
      paragraphs.push(
        `По характеру сдержан, тактичен, вежлив в общении с преподавателями, мастерами производственного обучения и сокурсниками. Среди студентов группы ${grp} пользуется авторитетом и уважением. В конфликтных ситуациях замечен не был, проявляет стрессоустойчивость и готовность прийти на помощь товарищам.`
      );
    }

    if (blocks.social) {
      paragraphs.push(
        `Активно участвует в общественной жизни группы и культурно-массовых мероприятиях лицея, проявляет организаторские способности и инициативу.`
      );
    }

    if (blocks.habits) {
      paragraphs.push(
        `Правила внутреннего распорядка учебного заведения и нормы поведения соблюдает неукоснительно. Вредных привычек не имеет.`
      );
    }

    if (blocks.purpose) {
      const addr = targetAddressee?.trim() || creatorAddressee?.trim() || "";
      const goal = addr
        ? addr.toLowerCase().startsWith("в ") ||
          addr.toLowerCase().startsWith("по ")
          ? addr
          : `по месту требования (${addr})`
        : "по месту требования";
      paragraphs.push(`Характеристика выдана для предъявления ${goal}.`);
    }

    return paragraphs.join("\n\n");
  };

  const handleToggleCharBlock = (key: keyof CharBlocksState) => {
    setCharBlocks((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      if (
        key === "academic" ||
        key === "professional" ||
        key === "personal" ||
        key === "social" ||
        key === "habits" ||
        key === "purpose"
      ) {
        const student =
          students.find((s) => s.id === creatorSelectedStudentIds[0]) ||
          students[0];
        const newText = generateCharacteristicBody(
          updated,
          student,
          creatorGroup,
          creatorAddressee
        );
        setCreatorDescription(newText);
      }
      return updated;
    });
  };

  // Creator Step 1 filters
  const [creatorTplCategory, setCreatorTplCategory] = useState<string>("ALL");
  const [creatorTplSearch, setCreatorTplSearch] = useState<string>("");

  // Stats
  const stats = useMemo(() => {
    const total = workflowDocs.length;
    const drafts = workflowDocs.filter((d) => d.status === "DRAFT").length;
    const pending = workflowDocs.filter((d) => d.status === "PENDING_APPROVAL").length;
    const approved = workflowDocs.filter((d) => d.status === "APPROVED").length;
    const archived = workflowDocs.filter((d) => d.isArchived).length;
    return { total, drafts, pending, approved, archived };
  }, [workflowDocs]);

  // Creator Filtered Templates
  const creatorFilteredTemplates = useMemo(() => {
    return DOCUMENT_TEMPLATES.filter((tpl) => {
      if (creatorTplCategory !== "ALL" && tpl.category !== creatorTplCategory)
        return false;
      if (creatorTplSearch.trim()) {
        const q = creatorTplSearch.toLowerCase();
        const matchesTitle = tpl.title.toLowerCase().includes(q);
        const matchesCode = tpl.code.toLowerCase().includes(q);
        if (!matchesTitle && !matchesCode) return false;
      }
      return true;
    });
  }, [creatorTplCategory, creatorTplSearch]);

  // Students for chosen group
  const availableStudentsForGroup = useMemo(() => {
    let list = students;
    if (creatorGroup) {
      list = list.filter((st) => st.group === creatorGroup);
    }
    if (studentSearchInCreator.trim()) {
      const q = studentSearchInCreator.toLowerCase();
      list = list.filter((st) => st.name.toLowerCase().includes(q));
    }
    return list;
  }, [students, creatorGroup, studentSearchInCreator]);

  // Template selection in creator
  const handleSelectTemplate = (tpl: DocumentTemplateItem) => {
    setSelectedTemplate(tpl);
    setCreatorGeneralReason(tpl.defaultReason);
    setCreatorAddressee(tpl.defaultAddressee);

    const firstStudent =
      availableStudentsForGroup[0] || students[0] || undefined;

    if (tpl.id === "student_characteristic") {
      const body = generateCharacteristicBody(
        charBlocks,
        firstStudent,
        creatorGroup,
        tpl.defaultAddressee
      );
      setCreatorDescription(body);
    } else {
      const replaced = substituteVariables(tpl.defaultPrewrittenBody, {
        groupName: creatorGroup,
        student: firstStudent,
      });
      setCreatorDescription(replaced);
    }
    setCreatorStep(2);
  };

  const handleToggleStudentSelection = (st: WorkflowStudentDTO) => {
    if (selectedTemplate.isMultiStudent) {
      setCreatorSelectedStudentIds((prev) =>
        prev.includes(st.id) ? prev.filter((id) => id !== st.id) : [...prev, st.id]
      );
    } else {
      setCreatorSelectedStudentIds([st.id]);
      if (selectedTemplate.id === "student_characteristic") {
        setCreatorDescription(
          generateCharacteristicBody(charBlocks, st, creatorGroup, creatorAddressee)
        );
      } else {
        setCreatorDescription(
          substituteVariables(selectedTemplate.defaultPrewrittenBody, {
            groupName: creatorGroup,
            student: st,
          })
        );
      }
    }
  };

  const handleSelectAllCriticalStudents = () => {
    const critical = availableStudentsForGroup
      .filter((s) => s.unexcusedHours >= 36)
      .map((s) => s.id);
    setCreatorSelectedStudentIds(critical);
  };

  // Printing & Document Actions
  const handlePrintDocument = (docToPrint?: WorkflowDocument | null | unknown) => {
    const targetDoc =
      docToPrint && typeof docToPrint === "object" && "title" in docToPrint
        ? (docToPrint as WorkflowDocument)
        : previewDoc;

    if (!targetDoc && creatorStep === 4) {
      const creatorDoc = {
        title: selectedTemplate.title + (creatorGroup ? ` — Группа ${creatorGroup}` : ""),
        createdAt: new Date(),
        addressee: creatorAddressee,
        generalReason: creatorGeneralReason,
        descriptionText: creatorDescription,
        students: students.filter((st) => creatorSelectedStudentIds.includes(st.id)),
        signatoryName: creatorSignatory || currentUser?.name || "Вопольский Виктор Владимирович",
        signatoryTitle: "Мастер группы (куратор)",
        authorName: currentUser?.name || "Вопольский Виктор Владимирович",
        authorRole: "Мастер группы",
        docNumber: "ПРОЕКТ",
      };
      printHtmlContent(generateOfficialDocumentHtml(creatorDoc, currentUser?.name));
      return;
    }
    if (!targetDoc) return;
    printHtmlContent(generateOfficialDocumentHtml(targetDoc, currentUser?.name));
  };

  const handleDownloadDocx = (doc: WorkflowDocument) => {
    exportDocumentDocx(doc, currentUser?.name);
  };

  const handleDownloadPdf = (doc: WorkflowDocument) => {
    handlePrintDocument(doc);
  };

  // Save / Submit workflow document
  const handleSaveDocument = async (asDraft: boolean) => {
    const selectedStudentsList = students
      .filter((st) => creatorSelectedStudentIds.includes(st.id))
      .map((st) => ({
        id: st.id,
        name: st.name,
        rollNumber: st.rollNumber,
        group: st.group,
        attendanceRate: st.attendanceRate,
        unexcusedHours: st.unexcusedHours,
        academicDebts: st.academicDebts,
        debts: st.academicDebts,
        individualReason: creatorIndividualReasons[st.id] || "",
      }));

    const isCharacteristicOrSimple =
      selectedTemplate.category === "CURATOR" ||
      selectedTemplate.id === "student_characteristic";

    const codePrefix = selectedTemplate.code.split("-")[0] || "ДОК";
    const nextDocNumber = `${codePrefix}-2026/0${Math.floor(Math.random() * 80 + 10)}`;

    const newDoc: WorkflowDocument = {
      id: `doc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      docNumber: nextDocNumber,
      templateId: selectedTemplate.id,
      title: `${selectedTemplate.title}${
        !selectedTemplate.isMultiStudent && selectedStudentsList[0]
          ? ` — ${selectedStudentsList[0].name}`
          : creatorGroup
            ? ` (${creatorGroup})`
            : ""
      }`,
      category: selectedTemplate.category,
      categoryLabel: selectedTemplate.categoryLabel,
      status: asDraft
        ? "DRAFT"
        : isCharacteristicOrSimple
          ? "APPROVED"
          : "PENDING_APPROVAL",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      authorId: currentUser?.id || "curator-1",
      authorName: creatorSignatory || currentUser?.name || "Вопольский Виктор Владимирович",
      authorRole: creatorSignatoryRole,
      signatoryName: creatorSignatory || currentUser?.name || "Вопольский Виктор Владимирович",
      signatoryTitle: creatorSignatoryRole,
      addressee: creatorAddressee,
      generalReason: creatorGeneralReason,
      descriptionText: creatorDescription,
      groupName: creatorGroup,
      students: selectedStudentsList,
      approvalSteps: isCharacteristicOrSimple
        ? [
            {
              stepIndex: 1,
              role: "CURATOR",
              roleTitle: "Мастер группы (куратор)",
              name: creatorSignatory || currentUser?.name || "Вопольский Виктор Владимирович",
              status: "APPROVED",
              date: new Date().toLocaleDateString("ru-RU"),
              comment: "Характеристика сформирована в LMS и готова к печати.",
            },
          ]
        : [
            {
              stepIndex: 1,
              role: "CURATOR",
              roleTitle: "Мастер группы (куратор)",
              name: creatorSignatory || currentUser?.name || "Вопольский Виктор Владимирович",
              status: "APPROVED",
              date: new Date().toLocaleDateString("ru-RU"),
              comment: "Рапорт сформирован и передан в администрацию лицея.",
            },
            {
              stepIndex: 2,
              role: "ADMINISTRATION",
              roleTitle: "Администрация лицея (Зам. директора по УПР)",
              name: "Тоялиева М. Р.",
              status: asDraft ? "PENDING" : "PENDING",
            },
          ],
      currentApprovalStepIndex: isCharacteristicOrSimple ? 1 : 1,
      isArchived: false,
    };

    isMutatingRef.current = true;
    setWorkflowDocs((prev) => [newDoc, ...prev]);
    setActiveTab("ALL_DOCS");
    setCreatorStep(1);

    try {
      const response = await fetch("/api/workflow-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doc: newDoc }),
      });
      const res = await response.json();
      if (res?.success && Array.isArray(res.documents)) {
        setWorkflowDocs(res.documents);
        toast.add({
          title: asDraft
            ? `Черновик документа сохранён в базе`
            : isCharacteristicOrSimple
              ? `Характеристика сформирована и сохранена в базе!`
              : `Документ передан в администрацию лицея!`,
          type: "success",
        });
      } else {
        toast.add({
          title: res?.error || "Ошибка сохранения документа в базе данных",
          type: "error",
        });
      }
    } catch {
      toast.add({
        title: "Ошибка соединения при сохранении документа",
        type: "error",
      });
    } finally {
      isMutatingRef.current = false;
    }
  };

  // Approval actions
  const handleApproveDocument = async () => {
    if (!approvalDoc) return;
    const nextSteps = [...approvalDoc.approvalSteps];
    const currentIdx = approvalDoc.currentApprovalStepIndex;
    if (nextSteps[currentIdx]) {
      nextSteps[currentIdx] = {
        ...nextSteps[currentIdx],
        status: "APPROVED" as const,
        date: new Date().toLocaleDateString("ru-RU"),
        comment: approvalComment.trim() || "Решение утверждено администрацией лицея",
      };
    }
    const updatedDoc: WorkflowDocument = {
      ...approvalDoc,
      status: "APPROVED",
      approvalSteps: nextSteps,
      currentApprovalStepIndex: currentIdx + 1,
      updatedAt: new Date().toISOString(),
    };

    isMutatingRef.current = true;
    setWorkflowDocs((prev) => prev.map((d) => (d.id === updatedDoc.id ? updatedDoc : d)));
    setApprovalDoc(null);
    setApprovalComment("");

    try {
      const response = await fetch("/api/workflow-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doc: updatedDoc }),
      });
      const res = await response.json();
      if (res?.success && Array.isArray(res.documents)) {
        setWorkflowDocs(res.documents);
      }
      toast.add({
        title: `Решение утверждено! Документ готов к изданию приказа.`,
        type: "success",
      });
    } finally {
      isMutatingRef.current = false;
    }
  };

  const handleRejectDocument = async () => {
    if (!approvalDoc) return;
    const nextSteps = [...approvalDoc.approvalSteps];
    const currentIdx = approvalDoc.currentApprovalStepIndex;
    if (nextSteps[currentIdx]) {
      nextSteps[currentIdx] = {
        ...nextSteps[currentIdx],
        status: "REJECTED" as const,
        date: new Date().toLocaleDateString("ru-RU"),
        comment: approvalComment.trim() || "Отклонено решением администрации",
      };
    }
    const updatedDoc: WorkflowDocument = {
      ...approvalDoc,
      status: "REJECTED",
      approvalSteps: nextSteps,
      updatedAt: new Date().toISOString(),
    };

    isMutatingRef.current = true;
    setWorkflowDocs((prev) => prev.map((d) => (d.id === updatedDoc.id ? updatedDoc : d)));
    setApprovalDoc(null);
    setApprovalComment("");

    try {
      const response = await fetch("/api/workflow-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doc: updatedDoc }),
      });
      const res = await response.json();
      if (res?.success && Array.isArray(res.documents)) {
        setWorkflowDocs(res.documents);
      }
      toast.add({
        title: `Документ отклонён и возвращён на доработку куратору.`,
        type: "warning",
      });
    } finally {
      isMutatingRef.current = false;
    }
  };

  // Deletion actions
  const handleConfirmDeleteWorkflowDoc = async () => {
    if (!deleteWorkflowDocTarget) return;
    const targetId = deleteWorkflowDocTarget.id;
    isMutatingRef.current = true;
    setWorkflowDocs((prev) => prev.filter((d) => d.id !== targetId));
    setDeleteWorkflowDocTarget(null);

    try {
      const response = await fetch(
        `/api/workflow-documents?id=${encodeURIComponent(targetId)}`,
        { method: "DELETE" }
      );
      const res = await response.json();
      if (res?.success && Array.isArray(res.documents)) {
        setWorkflowDocs(res.documents);
      }
      toast.add({
        title: `Документ успешно удалён`,
        type: "success",
      });
    } finally {
      isMutatingRef.current = false;
    }
  };

  const handleConfirmDeleteRegDoc = async () => {
    if (!deleteRegDocTarget) return;
    const target = deleteRegDocTarget;
    setIsRegDocSubmitting(true);
    try {
      const res = await deleteDocumentAction(target.id);
      if (res.success) {
        setRegulatoryDocs((prev) => prev.filter((d) => d.id !== target.id));
        toast.add({
          title: `Документ «${target.title}» удалён`,
          type: "success",
        });
      } else {
        toast.add({
          title: res.error || "Не удалось удалить документ",
          type: "error",
        });
      }
    } catch {
      toast.add({
        title: "Ошибка соединения при удалении документа",
        type: "error",
      });
    } finally {
      setIsRegDocSubmitting(false);
      setDeleteRegDocTarget(null);
    }
  };

  // Create regulatory document
  const handleCreateRegulatoryDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRegTitle.trim() || !newRegUrl.trim()) return;
    setIsRegDocSubmitting(true);
    try {
      const res = await createDocumentAction({
        title: newRegTitle.trim(),
        category: newRegCategory,
        fileUrl: newRegUrl.trim(),
        description: newRegDescription.trim(),
      });
      if (res.success && res.document) {
        setRegulatoryDocs([res.document, ...regulatoryDocs]);
        toast.add({
          title: `Документ «${res.document.title}» добавлен в репозиторий`,
          type: "success",
        });
        setIsCreateRegDocOpen(false);
        setNewRegTitle("");
        setNewRegUrl("");
        setNewRegDescription("");
      } else {
        toast.add({
          title: res.error || "Не удалось создать документ",
          type: "error",
        });
      }
    } catch {
      toast.add({
        title: "Ошибка соединения с сервером",
        type: "error",
      });
    } finally {
      setIsRegDocSubmitting(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 p-4 text-xs">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <FileSignature className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-foreground tracking-tight">
                Документооборот и отчётность
              </h1>
              <p className="text-[11px] text-muted-foreground">
                Автоматизированное формирование, согласование и архив официальных документов лицея
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border bg-muted/30 text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            <span>
              Доступ: <strong className="text-foreground font-medium">Администрация лицея</strong> (директорат, завучи, кураторы)
            </span>
          </div>

          <Button
            size="sm"
            onClick={() => {
              setActiveTab("CREATE");
              setCreatorStep(1);
            }}
            className="h-8 text-xs px-3 gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Создать документ
          </Button>
        </div>
      </div>

      {/* Navigation Pills */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b text-xs">
        <button
          onClick={() => {
            setActiveTab("OVERVIEW");
            refreshFromServer();
          }}
          className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === "OVERVIEW"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          Обзор
        </button>

        <button
          onClick={() => {
            setActiveTab("ALL_DOCS");
            refreshFromServer();
          }}
          className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === "ALL_DOCS"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          Реестр документов
          <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded bg-black/10 dark:bg-white/10 font-normal">
            {stats.total}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("CREATE")}
          className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === "CREATE"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Plus className="h-3.5 w-3.5" />
          Мастер создания
        </button>

        <button
          onClick={() => setActiveTab("TEMPLATES")}
          className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === "TEMPLATES"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          Шаблоны документов ({DOCUMENT_TEMPLATES.length})
        </button>

        <button
          onClick={() => setActiveTab("REGULATORY")}
          className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === "REGULATORY"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          Нормативная база ({regulatoryDocs.length})
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === "OVERVIEW" && (
        <WorkflowOverviewTab
          stats={stats}
          workflowDocs={workflowDocs}
          students={students}
          creatorGroup={creatorGroup}
          creatorSelectedStudentIds={creatorSelectedStudentIds}
          canManage={canManage}
          canApprove={canApprove}
          onQuickCreate={(tpl, desc) => {
            setSelectedTemplate(tpl);
            setCreatorGeneralReason(tpl.defaultReason);
            setCreatorAddressee(tpl.defaultAddressee);
            setCreatorDescription(desc);
            setCreatorStep(2);
            setActiveTab("CREATE");
          }}
          onNavigateToAll={() => setActiveTab("ALL_DOCS")}
          onPreviewDoc={(doc) => setPreviewDoc(doc)}
          onApprovalDoc={(doc) => setApprovalDoc(doc)}
          onPrintDoc={(doc) => handlePrintDocument(doc)}
          onDownloadPdf={(doc) => handleDownloadPdf(doc)}
          onDeleteDoc={(doc) => setDeleteWorkflowDocTarget(doc)}
        />
      )}

      {/* Tab 2: Registry */}
      {activeTab === "ALL_DOCS" && (
        <WorkflowRegistryTab
          workflowDocs={workflowDocs}
          groups={groups}
          canManage={canManage}
          canApprove={canApprove}
          currentUserId={currentUser?.id}
          activeFilterMode="ALL_DOCS"
          onPreviewDoc={(doc) => setPreviewDoc(doc)}
          onApprovalDoc={(doc) => setApprovalDoc(doc)}
          onPrintDoc={(doc) => handlePrintDocument(doc)}
          onDownloadPdf={(doc) => handleDownloadPdf(doc)}
          onDeleteDoc={(doc) => setDeleteWorkflowDocTarget(doc)}
        />
      )}

      {/* Tab 3: Creator Wizard */}
      {activeTab === "CREATE" && (
        <WorkflowCreatorTab
          creatorStep={creatorStep}
          setCreatorStep={setCreatorStep}
          selectedTemplate={selectedTemplate}
          setSelectedTemplate={setSelectedTemplate}
          creatorGroup={creatorGroup}
          setCreatorGroup={setCreatorGroup}
          groups={groups}
          creatorSelectedStudentIds={creatorSelectedStudentIds}
          setCreatorSelectedStudentIds={setCreatorSelectedStudentIds}
          students={students}
          availableStudentsForGroup={availableStudentsForGroup}
          creatorIndividualReasons={creatorIndividualReasons}
          setCreatorIndividualReasons={setCreatorIndividualReasons}
          enableIndividualReasons={enableIndividualReasons}
          setEnableIndividualReasons={setEnableIndividualReasons}
          creatorGeneralReason={creatorGeneralReason}
          setCreatorGeneralReason={setCreatorGeneralReason}
          creatorAddressee={creatorAddressee}
          setCreatorAddressee={setCreatorAddressee}
          creatorDescription={creatorDescription}
          setCreatorDescription={setCreatorDescription}
          creatorSignatory={creatorSignatory}
          setCreatorSignatory={setCreatorSignatory}
          creatorSignatoryRole={creatorSignatoryRole}
          setCreatorSignatoryRole={setCreatorSignatoryRole}
          studentSearchInCreator={studentSearchInCreator}
          setStudentSearchInCreator={setStudentSearchInCreator}
          charBlocks={charBlocks}
          setCharBlocks={setCharBlocks}
          handleToggleCharBlock={handleToggleCharBlock}
          creatorTplCategory={creatorTplCategory}
          setCreatorTplCategory={setCreatorTplCategory}
          creatorTplSearch={creatorTplSearch}
          setCreatorTplSearch={setCreatorTplSearch}
          creatorFilteredTemplates={creatorFilteredTemplates}
          handleSelectTemplate={handleSelectTemplate}
          handleToggleStudentSelection={handleToggleStudentSelection}
          handleSelectAllCriticalStudents={handleSelectAllCriticalStudents}
          handlePrintDocument={() => handlePrintDocument()}
          handleSaveDocument={handleSaveDocument}
          currentUser={currentUser}
        />
      )}

      {/* Tab 4: Templates Library */}
      {activeTab === "TEMPLATES" && (
        <WorkflowTemplatesTab
          onPreviewTemplate={(tpl) => setPreviewingTemplate(tpl)}
          onSelectTemplateForCreate={(tpl) => {
            setSelectedTemplate(tpl);
            setCreatorGeneralReason(tpl.defaultReason);
            setCreatorAddressee(tpl.defaultAddressee);
            setCreatorStep(2);
            setActiveTab("CREATE");
          }}
        />
      )}

      {/* Tab 5: Regulatory Base */}
      {activeTab === "REGULATORY" && (
        <WorkflowArchiveTab
          regulatoryDocs={regulatoryDocs}
          canManage={canManage}
          onOpenUploadDialog={() => setIsCreateRegDocOpen(true)}
          onDeleteRegDoc={(doc) => setDeleteRegDocTarget(doc)}
        />
      )}

      {/* Dialog 1: Official Document Blank Preview */}
      <DocumentPreviewDialog
        previewDoc={previewDoc}
        onClose={() => setPreviewDoc(null)}
        onPrint={(doc) => handlePrintDocument(doc)}
        onDownloadDocx={(doc) => handleDownloadDocx(doc)}
        onDownloadPdf={(doc) => handleDownloadPdf(doc)}
        onDeleteRequest={(doc) => setDeleteWorkflowDocTarget(doc)}
        onApprovalRequest={(doc) => setApprovalDoc(doc)}
        canManage={canManage}
        canApprove={canApprove}
        currentUserName={currentUser?.name}
      />

      {/* Dialog 2: Approval Decision */}
      <DocumentApprovalDialog
        approvalDoc={approvalDoc}
        approvalComment={approvalComment}
        setApprovalComment={setApprovalComment}
        onClose={() => {
          setApprovalDoc(null);
          setApprovalComment("");
        }}
        onApprove={handleApproveDocument}
        onReject={handleRejectDocument}
      />

      {/* Dialog 3: Template Preview */}
      <TemplatePreviewDialog
        previewingTemplate={previewingTemplate}
        onClose={() => setPreviewingTemplate(null)}
        onUseTemplate={(tpl) => {
          setPreviewingTemplate(null);
          setSelectedTemplate(tpl);
          setCreatorGeneralReason(tpl.defaultReason);
          setCreatorAddressee(tpl.defaultAddressee);
          setCreatorStep(2);
          setActiveTab("CREATE");
        }}
        sampleStudent={students[0]}
      />

      {/* Dialog 4: Regulatory Upload */}
      <RegulatoryUploadDialog
        isOpen={isCreateRegDocOpen}
        onClose={() => setIsCreateRegDocOpen(false)}
        newRegTitle={newRegTitle}
        setNewRegTitle={setNewRegTitle}
        newRegCategory={newRegCategory}
        setNewRegCategory={setNewRegCategory}
        newRegUrl={newRegUrl}
        setNewRegUrl={setNewRegUrl}
        newRegDescription={newRegDescription}
        setNewRegDescription={setNewRegDescription}
        isSubmitting={isRegDocSubmitting}
        onSubmit={handleCreateRegulatoryDoc}
      />

      {/* Dialog 5: Delete Dialogs */}
      <DocumentDeleteDialogs
        deleteWorkflowDocTarget={deleteWorkflowDocTarget}
        onCloseWorkflowDelete={() => setDeleteWorkflowDocTarget(null)}
        onConfirmWorkflowDelete={handleConfirmDeleteWorkflowDoc}
        deleteRegDocTarget={deleteRegDocTarget}
        onCloseRegDelete={() => setDeleteRegDocTarget(null)}
        onConfirmRegDelete={handleConfirmDeleteRegDoc}
        isRegSubmitting={isRegDocSubmitting}
      />
    </div>
  );
}
