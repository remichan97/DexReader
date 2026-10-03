import { useCallback, useState } from 'react'
import i18next from '@renderer/i18n/config'
import { writeSettingsSection } from '@renderer/utils/settingsPendingWrites'
import { ContentLanguage } from '@shared/enums/settings/content-language.enum'
import type { AppSettings } from '../../../../../../preload/window.types'

export type DisplayLanguage = 'en-GB' | 'en-US' | 'vi-VN'

export interface UseLanguageSettingsDomainResult {
  displayLanguage: DisplayLanguage
  syncContentLanguage: boolean
  contentLanguages: string[]
  handleDisplayLanguageChange: (language: string) => void
  handleSyncContentLanguageChange: (checked: boolean) => void
  handleContentLanguagesChange: (languages: string[]) => void
  loadFromSettings: (settings: AppSettings) => Promise<void>
}

/**
 * Owns the "Language" settings domain (display language, content-language sync/priority).
 * All three fields share the `language` section, so every handler writes it whole.
 *
 * displayLanguage is restart-required - changing it here only updates i18next's live
 * language (so the reader sees the effect of their change immediately), it does not
 * itself prompt for a restart. That's SettingsView.tsx's restart-required banner, which
 * diffs the current value against the boot-time snapshot for every restart-required
 * field (this one and system.useHardwareAcceleration) in one place.
 */
export function useLanguageSettingsDomain(): UseLanguageSettingsDomainResult {
  const [displayLanguage, setDisplayLanguage] = useState<DisplayLanguage>('en-GB')
  const [syncContentLanguage, setSyncContentLanguage] = useState<boolean>(true)
  const [contentLanguages, setContentLanguages] = useState<string[]>(['en'])

  const handleDisplayLanguageChange = useCallback(
    (language: string): void => {
      const newLanguage = language as DisplayLanguage
      setDisplayLanguage(newLanguage)

      void writeSettingsSection('language', {
        displayLanguage: newLanguage,
        syncContentLanguage,
        ...(contentLanguages.length > 0 && {
          contentLanguage: contentLanguages as ContentLanguage[]
        })
      })
    },
    [syncContentLanguage, contentLanguages]
  )

  const handleSyncContentLanguageChange = useCallback(
    (checked: boolean): void => {
      setSyncContentLanguage(checked)
      void writeSettingsSection('language', {
        displayLanguage,
        syncContentLanguage: checked,
        ...(contentLanguages.length > 0 && {
          contentLanguage: contentLanguages as ContentLanguage[]
        })
      })
    },
    [displayLanguage, contentLanguages]
  )

  const handleContentLanguagesChange = useCallback(
    (languages: string[]): void => {
      setContentLanguages(languages)
      void writeSettingsSection('language', {
        displayLanguage,
        syncContentLanguage,
        ...(languages.length > 0 && { contentLanguage: languages as ContentLanguage[] })
      })
    },
    [displayLanguage, syncContentLanguage]
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

  return {
    displayLanguage,
    syncContentLanguage,
    contentLanguages,
    handleDisplayLanguageChange,
    handleSyncContentLanguageChange,
    handleContentLanguagesChange,
    loadFromSettings
  }
}
