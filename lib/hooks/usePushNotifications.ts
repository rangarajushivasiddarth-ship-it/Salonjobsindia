"use client";

import { useEffect, useState } from "react";

interface PushNotificationState {
  isSupported: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  error: string | null;
}

export function usePushNotifications() {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isSubscribed: false,
    isLoading: false,
    error: null,
  });

  // Check if push notifications are supported
  useEffect(() => {
    const checkSupport = async () => {
      const isSupported =
        typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window;

      setState((prev) => ({ ...prev, isSupported }));

      if (isSupported && "serviceWorker" in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          setState((prev) => ({
            ...prev,
            isSubscribed: subscription !== null,
          }));
        } catch (error) {
          console.error("[PushNotifications] Error checking subscription:", error);
        }
      }
    };

    checkSupport();
  }, []);

  // Request notification permission and subscribe
  const subscribe = async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: "Notification permission denied",
        }));
        return false;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });

      // Send subscription to server
      const response = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });

      if (!response.ok) {
        throw new Error("Failed to subscribe on server");
      }

      setState((prev) => ({
        ...prev,
        isLoading: false,
        isSubscribed: true,
      }));

      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("[PushNotifications] Subscription failed:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return false;
    }
  };

  // Unsubscribe from push notifications
  const unsubscribe = async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isSubscribed: false,
        }));
        return true;
      }

      return false;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("[PushNotifications] Unsubscribe failed:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return false;
    }
  };

  return {
    ...state,
    subscribe,
    unsubscribe,
  };
}
