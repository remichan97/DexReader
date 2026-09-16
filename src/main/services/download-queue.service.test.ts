import { DownloadStatus } from '@shared/enums/repositories/download-status.enum'
import { ImageQuality } from '@shared/enums/mangadex'
import { QueuedDownloads } from '@shared/types/downloads/queued-downloads.type'
import { ChapterDownloadContract } from '@shared/contracts/database/chapter-downloads/chapter-downloads.contract'
import { DownloadChapterContract } from '@shared/contracts/services/dexreader/download-chapter.contract'

const {
  getDownload,
  getAllDownloads,
  countDownloadsByStatus,
  batchMarkDownloadsState,
  markDownloadState,
  downloadChapter,
  getByPath
} = vi.hoisted(() => ({
  getDownload: vi.fn<() => ChapterDownloadContract | undefined>(),
  getAllDownloads: vi.fn<() => ChapterDownloadContract[]>(() => []),
  countDownloadsByStatus: vi.fn<(status: DownloadStatus) => number>(() => 0),
  batchMarkDownloadsState: vi.fn(),
  markDownloadState: vi.fn(),
  downloadChapter: vi.fn<() => Promise<DownloadChapterContract>>(),
  getByPath: vi.fn(() => 1)
}))

vi.mock('../database/repositories/chapter-downloads.repo', () => ({
  chapterDownloadsRepo: {
    getDownload,
    getAllDownloads,
    countDownloadsByStatus,
    batchMarkDownloadsState,
    markDownloadState
  }
}))

vi.mock('./download.service', () => ({
  downloadService: { downloadChapter }
}))

vi.mock('../settings/settings-manager', () => ({
  settingsManager: { getByPath }
}))

vi.mock('electron', () => ({
  BrowserWindow: { getAllWindows: vi.fn(() => []) }
}))

