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

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [currentLanguage, setCurrentLanguageState] = useState<LanguageCode>('en')
  const [isTranslating, setIsTranslating] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize Google Translate
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    // Load saved language preference
    try {
      const savedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY) as LanguageCode
      if (savedLang && SUPPORTED_LANGUAGES.some(l => l.code === savedLang)) {
        setCurrentLanguageState(savedLang)
      }
    } catch (e) {
      console.warn('[v0] Could not load saved language:', e)
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
          setIsInitialized(true)
        }
      } catch (error) {
        console.error('[v0] Google Translate initialization error:', error)
        setIsInitialized(true) // Still mark as initialized even on error
      }
    }

    window.googleTranslateElementInit = initGoogleTranslate

    // Only load script if not already loaded
    if (!document.getElementById('google-translate-script')) {
      try {
        const script = document.createElement('script')
        script.id = 'google-translate-script'
        script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
        script.async = true
        script.onerror = () => {
          console.warn('[v0] Google Translate script failed to load (may be blocked or unavailable)')
          setIsInitialized(true) // Still mark as initialized
        }
        document.body.appendChild(script)
      } catch (error) {
        console.error('[v0] Error loading Google Translate script:', error)
        setIsInitialized(true)
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
  }, [])

  const triggerLanguageChange = useCallback((langCode: LanguageCode) => {
    try {
      setIsTranslating(true)

      const selectElement = document.querySelector('.goog-te-combo') as HTMLSelectElement
      
      if (!selectElement) {
        console.warn('[v0] Google Translate select not ready, trying again...')
        // Retry after a short delay
        setTimeout(() => {
          const retrySelectElement = document.querySelector('.goog-te-combo') as HTMLSelectElement
          if (retrySelectElement) {
            if (langCode === 'en') {
              retrySelectElement.value = ''
            } else {
              const langObj = SUPPORTED_LANGUAGES.find(l => l.code === langCode)
              if (langObj) {
                retrySelectElement.value = langObj.googleCode
              }
            }
            retrySelectElement.dispatchEvent(new Event('change', { bubbles: true }))
          }
          setTimeout(() => setIsTranslating(false), 600)
        }, 300)
        return
      }

      // Set the language value
      if (langCode === 'en') {
        selectElement.value = ''
        selectElement.dispatchEvent(new Event('change', { bubbles: true }))
        // Clear translation cookies
        document.cookie = 'googtrans=; max-age=0; path=/;'
        document.cookie = `googtrans=; max-age=0; domain=${window.location.hostname}; path=/;`
      } else {
        const langObj = SUPPORTED_LANGUAGES.find(l => l.code === langCode)
        if (langObj) {
          selectElement.value = langObj.googleCode
          selectElement.dispatchEvent(new Event('change', { bubbles: true }))
        }
      }

      // Stop translating after animation
      setTimeout(() => {
        setIsTranslating(false)
      }, 800)
    } catch (error) {
      console.error('[v0] Language change error:', error)
      setIsTranslating(false)
    }
  }, [])

  const setLanguage = useCallback((code: LanguageCode) => {
    setCurrentLanguageState(code)
    localStorage.setItem(LANGUAGE_STORAGE_KEY, code)
    triggerLanguageChange(code)
  }, [triggerLanguageChange])

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        setLanguage,
        isTranslating,
        languages: SUPPORTED_LANGUAGES,
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
