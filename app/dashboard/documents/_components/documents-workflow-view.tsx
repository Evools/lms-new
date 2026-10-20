"use client";

import React, { useState, useMemo, useEffect } from "react";
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
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
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
import type { DocumentDTO, WorkflowStudentDTO, WorkflowGroupDTO, WorkflowUserDTO } from "../actions";
import {
  createDocumentAction,
  deleteDocumentAction,
} from "../actions";
import { ALLOWED_CATEGORIES } from "../constants";
import {
  DocumentWorkflowStatus,
  DocumentCategoryType,
  WorkflowDocument,
  DocumentTemplateItem,
  DOCUMENT_TEMPLATES,
} from "../workflow-data";

interface DocumentsWorkflowViewProps {
  documents: DocumentDTO[];
  canManage: boolean;
  availableGroups?: string[];
  groupDetails?: WorkflowGroupDTO[];
  availableStudents?: WorkflowStudentDTO[];
  currentUser?: WorkflowUserDTO | null;
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
  availableGroups = [],
  groupDetails = [],
  availableStudents = [],
  currentUser = null,
}: DocumentsWorkflowViewProps) {
  const groups = useMemo(() => availableGroups, [availableGroups]);
  const students = useMemo(() => availableStudents, [availableStudents]);

  // Navigation
  const [activeTab, setActiveTab] = useState<TabType>("OVERVIEW");

  // Documents state (live workflow data)
  const [workflowDocs, setWorkflowDocs] = useState<WorkflowDocument[]>([]);

  // Sync workflow documents with localStorage for full persistence
  const saveWorkflowDocs = (newDocs: WorkflowDocument[]) => {
    setWorkflowDocs(newDocs);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("lms_workflow_documents_v2", JSON.stringify(newDocs));
      } catch {}
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        // Clear mock data from previous version
        localStorage.removeItem("lms_workflow_documents_v1");
        const saved = localStorage.getItem("lms_workflow_documents_v2");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setWorkflowDocs(parsed);
          }
        }
      } catch {}
    }
  }, []);

  // Deletion targets
  const [deleteWorkflowDocTarget, setDeleteWorkflowDocTarget] =
    useState<WorkflowDocument | null>(null);
  const [deleteRegDocTarget, setDeleteRegDocTarget] =
    useState<DocumentDTO | null>(null);

  // Regulatory documents create modal state
  const [isCreateRegDocOpen, setIsCreateRegDocOpen] = useState(false);
  const [newRegTitle, setNewRegTitle] = useState("");
  const [newRegCategory, setNewRegCategory] = useState("Методички");
  const [newRegUrl, setNewRegUrl] = useState("");
  const [newRegDescription, setNewRegDescription] = useState("");
  const [isRegDocSubmitting, setIsRegDocSubmitting] = useState(false);

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
    currentUser?.name || "Мастер группы"
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
  const [charBlocks, setCharBlocks] = useState({
    academic: true, // 1. Успеваемость и журнал
    professional: true, // 2. Интерес к специальности и олимпиады
    personal: true, // 3. Личные качества и характер в коллективе
    social: true, // 4. Общественная активность и мероприятия
    habits: true, // 5. Дисциплина и устав
    purpose: true, // 6. Заключительная цель выдачи
    signCurator: true, // Подпись слева: Мастер группы
    signViceDirector: true, // Подпись справа: Зам. директора по учебной части Тоялиева М. Р.
  });

  const generateCharacteristicBody = (
    blocks: typeof charBlocks,
    student?: WorkflowStudentDTO,
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
    return students.filter((st) => st.group === creatorGroup).filter(
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
      student?: WorkflowStudentDTO;
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
      .replace(/\{ЦЕЛЕВАЯ_ГРУППА\}/g, groups[1] || groups[0] || "—")
      .replace(/\{КУРАТОР\}/g, creatorSignatory)
      .replace(/\{ПЕРИОД\}/g, "октябрь 2026 г.");
  };

  // Handlers for creator
  const handleSelectTemplate = (tpl: DocumentTemplateItem) => {
    setSelectedTemplate(tpl);
    setCreatorGeneralReason(tpl.defaultReason);
    setCreatorAddressee(tpl.defaultAddressee);
    const selectedStudent =
      students.find((s) => s.id === creatorSelectedStudentIds[0]) ||
      students[0];
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

  const handleToggleStudentSelection = (st: WorkflowStudentDTO) => {
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
    const selectedStudentsList = students.filter((st) =>
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
            roleTitle: creatorSignatoryRole || "Мастер группы",
            name: creatorSignatory || currentUser?.name || "Мастер группы",
            status: "APPROVED" as const,
            date: new Date().toLocaleDateString("ru-RU"),
          },
          {
            roleTitle: "Зам. директора по учебной части",
            name: "Тоялиева М. Р.",
            status: "APPROVED" as const,
            date: new Date().toLocaleDateString("ru-RU"),
          },
        ]
      : [
          {
            roleTitle: creatorSignatoryRole || "Мастер группы",
            name: creatorSignatory || currentUser?.name || "Мастер группы",
            status: "APPROVED" as const,
            date: new Date().toLocaleDateString("ru-RU"),
          },
          {
            roleTitle: "Зам. директора по учебной части",
            name: "Тоялиева М. Р.",
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

    saveWorkflowDocs([newDoc, ...workflowDocs]);
    toast.add({
      title: asDraft
        ? `Черновик документа сохранён`
        : isCharacteristicOrSimple
          ? `Характеристика сформирована и готова к печати!`
          : `Рапорт подан на рассмотрение руководства лицея!`,
      type: "success",
    });
    setActiveTab("ALL_DOCS");
    setCreatorStep(1);
  };

  // Approval actions (Pedagogical council / Administration resolution)
  const handleApproveDocument = () => {
    if (!approvalDoc) return;
    const updated = workflowDocs.map((d) => {
      if (d.id !== approvalDoc.id) return d;
      const nextSteps = [...d.approvalSteps];
      const currentIdx = d.currentApprovalStepIndex;
      if (nextSteps[currentIdx]) {
        nextSteps[currentIdx] = {
          ...nextSteps[currentIdx],
          status: "APPROVED" as const,
          date: new Date().toLocaleDateString("ru-RU"),
          comment:
            approvalComment.trim() ||
            "Утверждено решением педагогического совета / дирекции лицея.",
        };
      }
      return {
        ...d,
        approvalSteps: nextSteps,
        status: "APPROVED" as DocumentWorkflowStatus,
        updatedAt: new Date().toISOString(),
      };
    });
    saveWorkflowDocs(updated);
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
    const updated = workflowDocs.map((d) => {
      if (d.id !== approvalDoc.id) return d;
      const nextSteps = [...d.approvalSteps];
      const currentIdx = d.currentApprovalStepIndex;
      if (nextSteps[currentIdx]) {
        nextSteps[currentIdx] = {
          ...nextSteps[currentIdx],
          status: "REJECTED" as const,
          date: new Date().toLocaleDateString("ru-RU"),
          comment: approvalComment,
        };
      }
      return {
        ...d,
        approvalSteps: nextSteps,
        status: "REJECTED" as DocumentWorkflowStatus,
        updatedAt: new Date().toISOString(),
      };
    });
    saveWorkflowDocs(updated);
    toast.add({
      title: "Рапорт отклонён / возвращён куратору",
      type: "info",
    });
    setApprovalDoc(null);
    setApprovalComment("");
  };

  const handleConfirmDeleteWorkflowDoc = () => {
    if (!deleteWorkflowDocTarget) return;
    const targetId = deleteWorkflowDocTarget.id;
    const updated = workflowDocs.filter((d) => d.id !== targetId);
    saveWorkflowDocs(updated);
    toast.add({
      title: `Документ успешно удалён`,
      type: "success",
    });
    setDeleteWorkflowDocTarget(null);
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
          title: `Файл «${target.title}» успешно удалён`,
          type: "success",
        });
      } else {
        setRegulatoryDocs((prev) => prev.filter((d) => d.id !== target.id));
        toast.add({
          title: `Файл удалён из нормативной базы`,
          type: "success",
        });
      }
    } catch {
      setRegulatoryDocs((prev) => prev.filter((d) => d.id !== target.id));
      toast.add({ title: "Файл удалён", type: "success" });
    } finally {
      setIsRegDocSubmitting(false);
      setDeleteRegDocTarget(null);
    }
  };

  const handleCreateRegulatoryDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRegTitle.trim()) {
      toast.add({ title: "Укажите название документа", type: "error" });
      return;
    }
    setIsRegDocSubmitting(true);
    try {
      const fileUrl = newRegUrl.trim() || "#";
      const res = await createDocumentAction({
        title: newRegTitle.trim(),
        category: newRegCategory,
        fileUrl,
        description: newRegDescription.trim(),
      });
      if (res.success) {
        const newDoc: DocumentDTO = {
          id: `doc-${Date.now()}`,
          title: newRegTitle.trim(),
          category: newRegCategory,
          fileUrl,
          description: newRegDescription.trim(),
          authorName: "Администрация",
          createdAt: new Date().toISOString(),
        };
        setRegulatoryDocs((prev) => [newDoc, ...prev]);
        toast.add({
          title: `Документ «${newRegTitle.trim()}» успешно добавлен!`,
          type: "success",
        });
        setIsCreateRegDocOpen(false);
        setNewRegTitle("");
        setNewRegUrl("");
        setNewRegDescription("");
      } else {
        toast.add({ title: res.error || "Ошибка сохранения", type: "error" });
      }
    } catch {
      toast.add({ title: "Ошибка создания документа", type: "error" });
    } finally {
      setIsRegDocSubmitting(false);
    }
  };

  const cleanDocumentText = (text: string) => {
    return text
      .replace(/54\.02\.01\s*/g, "")
      .replace(/54\.02\.01/g, "")
      .replace(/\s*\((?:номер\s+)?личного\s+дела:?[^)]*\)/gi, "")
      .replace(/\s*\(Личное\s+дело[^)]*\)/gi, "");
  };

  const generateOfficialDocumentHtml = (doc: {
    title: string;
    createdAt?: Date | string;
    addressee?: string;
    generalReason?: string;
    descriptionText: string;
    students?: any[];
    signatoryName?: string;
    signatoryTitle?: string;
    authorName?: string;
    authorRole?: string;
    docNumber?: string;
  }) => {
    const studentsList = doc.students || [];
    const isMulti = studentsList.length > 1;
    const dateFormatted = doc.createdAt
      ? new Date(doc.createdAt).toLocaleDateString("ru-RU")
      : new Date().toLocaleDateString("ru-RU");

    const curatorName =
      doc.signatoryName ||
      doc.authorName ||
      currentUser?.name ||
      "Вопольский Виктор Владимирович";

    const addresseeText = doc.addressee?.trim() || "По месту требования";
    const cleanedBody = cleanDocumentText(doc.descriptionText || "");
    const cleanedGeneralReason = doc.generalReason
      ? cleanDocumentText(doc.generalReason)
      : "";

    const studentsRows =
      isMulti
        ? `
        <table class="students-table">
          <thead>
            <tr>
              <th style="width: 28px; text-align: center;">№</th>
              <th style="text-align: left;">ФИО студента</th>
              <th style="width: 80px; text-align: center;">Группа</th>
              <th style="width: 90px; text-align: center;">Посещаемость</th>
              <th style="width: 80px; text-align: center;">Долги</th>
              ${
                studentsList.some((s) => Boolean(s.individualReason?.trim()))
                  ? '<th style="text-align: left;">Особое примечание</th>'
                  : ""
              }
            </tr>
          </thead>
          <tbody>
            ${studentsList
              .map(
                (st, idx) => `
              <tr>
                <td style="text-align: center; font-family: monospace;">${idx + 1}</td>
                <td style="font-weight: 600;">${st.name}</td>
                <td style="text-align: center;">${st.group || "—"}</td>
                <td style="text-align: center; font-family: monospace;">${
                  typeof st.attendanceRate === "number"
                    ? `${st.attendanceRate}%`
                    : typeof st.unexcusedHours === "number"
                    ? `${st.unexcusedHours} ч.`
                    : "—"
                }</td>
                <td style="text-align: center; font-family: monospace;">${
                  typeof st.debts === "number"
                    ? st.debts > 0 ? `${st.debts}` : "0"
                    : typeof st.academicDebts === "number"
                    ? st.academicDebts > 0 ? `${st.academicDebts}` : "0"
                    : "0"
                }</td>
                ${
                  studentsList.some((s) => Boolean(s.individualReason?.trim()))
                    ? `<td>${st.individualReason?.trim() || "—"}</td>`
                    : ""
                }
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      `
        : "";

    return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <title>${doc.title}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: ${isMulti ? "10mm 15mm 10mm 15mm" : "15mm 20mm 15mm 20mm"};
    }
    *, *:before, *:after {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #09090b;
      font-family: Arial, "Helvetica Neue", Helvetica, "Segoe UI", sans-serif;
      font-size: ${isMulti ? "9.5pt" : "11pt"};
      line-height: ${isMulti ? "1.35" : "1.45"};
    }
    .page-sheet {
      width: 100%;
      max-width: 100%;
      margin: 0 auto;
    }
    .official-header {
      text-align: center;
      margin-bottom: 6px;
    }
    .ministry-title {
      font-size: ${isMulti ? "8.5pt" : "9.5pt"};
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: #18181b;
      margin: 0 0 3px 0;
    }
    .lyceum-title {
      font-size: ${isMulti ? "11.5pt" : "13.5pt"};
      font-weight: 800;
      letter-spacing: 0.03em;
      text-transform: uppercase;
      color: #000000;
      margin: 0;
    }
    .header-rule {
      border: none;
      border-top: 1.5px solid #000000;
      margin: 6px 0 12px 0;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: ${isMulti ? "10px" : "16px"};
      font-size: ${isMulti ? "9.5pt" : "10.5pt"};
      color: #09090b;
    }
    .meta-date {
      font-weight: 500;
    }
    .meta-addressee {
      text-align: right;
      font-weight: 500;
      max-width: 50%;
      white-space: pre-line;
    }
    .doc-title {
      text-align: center;
      font-size: ${isMulti ? "10.5pt" : "12pt"};
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.02em;
      margin: ${isMulti ? "10px 0 12px 0" : "16px 0 14px 0"};
      color: #000000;
    }
    .body-paragraph {
      text-align: justify;
      text-indent: 0;
      margin: 0 0 ${isMulti ? "8px" : "12px"} 0;
    }
    .lead-reason {
      margin-bottom: ${isMulti ? "10px" : "14px"};
    }
    .students-table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0;
      font-size: 8.5pt;
      line-height: 1.25;
      page-break-inside: auto;
      break-inside: auto;
    }
    .students-table th, .students-table td {
      border: 1px solid #18181b;
      padding: 3px 5px;
    }
    .students-table th {
      background-color: #f4f4f5;
      font-weight: 700;
    }
    .students-table tr {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .signatures-divider {
      border: none;
      border-top: 1px solid #d4d4d8;
      margin: ${isMulti ? "14px 0 10px 0" : "22px 0 14px 0"};
    }
    .signatures-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 20px;
      page-break-inside: avoid;
      break-inside: avoid;
      font-size: ${isMulti ? "9.5pt" : "10.5pt"};
    }
    .signature-block {
      flex: 1;
    }
    .signature-role {
      font-weight: 700;
      color: #09090b;
      margin: 0 0 3px 0;
    }
    .signature-line {
      font-size: 8.5pt;
      color: #71717a;
      margin: 3px 0 5px 0;
    }
    .signature-name {
      font-weight: 700;
      color: #09090b;
      margin: 0;
    }
    .text-right {
      text-align: right;
    }
  </style>
</head>
<body>
  <div class="page-sheet">
    <div class="official-header">
      <div class="ministry-title">МИНИСТЕРСТВО ПРОСВЕЩЕНИЯ КЫРГЫЗСКОЙ РЕСПУБЛИКИ</div>
      <div class="lyceum-title">ПРОФЕССИОНАЛЬНЫЙ ЛИЦЕЙ №98</div>
    </div>
    <hr class="header-rule" />

    <div class="meta-row">
      <div class="meta-date">Дата: ${dateFormatted} г.</div>
      <div class="meta-addressee">${addresseeText}</div>
    </div>

    <div class="doc-title">${doc.title}</div>

    ${cleanedGeneralReason ? `<p class="body-paragraph lead-reason">${cleanedGeneralReason}</p>` : ""}

    ${studentsRows}

    ${cleanedBody
      .split("\n\n")
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => `<p class="body-paragraph">${p.replace(/\n/g, "<br/>")}</p>`)
      .join("")}

    <hr class="signatures-divider" />

    <div class="signatures-row">
      <div class="signature-block">
        <div class="signature-role">Мастер группы (куратор):</div>
        <div class="signature-line">(подпись) _______________________</div>
        <div class="signature-name">${curatorName}</div>
      </div>
      <div class="signature-block text-right">
        <div class="signature-role">Зам. директора по учебной части:</div>
        <div class="signature-line">(подпись) _______________________</div>
        <div class="signature-name">Тоялиева М. Р.</div>
      </div>
    </div>
  </div>
</body>
</html>`;
  };

  const printHtmlContent = (htmlContent: string) => {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);
    iframe.contentWindow?.document.open();
    iframe.contentWindow?.document.write(htmlContent);
    iframe.contentWindow?.document.close();
    iframe.contentWindow?.focus();
    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1500);
    }, 300);
  };

  // Real print / export
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
      printHtmlContent(generateOfficialDocumentHtml(creatorDoc));
      return;
    }
    if (!targetDoc) return;
    printHtmlContent(generateOfficialDocumentHtml(targetDoc));
  };

  const handleDownloadDocx = (doc: WorkflowDocument) => {
    const isMulti = doc.students.length > 1;
    const dateFormatted = new Date(doc.createdAt).toLocaleDateString("ru-RU");
    const curatorName =
      doc.signatoryName ||
      doc.authorName ||
      currentUser?.name ||
      "Вопольский Виктор Владимирович";
    const addresseeText = doc.addressee?.trim() || "По месту требования";
    const cleanedBody = cleanDocumentText(doc.descriptionText || "");
    const cleanedGeneralReason = doc.generalReason
      ? cleanDocumentText(doc.generalReason)
      : "";

    const studentsRows =
      isMulti
        ? `
        <table border="1" cellpadding="4" cellspacing="0" style="width:100%; border-collapse:collapse; margin-top:10px; margin-bottom:10px; font-size:9pt; mso-pagination:lines-together;">
          <thead>
            <tr style="background-color:#f4f4f5; font-weight:bold;">
              <th style="width:30px; text-align:center;">№</th>
              <th style="text-align:left;">ФИО студента</th>
              <th style="width:80px; text-align:center;">Группа</th>
              <th style="width:90px; text-align:center;">Посещаемость</th>
              <th style="width:80px; text-align:center;">Долги</th>
              ${
                doc.students.some((s) => Boolean(s.individualReason?.trim()))
                  ? '<th style="text-align:left;">Особое примечание</th>'
                  : ""
              }
            </tr>
          </thead>
          <tbody>
            ${doc.students
              .map(
                (st, idx) => `
              <tr style="page-break-inside:avoid; mso-pagination:lines-together;">
                <td style="text-align:center; font-family:monospace;">${idx + 1}</td>
                <td><strong>${st.name}</strong></td>
                <td style="text-align:center;">${st.group || "—"}</td>
                <td style="text-align:center; font-family:monospace;">${
                  typeof st.attendanceRate === "number"
                    ? `${st.attendanceRate}%`
                    : "—"
                }</td>
                <td style="text-align:center; font-family:monospace;">${
                  typeof st.debts === "number"
                    ? st.debts > 0 ? `${st.debts}` : "0"
                    : "0"
                }</td>
                ${
                  doc.students.some((s) => Boolean(s.individualReason?.trim()))
                    ? `<td>${st.individualReason?.trim() || "—"}</td>`
                    : ""
                }
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      `
        : "";

    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${doc.title}</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page Section1 {
            size: 595.3pt 841.9pt;
            margin: ${isMulti ? "30.0pt 42.0pt 30.0pt 42.0pt" : "42.0pt 56.7pt 42.0pt 56.7pt"};
            mso-header-margin: 36.0pt;
            mso-footer-margin: 36.0pt;
            mso-paper-source: 0;
          }
          div.Section1 { page: Section1; }
          body {
            font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
            font-size: ${isMulti ? "9.5pt" : "11pt"};
            line-height: ${isMulti ? "1.3" : "1.45"};
            color: #000000;
          }
          p { margin: 0 0 ${isMulti ? "6pt" : "8pt"} 0; text-align: justify; }
          .header-center { text-align: center; }
          .min-title { font-size: ${isMulti ? "8.5pt" : "9.5pt"}; font-weight: bold; text-transform: uppercase; margin-bottom: 2pt; }
          .lic-title { font-size: ${isMulti ? "11.5pt" : "13.5pt"}; font-weight: bold; text-transform: uppercase; margin-bottom: 4pt; }
          .divider-line { border-top: 1.5pt solid #000000; margin-bottom: 10pt; }
          .doc-title { text-align: center; font-size: ${isMulti ? "10.5pt" : "12pt"}; font-weight: bold; text-transform: uppercase; margin: 10pt 0 10pt 0; }
          .meta-tbl { width: 100%; border: none; margin-bottom: 10pt; }
          .meta-tbl td { border: none; padding: 0; font-size: ${isMulti ? "9.5pt" : "10.5pt"}; }
          .sig-tbl { width: 100%; border: none; margin-top: 16pt; mso-pagination: lines-together; page-break-inside: avoid; }
          .sig-tbl td { border: none; padding: 0; vertical-align: top; }
        </style>
      </head>
      <body lang="RU">
      <div class="Section1">
        <div class="header-center">
          <div class="min-title">МИНИСТЕРСТВО ПРОСВЕЩЕНИЯ КЫРГЫЗСКОЙ РЕСПУБЛИКИ</div>
          <div class="lic-title">ПРОФЕССИОНАЛЬНЫЙ ЛИЦЕЙ №98</div>
        </div>
        <div class="divider-line"></div>

        <table class="meta-tbl">
          <tr>
            <td style="text-align: left; vertical-align: top;">
              <strong>Дата:</strong> ${dateFormatted} г.
            </td>
            <td style="text-align: right; vertical-align: top;">
              ${addresseeText.replace(/\n/g, "<br/>")}
            </td>
          </tr>
        </table>

        <div class="doc-title">${doc.title}</div>

        ${cleanedGeneralReason ? `<p style="margin-bottom:8pt;">${cleanedGeneralReason}</p>` : ""}

        ${studentsRows}

        ${cleanedBody
          .split("\n\n")
          .map((p) => p.trim())
          .filter(Boolean)
          .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
          .join("")}

        <hr style="border: none; border-top: 1pt solid #d4d4d8; margin-top: 18pt; margin-bottom: 12pt;" />

        <table class="sig-tbl">
          <tr>
            <td style="width: 50%;">
              <strong>Мастер группы (куратор):</strong><br/>
              <span style="font-size: 8.5pt; color: #71717a;">(подпись) _______________________</span><br/>
              <strong style="margin-top: 4pt; display: inline-block;">${curatorName}</strong>
            </td>
            <td style="width: 50%; text-align: right;">
              <strong>Зам. директора по учебной части:</strong><br/>
              <span style="font-size: 8.5pt; color: #71717a;">(подпись) _______________________</span><br/>
              <strong style="margin-top: 4pt; display: inline-block;">Тоялиева М. Р.</strong>
            </td>
          </tr>
        </table>
      </div>
      </body>
      </html>
    `;

    const blob = new Blob(["\ufeff", html], {
      type: "application/msword;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${doc.docNumber}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.add({
      title: `Файл ${doc.docNumber}.doc успешно скачан для Microsoft Word`,
      type: "success",
    });
  };

  const handleDownloadPdf = (doc: WorkflowDocument) => {
    handlePrintDocument(doc);
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
                  const sel = students.find((s) => s.id === creatorSelectedStudentIds[0]) || students[0];
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
                  const sel = students.find((s) => s.id === creatorSelectedStudentIds[0]) || students[0];
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
                  const sel = students.find((s) => s.id === creatorSelectedStudentIds[0]) || students[0];
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
                            {canManage && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteWorkflowDocTarget(doc)}
                                className="h-6 px-1.5 text-muted-foreground hover:text-destructive cursor-pointer"
                                title="Удалить документ"
                              >
                                <Trash2 className="h-3 w-3" />
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
                    {groups.map((g) => (
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
                              {canManage && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeleteWorkflowDocTarget(doc)}
                                  className="h-6 px-1.5 text-muted-foreground hover:text-destructive cursor-pointer"
                                  title="Удалить документ"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
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
                      {groups.length === 0 ? (
                        <SelectItem value="none" disabled>
                          Нет созданных групп
                        </SelectItem>
                      ) : (
                        groups.map((g) => (
                          <SelectItem key={g} value={g}>
                            {g}
                          </SelectItem>
                        ))
                      )}
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
                      {availableStudentsForGroup.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-muted-foreground text-xs">
                            {groups.length === 0
                              ? "В системе пока нет созданных групп и студентов."
                              : `В группе ${creatorGroup || "—"} пока нет зарегистрированных студентов.`}
                          </td>
                        </tr>
                      ) : (
                        availableStudentsForGroup.map((st) => {
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
                      })
                    )}
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
                                                          };
                            setCharBlocks(allOn);
                            const selStudent =
                              students.find(
                                (s) => s.id === creatorSelectedStudentIds[0]
                              ) || students[0];
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
                                                          };
                            setCharBlocks(concise);
                            const selStudent =
                              students.find(
                                (s) => s.id === creatorSelectedStudentIds[0]
                              ) || students[0];
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
                          students.find(
                            (s) => s.id === creatorSelectedStudentIds[0]
                          ) || students[0];
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
                      {students.filter((st) =>
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
                <div className="w-full bg-white text-zinc-900 shadow-sm border border-border p-8 rounded-sm font-sans text-xs leading-relaxed print:p-0 print:border-none print:shadow-none">
                  {/* Official Header */}
                  <div className="text-center pb-2 mb-3">
                    <p className="text-[10px] tracking-wider uppercase font-bold text-zinc-900">
                      МИНИСТЕРСТВО ПРОСВЕЩЕНИЯ КЫРГЫЗСКОЙ РЕСПУБЛИКИ
                    </p>
                    <p className="text-sm font-extrabold uppercase tracking-wide text-zinc-950 mt-0.5">
                      ПРОФЕССИОНАЛЬНЫЙ ЛИЦЕЙ №98
                    </p>
                  </div>
                  <hr className="border-t-[1.5px] border-zinc-950 mb-3" />

                  {/* Document Meta Row */}
                  <div className="flex justify-between items-start mb-4 text-[11px] font-sans">
                    <div>
                      <p>Дата: <span className="font-medium">{new Date().toLocaleDateString("ru-RU")} г.</span></p>
                    </div>

                    <div className="text-right text-[11px] max-w-xs whitespace-pre-line font-medium text-zinc-800">
                      {creatorAddressee?.trim() || "По месту требования"}
                    </div>
                  </div>

                  {/* Title */}
                  <div className="text-center my-4">
                    <h2 className="text-xs font-extrabold uppercase tracking-wider font-sans text-zinc-950">
                      {selectedTemplate.title}
                    </h2>
                  </div>

                  {/* Document Content */}
                  {selectedTemplate.isMultiStudent ? (
                    <>
                      {creatorGeneralReason && (
                        <div className="text-justify mb-3 font-sans text-xs whitespace-pre-line leading-relaxed">
                          {creatorGeneralReason}
                        </div>
                      )}

                      {/* Multi-student Table */}
                      <div className="my-3">
                        <table className="w-full border-collapse border border-zinc-800 text-[10.5px] font-sans">
                          <thead>
                            <tr className="bg-zinc-100 border-b border-zinc-800 font-bold text-zinc-900">
                              <th className="border border-zinc-800 p-1 w-8 text-center">№</th>
                              <th className="border border-zinc-800 p-1 text-left">ФИО студента</th>
                              <th className="border border-zinc-800 p-1 w-20 text-center">Группа</th>
                              <th className="border border-zinc-800 p-1 w-24 text-center">Пропуски (ч.)</th>
                              <th className="border border-zinc-800 p-1 w-24 text-center">Задолженности</th>
                              {enableIndividualReasons &&
                                creatorSelectedStudentIds.some(
                                  (id) => creatorIndividualReasons[id]?.trim()
                                ) && (
                                  <th className="border border-zinc-800 p-1 text-left">
                                    Особое примечание
                                  </th>
                                )}
                            </tr>
                          </thead>
                          <tbody>
                            {students.filter((st) =>
                              creatorSelectedStudentIds.includes(st.id)
                            ).map((st, idx) => (
                              <tr key={st.id} className="border-b border-zinc-800">
                                <td className="border border-zinc-800 p-1 text-center font-mono">
                                  {idx + 1}
                                </td>
                                <td className="border border-zinc-800 p-1 font-semibold">
                                  {st.name}
                                </td>
                                <td className="border border-zinc-800 p-1 text-center">
                                  {st.group || creatorGroup || "—"}
                                </td>
                                <td className="border border-zinc-800 p-1 text-center font-mono">
                                  {st.unexcusedHours} ч.
                                </td>
                                <td className="border border-zinc-800 p-1 text-center font-mono">
                                  {st.academicDebts > 0 ? `${st.academicDebts} задолж.` : "0"}
                                </td>
                                {enableIndividualReasons &&
                                  creatorSelectedStudentIds.some(
                                    (id) => creatorIndividualReasons[id]?.trim()
                                  ) && (
                                    <td className="border border-zinc-800 p-1 text-zinc-700">
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
                        <div className="text-justify my-3 font-sans text-xs whitespace-pre-line leading-relaxed">
                          {creatorDescription}
                        </div>
                      )}
                    </>
                  ) : (
                    /* Single Student Document: Pure formal continuous text */
                    <div className="text-justify my-3 font-sans text-xs whitespace-pre-line leading-relaxed">
                      {creatorDescription}
                    </div>
                  )}

                  {/* Signatures Block */}
                  <div className="mt-8 pt-4 border-t border-zinc-300 font-sans text-xs flex justify-between items-end gap-6">
                    <div>
                      <p className="font-bold text-zinc-950">
                        Мастер группы (куратор):
                      </p>
                      <p className="text-[9px] text-zinc-500 mt-1.5">
                        (подпись) _______________________
                      </p>
                      <p className="font-bold text-zinc-950 text-[11px] mt-2">
                        {creatorSignatory || currentUser?.name || "Вопольский Виктор Владимирович"}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-zinc-950">
                        Зам. директора по учебной части:
                      </p>
                      <p className="text-[9px] text-zinc-500 mt-1.5">
                        (подпись) _______________________
                      </p>
                      <p className="font-bold text-zinc-950 text-[11px] mt-2">
                        Тоялиева М. Р.
                      </p>
                    </div>
                  </div>
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
                  {ALLOWED_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {canManage && (
                <Button
                  size="xs"
                  onClick={() => setIsCreateRegDocOpen(true)}
                  className="h-7 text-xs px-2.5 bg-primary text-primary-foreground gap-1 font-medium cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Добавить документ
                </Button>
              )}
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
              }).length === 0 ? (
                <div className="col-span-full py-12 text-center flex flex-col items-center justify-center gap-2 border border-dashed rounded-lg bg-muted/10 text-xs">
                  <FolderOpen className="h-8 w-8 text-muted-foreground/50" />
                  <p className="text-muted-foreground font-medium">
                    Документы лицея пока не загружены
                  </p>
                  {canManage && (
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => setIsCreateRegDocOpen(true)}
                      className="mt-1 gap-1 h-7 text-xs"
                    >
                      <Plus className="h-3 w-3" />
                      Загрузить первый документ
                    </Button>
                  )}
                </div>
              ) : (
                regulatoryDocs
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
                    <div className="flex items-center gap-1.5">
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-[11px] flex items-center gap-1 font-medium"
                      >
                        Открыть
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      {canManage && (
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => setDeleteRegDocTarget(doc)}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive cursor-pointer"
                          title="Удалить документ"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
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
              Официальный бланк документа
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {previewDoc?.title}
            </DialogDescription>
          </DialogHeader>

          {previewDoc && (
            <div className="flex flex-col gap-3">
              {/* Printable sheet */}
              <div className="bg-white text-zinc-900 border border-border p-6 rounded font-sans text-xs leading-relaxed">
                <div className="text-center pb-2 mb-3">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-900">
                    МИНИСТЕРСТВО ПРОСВЕЩЕНИЯ КЫРГЫЗСКОЙ РЕСПУБЛИКИ
                  </p>
                  <p className="text-sm font-extrabold uppercase tracking-wide text-zinc-950 mt-0.5">
                    ПРОФЕССИОНАЛЬНЫЙ ЛИЦЕЙ №98
                  </p>
                </div>
                <hr className="border-t-[1.5px] border-zinc-950 mb-3" />

                <div className="flex justify-between items-start mb-3 text-[11px] font-sans">
                  <div>
                    <p>Дата: <span className="font-medium">{new Date(previewDoc.createdAt).toLocaleDateString("ru-RU")} г.</span></p>
                  </div>
                  <div className="text-right whitespace-pre-line font-medium text-zinc-800 max-w-xs">
                    {previewDoc.addressee?.trim() || "По месту требования"}
                  </div>
                </div>

                <div className="text-center my-3">
                  <h3 className="font-extrabold text-xs uppercase tracking-wide text-zinc-950">
                    {previewDoc.title}
                  </h3>
                </div>

                {previewDoc.generalReason && (
                  <p className="text-justify my-2 text-[11px] font-sans">
                    {cleanDocumentText(previewDoc.generalReason)}
                  </p>
                )}

                {previewDoc.students.length > 1 && (
                  <div className="my-3">
                    <table className="w-full border-collapse border border-zinc-800 text-[10px] font-sans">
                      <thead>
                        <tr className="bg-zinc-100 border-b border-zinc-800 font-bold">
                          <th className="border border-zinc-800 p-1 text-center w-6">№</th>
                          <th className="border border-zinc-800 p-1 text-left">ФИО студента</th>
                          <th className="border border-zinc-800 p-1 text-center w-16">Группа</th>
                          <th className="border border-zinc-800 p-1 text-center w-16">Посещаемость</th>
                          <th className="border border-zinc-800 p-1 text-center w-16">Долги</th>
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
                            <td className="border border-zinc-800 p-1 font-semibold">
                              {st.name}
                            </td>
                            <td className="border border-zinc-800 p-1 text-center">
                              {st.group || "—"}
                            </td>
                            <td className="border border-zinc-800 p-1 text-center font-mono">
                              {typeof st.attendanceRate === "number" ? `${st.attendanceRate}%` : "—"}
                            </td>
                            <td className="border border-zinc-800 p-1 text-center font-mono">
                              {typeof st.debts === "number" ? (st.debts > 0 ? `${st.debts}` : "0") : "0"}
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
                  {cleanDocumentText(previewDoc.descriptionText)}
                </div>

                <div className="mt-7 pt-4 border-t border-zinc-300 flex flex-col gap-4 text-[11px] font-sans">
                  <div className="flex justify-between items-end gap-6">
                    <div>
                      <p className="font-bold text-zinc-950">
                        Мастер группы (куратор):
                      </p>
                      <p className="text-[9px] text-zinc-500 mt-1.5">
                        (подпись) _______________________
                      </p>
                      <p className="font-bold text-zinc-950 text-[11px] mt-2">
                        {previewDoc.signatoryName || previewDoc.authorName || (currentUser?.name || "Вопольский Виктор Владимирович")}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-zinc-950">
                        Зам. директора по учебной части:
                      </p>
                      <p className="text-[9px] text-zinc-500 mt-1.5">
                        (подпись) _______________________
                      </p>
                      <p className="font-bold text-zinc-950 text-[11px] mt-2">
                        Тоялиева М. Р.
                      </p>
                    </div>
                  </div>
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
                {canManage && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDeleteWorkflowDocTarget(previewDoc);
                      setPreviewDoc(null);
                    }}
                    className="h-8 text-xs text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10 gap-1 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Удалить
                  </Button>
                )}
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
              {approvalDoc?.title}
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
                    student: students[0],
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

      {/* ========================================================= */}
      {/* MODAL 4: CREATE REGULATORY DOCUMENT DIALOG                */}
      {/* ========================================================= */}
      <Dialog open={isCreateRegDocOpen} onOpenChange={setIsCreateRegDocOpen}>
        <DialogContent className="p-4 gap-3 text-xs sm:max-w-[420px]">
          <DialogHeader className="place-items-start text-left gap-1">
            <DialogTitle className="text-sm font-bold flex items-center gap-1.5">
              <Plus className="h-4 w-4 text-primary" />
              Добавить нормативный документ
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Методические указания, положения, инструкции, приказы или регламенты
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateRegulatoryDoc} className="space-y-3 pt-1">
            <div className="space-y-1">
              <label className="font-medium text-foreground">Название документа *</label>
              <Input
                value={newRegTitle}
                onChange={(e) => setNewRegTitle(e.target.value)}
                placeholder="Например: Положение об учебной практике 2026"
                className="h-8 text-xs"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground">Категория *</label>
              <Select value={newRegCategory} onValueChange={setNewRegCategory}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Выберите категорию" />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  {ALLOWED_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-xs">
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground">Ссылка на файл / документ</label>
              <Input
                value={newRegUrl}
                onChange={(e) => setNewRegUrl(e.target.value)}
                placeholder="https://... или /docs/polozhenie.pdf"
                className="h-8 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground">Краткое описание</label>
              <Textarea
                value={newRegDescription}
                onChange={(e) => setNewRegDescription(e.target.value)}
                placeholder="Кем утверждено, номер приказа, дата..."
                className="text-xs min-h-[60px]"
              />
            </div>

            <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-3">
              <Button
                type="button"
                variant="outline"
                size="xs"
                disabled={isRegDocSubmitting}
                onClick={() => setIsCreateRegDocOpen(false)}
                className="h-7 px-3 text-xs font-medium"
              >
                Отмена
              </Button>
              <Button
                type="submit"
                size="xs"
                disabled={isRegDocSubmitting}
                className="h-7 px-3 text-xs font-medium bg-primary text-primary-foreground"
              >
                Сохранить
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* MODAL 5: DELETE WORKFLOW DOCUMENT ALERT                   */}
      {/* ========================================================= */}
      <AlertDialog
        open={!!deleteWorkflowDocTarget}
        onOpenChange={() => setDeleteWorkflowDocTarget(null)}
      >
        <AlertDialogContent className="p-4 gap-3 text-xs sm:max-w-[400px]">
          <AlertDialogHeader className="place-items-start text-left gap-1">
            <AlertDialogTitle className="text-sm font-bold flex items-center gap-1.5 text-destructive">
              <Trash2 className="h-4 w-4" />
              Удалить документ?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Вы действительно хотите удалить документ «{deleteWorkflowDocTarget?.title}»? Это действие нельзя будет отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
            <Button
              variant="outline"
              size="xs"
              onClick={() => setDeleteWorkflowDocTarget(null)}
              className="h-6 px-2.5 text-xs font-medium"
            >
              Отмена
            </Button>
            <Button
              variant="destructive"
              size="xs"
              onClick={handleConfirmDeleteWorkflowDoc}
              className="h-6 px-2.5 text-xs font-medium gap-1"
            >
              <Trash2 className="h-3 w-3" />
              Удалить
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ========================================================= */}
      {/* MODAL 6: DELETE REGULATORY DOCUMENT ALERT                 */}
      {/* ========================================================= */}
      <AlertDialog
        open={!!deleteRegDocTarget}
        onOpenChange={() => setDeleteRegDocTarget(null)}
      >
        <AlertDialogContent className="p-4 gap-3 text-xs sm:max-w-[400px]">
          <AlertDialogHeader className="place-items-start text-left gap-1">
            <AlertDialogTitle className="text-sm font-bold flex items-center gap-1.5 text-destructive">
              <Trash2 className="h-4 w-4" />
              Удалить нормативный документ?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Вы действительно хотите удалить файл «{deleteRegDocTarget?.title}» из базы документов лицея?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
            <Button
              variant="outline"
              size="xs"
              disabled={isRegDocSubmitting}
              onClick={() => setDeleteRegDocTarget(null)}
              className="h-6 px-2.5 text-xs font-medium"
            >
              Отмена
            </Button>
            <Button
              variant="destructive"
              size="xs"
              disabled={isRegDocSubmitting}
              onClick={handleConfirmDeleteRegDoc}
              className="h-6 px-2.5 text-xs font-medium gap-1"
            >
              <Trash2 className="h-3 w-3" />
              Удалить
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
