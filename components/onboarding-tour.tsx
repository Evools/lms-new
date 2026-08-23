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

const DEFAULT_TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    targetSelector: "[data-tour='sidebar-nav']",
    title: "Навигация и разделы",
    description:
      "Здесь собраны все ключевые разделы системы: учебные группы, база студентов, дисциплины, журнал посещаемости и онлайн-тестирование LMS.",
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
      "Все важные системные события, назначения тестов, объявления и дежурства мгновенно появляются здесь.",
    icon: <Bell className="h-4 w-4 text-primary" />,
    placement: "bottom",
  },
  {
    id: "user-profile",
    targetSelector: "[data-tour='sidebar-user']",
    title: "Профиль и персональные настройки",
    description:
      "Переключение темы оформления (светлая/тёмная), изменение пароля, управление аккаунтом и доступ к системным настройкам.",
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
];

const STORAGE_KEY = "lms_onboarding_tour_completed_v2";

export function startOnboardingTour() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("lms-start-tour"));
  }
}

export function OnboardingTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const steps = DEFAULT_TOUR_STEPS;
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
        setCurrentStepIndex(0);
      }, 900);
      return () => clearTimeout(timer);
    }
  }, []);

  // Listen for manual tour trigger
  useEffect(() => {
    const handleStart = () => {
      setIsOpen(true);
      setCurrentStepIndex(0);
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
