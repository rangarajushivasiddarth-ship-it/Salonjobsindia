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

  if (!mounted || !isSupported || dismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 max-w-sm z-50">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🔔</span>
              <h3 className="text-white font-semibold text-sm">
                {isSubscribed
                  ? "Notifications Enabled"
                  : "Enable Notifications"}
              </h3>
            </div>
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Dismiss notification"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 py-3">
          {error ? (
            <div className="text-sm text-red-600 mb-3">
              <p className="font-medium">Error: {error}</p>
            </div>
          ) : (
            <p className="text-gray-700 text-sm mb-3">
              {isSubscribed
                ? "You'll receive notifications about new job opportunities and updates."
                : "Get notified about new job opportunities and updates in your area."}
            </p>
          )}

          {/* Status Indicator */}
          <div className="flex items-center gap-2 mb-3">
            <div
              className={`w-2 h-2 rounded-full ${
                isSubscribed ? "bg-green-500" : "bg-gray-400"
              }`}
            />
            <span className="text-xs text-gray-600">
              {isSubscribed ? "Subscribed" : "Not subscribed"}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {!isSubscribed ? (
              <button
                onClick={handleSubscribe}
                disabled={isLoading}
                className="flex-1 bg-black text-white px-4 py-2 rounded font-medium text-sm hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? "Enabling..." : "Enable Notifications"}
              </button>
            ) : (
              <button
                onClick={handleUnsubscribe}
                disabled={isLoading}
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded font-medium text-sm hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? "Disabling..." : "Disable Notifications"}
              </button>
            )}
            {dismissed === false && !isSubscribed && (
              <button
                onClick={handleDismiss}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium text-sm transition-colors"
              >
                Later
              </button>
            )}
          </div>

          {/* Privacy Notice */}
          <p className="text-xs text-gray-500 mt-3">
            We'll never share your data. You can disable notifications anytime.
          </p>
        </div>
      </div>
    </div>
  );
}
