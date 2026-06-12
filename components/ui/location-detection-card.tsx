'use client'

import { useState } from 'react'
import { MapPin, Navigation, AlertCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { detectLocation, cacheLocation, type LocationData, type GeolocationError } from '@/lib/location-utils'

interface LocationDetectionCardProps {
  onLocationDetected: (location: LocationData) => void
  location: LocationData | null
  onLocationCleared?: () => void
  errors?: Record<string, string>
  disabled?: boolean
  showManualFallback?: boolean
}

export function LocationDetectionCard({
  onLocationDetected,
  location,
  onLocationCleared,
  errors = {},
  disabled = false,
  showManualFallback = true,
}: LocationDetectionCardProps) {
  const [isDetecting, setIsDetecting] = useState(false)
  const [manualLocation, setManualLocation] = useState('')
  const [showManualInput, setShowManualInput] = useState(false)

  const handleDetectLocation = async () => {
    setIsDetecting(true)
    
    try {
      const locationData = await detectLocation()
      onLocationDetected(locationData)
      cacheLocation(locationData)
      setShowManualInput(false)
    } catch (error) {
      const geolocationError = error as GeolocationError
      console.error('[v0] Location detection failed:', geolocationError)
      
      // Show manual fallback on permission denied
      if (geolocationError.code === 'PERMISSION_DENIED') {
        setShowManualInput(true)
      }
    } finally {
      setIsDetecting(false)
    }
  }

  const handleManualLocation = () => {
    if (manualLocation.trim()) {
      const locationData: LocationData = {
        latitude: 0, // Will be updated when user provides coordinates or manual entry
        longitude: 0,
        address: manualLocation,
        city: '',
        district: '',
        state: '',
        country: 'India',
        formattedAddress: manualLocation,
      }
      onLocationDetected(locationData)
      cacheLocation(locationData)
      setShowManualInput(false)
      setManualLocation('')
    }
  }

  const handleClearLocation = () => {
    setManualLocation('')
    setShowManualInput(false)
    onLocationCleared?.()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          Location
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDetectLocation}
          disabled={isDetecting || disabled}
          className="text-primary border-primary/30"
        >
          <Navigation className="w-4 h-4 mr-1" />
          {isDetecting ? 'Detecting...' : 'Auto Detect'}
        </Button>
      </div>

      {/* Error Message */}
      {errors.location && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-amber-800">{errors.location}</p>
        </div>
      )}

      {/* Detected Location */}
      {location && location.address && !showManualInput && (
        <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">{location.address}</p>
            {location.city && (
              <p className="text-xs text-muted-foreground mt-1">
                {[location.city, location.district, location.state].filter(Boolean).join(', ')}
              </p>
            )}
          </div>
          <button
            onClick={handleClearLocation}
            className="p-1 hover:bg-primary/20 rounded transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      )}

      {/* Manual Entry Fallback */}
      {showManualInput && showManualFallback && (
        <div className="space-y-3 p-3 bg-secondary/30 border border-border/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            Enter your location manually:
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="e.g., Mumbai, Maharashtra"
              value={manualLocation}
              onChange={(e) => setManualLocation(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleManualLocation()}
              className="h-10"
            />
            <Button
              size="sm"
              onClick={handleManualLocation}
              disabled={!manualLocation.trim()}
              className="whitespace-nowrap"
            >
              Set Location
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
