"use client";

import { useEffect, useRef } from "react";
import { getNotificationsAction } from "@/app/dashboard/notifications/actions";
import {
  isNotificationSupported,
  showBrowserNotification,
} from "@/lib/web-notifications";

export function NotificationListener() {
  const lastNotifiedIdRef = useRef<string | null>(null);
  const isInitialFetchRef = useRef(true);

  const checkNewNotifications = async () => {
    try {
      const res = await getNotificationsAction(5);
      if (!res.success || !res.notifications || res.notifications.length === 0) return;

      const unreadList = res.notifications.filter((n) => !n.isRead);

      if (isInitialFetchRef.current) {
        // On initial page load, record the newest ID to avoid notifying about pre-existing notifications
        isInitialFetchRef.current = false;
        if (unreadList.length > 0) {
          lastNotifiedIdRef.current = unreadList[0].id;
        }
        return;
      }

      // Check if there are unread notifications newer than lastNotifiedIdRef
      if (unreadList.length > 0) {
        const newest = unreadList[0];
        if (newest.id !== lastNotifiedIdRef.current) {
          lastNotifiedIdRef.current = newest.id;

          // Dispatch native browser notification
          if (isNotificationSupported() && Notification.permission === "granted") {
            showBrowserNotification(newest.title, {
              body: newest.message,
              data: { link: newest.link },
            });
          }

          // Trigger custom event so header badges update in real-time
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("lms-new-notification", { detail: newest }));
          }
        }
      }
    } catch (err) {
      console.error("NotificationListener error:", err);
    }
  };

  useEffect(() => {
    // Initial check
    checkNewNotifications();

    // Poll every 25 seconds
    const interval = setInterval(checkNewNotifications, 25000);

    // Also check on tab focus
    const handleFocus = () => {
      checkNewNotifications();
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  return null;
}
