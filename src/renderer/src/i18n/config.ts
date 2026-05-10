import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import enUS from '../../../locales/en-US'
import enGB from '../../../locales/en-GB'
import viVN from '../../../locales/vi-VN'

// Localisation resourses
// Add new languages here and create corresponding JSON files in the locales directory when adding support for new languages
i18next.use(initReactI18next).init({
  resources: {
    'en-US': enUS,
    'en-GB': enGB,
    'vi-VN': viVN
  },
  lng: 'en-GB', // Default language, need to be overriden by user settings
  fallbackLng: 'en-GB', // Fallback language if translation is missing
  interpolation: {
    escapeValue: false // React already does escaping
  }
})

export default i18next
