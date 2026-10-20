"use client";

import React, { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  FileText,
  Plus,
  Search,
  Printer,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Users,
  FileCheck2,
  FileSpreadsheet,
  Building2,
  FolderOpen,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  History,
  Archive,
  Eye,
  Trash2,
  ExternalLink,
  BookOpen,
  Sparkles,
  Filter,
  Check,
  X,
  FileSignature,
  Calendar,
  Layers,
  GraduationCap,
  SlidersHorizontal,
} from "lucide-react";
import type { DocumentDTO } from "../actions";
import {
  createDocumentAction,
  deleteDocumentAction,
} from "../actions";
import {
  DocumentWorkflowStatus,
  DocumentCategoryType,
  WorkflowDocument,
  DocumentTemplateItem,
  StudentMockItem,
  MOCK_GROUPS,
  MOCK_STUDENTS,
  DOCUMENT_TEMPLATES,
  INITIAL_MOCK_DOCUMENTS,
} from "../workflow-data";

interface DocumentsWorkflowViewProps {
  documents: DocumentDTO[];
  canManage: boolean;
}

type TabType =
  | "OVERVIEW"
  | "ALL_DOCS"
  | "MY_DOCS"
  | "CREATE"
  | "TEMPLATES"
  | "APPROVAL"
  | "ARCHIVE"
  | "REGULATORY";

const STATUS_CONFIG: Record<
  DocumentWorkflowStatus,
  { label: string; bg: string; text: string; icon: React.ReactNode }
