import { useEffect } from 'react'
import i18next from '@renderer/i18n/config'
import { rendererLog } from '@renderer/services/logging.service'

/**
 * Loads the display language preference from settings and applies it to
 * i18next on startup. Falls back to the default (en-GB) already set in the
 * i18n config on failure.
 */
export function useStartupLanguage(): void {
  useEffect(() => {
    async function loadLanguagePreference(): Promise<void> {
      try {
        const settings = await globalThis.settings.load()
        if (settings.success && settings.data?.language?.displayLanguage) {
          const userLanguage = settings.data.language.displayLanguage
          await i18next.changeLanguage(userLanguage)
          rendererLog.info(`[useStartupLanguage] Display language set to: ${userLanguage}`)
        }
      } catch (error) {
        rendererLog.error('[useStartupLanguage] Failed to load display language setting:', error)
        // Fall back to default (en-GB) already set in i18n config
      }
    }
    void loadLanguagePreference()
  }, [])
}
