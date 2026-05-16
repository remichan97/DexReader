import i18next from 'i18next'
import enUS from '../../locales/en-US'
import enGB from '../../locales/en-GB'
import viVN from '../../locales/vi-VN'

i18next.init({
  resources: {
    'en-US': enUS,
    'en-GB': enGB,
    'vi-VN': viVN
  },
  lng: 'en-GB', // Default language, need to be loaded from Settings later
  fallbackLng: 'en-GB',
  ns: [
    'common',
    'menu',
    'dialogs',
    'errors',
    'validation',
    'settings',
    'shortcuts',
    'browse',
    'library',
    'downloads',
    'reader',
    'history',
    'mangaDetail'
  ],
  defaultNS: 'menu'
})

export default i18next
