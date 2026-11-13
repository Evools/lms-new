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
  rotation: number;
  rotationSpeed: number;
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
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    const count = DENSITY_COUNT[settings.density] ?? 70;
    const speedMult = SPEED_MULTIPLIER[settings.speed] ?? 1;

    const particles: SnowflakeParticle[] = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: settings.style === "flakes" ? 3 + Math.random() * 4 : 1.5 + Math.random() * 2.5,
      speedY: (0.4 + Math.random() * 0.9) * speedMult,
      speedX: (Math.random() - 0.5) * 0.5 * speedMult,
      opacity: 0.35 + Math.random() * 0.55,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.02,
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

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        p.y += p.speedY;
        p.x += p.speedX;
        p.rotation += p.rotationSpeed;

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

      animationFrameId = window.requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
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

