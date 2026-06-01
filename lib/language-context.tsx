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

// Clear Google Translate cookies
function clearAllTranslateCookies() {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : ''
  
  const cookieNames = ['googtrans', 'google_translate_element_init']
  const domains = ['', hostname, `.${hostname}`]
  const paths = ['/', '']
  
  cookieNames.forEach(name => {
    domains.forEach(domain => {
      paths.forEach(path => {
        const cookie = `${name}=`
        const domainStr = domain ? `; domain=${domain}` : ''
        const pathStr = path ? `; path=${path}` : ''
        
        document.cookie = `${cookie}; max-age=0${domainStr}${pathStr}`
        document.cookie = `${cookie}; expires=Thu, 01 Jan 1970 00:00:00 GMT${domainStr}${pathStr}`
      })
    })
  })
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [currentLanguage, setCurrentLanguageState] = useState<LanguageCode>('en')
  const [isTranslating, setIsTranslating] = useState(false)
  const [isGoogleTranslateAvailable, setIsGoogleTranslateAvailable] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

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
      } catch (error) {
        setIsGoogleTranslateAvailable(false)
      }
    }

    window.googleTranslateElementInit = initGoogleTranslate

    if (!document.getElementById('google-translate-script')) {
      try {
        const script = document.createElement('script')
        script.id = 'google-translate-script'
        script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
        script.async = true
        script.onerror = () => {
          setIsGoogleTranslateAvailable(false)
        }
        script.onload = () => {
          setTimeout(() => {
            if (window.google?.translate?.TranslateElement) {
              setIsGoogleTranslateAvailable(true)
            }
          }, 500)
        }
        document.body.appendChild(script)
      } catch (error) {
        setIsGoogleTranslateAvailable(false)
      }
    }

    setIsInitialized(true)

    return () => {
      if (window.googleTranslateElementInit) {
        delete window.googleTranslateElementInit
      }
    }
  }, [isInitialized])

  const triggerLanguageChange = useCallback((langCode: LanguageCode) => {
    setIsTranslating(true)

    // ENGLISH: Reset Google Translate without page reload
    if (langCode === 'en') {
      clearAllTranslateCookies()
      
      // Reset Google Translate element
      const selectElement = document.querySelector('.goog-te-combo') as HTMLSelectElement
      if (selectElement) {
        selectElement.value = ''
        selectElement.dispatchEvent(new Event('change', { bubbles: true }))
      }
      
      // Remove translated elements
      document.querySelectorAll('.goog-te-frame').forEach(el => {
        try {
          (el as any).style.display = 'none'
        } catch (e) {
          // ignore
        }
      })
      
      setTimeout(() => {
        setIsTranslating(false)
      }, 500)
      return
    }

    // For non-English languages, use Google Translate
    const attemptLanguageSwitch = (retryCount = 0) => {
      const selectElement = document.querySelector('.goog-te-combo') as HTMLSelectElement
      
      if (selectElement) {
        const langObj = SUPPORTED_LANGUAGES.find(l => l.code === langCode)
        if (langObj) {
          selectElement.value = langObj.googleCode
          selectElement.dispatchEvent(new Event('change', { bubbles: true }))
          selectElement.dispatchEvent(new Event('input', { bubbles: true }))
          
          setTimeout(() => {
            setIsTranslating(false)
          }, 1000)
        }
      } else if (retryCount < 5) {
        setTimeout(() => attemptLanguageSwitch(retryCount + 1), 400)
      } else {
        setIsTranslating(false)
      }
    }

    attemptLanguageSwitch()
  }, [])

  const setLanguage = useCallback((code: LanguageCode) => {
    setCurrentLanguageState(code)
    
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, code)
    } catch (error) {
      // ignore
    }
    
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
      {/* Hidden Google Translate widget container */}
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
