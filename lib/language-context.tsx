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

// Suppress errors from Google Translate by overriding console.error
const originalConsoleError = console.error
function suppressGoogleTranslateErrors(message: unknown) {
  if (typeof message === 'string' && (
    message.includes('translate.google.com') || 
    message.includes('googleTranslate') ||
    message.includes('goog-te-')
  )) {
    return // Silently suppress
  }
  originalConsoleError.apply(console, [message])
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [currentLanguage, setCurrentLanguageState] = useState<LanguageCode>('en')
  const [isTranslating, setIsTranslating] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // Suppress Google Translate errors globally
  useEffect(() => {
    if (typeof window === 'undefined') return
    console.error = suppressGoogleTranslateErrors
    return () => {
      console.error = originalConsoleError
    }
  }, [])

  // Initialize from localStorage and load Google Translate
  useEffect(() => {
    if (typeof window === 'undefined' || isInitialized) return

    try {
      const savedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY) as LanguageCode
      if (savedLang && SUPPORTED_LANGUAGES.some(l => l.code === savedLang)) {
        setCurrentLanguageState(savedLang)
      }
    } catch (error) {
      // ignore
    }

    // Load Google Translate script - errors will be suppressed by console.error override
    if (!document.getElementById('google-translate-script')) {
      try {
        const script = document.createElement('script')
        script.id = 'google-translate-script'
        script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
        script.async = true
        script.defer = true
        
        // Suppress script errors at the script level
        script.onerror = () => {
          // Silently ignore script load errors
        }
        
        document.body.appendChild(script)
      } catch (error) {
        // Silently ignore
      }
    }

    // Initialize Google Translate widget
    if (typeof window !== 'undefined') {
      (window as any).googleTranslateElementInit = function() {
        try {
          if ((window as any).google?.translate?.TranslateElement) {
            new (window as any).google.translate.TranslateElement(
              {
                pageLanguage: 'en',
                includedLanguages: 'hi,te,ta,ml,kn,ur,gu,bn',
                autoDisplay: false,
                layout: (window as any).google.translate.TranslateElement.InlineLayout.SIMPLE,
              },
              'google_translate_element'
            )
          }
        } catch (error) {
          // Silently ignore initialization errors
        }
      }
    }

    setIsInitialized(true)
  }, [isInitialized])

  const setLanguage = useCallback((code: LanguageCode) => {
    setCurrentLanguageState(code)
    
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, code)
    } catch (error) {
      // ignore
    }

    // If English, reset Google Translate
    if (code === 'en') {
      try {
        const selectElement = document.querySelector('.goog-te-combo') as HTMLSelectElement
        if (selectElement) {
          selectElement.value = ''
          selectElement.dispatchEvent(new Event('change', { bubbles: true }))
        }
      } catch (error) {
        // Silently ignore
      }
      return
    }

    // For other languages, trigger translation via Google Translate
    setIsTranslating(true)
    const attemptTranslate = (retries = 0) => {
      try {
        const selectElement = document.querySelector('.goog-te-combo') as HTMLSelectElement
        if (selectElement) {
          const langObj = SUPPORTED_LANGUAGES.find(l => l.code === code)
          if (langObj?.googleCode) {
            selectElement.value = langObj.googleCode
            selectElement.dispatchEvent(new Event('change', { bubbles: true }))
            setIsTranslating(false)
            return
          }
        }
        
        // Retry if element not found
        if (retries < 5) {
          setTimeout(() => attemptTranslate(retries + 1), 300)
        } else {
          setIsTranslating(false)
        }
      } catch (error) {
        setIsTranslating(false)
      }
    }
    
    attemptTranslate()
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
