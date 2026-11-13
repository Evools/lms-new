"use client";

import React from "react";
import { Snowflake } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useHoliday,
  type SnowDensity,
  type SnowSpeed,
  type SnowStyle,
} from "./holiday-provider";

const DENSITY_OPTIONS: { value: SnowDensity; label: string }[] = [
  { value: "light", label: "Лёгкий" },
  { value: "medium", label: "Обычно" },
  { value: "heavy", label: "Метель" },
];

const SPEED_OPTIONS: { value: SnowSpeed; label: string }[] = [
  { value: "slow", label: "Плавно" },
  { value: "normal", label: "Обычно" },
  { value: "fast", label: "Быстро" },
];

const STYLE_OPTIONS: { value: SnowStyle; label: string }[] = [
  { value: "soft", label: "Мягкий" },
  { value: "flakes", label: "Снежинки" },
];

export function SnowToggle() {
  const { isSnowEnabled, toggleSnow, snowSettings, updateSnowSettings } =
    useHoliday();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={`inline-flex items-center justify-center size-8 rounded-md cursor-pointer transition-colors hover:bg-muted focus:outline-none ${
          isSnowEnabled
            ? "text-primary hover:bg-primary/10"
            : "text-muted-foreground hover:text-foreground"
        }`}
        title="Настройки снегопада"
      >
        <Snowflake
          className={`h-4 w-4 transition-transform duration-500 ${
            isSnowEnabled ? "rotate-45" : ""
          }`}
        />
        <span className="sr-only">Настройки снегопада</span>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={6}
        className="w-60 p-3 space-y-3 text-xs border border-border rounded-xl bg-card"
      >
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-border">
          <div className="flex items-center gap-1.5 font-medium text-foreground">
            <Snowflake className="h-3.5 w-3.5 text-primary" />
            <span>Снегопад</span>
          </div>
          <Switch checked={isSnowEnabled} onCheckedChange={toggleSnow} />
        </div>

        <div className={`space-y-2.5 ${!isSnowEnabled ? "opacity-50 pointer-events-none" : ""}`}>
          {/* Density */}
          <div className="space-y-1">
            <span className="text-[11px] text-muted-foreground font-medium">
              Интенсивность
            </span>
            <div className="grid grid-cols-3 gap-1 p-0.5 bg-muted/60 rounded-lg border border-border">
              {DENSITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateSnowSettings({ density: opt.value })}
                  className={`h-6 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                    snowSettings.density === opt.value
                      ? "bg-background text-primary border border-border"
                      : "text-muted-foreground hover:text-foreground border border-transparent"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Speed */}
          <div className="space-y-1">
            <span className="text-[11px] text-muted-foreground font-medium">
              Скорость
            </span>
            <div className="grid grid-cols-3 gap-1 p-0.5 bg-muted/60 rounded-lg border border-border">
              {SPEED_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateSnowSettings({ speed: opt.value })}
                  className={`h-6 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                    snowSettings.speed === opt.value
                      ? "bg-background text-primary border border-border"
                      : "text-muted-foreground hover:text-foreground border border-transparent"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Style */}
          <div className="space-y-1">
            <span className="text-[11px] text-muted-foreground font-medium">
              Вид
            </span>
            <div className="grid grid-cols-2 gap-1 p-0.5 bg-muted/60 rounded-lg border border-border">
              {STYLE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateSnowSettings({ style: opt.value })}
                  className={`h-6 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                    snowSettings.style === opt.value
                      ? "bg-background text-primary border border-border"
                      : "text-muted-foreground hover:text-foreground border border-transparent"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
