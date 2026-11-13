"use client";

import React from "react";

const PATTERN_BULBS = [
  { x: 20, y: 6.5, color: "#ef4444", glow: "rgba(239, 68, 68, 0.55)", delay: "0s" },
  { x: 60, y: 6.5, color: "#10b981", glow: "rgba(16, 185, 129, 0.55)", delay: "0.6s" },
  { x: 100, y: 6.5, color: "#f59e0b", glow: "rgba(245, 158, 11, 0.55)", delay: "1.2s" },
  { x: 140, y: 6.5, color: "#38bdf8", glow: "rgba(56, 189, 248, 0.55)", delay: "1.8s" },
];

export function HolidayGarland() {
  return (
    <div
      aria-hidden="true"
      className="absolute top-0 left-0 right-0 h-[22px] pointer-events-none overflow-hidden z-40 select-none"
    >
      <style jsx>{`
        @keyframes garland-glow {
          0%, 100% {
            opacity: 0.95;
          }
          50% {
            opacity: 0.42;
          }
        }
        .garland-bulb-anim {
          animation: garland-glow 2.4s ease-in-out infinite alternate;
        }
      `}</style>

      <svg className="w-full h-[22px] block" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern
            id="lms-holiday-garland"
            width="160"
            height="22"
            patternUnits="userSpaceOnUse"
          >
            {/* Curved festoon wire */}
            <path
              d="M 0 1 Q 40 11 80 1.5 Q 120 11 160 1"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.15"
              className="text-muted-foreground/45"
            />

            {/* Bulbs along the wire */}
            {PATTERN_BULBS.map((b, idx) => (
              <g key={idx} transform={`translate(${b.x}, ${b.y})`}>
                {/* Soft ambient glow */}
                <circle
                  cx="0"
                  cy="6.5"
                  r="6"
                  fill={b.glow}
                  className="garland-bulb-anim"
                  style={{ animationDelay: b.delay, opacity: 0.3 }}
                />
                {/* Bulb socket / cap */}
                <rect
                  x="-1.6"
                  y="0"
                  width="3.2"
                  height="2.6"
                  rx="0.8"
                  className="fill-muted-foreground/80"
                />
                {/* Teardrop glass bulb */}
                <path
                  d="M -2.2 2.6 C -2.8 4.4, -2.5 9.2, 0 9.6 C 2.5 9.2, 2.8 4.4, 2.2 2.6 Z"
                  fill={b.color}
                  className="garland-bulb-anim"
                  style={{ animationDelay: b.delay }}
                />
                {/* Glass highlight */}
                <ellipse
                  cx="-0.8"
                  cy="5"
                  rx="0.65"
                  ry="1.35"
                  fill="#ffffff"
                  opacity="0.65"
                />
              </g>
            ))}
          </pattern>
        </defs>

        <rect width="100%" height="22" fill="url(#lms-holiday-garland)" />
      </svg>
    </div>
  );
}
