"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SubmissionStatus } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  Calendar,
  BookOpen,
  User,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  Send,
  FileCheck,
  MessageSquare,
  ChevronLeft,
  Users,
  Sparkles,
  Paperclip,
  PlusCircle,
  Link2,
  Eye,
  Filter,
  RefreshCw,
  Check,
  XCircle,
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
  const [activeTabFilter, setActiveTabFilter] = useState<"ALL" | "PENDING">("ALL");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  // Modal 3: Teacher Review Submissions Modal
  const [reviewTargetAssignment, setReviewTargetAssignment] = useState<AssignmentDTO | null>(null);
  const [reviewTeacherCommentMap, setReviewTeacherCommentMap] = useState<Record<string, string>>({});
  const [reviewFilter, setReviewFilter] = useState<ReviewStatusFilter>("ALL");

  // Full Assignment Details Modal
  const [viewTargetAssignment, setViewTargetAssignment] = useState<AssignmentDTO | null>(null);

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

  // Teacher Review Single Submission Handler
  const handleReviewSubmission = (submissionId: string, status: SubmissionStatus) => {
    const teacherComment = reviewTeacherCommentMap[submissionId] || "";

    setErrorMsg(null);
    startTransition(async () => {
      const res = await reviewSubmissionAction({
        submissionId,
        status,
        teacherComment,
      });

      if (res.success) {
        setSuccessMsg("Результат проверки сохранён!");
        router.refresh();
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setErrorMsg(res.error || "Ошибка при сохранении результата");
      }
    });
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
    const matchesSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.teacherName.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (activeTabFilter === "PENDING") {
      return a.submissionsCount > a.acceptedCount;
    }
    return true;
  });

  return (
    <div className="space-y-4 pb-8 text-xs">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-4 rounded-xl border shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href={currentGroupId ? `/dashboard/groups/${currentGroupId}` : "/dashboard/groups"}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-base font-bold text-foreground flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" /> Выдача и проверка домашних заданий
            </h1>
          </div>
          <p className="text-xs text-muted-foreground pl-6">
            Централизованный учет заданий, приём решений и ревью работ преподавателями
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canCreate && (
            <Link href={`/dashboard/assignments/new?group=${currentGroupId}`}>
              <Button size="xs" className="h-8 text-xs gap-1.5 font-medium shadow-xs">
                <Plus className="h-3.5 w-3.5" /> Создать задание
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Group Selector & Search Bar & Filter Tabs */}
      <div className="bg-card p-3 rounded-xl border space-y-3 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-primary" /> Учебная группа
            </label>
            <Select value={currentGroupId} onValueChange={handleGroupChange}>
              <SelectTrigger className="h-8 text-xs font-semibold bg-background">
                <SelectValue>{currentGroupObj?.name || "Выберите группу"}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {groups.map((g) => (
                  <SelectItem key={g.id} value={g.id} className="text-xs font-medium">
                    Группа {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className="text-[11px] font-medium text-muted-foreground">
              Поиск по названию или предмету
            </label>
            <div className="relative w-full">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
              <Input
                placeholder="Введите название задания или предмета..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 text-xs pl-8 bg-background font-medium"
              />
            </div>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 pt-2 border-t">
          <button
            type="button"
            onClick={() => setActiveTabFilter("ALL")}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              activeTabFilter === "ALL"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            Все задания ({totalAssignments})
          </button>

          {canCreate && (
            <button
              type="button"
              onClick={() => setActiveTabFilter("PENDING")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                activeTabFilter === "PENDING"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              Требуют проверки
              {totalSubmissionsCount > totalAcceptedCount && (
                <Badge variant="secondary" className="text-[9px] px-1 py-0 bg-primary/20 text-primary">
                  {totalSubmissionsCount - totalAcceptedCount}
                </Badge>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Analytics KPI Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card p-3 rounded-xl border flex items-center justify-between shadow-xs">
          <div className="space-y-0.5">
            <div className="text-[10px] text-muted-foreground font-medium">Всего заданий</div>
            <div className="text-base font-bold text-foreground">{totalAssignments} шт.</div>
          </div>
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <BookOpen className="h-4 w-4" />
          </div>
        </div>

        <div className="bg-card p-3 rounded-xl border flex items-center justify-between shadow-xs">
          <div className="space-y-0.5">
            <div className="text-[10px] text-muted-foreground font-medium">Сдано на проверку</div>
            <div className="text-base font-bold text-primary">{totalSubmissionsCount} ответов</div>
          </div>
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Send className="h-4 w-4" />
          </div>
        </div>

        <div className="bg-card p-3 rounded-xl border flex items-center justify-between shadow-xs">
          <div className="space-y-0.5">
            <div className="text-[10px] text-muted-foreground font-medium">Принятые работы</div>
            <div className="text-base font-bold text-primary">{totalAcceptedCount} шт.</div>
          </div>
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </div>

        <div className="bg-card p-3 rounded-xl border flex items-center justify-between shadow-xs">
          <div className="space-y-0.5">
            <div className="text-[10px] text-muted-foreground font-medium">На доработке</div>
            <div className="text-base font-bold text-destructive">{totalNeedRevisionCount} шт.</div>
          </div>
          <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive">
            <AlertCircle className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Alert Messages */}
      {successMsg && (
        <div className="p-3 rounded-lg border border-primary/30 bg-primary/10 text-primary text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Assignments Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredAssignments.map((assignment) => {
          const userSub = assignment.userSubmission;
          const attachmentLinksList = parseAttachmentLinks(assignment.fileUrl);

          const plainDescription = assignment.description
            ? assignment.description.replace(/[#*`_~\-\[\]()]/g, " ").replace(/\s+/g, " ").trim()
            : "";

          return (
            <Card
              key={assignment.id}
              onClick={() => setViewTargetAssignment(assignment)}
              className="p-3.5 border shadow-none hover:border-primary/50 hover:shadow-xs transition-all duration-200 flex flex-col justify-between space-y-3 bg-card rounded-xl group cursor-pointer"
            >
              {/* Header: Subject & Due Date */}
              <div className="flex items-center justify-between gap-2 border-b pb-2">
                <Badge variant="outline" className="text-[10px] border-primary/30 text-primary bg-primary/5 font-medium px-2 py-0.5 shrink-0">
                  {assignment.subjectName}
                </Badge>

                {assignment.dueDate ? (
                  <span className="text-[11px] text-muted-foreground font-normal flex items-center gap-1 shrink-0 bg-muted/60 px-2 py-0.5 rounded-md">
                    <Clock className="h-3 w-3 text-primary shrink-0" />
                    До {new Date(assignment.dueDate).toLocaleDateString("ru-RU")}
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-foreground italic">Без срока</span>
                )}
              </div>

              {/* Title & Short Description Snippet */}
              <div className="space-y-1 flex-1">
                <h3 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                  {assignment.title}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed font-normal">
                  {plainDescription || "Нажмите, чтобы просмотреть подробности задания..."}
                </p>
              </div>

              {/* Attachments Pill & Teacher Info */}
              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/50">
                <span className="flex items-center gap-1 font-normal">
                  <User className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="truncate max-w-[130px]">{assignment.teacherName}</span>
                </span>

                {attachmentLinksList.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                    <Paperclip className="h-3 w-3 shrink-0" />
                    {attachmentLinksList.length} {attachmentLinksList.length === 1 ? "ссылка" : "ссылки"}
                  </span>
                )}
              </div>

              {/* Action & Status Row */}
              <div
                className="flex items-center justify-between gap-2 pt-2 border-t border-border/50"
                onClick={(e) => e.stopPropagation()}
              >
                {canCreate ? (
                  /* Teacher / Admin Controls */
                  <div className="flex items-center justify-between w-full gap-2">
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => {
                        setReviewTargetAssignment(assignment);
                        setReviewFilter("ALL");
                        const initialComments: Record<string, string> = {};
                        assignment.submissions.forEach((s) => {
                          initialComments[s.id] = s.teacherComment || "";
                        });
                        setReviewTeacherCommentMap(initialComments);
                      }}
                      className="h-7 text-xs gap-1.5 font-medium border-primary/30 text-primary hover:bg-primary/10"
                    >
                      <FileCheck className="h-3.5 w-3.5" />
                      Проверить работы ({assignment.submissionsCount}/{assignment.totalStudents})
                    </Button>

                    <div className="flex items-center gap-1">
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => setViewTargetAssignment(assignment)}
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                        title="Просмотр задания"
                      >
                        <Eye className="h-3.5 w-3.5 text-primary" />
                      </Button>

                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => handleDeleteAssignment(assignment.id)}
                        className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
                        title="Удалить задание"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Student Status & Action Button */
                  <div className="flex items-center justify-between w-full gap-2">
                    {userSub ? (
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-normal border-0 ${
                            userSub.status === SubmissionStatus.ACCEPTED
                              ? "bg-primary/10 text-primary"
                              : userSub.status === SubmissionStatus.NEED_REVISION
                                ? "bg-destructive/10 text-destructive"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {userSub.status === SubmissionStatus.ACCEPTED
                            ? "Принято"
                            : userSub.status === SubmissionStatus.NEED_REVISION
                              ? "На доработке"
                              : "На проверке"}
                        </Badge>
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground bg-muted/40 border-border/50">
                        Не сдано
                      </Badge>
                    )}

                    <div className="flex items-center gap-1.5">
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => setViewTargetAssignment(assignment)}
                        className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground"
                        title="Подробное описание"
                      >
                        <Eye className="h-3.5 w-3.5 text-primary" /> Описание
                      </Button>

                      <Button
                        size="xs"
                        variant={userSub?.status === SubmissionStatus.ACCEPTED ? "outline" : "default"}
                        onClick={() => {
                          setSubmitTargetAssignment(assignment);
                          setSubmitFileUrl(userSub?.fileUrl || "");
                          setSubmitComment(userSub?.comment || "");
                        }}
                        className="h-7 text-xs gap-1.5 font-medium"
                      >
                        <Send className="h-3.5 w-3.5" />
                        {userSub ? "Пересдать" : "Сдать"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          );
        })}

        {filteredAssignments.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground text-xs bg-card border rounded-xl space-y-2">
            <ClipboardList className="h-8 w-8 text-muted-foreground/40 mx-auto" />
            <p className="font-semibold text-foreground">Задания не найдены</p>
            <p className="text-[11px] text-muted-foreground">По выбранным фильтрам или для данной группы нет опубликованных домашних заданий</p>
          </div>
        )}
      </div>

      {/* Modal 0: Full Assignment View Dialog */}
      <Dialog open={viewTargetAssignment !== null} onOpenChange={(open) => !open && setViewTargetAssignment(null)}>
        {viewTargetAssignment && (
          <DialogContent className="p-4 gap-3 text-xs sm:max-w-[650px] max-h-[85vh] overflow-y-auto">
            <DialogHeader className="pb-2 border-b gap-1 text-left">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] border-primary/30 text-primary font-medium">
                  {viewTargetAssignment.subjectName}
                </Badge>
                {viewTargetAssignment.dueDate && (
                  <Badge variant="secondary" className="text-[10px] gap-1 shrink-0 font-normal">
                    <Clock className="h-3 w-3 text-primary" />
                    До: {new Date(viewTargetAssignment.dueDate).toLocaleDateString("ru-RU")}
                  </Badge>
                )}
              </div>
              <DialogTitle className="text-base font-semibold text-foreground pt-1">
                {viewTargetAssignment.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground flex items-center gap-2 pt-0.5">
                <span>Преподаватель: {viewTargetAssignment.teacherName}</span>
                <span>•</span>
                <span>Выдано: {new Date(viewTargetAssignment.createdAt).toLocaleDateString("ru-RU")}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="py-2 text-xs space-y-4 leading-relaxed">
              <div className="p-3 border rounded-lg bg-card text-foreground">
                {renderMarkdown(viewTargetAssignment.description)}
              </div>

              {parseAttachmentLinks(viewTargetAssignment.fileUrl).length > 0 && (
                <div className="space-y-1.5 pt-2 border-t">
                  <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Paperclip className="h-3.5 w-3.5 text-primary" /> Прикреплённые ресурсы и ссылки:
                  </div>
                  <div className="flex flex-col gap-2">
                    {parseAttachmentLinks(viewTargetAssignment.fileUrl).map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-mono bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-md border border-primary/20 transition-colors truncate"
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

      {/* Modal 1: Create Assignment Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="p-4 gap-3 text-xs sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-2 border-b gap-1 text-left">
            <DialogTitle className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Plus className="h-4 w-4 text-primary" /> Публикация нового задания
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-1 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                placeholder="Например: Домашнее задание №3. Списки и кортежи в Python"
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
                className="text-xs bg-background min-h-[120px]"
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

      {/* Modal 2: Student Submit Assignment Dialog */}
      <Dialog open={submitTargetAssignment !== null} onOpenChange={(open) => !open && setSubmitTargetAssignment(null)}>
        {submitTargetAssignment && (
          <DialogContent className="p-4 gap-3 text-xs sm:max-w-[420px]">
            <DialogHeader className="pb-2 border-b gap-1 text-left">
              <DialogTitle className="flex items-center gap-2 text-sm font-bold text-foreground">
                <Send className="h-4 w-4 text-primary" /> Сдача домашнего задания
              </DialogTitle>
              <DialogDescription className="text-xs">
                Задание: <strong>{submitTargetAssignment.title}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-1 text-xs">
              <div className="space-y-1">
                <label className="font-medium text-foreground text-xs">Ссылка на работу (Google Drive / GitHub)</label>
                <Input
                  placeholder="https://drive.google.com/..."
                  value={submitFileUrl}
                  onChange={(e) => setSubmitFileUrl(e.target.value)}
                  className="h-8 text-xs bg-background font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground text-xs">Пояснение преподавателю</label>
                <Textarea
                  placeholder="Напишите комментарий к выполненной работе..."
                  value={submitComment}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSubmitComment(e.target.value)}
                  className="text-xs bg-background min-h-[70px]"
                />
              </div>
            </div>

            <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
              <Button variant="outline" size="xs" onClick={() => setSubmitTargetAssignment(null)}>
                Отмена
              </Button>
              <Button size="xs" disabled={isPending} onClick={handleStudentSubmit}>
                Отправить
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Modal 3: Spacious Teacher Review Submissions Dialog */}
      <Dialog open={reviewTargetAssignment !== null} onOpenChange={(open) => !open && setReviewTargetAssignment(null)}>
        {reviewTargetAssignment && (
          <DialogContent className="p-4 gap-3 text-xs sm:max-w-[760px] max-h-[90vh] overflow-y-auto">
            <DialogHeader className="pb-2 border-b gap-1 text-left">
              <div className="flex items-center justify-between">
                <DialogTitle className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <FileCheck className="h-4 w-4 text-primary" /> Проверка сданных работ
                </DialogTitle>
                <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                  {reviewTargetAssignment.submissionsCount} из {reviewTargetAssignment.totalStudents} сдали
                </Badge>
              </div>
              <DialogDescription className="text-xs text-muted-foreground">
                Задание: <strong className="text-foreground">{reviewTargetAssignment.title}</strong> ({reviewTargetAssignment.subjectName})
              </DialogDescription>
            </DialogHeader>

            {/* Submissions Filter Pills inside Review Modal */}
            <div className="flex items-center gap-1.5 p-1 bg-muted/40 border rounded-lg">
              <button
                type="button"
                onClick={() => setReviewFilter("ALL")}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  reviewFilter === "ALL"
                    ? "bg-card text-foreground shadow-xs border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Все сданные ({reviewTargetAssignment.submissions.length})
              </button>
              <button
                type="button"
                onClick={() => setReviewFilter("SUBMITTED")}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  reviewFilter === "SUBMITTED"
                    ? "bg-card text-foreground shadow-xs border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                На проверке ({reviewTargetAssignment.submissions.filter((s) => s.status === SubmissionStatus.SUBMITTED).length})
              </button>
              <button
                type="button"
                onClick={() => setReviewFilter("ACCEPTED")}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  reviewFilter === "ACCEPTED"
                    ? "bg-card text-foreground shadow-xs border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Принятые ({reviewTargetAssignment.submissions.filter((s) => s.status === SubmissionStatus.ACCEPTED).length})
              </button>
              <button
                type="button"
                onClick={() => setReviewFilter("NEED_REVISION")}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  reviewFilter === "NEED_REVISION"
                    ? "bg-card text-foreground shadow-xs border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                На доработке ({reviewTargetAssignment.submissions.filter((s) => s.status === SubmissionStatus.NEED_REVISION).length})
              </button>
            </div>

            {/* List of Submissions */}
            <div className="space-y-3 py-1 text-xs">
              {reviewTargetAssignment.submissions
                .filter((sub) => {
                  if (reviewFilter === "ALL") return true;
                  return sub.status === reviewFilter;
                })
                .map((sub) => (
                  <div key={sub.id} className="p-3.5 border rounded-xl bg-card space-y-3 shadow-xs">
                    <div className="flex items-center justify-between gap-2 border-b pb-2">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-7 w-7 border shrink-0">
                          <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                            {sub.studentName.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-bold text-foreground text-xs">{sub.studentName}</div>
                          <div className="text-[10px] text-muted-foreground">
                            Сдано: {new Date(sub.submittedAt).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                      </div>

                      <Badge
                        variant="outline"
                        className={
                          sub.status === SubmissionStatus.ACCEPTED
                            ? "bg-primary/10 text-primary border-primary/30 text-[10px]"
                            : sub.status === SubmissionStatus.NEED_REVISION
                              ? "bg-destructive/10 text-destructive border-destructive/30 text-[10px]"
                              : "bg-muted text-muted-foreground text-[10px]"
                        }
                      >
                        {sub.status === SubmissionStatus.ACCEPTED
                          ? "Принято"
                          : sub.status === SubmissionStatus.NEED_REVISION
                            ? "На доработке"
                            : "Ожидает проверки"}
                      </Badge>
                    </div>

                    {/* Student Solution Links & Comments */}
                    <div className="space-y-2">
                      {sub.fileUrl && (
                        <div className="flex items-center gap-2">
                          <a
                            href={sub.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20 truncate"
                          >
                            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">Открыть решение студента ({sub.fileUrl})</span>
                          </a>
                        </div>
                      )}

                      {sub.comment && (
                        <div className="p-2.5 rounded-lg bg-muted/30 border text-xs text-foreground space-y-0.5">
                          <span className="text-[10px] text-muted-foreground font-semibold block">Пояснение студента:</span>
                          <p className="italic">«{sub.comment}»</p>
                        </div>
                      )}
                    </div>

                    {/* Teacher Feedback input and Action buttons */}
                    <div className="space-y-2 pt-2 border-t">
                      <div className="space-y-1">
                        <label className="text-[10px] font-medium text-muted-foreground">
                          Замечания или комментарий преподавателя к работе:
                        </label>
                        <Input
                          placeholder="Например: Отличная работа! / Переделайте пункт 2..."
                          value={reviewTeacherCommentMap[sub.id] || ""}
                          onChange={(e) =>
                            setReviewTeacherCommentMap((prev) => ({
                              ...prev,
                              [sub.id]: e.target.value,
                            }))
                          }
                          className="h-8 text-xs bg-background"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <Button
                          size="xs"
                          variant="outline"
                          disabled={isPending}
                          onClick={() => handleReviewSubmission(sub.id, SubmissionStatus.NEED_REVISION)}
                          className="h-7 px-3 text-xs gap-1 text-destructive border-destructive/30 hover:bg-destructive/10 font-medium"
                        >
                          <XCircle className="h-3.5 w-3.5" /> На доработку
                        </Button>

                        <Button
                          size="xs"
                          disabled={isPending}
                          onClick={() => handleReviewSubmission(sub.id, SubmissionStatus.ACCEPTED)}
                          className="h-7 px-3 text-xs gap-1 font-medium"
                        >
                          <Check className="h-3.5 w-3.5" /> Принять работу
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

              {reviewTargetAssignment.submissions.length === 0 && (
                <div className="py-12 text-center text-muted-foreground text-xs italic bg-muted/20 border rounded-xl">
                  Пока ни один студент не сдал работу на проверку
                </div>
              )}
            </div>

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
