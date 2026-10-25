"use client";

import React, { useState } from "react";
import {
  Globe,
  Monitor,
  Tablet,
  Smartphone,
  RotateCw,
  ExternalLink,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface InteractivePreviewFrameProps {
  url: string;
  title?: string;
  defaultExpanded?: boolean;
}

type ViewportMode = "desktop" | "tablet" | "mobile";

/** Formats special platform embed URLs (CodePen, Figma) if needed */
function getEmbedUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  const lower = trimmed.toLowerCase();

  // CodePen: convert /pen/ to /embed/
  if (lower.includes("codepen.io") && lower.includes("/pen/")) {
    const embedBase = trimmed.replace("/pen/", "/embed/");
    return embedBase.includes("?")
      ? `${embedBase}&default-tab=result&theme-id=dark`
      : `${embedBase}?default-tab=result&theme-id=dark`;
  }

  // Figma: convert standard file/proto link to official embed
  if (lower.includes("figma.com") && !lower.includes("figma.com/embed")) {
    return `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(trimmed)}`;
  }

  return trimmed;
}

export function InteractivePreviewFrame({
  url,
  title = "Интерактивная демонстрация проекта",
  defaultExpanded = true,
}: InteractivePreviewFrameProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [viewport, setViewport] = useState<ViewportMode>("desktop");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  if (!url) return null;

  const embedUrl = getEmbedUrl(url);

  // Derive readable domain or platform badge
  let domainBadge = "Web";
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    const host = parsed.hostname.toLowerCase();
    if (host.includes("github.io")) domainBadge = "GitHub Pages";
    else if (host.includes("vercel.app")) domainBadge = "Vercel";
    else if (host.includes("netlify.app")) domainBadge = "Netlify";
    else if (host.includes("codepen.io")) domainBadge = "CodePen";
    else if (host.includes("figma.com")) domainBadge = "Figma";
    else domainBadge = host.replace(/^www\./, "");
  } catch {
    domainBadge = "Демо";
  }

  const handleRefresh = () => {
    setIsLoading(true);
    setRefreshKey((prev) => prev + 1);
  };

  const getViewportWidthClass = () => {
    switch (viewport) {
      case "mobile":
        return "max-w-[390px]";
      case "tablet":
        return "max-w-[768px]";
      default:
        return "w-full";
    }
  };

  return (
    <div
      className={`rounded-xl border border-border bg-card overflow-hidden transition-all duration-200 ${
        isFullscreen
          ? "fixed inset-2 z-50 flex flex-col bg-background shadow-2xl"
          : "w-full"
      }`}
    >
      {/* Browser Toolbar Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-muted/60 border-b text-xs select-none">
        {/* Left: Title & Badge */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-md bg-primary/10 text-primary shrink-0">
            <Globe className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-bold text-foreground text-xs truncate">
                {title}
              </span>
              <Badge variant="secondary" className="text-[9px] px-1.5 py-0 font-normal shrink-0">
                {domainBadge}
              </Badge>
            </div>
            <div className="text-[10px] text-muted-foreground truncate font-mono max-w-[280px] sm:max-w-[400px]">
              {url}
            </div>
          </div>
        </div>

        {/* Right: Controls & Viewport Toggles */}
        <div className="flex items-center gap-1 shrink-0">
          {isExpanded && (
            <>
              {/* Viewport Switcher */}
              <div className="hidden sm:flex items-center bg-background rounded-md border p-0.5 mr-1 text-muted-foreground">
                <button
                  type="button"
                  onClick={() => setViewport("desktop")}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 transition-colors ${
                    viewport === "desktop"
                      ? "bg-muted text-primary font-semibold"
                      : "hover:text-foreground"
                  }`}
                  title="Десктоп (100%)"
                >
                  <Monitor className="h-3 w-3" />
                  <span className="hidden md:inline">100%</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewport("tablet")}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 transition-colors ${
                    viewport === "tablet"
                      ? "bg-muted text-primary font-semibold"
                      : "hover:text-foreground"
                  }`}
                  title="Планшет (768px)"
                >
                  <Tablet className="h-3 w-3" />
                  <span className="hidden md:inline">768px</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewport("mobile")}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 transition-colors ${
                    viewport === "mobile"
                      ? "bg-muted text-primary font-semibold"
                      : "hover:text-foreground"
                  }`}
                  title="Мобильный (390px)"
                >
                  <Smartphone className="h-3 w-3" />
                  <span className="hidden md:inline">390px</span>
                </button>
              </div>

              {/* Reload Button */}
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={handleRefresh}
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                title="Перезагрузить страницу"
              >
                <RotateCw className="h-3.5 w-3.5" />
              </Button>

              {/* Fullscreen Toggle */}
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                title={isFullscreen ? "Свернуть" : "Развернуть на весь экран"}
              >
                {isFullscreen ? (
                  <Minimize2 className="h-3.5 w-3.5" />
                ) : (
                  <Maximize2 className="h-3.5 w-3.5" />
                )}
              </Button>
            </>
          )}

          {/* External Link */}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
            title="Открыть в новой вкладке"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>

          {/* Collapse / Expand Toggle */}
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            title={isExpanded ? "Свернуть превью" : "Показать интерактивное демо"}
          >
            {isExpanded ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>

      {/* Frame Container */}
      {isExpanded && (
        <div
          className={`relative bg-neutral-900/10 dark:bg-neutral-950 flex justify-center items-stretch overflow-hidden transition-all ${
            isFullscreen ? "flex-1 min-h-0" : "h-[540px]"
          }`}
        >
          {/* Loading Indicator */}
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-xs z-10 text-xs text-muted-foreground gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span>Загрузка интерактивного проекта...</span>
            </div>
          )}

          <div
            className={`w-full transition-all duration-300 flex justify-center ${getViewportWidthClass()} ${
              viewport !== "desktop" ? "border-x border-border shadow-lg" : ""
            }`}
          >
            <iframe
              key={refreshKey}
              src={embedUrl}
              title={title}
              onLoad={() => setIsLoading(false)}
              className="w-full h-full bg-background border-0"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              loading="lazy"
            />
          </div>
        </div>
      )}
    </div>
  );
}
