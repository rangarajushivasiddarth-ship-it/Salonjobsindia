'use client'

import { useState, useEffect } from 'react'
import { Scissors } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SplashScreenProps {
  onFindJob: () => void
  onCreateAlert: () => void
}

export function SplashScreen({ onFindJob, onCreateAlert }: SplashScreenProps) {
  const [showLogo, setShowLogo] = useState(false)
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    const logoTimer = setTimeout(() => setShowLogo(true), 100)
    const contentTimer = setTimeout(() => setShowContent(true), 800)
    return () => {
      clearTimeout(logoTimer)
      clearTimeout(contentTimer)
    }
  }, [])

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary/20" />
      
      {/* Animated background orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        {/* Logo */}
        <div 
          className={`mb-8 transition-all duration-1000 ${
            showLogo ? 'animate-logo-pop' : 'opacity-0 scale-0'
          }`}
        >
          <div className="relative">
            <div className="w-28 h-28 rounded-3xl glass neon-glow flex items-center justify-center">
              <Scissors className="w-14 h-14 text-primary" />
            </div>
            <div className="absolute -inset-1 bg-primary/20 rounded-3xl blur-xl -z-10 animate-pulse-glow" />
          </div>
        </div>

        {/* Brand name */}
        <h1 
          className={`text-4xl md:text-5xl font-bold mb-3 transition-all duration-700 ${
            showLogo ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ transitionDelay: '300ms' }}
        >
          <span className="text-foreground">Salon</span>
          <span className="text-primary neon-text">Jobs</span>
        </h1>

        {/* Tagline */}
        <p 
          className={`text-muted-foreground text-lg md:text-xl mb-12 max-w-md transition-all duration-700 ${
            showLogo ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ transitionDelay: '500ms' }}
        >
          Find your perfect salon career within your neighborhood
        </p>

        {/* CTA Buttons */}
        <div 
          className={`flex flex-col gap-4 w-full max-w-xs transition-all duration-700 ${
            showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <Button
            onClick={onFindJob}
            size="lg"
            className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground neon-glow transition-all duration-300 hover:scale-[1.02]"
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
          className={`mt-12 text-sm text-muted-foreground transition-all duration-700 ${
            showContent ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ transitionDelay: '200ms' }}
        >
          Discover salons within 20km of your location
        </p>
      </div>
    </div>
  )
}
