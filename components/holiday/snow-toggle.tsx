"use client";

import React from "react";
import { Snowflake } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  { value: "medium", label: "Средний" },
  { value: "heavy", label: "Сильный" },
];

const SPEED_OPTIONS: { value: SnowSpeed; label: string }[] = [
  { value: "slow", label: "Медленно" },
  { value: "normal", label: "Обычно" },
  { value: "fast", label: "Быстро" },
];

const STYLE_OPTIONS: { value: SnowStyle; label: string }[] = [
  { value: "soft", label: "Точки" },
  { value: "flakes", label: "Снежинки" },
];

export function SnowToggle() {
  const { isSnowEnabled, toggleSnow, snowSettings, updateSnowSettings } =
    useHoliday();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Настройки снега"
            className={`h-8 w-8 rounded-md ${
              isSnowEnabled ? "text-primary bg-primary/10" : "text-muted-foreground"
            }`}
          />
        }
      >
        <Snowflake
          className={`h-4 w-4 transition-transform ${
            isSnowEnabled ? "rotate-45" : ""
          }`}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 p-3 space-y-3 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-medium">
            <Snowflake className="h-3.5 w-3.5 text-primary" />
            <span>Снег</span>
          </div>
          <Switch checked={isSnowEnabled} onCheckedChange={toggleSnow} />
        </div>

        <div className={`space-y-2.5 ${!isSnowEnabled ? "opacity-50 pointer-events-none" : ""}`}>
          <div className="space-y-1">
            <span className="text-[11px] text-muted-foreground font-medium">Плотность</span>
            <div className="grid grid-cols-3 gap-1">
              {DENSITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateSnowSettings({ density: opt.value })}
                  className={`rounded-md border px-2 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                    snowSettings.density === opt.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] text-muted-foreground font-medium">Скорость</span>
            <div className="grid grid-cols-3 gap-1">
              {SPEED_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateSnowSettings({ speed: opt.value })}
                  className={`rounded-md border px-2 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                    snowSettings.speed === opt.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] text-muted-foreground font-medium">Стиль</span>
            <div className="grid grid-cols-2 gap-1">
              {STYLE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateSnowSettings({ style: opt.value })}
                  className={`rounded-md border px-2 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                    snowSettings.style === opt.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground"
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

