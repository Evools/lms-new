"use client";

import React, { useState, useTransition, useCallback } from "react";
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
  initialTabFilter?: "ALL" | "PENDING" | "DRAFTS";
  initialSearchQuery?: string;
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

  const [currentGroupId, setCurrentGroupId] = useState<string>(selectedGroupId);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearchQuery);
  const [subjectFilter, setSubjectFilter] = useState<string>(initialSubjectFilter || "all");
  const [activeTabFilter, setActiveTabFilter] = useState<"ALL" | "PENDING" | "DRAFTS">(
    initialTabFilter || "ALL"
  );
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [viewTargetAssignment, setViewTargetAssignment] = useState<AssignmentDTO | null>(null);
  const [viewMyResultAssignment, setViewMyResultAssignment] = useState<AssignmentDTO | null>(null);
  const [submitTargetAssignment, setSubmitTargetAssignment] = useState<AssignmentDTO | null>(null);
  const [reviewTargetAssignment, setReviewTargetAssignment] = useState<AssignmentDTO | null>(null);
  const [deleteTargetAssignment, setDeleteTargetAssignment] = useState<AssignmentDTO | null>(null);

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

  const handleTabChange = (val: "ALL" | "PENDING" | "DRAFTS") => {
    setActiveTabFilter(val);
    updateUrl({ tab: val });
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    updateUrl({ search: val });
  };

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
        setDeleteTargetAssignment(null);
        toast.add({ title: "Задание успешно удалено", type: "success" });
        router.refresh();
      } else {
        toast.add({ title: res.error || "Не удалось удалить задание", type: "error" });
      }
    });
  };

  // Metrics
  const publishedAssignments = assignments.filter((a) => a.isPublished);
  const draftAssignments = assignments.filter((a) => !a.isPublished);
  const totalAssignments =
    userRole === "STUDENT" ? assignments.length : publishedAssignments.length;
  const draftsCount = draftAssignments.length;
  let totalSubmissionsCount = 0;
  let totalAcceptedCount = 0;

  assignments.forEach((a) => {
    totalSubmissionsCount += a.submissionsCount;
    totalAcceptedCount += a.acceptedCount;
  });

  // Filtered list
  const filteredAssignments = assignments.filter((a) => {
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
      return a.isPublished && a.submissionsCount > a.acceptedCount;
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
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2 bg-card p-2.5 rounded-xl border items-center"
        data-tour="assignments-filters"
      >
        {/* Group Selector */}
        <div className="lg:col-span-3">
          <Select value={currentGroupId} onValueChange={handleGroupChange}>
            <SelectTrigger className="h-8 text-xs bg-background font-medium">
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

        {/* Subject Filter */}
        <div className="lg:col-span-3">
          <Select value={subjectFilter} onValueChange={handleSubjectChange}>
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

        {/* Tab Filters (All vs Pending vs Drafts) */}
        <div className="lg:col-span-3 flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border">
          <button
            type="button"
            onClick={() => handleTabChange("ALL")}
            className={`flex-1 py-1 rounded-md text-xs font-medium transition-all text-center cursor-pointer ${
              activeTabFilter === "ALL"
                ? "bg-background text-primary shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Все ({assignments.length})
          </button>

          {canCreate && (
            <>
              <button
                type="button"
                onClick={() => handleTabChange("PENDING")}
                className={`flex-1 py-1 rounded-md text-xs font-medium transition-all text-center flex items-center justify-center gap-1 cursor-pointer ${
                  activeTabFilter === "PENDING"
                    ? "bg-background text-primary shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Проверка
                {totalSubmissionsCount > totalAcceptedCount && (
                  <span className="text-[9px] px-1 rounded-full bg-primary/20 text-primary font-bold">
                    {totalSubmissionsCount - totalAcceptedCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleTabChange("DRAFTS")}
                className={`flex-1 py-1 rounded-md text-xs font-medium transition-all text-center flex items-center justify-center gap-1 cursor-pointer ${
                  activeTabFilter === "DRAFTS"
                    ? "bg-background text-primary shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Черновики
                {draftsCount > 0 && (
                  <span className="text-[9px] px-1 rounded-full bg-muted-foreground/20 text-muted-foreground font-bold">
                    {draftsCount}
                  </span>
                )}
              </button>
            </>
          )}
        </div>

        {/* Search & View Mode Switcher */}
        <div className="lg:col-span-3 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Поиск по названию..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="h-8 text-xs pl-8 bg-background"
            />
          </div>

          <div className="flex items-center p-0.5 bg-muted/60 rounded-lg border shrink-0">
            <Button
              size="xs"
              variant="ghost"
              onClick={() => setViewMode("table")}
              className={`h-7 w-7 p-0 rounded-md ${
                viewMode === "table"
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
              className={`h-7 w-7 p-0 rounded-md ${
                viewMode === "grid"
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
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <div
                            onClick={() => setViewTargetAssignment(assignment)}
                            className="font-bold text-foreground text-xs hover:text-primary transition-colors cursor-pointer truncate flex items-center gap-1.5"
                          >
                            <ClipboardList className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span className="truncate">{assignment.title}</span>
                          </div>
                          {!assignment.isPublished && (
                            <Badge
                              variant="outline"
                              className="text-[9px] border-dashed border-muted-foreground/40 text-muted-foreground bg-muted/40 font-medium px-1.5 py-0 inline-flex items-center gap-1"
                            >
                              <EyeOff className="h-2.5 w-2.5" /> Черновик
                            </Badge>
                          )}
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate pt-0.5">
                          {assignment.description
                            ? assignment.description
                                .replace(/[#*`_~\-\[\]()]/g, " ")
                                .substring(0, 70)
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
                          <span className="text-[10px] text-muted-foreground italic">
                            Без срока
                          </span>
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
                            onClick={() => setReviewTargetAssignment(assignment)}
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 font-bold text-[11px] hover:bg-primary/20 transition-colors cursor-pointer"
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
                                className={`text-[10px] font-semibold border px-2 py-0.5 inline-flex items-center gap-1 ${
                                  userSub.status === SubmissionStatus.ACCEPTED
                                    ? "bg-primary/15 text-primary border-primary/30"
                                    : userSub.status === SubmissionStatus.NEED_REVISION
                                      ? "bg-destructive/10 text-destructive border-destructive/30"
                                      : "bg-muted/60 text-muted-foreground border-border/50"
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
                              </Badge>
                              {userSub.grade != null && (
                                <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md">
                                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />{" "}
                                  {userSub.grade}
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
                          <Badge
                            variant="outline"
                            className="text-[10px] text-muted-foreground font-normal"
                          >
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
                                onClick={() => setReviewTargetAssignment(assignment)}
                                className="h-7 text-xs gap-1 font-medium border-primary/30 text-primary hover:bg-primary/10 px-2"
                                title="Проверить работы студентов"
                              >
                                <FileCheck className="h-3.5 w-3.5" />
                                <span className="hidden md:inline">Проверить</span>
                              </Button>

                              <Link href={`/dashboard/assignments/${assignment.id}/edit?group=${currentGroupId}`}>
                                <Button
                                  size="xs"
                                  variant="outline"
                                  className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                                  title="Редактировать задание"
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
                                className={`h-7 w-7 p-0 ${
                                  assignment.isPublished
                                    ? "text-muted-foreground hover:text-primary"
                                    : "text-muted-foreground hover:text-foreground bg-muted/40"
                                }`}
                                title={
                                  assignment.isPublished
                                    ? "Снять с публикации (в черновик)"
                                    : "Опубликовать задание"
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
                                onClick={() => setDeleteTargetAssignment(assignment)}
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive border-transparent hover:border-destructive/30"
                                title="Удалить задание"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="xs"
                                variant="outline"
                                onClick={() => setViewTargetAssignment(assignment)}
                                className="h-7 text-xs gap-1 font-medium px-2"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                <span>Задание</span>
                              </Button>

                              {userSub ? (
                                <Button
                                  size="xs"
                                  onClick={() => setViewMyResultAssignment(assignment)}
                                  className="h-7 text-xs gap-1 font-medium px-2"
                                >
                                  <span>Мой ответ</span>
                                </Button>
                              ) : (
                                <Button
                                  size="xs"
                                  onClick={() => setSubmitTargetAssignment(assignment)}
                                  className="h-7 text-xs gap-1 font-medium px-2.5"
                                >
                                  <Send className="h-3.5 w-3.5" />
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

            return (
              <div
                key={assignment.id}
                className="bg-card rounded-xl border p-3.5 flex flex-col justify-between space-y-3 shadow-xs hover:border-primary/40 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <Badge
                      variant="outline"
                      className="text-[10px] border-primary/30 text-primary bg-primary/5 font-medium px-1.5 py-0"
                    >
                      {assignment.subjectName}
                    </Badge>

                    <div className="flex items-center gap-1">
                      {!assignment.isPublished && (
                        <Badge
                          variant="outline"
                          className="text-[9px] border-dashed border-muted-foreground/40 text-muted-foreground bg-muted/40 font-medium px-1.5 py-0 inline-flex items-center gap-1"
                        >
                          <EyeOff className="h-2.5 w-2.5" /> Черновик
                        </Badge>
                      )}
                      {assignment.dueDate && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(assignment.dueDate).toLocaleDateString("ru-RU")}
                        </span>
                      )}
                    </div>
                  </div>

                  <div
                    onClick={() => setViewTargetAssignment(assignment)}
                    className="font-bold text-foreground text-xs hover:text-primary transition-colors cursor-pointer line-clamp-2"
                  >
                    {assignment.title}
                  </div>

                  <div className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                    {assignment.description
                      ? assignment.description.replace(/[#*`_~\-\[\]()]/g, " ")
                      : "Без описания"}
                  </div>

                  {attachmentLinksList.length > 0 && (
                    <div className="flex items-center gap-1 text-[10px] text-primary">
                      <Paperclip className="h-3 w-3" />
                      <span>Прикреплено файлов / ссылок: {attachmentLinksList.length}</span>
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="pt-2 border-t flex items-center justify-between gap-2">
                  {canCreate ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setReviewTargetAssignment(assignment)}
                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-primary/10 text-primary font-semibold text-[11px] hover:bg-primary/20 transition-colors cursor-pointer"
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
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
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
                          className="h-7 w-7 p-0 text-muted-foreground"
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
                          onClick={() => setDeleteTargetAssignment(assignment)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
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
                          className={`text-[10px] font-semibold border px-2 py-0.5 inline-flex items-center gap-1 ${
                            userSub.status === SubmissionStatus.ACCEPTED
                              ? "bg-primary/15 text-primary border-primary/30"
                              : userSub.status === SubmissionStatus.NEED_REVISION
                                ? "bg-destructive/10 text-destructive border-destructive/30"
                                : "bg-muted/60 text-muted-foreground border-border/50"
                          }`}
                        >
                          {userSub.status === SubmissionStatus.ACCEPTED
                            ? "Принято"
                            : userSub.status === SubmissionStatus.NEED_REVISION
                              ? "Доработка"
                              : "Проверка"}
                        </Badge>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">Не сдано</span>
                      )}

                      <div className="flex items-center gap-1">
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => setViewTargetAssignment(assignment)}
                          className="h-7 text-xs"
                        >
                          Детали
                        </Button>
                        {userSub ? (
                          <Button
                            size="xs"
                            onClick={() => setViewMyResultAssignment(assignment)}
                            className="h-7 text-xs font-medium"
                          >
                            Ответ
                          </Button>
                        ) : (
                          <Button
                            size="xs"
                            onClick={() => setSubmitTargetAssignment(assignment)}
                            className="h-7 text-xs font-medium gap-1"
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
        onClose={() => setViewTargetAssignment(null)}
        canEdit={canCreate}
        currentGroupId={currentGroupId}
        onOpenSubmit={(assignment) => setSubmitTargetAssignment(assignment)}
        onOpenResult={(assignment) => setViewMyResultAssignment(assignment)}
      />

      <StudentResultDialog
        assignment={viewMyResultAssignment}
        onClose={() => setViewMyResultAssignment(null)}
        onOpenSubmit={(assignment) => setSubmitTargetAssignment(assignment)}
      />

      <StudentSubmitDialog
        assignment={submitTargetAssignment}
        onClose={() => setSubmitTargetAssignment(null)}
        onSubmitSuccess={() => router.refresh()}
      />

      <TeacherReviewDialog
        assignment={reviewTargetAssignment}
        onClose={() => setReviewTargetAssignment(null)}
        onReviewSuccess={() => router.refresh()}
      />

      <DeleteAssignmentDialog
        assignment={deleteTargetAssignment}
        onClose={() => setDeleteTargetAssignment(null)}
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
