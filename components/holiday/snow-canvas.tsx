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
  settings = { density: "medium", speed: "normal", style: "soft", drifts: true },
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

    // Realistic 2-layer organic snowdrift along the bottom edge
    const DRIFT_STEP = 16;
    const MAX_DRIFT_HEIGHT = 28;
    const createDriftMap = (w: number, layer: "back" | "front") => {
      const len = Math.max(2, Math.ceil(w / DRIFT_STEP) + 2);
      const arr = new Float32Array(len);
      for (let i = 0; i < len; i++) {
        const t = i / Math.max(1, len - 1); // 0..1 across viewport
        // Higher natural mounds near edges/corners, lower in center
        const edgeLift = Math.pow(Math.abs(t - 0.5) * 2, 1.8) * 10;
        if (layer === "back") {
          const ridge =
            11 +
            edgeLift +
            Math.sin(t * 7.3 + 0.8) * 3.8 +
            Math.sin(t * 15.1 + 2.1) * 1.9 +
            Math.cos(t * 23.7) * 0.9;
          arr[i] = Math.max(5, Math.min(MAX_DRIFT_HEIGHT, ridge));
        } else {
          const mound =
            7 +
            edgeLift * 0.85 +
            Math.sin(t * 5.7 + 2.4) * 3.5 +
            Math.cos(t * 12.9 + 0.5) * 2.1 +
            Math.sin(t * 21.3 + 1.4) * 0.8;
          arr[i] = Math.max(3, Math.min(MAX_DRIFT_HEIGHT - 3, mound));
        }
      }
      return arr;
    };

    let backDriftHeights = createDriftMap(width, "back");
    let frontDriftHeights = createDriftMap(width, "front");

    // Pre-seed subtle snow sparkles along the drift crests
    const sparkles = Array.from({ length: 18 }, () => ({
      t: Math.random(),
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.04 + 0.02,
      offsetY: Math.random() * 5 + 2,
    }));

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      backDriftHeights = createDriftMap(width, "back");
      frontDriftHeights = createDriftMap(width, "front");
    };

    window.addEventListener("resize", handleResize, { passive: true });

    const particleCount = DENSITY_MAP[settings.density] ?? 45;
    const speedMultiplier = SPEED_MAP[settings.speed] ?? 1;
    const isFlakes = settings.style === "flakes";
    const showDrifts = settings.drifts !== false;
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
          if (showDrifts) {
            const idx = Math.max(
              0,
              Math.min(frontDriftHeights.length - 1, Math.round(p.x / DRIFT_STEP))
            );
            const add = 0.14;
            frontDriftHeights[idx] = Math.min(
              MAX_DRIFT_HEIGHT - 2,
              frontDriftHeights[idx] + add
            );
          }
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

      if (showDrifts && frontDriftHeights.length > 1) {
        const traceCurve = (heights: Float32Array, closeBottom: boolean) => {
          ctx.beginPath();
          if (closeBottom) {
            ctx.moveTo(0, height);
            ctx.lineTo(0, height - heights[0]);
          } else {
            ctx.moveTo(0, height - heights[0]);
          }
          for (let i = 0; i < heights.length - 1; i++) {
            const x0 = i * DRIFT_STEP;
            const y0 = height - heights[i];
            const x1 = (i + 1) * DRIFT_STEP;
            const y1 = height - heights[i + 1];
            ctx.quadraticCurveTo(x0, y0, (x0 + x1) * 0.5, (y0 + y1) * 0.5);
          }
          if (closeBottom) {
            ctx.lineTo(width, height);
            ctx.closePath();
          }
        };

        // 1. Back ridge (cooler shadow layer for 3D depth)
        ctx.save();
        traceCurve(backDriftHeights, true);
        const backGrad = ctx.createLinearGradient(
          0,
          height - MAX_DRIFT_HEIGHT,
          0,
          height
        );
        if (isDark) {
          backGrad.addColorStop(0, "rgba(186, 230, 253, 0.22)");
          backGrad.addColorStop(1, "rgba(148, 163, 184, 0.14)");
        } else {
          backGrad.addColorStop(0, "rgba(203, 213, 225, 0.55)");
          backGrad.addColorStop(1, "rgba(148, 163, 184, 0.35)");
        }
        ctx.fillStyle = backGrad;
        ctx.fill();
        ctx.restore();

        // 2. Smooth front mound gently
        for (let i = 1; i < frontDriftHeights.length - 1; i++) {
          frontDriftHeights[i] =
            frontDriftHeights[i] * 0.96 +
            (frontDriftHeights[i - 1] + frontDriftHeights[i + 1]) * 0.02;
        }

        // 3. Front snowdrift body with soft ambient drop shadow + realistic gradient
        ctx.save();
        ctx.shadowColor = isDark
          ? "rgba(0, 0, 0, 0.35)"
          : "rgba(148, 163, 184, 0.32)";
        ctx.shadowBlur = 6;
        ctx.shadowOffsetY = -2;

        traceCurve(frontDriftHeights, true);
        const frontGrad = ctx.createLinearGradient(
          0,
          height - MAX_DRIFT_HEIGHT,
          0,
          height
        );
        if (isDark) {
          frontGrad.addColorStop(0, "rgba(248, 250, 252, 0.48)");
          frontGrad.addColorStop(0.55, "rgba(224, 242, 254, 0.32)");
          frontGrad.addColorStop(1, "rgba(186, 230, 253, 0.24)");
        } else {
          frontGrad.addColorStop(0, "rgba(255, 255, 255, 0.98)");
          frontGrad.addColorStop(0.5, "rgba(241, 245, 249, 0.96)");
          frontGrad.addColorStop(1, "rgba(226, 232, 240, 0.94)");
        }
        ctx.fillStyle = frontGrad;
        ctx.fill();
        ctx.restore();

        // 4. Soft sunlit snow crest highlight (no harsh wireframe line)
        ctx.save();
        traceCurve(frontDriftHeights, false);
        ctx.strokeStyle = isDark
          ? "rgba(255, 255, 255, 0.38)"
          : "rgba(255, 255, 255, 0.95)";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();

        // 5. Subtle crystalline frost sparkles on the snow
        for (let i = 0; i < sparkles.length; i++) {
          const sp = sparkles[i];
          sp.phase += sp.speed;
          const glint = Math.max(0, Math.sin(sp.phase));
          if (glint < 0.35) continue;
          const sx = sp.t * width;
          const bucket = Math.min(
            frontDriftHeights.length - 1,
            Math.floor(sx / DRIFT_STEP)
          );
          const sy = height - frontDriftHeights[bucket] + sp.offsetY;
          if (sy < height - 1) {
            ctx.fillStyle = isDark
              ? `rgba(255, 255, 255, ${glint * 0.7})`
              : `rgba(147, 197, 253, ${glint * 0.65})`;
            ctx.beginPath();
            ctx.arc(sx, sy, 1.1, 0, Math.PI * 2);
            ctx.fill();
          }
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
  }, [settings.density, settings.speed, settings.style, settings.drifts]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-50 h-full w-full select-none"
      aria-hidden="true"
    />
  );
}
