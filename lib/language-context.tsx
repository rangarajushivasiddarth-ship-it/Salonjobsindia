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
    // Load saved language preference
    const savedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY) as LanguageCode
    if (savedLang && SUPPORTED_LANGUAGES.some(l => l.code === savedLang)) {
      setCurrentLanguageState(savedLang)
    }

    // Initialize Google Translate widget
    const initGoogleTranslate = () => {
      if (window.google?.translate?.TranslateElement) {
        try {
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
        } catch (error) {
          console.error('[v0] Google Translate init error:', error)
        }
      }
    }

    window.googleTranslateElementInit = initGoogleTranslate

    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script')
      script.id = 'google-translate-script'
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
      script.async = true
      script.onerror = () => {
        console.error('[v0] Failed to load Google Translate')
      }
      document.body.appendChild(script)
    } else if (window.google?.translate) {
      initGoogleTranslate()
    }
  }, [])

  const triggerLanguageChange = useCallback((langCode: LanguageCode) => {
    try {
      setIsTranslating(true)

      const selectElement = document.querySelector('.goog-te-combo') as HTMLSelectElement
      
      if (!selectElement) {
        console.warn('[v0] Google Translate select element not found')
        setIsTranslating(false)
        return
      }

      if (langCode === 'en') {
        // Reset to English
        selectElement.value = ''
        selectElement.dispatchEvent(new Event('change', { bubbles: true }))
        
        // Clear cookies
        document.cookie = 'googtrans=; max-age=0; path=/;'
        document.cookie = `googtrans=; max-age=0; domain=${window.location.hostname}; path=/;`
      } else {
        // Get Google language code
        const langObj = SUPPORTED_LANGUAGES.find(l => l.code === langCode)
        const googleLangCode = langObj?.googleCode || langCode

        // Set the language
        selectElement.value = googleLangCode
        selectElement.dispatchEvent(new Event('change', { bubbles: true }))
      }

      // Stop translating after animation completes
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
