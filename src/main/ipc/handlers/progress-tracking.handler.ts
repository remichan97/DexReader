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

  wrapIpcHandler('progress:get-chapter-progress', async (_, params: unknown) => {
    const { mangaId, chapterId } = params as { mangaId: string; chapterId: string }
    return progressRepo.getChapterProgress(mangaId, chapterId)
  })

  wrapIpcHandler('progress:get-all-chapter-progress', async (_, mangaId: unknown) => {
    return progressRepo.getAllChapterProgress(mangaId as string)
  })

  wrapIpcHandler('progress:save-chapters', async (_, chapters: unknown) => {
    return progressRepo.saveChapters(
      chapters as Array<{
        chapterId: string
        mangaId: string
        title?: string
        chapterNumber?: string
        volume?: string
        language: string
        publishAt: Date
        scanlationGroup?: string
        externalUrl?: string
      }>
    )
  })
}
