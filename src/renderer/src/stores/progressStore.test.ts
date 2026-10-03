import { useProgressStore } from './progressStore'
import { useToastStore } from './toastStore'

vi.mock('@renderer/services/logging.service', () => ({
  rendererLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))

const PROGRESS_INITIAL_STATE = useProgressStore.getState()
const TOAST_INITIAL_STATE = useToastStore.getState()

const getProgress = vi.fn()
const saveProgress = vi.fn()
const getAllProgress = vi.fn()
const getStatistics = vi.fn()
const deleteProgress = vi.fn()
const updateMenuState = vi.fn()

describe('progressStore', () => {
  beforeEach(() => {
    useProgressStore.setState(PROGRESS_INITIAL_STATE, true)
    useToastStore.setState(TOAST_INITIAL_STATE, true)
    vi.clearAllMocks()
    globalThis.progress = {
      getProgress,
      saveProgress,
      getAllProgress,
      getStatistics,
      deleteProgress
    } as unknown as typeof globalThis.progress
    globalThis.api = { updateMenuState } as unknown as typeof globalThis.api
  })

  afterEach(() => {
    // Flush any pending debounce so it can't leak a stale timer/map entry into
    // the next test - saveTimers/pendingSaves are module-private, not store state.
    if (vi.isFakeTimers()) {
      vi.runOnlyPendingTimers()
      vi.useRealTimers()
    }
  })

  describe('loadProgress', () => {
    it('fetches and caches progress on a cache miss', async () => {
      getProgress.mockResolvedValue({ success: true, data: { mangaId: 'manga-1', currentPage: 3 } })

      await useProgressStore.getState().loadProgress('manga-1')

      expect(getProgress).toHaveBeenCalledWith('manga-1')
      expect(useProgressStore.getState().progressMap.get('manga-1')).toEqual({
        mangaId: 'manga-1',
        currentPage: 3
      })
    })

    it('returns the cached value without calling the IPC again on a cache hit', async () => {
      getProgress.mockResolvedValue({ success: true, data: { mangaId: 'manga-1', currentPage: 3 } })
      await useProgressStore.getState().loadProgress('manga-1')
      getProgress.mockClear()

      await useProgressStore.getState().loadProgress('manga-1')

      expect(getProgress).not.toHaveBeenCalled()
    })
  })

  describe('saveProgress', () => {
    it('does nothing when autoSaveEnabled is false (incognito mode)', () => {
      useProgressStore.setState({ autoSaveEnabled: false })

      useProgressStore.getState().saveProgress({
        mangaId: 'manga-1',
        chapterId: 'chapter-1',
        currentPage: 3,
        completed: false
      })

      expect(useProgressStore.getState().progressMap.has('manga-1')).toBe(false)
    })

    it('updates the cache optimistically before the debounced save fires', () => {
      vi.useFakeTimers()

      useProgressStore.getState().saveProgress({
        mangaId: 'manga-1',
        chapterId: 'chapter-1',
        currentPage: 3,
        completed: false
      })

      expect(useProgressStore.getState().progressMap.get('manga-1')).toEqual(
        expect.objectContaining({ mangaId: 'manga-1', lastChapterId: 'chapter-1', currentPage: 3 })
      )
      expect(saveProgress).not.toHaveBeenCalled()
    })

    it('calls the IPC save after the 1s debounce elapses', async () => {
      vi.useFakeTimers()
      saveProgress.mockResolvedValue({ success: true })

      useProgressStore.getState().saveProgress({
        mangaId: 'manga-1',
        chapterId: 'chapter-1',
        currentPage: 3,
        completed: false
      })
      await vi.advanceTimersByTimeAsync(1000)

      expect(saveProgress).toHaveBeenCalledWith([
        { mangaId: 'manga-1', chapterId: 'chapter-1', currentPage: 3, completed: false }
      ])
    })

    it('coalesces rapid successive saves for the same manga into a single IPC call', async () => {
      vi.useFakeTimers()
      saveProgress.mockResolvedValue({ success: true })

      useProgressStore.getState().saveProgress({
        mangaId: 'manga-1',
        chapterId: 'chapter-1',
        currentPage: 1,
        completed: false
      })
      vi.advanceTimersByTime(500)
      useProgressStore.getState().saveProgress({
        mangaId: 'manga-1',
        chapterId: 'chapter-1',
        currentPage: 2,
        completed: false
      })
      await vi.advanceTimersByTimeAsync(1000)

      expect(saveProgress).toHaveBeenCalledTimes(1)
      expect(saveProgress).toHaveBeenCalledWith([
        { mangaId: 'manga-1', chapterId: 'chapter-1', currentPage: 2, completed: false }
      ])
    })

    it('shows an error toast when the debounced save ultimately fails', async () => {
      vi.useFakeTimers()
      saveProgress.mockResolvedValue({ success: false, error: { message: 'disk full' } })

      useProgressStore.getState().saveProgress({
        mangaId: 'manga-1',
        chapterId: 'chapter-1',
        currentPage: 3,
        completed: false
      })
      await vi.advanceTimersByTimeAsync(1000)

      expect(useToastStore.getState().toasts).toEqual([
        expect.objectContaining({ variant: 'error', title: 'Failed to save progress' })
      ])
    })
  })

  describe('flushPendingSaves', () => {
    it('sends every pending save immediately in one batched call', async () => {
      vi.useFakeTimers()
      saveProgress.mockResolvedValue({ success: true })

      useProgressStore.getState().saveProgress({
        mangaId: 'manga-1',
        chapterId: 'chapter-1',
        currentPage: 1,
        completed: false
      })
      useProgressStore.getState().saveProgress({
        mangaId: 'manga-2',
        chapterId: 'chapter-2',
        currentPage: 2,
        completed: true
      })

      await useProgressStore.getState().flushPendingSaves()

      expect(saveProgress).toHaveBeenCalledTimes(1)
      const [[batch]] = saveProgress.mock.calls
      expect(batch.map((c: { mangaId: string }) => c.mangaId).sort()).toEqual([
        'manga-1',
        'manga-2'
      ])

      // The debounce timers must be cancelled too, or the batched save would fire again
      await vi.advanceTimersByTimeAsync(1000)
      expect(saveProgress).toHaveBeenCalledTimes(1)
    })

    it('does nothing when there is nothing pending', async () => {
      await useProgressStore.getState().flushPendingSaves()

      expect(saveProgress).not.toHaveBeenCalled()
    })
  })

  describe('loadAllProgress', () => {
    it('indexes the returned metadata by mangaId', async () => {
      getAllProgress.mockResolvedValue({
        success: true,
        data: [
          { mangaId: 'manga-1', title: 'A' },
          { mangaId: 'manga-2', title: 'B' }
        ]
      })

      await useProgressStore.getState().loadAllProgress()

      const map = useProgressStore.getState().progressMetadataMap
      expect(map.get('manga-1')).toEqual({ mangaId: 'manga-1', title: 'A' })
      expect(map.get('manga-2')).toEqual({ mangaId: 'manga-2', title: 'B' })
    })
  })

  describe('loadStatistics', () => {
    it('populates statistics on success', async () => {
      getStatistics.mockResolvedValue({ success: true, data: { totalMangaRead: 5 } })

      await useProgressStore.getState().loadStatistics()

      expect(useProgressStore.getState().statistics).toEqual({ totalMangaRead: 5 })
    })
  })

  describe('deleteProgress', () => {
    it('optimistically removes the manga and shows a success toast', async () => {
      useProgressStore.setState({
        progressMap: new Map([['manga-1', { mangaId: 'manga-1' }]]) as never
      })
      deleteProgress.mockResolvedValue({ success: true })

      await useProgressStore.getState().deleteProgress('manga-1')

      expect(useProgressStore.getState().progressMap.has('manga-1')).toBe(false)
      expect(useToastStore.getState().toasts).toEqual([
        expect.objectContaining({ variant: 'success', title: 'Progress deleted' })
      ])
    })

    it('rolls back the optimistic removal and shows an error toast on failure', async () => {
      const entry = { mangaId: 'manga-1', currentPage: 3 }
      useProgressStore.setState({ progressMap: new Map([['manga-1', entry]]) as never })
      deleteProgress.mockResolvedValue({ success: false, error: { message: 'locked' } })

      await useProgressStore.getState().deleteProgress('manga-1')

      expect(useProgressStore.getState().progressMap.get('manga-1')).toEqual(entry)
      expect(useToastStore.getState().toasts).toEqual([
        expect.objectContaining({ variant: 'error', title: 'Failed to delete progress' })
      ])
    })
  })

  describe('toggleIncognito', () => {
    it('flips autoSaveEnabled and tells the menu the inverse isIncognito flag', async () => {
      expect(useProgressStore.getState().autoSaveEnabled).toBe(true)

      await useProgressStore.getState().toggleIncognito()

      expect(useProgressStore.getState().autoSaveEnabled).toBe(false)
      expect(updateMenuState).toHaveBeenCalledWith({ isIncognito: true })

      await useProgressStore.getState().toggleIncognito()

      expect(useProgressStore.getState().autoSaveEnabled).toBe(true)
      expect(updateMenuState).toHaveBeenLastCalledWith({ isIncognito: false })
    })
  })

  describe('clearError', () => {
    it('resets the error field to null', async () => {
      getStatistics.mockRejectedValue(new Error('boom'))
      await useProgressStore.getState().loadStatistics()
      expect(useProgressStore.getState().error).not.toBeNull()

      useProgressStore.getState().clearError()

      expect(useProgressStore.getState().error).toBeNull()
    })
  })
})
