import { readerSettingsRepo } from '../../database/repository/reader-settings.repo'
import { MangaReadingSettings } from '../../settings/entity/reading-settings.entity'
import { getMangaReaderSettings } from '../../settings/settingsManager'
import { isMangaOverrideSettings } from '../../settings/validators/types.validator'
import { wrapIpcHandler } from '../wrapHandler'

export function registerReaderSettingsHandlers(): void {
  wrapIpcHandler('reader:get-manga-settings', async (_, mangaId: unknown) => {
    return await getMangaReaderSettings(mangaId as string)
  })

  wrapIpcHandler(
    'reader:update-manga-settings',
    async (_, mangaId: unknown, newSettings: unknown) => {
      const globalSettings = await getMangaReaderSettings('') // Get global settings

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

  wrapIpcHandler('reader:reset-manga-settings', async (_, mangaId: unknown) => {
    return readerSettingsRepo.clearMangaOverride(mangaId as string)
  })

  wrapIpcHandler('reader:clear-all-overrides', async () => {
    return readerSettingsRepo.clearAllOverrides()
  })

  wrapIpcHandler('reader:get-all-manga-overrides', async () => {
    return readerSettingsRepo.getAllOverridesWithMetadata()
  })
}
