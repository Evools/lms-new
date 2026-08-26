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
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { startOnboardingTour } from "./onboarding-tour";
import { useRouter } from "next/navigation";

export type UserRole = "STUDENT" | "TEACHER" | "ADMIN";

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
    description: "Главная страница, оперативные сводки по лицею, меню разделов, уведомления и профиль.",
    icon: <Compass className="h-4 w-4 text-primary" />,
    hasTour: true,
    roles: ["STUDENT", "TEACHER", "ADMIN"],
  },
  {
    id: "student_assignments",
    title: "Сдача домашних заданий",
    badge: "Учеба",
    duration: "2 мин",
    route: "/dashboard/assignments",
    description: "Как просматривать требования ДЗ, прикреплять файлы решений и отслеживать оценки.",
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
    description: "Онлайн-тестирование: таймер, типы вопросов, выбор ответов и мгновенные результаты.",
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
    description: "Просмотр истории пропусков, справок по болезни и процента личной посещаемости.",
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
    description: "Реестр работ, фильтр «На проверку», модальное окно рецензирования и оценки 1-5.",
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
    description: "Markdown-редактор, шаблоны лабораторных, ссылки на GitHub/Figma и дедлайны.",
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
    description: "Конструктор с 9 типами вопросов, таймеры, автопроверка и сводная ведомость группы.",
    icon: <FileCheck2 className="h-4 w-4 text-primary" />,
    hasTour: true,
    roles: ["TEACHER", "ADMIN"],
  },
  {
    id: "attendance",
    title: "Журнал посещаемости",
    badge: "Учебный процесс",
    duration: "1 мин",
    route: "/dashboard/attendance",
    description: "Отметка всех студентов в 1 клик, статусы (Б, Н, О), комментарии и ведомость.",
    icon: <CalendarCheck className="h-4 w-4 text-primary" />,
    hasTour: true,
    roles: ["TEACHER", "ADMIN"],
  },
  {
    id: "students",
    title: "Студенты и группы",
    badge: "Администрирование",
    duration: "2 мин",
    route: "/dashboard/students",
    description: "База учащихся, зачисление, распределение по курсам и пакетный Excel-импорт.",
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
    description: "Расписание ответственных групп, этажей и старших дежурных по лицею.",
    icon: <Clock className="h-4 w-4 text-primary" />,
    hasTour: true,
    roles: ["ADMIN"],
  },
  {
    id: "settings",
    title: "Учебные годы и настройки",
    badge: "Администрирование",
    duration: "2 мин",
    route: "/dashboard/settings",
    description: "Управление периодами (2026-2027), ролями пользователей и безопасностью.",
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
    answer: "В разделе «Домашние задания» выберите активное задание. В форме отправки введите текст решения или прикрепите файлы (архив .zip, документ или изображение) и нажмите кнопку «Отправить на проверку».",
    actionRoute: "/dashboard/assignments",
    actionLabel: "К заданиям",
    roles: ["STUDENT"],
  },
  {
    id: "std-statuses",
    question: "Что означают статусы «На проверке», «Принято» и «На доработке»?",
    answer: "«На проверке» — ваше решение успешно отправлено преподавателю. «Принято» — преподаватель проверил работу и выставил оценку. «На доработке» — необходимо исправить замечания и отправить обновленное решение.",
    actionRoute: "/dashboard/assignments",
    actionLabel: "Мои задания",
    roles: ["STUDENT"],
  },
  {
    id: "std-pass-tests",
    question: "Как проходить онлайн-тесты в системе?",
    answer: "В разделе «Тестирование» выберите назначенный тест и нажмите «Начать». Вверху страницы появится таймер обратного отсчета. Ответьте на все вопросы и нажмите «Завершить тест» — результат и набранные баллы отобразятся сразу.",
    actionRoute: "/dashboard/lms/tests",
    actionLabel: "Пройти тест",
    roles: ["STUDENT"],
  },
  {
    id: "std-view-attendance",
    question: "Где посмотреть мои пропуски и посещаемость?",
    answer: "В разделе «Посещаемость» отображаются все ваши отметки: присутствие, уважительные пропуски по справке (Б), пропуски по неуважительной причине (Н) и опоздания (О).",
    actionRoute: "/dashboard/attendance",
    actionLabel: "Посещаемость",
    roles: ["STUDENT"],
  },
  {
    id: "tch-hw-review",
    question: "Как быстро проверить работы студентов?",
    answer: "В разделе «Домашние задания» нажмите таб «На проверку». Кликните на карточку задания, откроется окно проверки: выберите оценку от 1 до 5 звезд, кликните по готовому шаблону отзыва и нажмите «Принять и дальше ➔» для автоматического перехода к следующему студенту.",
    actionRoute: "/dashboard/assignments",
    actionLabel: "Открыть задания",
    roles: ["TEACHER", "ADMIN"],
  },
  {
    id: "tch-hw-templates",
    question: "Как использовать готовые шаблоны при создании ДЗ?",
    answer: "В конструкторе (/dashboard/assignments/new) в панели инструментов редактора нажмите «Выбрать шаблон». Система автоматически вставит готовую структуру: цели, чеклист задач, пример кода и требования.",
    actionRoute: "/dashboard/assignments/new",
    actionLabel: "Создать ДЗ",
    roles: ["TEACHER", "ADMIN"],
  },
  {
    id: "tch-tests-types",
    question: "Какие типы вопросов поддерживаются в онлайн-тестах?",
    answer: "Конструктор поддерживает 9 типов: один вариант, несколько вариантов, верно/неверно, текст, числовой ввод, порядок, сопоставление, пропуски и вопросы с кодом (подсветка Python, JS, C++, SQL).",
    actionRoute: "/dashboard/lms/tests",
    actionLabel: "Конструктор тестов",
    roles: ["TEACHER", "ADMIN"],
  },
  {
    id: "tch-tests-cheating",
    question: "Как защитить тестирование от списывания?",
    answer: "При создании теста установите лимит времени на прохождение (таймер в минутах), включите случайное перемешивание вопросов и вариантов ответов, а также ограничьте количество попыток.",
    actionRoute: "/dashboard/lms/tests",
    actionLabel: "К тестам",
    roles: ["TEACHER", "ADMIN"],
  },
  {
    id: "tch-att-fast",
    question: "Как отметить посещаемость группы за несколько секунд?",
    answer: "В Журнале посещаемости выберите предмет и нажмите кнопку «Отметить всех присутствующими». После этого останется только кликнуть по нескольким отсутствующим студентам (выбрать Болел, Не был или Опоздал) и нажать «Сохранить».",
    actionRoute: "/dashboard/attendance",
    actionLabel: "Открыть журнал",
    roles: ["TEACHER", "ADMIN"],
  },
  {
    id: "adm-students-excel",
    question: "Как загрузить студентов списком из Excel?",
    answer: "В разделе «База студентов» нажмите кнопку «Импорт из Excel». Загрузите стандартный файл .xlsx — система автоматически создаст учетные записи и распределит студентов по нужным группам.",
    actionRoute: "/dashboard/students",
    actionLabel: "База студентов",
    roles: ["ADMIN"],
  },
  {
    id: "adm-duty-plan",
    question: "Как составить график дежурств по лицею?",
    answer: "В разделе «График дежурств» выберите нужную дату, закрепите дежурную группу и ответственного куратора. Назначенные дежурные на текущий день автоматически выводятся на главной странице дашборда.",
    actionRoute: "/dashboard/duty",
    actionLabel: "График дежурств",
    roles: ["ADMIN"],
  },
  {
    id: "adm-years",
    question: "Как добавить новый учебный год и переключить активный?",
    answer: "В разделе «Настройки» перейдите на вкладку «Учебные годы». Нажмите «Добавить год», укажите даты начала/окончания и переключатель «Активный». Все формы создания групп автоматически привяжутся к нему.",
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
    keys: ["Ctrl", "Enter"],
    action: "Отправить решение / опубликовать задание",
    scope: "Формы и редакторы",
    roles: ["STUDENT", "TEACHER", "ADMIN"],
  },
  {
    keys: ["Esc"],
    action: "Закрыть модальное окно / отмена",
    scope: "Вся система",
    roles: ["STUDENT", "TEACHER", "ADMIN"],
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
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"tours" | "faq" | "shortcuts">("tours");
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);

  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      setActiveTab("tours");
      setExpandedFaqId(null);
    };

    window.addEventListener("lms-open-tour-hub", handleOpen);
    return () => window.removeEventListener("lms-open-tour-hub", handleOpen);
  }, []);

  const tours = useMemo(() => {
    return ALL_TOURS.filter((t) => t.roles.includes(userRole));
  }, [userRole]);

  const faqItems = useMemo(() => {
    return ALL_FAQ_ITEMS.filter((f) => f.roles.includes(userRole));
  }, [userRole]);

  const shortcuts = useMemo(() => {
    return ALL_SHORTCUTS.filter((s) => s.roles.includes(userRole));
  }, [userRole]);

  const handleStartTour = (tour: TourCard) => {
    setIsOpen(false);
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
      : userRole === "TEACHER"
      ? "Преподаватель"
      : "Студент";

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="p-0 gap-0 sm:max-w-[920px] w-full overflow-hidden rounded-xl border bg-card text-card-foreground shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary shrink-0">
              <GraduationCap className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                Путеводитель по Лицею LMS
                <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 border-primary/30 text-primary font-medium">
                  {roleLabel}
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Пошаговые интерактивные туры, частые вопросы и горячие клавиши
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* 3 Main Segmented Tabs */}
        <div className="px-4 pt-3 pb-2 border-b bg-background">
          <div className="grid grid-cols-3 gap-1 p-1 bg-muted/60 rounded-lg border text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("tours")}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md font-medium transition-colors cursor-pointer text-xs ${activeTab === "tours"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <Compass className="h-3.5 w-3.5" />
              <span>Интерактивные туры</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("faq")}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md font-medium transition-colors cursor-pointer text-xs ${activeTab === "faq"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <HelpCircle className="h-3.5 w-3.5" />
              <span>Частые вопросы (FAQ)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("shortcuts")}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md font-medium transition-colors cursor-pointer text-xs ${activeTab === "shortcuts"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <Keyboard className="h-3.5 w-3.5" />
              <span>Горячие клавиши</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 max-h-[62vh] overflow-y-auto space-y-3">
          {/* TAB 1: Interactive Learning */}
          {activeTab === "tours" && (
            <div className="space-y-3">
              <p className="text-[11px] text-muted-foreground">
                Выберите раздел — система запустит интерактивный сценарий или откроет соответствующий рабочий модуль:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {tours.map((tour) => (
                  <div
                    key={tour.id}
                    className="group flex flex-col justify-between p-3.5 rounded-xl border border-border/80 bg-card hover:border-primary/50 hover:shadow-xs transition-all text-xs"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0">
                          {tour.icon}
                        </div>
                        <Badge
                          variant="secondary"
                          className="text-[10px] py-0 px-1.5 h-5 font-normal text-muted-foreground"
                        >
                          <Clock className="h-2.5 w-2.5 mr-1 text-muted-foreground" />
                          {tour.duration}
                        </Badge>
                      </div>

                      <div>
                        <div className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-0.5">
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
                        variant={tour.hasTour ? "default" : "outline"}
                        size="xs"
                        onClick={() => handleStartTour(tour)}
                        className={`w-full h-7 text-xs gap-1.5 font-medium cursor-pointer ${
                          tour.hasTour
                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                            : "border-border text-foreground hover:bg-muted"
                        }`}
                      >
                        {tour.hasTour ? (
                          <>
                            <Play className="h-3 w-3" /> Начать обучение
                          </>
                        ) : (
                          <>
                            <ExternalLink className="h-3 w-3" /> Открыть раздел
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: FAQ Accordion */}
          {activeTab === "faq" && (
            <div className="space-y-2">
              <p className="text-[11px] text-muted-foreground mb-2">
                Краткие и понятные ответы на часто возникающие вопросы:
              </p>

              <div className="space-y-2">
                {faqItems.map((item) => {
                  const isExpanded = expandedFaqId === item.id;
                  return (
                    <div
                      key={item.id}
                      className="rounded-lg border border-border/80 bg-card overflow-hidden text-xs transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedFaqId((prev) => (prev === item.id ? null : item.id))
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
                                className="h-6 text-[11px] px-2.5 gap-1 font-medium border-primary/30 text-primary hover:bg-primary/10 cursor-pointer"
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
                    className="p-3 rounded-lg border border-border/80 bg-card flex items-center justify-between gap-3 hover:bg-muted/20 transition-colors text-xs"
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
                          className="px-1.5 py-0.5 rounded bg-muted border border-border text-[11px] font-mono font-medium text-foreground shadow-2xs"
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
            className="h-7 text-xs px-3 font-medium cursor-pointer"
          >
            Закрыть
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}



