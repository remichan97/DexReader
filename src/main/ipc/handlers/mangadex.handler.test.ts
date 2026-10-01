import { ipcMain, IpcMainInvokeEvent } from 'electron'
import { registerMangaDexHandlers } from './mangadex.handler'
import { mapChapterEntityToContract, mapMangaEntityToContract } from '../../api/mapper/api.mapper'

const mangadexClientMock = vi.hoisted(() => ({
  searchManga: vi.fn(),
  getManga: vi.fn(),
  getMangaFeed: vi.fn(),
  getChapter: vi.fn(),
  getChapterImages: vi.fn(),
  isServiceAlive: vi.fn()
}))

vi.mock('electron', () => ({
  ipcMain: { handle: vi.fn() }
}))

vi.mock('../../services/logging/main-logging.service', () => ({
  mainLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))

vi.mock('../../api/utils/user-agent.util', () => ({
  buildUserAgent: vi.fn(() => 'DexReader/test')
}))

vi.mock('../../api/mangadex-client', () => ({
  MangaDexClient: vi.fn(function MangaDexClient() {
    return mangadexClientMock
  })
}))

vi.mock('../../api/mapper/api.mapper', () => ({
  mapMangaEntityToContract: vi.fn((manga) => ({ mapped: 'manga', ...manga })),
  mapChapterEntityToContract: vi.fn((chapter) => ({ mapped: 'chapter', ...chapter }))
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

describe('mangadex.handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    registerMangaDexHandlers()
  })

  describe('mangadex:search-manga', () => {
    it('forwards the query and maps each result entity to a contract', async () => {
      mangadexClientMock.searchManga.mockResolvedValue({
        data: [{ id: 'manga-1' }],
        total: 1
      })
      const query = { title: 'Berserk' }

      await expect(getRegisteredHandler('mangadex:search-manga')(EVENT, query)).resolves.toEqual({
        success: true,
        data: { data: [{ mapped: 'manga', id: 'manga-1' }], total: 1 }
      })
      expect(mangadexClientMock.searchManga).toHaveBeenCalledWith(query)
      // .map() passes (element, index, array), so check just the mapped entity
      expect(vi.mocked(mapMangaEntityToContract).mock.calls[0][0]).toEqual({ id: 'manga-1' })
    })
  })

  describe('mangadex:get-manga', () => {
    it('forwards id/includes and maps the result entity to a contract', async () => {
      mangadexClientMock.getManga.mockResolvedValue({ data: { id: 'manga-1' } })

      await expect(
        getRegisteredHandler('mangadex:get-manga')(EVENT, 'manga-1', ['cover_art'])
      ).resolves.toEqual({
        success: true,
        data: { data: { mapped: 'manga', id: 'manga-1' } }
      })
      expect(mangadexClientMock.getManga).toHaveBeenCalledWith('manga-1', ['cover_art'])
    })
  })

  describe('mangadex:get-manga-feed', () => {
    it('forwards id/query and maps each chapter entity to a contract', async () => {
      mangadexClientMock.getMangaFeed.mockResolvedValue({
        data: [{ id: 'chapter-1' }],
        total: 1
      })
      const query = { limit: 20 }

      await expect(
        getRegisteredHandler('mangadex:get-manga-feed')(EVENT, 'manga-1', query)
      ).resolves.toEqual({
        success: true,
        data: { data: [{ mapped: 'chapter', id: 'chapter-1' }], total: 1 }
      })
      expect(mangadexClientMock.getMangaFeed).toHaveBeenCalledWith('manga-1', query)
      expect(vi.mocked(mapChapterEntityToContract).mock.calls[0][0]).toEqual({
        id: 'chapter-1'
      })
    })
  })

  describe('mangadex:get-chapter', () => {
    it('forwards id/includes and maps the result entity to a contract', async () => {
      mangadexClientMock.getChapter.mockResolvedValue({ data: { id: 'chapter-1' } })

      await expect(
        getRegisteredHandler('mangadex:get-chapter')(EVENT, 'chapter-1', ['scanlation_group'])
      ).resolves.toEqual({
        success: true,
        data: { data: { mapped: 'chapter', id: 'chapter-1' } }
      })
      expect(mangadexClientMock.getChapter).toHaveBeenCalledWith('chapter-1', ['scanlation_group'])
    })
  })

  describe('mangadex:get-chapter-images', () => {
    it('forwards id/quality and returns the image urls unchanged', async () => {
      mangadexClientMock.getChapterImages.mockResolvedValue([{ url: 'https://example.com/1.jpg' }])

      await expect(
        getRegisteredHandler('mangadex:get-chapter-images')(EVENT, 'chapter-1', 'data')
      ).resolves.toEqual({
        success: true,
        data: [{ url: 'https://example.com/1.jpg' }]
      })
      expect(mangadexClientMock.getChapterImages).toHaveBeenCalledWith('chapter-1', 'data')
    })
  })

  describe('mangadex:healthcheck', () => {
    it('returns mangadexClient.isServiceAlive() unchanged', async () => {
      mangadexClientMock.isServiceAlive.mockResolvedValue(true)

      await expect(getRegisteredHandler('mangadex:healthcheck')(EVENT)).resolves.toEqual({
        success: true,
        data: true
      })
    })
  })
})
