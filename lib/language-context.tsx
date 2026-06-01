'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

export type LanguageCode = 'en' | 'hi' | 'te' | 'ta' | 'ml' | 'kn' | 'ur' | 'gu' | 'bn'

export interface Language {
  code: LanguageCode
  name: string
  nativeName: string
  googleCode?: string
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

    console.log('[v0] Language context initializing')
    
    // Load saved language
    try {
      const savedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY) as LanguageCode
      if (savedLang && SUPPORTED_LANGUAGES.some(l => l.code === savedLang)) {
        console.log('[v0] Loaded saved language:', savedLang)
        setCurrentLanguageState(savedLang)
      }
    } catch (e) {
      // ignore
    }

    // Load Google Translate script
    (window as any).googleTranslateElementInit = function() {
      console.log('[v0] googleTranslateElementInit called')
      try {
        if ((window as any).google?.translate?.TranslateElement && document.getElementById('google_translate_element')) {
          console.log('[v0] Creating Google Translate element')
          new (window as any).google.translate.TranslateElement(
            {
              pageLanguage: 'en',
              includedLanguages: 'en,hi,te,ta,ml,kn,ur,gu,bn',
              autoDisplay: false,
            },
            'google_translate_element'
          )
        }
      } catch (e) {
        console.log('[v0] Error in googleTranslateElementInit:', e)
      }
    }

    // Load the script only once
    if (!document.getElementById('google-translate-script')) {
      console.log('[v0] Loading Google Translate script')
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

    setIsTranslating(true)

    // Find the Google Translate select element
    const findAndTranslate = (attempts = 0) => {
      const selectElement = document.querySelector('.goog-te-combo') as HTMLSelectElement
      
      if (selectElement) {
        try {
          if (code === 'en') {
            // Reset to English
            selectElement.value = 'en'
          } else {
            selectElement.value = code
          }
          
          selectElement.dispatchEvent(new Event('change', { bubbles: true }))
          selectElement.dispatchEvent(new Event('input', { bubbles: true }))
          
          // Set cookie
          if (code === 'en') {
            eraseCookie(GOOGLETRANS_COOKIE)
          } else {
            setCookie(GOOGLETRANS_COOKIE, `/en/${code}`)
          }
          
          setTimeout(() => {
            setIsTranslating(false)
          }, 1000)
          
          return
        } catch (e) {
          // ignore
        }
      }
      
      // Retry if element not found
      if (attempts < 10) {
        setTimeout(() => findAndTranslate(attempts + 1), 300)
      } else {
        setIsTranslating(false)
      }
    }

    findAndTranslate()
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
