import { SaveProgressCommand } from '../../database/commands/save-progress.command'
import { MangaProgressRepository } from '../../database/repository/manga-progress.repo'
import { wrapIpcHandler } from '../wrapHandler'

const progressRepo = new MangaProgressRepository()

export function registerProgressTrackingHandlers(): void {
  wrapIpcHandler('progress:get-progress', async (_, id: unknown) => {
    return progressRepo.getProgressByMangaId(id as string)
  })

  wrapIpcHandler('progress:save-progress', async (_, progressData: unknown) => {
    return progressRepo.saveProgress(progressData as SaveProgressCommand[])
  })

  wrapIpcHandler('progress:delete-progress', async (_, id: unknown) => {
    return progressRepo.deleteProgress(id as string)
  })

  wrapIpcHandler('progress:get-statistics', async () => {
    return progressRepo.getStats()
  })

  wrapIpcHandler('progress:get-all-progress', async () => {
    return progressRepo.getAllProgressWithMetadata()
  })
}
