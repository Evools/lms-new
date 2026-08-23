"use client";

import React from "react";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { openTourHubModal } from "./tour-hub-modal";

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
      onClick={openTourHubModal}
      className={`text-xs h-8 text-muted-foreground hover:text-foreground cursor-pointer ${
        showText ? "px-2.5 gap-1.5 font-medium" : "w-8"
      } ${className}`}
      title="Центр обучения и туториалы"
    >
      <Compass className="h-4 w-4 text-primary" />
      {showText && <span>Обучение</span>}
    </Button>
  );
}
