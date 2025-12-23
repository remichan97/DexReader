import { MangaReadingSettings } from '../../settings/entity/reading-settings.entity'
import {
  getMangaReaderSettings,
  updateMangaReaderSettings,
  deleteMangaReaderSettings
} from '../../settings/settingsManager'
import { isMangaOverrideSettings } from '../../settings/validators/types.validator'
import { wrapIpcHandler } from '../wrapHandler'

export function registerReaderSettingsHandlers(): void {
  wrapIpcHandler('reader:get-manga-settings', async (_, mangaId: unknown) => {
    return await getMangaReaderSettings(mangaId as string)
  })

  wrapIpcHandler(
    'reader:update-manga-settings',
    async (_, mangaId: unknown, newSettings: unknown, title: unknown, coverUrl?: unknown) => {
      const globalSettings = await getMangaReaderSettings('') // Get global settings

      // If new settings match global, do nothing
      if (newSettings && JSON.stringify(newSettings) === JSON.stringify(globalSettings)) {
        return
      }

      const newOverrideSettings = {
        title: title as string,
        coverUrl: coverUrl as string | undefined,
        settings: newSettings as MangaReadingSettings
      }

      if (!isMangaOverrideSettings(newOverrideSettings)) {
        throw new Error('Invalid manga override settings provided')
      }

      return await updateMangaReaderSettings(
        mangaId as string,
        newSettings as MangaReadingSettings,
        title as string,
        coverUrl as string | undefined
      )
    }
  )

  wrapIpcHandler('reader:reset-manga-settings', async (_, mangaId: unknown) => {
    return await deleteMangaReaderSettings(mangaId as string)
  })
}
