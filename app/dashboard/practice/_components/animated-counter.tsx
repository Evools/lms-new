"use client";

import React, { useEffect, useRef, useState } from "react";

export function AnimatedCounter({
  value,
  duration = 500,
  suffix = "",
  animateOnMount = true,
}: {
  value: number;
  duration?: number;
  suffix?: string;
  animateOnMount?: boolean;
}) {
  const [displayValue, setDisplayValue] = useState<number>(animateOnMount && value > 0 ? 0 : value);
  const prevValueRef = useRef<number>(animateOnMount && value > 0 ? 0 : value);
  const isFirstRender = useRef<boolean>(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (!animateOnMount || value === 0) {
        return;
      }
    }

    const startValue = prevValueRef.current;
    const diff = value - startValue;
    if (diff === 0) {
      setDisplayValue(value);
      return;
    }

    let startTime: number | null = null;
    let frameId: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // easeOutCubic: fast start, smooth deceleration
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + diff * ease);
      setDisplayValue(current);

      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      } else {
        prevValueRef.current = value;
      }
    };

    frameId = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(frameId);
      prevValueRef.current = value;
    };
  }, [value, duration, animateOnMount]);

  return (
    <span className="tabular-nums">
      {displayValue}
      {suffix}
    </span>
  );
}
