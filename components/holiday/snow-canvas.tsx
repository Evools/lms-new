"use client";

import React, { useEffect, useRef } from "react";
import type { SnowSettings } from "./holiday-provider";

interface SnowflakeParticle {
  x: number;
  y: number;
  radius: number;
  speedY: number;
  speedX: number;
  opacity: number;
  swingAngle: number;
  swingSpeed: number;
  swingRadius: number;
  rotation: number;
  rotationSpeed: number;
}

const DENSITY_MAP = {
  light: 20,
  medium: 45,
  heavy: 85,
} as const;

const SPEED_MAP = {
  slow: 0.6,
  normal: 1,
  fast: 1.6,
} as const;

export function SnowCanvas({
  settings = { density: "medium", speed: "normal", style: "soft" },
}: {
  settings?: SnowSettings;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    // Respect reduced motion preference
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize, { passive: true });

    const particleCount = DENSITY_MAP[settings.density] ?? 45;
    const speedMultiplier = SPEED_MAP[settings.speed] ?? 1;
    const isFlakes = settings.style === "flakes";
    const particles: SnowflakeParticle[] = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: isFlakes ? Math.random() * 3.2 + 3.2 : Math.random() * 2.4 + 1.6,
        speedY: (Math.random() * 0.65 + 0.35) * speedMultiplier,
        speedX: Math.random() * 0.3 - 0.15,
        opacity: Math.random() * 0.35 + 0.3,
        swingAngle: Math.random() * Math.PI * 2,
        swingSpeed: Math.random() * 0.015 + 0.008,
        swingRadius: Math.random() * 0.8 + 0.4,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.015,
      });
    }

    let animationFrameId: number;
    let isTabVisible = !document.hidden;

    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden;
      if (isTabVisible) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    const drawCrystalFlake = (
      x: number,
      y: number,
      r: number,
      rot: number,
      color: string
    ) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.lineCap = "round";

      for (let arm = 0; arm < 3; arm++) {
        ctx.rotate(Math.PI / 3);
        ctx.beginPath();
        ctx.moveTo(-r, 0);
        ctx.lineTo(r, 0);
        ctx.stroke();
      }
      ctx.restore();
    };

    const render = () => {
      if (!ctx || !isTabVisible) return;

      ctx.clearRect(0, 0, width, height);

      const isDark = document.documentElement.classList.contains("dark");
      const baseRgb = isDark ? "240, 249, 255" : "96, 165, 250";
      const opacityScale = isDark ? 1 : 0.9;

      for (let i = 0; i < particleCount; i++) {
        const p = particles[i];

        p.swingAngle += p.swingSpeed;
        p.rotation += p.rotationSpeed;
        p.y += p.speedY;
        p.x += Math.sin(p.swingAngle) * p.swingRadius + p.speedX;

        if (p.y > height + 8) {
          p.y = -8;
          p.x = Math.random() * width;
        }

        if (p.x > width + 8) {
          p.x = -8;
        } else if (p.x < -8) {
          p.x = width + 8;
        }

        const alpha = Math.min(0.85, p.opacity * opacityScale);

        if (isFlakes) {
          drawCrystalFlake(
            p.x,
            p.y,
            p.radius,
            p.rotation,
            `rgba(${baseRgb}, ${alpha})`
          );
        } else {
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
          grad.addColorStop(0, `rgba(${baseRgb}, ${alpha})`);
          grad.addColorStop(0.65, `rgba(${baseRgb}, ${alpha * 0.65})`);
          grad.addColorStop(1, `rgba(${baseRgb}, 0)`);

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [settings.density, settings.speed, settings.style]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-50 h-full w-full select-none"
      aria-hidden="true"
    />
  );
}
