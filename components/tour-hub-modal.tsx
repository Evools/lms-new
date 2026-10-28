"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Compass,
  BookOpen,
  Keyboard,
  HelpCircle,
  Play,
  ChevronDown,
  Sparkles,
  GraduationCap,
  ArrowRight,
  FileCheck2,
  CalendarCheck,
  Users,
  Clock,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Building2,
  Award,
  BarChart3,
  Search,
  RotateCcw,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  startOnboardingTour,
  getCompletedTourIds,
  markTourScenarioCompleted,
} from "./onboarding-tour";
import { useRouter, usePathname } from "next/navigation";

export type UserRole = "STUDENT" | "TEACHER" | "ADMIN" | "ADMINISTRATION";

interface TourCard {
  id: string;
  title: string;
  badge: string;
  duration: string;
  route: string;
  description: string;
  icon: React.ReactNode;
  hasTour?: boolean;
  roles: UserRole[];
}

const ALL_TOURS: TourCard[] = [
  {
    id: "general",
    title: "Обзор интерфейса платформы",
    badge: "Быстрый старт",
    duration: "1 мин",
    route: "/dashboard",
    description:
      "Главная страница, оперативные сводки по лицею, меню разделов, уведомления и профиль.",
    icon: <Compass className="h-4 w-4 text-primary" />,
    hasTour: true,
    roles: ["STUDENT", "TEACHER", "ADMIN", "ADMINISTRATION"],
  },
  {
    id: "student_assignments",
    title: "Сдача домашних заданий",
    badge: "Учёба",
    duration: "2 мин",
    route: "/dashboard/assignments",
    description:
      "Как просматривать требования ДЗ, прикреплять файлы решений и отслеживать оценки.",
    icon: <BookOpen className="h-4 w-4 text-primary" />,
    hasTour: true,
    roles: ["STUDENT"],
  },
  {
    id: "student_tests",
    title: "Прохождение LMS-тестов",
    badge: "Тестирование",
    duration: "2 мин",
    route: "/dashboard/lms/tests",
    description:
      "Онлайн-тестирование: таймер, типы вопросов, выбор ответов и мгновенные результаты.",
    icon: <FileCheck2 className="h-4 w-4 text-primary" />,
    hasTour: true,
    roles: ["STUDENT"],
  },
  {
    id: "student_attendance",
    title: "Моя посещаемость",
    badge: "Журнал",
    duration: "1 мин",
    route: "/dashboard/attendance",
    description:
      "Просмотр истории пропусков, справок по болезни и процента личной посещаемости.",
    icon: <CalendarCheck className="h-4 w-4 text-primary" />,
    hasTour: true,
    roles: ["STUDENT"],
  },
  {
    id: "assignments",
    title: "Проверка домашних заданий",
    badge: "Учебный процесс",
    duration: "2 мин",
    route: "/dashboard/assignments",
    description:
      "Реестр работ, фильтр «На проверку», модальное окно рецензирования и оценки 1–5.",
    icon: <BookOpen className="h-4 w-4 text-primary" />,
    hasTour: true,
    roles: ["TEACHER", "ADMIN"],
  },
  {
    id: "assignment_new",
    title: "Конструктор нового ДЗ",
    badge: "Создание заданий",
    duration: "2 мин",
    route: "/dashboard/assignments/new",
    description:
      "Markdown-редактор, шаблоны лабораторных, ссылки на GitHub/Figma и дедлайны.",
    icon: <Sparkles className="h-4 w-4 text-primary" />,
    hasTour: true,
    roles: ["TEACHER", "ADMIN"],
  },
  {
    id: "tests",
    title: "LMS Онлайн-тестирование",
    badge: "Тестирование",
    duration: "3 мин",
    route: "/dashboard/lms/tests",
    description:
      "Конструктор с 9 типами вопросов, таймеры, автопроверка и сводная ведомость группы.",
    icon: <FileCheck2 className="h-4 w-4 text-primary" />,
    hasTour: true,
    roles: ["TEACHER", "ADMIN"],
  },
  {
    id: "materials",
    title: "Учебные материалы (LMS)",
    badge: "Методическая база",
    duration: "2 мин",
    route: "/dashboard/lms/materials",
    description:
      "Библиотека конспектов, презентаций, файлов и полезных ссылок по дисциплинам и модулям.",
    icon: <BookOpen className="h-4 w-4 text-primary" />,
    hasTour: false,
    roles: ["STUDENT", "TEACHER", "ADMIN"],
  },
  {
    id: "attendance",
    title: "Журнал посещаемости",
    badge: "Учебный процесс",
    duration: "1 мин",
    route: "/dashboard/attendance",
    description:
      "Отметка всех студентов в 1 клик, статусы (Б, Н, О), комментарии и печатная ведомость.",
    icon: <CalendarCheck className="h-4 w-4 text-primary" />,
    hasTour: true,
    roles: ["TEACHER", "ADMIN", "ADMINISTRATION"],
  },
  {
    id: "students",
    title: "Студенты и группы",
    badge: "Администрирование",
    duration: "2 мин",
    route: "/dashboard/students",
    description:
      "База учащихся, зачисление, распределение по курсам и пакетный Excel-импорт.",
    icon: <Users className="h-4 w-4 text-primary" />,
    hasTour: true,
    roles: ["ADMIN"],
  },
  {
    id: "duty",
    title: "График дежурств",
    badge: "Порядок",
    duration: "1 мин",
    route: "/dashboard/duty",
    description:
      "Расписание ответственных групп, авто-ротация смен и контроль дежурных по лицею.",
    icon: <Clock className="h-4 w-4 text-primary" />,
    hasTour: true,
    roles: ["STUDENT", "TEACHER", "ADMIN", "ADMINISTRATION"],
  },
  {
    id: "practice",
    title: "База практики",
    badge: "Профориентация",
    duration: "2 мин",
    route: "/dashboard/practice",
    description:
      "Реестр организаций-партнёров, распределение студентов на стажировку и памятка практиканта.",
    icon: <Building2 className="h-4 w-4 text-primary" />,
    hasTour: false,
    roles: ["STUDENT", "TEACHER", "ADMIN"],
  },
  {
    id: "scholarship",
    title: "Стипендиальная ведомость",
    badge: "Мониторинг",
    duration: "2 мин",
    route: "/dashboard/scholarship",
    description:
      "Автоматический расчёт кандидатов на стипендию по среднему баллу и посещаемости.",
    icon: <Award className="h-4 w-4 text-primary" />,
    hasTour: false,
    roles: ["TEACHER", "ADMIN", "ADMINISTRATION"],
  },
  {
    id: "documents",
    title: "Документы лицея",
    badge: "Документооборот",
    duration: "1 мин",
    route: "/dashboard/documents",
    description:
      "Хранилище приказов, решений педсовета, положений и официальных бланков лицея.",
    icon: <FileText className="h-4 w-4 text-primary" />,
    hasTour: false,
    roles: ["TEACHER", "ADMIN", "ADMINISTRATION"],
  },
  {
    id: "reports",
    title: "Аналитика и отчёты",
    badge: "Руководство",
    duration: "2 мин",
    route: "/dashboard/reports",
    description:
      "Сводная статистика успеваемости, явки по группам и выгрузка ведомостей в Excel.",
    icon: <BarChart3 className="h-4 w-4 text-primary" />,
    hasTour: false,
    roles: ["ADMIN", "ADMINISTRATION"],
  },
  {
    id: "settings",
    title: "Учебные годы и настройки",
    badge: "Администрирование",
    duration: "2 мин",
    route: "/dashboard/settings",
    description:
      "Управление периодами (2026-2027), ролями пользователей и безопасностью.",
    icon: <ShieldCheck className="h-4 w-4 text-primary" />,
    hasTour: true,
    roles: ["ADMIN"],
  },
];

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  actionRoute?: string;
  actionLabel?: string;
  roles: UserRole[];
}

