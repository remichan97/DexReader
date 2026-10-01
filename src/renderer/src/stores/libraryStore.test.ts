import { useLibraryStore } from './libraryStore'

vi.mock('@renderer/services/logging.service', () => ({
  rendererLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))

const INITIAL_STATE = useLibraryStore.getState()

const getLibraryManga = vi.fn()
const toggleFavourite = vi.fn()

describe('libraryStore', () => {
  beforeEach(() => {
    useLibraryStore.setState(INITIAL_STATE, true)
    vi.clearAllMocks()
    globalThis.library = {
      getLibraryManga,
      toggleFavourite
    } as unknown as typeof globalThis.library
  })

  describe('loadFavourites', () => {
    it('populates favourites on success', async () => {
      getLibraryManga.mockResolvedValue({ success: true, data: [{ mangaId: 'manga-1' }] })

      await useLibraryStore.getState().loadFavourites()

      expect(useLibraryStore.getState()).toEqual(
        expect.objectContaining({
          favourites: [{ mangaId: 'manga-1' }],
          loading: false,
          error: null
        })
      )
    })

    it('sets an error message when the IPC call reports failure', async () => {
      getLibraryManga.mockResolvedValue({ success: false, error: { message: 'DB locked' } })

      await useLibraryStore.getState().loadFavourites()

      expect(useLibraryStore.getState()).toEqual(
        expect.objectContaining({ error: 'DB locked', loading: false })
      )
    })

    it('falls back to a generic error message when the IPC call throws', async () => {
      getLibraryManga.mockRejectedValue(new Error('IPC channel closed'))

      await useLibraryStore.getState().loadFavourites()

      expect(useLibraryStore.getState()).toEqual(
        expect.objectContaining({ error: 'Failed to load library', loading: false })
      )
    })
  })

  describe('toggleFavourite', () => {
    it('reloads favourites and returns the new status on success', async () => {
      toggleFavourite.mockResolvedValue({ success: true, data: true })
      getLibraryManga.mockResolvedValue({ success: true, data: [{ mangaId: 'manga-1' }] })

      const result = await useLibraryStore.getState().toggleFavourite('manga-1')

      expect(result).toBe(true)
      expect(getLibraryManga).toHaveBeenCalled()
      expect(useLibraryStore.getState().favourites).toEqual([{ mangaId: 'manga-1' }])
    })

    it('sets an error and returns false without reloading on failure', async () => {
      toggleFavourite.mockResolvedValue({ success: false, error: { message: 'Not found' } })

      const result = await useLibraryStore.getState().toggleFavourite('manga-1')

      expect(result).toBe(false)
      expect(getLibraryManga).not.toHaveBeenCalled()
      expect(useLibraryStore.getState().error).toBe('Not found')
    })

    it('returns false when the IPC call throws', async () => {
      toggleFavourite.mockRejectedValue(new Error('IPC channel closed'))

      const result = await useLibraryStore.getState().toggleFavourite('manga-1')

      expect(result).toBe(false)
      expect(useLibraryStore.getState().error).toBe('Failed to toggle favourite')
    })
  })

  describe('isFavourite', () => {
    it('returns true when the manga is in the favourites list', () => {
      useLibraryStore.setState({ favourites: [{ mangaId: 'manga-1' }] } as never)

      expect(useLibraryStore.getState().isFavourite('manga-1')).toBe(true)
    })

    it('returns false when the manga is not in the favourites list', () => {
      useLibraryStore.setState({ favourites: [] } as never)

      expect(useLibraryStore.getState().isFavourite('manga-1')).toBe(false)
    })
  })

  describe('refreshLibrary', () => {
    it('delegates to loadFavourites', async () => {
      getLibraryManga.mockResolvedValue({ success: true, data: [] })

      await useLibraryStore.getState().refreshLibrary()

      expect(getLibraryManga).toHaveBeenCalledWith({})
    })
  })
})
