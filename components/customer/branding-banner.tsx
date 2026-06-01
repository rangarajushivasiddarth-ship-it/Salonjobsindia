'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

interface BrandingLogo {
  id: string
  url: string
  alt: string
}

interface BrandingBannerProps {
  section: 'job_seeker' | 'salon_owner'
  className?: string
}

// Default logos - will be replaced by admin-managed logos from localStorage
const DEFAULT_LOGOS: BrandingLogo[] = [
  {
    id: 'salon-jobs-india',
    url: '/images/salon-jobs-india-logo.png',
    alt: 'SALON.JOBS INDIA - FITONZE'
  }
]

// Storage key for admin-managed logos
const BRANDING_LOGOS_KEY = 'salonjobsindia_branding_logos'

interface BrandingLogosConfig {
  job_seeker: BrandingLogo[]
  salon_owner: BrandingLogo[]
}

export function getBrandingLogos(): BrandingLogosConfig {
  // Always return default logos for SSR consistency
  // Client-side will update via useEffect
  return {
    job_seeker: DEFAULT_LOGOS,
    salon_owner: DEFAULT_LOGOS
  }
}

export function getClientBrandingLogos(): BrandingLogosConfig {
  try {
    const stored = localStorage.getItem(BRANDING_LOGOS_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch {
    // Ignore errors
  }
  
  return {
    job_seeker: DEFAULT_LOGOS,
    salon_owner: DEFAULT_LOGOS
  }
}

export function saveBrandingLogos(config: BrandingLogosConfig) {
  try {
    localStorage.setItem(BRANDING_LOGOS_KEY, JSON.stringify(config))
  } catch {
    // Ignore errors
  }
}

export function BrandingBanner({ section, className = '' }: BrandingBannerProps) {
  const [logos, setLogos] = useState<BrandingLogo[]>(DEFAULT_LOGOS)
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
    
    const loadLogos = () => {
      const config = getClientBrandingLogos()
      const sectionLogos = config[section]
      if (sectionLogos && sectionLogos.length > 0) {
        setLogos(sectionLogos)
      }
    }
    
    loadLogos()
    
    // Listen for storage changes (when admin updates logos)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === BRANDING_LOGOS_KEY) {
        loadLogos()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // Also poll for changes within same tab
    const interval = setInterval(loadLogos, 5000)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [section])
  
  // Duplicate logos for seamless infinite scroll
  const displayLogos = [...logos, ...logos, ...logos, ...logos]
  
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Gradient overlays for smooth fade effect */}
      <div className="absolute left-0 top-0 bottom-0 w-8 md:w-12 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-8 md:w-12 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
      
      {/* Scrolling container */}
      <div className="flex animate-scroll-banner">
        {displayLogos.map((logo, index) => (
          <div
            key={`${logo.id}-${index}`}
            className="flex-shrink-0 px-3 md:px-4"
          >
            <div className="relative h-10 w-28 sm:h-12 sm:w-36 md:h-14 md:w-44 lg:h-16 lg:w-52">
              {logo.url.startsWith('/') ? (
                <Image
                  src={logo.url}
                  alt={logo.alt}
                  fill
                  className="object-contain"
                  sizes="(max-width: 640px) 112px, (max-width: 768px) 144px, (max-width: 1024px) 176px, 208px"
                  priority
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logo.url}
                  alt={logo.alt}
                  className="h-full w-full object-contain"
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