> = {
  DRAFT: {
    label: "Черновик",
    bg: "bg-muted text-muted-foreground border-border",
    text: "text-muted-foreground",
    icon: <Clock className="h-3 w-3" />,
  },
  PENDING_APPROVAL: {
    label: "На согласовании",
    bg: "bg-primary/10 text-primary border-primary/20",
    text: "text-primary",
    icon: <Send className="h-3 w-3" />,
  },
  APPROVED: {
    label: "Утверждён",
    bg: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800",
    text: "text-emerald-600",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  REJECTED: {
    label: "Отклонён",
    bg: "bg-destructive/10 text-destructive border-destructive/20",
    text: "text-destructive",
    icon: <AlertCircle className="h-3 w-3" />,
  },
  ARCHIVED: {
    label: "В архиве",
    bg: "bg-muted text-muted-foreground border-border",
    text: "text-muted-foreground",
    icon: <Archive className="h-3 w-3" />,
  },
};

function getDocumentStatusBadge(doc: WorkflowDocument) {
  if (doc.status === "APPROVED") {
    const isSimple =
      doc.category === "CURATOR" || doc.docNumber.startsWith("ХАР");
    return {
      label: isSimple ? "Сформирован" : "Утверждён педсоветом",
      bg: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800",
      text: "text-emerald-600",
      icon: <CheckCircle2 className="h-3 w-3" />,
      subtext: isSimple ? "Готов к печати и выдаче" : "Решение педсовета принято",
    };
  }
  if (doc.status === "PENDING_APPROVAL") {
    return {
      label: "Подан на педсовет",
      bg: "bg-primary/10 text-primary border-primary/20",
      text: "text-primary",
      icon: <Send className="h-3 w-3" />,
      subtext: "Ожидает решения педсовета",
    };
  }
  if (doc.status === "REJECTED") {
    return {
      label: "Отклонён",
      bg: "bg-destructive/10 text-destructive border-destructive/20",
      text: "text-destructive",
      icon: <AlertCircle className="h-3 w-3" />,
      subtext: "Возвращён куратору",
    };
  }
  if (doc.status === "DRAFT") {
    return {
      label: "Черновик",
      bg: "bg-muted text-muted-foreground border-border",
      text: "text-muted-foreground",
      icon: <Clock className="h-3 w-3" />,
      subtext: "В процессе подготовки",
    };
  }
  return {
    label: "В архиве",
    bg: "bg-muted text-muted-foreground border-border",
    text: "text-muted-foreground",
    icon: <Archive className="h-3 w-3" />,
    subtext: "Архивное дело",
  };
}

export function DocumentsWorkflowView({
  documents: initialRegulatoryDocs,
  canManage,
}: DocumentsWorkflowViewProps) {
  // Navigation
  const [activeTab, setActiveTab] = useState<TabType>("OVERVIEW");

  // Documents state (mock data + interaction)
  const [workflowDocs, setWorkflowDocs] = useState<WorkflowDocument[]>(
    INITIAL_MOCK_DOCUMENTS
  );

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [groupFilter, setGroupFilter] = useState<string>("ALL");

  // Selected document for official A4 Preview / Print Modal
  const [previewDoc, setPreviewDoc] = useState<WorkflowDocument | null>(null);

  // Selected document for Approval Modal
  const [approvalDoc, setApprovalDoc] = useState<WorkflowDocument | null>(null);
  const [approvalComment, setApprovalComment] = useState("");

  // ==========================================
  // DOCUMENT CREATOR / WIZARD STATE
  // ==========================================
  const [creatorStep, setCreatorStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedTemplate, setSelectedTemplate] =
    useState<DocumentTemplateItem>(DOCUMENT_TEMPLATES[0]);
  const [creatorGroup, setCreatorGroup] = useState<string>("ИС-1-25");
  const [creatorSelectedStudentIds, setCreatorSelectedStudentIds] = useState<
    string[]
  >(["st-1", "st-2"]);
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
  const [creatorSignatory, setCreatorSignatory] = useState("Исаев К. Д.");
  const [creatorSignatoryRole, setCreatorSignatoryRole] = useState(
    "Мастер группы"
  );
  const [studentSearchInCreator, setStudentSearchInCreator] = useState("");

  // Modular constructor blocks for Характеристика на студента (ХАР-01)
  const [charBlocks, setCharBlocks] = useState({
    academic: true, // 1. Успеваемость и журнал
    professional: true, // 2. Интерес к специальности и олимпиады
    personal: true, // 3. Личные качества и характер в коллективе
    social: true, // 4. Общественная активность и мероприятия
    habits: true, // 5. Дисциплина и устав
    purpose: true, // 6. Заключительная цель выдачи
    signCurator: true, // Подпись слева: Мастер группы
    signViceDirector: true, // Подпись справа: Зам. директора по учебной части Тоялиева М. Р.
    signDirector: false, // Гриф утверждения: Директор лицея Сагынбекова Ч. М.
  });

  const generateCharacteristicBody = (
    blocks: typeof charBlocks,
    student?: StudentMockItem,
    groupName?: string,
    targetAddressee?: string
  ) => {
    const studentName = student?.name || "Асанов Азамат Бакытович";
    const grp = groupName || student?.group || creatorGroup;
    const specialty =
      student?.specialty ||
      "54.02.01 Информационные системы и программирование";
    const attendance = String(student?.attendanceRate ?? 95);

    const paragraphs: string[] = [];

    // 1. Вводная часть
    paragraphs.push(
      `Характеристика выдана студенту ${studentName}, обучающемуся в Профессиональном лицее №98 по специальности ${specialty}, учебная группа ${grp}.`
    );

    // 2. Учеба и посещаемость
    if (blocks.academic) {
      paragraphs.push(
        `За время обучения в лицее ${studentName} зарекомендовал себя как дисциплинированный, ответственный и добросовестный учащийся. К выполнению учебного плана и поручений куратора относится с высокой степенью осознанности. Академических задолженностей не имеет, учебную программу осваивает на «хорошо» и «отлично». Текущий показатель посещаемости учебных занятий составляет ${attendance}%, пропусков без уважительной причины не допускает.`
      );
    }

    // 3. Профессиональные качества
    if (blocks.professional) {
      paragraphs.push(
        `В процессе освоения теоретических и практических дисциплин проявляет выраженный интерес к будущей специальности, аналитический склад ума и стремление к углублению профессиональных навыков. Неоднократно принимал участие в профессиональных олимпиадах и конкурсах профмастерства лицея.`
      );
    }

    // 4. Личные качества и характер
    if (blocks.personal) {
      paragraphs.push(
        `По характеру сдержан, тактичен, вежлив в общении с преподавателями, мастерами производственного обучения и сокурсниками. Среди студентов группы ${grp} пользуется авторитетом и уважением. В конфликтных ситуациях замечен не был, проявляет стрессоустойчивость и готовность прийти на помощь товарищам.`
      );
    }

    // 5. Общественная активность
    if (blocks.social) {
      paragraphs.push(
        `Активно участвует в общественной жизни группы и культурно-массовых мероприятиях лицея, проявляет организаторские способности и инициативу.`
      );
    }

    // 6. Дисциплина и устав
    if (blocks.habits) {
      paragraphs.push(
        `Правила внутреннего распорядка учебного заведения и нормы поведения соблюдает неукоснительно. Вредных привычек не имеет.`
      );
    }

    // 7. Заключение / цель
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

  const handleToggleCharBlock = (key: keyof typeof charBlocks) => {
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
          MOCK_STUDENTS.find((s) => s.id === creatorSelectedStudentIds[0]) ||
          MOCK_STUDENTS[0];
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

  // Regulatory documents (existing)
  const [regulatoryDocs, setRegulatoryDocs] = useState(initialRegulatoryDocs);
  const [regSearch, setRegSearch] = useState("");
  const [regCategory, setRegCategory] = useState("ALL");

  // Templates tab filters & preview
  const [templateCatFilter, setTemplateCatFilter] = useState<string>("ALL");
  const [templateSearch, setTemplateSearch] = useState<string>("");
  const [previewingTemplate, setPreviewingTemplate] =
    useState<DocumentTemplateItem | null>(null);

  // Creator Step 1 filters
  const [creatorTplCategory, setCreatorTplCategory] = useState<string>("ALL");
  const [creatorTplSearch, setCreatorTplSearch] = useState<string>("");

  // Stats calculation
  const stats = useMemo(() => {
    const total = workflowDocs.length;
    const drafts = workflowDocs.filter((d) => d.status === "DRAFT").length;
    const pending = workflowDocs.filter(
      (d) => d.status === "PENDING_APPROVAL"
    ).length;
    const approved = workflowDocs.filter(
      (d) => d.status === "APPROVED"
    ).length;
    const archived = workflowDocs.filter((d) => d.isArchived).length;
    return { total, drafts, pending, approved, archived };
  }, [workflowDocs]);

  // Filtered templates for Templates Tab
  const filteredTemplates = useMemo(() => {
    return DOCUMENT_TEMPLATES.filter((tpl) => {
      if (templateCatFilter !== "ALL" && tpl.category !== templateCatFilter)
        return false;
      if (templateSearch.trim()) {
        const q = templateSearch.toLowerCase();
        const matchesTitle = tpl.title.toLowerCase().includes(q);
        const matchesCode = tpl.code.toLowerCase().includes(q);
        const matchesDesc = tpl.description.toLowerCase().includes(q);
        const matchesVars = tpl.variables.some((v) =>
          v.toLowerCase().includes(q)
        );
        if (!matchesTitle && !matchesCode && !matchesDesc && !matchesVars)
          return false;
      }
      return true;
    });
  }, [templateCatFilter, templateSearch]);

  // Filtered templates for Creator Step 1
  const creatorFilteredTemplates = useMemo(() => {
    return DOCUMENT_TEMPLATES.filter((tpl) => {
      if (creatorTplCategory !== "ALL" && tpl.category !== creatorTplCategory)
        return false;
      if (creatorTplSearch.trim()) {
        const q = creatorTplSearch.toLowerCase();
        const matchesTitle = tpl.title.toLowerCase().includes(q);
        const matchesCode = tpl.code.toLowerCase().includes(q);
        const matchesDesc = tpl.description.toLowerCase().includes(q);
        if (!matchesTitle && !matchesCode && !matchesDesc) return false;
      }
      return true;
    });
  }, [creatorTplCategory, creatorTplSearch]);

  // Filtered documents list
  const filteredDocs = useMemo(() => {
    return workflowDocs.filter((doc) => {
      if (activeTab === "ARCHIVE" && !doc.isArchived) return false;
      if (activeTab === "ALL_DOCS" && doc.isArchived) return false;
      if (activeTab === "MY_DOCS" && doc.authorRole !== "Куратор группы ИС-1-25")
        return false;
      if (activeTab === "APPROVAL" && doc.status !== "PENDING_APPROVAL")
        return false;

      if (statusFilter !== "ALL" && doc.status !== statusFilter) return false;
      if (categoryFilter !== "ALL" && doc.category !== categoryFilter)
        return false;
      if (groupFilter !== "ALL" && doc.groupName !== groupFilter) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = doc.title.toLowerCase().includes(query);
        const matchesNumber = doc.docNumber.toLowerCase().includes(query);
        const matchesAuthor = doc.authorName.toLowerCase().includes(query);
        const matchesStudent = doc.students.some((s) =>
          s.name.toLowerCase().includes(query)
        );
        if (!matchesTitle && !matchesNumber && !matchesAuthor && !matchesStudent)
          return false;
      }

      return true;
    });
  }, [
    workflowDocs,
    activeTab,
    statusFilter,
    categoryFilter,
    groupFilter,
    searchQuery,
  ]);

  // Students available for the selected group in creator
  const availableStudentsForGroup = useMemo(() => {
    return MOCK_STUDENTS.filter((st) => st.group === creatorGroup).filter(
      (st) =>
        !studentSearchInCreator ||
        st.name.toLowerCase().includes(studentSearchInCreator.toLowerCase()) ||
        st.rollNumber.includes(studentSearchInCreator)
    );
  }, [creatorGroup, studentSearchInCreator]);

  // Variable substitution helper for prewritten official texts
  const substituteVariables = (
    templateText: string,
    params: {
      student?: StudentMockItem;
      groupName?: string;
    }
  ) => {
    const { student, groupName } = params;
    return templateText
      .replace(/\{ФИО_СТУДЕНТА\}/g, student?.name || "Асанов Азамат Бакытович")
      .replace(/\{ГРУППА\}/g, groupName || student?.group || creatorGroup)
      .replace(
        /\{СПЕЦИАЛЬНОСТЬ\}/g,
        student?.specialty ||
        "54.02.01 Информационные системы и программирование"
      )
      .replace(/\{КУРС\}/g, String(student?.course || 1))
      .replace(
        /\{ПОСЕЩАЕМОСТЬ_С_ЖУРНАЛА\}/g,
        String(student?.attendanceRate ?? 95)
      )
      .replace(
        /\{ЧАСЫ_ПРОПУСКОВ\}/g,
        String(student?.unexcusedHours ?? 72)
      )
      .replace(
        /\{КОЛИЧЕСТВО_ДОЛГОВ\}/g,
        String(student?.academicDebts ?? 3)
      )
      .replace(/\{ЛИЧНОЕ_ДЕЛО\}/g, student?.rollNumber || "3941")
      .replace(/\{ЦЕЛЕВАЯ_ГРУППА\}/g, "ВЕБ-1-25")
      .replace(/\{КУРАТОР\}/g, creatorSignatory)
      .replace(/\{ПЕРИОД\}/g, "октябрь 2026 г.");
  };

  // Handlers for creator
  const handleSelectTemplate = (tpl: DocumentTemplateItem) => {
    setSelectedTemplate(tpl);
    setCreatorGeneralReason(tpl.defaultReason);
    setCreatorAddressee(tpl.defaultAddressee);
    const selectedStudent =
      MOCK_STUDENTS.find((s) => s.id === creatorSelectedStudentIds[0]) ||
      MOCK_STUDENTS[0];
    const generated =
      tpl.id === "student_characteristic"
        ? generateCharacteristicBody(
          charBlocks,
          selectedStudent,
          creatorGroup,
          tpl.defaultAddressee
        )
        : substituteVariables(tpl.defaultPrewrittenBody, {
          student: selectedStudent,
          groupName: creatorGroup,
        });
    setCreatorDescription(generated);
    setCreatorStep(2);
  };

  const handleToggleStudentSelection = (st: StudentMockItem) => {
    if (!selectedTemplate.isMultiStudent) {
      // Single student mode
      setCreatorSelectedStudentIds([st.id]);
      const generated =
        selectedTemplate.id === "student_characteristic"
          ? generateCharacteristicBody(
            charBlocks,
            st,
            creatorGroup,
            creatorAddressee
          )
          : substituteVariables(selectedTemplate.defaultPrewrittenBody, {
            student: st,
            groupName: creatorGroup,
          });
      setCreatorDescription(generated);
      return;
    }

    if (creatorSelectedStudentIds.includes(st.id)) {
      setCreatorSelectedStudentIds((prev) =>
        prev.filter((id) => id !== st.id)
      );
    } else {
      setCreatorSelectedStudentIds((prev) => [...prev, st.id]);
    }
  };

  const handleSelectAllCriticalStudents = () => {
    const critical = availableStudentsForGroup.filter(
      (st) => st.unexcusedHours >= 50
    );
    const ids = critical.map((c) => c.id);
    setCreatorSelectedStudentIds(ids);
    toast.add({
      title: "Выбраны студенты с критическими пропусками (от 50 ч.)",
      type: "success",
    });
  };

  // Compile final document from creator
  const handleSaveDocument = (asDraft: boolean) => {
    const selectedStudentsList = MOCK_STUDENTS.filter((st) =>
      creatorSelectedStudentIds.includes(st.id)
    ).map((st) => ({
      id: st.id,
      name: st.name,
      rollNumber: st.rollNumber,
      group: st.group,
      individualReason: enableIndividualReasons && creatorIndividualReasons[st.id]?.trim()
        ? creatorIndividualReasons[st.id].trim()
        : "",
      attendanceRate: st.attendanceRate,
      debts: st.academicDebts,
    }));

    const codePrefix = selectedTemplate.code.split("-")[0] || "ДОК";
    const nextDocNumber = `${codePrefix}-2026/0${Math.floor(Math.random() * 80 + 10)}`;
    const docTitle = selectedTemplate.isMultiStudent
      ? `${selectedTemplate.title} (группа ${creatorGroup})`
      : selectedStudentsList[0]
        ? `${selectedTemplate.title} — ${selectedStudentsList[0].name}`
        : `${selectedTemplate.title} (${creatorGroup})`;

    const isCharacteristicOrSimple =
      selectedTemplate.id === "student_characteristic" ||
      selectedTemplate.category === "CURATOR";

    const initialStatus: DocumentWorkflowStatus = asDraft
      ? "DRAFT"
      : isCharacteristicOrSimple
        ? "APPROVED"
        : "PENDING_APPROVAL";

    const approvalSteps = isCharacteristicOrSimple
      ? [
          {
            roleTitle: creatorSignatoryRole || "Куратор группы",
            name: creatorSignatory || "Исаев К. Д.",
            status: "APPROVED" as const,
            date: new Date().toLocaleDateString("ru-RU"),
            comment: "Характеристика сформирована в LMS и готова к печати.",
          },
          ...(charBlocks.signDirector
            ? [
                {
                  roleTitle: "Директор лицея",
                  name: "Сагынбекова Ч. М.",
                  status: "APPROVED" as const,
                  date: new Date().toLocaleDateString("ru-RU"),
                  comment: "Утверждено к выдаче (с гербовой печатью лицея).",
                },
              ]
            : []),
        ]
      : [
          {
            roleTitle: creatorSignatoryRole || "Куратор группы (инициатор)",
            name: creatorSignatory || "Исаев К. Д.",
            status: "APPROVED" as const,
            date: new Date().toLocaleDateString("ru-RU"),
            comment: "Рапорт сформирован в LMS и подан на рассмотрение руководства лицея.",
          },
          {
            roleTitle: "Педагогический совет / Дирекция",
            name: "Сагынбекова Ч. М. / Тоялиева М. Р.",
            status: "PENDING" as const,
          },
        ];

    const newDoc: WorkflowDocument = {
      id: `doc-${Date.now()}`,
      docNumber: nextDocNumber,
      title: docTitle,
      category: selectedTemplate.category,
      categoryLabel: selectedTemplate.categoryLabel,
      status: initialStatus,
      groupName: creatorGroup,
      students: selectedStudentsList,
      authorName: creatorSignatory,
      authorRole: creatorSignatoryRole,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      addressee: creatorAddressee,
      signatoryTitle: creatorSignatoryRole,
      signatoryName: creatorSignatory,
      generalReason: creatorGeneralReason,
      descriptionText: creatorDescription,
      approvalSteps,
      currentApprovalStepIndex: isCharacteristicOrSimple ? 0 : 1,
    };

    setWorkflowDocs((prev) => [newDoc, ...prev]);
    toast.add({
      title: asDraft
        ? `Черновик документа № ${newDoc.docNumber} сохранён`
        : isCharacteristicOrSimple
          ? `Характеристика № ${newDoc.docNumber} сформирована и готова к печати!`
          : `Рапорт № ${newDoc.docNumber} подан на рассмотрение руководства лицея!`,
      type: "success",
    });
    setActiveTab("ALL_DOCS");
    setCreatorStep(1);
  };

  // Approval actions (Pedagogical council / Administration resolution)
  const handleApproveDocument = () => {
    if (!approvalDoc) return;
    setWorkflowDocs((prev) =>
      prev.map((d) => {
        if (d.id !== approvalDoc.id) return d;
        const nextSteps = [...d.approvalSteps];
        const currentIdx = d.currentApprovalStepIndex;
        if (nextSteps[currentIdx]) {
          nextSteps[currentIdx] = {
            ...nextSteps[currentIdx],
            status: "APPROVED",
            date: new Date().toLocaleDateString("ru-RU"),
            comment:
              approvalComment.trim() ||
              "Утверждено решением педагогического совета / дирекции лицея.",
          };
        }
        return {
          ...d,
          approvalSteps: nextSteps,
          status: "APPROVED",
          updatedAt: new Date().toISOString(),
        };
      })
    );
    toast.add({
      title: "Рапорт утверждён педагогическим советом лицея!",
      type: "success",
    });
    setApprovalDoc(null);
    setApprovalComment("");
  };

  const handleRejectDocument = () => {
    if (!approvalDoc) return;
    if (!approvalComment.trim()) {
      toast.add({
        title: "Пожалуйста, укажите причину отклонения или замечание",
        type: "error",
      });
      return;
    }
    setWorkflowDocs((prev) =>
      prev.map((d) => {
        if (d.id !== approvalDoc.id) return d;
        const nextSteps = [...d.approvalSteps];
        const currentIdx = d.currentApprovalStepIndex;
        if (nextSteps[currentIdx]) {
          nextSteps[currentIdx] = {
            ...nextSteps[currentIdx],
            status: "REJECTED",
            date: new Date().toLocaleDateString("ru-RU"),
            comment: approvalComment,
          };
        }
        return {
          ...d,
          approvalSteps: nextSteps,
          status: "REJECTED",
          updatedAt: new Date().toISOString(),
        };
      })
    );
    toast.add({
      title: "Рапорт отклонён / возвращён куратору",
      type: "info",
    });
    setApprovalDoc(null);
    setApprovalComment("");
  };

  // Simulated print / export
  const handlePrintDocument = () => {
    window.print();
  };

  const handleDownloadDocx = (doc: WorkflowDocument) => {
    toast.add({
      title: `Экспорт в Microsoft Word (${doc.docNumber}.docx)...`,
      type: "success",
    });
  };

  const handleDownloadPdf = (doc: WorkflowDocument) => {
    toast.add({
      title: `Формирование официального PDF (${doc.docNumber}.pdf)...`,
      type: "success",
    });
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
              Доступ: <strong className="text-foreground font-medium">Администрация лицея</strong> (директорат, завучи, педсовет)
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

      {/* Navigation Pills (Strict 1px border, no font-weight toggling) */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b text-xs">
        <button
          onClick={() => setActiveTab("OVERVIEW")}
          className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${activeTab === "OVERVIEW"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
        >
          <Layers className="h-3.5 w-3.5" />
          Обзор
        </button>

        <button
          onClick={() => setActiveTab("ALL_DOCS")}
          className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${activeTab === "ALL_DOCS"
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
          onClick={() => setActiveTab("MY_DOCS")}
          className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${activeTab === "MY_DOCS"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
        >
          <UserCheck className="h-3.5 w-3.5" />
          Мои документы
        </button>

        <button
          onClick={() => setActiveTab("APPROVAL")}
          className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${activeTab === "APPROVAL"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          Рассмотрение рапортов (Педсовет)
          {stats.pending > 0 && (
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded bg-black/10 dark:bg-white/10 font-normal">
              {stats.pending}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("TEMPLATES")}
          className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${activeTab === "TEMPLATES"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
        >
          <FileCheck2 className="h-3.5 w-3.5" />
          Шаблоны документов
        </button>

        <button
          onClick={() => setActiveTab("ARCHIVE")}
          className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${activeTab === "ARCHIVE"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
        >
          <Archive className="h-3.5 w-3.5" />
          Архив
        </button>

        <button
          onClick={() => setActiveTab("REGULATORY")}
          className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${activeTab === "REGULATORY"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
        >
          <BookOpen className="h-3.5 w-3.5" />
          Нормативная база лицея
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: OVERVIEW & DASHBOARD                               */}
      {/* ========================================================= */}
      {activeTab === "OVERVIEW" && (
        <div className="flex flex-col gap-4">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg border border-border bg-card flex flex-col justify-between">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-medium">Всего документов</span>
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-xl font-bold text-foreground">
                  {stats.total}
                </span>
                <span className="text-[10px] text-muted-foreground">в базе LMS</span>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-border bg-card flex flex-col justify-between">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-medium">Рапорты на педсовете</span>
                <Send className="h-4 w-4 text-primary" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-xl font-bold text-primary">
                  {stats.pending}
                </span>
                <span className="text-[10px] text-primary">ждут решения</span>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-border bg-card flex flex-col justify-between">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-medium">Готовые и утверждённые</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-xl font-bold text-emerald-600">
                  {stats.approved}
                </span>
                <span className="text-[10px] text-muted-foreground">готовы к выдаче</span>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-border bg-card flex flex-col justify-between">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-medium">Черновики</span>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-xl font-bold text-muted-foreground">
                  {stats.drafts}
                </span>
                <span className="text-[10px] text-muted-foreground">в работе</span>
              </div>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="p-3 rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Быстрые действия: создать популярный документ
              </h2>
              <span className="text-[11px] text-muted-foreground">
                Автозаполнение данными посещаемости и групп
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              <button
                onClick={() => {
                  const tpl = DOCUMENT_TEMPLATES[0]; // Характеристика
                  setSelectedTemplate(tpl);
                  setCreatorGeneralReason(tpl.defaultReason);
                  setCreatorAddressee(tpl.defaultAddressee);
                  const sel = MOCK_STUDENTS.find((s) => s.id === creatorSelectedStudentIds[0]) || MOCK_STUDENTS[0];
                  setCreatorDescription(substituteVariables(tpl.defaultPrewrittenBody, { student: sel, groupName: creatorGroup }));
                  setCreatorStep(2);
                  setActiveTab("CREATE");
                }}
                className="p-2.5 rounded-md border border-border bg-background hover:border-primary transition-colors text-left flex flex-col gap-1"
              >
                <div className="h-6 w-6 rounded bg-primary/10 text-primary flex items-center justify-center">
                  <GraduationCap className="h-3.5 w-3.5" />
                </div>
                <span className="font-medium text-foreground line-clamp-1">
                  Характеристика
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Готовый текст
                </span>
              </button>

              <button
                onClick={() => {
                  const tpl = DOCUMENT_TEMPLATES[1]; // Рапорт на 1 студента
                  setSelectedTemplate(tpl);
                  setCreatorGeneralReason(tpl.defaultReason);
                  setCreatorAddressee(tpl.defaultAddressee);
                  const sel = MOCK_STUDENTS.find((s) => s.id === creatorSelectedStudentIds[0]) || MOCK_STUDENTS[0];
                  setCreatorDescription(substituteVariables(tpl.defaultPrewrittenBody, { student: sel, groupName: creatorGroup }));
                  setCreatorStep(2);
                  setActiveTab("CREATE");
                }}
                className="p-2.5 rounded-md border border-border bg-background hover:border-primary transition-colors text-left flex flex-col gap-1"
              >
                <div className="h-6 w-6 rounded bg-primary/10 text-primary flex items-center justify-center">
                  <FileText className="h-3.5 w-3.5" />
                </div>
                <span className="font-medium text-foreground line-clamp-1">
                  Рапорт на отчисление
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Индивидуальный
                </span>
              </button>

              <button
                onClick={() => {
                  const tpl = DOCUMENT_TEMPLATES[2]; // Групповой рапорт
                  setSelectedTemplate(tpl);
                  setCreatorGeneralReason(tpl.defaultReason);
                  setCreatorAddressee(tpl.defaultAddressee);
                  setCreatorDescription(substituteVariables(tpl.defaultPrewrittenBody, { groupName: creatorGroup }));
                  setCreatorStep(2);
                  setActiveTab("CREATE");
                }}
                className="p-2.5 rounded-md border border-border bg-background hover:border-primary transition-colors text-left flex flex-col gap-1"
              >
                <div className="h-6 w-6 rounded bg-primary/10 text-primary flex items-center justify-center">
                  <Users className="h-3.5 w-3.5" />
                </div>
                <span className="font-medium text-foreground line-clamp-1">
                  Групповой рапорт
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Отчисление группы
                </span>
              </button>

              <button
                onClick={() => {
                  const tpl = DOCUMENT_TEMPLATES[3]; // О пропусках
                  setSelectedTemplate(tpl);
                  setCreatorGeneralReason(tpl.defaultReason);
                  setCreatorAddressee(tpl.defaultAddressee);
                  setCreatorDescription(substituteVariables(tpl.defaultPrewrittenBody, { groupName: creatorGroup }));
                  setCreatorStep(2);
                  setActiveTab("CREATE");
                }}
                className="p-2.5 rounded-md border border-border bg-background hover:border-primary transition-colors text-left flex flex-col gap-1"
              >
                <div className="h-6 w-6 rounded bg-primary/10 text-primary flex items-center justify-center">
                  <AlertCircle className="h-3.5 w-3.5" />
                </div>
                <span className="font-medium text-foreground line-clamp-1">
                  О пропусках
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Предупреждение
                </span>
              </button>

              <button
                onClick={() => {
                  const tpl = DOCUMENT_TEMPLATES[4]; // О переводе
                  setSelectedTemplate(tpl);
                  setCreatorGeneralReason(tpl.defaultReason);
                  setCreatorAddressee(tpl.defaultAddressee);
                  const sel = MOCK_STUDENTS.find((s) => s.id === creatorSelectedStudentIds[0]) || MOCK_STUDENTS[0];
                  setCreatorDescription(substituteVariables(tpl.defaultPrewrittenBody, { student: sel, groupName: creatorGroup }));
                  setCreatorStep(2);
                  setActiveTab("CREATE");
                }}
                className="p-2.5 rounded-md border border-border bg-background hover:border-primary transition-colors text-left flex flex-col gap-1"
              >
                <div className="h-6 w-6 rounded bg-primary/10 text-primary flex items-center justify-center">
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
                <span className="font-medium text-foreground line-clamp-1">
                  О переводе
                </span>
                <span className="text-[10px] text-muted-foreground">
                  В другую группу
                </span>
              </button>

              <button
                onClick={() => {
                  const tpl = DOCUMENT_TEMPLATES[7]; // Служебная записка
                  setSelectedTemplate(tpl);
                  setCreatorGeneralReason(tpl.defaultReason);
                  setCreatorAddressee(tpl.defaultAddressee);
                  setCreatorDescription(substituteVariables(tpl.defaultPrewrittenBody, { groupName: creatorGroup }));
                  setCreatorStep(2);
                  setActiveTab("CREATE");
                }}
                className="p-2.5 rounded-md border border-border bg-background hover:border-primary transition-colors text-left flex flex-col gap-1"
              >
                <div className="h-6 w-6 rounded bg-primary/10 text-primary flex items-center justify-center">
                  <FileSignature className="h-3.5 w-3.5" />
                </div>
                <span className="font-medium text-foreground line-clamp-1">
                  Служебная записка
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Администрации
                </span>
              </button>
            </div>
          </div>

          {/* Recent Documents Table */}
          <div className="p-3 rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-xs font-bold text-foreground">
                  Последние сформированные документы
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  Документы учебного процесса с историей согласований
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("ALL_DOCS")}
                className="h-7 text-xs px-2.5"
              >
                Все документы
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>

            <div className="overflow-x-auto border border-border rounded-md">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b bg-muted/40 text-muted-foreground">
                    <th className="p-2 font-medium">Номер и название</th>
                    <th className="p-2 font-medium">Группа / Субъекты</th>
                    <th className="p-2 font-medium">Автор</th>
                    <th className="p-2 font-medium">Статус</th>
                    <th className="p-2 font-medium">Состояние / Резолюция</th>
                    <th className="p-2 font-medium text-right">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {workflowDocs.slice(0, 5).map((doc) => {
                    const statusMeta = getDocumentStatusBadge(doc);
                    return (
                      <tr key={doc.id} className="hover:bg-muted/20">
                        <td className="p-2">
                          <div className="flex flex-col">
                            <span className="font-mono text-[10px] text-muted-foreground">
                              {doc.docNumber}
                            </span>
                            <span className="font-medium text-foreground line-clamp-1">
                              {doc.title}
                            </span>
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-1.5">
                            {doc.groupName && (
                              <Badge
                                variant="outline"
                                className="text-[10px] font-mono px-1.5 py-0"
                              >
                                {doc.groupName}
                              </Badge>
                            )}
                            {doc.students.length > 0 && (
                              <span className="text-muted-foreground text-[11px]">
                                ({doc.students.length} студ.)
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-2 text-muted-foreground">
                          {doc.authorName}
                        </td>
                        <td className="p-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border ${statusMeta.bg}`}
                          >
                            {statusMeta.icon}
                            {statusMeta.label}
                          </span>
                        </td>
                        <td className="p-2 text-muted-foreground">
                          <span className={statusMeta.text}>
                            {statusMeta.subtext}
                          </span>
                        </td>
                        <td className="p-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setPreviewDoc(doc)}
                              className="h-6 px-2 text-[11px]"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Бланк
                            </Button>
                            {doc.status === "PENDING_APPROVAL" && (
                              <Button
                                size="sm"
                                onClick={() => setApprovalDoc(doc)}
                                className="h-6 px-2 text-[11px] bg-primary text-primary-foreground gap-1"
                              >
                                <ShieldCheck className="h-3 w-3" />
                                Решение педсовета
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: REGISTRY / ALL & MY DOCS / APPROVAL / ARCHIVE      */}
      {/* ========================================================= */}
      {(activeTab === "ALL_DOCS" ||
        activeTab === "MY_DOCS" ||
        activeTab === "APPROVAL" ||
        activeTab === "ARCHIVE") && (
          <div className="flex flex-col gap-3">
            {/* Filter Bar */}
            <div className="p-3 rounded-lg border border-border bg-card flex flex-col sm:flex-row gap-2 items-center justify-between">
              <div className="flex flex-1 items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Поиск по названию, номеру, студенту или автору..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-8 text-xs w-full"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-8 text-xs w-[130px]">
                    <SelectValue placeholder="Статус" />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="ALL">Все статусы</SelectItem>
                    <SelectItem value="DRAFT">Черновик</SelectItem>
                    <SelectItem value="PENDING_APPROVAL">На согласовании</SelectItem>
                    <SelectItem value="APPROVED">Утверждён</SelectItem>
                    <SelectItem value="REJECTED">Отклонён</SelectItem>
                    <SelectItem value="ARCHIVED">В архиве</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={groupFilter} onValueChange={setGroupFilter}>
                  <SelectTrigger className="h-8 text-xs w-[120px]">
                    <SelectValue placeholder="Группа" />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="ALL">Все группы</SelectItem>
                    {MOCK_GROUPS.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="text-muted-foreground text-[11px] whitespace-nowrap">
                Найдено документов: <span className="font-bold text-foreground">{filteredDocs.length}</span>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border border-border rounded-lg bg-card">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b bg-muted/40 text-muted-foreground">
                    <th className="p-2.5 font-medium">Номер документа</th>
                    <th className="p-2.5 font-medium">Название и категория</th>
                    <th className="p-2.5 font-medium">Группа / Студенты</th>
                    <th className="p-2.5 font-medium">Автор / Роль</th>
                    <th className="p-2.5 font-medium">Дата</th>
                    <th className="p-2.5 font-medium">Статус</th>
                    <th className="p-2.5 font-medium text-right">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredDocs.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="p-8 text-center text-muted-foreground"
                      >
                        Документы не найдены по заданным критериям
                      </td>
                    </tr>
                  ) : (
                    filteredDocs.map((doc) => {
                      const statusMeta = getDocumentStatusBadge(doc);
                      return (
                        <tr key={doc.id} className="hover:bg-muted/20">
                          <td className="p-2.5 font-mono text-muted-foreground whitespace-nowrap">
                            {doc.docNumber}
                          </td>
                          <td className="p-2.5">
                            <div className="flex flex-col">
                              <span className="font-medium text-foreground">
                                {doc.title}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {doc.categoryLabel}
                              </span>
                            </div>
                          </td>
                          <td className="p-2.5">
                            <div className="flex flex-col gap-0.5">
                              {doc.groupName && (
                                <Badge
                                  variant="outline"
                                  className="w-fit text-[10px] font-mono px-1.5 py-0"
                                >
                                  {doc.groupName}
                                </Badge>
                              )}
                              {doc.students.length > 0 && (
                                <span className="text-muted-foreground text-[11px] line-clamp-1">
                                  {doc.students.map((s) => s.name).join(", ")}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-2.5">
                            <div className="flex flex-col">
                              <span className="text-foreground">{doc.authorName}</span>
                              <span className="text-[10px] text-muted-foreground">
                                {doc.authorRole}
                              </span>
                            </div>
                          </td>
                          <td className="p-2.5 text-muted-foreground whitespace-nowrap">
                            {new Date(doc.createdAt).toLocaleDateString("ru-RU")}
                          </td>
                          <td className="p-2.5 whitespace-nowrap">
                            <div className="flex flex-col gap-0.5">
                              <span
                                className={`w-fit inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border ${statusMeta.bg}`}
                              >
                                {statusMeta.icon}
                                {statusMeta.label}
                              </span>
                              <span className={`text-[10px] ${statusMeta.text}`}>
                                {statusMeta.subtext}
                              </span>
                            </div>
                          </td>
                          <td className="p-2.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPreviewDoc(doc)}
                                className="h-6 px-2 text-[11px]"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Бланк
                              </Button>
                              {doc.status === "PENDING_APPROVAL" && (
                                <Button
                                  size="sm"
                                  onClick={() => setApprovalDoc(doc)}
                                  className="h-6 px-2 text-[11px] bg-primary text-primary-foreground gap-1"
                                >
                                  <ShieldCheck className="h-3 w-3" />
                                  Решение педсовета
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownloadPdf(doc)}
                                className="h-6 px-1.5 text-muted-foreground hover:text-foreground"
                                title="Скачать PDF"
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      {/* ========================================================= */}
      {/* TAB 3: DOCUMENT CREATOR (WIZARD)                          */}
      {/* ========================================================= */}
      {activeTab === "CREATE" && (
        <div className="flex flex-col gap-4">
          {/* Stepper Header */}
          <div className="p-3 rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">
                  {creatorStep}
                </span>
                <span className="text-xs font-bold text-foreground">
                  {creatorStep === 1 && "Шаг 1: Выбор шаблона документа"}
                  {creatorStep === 2 && "Шаг 2: Выбор группы и студентов"}
                  {creatorStep === 3 && "Шаг 3: Реквизиты и содержание"}
                  {creatorStep === 4 && "Шаг 4: Предпросмотр официального бланка"}
                </span>
              </div>

              {/* Step indicator pills */}
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4].map((stepNum) => (
                  <button
                    key={stepNum}
                    onClick={() => setCreatorStep(stepNum as 1 | 2 | 3 | 4)}
                    className={`h-2 rounded-full transition-all ${creatorStep === stepNum
                      ? "w-6 bg-primary"
                      : creatorStep > stepNum
                        ? "w-2 bg-primary/40"
                        : "w-2 bg-muted"
                      }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* STEP 1: SELECT TEMPLATE (ALL 32 TEMPLATES) */}
          {creatorStep === 1 && (
            <div className="flex flex-col gap-3">
              {/* Category pills & search bar */}
              <div className="p-3 rounded-lg border border-border bg-card flex flex-col sm:flex-row gap-2 items-center justify-between">
                <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                  <button
                    onClick={() => setCreatorTplCategory("ALL")}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap ${creatorTplCategory === "ALL"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                  >
                    Все ({DOCUMENT_TEMPLATES.length})
                  </button>
                  <button
                    onClick={() => setCreatorTplCategory("CURATOR")}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap ${creatorTplCategory === "CURATOR"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                  >
                    Характеристики (1)
                  </button>
                  <button
                    onClick={() => setCreatorTplCategory("REPORTS")}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap ${creatorTplCategory === "REPORTS"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                  >
                    Рапорты и служебные (5)
                  </button>
                  <button
                    onClick={() => setCreatorTplCategory("ACADEMIC")}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap ${creatorTplCategory === "ACADEMIC"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                  >
                    Учебная деятельность (2)
                  </button>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Поиск по названию или коду..."
                    value={creatorTplSearch}
                    onChange={(e) => setCreatorTplSearch(e.target.value)}
                    className="pl-8 h-8 text-xs w-full"
                  />
                </div>
              </div>

              {/* Grid of templates */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {creatorFilteredTemplates.map((tpl) => (
                  <div
                    key={tpl.id}
                    onClick={() => handleSelectTemplate(tpl)}
                    className="p-3 rounded-lg border border-border bg-card hover:border-primary transition-all cursor-pointer flex flex-col justify-between gap-2.5 group"
                  >
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20 font-bold">
                            {tpl.code}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 font-normal bg-muted/40"
                          >
                            {tpl.categoryLabel}
                          </Badge>
                        </div>
                        {tpl.isMultiStudent ? (
                          <span className="text-[10px] text-primary font-medium">
                            Групповой
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">
                            1 студент
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-foreground text-xs group-hover:text-primary transition-colors">
                        {tpl.title}
                      </h3>
                      <p className="text-[11px] text-muted-foreground line-clamp-2">
                        {tpl.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>
                        {tpl.requiresAttendanceData
                          ? "Данные посещаемости LMS"
                          : "Ручное заполнение"}
                      </span>
                      <span className="text-primary font-medium flex items-center gap-0.5">
                        Выбрать <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: SELECT GROUP & STUDENTS */}
          {creatorStep === 2 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Left / Top config */}
              <div className="lg:col-span-1 p-3.5 rounded-lg border border-border bg-card flex flex-col gap-3">
                <div>
                  <h3 className="font-bold text-foreground text-xs">
                    Параметры выборки
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Шаблон: <span className="font-medium text-foreground">{selectedTemplate.title}</span>
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] text-muted-foreground">
                    Учебная группа
                  </label>
                  <Select
                    value={creatorGroup}
                    onValueChange={(val) => {
                      setCreatorGroup(val);
                      setCreatorSelectedStudentIds([]);
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Выберите группу" />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      {MOCK_GROUPS.map((g) => (
                        <SelectItem key={g} value={g}>
                          {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedTemplate.isMultiStudent && (
                  <div className="pt-2 border-t flex flex-col gap-2">
                    <span className="text-[11px] font-medium text-foreground">
                      Быстрый выбор по фильтрам:
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAllCriticalStudents}
                      className="h-7 text-xs justify-start"
                    >
                      <AlertCircle className="h-3.5 w-3.5 mr-1.5 text-primary" />
                      Студенты с пропусками &gt; 50 ч.
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCreatorSelectedStudentIds(
                          availableStudentsForGroup.map((s) => s.id)
                        )
                      }
                      className="h-7 text-xs justify-start"
                    >
                      <Users className="h-3.5 w-3.5 mr-1.5" />
                      Выбрать всех студентов группы
                    </Button>
                  </div>
                )}

                <div className="p-2.5 rounded bg-muted/40 border border-border text-[11px] text-muted-foreground flex flex-col gap-1">
                  <span className="font-medium text-foreground">
                    Выбрано: {creatorSelectedStudentIds.length} студент(ов)
                  </span>
                  <span>
                    Данные посещаемости и задолженностей подтягиваются из электронного журнала LMS автоматически.
                  </span>
                </div>

                <div className="mt-auto pt-3 border-t flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCreatorStep(1)}
                    className="h-8 text-xs"
                  >
                    Назад
                  </Button>
                  <Button
                    size="sm"
                    disabled={creatorSelectedStudentIds.length === 0}
                    onClick={() => setCreatorStep(3)}
                    className="h-8 text-xs gap-1"
                  >
                    Далее: Реквизиты
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Right: Students Table with Checkboxes */}
              <div className="lg:col-span-2 p-3.5 rounded-lg border border-border bg-card flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-foreground text-xs">
                      {selectedTemplate.isMultiStudent
                        ? "Список студентов группы (отметьте нужных)"
                        : "Выберите одного студента"}
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Показатели рассчитаны за текущий учебный семестр
                    </p>
                  </div>

                  <div className="relative w-full sm:w-56">
                    <Search className="absolute left-2.5 top-2.5 h-3 w-3 text-muted-foreground" />
                    <Input
                      placeholder="Поиск студента..."
                      value={studentSearchInCreator}
                      onChange={(e) => setStudentSearchInCreator(e.target.value)}
                      className="h-7 text-xs pl-7"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto border border-border rounded-md">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b bg-muted/40 text-muted-foreground">
                        <th className="p-2 w-8 text-center">Выбор</th>
                        <th className="p-2 font-medium">№</th>
                        <th className="p-2 font-medium">ФИО студента</th>
                        <th className="p-2 font-medium">Посещаемость</th>
                        <th className="p-2 font-medium">Пропуски (ч.)</th>
                        <th className="p-2 font-medium">Задолженности</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {availableStudentsForGroup.map((st) => {
                        const isSelected = creatorSelectedStudentIds.includes(
                          st.id
                        );
                        return (
                          <tr
                            key={st.id}
                            onClick={() => handleToggleStudentSelection(st)}
                            className={`cursor-pointer transition-colors ${isSelected
                              ? "bg-primary/5"
                              : "hover:bg-muted/20"
                              }`}
                          >
                            <td className="p-2 text-center" onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() =>
                                  handleToggleStudentSelection(st)
                                }
                              />
                            </td>
                            <td className="p-2 font-mono text-[10px] text-muted-foreground">
                              {st.rollNumber}
                            </td>
                            <td className="p-2 font-medium text-foreground">
                              {st.name}
                            </td>
                            <td className="p-2">
                              <span
                                className={`font-mono font-medium ${st.attendanceRate < 60
                                  ? "text-destructive"
                                  : "text-foreground"
                                  }`}
                              >
                                {st.attendanceRate}%
                              </span>
                            </td>
                            <td className="p-2 font-mono text-muted-foreground">
                              {st.unexcusedHours} ч.
                            </td>
                            <td className="p-2 font-mono text-muted-foreground">
                              {st.academicDebts > 0 ? (
                                <span className="text-destructive font-medium">
                                  {st.academicDebts} долга
                                </span>
                              ) : (
                                "0"
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: DETAILS & CONTENT */}
          {creatorStep === 3 && (
            <div
              className={`w-full ${selectedTemplate.isMultiStudent
                ? "grid grid-cols-1 lg:grid-cols-3 gap-4"
                : "flex flex-col gap-4"
                }`}
            >
              {/* Main Form Column: Requisites & Full Document Body */}
              <div
                className={`${selectedTemplate.isMultiStudent ? "lg:col-span-2" : "w-full"
                  } p-3.5 rounded-lg border border-border bg-card flex flex-col gap-3`}
              >
                <h3 className="font-bold text-foreground text-xs">
                  Официальные реквизиты документа
                </h3>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] text-muted-foreground font-medium">
                      Адресат (кому подаётся)
                    </label>
                    <span className="text-[10px] text-muted-foreground">
                      выберите вариант или оставьте пустым
                    </span>
                  </div>

                  {/* Preset quick buttons */}
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => setCreatorAddressee("По месту требования")}
                      className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${creatorAddressee === "По месту требования"
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"
                        }`}
                    >
                      По месту требования
                    </button>
                    <button
                      type="button"
                      onClick={() => setCreatorAddressee("В Военный комиссариат")}
                      className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${creatorAddressee === "В Военный комиссариат"
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"
                        }`}
                    >
                      В Военный комиссариат
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setCreatorAddressee(
                          "Директору Профессионального лицея №98\nСагынбековой Ч. М."
                        )
                      }
                      className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${creatorAddressee.includes("Сагынбековой")
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"
                        }`}
                    >
                      Директору лицея
                    </button>
                    <button
                      type="button"
                      onClick={() => setCreatorAddressee("")}
                      className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${!creatorAddressee.trim()
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"
                        }`}
                    >
                      Оставить пустым
                    </button>
                  </div>

                  <Textarea
                    rows={2}
                    value={creatorAddressee}
                    onChange={(e) => setCreatorAddressee(e.target.value)}
                    placeholder="Например: По месту требования (или оставьте пустым)..."
                    className="text-xs resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-muted-foreground">
                      Должность заявителя
                    </label>
                    <Input
                      value={creatorSignatoryRole}
                      onChange={(e) => setCreatorSignatoryRole(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-muted-foreground">
                      ФИО заявителя (подпись)
                    </label>
                    <Input
                      value={creatorSignatory}
                      onChange={(e) => setCreatorSignatory(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-muted-foreground">
                    Общее основание документа
                  </label>
                  <Input
                    value={creatorGeneralReason}
                    onChange={(e) => setCreatorGeneralReason(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>

                {/* Dedicated block constructor for Характеристика на студента */}
                {selectedTemplate.id === "student_characteristic" && (
                  <div className="p-3 rounded-lg border border-border bg-muted/20 flex flex-col gap-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div>
                        <span className="font-bold text-foreground text-xs flex items-center gap-1.5">
                          <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
                          Конструктор блоков характеристики
                        </span>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Включайте или отключайте разделы галочками — текст и подписи адаптируются автоматически
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const allOn = {
                              academic: true,
                              professional: true,
                              personal: true,
                              social: true,
                              habits: true,
                              purpose: true,
                              signCurator: true,
                              signViceDirector: true,
                              signDirector: false,
                            };
                            setCharBlocks(allOn);
                            const selStudent =
                              MOCK_STUDENTS.find(
                                (s) => s.id === creatorSelectedStudentIds[0]
                              ) || MOCK_STUDENTS[0];
                            setCreatorDescription(
                              generateCharacteristicBody(
                                allOn,
                                selStudent,
                                creatorGroup,
                                creatorAddressee
                              )
                            );
                            toast.add({
                              title: "Включены все блоки характеристики",
                              type: "success",
                            });
                          }}
                          className="text-[10px] text-primary hover:underline font-medium"
                        >
                          Все разделы
                        </button>
                        <span className="text-muted-foreground">•</span>
                        <button
                          type="button"
                          onClick={() => {
                            const concise = {
                              academic: true,
                              professional: false,
                              personal: true,
                              social: false,
                              habits: true,
                              purpose: true,
                              signCurator: true,
                              signViceDirector: true,
                              signDirector: false,
                            };
                            setCharBlocks(concise);
                            const selStudent =
                              MOCK_STUDENTS.find(
                                (s) => s.id === creatorSelectedStudentIds[0]
                              ) || MOCK_STUDENTS[0];
                            setCreatorDescription(
                              generateCharacteristicBody(
                                concise,
                                selStudent,
                                creatorGroup,
                                creatorAddressee
                              )
                            );
                            toast.add({
                              title: "Установлена краткая характеристика",
                              type: "success",
                            });
                          }}
                          className="text-[10px] text-muted-foreground hover:text-foreground"
                        >
                          Краткая (учёба и дисциплина)
                        </button>
                      </div>
                    </div>

                    {/* Section 1: Content blocks */}
                    <div className="flex flex-col gap-1.5 pt-1 border-t border-border/60">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Содержательные блоки текста:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        <label className="flex items-center gap-2 p-1.5 rounded border border-border bg-background cursor-pointer hover:bg-muted/30 text-xs">
                          <Checkbox
                            checked={charBlocks.academic}
                            onCheckedChange={() => handleToggleCharBlock("academic")}
                          />
                          <span className="text-[11px] font-medium text-foreground">
                            1. Успеваемость и журнал
                          </span>
                        </label>
                        <label className="flex items-center gap-2 p-1.5 rounded border border-border bg-background cursor-pointer hover:bg-muted/30 text-xs">
                          <Checkbox
                            checked={charBlocks.professional}
                            onCheckedChange={() => handleToggleCharBlock("professional")}
                          />
                          <span className="text-[11px] font-medium text-foreground">
                            2. Интерес к специальности
                          </span>
                        </label>
                        <label className="flex items-center gap-2 p-1.5 rounded border border-border bg-background cursor-pointer hover:bg-muted/30 text-xs">
                          <Checkbox
                            checked={charBlocks.personal}
                            onCheckedChange={() => handleToggleCharBlock("personal")}
                          />
                          <span className="text-[11px] font-medium text-foreground">
                            3. Характер и коллектив
                          </span>
                        </label>
                        <label className="flex items-center gap-2 p-1.5 rounded border border-border bg-background cursor-pointer hover:bg-muted/30 text-xs">
                          <Checkbox
                            checked={charBlocks.social}
                            onCheckedChange={() => handleToggleCharBlock("social")}
                          />
                          <span className="text-[11px] font-medium text-foreground">
                            4. Общественная активность
                          </span>
                        </label>
                        <label className="flex items-center gap-2 p-1.5 rounded border border-border bg-background cursor-pointer hover:bg-muted/30 text-xs">
                          <Checkbox
                            checked={charBlocks.habits}
                            onCheckedChange={() => handleToggleCharBlock("habits")}
                          />
                          <span className="text-[11px] font-medium text-foreground">
                            5. Дисциплина и устав
                          </span>
                        </label>
                        <label className="flex items-center gap-2 p-1.5 rounded border border-border bg-background cursor-pointer hover:bg-muted/30 text-xs">
                          <Checkbox
                            checked={charBlocks.purpose}
                            onCheckedChange={() => handleToggleCharBlock("purpose")}
                          />
                          <span className="text-[11px] font-medium text-foreground">
                            6. Заключительная цель
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Section 2: Bottom Signatures toggle */}
                    <div className="flex flex-col gap-1.5 pt-2 border-t border-border/60">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Подписи должностных лиц внизу бланка:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <label className="flex items-center gap-2 p-1.5 rounded border border-border bg-background cursor-pointer hover:bg-muted/30 text-xs">
                          <Checkbox
                            checked={charBlocks.signCurator}
                            onCheckedChange={() => handleToggleCharBlock("signCurator")}
                          />
                          <div className="flex flex-col">
                            <span className="text-[11px] font-medium text-foreground">
                              Куратор группы
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {creatorSignatoryRole || "Куратор"}
                            </span>
                          </div>
                        </label>
                        <label className="flex items-center gap-2 p-1.5 rounded border border-border bg-background cursor-pointer hover:bg-muted/30 text-xs">
                          <Checkbox
                            checked={charBlocks.signViceDirector}
                            onCheckedChange={() => handleToggleCharBlock("signViceDirector")}
                          />
                          <div className="flex flex-col">
                            <span className="text-[11px] font-medium text-foreground">
                              Зам. директора по УР
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              Тоялиева М. Р.
                            </span>
                          </div>
                        </label>
                        <label className="flex items-center gap-2 p-1.5 rounded border border-border bg-background cursor-pointer hover:bg-muted/30 text-xs">
                          <Checkbox
                            checked={charBlocks.signDirector}
                            onCheckedChange={() => handleToggleCharBlock("signDirector")}
                          />
                          <div className="flex flex-col">
                            <span className="text-[11px] font-medium text-foreground">
                              Директор лицея
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              Сагынбекова Ч. М. (с печатью)
                            </span>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-medium text-foreground">
                      Полный официальный текст документа
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const selStudent =
                          MOCK_STUDENTS.find(
                            (s) => s.id === creatorSelectedStudentIds[0]
                          ) || MOCK_STUDENTS[0];
                        if (selectedTemplate.id === "student_characteristic") {
                          setCreatorDescription(
                            generateCharacteristicBody(
                              charBlocks,
                              selStudent,
                              creatorGroup,
                              creatorAddressee
                            )
                          );
                        } else {
                          setCreatorDescription(
                            substituteVariables(
                              selectedTemplate.defaultPrewrittenBody,
                              {
                                student: selStudent,
                                groupName: creatorGroup,
                              }
                            )
                          );
                        }
                        toast.add({
                          title: "Текст сброшен к исходному шаблону",
                          type: "success",
                        });
                      }}
                      className="text-[10px] text-primary hover:underline font-medium"
                    >
                      Сбросить к исходному тексту
                    </button>
                  </div>
                  <Textarea
                    rows={8}
                    value={creatorDescription}
                    onChange={(e) => setCreatorDescription(e.target.value)}
                    className="text-xs font-sans leading-relaxed resize-y"
                    placeholder="Готовый официальный текст документа..."
                  />
                  <span className="text-[10px] text-muted-foreground">
                    Текст уже заранее написан по стандартам делопроизводства лицея. Вы можете оставить его как есть или изменить любые фразы.
                  </span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCreatorStep(2)}
                    className="h-8 text-xs"
                  >
                    Назад
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setCreatorStep(4)}
                    className="h-8 text-xs gap-1"
                  >
                    Предпросмотр бланка
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Optional Right Column: Only for MultiStudent documents */}
              {selectedTemplate.isMultiStudent && (
                <div className="lg:col-span-1 p-3.5 rounded-lg border border-border bg-card flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-foreground text-xs">
                        Особые примечания к студентам
                      </h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        По желанию. Если пусто или отключено — действует единое основание рапорта.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded bg-muted/40 border border-border">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="enable-ind-notes"
                        checked={enableIndividualReasons}
                        onCheckedChange={(checked) =>
                          setEnableIndividualReasons(Boolean(checked))
                        }
                      />
                      <label
                        htmlFor="enable-ind-notes"
                        className="text-[11px] text-foreground font-medium cursor-pointer"
                      >
                        Указать индивидуальные примечания
                      </label>
                    </div>
                    {enableIndividualReasons && (
                      <button
                        type="button"
                        onClick={() => {
                          setCreatorIndividualReasons({});
                          toast.add({
                            title: "Все примечания очищены",
                            type: "success",
                          });
                        }}
                        className="text-[10px] text-muted-foreground hover:text-foreground hover:underline"
                      >
                        Очистить все
                      </button>
                    )}
                  </div>

                  {enableIndividualReasons ? (
                    <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto pr-1">
                      <div className="text-[10px] text-muted-foreground bg-muted/20 p-1.5 rounded border border-border/50">
                        Заполняйте только тех студентов, у кого есть особые обстоятельства (например: «находится за рубежом», «не выходит на связь»). Пустые строки останутся без примечания.
                      </div>
                      {MOCK_STUDENTS.filter((st) =>
                        creatorSelectedStudentIds.includes(st.id)
                      ).map((st, idx) => (
                        <div
                          key={st.id}
                          className="p-2 rounded border border-border bg-background flex flex-col gap-1"
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-medium text-foreground">
                              {idx + 1}. {st.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {st.unexcusedHours} ч. • {st.academicDebts} долг.
                            </span>
                          </div>
                          <Input
                            value={creatorIndividualReasons[st.id] || ""}
                            onChange={(e) =>
                              setCreatorIndividualReasons((prev) => ({
                                ...prev,
                                [st.id]: e.target.value,
                              }))
                            }
                            placeholder="Особое примечание (по желанию)..."
                            className="h-7 text-xs"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3.5 rounded border border-dashed border-border bg-muted/10 text-center flex flex-col items-center gap-1.5">
                      <p className="text-[11px] font-medium text-foreground">
                        Индивидуальные примечания отключены
                      </p>
                      <p className="text-[10px] text-muted-foreground max-w-xs leading-normal">
                        Для всех {creatorSelectedStudentIds.length} выбранных обучающихся применяется единая общая формулировка рапорта. Заполнять каждого студента отдельно не требуется.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 4: OFFICIAL A4 PAPER PREVIEW */}
          {creatorStep === 4 && (
            <div className="flex flex-col gap-3">
              {/* Action bar */}
              <div className="p-3 rounded-lg border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCreatorStep(3)}
                    className="h-8 text-xs"
                  >
                    Назад к настройкам
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrintDocument}
                    className="h-8 text-xs gap-1.5"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Печать
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSaveDocument(true)}
                    className="h-8 text-xs gap-1.5"
                  >
                    <Clock className="h-3.5 w-3.5" />
                    Сохранить черновик
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleSaveDocument(false)}
                    className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Отправить на согласование
                  </Button>
                </div>
              </div>

              {/* A4 Sheet Container */}
              <div className="flex justify-center bg-muted/40 p-4 rounded-lg border border-border w-full">
                <div className="w-full bg-white text-zinc-900 shadow-sm border border-border p-8 rounded-sm font-serif text-xs leading-relaxed print:p-0 print:border-none print:shadow-none">
                  {/* Official Header */}
                  <div className="text-center border-b border-zinc-800 pb-3 mb-6">
                    <p className="text-[10px] tracking-wider uppercase font-semibold text-zinc-700">
                      МИНИСТЕРСТВО ПРОСВЕЩЕНИЯ КЫРГЫЗСКОЙ РЕСПУБЛИКИ
                    </p>
                    <p className="text-sm font-bold uppercase tracking-wide mt-1 text-zinc-950">
                      Профессиональный лицей №98
                    </p>
                  </div>

                  {/* Document Meta Row */}
                  <div className="flex justify-between items-start mb-6">
                    <div className="text-[11px] font-sans">
                      <p>Дата: <span className="font-mono">{new Date().toLocaleDateString("ru-RU")} г.</span></p>
                    </div>

                    {/* Addressee right corner */}
                    {creatorAddressee?.trim() && (
                      <div className="text-right text-[11px] max-w-xs whitespace-pre-line font-sans font-medium text-zinc-800">
                        {creatorAddressee.trim()}
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <div className="text-center my-6">
                    <h2 className="text-sm font-bold uppercase tracking-wider font-sans">
                      {selectedTemplate.title}
                    </h2>
                    <p className="text-[11px] text-zinc-600 font-sans mt-0.5">
                      группа {creatorGroup}
                    </p>
                  </div>

                  {/* Document Content */}
                  {selectedTemplate.isMultiStudent ? (
                    <>
                      {creatorGeneralReason && (
                        <div className="text-justify indent-6 mb-4 font-sans text-xs whitespace-pre-line leading-relaxed">
                          {creatorGeneralReason}
                        </div>
                      )}

                      {/* Multi-student Table */}
                      <div className="my-4">
                        <table className="w-full border-collapse border border-zinc-800 text-[11px] font-sans">
                          <thead>
                            <tr className="bg-zinc-100 border-b border-zinc-800 font-semibold text-zinc-900">
                              <th className="border border-zinc-800 p-1.5 w-8 text-center">№</th>
                              <th className="border border-zinc-800 p-1.5 text-left">ФИО студента</th>
                              <th className="border border-zinc-800 p-1.5 w-20 text-center">Личное дело</th>
                              <th className="border border-zinc-800 p-1.5 w-24 text-center">Пропуски (ч.)</th>
                              <th className="border border-zinc-800 p-1.5 w-24 text-center">Задолженности</th>
                              {enableIndividualReasons &&
                                creatorSelectedStudentIds.some(
                                  (id) => creatorIndividualReasons[id]?.trim()
                                ) && (
                                  <th className="border border-zinc-800 p-1.5 text-left">
                                    Особое примечание
                                  </th>
                                )}
                            </tr>
                          </thead>
                          <tbody>
                            {MOCK_STUDENTS.filter((st) =>
                              creatorSelectedStudentIds.includes(st.id)
                            ).map((st, idx) => (
                              <tr key={st.id} className="border-b border-zinc-800">
                                <td className="border border-zinc-800 p-1.5 text-center font-mono">
                                  {idx + 1}
                                </td>
                                <td className="border border-zinc-800 p-1.5 font-medium">
                                  {st.name}
                                </td>
                                <td className="border border-zinc-800 p-1.5 text-center font-mono">
                                  {st.rollNumber}
                                </td>
                                <td className="border border-zinc-800 p-1.5 text-center font-mono">
                                  {st.unexcusedHours} ч.
                                </td>
                                <td className="border border-zinc-800 p-1.5 text-center font-mono">
                                  {st.academicDebts > 0 ? `${st.academicDebts} задолж.` : "Нет"}
                                </td>
                                {enableIndividualReasons &&
                                  creatorSelectedStudentIds.some(
                                    (id) => creatorIndividualReasons[id]?.trim()
                                  ) && (
                                    <td className="border border-zinc-800 p-1.5 text-zinc-700">
                                      {creatorIndividualReasons[st.id]?.trim() || "—"}
                                    </td>
                                  )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Resolution Text */}
                      {creatorDescription && (
                        <div className="text-justify indent-6 my-4 font-sans text-xs whitespace-pre-line leading-relaxed">
                          {creatorDescription}
                        </div>
                      )}
                    </>
                  ) : (
                    /* Single Student Document: Pure formal continuous text */
                    <div className="text-justify indent-6 my-4 font-sans text-xs whitespace-pre-line leading-relaxed">
                      {creatorDescription}
                    </div>
                  )}

                  {/* Signatures Block */}
                  {selectedTemplate.id === "student_characteristic" ? (
                    <div className="mt-12 pt-6 border-t border-zinc-300 font-sans text-xs flex flex-col gap-5">
                      <div className="flex flex-col sm:flex-row justify-between items-end gap-6">
                        {charBlocks.signCurator && (
                          <div>
                            <p className="font-medium text-zinc-900">
                              Мастер группы (куратор):
                            </p>
                            <p className="text-[10px] text-zinc-500 mt-3">
                              (подпись) _______________________
                            </p>
                            <p className="font-semibold text-zinc-800 text-[11px] mt-1">
                              {creatorSignatoryRole.includes("Мастер") ||
                              creatorSignatoryRole.includes("Куратор")
                                ? creatorSignatory
                                : "Исаев К. Д."}
                            </p>
                          </div>
                        )}

                        {charBlocks.signViceDirector && (
                          <div className={charBlocks.signCurator ? "text-right" : ""}>
                            <p className="font-medium text-zinc-900">
                              Зам. директора по учебной части:
                            </p>
                            <p className="text-[10px] text-zinc-500 mt-3">
                              (подпись) _______________________
                            </p>
                            <p className="font-semibold text-zinc-800 text-[11px] mt-1">
                              Тоялиева М. Р.
                            </p>
                          </div>
                        )}
                      </div>

                      {charBlocks.signDirector && (
                        <div className="pt-4 border-t border-dashed border-zinc-300 flex justify-between items-end">
                          <div>
                            <p className="font-semibold text-zinc-950 uppercase tracking-wide text-[11px]">
                              Утверждаю:
                            </p>
                            <p className="font-medium text-zinc-800 text-[11px]">
                              Директор Профессионального лицея №98
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-zinc-900">
                              Сагынбекова Ч. М.
                            </p>
                            <p className="text-[10px] text-zinc-500 mt-2">
                              (подпись, гербовая печать) _______________________
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Other documents (reports, notices): Left = Master of group, Right = Vice Director */
                    <div className="mt-12 pt-6 border-t border-zinc-300 font-sans text-xs flex flex-col sm:flex-row justify-between items-end gap-6">
                      <div>
                        <p className="font-medium text-zinc-900">
                          Мастер группы (куратор):
                        </p>
                        <p className="text-[10px] text-zinc-500 mt-3">
                          (подпись, дата) _______________________
                        </p>
                        <p className="font-semibold text-zinc-800 text-[11px] mt-1">
                          {creatorSignatoryRole.includes("Мастер") ||
                          creatorSignatoryRole.includes("Куратор")
                            ? creatorSignatory
                            : "Исаев К. Д."}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-zinc-900">
                          Зам. директора по учебной части:
                        </p>
                        <p className="text-[10px] text-zinc-500 mt-3">
                          (подпись) _______________________
                        </p>
                        <p className="font-semibold text-zinc-800 text-[11px] mt-1">
                          Тоялиева М. Р.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: TEMPLATES CATALOG (ALL 32 TEMPLATES FROM TZ)       */}
      {/* ========================================================= */}
      {activeTab === "TEMPLATES" && (
        <div className="flex flex-col gap-3">
          {/* Header & Stats */}
          <div className="p-3 rounded-lg border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xs font-bold text-foreground flex items-center gap-2">
                <FileCheck2 className="h-4 w-4 text-primary" />
                Библиотека официальных шаблонов документов лицея
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Основные востребованные документы: Характеристики, рапорты на отчисление, о пропусках и служебные записки с готовыми текстами
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground">
                Показано: <span className="font-bold text-foreground">{filteredTemplates.length}</span> из {DOCUMENT_TEMPLATES.length}
              </span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="p-3 rounded-lg border border-border bg-card flex flex-col sm:flex-row gap-2 items-center justify-between">
            {/* Category Navigation Pills */}
            <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              <button
                onClick={() => setTemplateCatFilter("ALL")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${templateCatFilter === "ALL"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
              >
                Все основные ({DOCUMENT_TEMPLATES.length})
              </button>
              <button
                onClick={() => setTemplateCatFilter("CURATOR")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${templateCatFilter === "CURATOR"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
              >
                Характеристики (1)
              </button>
              <button
                onClick={() => setTemplateCatFilter("REPORTS")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${templateCatFilter === "REPORTS"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
              >
                Рапорты и служебные (5)
              </button>
              <button
                onClick={() => setTemplateCatFilter("ACADEMIC")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${templateCatFilter === "ACADEMIC"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
              >
                Учебная деятельность (2)
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Поиск по названию, коду или переменной..."
                value={templateSearch}
                onChange={(e) => setTemplateSearch(e.target.value)}
                className="pl-8 h-8 text-xs w-full"
              />
            </div>
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredTemplates.map((tpl) => (
              <div
                key={tpl.id}
                className="p-3.5 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors flex flex-col justify-between gap-3"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20 font-bold">
                        {tpl.code}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 font-normal bg-muted/40"
                      >
                        {tpl.categoryLabel}
                      </Badge>
                    </div>
                    {tpl.isMultiStudent ? (
                      <span className="text-[10px] text-primary font-medium">
                        Множественный выбор
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">
                        Один студент
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-foreground text-xs leading-snug">
                    {tpl.title}
                  </h3>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">
                    {tpl.description}
                  </p>

                  <div className="flex flex-wrap gap-1 mt-1">
                    {tpl.variables.slice(0, 4).map((v) => (
                      <code
                        key={v}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-muted font-mono text-muted-foreground"
                      >
                        {v}
                      </code>
                    ))}
                    {tpl.variables.length > 4 && (
                      <span className="text-[9px] text-muted-foreground">
                        +{tpl.variables.length - 4} ещё
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewingTemplate(tpl)}
                    className="h-7 text-xs px-2 gap-1"
                  >
                    <Eye className="h-3 w-3" />
                    Бланк
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedTemplate(tpl);
                      setCreatorGeneralReason(tpl.defaultReason);
                      setCreatorAddressee(tpl.defaultAddressee);
                      setCreatorStep(2);
                      setActiveTab("CREATE");
                    }}
                    className="h-7 text-xs px-2.5 gap-1 bg-primary text-primary-foreground"
                  >
                    Создать
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: REGULATORY DOCUMENTS (PRESERVED PREVIOUS MODULE)  */}
      {/* ========================================================= */}
      {activeTab === "REGULATORY" && (
        <div className="flex flex-col gap-3">
          <div className="p-3 rounded-lg border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xs font-bold text-foreground">
                Нормативная база и внутренние документы лицея
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Методические указания, положения, инструкции, приказы и расписания
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-48">
                <Search className="absolute left-2.5 top-2.5 h-3 w-3 text-muted-foreground" />
                <Input
                  placeholder="Поиск файла..."
                  value={regSearch}
                  onChange={(e) => setRegSearch(e.target.value)}
                  className="h-7 text-xs pl-7"
                />
              </div>

              <Select value={regCategory} onValueChange={setRegCategory}>
                <SelectTrigger className="h-7 text-xs w-32">
                  <SelectValue placeholder="Категория" />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="ALL">Все файлы</SelectItem>
                  <SelectItem value="Методички">Методички</SelectItem>
                  <SelectItem value="Положения">Положения</SelectItem>
                  <SelectItem value="Инструкции">Инструкции</SelectItem>
                  <SelectItem value="Приказы">Приказы</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {regulatoryDocs
              .filter((doc) => {
                if (regCategory !== "ALL" && doc.category !== regCategory)
                  return false;
                if (
                  regSearch &&
                  !doc.title.toLowerCase().includes(regSearch.toLowerCase())
                )
                  return false;
                return true;
              })
              .map((doc) => (
                <div
                  key={doc.id}
                  className="p-3 rounded-lg border border-border bg-card flex flex-col justify-between gap-2"
                >
                  <div className="flex items-start gap-2">
                    <div className="h-7 w-7 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium text-foreground line-clamp-1">
                        {doc.title}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {doc.category} • {doc.authorName}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(doc.createdAt).toLocaleDateString("ru-RU")}
                    </span>
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-[11px] flex items-center gap-1 font-medium"
                    >
                      Открыть
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: OFFICIAL A4 PAPER PREVIEW & ACTIONS             */}
      {/* ========================================================= */}
      <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
        <DialogContent className="p-4 gap-3 text-xs sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="place-items-start text-left gap-1">
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Официальный бланк: {previewDoc?.docNumber}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {previewDoc?.title}
            </DialogDescription>
          </DialogHeader>

          {previewDoc && (
            <div className="flex flex-col gap-3">
              {/* Printable sheet */}
              <div className="bg-white text-zinc-900 border border-border p-6 rounded font-sans text-xs leading-relaxed">
                <div className="text-center border-b border-zinc-800 pb-2 mb-4">
                  <p className="text-[9px] uppercase font-semibold text-zinc-700">
                    МИНИСТЕРСТВО ПРОСВЕЩЕНИЯ КЫРГЫЗСКОЙ РЕСПУБЛИКИ
                  </p>
                  <p className="text-xs font-bold uppercase tracking-wide text-zinc-950">
                    Профессиональный лицей №98
                  </p>
                </div>

                <div className="flex justify-between items-start mb-4 text-[10px]">
                  <div>
                    <p>Дата: {new Date(previewDoc.createdAt).toLocaleDateString("ru-RU")} г.</p>
                  </div>
                  {previewDoc.addressee?.trim() && (
                    <div className="text-right whitespace-pre-line font-medium text-zinc-800">
                      {previewDoc.addressee.trim()}
                    </div>
                  )}
                </div>

                <div className="text-center my-4">
                  <h3 className="font-bold text-xs uppercase tracking-wide">
                    {previewDoc.title}
                  </h3>
                </div>

                <p className="text-justify indent-4 my-2 text-[11px]">
                  {previewDoc.generalReason}
                </p>

                {previewDoc.students.length > 1 && (
                  <div className="my-3">
                    <table className="w-full border-collapse border border-zinc-800 text-[10px]">
                      <thead>
                        <tr className="bg-zinc-100 border-b border-zinc-800 font-semibold">
                          <th className="border border-zinc-800 p-1 text-center w-6">№</th>
                          <th className="border border-zinc-800 p-1 text-left">ФИО студента</th>
                          <th className="border border-zinc-800 p-1 text-center w-14">Личн. дело</th>
                          <th className="border border-zinc-800 p-1 text-center w-16">Посещаемость</th>
                          <th className="border border-zinc-800 p-1 text-center w-16">Задолженн.</th>
                          {previewDoc.students.some((st) => Boolean(st.individualReason?.trim())) && (
                            <th className="border border-zinc-800 p-1 text-left">Особое примечание</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {previewDoc.students.map((st, i) => (
                          <tr key={st.id} className="border-b border-zinc-800">
                            <td className="border border-zinc-800 p-1 text-center font-mono">
                              {i + 1}
                            </td>
                            <td className="border border-zinc-800 p-1 font-medium">
                              {st.name}
                            </td>
                            <td className="border border-zinc-800 p-1 text-center font-mono">
                              {st.rollNumber || "—"}
                            </td>
                            <td className="border border-zinc-800 p-1 text-center font-mono">
                              {typeof st.attendanceRate === "number" ? `${st.attendanceRate}%` : "—"}
                            </td>
                            <td className="border border-zinc-800 p-1 text-center font-mono">
                              {typeof st.debts === "number" ? (st.debts > 0 ? `${st.debts}` : "0") : "—"}
                            </td>
                            {previewDoc.students.some((s) => Boolean(s.individualReason?.trim())) && (
                              <td className="border border-zinc-800 p-1 text-zinc-700">
                                {st.individualReason?.trim() || "—"}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="text-justify my-3 text-[11px] whitespace-pre-line leading-relaxed font-sans">
                  {previewDoc.descriptionText}
                </div>

                <div className="mt-8 pt-4 border-t border-zinc-300 flex flex-col gap-4 text-[11px] font-sans">
                  <div className="flex justify-between items-end gap-6">
                    <div>
                      <p className="font-medium text-zinc-900">
                        Мастер группы (куратор):
                      </p>
                      <p className="text-[9px] text-zinc-500 mt-2">
                        (подпись) _______________________
                      </p>
                      <p className="font-semibold text-zinc-800 text-[11px] mt-1">
                        {previewDoc.authorRole?.includes("Зам")
                          ? "Исаев К. Д."
                          : previewDoc.authorName || "Исаев К. Д."}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-medium text-zinc-900">
                        Зам. директора по учебной части:
                      </p>
                      <p className="text-[9px] text-zinc-500 mt-2">
                        (подпись) _______________________
                      </p>
                      <p className="font-semibold text-zinc-800 text-[11px] mt-1">
                        Тоялиева М. Р.
                      </p>
                    </div>
                  </div>

                  {/* Director stamp if approved or characteristic */}
                  {(previewDoc.approvalSteps.some(
                    (s) =>
                      (s.roleTitle.includes("Директор") ||
                        s.roleTitle.includes("Дирекция")) &&
                      s.status === "APPROVED"
                  ) ||
                    previewDoc.docNumber.startsWith("ХАР")) && (
                    <div className="pt-3 border-t border-dashed border-zinc-300 flex justify-between items-end">
                      <div>
                        <p className="font-semibold text-zinc-950 uppercase tracking-wide text-[10px]">
                          Утверждаю:
                        </p>
                        <p className="font-medium text-zinc-800 text-[10px]">
                          Директор Профессионального лицея №98
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-zinc-900 text-[11px]">
                          Сагынбекова Ч. М.
                        </p>
                        <p className="text-[9px] text-zinc-500 mt-1">
                          (подпись, гербовая печать) _______________________
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Status and workflow timeline */}
              <div className="p-3 rounded border border-border bg-muted/30 flex flex-col gap-2">
                <span className="font-bold text-foreground text-xs flex items-center gap-1.5">
                  <History className="h-3.5 w-3.5 text-primary" />
                  Маршрут согласования документа
                </span>

                <div className="flex flex-col gap-1.5">
                  {previewDoc.approvalSteps.map((step, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-[11px] p-1.5 rounded bg-background border border-border"
                    >
                      <div className="flex items-center gap-2">
                        {step.status === "APPROVED" ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        ) : step.status === "REJECTED" ? (
                          <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                        ) : (
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                        <div>
                          <span className="font-medium text-foreground">
                            {step.roleTitle}:
                          </span>{" "}
                          <span className="text-muted-foreground">{step.name}</span>
                          {step.comment && (
                            <p className="text-[10px] text-muted-foreground italic">
                              «{step.comment}»
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`text-[10px] font-medium ${step.status === "APPROVED"
                            ? "text-emerald-600"
                            : step.status === "REJECTED"
                              ? "text-destructive"
                              : "text-muted-foreground"
                            }`}
                        >
                          {step.status === "APPROVED"
                            ? `Одобрено (${step.date || "—"})`
                            : step.status === "REJECTED"
                              ? `Отклонено`
                              : `Ожидает`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrintDocument}
              className="h-8 text-xs gap-1"
            >
              <Printer className="h-3.5 w-3.5" />
              Печать
            </Button>
            {previewDoc && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadDocx(previewDoc)}
                  className="h-8 text-xs gap-1"
                >
                  <Download className="h-3.5 w-3.5" />
                  DOCX
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadPdf(previewDoc)}
                  className="h-8 text-xs gap-1"
                >
                  <Download className="h-3.5 w-3.5" />
                  PDF
                </Button>
              </>
            )}
            <Button
              size="sm"
              onClick={() => setPreviewDoc(null)}
              className="h-8 text-xs"
            >
              Закрыть
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* MODAL 2: APPROVAL ACTION MODAL                           */}
      {/* ========================================================= */}
      <Dialog open={!!approvalDoc} onOpenChange={() => setApprovalDoc(null)}>
        <DialogContent className="p-4 gap-3 text-xs sm:max-w-[460px]">
          <DialogHeader className="place-items-start text-left gap-1">
            <DialogTitle className="text-sm font-bold flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Решение педагогического совета / дирекции лицея
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {approvalDoc?.docNumber}: {approvalDoc?.title}
            </DialogDescription>
          </DialogHeader>

          {approvalDoc && (
            <div className="flex flex-col gap-3">
              <div className="p-2.5 rounded bg-muted/40 border border-border text-[11px] flex flex-col gap-1">
                <span className="font-medium text-foreground">
                  Инициатор рапорта: {approvalDoc.authorName} ({approvalDoc.authorRole})
                </span>
                <span className="text-muted-foreground">
                  Учебная группа: {approvalDoc.groupName} • Обучающихся в рапорте: {approvalDoc.students.length}
                </span>
                {approvalDoc.generalReason && (
                  <span className="text-muted-foreground line-clamp-2">
                    Основание: {approvalDoc.generalReason}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-foreground">
                  Резолюция педсовета / дирекции лицея
                </label>
                <Textarea
                  rows={3}
                  value={approvalComment}
                  onChange={(e) => setApprovalComment(e.target.value)}
                  placeholder="Например: Протокол заседания педсовета №4 от 20.10.2026. Ходатайство об отчислении поддержано единогласно."
                  className="text-xs resize-none"
                />
                <span className="text-[10px] text-muted-foreground">
                  Утверждение рапорта придаёт ему статус официального решения для издания приказа директора лицея Сагынбековой Ч. М.
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setApprovalDoc(null)}
              className="h-8 text-xs"
            >
              Отмена
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRejectDocument}
              className="h-8 text-xs gap-1"
            >
              <X className="h-3 w-3" />
              Отклонить рапорт
            </Button>
            <Button
              size="sm"
              onClick={handleApproveDocument}
              className="h-8 text-xs gap-1 bg-primary text-primary-foreground"
            >
              <Check className="h-3 w-3" />
              Утвердить педсоветом
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* MODAL 3: TEMPLATE PREVIEW MODAL                           */}
      {/* ========================================================= */}
      <Dialog
        open={!!previewingTemplate}
        onOpenChange={() => setPreviewingTemplate(null)}
      >
        <DialogContent className="p-4 gap-3 text-xs sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="place-items-start text-left gap-1">
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                {previewingTemplate?.code}
              </span>
              Шаблон: {previewingTemplate?.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {previewingTemplate?.categoryLabel} • {previewingTemplate?.description}
            </DialogDescription>
          </DialogHeader>

          {previewingTemplate && (
            <div className="flex flex-col gap-3">
              {/* Official A4 Sheet */}
              <div className="bg-white text-zinc-900 border border-border p-6 rounded font-sans text-xs leading-relaxed">
                {/* Official Header */}
                <div className="text-center border-b border-zinc-800 pb-2 mb-4">
                  <p className="text-[9px] uppercase font-semibold text-zinc-700">
                    МИНИСТЕРСТВО ПРОСВЕЩЕНИЯ КЫРГЫЗСКОЙ РЕСПУБЛИКИ
                  </p>
                  <p className="text-xs font-bold uppercase tracking-wide text-zinc-950">
                    Профессиональный лицей №98
                  </p>
                </div>

                {/* Meta & Addressee */}
                <div className="flex justify-between items-start mb-4 text-[10px]">
                  <div>
                    <p>Дата: {new Date().toLocaleDateString("ru-RU")} г.</p>
                  </div>
                  {previewingTemplate.defaultAddressee?.trim() && (
                    <div className="text-right whitespace-pre-line font-medium text-zinc-800 max-w-xs">
                      {previewingTemplate.defaultAddressee.trim()}
                    </div>
                  )}
                </div>

                {/* Title */}
                <div className="text-center my-4">
                  <h3 className="font-bold text-xs uppercase tracking-wide">
                    {previewingTemplate.title}
                  </h3>
                  <p className="text-[10px] text-zinc-600 mt-0.5">
                    учебная группа ИС-1-25 (образец заполнения)
                  </p>
                </div>

                {/* Reason */}
                <p className="text-justify indent-4 my-2 text-[11px]">
                  {previewingTemplate.defaultReason}
                </p>

                {/* Sample Table if MultiStudent */}
                {previewingTemplate.isMultiStudent ? (
                  <div className="my-3">
                    <table className="w-full border-collapse border border-zinc-800 text-[10px]">
                      <thead>
                        <tr className="bg-zinc-100 border-b border-zinc-800 font-semibold">
                          <th className="border border-zinc-800 p-1 text-center w-6">№</th>
                          <th className="border border-zinc-800 p-1 text-left">ФИО обучающегося</th>
                          <th className="border border-zinc-800 p-1 text-center w-12">№ дела</th>
                          <th className="border border-zinc-800 p-1 text-center w-16">Посещ. %</th>
                          <th className="border border-zinc-800 p-1 text-left">Основание / Примечание</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-zinc-800">
                          <td className="border border-zinc-800 p-1 text-center font-mono">1</td>
                          <td className="border border-zinc-800 p-1 font-medium">Асанов Азамат Бакытович</td>
                          <td className="border border-zinc-800 p-1 text-center font-mono">3941</td>
                          <td className="border border-zinc-800 p-1 text-center font-mono">54%</td>
                          <td className="border border-zinc-800 p-1">72 часа пропусков без уважительной причины</td>
                        </tr>
                        <tr className="border-b border-zinc-800">
                          <td className="border border-zinc-800 p-1 text-center font-mono">2</td>
                          <td className="border border-zinc-800 p-1 font-medium">Бакиров Данияр Эркинович</td>
                          <td className="border border-zinc-800 p-1 text-center font-mono">3942</td>
                          <td className="border border-zinc-800 p-1 text-center font-mono">48%</td>
                          <td className="border border-zinc-800 p-1">86 часов пропусков, задолженность по аттестации</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-2.5 my-2 border border-dashed border-zinc-400 bg-zinc-50 rounded text-[10px] text-zinc-700">
                    <p className="font-semibold">Индивидуальные сведения обучающегося:</p>
                    <p>ФИО: <span className="font-medium">Осмонов Тимур Алмазович</span> (Личное дело № 3958)</p>
                    <p>Курс: 2 • Специальность: 54.02.01 Информационные системы • Посещаемость: 98%</p>
                  </div>
                )}

                {/* Prewritten official text */}
                <div className="text-justify my-3 text-[11px] whitespace-pre-line leading-relaxed font-sans text-zinc-900">
                  {substituteVariables(previewingTemplate.defaultPrewrittenBody, {
                    groupName: "ИС-1-25",
                    student: MOCK_STUDENTS[0],
                  })}
                </div>

                {/* Signatures */}
                <div className="mt-8 pt-4 border-t border-zinc-300 flex justify-between text-[11px]">
                  <div>
                    <p className="font-medium">Зам. директора по учебной части:</p>
                    <p className="text-[9px] text-zinc-500 mt-2">
                      (подпись) _______________________
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">Тоялиева М. Р.</p>
                    <p className="text-[9px] text-zinc-500 mt-2">
                      (подпись) _______________________
                    </p>
                  </div>
                </div>
              </div>

              {/* Variables reference block */}
              <div className="p-2.5 rounded border border-border bg-muted/30 flex flex-col gap-1.5">
                <span className="font-bold text-foreground text-xs">
                  Переменные автоматической подстановки:
                </span>
                <div className="flex flex-wrap gap-1">
                  {previewingTemplate.variables.map((v) => (
                    <code
                      key={v}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-background border border-border font-mono text-primary font-medium"
                    >
                      {v}
                    </code>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewingTemplate(null)}
              className="h-8 text-xs"
            >
              Закрыть
            </Button>
            {previewingTemplate && (
              <Button
                size="sm"
                onClick={() => {
                  const tpl = previewingTemplate;
                  setPreviewingTemplate(null);
                  setSelectedTemplate(tpl);
                  setCreatorGeneralReason(tpl.defaultReason);
                  setCreatorAddressee(tpl.defaultAddressee);
                  setCreatorStep(2);
                  setActiveTab("CREATE");
                }}
                className="h-8 text-xs gap-1 bg-primary text-primary-foreground"
              >
                Создать по этому шаблону
                <ArrowRight className="h-3 w-3" />
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
