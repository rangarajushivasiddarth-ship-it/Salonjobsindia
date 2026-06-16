/**
 * Platform detection utilities to distinguish between:
 * - Web browser (desktop/mobile)
 * - PWA (Progressive Web App)
 * - Mobile app (Play Store Android, App Store iOS)
 */

export function isPWA(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true
}

export function isMobileApp(): boolean {
  if (typeof window === 'undefined') return false
  const ua = navigator.userAgent.toLowerCase()
  // Check for custom app user agents (Play Store app would include custom identifier)
  return ua.includes('salonjobsindia/app') || ua.includes('com.salonjobsindia')
}

export function isPlayStoreApp(): boolean {
  if (typeof window === 'undefined') return false
  // Play Store app detection
  return isMobileApp() && navigator.userAgent.includes('Android')
}

export function isAppOrPWA(): boolean {
  return isPWA() || isMobileApp()
}

export function getPlatformName(): 'web' | 'pwa' | 'mobile-app' {
  if (isMobileApp()) return 'mobile-app'
  if (isPWA()) return 'pwa'
  return 'web'
}

export function shouldShowAdminUI(): boolean {
  // Only show admin UI on web platform (not on Play Store or PWA)
  const platform = getPlatformName()
  return platform === 'web'
}

export function isAdminAccessAllowed(platform: string, userRole: string): boolean {
  // Admin access only allowed on web platform AND user must be admin
  return platform === 'web' && userRole === 'admin'
}
