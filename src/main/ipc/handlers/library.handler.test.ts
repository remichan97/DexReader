import { ipcMain, IpcMainInvokeEvent } from 'electron'
import { mangaRepo } from '../../database/repositories/manga.repo'
import { chapterRepo } from '../../database/repositories/chapter.repo'
import { registerLibraryHandlers } from './library.handler'

vi.mock('electron', () => ({
  ipcMain: { handle: vi.fn() }
}))

vi.mock('../../services/logging/main-logging.service', () => ({
  mainLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))

vi.mock('../../database/repositories/manga.repo', () => ({
  mangaRepo: {
    getLibraryManga: vi.fn(),
    getMangaById: vi.fn(),
    toggleFavourite: vi.fn(),
    upsertManga: vi.fn(),
    getDownloadedManga: vi.fn()
  }
}))

vi.mock('../../database/repositories/chapter.repo', () => ({
  chapterRepo: { getChaptersByMangaId: vi.fn() }
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

describe('library.handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    registerLibraryHandlers()
  })

  describe('library:get-manga', () => {
    it('forwards a valid command to mangaRepo.getLibraryManga', async () => {
      vi.mocked(mangaRepo.getLibraryManga).mockReturnValue([{ mangaId: 'manga-1' }] as never)
      const command = { sortBy: 'updatedAt', limit: 20, offset: 0 }

      await expect(getRegisteredHandler('library:get-manga')(EVENT, command)).resolves.toEqual({
        success: true,
        data: [{ mangaId: 'manga-1' }]
      })
      expect(mangaRepo.getLibraryManga).toHaveBeenCalledWith(command)
    })

    it('rejects a command with an invalid field type', async () => {
      const response = await getRegisteredHandler('library:get-manga')(EVENT, { limit: 'all' })

      expect(response).toEqual({
        success: false,
        error: expect.objectContaining({ name: 'TypeError' })
      })
      expect(mangaRepo.getLibraryManga).not.toHaveBeenCalled()
    })
  })

  describe('library:get-manga-by-id', () => {
    it('forwards a valid mangaId to mangaRepo.getMangaById', async () => {
      vi.mocked(mangaRepo.getMangaById).mockReturnValue({ mangaId: 'manga-1' } as never)

      await expect(
        getRegisteredHandler('library:get-manga-by-id')(EVENT, 'manga-1')
      ).resolves.toEqual({ success: true, data: { mangaId: 'manga-1' } })
      expect(mangaRepo.getMangaById).toHaveBeenCalledWith('manga-1')
    })

    it('rejects a non-string mangaId', async () => {
      const response = await getRegisteredHandler('library:get-manga-by-id')(EVENT, 42)

      expect(response.success).toBe(false)
      expect(mangaRepo.getMangaById).not.toHaveBeenCalled()
    })
  })

  describe('library:get-cached-chapters', () => {
    it('forwards a valid mangaId to chapterRepo.getChaptersByMangaId', async () => {
      vi.mocked(chapterRepo.getChaptersByMangaId).mockReturnValue([
        { chapterId: 'chapter-1' }
      ] as never)

      await expect(
        getRegisteredHandler('library:get-cached-chapters')(EVENT, 'manga-1')
      ).resolves.toEqual({ success: true, data: [{ chapterId: 'chapter-1' }] })
      expect(chapterRepo.getChaptersByMangaId).toHaveBeenCalledWith('manga-1')
    })

    it('rejects a non-string mangaId', async () => {
      const response = await getRegisteredHandler('library:get-cached-chapters')(EVENT, 42)

      expect(response.success).toBe(false)
      expect(chapterRepo.getChaptersByMangaId).not.toHaveBeenCalled()
    })
  })

  describe('library:toggle-favourite', () => {
    it('forwards a valid mangaId to mangaRepo.toggleFavourite', async () => {
      vi.mocked(mangaRepo.toggleFavourite).mockReturnValue({ favorited: true } as never)

      await expect(
        getRegisteredHandler('library:toggle-favourite')(EVENT, 'manga-1')
      ).resolves.toEqual({ success: true, data: { favorited: true } })
      expect(mangaRepo.toggleFavourite).toHaveBeenCalledWith('manga-1')
    })

    it('rejects a non-string mangaId', async () => {
      const response = await getRegisteredHandler('library:toggle-favourite')(EVENT, 42)

      expect(response.success).toBe(false)
      expect(mangaRepo.toggleFavourite).not.toHaveBeenCalled()
    })
  })

  describe('library:upsert-manga', () => {
    it('forwards a valid command to mangaRepo.upsertManga', async () => {
      const command = {
        mangaId: 'manga-1',
        title: 'Berserk',
        coverUrl: 'https://example.com/cover.jpg',
        status: 'ongoing',
        authors: ['Kentaro Miura'],
        artists: ['Kentaro Miura'],
        tags: []
      }

      await getRegisteredHandler('library:upsert-manga')(EVENT, command)

      expect(mangaRepo.upsertManga).toHaveBeenCalledWith(command)
    })

    it('rejects a command missing required fields', async () => {
      const response = await getRegisteredHandler('library:upsert-manga')(EVENT, {
        mangaId: 'manga-1'
      })

      expect(response.success).toBe(false)
      expect(mangaRepo.upsertManga).not.toHaveBeenCalled()
    })
  })

  describe('library:get-downloaded-manga', () => {
    it('returns mangaRepo.getDownloadedManga() unchanged', async () => {
      vi.mocked(mangaRepo.getDownloadedManga).mockReturnValue([{ mangaId: 'manga-1' }] as never)

      await expect(getRegisteredHandler('library:get-downloaded-manga')(EVENT)).resolves.toEqual({
        success: true,
        data: [{ mangaId: 'manga-1' }]
      })
    })
  })
})