const ALL_FAQ_ITEMS: FaqItem[] = [
  {
    id: "std-submit-hw",
    question: "Как отправить решение домашнего задания на проверку?",
    answer:
      "В разделе «Домашние задания» выберите активное задание. В форме отправки введите текст решения или прикрепите файлы (архив .zip, документ или изображение) и нажмите кнопку «Отправить на проверку».",
    actionRoute: "/dashboard/assignments",
    actionLabel: "К заданиям",
    roles: ["STUDENT"],
  },
  {
    id: "std-statuses",
    question: "Что означают статусы «На проверке», «Принято» и «На доработке»?",
    answer:
      "«На проверке» — ваше решение успешно отправлено преподавателю. «Принято» — преподаватель проверил работу и выставил оценку. «На доработке» — необходимо исправить замечания и отправить обновленное решение.",
    actionRoute: "/dashboard/assignments",
    actionLabel: "Мои задания",
    roles: ["STUDENT"],
  },
  {
    id: "std-pass-tests",
    question: "Как проходить онлайн-тесты в системе?",
    answer:
      "В разделе «Тестирование» выберите назначенный тест и нажмите «Начать». Вверху страницы появится таймер обратного отсчета. Ответьте на все вопросы и нажмите «Завершить тест» — результат и набранные баллы отобразятся сразу.",
    actionRoute: "/dashboard/lms/tests",
    actionLabel: "Пройти тест",
    roles: ["STUDENT"],
  },
  {
    id: "std-view-attendance",
    question: "Где посмотреть мои пропуски и посещаемость?",
    answer:
      "В разделе «Посещаемость» отображаются все ваши отметки: присутствие, уважительные пропуски по справке (Б), пропуски по неуважительной причине (Н) и опоздания (О).",
    actionRoute: "/dashboard/attendance",
    actionLabel: "Посещаемость",
    roles: ["STUDENT"],
  },
  {
    id: "std-materials",
    question: "Где найти конспекты лекций и презентации по предметам?",
    answer:
      "В разделе «Учебные материалы» собраны все конспекты, презентации, видеоразборы и файлы, опубликованные преподавателями для вашей группы.",
    actionRoute: "/dashboard/lms/materials",
    actionLabel: "Материалы",
    roles: ["STUDENT"],
  },
  {
    id: "tch-hw-review",
    question: "Как быстро проверить работы студентов?",
    answer:
      "В разделе «Домашние задания» нажмите таб «На проверку». Кликните на карточку задания, откроется окно проверки: выберите оценку от 1 до 5, кликните по готовому шаблону отзыва и нажмите «Принять и дальше» для автоматического перехода к следующему студенту.",
    actionRoute: "/dashboard/assignments",
    actionLabel: "Открыть задания",
    roles: ["TEACHER", "ADMIN"],
  },
  {
    id: "tch-hw-templates",
    question: "Как использовать готовые шаблоны при создании ДЗ?",
    answer:
      "В конструкторе (/dashboard/assignments/new) в панели инструментов редактора нажмите «Выбрать шаблон». Система автоматически вставит готовую структуру: цели, чеклист задач, пример кода и требования.",
    actionRoute: "/dashboard/assignments/new",
    actionLabel: "Создать ДЗ",
    roles: ["TEACHER", "ADMIN"],
  },
  {
    id: "tch-tests-types",
    question: "Какие типы вопросов поддерживаются в онлайн-тестах?",
    answer:
      "Конструктор поддерживает 9 типов: один вариант, несколько вариантов, верно/неверно, текст, числовой ввод, порядок, сопоставление, пропуски и вопросы с кодом (подсветка Python, JS, C++, SQL).",
    actionRoute: "/dashboard/lms/tests",
    actionLabel: "Конструктор тестов",
    roles: ["TEACHER", "ADMIN"],
  },
  {
    id: "tch-tests-cheating",
    question: "Как защитить тестирование от списывания?",
    answer:
      "При создании теста установите лимит времени на прохождение (таймер в минутах), включите случайное перемешивание вопросов и вариантов ответов, а также ограничьте количество попыток.",
    actionRoute: "/dashboard/lms/tests",
    actionLabel: "К тестам",
    roles: ["TEACHER", "ADMIN"],
  },
  {
    id: "tch-att-fast",
    question: "Как отметить посещаемость группы за несколько секунд?",
    answer:
      "В Журнале посещаемости выберите предмет и нажмите кнопку «Отметить всех присутствующими». После этого останется только кликнуть по нескольким отсутствующим студентам (выбрать Болел, Не был или Опоздал) и нажать «Сохранить».",
    actionRoute: "/dashboard/attendance",
    actionLabel: "Открыть журнал",
    roles: ["TEACHER", "ADMIN"],
  },
  {
    id: "adm-scholarship",
    question: "Как формируется ведомость на стипендию?",
    answer:
      "В разделе «Стипендия» система автоматически анализирует оценки и пропуски студентов бюджетной формы обучения, рассчитывая статус кандидата и сумму выплаты с возможностью экспорта ведомости.",
    actionRoute: "/dashboard/scholarship",
    actionLabel: "Стипендия",
    roles: ["TEACHER", "ADMIN", "ADMINISTRATION"],
  },
  {
    id: "adm-documents",
    question: "Как публиковать приказы и решения педсовета?",
    answer:
      "В разделе «Документы лицея» можно загружать официальные документы, распределять их по категориям и отслеживать статус ознакомления сотрудников.",
    actionRoute: "/dashboard/documents",
    actionLabel: "Документы",
    roles: ["TEACHER", "ADMIN", "ADMINISTRATION"],
  },
  {
    id: "adm-reports",
    question: "Где посмотреть сводную аналитику по всему лицею?",
    answer:
      "В разделе «Аналитика & Отчёты» представлены показатели посещаемости, успеваемости по группам и дисциплинам, а также инструменты экспорта сводных отчётов.",
    actionRoute: "/dashboard/reports",
    actionLabel: "К отчётам",
    roles: ["ADMIN", "ADMINISTRATION"],
  },
  {
    id: "adm-students-excel",
    question: "Как загрузить студентов списком из Excel?",
    answer:
      "В разделе «База студентов» нажмите кнопку «Импорт из Excel». Загрузите стандартный файл .xlsx — система автоматически создаст учетные записи и распределит студентов по нужным группам.",
    actionRoute: "/dashboard/students",
    actionLabel: "База студентов",
    roles: ["ADMIN"],
  },
  {
    id: "adm-duty-plan",
    question: "Как составить график дежурств по лицею?",
    answer:
      "В разделе «График дежурств» выберите группу и нажмите «Авто-ротация» или назначьте дежурных вручную. Назначенные дежурные на текущий день автоматически выводятся на главной странице.",
    actionRoute: "/dashboard/duty",
    actionLabel: "График дежурств",
    roles: ["ADMIN", "ADMINISTRATION", "TEACHER"],
  },
  {
    id: "adm-years",
    question: "Как добавить новый учебный год и переключить активный?",
    answer:
      "В разделе «Настройки» перейдите на вкладку «Учебные годы». Нажмите «Добавить год», укажите даты начала/окончания и переключатель «Активный». Все формы создания групп автоматически привяжутся к нему.",
    actionRoute: "/dashboard/settings",
    actionLabel: "Настройки",
    roles: ["ADMIN"],
  },
];

