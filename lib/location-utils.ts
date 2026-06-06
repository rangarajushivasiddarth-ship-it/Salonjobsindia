/**
 * Location Detection and Reverse Geocoding Utilities
 * Provides comprehensive location detection with multiple fallbacks and error handling
 */

export interface LocationData {
  latitude: number
  longitude: number
  address: string
  city: string
  district: string
  state: string
  country: string
  postalCode?: string
  formattedAddress?: string
}

export interface GeolocationError {
  code: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'NOT_SUPPORTED' | 'UNKNOWN'
  message: string
}

/**
 * Request device location from user
 */
export async function getCurrentPosition(): Promise<GeolocationCoordinates> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject({
        code: 'NOT_SUPPORTED',
        message: 'Geolocation is not supported by your browser'
      } as GeolocationError)
      return
    }

    const timeoutId = setTimeout(() => {
      reject({
        code: 'TIMEOUT',
        message: 'Location detection timed out. Please try again.'
      } as GeolocationError)
    }, 10000)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timeoutId)
        resolve(position.coords)
      },
      (error) => {
        clearTimeout(timeoutId)
        let errorCode: GeolocationError['code'] = 'UNKNOWN'
        let message = 'Unable to detect location'

        if (error.code === error.PERMISSION_DENIED) {
          errorCode = 'PERMISSION_DENIED'
          message = 'Location access denied. Please enable location permissions in your browser settings.'
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorCode = 'POSITION_UNAVAILABLE'
          message = 'Location information is unavailable. Please enable GPS or try again.'
        } else if (error.code === error.TIMEOUT) {
          errorCode = 'TIMEOUT'
          message = 'Location detection timed out. Please try again.'
        }

        reject({ code: errorCode, message } as GeolocationError)
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 300000 // Cache location for 5 minutes
      }
    )
  })
}

/**
 * Reverse geocode coordinates to address using Nominatim (free, open-source)
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<LocationData> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&accept-language=en`,
      {
        signal: controller.signal,
        headers: {
          'User-Agent': 'SalonJobsIndia/1.0' // Nominatim requires User-Agent
        }
      }
    )

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error('Geocoding API error')
    }

    const data = await response.json()
    const address = data.address || {}

    // Extract location components with fallbacks
    const country = address.country || 'India'
    const state = address.state || address.province || ''
    const city = address.city || address.town || address.village || address.municipality || ''
    const district = address.county || address.state_district || ''
    const postalCode = address.postcode || ''

    // Build various address representations
    const displayName = data.display_name || ''
    const area = address.suburb || address.neighbourhood || address.hamlet || ''

    // Build formatted address
    const parts = [area, city, district, state, country].filter(Boolean)
    const formattedAddress = parts.join(', ')

    return {
      latitude,
      longitude,
      address: displayName || formattedAddress,
      city,
      district,
      state,
      country,
      postalCode,
      formattedAddress
    }
  } catch (error) {
    console.error('[v0] Reverse geocoding failed:', error)
    // Return partial location data with coordinates only
    return {
      latitude,
      longitude,
      address: `Coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      city: '',
      district: '',
      state: '',
      country: 'India',
      formattedAddress: `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`
    }
  }
}

/**
 * Complete location detection workflow with reverse geocoding
 */
export async function detectLocation(): Promise<LocationData> {
  try {
    const coords = await getCurrentPosition()
    const locationData = await reverseGeocode(coords.latitude, coords.longitude)
    return locationData
  } catch (error) {
    const geolocationError = error as GeolocationError
    throw geolocationError
  }
}

/**
 * Save location to localStorage
 */
export function cacheLocation(location: LocationData): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('userLocation', JSON.stringify(location))
  } catch (e) {
    console.warn('[v0] Failed to cache location:', e)
  }
}

/**
 * Retrieve cached location from localStorage
 */
export function getCachedLocation(): LocationData | null {
  if (typeof window === 'undefined') return null
  try {
    const cached = localStorage.getItem('userLocation')
    return cached ? JSON.parse(cached) : null
  } catch (e) {
    console.warn('[v0] Failed to retrieve cached location:', e)
    return null
  }
}

/**
 * Clear cached location
 */
export function clearCachedLocation(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem('userLocation')
  } catch (e) {
    console.warn('[v0] Failed to clear cached location:', e)
  }
}
