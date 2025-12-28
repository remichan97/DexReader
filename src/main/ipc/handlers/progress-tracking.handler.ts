import { MangaProgress } from '../../database/queries/manga-progress.query'
import { MangaProgressRepository } from '../../database/repository/manga-progress.repo'
import { wrapIpcHandler } from '../wrapHandler'

const progressRepo = new MangaProgressRepository()

export function registerProgressTrackingHandlers(): void {
  wrapIpcHandler('progress:get-progress', async (_, id: unknown) => {
    return await progressRepo.getProgressByMangaId(id as string)
  })

  wrapIpcHandler('progress:save-progress', async (_, progressData: unknown) => {
    return await progressRepo.saveProgress(progressData as MangaProgress[])
  })

  wrapIpcHandler('progress:delete-progress', async (_, id: unknown) => {
    return await progressRepo.deleteProgress(id as string)
  })

  wrapIpcHandler('progress:get-statistics', async () => {
    return await progressRepo.getStats()
  })

  wrapIpcHandler('progress:get-all-progress', async () => {
    return await progressRepo.getAllProgressWithMetadata()
  })

  wrapIpcHandler('progress:load-progress', async () => {
    // TODO: Phase 3 - This was for loading from JSON, no longer needed with database
    throw new Error('Not implemented - database loads automatically')
  })
}
