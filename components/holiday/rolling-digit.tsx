"use client";

import React, { useState, useEffect, useRef } from "react";

interface RollingDigitProps {
  digit: string;
}

export function RollingDigit({ digit }: RollingDigitProps) {
  const [current, setCurrent] = useState(digit);
  const [previous, setPrevious] = useState<string | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const prevDigitRef = useRef<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // On initial mount/hydration, store current digit without animating
    if (prevDigitRef.current === null) {
      prevDigitRef.current = digit;
      setCurrent(digit);
      return;
    }

    // Only roll when this specific digit character actually changes
    if (prevDigitRef.current !== digit) {
      const oldDigit = prevDigitRef.current;
      prevDigitRef.current = digit;

      // Respect prefers-reduced-motion
      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (prefersReducedMotion) {
        setCurrent(digit);
        setPrevious(null);
        setIsRolling(false);
        return;
      }

      setPrevious(oldDigit);
      setCurrent(digit);
      setIsRolling(false);

      // Trigger vertical rolling transition in next animation frame
      const frame = requestAnimationFrame(() => {
        setIsRolling(true);
      });

      // Safety fallback to clean up after animation completes
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setIsRolling(false);
        setPrevious(null);
      }, 550);

      return () => {
        cancelAnimationFrame(frame);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }
  }, [digit]);

  const handleTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    if (e.propertyName === "transform") {
      setIsRolling(false);
      setPrevious(null);
    }
  };

  return (
    <span
      className="relative inline-flex flex-col items-center justify-start h-[1.25em] overflow-hidden leading-none tabular-nums select-none"
      style={{ verticalAlign: "middle" }}
    >
      <div
        className="flex flex-col items-center will-change-transform"
        style={{
          transform: isRolling ? "translateY(-50%)" : "translateY(0%)",
          transition: isRolling
            ? "transform 500ms cubic-bezier(0.22, 1, 0.36, 1)"
            : "none",
        }}
        onTransitionEnd={handleTransitionEnd}
      >
        {/* Top slot: previous digit (moves upward and out of view) */}
        <span className="h-[1.25em] flex items-center justify-center">
          {previous ?? current}
        </span>
        {/* Bottom slot: new digit (rolls up into view from below) */}
        {previous !== null && (
          <span className="h-[1.25em] flex items-center justify-center">
            {current}
          </span>
        )}
      </div>
    </span>
  );
}

interface RollingNumberProps {
  value: number | string;
  minDigits?: number;
}

export function RollingNumber({ value, minDigits = 1 }: RollingNumberProps) {
  const str = String(value).padStart(minDigits, "0");

  return (
    <span className="inline-flex items-center tabular-nums">
      {str.split("").map((d, index) => {
        // Stable position key from the right: units = pos-0, tens = pos-1, etc.
        const posKey = `pos-${str.length - 1 - index}`;
        return <RollingDigit key={posKey} digit={d} />;
      })}
    </span>
  );
}

