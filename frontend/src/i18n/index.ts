import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Import translation resources
import enCommon from '../locales/en/common.json'
import ruCommon from '../locales/ru/common.json'

const resources = {
  en: {
    common: enCommon,
  },
  ru: {
    common: ruCommon,
  },
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common'],
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false, // React already does escaping
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
    
    // Russian pluralization rules
    pluralSeparator: '_',
    contextSeparator: '_',
  })

export default i18n
