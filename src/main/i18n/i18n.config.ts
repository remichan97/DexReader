import { is } from '@electron-toolkit/utils'
import i18next from 'i18next'
import I18NexFsBackend from 'i18next-fs-backend'
import path from 'node:path'

i18next.use(I18NexFsBackend).init({
  backend: {
    loadPath: is.dev
      ? path.join(__dirname, '../../locales/{{lng}}/{{ns}}.json')
      : path.join(process.resourcesPath, 'app.asar.unpacked/locales/{{lng}}/{{ns}}.json')
  },
  lng: 'en-GB', // Default language, need to be loaded from Settings later
  fallbackLng: 'en-GB',
  ns: ['common', 'menu', 'dialogs', 'errors', 'validation', 'settings'],
  defaultNS: 'menu'
})

export default i18next
