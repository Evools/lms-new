import React from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ShieldAlert, ArrowLeft, Sliders, Layers } from "lucide-react";

interface ModuleDisabledCardProps {
  moduleTitle: string;
  moduleDesc?: string;
  isAdmin?: boolean;
  returnUrl?: string;
}

export function ModuleDisabledCard({
  moduleTitle,
  moduleDesc = "Доступ к этому разделу временно приостановлен администрацией лицея. Все накопленные данные сохранены в системе.",
  isAdmin = false,
  returnUrl = "/dashboard",
}: ModuleDisabledCardProps) {
  return (
    <div className="w-full flex items-center justify-center min-h-[calc(100vh-12rem)] p-4">
      <div className="w-full max-w-[440px] bg-card border border-border rounded-xl p-5 shadow-2xs space-y-4 text-center">
        {/* Icon & Badge */}
        <div className="flex flex-col items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground bg-muted/60 px-2 py-0.5 rounded border border-border/50">
            Модуль временно отключен
          </span>
        </div>

        {/* Title & Description */}
        <div className="space-y-1.5">
          <h2 className="text-sm font-bold text-foreground">
            Раздел «{moduleTitle}» недоступен
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {moduleDesc}
          </p>
        </div>

        {/* Notice for Admin / User */}
        {isAdmin ? (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-2.5 text-left text-[11px] text-muted-foreground space-y-1">
            <div className="font-semibold text-primary flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5" /> Вы вошли как администратор
            </div>
            <p>
              Этот раздел отключен в настройках системы. Вы можете включить его обратно в любой момент.
            </p>
          </div>
        ) : (
          <div className="bg-muted/40 border border-border/60 rounded-lg p-2.5 text-left text-[11px] text-muted-foreground">
            Если вам необходим доступ к этому разделу для учебного процесса, пожалуйста, обратитесь к куратору или администратору системы.
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-2 pt-1">
          <Link
            href={returnUrl}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8 px-3 text-xs gap-1.5 font-medium")}
          >
            <ArrowLeft className="h-3.5 w-3.5" /> На главную
          </Link>

          {isAdmin && (
            <Link
              href="/dashboard/settings"
              className={cn(buttonVariants({ variant: "default", size: "sm" }), "h-8 px-3 text-xs gap-1.5 font-medium")}
            >
              <Sliders className="h-3.5 w-3.5" /> Настройки модулей
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
