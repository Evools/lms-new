"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Users,
  BookOpenCheck,
  Search,
  X,
  FileText,
  ChevronRight,
  ArrowRightLeft,
  History,
  CheckCircle2,
} from "lucide-react";

import {
  PracticeTab,
  PracticeType,
  MovementType,
  StudentPracticeRecord,
  CompanyPartner,
  SpecialtyDiaryPlan,
  DiaryDayTopic,
  PracticeMovementRecord,
  StudentPracticeStatus,
  PracticeViewProps,
} from "./types";
import { calculateWorkingDates, getWeekdayFromDateStr } from "./utils";
import { AnimatedCounter } from "./animated-counter";

const STORAGE_KEY = "lms_practice_storage_v1";

// Tabs
import { StudentsTab } from "./tabs/students-tab";
import { MovementsTab } from "./tabs/movements-tab";
import { CompaniesTab } from "./tabs/companies-tab";
import { DiaryPlanTab } from "./tabs/diary-plan-tab";

// Dialogs
import { AssignStudentDialog, MoveFormData } from "./dialogs/assign-student-dialog";
import { StudentHistoryDialog } from "./dialogs/student-history-dialog";
import { PrintDirectionDialog } from "./dialogs/print-direction-dialog";
import { CompanyDialog, CompanyFormData } from "./dialogs/company-dialog";
import { MemoPlanDialog, PlanFormData } from "./dialogs/memo-plan-dialog";
import { DayTopicDialog, DayTopicFormData } from "./dialogs/day-topic-dialog";
import { PrintMemoDialog } from "./dialogs/print-memo-dialog";
import { SectionsManagerDialog, NewSectionFormData } from "./dialogs/sections-manager-dialog";
import { ResetConfirmDialog } from "./dialogs/reset-confirm-dialog";
import {
  createCompanyAction,
  updateCompanyAction,
  deleteCompanyAction,
  assignStudentsAction,
  toggleCompletePracticeAction,
  saveDiaryPlanAction,
  deleteDiaryPlanAction,
  saveDayTopicAction,
  deleteDayTopicAction,
  toggleDayRewrittenAction,
  resetRewrittenDaysAction,
} from "../actions";

