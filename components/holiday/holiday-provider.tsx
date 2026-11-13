"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface HolidayContextType {
  isHolidayEnabled: boolean;
  isAdmin: boolean;
  isBannerDismissed: boolean;
  dismissBanner: () => void;
  restoreBanner: () => void;
  toggleBanner: () => void;
}

const HolidayContext = createContext<HolidayContextType>({
  isHolidayEnabled: true,
  isAdmin: false,
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
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);

  useEffect(() => {
    const savedDismissed = localStorage.getItem("lms_holiday_banner_dismissed");
    if (savedDismissed === "true") {
      setIsBannerDismissed(true);
    }
  }, []);

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
        isBannerDismissed,
        dismissBanner,
        restoreBanner,
        toggleBanner,
      }}
    >
      {children}
    </HolidayContext.Provider>
  );
}

export function useHoliday() {
  return useContext(HolidayContext);
}
