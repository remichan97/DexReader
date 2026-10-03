import { ipcMain, IpcMainInvokeEvent } from 'electron'
import { downloadService } from '../../services/download.service'
import { registerDownloadHandlers } from './download.handler'

vi.mock('electron', () => ({
  ipcMain: { handle: vi.fn() }
}))

vi.mock('../../services/logging/main-logging.service', () => ({
  mainLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))

vi.mock('../../services/download.service', () => ({
  downloadService: {
    deleteChapter: vi.fn(),
    getAllDownloads: vi.fn(),
    clearCompletedDownloads: vi.fn(),
    isDownloaded: vi.fn(),
    getStorageInfo: vi.fn(),
    deleteManga: vi.fn(),
    batchDeleteManga: vi.fn(),
    emptyDiskCache: vi.fn(),
    getDownloadStats: vi.fn()
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

describe('download.handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    registerDownloadHandlers()
  })

  describe('download:delete-chapter', () => {
    it('forwards a valid options object to downloadService.deleteChapter', async () => {
      vi.mocked(downloadService.deleteChapter).mockResolvedValue(undefined)
      const options = { chapterId: 'chapter-1', isDeletePermanent: true }

      await expect(
        getRegisteredHandler('download:delete-chapter')(EVENT, options)
      ).resolves.toEqual({ success: true, data: undefined })
      expect(downloadService.deleteChapter).toHaveBeenCalledWith(options)
    })

    it('rejects an options object missing chapterId', async () => {
      const response = await getRegisteredHandler('download:delete-chapter')(EVENT, {
        isDeletePermanent: true
      })

      expect(response).toEqual({
        success: false,
        error: expect.objectContaining({ name: 'TypeError' })
      })
      expect(downloadService.deleteChapter).not.toHaveBeenCalled()
    })

    it('rejects a non-object options value', async () => {
      const response = await getRegisteredHandler('download:delete-chapter')(EVENT, 'chapter-1')

      expect(response.success).toBe(false)
      expect(downloadService.deleteChapter).not.toHaveBeenCalled()
    })
  })

  describe('download:get-all-downloads', () => {
    it('returns downloadService.getAllDownloads() unchanged', async () => {
      vi.mocked(downloadService.getAllDownloads).mockResolvedValue([
        { chapterId: 'chapter-1' }
      ] as never)

      await expect(getRegisteredHandler('download:get-all-downloads')(EVENT)).resolves.toEqual({
        success: true,
        data: [{ chapterId: 'chapter-1' }]
      })
    })
  })

  describe('download:clear-completed', () => {
    it('calls downloadService.clearCompletedDownloads()', async () => {
      await getRegisteredHandler('download:clear-completed')(EVENT)

      expect(downloadService.clearCompletedDownloads).toHaveBeenCalled()
    })
  })

  describe('download:get-download / download:is-downloaded', () => {
    it.each(['download:get-download', 'download:is-downloaded'])(
      '%s forwards a valid chapterId to downloadService.isDownloaded',
      async (channel) => {
        vi.mocked(downloadService.isDownloaded).mockResolvedValue(undefined)

        await getRegisteredHandler(channel)(EVENT, 'chapter-1')

        expect(downloadService.isDownloaded).toHaveBeenCalledWith('chapter-1')
      }
    )

    it.each(['download:get-download', 'download:is-downloaded'])(
      '%s rejects a non-string chapterId',
      async (channel) => {
        const response = await getRegisteredHandler(channel)(EVENT, 42)

        expect(response.success).toBe(false)
        expect(downloadService.isDownloaded).not.toHaveBeenCalled()
      }
    )
  })

  describe('download:storage-stats', () => {
    it('returns downloadService.getStorageInfo() unchanged', async () => {
      vi.mocked(downloadService.getStorageInfo).mockResolvedValue({ totalSize: 1024 } as never)

      await expect(getRegisteredHandler('download:storage-stats')(EVENT)).resolves.toEqual({
        success: true,
        data: { totalSize: 1024 }
      })
    })
  })

  describe('download:delete-manga', () => {
    it('forwards a valid mangaId to downloadService.deleteManga', async () => {
      await getRegisteredHandler('download:delete-manga')(EVENT, 'manga-1')

      expect(downloadService.deleteManga).toHaveBeenCalledWith('manga-1')
    })

    it('rejects a non-string mangaId', async () => {
      const response = await getRegisteredHandler('download:delete-manga')(EVENT, 42)

      expect(response.success).toBe(false)
      expect(downloadService.deleteManga).not.toHaveBeenCalled()
    })

    it('rejects an empty mangaId', async () => {
      const response = await getRegisteredHandler('download:delete-manga')(EVENT, '')

      expect(response.success).toBe(false)
      expect(downloadService.deleteManga).not.toHaveBeenCalled()
    })
  })

  describe('download:batch-delete-manga', () => {
    it('forwards a valid mangaIds array to downloadService.batchDeleteManga', async () => {
      vi.mocked(downloadService.batchDeleteManga).mockResolvedValue(undefined)

      await getRegisteredHandler('download:batch-delete-manga')(EVENT, ['manga-1', 'manga-2'])

      expect(downloadService.batchDeleteManga).toHaveBeenCalledWith(['manga-1', 'manga-2'])
    })

    it('rejects a non-array value', async () => {
      const response = await getRegisteredHandler('download:batch-delete-manga')(EVENT, 'manga-1')

      expect(response.success).toBe(false)
      expect(downloadService.batchDeleteManga).not.toHaveBeenCalled()
    })

    it('rejects an array containing a non-string entry', async () => {
      const response = await getRegisteredHandler('download:batch-delete-manga')(EVENT, [
        'manga-1',
        42
      ])

      expect(response.success).toBe(false)
      expect(downloadService.batchDeleteManga).not.toHaveBeenCalled()
    })

    it('rejects an empty array', async () => {
      const response = await getRegisteredHandler('download:batch-delete-manga')(EVENT, [])

      expect(response.success).toBe(false)
      expect(downloadService.batchDeleteManga).not.toHaveBeenCalled()
    })
  })

  describe('download:clear-cover-cache', () => {
    it('calls downloadService.emptyDiskCache()', async () => {
      vi.mocked(downloadService.emptyDiskCache).mockResolvedValue({ freedSpace: 2048 } as never)

      await expect(getRegisteredHandler('download:clear-cover-cache')(EVENT)).resolves.toEqual({
        success: true,
        data: { freedSpace: 2048 }
      })
    })
  })

  describe('download:get-download-stats', () => {
    it('forwards a valid mangaId to downloadService.getDownloadStats', async () => {
      vi.mocked(downloadService.getDownloadStats).mockResolvedValue({ totalChapters: 5 } as never)

      await expect(
        getRegisteredHandler('download:get-download-stats')(EVENT, 'manga-1')
      ).resolves.toEqual({ success: true, data: { totalChapters: 5 } })
      expect(downloadService.getDownloadStats).toHaveBeenCalledWith('manga-1')
    })

    it('rejects a non-string mangaId', async () => {
      const response = await getRegisteredHandler('download:get-download-stats')(EVENT, 42)

      expect(response.success).toBe(false)
      expect(downloadService.getDownloadStats).not.toHaveBeenCalled()
    })
  })
})
