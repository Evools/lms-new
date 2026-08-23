"use client";

import React from "react";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { startOnboardingTour } from "./onboarding-tour";

export function TourTriggerButton({
  variant = "ghost",
  className = "",
  showText = false,
}: {
  variant?: "ghost" | "outline" | "default" | "secondary";
  className?: string;
  showText?: boolean;
}) {
  return (
    <Button
      variant={variant}
      size={showText ? "xs" : "icon"}
      onClick={startOnboardingTour}
      className={`text-xs h-8 text-muted-foreground hover:text-foreground cursor-pointer ${
        showText ? "px-2.5 gap-1.5 font-medium" : "w-8"
      } ${className}`}
      title="Запустить интерактивный тур по платформе"
    >
      <Compass className="h-4 w-4 text-primary" />
      {showText && <span>Тур по системе</span>}
    </Button>
  );
}
