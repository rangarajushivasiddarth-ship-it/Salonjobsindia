import { useLanguage } from './language-context'
import { translations, type TranslationKey } from './translations'

export function useTranslation() {
  const { currentLanguage } = useLanguage()

  const t = (key: TranslationKey): string => {
    return translations[currentLanguage][key] || translations.en[key] || key
  }

  return { t, language: currentLanguage }
}
