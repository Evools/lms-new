"use client";

import React, { useState, useTransition, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SubmissionStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  ClipboardList,
  Plus,
  Search,
  Building2,
  BookOpen,
  User,
  CheckCircle2,
  Clock,
  Trash2,
  Send,
  FileCheck,
  Sparkles,
  Paperclip,
  Eye,
  List,
  LayoutGrid,
  Check,
  RotateCcw,
  Timer,
  EyeOff,
  Star,
  Pencil,
  MoreHorizontal,
  Filter,
  X,
  MessageSquare,
} from "lucide-react";
import {
  GroupItemDTO,
  GroupSubjectDTO,
  AssignmentDTO,
  deleteAssignmentAction,
  toggleAssignmentPublishAction,
} from "../actions";
import { parseAttachmentLinks } from "./submission-utils";
import { ViewAssignmentDialog } from "./view-assignment-dialog";
import { StudentResultDialog } from "./student-result-dialog";
import { StudentSubmitDialog } from "./student-submit-dialog";
import { TeacherReviewDialog } from "./teacher-review-dialog";
import { DeleteAssignmentDialog } from "./delete-assignment-dialog";
import { CreateAssignmentDialog } from "./create-assignment-dialog";

interface AssignmentsViewProps {
  userRole: string;
  groups: GroupItemDTO[];
  subjects: GroupSubjectDTO[];
  assignments: AssignmentDTO[];
  selectedGroupId: string;
  canCreate: boolean;
  initialSubjectFilter?: string;
  initialTabFilter?: "ALL" | "PENDING" | "DRAFTS" | "ACCEPTED";
  initialSearchQuery?: string;
}

interface DueMeta {
  dateLabel: string;
  hint: string | null;
  tone: "muted" | "primary" | "destructive";
}

function formatDueMeta(dueDate: string | null | undefined, showCountdown: boolean): DueMeta | null {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) return null;

  const dateLabel = due.toLocaleDateString("ru-RU");
  if (!showCountdown) {
    return { dateLabel, hint: null, tone: "muted" };
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dueStart = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
  const diffDays = Math.round((dueStart - todayStart) / 86_400_000);

  if (diffDays < 0) {
    return { dateLabel, hint: `Просрочено ${Math.abs(diffDays)} дн.`, tone: "destructive" };
  }
  if (diffDays === 0) {
    return { dateLabel, hint: "Сегодня", tone: "primary" };
  }
  if (diffDays === 1) {
    return { dateLabel, hint: "Завтра", tone: "primary" };
  }
  return { dateLabel, hint: `Осталось ${diffDays} дн.`, tone: "muted" };
}

