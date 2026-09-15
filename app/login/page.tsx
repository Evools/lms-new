"use client";

import { useState, useTransition } from "react";
import { loginAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  ShieldAlert,
  Building2,
  Lock,
  Mail,
} from "lucide-react";

export default function LoginPage() {
  const [isPending, startTransition] = useTransition();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8 text-xs select-none">
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

            <Button
              type="submit"
              size="xs"
              className="w-full h-8 text-xs font-semibold gap-1.5 cursor-pointer touch-manipulation active:scale-[0.98]"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Вход...
                </>
              ) : (
                "Войти в систему"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
