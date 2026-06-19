'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Bell, Check, AlertCircle } from 'lucide-react'

interface NotificationPermissionProps {
  onPermissionGranted?: () => void
  onPermissionDenied?: () => void
  compact?: boolean
}

export function NotificationPermission({
  onPermissionGranted,
  onPermissionDenied,
  compact = false,
}: NotificationPermissionProps) {
  const [permission, setPermission] = useState<'default' | 'granted' | 'denied'>('default')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSupported, setIsSupported] = useState(true)

  // Check if notifications are supported
  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'Notification' in window && 'PushManager' in window

    setIsSupported(supported)

    if (supported) {
      const currentPermission = Notification.permission as 'default' | 'granted' | 'denied'
      setPermission(currentPermission)
    }
  }, [])

  const requestNotificationPermission = async () => {
    if (!isSupported) {
      setError('Push notifications not supported in your browser')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Request notification permission
      const permission = await Notification.requestPermission()

      if (permission === 'granted') {
        console.log('[v0] Notification permission granted')
        setPermission('granted')

        // Register service worker if not already registered
        if ('serviceWorker' in navigator) {
          try {
            const registration = await navigator.serviceWorker.ready

            // Get the subscription
            const subscription = await registration.pushManager.getSubscription()

            if (!subscription) {
              // Subscribe to push notifications
              const response = await fetch('/api/notifications/subscribe', {
                method: 'GET',
              })

              const data = await response.json()
              const publicKey = data.vapidPublicKey || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

              if (publicKey) {
                try {
                  const newSubscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(publicKey),
                  })

                  // Send subscription to backend
                  const subscribeResponse = await fetch('/api/notifications/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newSubscription),
                  })

                  if (!subscribeResponse.ok) {
                    throw new Error('Failed to register subscription on server')
                  }

                  console.log('[v0] Successfully subscribed to push notifications')
                } catch (subError) {
                  console.error('[v0] Failed to subscribe to push notifications:', subError)
                  setError('Failed to subscribe to push notifications')
                  setIsLoading(false)
                  return
                }
              }
            }

            onPermissionGranted?.()
          } catch (swError) {
            console.error('[v0] Service worker error:', swError)
            setError('Service worker not available')
          }
        }
      } else if (permission === 'denied') {
        console.log('[v0] Notification permission denied')
        setPermission('denied')
        onPermissionDenied?.()
      }
    } catch (err) {
      console.error('[v0] Error requesting notification permission:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      onPermissionDenied?.()
    } finally {
      setIsLoading(false)
    }
  }

  if (!isSupported) {
    if (compact) return null
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <p className="text-sm text-yellow-800">Push notifications not supported in your browser</p>
        </div>
      </div>
    )
  }

  if (permission === 'granted') {
    if (compact) {
      return (
        <Button variant="ghost" size="sm" disabled className="text-green-600">
          <Check className="w-4 h-4 mr-2" />
          Notifications enabled
        </Button>
      )
    }
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-2">
          <Check className="w-5 h-5 text-green-600" />
          <p className="text-sm text-green-800">Notifications enabled - you&apos;ll receive job updates</p>
        </div>
      </div>
    )
  }

  if (permission === 'denied') {
    if (compact) return null
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-800">Notifications are disabled. Enable in browser settings to receive updates.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Button
      onClick={requestNotificationPermission}
      disabled={isLoading}
      size={compact ? 'sm' : 'default'}
      className="w-full"
    >
      <Bell className="w-4 h-4 mr-2" />
      {isLoading ? 'Enabling...' : 'Enable notifications'}
    </Button>
  )
}

/**
 * Convert VAPID public key from base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}
