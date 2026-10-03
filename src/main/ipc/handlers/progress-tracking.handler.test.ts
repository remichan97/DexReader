import { ipcMain, IpcMainInvokeEvent } from 'electron'
import { chapterRepo } from '../../database/repositories/chapter.repo'
import { progressRepo } from '../../database/repositories/manga-progress.repo'
import { readingRepo } from '../../database/repositories/reading-stats.repo'
import { registerProgressTrackingHandlers } from './progress-tracking.handler'

vi.mock('electron', () => ({
  ipcMain: { handle: vi.fn() }
}))

vi.mock('../../services/logging/main-logging.service', () => ({
  mainLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))

vi.mock('../../database/repositories/chapter.repo', () => ({
  chapterRepo: { saveChapters: vi.fn() }
}))

vi.mock('../../database/repositories/manga-progress.repo', () => ({
  progressRepo: {
    getProgressByMangaId: vi.fn(),
    saveProgress: vi.fn(),
    deleteProgress: vi.fn(),
    getAllProgressWithMetadata: vi.fn(),
    getAllChapterProgress: vi.fn()
  }
}))

vi.mock('../../database/repositories/reading-stats.repo', () => ({
  readingRepo: { getStats: vi.fn() }
}))

type RegisteredHandler = (
  event: IpcMainInvokeEvent,
  ...args: unknown[]
) => Promise<{ success: boolean; data?: unknown; error?: unknown }>

function getRegisteredHandler(channel: string): RegisteredHandler {
  const call = vi
    .mocked(ipcMain.handle)
    .mock.calls.find(([registeredChannel]) => registeredChannel === channel)
  if (!call) {
    throw new Error(`No handler registered for channel "${channel}"`)
  }
  return call[1] as RegisteredHandler
}

const EVENT = {} as IpcMainInvokeEvent

describe('progress-tracking.handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    registerProgressTrackingHandlers()
  })

  describe('progress:get-progress', () => {
    it('forwards a valid mangaId to progressRepo.getProgressByMangaId', async () => {
      vi.mocked(progressRepo.getProgressByMangaId).mockReturnValue({
        mangaId: 'manga-1'
      } as never)

      await expect(
        getRegisteredHandler('progress:get-progress')(EVENT, 'manga-1')
      ).resolves.toEqual({ success: true, data: { mangaId: 'manga-1' } })
      expect(progressRepo.getProgressByMangaId).toHaveBeenCalledWith('manga-1')
    })

    it('rejects a non-string mangaId', async () => {
      const response = await getRegisteredHandler('progress:get-progress')(EVENT, 42)

      expect(response.success).toBe(false)
      expect(progressRepo.getProgressByMangaId).not.toHaveBeenCalled()
    })
  })

  describe('progress:save-progress', () => {
    it('forwards a valid array of commands to progressRepo.saveProgress', async () => {
      const commands = [
        { mangaId: 'manga-1', chapterId: 'chapter-1', currentPage: 3, completed: false }
      ]

      await getRegisteredHandler('progress:save-progress')(EVENT, commands)

      expect(progressRepo.saveProgress).toHaveBeenCalledWith(commands)
    })

    it('rejects a non-array value', async () => {
      const response = await getRegisteredHandler('progress:save-progress')(EVENT, {
        mangaId: 'manga-1'
      })

      expect(response.success).toBe(false)
      expect(progressRepo.saveProgress).not.toHaveBeenCalled()
    })

    it('rejects an array containing an invalid entry', async () => {
      const response = await getRegisteredHandler('progress:save-progress')(EVENT, [
        { mangaId: 'manga-1', chapterId: 'chapter-1', currentPage: 3, completed: false },
        { mangaId: 'manga-2' }
      ])

      expect(response.success).toBe(false)
      expect(progressRepo.saveProgress).not.toHaveBeenCalled()
    })
  })

  describe('progress:delete-progress', () => {
    it('forwards a valid mangaId to progressRepo.deleteProgress', async () => {
      await getRegisteredHandler('progress:delete-progress')(EVENT, 'manga-1')

      expect(progressRepo.deleteProgress).toHaveBeenCalledWith('manga-1')
    })

    it('rejects a non-string mangaId', async () => {
      const response = await getRegisteredHandler('progress:delete-progress')(EVENT, 42)

      expect(response.success).toBe(false)
      expect(progressRepo.deleteProgress).not.toHaveBeenCalled()
    })
  })

  describe('progress:get-statistics', () => {
    it('returns readingRepo.getStats() unchanged', async () => {
      vi.mocked(readingRepo.getStats).mockReturnValue({ totalMangaRead: 5 } as never)

      await expect(getRegisteredHandler('progress:get-statistics')(EVENT)).resolves.toEqual({
        success: true,
        data: { totalMangaRead: 5 }
      })
    })
  })

  describe('progress:get-all-progress', () => {
    it('returns progressRepo.getAllProgressWithMetadata() unchanged', async () => {
      vi.mocked(progressRepo.getAllProgressWithMetadata).mockReturnValue([
        { mangaId: 'manga-1' }
      ] as never)

      await expect(getRegisteredHandler('progress:get-all-progress')(EVENT)).resolves.toEqual({
        success: true,
        data: [{ mangaId: 'manga-1' }]
      })
    })
  })

  describe('progress:get-all-chapter-progress', () => {
    it('forwards a valid mangaId to progressRepo.getAllChapterProgress', async () => {
      vi.mocked(progressRepo.getAllChapterProgress).mockReturnValue([
        { chapterId: 'chapter-1' }
      ] as never)

      await expect(
        getRegisteredHandler('progress:get-all-chapter-progress')(EVENT, 'manga-1')
      ).resolves.toEqual({ success: true, data: [{ chapterId: 'chapter-1' }] })
      expect(progressRepo.getAllChapterProgress).toHaveBeenCalledWith('manga-1')
    })

    it('rejects a non-string mangaId', async () => {
      const response = await getRegisteredHandler('progress:get-all-chapter-progress')(EVENT, 42)

      expect(response.success).toBe(false)
      expect(progressRepo.getAllChapterProgress).not.toHaveBeenCalled()
    })
  })

  describe('progress:save-chapters', () => {
    it('forwards a valid array of chapters to chapterRepo.saveChapters', async () => {
      const chapters = [
        {
          chapterId: 'chapter-1',
          mangaId: 'manga-1',
          language: 'en',
          publishAt: new Date('2026-01-01')
        }
      ]

      await getRegisteredHandler('progress:save-chapters')(EVENT, chapters)

      expect(chapterRepo.saveChapters).toHaveBeenCalledWith(chapters)
    })

    it('rejects a non-array value', async () => {
      const response = await getRegisteredHandler('progress:save-chapters')(EVENT, {
        chapterId: 'chapter-1'
      })

      expect(response.success).toBe(false)
      expect(chapterRepo.saveChapters).not.toHaveBeenCalled()
    })

    it('rejects an array containing an invalid entry', async () => {
      const response = await getRegisteredHandler('progress:save-chapters')(EVENT, [
        { chapterId: 'chapter-1', mangaId: 'manga-1', language: 'en', publishAt: new Date() },
        { chapterId: 'chapter-2' }
      ])

      expect(response.success).toBe(false)
      expect(chapterRepo.saveChapters).not.toHaveBeenCalled()
    })
  })
})
