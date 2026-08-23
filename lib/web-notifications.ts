"use client";

/**
 * Utility helpers for browser native Web Notifications API
 */

export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return "denied";
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return "denied";
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.error("Failed to request notification permission:", err);
    return "denied";
  }
}

export interface ShowNotificationOptions {
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: {
    link?: string;
    [key: string]: any;
  };
}

export function showBrowserNotification(
  title: string,
  options?: ShowNotificationOptions
): Notification | null {
  if (!isNotificationSupported()) return null;
  if (Notification.permission !== "granted") return null;

  try {
    const notification = new Notification(title, {
      body: options?.body,
      icon: options?.icon || "/favicon.ico",
      badge: options?.badge || "/favicon.ico",
      tag: options?.tag,
      data: options?.data,
    });

    notification.onclick = function (event) {
      event.preventDefault();
      window.focus();
      if (options?.data?.link) {
        window.location.href = options.data.link;
      }
      notification.close();
    };

    return notification;
  } catch (err) {
    console.error("Failed to show browser notification:", err);
    return null;
  }
}
