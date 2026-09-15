"use client";

import { useState, useTransition, useEffect } from "react";
import { loginAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/components/theme-provider";
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
  X,
  ArrowRight,
  Sparkles,
  Info,
} from "lucide-react";

export default function LoginPage() {
  const [isPending, startTransition] = useTransition();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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
    <div className="relative flex min-h-screen flex-col justify-between overflow-hidden bg-background text-xs select-none">
      {/* Ambient background decoration */}
      <div
        className="pointer-events-none absolute -top-32 left-1/2 h-[340px] w-[560px] -translate-x-1/2 rounded-full bg-primary/10 blur-[110px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,var(--color-border)_1px,transparent_0)] [background-size:24px_24px] opacity-40 dark:opacity-20"
        aria-hidden="true"
      />

      {/* Top Navigation Bar */}
      <header className="relative z-10 flex items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
            <GraduationCap className="size-4" />
          </div>
          <span className="text-xs font-semibold tracking-tight text-foreground">
            Лицей LMS
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="h-6 gap-1.5 px-2 text-[10px] font-normal border-border bg-card/60 backdrop-blur-xs text-muted-foreground"
          >
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Портал активен
          </Badge>

          {mounted && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={toggleTheme}
              className="size-7 rounded-lg text-muted-foreground hover:text-foreground"
              title={
                resolvedTheme === "dark"
                  ? "Включить светлую тему"
                  : "Включить тёмную тему"
              }
            >
              {resolvedTheme === "dark" ? (
                <Sun className="size-3.5" />
              ) : (
                <Moon className="size-3.5" />
              )}
            </Button>
          )}
        </div>
      </header>

      {/* Main Login Card Section */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-6">
        <div className="w-full max-w-[380px] space-y-4">
          {/* Logo Brand Emblem */}
          <div className="flex flex-col items-center text-center space-y-1">
            <div className="flex size-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-xs ring-4 ring-primary/5">
              <GraduationCap className="size-6" />
            </div>
            <h1 className="text-base font-bold tracking-tight text-foreground pt-1">
              Лицей LMS
            </h1>
            <p className="text-[11px] text-muted-foreground">
              Единая платформа образовательного процесса
            </p>
          </div>

          {/* shadcn Card Container */}
          <Card
            size="sm"
            className="border-border/80 bg-card/95 shadow-sm backdrop-blur-xs gap-3.5 py-4"
          >
            <CardHeader className="p-4 pb-0 space-y-1">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Lock className="size-3.5 text-primary" /> Вход в личный кабинет
                </CardTitle>
                <Badge
                  variant="secondary"
                  className="h-5 px-1.5 text-[10px] font-medium text-muted-foreground"
                >
                  Портал лицея
                </Badge>
              </div>
              <CardDescription className="text-[11px] text-muted-foreground">
                Введите логин (email или телефон) и пароль
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 py-0 space-y-3">
              <form onSubmit={handleSubmit} className="space-y-3">
                {error && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive flex items-center gap-2">
                    <ShieldAlert className="size-4 shrink-0" />
                    <span className="leading-snug">{error}</span>
                  </div>
                )}

                {/* Identifier Input */}
                <div className="space-y-1">
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
                        className="text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5"
                      >
                        <X className="size-2.5" /> Очистить
                      </button>
                    )}
                  </label>
                  <div className="relative flex items-center">
                    <div className="pointer-events-none absolute left-2.5 flex items-center text-muted-foreground">
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
                      className="h-8 pl-8 pr-3 text-xs bg-background"
                      autoCapitalize="none"
                      autoCorrect="off"
                      autoComplete="username"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1">
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
                    <div className="pointer-events-none absolute left-2.5 flex items-center text-muted-foreground">
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
                      className="h-8 pl-8 pr-8 text-xs bg-background"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 flex size-6 items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors"
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

                {/* Submit Action Button */}
                <Button
                  type="submit"
                  size="sm"
                  className="w-full h-8 text-xs font-medium gap-1.5 cursor-pointer touch-manipulation active:scale-[0.99] mt-1"
                  disabled={isPending}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" /> Вход в систему...
                    </>
                  ) : (
                    <>
                      Войти в систему
                      <ArrowRight className="size-3.5" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>

            {/* Assistance & Recovery */}
            <CardFooter className="p-4 pt-2 pb-1 flex flex-col gap-2 border-t border-border/50 text-[11px]">
              <div className="w-full flex items-center justify-center pt-1">
                <button
                  type="button"
                  onClick={() => setShowHelp(!showHelp)}
                  className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 text-[11px]"
                >
                  <HelpCircle className="size-3 text-primary" />
                  <span>Помощь со входом</span>
                </button>
              </div>

              {showHelp && (
                <div className="w-full rounded-lg border border-border/80 bg-muted/40 p-2.5 text-[11px] text-muted-foreground space-y-1">
                  <div className="font-medium text-foreground flex items-center gap-1">
                    <Info className="size-3 text-primary" /> Восстановление доступа
                  </div>
                  <p className="leading-relaxed">
                    Логин и первичный пароль выдаются куратором группы или администратором лицея. Если вы забыли пароль или потеряли доступ, обратитесь в учебную часть.
                  </p>
                </div>
              )}
            </CardFooter>
          </Card>
        </div>
      </main>

      {/* Footer System Notice */}
      <footer className="relative z-10 py-3 text-center text-[11px] text-muted-foreground border-t border-border/30 bg-background/50 backdrop-blur-xs">
        © {new Date().getFullYear()} Лицей LMS. Защищенный доступ к учебным материалам
      </footer>
    </div>
  );
}