interface Shortcut {
  keys: string[];
  action: string;
  scope: string;
  roles: UserRole[];
}

const ALL_SHORTCUTS: Shortcut[] = [
  {
    keys: ["D"],
    action: "Быстрое переключение светлой / тёмной темы",
    scope: "Вся система (вне полей ввода)",
    roles: ["STUDENT", "TEACHER", "ADMIN", "ADMINISTRATION"],
  },
  {
    keys: ["Ctrl", "Enter"],
    action: "Отправить решение / опубликовать задание",
    scope: "Формы и редакторы",
    roles: ["STUDENT", "TEACHER", "ADMIN", "ADMINISTRATION"],
  },
  {
    keys: ["Esc"],
    action: "Закрыть модальное окно / отмена",
    scope: "Вся система",
    roles: ["STUDENT", "TEACHER", "ADMIN", "ADMINISTRATION"],
  },
  {
    keys: ["1", "–", "5"],
    action: "Быстрая оценка студента звёздами",
    scope: "Окно проверки ДЗ",
    roles: ["TEACHER", "ADMIN"],
  },
  {
    keys: ["←", "→"],
    action: "Предыдущий / следующий студент",
    scope: "Окно проверки ДЗ",
    roles: ["TEACHER", "ADMIN"],
  },
  {
    keys: ["Ctrl", "Shift", "B"],
    action: "Выделить текст жирным шрифтом (**bold**)",
    scope: "Markdown редактор",
    roles: ["TEACHER", "ADMIN"],
  },
  {
    keys: ["Ctrl", "Shift", "I"],
    action: "Выделить текст курсивом (*italic*)",
    scope: "Markdown редактор",
    roles: ["TEACHER", "ADMIN"],
  },
  {
    keys: ["Ctrl", "Shift", "C"],
    action: "Вставить блок исходного кода с подсветкой",
    scope: "Markdown редактор",
    roles: ["TEACHER", "ADMIN"],
  },
];

