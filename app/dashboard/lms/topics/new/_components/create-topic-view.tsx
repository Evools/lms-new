"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
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
  ChevronLeft,
  FolderKanban,
  Building2,
  Plus,
} from "lucide-react";
import { GroupItemDTO, GroupSubjectDTO, createTopicAction } from "../../../actions";
import { RichWysiwygEditor, WysiwygTemplate } from "@/components/rich-wysiwyg-editor";
import { toast } from "@/components/ui/toast";

interface CreateTopicViewProps {
  groups: GroupItemDTO[];
  subjects: GroupSubjectDTO[];
  selectedGroupId: string;
  selectedSubjectId: string;
  existingTopicsCount: number;
}

const TOPIC_TEMPLATES: WysiwygTemplate[] = [
  {
    id: "lecture",
    name: "Лекция",
    content: `## Цели и задачи урока\n- Изучить основные понятия и архитектурные решения темы.\n- Рассмотреть практические примеры и ключевые сценарии применения.\n\n## Теоретическая часть\nПодробный конспект теоретического материала:\n1. Основные термины и определения\n2. Ключевые принципы работы\n3. Архитектурный подход\n\n> **Важное замечание:** Обратите особое внимание на оптимизацию и безопасность!\n\n## Пример кода / реализации\n\`\`\`javascript\n// Демонстрационный фрагмент кода\nfunction initLesson() {\n  console.log("Урок успешно запущен");\n}\n\`\`\`\n\n## Вопросы для самопроверки\n- [ ] В чём заключается главное преимущество данного подхода?\n- [ ] Каковы потенциальные риски и как их минимизировать?`,
  },
  {
    id: "practice",
    name: "Практика",
    content: `## Цель практического занятия\nЗакрепление теоретических знаний на практике и решение реальной кейс-задачи.\n\n## Требования к среде разработки\n- Установленная среда разработки / IDE\n- Подключенная система контроля версий Git\n\n## Пошаговый план практики\n1. Создать структуру нового проекта.\n2. Реализовать базовую логику модуля.\n3. Покрыть код тестами и провести отладку.\n\n> **Критерий приёмки:** Весь функционал должен работать без ошибок в консоли.`,
  },
  {
    id: "lab",
    name: "Лабораторная",
    content: `## Лабораторная работа\n\n### Цель работы:\nПроведение серии экспериментов, замеры производительности и подготовка отчёта.\n\n### Выполняемые задания:\n- [ ] Задание 1: Развёртывание окружения.\n- [ ] Задание 2: Сбор метрик и анализ показателей.\n- [ ] Задание 3: Оформление итогового отчёта.\n\n### Форма сдачи:\nОтчёт загружается в формате PDF или ссылки на репозиторий GitHub.`,
  },
];

export function CreateTopicView({
  groups,
  subjects,
  selectedGroupId,
  selectedSubjectId,
  existingTopicsCount,
}: CreateTopicViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [groupId, setGroupId] = useState(selectedGroupId);
  const [groupSubjectId, setGroupSubjectId] = useState(selectedSubjectId || subjects[0]?.id || "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [order, setOrder] = useState<number>(existingTopicsCount + 1);

  const handleGroupChange = (val: string) => {
    setGroupId(val);
    router.push(`/dashboard/lms/topics/new?group=${val}`);
  };

  const handleSubmit = () => {
    if (!groupSubjectId || !title.trim()) {
      toast.add({ title: "Укажите учебную дисциплину и название темы", type: "error" });
      return;
    }

    startTransition(async () => {
      const res = await createTopicAction({
        groupSubjectId,
        title,
        description,
        order,
      });

      if (res.success) {
        toast.add({ title: "Тема успешно создана!", type: "success" });
        setTimeout(() => {
          router.push(`/dashboard/lms/topics?group=${groupId}`);
          router.refresh();
        }, 600);
      } else {
        toast.add({ title: res.error || "Ошибка при создании темы", type: "error" });
      }
    });
  };

  return (
    <div className="space-y-4 w-full">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-card p-3 sm:p-4 rounded-xl border shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <Link href={`/dashboard/lms/topics?group=${groupId}`} className="shrink-0">
            <Button size="xs" variant="outline" className="h-8 w-8 p-0">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-1.5 truncate">
              <FolderKanban className="h-4 sm:h-5 w-4 sm:w-5 text-primary shrink-0" />
              <span className="truncate">Конструктор тем и уроков</span>
            </h1>
            <p className="text-[11px] sm:text-xs text-muted-foreground truncate hidden xs:block">
              Создайте тему учебной программы с разметкой и материалами
            </p>
          </div>
        </div>

        <Button size="xs" disabled={isPending} onClick={handleSubmit} className="h-8 text-xs gap-1.5 font-medium">
          <Plus className="h-3.5 w-3.5" /> Опубликовать тему
        </Button>
      </div>

      {/* Main Form Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Left Column: Form Fields & Reusable Rich WYSIWYG Editor */}
        <div className="md:col-span-2 space-y-4">
          <Card className="p-4 border shadow-none rounded-xl space-y-4">
            <div className="space-y-1">
              <label className="font-semibold text-foreground text-xs">Заголовок темы / урока *</label>
              <Input
                placeholder="Например: Тема 1. Архитектурный стиль REST и разработка API"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-8 text-xs bg-background font-medium"
              />
            </div>

            {/* Reusable Rich WYSIWYG Editor Component */}
            <RichWysiwygEditor
              value={description}
              onChange={setDescription}
              label="Содержание и программа урока"
              placeholder="Опишите основные тезисы темы, результаты обучения, примеры кода или пошаговый план урока..."
              minHeight="320px"
              templates={TOPIC_TEMPLATES}
              onSubmit={handleSubmit}
            />
          </Card>
        </div>

        {/* Right Column: Settings & Metadata */}
        <div className="space-y-3 sticky top-20 z-10 self-start">
          <div className="p-3.5 border rounded-xl bg-card space-y-2.5 text-xs shadow-xs">
            <h3 className="text-xs font-bold text-foreground border-b pb-1.5 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-primary" /> Параметры привязки
            </h3>

            <div className="space-y-1">
              <label className="font-medium text-foreground text-xs">Учебная группа *</label>
              <Select value={groupId} onValueChange={handleGroupChange}>
                <SelectTrigger className="h-8 text-xs bg-background font-medium">
                  <SelectValue>{groups.find((g) => g.id === groupId)?.name || "Выберите группу"}</SelectValue>
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
              <label className="font-medium text-foreground text-xs">Учебный предмет *</label>
              <Select value={groupSubjectId} onValueChange={setGroupSubjectId}>
                <SelectTrigger className="h-8 text-xs bg-background font-medium">
                  <SelectValue>
                    {subjects.find((s) => s.id === groupSubjectId)?.subjectName || "Выберите предмет"}
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
              <label className="font-medium text-foreground text-xs">Порядковый номер в программе</label>
              <Input
                type="number"
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
                className="h-8 text-xs bg-background font-medium"
              />
              <p className="text-[10px] text-muted-foreground">Определяет порядок отображения темы в списке</p>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 border-t space-y-1.5">
              <Button size="xs" disabled={isPending} onClick={handleSubmit} className="w-full h-8 text-xs gap-1.5 font-medium">
                <Plus className="h-3.5 w-3.5" /> Опубликовать тему
              </Button>

              <Link href={`/dashboard/lms/topics?group=${groupId}`} className="block">
                <Button size="xs" variant="outline" className="w-full h-8 text-xs">
                  Отмена
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