vi.mock('./logging/main-logging.service', () => ({
  mainLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))

function queuedItem(chapterId: string, overrides: Partial<QueuedDownloads> = {}): QueuedDownloads {
  return {
    chapterId,
    mangaId: 'manga-1',
    language: 'en',
    quality: ImageQuality.High,
    addedAt: new Date(),
    ...overrides
  }
}

function downloadRow(overrides: Partial<ChapterDownloadContract> = {}): ChapterDownloadContract {
  return {
    chapterId: 'ch-1',
    mangaId: 'manga-1',
    status: DownloadStatus.Queued,
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

function downloadResult(overrides: Partial<DownloadChapterContract> = {}): DownloadChapterContract {
  return {
    chapterId: 'ch-1',
    success: true,
    totalPages: 10,
    storageSize: 100,
    filePath: '/downloads/ch-1.cbz',
    ...overrides
  }
}

describe('DownloadQueueService', () => {
  let downloadQueueService: typeof import('./download-queue.service').downloadQueueService

  beforeEach(async () => {
    vi.clearAllMocks()
    getDownload.mockReturnValue(undefined)
    getAllDownloads.mockReturnValue([])
    countDownloadsByStatus.mockReturnValue(0)
    getByPath.mockReturnValue(1)
    downloadChapter.mockReturnValue(new Promise(() => {})) // never resolves unless a test overrides it

    // The service is an exported singleton owning its own queue/active-downloads state,
    // so each test needs a fresh module instance to avoid state leaking between tests.
    vi.resetModules()
    ;({ downloadQueueService } = await import('./download-queue.service'))
  })

  describe('addToQueue', () => {
    it('does not add the same chapter twice', () => {
      getByPath.mockReturnValue(0) // no available slots, so items just accumulate in the queue
      const item = queuedItem('ch-1')

      downloadQueueService.addToQueue(item)
      downloadQueueService.addToQueue(item)

      expect(downloadQueueService.getQueuedItems()).toHaveLength(1)
    })

    it('does not queue a chapter that is already downloaded', () => {
      getByPath.mockReturnValue(0)
      getDownload.mockReturnValue(downloadRow({ status: DownloadStatus.Completed }))

      downloadQueueService.addToQueue(queuedItem('ch-1'))

      expect(downloadQueueService.getQueuedItems()).toHaveLength(0)
    })
  })

  describe('concurrency', () => {
    it('only starts as many downloads as the configured concurrency limit allows', async () => {
      getByPath.mockReturnValue(1)
      const resolvers: Array<(value: DownloadChapterContract) => void> = []
      downloadChapter.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvers.push(resolve)
          })
      )

      downloadQueueService.addBatchToQueue([queuedItem('ch-1'), queuedItem('ch-2')])
      await vi.waitFor(() => expect(downloadChapter).toHaveBeenCalledTimes(1))

      expect(downloadQueueService.getQueueStats().activeCounts).toBe(1)
      expect(downloadQueueService.getQueuedItems().map((i) => i.chapterId)).toEqual(['ch-2'])

      resolvers[0](downloadResult({ chapterId: 'ch-1' }))
      await vi.waitFor(() => expect(downloadChapter).toHaveBeenCalledTimes(2))

      expect(downloadQueueService.getQueuedItems()).toHaveLength(0)
    })
  })

  describe('clearQueue / cancelAllQueued / removeFromQueue', () => {
    it('clearQueue empties the queue but leaves an active download running', async () => {
      getByPath.mockReturnValue(1)
      downloadChapter.mockReturnValue(new Promise(() => {}))
      downloadQueueService.addBatchToQueue([queuedItem('ch-1'), queuedItem('ch-2')])
      await vi.waitFor(() => expect(downloadChapter).toHaveBeenCalledTimes(1))

      downloadQueueService.clearQueue()

      expect(downloadQueueService.getQueuedItems()).toHaveLength(0)
      expect(downloadQueueService.getQueueStats().activeCounts).toBe(1)
    })

    it('cancelAllQueued clears the queue and returns how many were cancelled', () => {
      getByPath.mockReturnValue(0)
      downloadQueueService.addBatchToQueue([queuedItem('ch-1'), queuedItem('ch-2')])

      const cancelled = downloadQueueService.cancelAllQueued()

      expect(cancelled).toBe(2)
      expect(downloadQueueService.getQueuedItems()).toEqual([])
    })

    it('removeFromQueue removes only the matching chapter and reports whether it was found', () => {
      getByPath.mockReturnValue(0)
      downloadQueueService.addToQueue(queuedItem('ch-1'))

      expect(downloadQueueService.removeFromQueue('ch-1')).toBe(true)
      expect(downloadQueueService.removeFromQueue('ch-1')).toBe(false)
    })
  })

  describe('retryDownload', () => {
    it('re-queues a failed download', () => {
      getByPath.mockReturnValue(0)
      getDownload.mockReturnValue(downloadRow({ chapterId: 'ch-1', status: DownloadStatus.Failed }))

      downloadQueueService.retryDownload('ch-1')

      expect(downloadQueueService.getQueuedItems().map((i) => i.chapterId)).toEqual(['ch-1'])
    })

    it('does nothing for a download that is not in a failed state', () => {
      getByPath.mockReturnValue(0)
      getDownload.mockReturnValue(
        downloadRow({ chapterId: 'ch-1', status: DownloadStatus.Downloading })
      )

      downloadQueueService.retryDownload('ch-1')

      expect(downloadQueueService.getQueuedItems()).toEqual([])
    })

    it('does nothing for a chapter with no download record at all', () => {
      getByPath.mockReturnValue(0)
      getDownload.mockReturnValue(undefined)

      downloadQueueService.retryDownload('missing')

      expect(downloadQueueService.getQueuedItems()).toEqual([])
    })
  })

  describe('getQueueStats', () => {
    it('combines the in-memory queue/active counts with completed/failed counts from the database', () => {
      getByPath.mockReturnValue(0)
      countDownloadsByStatus.mockImplementation((status: DownloadStatus) => {
        if (status === DownloadStatus.Completed) return 5
        if (status === DownloadStatus.Failed) return 2
        return 0
      })
      downloadQueueService.addToQueue(queuedItem('ch-1'))

      expect(downloadQueueService.getQueueStats()).toEqual({
        items: [queuedItem('ch-1')],
        totalItems: 1,
        activeCounts: 0,
        completedCounts: 5,
        failedCounts: 2
      })
    })
  })

  describe('resumeIncompleteDownloads', () => {
    it('re-queues only downloading/queued chapters, ignoring completed and failed ones', () => {
      getByPath.mockReturnValue(0)
      getAllDownloads.mockReturnValue([
        downloadRow({ chapterId: 'downloading', status: DownloadStatus.Downloading }),
        downloadRow({ chapterId: 'queued', status: DownloadStatus.Queued }),
        downloadRow({ chapterId: 'completed', status: DownloadStatus.Completed }),
        downloadRow({ chapterId: 'failed', status: DownloadStatus.Failed })
      ])

      downloadQueueService.resumeIncompleteDownloads()

      expect(
        downloadQueueService
          .getQueuedItems()
          .map((i) => i.chapterId)
          .sort()
      ).toEqual(['downloading', 'queued'])
    })

    it('does nothing when there is nothing incomplete to resume', () => {
      getByPath.mockReturnValue(0)
      getAllDownloads.mockReturnValue([downloadRow({ status: DownloadStatus.Completed })])

      downloadQueueService.resumeIncompleteDownloads()

      expect(downloadQueueService.getQueuedItems()).toEqual([])
    })
  })

  describe('failure -> retry integration', () => {
    it('requeues and retries a chapter after a retryable download failure', async () => {
      getByPath.mockReturnValue(1)
      getDownload.mockReturnValue(
        downloadRow({ chapterId: 'ch-1', status: DownloadStatus.Downloading })
      )
      downloadChapter.mockRejectedValueOnce(new Error('transient failure'))
      downloadChapter.mockResolvedValue(downloadResult({ chapterId: 'ch-1' }))

      vi.useFakeTimers()
      try {
        downloadQueueService.addToQueue(queuedItem('ch-1'))
        await vi.advanceTimersByTimeAsync(0)
        expect(downloadChapter).toHaveBeenCalledTimes(1)

        // Retry is scheduled with a backoff delay (up to 45s + jitter) - fast-forward past it.
        await vi.advanceTimersByTimeAsync(60_000)

        expect(downloadChapter).toHaveBeenCalledTimes(2)
      } finally {
        vi.useRealTimers()
      }
    })
  })

  describe('cleanup', () => {
    it('flushes a pending batched write left over from a permanent failure', async () => {
      getByPath.mockReturnValue(1)
      // A plain Error matched by message content, rather than a MangaDexApiError instance -
      // vi.resetModules() in beforeEach evicts non-mocked modules too, so a class imported
      // statically at the top of this file would no longer be `instanceof`-equal to the one
      // download-error-classifier.ts sees after being freshly re-imported this test.
      downloadChapter.mockRejectedValue(new Error('404 chapter not found'))

      downloadQueueService.addToQueue(queuedItem('ch-1'))
      // Let the rejection's catch handler (which synchronously schedules the batched
      // write via the retry scheduler) run before flushing.
      await new Promise((resolve) => setTimeout(resolve, 0))

      downloadQueueService.cleanup()

      expect(batchMarkDownloadsState).toHaveBeenCalledWith([
        expect.objectContaining({ chapterId: 'ch-1', isFailed: true })
      ])
    })

    it('does nothing when there is nothing pending', () => {
      downloadQueueService.cleanup()

      expect(batchMarkDownloadsState).not.toHaveBeenCalled()
    })
  })
})
