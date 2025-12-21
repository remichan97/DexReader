import { MangaProgress } from '../../progress/entity/manga-progress.entity'
import { ProgressManager } from '../../progress/progressManager'
import { wrapIpcHandler } from '../wrapHandler'

const progressManager = new ProgressManager()

export function registerProgressTrackingHandlers(): void {
  wrapIpcHandler('progress:get-progress', async (_, id: unknown) => {
    return await progressManager.getProgress(id as string)
  })

  wrapIpcHandler('progress:save-progress', async (_, progressData: unknown) => {
    return await progressManager.saveProgress(progressData as MangaProgress[])
  })

  wrapIpcHandler('progress:delete-progress', async (_, id: unknown) => {
    return await progressManager.deleteProgress(id as string)
  })

  wrapIpcHandler('progress:get-statistics', async () => {
    return await progressManager.getStatistics()
  })

  wrapIpcHandler('progress:get-all-progress', async () => {
    return await progressManager.getAllProgress()
  })

  wrapIpcHandler('progress:load-progress', async () => {
    return await progressManager.loadProgress()
  })
}
