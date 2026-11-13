"use client";

import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import {
  Sparkles,
  PartyPopper,
  Gift,
  X,
  Clock,
  RefreshCw,
  Trophy,
  Flame,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHoliday } from "./holiday-provider";
import { RollingNumber } from "./rolling-digit";

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const getHolidayWishes = (nextYear: number) => [
  "Пусть все тесты проходят с первого раза и без багов!",
  "Только отличных оценок и автоматов на зимней сессии!",
  `Чистого кода, быстрого билда и стабильного деплоя в ${nextYear} году!`,
  "Новых амбициозных проектов и высоких достижений в IT!",
  "Уютных зимних каникул, ярких впечатлений и праздничного вдохновения!",
];

export function HolidayBanner() {
  const {
    isHolidayEnabled,
    isBannerDismissed,
    dismissBanner,
    restoreBanner,
  } = useHoliday();
  const [timeLeft, setTimeLeft] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [mounted, setMounted] = useState(false);
  const [wishIndex, setWishIndex] = useState(0);
  const [wishCopied, setWishCopied] = useState(false);

  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const nextYear = currentYear + 1;
  const holidayWishes = useMemo(() => getHolidayWishes(nextYear), [nextYear]);

  // Calculate percentage of 2026 elapsed
  const yearProgress = useMemo(() => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();
    const endOfYear = new Date(now.getFullYear() + 1, 0, 1).getTime();
    const current = now.getTime();
    const progress = Math.min(
      100,
      Math.max(0, Math.round(((current - startOfYear) / (endOfYear - startOfYear)) * 100))
    );
    return progress;
  }, []);

  useEffect(() => {
    setMounted(true);

    const calculateTime = () => {
      const now = new Date();
      // Target: January 1, 2027 00:00:00
      const nextYear = now.getFullYear() + 1;
      const targetDate = new Date(nextYear, 0, 1, 0, 0, 0);
      const diffMs = targetDate.getTime() - now.getTime();

      if (diffMs <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const totalSeconds = Math.floor(diffMs / 1000);
      const days = Math.floor(totalSeconds / (3600 * 24));
      const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      setTimeLeft({ days, hours, minutes, seconds });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleNextWish = () => {
    setWishIndex((prev) => (prev + 1) % holidayWishes.length);
    setWishCopied(false);
  };

  const handleCopyWish = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(holidayWishes[wishIndex]);
      setWishCopied(true);
      setTimeout(() => setWishCopied(false), 2000);
    }
  };

  if (!mounted || !isHolidayEnabled) {
    return null;
  }

  if (isBannerDismissed) {
    return (
      <div className="flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl border border-border bg-card/60 backdrop-blur-xs text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="size-3.5 text-primary shrink-0" />
          <span className="font-medium text-foreground truncate">
            Праздничный баннер свёрнут
          </span>
          <span className="text-[11px] text-muted-foreground hidden sm:inline truncate">
            — таймер до {nextYear} года и пожелания
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={restoreBanner}
          className="h-6 px-2.5 text-xs text-primary hover:text-primary hover:bg-primary/10 gap-1.5 font-medium shrink-0 cursor-pointer"
        >
          <Sparkles className="size-3 text-primary" />
          Развернуть баннер
        </Button>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-primary/25 bg-gradient-to-br from-primary/10 via-background to-primary/5 p-4 sm:p-5 lg:p-6 lg:py-7 min-h-[160px] sm:min-h-[175px] transition-all flex flex-col justify-center">
      {/* Atmospheric Radial Color Blooms */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 -left-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-16 -right-16 h-48 w-48 rounded-full bg-emerald-500/15 blur-3xl"
      />

      {/* Festive Christmas Branch Decoration (pinned to top-right on mobile so it never collides with text or countdown) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 right-0 select-none z-0 flex items-start justify-end w-28 h-28 sm:w-44 sm:h-44 md:w-56 md:h-56 lg:h-full lg:w-auto lg:max-w-[55%] opacity-20 sm:opacity-40 md:opacity-60 lg:opacity-100 transition-opacity"
      >
        <Image
          src="/images/christmas/christmas.png"
          alt="Праздничное оформление"
          width={600}
          height={600}
          priority
          className="w-full h-full lg:w-auto lg:h-full object-contain object-right-top pointer-events-none"
        />
      </div>

      {/* Christmas Gnome Illustration (anchored to bottom-left corner) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 sm:left-1 md:left-3 z-10 select-none flex items-end"
      >
        <Image
          src="/images/christmas/knitted.png"
          alt="Новогодний гномик"
          width={350}
          height={350}
          priority
          className="h-20 sm:h-28 md:h-36 lg:h-44 w-auto object-contain object-bottom pointer-events-none"
        />
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 sm:gap-4 lg:gap-5">
        {/* Left Side: Main Story */}
        <div className="space-y-1.5 min-w-0 max-w-2xl pl-0 md:pl-28 lg:pl-36 pr-8 sm:pr-10 lg:pr-0">
          {/* Badges Bar */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
              <Sparkles className="size-3 text-primary animate-pulse" />
              Новогодний сезон
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              <Flame className="size-3 text-primary" />
              Финал семестра {currentYear}
            </span>
            <span className="hidden md:inline-flex items-center gap-1 rounded-full border border-border bg-background/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              <Trophy className="size-3 text-primary" />
              IT Лицей №98
            </span>
          </div>

          {/* Title with Gradient Highlight */}
          <h2 className="text-sm sm:text-base lg:text-lg font-bold tracking-tight text-foreground flex flex-wrap items-center gap-1.5">
            <span>С наступающим Новым</span>
            <span className="bg-gradient-to-r from-primary via-emerald-500 to-teal-400 bg-clip-text text-transparent font-extrabold">
              {nextYear} годом!
            </span>
          </h2>

          {/* Inspiring Wish Bar with interactive switcher */}
          <div className="flex items-center gap-2 pt-0.5">
            <div className="text-[11px] sm:text-xs text-muted-foreground leading-snug sm:leading-relaxed flex items-center gap-1.5 min-w-0">
              <Gift className="size-3.5 text-primary shrink-0" />
              <span className="italic font-medium text-foreground/90 line-clamp-2 sm:line-clamp-none">
                «{holidayWishes[wishIndex]}»
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={handleNextWish}
              title="Другое пожелание"
              className="size-5 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 shrink-0 cursor-pointer"
            >
              <RefreshCw className="size-3" />
              <span className="sr-only">Другое пожелание</span>
            </Button>
          </div>

          {/* Year Progress Bar */}
          <div className="pt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className="font-medium shrink-0">{currentYear} год:</span>
            <div className="h-1.5 w-24 sm:w-36 rounded-full bg-muted overflow-hidden border border-border/50">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${yearProgress}%` }}
              />
            </div>
            <span className="font-mono font-medium text-primary">{yearProgress}%</span>
          </div>
        </div>

        {/* Right Side: Solid White Countdown Cards */}
        <div className="flex flex-col items-end self-end lg:self-auto gap-1 sm:gap-1.5 shrink-0 z-10 pl-16 sm:pl-24 lg:pl-0">
          <div className="flex items-center gap-1.5 px-1.5 sm:px-2 py-0.5 rounded-md bg-white/95 dark:bg-card/95 border border-border/80 text-[9px] sm:text-[10px] font-medium text-foreground uppercase tracking-wider">
            <Clock className="size-3 text-primary" />
            <span>До 1 января {nextYear}:</span>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2">
            {/* Days Card */}
            <div className="flex flex-col items-center justify-center min-w-[46px] sm:min-w-[54px] md:min-w-[60px] px-1.5 py-1.5 sm:px-2 sm:py-2 rounded-lg border border-border bg-white dark:bg-card">
              <div className="font-mono text-sm sm:text-base md:text-lg font-bold text-foreground">
                <RollingNumber value={timeLeft.days} />
              </div>
              <div className="text-[8px] sm:text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
                дней
              </div>
            </div>

            <span className="text-foreground/60 font-bold text-xs">:</span>

            {/* Hours Card */}
            <div className="flex flex-col items-center justify-center min-w-[46px] sm:min-w-[54px] md:min-w-[60px] px-1.5 py-1.5 sm:px-2 sm:py-2 rounded-lg border border-border bg-white dark:bg-card">
              <div className="font-mono text-sm sm:text-base md:text-lg font-bold text-foreground">
                <RollingNumber value={timeLeft.hours} minDigits={2} />
              </div>
              <div className="text-[8px] sm:text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
                часов
              </div>
            </div>

            <span className="text-foreground/60 font-bold text-xs">:</span>

            {/* Minutes Card */}
            <div className="flex flex-col items-center justify-center min-w-[46px] sm:min-w-[54px] md:min-w-[60px] px-1.5 py-1.5 sm:px-2 sm:py-2 rounded-lg border border-border bg-white dark:bg-card">
              <div className="font-mono text-sm sm:text-base md:text-lg font-bold text-foreground">
                <RollingNumber value={timeLeft.minutes} minDigits={2} />
              </div>
              <div className="text-[8px] sm:text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
                минут
              </div>
            </div>

            <span className="text-foreground/60 font-bold text-xs">:</span>

            {/* Seconds Card */}
            <div className="flex flex-col items-center justify-center min-w-[46px] sm:min-w-[54px] md:min-w-[60px] px-1.5 py-1.5 sm:px-2 sm:py-2 rounded-lg border border-border bg-white dark:bg-card">
              <div className="font-mono text-sm sm:text-base md:text-lg font-bold text-foreground">
                <RollingNumber value={timeLeft.seconds} minDigits={2} />
              </div>
              <div className="text-[8px] sm:text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
                секунд
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dismiss / Collapse Button */}
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onClick={dismissBanner}
        className="absolute top-2.5 right-2.5 z-30 size-6 rounded-md text-muted-foreground hover:text-foreground bg-white/90 dark:bg-card/90 hover:bg-white dark:hover:bg-card border border-border/80 cursor-pointer"
        title="Свернуть баннер"
      >
        <X className="h-3.5 w-3.5" />
        <span className="sr-only">Свернуть</span>
      </Button>
    </div>
  );
}
