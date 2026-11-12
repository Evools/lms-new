"use client";

import React from "react";
import { Snowflake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHoliday } from "./holiday-provider";

export function SnowToggle() {
  const { isSnowEnabled, toggleSnow } = useHoliday();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={toggleSnow}
      className={`size-8 rounded-md cursor-pointer transition-colors ${
        isSnowEnabled
          ? "text-primary hover:text-primary hover:bg-primary/10"
          : "text-muted-foreground hover:text-foreground"
      }`}
      title={isSnowEnabled ? "Отключить снегопад" : "Включить новогодний снегопад"}
    >
      <Snowflake
        className={`h-4 w-4 transition-transform duration-500 ${
          isSnowEnabled ? "rotate-45" : ""
        }`}
      />
      <span className="sr-only">Снегопад</span>
    </Button>
  );
}