export function PracticeView({
  userRole,
  currentUserName,
  initialCompanies = [],
  initialStudents = [],
  initialDiaryPlans = [],
  initialRewrittenDays = [],
  initialGroups = [],
}: PracticeViewProps) {
  const isStudent = userRole === "STUDENT";
  const [activeTab, setActiveTab] = useState<PracticeTab>(isStudent ? "diary-plan" : "students");

  // Main Data States (initialized from DB props)
  const [companies, setCompanies] = useState<CompanyPartner[]>(initialCompanies);
  const [students, setStudents] = useState<StudentPracticeRecord[]>(initialStudents);
  const [diaryPlans, setDiaryPlans] = useState<SpecialtyDiaryPlan[]>(initialDiaryPlans);
  const [isLoaded, setIsLoaded] = useState<boolean>(true);

  // Multi-Student Selection State
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Diary Plan Tab States
  const [selectedPlanId, setSelectedPlanId] = useState<string>(initialDiaryPlans[0]?.id || "");
  const [planStartDate, setPlanStartDate] = useState<string>(initialDiaryPlans[0]?.startDate || "");
  const [copiedDayId, setCopiedDayId] = useState<string | null>(null);
  const [memoDaySearch, setMemoDaySearch] = useState<string>("");
  const [isPrintPlanDialogOpen, setIsPrintPlanDialogOpen] = useState<boolean>(false);

  // Rewriting to Physical Diary States
  const [rewrittenDayIds, setRewrittenDayIds] = useState<string[]>(initialRewrittenDays);
  const [rewriteFilter, setRewriteFilter] = useState<"ALL" | "PENDING" | "DONE">("ALL");
  const [isCurriculumTableExpanded, setIsCurriculumTableExpanded] = useState<boolean>(false);
  const [collapsedSections, setCollapsedSections] = useState<string[]>([]);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState<boolean>(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`practice_rewritten_${selectedPlanId}`);
      if (saved) {
        setRewrittenDayIds(JSON.parse(saved));
      }
    } catch (e) {}
  }, [selectedPlanId]);

  const handleToggleDayRewritten = (dayId: string) => {
    setRewrittenDayIds((prev) => {
      const next = prev.includes(dayId) ? prev.filter((id) => id !== dayId) : [...prev, dayId];
      try {
        localStorage.setItem(`practice_rewritten_${selectedPlanId}`, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    toggleDayRewrittenAction(dayId).catch(console.error);
  };

  const handleConfirmResetRewrittenDays = () => {
    const dayIds = currentDiaryPlan?.days.map((d) => d.id) || [];
    setRewrittenDayIds([]);
    try {
      localStorage.removeItem(`practice_rewritten_${selectedPlanId}`);
    } catch (e) {}
    resetRewrittenDaysAction(dayIds).catch(console.error);
    setIsResetDialogOpen(false);
  };

  // Movement Tracking States
  const [selectedStudentForHistory, setSelectedStudentForHistory] = useState<StudentPracticeRecord | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);

  // Assign / Move Student(s) Modal State
  const [isMoveModalOpen, setIsMoveModalOpen] = useState<boolean>(false);
  const [targetStudentIds, setTargetStudentIds] = useState<string[]>([]);
  const [moveForm, setMoveForm] = useState<MoveFormData>({
    companyId: "",
    practiceType: "Производственная",
    reason: "По согласованию с работодателем",
    customReason: "",
    startDate: "15.10.2026",
    endDate: "05.11.2026",
    companyMentor: "",
  });

  // Plan Edit / Create Dialogs
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState<boolean>(false);
  const [editingPlan, setEditingPlan] = useState<SpecialtyDiaryPlan | null>(null);
  const [planForm, setPlanForm] = useState<PlanFormData>({
    groupName: "ВР-1-26",
    title: "",
    specialty: "Веб-разработка",
    course: 1,
    practiceType: "Учебная (ознакомительная)",
    startDate: "15.10.2026",
    generateDaysCount: 15,
    defaultHours: 6,
  });

  // Day Topic Add / Edit Dialog
  const [isDayTopicDialogOpen, setIsDayTopicDialogOpen] = useState<boolean>(false);
  const [editingDayTopic, setEditingDayTopic] = useState<DiaryDayTopic | null>(null);
  const [dayTopicForm, setDayTopicForm] = useState<DayTopicFormData>({
    dayNumber: 1,
    section: "Раздел 1. Вводная часть",
    topic: "",
    tasksContent: "",
    hours: 6,
  });
  const [isCustomSection, setIsCustomSection] = useState<boolean>(false);

  // Section / Curriculum Manager Dialog
  const [isSectionsDialogOpen, setIsSectionsDialogOpen] = useState<boolean>(false);
  const [editingSectionName, setEditingSectionName] = useState<string>("");
  const [editingSectionTarget, setEditingSectionTarget] = useState<string | null>(null);
  const [newSectionForm, setNewSectionForm] = useState<NewSectionFormData>({
    name: "",
    daysCount: 3,
    hoursPerDay: 6,
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [courseFilter, setCourseFilter] = useState<number | "ALL">("ALL");
  const [groupFilter, setGroupFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [companyFilter, setCompanyFilter] = useState<string>("ALL");

  // Persistence
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.companies)) setCompanies(parsed.companies);
        if (Array.isArray(parsed.students)) setStudents(parsed.students);
        if (Array.isArray(parsed.diaryPlans)) {
          setDiaryPlans(parsed.diaryPlans);
          if (parsed.diaryPlans[0]?.id) {
            setSelectedPlanId(parsed.diaryPlans[0].id);
          }
        }
      }
    } catch (e) {
      console.error("Failed to load practice data from storage", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          companies,
          students,
          diaryPlans,
        })
      );
    } catch (e) {
      console.error("Failed to save practice data to storage", e);
    }
  }, [companies, students, diaryPlans, isLoaded]);

  // Dialog States
  const [isCompanyDialogOpen, setIsCompanyDialogOpen] = useState<boolean>(false);
  const [editingCompany, setEditingCompany] = useState<CompanyPartner | null>(null);
  const [companyForm, setCompanyForm] = useState<CompanyFormData>({
    name: "",
    industry: "IT & Разработка ПО",
    specialtyFocus: "Веб-разработка",
    contactPerson: "",
    position: "",
    phone: "",
    email: "",
    address: "г. Бишкек",
    contractNumber: "№ 01/ПР-2026",
    contractValidUntil: "31.12.2027",
    quotaTotal: 5,
  });

  const [isDocPreviewOpen, setIsDocPreviewOpen] = useState<boolean>(false);
  const [previewDocRecord, setPreviewDocRecord] = useState<StudentPracticeRecord | null>(null);

  // Computed Metrics
  const metrics = useMemo(() => {
    const totalCompanies = companies.length;
    const totalQuotas = companies.reduce((acc, c) => acc + c.quotaTotal, 0);
    const usedQuotas = companies.reduce((acc, c) => acc + c.quotaUsed, 0);

    const totalStudents = students.length;
    const assignedStudents = students.filter((s) => s.status !== "Не распределен").length;
    const activePractice = students.filter(
      (s) => s.status === "Проходит практику" || s.status === "Переведен на другую базу"
    ).length;
    const transferredStudents = students.filter((s) => s.movements && s.movements.length > 1).length;
    const completedPractice = students.filter((s) => s.status === "Практика завершена").length;

    return {
      totalCompanies,
      totalQuotas,
      usedQuotas,
      totalStudents,
      assignedStudents,
      activePractice,
      transferredStudents,
      completedPractice,
    };
  }, [companies, students]);

  const groupsList = useMemo(() => {
    const set = new Set<string>();
    initialGroups.forEach((g) => {
      if (g.name) set.add(g.name);
    });
    students.forEach((s) => {
      if (s.groupName) set.add(s.groupName);
    });
    diaryPlans.forEach((p) => {
      if (p.groupName) set.add(p.groupName);
    });
    return Array.from(set);
  }, [initialGroups, students, diaryPlans]);

  // All movements flat list for Movements Log tab
  const allMovementsLog = useMemo(() => {
    const list: {
      movementId: string;
      studentId: string;
      studentName: string;
      groupName: string;
      specialty: string;
      date: string;
      type: string;
      fromCompany?: string;
      toCompany: string;
      reason: string;
      mentor?: string;
    }[] = [];

    students.forEach((s) => {
      (s.movements || []).forEach((m) => {
        list.push({
          movementId: m.id,
          studentId: s.id,
          studentName: s.studentName,
          groupName: s.groupName,
          specialty: s.specialty,
          date: m.date,
          type: m.type,
          fromCompany: m.fromCompany,
          toCompany: m.toCompany,
          reason: m.reason,
          mentor: m.mentor || s.companyMentor,
        });
      });
    });

    return list.sort((a, b) => {
      const parse = (d: string) => {
        const parts = d.split(".");
        if (parts.length === 3) {
          return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10)).getTime();
        }
        return 0;
      };
      return parse(b.date) - parse(a.date);
    });
  }, [students]);

  // Current active Diary Plan
  const currentDiaryPlan = useMemo(() => {
    return diaryPlans.find((p) => p.id === selectedPlanId) || diaryPlans[0] || null;
  }, [diaryPlans, selectedPlanId]);

  // Synchronize start date when switching group plans
  useEffect(() => {
    const plan = diaryPlans.find((p) => p.id === selectedPlanId);
    if (plan?.startDate) {
      setPlanStartDate(plan.startDate);
    }
  }, [selectedPlanId, diaryPlans]);

  // Calculated Dates for current plan
  const calculatedDates = useMemo(() => {
    if (!currentDiaryPlan) return [];
    return calculateWorkingDates(planStartDate, currentDiaryPlan.days.length);
  }, [planStartDate, currentDiaryPlan]);

  // Summary of curriculum hours breakdown by section (расчасовка)
  const sectionHoursSummary = useMemo(() => {
    if (!currentDiaryPlan) return [];
    const map = new Map<string, { daysCount: number; hoursCount: number }>();
    currentDiaryPlan.days.forEach((d) => {
      const s = d.section?.trim() || "Общий раздел";
      const cur = map.get(s) || { daysCount: 0, hoursCount: 0 };
      cur.daysCount += 1;
      cur.hoursCount += Number(d.hours) || 0;
      map.set(s, cur);
    });
    return Array.from(map.entries()).map(([section, data]) => ({
      section,
      ...data,
      percent:
        currentDiaryPlan.totalHours > 0
          ? Math.round((data.hoursCount / currentDiaryPlan.totalHours) * 100)
          : 0,
    }));
  }, [currentDiaryPlan]);

  const availablePlanSections = useMemo(() => {
    const fromSummary = sectionHoursSummary.map((s) => s.section.trim()).filter(Boolean);
    if (fromSummary.length > 0) return fromSummary;
    if (currentDiaryPlan) {
      const set = new Set<string>();
      currentDiaryPlan.days.forEach((d) => {
        if (d.section?.trim()) set.add(d.section.trim());
      });
      const list = Array.from(set);
      if (list.length > 0) return list;
    }
    return [
      "Раздел 1. Вводный инструктаж и рабочее окружение",
      "Раздел 2. Практическая подготовка и разработка",
      "Раздел 3. Оформление документации и отчетность",
    ];
  }, [sectionHoursSummary, currentDiaryPlan]);

  const averageHoursPerDay = useMemo(() => {
    if (!currentDiaryPlan || currentDiaryPlan.days.length === 0) return 6;
    const avg = currentDiaryPlan.totalHours / currentDiaryPlan.days.length;
    return Number.isInteger(avg) ? avg : avg.toFixed(1);
  }, [currentDiaryPlan]);

  const handleStartDateChange = (newDate: string) => {
    setPlanStartDate(newDate);
    if (currentDiaryPlan) {
      setDiaryPlans((prev) =>
        prev.map((p) => (p.id === currentDiaryPlan.id ? { ...p, startDate: newDate } : p))
      );
    }
  };

  // Progress of rewriting to paper diary
  const rewriteProgress = useMemo(() => {
    if (!currentDiaryPlan || currentDiaryPlan.days.length === 0) return { count: 0, percent: 0 };
    const count = currentDiaryPlan.days.filter((d) => rewrittenDayIds.includes(d.id)).length;
    const percent = Math.round((count / currentDiaryPlan.days.length) * 100);
    return { count, percent };
  }, [currentDiaryPlan, rewrittenDayIds]);

  // Filtered Day Topics inside the active memo
  const filteredPlanDays = useMemo(() => {
    if (!currentDiaryPlan) return [];
    let list = currentDiaryPlan.days;
    if (rewriteFilter === "PENDING") {
      list = list.filter((d) => !rewrittenDayIds.includes(d.id));
    } else if (rewriteFilter === "DONE") {
      list = list.filter((d) => rewrittenDayIds.includes(d.id));
    }
    if (!memoDaySearch.trim()) return list;
    const q = memoDaySearch.toLowerCase().trim();
    return list.filter(
      (d) =>
        d.topic.toLowerCase().includes(q) ||
        d.tasksContent.toLowerCase().includes(q) ||
        d.section.toLowerCase().includes(q) ||
        d.dayNumber.toString().includes(q)
    );
  }, [currentDiaryPlan, memoDaySearch, rewriteFilter, rewrittenDayIds]);

  const sectionGroups = useMemo(() => {
    if (!currentDiaryPlan) return [];
    const isSearching = memoDaySearch.trim().length > 0;
    const order: string[] = [];
    const groups = new Map<string, DiaryDayTopic[]>();

    filteredPlanDays.forEach((d) => {
      const key = d.section?.trim() || "Общий раздел";
      if (!groups.has(key)) {
        groups.set(key, []);
        order.push(key);
      }
      groups.get(key)!.push(d);
    });

    return order.map((section) => {
      const allInSection = currentDiaryPlan.days.filter(
        (d) => (d.section?.trim() || "Общий раздел") === section
      );
      const done = allInSection.filter((d) => rewrittenDayIds.includes(d.id)).length;
      const hours = allInSection.reduce((acc, d) => acc + (Number(d.hours) || 0), 0);
      const collapsed = !isSearching && collapsedSections.includes(section);
      return {
        section,
        total: allInSection.length,
        done,
        hours,
        collapsed,
        days: groups.get(section) || [],
      };
    });
  }, [currentDiaryPlan, filteredPlanDays, collapsedSections, memoDaySearch, rewrittenDayIds]);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (courseFilter !== "ALL" && s.course !== courseFilter) return false;
      if (groupFilter !== "ALL" && s.groupName !== groupFilter) return false;
      if (statusFilter !== "ALL" && s.status !== statusFilter) return false;
      if (companyFilter !== "ALL" && s.companyId !== companyFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = s.studentName.toLowerCase().includes(q);
        const matchesComp = s.companyName && s.companyName.toLowerCase().includes(q);
        const matchesGroup = s.groupName.toLowerCase().includes(q);
        if (!matchesName && !matchesComp && !matchesGroup) return false;
      }
      return true;
    });
  }, [students, courseFilter, groupFilter, statusFilter, companyFilter, searchQuery]);

  // Filtered Companies
  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          c.name.toLowerCase().includes(q) ||
          c.industry.toLowerCase().includes(q) ||
          c.contactPerson.toLowerCase().includes(q) ||
          c.specialtyFocus.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [companies, searchQuery]);

  // Multi-Selection Helpers
  const isAllFilteredSelected = useMemo(() => {
    if (filteredStudents.length === 0) return false;
    return filteredStudents.every((s) => selectedStudentIds.includes(s.id));
  }, [filteredStudents, selectedStudentIds]);

  const handleToggleSelectAll = () => {
    if (isAllFilteredSelected) {
      const filteredIds = new Set(filteredStudents.map((s) => s.id));
      setSelectedStudentIds((prev) => prev.filter((id) => !filteredIds.has(id)));
    } else {
      const allNew = new Set([...selectedStudentIds, ...filteredStudents.map((s) => s.id)]);
      setSelectedStudentIds(Array.from(allNew));
    }
  };

  const handleToggleSelectStudent = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  // Movement & Distribution Handlers
  const handleOpenMoveSingle = (student: StudentPracticeRecord) => {
    const isAlreadyAssigned = !!student.companyId;
    setTargetStudentIds([student.id]);
    setMoveForm({
      companyId: student.companyId || companies[0]?.id || "",
      practiceType: student.practiceType || "Производственная",
      reason: isAlreadyAssigned
        ? "По согласованию с работодателем"
        : `Направление на практику (${student.groupName})`,
      customReason: "",
      startDate: student.startDate || "15.10.2026",
      endDate: student.endDate || "05.11.2026",
      companyMentor: student.companyMentor || "",
    });
    setIsMoveModalOpen(true);
  };

  const handleOpenMoveSelected = () => {
    if (selectedStudentIds.length === 0) return;
    const firstStudent = students.find((s) => s.id === selectedStudentIds[0]);

    setTargetStudentIds(selectedStudentIds);
    setMoveForm({
      companyId: companies[0]?.id || "",
      practiceType: firstStudent?.practiceType || "Производственная",
      reason: "Направление группы студентов на базу практики",
      customReason: "",
      startDate: "15.10.2026",
      endDate: "05.11.2026",
      companyMentor: "",
    });
    setIsMoveModalOpen(true);
  };

  const handleSaveMovement = () => {
    if (targetStudentIds.length === 0 || !moveForm.companyId) return;

    const targetCompany = companies.find((c) => c.id === moveForm.companyId);
    if (!targetCompany) return;

    const finalReason = moveForm.customReason.trim() || moveForm.reason;

    const todayFormatted = (() => {
      const d = new Date();
      const day = d.getDate().toString().padStart(2, "0");
      const month = (d.getMonth() + 1).toString().padStart(2, "0");
      const year = d.getFullYear();
      return `${day}.${month}.${year}`;
    })();

    const targetSet = new Set(targetStudentIds);
    const affectedPreviousCompanyIds: string[] = [];

    setStudents((prev) =>
      prev.map((s) => {
        if (!targetSet.has(s.id)) return s;

        const isTransfer = s.companyId && s.companyId !== targetCompany.id;
        if (isTransfer && s.companyId) {
          affectedPreviousCompanyIds.push(s.companyId);
        }

        const newMovementEntry: PracticeMovementRecord = {
          id: `mov-${Date.now()}-${s.id}`,
          date: todayFormatted,
          type: isTransfer ? "Перевод на другую базу" : "Первичное направление",
          fromCompany: isTransfer ? s.companyName : undefined,
          toCompany: targetCompany.name,
          practiceType: moveForm.practiceType,
          reason: finalReason,
          mentor: moveForm.companyMentor || targetCompany.contactPerson,
        };

        const newStatus: StudentPracticeStatus = isTransfer
          ? "Переведен на другую базу"
          : "Проходит практику";

        return {
          ...s,
          companyId: targetCompany.id,
          companyName: targetCompany.name,
          practiceType: moveForm.practiceType,
          companyMentor: moveForm.companyMentor || targetCompany.contactPerson,
          startDate: moveForm.startDate,
          endDate: moveForm.endDate,
          status: newStatus,
          movements: [...(s.movements || []), newMovementEntry],
        };
      })
    );

    // Update quotas
    setCompanies((prev) =>
      prev.map((c) => {
        let quotaUsed = c.quotaUsed;
        const decreasedCount = affectedPreviousCompanyIds.filter((id) => id === c.id).length;
        if (decreasedCount > 0) {
          quotaUsed = Math.max(0, quotaUsed - 1);
        }
        if (c.id === targetCompany.id) {
          quotaUsed = quotaUsed + targetStudentIds.length;
        }
        return { ...c, quotaUsed };
      })
    );

    // Call server action in background to persist to database
    assignStudentsAction({
      studentIds: targetStudentIds,
      companyId: targetCompany.id,
      practiceType: moveForm.practiceType,
      reason: finalReason,
      startDate: moveForm.startDate,
      endDate: moveForm.endDate,
      companyMentor: moveForm.companyMentor || targetCompany.contactPerson || "",
    }).catch(console.error);

    setSelectedStudentIds([]);
    setIsMoveModalOpen(false);
  };

  const handleOpenHistoryModal = (student: StudentPracticeRecord) => {
    setSelectedStudentForHistory(student);
    setIsHistoryModalOpen(true);
  };

  const handleCopyTopicContent = (dayId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDayId(dayId);
    setTimeout(() => {
      setCopiedDayId(null);
    }, 1500);
  };

  // Memo Plan Handlers
  const handleOpenCreatePlan = () => {
    setEditingPlan(null);
    const firstGroup = initialGroups.find((g) => g.name === groupsList[0]) || initialGroups[0];
    const initialGroupName = groupsList[0] || firstGroup?.name || "";
    setPlanForm({
      groupName: initialGroupName,
      title: "",
      specialty: firstGroup?.specialty || "Веб-разработка",
      course: firstGroup?.course || 1,
      practiceType: "Учебная (ознакомительная)",
      startDate: new Date().toLocaleDateString("ru-RU"),
      generateDaysCount: 15,
      defaultHours: 6,
    });
    setIsPlanDialogOpen(true);
  };

  const handleOpenEditPlan = (plan: SpecialtyDiaryPlan) => {
    setEditingPlan(plan);
    setPlanForm({
      groupName: plan.groupName || "",
      title: plan.title,
      specialty: plan.specialty,
      course: plan.course,
      practiceType: plan.practiceType,
      startDate: plan.startDate || planStartDate || "15.10.2026",
      generateDaysCount: plan.days.length,
      defaultHours: plan.days[0]?.hours || 6,
    });
    setIsPlanDialogOpen(true);
  };

  const handleSavePlan = () => {
    if (!planForm.specialty.trim()) return;

    if (editingPlan) {
      setDiaryPlans((prev) =>
        prev.map((p) => {
          if (p.id !== editingPlan.id) return p;
          const totalHours = p.days.reduce((acc, d) => acc + (Number(d.hours) || 0), 0);
          return {
            ...p,
            groupName: planForm.groupName.trim() || p.groupName || "Общая",
            title: planForm.title.trim() || `${planForm.groupName}: ${planForm.specialty} (${planForm.course} курс)`,
            specialty: planForm.specialty.trim(),
            course: planForm.course,
            practiceType: planForm.practiceType,
            startDate: planForm.startDate.trim() || p.startDate || "15.10.2026",
            totalDays: p.days.length,
            totalHours,
          };
        })
      );
    } else {
      const daysCount = Math.max(1, Math.min(60, planForm.generateDaysCount || 15));
      const hoursPerDay = planForm.defaultHours || 6;
      const generatedDays: DiaryDayTopic[] = [];

      for (let i = 1; i <= daysCount; i++) {
        let section = "Раздел 1. Вводный инструктаж и организация рабочего места";
        let topic = `День ${i}: Практическая работа по специальности`;
        let tasks = "Выполнение индивидуального производственного задания согласно графику практики.";

        if (i === 1) {
          section = "Раздел 1. Вводный инструктаж и безопасность";
          topic = "Инструктаж по ТБ и охране труда. Ознакомление с регламентом предприятия";
          tasks = "Прохождение вводного инструктажа по технике безопасности. Подготовка рабочего места и ознакомление с правилами внутреннего трудового распорядка.";
        } else if (i === daysCount) {
          section = "Раздел. Итоговая отчетность и аттестация";
          topic = "Оформление дневника практики и составление отчета";
          tasks = "Заполнение всех разделов физического дневника практики, согласование выполненных работ с наставником и получение отзыва-характеристики.";
        }

        generatedDays.push({
          id: `day-${Date.now()}-${i}`,
          dayNumber: i,
          section,
          topic,
          tasksContent: tasks,
          hours: hoursPerDay,
        });
      }

      const newPlanId = `plan-${Date.now()}`;
      const groupLabel = planForm.groupName.trim() || "Новая группа";
      const newPlan: SpecialtyDiaryPlan = {
        id: newPlanId,
        groupName: groupLabel,
        title: planForm.title.trim() || `${groupLabel}: ${planForm.specialty} (${planForm.course} курс)`,
        specialty: planForm.specialty.trim(),
        course: planForm.course,
        practiceType: planForm.practiceType,
        startDate: planForm.startDate.trim() || "15.10.2026",
        dailyHours: hoursPerDay,
        totalDays: daysCount,
        totalHours: daysCount * hoursPerDay,
        days: generatedDays,
      };

      setDiaryPlans((prev) => [...prev, newPlan]);
      setSelectedPlanId(newPlanId);
      if (newPlan.startDate) setPlanStartDate(newPlan.startDate);

      saveDiaryPlanAction({
        groupName: planForm.groupName,
        title: planForm.title || `${groupLabel}: ${planForm.specialty} (${planForm.course} курс)`,
        specialty: planForm.specialty,
        course: planForm.course,
        practiceType: planForm.practiceType,
        startDate: planForm.startDate,
        generateDaysCount: planForm.generateDaysCount,
        defaultHours: planForm.defaultHours,
      })
        .then((saved) => {
          if (saved?.id) {
            setDiaryPlans((prev) =>
              prev.map((p) => (p.id === newPlanId ? { ...p, id: saved.id } : p))
            );
            setSelectedPlanId(saved.id);
          }
        })
        .catch(console.error);
    }

    if (editingPlan) {
      saveDiaryPlanAction({
        id: editingPlan.id,
        groupName: planForm.groupName,
        title: planForm.title,
        specialty: planForm.specialty,
        course: planForm.course,
        practiceType: planForm.practiceType,
        startDate: planForm.startDate,
      }).catch(console.error);
    }

    setIsPlanDialogOpen(false);
  };

  // Day Topic Handlers
  const handleOpenAddDayTopic = () => {
    if (!currentDiaryPlan) return;
    const nextDayNum = currentDiaryPlan.days.length + 1;
    const lastDay = currentDiaryPlan.days[currentDiaryPlan.days.length - 1];

    setEditingDayTopic(null);
    setIsCustomSection(false);
    setDayTopicForm({
      dayNumber: nextDayNum,
      section: lastDay?.section || sectionHoursSummary[0]?.section || "Раздел 1. Вводный инструктаж и рабочее окружение",
      topic: "",
      tasksContent: "",
      hours: lastDay?.hours || 6,
    });
    setIsDayTopicDialogOpen(true);
  };

  const handleOpenEditDayTopic = (dayTopic: DiaryDayTopic) => {
    setEditingDayTopic(dayTopic);
    setIsCustomSection(false);
    setDayTopicForm({
      dayNumber: dayTopic.dayNumber,
      section: dayTopic.section,
      topic: dayTopic.topic,
      tasksContent: dayTopic.tasksContent,
      hours: dayTopic.hours,
    });
    setIsDayTopicDialogOpen(true);
  };

  const handleSaveDayTopic = () => {
    if (!currentDiaryPlan || !dayTopicForm.topic.trim()) return;

    if (editingDayTopic) {
      setDiaryPlans((prev) =>
        prev.map((p) => {
          if (p.id !== currentDiaryPlan.id) return p;
          const updatedDays = p.days.map((d) =>
            d.id === editingDayTopic.id
              ? {
                  ...d,
                  dayNumber: dayTopicForm.dayNumber,
                  section: dayTopicForm.section.trim(),
                  topic: dayTopicForm.topic.trim(),
                  tasksContent: dayTopicForm.tasksContent.trim(),
                  hours: dayTopicForm.hours,
                }
              : d
          );
          updatedDays.sort((a, b) => a.dayNumber - b.dayNumber);
          const totalHours = updatedDays.reduce((acc, d) => acc + d.hours, 0);
          return {
            ...p,
            days: updatedDays,
            totalDays: updatedDays.length,
            totalHours,
          };
        })
      );
    } else {
      const newDay: DiaryDayTopic = {
        id: `day-${Date.now()}`,
        dayNumber: dayTopicForm.dayNumber,
        section: dayTopicForm.section.trim() || "Практический раздел",
        topic: dayTopicForm.topic.trim(),
        tasksContent: dayTopicForm.tasksContent.trim() || "Выполнение практического задания.",
        hours: dayTopicForm.hours || 6,
      };

      setDiaryPlans((prev) =>
        prev.map((p) => {
          if (p.id !== currentDiaryPlan.id) return p;
          const newDays = [...p.days, newDay];
          newDays.sort((a, b) => a.dayNumber - b.dayNumber);
          const totalHours = newDays.reduce((acc, d) => acc + d.hours, 0);
          return {
            ...p,
            days: newDays,
            totalDays: newDays.length,
            totalHours,
          };
        })
      );
    }

    saveDayTopicAction({
      planId: currentDiaryPlan.id,
      dayId: editingDayTopic?.id,
      dayNumber: dayTopicForm.dayNumber,
      section: dayTopicForm.section.trim(),
      topic: dayTopicForm.topic.trim(),
      tasksContent: dayTopicForm.tasksContent.trim(),
      hours: dayTopicForm.hours,
    }).catch(console.error);

    setIsDayTopicDialogOpen(false);
  };

  const handleDeleteDayTopic = (dayId: string) => {
    if (!currentDiaryPlan) return;
    if (currentDiaryPlan.days.length <= 1) {
      alert("В памятке должен оставаться хотя бы один день.");
      return;
    }

    setDiaryPlans((prev) =>
      prev.map((p) => {
        if (p.id !== currentDiaryPlan.id) return p;
        const filteredDays = p.days.filter((d) => d.id !== dayId);
        const reindexedDays = filteredDays.map((d, idx) => ({
          ...d,
          dayNumber: idx + 1,
        }));
        const totalHours = reindexedDays.reduce((acc, d) => acc + d.hours, 0);
        return {
          ...p,
          days: reindexedDays,
          totalDays: reindexedDays.length,
          totalHours,
        };
      })
    );

    deleteDayTopicAction(currentDiaryPlan.id, dayId).catch(console.error);
  };

  // Sections Management Handlers
  const handleRenameSection = (oldSectionName: string, newSectionName: string) => {
    if (!currentDiaryPlan || !newSectionName.trim()) return;
    setDiaryPlans((prev) =>
      prev.map((p) => {
        if (p.id !== currentDiaryPlan.id) return p;
        const updatedDays = p.days.map((d) =>
          d.section.trim() === oldSectionName.trim()
            ? { ...d, section: newSectionName.trim() }
            : d
        );
        return { ...p, days: updatedDays };
      })
    );
    setEditingSectionTarget(null);
    setEditingSectionName("");
  };

  const handleUpdateSectionHours = (sectionName: string, newHoursPerDay: number) => {
    if (!currentDiaryPlan || newHoursPerDay <= 0) return;
    setDiaryPlans((prev) =>
      prev.map((p) => {
        if (p.id !== currentDiaryPlan.id) return p;
        const updatedDays = p.days.map((d) =>
          d.section.trim() === sectionName.trim()
            ? { ...d, hours: newHoursPerDay }
            : d
        );
        const totalHours = updatedDays.reduce((acc, d) => acc + d.hours, 0);
        return { ...p, days: updatedDays, totalHours };
      })
    );
  };

  const handleAddSectionWithDays = () => {
    if (!currentDiaryPlan || !newSectionForm.name.trim()) return;
    const startDayNum = currentDiaryPlan.days.length + 1;
    const daysCount = Math.max(1, Math.min(30, newSectionForm.daysCount));
    const hoursPerDay = Math.max(1, Math.min(12, newSectionForm.hoursPerDay));
    const newDays: DiaryDayTopic[] = [];
    for (let i = 0; i < daysCount; i++) {
      const num = startDayNum + i;
      newDays.push({
        id: `day-${Date.now()}-${num}`,
        dayNumber: num,
        section: newSectionForm.name.trim(),
        topic: `День ${num}: Практическое занятие по разделу «${newSectionForm.name.trim()}»`,
        tasksContent: `Выполнение индивидуального производственного задания согласно программе раздела «${newSectionForm.name.trim()}». Отработка практических навыков.`,
        hours: hoursPerDay,
      });
    }
    setDiaryPlans((prev) =>
      prev.map((p) => {
        if (p.id !== currentDiaryPlan.id) return p;
        const combined = [...p.days, ...newDays];
        const totalHours = combined.reduce((acc, d) => acc + d.hours, 0);
        return {
          ...p,
          days: combined,
          totalDays: combined.length,
          totalHours,
        };
      })
    );
    setNewSectionForm({ name: "", daysCount: 3, hoursPerDay: 6 });
  };

  const handleDeleteSection = (sectionName: string) => {
    if (!currentDiaryPlan) return;
    const remainingDays = currentDiaryPlan.days.filter((d) => d.section.trim() !== sectionName.trim());
    if (remainingDays.length === 0) {
      alert("В плане должен оставаться хотя бы один раздел программы.");
      return;
    }
    const reindexedDays = remainingDays.map((d, idx) => ({ ...d, dayNumber: idx + 1 }));
    const totalHours = reindexedDays.reduce((acc, d) => acc + d.hours, 0);
    setDiaryPlans((prev) =>
      prev.map((p) => {
        if (p.id !== currentDiaryPlan.id) return p;
        return {
          ...p,
          days: reindexedDays,
          totalDays: reindexedDays.length,
          totalHours,
        };
      })
    );
  };

  // Companies Handlers
  const handleOpenAddCompany = () => {
    setEditingCompany(null);
    setCompanyForm({
      name: "",
      industry: "IT & Разработка ПО",
      specialtyFocus: "Веб-разработка",
      contactPerson: "",
      position: "Руководитель практики",
      phone: "+996 (555) 00-00-00",
      email: "hr@company.kg",
      address: "г. Бишкек",
      contractNumber: `№ ${companies.length + 10}/ПР-2026`,
      contractValidUntil: "31.12.2027",
      quotaTotal: 5,
    });
    setIsCompanyDialogOpen(true);
  };

  const handleOpenEditCompany = (comp: CompanyPartner) => {
    setEditingCompany(comp);
    setCompanyForm({
      name: comp.name,
      industry: comp.industry,
      specialtyFocus: comp.specialtyFocus,
      contactPerson: comp.contactPerson,
      position: comp.position,
      phone: comp.phone,
      email: comp.email,
      address: comp.address,
      contractNumber: comp.contractNumber,
      contractValidUntil: comp.contractValidUntil,
      quotaTotal: comp.quotaTotal,
    });
    setIsCompanyDialogOpen(true);
  };

  const handleSaveCompany = () => {
    if (!companyForm.name.trim()) return;

    if (editingCompany) {
      setCompanies((prev) =>
        prev.map((c) => (c.id === editingCompany.id ? { ...c, ...companyForm } : c))
      );
      updateCompanyAction(editingCompany.id, companyForm).catch(console.error);
    } else {
      const tempId = `comp-${Date.now()}`;
      const newComp: CompanyPartner = {
        id: tempId,
        ...companyForm,
        quotaUsed: 0,
      };
      setCompanies((prev) => [newComp, ...prev]);
      createCompanyAction(companyForm)
        .then((res) => {
          if (res?.id) {
            setCompanies((prev) =>
              prev.map((c) => (c.id === tempId ? { ...c, id: res.id } : c))
            );
          }
        })
        .catch(console.error);
    }
    setIsCompanyDialogOpen(false);
  };

  const handleDeleteCompany = (id: string) => {
    setCompanies((prev) => prev.filter((c) => c.id !== id));
    deleteCompanyAction(id).catch(console.error);
  };

  const handleToggleCompletePractice = (rec: StudentPracticeRecord) => {
    const isCompleted = rec.status === "Практика завершена";
    const nextStatus: StudentPracticeStatus = isCompleted ? "Проходит практику" : "Практика завершена";
    setStudents((prev) =>
      prev.map((s) => (s.id === rec.id ? { ...s, status: nextStatus } : s))
    );
    toggleCompletePracticeAction(rec.id).catch(console.error);
  };

  const handleOpenDocPreview = (rec: StudentPracticeRecord) => {
    setPreviewDocRecord(rec);
    setIsDocPreviewOpen(true);
  };

  const targetStudentsList = useMemo(() => {
    return students.filter((s) => targetStudentIds.includes(s.id));
  }, [students, targetStudentIds]);

  const myPracticeInfo = useMemo(() => {
    if (!isStudent) return undefined;
    return (
      students.find(
        (s) =>
          s.studentName.toLowerCase().includes(currentUserName.toLowerCase()) ||
          currentUserName.toLowerCase().includes(s.studentName.toLowerCase())
      ) || students[0]
    );
  }, [isStudent, students, currentUserName]);

  useEffect(() => {
    if (isStudent && myPracticeInfo && diaryPlans.length > 0) {
      const studentPlan = diaryPlans.find(
        (p) => p.groupName?.toLowerCase() === myPracticeInfo.groupName?.toLowerCase()
      );
      if (studentPlan) {
        setSelectedPlanId(studentPlan.id);
      }
    }
  }, [isStudent, myPracticeInfo, diaryPlans]);

  return (
    <div className="space-y-3 w-full text-xs">
      {/* 1. Top Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-3.5 rounded-xl border">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span>{isStudent ? "Моё обучение" : "Учебный процесс"}</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-semibold">
              {isStudent ? "Памятка по практике" : "База практики"}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-sm font-bold text-foreground flex items-center gap-2">
              {isStudent ? (
                <>
                  <FileText className="h-4 w-4 text-primary" /> Памятка студенту по практике
                </>
              ) : (
                <>
                  <Building2 className="h-4 w-4 text-primary" /> База практики
                </>
              )}
            </h1>
            <Badge variant="outline" className="text-[10px] font-semibold bg-primary/10 text-primary border-primary/30">
              {isStudent ? "Методические материалы & календарный план П/О" : "Распределение & Учёт перемещений студентов"}
            </Badge>
          </div>
        </div>

        {!isStudent && (
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="xs"
              variant="outline"
              onClick={handleOpenAddCompany}
              className="h-8 text-xs gap-1.5 font-medium border-border hover:bg-muted"
            >
              <Building2 className="h-3.5 w-3.5 text-primary" />
              <span>Новая база практики</span>
            </Button>
          </div>
        )}
      </div>

      {/* Student: Personal practice assignment card */}
      {isStudent && myPracticeInfo && (
        <div className="p-3.5 rounded-xl border bg-card space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <span className="font-bold text-foreground text-xs">Моё распределение на практику</span>
            </div>
            <Badge
              variant="outline"
              className="text-[10px] font-semibold bg-primary/10 text-primary border-primary/30"
            >
              {myPracticeInfo.status}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1 text-xs">
            <div className="p-2.5 rounded-lg bg-muted/40 border space-y-0.5">
              <span className="text-[10px] text-muted-foreground font-medium">Организация (База практики)</span>
              <div className="font-semibold text-foreground text-xs">
                {myPracticeInfo.companyName || "Направлен на предприятие"}
              </div>
              <div className="text-[10px] text-muted-foreground">{myPracticeInfo.practiceType}</div>
            </div>

            <div className="p-2.5 rounded-lg bg-muted/40 border space-y-0.5">
              <span className="text-[10px] text-muted-foreground font-medium">Сроки прохождения</span>
              <div className="font-semibold text-foreground font-mono text-xs">
                {myPracticeInfo.startDate} — {myPracticeInfo.endDate}
              </div>
              <div className="text-[10px] text-muted-foreground">Группа: {myPracticeInfo.groupName}</div>
            </div>

            <div className="p-2.5 rounded-lg bg-muted/40 border space-y-0.5">
              <span className="text-[10px] text-muted-foreground font-medium">Наставник от предприятия</span>
              <div className="font-semibold text-foreground text-xs">
                {myPracticeInfo.companyMentor || "Назначается на объекте"}
              </div>
              <div className="text-[10px] text-muted-foreground">Руководитель практики</div>
            </div>

            <div className="p-2.5 rounded-lg bg-muted/40 border space-y-0.5">
              <span className="text-[10px] text-muted-foreground font-medium">Куратор от колледжа</span>
              <div className="font-semibold text-foreground text-xs">{myPracticeInfo.collegeMentor}</div>
              <div className="text-[10px] text-muted-foreground">Преподаватель / Мастер П/О</div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Top Metric Cards (Admin/Teacher only) */}
      {!isStudent && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-xl border bg-card flex items-center justify-between hover:border-primary/40 transition-colors">
            <div>
              <div className="text-[11px] text-muted-foreground font-medium">Баз практики (Организации)</div>
              <div className="text-lg font-bold text-foreground mt-0.5">
                <AnimatedCounter value={metrics.totalCompanies} /> предприятий
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                Квота: <span className="font-semibold text-foreground"><AnimatedCounter value={metrics.usedQuotas} /></span> из <AnimatedCounter value={metrics.totalQuotas} /> мест
              </div>
            </div>
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Building2 className="h-4 w-4" />
            </div>
          </div>

          <div className="p-3 rounded-xl border bg-card flex items-center justify-between hover:border-primary/40 transition-colors">
            <div>
              <div className="text-[11px] text-muted-foreground font-medium">Студентов на практике</div>
              <div className="text-lg font-bold text-foreground mt-0.5">
                <AnimatedCounter value={metrics.activePractice} /> чел.
              </div>
              <div className="text-[10px] text-primary font-medium mt-0.5">
                Распределено: <AnimatedCounter value={metrics.assignedStudents} /> из <AnimatedCounter value={metrics.totalStudents} />
              </div>
            </div>
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </div>

          <div className="p-3 rounded-xl border bg-card flex items-center justify-between hover:border-primary/40 transition-colors">
            <div>
              <div className="text-[11px] text-muted-foreground font-medium">Перемещений / Переводов</div>
              <div className="text-lg font-bold text-foreground mt-0.5">
                <AnimatedCounter value={allMovementsLog.length} /> записей
              </div>
              <div className="text-[10px] text-muted-foreground font-medium mt-0.5">
                Переводились: <AnimatedCounter value={metrics.transferredStudents} /> студентов
              </div>
            </div>
            <div className="h-9 w-9 rounded-lg bg-muted text-foreground flex items-center justify-center">
              <ArrowRightLeft className="h-4 w-4" />
            </div>
          </div>

          <div className="p-3 rounded-xl border bg-card flex items-center justify-between hover:border-primary/40 transition-colors">
            <div>
              <div className="text-[11px] text-muted-foreground font-medium">Практика завершена</div>
              <div className="text-lg font-bold text-foreground mt-0.5">
                <AnimatedCounter value={metrics.completedPractice} /> чел.
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                Завершили период практики
              </div>
            </div>
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
        </div>
      )}

      {/* 3. Navigation Tabs (Admin/Teacher only) */}
      {!isStudent && (
        <div className="bg-card border rounded-xl p-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border text-xs flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTab("students")}
              className={`h-7 px-3 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === "students"
                  ? "bg-background text-primary border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Студенты на практике (<AnimatedCounter value={students.length} />)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("movements-log")}
              className={`h-7 px-3 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === "movements-log"
                  ? "bg-background text-primary border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <History className="h-3.5 w-3.5" />
              <span>Журнал перемещений (<AnimatedCounter value={allMovementsLog.length} />)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("companies")}
              className={`h-7 px-3 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === "companies"
                  ? "bg-background text-primary border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              <span>Базы практики (<AnimatedCounter value={companies.length} />)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("diary-plan")}
              className={`h-7 px-3 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === "diary-plan"
                  ? "bg-background text-primary border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <BookOpenCheck className="h-3.5 w-3.5" />
              <span>Памятка студенту (<AnimatedCounter value={diaryPlans.length} />)</span>
            </button>
          </div>

          {activeTab !== "diary-plan" && (
            <div className="relative w-[180px] sm:w-[220px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Поиск по ФИО, базе..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-7 pl-8 pr-7 text-xs bg-background"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Active Tab Contents */}
      {activeTab === "students" && (
        <StudentsTab
          courseFilter={courseFilter}
          setCourseFilter={setCourseFilter}
          groupFilter={groupFilter}
          setGroupFilter={setGroupFilter}
          groupsList={groupsList}
          companyFilter={companyFilter}
          setCompanyFilter={setCompanyFilter}
          companies={companies}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          filteredStudents={filteredStudents}
          selectedStudentIds={selectedStudentIds}
          setSelectedStudentIds={setSelectedStudentIds}
          isAllFilteredSelected={isAllFilteredSelected}
          onToggleSelectAll={handleToggleSelectAll}
          onToggleSelectStudent={handleToggleSelectStudent}
          onOpenMoveSelected={handleOpenMoveSelected}
          onOpenMoveSingle={handleOpenMoveSingle}
          onOpenHistoryModal={handleOpenHistoryModal}
          onOpenDocPreview={handleOpenDocPreview}
          onToggleCompletePractice={handleToggleCompletePractice}
        />
      )}

      {activeTab === "movements-log" && (
        <MovementsTab allMovementsLog={allMovementsLog} />
      )}

      {activeTab === "companies" && (
        <CompaniesTab
          filteredCompanies={filteredCompanies}
          students={students}
          onOpenEditCompany={handleOpenEditCompany}
          onDeleteCompany={handleDeleteCompany}
          onShowStudentsForCompany={(cId) => {
            setActiveTab("students");
            setCompanyFilter(cId);
          }}
        />
      )}

      {activeTab === "diary-plan" && (
        <DiaryPlanTab
          isStudent={isStudent}
          diaryPlans={diaryPlans}
          selectedPlanId={selectedPlanId}
          setSelectedPlanId={setSelectedPlanId}
          planStartDate={planStartDate}
          onStartDateChange={handleStartDateChange}
          memoDaySearch={memoDaySearch}
          setMemoDaySearch={setMemoDaySearch}
          currentDiaryPlan={currentDiaryPlan}
          myPracticeInfo={myPracticeInfo}
          averageHoursPerDay={averageHoursPerDay}
          isCurriculumTableExpanded={isCurriculumTableExpanded}
          setIsCurriculumTableExpanded={setIsCurriculumTableExpanded}
          sectionHoursSummary={sectionHoursSummary}
          rewriteProgress={rewriteProgress}
          rewriteFilter={rewriteFilter}
          setRewriteFilter={setRewriteFilter}
          collapsedSections={collapsedSections}
          setCollapsedSections={setCollapsedSections}
          filteredPlanDays={filteredPlanDays}
          sectionGroups={sectionGroups}
          calculatedDates={calculatedDates}
          getWeekdayFromDateStr={getWeekdayFromDateStr}
          rewrittenDayIds={rewrittenDayIds}
          copiedDayId={copiedDayId}
          onCopyTopicContent={handleCopyTopicContent}
          onToggleDayRewritten={handleToggleDayRewritten}
          onOpenCreatePlan={handleOpenCreatePlan}
          onOpenEditPlan={handleOpenEditPlan}
          onOpenAddDayTopic={handleOpenAddDayTopic}
          onOpenEditDayTopic={handleOpenEditDayTopic}
          onDeleteDayTopic={handleDeleteDayTopic}
          onOpenPrintPlanDialog={() => setIsPrintPlanDialogOpen(true)}
          onOpenSectionsDialog={() => setIsSectionsDialogOpen(true)}
          onOpenResetDialog={() => setIsResetDialogOpen(true)}
          onEditSection={(section) => {
            setEditingSectionTarget(section);
            setEditingSectionName(section);
            setIsSectionsDialogOpen(true);
          }}
        />
      )}

      {/* Modals & Dialogs */}
      <AssignStudentDialog
        open={isMoveModalOpen}
        onOpenChange={setIsMoveModalOpen}
        targetStudentsList={targetStudentsList}
        companies={companies}
        moveForm={moveForm}
        setMoveForm={setMoveForm}
        onSaveMovement={handleSaveMovement}
      />

      <StudentHistoryDialog
        open={isHistoryModalOpen}
        onOpenChange={setIsHistoryModalOpen}
        student={selectedStudentForHistory}
        onOpenMoveSingle={handleOpenMoveSingle}
      />

      <PrintDirectionDialog
        open={isDocPreviewOpen}
        onOpenChange={setIsDocPreviewOpen}
        record={previewDocRecord}
      />

      <CompanyDialog
        open={isCompanyDialogOpen}
        onOpenChange={setIsCompanyDialogOpen}
        editingCompany={editingCompany}
        companyForm={companyForm}
        setCompanyForm={setCompanyForm}
        onSaveCompany={handleSaveCompany}
      />

      <MemoPlanDialog
        open={isPlanDialogOpen}
        onOpenChange={setIsPlanDialogOpen}
        editingPlan={editingPlan}
        planForm={planForm}
        setPlanForm={setPlanForm}
        groupsList={groupsList}
        onSavePlan={handleSavePlan}
      />

      <DayTopicDialog
        open={isDayTopicDialogOpen}
        onOpenChange={setIsDayTopicDialogOpen}
        editingDayTopic={editingDayTopic}
        currentDiaryPlan={currentDiaryPlan}
        dayTopicForm={dayTopicForm}
        setDayTopicForm={setDayTopicForm}
        isCustomSection={isCustomSection}
        setIsCustomSection={setIsCustomSection}
        availablePlanSections={availablePlanSections}
        onSaveDayTopic={handleSaveDayTopic}
      />

      <PrintMemoDialog
        open={isPrintPlanDialogOpen}
        onOpenChange={setIsPrintPlanDialogOpen}
        currentDiaryPlan={currentDiaryPlan}
        sectionHoursSummary={sectionHoursSummary}
        calculatedDates={calculatedDates}
      />

      <SectionsManagerDialog
        open={isSectionsDialogOpen}
        onOpenChange={setIsSectionsDialogOpen}
        currentDiaryPlan={currentDiaryPlan}
        sectionHoursSummary={sectionHoursSummary}
        editingSectionTarget={editingSectionTarget}
        setEditingSectionTarget={setEditingSectionTarget}
        editingSectionName={editingSectionName}
        setEditingSectionName={setEditingSectionName}
        onRenameSection={handleRenameSection}
        onUpdateSectionHours={handleUpdateSectionHours}
        onDeleteSection={handleDeleteSection}
        newSectionForm={newSectionForm}
        setNewSectionForm={setNewSectionForm}
        onAddSectionWithDays={handleAddSectionWithDays}
      />

      <ResetConfirmDialog
        open={isResetDialogOpen}
        onOpenChange={setIsResetDialogOpen}
        groupName={currentDiaryPlan?.groupName}
        onConfirm={handleConfirmResetRewrittenDays}
      />
    </div>
  );
}
