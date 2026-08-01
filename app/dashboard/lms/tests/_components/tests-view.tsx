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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Student Test Taking State
  const [activeTest, setActiveTest] = useState<TestDTO | null>(null);
  const [studentAnswers, setStudentAnswers] = useState<Record<string, string>>({});
  const [testResult, setTestResult] = useState<{ score: number; maxScore: number } | null>(null);

  // Teacher Submissions View Modal
  const [viewSubmissionsTest, setViewSubmissionsTest] = useState<TestDTO | null>(null);

  // Create Test Builder State
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

      // if correctAnswer was set to this old option, update it
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
  const handleDeleteTest = (id: string) => {
    if (!confirm("Вы уверены, что хотите удалить этот тест со всеми результатами?")) return;

    startTransition(async () => {
      const res = await deleteTestAction(id);
      if (res.success) {
        setSuccessMsg("Тест удален");
        router.refresh();
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setErrorMsg(res.error || "Не удалось удалить тест");
      }
    });
  };

  const filteredTests = tests.filter((t) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return t.title.toLowerCase().includes(query) || t.subjectName.toLowerCase().includes(query);
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-4 rounded-xl border shadow-xs">
        <div className="space-y-0.5">
          <h1 className="text-base font-bold text-foreground flex items-center gap-2">
            <FileCheck2 className="h-5 w-5 text-primary" /> Тесты и Онлайн-Опросы LMS
          </h1>
          <p className="text-xs text-muted-foreground">
            Автоматическая система проверки знаний студента, мгновенный подсчёт баллов и статистика
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canCreate && (
            <Button
              size="xs"
              onClick={() => {
                setIsCreateOpen(true);
                setNewGroupSubjectId(subjects[0]?.id || "");
              }}
              className="h-8 text-xs gap-1.5 font-medium"
            >
              <Plus className="h-3.5 w-3.5" /> Конструктор тестов
            </Button>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-card p-3 rounded-xl border items-center">
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
            <Building2 className="h-3.5 w-3.5 text-primary" /> Группа
          </label>
          <Select value={selectedGroupId} onValueChange={handleGroupChange}>
            <SelectTrigger className="h-8 text-xs font-semibold bg-background">
              <SelectValue>{currentGroupObj?.name || "Выберите группу"}</SelectValue>
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

        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
            <FolderKanban className="h-3.5 w-3.5 text-primary" /> Тема
          </label>
          <Select value={selectedTopicId || "all"} onValueChange={handleTopicChange}>
            <SelectTrigger className="h-8 text-xs font-semibold bg-background">
              <SelectValue>
                {topics.find((t) => t.id === selectedTopicId)?.title || "Все темы"}
              </SelectValue>
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

        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground">Поиск по названию</label>
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Название теста..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 text-xs pl-8 bg-background"
            />
          </div>
        </div>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="p-3 rounded-lg border border-primary/30 bg-primary/10 text-primary text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tests Compact Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredTests.map((test) => {
          const userSub = test.userSubmission;

          return (
            <Card
              key={test.id}
              className="p-3.5 border shadow-none hover:border-primary/50 hover:shadow-xs transition-all duration-200 flex flex-col justify-between space-y-3 bg-card rounded-xl group"
            >
              {/* Header */}
              <div className="flex items-center justify-between gap-2 border-b pb-2">
                <Badge variant="outline" className="text-[10px] border-primary/30 text-primary bg-primary/5 font-medium px-2 py-0.5 shrink-0">
                  {test.subjectName}
                </Badge>

                {test.timeLimit ? (
                  <span className="text-[11px] text-muted-foreground font-normal flex items-center gap-1 shrink-0 bg-muted/60 px-2 py-0.5 rounded-md">
                    <Clock className="h-3 w-3 text-primary shrink-0" /> {test.timeLimit} мин.
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-foreground italic">Без времени</span>
                )}
              </div>

              {/* Title & Stats */}
              <div className="space-y-1 flex-1">
                <h3 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                  {test.title}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed font-normal">
                  {test.description || "Тестовые вопросы для самопроверки и аттестации..."}
                </p>
                <div className="text-[11px] text-muted-foreground pt-1 flex items-center gap-2">
                  <span className="flex items-center gap-1 font-medium">
                    <HelpCircle className="h-3 w-3 text-primary" /> {test.questionsCount} вопросов
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-medium">
                    <Award className="h-3 w-3 text-primary" /> {test.totalPoints} баллов
                  </span>
                </div>
              </div>

              {/* Author Info */}
              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/50">
                <span className="flex items-center gap-1 truncate max-w-[130px]">
                  <User className="h-3 w-3 text-muted-foreground shrink-0" /> {test.teacherName}
                </span>

                {test.topicTitle && (
                  <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                    Тема: {test.topicTitle}
                  </span>
                )}
              </div>

              {/* Footer / Actions */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50">
                {canCreate ? (
                  /* Teacher / Admin Controls */
                  <div className="flex items-center justify-between w-full gap-2">
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => setViewSubmissionsTest(test)}
                      className="h-7 text-xs gap-1.5 font-medium"
                    >
                      <FileText className="h-3.5 w-3.5 text-primary" />
                      Результаты ({test.submissionsCount})
                    </Button>

                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => handleDeleteTest(test.id)}
                      className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                      title="Удалить тест"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  /* Student Controls */
                  <div className="flex items-center justify-between w-full gap-2">
                    {userSub ? (
                      <Badge
                        variant="outline"
                        className="text-[10px] font-medium border-0 bg-primary/10 text-primary px-2 py-0.5"
                      >
                        Результат: {userSub.score} / {userSub.maxScore} баллов
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground bg-muted/40 border-border/50">
                        Не пройден
                      </Badge>
                    )}

                    <Button
                      size="xs"
                      variant={userSub ? "outline" : "default"}
                      onClick={() => {
                        setActiveTest(test);
                        setStudentAnswers({});
                        setTestResult(null);
                      }}
                      className="h-7 text-xs gap-1.5 font-medium"
                    >
                      <Send className="h-3.5 w-3.5" />
                      {userSub ? "Перепройти" : "Пройти тест"}
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          );
        })}

        {filteredTests.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground text-xs bg-card border rounded-xl space-y-2">
            <FileCheck2 className="h-8 w-8 text-muted-foreground/40 mx-auto" />
            <p className="font-semibold text-foreground">Тесты не найдены</p>
            <p className="text-[11px] text-muted-foreground">По выбранной группе или теме пока нет опубликованных тестов</p>
          </div>
        )}
      </div>

      {/* Modal 1: Student Interactive Test Dialog */}
      <Dialog open={activeTest !== null} onOpenChange={(open) => !open && setActiveTest(null)}>
        {activeTest && (
          <DialogContent className="p-4 gap-3 text-xs sm:max-w-[620px] max-h-[85vh] overflow-y-auto">
            <DialogHeader className="pb-2 border-b gap-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] border-primary/30 text-primary font-medium">
                  {activeTest.subjectName}
                </Badge>
                {activeTest.timeLimit && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium bg-muted/60 px-2 py-0.5 rounded-md">
                    <Clock className="h-3 w-3 text-primary" /> Срок: {activeTest.timeLimit} мин.
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
              /* Test Completed Result View */
              <div className="py-6 text-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                  <Award className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-foreground">Тест успешно завершён!</h3>
                <div className="text-sm font-semibold text-primary">
                  Ваш результат: {testResult.score} из {testResult.maxScore} баллов (
                  {Math.round((testResult.score / (testResult.maxScore || 1)) * 100)}%)
                </div>
                <p className="text-xs text-muted-foreground">Результат автоматически сохранён в вашей успеваемости</p>
                <div className="pt-2">
                  <Button size="xs" onClick={() => setActiveTest(null)} className="h-8 px-4 text-xs font-medium">
                    Отлично, закрыть
                  </Button>
                </div>
              </div>
            ) : (
              /* Question list for student */
              <div className="space-y-4 py-1 text-xs">
                {activeTest.questions.map((q: TestQuestionDTO, idx: number) => (
                  <div key={q.id} className="p-3 border rounded-xl bg-card space-y-2">
                    <div className="flex items-start justify-between gap-2 border-b pb-1.5">
                      <span className="font-bold text-foreground text-xs">
                        Вопрос #{idx + 1}: {q.questionText}
                      </span>
                      <Badge variant="secondary" className="text-[9px] shrink-0 font-normal">
                        +{q.points} б.
                      </Badge>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      {q.options.map((opt: string, optIdx: number) => {
                        const isSelected = studentAnswers[q.id] === opt;

                        return (
                          <div
                            key={optIdx}
                            onClick={() =>
                              setStudentAnswers((prev) => ({
                                ...prev,
                                [q.id]: opt,
                              }))
                            }
                            className={`p-2 rounded-lg border text-xs cursor-pointer transition-all flex items-center gap-2 ${
                              isSelected
                                ? "border-primary bg-primary/10 font-semibold text-primary"
                                : "border-border hover:bg-muted/40 font-normal"
                            }`}
                          >
                            <div className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"}`}>
                              {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
                            </div>
                            <span>{opt}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
                  <Button variant="outline" size="xs" onClick={() => setActiveTest(null)}>
                    Отмена
                  </Button>
                  <Button size="xs" disabled={isPending} onClick={handleStudentSubmitTest}>
                    Завершить и отправить ответы
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        )}
      </Dialog>

      {/* Modal 2: Teacher Create Test Builder */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="p-4 gap-3 text-xs sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-2 border-b gap-1">
            <DialogTitle className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Plus className="h-4 w-4 text-primary" /> Конструктор онлайного теста
            </DialogTitle>
            <DialogDescription className="text-xs">
              Заполните заголовок, установите таймер и составьте вопросы с вариантами ответов
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-1 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="font-medium text-foreground text-xs">Дисциплина</label>
                <Select value={newGroupSubjectId} onValueChange={setNewGroupSubjectId}>
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue>{subjects.find((s) => s.id === newGroupSubjectId)?.subjectName || "Выберите предмет"}</SelectValue>
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
                <label className="font-medium text-foreground text-xs">Тема (опционально)</label>
                <Select value={newTopicId} onValueChange={setNewTopicId}>
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue>{topics.find((t) => t.id === newTopicId)?.title || "Не привязано"}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-xs">
                      Не привязано
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
                <label className="font-medium text-foreground text-xs">Таймер (минуты)</label>
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
                placeholder="Например: Итоговый тест по модулю 'Алгоритмы'"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="h-8 text-xs bg-background font-medium"
              />
            </div>

            {/* Questions Builder list */}
            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-foreground text-xs flex items-center gap-1">
                  <HelpCircle className="h-3.5 w-3.5 text-primary" /> Вопросы теста ({questionDrafts.length})
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
                <div key={qIdx} className="p-3 border rounded-xl bg-card space-y-2">
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

                  {/* Options List */}
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[11px] text-muted-foreground font-medium flex items-center justify-between">
                      <span>Варианты ответов (нажмите на один для выбора правильного):</span>
                      <button
                        type="button"
                        onClick={() => handleAddOption(qIdx)}
                        className="text-primary hover:underline text-[10px] font-medium"
                      >
                        + Добавить вариант
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((opt, optIdx) => {
                        const isCorrect = q.correctAnswer === opt;

                        return (
                          <div key={optIdx} className="flex items-center gap-1.5">
                            <Input
                              value={opt}
                              onChange={(e) => handleUpdateOption(qIdx, optIdx, e.target.value)}
                              className={`h-7 text-xs bg-background ${isCorrect ? "border-primary font-semibold text-primary" : ""}`}
                            />
                            <Button
                              type="button"
                              size="xs"
                              variant={isCorrect ? "default" : "outline"}
                              onClick={() => handleSetCorrectAnswer(qIdx, opt)}
                              className="h-7 text-[10px] px-2 shrink-0 font-medium"
                              title="Отметить как верный ответ"
                            >
                              {isCorrect ? "Верный ✓" : "Выбрать"}
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
              Опубликовать тест
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal 3: Teacher View Submissions Dialog */}
      <Dialog open={viewSubmissionsTest !== null} onOpenChange={(open) => !open && setViewSubmissionsTest(null)}>
        {viewSubmissionsTest && (
          <DialogContent className="p-4 gap-3 text-xs sm:max-w-[500px]">
            <DialogHeader className="pb-2 border-b gap-1">
              <DialogTitle className="text-sm font-bold text-foreground">
                Результаты теста: {viewSubmissionsTest.title}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Всего сдано работ: {viewSubmissionsTest.submissionsCount}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 py-1 text-xs max-h-[350px] overflow-y-auto">
              {viewSubmissionsTest.submissions.map((sub: TestSubmissionDTO) => (
                <div key={sub.id} className="p-2.5 rounded-lg border bg-card flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-foreground text-xs">{sub.studentName}</div>
                    <div className="text-[10px] text-muted-foreground">
                      Дата: {new Date(sub.submittedAt).toLocaleDateString("ru-RU")}
                    </div>
                  </div>

                  <Badge variant="outline" className="text-xs font-bold border-primary/30 text-primary bg-primary/5">
                    {sub.score} / {sub.maxScore} баллов
                  </Badge>
                </div>
              ))}

              {viewSubmissionsTest.submissions.length === 0 && (
                <div className="py-6 text-center text-muted-foreground text-xs italic">
                  Пока ни один студент не прошёл данный тест
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
    </div>
  );
}
