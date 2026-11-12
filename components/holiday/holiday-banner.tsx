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

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const HOLIDAY_WISHES = [
  "Пусть все тесты проходят с первого раза и без багов!",
  "Только отличных оценок и автоматов на зимней сессии!",
  "Чистого кода, быстрого билда и стабильного деплоя в 2027 году!",
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
    setWishIndex((prev) => (prev + 1) % HOLIDAY_WISHES.length);
    setWishCopied(false);
  };

  const handleCopyWish = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(HOLIDAY_WISHES[wishIndex]);
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
            — таймер до 2027 года и пожелания
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
    <div className="relative overflow-hidden rounded-xl border border-primary/25 bg-gradient-to-br from-primary/10 via-background to-primary/5 p-5 sm:p-6 sm:py-7 min-h-[160px] sm:min-h-[175px] transition-all flex flex-col justify-center">
      {/* Atmospheric Radial Color Blooms */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 -left-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-16 -right-16 h-48 w-48 rounded-full bg-emerald-500/15 blur-3xl"
      />

      {/* Festive Christmas Branch Decoration (object-contain to banner height) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 right-0 h-full w-auto max-w-[55%] select-none z-0 flex items-center justify-end"
      >
        <Image
          src="/images/christmas/christmas.png"
          alt="Праздничное оформление"
          width={600}
          height={600}
          priority
          className="h-full w-auto max-h-full object-contain object-right-top pointer-events-none"
        />
      </div>

      {/* Christmas Gnome Illustration (anchored to bottom-left corner) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 sm:left-2 md:left-3 z-10 select-none flex items-end"
      >
        <Image
          src="/images/christmas/knitted.png"
          alt="Новогодний гномик"
          width={350}
          height={350}
          priority
          className="h-28 sm:h-36 md:h-40 lg:h-44 w-auto object-contain object-bottom pointer-events-none"
        />
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        {/* Left Side: Main Story */}
        <div className="space-y-1.5 min-w-0 max-w-2xl pl-24 sm:pl-32 md:pl-36 lg:pl-40">
          {/* Badges Bar */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
                <Sparkles className="size-3 text-primary animate-pulse" />
                Новогодний сезон
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                <Flame className="size-3 text-primary" />
                Финал семестра 2026
              </span>
              <span className="hidden md:inline-flex items-center gap-1 rounded-full border border-border bg-background/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                <Trophy className="size-3 text-primary" />
                IT Лицей №98
              </span>
            </div>

            {/* Title with Gradient Highlight */}
            <h2 className="text-sm sm:text-base font-bold tracking-tight text-foreground flex flex-wrap items-center gap-1.5">
              <span>С наступающим Новым</span>
              <span className="bg-gradient-to-r from-primary via-emerald-500 to-teal-400 bg-clip-text text-transparent font-extrabold">
                2027 годом!
              </span>
            </h2>

            {/* Inspiring Wish Bar with interactive switcher */}
            <div className="flex items-center gap-2 pt-0.5">
              <div className="text-xs text-muted-foreground leading-relaxed flex items-center gap-1.5">
                <Gift className="size-3.5 text-primary shrink-0" />
                <span className="italic font-medium text-foreground/90">
                  «{HOLIDAY_WISHES[wishIndex]}»
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
            <div className="pt-1.5 flex items-center gap-2 text-[10px] text-muted-foreground">
              <span className="font-medium shrink-0">2026 год:</span>
              <div className="h-1.5 w-28 sm:w-36 rounded-full bg-muted overflow-hidden border border-border/50">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${yearProgress}%` }}
                />
              </div>
              <span className="font-mono font-medium text-primary">{yearProgress}%</span>
            </div>
          </div>

        {/* Right Side: Solid White Countdown Cards */}
        <div className="flex flex-col items-end gap-1.5 shrink-0 z-10">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/95 dark:bg-card/95 border border-border/80 text-[10px] font-medium text-foreground uppercase tracking-wider">
            <Clock className="size-3 text-primary" />
            <span>До 1 января 2027:</span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Days Card */}
            <div className="flex flex-col items-center justify-center min-w-[52px] sm:min-w-[60px] px-2 py-2 rounded-lg border border-border bg-white dark:bg-card">
              <div className="font-mono text-base sm:text-lg font-bold text-foreground">
                {timeLeft.days}
              </div>
              <div className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
                дней
              </div>
            </div>

            <span className="text-foreground/60 font-bold text-xs">:</span>

            {/* Hours Card */}
            <div className="flex flex-col items-center justify-center min-w-[52px] sm:min-w-[60px] px-2 py-2 rounded-lg border border-border bg-white dark:bg-card">
              <div className="font-mono text-base sm:text-lg font-bold text-foreground">
                {String(timeLeft.hours).padStart(2, "0")}
              </div>
              <div className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
                часов
              </div>
            </div>

            <span className="text-foreground/60 font-bold text-xs">:</span>

            {/* Minutes Card */}
            <div className="flex flex-col items-center justify-center min-w-[52px] sm:min-w-[60px] px-2 py-2 rounded-lg border border-border bg-white dark:bg-card">
              <div className="font-mono text-base sm:text-lg font-bold text-foreground">
                {String(timeLeft.minutes).padStart(2, "0")}
              </div>
              <div className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
                минут
              </div>
            </div>

            <span className="text-foreground/60 font-bold text-xs">:</span>

            {/* Seconds Card */}
            <div className="flex flex-col items-center justify-center min-w-[52px] sm:min-w-[60px] px-2 py-2 rounded-lg border border-border bg-white dark:bg-card">
              <div className="font-mono text-base sm:text-lg font-bold text-foreground">
                {String(timeLeft.seconds).padStart(2, "0")}
              </div>
              <div className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
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
        className="absolute top-2.5 right-2.5 z-20 size-6 rounded-md text-muted-foreground hover:text-foreground bg-white/90 dark:bg-card/90 hover:bg-white dark:hover:bg-card border border-border/80 cursor-pointer"
        title="Свернуть баннер"
      >
        <X className="h-3.5 w-3.5" />
        <span className="sr-only">Свернуть</span>
      </Button>
    </div>
  );
}
