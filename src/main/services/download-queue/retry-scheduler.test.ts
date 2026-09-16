import type { Mock } from 'vitest'
import { DownloadStatus } from '@shared/enums/repositories/download-status.enum'
import { ImageQuality } from '@shared/enums/mangadex'
import { ChapterDownloadContract } from '@shared/contracts/database/chapter-downloads/chapter-downloads.contract'
import { QueuedDownloads } from '@shared/types/downloads/queued-downloads.type'
import { MarkDownloadStateCommand } from '@shared/commands/repositories/chapter-downloads/mark-state.command'
import { MangaDexApiError } from '../../api/shared/error.shared'

const { getDownload, emitPermanentFailureNotification } = vi.hoisted(() => ({
  getDownload: vi.fn<() => ChapterDownloadContract | undefined>(),
  emitPermanentFailureNotification: vi.fn()
}))

vi.mock('../../database/repositories/chapter-downloads.repo', () => ({
  chapterDownloadsRepo: { getDownload }
}))

vi.mock('../helpers/download-queue.helper', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../helpers/download-queue.helper')>()
  return { ...actual, emitPermanentFailureNotification }
})

vi.mock('electron', () => ({
  BrowserWindow: { getAllWindows: vi.fn(() => []) }
}))

vi.mock('../logging/main-logging.service', () => ({
  mainLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))

import { DownloadRetryScheduler } from './retry-scheduler'

function download(overrides: Partial<ChapterDownloadContract> = {}): ChapterDownloadContract {
  return {
    chapterId: 'ch-1',
    mangaId: 'manga-1',
    status: DownloadStatus.Downloading,
    storageSize: 0,
    downloadedAt: 0,
    downloadsBasePath: '/downloads',
    filePath: '/downloads/ch-1.cbz',
    totalPages: 10,
    imageQuality: ImageQuality.High,
    imageFormat: '.jpg',
    title: 'Title',
    chapterNumber: '1',
    chapterTitle: 'Chapter 1',
    language: 'en',
    ...overrides
  }
}

describe('DownloadRetryScheduler', () => {
  let isQueuedOrActive: Mock<(chapterId: string) => boolean>
  let requeue: Mock<(item: QueuedDownloads) => void>
  let markPermanentlyFailed: Mock<(command: MarkDownloadStateCommand) => void>
  let scheduler: DownloadRetryScheduler

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    isQueuedOrActive = vi.fn(() => false)
    requeue = vi.fn()
    markPermanentlyFailed = vi.fn()
    getDownload.mockReturnValue(download())
    scheduler = new DownloadRetryScheduler({
      isQueuedOrActive,
      requeue,
      markPermanentlyFailed
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('handleFailure with a non-retryable error', () => {
    it('marks the chapter permanently failed without scheduling a retry', () => {
      const notFoundError = new MangaDexApiError('gone', undefined, undefined, 404)

      scheduler.handleFailure('ch-1', notFoundError)

      expect(markPermanentlyFailed).toHaveBeenCalledWith(
        expect.objectContaining({ chapterId: 'ch-1', isFailed: true })
      )
      expect(emitPermanentFailureNotification).toHaveBeenCalledWith('ch-1', expect.any(String))
      vi.runAllTimers()
      expect(requeue).not.toHaveBeenCalled()
    })
  })

  describe('handleFailure with a retryable error', () => {
    it('schedules a requeue after the backoff delay', () => {
      scheduler.handleFailure('ch-1', new Error('transient failure'))

      expect(requeue).not.toHaveBeenCalled()

      vi.runAllTimers()

      expect(requeue).toHaveBeenCalledWith(
        expect.objectContaining({ chapterId: 'ch-1', mangaId: 'manga-1' })
      )
    })

    it('does not requeue if the chapter is already queued or active by the time the timer fires', () => {
      scheduler.handleFailure('ch-1', new Error('transient failure'))
      isQueuedOrActive.mockReturnValue(true)

      vi.runAllTimers()

      expect(requeue).not.toHaveBeenCalled()
    })

    it('does not schedule a retry when the download can no longer be found in the database', () => {
      getDownload.mockReturnValue(undefined)

      scheduler.handleFailure('ch-1', new Error('transient failure'))
      vi.runAllTimers()

      expect(requeue).not.toHaveBeenCalled()
      expect(markPermanentlyFailed).not.toHaveBeenCalled()
    })

    it('marks the chapter permanently failed after exceeding the max retry attempts', () => {
      scheduler.handleFailure('ch-1', new Error('transient failure')) // attempt 1
      vi.runAllTimers()
      scheduler.handleFailure('ch-1', new Error('transient failure')) // attempt 2
      vi.runAllTimers()
      scheduler.handleFailure('ch-1', new Error('transient failure')) // attempt 3 -> exceeds max (3)

      expect(markPermanentlyFailed).toHaveBeenCalledWith(
        expect.objectContaining({ chapterId: 'ch-1', isFailed: true })
      )
      requeue.mockClear()
      vi.runAllTimers()
      expect(requeue).not.toHaveBeenCalled()
    })
  })

  describe('resetAttempts', () => {
    it('resets the attempt counter, so a later failure starts back at attempt 1', () => {
      scheduler.handleFailure('ch-1', new Error('transient failure'))
      vi.runAllTimers()

      scheduler.resetAttempts('ch-1')

      // If the counter had not reset, a 3rd overall call would hit max-attempts and fail
      // permanently instead of scheduling another retry.
      scheduler.handleFailure('ch-1', new Error('transient failure'))
      vi.runAllTimers()
      scheduler.handleFailure('ch-1', new Error('transient failure'))

      expect(markPermanentlyFailed).not.toHaveBeenCalled()
    })
  })
})
