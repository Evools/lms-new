"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { loginAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldAlert, ShieldCheck, UserCheck, GraduationCap, Building2, Lock, Mail } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.append("identifier", identifier);
    formData.append("password", password);

    startTransition(async () => {
      try {
        const res = await loginAction(formData);
        if (res?.error) {
          setError(res.error);
        } else {
          router.push("/dashboard");
          router.refresh();
        }
      } catch (err: any) {
        if (err?.message !== "NEXT_REDIRECT") {
          setError("Произошла ошибка при входе. Попробуйте еще раз.");
        }
      }
    });
  };

  const handleQuickLogin = (roleEmail: string) => {
    setIdentifier(roleEmail);
    setPassword("password123");
    setError(null);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8 text-xs">
      <div className="w-full max-w-sm space-y-4">
        {/* Logo & Brand Header */}
        <div className="flex flex-col items-center space-y-1.5 text-center">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
            <Building2 className="h-6 w-6" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-sm font-bold tracking-tight text-foreground">Лицей LMS</h1>
            <p className="text-[11px] text-muted-foreground">
              Внутренняя платформа образовательного процесса
            </p>
          </div>
        </div>

        {/* Login Form Card */}
        <div className="rounded-xl border bg-card p-4 space-y-4 shadow-2xs">
          <div className="space-y-1 border-b pb-3">
            <h2 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-primary" /> Вход в личный кабинет
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Введите email или номер телефона и пароль
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {error && (
              <div className="p-2.5 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1">
              <label htmlFor="identifier" className="font-medium text-foreground text-xs flex items-center gap-1">
                <Mail className="h-3 w-3 text-muted-foreground" /> Email или номер телефона
              </label>
              <Input
                id="identifier"
                type="text"
                placeholder="name@lyceum.edu или +996 555..."
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="h-8 text-xs bg-background"
                autoCapitalize="none"
                autoCorrect="off"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="password" className="font-medium text-foreground text-xs flex items-center gap-1">
                <Lock className="h-3 w-3 text-muted-foreground" /> Пароль
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-8 text-xs bg-background"
              />
            </div>

            <Button type="submit" size="xs" className="w-full h-8 text-xs font-semibold gap-1.5 cursor-pointer" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Вход...
                </>
              ) : (
                "Войти в систему"
              )}
            </Button>
          </form>

          {/* Quick Role Login Footer */}
          <div className="pt-3 border-t space-y-2">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Быстрый вход (тестовый):</span>
              <Badge variant="outline" className="font-mono text-[9px] px-1 py-0 font-medium">
                password123
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickLogin("admin@lyceum.edu")}
                className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg border border-border bg-muted/30 hover:bg-primary/10 hover:border-primary/30 text-[11px] font-medium text-foreground transition-colors"
              >
                <ShieldCheck className="h-3 w-3 text-primary shrink-0" />
                <span>Админ</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin("teacher@lyceum.edu")}
                className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg border border-border bg-muted/30 hover:bg-primary/10 hover:border-primary/30 text-[11px] font-medium text-foreground transition-colors"
              >
                <UserCheck className="h-3 w-3 text-primary shrink-0" />
                <span>Учитель</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin("starosta@lyceum.edu")}
                className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg border border-border bg-muted/30 hover:bg-primary/10 hover:border-primary/30 text-[11px] font-medium text-foreground transition-colors"
              >
                <GraduationCap className="h-3 w-3 text-primary shrink-0" />
                <span>Студент</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
