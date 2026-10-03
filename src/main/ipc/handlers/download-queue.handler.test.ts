import { ipcMain, IpcMainInvokeEvent } from 'electron'
import { downloadQueueService } from '../../services/download-queue.service'
import { registerDownloadQueueHandlers } from './download-queue.handler'
import { ImageQuality } from '@shared/enums/mangadex/image-quality.enum'

vi.mock('electron', () => ({
  ipcMain: { handle: vi.fn() }
}))

vi.mock('../../services/logging/main-logging.service', () => ({
  mainLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))

vi.mock('../../services/download-queue.service', () => ({
  downloadQueueService: {
    addToQueue: vi.fn(),
    removeFromQueue: vi.fn(),
    clearQueue: vi.fn(),
    cancelAllQueued: vi.fn(),
    retryDownload: vi.fn(),
    getQueuedItems: vi.fn()
  }
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

function queuedDownloads(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    chapterId: 'chapter-1',
    mangaId: 'manga-1',
    language: 'en',
    quality: ImageQuality.High,
    addedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides
  }
}

describe('download-queue.handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    registerDownloadQueueHandlers()
  })

  describe('download:add-to-queue', () => {
    it('forwards a valid queue entry to downloadQueueService.addToQueue', async () => {
      vi.mocked(downloadQueueService.addToQueue).mockResolvedValue(undefined)
      const params = queuedDownloads()

      await getRegisteredHandler('download:add-to-queue')(EVENT, params)

      expect(downloadQueueService.addToQueue).toHaveBeenCalledWith(params)
    })

    it.each([
      ['missing chapterId', { chapterId: undefined }],
      ['missing mangaId', { mangaId: undefined }],
      ['missing language', { language: undefined }],
      ['missing quality', { quality: undefined }],
      ['a non-Date addedAt', { addedAt: '2026-01-01' }]
    ])('rejects a queue entry with %s', async (_label, overrides) => {
      const response = await getRegisteredHandler('download:add-to-queue')(
        EVENT,
        queuedDownloads(overrides)
      )

      expect(response).toEqual({
        success: false,
        error: expect.objectContaining({ name: 'TypeError' })
      })
      expect(downloadQueueService.addToQueue).not.toHaveBeenCalled()
    })

    it('rejects a non-object value', async () => {
      const response = await getRegisteredHandler('download:add-to-queue')(EVENT, 'chapter-1')

      expect(response.success).toBe(false)
      expect(downloadQueueService.addToQueue).not.toHaveBeenCalled()
    })
  })

  describe('download:remove-from-queue', () => {
    it('forwards a valid chapterId to downloadQueueService.removeFromQueue', async () => {
      await getRegisteredHandler('download:remove-from-queue')(EVENT, 'chapter-1')

      expect(downloadQueueService.removeFromQueue).toHaveBeenCalledWith('chapter-1')
    })

    it('rejects a non-string chapterId', async () => {
      const response = await getRegisteredHandler('download:remove-from-queue')(EVENT, 42)

      expect(response.success).toBe(false)
      expect(downloadQueueService.removeFromQueue).not.toHaveBeenCalled()
    })
  })

  describe('download:clear-queue', () => {
    it('calls downloadQueueService.clearQueue()', async () => {
      await getRegisteredHandler('download:clear-queue')(EVENT)

      expect(downloadQueueService.clearQueue).toHaveBeenCalled()
    })
  })

  describe('download:cancel-all-queued', () => {
    it('calls downloadQueueService.cancelAllQueued()', async () => {
      await getRegisteredHandler('download:cancel-all-queued')(EVENT)

      expect(downloadQueueService.cancelAllQueued).toHaveBeenCalled()
    })
  })

  describe('download:retry', () => {
    it('forwards a valid chapterId to downloadQueueService.retryDownload', async () => {
      await getRegisteredHandler('download:retry')(EVENT, 'chapter-1')

      expect(downloadQueueService.retryDownload).toHaveBeenCalledWith('chapter-1')
    })

    it('rejects a non-string chapterId', async () => {
      const response = await getRegisteredHandler('download:retry')(EVENT, 42)

      expect(response.success).toBe(false)
      expect(downloadQueueService.retryDownload).not.toHaveBeenCalled()
    })
  })

  describe('download:get-queued-items', () => {
    it('returns downloadQueueService.getQueuedItems() unchanged', async () => {
      vi.mocked(downloadQueueService.getQueuedItems).mockResolvedValue([queuedDownloads()] as never)

      await expect(getRegisteredHandler('download:get-queued-items')(EVENT)).resolves.toEqual({
        success: true,
        data: [queuedDownloads()]
      })
    })
  })
})