export function AssignmentsView({
  userRole,
  groups = [],
  subjects = [],
  assignments = [],
  selectedGroupId,
  canCreate,
  initialSubjectFilter = "all",
  initialTabFilter = "ALL",
  initialSearchQuery = "",
}: AssignmentsViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [localAssignments, setLocalAssignments] = useState<AssignmentDTO[]>(assignments);

  useEffect(() => {
    setLocalAssignments(assignments);
  }, [assignments]);

  const [currentGroupId, setCurrentGroupId] = useState<string>(selectedGroupId);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearchQuery);
  const [subjectFilter, setSubjectFilter] = useState<string>(initialSubjectFilter || "all");
  const [activeTabFilter, setActiveTabFilter] = useState<
    "ALL" | "PENDING" | "DRAFTS" | "ACCEPTED"
  >(initialTabFilter || "ALL");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Modals state (stored as IDs for instant synchronization with localAssignments)
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [viewTargetAssignmentId, setViewTargetAssignmentId] = useState<string | null>(null);
  const [viewMyResultAssignmentId, setViewMyResultAssignmentId] = useState<string | null>(null);
  const [submitTargetAssignmentId, setSubmitTargetAssignmentId] = useState<string | null>(null);
  const [reviewTargetAssignmentId, setReviewTargetAssignmentId] = useState<string | null>(null);
  const [deleteTargetAssignmentId, setDeleteTargetAssignmentId] = useState<string | null>(null);

  const viewTargetAssignment =
    localAssignments.find((a) => a.id === viewTargetAssignmentId) || null;
  const viewMyResultAssignment =
    localAssignments.find((a) => a.id === viewMyResultAssignmentId) || null;
  const submitTargetAssignment =
    localAssignments.find((a) => a.id === submitTargetAssignmentId) || null;
  const reviewTargetAssignment =
    localAssignments.find((a) => a.id === reviewTargetAssignmentId) || null;
  const deleteTargetAssignment =
    localAssignments.find((a) => a.id === deleteTargetAssignmentId) || null;

  const currentGroupObj = groups.find((g) => g.id === currentGroupId);

  // Sync URL Query Parameters
  const updateUrl = useCallback(
    (params: { group?: string; subject?: string; tab?: string; search?: string }) => {
      const g = params.group !== undefined ? params.group : currentGroupId;
      const s = params.subject !== undefined ? params.subject : subjectFilter;
      const t = params.tab !== undefined ? params.tab : activeTabFilter;
      const q = params.search !== undefined ? params.search : searchQuery;

      const urlParams = new URLSearchParams();
      if (g) urlParams.set("group", g);
      if (s && s !== "all") urlParams.set("subject", s);
      if (t && t !== "ALL") urlParams.set("tab", t);
      if (q && q.trim()) urlParams.set("search", q.trim());

      const queryStr = urlParams.toString();
      router.push(`/dashboard/assignments${queryStr ? `?${queryStr}` : ""}`);
    },
    [currentGroupId, subjectFilter, activeTabFilter, searchQuery, router]
  );

  const handleGroupChange = (val: string) => {
    setCurrentGroupId(val);
    updateUrl({ group: val });
  };

  const handleSubjectChange = (val: string) => {
    setSubjectFilter(val);
    updateUrl({ subject: val });
  };

  const handleTabChange = (val: "ALL" | "PENDING" | "DRAFTS" | "ACCEPTED") => {
    setActiveTabFilter(val);
    updateUrl({ tab: val });
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    updateUrl({ search: val });
  };

  // Real-time optimistic update handler for reviewed submissions
  const handleSubmissionReviewed = useCallback(
    (
      assignmentId: string,
      submissionId: string,
      status: SubmissionStatus,
      teacherComment?: string,
      grade?: number | null
    ) => {
      setLocalAssignments((prev) =>
        prev.map((a) => {
          if (a.id !== assignmentId) return a;
          const updatedSubs = a.submissions.map((s) =>
            s.id === submissionId
              ? {
                ...s,
                status,
                teacherComment:
                  teacherComment !== undefined ? teacherComment : s.teacherComment,
                grade: grade !== undefined ? grade : s.grade,
                reviewedAt: new Date().toISOString(),
              }
              : s
          );
          const acceptedCount = updatedSubs.filter(
            (s) => s.status === SubmissionStatus.ACCEPTED
          ).length;
          const needRevisionCount = updatedSubs.filter(
            (s) => s.status === SubmissionStatus.NEED_REVISION
          ).length;
          return {
            ...a,
            submissions: updatedSubs,
            acceptedCount,
            needRevisionCount,
          };
        })
      );
    },
    []
  );

  // Toggle Publish Status
  const handleTogglePublish = (assignmentId: string, currentPublished: boolean) => {
    startTransition(async () => {
      const res = await toggleAssignmentPublishAction(assignmentId);
      if (res.success) {
        toast.add({
          title: res.isPublished
            ? "Задание опубликовано для студентов"
            : "Задание переведено в черновик",
          type: "success",
        });
        router.refresh();
      } else {
        toast.add({ title: res.error || "Не удалось изменить статус", type: "error" });
      }
    });
  };

  // Delete Assignment Handler
  const handleConfirmDelete = (assignmentId: string) => {
    startTransition(async () => {
      const res = await deleteAssignmentAction(assignmentId);
      if (res.success) {
        setDeleteTargetAssignmentId(null);
        toast.add({ title: "Задание успешно удалено", type: "success" });
        router.refresh();
      } else {
        toast.add({ title: res.error || "Не удалось удалить задание", type: "error" });
      }
    });
  };

  // Metrics (scoped to selected subject filter)
  const isStaff = userRole !== "STUDENT";
  const subjectScopedAssignments =
    subjectFilter === "all"
      ? localAssignments
      : localAssignments.filter((a) => a.groupSubjectId === subjectFilter);
  const publishedAssignments = subjectScopedAssignments.filter((a) => a.isPublished);
  const draftAssignments = subjectScopedAssignments.filter((a) => !a.isPublished);
  const totalAssignments = isStaff
    ? publishedAssignments.length
    : subjectScopedAssignments.length;
  const draftsCount = draftAssignments.length;
  let totalSubmissionsCount = 0;
  let totalAcceptedCount = 0;
  let totalPendingReviewCount = 0;

  (isStaff ? publishedAssignments : subjectScopedAssignments).forEach((a) => {
    if (isStaff) {
      totalPendingReviewCount += Math.max(0, a.submissionsCount - a.acceptedCount - a.needRevisionCount);
    } else if (a.userSubmission) {
      totalSubmissionsCount += 1;
      if (a.userSubmission.status === SubmissionStatus.ACCEPTED) {
        totalAcceptedCount += 1;
      }
    }
  });

  const studentTodoCount = !canCreate
    ? localAssignments.filter(
      (a) => !a.userSubmission || a.userSubmission.status === SubmissionStatus.NEED_REVISION
    ).length
    : 0;
  const studentAcceptedCount = !canCreate
    ? localAssignments.filter((a) => a.userSubmission?.status === SubmissionStatus.ACCEPTED).length
    : 0;

  // Filtered list
  const filteredAssignments = localAssignments.filter((a) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      a.title.toLowerCase().includes(query) ||
      a.subjectName.toLowerCase().includes(query) ||
      a.teacherName.toLowerCase().includes(query);

    const matchesSubject = subjectFilter === "all" || a.groupSubjectId === subjectFilter;

    if (!matchesSearch || !matchesSubject) return false;

    if (activeTabFilter === "DRAFTS") {
      return !a.isPublished;
    }
    if (activeTabFilter === "PENDING") {
      if (canCreate) {
        return a.isPublished && a.submissionsCount > a.acceptedCount;
      }
      return !a.userSubmission || a.userSubmission.status === SubmissionStatus.NEED_REVISION;
    }
    if (activeTabFilter === "ACCEPTED") {
      return a.userSubmission?.status === SubmissionStatus.ACCEPTED;
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
            <Badge
              variant="outline"
              className="text-[10px] border-primary/30 text-primary bg-primary/5 font-semibold px-2 py-0"
            >
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

          {isStaff ? (
            <>
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] ${
                  totalPendingReviewCount > 0
                    ? "bg-primary/10 border-primary/20 text-primary"
                    : "bg-muted/50 border-border text-muted-foreground"
                }`}
              >
                <Clock className={`h-3.5 w-3.5 shrink-0 ${totalPendingReviewCount > 0 ? "text-primary" : "text-muted-foreground"}`} />
                <span className="font-medium">На проверке:</span>
                <span className={`font-bold ${totalPendingReviewCount > 0 ? "text-primary" : "text-foreground"}`}>
                  {totalPendingReviewCount}
                </span>
              </div>

              {draftsCount > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/50 border text-[11px]">
                  <EyeOff className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">Черновиков:</span>
                  <span className="font-bold text-foreground">{draftsCount}</span>
                </div>
              )}
            </>
          ) : (
            <>
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
            </>
          )}

          {canCreate && (
            <div className="flex items-center gap-1.5" data-tour="assignments-create-btn">
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
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2 bg-card p-2 rounded-xl border items-center"
        data-tour="assignments-filters"
      >
        {/* Group Selector (hidden for students in a single group) */}
        {(canCreate || groups.length > 1) && (
          <div className="lg:col-span-3">
            <Select value={currentGroupId} onValueChange={handleGroupChange}>
              <SelectTrigger className="h-8 text-xs bg-muted/40 border-border/70 font-medium">
                <div className="flex items-center gap-1.5 truncate">
                  <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
                  <SelectValue>
                    {currentGroupObj?.name ? `Группа ${currentGroupObj.name}` : "Выберите группу"}
                  </SelectValue>
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
        )}

        {/* Subject Filter */}
        <div className={canCreate || groups.length > 1 ? "lg:col-span-3" : "lg:col-span-4"}>
          <Select value={subjectFilter} onValueChange={handleSubjectChange}>
            <SelectTrigger className="h-8 text-xs bg-muted/40 border-border/70 font-medium">
              <div className="flex items-center gap-1.5 truncate">
                <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="text-muted-foreground font-normal shrink-0">Предмет:</span>
                <SelectValue>
                  {subjectFilter === "all"
                    ? "Все"
                    : subjects.find((s) => s.id === subjectFilter)?.subjectName || "Все"}
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

        {/* Status Filter Dropdown */}
        <div className={canCreate || groups.length > 1 ? "lg:col-span-2" : "lg:col-span-3"}>
          <Select
            value={activeTabFilter}
            onValueChange={(val) =>
              handleTabChange(val as "ALL" | "PENDING" | "DRAFTS" | "ACCEPTED")
            }
          >
            <SelectTrigger className="h-8 text-xs bg-muted/40 border-border/70 font-medium">
              <div className="flex items-center gap-1.5 truncate">
                <Filter className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="text-muted-foreground font-normal shrink-0">Статус:</span>
                <SelectValue>
                  {activeTabFilter === "ALL"
                    ? `Все (${localAssignments.length})`
                    : activeTabFilter === "DRAFTS"
                      ? `Черновики (${draftsCount})`
                      : activeTabFilter === "ACCEPTED"
                        ? `Принято (${studentAcceptedCount})`
                        : canCreate
                          ? `Проверка (${Math.max(0, totalSubmissionsCount - totalAcceptedCount)})`
                          : `К сдаче (${studentTodoCount})`}
                </SelectValue>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs font-medium">
                Все ({localAssignments.length})
              </SelectItem>
              {canCreate ? (
                <>
                  <SelectItem value="PENDING" className="text-xs">
                    На проверке ({Math.max(0, totalSubmissionsCount - totalAcceptedCount)})
                  </SelectItem>
                  <SelectItem value="DRAFTS" className="text-xs">
                    Черновики ({draftsCount})
                  </SelectItem>
                </>
              ) : (
                <>
                  <SelectItem value="PENDING" className="text-xs">
                    К сдаче ({studentTodoCount})
                  </SelectItem>
                  <SelectItem value="ACCEPTED" className="text-xs">
                    Принято ({studentAcceptedCount})
                  </SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Search & View Mode Switcher */}
        <div
          className={`${canCreate || groups.length > 1 ? "lg:col-span-4" : "lg:col-span-5"
            } flex items-center gap-2`}
        >
          <div className="relative flex-1">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Поиск по названию..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="h-8 text-xs pl-8 pr-7 bg-muted/40 border-border/70"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => handleSearchChange("")}
                className="absolute right-2 top-2 text-muted-foreground hover:text-foreground cursor-pointer"
                title="Очистить поиск"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center p-0.5 bg-muted/60 rounded-lg border shrink-0">
            <Button
              size="xs"
              variant="ghost"
              onClick={() => setViewMode("table")}
              className={`h-7 w-7 p-0 rounded-md ${viewMode === "table"
                ? "bg-background text-primary shadow-xs"
                : "text-muted-foreground"
                }`}
              title="Табличный вид"
            >
              <List className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="xs"
              variant="ghost"
              onClick={() => setViewMode("grid")}
              className={`h-7 w-7 p-0 rounded-md ${viewMode === "grid"
                ? "bg-background text-primary shadow-xs"
                : "text-muted-foreground"
                }`}
              title="Вид карточек"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: High-Density Table View (Default) */}
      {viewMode === "table" ? (
        <div
          className="bg-card rounded-xl border shadow-xs overflow-hidden"
          data-tour="assignments-list"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b bg-muted/40 text-[11px] text-muted-foreground font-semibold">
                  <th className="py-2.5 px-3">Название задания</th>
                  <th className="py-2.5 px-3">Дисциплина / Преподаватель</th>
                  <th className="py-2.5 px-3 text-center">Срок сдачи</th>
                  <th className="py-2.5 px-3 text-center">Ресурсы</th>
                  <th className="py-2.5 px-3">Работы & Статус</th>
                  <th className="py-2.5 px-3 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredAssignments.map((assignment) => {
                  const userSub = assignment.userSubmission;
                  const attachmentLinksList = parseAttachmentLinks(assignment.fileUrl);
                  const cleanDesc = assignment.description
                    ? assignment.description
                      .replace(/https?:\/\/\S+/g, "")
                      .replace(/[#*`_~\-\[\]()]/g, " ")
                      .replace(/\s+/g, " ")
                      .trim()
                      .substring(0, 75) || "Прикреплена ссылка"
                    : "Без описания";
                  const isOverdue =
                    Boolean(assignment.dueDate) &&
                    new Date(assignment.dueDate!).getTime() < Date.now() &&
                    !canCreate &&
                    userSub?.status !== SubmissionStatus.ACCEPTED;

                  return (
                    <tr key={assignment.id} className="hover:bg-muted/30 transition-colors">
                      {/* Title & Description */}
                      <td className="py-2.5 px-3 max-w-[300px]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <div
                            onClick={() => setViewTargetAssignmentId(assignment.id)}
                            className="font-semibold text-foreground text-xs hover:text-primary transition-colors cursor-pointer truncate flex items-center gap-1.5"
                          >
                            <ClipboardList className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span className="truncate">{assignment.title}</span>
                          </div>
                          {!assignment.isPublished && (
                            <Badge
                              variant="outline"
                              className="text-[9px] border-dashed border-muted-foreground/40 text-muted-foreground bg-muted/40 font-medium px-1.5 py-0 rounded-md inline-flex items-center gap-1"
                            >
                              <EyeOff className="h-2.5 w-2.5" /> Черновик
                            </Badge>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate pt-0.5">
                          {cleanDesc || "Без описания"}
                        </div>
                      </td>

                      {/* Subject & Teacher */}
                      <td className="py-2.5 px-3 max-w-[200px]">
                        <div className="text-[11px] font-medium text-primary truncate">
                          {assignment.subjectName}
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate pt-0.5 flex items-center gap-1">
                          <User className="h-3 w-3 shrink-0" /> {assignment.teacherName}
                        </div>
                      </td>

                      {/* Due Date */}
                      <td className="py-2.5 px-3 text-center">
                        {(() => {
                          const dueMeta = formatDueMeta(
                            assignment.dueDate,
                            !canCreate && userSub?.status !== SubmissionStatus.ACCEPTED
                          );
                          if (!dueMeta) {
                            return <span className="text-[11px] text-muted-foreground">—</span>;
                          }
                          const toneClass =
                            dueMeta.tone === "destructive"
                              ? "text-destructive"
                              : dueMeta.tone === "primary"
                                ? "text-primary"
                                : "text-foreground/85";
                          const hintClass =
                            dueMeta.tone === "destructive"
                              ? "text-destructive"
                              : dueMeta.tone === "primary"
                                ? "text-primary font-medium"
                                : "text-muted-foreground";
                          return (
                            <div className="inline-flex flex-col items-center gap-0.5">
                              <span
                                className={`inline-flex items-center gap-1 text-[11px] font-medium tabular-nums ${toneClass}`}
                              >
                                <Clock className="h-3 w-3 shrink-0 opacity-75" />
                                {dueMeta.dateLabel}
                              </span>
                              {dueMeta.hint && (
                                <span className={`text-[10px] leading-none ${hintClass}`}>
                                  {dueMeta.hint}
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </td>

                      {/* Attachments */}
                      <td className="py-2.5 px-3 text-center">
                        {attachmentLinksList.length > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md border border-border/60">
                            <Paperclip className="h-3 w-3 shrink-0 text-primary" /> {attachmentLinksList.length}
                          </span>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Submissions & Status */}
                      <td className="py-2.5 px-3">
                        {canCreate ? (
                          <button
                            type="button"
                            onClick={() => setReviewTargetAssignmentId(assignment.id)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 text-primary border border-primary/20 font-semibold text-[11px] hover:bg-primary/20 transition-colors cursor-pointer"
                          >
                            <FileCheck className="h-3.5 w-3.5" />
                            <span>
                              {assignment.submissionsCount} / {assignment.totalStudents}
                            </span>
                          </button>
                        ) : userSub ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Badge
                                variant="outline"
                                className={`text-[11px] font-medium border px-2 py-0.5 rounded-md inline-flex items-center gap-1.5 ${userSub.status === SubmissionStatus.ACCEPTED
                                  ? "bg-primary/10 text-primary border-primary/25"
                                  : userSub.status === SubmissionStatus.NEED_REVISION
                                    ? "bg-destructive/10 text-destructive border-destructive/25"
                                    : "bg-muted/60 text-muted-foreground border-border/60"
                                  }`}
                              >
                                {userSub.status === SubmissionStatus.ACCEPTED ? (
                                  <>
                                    <Check className="h-3 w-3" /> Принято
                                  </>
                                ) : userSub.status === SubmissionStatus.NEED_REVISION ? (
                                  <>
                                    <RotateCcw className="h-3 w-3" /> Доработка
                                  </>
                                ) : (
                                  <>
                                    <Timer className="h-3 w-3" /> Проверка
                                  </>
                                )}
                                {userSub.grade != null && (
                                  <>
                                    <span className="opacity-40">·</span>
                                    <span className="inline-flex items-center gap-0.5 font-semibold">
                                      <Star className="h-3 w-3 fill-primary text-primary" />
                                      {userSub.grade}
                                    </span>
                                  </>
                                )}
                              </Badge>
                              {userSub.teacherComment && (
                                <button
                                  type="button"
                                  onClick={() => setViewMyResultAssignmentId(assignment.id)}
                                  title={`Комментарий преподавателя: ${userSub.teacherComment}`}
                                  aria-label="Комментарий преподавателя"
                                  className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-primary/25 bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer shrink-0"
                                >
                                  <MessageSquare className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[11px] text-muted-foreground font-normal rounded-md border-border/60"
                          >
                            Не сдано
                          </Badge>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {canCreate ? (
                            <>
                              <Button
                                size="xs"
                                variant="outline"
                                onClick={() => setReviewTargetAssignmentId(assignment.id)}
                                className="h-7 text-xs gap-1.5 font-medium border-primary/30 text-primary hover:bg-primary/10 px-2.5 cursor-pointer"
                                title="Проверить работы студентов"
                              >
                                <FileCheck className="h-3.5 w-3.5" />
                                <span>Проверить</span>
                              </Button>

                              <DropdownMenu>
                                <DropdownMenuTrigger
                                  render={
                                    <Button
                                      size="xs"
                                      variant="ghost"
                                      className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/60"
                                      title="Действия с заданием"
                                    />
                                  }
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 text-xs">
                                  <DropdownMenuItem
                                    onClick={() => setViewTargetAssignmentId(assignment.id)}
                                    className="gap-2 cursor-pointer"
                                  >
                                    <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span>Просмотреть</span>
                                  </DropdownMenuItem>

                                  <DropdownMenuItem
                                    render={
                                      <Link
                                        href={`/dashboard/assignments/${assignment.id}/edit?group=${currentGroupId}`}
                                        className="flex items-center gap-2 cursor-pointer w-full"
                                      />
                                    }
                                  >
                                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span>Редактировать</span>
                                  </DropdownMenuItem>

                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleTogglePublish(assignment.id, assignment.isPublished)
                                    }
                                    className="gap-2 cursor-pointer"
                                  >
                                    {assignment.isPublished ? (
                                      <>
                                        <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span>Снять с публикации</span>
                                      </>
                                    ) : (
                                      <>
                                        <Eye className="h-3.5 w-3.5 text-primary" />
                                        <span>Опубликовать</span>
                                      </>
                                    )}
                                  </DropdownMenuItem>

                                  <DropdownMenuSeparator />

                                  <DropdownMenuItem
                                    onClick={() => setDeleteTargetAssignmentId(assignment.id)}
                                    className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    <span>Удалить задание</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </>
                          ) : (
                            <>
                              <Button
                                size="xs"
                                variant="outline"
                                onClick={() => setViewTargetAssignmentId(assignment.id)}
                                className="h-7 text-xs gap-1.5 font-medium px-2.5 cursor-pointer"
                              >
                                <Eye className="h-3.5 w-3.5 shrink-0" />
                                <span>Задание</span>
                              </Button>

                              {userSub ? (
                                <Button
                                  size="xs"
                                  onClick={() => setViewMyResultAssignmentId(assignment.id)}
                                  className="h-7 w-[104px] justify-center text-xs gap-1.5 font-medium px-2.5 cursor-pointer"
                                >
                                  <FileCheck className="h-3.5 w-3.5 shrink-0" />
                                  <span>Мой ответ</span>
                                </Button>
                              ) : (
                                <Button
                                  size="xs"
                                  onClick={() => setSubmitTargetAssignmentId(assignment.id)}
                                  className="h-7 w-[104px] justify-center text-xs gap-1.5 font-medium px-2.5 cursor-pointer"
                                >
                                  <Send className="h-3.5 w-3.5 shrink-0" />
                                  <span>Сдать ДЗ</span>
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredAssignments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground text-xs">
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <ClipboardList className="h-8 w-8 text-muted-foreground/40" />
                        <span className="font-semibold text-foreground">Заданий не найдено</span>
                        <span className="text-[11px]">
                          Попробуйте сменить группу, предмет или фильтр
                        </span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* VIEW MODE 2: Visual Card Grid */
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
          data-tour="assignments-list"
        >
          {filteredAssignments.map((assignment) => {
            const userSub = assignment.userSubmission;
            const attachmentLinksList = parseAttachmentLinks(assignment.fileUrl);
            const cleanDesc = assignment.description
              ? assignment.description
                .replace(/https?:\/\/\S+/g, "")
                .replace(/[#*`_~\-\[\]()]/g, " ")
                .replace(/\s+/g, " ")
                .trim() || "Прикреплена ссылка"
              : "Без описания";
            const isOverdue =
              Boolean(assignment.dueDate) &&
              new Date(assignment.dueDate!).getTime() < Date.now() &&
              !canCreate &&
              userSub?.status !== SubmissionStatus.ACCEPTED;

            return (
              <div
                key={assignment.id}
                className="bg-card rounded-xl border border-border p-3.5 flex flex-col justify-between space-y-3 hover:border-primary/40 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-medium text-primary truncate">
                      {assignment.subjectName}
                    </span>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {!assignment.isPublished && (
                        <Badge
                          variant="outline"
                          className="text-[9px] border-dashed border-muted-foreground/40 text-muted-foreground bg-muted/40 font-medium px-1.5 py-0 rounded-md inline-flex items-center gap-1"
                        >
                          <EyeOff className="h-2.5 w-2.5" /> Черновик
                        </Badge>
                      )}
                      {(() => {
                        const dueMeta = formatDueMeta(
                          assignment.dueDate,
                          !canCreate && userSub?.status !== SubmissionStatus.ACCEPTED
                        );
                        if (!dueMeta) return null;
                        const toneClass =
                          dueMeta.tone === "destructive"
                            ? "text-destructive"
                            : dueMeta.tone === "primary"
                              ? "text-primary"
                              : "text-muted-foreground";
                        return (
                          <span
                            className={`text-[11px] font-medium tabular-nums flex items-center gap-1 ${toneClass}`}
                            title={dueMeta.hint || undefined}
                          >
                            <Clock className="h-3 w-3 shrink-0" />
                            <span>{dueMeta.dateLabel}</span>
                            {dueMeta.hint && (
                              <span className="text-[10px] opacity-85">· {dueMeta.hint}</span>
                            )}
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  <div
                    onClick={() => setViewTargetAssignmentId(assignment.id)}
                    className="font-semibold text-foreground text-xs hover:text-primary transition-colors cursor-pointer line-clamp-2 flex items-start gap-1.5"
                  >
                    <ClipboardList className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                    <span>{assignment.title}</span>
                  </div>

                  <div className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                    {cleanDesc || "Без описания"}
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-0.5 text-[10px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1 truncate">
                      <User className="h-3 w-3 shrink-0" />
                      <span className="truncate">{assignment.teacherName}</span>
                    </span>
                    {attachmentLinksList.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md border border-border/60 shrink-0">
                        <Paperclip className="h-2.5 w-2.5 text-primary" />
                        <span>{attachmentLinksList.length}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="pt-2.5 border-t flex items-center justify-between gap-2">
                  {canCreate ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setReviewTargetAssignmentId(assignment.id)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 text-primary border border-primary/20 font-semibold text-[11px] hover:bg-primary/20 transition-colors cursor-pointer"
                      >
                        <FileCheck className="h-3.5 w-3.5" />
                        <span>
                          {assignment.submissionsCount} / {assignment.totalStudents}
                        </span>
                      </button>

                      <div className="flex items-center gap-1">
                        <Link href={`/dashboard/assignments/${assignment.id}/edit?group=${currentGroupId}`}>
                          <Button
                            size="xs"
                            variant="outline"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-primary cursor-pointer"
                            title="Редактировать"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </Link>

                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() =>
                            handleTogglePublish(assignment.id, assignment.isPublished)
                          }
                          className="h-7 w-7 p-0 text-muted-foreground cursor-pointer"
                          title={
                            assignment.isPublished ? "Снять с публикации" : "Опубликовать"
                          }
                        >
                          {assignment.isPublished ? (
                            <Eye className="h-3.5 w-3.5" />
                          ) : (
                            <EyeOff className="h-3.5 w-3.5" />
                          )}
                        </Button>

                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => setDeleteTargetAssignmentId(assignment.id)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive cursor-pointer"
                          title="Удалить"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      {userSub ? (
                        <Badge
                          variant="outline"
                          className={`text-[11px] font-medium border px-2 py-0.5 rounded-md inline-flex items-center gap-1.5 ${userSub.status === SubmissionStatus.ACCEPTED
                            ? "bg-primary/10 text-primary border-primary/25"
                            : userSub.status === SubmissionStatus.NEED_REVISION
                              ? "bg-destructive/10 text-destructive border-destructive/25"
                              : "bg-muted/60 text-muted-foreground border-border/60"
                            }`}
                        >
                          {userSub.status === SubmissionStatus.ACCEPTED ? (
                            <>
                              <Check className="h-3 w-3" /> Принято
                            </>
                          ) : userSub.status === SubmissionStatus.NEED_REVISION ? (
                            <>
                              <RotateCcw className="h-3 w-3" /> Доработка
                            </>
                          ) : (
                            <>
                              <Timer className="h-3 w-3" /> Проверка
                            </>
                          )}
                          {userSub.grade != null && (
                            <>
                              <span className="opacity-40">·</span>
                              <span className="inline-flex items-center gap-0.5 font-semibold">
                                <Star className="h-3 w-3 fill-primary text-primary" />
                                {userSub.grade}
                              </span>
                            </>
                          )}
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-[11px] text-muted-foreground font-normal rounded-md border-border/60"
                        >
                          Не сдано
                        </Badge>
                      )}

                      <div className="flex items-center gap-1.5">
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => setViewTargetAssignmentId(assignment.id)}
                          className="h-7 text-xs font-medium px-2.5 cursor-pointer"
                        >
                          Детали
                        </Button>
                        {userSub ? (
                          <Button
                            size="xs"
                            onClick={() => setViewMyResultAssignmentId(assignment.id)}
                            className="h-7 text-xs font-medium px-2.5 cursor-pointer"
                          >
                            Ответ
                          </Button>
                        ) : (
                          <Button
                            size="xs"
                            onClick={() => setSubmitTargetAssignmentId(assignment.id)}
                            className="h-7 text-xs font-medium gap-1 px-2.5 cursor-pointer"
                          >
                            <Send className="h-3 w-3" /> Сдать
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {filteredAssignments.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground text-xs bg-card rounded-xl border">
              <div className="flex flex-col items-center justify-center gap-1.5">
                <ClipboardList className="h-8 w-8 text-muted-foreground/40" />
                <span className="font-semibold text-foreground">Заданий не найдено</span>
                <span className="text-[11px]">Попробуйте сменить группу, предмет или фильтр</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Subcomponent Modals */}
      <ViewAssignmentDialog
        assignment={viewTargetAssignment}
        onClose={() => setViewTargetAssignmentId(null)}
        canEdit={canCreate}
        currentGroupId={currentGroupId}
        onOpenSubmit={(assignment) => setSubmitTargetAssignmentId(assignment.id)}
        onOpenResult={(assignment) => setViewMyResultAssignmentId(assignment.id)}
        onOpenReview={(assignment) => setReviewTargetAssignmentId(assignment.id)}
      />

      <StudentResultDialog
        assignment={viewMyResultAssignment}
        onClose={() => setViewMyResultAssignmentId(null)}
        onOpenSubmit={(assignment) => setSubmitTargetAssignmentId(assignment.id)}
      />

      <StudentSubmitDialog
        assignment={submitTargetAssignment}
        onClose={() => setSubmitTargetAssignmentId(null)}
        onSubmitSuccess={() => router.refresh()}
      />

      <TeacherReviewDialog
        assignment={reviewTargetAssignment}
        onClose={() => setReviewTargetAssignmentId(null)}
        onReviewSuccess={() => router.refresh()}
        onSubmissionReviewed={handleSubmissionReviewed}
      />

      <DeleteAssignmentDialog
        assignment={deleteTargetAssignment}
        onClose={() => setDeleteTargetAssignmentId(null)}
        onConfirmDelete={handleConfirmDelete}
        isPending={isPending}
      />

      <CreateAssignmentDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        subjects={subjects}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
