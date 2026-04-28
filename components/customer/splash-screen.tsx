'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface SplashScreenProps {
  onComplete: () => void
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // After 1 second, fade in the logo with golden glow
    const fadeInTimer = setTimeout(() => {
      setIsVisible(true)
    }, 1000)

    // After 4 seconds total (1s delay + 2s fade + 1s hold), transition to app
    const transitionTimer = setTimeout(() => {
      onComplete()
    }, 4000)

    return () => {
      clearTimeout(fadeInTimer)
      clearTimeout(transitionTimer)
    }
  }, [onComplete])

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black overflow-hidden">
      {/* Logo with fade-in and golden glow animation */}
      <div
        className={`relative transition-all duration-[2000ms] ease-in-out ${
          isVisible 
            ? 'opacity-100' 
            : 'opacity-0'
        }`}
        style={{
          filter: isVisible 
            ? 'drop-shadow(0 0 25px rgba(212, 175, 55, 0.7))' 
            : 'drop-shadow(0 0 0px rgba(212, 175, 55, 0))',
          transform: 'translateZ(0)',
          willChange: 'opacity, filter',
        }}
      >
        <Image
          src="/images/fitone-logo.png"
          alt="FITONE - Born to Shine"
          width={340}
          height={140}
          className="max-w-[80vw] max-h-[80vh] object-contain"
          style={{ width: 'auto', height: 'auto' }}
          priority
        />
      </div>
    </div>
  )
}
