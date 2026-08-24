"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  FileCheck2,
  Plus,
  Search,
  Building2,
  BookOpen,
  User,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  FolderKanban,
  Send,
  PlusCircle,
  HelpCircle,
  Award,
  Eye,
  FileText,
  Check,
  Pencil,
  LayoutGrid,
  List,
  Sparkles,
  BarChart3,
  Users,
  Percent,
} from "lucide-react";
import {
  GroupItemDTO,
  GroupSubjectDTO,
  TestDTO,
  TestQuestionDTO,
  TestSubmissionDTO,
  createTestAction,
  submitTestAnswersAction,
  deleteTestAction,
} from "@/app/dashboard/lms/actions";

interface TestsViewProps {
  groups: GroupItemDTO[];
  subjects: GroupSubjectDTO[];
  topics: Array<{ id: string; title: string }>;
  tests: TestDTO[];
  selectedGroupId: string;
  selectedTopicId: string;
  canCreate: boolean;
  userRole: string;
}

interface QuestionDraft {
  questionText: string;
  options: string[];
  correctAnswer: string;
  points: number;
}

export function TestsView({
  groups,
  subjects,
  topics,
  tests,
  selectedGroupId,
  selectedTopicId,
  canCreate,
}: TestsViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Student Test Taking State
  const [activeTest, setActiveTest] = useState<TestDTO | null>(null);
  const [studentAnswers, setStudentAnswers] = useState<Record<string, string>>({});
  const [testResult, setTestResult] = useState<{ score: number; maxScore: number } | null>(null);

  // Teacher Submissions View Modal State
  const [viewSubmissionsTest, setViewSubmissionsTest] = useState<TestDTO | null>(null);
  const [submissionSearch, setSubmissionSearch] = useState("");

  // Delete Test Confirmation State
  const [deleteTargetTest, setDeleteTargetTest] = useState<TestDTO | null>(null);

  // Quick Create Test Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newGroupSubjectId, setNewGroupSubjectId] = useState(subjects[0]?.id || "");
  const [newTopicId, setNewTopicId] = useState<string>("");
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newTimeLimit, setNewTimeLimit] = useState<number | "">(15);
  const [questionDrafts, setQuestionDrafts] = useState<QuestionDraft[]>([
    {
      questionText: "",
      options: ["Вариант 1", "Вариант 2", "Вариант 3", "Вариант 4"],
      correctAnswer: "Вариант 1",
      points: 1,
    },
  ]);

  const currentGroupObj = groups.find((g) => g.id === selectedGroupId);

  const handleGroupChange = (val: string) => {
    router.push(`/dashboard/lms/tests?group=${val}`);
  };

  const handleTopicChange = (val: string) => {
    const topicParam = val === "all" ? "" : `&topic=${val}`;
    router.push(`/dashboard/lms/tests?group=${selectedGroupId}${topicParam}`);
  };

  // Add & Edit Question Drafts
  const handleAddQuestionDraft = () => {
    setQuestionDrafts((prev) => [
      ...prev,
      {
        questionText: "",
        options: ["Вариант 1", "Вариант 2"],
        correctAnswer: "Вариант 1",
        points: 1,
      },
    ]);
  };

  const handleRemoveQuestionDraft = (qIdx: number) => {
    if (questionDrafts.length === 1) return;
    setQuestionDrafts((prev) => prev.filter((_, idx) => idx !== qIdx));
  };

  const handleUpdateQuestionText = (qIdx: number, text: string) => {
    setQuestionDrafts((prev) => {
      const copy = [...prev];
      copy[qIdx].questionText = text;
      return copy;
    });
  };

  const handleUpdateOption = (qIdx: number, optIdx: number, text: string) => {
    setQuestionDrafts((prev) => {
      const copy = [...prev];
      const oldVal = copy[qIdx].options[optIdx];
      copy[qIdx].options[optIdx] = text;

      if (copy[qIdx].correctAnswer === oldVal) {
        copy[qIdx].correctAnswer = text;
      }
      return copy;
    });
  };

  const handleAddOption = (qIdx: number) => {
    setQuestionDrafts((prev) => {
      const copy = [...prev];
      copy[qIdx].options.push(`Вариант ${copy[qIdx].options.length + 1}`);
      return copy;
    });
  };

  const handleSetCorrectAnswer = (qIdx: number, answerText: string) => {
    setQuestionDrafts((prev) => {
      const copy = [...prev];
      copy[qIdx].correctAnswer = answerText;
      return copy;
    });
  };

  // Submit Create Test
  const handleCreateTest = () => {
    if (!newGroupSubjectId || !newTitle.trim()) {
      setErrorMsg("Укажите дисциплину и заголовок теста");
      return;
    }

    const invalidQ = questionDrafts.find((q) => !q.questionText.trim() || !q.correctAnswer.trim());
    if (invalidQ) {
      setErrorMsg("Заполните тексты вопросов и выберите правильные ответы");
      return;
    }

    setErrorMsg(null);
    startTransition(async () => {
      const res = await createTestAction({
        groupSubjectId: newGroupSubjectId,
        topicId: newTopicId || undefined,
        title: newTitle,
        description: newDescription,
        timeLimit: newTimeLimit ? Number(newTimeLimit) : undefined,
        questions: questionDrafts,
      });

      if (res.success) {
        setSuccessMsg("Тест успешно создан и опубликован!");
        setIsCreateOpen(false);
        setNewTitle("");
        setNewDescription("");
        setQuestionDrafts([
          {
            questionText: "",
            options: ["Вариант 1", "Вариант 2"],
            correctAnswer: "Вариант 1",
            points: 1,
          },
        ]);
        router.refresh();
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setErrorMsg(res.error || "Ошибка при создании теста");
      }
    });
  };

  // Student Submit Test Answers
  const handleStudentSubmitTest = () => {
    if (!activeTest) return;

    setErrorMsg(null);
    startTransition(async () => {
      const res = await submitTestAnswersAction({
        testId: activeTest.id,
        answers: studentAnswers,
      });

      if (res.success && res.score !== undefined && res.maxScore !== undefined) {
        setTestResult({ score: res.score, maxScore: res.maxScore });
        router.refresh();
      } else {
        setErrorMsg(res.error || "Ошибка при отправке ответов");
      }
    });
  };

  // Delete Test
  const handleConfirmDeleteTest = () => {
    if (!deleteTargetTest) return;
    const testId = deleteTargetTest.id;
    setDeleteTargetTest(null);

    setErrorMsg(null);
    startTransition(async () => {
      const res = await deleteTestAction(testId);
      if (res.success) {
        setSuccessMsg("Тест удален");
        router.refresh();
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setErrorMsg(res.error || "Не удалось удалить тест");
      }
    });
  };

  // Filtered Tests
  const filteredTests = tests.filter((t) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !query ||
      t.title.toLowerCase().includes(query) ||
      t.subjectName.toLowerCase().includes(query) ||
      (t.topicTitle && t.topicTitle.toLowerCase().includes(query));

    const matchesSubject = subjectFilter === "all" || t.groupSubjectId === subjectFilter;

    return matchesQuery && matchesSubject;
  });

  // Calculate Overall Statistics for Header Metrics
  const totalTests = tests.length;
  const totalSubmissions = tests.reduce((acc, t) => acc + t.submissionsCount, 0);
  const totalGradedSubmissions = tests.flatMap((t) => t.submissions);
  const avgPassRate =
    totalGradedSubmissions.length > 0
      ? Math.round(
          (totalGradedSubmissions.reduce(
            (acc, s) => acc + (s.maxScore > 0 ? s.score / s.maxScore : 0),
            0
          ) /
            totalGradedSubmissions.length) *
            100
        )
      : 0;

  return (
    <div className="space-y-3">
      {/* Top Banner & KPI Stat Summary */}
      <div className="bg-card p-3 rounded-xl border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <FileCheck2 className="h-4 w-4" />
            </div>
            <h1 className="text-sm font-bold text-foreground flex items-center gap-2 truncate">
              Тесты и аттестация LMS
            </h1>
            <Badge variant="outline" className="text-[10px] border-primary/30 text-primary bg-primary/5 font-semibold px-2 py-0">
              {currentGroupObj?.name || "Все группы"}
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground leading-tight">
            Автоматическая проверка знаний, конструктор вариантов и сводные ведомости результатов
          </p>
        </div>

        {/* Quick KPI Stat Chips */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap" data-tour="tests-header-stats">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/50 border text-[11px]">
            <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-muted-foreground">Тестов:</span>
            <span className="font-bold text-foreground">{totalTests}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/50 border text-[11px]">
            <Users className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-muted-foreground">Сдано работ:</span>
            <span className="font-bold text-foreground">{totalSubmissions}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-[11px]">
            <Percent className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-primary font-medium">Успеваемость:</span>
            <span className="font-bold text-primary">{avgPassRate}%</span>
          </div>

          {canCreate && (
            <div className="flex items-center gap-1.5" data-tour="tests-create-btn">
              <Link href={`/dashboard/lms/tests/new?group=${selectedGroupId}&topic=${selectedTopicId}`}>
                <Button size="xs" className="h-8 text-xs gap-1.5 font-medium px-3">
                  <Plus className="h-3.5 w-3.5" /> Конструктор
                </Button>
              </Link>

              <Button
                size="xs"
                variant="outline"
                onClick={() => setIsCreateOpen(true)}
                className="h-8 text-xs gap-1 border-primary/30 text-primary hover:bg-primary/10 font-medium px-2.5"
                title="Быстрое создание теста"
              >
                <Sparkles className="h-3.5 w-3.5" /> Быстрый тест
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Control & Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2 bg-card p-2.5 rounded-xl border items-center" data-tour="tests-filters">
        {/* Group Selector */}
        <div className="lg:col-span-3">
          <Select value={selectedGroupId} onValueChange={handleGroupChange}>
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

        {/* Topic Filter */}
        <div className="lg:col-span-3">
          <Select value={selectedTopicId || "all"} onValueChange={handleTopicChange}>
            <SelectTrigger className="h-8 text-xs bg-background font-medium">
              <div className="flex items-center gap-1.5 truncate">
                <FolderKanban className="h-3.5 w-3.5 text-primary shrink-0" />
                <SelectValue>
                  {topics.find((t) => t.id === selectedTopicId)?.title || "Все темы"}
                </SelectValue>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs font-medium">
                Все темы
              </SelectItem>
              {topics.map((t) => (
                <SelectItem key={t.id} value={t.id} className="text-xs">
                  {t.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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

      {/* Alerts */}
      {successMsg && (
        <div className="p-2.5 rounded-lg border border-primary/30 bg-primary/10 text-primary text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-2.5 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* VIEW MODE 1: Compact Table View (Default) */}
      {viewMode === "table" ? (
        <div className="bg-card rounded-xl border shadow-xs overflow-hidden" data-tour="tests-list">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b bg-muted/40 text-[11px] text-muted-foreground font-semibold">
                  <th className="py-2.5 px-3">Название теста / Тема</th>
                  <th className="py-2.5 px-3">Дисциплина / Преподаватель</th>
                  <th className="py-2.5 px-3 text-center">Вопросы & Баллы</th>
                  <th className="py-2.5 px-3 text-center">Таймер</th>
                  <th className="py-2.5 px-3 text-center">Результаты</th>
                  <th className="py-2.5 px-3 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredTests.map((test) => {
                  const userSub = test.userSubmission;
                  const userPercent =
                    userSub && userSub.maxScore > 0
                      ? Math.round((userSub.score / userSub.maxScore) * 100)
                      : 0;

                  return (
                    <tr key={test.id} className="hover:bg-muted/30 transition-colors">
                      {/* Title & Topic */}
                      <td className="py-2.5 px-3 max-w-[280px]">
                        <Link
                          href={canCreate ? `/dashboard/lms/tests/${test.id}/results` : `/dashboard/lms/tests/${test.id}/take`}
                          className="font-bold text-foreground hover:text-primary transition-colors text-xs truncate flex items-center gap-1.5"
                        >
                          <FileCheck2 className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span className="truncate">{test.title}</span>
                        </Link>
                        <div className="text-[10px] text-muted-foreground truncate pt-0.5">
                          {test.topicTitle ? `Тема: ${test.topicTitle}` : test.description || "Без привязки к теме"}
                        </div>
                      </td>

                      {/* Subject & Teacher */}
                      <td className="py-2.5 px-3 max-w-[200px]">
                        <Badge
                          variant="outline"
                          className="text-[10px] border-primary/30 text-primary bg-primary/5 font-medium px-1.5 py-0 truncate"
                        >
                          {test.subjectName}
                        </Badge>
                        <div className="text-[10px] text-muted-foreground truncate pt-0.5 flex items-center gap-1">
                          <User className="h-3 w-3 shrink-0" /> {test.teacherName}
                        </div>
                      </td>

                      {/* Questions & Total Points */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="font-medium text-foreground text-xs">
                          {test.questionsCount} вопр.
                        </div>
                        <div className="text-[10px] text-muted-foreground font-semibold">
                          {test.totalPoints} б.
                        </div>
                      </td>

                      {/* Time Limit */}
                      <td className="py-2.5 px-3 text-center">
                        {test.timeLimit ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-foreground bg-muted/60 px-2 py-0.5 rounded-md border">
                            <Clock className="h-3 w-3 text-primary shrink-0" /> {test.timeLimit} мин.
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground italic">Без лимита</span>
                        )}
                      </td>

                      {/* Results / Submissions Badge */}
                      <td className="py-2.5 px-3 text-center">
                        {canCreate ? (
                          <Link href={`/dashboard/lms/tests/${test.id}/results`}>
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 font-bold text-[11px] hover:bg-primary/20 transition-colors">
                              <FileText className="h-3.5 w-3.5" />
                              <span>{test.submissionsCount} работ</span>
                            </span>
                          </Link>
                        ) : userSub ? (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-primary/10 text-primary font-bold text-[10px]">
                            <CheckCircle2 className="h-3 w-3 shrink-0" />
                            <span>{userSub.score}/{userSub.maxScore} б. ({userPercent}%)</span>
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground font-normal">
                            Не пройден
                          </Badge>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {canCreate ? (
                            <>
                              <Link href={`/dashboard/lms/tests/${test.id}/results`}>
                                <Button
                                  size="xs"
                                  variant="outline"
                                  className="h-7 text-xs gap-1 font-medium border-primary/30 text-primary hover:bg-primary/10 px-2"
                                  title="Сданные работы и матрица результатов"
                                >
                                  <FileText className="h-3.5 w-3.5" />
                                  <span className="hidden md:inline">Работы</span>
                                </Button>
                              </Link>

                              <Link href={`/dashboard/lms/tests/${test.id}/take`}>
                                <Button
                                  size="xs"
                                  variant="outline"
                                  className="h-7 w-7 p-0 text-muted-foreground hover:text-primary hover:border-primary/50"
                                  title="Просмотр теста"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                              </Link>

                              <Link href={`/dashboard/lms/tests/${test.id}/edit`}>
                                <Button
                                  size="xs"
                                  variant="outline"
                                  className="h-7 w-7 p-0 text-muted-foreground hover:text-primary hover:border-primary/50"
                                  title="Редактировать тест"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              </Link>

                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={() => setDeleteTargetTest(test)}
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                title="Удалить тест"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          ) : (
                            <Link href={`/dashboard/lms/tests/${test.id}/take`}>
                              <Button size="xs" className="h-7 text-xs gap-1.5 font-medium px-2.5">
                                {userSub ? (
                                  <>
                                    <Eye className="h-3.5 w-3.5" /> Результат
                                  </>
                                ) : (
                                  <>
                                    <Send className="h-3.5 w-3.5" /> Пройти тест
                                  </>
                                )}
                              </Button>
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredTests.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-muted-foreground text-xs bg-muted/10 space-y-1">
                      <FileCheck2 className="h-8 w-8 text-muted-foreground/30 mx-auto" />
                      <p className="font-semibold text-foreground">Тесты не найдены</p>
                      <p className="text-[11px] text-muted-foreground">Измените критерии поиска или добавьте новый тест</p>
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
          {filteredTests.map((test) => {
            const userSub = test.userSubmission;
            const userPercent =
              userSub && userSub.maxScore > 0
                ? Math.round((userSub.score / userSub.maxScore) * 100)
                : 0;

            return (
              <Card
                key={test.id}
                className="p-3 border shadow-none hover:border-primary/50 transition-all duration-200 flex flex-col justify-between space-y-2.5 bg-card rounded-xl group relative"
              >
                {/* Subject & Time */}
                <div className="flex items-center justify-between gap-2 border-b pb-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <FileCheck2 className="h-3.5 w-3.5" />
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[10px] border-primary/30 text-primary bg-primary/5 font-semibold px-1.5 py-0 truncate"
                    >
                      {test.subjectName}
                    </Badge>
                  </div>

                  {test.timeLimit ? (
                    <span className="text-[10px] font-medium text-foreground bg-muted/60 px-1.5 py-0.5 rounded-md shrink-0 flex items-center gap-1 border">
                      <Clock className="h-3 w-3 text-primary shrink-0" /> {test.timeLimit} мин.
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground italic shrink-0">Без лимита</span>
                  )}
                </div>

                {/* Title & Stats */}
                <div className="space-y-1 flex-1">
                  <h3 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {test.title}
                  </h3>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 leading-tight">
                    {test.description || "Тестовые вопросы для проверки знаний по теме..."}
                  </p>

                  <div className="flex items-center gap-2 text-[10px] pt-1">
                    <span className="font-medium text-foreground bg-muted/40 px-2 py-0.5 rounded-md border">
                      {test.questionsCount} вопр.
                    </span>
                    <span className="font-medium text-foreground bg-muted/40 px-2 py-0.5 rounded-md border">
                      {test.totalPoints} баллов
                    </span>
                    {test.topicTitle && (
                      <span className="text-muted-foreground truncate max-w-[110px]">
                        Тема: {test.topicTitle}
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between gap-2 border-t pt-2">
                  {canCreate ? (
                    <div className="flex items-center justify-between w-full gap-2">
                      <Link href={`/dashboard/lms/tests/${test.id}/results`}>
                        <Button
                          size="xs"
                          variant="outline"
                          className="h-7 text-xs gap-1 font-medium border-primary/30 text-primary hover:bg-primary/10 px-2"
                        >
                          <FileText className="h-3.5 w-3.5 text-primary" />
                          Работы ({test.submissionsCount})
                        </Button>
                      </Link>

                      <div className="flex items-center gap-1">
                        <Link href={`/dashboard/lms/tests/${test.id}/take`}>
                          <Button
                            size="xs"
                            variant="outline"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-primary hover:border-primary/50"
                            title="Просмотр"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        <Link href={`/dashboard/lms/tests/${test.id}/edit`}>
                          <Button
                            size="xs"
                            variant="outline"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-primary hover:border-primary/50"
                            title="Редактировать"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => setDeleteTargetTest(test)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          title="Удалить"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between w-full gap-2">
                      {userSub ? (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-primary/10 text-primary font-bold text-[10px]">
                          <CheckCircle2 className="h-3 w-3 shrink-0" />
                          <span>{userSub.score}/{userSub.maxScore} б. ({userPercent}%)</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-muted-foreground italic">Не пройден</span>
                      )}

                      <Link href={`/dashboard/lms/tests/${test.id}/take`}>
                        <Button size="xs" className="h-7 text-xs gap-1 font-medium px-2.5">
                          {userSub ? "Результат" : "Пройти тест"}
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}

          {filteredTests.length === 0 && (
            <div className="col-span-full py-10 text-center text-muted-foreground text-xs bg-card border rounded-xl space-y-1">
              <FileCheck2 className="h-8 w-8 text-muted-foreground/30 mx-auto" />
              <p className="font-semibold text-foreground">Тесты не найдены</p>
            </div>
          )}
        </div>
      )}

      {/* Modal 1: Student Interactive Test Taking Dialog */}
      <Dialog open={activeTest !== null} onOpenChange={(open) => !open && setActiveTest(null)}>
        {activeTest && (
          <DialogContent className="p-4 gap-3 text-xs sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
            <DialogHeader className="pb-2 border-b gap-1 place-items-start text-left">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] border-primary/30 text-primary font-medium">
                  {activeTest.subjectName}
                </Badge>
                {activeTest.timeLimit && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium bg-muted/60 px-2 py-0.5 rounded-md border">
                    <Clock className="h-3 w-3 text-primary" /> Таймер: {activeTest.timeLimit} мин.
                  </span>
                )}
              </div>
              <DialogTitle className="text-sm font-bold text-foreground pt-1">
                {activeTest.title}
              </DialogTitle>
              <DialogDescription className="text-[11px] text-muted-foreground">
                Вопросов: {activeTest.questionsCount} • Всего баллов: {activeTest.totalPoints}
              </DialogDescription>
            </DialogHeader>

            {testResult ? (
              <div className="py-6 text-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                  <Award className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-bold text-foreground">Тест успешно завершён!</h3>
                <div className="text-xs font-semibold text-primary">
                  Ваш результат: {testResult.score} из {testResult.maxScore} баллов (
                  {Math.round((testResult.score / (testResult.maxScore || 1)) * 100)}%)
                </div>
                <Button size="xs" onClick={() => setActiveTest(null)} className="h-7 px-4 text-xs font-medium">
                  Отлично, закрыть
                </Button>
              </div>
            ) : (
              <div className="space-y-3 py-1 text-xs">
                {activeTest.questions.map((q: TestQuestionDTO, idx: number) => {
                  const qType = q.type || "SINGLE";

                  return (
                    <div key={q.id} className="p-3 border rounded-xl bg-card space-y-2">
                      <div className="flex items-start justify-between gap-2 border-b pb-1.5">
                        <div className="space-y-0.5">
                          <span className="font-bold text-foreground text-xs block">
                            Вопрос #{idx + 1}: {q.questionText}
                          </span>
                        </div>
                        <Badge variant="secondary" className="text-[9px] shrink-0 font-normal">
                          +{q.points} б.
                        </Badge>
                      </div>

                      {qType === "TEXT" ? (
                        <div className="space-y-1 pt-1">
                          <Input
                            placeholder="Ваш ответ..."
                            value={studentAnswers[q.id] || ""}
                            onChange={(e) =>
                              setStudentAnswers((prev) => ({
                                ...prev,
                                [q.id]: e.target.value,
                              }))
                            }
                            className="h-8 text-xs bg-background font-medium"
                          />
                        </div>
                      ) : (
                        <div className="space-y-1 pt-1">
                          {q.options.map((opt: string, optIdx: number) => {
                            let isSelected = false;

                            if (qType === "MULTIPLE") {
                              try {
                                const selectedArr: string[] = JSON.parse(studentAnswers[q.id] || "[]");
                                isSelected = Array.isArray(selectedArr) && selectedArr.includes(opt);
                              } catch {
                                isSelected = false;
                              }
                            } else {
                              isSelected = studentAnswers[q.id] === opt;
                            }

                            const handleOptionClick = () => {
                              if (qType === "MULTIPLE") {
                                let currentArr: string[] = [];
                                try {
                                  currentArr = JSON.parse(studentAnswers[q.id] || "[]");
                                  if (!Array.isArray(currentArr)) currentArr = [];
                                } catch {
                                  currentArr = [];
                                }

                                if (currentArr.includes(opt)) {
                                  currentArr = currentArr.filter((item) => item !== opt);
                                } else {
                                  currentArr.push(opt);
                                }

                                setStudentAnswers((prev) => ({
                                  ...prev,
                                  [q.id]: JSON.stringify(currentArr),
                                }));
                              } else {
                                setStudentAnswers((prev) => ({
                                  ...prev,
                                  [q.id]: opt,
                                }));
                              }
                            };

                            return (
                              <div
                                key={optIdx}
                                onClick={handleOptionClick}
                                className={`p-2 rounded-lg border text-xs cursor-pointer transition-all flex items-center gap-2 ${
                                  isSelected
                                    ? "border-primary bg-primary/10 text-primary font-medium"
                                    : "border-border hover:bg-muted/40 font-normal"
                                }`}
                              >
                                <div
                                  className={`h-3.5 w-3.5 rounded-${qType === "MULTIPLE" ? "md" : "full"} border flex items-center justify-center shrink-0 ${
                                    isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"
                                  }`}
                                >
                                  {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                                </div>
                                <span>{opt}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}

                <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
                  <Button variant="outline" size="xs" onClick={() => setActiveTest(null)}>
                    Отмена
                  </Button>
                  <Button size="xs" disabled={isPending} onClick={handleStudentSubmitTest}>
                    Завершить и отправить
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        )}
      </Dialog>

      {/* Modal 2: Quick Test Builder Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="p-4 gap-3 text-xs sm:max-w-[620px] max-h-[88vh] overflow-y-auto">
          <DialogHeader className="pb-2 border-b gap-1 place-items-start text-left">
            <DialogTitle className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Plus className="h-4 w-4 text-primary" /> Экспресс-конструктор теста
            </DialogTitle>
            <DialogDescription className="text-xs">
              Быстрое создание теста без перехода на отдельную страницу
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-1 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="space-y-1">
                <label className="font-medium text-foreground text-xs">Дисциплина</label>
                <Select value={newGroupSubjectId} onValueChange={setNewGroupSubjectId}>
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue>{subjects.find((s) => s.id === newGroupSubjectId)?.subjectName || "Выберите предмет"}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={s.id} className="text-xs">
                        {s.subjectName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground text-xs">Тема</label>
                <Select value={newTopicId} onValueChange={setNewTopicId}>
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue>{topics.find((t) => t.id === newTopicId)?.title || "Без темы"}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-xs">
                      Без темы
                    </SelectItem>
                    {topics.map((t) => (
                      <SelectItem key={t.id} value={t.id} className="text-xs">
                        {t.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground text-xs">Таймер (мин)</label>
                <Input
                  type="number"
                  placeholder="15"
                  value={newTimeLimit}
                  onChange={(e) => setNewTimeLimit(e.target.value ? Number(e.target.value) : "")}
                  className="h-8 text-xs bg-background font-medium"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground text-xs">Название теста</label>
              <Input
                placeholder="Например: Проверочный тест по модулю №1"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="h-8 text-xs bg-background font-medium"
              />
            </div>

            {/* Question Drafts */}
            <div className="space-y-2.5 pt-2 border-t">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-foreground text-xs flex items-center gap-1">
                  Вопросы ({questionDrafts.length})
                </label>

                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={handleAddQuestionDraft}
                  className="h-6 px-2 text-[10px] gap-1 text-primary border-primary/30 hover:bg-primary/10 font-medium"
                >
                  <PlusCircle className="h-3 w-3" /> Добавить вопрос
                </Button>
              </div>

              {questionDrafts.map((q, qIdx) => (
                <div key={qIdx} className="p-2.5 border rounded-xl bg-card space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs text-foreground">Вопрос #{qIdx + 1}</span>
                    {questionDrafts.length > 1 && (
                      <Button
                        type="button"
                        size="xs"
                        variant="ghost"
                        onClick={() => handleRemoveQuestionDraft(qIdx)}
                        className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>

                  <Input
                    placeholder="Формулировка вопроса..."
                    value={q.questionText}
                    onChange={(e) => handleUpdateQuestionText(qIdx, e.target.value)}
                    className="h-8 text-xs bg-background font-medium"
                  />

                  <div className="space-y-1 pt-0.5">
                    <div className="text-[10px] text-muted-foreground font-medium flex items-center justify-between">
                      <span>Варианты ответов (нажмите для отметки правильного):</span>
                      <button
                        type="button"
                        onClick={() => handleAddOption(qIdx)}
                        className="text-primary hover:underline text-[10px] font-medium"
                      >
                        + Вариант
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {q.options.map((opt, optIdx) => {
                        const isCorrect = q.correctAnswer === opt;

                        return (
                          <div key={optIdx} className="flex items-center gap-1">
                            <Input
                              value={opt}
                              onChange={(e) => handleUpdateOption(qIdx, optIdx, e.target.value)}
                              className={`h-7 text-xs bg-background ${isCorrect ? "border-primary font-medium text-primary" : ""}`}
                            />
                            <Button
                              type="button"
                              size="xs"
                              variant={isCorrect ? "default" : "outline"}
                              onClick={() => handleSetCorrectAnswer(qIdx, opt)}
                              className="h-7 text-[10px] px-2 shrink-0 font-medium"
                            >
                              {isCorrect ? "Верно" : "Выбор"}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
            <Button variant="outline" size="xs" onClick={() => setIsCreateOpen(false)}>
              Отмена
            </Button>
            <Button size="xs" disabled={isPending} onClick={handleCreateTest}>
              Опубликовать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal 3: Teacher View Submissions & Detailed Results Dialog */}
      <Dialog open={viewSubmissionsTest !== null} onOpenChange={(open) => !open && setViewSubmissionsTest(null)}>
        {viewSubmissionsTest && (
          <DialogContent className="p-4 gap-3 text-xs sm:max-w-[700px] max-h-[88vh] overflow-y-auto">
            <DialogHeader className="pb-2 border-b gap-1 place-items-start text-left">
              <div className="flex items-center justify-between w-full">
                <Badge variant="outline" className="text-[10px] border-primary/30 text-primary bg-primary/5 font-semibold">
                  {viewSubmissionsTest.subjectName}
                </Badge>
                <span className="text-[11px] text-muted-foreground">
                  {viewSubmissionsTest.questionsCount} вопросов • Макс. {viewSubmissionsTest.totalPoints} баллов
                </span>
              </div>
              <DialogTitle className="text-sm font-bold text-foreground pt-0.5">
                Ведомость сдачи: {viewSubmissionsTest.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Результаты и оценки студентов по данному тестированию
              </DialogDescription>
            </DialogHeader>

            {/* Quick Summary KPI Cards */}
            {viewSubmissionsTest.submissions.length > 0 && (
              <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-muted/40 border text-center">
                <div className="space-y-0.5">
                  <div className="text-[10px] text-muted-foreground">Сдано работ</div>
                  <div className="text-sm font-bold text-primary">{viewSubmissionsTest.submissions.length} чел.</div>
                </div>
                <div className="space-y-0.5 border-x">
                  <div className="text-[10px] text-muted-foreground">Средний балл</div>
                  <div className="text-sm font-bold text-foreground">
                    {Math.round(
                      (viewSubmissionsTest.submissions.reduce((acc, s) => acc + s.score, 0) /
                        viewSubmissionsTest.submissions.length) *
                        10
                    ) / 10}{" "}
                    / {viewSubmissionsTest.totalPoints}
                  </div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-[10px] text-muted-foreground">Успеваемость</div>
                  <div className="text-sm font-bold text-primary">
                    {Math.round(
                      (viewSubmissionsTest.submissions.reduce(
                        (acc, s) => acc + (s.maxScore > 0 ? s.score / s.maxScore : 0),
                        0
                      ) /
                        viewSubmissionsTest.submissions.length) *
                        100
                    )}
                    %
                  </div>
                </div>
              </div>
            )}

            {/* Student Search Filter */}
            {viewSubmissionsTest.submissions.length > 0 && (
              <div className="relative pt-1">
                <Search className="h-3.5 w-3.5 absolute left-2.5 top-3.5 text-muted-foreground" />
                <Input
                  placeholder="Поиск по имени студента..."
                  value={submissionSearch}
                  onChange={(e) => setSubmissionSearch(e.target.value)}
                  className="h-8 text-xs pl-8 bg-background"
                />
              </div>
            )}

            {/* Submissions List */}
            <div className="space-y-2 py-1 text-xs max-h-[360px] overflow-y-auto pr-1">
              {viewSubmissionsTest.submissions
                .filter((sub) =>
                  !submissionSearch ||
                  sub.studentName.toLowerCase().includes(submissionSearch.toLowerCase())
                )
                .map((sub: TestSubmissionDTO) => {
                  const percent = sub.maxScore > 0 ? Math.round((sub.score / sub.maxScore) * 100) : 0;

                  return (
                    <div
                      key={sub.id}
                      className="p-2.5 rounded-xl border bg-card hover:border-primary/40 transition-colors flex items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
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

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right space-y-0.5">
                          <div className="text-xs font-bold text-foreground">
                            {sub.score} / {sub.maxScore} б.
                          </div>
                          <div className="text-[10px] text-muted-foreground font-medium">
                            {percent}% выполнения
                          </div>
                        </div>

                        <Badge
                          variant="outline"
                          className={`text-[10px] font-semibold border px-2 py-0.5 ${
                            percent >= 75
                              ? "bg-primary/15 text-primary border-primary/30"
                              : percent >= 50
                                ? "bg-primary/10 text-primary border-primary/20"
                                : "bg-destructive/10 text-destructive border-destructive/30"
                          }`}
                        >
                          {percent >= 75 ? "Отлично" : percent >= 50 ? "Зачтено" : "Незачёт"}
                        </Badge>
                      </div>
                    </div>
                  );
                })}

              {viewSubmissionsTest.submissions.length === 0 && (
                <div className="py-8 text-center text-muted-foreground text-xs space-y-1 bg-muted/20 border rounded-xl">
                  <FileCheck2 className="h-7 w-7 text-muted-foreground/30 mx-auto" />
                  <p className="font-semibold text-foreground">Пока нет сданных работ</p>
                  <p className="text-[11px]">Студенты вашей группы ещё не проходили данный тест</p>
                </div>
              )}
            </div>

            <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
              <Button size="xs" variant="outline" onClick={() => setViewSubmissionsTest(null)}>
                Закрыть
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Delete Test Confirmation AlertDialog */}
      <AlertDialog
        open={Boolean(deleteTargetTest)}
        onOpenChange={(open) => !open && setDeleteTargetTest(null)}
      >
        <AlertDialogContent className="p-4 gap-3 text-xs sm:max-w-[400px] place-items-start text-left">
          <AlertDialogHeader className="text-left gap-1">
            <AlertDialogTitle className="text-sm font-bold flex items-center gap-1.5 text-foreground">
              <Trash2 className="h-4 w-4 text-destructive" /> Удалить тест?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Вы действительно хотите удалить тест{" "}
              <strong className="text-foreground">«{deleteTargetTest?.title}»</strong>?
              Все вопросы и результаты сдачи студентов также будут удалены.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2 w-full">
            <AlertDialogCancel className="h-6 px-2.5 text-xs">
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteTest}
              className="h-6 px-2.5 text-xs bg-destructive text-white hover:bg-destructive/90 font-medium"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
