"use client";

import { useState, useTransition, useEffect } from "react";
import { loginAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import {
  Loader2,
  ShieldAlert,
  GraduationCap,
  Lock,
  Mail,
  Phone,
  Eye,
  EyeOff,
  Sun,
  Moon,
  HelpCircle,
  ChevronDown,
  X,
  ArrowRight,
  Sparkles,
  Info,
  Check,
} from "lucide-react";

const SLIDES = [
  {
    title: "Инновационное обучение,\nуверенное будущее",
    subtitle: "Единая платформа учебных курсов, дисциплин и проектной работы",
  },
  {
    title: "Управление знаниями\nв едином пространстве",
    subtitle: "Успеваемость, расписание и прямое взаимодействие с преподавателями",
  },
  {
    title: "Современные сервисы\nнового поколения",
    subtitle: "Защищенный и удобный доступ к материалам в любое время",
  },
];

export default function LoginPage() {
  const [isPending, startTransition] = useTransition();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);

  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Automatic slide rotation
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const handlePasswordKeyEvent = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setIsCapsLockOn(e.getModifierState("CapsLock"));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.append("identifier", identifier.trim());
    formData.append("password", password);

    startTransition(async () => {
      try {
        const res = await loginAction(formData);
        if (res?.error) {
          setError(res.error);
        } else {
          window.location.href = "/dashboard";
        }
      } catch (err: unknown) {
        if (!(err instanceof Error && err.message === "NEXT_REDIRECT")) {
          setError("Произошла ошибка при входе. Попробуйте еще раз.");
        }
      }
    });
  };

  const isNumericPhone =
    identifier.trim().startsWith("+") ||
    /^\d/.test(identifier.trim().replace(/\s/g, ""));

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-background px-4 py-8 text-xs select-none sm:px-6">
      {/* Ambient background decoration */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[640px] -translate-x-1/2 rounded-full bg-primary/10 blur-[130px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,var(--color-border)_1px,transparent_0)] [background-size:24px_24px] opacity-40 dark:opacity-20"
        aria-hidden="true"
      />

      {/* Main split-card container (Matching user mockup) */}
      <div className="relative z-10 w-full max-w-4xl overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xl backdrop-blur-xs sm:rounded-3xl">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* LEFT SHOWCASE PANEL (Futuristic Lyceum Campus) */}
          <div className="relative hidden flex-col justify-between overflow-hidden p-6 md:flex md:min-h-[520px]">
            {/* Background Lyceum Campus Image (Light Mode) */}
            <img
              src="/images/auth/lyceum_light.jpg"
              alt="Утренний кампус лицея"
              className={cn(
                "absolute inset-0 h-full w-full object-cover select-none pointer-events-none transition-opacity duration-700 ease-in-out",
                resolvedTheme === "dark" ? "opacity-0" : "opacity-100"
              )}
            />

            {/* Background Lyceum Campus Image (Dark Mode) */}
            <img
              src="/images/auth/lyceum_dark.jpg"
              alt="Вечерний кампус лицея"
              className={cn(
                "absolute inset-0 h-full w-full object-cover select-none pointer-events-none transition-opacity duration-700 ease-in-out",
                resolvedTheme === "dark" ? "opacity-100" : "opacity-0"
              )}
            />

            {/* Cinematic contrast overlay for text legibility */}
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30 transition-opacity duration-700"
              aria-hidden="true"
            />

            {/* Left Header: Brand Logo + Theme Pill */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white backdrop-blur-md">
                  <GraduationCap className="size-4" />
                </div>
                <span className="text-sm font-semibold tracking-tight text-white">
                  LMS System
                </span>
              </div>

              {mounted && (
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/90 backdrop-blur-md transition-colors hover:bg-white/20 cursor-pointer"
                  title="Переключить тему оформления"
                >
                  {resolvedTheme === "dark" ? (
                    <>
                      <Sun className="size-3" />
                      <span>Светлая</span>
                    </>
                  ) : (
                    <>
                      <Moon className="size-3" />
                      <span>Тёмная</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Left Footer: Inspiring Quote + Slider Indicator Dots */}
            <div className="relative z-10 space-y-4">
              <div className="min-h-[64px] space-y-1">
                <h3 className="text-base font-bold leading-snug whitespace-pre-line text-white">
                  {SLIDES[activeSlide].title}
                </h3>
                <p className="text-[11px] text-white/70">
                  {SLIDES[activeSlide].subtitle}
                </p>
              </div>

              {/* Slider Dots */}
              <div className="flex items-center gap-1.5 pt-1">
                {SLIDES.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveSlide(idx)}
                    className={cn(
                      "h-1 rounded-full transition-all duration-300 cursor-pointer",
                      activeSlide === idx
                        ? "w-7 bg-white"
                        : "w-2 bg-white/35 hover:bg-white/60"
                    )}
                    aria-label={`Перейти к слайду ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT FORM PANEL (shadcn styled auth) */}
          <div className="flex flex-col justify-between p-6 sm:p-8">
            {/* Mobile Brand Header */}
            <div className="mb-4 flex items-center justify-between md:hidden">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                  <GraduationCap className="size-4" />
                </div>
                <span className="text-xs font-semibold tracking-tight text-foreground">
                  LMS System
                </span>
              </div>

              {mounted && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={toggleTheme}
                  className="size-7 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  {resolvedTheme === "dark" ? (
                    <Sun className="size-3.5" />
                  ) : (
                    <Moon className="size-3.5" />
                  )}
                </Button>
              )}
            </div>

            <div className="space-y-5">
              {/* Form Title & Subtitle */}
              <div className="space-y-1">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                  Вход в систему
                </h1>
                <p className="text-xs text-muted-foreground">
                  Введите ваши данные для доступа к платформе
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {error && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive flex items-center gap-2">
                    <ShieldAlert className="size-4 shrink-0" />
                    <span className="leading-snug">{error}</span>
                  </div>
                )}

                {/* Identifier Input */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="identifier"
                    className="font-medium text-foreground text-xs flex items-center justify-between"
                  >
                    <span className="flex items-center gap-1">
                      {isNumericPhone ? (
                        <Phone className="size-3 text-muted-foreground" />
                      ) : (
                        <Mail className="size-3 text-muted-foreground" />
                      )}
                      Email или номер телефона
                    </span>
                    {identifier && (
                      <button
                        type="button"
                        onClick={() => setIdentifier("")}
                        className="text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5 cursor-pointer"
                      >
                        <X className="size-2.5" /> Очистить
                      </button>
                    )}
                  </label>
                  <div className="relative flex items-center">
                    <div className="pointer-events-none absolute left-3 flex items-center text-muted-foreground">
                      {isNumericPhone ? (
                        <Phone className="size-3.5" />
                      ) : (
                        <Mail className="size-3.5" />
                      )}
                    </div>
                    <Input
                      id="identifier"
                      type="text"
                      placeholder="name@lyceum.edu или +996..."
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="h-9 pl-9 pr-3 text-xs bg-background/60"
                      autoCapitalize="none"
                      autoCorrect="off"
                      autoComplete="username"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="font-medium text-foreground text-xs flex items-center gap-1"
                    >
                      <Lock className="size-3 text-muted-foreground" /> Пароль
                    </label>
                    {isCapsLockOn && (
                      <span className="text-[10px] text-primary flex items-center gap-0.5 font-medium">
                        <Sparkles className="size-2.5" /> Caps Lock включен
                      </span>
                    )}
                  </div>
                  <div className="relative flex items-center">
                    <div className="pointer-events-none absolute left-3 flex items-center text-muted-foreground">
                      <Lock className="size-3.5" />
                    </div>
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={handlePasswordKeyEvent}
                      onKeyUp={handlePasswordKeyEvent}
                      onBlur={() => setIsCapsLockOn(false)}
                      className="h-9 pl-9 pr-9 text-xs bg-background/60"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 flex size-6 items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      title={showPassword ? "Скрыть пароль" : "Показать пароль"}
                      aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                    >
                      {showPassword ? (
                        <EyeOff className="size-3.5" />
                      ) : (
                        <Eye className="size-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center pt-0.5 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-muted-foreground hover:text-foreground select-none">
                    <Checkbox
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(!!checked)}
                      className="size-3.5"
                    />
                    <span className="text-[11px] font-medium">Запомнить меня</span>
                  </label>
                </div>

                {/* Submit Action Button */}
                <Button
                  type="submit"
                  size="default"
                  className="w-full h-9 text-xs font-medium gap-1.5 cursor-pointer touch-manipulation active:scale-[0.99] mt-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                  disabled={isPending}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" /> Авторизация...
                    </>
                  ) : (
                    <>
                      Войти в систему
                      <ArrowRight className="size-3.5" />
                    </>
                  )}
                </Button>
              </form>
            </div>

            {/* Bottom Recovery & Help Section */}
            <div className="mt-6 border-t border-border/50 pt-3 flex flex-col items-center">
              <button
                type="button"
                onClick={() => setShowHelp(!showHelp)}
                className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 text-[11px] cursor-pointer"
              >
                <HelpCircle className="size-3 text-primary" />
                <span>Восстановление доступа</span>
                <ChevronDown
                  className={cn(
                    "size-3 text-muted-foreground transition-transform duration-300",
                    showHelp && "rotate-180"
                  )}
                />
              </button>

              {/* Smooth Animated Help Accordion */}
              <div
                className={cn(
                  "grid transition-all duration-300 ease-in-out overflow-hidden w-full",
                  showHelp
                    ? "grid-rows-[1fr] opacity-100 mt-2"
                    : "grid-rows-[0fr] opacity-0 mt-0 pointer-events-none"
                )}
              >
                <div className="overflow-hidden">
                  <div className="w-full rounded-lg border border-border/80 bg-muted/40 p-2.5 text-[11px] text-muted-foreground space-y-1 text-left">
                    <div className="font-medium text-foreground flex items-center gap-1">
                      <Info className="size-3 text-primary" /> Восстановление доступа
                    </div>
                    <p className="leading-relaxed">
                      Логин и первичный пароль выдаются куратором группы или администратором лицея. Если вы забыли пароль или потеряли доступ, обратитесь к мастеру или куратору.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
