import { readerSettingsRepo } from '../../database/repositories/reader-settings.repo'
import { MangaReadingSettings } from '@shared/contracts/settings/reading-settings.contract'
import { settingsManager } from '../../settings/settings-manager'
import { isMangaOverrideSettings } from '../../settings/validators/settings.validator'
import { wrapIpcHandler } from '../wrap-handler'

export function registerReaderSettingsHandlers(): void {
  /**
   * Get reader settings for a specific manga or global defaults.
   *
   * Returns per-manga reading preferences if overrides exist, otherwise returns
   * global reader settings. Per-manga settings allow customizing reading mode,
   * fit mode, and zoom level for individual titles.
   *
   * @param mangaId - MangaDex manga UUID, or empty string for global settings
   * @returns Promise<MangaReadingSettings> - Reader settings object containing readingMode, fitMode, zoom
   *
   * @example
   * // Get settings for specific manga
   * const settings = await window.api.getMangaReaderSettings('abc123-def456...')
   * console.log(settings.readingMode) // 'single' | 'double' | 'vertical'
   *
   * @example
   * // Get global default settings
   * const globalSettings = await window.api.getMangaReaderSettings('')
   */
  wrapIpcHandler('reader:get-manga-settings', async (_, mangaId: unknown) => {
    return settingsManager.getMangaReaderSettings(mangaId as string)
  })

  /**
   * Update reader settings for a specific manga (create per-manga override).
   *
   * Saves custom reading preferences for a manga. If the new settings match global
   * defaults, the override is automatically cleared to reduce database clutter.
   *
   * @param mangaId - MangaDex manga UUID
   * @param newSettings - MangaReadingSettings object with readingMode, fitMode, zoom
   * @returns Promise<void>
   * @throws {Error} - If settings object is invalid
   *
   * @example
   * // Set manga to use vertical scroll mode
   * await window.api.updateMangaReaderSettings('abc123-def456...', {
   *   readingMode: 'vertical',
   *   fitMode: 'width',
   *   zoom: 100
   * })
   */
  wrapIpcHandler(
    'reader:update-manga-settings',
    async (_, mangaId: unknown, newSettings: unknown) => {
      const globalSettings = settingsManager.getMangaReaderSettings('') // Get global settings

      // If new settings match global, reset the override for the manga instead
      if (newSettings && JSON.stringify(newSettings) === JSON.stringify(globalSettings)) {
        return readerSettingsRepo.clearMangaOverride(mangaId as string)
      }

      const newOverrideSettings = {
        settings: newSettings as MangaReadingSettings
      }

      if (!isMangaOverrideSettings(newOverrideSettings)) {
        throw new Error('Invalid manga override settings provided')
      }

      const overrideCommand = {
        mangaId: mangaId as string,
        overrideData: newOverrideSettings.settings
      }

      return readerSettingsRepo.updateMangaOverride(overrideCommand)
    }
  )

  /**
   * Reset reader settings for a specific manga to global defaults.
   *
   * Removes per-manga reading preferences override, causing the manga to use
   * global default settings. Useful for cleaning up custom settings.
   *
   * @param mangaId - MangaDex manga UUID
   * @returns Promise<void>
   *
   * @example
   * // Remove custom settings for manga
   * await window.api.resetMangaReaderSettings('abc123-def456...')
   */
  wrapIpcHandler('reader:reset-manga-settings', async (_, mangaId: unknown) => {
    return readerSettingsRepo.clearMangaOverride(mangaId as string)
  })

  /**
   * Clear all per-manga reader settings overrides.
   *
   * Removes all manga-specific reading preferences, causing all manga to use
   * global default settings. Useful for resetting reader customizations.
   *
   * @returns Promise<void>
   *
   * @example
   * // Reset all manga to use global settings
   * await window.api.clearAllReaderOverrides()
   */
  wrapIpcHandler('reader:clear-all-overrides', async () => {
    return readerSettingsRepo.clearAllOverrides()
  })

  /**
   * Get all manga that have custom reader settings overrides.
   *
   * Returns a list of manga IDs and their titles that have per-manga reading
   * preferences set. Useful for settings UI to show which manga have custom settings.
   *
   * @returns Promise<Array<{mangaId: string, title: string, settings: MangaReadingSettings}>> - List of manga with custom reader settings
   *
   * @example
   * // Get all manga with custom settings
   * const overrides = await window.api.getAllMangaReaderOverrides()
   * console.log(`${overrides.length} manga have custom settings`)
   */
  wrapIpcHandler('reader:get-all-manga-overrides', async () => {
    return readerSettingsRepo.getAllOverridesWithMetadata()
  })
}
