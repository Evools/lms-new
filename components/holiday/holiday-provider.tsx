"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { SnowCanvas } from "./snow-canvas";

export type SnowDensity = "light" | "medium" | "heavy";
export type SnowSpeed = "slow" | "normal" | "fast";
export type SnowStyle = "soft" | "flakes";

export interface SnowSettings {
  density: SnowDensity;
  speed: SnowSpeed;
  style: SnowStyle;
  drifts: boolean;
}

const DEFAULT_SNOW_SETTINGS: SnowSettings = {
  density: "medium",
  speed: "normal",
  style: "soft",
  drifts: true,
};

interface HolidayContextType {
  isHolidayEnabled: boolean;
  isAdmin: boolean;
  isSnowEnabled: boolean;
  toggleSnow: () => void;
  snowSettings: SnowSettings;
  updateSnowSettings: (patch: Partial<SnowSettings>) => void;
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
  snowSettings: DEFAULT_SNOW_SETTINGS,
  updateSnowSettings: () => {},
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
  const [snowSettings, setSnowSettings] = useState<SnowSettings>(DEFAULT_SNOW_SETTINGS);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedSnow = localStorage.getItem("lms_holiday_snow");
    if (savedSnow !== null) {
      setIsSnowEnabled(savedSnow === "true");
    }
    const savedSettings = localStorage.getItem("lms_holiday_snow_settings");
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings) as Partial<SnowSettings>;
        setSnowSettings((prev) => ({ ...prev, ...parsed }));
      } catch {
        // ignore invalid json
      }
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

  const updateSnowSettings = (patch: Partial<SnowSettings>) => {
    setSnowSettings((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem("lms_holiday_snow_settings", JSON.stringify(next));
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
        snowSettings,
        updateSnowSettings,
        isBannerDismissed,
        dismissBanner,
        restoreBanner,
        toggleBanner,
      }}
    >
      {children}
      {mounted && isHolidayEnabled && isSnowEnabled && (
        <SnowCanvas settings={snowSettings} />
      )}
    </HolidayContext.Provider>
  );
}

export function useHoliday() {
  return useContext(HolidayContext);
}
