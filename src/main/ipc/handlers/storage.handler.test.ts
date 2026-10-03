import { ipcMain, IpcMainInvokeEvent } from 'electron'
import { cleanupRepo } from '../../database/repositories/cleanup.repo'
import { mangaRepo } from '../../database/repositories/manga.repo'
import { registerStorageHandlers } from './storage.handler'

vi.mock('electron', () => ({
  ipcMain: { handle: vi.fn() }
}))

vi.mock('../../services/logging/main-logging.service', () => ({
  mainLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))

vi.mock('../../database/repositories/cleanup.repo', () => ({
  cleanupRepo: { reclaimStorage: vi.fn(), clearAllData: vi.fn() }
}))

vi.mock('../../database/repositories/manga.repo', () => ({
  mangaRepo: { statsMangaTable: vi.fn(), cleanupMangaCache: vi.fn() }
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

describe('storage.handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    registerStorageHandlers()
  })

  describe('storage:get-stats', () => {
    it('returns mangaRepo.statsMangaTable() unchanged', async () => {
      vi.mocked(mangaRepo.statsMangaTable).mockReturnValue({ totalSize: 1024 } as never)

      await expect(getRegisteredHandler('storage:get-stats')(EVENT)).resolves.toEqual({
        success: true,
        data: { totalSize: 1024 }
      })
    })
  })

  describe('storage:clear-manga-cache', () => {
    it.each([true, false])(
      'forwards a valid immediate flag (%s) to mangaRepo.cleanupMangaCache',
      async (immediate) => {
        vi.mocked(mangaRepo.cleanupMangaCache).mockReturnValue(5)

        await expect(
          getRegisteredHandler('storage:clear-manga-cache')(EVENT, immediate)
        ).resolves.toEqual({ success: true, data: 5 })
        expect(mangaRepo.cleanupMangaCache).toHaveBeenCalledWith(immediate)
      }
    )

    it('rejects a non-boolean immediate flag', async () => {
      const response = await getRegisteredHandler('storage:clear-manga-cache')(EVENT, 'true')

      expect(response).toEqual({
        success: false,
        error: expect.objectContaining({ name: 'TypeError' })
      })
      expect(mangaRepo.cleanupMangaCache).not.toHaveBeenCalled()
    })
  })

  describe('storage:optimise-manga-cache', () => {
    it('calls cleanupRepo.reclaimStorage()', async () => {
      vi.mocked(cleanupRepo.reclaimStorage).mockResolvedValue(2048)

      await expect(getRegisteredHandler('storage:optimise-manga-cache')(EVENT)).resolves.toEqual({
        success: true,
        data: 2048
      })
    })
  })
})
