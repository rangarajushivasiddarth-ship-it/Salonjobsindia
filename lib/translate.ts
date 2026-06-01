/**
 * Standalone translation function that can be used outside of React components
 * This ensures translation keys are applied consistently everywhere
 */
import { translations } from './translations'

export type LanguageCode = 'en' | 'hi' | 'te'

let currentLanguage: LanguageCode = 'en'

export function setCurrentLanguage(lang: LanguageCode) {
  currentLanguage = lang
}

export function getCurrentLanguage(): LanguageCode {
  return currentLanguage
}

export function translate(key: string, lang?: LanguageCode): string {
  const language = lang || currentLanguage
  const dict = translations[language] as Record<string, string>
  return dict?.[key] || translations['en'][key as keyof typeof translations['en']] || key
}

export const t = translate
