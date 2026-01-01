import { SaveProgressCommand } from '../../database/commands/progress/save-progress.command'
import { progressRepo } from '../../database/repository/manga-progress.repo'
import { readingRepo } from '../../database/repository/reading-stats.repo'
import { wrapIpcHandler } from '../wrapHandler'

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
    return readingRepo.getStats()
  })

  wrapIpcHandler('progress:get-all-progress', async () => {
    return progressRepo.getAllProgressWithMetadata()
  })
}
