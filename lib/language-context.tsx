'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

export type LanguageCode = 'en' | 'hi' | 'te' | 'ta' | 'ml' | 'kn' | 'ur' | 'gu' | 'bn'

export interface Language {
  code: LanguageCode
  name: string
  nativeName: string
  googleCode: string // Google Translate language code
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

    // Initialize Google Translate widget (hidden)
    const initGoogleTranslate = () => {
      if (window.google?.translate?.TranslateElement) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            includedLanguages: 'hi,te,ta,ml,kn,ur,gu,bn',
            autoDisplay: false,
            layout: 0, // TEXT layout - most minimal
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
  }, [isInitialized]) // eslint-disable-line react-hooks/exhaustive-deps

  const triggerLanguageChange = useCallback((langCode: LanguageCode) => {
    setIsTranslating(true)

    const langObj = SUPPORTED_LANGUAGES.find(l => l.code === langCode)
    const googleLangCode = langObj?.googleCode || langCode

    // Clear all translation cookies completely
    const clearCookies = () => {
      // Clear from root
      document.cookie = 'googtrans=; max-age=0; path=/;'
      // Clear from current domain
      document.cookie = `googtrans=; max-age=0; path=/; domain=${window.location.hostname};`
      // Clear from parent domain  
      document.cookie = `googtrans=; max-age=0; path=/; domain=.${window.location.hostname};`
      // Also try clearing the _ga and other cookies
      const domain = window.location.hostname
      document.cookie = `googtrans=; max-age=0; domain=${domain}; path=/;`
      document.cookie = `googtrans=; max-age=0; domain=.${domain}; path=/;`
    }

    // Method 1: Try using the hidden Google Translate select element
    const selectElement = document.querySelector('.goog-te-combo') as HTMLSelectElement
    
    if (selectElement) {
      if (langCode === 'en') {
        // Reset to English - clear the translation completely
        clearCookies()
        selectElement.value = ''
        selectElement.dispatchEvent(new Event('change', { bubbles: true }))
        
        // Reload to apply English
        setTimeout(() => {
          window.location.reload()
        }, 100)
      } else {
        // Set the language in the select dropdown
        selectElement.value = googleLangCode
        selectElement.dispatchEvent(new Event('change', { bubbles: true }))
        
        // Reload to trigger translation
        setTimeout(() => {
          window.location.reload()
        }, 500)
      }
    } else {
      // Method 2: Set cookies directly if select not found
      if (langCode === 'en') {
        // Full reset for English
        clearCookies()
      } else {
        // Clear first, then set new language
        clearCookies()
        const langPair = `/en/${googleLangCode}`
        document.cookie = `googtrans=${langPair}; path=/`
        document.cookie = `googtrans=${langPair}; path=/; domain=${window.location.hostname}`
        document.cookie = `googtrans=${langPair}; path=/; domain=.${window.location.hostname}`
      }
      
      // Reload to trigger translation
      setTimeout(() => {
        window.location.reload()
      }, 100)
    }

    // Remove translating state after a delay
    setTimeout(() => {
      setIsTranslating(false)
    }, 1500)
  }, [])

  const setLanguage = useCallback((code: LanguageCode) => {
    setCurrentLanguage(code)
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
      {/* Hidden Google Translate element - completely invisible */}
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
