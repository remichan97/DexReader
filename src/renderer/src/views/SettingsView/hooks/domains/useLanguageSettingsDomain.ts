import { useCallback, useState } from 'react'
import i18next from '@renderer/i18n/config'
import { useTranslation } from '@renderer/hooks/useTranslation'
import { ContentLanguage } from '@shared/enums/settings/content-language.enum'
import type { AppSettings } from '../../../../../../preload/window.types'
import type { SettingsDomain } from './settingsDomain.types'

export type DisplayLanguage = 'en-GB' | 'en-US' | 'vi-VN'

export interface LanguagePayload {
  language: {
    displayLanguage: DisplayLanguage
    syncContentLanguage: boolean
    contentLanguage?: ContentLanguage[]
  }
}

type TFunction = ReturnType<typeof useTranslation>['t']

interface UseLanguageSettingsDomainParams {
  markSettingModified: (key: string) => void
  t: TFunction
}

export interface UseLanguageSettingsDomainResult extends SettingsDomain<LanguagePayload> {
  displayLanguage: DisplayLanguage
  syncContentLanguage: boolean
  contentLanguages: string[]
  handleDisplayLanguageChange: (language: string) => void
  handleSyncContentLanguageChange: (checked: boolean) => void
  handleContentLanguagesChange: (languages: string[]) => void
  loadFromSettings: (settings: AppSettings) => Promise<void>
  maybePromptRestart: (original: AppSettings) => Promise<void>
}

const LANGUAGE_NAMES: Record<DisplayLanguage, string> = {
  'en-GB': 'English (UK)',
  'en-US': 'English (US)',
  'vi-VN': 'Tiếng Việt'
}

/**
 * Owns the "Language" settings domain (display language, content-language sync/priority).
 * Also owns the restart-prompt workflow that fires after a successful save when the
 * display language changed, since that's language-specific orchestration.
 */
export function useLanguageSettingsDomain(
  params: UseLanguageSettingsDomainParams
): UseLanguageSettingsDomainResult {
  const { markSettingModified, t } = params

  const [displayLanguage, setDisplayLanguage] = useState<DisplayLanguage>('en-GB')
  const [syncContentLanguage, setSyncContentLanguage] = useState<boolean>(true)
  const [contentLanguages, setContentLanguages] = useState<string[]>(['en'])

  const handleDisplayLanguageChange = useCallback(
    (language: string): void => {
      setDisplayLanguage(language as DisplayLanguage)
      markSettingModified('displayLanguage')
    },
    [markSettingModified]
  )

  const handleSyncContentLanguageChange = useCallback(
    (checked: boolean): void => {
      setSyncContentLanguage(checked)
      markSettingModified('syncContentLanguage')
    },
    [markSettingModified]
  )

  const handleContentLanguagesChange = useCallback(
    (languages: string[]): void => {
      setContentLanguages(languages)
      markSettingModified('contentLanguages')
    },
    [markSettingModified]
  )

  const loadFromSettings = useCallback(async (settings: AppSettings): Promise<void> => {
    if (settings.language?.displayLanguage) {
      setDisplayLanguage(settings.language.displayLanguage)
      await i18next.changeLanguage(settings.language.displayLanguage)
    }
    if (settings.language?.syncContentLanguage !== undefined) {
      setSyncContentLanguage(settings.language.syncContentLanguage)
    }
    if (settings.language?.contentLanguage) {
      setContentLanguages(settings.language.contentLanguage)
    }
  }, [])

  const isDirty = useCallback(
    (original: AppSettings): boolean =>
      displayLanguage !== (original.language?.displayLanguage ?? 'en-GB') ||
      syncContentLanguage !== (original.language?.syncContentLanguage ?? true) ||
      JSON.stringify(contentLanguages) !==
        JSON.stringify(original.language?.contentLanguage || ['en']),
    [displayLanguage, syncContentLanguage, contentLanguages]
  )

  const buildPayload = useCallback(
    (): LanguagePayload => ({
      language: {
        displayLanguage,
        syncContentLanguage,
        ...(contentLanguages.length > 0 && {
          contentLanguage: contentLanguages as ContentLanguage[]
        })
      }
    }),
    [displayLanguage, syncContentLanguage, contentLanguages]
  )

  const reset = useCallback((original: AppSettings): void => {
    if (original.language?.displayLanguage) {
      setDisplayLanguage(original.language.displayLanguage)
    }
    setSyncContentLanguage(original.language?.syncContentLanguage ?? true)
    setContentLanguages(original.language?.contentLanguage || ['en'])
  }, [])

  const maybePromptRestart = useCallback(
    async (original: AppSettings): Promise<void> => {
      const changed = displayLanguage !== (original.language?.displayLanguage ?? 'en-GB')
      if (!changed) return

      const languageName = LANGUAGE_NAMES[displayLanguage]

      const result = await globalThis.api.showConfirmDialog(
        t('dialogs:changeLanguage.title'),
        t('dialogs:changeLanguage.message', { language: languageName }),
        t('dialogs:changeLanguage.buttons.restart', { defaultValue: 'Yes, Restart Now' }),
        t('dialogs:changeLanguage.buttons.later', { defaultValue: 'Maybe Later' })
      )

      if (result.success && result.data) {
        await globalThis.settings.restart()
      }
    },
    [displayLanguage, t]
  )

  return {
    displayLanguage,
    syncContentLanguage,
    contentLanguages,
    handleDisplayLanguageChange,
    handleSyncContentLanguageChange,
    handleContentLanguagesChange,
    loadFromSettings,
    maybePromptRestart,
    isDirty,
    buildPayload,
    reset
  }
}
