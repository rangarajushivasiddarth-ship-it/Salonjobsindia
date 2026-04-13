'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

interface SplashScreenProps {
  onFindJob: () => void
  onCreateAlert: () => void
}

export function SplashScreen({ onFindJob, onCreateAlert }: SplashScreenProps) {
  const [phase, setPhase] = useState<'logo-pop' | 'logo-settle' | 'content'>('logo-pop')

  useEffect(() => {
    // Phase 1: Logo pops in (1.2s animation)
    const settleTimer = setTimeout(() => {
      setPhase('logo-settle')
    }, 1500)

    // Phase 2: Logo settles to background, content appears
    const contentTimer = setTimeout(() => {
      setPhase('content')
    }, 2500)

    return () => {
      clearTimeout(settleTimer)
      clearTimeout(contentTimer)
    }
  }, [])

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-background">
      {/* Background gradient with gold/black tones */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary/30" />
      
      {/* Animated background orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/3 rounded-full blur-[100px]" />

      {/* Settled Logo Background (visible after settle phase) - Blended into background */}
      {phase === 'content' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          {/* Multiple layers for deep blend effect */}
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Base layer - very subtle, large */}
            <div 
              className="relative w-[700px] h-[280px] opacity-[0.025]"
              style={{ filter: 'blur(3px) saturate(0.3) brightness(0.7)' }}
            >
              <Image
                src="/images/fitonze-logo.png"
                alt=""
                fill
                className="object-contain mix-blend-soft-light"
                priority
              />
            </div>
          </div>
          {/* Mid layer - slightly more visible */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div 
              className="relative w-[550px] h-[220px] opacity-[0.04]"
              style={{ filter: 'blur(1px) saturate(0.5) brightness(0.8)' }}
            >
              <Image
                src="/images/fitonze-logo.png"
                alt=""
                fill
                className="object-contain mix-blend-overlay"
                priority
              />
            </div>
          </div>
          {/* Gradient overlay to further blend */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background opacity-40" />
        </div>
      )}

      {/* Main Logo - Pop In Animation */}
      {(phase === 'logo-pop' || phase === 'logo-settle') && (
        <div 
          className={`absolute z-20 flex items-center justify-center transition-all duration-1000 ${
            phase === 'logo-pop' 
              ? 'animate-logo-pop-in' 
              : 'animate-logo-settle'
          }`}
        >
          <div className="relative">
            {/* Glow effect behind logo */}
            <div 
              className={`absolute -inset-8 bg-primary/20 rounded-full blur-3xl transition-opacity duration-1000 ${
                phase === 'logo-settle' ? 'opacity-0' : 'animate-glow-pulse'
              }`} 
            />
            
            <div 
              className={`relative w-[320px] h-[130px] md:w-[400px] md:h-[160px] transition-all duration-1000 ${
                phase === 'logo-settle' ? 'scale-150 opacity-0' : ''
              }`}
              style={phase === 'logo-settle' ? { filter: 'blur(10px) saturate(0)' } : {}}
            >
              <Image
                src="/images/fitonze-logo.png"
                alt="Fitonze"
                fill
                className="object-contain drop-shadow-2xl mix-blend-lighten"
                priority
              />
            </div>
          </div>
        </div>
      )}

      {/* Content - Fades in after logo settles */}
      {phase === 'content' && (
        <div className="relative z-10 flex flex-col items-center px-6 text-center">
          {/* Small logo with trademark */}
          <div 
            className="mb-6 animate-content-fade-in"
            style={{ animationDelay: '0ms' }}
          >
            <div className="relative w-[240px] h-[100px] md:w-[300px] md:h-[120px]">
              <Image
                src="/images/fitonze-logo.png"
                alt="Fitonze"
                fill
                className="object-contain mix-blend-lighten"
                priority
              />
            </div>
          </div>

          {/* Tagline */}
          <p 
            className="text-muted-foreground text-lg md:text-xl mb-10 max-w-md animate-content-fade-in"
            style={{ animationDelay: '150ms' }}
          >
            Find your perfect salon career within your neighborhood
          </p>

          {/* CTA Buttons */}
          <div 
            className="flex flex-col gap-4 w-full max-w-xs animate-content-fade-in"
            style={{ animationDelay: '300ms' }}
          >
            <Button
              onClick={onFindJob}
              size="lg"
              className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground gold-glow transition-all duration-300 hover:scale-[1.02]"
            >
              Find a Job
            </Button>
            
            <Button
              onClick={onCreateAlert}
              variant="outline"
              size="lg"
              className="w-full h-14 text-lg font-semibold border-primary/50 text-primary hover:bg-primary/10 transition-all duration-300 hover:scale-[1.02]"
            >
              Create Job Alert
            </Button>
          </div>

          {/* Footer text */}
          <p 
            className="mt-10 text-sm text-muted-foreground animate-content-fade-in"
            style={{ animationDelay: '450ms' }}
          >
            Discover salons within 20km of your location
          </p>

          {/* Trademark notice */}
          <p 
            className="mt-4 text-xs text-muted-foreground/60 animate-content-fade-in"
            style={{ animationDelay: '500ms' }}
          >
            Fitonze<sup className="text-[8px]">&reg;</sup> is a registered trademark
          </p>
        </div>
      )}
    </div>
  )
}
