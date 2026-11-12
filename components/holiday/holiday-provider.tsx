"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { SnowCanvas } from "./snow-canvas";

interface HolidayContextType {
  isHolidayEnabled: boolean;
  isAdmin: boolean;
  isSnowEnabled: boolean;
  toggleSnow: () => void;
  isBannerDismissed: boolean;
  dismissBanner: () => void;
  restoreBanner: () => void;
  toggleBanner: () => void;
}

const HolidayContext = createContext<HolidayContextType>({
  isHolidayEnabled: true,
  isAdmin: false,
  isSnowEnabled: true,
  toggleSnow: () => {},
  isBannerDismissed: false,
  dismissBanner: () => {},
  restoreBanner: () => {},
  toggleBanner: () => {},
});

export function HolidayProvider({
  children,
  isHolidayEnabled = true,
  isAdmin = false,
}: {
  children: React.ReactNode;
  isHolidayEnabled?: boolean;
  isAdmin?: boolean;
}) {
  const [isSnowEnabled, setIsSnowEnabled] = useState(true);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedSnow = localStorage.getItem("lms_holiday_snow");
    if (savedSnow !== null) {
      setIsSnowEnabled(savedSnow === "true");
    }
    const savedDismissed = localStorage.getItem("lms_holiday_banner_dismissed");
    if (savedDismissed === "true") {
      setIsBannerDismissed(true);
    }
  }, []);

  const toggleSnow = () => {
    setIsSnowEnabled((prev) => {
      const next = !prev;
      localStorage.setItem("lms_holiday_snow", String(next));
      return next;
    });
  };

  const dismissBanner = () => {
    setIsBannerDismissed(true);
    localStorage.setItem("lms_holiday_banner_dismissed", "true");
  };

  const restoreBanner = () => {
    setIsBannerDismissed(false);
    localStorage.removeItem("lms_holiday_banner_dismissed");
  };

  const toggleBanner = () => {
    setIsBannerDismissed((prev) => {
      const next = !prev;
      if (next) {
        localStorage.setItem("lms_holiday_banner_dismissed", "true");
      } else {
        localStorage.removeItem("lms_holiday_banner_dismissed");
      }
      return next;
    });
  };

  return (
    <HolidayContext.Provider
      value={{
        isHolidayEnabled,
        isAdmin,
        isSnowEnabled,
        toggleSnow,
        isBannerDismissed,
        dismissBanner,
        restoreBanner,
        toggleBanner,
      }}
    >
      {children}
      {mounted && isHolidayEnabled && isSnowEnabled && <SnowCanvas />}
    </HolidayContext.Provider>
  );
}

export function useHoliday() {
  return useContext(HolidayContext);
}

