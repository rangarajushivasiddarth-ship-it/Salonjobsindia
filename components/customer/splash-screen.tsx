'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { LanguageSelector } from '@/components/language-selector'

interface SplashScreenProps {
  onComplete: () => void
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState<'initial' | 'logo' | 'scale' | 'exit'>('initial')

  useEffect(() => {
    // Phase 1: After 500ms, fade in the logo
    const logoTimer = setTimeout(() => {
      setPhase('logo')
    }, 500)

    // Phase 2: After 2s, add scale animation
    const scaleTimer = setTimeout(() => {
      setPhase('scale')
    }, 2000)

    // Phase 3: After 3.5s, start exit transition
    const exitTimer = setTimeout(() => {
      setPhase('exit')
    }, 3500)

    // Phase 4: After 4s, complete and go to homepage
    const completeTimer = setTimeout(() => {
      onComplete()
    }, 4000)

    return () => {
      clearTimeout(logoTimer)
      clearTimeout(scaleTimer)
      clearTimeout(exitTimer)
      clearTimeout(completeTimer)
    }
  }, [onComplete])

  return (
    <div 
      className={`fixed inset-0 flex flex-col items-center justify-center bg-black overflow-hidden transition-opacity duration-500 ${
        phase === 'exit' ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Language Selector in top-right corner */}
      <div 
        className={`absolute top-4 right-4 z-10 transition-opacity duration-500 ${
          phase === 'initial' || phase === 'exit' ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <LanguageSelector variant="button" showNativeName={false} />
      </div>

      {/* Logo with premium animation */}
      <div
        className={`relative transition-all duration-1000 ease-out ${
          phase === 'initial' 
            ? 'opacity-0 scale-90' 
            : phase === 'scale' || phase === 'exit'
            ? 'opacity-100 scale-105' 
            : 'opacity-100 scale-100'
        }`}
        style={{
          filter: phase !== 'initial' 
            ? 'drop-shadow(0 0 30px rgba(212, 175, 55, 0.5)) drop-shadow(0 0 60px rgba(212, 175, 55, 0.3))' 
            : 'none',
          transform: 'translateZ(0)',
          willChange: 'opacity, filter, transform',
        }}
      >
        <Image
          src="/images/logo.png"
          alt="Salon Jobs India"
          width={320}
          height={320}
          className="max-w-[80vw] max-h-[60vh] object-contain"
          style={{ width: 'auto', height: 'auto' }}
          priority
        />
      </div>
      
      {/* Subtitle with fade-in */}
      <div 
        className={`mt-6 text-center transition-all duration-700 delay-300 ${
          phase === 'initial' ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
        }`}
      >
        <p className="text-sm text-muted-foreground tracking-wider">
          Powered by <span className="text-amber-400 font-medium">FItonze Private Limited</span>
        </p>
      </div>

      {/* Loading dots */}
      <div 
        className={`flex items-center gap-2 mt-8 transition-opacity duration-500 ${
          phase === 'initial' || phase === 'exit' ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  )
}
