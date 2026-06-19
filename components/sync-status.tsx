"use client";

import { useEffect, useState } from "react";
import { getPendingSyncItems, processSyncQueue } from "@/lib/background-sync";
import type { SyncData } from "@/lib/background-sync";

export function SyncStatus() {
  const [pendingItems, setPendingItems] = useState<SyncData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    checkSyncStatus();

    // Check sync status every 5 seconds
    const interval = setInterval(checkSyncStatus, 5000);

    // Listen for online event
    const handleOnline = () => {
      console.log("[v0] Online event detected, checking sync queue");
      checkSyncStatus();
    };

    window.addEventListener("online", handleOnline);

    return () => {
      clearInterval(interval);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  const checkSyncStatus = () => {
    const items = getPendingSyncItems();
    setPendingItems(items);
  };

  const handleManualSync = async () => {
    setIsProcessing(true);
    try {
      const result = await processSyncQueue();
      console.log("[v0] Sync completed:", result);
      checkSyncStatus();
    } catch (err) {
      console.error("[v0] Manual sync error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!mounted || pendingItems.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 max-w-sm z-50">
      <div className="bg-white rounded-lg shadow-lg border border-amber-200 overflow-hidden">
        {/* Header */}
        <div className="bg-amber-50 px-4 py-3 border-b border-amber-200">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse" />
            <h3 className="font-semibold text-sm text-amber-900">
              {pendingItems.length} Pending {pendingItems.length === 1 ? "Item" : "Items"}
            </h3>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 py-3">
          <p className="text-sm text-gray-700 mb-3">
            These items will sync when your connection is restored.
          </p>

          {/* Pending Items List */}
          <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
            {pendingItems.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-2 p-2 bg-gray-50 rounded text-sm"
              >
                <span className="text-gray-400 mt-0.5">⏱</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-700 capitalize">
                    {item.type.replace(/-/g, " ")}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </p>
                  {item.retries > 0 && (
                    <p className="text-xs text-amber-600">
                      Retries: {item.retries}/{item.maxRetries}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {pendingItems.length > 5 && (
              <p className="text-xs text-gray-500 text-center py-2">
                +{pendingItems.length - 5} more items
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleManualSync}
              disabled={isProcessing || !navigator.onLine}
              className="flex-1 bg-amber-500 text-white px-3 py-2 rounded font-medium text-sm hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? "Syncing..." : "Sync Now"}
            </button>
          </div>

          {/* Status Info */}
          <p className="text-xs text-gray-500 mt-2">
            {navigator.onLine ? (
              <span className="text-green-600">✓ Online - will sync shortly</span>
            ) : (
              <span className="text-amber-600">⚠ Offline - waiting for connection</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
