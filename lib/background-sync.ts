/**
 * Background Sync API utilities for Salon Jobs India
 * Handles failed job submissions and data sync when offline
 */

export interface SyncData {
  id: string;
  type: 'job-submission' | 'profile-update' | 'favorite-add';
  data: Record<string, unknown>;
  timestamp: number;
  retries: number;
  maxRetries: number;
}

const SYNC_STORE_KEY = 'salon-jobs-sync-queue';
const MAX_RETRIES = 3;

/**
 * Initialize background sync on page load
 */
export async function initializeBackgroundSync() {
  if (!('serviceWorker' in navigator)) {
    console.log('[BackgroundSync] Service Workers not supported');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    // Check if SyncManager is available
    if ('sync' in registration) {
      // Try to register background sync for job submissions
      try {
        // @ts-ignore - SyncManager API is not in all TS definitions
        // Use short tag name - max 50 chars and must be valid
        await registration.sync.register('jobs');
        console.log('[BackgroundSync] Sync tag registered: jobs');
      } catch (err) {
        console.log('[BackgroundSync] Background sync registration failed:', err);
      }
    }

    // Try to register periodic sync for job updates (if available)
    // Note: periodicSync is experimental and not widely supported
    if ('periodicSync' in registration) {
      try {
        // @ts-ignore - periodicSync is experimental
        // Use short tag name to avoid length issues
        await (registration as any).periodicSync.register('sync', {
          minInterval: 24 * 60 * 60 * 1000, // 24 hours
        });
        console.log('[BackgroundSync] Periodic sync registered (24h)');
      } catch (err) {
        console.log('[BackgroundSync] Periodic sync not available:', err);
      }
    }
  } catch (err) {
    console.error('[BackgroundSync] Initialization error:', err);
  }
}

/**
 * Queue a failed operation for background sync
 */
export async function queueForSync(
  type: SyncData['type'],
  data: Record<string, unknown>
): Promise<boolean> {
  try {
    // Get existing queue
    const queueJson = localStorage.getItem(SYNC_STORE_KEY);
    const queue: SyncData[] = queueJson ? JSON.parse(queueJson) : [];

    // Create new sync item
    const syncItem: SyncData = {
      id: `${type}-${Date.now()}`,
      type,
      data,
      timestamp: Date.now(),
      retries: 0,
      maxRetries: MAX_RETRIES,
    };

    // Add to queue
    queue.push(syncItem);
    localStorage.setItem(SYNC_STORE_KEY, JSON.stringify(queue));

    console.log('[BackgroundSync] Queued for sync:', syncItem.id);

    // Try to register background sync tag
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if ('sync' in registration) {
          // @ts-ignore - SyncManager API is not in all TS definitions
          // Use short, valid tag name (alphanumeric and hyphen only, max 50 chars)
          await registration.sync.register('jobs');
          console.log('[BackgroundSync] Background sync tag registered:', type);
        }
      } catch (err) {
        console.log('[BackgroundSync] Background sync registration failed:', err);
      }
    }

    return true;
  } catch (err) {
    console.error('[BackgroundSync] Queue error:', err);
    return false;
  }
}

/**
 * Get all pending sync items
 */
export function getPendingSyncItems(): SyncData[] {
  try {
    const queueJson = localStorage.getItem(SYNC_STORE_KEY);
    return queueJson ? JSON.parse(queueJson) : [];
  } catch (err) {
    console.error('[BackgroundSync] Error reading queue:', err);
    return [];
  }
}

/**
 * Remove a sync item after successful completion
 */
export function removeSyncItem(id: string): boolean {
  try {
    const queueJson = localStorage.getItem(SYNC_STORE_KEY);
    const queue: SyncData[] = queueJson ? JSON.parse(queueJson) : [];

    const filtered = queue.filter(item => item.id !== id);
    localStorage.setItem(SYNC_STORE_KEY, JSON.stringify(filtered));

    console.log('[BackgroundSync] Removed sync item:', id);
    return true;
  } catch (err) {
    console.error('[BackgroundSync] Error removing item:', err);
    return false;
  }
}

/**
 * Increment retry count for a sync item
 */
export function incrementRetry(id: string): boolean {
  try {
    const queueJson = localStorage.getItem(SYNC_STORE_KEY);
    const queue: SyncData[] = queueJson ? JSON.parse(queueJson) : [];

    const item = queue.find(i => i.id === id);
    if (item) {
      item.retries++;

      // Remove if max retries exceeded
      if (item.retries >= item.maxRetries) {
        console.log('[BackgroundSync] Max retries exceeded for:', id);
        return removeSyncItem(id);
      }

      localStorage.setItem(SYNC_STORE_KEY, JSON.stringify(queue));
      return true;
    }

    return false;
  } catch (err) {
    console.error('[BackgroundSync] Error incrementing retry:', err);
    return false;
  }
}

/**
 * Process all pending sync items
 * Called from service worker or when connection is restored
 */
export async function processSyncQueue(): Promise<{
  total: number;
  success: number;
  failed: number;
}> {
  const queue = getPendingSyncItems();

  if (queue.length === 0) {
    console.log('[BackgroundSync] Queue is empty');
    return { total: 0, success: 0, failed: 0 };
  }

  console.log('[BackgroundSync] Processing queue with', queue.length, 'items');

  let success = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      const endpoint = getEndpointForType(item.type);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.data),
      });

      if (response.ok) {
        console.log('[BackgroundSync] Synced successfully:', item.id);
        removeSyncItem(item.id);
        success++;
      } else {
        console.warn('[BackgroundSync] Sync failed with status:', response.status, item.id);
        incrementRetry(item.id);
        failed++;
      }
    } catch (err) {
      console.error('[BackgroundSync] Sync error:', err, item.id);
      incrementRetry(item.id);
      failed++;
    }
  }

  console.log('[BackgroundSync] Processing complete. Success:', success, 'Failed:', failed);
  return { total: queue.length, success, failed };
}

/**
 * Get the API endpoint for a sync type
 */
function getEndpointForType(type: SyncData['type']): string {
  switch (type) {
    case 'job-submission':
      return '/api/jobs/submit';
    case 'profile-update':
      return '/api/profile/update';
    case 'favorite-add':
      return '/api/favorites/add';
    default:
      throw new Error(`Unknown sync type: ${type}`);
  }
}

/**
 * Listen for online event and process queue
 */
export function setupOnlineListener() {
  window.addEventListener('online', async () => {
    console.log('[BackgroundSync] Connection restored, processing queue');
    await processSyncQueue();
  });
}
