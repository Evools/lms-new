"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SubmissionStatus } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

interface AttachmentLink {
  title: string;
  url: string;
}

function parseAttachmentLinks(fileUrl?: string | null): AttachmentLink[] {
  if (!fileUrl) return [];
  try {
    const parsed = JSON.parse(fileUrl);
    if (Array.isArray(parsed)) {
      return parsed.filter((item) => item.url && item.url.trim() !== "");
    }
  } catch {
    if (fileUrl.trim().startsWith("http://") || fileUrl.trim().startsWith("https://")) {
      return [{ title: "Прикреплённый материал", url: fileUrl.trim() }];
    }
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
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modal 1: Create Assignment
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [newGroupSubjectId, setNewGroupSubjectId] = useState<string>(subjects[0]?.id || "");
  const [newTitle, setNewTitle] = useState<string>("");
  const [newDescription, setNewDescription] = useState<string>("");
  const [newDueDate, setNewDueDate] = useState<string>("");
  const [attachmentLinks, setAttachmentLinks] = useState<AttachmentLink[]>([
    { title: "", url: "" },
  ]);

  // Modal 2: Student Submission Modal
  const [submitTargetAssignment, setSubmitTargetAssignment] = useState<AssignmentDTO | null>(null);
  const [submitFileUrl, setSubmitFileUrl] = useState<string>("");
  const [submitComment, setSubmitComment] = useState<string>("");

  // Modal 3: Teacher Review Submissions Modal
  const [reviewTargetAssignment, setReviewTargetAssignment] = useState<AssignmentDTO | null>(null);
  const [reviewTeacherCommentMap, setReviewTeacherCommentMap] = useState<Record<string, string>>({});

  const currentGroupObj = groups.find((g) => g.id === currentGroupId);

  const handleGroupChange = (val: string) => {
    setCurrentGroupId(val);
    router.push(`/dashboard/assignments?group=${val}`);
  };

  // Attachment Links Handlers
  const handleAddAttachmentLink = () => {
    setAttachmentLinks((prev) => [...prev, { title: "", url: "" }]);
  };

  const handleRemoveAttachmentLink = (index: number) => {
    setAttachmentLinks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateAttachmentLink = (index: number, field: "title" | "url", value: string) => {
    setAttachmentLinks((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Open Create Modal Reset
  const handleOpenCreateModal = () => {
    setIsCreateOpen(true);
    setNewTitle("");
    setNewDescription("");
    setNewDueDate("");
    setAttachmentLinks([{ title: "", url: "" }]);
  };

  // Create Assignment Submit
  const handleCreateAssignment = () => {
    if (!newTitle.trim() || !newDescription.trim() || !newGroupSubjectId) {
      setErrorMsg("Заполните все обязательные поля");
      return;
    }

    const validLinks = attachmentLinks.filter((l) => l.url.trim().length > 0);
    const serializedFileUrl = validLinks.length > 0 ? JSON.stringify(validLinks) : undefined;

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
        setSuccessMsg("Домашнее задание успешно опубликовано!");
        setIsCreateOpen(false);
        setNewTitle("");
        setNewDescription("");
        setNewDueDate("");
        setAttachmentLinks([{ title: "", url: "" }]);
        router.refresh();
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setErrorMsg(res.error || "Ошибка при создании задания");
      }
    });
  };

  // Delete Assignment
  const handleDeleteAssignment = (id: string) => {
    if (!confirm("Вы уверены, что хотите удалить это задание?")) return;
    setErrorMsg(null);
    startTransition(async () => {
      const res = await deleteAssignmentAction(id);
      if (res.success) {
        setSuccessMsg("Задание удалено!");
        router.refresh();
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setErrorMsg(res.error || "Ошибка при удалении");
      }
    });
  };

  // Student Submit Homework
  const handleStudentSubmit = () => {
    if (!submitTargetAssignment) return;
    setErrorMsg(null);
    startTransition(async () => {
      const res = await submitAssignmentAction({
        assignmentId: submitTargetAssignment.id,
        fileUrl: submitFileUrl,
        comment: submitComment,
      });

      if (res.success) {
        setSuccessMsg("Работа успешно отправлена на проверку!");
        setSubmitTargetAssignment(null);
        setSubmitFileUrl("");
        setSubmitComment("");
        router.refresh();
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setErrorMsg(res.error || "Ошибка при отправке работы");
      }
    });
  };

  // Teacher Review Submission
  const handleReviewSubmission = (
    submissionId: string,
    status: SubmissionStatus
  ) => {
    setErrorMsg(null);
    const teacherComment = reviewTeacherCommentMap[submissionId] || "";

    startTransition(async () => {
      const res = await reviewSubmissionAction({
        submissionId,
        status,
        teacherComment,
      });

      if (res.success) {
        setSuccessMsg("Статус проверки обновлен!");
        router.refresh();
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setErrorMsg(res.error || "Ошибка при обновлении проверки");
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
  const filteredAssignments = assignments.filter(
    (a) =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.teacherName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4 pb-8 text-xs">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-4 rounded-xl border">
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
              <Button size="xs" className="h-8 text-xs gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Создать задание
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Group Selector & Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-card p-3 rounded-xl border items-center">
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
              className="h-8 text-xs pl-8 bg-background"
            />
          </div>
        </div>
      </div>

      {/* Analytics KPI Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card p-3 rounded-xl border flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-[10px] text-muted-foreground font-medium">Всего заданий</div>
            <div className="text-base font-bold text-foreground">{totalAssignments} шт.</div>
          </div>
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <BookOpen className="h-4 w-4" />
          </div>
        </div>

        <div className="bg-card p-3 rounded-xl border flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-[10px] text-muted-foreground font-medium">Сдано на проверку</div>
            <div className="text-base font-bold text-primary">{totalSubmissionsCount} ответов</div>
          </div>
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Send className="h-4 w-4" />
          </div>
        </div>

        <div className="bg-card p-3 rounded-xl border flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-[10px] text-muted-foreground font-medium">Принятые работы</div>
            <div className="text-base font-bold text-primary">{totalAcceptedCount} шт.</div>
          </div>
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </div>

        <div className="bg-card p-3 rounded-xl border flex items-center justify-between">
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredAssignments.map((assignment) => {
          const userSub = assignment.userSubmission;
          const attachmentLinksList = parseAttachmentLinks(assignment.fileUrl);

          return (
            <Card key={assignment.id} className="p-4 border shadow-none hover:border-primary/40 transition-all space-y-3">
              {/* Header: Subject & Due Date */}
              <div className="flex items-start justify-between gap-2 border-b pb-2">
                <div className="space-y-0.5">
                  <Badge variant="outline" className="text-[10px] border-primary/30 text-primary font-medium">
                    {assignment.subjectName}
                  </Badge>
                  <h3 className="text-sm font-semibold text-foreground line-clamp-1 pt-1">
                    {assignment.title}
                  </h3>
                </div>

                {assignment.dueDate && (
                  <Badge variant="secondary" className="text-[10px] gap-1 shrink-0 font-normal">
                    <Clock className="h-3 w-3 text-primary" />
                    До: {new Date(assignment.dueDate).toLocaleDateString("ru-RU")}
                  </Badge>
                )}
              </div>

              {/* Formatted Markdown Description */}
              <div className="text-xs text-muted-foreground leading-relaxed line-clamp-6">
                {renderMarkdown(assignment.description)}
              </div>

              {/* Multiple Attachment Links Badges */}
              {attachmentLinksList.length > 0 && (
                <div className="pt-1 space-y-1.5">
                  <div className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                    <Paperclip className="h-3 w-3 text-primary" /> Прикрепленные материалы ({attachmentLinksList.length}):
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {attachmentLinksList.map((link, idx) => (
                      <a
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-[11px] text-primary hover:underline font-medium bg-primary/5 hover:bg-primary/10 px-2.5 py-1 rounded-md border border-primary/20 transition-colors"
                      >
                        <ExternalLink className="h-3 w-3 shrink-0" />
                        <span className="truncate max-w-[200px]">{link.title || link.url}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Author and Date info */}
              <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-1 border-t">
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3 text-muted-foreground" /> {assignment.teacherName}
                </span>
                <span>Выдано: {new Date(assignment.createdAt).toLocaleDateString("ru-RU")}</span>
              </div>

              {/* Action & Status Row */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t">
                {/* Teacher / Admin Action Button */}
                {canCreate ? (
                  <div className="flex items-center justify-between w-full gap-2">
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => {
                        setReviewTargetAssignment(assignment);
                        const initialComments: Record<string, string> = {};
                        assignment.submissions.forEach((s) => {
                          initialComments[s.id] = s.teacherComment || "";
                        });
                        setReviewTeacherCommentMap(initialComments);
                      }}
                      className="h-7 text-xs gap-1.5"
                    >
                      <FileCheck className="h-3.5 w-3.5 text-primary" />
                      Проверка работ ({assignment.submissionsCount} / {assignment.totalStudents})
                    </Button>

                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => handleDeleteAssignment(assignment.id)}
                      className="h-7 text-xs text-destructive hover:bg-destructive/10 p-1.5"
                      title="Удалить задание"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  /* Student Status & Action Button */
                  <div className="flex items-center justify-between w-full gap-2">
                    {userSub ? (
                      <div className="flex items-center gap-2">
                        <Badge
                          className={
                            userSub.status === SubmissionStatus.ACCEPTED
                              ? "bg-primary text-primary-foreground text-[10px]"
                              : userSub.status === SubmissionStatus.NEED_REVISION
                              ? "bg-destructive text-white text-[10px]"
                              : "bg-muted text-muted-foreground text-[10px]"
                          }
                        >
                          {userSub.status === SubmissionStatus.ACCEPTED
                            ? "Принято"
                            : userSub.status === SubmissionStatus.NEED_REVISION
                            ? "На доработке"
                            : "На проверке"}
                        </Badge>
                        {userSub.teacherComment && (
                          <span className="text-[10px] text-muted-foreground italic truncate max-w-[150px]">
                            «{userSub.teacherComment}»
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] text-muted-foreground italic">Работа не сдана</span>
                    )}

                    <Button
                      size="xs"
                      variant={userSub?.status === SubmissionStatus.ACCEPTED ? "outline" : "default"}
                      onClick={() => {
                        setSubmitTargetAssignment(assignment);
                        setSubmitFileUrl(userSub?.fileUrl || "");
                        setSubmitComment(userSub?.comment || "");
                      }}
                      className="h-7 text-xs gap-1.5"
                    >
                      <Send className="h-3.5 w-3.5" />
                      {userSub ? "Пересдать работу" : "Сдать работу"}
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          );
        })}

        {filteredAssignments.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground text-xs bg-card border rounded-xl">
            Задания не найдены
          </div>
        )}
      </div>

      {/* Modal 1: Spacious Rich Create Assignment Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="p-4 gap-3 text-xs sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-2 border-b gap-1">
            <DialogTitle className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Plus className="h-4 w-4 text-primary" /> Публикация домашнего задания
            </DialogTitle>
            <DialogDescription className="text-xs">
              Укажите дисциплину, подробные инструкции к заданию, срок сдачи и материалы
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-1 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-medium text-foreground text-xs">Учебная дисциплина</label>
                <Select value={newGroupSubjectId} onValueChange={setNewGroupSubjectId}>
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue>
                      {subjects.find((s) => s.id === newGroupSubjectId)?.subjectName || "Выберите предмет"}
                    </SelectValue>
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
                <label className="font-medium text-foreground text-xs">Срок сдачи (Due Date)</label>
                <Input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="h-8 text-xs bg-background font-medium"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground text-xs">Заголовок задания</label>
              <Input
                placeholder="Например: Разработка REST API для управления задачами"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="h-8 text-xs bg-background font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground text-xs flex items-center justify-between">
                <span>Подробное описание и требования к работе</span>
                <span className="text-[10px] text-muted-foreground font-normal">Поддерживает многострочный текст</span>
              </label>
              <Textarea
                placeholder="Опишите задачи, требования к оформлению, критерии оценивания и любые подробные инструкции..."
                value={newDescription}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewDescription(e.target.value)}
                className="text-xs bg-background min-h-[140px] leading-relaxed font-sans"
              />
            </div>

            {/* Dynamic Attachment Links Section */}
            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                  <Paperclip className="h-3.5 w-3.5 text-primary" /> Ссылки на прикреплённые материалы и файлы
                </label>
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={handleAddAttachmentLink}
                  className="h-6 px-2 text-[10px] gap-1 text-primary border-primary/30 hover:bg-primary/10"
                >
                  <PlusCircle className="h-3 w-3" /> Добавить ссылку
                </Button>
              </div>

              <div className="space-y-2">
                {attachmentLinks.map((link, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      placeholder="Название (например: Презентация / Figma / PDF)"
                      value={link.title}
                      onChange={(e) => handleUpdateAttachmentLink(idx, "title", e.target.value)}
                      className="h-8 text-xs bg-background w-1/3"
                    />
                    <Input
                      placeholder="https://..."
                      value={link.url}
                      onChange={(e) => handleUpdateAttachmentLink(idx, "url", e.target.value)}
                      className="h-8 text-xs bg-background flex-1 font-mono"
                    />
                    {attachmentLinks.length > 1 && (
                      <Button
                        type="button"
                        size="xs"
                        variant="ghost"
                        onClick={() => handleRemoveAttachmentLink(idx)}
                        className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
            <Button variant="outline" size="xs" onClick={() => setIsCreateOpen(false)}>
              Отмена
            </Button>
            <Button size="xs" disabled={isPending} onClick={handleCreateAssignment}>
              Опубликовать задание
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal 2: Student Submit Assignment Dialog */}
      <Dialog open={submitTargetAssignment !== null} onOpenChange={(open) => !open && setSubmitTargetAssignment(null)}>
        {submitTargetAssignment && (
          <DialogContent className="p-4 gap-3 text-xs sm:max-w-[420px]">
            <DialogHeader className="pb-2 border-b gap-1">
              <DialogTitle className="flex items-center gap-2 text-sm font-bold text-foreground">
                <Send className="h-4 w-4 text-primary" /> Сдача домашнего задания
              </DialogTitle>
              <DialogDescription className="text-xs">
                Задание: <strong>{submitTargetAssignment.title}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-1 text-xs">
              <div className="space-y-1">
                <label className="font-medium text-foreground text-xs">Ссылка на выполненную работу (Google Drive / GitHub)</label>
                <Input
                  placeholder="https://drive.google.com/..."
                  value={submitFileUrl}
                  onChange={(e) => setSubmitFileUrl(e.target.value)}
                  className="h-8 text-xs bg-background font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground text-xs">Комментарий преподавателю</label>
                <Textarea
                  placeholder="Напишите пояснение к выполненной работе..."
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

      {/* Modal 3: Teacher Submissions Review Dialog */}
      <Dialog open={reviewTargetAssignment !== null} onOpenChange={(open) => !open && setReviewTargetAssignment(null)}>
        {reviewTargetAssignment && (
          <DialogContent className="p-4 gap-3 text-xs sm:max-w-[520px]">
            <DialogHeader className="pb-2 border-b gap-1">
              <DialogTitle className="flex items-center gap-2 text-sm font-bold text-foreground">
                <FileCheck className="h-4 w-4 text-primary" /> Проверка сданных работ
              </DialogTitle>
              <DialogDescription className="text-xs">
                Задание: <strong>{reviewTargetAssignment.title}</strong> ({reviewTargetAssignment.submissionsCount} сданных работ)
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-1 text-xs max-h-[380px] overflow-y-auto pr-1">
              {reviewTargetAssignment.submissions.map((sub) => (
                <div key={sub.id} className="p-3 border rounded-lg bg-card space-y-2">
                  <div className="flex items-center justify-between gap-2 border-b pb-1.5">
                    <div className="flex items-center gap-2 font-medium">
                      <Avatar className="h-5 w-5 border shrink-0">
                        <AvatarFallback className="text-[8px] font-bold bg-muted text-muted-foreground">
                          {sub.studentName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span>{sub.studentName}</span>
                    </div>

                    <Badge
                      className={
                        sub.status === SubmissionStatus.ACCEPTED
                          ? "bg-primary text-primary-foreground text-[9px]"
                          : sub.status === SubmissionStatus.NEED_REVISION
                          ? "bg-destructive text-white text-[9px]"
                          : "bg-muted text-muted-foreground text-[9px]"
                      }
                    >
                      {sub.status === SubmissionStatus.ACCEPTED
                        ? "Принято"
                        : sub.status === SubmissionStatus.NEED_REVISION
                        ? "На доработке"
                        : "На проверке"}
                    </Badge>
                  </div>

                  {/* Submission Attachment and Comment */}
                  {sub.fileUrl && (
                    <div>
                      <a
                        href={sub.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-medium font-mono"
                      >
                        <ExternalLink className="h-3 w-3" /> Ссылка на решение
                      </a>
                    </div>
                  )}

                  {sub.comment && (
                    <div className="text-[11px] text-muted-foreground italic">
                      Ответ студента: «{sub.comment}»
                    </div>
                  )}

                  {/* Teacher Feedback input and Action buttons */}
                  <div className="space-y-2 pt-1 border-t">
                    <Input
                      placeholder="Замечание или комментарий преподавателя..."
                      value={reviewTeacherCommentMap[sub.id] || ""}
                      onChange={(e) =>
                        setReviewTeacherCommentMap((prev) => ({
                          ...prev,
                          [sub.id]: e.target.value,
                        }))
                      }
                      className="h-7 text-xs bg-background"
                    />

                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => handleReviewSubmission(sub.id, SubmissionStatus.NEED_REVISION)}
                        className="h-6 px-2 text-[10px] text-destructive border-destructive/30 hover:bg-destructive/10"
                      >
                        На доработку
                      </Button>

                      <Button
                        size="xs"
                        onClick={() => handleReviewSubmission(sub.id, SubmissionStatus.ACCEPTED)}
                        className="h-6 px-2 text-[10px]"
                      >
                        Принять работу
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {reviewTargetAssignment.submissions.length === 0 && (
                <div className="py-8 text-center text-muted-foreground text-xs italic">
                  Пока ни один студент не сдал работу
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
