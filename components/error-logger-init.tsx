'use client'

import { useEffect } from 'react'
import { setupErrorHandlers, errorHandler } from '@/lib/error-handler'

/**
 * Initialize global error handlers
 * This component safely sets up error tracking without affecting PWA
 * Only initializes after a delay to avoid router initialization conflicts
 */
export function ErrorLoggerInit() {
  useEffect(() => {
    // Delay initialization to avoid interfering with router setup and HMR
    const timer = setTimeout(() => {
      try {
        // Initialize error handlers (client-side only)
        setupErrorHandlers()
        
        // Optional: Send initialization log
        errorHandler.logAction('app_initialized', {
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          isOnline: navigator.onLine,
        })
      } catch (err) {
        // Silently fail - don't crash the app if error logging fails
        console.warn('[v0] Failed to initialize error handlers:', err)
      }
    }, 1000) // Wait 1 second for app to fully initialize

    return () => clearTimeout(timer)
  }, [])

  // This component doesn't render anything
  return null
}
