'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

export type LanguageCode = 'en' | 'hi' | 'te' | 'ta' | 'ml' | 'kn' | 'ur' | 'gu' | 'bn'

export interface Language {
  code: LanguageCode
  name: string
  nativeName: string
  googleCode: string
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', googleCode: 'en' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', googleCode: 'hi' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', googleCode: 'te' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', googleCode: 'ta' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', googleCode: 'ml' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', googleCode: 'kn' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', googleCode: 'ur' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', googleCode: 'gu' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', googleCode: 'bn' },
]

interface LanguageContextType {
  currentLanguage: LanguageCode
  setLanguage: (code: LanguageCode) => void
  isTranslating: boolean
  languages: Language[]
  isGoogleTranslateAvailable: boolean
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const LANGUAGE_STORAGE_KEY = 'salonjobsindia_language'

declare global {
  interface Window {
    googleTranslateElementInit?: () => void
    google?: {
      translate: {
        TranslateElement: new (options: {
          pageLanguage: string
          includedLanguages: string
          autoDisplay: boolean
          layout?: number
        }, elementId: string) => void
      }
    }
  }
}

// Helper to clear all Google Translate cookies
function clearTranslateCookies() {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : ''
  const domains = ['', hostname, `.${hostname}`]
  const paths = ['/', '']
  
  domains.forEach(domain => {
    paths.forEach(path => {
      const domainStr = domain ? `; domain=${domain}` : ''
      const pathStr = path ? `; path=${path}` : '; path=/'
      document.cookie = `googtrans=; max-age=0${domainStr}${pathStr}`
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT${domainStr}${pathStr}`
    })
  })
}

// Helper to restore original page content (remove Google Translate frame)
function restoreOriginalPage() {
  // Remove Google Translate banner if present
  const banner = document.querySelector('.goog-te-banner-frame')
  if (banner) {
    banner.remove()
  }
  
  // Reset body margin that Google Translate adds
  document.body.style.top = ''
  document.body.style.position = ''
  
  // Try to use Google's restore function if available
  const restoreBtn = document.querySelector('.goog-te-menu-frame')
  if (restoreBtn) {
    try {
      const iframe = restoreBtn as HTMLIFrameElement
      const innerDoc = iframe.contentDocument || iframe.contentWindow?.document
      if (innerDoc) {
        const showOriginal = innerDoc.querySelector('.goog-te-menu2-item')
        if (showOriginal) {
          (showOriginal as HTMLElement).click()
        }
      }
    } catch {
      // Cross-origin restrictions may prevent this
    }
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [currentLanguage, setCurrentLanguageState] = useState<LanguageCode>('en')
  const [isTranslating, setIsTranslating] = useState(false)
  const [isGoogleTranslateAvailable, setIsGoogleTranslateAvailable] = useState(false)
  const [scriptLoadAttempted, setScriptLoadAttempted] = useState(false)

  // Initialize Google Translate
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    // Load saved language preference
    try {
      const savedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY) as LanguageCode
      if (savedLang && SUPPORTED_LANGUAGES.some(l => l.code === savedLang)) {
        setCurrentLanguageState(savedLang)
      }
    } catch {
      // Silently handle localStorage errors
    }

    // Initialize Google Translate widget
    const initGoogleTranslate = () => {
      try {
        if (window.google?.translate?.TranslateElement) {
          new window.google.translate.TranslateElement(
            {
              pageLanguage: 'en',
              includedLanguages: 'hi,te,ta,ml,kn,ur,gu,bn',
              autoDisplay: false,
              layout: 0,
            },
            'google_translate_element'
          )
          setIsGoogleTranslateAvailable(true)
        }
      } catch {
        // Silently handle initialization errors
      }
    }

    window.googleTranslateElementInit = initGoogleTranslate

    // Only load script if not already loaded
    if (!document.getElementById('google-translate-script') && !scriptLoadAttempted) {
      setScriptLoadAttempted(true)
      try {
        const script = document.createElement('script')
        script.id = 'google-translate-script'
        script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
        script.async = true
        script.onerror = () => {
          // Google Translate blocked - that's okay, we'll work without it
          setIsGoogleTranslateAvailable(false)
        }
        script.onload = () => {
          // Wait a bit for Google Translate to initialize
          setTimeout(() => {
            if (window.google?.translate?.TranslateElement) {
              setIsGoogleTranslateAvailable(true)
            }
          }, 500)
        }
        document.body.appendChild(script)
      } catch {
        setIsGoogleTranslateAvailable(false)
      }
    } else if (window.google?.translate?.TranslateElement) {
      // Script already loaded, initialize immediately
      initGoogleTranslate()
    }

    // Cleanup
    return () => {
      if (window.googleTranslateElementInit) {
        delete window.googleTranslateElementInit
      }
    }
  }, [scriptLoadAttempted])

  const triggerLanguageChange = useCallback((langCode: LanguageCode) => {
    setIsTranslating(true)

    // If switching to English, we need to reset everything
    if (langCode === 'en') {
      // Clear all translation cookies
      clearTranslateCookies()
      
      // Try to use the Google Translate select to reset
      const selectElement = document.querySelector('.goog-te-combo') as HTMLSelectElement
      if (selectElement) {
        selectElement.value = ''
        selectElement.dispatchEvent(new Event('change', { bubbles: true }))
      }
      
      // Restore original page
      restoreOriginalPage()
      
      // Force page reload to fully reset translations
      // This is the most reliable way to return to English
      setTimeout(() => {
        setIsTranslating(false)
        // Only reload if we're actually translated (not already in English)
        const currentCookie = document.cookie.includes('googtrans')
        if (currentCookie || document.querySelector('.goog-te-banner-frame')) {
          window.location.reload()
        }
      }, 300)
      return
    }

    // For non-English languages, try to use Google Translate
    const attemptTranslate = (retryCount = 0) => {
      const selectElement = document.querySelector('.goog-te-combo') as HTMLSelectElement
      
      if (selectElement) {
        const langObj = SUPPORTED_LANGUAGES.find(l => l.code === langCode)
        if (langObj) {
          selectElement.value = langObj.googleCode
          selectElement.dispatchEvent(new Event('change', { bubbles: true }))
        }
        setTimeout(() => setIsTranslating(false), 800)
      } else if (retryCount < 3) {
        // Retry a few times if Google Translate isn't ready
        setTimeout(() => attemptTranslate(retryCount + 1), 500)
      } else {
        // Google Translate not available
        setIsTranslating(false)
      }
    }

    attemptTranslate()
  }, [])

  const setLanguage = useCallback((code: LanguageCode) => {
    // Always update our state first
    setCurrentLanguageState(code)
    
    // Persist to localStorage
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, code)
    } catch {
      // Silently handle localStorage errors
    }
    
    // Trigger the actual translation change
    triggerLanguageChange(code)
  }, [triggerLanguageChange])

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        setLanguage,
        isTranslating,
        languages: SUPPORTED_LANGUAGES,
        isGoogleTranslateAvailable,
      }}
    >
      {children}
      <div 
        id="google_translate_element" 
        style={{ 
          position: 'absolute',
          top: '-9999px',
          left: '-9999px',
          visibility: 'hidden',
          opacity: 0,
          pointerEvents: 'none',
          width: 0,
          height: 0,
          overflow: 'hidden',
        }} 
      />
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
