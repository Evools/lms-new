"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { loginAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldAlert, ShieldCheck, UserCheck, GraduationCap, Building2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.append("email", email);
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
    setEmail(roleEmail);
    setPassword("password123");
    setError(null);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold tracking-tight">Лицей LMS</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Внутренняя платформа и рабочее пространство
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Вход в систему</CardTitle>
            <CardDescription>
              Введите свои учетные данные для доступа в личный кабинет
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <ShieldAlert className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Электронная почта</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@lyceum.edu"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Вход...
                  </>
                ) : (
                  "Войти"
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-3 border-t pt-4">
            <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
              <span>Тестовые аккаунты:</span>
              <Badge variant="outline" className="font-mono text-[10px]">
                password123
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-2 w-full">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex items-center justify-center gap-1 text-xs"
                onClick={() => handleQuickLogin("admin@lyceum.edu")}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Админ
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex items-center justify-center gap-1 text-xs"
                onClick={() => handleQuickLogin("teacher@lyceum.edu")}
              >
                <UserCheck className="h-3.5 w-3.5" />
                Учитель
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex items-center justify-center gap-1 text-xs"
                onClick={() => handleQuickLogin("starosta@lyceum.edu")}
              >
                <GraduationCap className="h-3.5 w-3.5" />
                Студент
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
