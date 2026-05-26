'use client'

import { Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useLanguage, type Language } from '@/lib/language-context'

const LANGUAGES: Language[] = ['English', 'Hindi', 'Telugu', 'Tamil', 'Kannada', 'Gujarati', 'Malayalam', 'Marathi', 'Urdu']

export function LanguageSwitcher() {
  const { currentLanguage, setLanguage } = useLanguage()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          aria-label="Change language"
        >
          <Globe className="h-5 w-5" />
          <span className="sr-only">Language: {currentLanguage}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang}
            onClick={() => setLanguage(lang)}
            className={currentLanguage === lang ? 'bg-accent' : ''}
          >
            <span className={currentLanguage === lang ? 'font-semibold' : ''}>
              {lang}
            </span>
            {currentLanguage === lang && (
              <span className="ml-auto">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
