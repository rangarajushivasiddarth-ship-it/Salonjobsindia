'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

export type LanguageCode = 'en' | 'hi' | 'te'

export interface Language {
  code: LanguageCode
  name: string
  nativeName: string
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
]

interface LanguageContextType {
  currentLanguage: LanguageCode
  setLanguage: (code: LanguageCode) => void
  isTranslating: boolean
  languages: Language[]
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const LANGUAGE_STORAGE_KEY = 'salonjobsindia_language'
const GOOGLETRANS_COOKIE = 'googtrans'

function getCookie(name: string): string {
  if (typeof document === 'undefined') return ''
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(';').shift() || ''
  return ''
}

function setCookie(name: string, value: string, days: number = 365) {
  if (typeof document === 'undefined') return
  const date = new Date()
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000)
  const expires = `expires=${date.toUTCString()}`
  document.cookie = `${name}=${value};${expires};path=/`
}

function eraseCookie(name: string) {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`
}

// Suppress Google Translate console errors
if (typeof window !== 'undefined') {
  const originalError = console.error
  console.error = function(...args: any[]) {
    const message = args[0]?.toString() || ''
    if (
      message.includes('translate.google') ||
      message.includes('goog-te-') ||
      message.includes('element.js') ||
      message.includes('googleTranslate')
    ) {
      return
    }
    originalError.apply(console, args)
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [currentLanguage, setCurrentLanguageState] = useState<LanguageCode>('en')
  const [isTranslating, setIsTranslating] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize language from storage and load Google Translate
  useEffect(() => {
    if (typeof window === 'undefined' || isInitialized) return
    
    // ALWAYS start with English - clear any previous language settings
    eraseCookie(GOOGLETRANS_COOKIE)
    
    // Load saved language from localStorage only if user explicitly saved one
    try {
      const savedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY) as LanguageCode
      // Only use saved language if it was explicitly set by user, otherwise use English
      if (savedLang && SUPPORTED_LANGUAGES.some(l => l.code === savedLang) && savedLang !== 'en') {
        setCurrentLanguageState(savedLang)
      } else {
        // Default to English
        setCurrentLanguageState('en')
        // Clear localStorage to ensure clean state
        localStorage.removeItem(LANGUAGE_STORAGE_KEY)
      }
    } catch (e) {
      // If localStorage fails, just use English
      setCurrentLanguageState('en')
      eraseCookie(GOOGLETRANS_COOKIE)
    }

    // Load Google Translate script
    (window as any).googleTranslateElementInit = function() {
      try {
        if ((window as any).google?.translate?.TranslateElement && document.getElementById('google_translate_element')) {
          new (window as any).google.translate.TranslateElement(
            {
              pageLanguage: 'en',
              includedLanguages: 'en,hi,te',
              autoDisplay: false,
            },
            'google_translate_element'
          )
        }
      } catch (e) {
        // ignore
      }
    }

    // Load the script only once
    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script')
      script.id = 'google-translate-script'
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
      script.async = true
      document.head.appendChild(script)
    }

    setIsInitialized(true)
  }, [])

  const setLanguage = useCallback((code: LanguageCode) => {
    setCurrentLanguageState(code)
    
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, code)
    } catch (e) {
      // ignore
    }

    if (code === 'en') {
      // Reset to English - clear all translation cookies
      eraseCookie(GOOGLETRANS_COOKIE)
      // Reload page to ensure clean English state
      if (typeof window !== 'undefined') {
        window.location.reload()
      }
      return
    }

    // For Hindi and Telugu, set the cookie and reload
    setCookie(GOOGLETRANS_COOKIE, `/en/${code}`)
    
    // Reload page after setting cookie
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        window.location.reload()
      }, 200)
    }
  }, [])

  const value: LanguageContextType = {
    currentLanguage,
    setLanguage,
    isTranslating,
    languages: SUPPORTED_LANGUAGES,
  }

  return (
    <LanguageContext.Provider value={value}>
      <div id="google_translate_element" style={{ display: 'none' }} />
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}
