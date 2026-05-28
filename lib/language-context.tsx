'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

export type LanguageCode = 'en' | 'hi' | 'te' | 'ta' | 'ml' | 'kn' | 'ur' | 'gu' | 'bn'

export interface Language {
  code: LanguageCode
  name: string
  nativeName: string
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
]

interface LanguageContextType {
  currentLanguage: LanguageCode
  setLanguage: (code: LanguageCode) => void
  isTranslating: boolean
  languages: Language[]
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const LANGUAGE_STORAGE_KEY = 'salonjobsindia_language'

// Declare Google Translate types
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
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>('en')
  const [isTranslating, setIsTranslating] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize Google Translate
  useEffect(() => {
    // Load saved language preference
    const savedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY) as LanguageCode
    if (savedLang && SUPPORTED_LANGUAGES.some(l => l.code === savedLang)) {
      setCurrentLanguage(savedLang)
    }

    // Initialize Google Translate widget
    const initGoogleTranslate = () => {
      if (window.google?.translate?.TranslateElement) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            includedLanguages: 'hi,te,ta,ml,kn,ur,gu,bn',
            autoDisplay: false,
          },
          'google_translate_element'
        )
        setIsInitialized(true)
      }
    }

    // Set up the callback
    window.googleTranslateElementInit = initGoogleTranslate

    // Load Google Translate script if not already loaded
    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script')
      script.id = 'google-translate-script'
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
      script.async = true
      document.body.appendChild(script)
    } else if (window.google?.translate) {
      initGoogleTranslate()
    }

    return () => {
      // Cleanup is handled by the script remaining on the page
    }
  }, [])

  // Apply saved language after initialization
  useEffect(() => {
    if (isInitialized && currentLanguage !== 'en') {
      // Small delay to ensure Google Translate is fully loaded
      const timeout = setTimeout(() => {
        triggerLanguageChange(currentLanguage)
      }, 500)
      return () => clearTimeout(timeout)
    }
  }, [isInitialized, currentLanguage])

  const triggerLanguageChange = useCallback((langCode: LanguageCode) => {
    setIsTranslating(true)

    // Find and trigger the Google Translate select element
    const selectElement = document.querySelector('.goog-te-combo') as HTMLSelectElement
    
    if (selectElement) {
      if (langCode === 'en') {
        // Reset to English by selecting empty option or using the reset function
        const iframe = document.querySelector('.goog-te-banner-frame') as HTMLIFrameElement
        if (iframe?.contentDocument) {
          const resetLink = iframe.contentDocument.querySelector('.goog-te-button button')
          if (resetLink) {
            (resetLink as HTMLElement).click()
          }
        }
        // Alternative: Clear the cookie
        document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
        document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + window.location.hostname
        // Reload to apply English
        window.location.reload()
      } else {
        selectElement.value = langCode
        selectElement.dispatchEvent(new Event('change', { bubbles: true }))
      }
    } else {
      // If select not found, try setting cookie directly
      const langPair = `/en/${langCode}`
      document.cookie = `googtrans=${langPair}; path=/`
      document.cookie = `googtrans=${langPair}; path=/; domain=${window.location.hostname}`
      
      if (langCode !== 'en') {
        // Reload to trigger translation
        window.location.reload()
      }
    }

    // Remove translating state after a delay
    setTimeout(() => {
      setIsTranslating(false)
    }, 1500)
  }, [])

  const setLanguage = useCallback((code: LanguageCode) => {
    if (code === currentLanguage) return

    setCurrentLanguage(code)
    localStorage.setItem(LANGUAGE_STORAGE_KEY, code)
    triggerLanguageChange(code)
  }, [currentLanguage, triggerLanguageChange])

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
      {/* Hidden Google Translate element */}
      <div id="google_translate_element" className="hidden" />
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
