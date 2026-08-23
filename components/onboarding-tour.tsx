"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Compass,
  ArrowRight,
  ArrowLeft,
  X,
  CheckCircle2,
  Sparkles,
  LayoutDashboard,
  Bell,
  User,
  BookOpen,
  FileCheck2,
  CalendarCheck,
  Users,
  Clock,
  ShieldCheck,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface TourStep {
  id: string;
  targetSelector: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  placement?: "bottom" | "top" | "left" | "right" | "center";
}

const TOUR_SCENARIOS: Record<string, TourStep[]> = {
  general: [
    {
      id: "welcome",
      targetSelector: "[data-tour='sidebar-nav']",
      title: "Навигация и разделы",
      description:
        "Здесь собраны все ключевые разделы системы: учебные группы, база студентов, дисциплины, журнал посещаемости, домашние задания и онлайн-тестирование LMS.",
      icon: <LayoutDashboard className="h-4 w-4 text-primary" />,
      placement: "right",
    },
    {
      id: "header-breadcrumbs",
      targetSelector: "[data-tour='header-breadcrumbs']",
      title: "Хлебные крошки и путь",
      description:
        "Отображает текущее местоположение в системе. Вы всегда можете быстро вернуться в предыдущий раздел одним кликом.",
      icon: <Compass className="h-4 w-4 text-primary" />,
      placement: "bottom",
    },
    {
      id: "notifications",
      targetSelector: "[data-tour='header-notifications']",
      title: "Центр уведомлений",
      description:
        "Все важные системные события, новые задания, назначения тестов, объявления и дежурства мгновенно появляются здесь.",
      icon: <Bell className="h-4 w-4 text-primary" />,
      placement: "bottom",
    },
    {
      id: "user-profile",
      targetSelector: "[data-tour='sidebar-user']",
      title: "Профиль и персональные настройки",
      description:
        "Переключение темы оформления (светлая/тёмная/системная), изменение пароля, управление аккаунтом и доступ к системным настройкам.",
      icon: <User className="h-4 w-4 text-primary" />,
      placement: "right",
    },
    {
      id: "dashboard-content",
      targetSelector: "[data-tour='dashboard-content']",
      title: "Рабочая область",
      description:
        "Основное пространство для работы с материалами, аналитикой, расписанием и оперативными данными.",
      icon: <Sparkles className="h-4 w-4 text-primary" />,
      placement: "bottom",
    },
  ],
  assignments: [
    {
      id: "assignments-create",
      targetSelector: "[data-tour='assignments-create-btn']",
      title: "Создание домашнего задания",
      description:
        "Кнопка перехода в форму создания ДЗ (/dashboard/assignments/new). Здесь вы задаете тему, выбираете группу и предмет, указываете дедлайн и прикрепляете файлы.",
      icon: <LayoutDashboard className="h-4 w-4 text-primary" />,
      placement: "bottom",
    },
    {
      id: "assignments-filters",
      targetSelector: "[data-tour='assignments-filters']",
      title: "Фильтрация и поиск заданий",
      description:
        "Быстрое переключение между учебными группами, предметами и табами статусов ('Все' / 'На проверку').",
      icon: <Compass className="h-4 w-4 text-primary" />,
      placement: "bottom",
    },
    {
      id: "assignments-list",
      targetSelector: "[data-tour='assignments-list']",
      title: "Реестр заданий и проверка работ",
      description:
        "В строке каждого задания отображается количество сданных работ и кнопка вызова окна проверки. Кликните по ней для быстрого выставления оценок и рецензий.",
      icon: <CheckCircle2 className="h-4 w-4 text-primary" />,
      placement: "top",
    },
  ],
  assignment_new: [
    {
      id: "new-title",
      targetSelector: "[data-tour='assignment-new-title']",
      title: "1. Название и тема задания",
      description:
        "Введите понятный заголовок работы, например: «Лабораторная работа №3. Настройка Next.js и Prisma».",
      icon: <LayoutDashboard className="h-4 w-4 text-primary" />,
      placement: "bottom",
    },
    {
      id: "new-templates",
      targetSelector: "[data-tour='assignment-new-templates']",
      title: "2. Готовые шаблоны-пресеты",
      description:
        "Используйте выпадающий список шаблонов (REST API, Лабораторная работа, Проект, Контрольные вопросы) для мгновенной вставки типовой структуры работы.",
      icon: <Sparkles className="h-4 w-4 text-primary" />,
      placement: "bottom",
    },
    {
      id: "new-editor",
      targetSelector: "[data-tour='assignment-new-editor']",
      title: "3. Markdown-редактор и Предпросмотр",
      description:
        "Оформите требования с помощью панели форматирования: жирный текст, списки задач, блоки кода. Переключайтесь во вкладку «Предпросмотр» для проверки внешнего вида.",
      icon: <Compass className="h-4 w-4 text-primary" />,
      placement: "bottom",
    },
    {
      id: "new-group-subject",
      targetSelector: "[data-tour='assignment-new-group-subject']",
      title: "4. Выбор группы и дисциплины",
      description:
        "Укажите учебную группу и предмет, к которому относится задание. Список предметов автоматически фильтруется под выбранную группу.",
      icon: <User className="h-4 w-4 text-primary" />,
      placement: "left",
    },
    {
      id: "new-deadline",
      targetSelector: "[data-tour='assignment-new-deadline']",
      title: "5. Дедлайн и максимальный балл",
      description:
        "Установите точную дату сдачи и максимальную оценку за задание (например, 100 баллов или 5).",
      icon: <CheckCircle2 className="h-4 w-4 text-primary" />,
      placement: "left",
    },
    {
      id: "new-attachments",
      targetSelector: "[data-tour='assignment-new-attachments']",
      title: "6. Ссылки и методические материалы",
      description:
        "Добавьте ссылки на репозиторий GitHub, макет Figma или файлы на облачном диске с помощью кнопки «+ Ссылка».",
      icon: <Sparkles className="h-4 w-4 text-primary" />,
      placement: "left",
    },
    {
      id: "new-submit",
      targetSelector: "[data-tour='assignment-new-submit']",
      title: "7. Публикация задания",
      description:
        "Нажмите «Опубликовать задание» или используйте горячие клавиши Ctrl+Enter (Cmd+Enter). Студенты группы сразу получат уведомление.",
      icon: <CheckCircle2 className="h-4 w-4 text-primary" />,
      placement: "bottom",
    },
  ],
  tests: [
    {
      id: "tests-stats",
      targetSelector: "[data-tour='tests-header-stats']",
      title: "1. Сводка и успеваемость",
      description:
        "Мгновенная аналитика по всем тестам выбранной группы: общее количество созданных тестов, число сданных работ и средний процент успеваемости.",
      icon: <FileCheck2 className="h-4 w-4 text-primary" />,
      placement: "bottom",
    },
    {
      id: "tests-create",
      targetSelector: "[data-tour='tests-create-btn']",
      title: "2. Создание тестов",
      description:
        "Кнопка «Конструктор» открывает полноценный редактор с 9 типами вопросов (одиночный, множественный выбор, число, текст, код, сопоставление). «Быстрый тест» позволяет создать экспресс-опросник в модальном окне.",
      icon: <Sparkles className="h-4 w-4 text-primary" />,
      placement: "bottom",
    },
    {
      id: "tests-filter-bar",
      targetSelector: "[data-tour='tests-filters']",
      title: "3. Фильтрация и поиск",
      description:
        "Быстрый отбор тестов по учебным группам, предметам, тематическим модулям или названию.",
      icon: <Compass className="h-4 w-4 text-primary" />,
      placement: "bottom",
    },
    {
      id: "tests-registry",
      targetSelector: "[data-tour='tests-list']",
      title: "4. Реестр и ведомость результатов",
      description:
        "Список тестов с информацией о количестве вопросов, таймере и ссылками для просмотра ведомости сдачи студентами группы.",
      icon: <CheckCircle2 className="h-4 w-4 text-primary" />,
      placement: "top",
    },
  ],
  attendance: [
    {
      id: "attendance-actions",
      targetSelector: "[data-tour='attendance-header-actions']",
      title: "1. Быстрая отметка и печать",
      description:
        "Кнопка «Отметить всех присутствующими» заполняет журнал в один клик. Кнопка «Печать бланка» формирует официальную ведомость по стандартам лицея.",
      icon: <CalendarCheck className="h-4 w-4 text-primary" />,
      placement: "bottom",
    },
    {
      id: "attendance-filters-bar",
      targetSelector: "[data-tour='attendance-filters']",
      title: "2. Выбор группы, предмета и даты",
      description:
        "Выберите учебную группу, предмет и точную дату занятия для просмотра или заполнения журнала.",
      icon: <Compass className="h-4 w-4 text-primary" />,
      placement: "bottom",
    },
    {
      id: "attendance-summary-kpi",
      targetSelector: "[data-tour='attendance-metrics']",
      title: "3. Статистика занятия",
      description:
        "Сводка по явке на занятие: количество присутствующих, отсутствующих, опоздавших, уважительных пропусков и общий процент явки.",
      icon: <Users className="h-4 w-4 text-primary" />,
      placement: "bottom",
    },
    {
      id: "attendance-student-table",
      targetSelector: "[data-tour='attendance-table']",
      title: "4. Интерактивная ведомость",
      description:
        "Список учащихся с переключателями статусов (Присутствует, Болел, Не был, Опоздал) и возможностью оставить текстовое примечание.",
      icon: <CheckCircle2 className="h-4 w-4 text-primary" />,
      placement: "top",
    },
  ],
  students: [
    {
      id: "students-actions",
      targetSelector: "[data-tour='students-header-actions']",
      title: "1. Зачисление и Excel-импорт",
      description:
        "Добавляйте студентов вручную по одному или используйте пакетную загрузку списков групп из файлов Excel (.xlsx).",
      icon: <GraduationCap className="h-4 w-4 text-primary" />,
      placement: "bottom",
    },
    {
      id: "students-kpi",
      targetSelector: "[data-tour='students-metrics']",
      title: "2. Сводка по контингенту",
      description:
        "Оперативная статистика учащихся: общее число зачисленных, количество активных учетных записей и студентов с временными паролями.",
      icon: <Users className="h-4 w-4 text-primary" />,
      placement: "bottom",
    },
    {
      id: "students-search-filters",
      targetSelector: "[data-tour='students-filters']",
      title: "3. Поиск и фильтрация",
      description:
        "Фильтруйте учащихся по учебным группам, статусам учетных записей (Активен, Заблокирован) и форме обучения (Бюджет / Контракт).",
      icon: <Compass className="h-4 w-4 text-primary" />,
      placement: "bottom",
    },
    {
      id: "students-registry",
      targetSelector: "[data-tour='students-list']",
      title: "4. База данных учащихся",
      description:
        "Полный реестр студентов с контактами, историей активности и кнопками управления учетными записями.",
      icon: <CheckCircle2 className="h-4 w-4 text-primary" />,
      placement: "top",
    },
  ],
  duty: [
    {
      id: "duty-actions",
      targetSelector: "[data-tour='duty-header-actions']",
      title: "1. Авто-ротация и печать",
      description:
        "Кнопка «Авто-ротация» автоматически распределяет смены дежурств среди студентов группы без повторов. Кнопка «Печать» генерирует настенный график.",
      icon: <Clock className="h-4 w-4 text-primary" />,
      placement: "bottom",
    },
    {
      id: "duty-summary-kpi",
      targetSelector: "[data-tour='duty-kpi']",
      title: "2. Статистика дежурств",
      description:
        "Показывает список назначенных дежурных на сегодняшний день, общее количество смен на текущую неделю и состав группы.",
      icon: <Users className="h-4 w-4 text-primary" />,
      placement: "bottom",
    },
    {
      id: "duty-nav-filters",
      targetSelector: "[data-tour='duty-filters']",
      title: "3. Навигация и поиск",
      description:
        "Переключайтесь между расписанием группы и экраном аудита/рейтинга дежурств, а также выполняйте быстрый поиск по фамилии учащегося.",
      icon: <Compass className="h-4 w-4 text-primary" />,
      placement: "bottom",
    },
    {
      id: "duty-schedule-grid",
      targetSelector: "[data-tour='duty-roster']",
      title: "4. Еженедельный график дежурств",
      description:
        "Календарная сетка по дням недели с указанием старших дежурных, ответственных учащихся и дисциплинарных назначений.",
      icon: <CheckCircle2 className="h-4 w-4 text-primary" />,
      placement: "top",
    },
  ],
  settings: [
    {
      id: "settings-nav-tabs",
      targetSelector: "[data-tour='settings-tabs']",
      title: "1. Разделы настроек",
      description:
        "Вкладки управления: персонализация оформления, глобальные параметры системы, сотрудники/доступы и справочник учебных годов.",
      icon: <ShieldCheck className="h-4 w-4 text-primary" />,
      placement: "bottom",
    },
    {
      id: "settings-theme-card",
      targetSelector: "[data-tour='settings-theme']",
      title: "2. Тема интерфейса",
      description:
        "Выберите комфортный режим: светлая, тёмная или автоматическая синхронизация с темой операционной системы.",
      icon: <Sparkles className="h-4 w-4 text-primary" />,
      placement: "bottom",
    },
    {
      id: "settings-guides",
      targetSelector: "[data-tour='settings-tour-hub']",
      title: "3. База знаний и обучение",
      description:
        "Центр справки: интерактивные пошаговые туры, частые вопросы (FAQ) и памятка горячих клавиш.",
      icon: <Compass className="h-4 w-4 text-primary" />,
      placement: "top",
    },
  ],
  student_assignments: [
    {
      id: "std-hw-filters",
      targetSelector: "[data-tour='assignments-filters']",
      title: "1. Ваши домашние задания",
      description:
        "Фильтруйте задания по предметам и статусам сдачи: «Все» или «На проверке».",
      icon: <BookOpen className="h-4 w-4 text-primary" />,
      placement: "bottom",
    },
    {
      id: "std-hw-list",
      targetSelector: "[data-tour='assignments-list']",
      title: "2. Сдача решений и оценки",
      description:
        "Кликните на карточку задания, чтобы ознакомиться с требованиями, прикрепить файлы решения или ссылку и увидеть комментарий преподавателя с оценкой.",
      icon: <CheckCircle2 className="h-4 w-4 text-primary" />,
      placement: "top",
    },
  ],
  student_tests: [
    {
      id: "std-tests-filters",
      targetSelector: "[data-tour='tests-filters']",
      title: "1. Доступные онлайн-тесты",
      description:
        "Здесь отображаются все тесты, назначенные вашей группе по изучаемым предметам.",
      icon: <FileCheck2 className="h-4 w-4 text-primary" />,
      placement: "bottom",
    },
    {
      id: "std-tests-list",
      targetSelector: "[data-tour='tests-list']",
      title: "2. Прохождение тестирования",
      description:
        "Нажмите на тест, чтобы начать прохождение. Следите за таймером вверху страницы и отправляйте ответы для моментального подсчета баллов.",
      icon: <Sparkles className="h-4 w-4 text-primary" />,
      placement: "top",
    },
  ],
  student_attendance: [
    {
      id: "std-att-filters",
      targetSelector: "[data-tour='attendance-filters']",
      title: "1. Выбор предмета и даты",
      description:
        "Просматривайте журнал посещаемости по конкретной дисциплине и дате занятия.",
      icon: <Compass className="h-4 w-4 text-primary" />,
      placement: "bottom",
    },
    {
      id: "std-att-metrics",
      targetSelector: "[data-tour='attendance-metrics']",
      title: "2. Статистика посещаемости",
      description:
        "Общее количество посещенных занятий, уважительных пропусков по справке и ваш итоговый процент явки.",
      icon: <CalendarCheck className="h-4 w-4 text-primary" />,
      placement: "bottom",
    },
  ],
};

