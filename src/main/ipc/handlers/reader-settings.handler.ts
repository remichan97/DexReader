import { ReaderSettings } from '../../filesystem/entity/reading-settings.entity'
import {
  getMangaReaderSettings,
  updateMangaReaderSettings,
  deleteMangaReaderSettings
} from '../../filesystem/settingsManager'
import { wrapIpcHandler } from '../wrapHandler'

export function registerReaderSettingsHandlers(): void {
  wrapIpcHandler('reader:get-manga-settings', async (_, mangaId: unknown) => {
    return await getMangaReaderSettings(mangaId as string)
  })

  wrapIpcHandler(
    'reader:update-manga-settings',
    async (_, mangaId: unknown, newSettings: unknown) => {
      return await updateMangaReaderSettings(mangaId as string, newSettings as ReaderSettings)
    }
  )

  wrapIpcHandler('reader:reset-manga-settings', async (_, mangaId: unknown) => {
    return await deleteMangaReaderSettings(mangaId as string)
  })
}
