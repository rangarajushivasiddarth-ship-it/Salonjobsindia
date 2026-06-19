'use client'

import React, { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react'
import { getSyncQueue, processSyncQueue } from '@/lib/background-sync'

interface SyncStatusProps {
  compact?: boolean;
  showDetails?: boolean;
}

export function SyncStatus({ compact = false, showDetails = false }: SyncStatusProps) {
  const [pendingCount, setPendingCount] = useState(0)
  const [failedCount, setFailedCount] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [lastSync, setLastSync] = useState<number | null>(null)

  useEffect(() => {
    const updateStatus = () => {
      const queue = getSyncQueue()
      const pending = queue.filter((item) => item.status === 'pending').length
      const failed = queue.filter((item) => item.status === 'failed').length
      
      setPendingCount(pending)
      setFailedCount(failed)
    }

    // Initial update
    updateStatus()

    // Listen for sync updates
    const handleSyncUpdate = (event: Event) => {
      const customEvent = event as CustomEvent
      setPendingCount(customEvent.detail.pendingCount)
      setFailedCount(customEvent.detail.failedCount)
    }

    window.addEventListener('sync-status-update', handleSyncUpdate)

    return () => {
      window.removeEventListener('sync-status-update', handleSyncUpdate)
    }
  }, [])

  const handleManualSync = async () => {
    setIsProcessing(true)
    try {
      await processSyncQueue()
      setLastSync(Date.now())
    } catch (error) {
      console.error('[Sync Status] Error during manual sync:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  if (pendingCount === 0 && failedCount === 0) {
    if (compact) return null
    return (
      <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          All data synced
        </div>
      </div>
    )
  }

  if (failedCount > 0) {
    return (
      <div className={`p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 ${compact ? '' : ''}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{failedCount} item{failedCount !== 1 ? 's' : ''} failed to sync</span>
          </div>
          <button
            onClick={handleManualSync}
            disabled={isProcessing}
            className="text-xs px-2 py-1 hover:bg-red-100 rounded disabled:opacity-50"
          >
            {isProcessing ? 'Retrying...' : 'Retry'}
          </button>
        </div>
      </div>
    )
  }

  if (pendingCount > 0) {
    return (
      <div className={`p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 flex-shrink-0 animate-spin" />
            <span>{pendingCount} item{pendingCount !== 1 ? 's' : ''} syncing...</span>
          </div>
          {!compact && lastSync && (
            <span className="text-xs text-yellow-700">
              Last: {new Date(lastSync).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>
    )
  }

  return null
}

export function SyncDetails() {
  const [queue, setQueue] = useState(getSyncQueue())

  useEffect(() => {
    const handleUpdate = (event: Event) => {
      const customEvent = event as CustomEvent
      setQueue(customEvent.detail.queue)
    }

    window.addEventListener('sync-status-update', handleUpdate)
    return () => {
      window.removeEventListener('sync-status-update', handleUpdate)
    }
  }, [])

  if (queue.length === 0) {
    return <div className="text-sm text-muted-foreground">No sync items</div>
  }

  return (
    <div className="space-y-2">
      {queue.map((item) => (
        <div
          key={item.id}
          className={`p-3 rounded border text-sm ${
            item.status === 'completed'
              ? 'bg-green-50 border-green-200'
              : item.status === 'failed'
              ? 'bg-red-50 border-red-200'
              : item.status === 'syncing'
              ? 'bg-blue-50 border-blue-200'
              : 'bg-gray-50 border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium">{item.type}</span>
            <span className="text-xs">
              {item.status === 'syncing' && <RefreshCw className="w-3 h-3 animate-spin inline" />}
              {item.status === 'completed' && <CheckCircle className="w-3 h-3 inline text-green-600" />}
              {item.status === 'failed' && <AlertCircle className="w-3 h-3 inline text-red-600" />}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            ID: {item.id.substring(0, 20)}... | Retries: {item.retries}/{item.maxRetries}
          </div>
          {item.error && <div className="text-xs text-red-600 mt-1">Error: {item.error}</div>}
        </div>
      ))}
    </div>
  )
}