const STORAGE_KEY = "lms_onboarding_tour_completed_v2";

export function startOnboardingTour(scenario: string = "general") {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("lms-start-tour", { detail: { scenario } }));
  }
}

export function OnboardingTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentScenario, setCurrentScenario] = useState<string>("general");
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const steps = TOUR_SCENARIOS[currentScenario] || TOUR_SCENARIOS.general;
  const currentStep = steps[currentStepIndex];

  const updateTargetPosition = useCallback(() => {
    if (!currentStep) return;

    const el = document.querySelector(currentStep.targetSelector);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
    } else {
      setTargetRect(null);
    }
  }, [currentStep]);

  useEffect(() => {
    // Check first visit
    const hasCompleted = localStorage.getItem(STORAGE_KEY);
    if (!hasCompleted) {
      const timer = setTimeout(() => {
        setIsOpen(true);
        setCurrentScenario("general");
        setCurrentStepIndex(0);
      }, 900);
      return () => clearTimeout(timer);
    }
  }, []);

  // Listen for manual tour trigger with scenario
  useEffect(() => {
    const handleStart = (e: Event) => {
      const customEvent = e as CustomEvent<{ scenario?: string }>;
      const scenario = customEvent.detail?.scenario || "general";
      setCurrentScenario(scenario);
      setCurrentStepIndex(0);
      setIsOpen(true);
    };

    window.addEventListener("lms-start-tour", handleStart);
    return () => window.removeEventListener("lms-start-tour", handleStart);
  }, []);

  // Update target rect on step change, resize or scroll
  useEffect(() => {
    if (!isOpen) return;

    updateTargetPosition();

    const handleResize = () => updateTargetPosition();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeTour();
      if (e.key === "ArrowRight") nextStep();
      if (e.key === "ArrowLeft") prevStep();
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleResize, true);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleResize, true);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, currentStepIndex, updateTargetPosition]);

  const closeTour = () => {
    setIsOpen(false);
    localStorage.setItem(STORAGE_KEY, "true");
  };

  const nextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      closeTour();
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  if (!isOpen || !currentStep) return null;

  // Calculate Popover Position
  const padding = 8;
  const spotlightTop = targetRect ? Math.max(0, targetRect.top - padding) : 0;
  const spotlightLeft = targetRect ? Math.max(0, targetRect.left - padding) : 0;
  const spotlightWidth = targetRect ? targetRect.width + padding * 2 : 0;
  const spotlightHeight = targetRect ? targetRect.height + padding * 2 : 0;

  // Compute tooltip position relative to spotlight
  const getPopoverStyle = (): React.CSSProperties => {
    if (!targetRect) {
      return {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };
    }

    const popoverWidth = 360;
    const windowWidth = typeof window !== "undefined" ? window.innerWidth : 1200;
    const windowHeight = typeof window !== "undefined" ? window.innerHeight : 800;

    let top = spotlightTop + spotlightHeight + 12;
    let left = spotlightLeft;

    if (currentStep.placement === "right") {
      left = spotlightLeft + spotlightWidth + 12;
      top = Math.max(20, Math.min(spotlightTop, windowHeight - 260));
    } else if (currentStep.placement === "left") {
      left = spotlightLeft - popoverWidth - 12;
      top = Math.max(20, Math.min(spotlightTop, windowHeight - 260));
    } else if (currentStep.placement === "top") {
      top = Math.max(20, spotlightTop - 220);
    }

    // Boundary constraints
    if (left + popoverWidth > windowWidth - 20) {
      left = windowWidth - popoverWidth - 20;
    }
    if (left < 20) left = 20;
    if (top + 240 > windowHeight - 20) {
      top = windowHeight - 260;
    }
    if (top < 20) top = 20;

    return {
      position: "fixed",
      top: `${top}px`,
      left: `${left}px`,
    };
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden pointer-events-auto">
      {/* Darkened Backdrop SVG with Spotlight Cutout */}
      <svg
        className="w-full h-full absolute inset-0 transition-all duration-300 pointer-events-auto"
        onClick={closeTour}
      >
        <defs>
          <mask id="spotlight-mask">
            {/* Fill entire screen white (opaque mask) */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* Cut out spotlight as black (transparent mask) */}
            {targetRect && (
              <rect
                x={spotlightTop !== undefined ? spotlightLeft : 0}
                y={spotlightTop !== undefined ? spotlightTop : 0}
                width={spotlightWidth}
                height={spotlightHeight}
                rx="10"
                ry="10"
                fill="black"
                className="transition-all duration-300 ease-out"
              />
            )}
          </mask>
        </defs>
        {/* Dark overlay with mask applied */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.72)"
          mask="url(#spotlight-mask)"
        />
      </svg>

      {/* Spotlight Pulsing Border Glow */}
      {targetRect && (
        <div
          className="fixed rounded-xl border-2 border-primary ring-4 ring-primary/20 pointer-events-none transition-all duration-300 ease-out animate-pulse"
          style={{
            top: `${spotlightTop}px`,
            left: `${spotlightLeft}px`,
            width: `${spotlightWidth}px`,
            height: `${spotlightHeight}px`,
          }}
        />
      )}

      {/* Tour Popover Card */}
      <div
        style={getPopoverStyle()}
        className="w-[360px] max-w-[calc(100vw-32px)] bg-card text-card-foreground border border-border/80 shadow-2xl rounded-2xl p-4.5 space-y-3.5 animate-in fade-in zoom-in-95 duration-200 z-50"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2 border-b pb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary shrink-0">
              {currentStep.icon || <Compass className="h-4 w-4" />}
            </div>
            <div>
              <h3 className="text-xs font-bold text-foreground leading-tight">
                {currentStep.title}
              </h3>
              <span className="text-[10px] font-medium text-muted-foreground">
                Шаг {currentStepIndex + 1} из {steps.length}
              </span>
            </div>
          </div>

          <button
            onClick={closeTour}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted transition-colors cursor-pointer"
            title="Закрыть обучение"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Body Description */}
        <p className="text-xs text-muted-foreground leading-relaxed">
          {currentStep.description}
        </p>

        {/* Step Progress Dots */}
        <div className="flex items-center justify-center gap-1.5 py-1">
          {steps.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentStepIndex(idx)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                idx === currentStepIndex
                  ? "w-6 bg-primary"
                  : idx < currentStepIndex
                  ? "w-2 bg-primary/50"
                  : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
              title={`Перейти к шагу ${idx + 1}`}
            />
          ))}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-2 border-t gap-2">
          <Button
            variant="ghost"
            size="xs"
            onClick={closeTour}
            className="text-xs text-muted-foreground hover:text-foreground h-7 px-2 cursor-pointer"
          >
            Пропустить
          </Button>

          <div className="flex items-center gap-1.5">
            {currentStepIndex > 0 && (
              <Button
                variant="outline"
                size="xs"
                onClick={prevStep}
                className="text-xs h-7 px-2.5 gap-1 font-medium cursor-pointer"
              >
                <ArrowLeft className="h-3 w-3" /> Назад
              </Button>
            )}

            <Button
              variant="default"
              size="xs"
              onClick={nextStep}
              className="text-xs h-7 px-3 gap-1 font-medium bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
            >
              {currentStepIndex === steps.length - 1 ? (
                <>
                  <CheckCircle2 className="h-3 w-3" /> Завершить
                </>
              ) : (
                <>
                  Далее <ArrowRight className="h-3 w-3" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
