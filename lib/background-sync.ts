/**
 * Background Sync and Queue Management
 * Handles offline job submissions and periodic data syncing
 */

import React from 'react';

export interface SyncQueueItem {
  id: string;
  type: 'job-submission' | 'job-update' | 'profile-update' | 'message-send';
  data: Record<string, unknown>;
  timestamp: number;
  retries: number;
  maxRetries?: number;
  status: 'pending' | 'syncing' | 'failed' | 'completed';
  error?: string;
}

const QUEUE_STORAGE_KEY = 'salon-jobs-sync-queue';
const SYNC_TAG = 'sync-jobs-india';
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

/**
 * Get the sync queue from storage
 */
export function getSyncQueue(): SyncQueueItem[] {
  try {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(QUEUE_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('[Background Sync] Error reading queue:', error);
    return [];
  }
}

/**
 * Save the sync queue to storage
 */
export function saveSyncQueue(queue: SyncQueueItem[]): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('[Background Sync] Error saving queue:', error);
  }
}

/**
 * Add an item to the sync queue
 */
export function addToSyncQueue(
  type: SyncQueueItem['type'],
  data: Record<string, unknown>
): SyncQueueItem {
  const item: SyncQueueItem = {
    id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    data,
    timestamp: Date.now(),
    retries: 0,
    maxRetries: MAX_RETRIES,
    status: 'pending',
  };

  const queue = getSyncQueue();
  queue.push(item);
  saveSyncQueue(queue);

  console.log('[Background Sync] Item added to queue:', item.id, type);

  // Try to register for background sync if available
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready
      .then((registration) => {
        const syncManager = (registration as any).sync;
        if (!syncManager) return;
        return syncManager.register(SYNC_TAG);
      })
      .catch((err) => {
        console.warn('[Background Sync] Could not register sync:', err);
      });
  }

  // Dispatch event for UI updates
  dispatchSyncUpdate();

  return item;
}

/**
 * Update sync queue item status
 */
export function updateSyncItem(itemId: string, updates: Partial<SyncQueueItem>): void {
  const queue = getSyncQueue();
  const index = queue.findIndex((item) => item.id === itemId);

  if (index !== -1) {
    queue[index] = { ...queue[index], ...updates };
    saveSyncQueue(queue);
    dispatchSyncUpdate();
  }
}

/**
 * Remove item from sync queue
 */
export function removeSyncItem(itemId: string): void {
  const queue = getSyncQueue().filter((item) => item.id !== itemId);
  saveSyncQueue(queue);
  dispatchSyncUpdate();
}

/**
 * Process sync queue (called periodically or when online)
 */
export async function processSyncQueue(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!navigator.onLine) {
    console.log('[Background Sync] Offline - deferring sync');
    return;
  }

  const queue = getSyncQueue();
  const pendingItems = queue.filter((item) => item.status === 'pending');

  if (pendingItems.length === 0) {
    console.log('[Background Sync] Queue is empty');
    return;
  }

  console.log(`[Background Sync] Processing ${pendingItems.length} pending items`);

  for (const item of pendingItems) {
    try {
      updateSyncItem(item.id, { status: 'syncing' });

      let endpoint = '/api/jobs';
      let method = 'POST';
      let body = item.data;

      // Determine endpoint based on item type
      switch (item.type) {
        case 'job-submission':
          endpoint = '/api/jobs';
          break;
        case 'job-update':
          endpoint = `/api/jobs/${item.data.jobId}`;
          method = 'PUT';
          break;
        case 'profile-update':
          endpoint = '/api/job-seekers';
          method = 'PUT';
          break;
        case 'message-send':
          endpoint = '/api/messages';
          break;
      }

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        console.log('[Background Sync] Item synced successfully:', item.id);
        removeSyncItem(item.id);
      } else {
        throw new Error(`Server returned ${response.status}`);
      }
    } catch (error) {
      const newRetries = (item.retries || 0) + 1;
      const maxRetries = item.maxRetries || MAX_RETRIES;

      if (newRetries >= maxRetries) {
        console.error('[Background Sync] Max retries reached for:', item.id);
        updateSyncItem(item.id, {
          status: 'failed',
          retries: newRetries,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      } else {
        console.warn('[Background Sync] Retrying item:', item.id, `(${newRetries}/${maxRetries})`);
        updateSyncItem(item.id, {
          status: 'pending',
          retries: newRetries,
        });
      }
    }

    // Small delay between retries
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
  }

  dispatchSyncUpdate();
}

/**
 * Register for periodic background sync (if supported)
 */
export async function registerPeriodicSync(): Promise<void> {
  if (!('serviceWorker' in navigator) || !('SyncManager' in window)) {
    console.log('[Background Sync] Periodic sync not supported');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const syncManager = (registration as any).sync;

    if (!syncManager) {
      console.log('[Background Sync] SyncManager not available');
      return;
    }

    // Register periodic sync
    await syncManager.register(SYNC_TAG);
    console.log('[Background Sync] Periodic sync registered');
  } catch (error) {
    console.warn('[Background Sync] Could not register periodic sync:', error);
  }
}

/**
 * Listen for online/offline events and process queue
 */
export function setupSyncListeners(): void {
  if (typeof window === 'undefined') return;

  // Process queue when coming back online
  window.addEventListener('online', async () => {
    console.log('[Background Sync] Back online - processing queue');
    await processSyncQueue();
  });

  // Periodically process queue
  setInterval(
    () => {
      processSyncQueue().catch((err) => {
        console.error('[Background Sync] Error processing queue:', err);
      });
    },
    30000 // Every 30 seconds
  );

  // Process immediately on setup
  processSyncQueue().catch((err) => {
    console.error('[Background Sync] Error on setup:', err);
  });
}

/**
 * Dispatch custom event for sync status updates
 */
function dispatchSyncUpdate(): void {
  if (typeof window === 'undefined') return;

  const queue = getSyncQueue();
  const pendingCount = queue.filter((item) => item.status === 'pending').length;
  const failedCount = queue.filter((item) => item.status === 'failed').length;

  window.dispatchEvent(
    new CustomEvent('sync-status-update', {
      detail: {
        queue,
        pendingCount,
        failedCount,
        timestamp: Date.now(),
      },
    })
  );
}

/**
 * Hook to monitor sync queue status
 */
export function useSyncStatus() {
  const [queue, setQueue] = React.useState<SyncQueueItem[]>([]);
  const [pendingCount, setPendingCount] = React.useState(0);
  const [failedCount, setFailedCount] = React.useState(0);

  React.useEffect(() => {
    // Initial load
    const initialQueue = getSyncQueue();
    setQueue(initialQueue);
    setPendingCount(initialQueue.filter((item) => item.status === 'pending').length);
    setFailedCount(initialQueue.filter((item) => item.status === 'failed').length);

    // Listen for updates
    const handleUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      setQueue(customEvent.detail.queue);
      setPendingCount(customEvent.detail.pendingCount);
      setFailedCount(customEvent.detail.failedCount);
    };

    window.addEventListener('sync-status-update', handleUpdate);

    return () => {
      window.removeEventListener('sync-status-update', handleUpdate);
    };
  }, []);

  return { queue, pendingCount, failedCount };
}
