'use client'

import { useEffect, useRef, useCallback, useState } from 'react'

interface JobUpdate {
  type: 'job_update' | 'connected' | 'error'
  operationType?: 'insert' | 'update' | 'delete'
  documentId?: string
  fullDocument?: any
  timestamp?: string
  message?: string
}

interface UseRealtimeJobsOptions {
  filter?: 'pending' | 'live' | 'all'
  ownerId?: string
  onUpdate?: (update: JobUpdate) => void
  onError?: (error: string) => void
}

export function useRealtimeJobs({
  filter = 'live',
  ownerId = '',
  onUpdate,
  onError
}: UseRealtimeJobsOptions = {}) {
  const eventSourceRef = useRef<EventSource | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      return
    }

    try {
      const url = new URL('/api/realtime/jobs', window.location.origin)
      url.searchParams.set('filter', filter)
      if (ownerId) {
        url.searchParams.set('ownerId', ownerId)
      }

      const eventSource = new EventSource(url.toString())

      eventSource.addEventListener('message', (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data) as JobUpdate

          if (data.type === 'connected') {
            console.log('[v0] Real-time connection established')
            setIsConnected(true)
            setError(null)
          } else if (data.type === 'error') {
            console.error('[v0] Real-time error:', data.message)
            setError(data.message || 'Unknown error')
            onError?.(data.message || 'Unknown error')
          } else if (data.type === 'job_update') {
            console.log('[v0] Job update received:', data.operationType)
            onUpdate?.(data)
          }
        } catch (err) {
          console.error('[v0] Failed to parse real-time message:', err)
        }
      })

      eventSource.addEventListener('error', () => {
        console.error('[v0] EventSource error')
        setIsConnected(false)
        setError('Connection lost')
        onError?.('Connection lost')
        eventSource.close()
        eventSourceRef.current = null
      })

      eventSourceRef.current = eventSource
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Connection failed'
      console.error('[v0] Real-time connection error:', message)
      setError(message)
      onError?.(message)
    }
  }, [filter, ownerId, onUpdate, onError])

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
      setIsConnected(false)
    }
  }, [])

  useEffect(() => {
    connect()

    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  return {
    isConnected,
    error,
    reconnect: connect,
    disconnect
  }
}
