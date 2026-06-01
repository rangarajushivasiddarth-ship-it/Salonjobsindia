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

// Suppress Google Translate console errors
const originalConsoleError = typeof console !== 'undefined' ? console.error : null

function shouldSuppressError(message: unknown): boolean {
  if (typeof message !== 'string') return false
  return (
    message.includes('translate.google.com') ||
    message.includes('googleTranslate') ||
    message.includes('goog-te-') ||
    message.includes('element.js') ||
    (typeof message === 'string' && message.includes('Uncaught') && message.includes('translate'))
  )
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [currentLanguage, setCurrentLanguageState] = useState<LanguageCode>('en')
  const [isTranslating, setIsTranslating] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [googleTranslateReady, setGoogleTranslateReady] = useState(false)

  // Override console.error to suppress Google Translate errors
  useEffect(() => {
    if (typeof window === 'undefined' || !originalConsoleError) return

    const suppressedError = function(message: unknown, ...args: unknown[]) {
      if (!shouldSuppressError(message)) {
        originalConsoleError.apply(console, [message, ...args])
      }
    }

    console.error = suppressedError as any
    
    return () => {
      console.error = originalConsoleError
    }
  }, [])

  // Initialize language from storage
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY) as LanguageCode
      if (savedLang && SUPPORTED_LANGUAGES.some(l => l.code === savedLang)) {
        setCurrentLanguageState(savedLang)
      }
    } catch (error) {
      // ignore
    }
    setIsInitialized(true)
  }, [])

  // Load Google Translate script
  useEffect(() => {
    if (typeof window === 'undefined' || !isInitialized) return

    const loadGoogleTranslate = () => {
      if (document.getElementById('google-translate-script')) return

      try {
        // Define the callback BEFORE loading the script
        (window as any).googleTranslateElementInit = function() {
          try {
            if ((window as any).google?.translate?.TranslateElement && document.getElementById('google_translate_element')) {
              new (window as any).google.translate.TranslateElement(
                {
                  pageLanguage: 'en',
                  includedLanguages: 'hi,te,ta,ml,kn,ur,gu,bn',
                  autoDisplay: false,
                  layout: (window as any).google.translate.TranslateElement.InlineLayout.SIMPLE,
                },
                'google_translate_element'
              )
              setGoogleTranslateReady(true)
            }
          } catch (error) {
            // Silently ignore
          }
        }

        // Load Google Translate script
        const script = document.createElement('script')
        script.id = 'google-translate-script'
        script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
        script.async = true
        script.defer = true
        script.onerror = () => {
          setGoogleTranslateReady(false)
        }
        script.onload = () => {
          setTimeout(() => {
            if ((window as any).google?.translate?.TranslateElement) {
              setGoogleTranslateReady(true)
            }
          }, 500)
        }
        document.body.appendChild(script)
      } catch (error) {
        // Silently ignore
      }
    }

    loadGoogleTranslate()

    return () => {
      if ((window as any).googleTranslateElementInit) {
        delete (window as any).googleTranslateElementInit
      }
    }
  }, [isInitialized])

  const setLanguage = useCallback((code: LanguageCode) => {
    // Update local state immediately
    setCurrentLanguageState(code)
    
    // Persist to localStorage
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, code)
    } catch (error) {
      // ignore
    }

    // Handle English - reset translation
    if (code === 'en') {
      try {
        const selectElement = document.querySelector('.goog-te-combo') as HTMLSelectElement
        if (selectElement) {
          selectElement.value = ''
          selectElement.dispatchEvent(new Event('change', { bubbles: true }))
          selectElement.dispatchEvent(new Event('input', { bubbles: true }))
        }
      } catch (error) {
        // Silently ignore
      }
      setIsTranslating(false)
      return
    }

    // For other languages, trigger Google Translate with retries
    setIsTranslating(true)
    
    const attemptTranslate = (retries = 0): void => {
      try {
        const selectElement = document.querySelector('.goog-te-combo') as HTMLSelectElement
        if (selectElement && googleTranslateReady) {
          const langObj = SUPPORTED_LANGUAGES.find(l => l.code === code)
          if (langObj?.googleCode) {
            selectElement.value = langObj.googleCode
            selectElement.dispatchEvent(new Event('change', { bubbles: true }))
            selectElement.dispatchEvent(new Event('input', { bubbles: true }))
            setTimeout(() => setIsTranslating(false), 1000)
            return
          }
        }
        
        // Retry if element not found yet or Google Translate not ready
        if (retries < 8) {
          setTimeout(() => attemptTranslate(retries + 1), 350)
        } else {
          setIsTranslating(false)
        }
      } catch (error) {
        setIsTranslating(false)
      }
    }
    
    attemptTranslate()
  }, [googleTranslateReady])

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
