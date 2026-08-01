"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MaterialType } from "@prisma/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  ArrowRight,
  FileText,
  Video,
  Link2,
  FileCode,
  Clock,
  User,
  ExternalLink,
  Plus,
  Sparkles,
} from "lucide-react";
import { GroupItemDTO, GroupSubjectDTO } from "../actions";

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
  recentTopics: Array<{
    id: string;
    title: string;
    description?: string | null;
    subjectName: string;
    teacherName: string;
    materialsCount: number;
    createdAt: string;
  }>;
  recentMaterials: Array<{
    id: string;
    title: string;
    type: MaterialType;
    topicTitle: string;
    authorName: string;
    fileUrl?: string | null;
    linkUrl?: string | null;
    createdAt: string;
  }>;
  recentTests: Array<{
    id: string;
    title: string;
    subjectName: string;
    questionsCount: number;
    timeLimit?: number | null;
    createdAt: string;
  }>;
}

export function LmsOverviewView({
  groups,
  selectedGroupId,
  canCreate,
  stats,
  recentTopics,
  recentMaterials,
  recentTests,
}: LmsOverviewViewProps) {
  const router = useRouter();
  const currentGroupObj = groups.find((g) => g.id === selectedGroupId);

  const handleGroupChange = (val: string) => {
    router.push(`/dashboard/lms?group=${val}`);
  };

  const getMaterialIcon = (type: MaterialType) => {
    switch (type) {
      case MaterialType.LECTURE:
      case MaterialType.PRACTICE:
      case MaterialType.LAB:
      case MaterialType.DOCUMENT:
        return <FileText className="h-3.5 w-3.5 text-primary" />;
      case MaterialType.VIDEO:
        return <Video className="h-3.5 w-3.5 text-primary" />;
      case MaterialType.LINK:
        return <Link2 className="h-3.5 w-3.5 text-primary" />;
      default:
        return <FileCode className="h-3.5 w-3.5 text-primary" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-4 rounded-xl border shadow-xs">
        <div className="space-y-0.5">
          <h1 className="text-base font-bold text-foreground flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" /> Учебные материалы LMS
          </h1>
          <p className="text-xs text-muted-foreground">
            Единый портал с учебными темами, лекциями, методичками, видео-уроками и онлайн-тестами
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canCreate && (
            <Link href={`/dashboard/lms/topics?group=${selectedGroupId}`}>
              <Button size="xs" className="h-8 text-xs gap-1.5 font-medium">
                <Plus className="h-3.5 w-3.5" /> Управление контентом
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Group Selector Bar */}
      <div className="bg-card p-3 rounded-xl border flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary shrink-0" />
          <span className="text-xs font-semibold text-foreground">Группа:</span>
        </div>
        <Select value={selectedGroupId} onValueChange={handleGroupChange}>
          <SelectTrigger className="h-8 text-xs font-medium bg-background sm:w-[240px]">
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

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Link href={`/dashboard/lms/topics?group=${selectedGroupId}`}>
          <Card className="p-4 border shadow-none hover:border-primary/50 hover:shadow-xs transition-all cursor-pointer group space-y-2">
            <div className="flex items-center justify-between">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <FolderKanban className="h-4 w-4" />
              </div>
              <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                {stats.totalTopics} тем
              </Badge>
            </div>
            <div>
              <h3 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                Темы & Уроки <ArrowRight className="h-3 w-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-[11px] text-muted-foreground">Структурированные учебные модули по предметам</p>
            </div>
          </Card>
        </Link>

        <Link href={`/dashboard/lms/materials?group=${selectedGroupId}`}>
          <Card className="p-4 border shadow-none hover:border-primary/50 hover:shadow-xs transition-all cursor-pointer group space-y-2">
            <div className="flex items-center justify-between">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <FileText className="h-4 w-4" />
              </div>
              <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                {stats.totalMaterials} файлов
              </Badge>
            </div>
            <div>
              <h3 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                Лекции & Практики <ArrowRight className="h-3 w-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-[11px] text-muted-foreground">Презентации, методички, ссылки и видео-уроки</p>
            </div>
          </Card>
        </Link>

        <Link href={`/dashboard/lms/tests?group=${selectedGroupId}`}>
          <Card className="p-4 border shadow-none hover:border-primary/50 hover:shadow-xs transition-all cursor-pointer group space-y-2">
            <div className="flex items-center justify-between">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <FileCheck2 className="h-4 w-4" />
              </div>
              <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                {stats.totalTests} тестов
              </Badge>
            </div>
            <div>
              <h3 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                Тесты & Опросы <ArrowRight className="h-3 w-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-[11px] text-muted-foreground">Онлайн-тестирование знаний и самопроверка</p>
            </div>
          </Card>
        </Link>
      </div>

      {/* Main Grid: Recent Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Topics */}
        <div className="space-y-2 bg-card p-4 rounded-xl border">
          <div className="flex items-center justify-between pb-2 border-b">
            <h2 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <FolderKanban className="h-3.5 w-3.5 text-primary" /> Последние темы
            </h2>
            <Link href={`/dashboard/lms/topics?group=${selectedGroupId}`} className="text-[11px] text-primary hover:underline font-medium">
              Все →
            </Link>
          </div>
          <div className="space-y-2">
            {recentTopics.map((topic) => (
              <div key={topic.id} className="p-2.5 rounded-lg border bg-background space-y-1">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[9px] border-primary/20 text-primary">
                    {topic.subjectName}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">{topic.materialsCount} материалов</span>
                </div>
                <div className="text-xs font-semibold text-foreground line-clamp-1">{topic.title}</div>
              </div>
            ))}
            {recentTopics.length === 0 && (
              <div className="py-6 text-center text-muted-foreground text-xs italic">Темы не найдены</div>
            )}
          </div>
        </div>

        {/* Recent Materials */}
        <div className="space-y-2 bg-card p-4 rounded-xl border">
          <div className="flex items-center justify-between pb-2 border-b">
            <h2 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-primary" /> Свежие материалы
            </h2>
            <Link href={`/dashboard/lms/materials?group=${selectedGroupId}`} className="text-[11px] text-primary hover:underline font-medium">
              Все →
            </Link>
          </div>
          <div className="space-y-2">
            {recentMaterials.map((mat) => (
              <div key={mat.id} className="p-2.5 rounded-lg border bg-background space-y-1">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-[11px] font-medium text-foreground line-clamp-1">
                    {getMaterialIcon(mat.type)} {mat.title}
                  </span>
                </div>
                <div className="text-[10px] text-muted-foreground flex items-center justify-between">
                  <span>Тема: {mat.topicTitle}</span>
                  {(mat.fileUrl || mat.linkUrl) && (
                    <a
                      href={mat.fileUrl || mat.linkUrl || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-0.5"
                    >
                      <ExternalLink className="h-2.5 w-2.5" /> Ссылка
                    </a>
                  )}
                </div>
              </div>
            ))}
            {recentMaterials.length === 0 && (
              <div className="py-6 text-center text-muted-foreground text-xs italic">Материалы не найдены</div>
            )}
          </div>
        </div>

        {/* Recent Tests */}
        <div className="space-y-2 bg-card p-4 rounded-xl border">
          <div className="flex items-center justify-between pb-2 border-b">
            <h2 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <FileCheck2 className="h-3.5 w-3.5 text-primary" /> Активные тесты
            </h2>
            <Link href={`/dashboard/lms/tests?group=${selectedGroupId}`} className="text-[11px] text-primary hover:underline font-medium">
              Все →
            </Link>
          </div>
          <div className="space-y-2">
            {recentTests.map((test) => (
              <div key={test.id} className="p-2.5 rounded-lg border bg-background space-y-1">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[9px] border-primary/20 text-primary">
                    {test.subjectName}
                  </Badge>
                  {test.timeLimit && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <Clock className="h-2.5 w-2.5 text-primary" /> {test.timeLimit} мин.
                    </span>
                  )}
                </div>
                <div className="text-xs font-semibold text-foreground line-clamp-1">{test.title}</div>
                <div className="text-[10px] text-muted-foreground font-normal">
                  Вопросов: {test.questionsCount} шт.
                </div>
              </div>
            ))}
            {recentTests.length === 0 && (
              <div className="py-6 text-center text-muted-foreground text-xs italic">Тесты не найдены</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
