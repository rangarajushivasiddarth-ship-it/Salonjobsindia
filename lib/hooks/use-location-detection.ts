'use client'

import { useState, useCallback } from 'react'
import { detectLocation, getCachedLocation, cacheLocation, LocationData, GeolocationError } from '@/lib/location-utils'

export interface UseLocationDetectionReturn {
  location: LocationData | null
  loading: boolean
  error: string | null
  detect: () => Promise<void>
  retry: () => Promise<void>
  clear: () => void
}

/**
 * Hook for location detection with error handling and caching
 * Usage: const { location, loading, error, detect, retry } = useLocationDetection()
 */
export function useLocationDetection(): UseLocationDetectionReturn {
  const [location, setLocation] = useState<LocationData | null>(() => getCachedLocation())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const detect = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('[v0] Starting location detection...')
      
      const detectedLocation = await detectLocation()
      setLocation(detectedLocation)
      cacheLocation(detectedLocation)
      
      console.log('[v0] Location detected successfully:', detectedLocation.address)
    } catch (err) {
      const geolocationError = err as GeolocationError
      
      let errorMessage = 'Unable to detect location'
      
      switch (geolocationError.code) {
        case 'PERMISSION_DENIED':
          errorMessage = 'Location access denied. Please enable location permissions in your browser settings.'
          break
        case 'POSITION_UNAVAILABLE':
          errorMessage = 'Location information is unavailable. Please ensure GPS is enabled and try again.'
          break
        case 'TIMEOUT':
          errorMessage = 'Location detection timed out. Please try again or enter manually.'
          break
        case 'NOT_SUPPORTED':
          errorMessage = 'Geolocation is not supported by your browser. Please enter location manually.'
          break
        default:
          errorMessage = geolocationError.message || 'Unknown location error'
      }
      
      console.error('[v0] Location detection failed:', errorMessage)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const retry = useCallback(async () => {
    setError(null)
    await detect()
  }, [detect])

  const clear = useCallback(() => {
    setLocation(null)
    setError(null)
  }, [])

  return {
    location,
    loading,
    error,
    detect,
    retry,
    clear
  }
}
