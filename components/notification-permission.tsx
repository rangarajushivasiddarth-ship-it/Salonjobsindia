"use client";

import { useEffect, useState } from "react";
import { usePushNotifications } from "@/lib/hooks/usePushNotifications";

export function NotificationPermission() {
  const { isSupported, isSubscribed, isLoading, error, subscribe, unsubscribe } =
    usePushNotifications();
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if user has dismissed the notification prompt
    const isDismissed = localStorage.getItem("notification-prompt-dismissed");
    if (isDismissed) {
      setDismissed(true);
    }
  }, []);

  const handleSubscribe = async () => {
    const success = await subscribe();
    if (success) {
      console.log("[v0] Push notification subscription successful");
    }
  };

  const handleUnsubscribe = async () => {
    const success = await unsubscribe();
    if (success) {
      console.log("[v0] Push notification unsubscribed");
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("notification-prompt-dismissed", "true");
  };

  // Only show once, allow user to dismiss permanently
  if (!mounted || !isSupported || dismissed || isSubscribed) {
    return null;
  }

  return (
    <div className="fixed bottom-20 right-4 max-w-sm z-40 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔔</span>
              <h3 className="text-white font-semibold text-sm">
                Stay Updated
              </h3>
            </div>
            <button
              onClick={handleDismiss}
              className="text-blue-100 hover:text-white transition-colors"
              aria-label="Dismiss notification prompt"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 py-3">
          <p className="text-gray-700 text-sm mb-4">
            Get instant notifications for new job opportunities matching your profile.
          </p>

          {/* Action Buttons - Optional approach compliant with Play Store */}
          <div className="flex gap-2">
            <button
              onClick={handleSubscribe}
              disabled={isLoading}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "Enabling..." : "Enable"}
            </button>
            <button
              onClick={handleDismiss}
              className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded font-medium text-sm hover:bg-gray-300 transition-colors"
            >
              Not Now
            </button>
          </div>

          {/* Privacy Notice - Play Store requirement */}
          <p className="text-xs text-gray-500 mt-3">
            Your privacy is important. You can manage notifications in Settings anytime.
          </p>
        </div>
      </div>
    </div>
  );
}
