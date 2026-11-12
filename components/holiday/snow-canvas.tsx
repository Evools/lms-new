"use client";

import React, { useEffect, useRef } from "react";

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
}

export function SnowCanvas() {
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

    // Ultra-lightweight: only 40 particles
    const PARTICLE_COUNT = 40;
    const particles: SnowflakeParticle[] = [];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2 + 1.2, // 1.2px to 3.2px
        speedY: Math.random() * 0.7 + 0.35, // 0.35 to 1.05 px/frame
        speedX: Math.random() * 0.3 - 0.15,
        opacity: Math.random() * 0.45 + 0.25, // 0.25 to 0.7
        swingAngle: Math.random() * Math.PI * 2,
        swingSpeed: Math.random() * 0.015 + 0.008,
        swingRadius: Math.random() * 0.8 + 0.4,
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

    const render = () => {
      if (!ctx || !isTabVisible) return;

      ctx.clearRect(0, 0, width, height);

      // Detect theme for snowflake color tint
      const isDark = document.documentElement.classList.contains("dark");
      const baseRgb = isDark ? "224, 242, 254" : "147, 197, 253"; // Light cyan-blue

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const p = particles[i];

        p.swingAngle += p.swingSpeed;
        p.y += p.speedY;
        p.x += Math.sin(p.swingAngle) * p.swingRadius + p.speedX;

        // Wrap around bottom
        if (p.y > height + 5) {
          p.y = -5;
          p.x = Math.random() * width;
        }

        // Wrap around sides
        if (p.x > width + 5) {
          p.x = -5;
        } else if (p.x < -5) {
          p.x = width + 5;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${baseRgb}, ${p.opacity})`;
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-50 h-full w-full select-none"
      aria-hidden="true"
    />
  );
}

