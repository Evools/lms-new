"use client";

import React, { useEffect, useRef } from "react";
import type { SnowSettings } from "./holiday-provider";

interface SnowflakeParticle {
  x: number;
  y: number;
  radius: number;
  speedY: number; // pixels per second
  speedX: number; // pixels per second
  opacity: number;
  rotation: number;
  rotationSpeed: number; // radians per second
}

const DENSITY_COUNT = {
  light: 35,
  medium: 70,
  heavy: 120,
} as const;

const SPEED_MULTIPLIER = {
  slow: 0.6,
  normal: 1,
  fast: 1.65,
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

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId = 0;
    let isCancelled = false;
    let lastTime = performance.now();
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        lastTime = performance.now();
      }
    };

    window.addEventListener("resize", handleResize);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const count = DENSITY_COUNT[settings.density] ?? 70;
    const speedMult = SPEED_MULTIPLIER[settings.speed] ?? 1;

    const particles: SnowflakeParticle[] = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: settings.style === "flakes" ? 3 + Math.random() * 4 : 1.5 + Math.random() * 2.5,
      speedY: (24 + Math.random() * 48) * speedMult,
      speedX: (Math.random() - 0.5) * 24 * speedMult,
      opacity: 0.35 + Math.random() * 0.55,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 1.2,
    }));

    const drawFlake = (p: SnowflakeParticle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.strokeStyle = `rgba(210, 230, 255, ${p.opacity})`;
      ctx.lineWidth = 1;
      for (let i = 0; i < 6; i++) {
        ctx.rotate(Math.PI / 3);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -p.radius);
        ctx.stroke();
      }
      ctx.restore();
    };

    const render = (now: number) => {
      if (isCancelled) return;

      // Clamp delta time to max 50ms so returning from another tab never causes a speed spike
      const dt = Math.min(Math.max((now - lastTime) / 1000, 0), 0.05);
      lastTime = now;

      if (!document.hidden) {
        ctx.clearRect(0, 0, width, height);

        for (const p of particles) {
          p.y += p.speedY * dt;
          p.x += p.speedX * dt;
          p.rotation += p.rotationSpeed * dt;

          if (p.y > height + 10) {
            p.y = -10;
            p.x = Math.random() * width;
          }
          if (p.x > width + 10) p.x = -10;
          if (p.x < -10) p.x = width + 10;

          if (settings.style === "flakes") {
            drawFlake(p);
          } else {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(225, 238, 255, ${p.opacity})`;
            ctx.fill();
          }
        }
      }

      animationFrameId = window.requestAnimationFrame(render);
    };

    animationFrameId = window.requestAnimationFrame(render);

    return () => {
      isCancelled = true;
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [settings.density, settings.speed, settings.style]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50"
    />
  );
}
