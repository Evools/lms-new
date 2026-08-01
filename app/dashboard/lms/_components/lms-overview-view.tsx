"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MaterialType } from "@prisma/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  BookOpen,
  FolderKanban,
  FileCheck2,
  Building2,
  FileText,
  Video,
  Link2,
  FileCode,
  Clock,
  ExternalLink,
  Plus,
  Search,
  Laptop,
  GraduationCap,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { GroupItemDTO, GroupSubjectDTO } from "../actions";

interface TopicItemContent {
  id: string;
  title: string;
  description?: string | null;
  order: number;
  subjectName: string;
  teacherName: string;
  materials: Array<{
    id: string;
    type: MaterialType;
    title: string;
    content?: string | null;
    fileUrl?: string | null;
    linkUrl?: string | null;
  }>;
  tests: Array<{
    id: string;
    title: string;
    questionsCount: number;
    timeLimit?: number | null;
  }>;
}

interface LmsOverviewViewProps {
  groups: GroupItemDTO[];
  subjects: GroupSubjectDTO[];
  selectedGroupId: string;
  canCreate: boolean;
  stats: {
    totalTopics: number;
    totalMaterials: number;
    totalTests: number;
  };
  topicsWithContent?: TopicItemContent[];
}

export function LmsOverviewView({
  groups,
  subjects,
  selectedGroupId,
  canCreate,
  stats,
  topicsWithContent = [],
}: LmsOverviewViewProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const currentGroupObj = groups.find((g) => g.id === selectedGroupId);

  const handleGroupChange = (val: string) => {
    router.push(`/dashboard/lms?group=${val}`);
  };

  const getItemIcon = (type: MaterialType | "TEST") => {
    switch (type) {
      case MaterialType.LECTURE:
        return <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />;
      case MaterialType.PRACTICE:
        return <Laptop className="h-3.5 w-3.5 text-primary shrink-0" />;
      case MaterialType.LAB:
        return <GraduationCap className="h-3.5 w-3.5 text-primary shrink-0" />;
      case MaterialType.VIDEO:
        return <Video className="h-3.5 w-3.5 text-primary shrink-0" />;
      case MaterialType.TEST:
        return <FileCheck2 className="h-3.5 w-3.5 text-primary shrink-0" />;
      case MaterialType.PDF:
      case MaterialType.DOCUMENT:
        return <FileText className="h-3.5 w-3.5 text-primary shrink-0" />;
      case MaterialType.LINK:
        return <Link2 className="h-3.5 w-3.5 text-primary shrink-0" />;
      default:
        return <FileCode className="h-3.5 w-3.5 text-primary shrink-0" />;
    }
  };

  const getItemTypeBadge = (type: MaterialType | "TEST") => {
    switch (type) {
      case MaterialType.LECTURE:
        return "Лекция";
      case MaterialType.PRACTICE:
        return "Практика";
      case MaterialType.LAB:
        return "Лабораторная";
      case MaterialType.VIDEO:
        return "Видеоурок";
      case MaterialType.TEST:
        return "Тестирование";
      case MaterialType.PDF:
        return "PDF";
      case MaterialType.DOCUMENT:
        return "Методичка";
      case MaterialType.LINK:
        return "Ссылка";
      default:
        return "Материал";
    }
  };

  const filteredTopics = topicsWithContent.filter((topic) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      topic.title.toLowerCase().includes(q) ||
      topic.subjectName.toLowerCase().includes(q) ||
      topic.materials.some((m) => m.title.toLowerCase().includes(q)) ||
      topic.tests.some((t) => t.title.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4 w-full">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-4 rounded-xl border shadow-xs">
        <div className="space-y-0.5">
          <h1 className="text-base font-bold text-foreground flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" /> Программа обучения LMS
          </h1>
          <p className="text-xs text-muted-foreground">
            Единый учебный трек дисциплины: темы (уроки), материалы и онлайн-тесты
          </p>
        </div>

        {canCreate && (
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/lms/topics/new?group=${selectedGroupId}`}>
              <Button size="xs" variant="outline" className="h-8 text-xs gap-1.5 font-medium">
                <FolderKanban className="h-3.5 w-3.5 text-primary" /> + Тема (Урок)
              </Button>
            </Link>

            <Link href={`/dashboard/lms/tests/new?group=${selectedGroupId}`}>
              <Button size="xs" variant="outline" className="h-8 text-xs gap-1.5 font-medium">
                <FileCheck2 className="h-3.5 w-3.5 text-primary" /> + Тест
              </Button>
            </Link>

            <Link href={`/dashboard/lms/materials/new?group=${selectedGroupId}`}>
              <Button size="xs" className="h-8 text-xs gap-1.5 font-medium">
                <Plus className="h-3.5 w-3.5" /> + Материал
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Student Guide Banner */}
      {!canCreate && (
        <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 space-y-2 text-xs">
          <div className="font-bold text-primary flex items-center gap-2">
            <GraduationCap className="h-4 w-4" /> Инструкция для студента — Как заниматься на платформе:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-muted-foreground">
            <div className="p-2.5 bg-card border rounded-lg space-y-1">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-primary" /> 1. Твоя учебная группа
              </span>
              Материалы и темы автоматически отображаются для твоей группы.
            </div>
            <div className="p-2.5 bg-card border rounded-lg space-y-1">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-primary" /> 2. Лекции и материалы
              </span>
              Изучай конспекты, методички и презентации — нажимай «Открыть».
            </div>
            <div className="p-2.5 bg-card border rounded-lg space-y-1">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <FileCheck2 className="h-3.5 w-3.5 text-primary" /> 3. Тесты и проверка
              </span>
              Проходи онлайн-тесты прямо в блоке темы или во вкладке «Тесты & Опросы».
            </div>
          </div>
        </div>
      )}

      {/* Quick Section Nav Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Link href={`/dashboard/lms/topics?group=${selectedGroupId}`}>
          <Card className="p-3.5 border shadow-none hover:border-primary/50 hover:shadow-xs transition-all cursor-pointer group space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <FolderKanban className="h-3.5 w-3.5" />
              </div>
              <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                {stats.totalTopics} тем
              </Badge>
            </div>
            <div>
              <h3 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                Темы & Уроки <ArrowRight className="h-3 w-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-[11px] text-muted-foreground">Структурированные темы и модули занятий</p>
            </div>
          </Card>
        </Link>

        <Link href={`/dashboard/lms/tests?group=${selectedGroupId}`}>
          <Card className="p-3.5 border shadow-none hover:border-primary/50 hover:shadow-xs transition-all cursor-pointer group space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <FileCheck2 className="h-3.5 w-3.5" />
              </div>
              <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                {stats.totalTests} тестов
              </Badge>
            </div>
            <div>
              <h3 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                Тесты & Опросы <ArrowRight className="h-3 w-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-[11px] text-muted-foreground">Конструктор и прохождение тестов</p>
            </div>
          </Card>
        </Link>

        <Link href={`/dashboard/lms/materials?group=${selectedGroupId}`}>
          <Card className="p-3.5 border shadow-none hover:border-primary/50 hover:shadow-xs transition-all cursor-pointer group space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <FileText className="h-3.5 w-3.5" />
              </div>
              <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                {stats.totalMaterials} файлов
              </Badge>
            </div>
            <div>
              <h3 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                Материалы & Лекции <ArrowRight className="h-3 w-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-[11px] text-muted-foreground">Конспекты, практики и видеоуроки</p>
            </div>
          </Card>
        </Link>
      </div>

      {/* Filter Bar & Search */}
      <div className="bg-card p-3 rounded-xl border grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
            <Building2 className="h-3.5 w-3.5 text-primary" /> Учебная группа
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

        <div className="sm:col-span-2 space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
            <Search className="h-3.5 w-3.5 text-primary" /> Поиск по темам и материалам
          </label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Введите название темы, лекции, практики или теста..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 text-xs bg-background pl-8 font-medium"
            />
          </div>
        </div>
      </div>

      {/* MASTER COURSE CURRICULUM TREE */}
      <div className="space-y-3">
        {filteredTopics.map((topic, topicIdx) => {
          const totalItems = topic.materials.length + topic.tests.length;

          return (
            <div key={topic.id} className="p-4 rounded-xl border bg-card space-y-3 shadow-xs">
              {/* Topic Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2.5">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                      {topicIdx + 1}
                    </span>
                    <Badge variant="outline" className="text-[10px] border-primary/30 text-primary font-medium">
                      {topic.subjectName}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground font-normal">
                      Преподаватель: {topic.teacherName}
                    </span>
                  </div>
                  <h2 className="text-sm font-bold text-foreground pt-0.5">
                    {topic.title}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px] font-normal">
                    {totalItems} элементов
                  </Badge>

                  {canCreate && (
                    <Link href={`/dashboard/lms/materials/new?group=${selectedGroupId}&topic=${topic.id}`}>
                      <Button size="xs" variant="outline" className="h-7 text-[11px] gap-1 font-medium">
                        <Plus className="h-3 w-3 text-primary" /> Материал
                      </Button>
                    </Link>
                  )}
                </div>
              </div>

              {/* Sequential Content List for this Topic */}
              <div className="space-y-1.5 pl-1 sm:pl-3">
                {/* Materials */}
                {topic.materials.map((m) => (
                  <div
                    key={m.id}
                    className="p-2.5 rounded-lg border bg-background flex flex-wrap items-center justify-between gap-2 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                        {getItemIcon(m.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-foreground">{m.title}</span>
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-border text-muted-foreground font-normal">
                            {getItemTypeBadge(m.type)}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {(m.fileUrl || m.linkUrl) && (
                        <a
                          href={m.fileUrl || m.linkUrl || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button size="xs" variant="ghost" className="h-6 text-[10px] gap-1 text-primary">
                            Открыть <ExternalLink className="h-2.5 w-2.5" />
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                ))}

                {/* Tests */}
                {topic.tests.map((test) => (
                  <div
                    key={test.id}
                    className="p-2.5 rounded-lg border bg-background flex flex-wrap items-center justify-between gap-2 border-primary/30 hover:border-primary/60 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                        <FileCheck2 className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-foreground">{test.title}</span>
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-primary/30 text-primary font-medium">
                            Тестирование
                          </Badge>
                        </div>
                        <div className="text-[10px] text-muted-foreground pt-0.5 flex items-center gap-2">
                          <span>{test.questionsCount} вопросов</span>
                          {test.timeLimit && (
                            <span className="flex items-center gap-0.5">
                              • <Clock className="h-2.5 w-2.5 text-primary" /> {test.timeLimit} мин.
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link href={`/dashboard/lms/tests?group=${selectedGroupId}`}>
                        <Button size="xs" variant="outline" className="h-6 text-[10px] gap-1 font-medium">
                          Пройти тест <ChevronRight className="h-3 w-3 text-primary" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}

                {totalItems === 0 && (
                  <div className="py-4 text-center text-muted-foreground text-xs italic bg-muted/20 rounded-lg">
                    В этой теме пока нет опубликованных лекций или тестов.
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filteredTopics.length === 0 && (
          <div className="p-8 text-center bg-card rounded-xl border space-y-2">
            <FolderKanban className="h-8 w-8 text-muted-foreground mx-auto" />
            <div className="text-xs font-semibold text-foreground">Программа курса не заполнена</div>
            <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
              Создайте первую учебную тему или опубликуйте лекции и тесты для вашей группы.
            </p>
            {canCreate && (
              <div className="pt-2">
                <Link href={`/dashboard/lms/topics/new?group=${selectedGroupId}`}>
                  <Button size="xs" className="h-8 text-xs gap-1.5 font-medium">
                    <Plus className="h-3.5 w-3.5" /> Создать первую тему
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
