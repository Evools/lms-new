"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SubmissionStatus } from "@prisma/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  ClipboardList,
  Plus,
  Search,
  Building2,
  BookOpen,
  User,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  Send,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  Users,
  Sparkles,
  Paperclip,
  Eye,
  List,
  LayoutGrid,
  Check,
  XCircle,
  Copy,
  MessageSquare,
  ArrowRight,
  CheckCheck,
} from "lucide-react";
import {
  GroupItemDTO,
  GroupSubjectDTO,
  AssignmentDTO,
  SubmissionDTO,
  createAssignmentAction,
  deleteAssignmentAction,
  submitAssignmentAction,
  reviewSubmissionAction,
} from "../actions";
import { renderMarkdown } from "@/lib/markdown";
import { Textarea } from "@/components/ui/textarea";

function parseAttachmentLinks(fileUrl?: string | null): string[] {
  if (!fileUrl) return [];
  try {
    const parsed = JSON.parse(fileUrl);
    if (Array.isArray(parsed)) {
      return parsed
        .map((item: any) => (typeof item === "string" ? item : item?.url || ""))
        .filter(Boolean);
    }
  } catch {}
  if (fileUrl.trim().startsWith("http://") || fileUrl.trim().startsWith("https://")) {
    return [fileUrl.trim()];
  }
  return [];
}

const PRESET_FEEDBACKS = [
  "Зачтено! Отличная работа.",
  "Всё выполнено корректно и аккуратно.",
  "Требуется исправить замечания и пересдать.",
  "Не удаётся открыть ссылку. Пожалуйста, проверьте права доступа.",
];

interface AssignmentsViewProps {
  userRole: string;
  groups: GroupItemDTO[];
  subjects: GroupSubjectDTO[];
  assignments: AssignmentDTO[];
  selectedGroupId: string;
  canCreate: boolean;
}

type ReviewStatusFilter = "ALL" | "SUBMITTED" | "ACCEPTED" | "NEED_REVISION";

