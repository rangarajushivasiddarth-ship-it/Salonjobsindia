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

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [currentLanguage, setCurrentLanguageState] = useState<LanguageCode>('en')
  const [isTranslating, setIsTranslating] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize language from storage
  useEffect(() => {
    if (typeof window === 'undefined' || isInitialized) return
    
    try {
      const savedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY) as LanguageCode
      if (savedLang && SUPPORTED_LANGUAGES.some(l => l.code === savedLang)) {
        setCurrentLanguageState(savedLang)
        // Set HTML lang attribute immediately on initialization
        document.documentElement.lang = savedLang
        document.documentElement.dir = 'ltr'
      } else {
        setCurrentLanguageState('en')
        document.documentElement.lang = 'en'
        document.documentElement.dir = 'ltr'
      }
    } catch (e) {
      setCurrentLanguageState('en')
      document.documentElement.lang = 'en'
      document.documentElement.dir = 'ltr'
    }

    setIsInitialized(true)
  }, [isInitialized])

  const setLanguage = useCallback((code: LanguageCode) => {
    setIsTranslating(true)
    
    // Update state and storage immediately
    setCurrentLanguageState(code)
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, code)
    } catch (e) {
      // ignore
    }

    // Set HTML lang attribute for proper rendering
    if (typeof document !== 'undefined') {
      document.documentElement.lang = code
      document.documentElement.dir = 'ltr'
    }

    // Small delay to complete visual update
    setTimeout(() => {
      setIsTranslating(false)
    }, 100)
  }, [])

  const value: LanguageContextType = {
    currentLanguage,
    setLanguage,
    isTranslating,
    languages: SUPPORTED_LANGUAGES,
  }

  return (
    <LanguageContext.Provider value={value}>
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
