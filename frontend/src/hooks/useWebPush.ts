"use client";

import { useState, useEffect } from "react";
import apiClient from "@/lib/api/axios";

export type WebPushPermission = NotificationPermission | "unsupported";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

function getInitialPermission(): WebPushPermission {
  if (typeof window === "undefined") return "default";
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission;
}

export function useWebPush() {
  const [permission, setPermission] = useState<WebPushPermission>(getInitialPermission);
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    if (permission === "unsupported") return;
    navigator.serviceWorker
      .register("/service-worker.js", { scope: "/" })
      .catch(() => {
        // Đăng ký SW thất bại không nên crash app
      });
  }, [permission]);

  const subscribeToPush = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    setIsSubscribing(true);
    try {
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) throw new Error("VAPID public key chưa được cấu hình");

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      const subJson = subscription.toJSON();
      await apiClient.post("/notifications/web-push/subscribe", {
        endpoint: subJson.endpoint,
        keys: {
          p256dh: subJson.keys?.p256dh,
          auth: subJson.keys?.auth,
        },
        userAgent: navigator.userAgent,
      });

      setPermission("granted");
    } catch {
      // Người dùng từ chối hoặc lỗi mạng — cập nhật lại state từ browser
      if ("Notification" in window) {
        setPermission(Notification.permission);
      }
    } finally {
      setIsSubscribing(false);
    }
  };

  const unsubscribeFromPush = async () => {
    if (!("serviceWorker" in navigator)) return;
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        await apiClient.post("/notifications/web-push/unsubscribe", {
          endpoint: subscription.endpoint,
        });
      }
      setPermission("default");
    } catch {
      // silent — unsubscribe failure không ảnh hưởng UX
    }
  };

  return { permission, isSubscribing, subscribeToPush, unsubscribeFromPush };
}