export function AssignmentsView({
  userRole,
  groups = [],
  subjects = [],
  assignments = [],
  selectedGroupId,
  canCreate,
}: AssignmentsViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [currentGroupId, setCurrentGroupId] = useState<string>(selectedGroupId);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [activeTabFilter, setActiveTabFilter] = useState<"ALL" | "PENDING">("ALL");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);

  // Modal 1: Create Assignment
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [newGroupSubjectId, setNewGroupSubjectId] = useState<string>(subjects[0]?.id || "");
  const [newTitle, setNewTitle] = useState<string>("");
  const [newDescription, setNewDescription] = useState<string>("");
  const [newDueDate, setNewDueDate] = useState<string>("");
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>([""]);

  // Modal 2: Student Submission Modal
  const [submitTargetAssignment, setSubmitTargetAssignment] = useState<AssignmentDTO | null>(null);
  const [submitFileUrl, setSubmitFileUrl] = useState<string>("");
  const [submitComment, setSubmitComment] = useState<string>("");

  // Modal 3: Teacher Streamlined Review Submissions Suite
  const [reviewTargetAssignment, setReviewTargetAssignment] = useState<AssignmentDTO | null>(null);
  const [reviewTeacherCommentMap, setReviewTeacherCommentMap] = useState<Record<string, string>>({});
  const [reviewGradeMap, setReviewGradeMap] = useState<Record<string, number | null>>({});
  const [reviewFilter, setReviewFilter] = useState<ReviewStatusFilter>("SUBMITTED");
  const [submissionSearch, setSubmissionSearch] = useState<string>("");
  const [activeSubmissionId, setActiveSubmissionId] = useState<string | null>(null);
  const [reviewViewMode, setReviewViewMode] = useState<"focus" | "list">("focus");

  // Full Assignment Details Modal
  const [viewTargetAssignment, setViewTargetAssignment] = useState<AssignmentDTO | null>(null);

  // Student "My Result" Modal (separate from assignment description)
  const [viewMyResultAssignment, setViewMyResultAssignment] = useState<AssignmentDTO | null>(null);

  const currentGroupObj = groups.find((g) => g.id === currentGroupId);

  const handleGroupChange = (val: string) => {
    setCurrentGroupId(val);
    router.push(`/dashboard/assignments?group=${val}`);
  };

  // Attachment URL Handlers
  const handleAddAttachmentUrl = () => {
    setAttachmentUrls((prev) => [...prev, ""]);
  };

  const handleUpdateAttachmentUrl = (index: number, value: string) => {
    setAttachmentUrls((prev) => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  };

  const handleRemoveAttachmentUrl = (index: number) => {
    setAttachmentUrls((prev) => prev.filter((_, i) => i !== index));
  };

  // Create Assignment Handler
  const handleCreateAssignment = () => {
    if (!newGroupSubjectId || !newTitle.trim()) {
      setErrorMsg("Заполните обязательные поля: Дисциплина и Заголовок");
      return;
    }

    const validUrls = attachmentUrls.map((u) => u.trim()).filter(Boolean);
    const serializedFileUrl = validUrls.length > 0 ? JSON.stringify(validUrls) : undefined;

    setErrorMsg(null);
    startTransition(async () => {
      const res = await createAssignmentAction({
        groupSubjectId: newGroupSubjectId,
        title: newTitle,
        description: newDescription,
        dueDate: newDueDate || undefined,
        fileUrl: serializedFileUrl,
      });

      if (res.success) {
        setIsCreateOpen(false);
        setNewTitle("");
        setNewDescription("");
        setNewDueDate("");
        setAttachmentUrls([""]);
        setSuccessMsg("Домашнее задание успешно опубликовано!");
        router.refresh();
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setErrorMsg(res.error || "Не удалось создать задание");
      }
    });
  };

  // Delete Assignment Handler
  const handleDeleteAssignment = (assignmentId: string) => {
    if (!confirm("Вы действительно хотите удалить это домашнее задание?")) return;

    setErrorMsg(null);
    startTransition(async () => {
      const res = await deleteAssignmentAction(assignmentId);
      if (res.success) {
        setSuccessMsg("Задание удалено!");
        router.refresh();
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setErrorMsg(res.error || "Не удалось удалить задание");
      }
    });
  };

  // Student Submit Handler
  const handleStudentSubmit = () => {
    if (!submitTargetAssignment) return;
    if (!submitFileUrl.trim() && !submitComment.trim()) {
      setErrorMsg("Укажите ссылку на выполненное задание или напишите комментарий");
      return;
    }

    setErrorMsg(null);
    startTransition(async () => {
      const res = await submitAssignmentAction({
        assignmentId: submitTargetAssignment.id,
        fileUrl: submitFileUrl,
        comment: submitComment,
      });

      if (res.success) {
        setSubmitTargetAssignment(null);
        setSubmitFileUrl("");
        setSubmitComment("");
        setSuccessMsg("Решение отправлено на проверку преподавателю!");
        router.refresh();
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setErrorMsg(res.error || "Ошибка при отправке задания");
      }
    });
  };

  // Open Teacher Review Suite Handler
  const handleOpenReviewModal = (assignment: AssignmentDTO) => {
    setReviewTargetAssignment(assignment);
    const initialComments: Record<string, string> = {};
    const initialGrades: Record<string, number | null> = {};
    assignment.submissions.forEach((s) => {
      initialComments[s.id] = s.teacherComment || "";
      initialGrades[s.id] = s.grade ?? null;
    });
    setReviewTeacherCommentMap(initialComments);
    setReviewGradeMap(initialGrades);

    const pendingSub = assignment.submissions.find((s) => s.status === SubmissionStatus.SUBMITTED);
    if (pendingSub) {
      setReviewFilter("SUBMITTED");
      setActiveSubmissionId(pendingSub.id);
    } else {
      setReviewFilter("ALL");
      setActiveSubmissionId(assignment.submissions[0]?.id || null);
    }
  };

  // Teacher Review Single Submission Handler (Auto-advances to next student!)
  const handleReviewSubmission = (submissionId: string, status: SubmissionStatus) => {
    const teacherComment = reviewTeacherCommentMap[submissionId] || "";
    const grade = reviewGradeMap[submissionId] ?? null;

    setErrorMsg(null);
    startTransition(async () => {
      const res = await reviewSubmissionAction({
        submissionId,
        status,
        teacherComment,
        grade,
      });

      if (res.success) {
        setSuccessMsg("Результат проверки сохранён!");

        // Auto advance to next student submission in current filtered queue
        if (reviewTargetAssignment) {
          const currentList = getFilteredSubmissions();
          const currentIndex = currentList.findIndex((s) => s.id === submissionId);
          if (currentIndex !== -1 && currentIndex < currentList.length - 1) {
            setActiveSubmissionId(currentList[currentIndex + 1].id);
          }
        }

        router.refresh();
        setTimeout(() => setSuccessMsg(null), 2500);
      } else {
        setErrorMsg(res.error || "Ошибка при сохранении результата");
      }
    });
  };

  const getFilteredSubmissions = (): SubmissionDTO[] => {
    if (!reviewTargetAssignment) return [];
    return reviewTargetAssignment.submissions.filter((sub) => {
      const matchesSearch =
        !submissionSearch || sub.studentName.toLowerCase().includes(submissionSearch.toLowerCase());
      if (!matchesSearch) return false;

      if (reviewFilter === "SUBMITTED") return sub.status === SubmissionStatus.SUBMITTED;
      if (reviewFilter === "ACCEPTED") return sub.status === SubmissionStatus.ACCEPTED;
      if (reviewFilter === "NEED_REVISION") return sub.status === SubmissionStatus.NEED_REVISION;
      return true;
    });
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  // Calculate Metrics
  const totalAssignments = assignments.length;
  let totalSubmissionsCount = 0;
  let totalAcceptedCount = 0;
  let totalNeedRevisionCount = 0;

  assignments.forEach((a) => {
    totalSubmissionsCount += a.submissionsCount;
    totalAcceptedCount += a.acceptedCount;
    totalNeedRevisionCount += a.needRevisionCount;
  });

  // Filtered Assignments
  const filteredAssignments = assignments.filter((a) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      a.title.toLowerCase().includes(query) ||
      a.subjectName.toLowerCase().includes(query) ||
      a.teacherName.toLowerCase().includes(query);

    const matchesSubject = subjectFilter === "all" || a.groupSubjectId === subjectFilter;

    if (!matchesSearch || !matchesSubject) return false;
    if (activeTabFilter === "PENDING") {
      return a.submissionsCount > a.acceptedCount;
    }
    return true;
  });

  return (
    <div className="space-y-3 pb-6 text-xs">
      {/* Top Banner & KPI Stat Summary */}
      <div className="bg-card p-3 rounded-xl border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <ClipboardList className="h-4 w-4" />
            </div>
            <h1 className="text-sm font-bold text-foreground flex items-center gap-2 truncate">
              Домашние задания и ДЗ
            </h1>
            <Badge variant="outline" className="text-[10px] border-primary/30 text-primary bg-primary/5 font-semibold px-2 py-0">
              {currentGroupObj?.name || "Все группы"}
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground leading-tight">
            Выдача практических заданий, пошаговая проверка решений и контроль результатов
          </p>
        </div>

        {/* Quick KPI Stat Chips */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/50 border text-[11px]">
            <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-muted-foreground">Заданий:</span>
            <span className="font-bold text-foreground">{totalAssignments}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/50 border text-[11px]">
            <Send className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-muted-foreground">Сдано:</span>
            <span className="font-bold text-foreground">{totalSubmissionsCount}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-[11px]">
            <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-primary font-medium">Принято:</span>
            <span className="font-bold text-primary">{totalAcceptedCount}</span>
          </div>

          {canCreate && (
            <div className="flex items-center gap-1.5">
              <Link href={`/dashboard/assignments/new?group=${currentGroupId}`}>
                <Button size="xs" className="h-8 text-xs gap-1.5 font-medium px-3">
                  <Plus className="h-3.5 w-3.5" /> Создать
                </Button>
              </Link>

              <Button
                size="xs"
                variant="outline"
                onClick={() => setIsCreateOpen(true)}
                className="h-8 text-xs gap-1 border-primary/30 text-primary hover:bg-primary/10 font-medium px-2.5"
                title="Быстрое добавление задания"
              >
                <Sparkles className="h-3.5 w-3.5" /> Быстрое ДЗ
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Control & Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2 bg-card p-2.5 rounded-xl border items-center">
        {/* Group Selector */}
        <div className="lg:col-span-3">
          <Select value={currentGroupId} onValueChange={handleGroupChange}>
            <SelectTrigger className="h-8 text-xs bg-background font-medium">
              <div className="flex items-center gap-1.5 truncate">
                <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
                <SelectValue>{currentGroupObj?.name ? `Группа ${currentGroupObj.name}` : "Выберите группу"}</SelectValue>
              </div>
            </SelectTrigger>
            <SelectContent>
              {groups.map((g) => (
                <SelectItem key={g.id} value={g.id} className="text-xs">
                  Группа {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Subject Filter */}
        <div className="lg:col-span-3">
          <Select value={subjectFilter} onValueChange={setSubjectFilter}>
            <SelectTrigger className="h-8 text-xs bg-background font-medium">
              <div className="flex items-center gap-1.5 truncate">
                <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />
                <SelectValue>
                  {subjectFilter === "all"
                    ? "Все предметы"
                    : subjects.find((s) => s.id === subjectFilter)?.subjectName || "Все предметы"}
                </SelectValue>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs font-medium">
                Все предметы
              </SelectItem>
              {subjects.map((s) => (
                <SelectItem key={s.id} value={s.id} className="text-xs">
                  {s.subjectName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tab Filters (All vs Pending) */}
        <div className="lg:col-span-3 flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border">
          <button
            type="button"
            onClick={() => setActiveTabFilter("ALL")}
            className={`flex-1 py-1 rounded-md text-xs font-medium transition-all text-center ${
              activeTabFilter === "ALL"
                ? "bg-background text-primary shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Все ({totalAssignments})
          </button>

          {canCreate && (
            <button
              type="button"
              onClick={() => setActiveTabFilter("PENDING")}
              className={`flex-1 py-1 rounded-md text-xs font-medium transition-all text-center flex items-center justify-center gap-1 ${
                activeTabFilter === "PENDING"
                  ? "bg-background text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              На проверку
              {totalSubmissionsCount > totalAcceptedCount && (
                <span className="text-[9px] px-1 rounded-full bg-primary/20 text-primary font-bold">
                  {totalSubmissionsCount - totalAcceptedCount}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Search & View Mode Switcher */}
        <div className="lg:col-span-3 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Поиск по названию..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 text-xs pl-8 bg-background"
            />
          </div>

          <div className="flex items-center p-0.5 bg-muted/60 rounded-lg border shrink-0">
            <Button
              size="xs"
              variant="ghost"
              onClick={() => setViewMode("table")}
              className={`h-7 w-7 p-0 rounded-md ${
                viewMode === "table" ? "bg-background text-primary shadow-xs" : "text-muted-foreground"
              }`}
              title="Табличный вид"
            >
              <List className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="xs"
              variant="ghost"
              onClick={() => setViewMode("grid")}
              className={`h-7 w-7 p-0 rounded-md ${
                viewMode === "grid" ? "bg-background text-primary shadow-xs" : "text-muted-foreground"
              }`}
              title="Вид карточек"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Alert Messages */}
      {successMsg && (
        <div className="p-2.5 rounded-lg border border-primary/30 bg-primary/10 text-primary text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-2.5 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* VIEW MODE 1: High-Density Table View (Default) */}
      {viewMode === "table" ? (
        <div className="bg-card rounded-xl border shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b bg-muted/40 text-[11px] text-muted-foreground font-semibold">
                  <th className="py-2.5 px-3">Название задания</th>
                  <th className="py-2.5 px-3">Дисциплина / Преподаватель</th>
                  <th className="py-2.5 px-3 text-center">Срок сдачи</th>
                  <th className="py-2.5 px-3 text-center">Ресурсы</th>
                  <th className="py-2.5 px-3 text-center">Работы & Статус</th>
                  <th className="py-2.5 px-3 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredAssignments.map((assignment) => {
                  const userSub = assignment.userSubmission;
                  const attachmentLinksList = parseAttachmentLinks(assignment.fileUrl);

                  return (
                    <tr key={assignment.id} className="hover:bg-muted/30 transition-colors">
                      {/* Title & Description */}
                      <td className="py-2.5 px-3 max-w-[300px]">
                        <div
                          onClick={() => setViewTargetAssignment(assignment)}
                          className="font-bold text-foreground text-xs hover:text-primary transition-colors cursor-pointer truncate flex items-center gap-1.5"
                        >
                          <ClipboardList className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span className="truncate">{assignment.title}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate pt-0.5">
                          {assignment.description
                            ? assignment.description.replace(/[#*`_~\-\[\]()]/g, " ").substring(0, 70)
                            : "Без описания"}
                        </div>
                      </td>

                      {/* Subject & Teacher */}
                      <td className="py-2.5 px-3 max-w-[200px]">
                        <Badge
                          variant="outline"
                          className="text-[10px] border-primary/30 text-primary bg-primary/5 font-medium px-1.5 py-0 truncate"
                        >
                          {assignment.subjectName}
                        </Badge>
                        <div className="text-[10px] text-muted-foreground truncate pt-0.5 flex items-center gap-1">
                          <User className="h-3 w-3 shrink-0" /> {assignment.teacherName}
                        </div>
                      </td>

                      {/* Due Date */}
                      <td className="py-2.5 px-3 text-center">
                        {assignment.dueDate ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-foreground bg-muted/60 px-2 py-0.5 rounded-md border">
                            <Clock className="h-3 w-3 text-primary shrink-0" />
                            {new Date(assignment.dueDate).toLocaleDateString("ru-RU")}
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground italic">Без срока</span>
                        )}
                      </td>

                      {/* Attachments */}
                      <td className="py-2.5 px-3 text-center">
                        {attachmentLinksList.length > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                            <Paperclip className="h-3 w-3 shrink-0" /> {attachmentLinksList.length}
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Submissions & Status */}
                      <td className="py-2.5 px-3">
                        {canCreate ? (
                          <button
                            type="button"
                            onClick={() => handleOpenReviewModal(assignment)}
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 font-bold text-[11px] hover:bg-primary/20 transition-colors"
                          >
                            <FileCheck className="h-3.5 w-3.5" />
                            <span>{assignment.submissionsCount} / {assignment.totalStudents}</span>
                          </button>
                        ) : userSub ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Badge
                                variant="outline"
                                className={`text-[10px] font-semibold border px-2 py-0.5 ${
                                  userSub.status === SubmissionStatus.ACCEPTED
                                    ? "bg-primary/15 text-primary border-primary/30"
                                    : userSub.status === SubmissionStatus.NEED_REVISION
                                      ? "bg-destructive/10 text-destructive border-destructive/30"
                                      : "bg-muted/60 text-muted-foreground border-border/50"
                                }`}
                              >
                                {userSub.status === SubmissionStatus.ACCEPTED
                                  ? "✓ Принято"
                                  : userSub.status === SubmissionStatus.NEED_REVISION
                                    ? "↩ Доработка"
                                    : "⏳ Проверка"}
                              </Badge>
                              {userSub.grade != null && (
                                <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md">
                                  ⭐ {userSub.grade}
                                </span>
                              )}
                            </div>
                            {userSub.teacherComment && (
                              <p className="text-[10px] text-muted-foreground italic line-clamp-1 max-w-[180px]">
                                {userSub.teacherComment}
                              </p>
                            )}
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground font-normal">
                            Не сдано
                          </Badge>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {canCreate ? (
                            <>
                              <Button
                                size="xs"
                                variant="outline"
                                onClick={() => handleOpenReviewModal(assignment)}
                                className="h-7 text-xs gap-1 font-medium border-primary/30 text-primary hover:bg-primary/10 px-2"
                                title="Проверить работы студентов"
                              >
                                <FileCheck className="h-3.5 w-3.5" />
                                <span className="hidden md:inline">Проверить</span>
                              </Button>

                              <Button
                                size="xs"
                                variant="outline"
                                onClick={() => setViewTargetAssignment(assignment)}
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-primary hover:border-primary/50"
                                title="Подробное описание"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>

                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={() => handleDeleteAssignment(assignment.id)}
                                className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                                title="Удалить задание"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          ) : (
                            <div className="flex items-center gap-1">
                              <Button
                                size="xs"
                                variant="outline"
                                onClick={() => setViewTargetAssignment(assignment)}
                                className="h-7 text-xs gap-1 px-2 text-muted-foreground hover:text-foreground"
                                title="Описание"
                              >
                                <Eye className="h-3.5 w-3.5 text-primary" /> Описание
                              </Button>

                              {/* My Result button — only when submission exists */}
                              {userSub && (
                                <Button
                                  size="xs"
                                  variant="outline"
                                  onClick={() => setViewMyResultAssignment(assignment)}
                                  className="h-7 text-xs gap-1 px-2 border-primary/30 text-primary hover:bg-primary/10"
                                  title="Мой ответ"
                                >
                                  <MessageSquare className="h-3.5 w-3.5" /> Мой ответ
                                </Button>
                              )}

                              {/* Show resubmit only if NOT accepted */}
                              {userSub?.status !== SubmissionStatus.ACCEPTED && (
                                <Button
                                  size="xs"
                                  onClick={() => {
                                    setSubmitTargetAssignment(assignment);
                                    setSubmitFileUrl(userSub?.fileUrl || "");
                                    setSubmitComment("");
                                  }}
                                  className="h-7 text-xs gap-1 font-medium px-2.5"
                                >
                                  <Send className="h-3.5 w-3.5" />
                                  {userSub ? "Пересдать" : "Сдать"}
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredAssignments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-muted-foreground text-xs bg-muted/10 space-y-1">
                      <ClipboardList className="h-8 w-8 text-muted-foreground/30 mx-auto" />
                      <p className="font-semibold text-foreground">Задания не найдены</p>
                      <p className="text-[11px] text-muted-foreground">По выбранным фильтрам задания отсутствуют</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* VIEW MODE 2: Compact Card Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {filteredAssignments.map((assignment) => {
            const userSub = assignment.userSubmission;
            const attachmentLinksList = parseAttachmentLinks(assignment.fileUrl);

            return (
              <Card
                key={assignment.id}
                onClick={() => setViewTargetAssignment(assignment)}
                className="p-3 border shadow-none hover:border-primary/50 transition-all duration-200 flex flex-col justify-between space-y-2.5 bg-card rounded-xl group cursor-pointer"
              >
                {/* Header: Subject & Due Date */}
                <div className="flex items-center justify-between gap-2 border-b pb-2">
                  <Badge variant="outline" className="text-[10px] border-primary/30 text-primary bg-primary/5 font-medium px-1.5 py-0 truncate">
                    {assignment.subjectName}
                  </Badge>

                  {assignment.dueDate ? (
                    <span className="text-[10px] font-medium text-foreground bg-muted/60 px-1.5 py-0.5 rounded-md shrink-0 flex items-center gap-1 border">
                      <Clock className="h-3 w-3 text-primary shrink-0" />
                      До {new Date(assignment.dueDate).toLocaleDateString("ru-RU")}
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground italic">Без срока</span>
                  )}
                </div>

                {/* Title & Short Snippet */}
                <div className="space-y-1 flex-1">
                  <h3 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {assignment.title}
                  </h3>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 leading-tight">
                    {assignment.description
                      ? assignment.description.replace(/[#*`_~\-\[\]()]/g, " ").trim()
                      : "Нажмите, чтобы просмотреть подробности..."}
                  </p>
                </div>

                {/* Teacher Info & Resources */}
                <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1.5 border-t">
                  <span className="flex items-center gap-1 truncate max-w-[130px]">
                    <User className="h-3 w-3 text-muted-foreground shrink-0" /> {assignment.teacherName}
                  </span>

                  {attachmentLinksList.length > 0 && (
                    <span className="inline-flex items-center gap-1 font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full border border-primary/20">
                      <Paperclip className="h-3 w-3 shrink-0" /> {attachmentLinksList.length}
                    </span>
                  )}
                </div>

                {/* Action Buttons */}
                <div
                  className="flex items-center justify-between gap-2 border-t pt-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  {canCreate ? (
                    <div className="flex items-center justify-between w-full gap-2">
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => handleOpenReviewModal(assignment)}
                        className="h-7 text-xs gap-1 font-medium border-primary/30 text-primary hover:bg-primary/10 px-2"
                      >
                        <FileCheck className="h-3.5 w-3.5" />
                        Работы ({assignment.submissionsCount}/{assignment.totalStudents})
                      </Button>

                      <div className="flex items-center gap-1">
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => setViewTargetAssignment(assignment)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                          title="Просмотр"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => handleDeleteAssignment(assignment.id)}
                          className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                          title="Удалить"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Student card bottom — feedback + submit */
                    <div
                      className="space-y-2 w-full"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {userSub ? (
                        <div className="rounded-lg border bg-muted/30 p-2.5 space-y-1.5">
                          {/* Status row */}
                          <div className="flex items-center justify-between gap-2">
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-semibold border px-2 py-0.5 ${
                                userSub.status === SubmissionStatus.ACCEPTED
                                  ? "bg-primary/15 text-primary border-primary/30"
                                  : userSub.status === SubmissionStatus.NEED_REVISION
                                    ? "bg-destructive/10 text-destructive border-destructive/30"
                                    : "bg-muted/60 text-muted-foreground border-border/50"
                              }`}
                            >
                              {userSub.status === SubmissionStatus.ACCEPTED
                                ? "✓ Принято"
                                : userSub.status === SubmissionStatus.NEED_REVISION
                                  ? "↩ На доработке"
                                  : "⏳ На проверке"}
                            </Badge>
                            {userSub.grade != null && (
                              <span className="inline-flex items-center gap-0.5 text-[12px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                                ⭐ {userSub.grade}
                              </span>
                            )}
                          </div>

                          {/* Teacher comment */}
                          {userSub.teacherComment && (
                            <p className="text-[10px] text-foreground leading-relaxed border-l-2 border-primary/40 pl-2 italic">
                              {userSub.teacherComment}
                            </p>
                          )}

                          {/* Reviewed date */}
                          {userSub.reviewedAt && (
                            <p className="text-[9px] text-muted-foreground">
                              Проверено: {new Date(userSub.reviewedAt).toLocaleDateString("ru-RU")}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-[10px] text-muted-foreground italic text-center py-1">Не сдано</p>
                      )}

                      {/* Submit button — only when not accepted */}
                      {userSub?.status !== SubmissionStatus.ACCEPTED && (
                        <Button
                          size="xs"
                          className="w-full h-7 text-xs gap-1 font-medium"
                          onClick={() => {
                            setSubmitTargetAssignment(assignment);
                            setSubmitFileUrl(userSub?.fileUrl || "");
                            setSubmitComment("");
                          }}
                        >
                          <Send className="h-3.5 w-3.5" />
                          {userSub ? "Пересдать" : "Сдать ДЗ"}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}

          {filteredAssignments.length === 0 && (
            <div className="col-span-full py-10 text-center text-muted-foreground text-xs bg-card border rounded-xl space-y-1">
              <ClipboardList className="h-8 w-8 text-muted-foreground/30 mx-auto" />
              <p className="font-semibold text-foreground">Задания не найдены</p>
            </div>
          )}
        </div>
      )}

      {/* Modal 0: Full Assignment View Dialog (clean — just description) */}
      <Dialog open={viewTargetAssignment !== null} onOpenChange={(open) => !open && setViewTargetAssignment(null)}>
        {viewTargetAssignment && (
          <DialogContent className="p-4 gap-3 text-xs sm:max-w-[620px] max-h-[85vh] overflow-y-auto">
            <DialogHeader className="pb-2 border-b gap-1 place-items-start text-left">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] border-primary/30 text-primary bg-primary/5 font-medium">
                  {viewTargetAssignment.subjectName}
                </Badge>
                {viewTargetAssignment.dueDate && (
                  <Badge variant="secondary" className="text-[10px] gap-1 shrink-0 font-normal">
                    <Clock className="h-3 w-3 text-primary" />
                    До: {new Date(viewTargetAssignment.dueDate).toLocaleDateString("ru-RU")}
                  </Badge>
                )}
              </div>
              <DialogTitle className="text-sm font-bold text-foreground pt-1">
                {viewTargetAssignment.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground flex items-center gap-2 pt-0.5">
                <span>Преподаватель: {viewTargetAssignment.teacherName}</span>
                <span>•</span>
                <span>Выдано: {new Date(viewTargetAssignment.createdAt).toLocaleDateString("ru-RU")}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="py-1 text-xs space-y-3 leading-relaxed">
              <div className="p-3 border rounded-xl bg-card text-foreground">
                {renderMarkdown(viewTargetAssignment.description)}
              </div>

              {parseAttachmentLinks(viewTargetAssignment.fileUrl).length > 0 && (
                <div className="space-y-1.5 pt-2 border-t">
                  <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Paperclip className="h-3.5 w-3.5 text-primary" /> Прикреплённые ресурсы:
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {parseAttachmentLinks(viewTargetAssignment.fileUrl).map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-mono bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20 transition-colors truncate"
                      >
                        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{url}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
              <Button variant="outline" size="xs" onClick={() => setViewTargetAssignment(null)}>
                Закрыть
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Modal 0b: Student "My Result" Dialog */}
      <Dialog open={viewMyResultAssignment !== null} onOpenChange={(open) => !open && setViewMyResultAssignment(null)}>
        {viewMyResultAssignment && (() => {
          const mySub = viewMyResultAssignment.userSubmission;
          return (
            <DialogContent className="p-4 gap-3 text-xs sm:max-w-[480px] overflow-hidden">
              <DialogHeader className="pb-2 border-b gap-1 place-items-start text-left">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] border-primary/30 text-primary bg-primary/5 font-medium">
                    {viewMyResultAssignment.subjectName}
                  </Badge>
                </div>
                <DialogTitle className="text-sm font-bold text-foreground pt-1">
                  Мой ответ: {viewMyResultAssignment.title}
                </DialogTitle>
              </DialogHeader>

              {mySub ? (
                <div className="space-y-3 py-1">
                  {/* Status + Grade */}
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <Badge
                      variant="outline"
                      className={`text-xs font-semibold border px-3 py-1 ${
                        mySub.status === SubmissionStatus.ACCEPTED
                          ? "bg-primary/15 text-primary border-primary/30"
                          : mySub.status === SubmissionStatus.NEED_REVISION
                            ? "bg-destructive/10 text-destructive border-destructive/30"
                            : "bg-muted/60 text-muted-foreground border-border/50"
                      }`}
                    >
                      {mySub.status === SubmissionStatus.ACCEPTED
                        ? "\u2713 \u041f\u0440\u0438\u043d\u044f\u0442\u043e"
                        : mySub.status === SubmissionStatus.NEED_REVISION
                          ? "\u21a9 \u041d\u0430 \u0434\u043e\u0440\u0430\u0431\u043e\u0442\u043a\u0435"
                          : "\u23f3 \u041d\u0430 \u043f\u0440\u043e\u0432\u0435\u0440\u043a\u0435"}
                    </Badge>
                    {mySub.grade != null && (
                      <span className="inline-flex items-center gap-1.5 text-base font-bold text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1 rounded-xl">
                        ⭐ {mySub.grade} <span className="text-xs font-normal text-amber-500">/ 5</span>
                      </span>
                    )}
                    {mySub.reviewedAt && (
                      <span className="text-[10px] text-muted-foreground ml-auto">
                        {new Date(mySub.reviewedAt).toLocaleDateString("ru-RU")}
                      </span>
                    )}
                  </div>

                  {/* Teacher comment — only when exists */}
                  {mySub.teacherComment && (
                    <div className="p-3 rounded-xl bg-muted/30 border border-l-[3px] border-l-primary text-xs text-foreground leading-relaxed">
                      {mySub.teacherComment}
                    </div>
                  )}

                  {/* Student submission details — only when has content */}
                  {(mySub.fileUrl || mySub.comment) && (
                    <div className="border-t pt-2 space-y-1.5">
                      {mySub.fileUrl && (
                        <a
                          href={mySub.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-primary hover:underline text-xs font-medium"
                        >
                          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                          Ссылка на проект
                        </a>
                      )}
                      {mySub.comment && (
                        <p className="text-[10px] text-muted-foreground italic break-words">«{mySub.comment}»</p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground text-xs">\u0412\u044b \u0435\u0449\u0451 \u043d\u0435 \u0441\u0434\u0430\u0432\u0430\u043b\u0438 \u044d\u0442\u043e \u0437\u0430\u0434\u0430\u043d\u0438\u0435</div>
              )}

              <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
                {mySub?.status !== SubmissionStatus.ACCEPTED && (
                  <Button
                    size="xs"
                    onClick={() => {
                      setViewMyResultAssignment(null);
                      setSubmitTargetAssignment(viewMyResultAssignment);
                      setSubmitFileUrl(mySub?.fileUrl || "");
                      setSubmitComment("");
                    }}
                    className="h-7 text-xs gap-1"
                  >
                    <Send className="h-3.5 w-3.5" />
                    {mySub ? "Пересдать" : "Сдать ДЗ"}
                  </Button>
                )}
                <Button variant="outline" size="xs" onClick={() => setViewMyResultAssignment(null)}>
                  Закрыть
                </Button>
              </DialogFooter>
            </DialogContent>
          );
        })()}
      </Dialog>

      {/* Modal 1: Quick Create Assignment Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="p-4 gap-3 text-xs sm:max-w-[600px] max-h-[88vh] overflow-y-auto">
          <DialogHeader className="pb-2 border-b gap-1 place-items-start text-left">
            <DialogTitle className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Plus className="h-4 w-4 text-primary" /> Публикация нового задания
            </DialogTitle>
            <DialogDescription className="text-xs">
              Заполните основные параметры и прикрепите ссылки на материалы
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-1 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="font-medium text-foreground text-xs">Дисциплина *</label>
                <Select value={newGroupSubjectId} onValueChange={setNewGroupSubjectId}>
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue placeholder="Выберите дисциплину" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={s.id} className="text-xs">
                        {s.subjectName} ({s.teacherName})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground text-xs">Срок сдачи (Дедлайн)</label>
                <Input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="h-8 text-xs bg-background"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground text-xs">Заголовок задания *</label>
              <Input
                placeholder="Например: Домашнее задание №3. Списки и кортежи"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="h-8 text-xs bg-background font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground text-xs">Описание и требования</label>
              <Textarea
                placeholder="Подробное описание задачи..."
                value={newDescription}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewDescription(e.target.value)}
                className="text-xs bg-background min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
            <Button variant="outline" size="xs" onClick={() => setIsCreateOpen(false)}>
              Отмена
            </Button>
            <Button size="xs" disabled={isPending} onClick={handleCreateAssignment}>
              Опубликовать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal 2: Student Submission Modal */}
      <Dialog open={submitTargetAssignment !== null} onOpenChange={(open) => !open && setSubmitTargetAssignment(null)}>
        {submitTargetAssignment && (
          <DialogContent className="p-4 gap-3 text-xs sm:max-w-[550px]">
            <DialogHeader className="pb-2 border-b gap-1 place-items-start text-left">
              <Badge variant="outline" className="text-[10px] border-primary/30 text-primary bg-primary/5 font-medium">
                {submitTargetAssignment.subjectName}
              </Badge>
              <DialogTitle className="text-sm font-bold text-foreground">
                Сдача решения: {submitTargetAssignment.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Прикрепите ссылку на выполненную работу (GitHub, Google Drive, Figma) и укажите пояснение
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-1 text-xs">
              {/* Show teacher's previous feedback to student when resubmitting */}
              {submitTargetAssignment?.userSubmission?.teacherComment && (
                <div className="p-3 rounded-xl border border-primary/20 bg-primary/5 space-y-1">
                  <div className="text-[10px] font-semibold text-primary flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5" /> Комментарий преподавателя:
                  </div>
                  <p className="text-xs text-foreground leading-relaxed">
                    {submitTargetAssignment.userSubmission.teacherComment}
                  </p>
                  {submitTargetAssignment.userSubmission.reviewedAt && (
                    <p className="text-[10px] text-muted-foreground">
                      Проверено: {new Date(submitTargetAssignment.userSubmission.reviewedAt).toLocaleString("ru-RU")}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-1">
                <label className="font-medium text-foreground text-xs">Ссылка на работу (URL)</label>
                <Input
                  placeholder="https://github.com/..."
                  value={submitFileUrl}
                  onChange={(e) => setSubmitFileUrl(e.target.value)}
                  className="h-8 text-xs bg-background font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground text-xs">Комментарий к решению (опционально)</label>
                <Textarea
                  placeholder="Опишите особенности выполнения задания или вопросы преподавателю..."
                  value={submitComment}
                  onChange={(e) => setSubmitComment(e.target.value)}
                  className="text-xs bg-background min-h-[70px]"
                />
              </div>
            </div>

            <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
              <Button variant="outline" size="xs" onClick={() => setSubmitTargetAssignment(null)}>
                Отмена
              </Button>
              <Button size="xs" disabled={isPending} onClick={handleStudentSubmit}>
                Отправить на проверку
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Modal 3: Teacher Streamlined Review Submissions Suite */}
      <Dialog open={reviewTargetAssignment !== null} onOpenChange={(open) => !open && setReviewTargetAssignment(null)}>
        {reviewTargetAssignment && (
          <DialogContent className="p-4 gap-3 text-xs sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
            <DialogHeader className="pb-2 border-b gap-1 place-items-start text-left pr-8">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] border-primary/30 text-primary bg-primary/5 font-semibold">
                  {reviewTargetAssignment.subjectName}
                </Badge>
                <span className="text-[11px] text-muted-foreground">
                  Всего в группе: {reviewTargetAssignment.totalStudents} чел.
                </span>
              </div>
              <DialogTitle className="text-sm font-bold text-foreground pt-0.5">
                Кабинет проверки: {reviewTargetAssignment.title}
              </DialogTitle>
            </DialogHeader>

            {/* Filter Tabs Header & View Switcher */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b pb-2.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setReviewFilter("SUBMITTED")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                    reviewFilter === "SUBMITTED"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-muted/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  На проверке (
                  {
                    reviewTargetAssignment.submissions.filter(
                      (s) => s.status === SubmissionStatus.SUBMITTED
                    ).length
                  }
                  )
                </button>

                <button
                  type="button"
                  onClick={() => setReviewFilter("ACCEPTED")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                    reviewFilter === "ACCEPTED"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-muted/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Принято ({reviewTargetAssignment.acceptedCount})
                </button>

                <button
                  type="button"
                  onClick={() => setReviewFilter("NEED_REVISION")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                    reviewFilter === "NEED_REVISION"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-muted/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  На доработке ({reviewTargetAssignment.needRevisionCount})
                </button>

                <button
                  type="button"
                  onClick={() => setReviewFilter("ALL")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    reviewFilter === "ALL"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-muted/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Все ({reviewTargetAssignment.submissions.length})
                </button>
              </div>

              {/* View Switcher & Progress Bar */}
              <div className="flex items-center gap-3 shrink-0 pt-1 sm:pt-0">
                {/* Focus / List View Switcher */}
                <div className="flex items-center p-0.5 bg-muted/60 rounded-lg border">
                  <button
                    type="button"
                    onClick={() => setReviewViewMode("focus")}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all ${
                      reviewViewMode === "focus"
                        ? "bg-background text-primary shadow-xs font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Поочередная проверка
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewViewMode("list")}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all ${
                      reviewViewMode === "list"
                        ? "bg-background text-primary shadow-xs font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Список работ
                  </button>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
                  <span>{reviewTargetAssignment.acceptedCount}/{reviewTargetAssignment.submissions.length}</span>
                  <div className="w-16 bg-muted/80 h-2 rounded-full overflow-hidden border">
                    <div
                      className="bg-primary h-full transition-all duration-300"
                      style={{
                        width: `${
                          reviewTargetAssignment.submissions.length > 0
                            ? Math.round(
                                (reviewTargetAssignment.acceptedCount /
                                  reviewTargetAssignment.submissions.length) *
                                  100
                              )
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* FOCUS CONVEYOR WORKFLOW (Master-Detail Mode) */}
            {reviewViewMode === "focus" ? (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 py-1">
                {/* Left Sidebar: Queue of Students */}
                <div className="md:col-span-4 border rounded-xl p-2 bg-muted/20 space-y-2 max-h-[420px] overflow-y-auto">
                  <div className="relative">
                    <Search className="h-3 w-3 absolute left-2 top-2.5 text-muted-foreground" />
                    <Input
                      placeholder="Студент..."
                      value={submissionSearch}
                      onChange={(e) => setSubmissionSearch(e.target.value)}
                      className="h-7 text-[11px] pl-7 bg-background"
                    />
                  </div>

                  <div className="space-y-1">
                    {getFilteredSubmissions().map((sub) => {
                      const isActive = activeSubmissionId === sub.id;
                      return (
                        <div
                          key={sub.id}
                          onClick={() => setActiveSubmissionId(sub.id)}
                          className={`p-2 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between gap-1.5 ${
                            isActive
                              ? "border-primary bg-primary/10 font-bold text-foreground"
                              : "border-border bg-card hover:bg-muted/40 font-normal"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px] shrink-0">
                              {sub.studentName ? sub.studentName[0].toUpperCase() : "С"}
                            </div>
                            <span className="truncate text-[11px]">{sub.studentName}</span>
                          </div>

                          <div
                            className={`h-2 w-2 rounded-full shrink-0 ${
                              sub.status === SubmissionStatus.ACCEPTED
                                ? "bg-primary"
                                : sub.status === SubmissionStatus.NEED_REVISION
                                  ? "bg-destructive"
                                  : "bg-primary/50 animate-pulse"
                            }`}
                          />
                        </div>
                      );
                    })}

                    {getFilteredSubmissions().length === 0 && (
                      <div className="py-6 text-center text-muted-foreground text-[11px]">
                        По данному фильтру студенты не найдены
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Panel: Focused Active Student Card */}
                <div className="md:col-span-8 border rounded-xl p-3.5 bg-card space-y-3 flex flex-col justify-between">
                  {(() => {
                    const currentFiltered = getFilteredSubmissions();
                    const activeSub = currentFiltered.find((s) => s.id === activeSubmissionId) || currentFiltered[0];
                    const activeIdx = currentFiltered.findIndex((s) => s.id === activeSubmissionId);

                    if (!activeSub) {
                      return (
                        <div className="py-16 text-center text-muted-foreground text-xs space-y-2">
                          <CheckCheck className="h-10 w-10 text-primary/40 mx-auto" />
                          <p className="font-bold text-foreground">В этой категории все работы проверены!</p>
                          <p className="text-[11px]">Выберите другой фильтр сверху или вернитесь к ко списку</p>
                        </div>
                      );
                    }

                    return (
                      <>
                        <div className="space-y-3">
                          {/* Active Student Header Bar */}
                          <div className="flex items-center justify-between gap-2 border-b pb-2.5">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                {activeSub.studentName ? activeSub.studentName[0].toUpperCase() : "С"}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-foreground text-xs truncate">{activeSub.studentName}</div>
                                <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3 text-muted-foreground" />
                                  <span>Сдано: {new Date(activeSub.submittedAt).toLocaleString("ru-RU")}</span>
                                </div>
                              </div>
                            </div>

                            <Badge
                              variant="outline"
                              className={`text-[10px] font-semibold border px-2 py-0.5 ${
                                activeSub.status === SubmissionStatus.ACCEPTED
                                  ? "bg-primary/15 text-primary border-primary/30"
                                  : activeSub.status === SubmissionStatus.NEED_REVISION
                                    ? "bg-destructive/10 text-destructive border-destructive/30"
                                    : "bg-muted/60 text-muted-foreground border-border/50"
                              }`}
                            >
                              {activeSub.status === SubmissionStatus.ACCEPTED
                                ? "Принято"
                                : activeSub.status === SubmissionStatus.NEED_REVISION
                                  ? "На доработке"
                                  : "На проверке"}
                            </Badge>
                          </div>

                          {/* Submitted Link Box */}
                          {activeSub.fileUrl ? (
                            <div className="p-2.5 rounded-xl border bg-muted/30 space-y-1.5">
                              <div className="text-[10px] font-semibold text-muted-foreground flex items-center justify-between">
                                <span>Прикрепленная ссылка студента:</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyUrl(activeSub.fileUrl || "")}
                                  className="text-primary hover:underline text-[10px] flex items-center gap-1"
                                >
                                  <Copy className="h-3 w-3" /> {copiedUrl ? "Скопировано!" : "Скопировать"}
                                </button>
                              </div>

                              <div className="flex items-center gap-2">
                                <a
                                  href={activeSub.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs text-primary font-mono bg-background hover:bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/30 font-bold transition-all truncate flex-1 shadow-xs"
                                >
                                  <ExternalLink className="h-3.5 w-3.5 shrink-0 text-primary" />
                                  <span className="truncate">{activeSub.fileUrl}</span>
                                </a>
                              </div>
                            </div>
                          ) : (
                            <div className="p-2 rounded-lg bg-muted/20 border text-[11px] text-muted-foreground italic">
                              Студент не прикрепил внешнюю ссылку на файл
                            </div>
                          )}

                          {/* Student Comment */}
                          {activeSub.comment && (
                            <div className="space-y-1">
                              <label className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                                <MessageSquare className="h-3 w-3 text-primary" /> Пояснение от студента:
                              </label>
                              <div className="p-2.5 rounded-lg bg-muted/40 text-xs text-foreground leading-relaxed font-sans border">
                                "{activeSub.comment}"
                              </div>
                            </div>
                          )}

                          {/* Quick Preset Feedback Chips */}
                          <div className="space-y-1.5 pt-1">
                            <label className="text-[10px] text-muted-foreground font-medium">Быстрые шаблоны ответов:</label>
                            <div className="flex flex-wrap gap-1">
                              {PRESET_FEEDBACKS.map((chipText, cIdx) => (
                                <button
                                  key={cIdx}
                                  type="button"
                                  onClick={() =>
                                    setReviewTeacherCommentMap((prev) => ({
                                      ...prev,
                                      [activeSub.id]: chipText,
                                    }))
                                  }
                                  className="text-[10px] bg-muted/60 hover:bg-primary/10 hover:text-primary px-2 py-0.5 rounded-md border text-muted-foreground transition-colors font-medium"
                                >
                                  {chipText}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Grade Selector */}
                          <div className="space-y-1.5 pt-1">
                            <label className="text-[10px] text-muted-foreground font-medium flex items-center gap-1.5">
                              ⭐ Оценка (1–5):
                            </label>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((g) => {
                                const selected = reviewGradeMap[activeSub.id] === g;
                                return (
                                  <button
                                    key={g}
                                    type="button"
                                    onClick={() =>
                                      setReviewGradeMap((prev) => ({
                                        ...prev,
                                        [activeSub.id]: selected ? null : g,
                                      }))
                                    }
                                    className={`h-8 w-8 rounded-lg text-xs font-bold border transition-all ${
                                      selected
                                        ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                                        : "bg-muted/60 text-muted-foreground border-border hover:bg-amber-50 hover:text-amber-600 hover:border-amber-300"
                                    }`}
                                  >
                                    {g}
                                  </button>
                                );
                              })}
                              {reviewGradeMap[activeSub.id] != null && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setReviewGradeMap((prev) => ({ ...prev, [activeSub.id]: null }))
                                  }
                                  className="text-[10px] text-muted-foreground hover:text-destructive ml-1"
                                >
                                  сбросить
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Teacher Comment Textarea */}
                          <div className="space-y-1 pt-1">
                            <label className="text-[10px] font-semibold text-foreground">Замечание / Рецензия преподавателя:</label>
                            <Textarea
                              placeholder="Напишите комментарий для студента..."
                              value={reviewTeacherCommentMap[activeSub.id] || ""}
                              onChange={(e) =>
                                setReviewTeacherCommentMap((prev) => ({
                                  ...prev,
                                  [activeSub.id]: e.target.value,
                                }))
                              }
                              className="text-xs bg-background min-h-[50px]"
                            />
                          </div>
                        </div>

                        {/* Action Footer & Stepper Controls */}
                        <div className="pt-3 border-t flex flex-col sm:flex-row items-center justify-between gap-2">
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Button
                              size="xs"
                              variant="outline"
                              disabled={activeIdx <= 0}
                              onClick={() => {
                                if (activeIdx > 0) setActiveSubmissionId(currentFiltered[activeIdx - 1].id);
                              }}
                              className="h-7 w-7 p-0"
                            >
                              <ChevronLeft className="h-3.5 w-3.5" />
                            </Button>
                            <span>
                              {activeIdx + 1} из {currentFiltered.length}
                            </span>
                            <Button
                              size="xs"
                              variant="outline"
                              disabled={activeIdx >= currentFiltered.length - 1}
                              onClick={() => {
                                if (activeIdx < currentFiltered.length - 1)
                                  setActiveSubmissionId(currentFiltered[activeIdx + 1].id);
                              }}
                              className="h-7 w-7 p-0"
                            >
                              <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                          </div>

                          {activeSub.status === SubmissionStatus.ACCEPTED ? (
                            /* Accepted — can still edit grade/comment */
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className="flex items-center gap-1.5 text-[11px] text-primary font-medium">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>Принято</span>
                                {activeSub.reviewedAt && (
                                  <span className="text-muted-foreground font-normal">
                                    {new Date(activeSub.reviewedAt).toLocaleDateString("ru-RU")}
                                  </span>
                                )}
                              </div>
                              <Button
                                size="xs"
                                variant="outline"
                                disabled={isPending}
                                onClick={() => handleReviewSubmission(activeSub.id, SubmissionStatus.ACCEPTED)}
                                className="h-7 text-xs gap-1 font-medium border-primary/30 text-primary hover:bg-primary/10 ml-auto"
                              >
                                <Check className="h-3.5 w-3.5" /> Обновить
                              </Button>
                              <Button
                                size="xs"
                                variant="outline"
                                disabled={isPending}
                                onClick={() => handleReviewSubmission(activeSub.id, SubmissionStatus.NEED_REVISION)}
                                className="h-7 text-xs gap-1 border-destructive/30 text-destructive hover:bg-destructive/10 font-medium"
                              >
                                <XCircle className="h-3.5 w-3.5" /> На доработку
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Button
                                size="xs"
                                variant="outline"
                                disabled={isPending}
                                onClick={() => handleReviewSubmission(activeSub.id, SubmissionStatus.NEED_REVISION)}
                                className="h-7 text-xs gap-1 border-destructive/30 text-destructive hover:bg-destructive/10 font-medium"
                              >
                                <XCircle className="h-3.5 w-3.5" /> На доработку
                              </Button>

                              <Button
                                size="xs"
                                disabled={isPending}
                                onClick={() => handleReviewSubmission(activeSub.id, SubmissionStatus.ACCEPTED)}
                                className="h-7 text-xs gap-1.5 font-medium px-3 shadow-xs"
                              >
                                <Check className="h-3.5 w-3.5" /> Принять и дальше <ArrowRight className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            ) : (
              /* LIST VIEW MODE (All cards stacked) */
              <div className="space-y-2.5 py-1 text-xs max-h-[380px] overflow-y-auto pr-1">
                {getFilteredSubmissions().map((sub: SubmissionDTO) => (
                  <div
                    key={sub.id}
                    className="p-3 rounded-xl border bg-card hover:border-primary/40 transition-colors space-y-2 shadow-xs"
                  >
                    <div className="flex items-center justify-between gap-2 border-b pb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                          {sub.studentName ? sub.studentName[0].toUpperCase() : "С"}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-foreground text-xs truncate">{sub.studentName}</div>
                          <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span>{new Date(sub.submittedAt).toLocaleString("ru-RU")}</span>
                          </div>
                        </div>
                      </div>

                      <Badge
                        variant="outline"
                        className={`text-[10px] font-semibold border px-2 py-0.5 ${
                          sub.status === SubmissionStatus.ACCEPTED
                            ? "bg-primary/15 text-primary border-primary/30"
                            : sub.status === SubmissionStatus.NEED_REVISION
                              ? "bg-destructive/10 text-destructive border-destructive/30"
                              : "bg-muted/60 text-muted-foreground border-border/50"
                        }`}
                      >
                        {sub.status === SubmissionStatus.ACCEPTED
                          ? "Принято"
                          : sub.status === SubmissionStatus.NEED_REVISION
                            ? "На доработке"
                            : "На проверке"}
                      </Badge>
                    </div>

                    {/* Submitted Link & Comment */}
                    <div className="space-y-1.5 text-xs">
                      {sub.fileUrl && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-muted-foreground font-medium">Ссылка на решение:</span>
                          <a
                            href={sub.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline font-mono text-[11px] truncate max-w-[320px]"
                          >
                            <ExternalLink className="h-3 w-3 shrink-0" />
                            <span className="truncate">{sub.fileUrl}</span>
                          </a>
                        </div>
                      )}

                      {sub.comment && (
                        <div className="p-2 rounded-lg bg-muted/40 text-[11px] text-foreground italic">
                          "{sub.comment}"
                        </div>
                      )}
                    </div>

                    {/* Teacher Feedback & Action Buttons */}
                    <div className="pt-1.5 border-t space-y-2">
                      {/* Grade selector */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground font-medium shrink-0">⭐ Оценка:</span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((g) => {
                            const selected = reviewGradeMap[sub.id] === g;
                            return (
                              <button
                                key={g}
                                type="button"
                                onClick={() =>
                                  setReviewGradeMap((prev) => ({
                                    ...prev,
                                    [sub.id]: selected ? null : g,
                                  }))
                                }
                                className={`h-6 w-6 rounded-md text-[10px] font-bold border transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                                  selected
                                    ? "bg-amber-500 text-white border-amber-500"
                                    : "bg-muted/60 text-muted-foreground border-border hover:bg-amber-50 hover:text-amber-600 hover:border-amber-300"
                                }`}
                              >
                                {g}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-medium text-muted-foreground">Комментарий преподавателя:</label>
                        <Input
                          placeholder="Замечания или похвала студенту..."
                          value={reviewTeacherCommentMap[sub.id] || ""}
                          onChange={(e) =>
                            setReviewTeacherCommentMap((prev) => ({
                              ...prev,
                              [sub.id]: e.target.value,
                            }))
                          }
                          className="h-7 text-xs bg-background"
                        />
                      </div>

                      {sub.status === SubmissionStatus.ACCEPTED ? (
                        /* Accepted — editable, with Update button */
                        <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
                          <div className="flex items-center gap-1.5 text-[11px] text-primary font-medium">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Принято</span>
                            {sub.grade != null && (
                              <span className="text-amber-600 font-bold">⭐ {sub.grade}</span>
                            )}
                            {sub.reviewedAt && (
                              <span className="text-muted-foreground font-normal">
                                {new Date(sub.reviewedAt).toLocaleDateString("ru-RU")}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Button
                              size="xs"
                              variant="outline"
                              disabled={isPending}
                              onClick={() => handleReviewSubmission(sub.id, SubmissionStatus.NEED_REVISION)}
                              className="h-6 text-[10px] gap-1 border-destructive/30 text-destructive hover:bg-destructive/10"
                            >
                              <XCircle className="h-3 w-3" /> На доработку
                            </Button>
                            <Button
                              size="xs"
                              variant="outline"
                              disabled={isPending}
                              onClick={() => handleReviewSubmission(sub.id, SubmissionStatus.ACCEPTED)}
                              className="h-6 text-[10px] gap-1 border-primary/30 text-primary hover:bg-primary/10"
                            >
                              <Check className="h-3 w-3" /> Обновить
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => handleReviewSubmission(sub.id, SubmissionStatus.NEED_REVISION)}
                            className="h-7 text-xs gap-1 border-destructive/30 text-destructive hover:bg-destructive/10 font-medium"
                          >
                            <XCircle className="h-3.5 w-3.5" /> На доработку
                          </Button>

                          <Button
                            size="xs"
                            onClick={() => handleReviewSubmission(sub.id, SubmissionStatus.ACCEPTED)}
                            className="h-7 text-xs gap-1 font-medium px-3"
                          >
                            <Check className="h-3.5 w-3.5" /> Принять работу
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

              {getFilteredSubmissions().length === 0 && (
                <div className="py-8 text-center text-muted-foreground text-xs space-y-1 bg-muted/20 border rounded-xl">
                  <ClipboardList className="h-7 w-7 text-muted-foreground/30 mx-auto" />
                  <p className="font-semibold text-foreground">Работы по данному фильтру не найдены</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
            <Button size="xs" variant="outline" onClick={() => setReviewTargetAssignment(null)}>
              Закрыть
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  </div>
);
}
