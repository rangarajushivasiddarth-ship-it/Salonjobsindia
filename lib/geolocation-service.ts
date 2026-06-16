/**
 * Geolocation Service - Auto-detect user location
 * Uses browser Geolocation API with reverse geocoding via Nominatim
 */

export interface LocationData {
  latitude: number
  longitude: number
  city: string
  area?: string
  state: string
  pincode?: string
  accuracy?: number
  timestamp?: Date
}

export interface GeolocationResult {
  success: boolean
  location?: LocationData
  error?: string
  message?: string
}

/**
 * Reverse geocode coordinates to get city, state, pincode using Nominatim API
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<Partial<LocationData> | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
      { headers: { 'User-Agent': 'SalonJobsIndia/1.0' } }
    )

    if (!response.ok) {
      console.error('[v0] Nominatim reverse geocode failed:', response.status)
      return null
    }

    const data = await response.json()
    const address = data.address || {}

    return {
      latitude,
      longitude,
      city: address.city || address.town || address.village || 'Unknown',
      area: address.suburb || address.village || '',
      state: address.state || '',
      pincode: address.postcode || '',
      timestamp: new Date()
    }
  } catch (error) {
    console.error('[v0] Error in reverse geocode:', error)
    return null
  }
}

/**
 * Detect user location using browser Geolocation API
 */
export async function detectLocation(): Promise<GeolocationResult> {
  return new Promise((resolve) => {
    // Check if geolocation is available
    if (!navigator.geolocation) {
      resolve({
        success: false,
        error: 'GEOLOCATION_NOT_SUPPORTED',
        message: 'Geolocation not supported. Please enter location manually.'
      })
      return
    }

    console.log('[v0] Starting geolocation detection...')

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude, accuracy } = position.coords

          console.log('[v0] Geolocation obtained:', { latitude, longitude, accuracy })

          // Reverse geocode to get address details
          const addressData = await reverseGeocode(latitude, longitude)

          if (!addressData) {
            resolve({
              success: true,
              location: {
                latitude,
                longitude,
                city: 'Location Detected',
                state: '',
                accuracy,
                timestamp: new Date()
              },
              message: 'Location detected but address lookup failed'
            })
            return
          }

          const location: LocationData = {
            latitude: addressData.latitude || 0,
            longitude: addressData.longitude || 0,
            city: addressData.city || 'Unknown',
            area: addressData.area || '',
            state: addressData.state || '',
            pincode: addressData.pincode || '',
            accuracy: accuracy || 50,
            timestamp: addressData.timestamp
          }

          resolve({
            success: true,
            location,
            message: 'Location detected successfully'
          })
        } catch (error) {
          console.error('[v0] Error processing geolocation:', error)
          resolve({
            success: false,
            error: 'GEOLOCATION_PROCESSING_ERROR',
            message: 'Error processing location data'
          })
        }
      },
      (error) => {
        let errorMessage = 'Unknown error'

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Permission denied. Enable location access in browser settings.'
            console.log('[v0] Geolocation permission denied')
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.'
            console.log('[v0] Location unavailable')
            break
          case error.TIMEOUT:
            errorMessage = 'Location detection timed out.'
            console.log('[v0] Geolocation timeout')
            break
        }

        resolve({
          success: false,
          error: 'GEOLOCATION_ERROR',
          message: errorMessage
        })
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  })
}

/**
 * Save location to localStorage (for immediate use)
 */
export function saveLocationToLocalStorage(location: LocationData): void {
  try {
    localStorage.setItem('userLocation', JSON.stringify(location))
    console.log('[v0] Location saved to localStorage')
  } catch (error) {
    console.error('[v0] Error saving location to localStorage:', error)
  }
}

/**
 * Get cached location from localStorage
 */
export function getCachedLocation(): LocationData | null {
  try {
    const cached = localStorage.getItem('userLocation')
    if (cached) {
      const location = JSON.parse(cached)
      // Check if cached location is less than 24 hours old
      const timestamp = new Date(location.timestamp)
      const now = new Date()
      const hours = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60)

      if (hours < 24) {
        console.log('[v0] Using cached location')
        return location
      }
    }
  } catch (error) {
    console.error('[v0] Error retrieving cached location:', error)
  }
  return null
}

/**
 * Clear cached location
 */
export function clearCachedLocation(): void {
  try {
    localStorage.removeItem('userLocation')
    console.log('[v0] Cached location cleared')
  } catch (error) {
    console.error('[v0] Error clearing cached location:', error)
  }
}
