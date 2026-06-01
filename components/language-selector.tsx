'use client'

import { useState } from 'react'
import { Globe, Check, ChevronDown, Loader2, AlertCircle } from 'lucide-react'
import { useLanguage, SUPPORTED_LANGUAGES, type LanguageCode } from '@/lib/language-context'
import { Button } from '@/components/ui/button'

interface LanguageSelectorProps {
  variant?: 'button' | 'dropdown' | 'list'
  showNativeName?: boolean
  className?: string
}

export function LanguageSelector({ 
  variant = 'dropdown', 
  showNativeName = true,
  className = '' 
}: LanguageSelectorProps) {
  const { currentLanguage, setLanguage, isTranslating, isGoogleTranslateAvailable } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)

  const currentLangObj = SUPPORTED_LANGUAGES.find(l => l.code === currentLanguage)

  const handleLanguageSelect = (code: LanguageCode) => {
    if (code === currentLanguage) {
      setIsOpen(false)
      return
    }
    setLanguage(code)
    setIsOpen(false)
  }

  if (variant === 'list') {
    return (
      <div className={`space-y-2 ${className}`}>
        {SUPPORTED_LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLanguageSelect(lang.code)}
            disabled={isTranslating}
            className={`w-full p-4 rounded-xl flex items-center justify-between transition-all ${
              currentLanguage === lang.code
                ? 'bg-primary/20 border-2 border-primary'
                : 'glass-card hover:bg-secondary/50'
            } ${isTranslating ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                currentLanguage === lang.code ? 'bg-primary/30' : 'bg-secondary/80'
              }`}>
                <span className="text-lg font-medium">
                  {lang.nativeName.charAt(0)}
                </span>
              </div>
              <div className="text-left">
                <span className="font-medium">{lang.name}</span>
                {showNativeName && lang.code !== 'en' && (
                  <p className="text-sm text-muted-foreground">{lang.nativeName}</p>
                )}
              </div>
            </div>
            {currentLanguage === lang.code && (
              <Check className="w-5 h-5 text-primary" />
            )}
            {isTranslating && currentLanguage !== lang.code && (
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            )}
          </button>
        ))}
      </div>
    )
  }

  if (variant === 'button') {
    return (
      <div className={`relative ${className}`}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          disabled={isTranslating}
          className="flex items-center gap-2"
        >
          {isTranslating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Globe className="w-4 h-4" />
          )}
          <span>{currentLangObj?.code.toUpperCase()}</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </Button>

        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />
            <div className="absolute right-0 top-full mt-2 w-48 py-2 glass-card rounded-xl shadow-lg z-50 animate-slide-up">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageSelect(lang.code)}
                  className={`w-full px-4 py-2 text-left flex items-center justify-between hover:bg-secondary/50 transition-colors ${
                    currentLanguage === lang.code ? 'text-primary bg-primary/10' : ''
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="font-medium">{lang.name}</span>
                    {showNativeName && lang.code !== 'en' && (
                      <span className="text-xs text-muted-foreground">({lang.nativeName})</span>
                    )}
                  </span>
                  {currentLanguage === lang.code && (
                    <Check className="w-4 h-4" />
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  // Default dropdown variant
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isTranslating}
        className="w-full p-4 glass-card rounded-xl flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary/80 flex items-center justify-center">
            {isTranslating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Globe className="w-5 h-5 text-foreground" />
            )}
          </div>
          <div className="text-left">
            <span className="font-medium">Language</span>
            <p className="text-xs text-muted-foreground">
              {currentLangObj?.name}
              {showNativeName && currentLangObj?.code !== 'en' && ` (${currentLangObj?.nativeName})`}
            </p>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute left-0 right-0 top-full mt-2 py-2 glass-card rounded-xl shadow-lg z-50 animate-slide-up max-h-64 overflow-y-auto">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageSelect(lang.code)}
                className={`w-full px-4 py-3 text-left flex items-center justify-between hover:bg-secondary/50 transition-colors ${
                  currentLanguage === lang.code ? 'text-primary bg-primary/10' : ''
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="font-medium">{lang.name}</span>
                  {showNativeName && lang.code !== 'en' && (
                    <span className="text-sm text-muted-foreground">({lang.nativeName})</span>
                  )}
                </span>
                {currentLanguage === lang.code && (
                  <Check className="w-4 h-4" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
