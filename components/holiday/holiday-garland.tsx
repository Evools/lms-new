"use client";

import React from "react";

const BULB_COLORS = [
  { color: "#ef4444", shadow: "rgba(239, 68, 68, 0.6)", delay: "0s" },
  { color: "#10b981", shadow: "rgba(16, 185, 129, 0.6)", delay: "0.4s" },
  { color: "#f59e0b", shadow: "rgba(245, 158, 11, 0.6)", delay: "0.8s" },
  { color: "#3b82f6", shadow: "rgba(59, 130, 246, 0.6)", delay: "1.2s" },
  { color: "#a855f7", shadow: "rgba(168, 85, 247, 0.6)", delay: "1.6s" },
];

export function HolidayGarland() {
  // Render ~24 bulbs across the top of the header
  const bulbs = Array.from({ length: 25 }, (_, i) => {
    const config = BULB_COLORS[i % BULB_COLORS.length];
    return { id: i, ...config };
  });

  return (
    <div
      aria-hidden="true"
      className="absolute top-0 left-0 right-0 h-3 pointer-events-none overflow-hidden flex items-start justify-around px-2 z-40 select-none"
    >
      <style jsx>{`
        @keyframes garland-twinkle {
          0%, 100% {
            opacity: 0.95;
            transform: scale(1);
          }
          50% {
            opacity: 0.35;
            transform: scale(0.85);
          }
        }
        .garland-bulb {
          animation: garland-twinkle 1.8s ease-in-out infinite alternate;
        }
      `}</style>
      {bulbs.map((b) => (
        <div key={b.id} className="relative flex flex-col items-center">
          {/* Mini Wire Hook */}
          <div className="w-[1px] h-1 bg-border/80" />
          {/* Glowing Bulb */}
          <div
            className="garland-bulb size-1.5 rounded-full"
            style={{
              backgroundColor: b.color,
              boxShadow: `0 0 4px 1px ${b.shadow}`,
              animationDelay: b.delay,
            }}
          />
        </div>
      ))}
    </div>
  );
}

