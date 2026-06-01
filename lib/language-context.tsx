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

// Clear Google Translate cookies - the ROOT of the language switching bug
function clearAllTranslateCookies() {
  console.log('[v0] Clearing Google Translate cookies')
  const hostname = typeof window !== 'undefined' ? window.location.hostname : ''
  
  // List of all possible cookie combinations to clear
  const cookieNames = ['googtrans', 'google_translate_element_init']
  const domains = ['', hostname, `.${hostname}`, 'translate.google.com']
  const paths = ['/', '', '/translate_a']
  
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

  // Initialize Google Translate
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (isInitialized) return

    console.log('[v0] Initializing Google Translate')
    
    // Load saved language preference
    try {
      const savedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY) as LanguageCode
      if (savedLang && SUPPORTED_LANGUAGES.some(l => l.code === savedLang)) {
        console.log('[v0] Loaded saved language:', savedLang)
        setCurrentLanguageState(savedLang)
      }
    } catch (error) {
      console.log('[v0] Could not load saved language:', error)
    }

    // Initialize Google Translate widget
    const initGoogleTranslate = () => {
      console.log('[v0] Initializing Google Translate widget')
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
          console.log('[v0] Google Translate widget initialized')
          setIsGoogleTranslateAvailable(true)
        }
      } catch (error) {
        console.error('[v0] Google Translate init failed:', error)
        setIsGoogleTranslateAvailable(false)
      }
    }

    window.googleTranslateElementInit = initGoogleTranslate

    // Load Google Translate script
    if (!document.getElementById('google-translate-script')) {
      console.log('[v0] Loading Google Translate script')
      try {
        const script = document.createElement('script')
        script.id = 'google-translate-script'
        script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
        script.async = true
        script.onerror = () => {
          console.warn('[v0] Google Translate script failed to load')
          setIsGoogleTranslateAvailable(false)
        }
        script.onload = () => {
          console.log('[v0] Google Translate script loaded')
          setTimeout(() => {
            if (window.google?.translate?.TranslateElement) {
              setIsGoogleTranslateAvailable(true)
            }
          }, 500)
        }
        document.body.appendChild(script)
      } catch (error) {
        console.error('[v0] Error loading Google Translate script:', error)
        setIsGoogleTranslateAvailable(false)
      }
    }

    setIsInitialized(true)

    // Cleanup
    return () => {
      if (window.googleTranslateElementInit) {
        delete window.googleTranslateElementInit
      }
    }
  }, [isInitialized])

  const triggerLanguageChange = useCallback((langCode: LanguageCode) => {
    console.log('[v0] Triggering language change to:', langCode)
    setIsTranslating(true)

    // SPECIAL HANDLING FOR ENGLISH: Must reload to fully restore original content
    if (langCode === 'en') {
      console.log('[v0] Resetting to English - clearing cookies and reloading')
      clearAllTranslateCookies()
      
      // Force a reload after clearing cookies
      setTimeout(() => {
        console.log('[v0] Reloading page to English')
        window.location.reload()
      }, 200)
      return
    }

    // For non-English languages, use Google Translate
    const attemptLanguageSwitch = (retryCount = 0) => {
      console.log(`[v0] Attempting language switch to ${langCode}, retry: ${retryCount}`)
      
      const selectElement = document.querySelector('.goog-te-combo') as HTMLSelectElement
      
      if (selectElement) {
        const langObj = SUPPORTED_LANGUAGES.find(l => l.code === langCode)
        if (langObj) {
          console.log('[v0] Found Google Translate select, changing to:', langObj.googleCode)
          selectElement.value = langObj.googleCode
          
          // Dispatch change event to trigger translation
          selectElement.dispatchEvent(new Event('change', { bubbles: true }))
          
          // Also dispatch input event as backup
          selectElement.dispatchEvent(new Event('input', { bubbles: true }))
          
          console.log('[v0] Language change event dispatched')
          setTimeout(() => {
            setIsTranslating(false)
          }, 1000)
        }
      } else if (retryCount < 5) {
        // Retry if Google Translate select not found yet
        console.log('[v0] Google Translate select not found, retrying...')
        setTimeout(() => attemptLanguageSwitch(retryCount + 1), 400)
      } else {
        // Google Translate not available after retries
        console.warn('[v0] Google Translate not available after retries')
        setIsTranslating(false)
      }
    }

    attemptLanguageSwitch()
  }, [])

  const setLanguage = useCallback((code: LanguageCode) => {
    console.log('[v0] Setting language to:', code)
    
    // CRITICAL: Update our state immediately
    setCurrentLanguageState(code)
    
    // Persist to localStorage
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, code)
      console.log('[v0] Language saved to localStorage:', code)
    } catch (error) {
      console.warn('[v0] Could not save language to localStorage:', error)
    }
    
    // Trigger the translation change
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