export function openTourHubModal() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("lms-open-tour-hub"));
  }
}

export function TourHubModal({ userRole = "STUDENT" }: { userRole?: UserRole }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"tours" | "faq" | "shortcuts">("tours");
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);
  const [faqQuery, setFaqQuery] = useState("");
  const [completedIds, setCompletedIds] = useState<string[]>([]);

  useEffect(() => {
    setCompletedIds(getCompletedTourIds());

    const handleOpen = () => {
      setCompletedIds(getCompletedTourIds());
      setIsOpen(true);
      setActiveTab("tours");
      setExpandedFaqId(null);
      setFaqQuery("");
    };

    const handleTourCompleted = () => {
      setCompletedIds(getCompletedTourIds());
    };

    window.addEventListener("lms-open-tour-hub", handleOpen);
    window.addEventListener("lms-tour-completed", handleTourCompleted);
    return () => {
      window.removeEventListener("lms-open-tour-hub", handleOpen);
      window.removeEventListener("lms-tour-completed", handleTourCompleted);
    };
  }, []);

  const tours = useMemo(() => {
    return ALL_TOURS.filter((t) => t.roles.includes(userRole));
  }, [userRole]);

  const faqItems = useMemo(() => {
    const roleFiltered = ALL_FAQ_ITEMS.filter((f) => f.roles.includes(userRole));
    const q = faqQuery.trim().toLowerCase();
    if (!q) return roleFiltered;
    return roleFiltered.filter(
      (f) =>
        f.question.toLowerCase().includes(q) ||
        f.answer.toLowerCase().includes(q)
    );
  }, [userRole, faqQuery]);

  const shortcuts = useMemo(() => {
    return ALL_SHORTCUTS.filter((s) => s.roles.includes(userRole));
  }, [userRole]);

  // Find context tour matching current pathname
  const currentContextTour = useMemo(() => {
    if (!pathname) return null;
    // Exact match first, then prefix match (excluding /dashboard root unless exact)
    const exact = tours.find((t) => t.route === pathname && t.hasTour);
    if (exact) return exact;
    const prefix = tours.find(
      (t) =>
        t.route !== "/dashboard" &&
        pathname.startsWith(t.route) &&
        t.hasTour
    );
    return prefix || null;
  }, [pathname, tours]);

  const completedCount = useMemo(() => {
    return tours.filter((t) => completedIds.includes(t.id)).length;
  }, [tours, completedIds]);

  const handleStartTour = (tour: TourCard) => {
    setIsOpen(false);
    if (!tour.hasTour) {
      markTourScenarioCompleted(tour.id);
      if (tour.route && window.location.pathname !== tour.route) {
        router.push(tour.route);
      }
      return;
    }

    if (tour.route && window.location.pathname !== tour.route) {
      router.push(tour.route);
    }
    setTimeout(() => {
      startOnboardingTour(tour.id);
    }, 450);
  };

  const handleNavigate = (route?: string) => {
    if (!route) return;
    setIsOpen(false);
    router.push(route);
  };

  const roleLabel =
    userRole === "ADMIN"
      ? "Администратор"
      : userRole === "ADMINISTRATION"
      ? "Администрация лицея"
      : userRole === "TEACHER"
      ? "Преподаватель"
      : "Студент";

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="p-0 gap-0 sm:max-w-[920px] w-full overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-none ring-0">
        {/* Header */}
        <div className="p-4 pr-14 border-b bg-muted/20 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary shrink-0">
              <GraduationCap className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold text-foreground flex items-center gap-2 flex-wrap">
                Путеводитель по Лицею LMS
                <Badge
                  variant="outline"
                  className="text-[10px] py-0 px-1.5 h-4 border-primary/30 text-primary font-medium"
                >
                  {roleLabel}
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Пошаговые интерактивные туры, база ответов (FAQ) и горячие клавиши
              </DialogDescription>
            </div>
          </div>

          {/* Progress pill */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-md border border-border bg-background text-xs">
            <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-muted-foreground">Изучено разделов:</span>
            <span className="font-mono font-medium text-foreground">
              {completedCount}/{tours.length}
            </span>
          </div>
        </div>

        {/* 3 Main Segmented Tabs */}
        <div className="px-4 pt-3 pb-2 border-b bg-background">
          <div className="grid grid-cols-3 gap-1 p-1 bg-muted/60 rounded-lg border text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("tours")}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md font-medium transition-colors cursor-pointer text-xs ${
                activeTab === "tours"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Compass className="h-3.5 w-3.5" />
              <span>Интерактивные туры ({tours.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("faq")}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md font-medium transition-colors cursor-pointer text-xs ${
                activeTab === "faq"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <HelpCircle className="h-3.5 w-3.5" />
              <span>Частые вопросы ({ALL_FAQ_ITEMS.filter((f) => f.roles.includes(userRole)).length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("shortcuts")}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md font-medium transition-colors cursor-pointer text-xs ${
                activeTab === "shortcuts"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Keyboard className="h-3.5 w-3.5" />
              <span>Горячие клавиши ({shortcuts.length})</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 max-h-[62vh] overflow-y-auto space-y-3">
          {/* TAB 1: Interactive Learning */}
          {activeTab === "tours" && (
            <div className="space-y-3">
              {/* Contextual Banner for Current Route */}
              {currentContextTour && (
                <div className="p-3 rounded-lg border border-primary/30 bg-primary/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-1.5 rounded-md bg-background border border-primary/20 text-primary shrink-0">
                      {currentContextTour.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-medium uppercase tracking-wider text-primary">
                          Рекомендуем для открытой страницы
                        </span>
                      </div>
                      <p className="font-bold text-foreground text-xs truncate">
                        {currentContextTour.title}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="xs"
                    onClick={() => handleStartTour(currentContextTour)}
                    className="h-7 px-3 text-xs gap-1.5 font-medium shrink-0 cursor-pointer"
                  >
                    <Play className="h-3 w-3" /> Запустить тур по разделу
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {tours.map((tour) => {
                  const isCompleted = completedIds.includes(tour.id);
                  const isCurrentPage = currentContextTour?.id === tour.id;

                  return (
                    <div
                      key={tour.id}
                      className={`group flex flex-col justify-between p-3.5 rounded-xl border bg-card transition-colors text-xs ${
                        isCurrentPage
                          ? "border-primary"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-1.5">
                          <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0">
                            {tour.icon}
                          </div>
                          <div className="flex items-center gap-1">
                            {isCompleted && (
                              <Badge
                                variant="outline"
                                className="text-[10px] py-0 px-1.5 h-5 font-medium border-primary/30 bg-primary/10 text-primary gap-1"
                              >
                                <CheckCircle2 className="h-2.5 w-2.5" />
                                Пройдено
                              </Badge>
                            )}
                            <Badge
                              variant="secondary"
                              className="text-[10px] py-0 px-1.5 h-5 font-normal text-muted-foreground"
                            >
                              <Clock className="h-2.5 w-2.5 mr-1 text-muted-foreground" />
                              {tour.duration}
                            </Badge>
                          </div>
                        </div>

                        <div>
                          <div className="text-[10px] font-medium text-primary uppercase tracking-wider mb-0.5">
                            {tour.badge}
                          </div>
                          <h4 className="font-bold text-foreground text-xs leading-snug group-hover:text-primary transition-colors">
                            {tour.title}
                          </h4>
                          <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                            {tour.description}
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 mt-3 border-t border-border/60">
                        <Button
                          type="button"
                          variant={tour.hasTour && !isCompleted ? "default" : "outline"}
                          size="xs"
                          onClick={() => handleStartTour(tour)}
                          className={`w-full h-7 rounded-md text-xs gap-1.5 font-medium cursor-pointer ${
                            tour.hasTour && !isCompleted
                              ? "bg-primary text-primary-foreground hover:bg-primary/90"
                              : "border-border text-foreground hover:bg-muted"
                          }`}
                        >
                          {tour.hasTour ? (
                            isCompleted ? (
                              <>
                                <RotateCcw className="h-3 w-3 text-primary" /> Пройти заново
                              </>
                            ) : (
                              <>
                                <Play className="h-3 w-3" /> Начать обучение
                              </>
                            )
                          ) : (
                            <>
                              <ExternalLink className="h-3 w-3 text-primary" /> Открыть раздел
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: FAQ Accordion */}
          {activeTab === "faq" && (
            <div className="space-y-2.5">
              {/* Quick Filter Input */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={faqQuery}
                  onChange={(e) => setFaqQuery(e.target.value)}
                  placeholder="Поиск по частым вопросам (например: стипендия, тест, шаблон)..."
                  className="w-full h-8 pl-8 pr-3 rounded-md border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>

              {faqItems.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-xs border border-border rounded-lg">
                  По запросу «{faqQuery}» вопросов не найдено
                </div>
              ) : (
                <div className="space-y-2">
                  {faqItems.map((item) => {
                    const isExpanded = expandedFaqId === item.id;
                    return (
                      <div
                        key={item.id}
                        className="rounded-lg border border-border bg-card overflow-hidden text-xs transition-colors"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedFaqId((prev) =>
                              prev === item.id ? null : item.id
                            )
                          }
                          className="w-full p-3 text-left flex items-center justify-between gap-3 hover:bg-muted/40 transition-colors cursor-pointer"
                        >
                          <span className="font-medium text-foreground text-xs leading-snug">
                            {item.question}
                          </span>
                          <ChevronDown
                            className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
                              isExpanded ? "rotate-180 text-primary" : ""
                            }`}
                          />
                        </button>

                        {isExpanded && (
                          <div className="px-3.5 pb-3.5 pt-2 border-t bg-muted/10 space-y-2.5 text-xs leading-relaxed text-muted-foreground animate-in fade-in duration-150">
                            <p>{item.answer}</p>
                            {item.actionRoute && (
                              <div className="pt-1 flex justify-end">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="xs"
                                  onClick={() => handleNavigate(item.actionRoute)}
                                  className="h-6 rounded-md text-[11px] px-2.5 gap-1 font-medium border-primary/30 text-primary hover:bg-primary/10 cursor-pointer"
                                >
                                  {item.actionLabel || "Перейти в раздел"}{" "}
                                  <ArrowRight className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Shortcuts Grid */}
          {activeTab === "shortcuts" && (
            <div className="space-y-2.5">
              <p className="text-[11px] text-muted-foreground">
                Горячие клавиши для быстрого выполнения действий без мыши:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {shortcuts.map((sc, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border border-border bg-card flex items-center justify-between gap-3 hover:bg-muted/20 transition-colors text-xs"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <p className="font-medium text-foreground text-xs leading-tight">
                        {sc.action}
                      </p>
                      <span className="text-[10px] text-muted-foreground block">
                        {sc.scope}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {sc.keys.map((k, ki) => (
                        <kbd
                          key={ki}
                          className="px-1.5 py-0.5 rounded bg-muted border border-border text-[11px] font-mono font-medium text-foreground"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t bg-muted/20 flex items-center justify-end">
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => setIsOpen(false)}
            className="h-6 rounded-md text-xs px-2.5 font-medium cursor-pointer"
          >
            Закрыть
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
