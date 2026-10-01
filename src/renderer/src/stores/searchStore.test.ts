import { DEFAULT_FILTERS, useSearchStore } from './searchStore'
import { useConnectivityStore } from './connectivityStore'
import { OrderOptions } from '@shared/enums/mangadex'

vi.mock('@renderer/services/logging.service', () => ({
  rendererLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))

const SEARCH_INITIAL_STATE = useSearchStore.getState()
const CONNECTIVITY_INITIAL_STATE = useConnectivityStore.getState()

const searchManga = vi.fn()
const load = vi.fn()

function mangaResult(id: string): { id: string } {
  return { id }
}

describe('searchStore', () => {
  beforeEach(() => {
    useSearchStore.setState(SEARCH_INITIAL_STATE, true)
    useConnectivityStore.setState(CONNECTIVITY_INITIAL_STATE, true)
    vi.clearAllMocks()
    globalThis.mangadex = { searchManga } as unknown as typeof globalThis.mangadex
    globalThis.settings = { load } as unknown as typeof globalThis.settings
    load.mockResolvedValue({ success: true, data: { language: undefined } })
  })

  describe('setQuery / setFilters / setLimit', () => {
    it('setQuery updates the query', () => {
      useSearchStore.getState().setQuery('Berserk')

      expect(useSearchStore.getState().query).toBe('Berserk')
    })

    it('setFilters merges into existing filters rather than replacing them', () => {
      useSearchStore.getState().setFilters({ includedTags: ['tag-1'] })

      expect(useSearchStore.getState().filters).toEqual({
        ...DEFAULT_FILTERS,
        includedTags: ['tag-1']
      })
    })

    it('setLimit clamps to the 5-100 range', () => {
      useSearchStore.getState().setLimit(500)
      expect(useSearchStore.getState().limit).toBe(100)

      useSearchStore.getState().setLimit(1)
      expect(useSearchStore.getState().limit).toBe(5)

      useSearchStore.getState().setLimit(50)
      expect(useSearchStore.getState().limit).toBe(50)
    })
  })

  describe('search', () => {
    it('sets an error and does not call the API when offline', async () => {
      useConnectivityStore.setState({ isOnline: false })

      await useSearchStore.getState().search()

      expect(searchManga).not.toHaveBeenCalled()
      expect(useSearchStore.getState().error).toBeInstanceOf(Error)
    })

    it('is a no-op when a search is already in flight', async () => {
      useSearchStore.setState({ loading: true })

      await useSearchStore.getState().search()

      expect(searchManga).not.toHaveBeenCalled()
    })

    it('populates results and total on success', async () => {
      searchManga.mockResolvedValue({
        success: true,
        data: { data: [mangaResult('manga-1'), mangaResult('manga-2')], total: 2 }
      })

      await useSearchStore.getState().search()

      expect(useSearchStore.getState()).toEqual(
        expect.objectContaining({
          results: [mangaResult('manga-1'), mangaResult('manga-2')],
          total: 2,
          offset: 0,
          loading: false
        })
      )
    })

    it('omits the title param when the query is empty, and orders by updatedAt', async () => {
      searchManga.mockResolvedValue({ success: true, data: { data: [], total: 0 } })

      await useSearchStore.getState().search()

      const [params] = searchManga.mock.calls[0]
      expect(params.title).toBeUndefined()
      expect(params.order).toEqual({
        [OrderOptions.UpdatedAt]: useSearchStore.getState().filters.sortDirection
      })
    })

    it('includes a trimmed title param and orders by the chosen sortBy when a query is set', async () => {
      searchManga.mockResolvedValue({ success: true, data: { data: [], total: 0 } })
      useSearchStore.getState().setQuery('  Berserk  ')

      await useSearchStore.getState().search()

      const [params] = searchManga.mock.calls[0]
      expect(params.title).toBe('Berserk')
      expect(params.order).toEqual({
        [useSearchStore.getState().filters.sortBy]: useSearchStore.getState().filters.sortDirection
      })
    })

    it('sets an error when the IPC call reports failure', async () => {
      searchManga.mockResolvedValue({ success: false, error: { message: 'rate limited' } })

      await useSearchStore.getState().search()

      expect(useSearchStore.getState().error?.message).toBe('rate limited')
      expect(useSearchStore.getState().loading).toBe(false)
    })

    it('sets an error when the MangaDex API itself reports an error result', async () => {
      searchManga.mockResolvedValue({ success: true, data: { result: 'error' } })

      await useSearchStore.getState().search()

      expect(useSearchStore.getState().error).toBeInstanceOf(Error)
    })

    it('sets hasMore to false when fewer results than the limit come back', async () => {
      useSearchStore.setState({ limit: 20 })
      searchManga.mockResolvedValue({
        success: true,
        data: { data: [mangaResult('manga-1')], total: 1 }
      })

      await useSearchStore.getState().search()

      expect(useSearchStore.getState().hasMore).toBe(false)
    })
  })

  describe('loadMore', () => {
    it('is a no-op when already loading more', async () => {
      useSearchStore.setState({ loadingMore: true, hasMore: true })

      await useSearchStore.getState().loadMore()

      expect(searchManga).not.toHaveBeenCalled()
    })

    it('is a no-op when there is nothing more to load', async () => {
      useSearchStore.setState({ hasMore: false })

      await useSearchStore.getState().loadMore()

      expect(searchManga).not.toHaveBeenCalled()
    })

    it('sets an error and does not call the API when offline', async () => {
      useConnectivityStore.setState({ isOnline: false })

      await useSearchStore.getState().loadMore()

      expect(searchManga).not.toHaveBeenCalled()
      expect(useSearchStore.getState().loadMoreError).toBeInstanceOf(Error)
    })

    it('appends new results, deduplicating by manga id against the existing list', async () => {
      useSearchStore.setState({
        results: [mangaResult('manga-1')],
        offset: 0,
        limit: 20,
        total: 40,
        hasMore: true
      } as never)
      searchManga.mockResolvedValue({
        success: true,
        // manga-1 overlaps with the existing page - must not be duplicated
        data: { data: [mangaResult('manga-1'), mangaResult('manga-2')], total: 40 }
      })

      await useSearchStore.getState().loadMore()

      expect(useSearchStore.getState().results).toEqual([
        mangaResult('manga-1'),
        mangaResult('manga-2')
      ])
      expect(useSearchStore.getState().offset).toBe(20)
    })

    it('keeps hasMore true and records loadMoreError on failure, so the user can retry', async () => {
      useSearchStore.setState({ hasMore: true, offset: 0, limit: 20 })
      searchManga.mockResolvedValue({ success: false, error: { message: 'timeout' } })

      await useSearchStore.getState().loadMore()

      expect(useSearchStore.getState()).toEqual(
        expect.objectContaining({ hasMore: true, loadingMore: false })
      )
      expect(useSearchStore.getState().loadMoreError?.message).toBe('timeout')
    })
  })

  describe('retryLoadMore', () => {
    it('clears loadMoreError and retries loadMore', async () => {
      useSearchStore.setState({
        loadMoreError: new Error('timeout'),
        hasMore: true,
        offset: 0,
        limit: 20
      })
      searchManga.mockResolvedValue({ success: true, data: { data: [], total: 0 } })

      await useSearchStore.getState().retryLoadMore()

      expect(searchManga).toHaveBeenCalled()
      expect(useSearchStore.getState().loadMoreError).toBeNull()
    })
  })

  describe('reset', () => {
    it('restores every field to its default value', () => {
      useSearchStore.setState({
        query: 'Berserk',
        results: [mangaResult('manga-1')],
        total: 1,
        offset: 20,
        hasMore: false,
        error: new Error('boom')
      } as never)

      useSearchStore.getState().reset()

      expect(useSearchStore.getState()).toEqual(
        expect.objectContaining({
          query: '',
          filters: DEFAULT_FILTERS,
          results: [],
          total: 0,
          offset: 0,
          hasMore: true,
          error: null,
          loadMoreError: null
        })
      )
    })
  })
})
