import { refreshAfterImport } from './refreshAfterImport'
import { useCollectionsStore, useLibraryStore, useProgressStore } from '@renderer/stores'
import { useHistoryStore } from '@renderer/stores/historyStore'

const calls: string[] = []

const flushPendingSaves = vi.fn(async () => {
  calls.push('flushPendingSaves')
})
const reloadCachedProgress = vi.fn(async () => {
  calls.push('reloadCachedProgress')
})
const loadAllProgress = vi.fn(async () => {
  calls.push('loadAllProgress')
})
const loadFavourites = vi.fn(async () => {
  calls.push('loadFavourites')
})
const loadCollections = vi.fn(async () => {
  calls.push('loadCollections')
})
const loadRecentEvents = vi.fn(async () => {
  calls.push('loadRecentEvents')
})

const PROGRESS_INITIAL = useProgressStore.getState()
const LIBRARY_INITIAL = useLibraryStore.getState()
const COLLECTIONS_INITIAL = useCollectionsStore.getState()
const HISTORY_INITIAL = useHistoryStore.getState()

beforeEach(() => {
  calls.length = 0
  vi.clearAllMocks()
  useProgressStore.setState(
    { ...PROGRESS_INITIAL, flushPendingSaves, reloadCachedProgress, loadAllProgress },
    true
  )
  useLibraryStore.setState({ ...LIBRARY_INITIAL, loadFavourites }, true)
  useCollectionsStore.setState({ ...COLLECTIONS_INITIAL, loadCollections }, true)
  useHistoryStore.setState({ ...HISTORY_INITIAL, loadRecentEvents }, true)
})

afterAll(() => {
  useProgressStore.setState(PROGRESS_INITIAL, true)
  useLibraryStore.setState(LIBRARY_INITIAL, true)
  useCollectionsStore.setState(COLLECTIONS_INITIAL, true)
  useHistoryStore.setState(HISTORY_INITIAL, true)
})

describe('refreshAfterImport', () => {
  it('reloads every store that mirrors imported data', async () => {
    await refreshAfterImport()

    expect(loadFavourites).toHaveBeenCalledTimes(1)
    expect(loadCollections).toHaveBeenCalledTimes(1)
    expect(reloadCachedProgress).toHaveBeenCalledTimes(1)
    expect(loadAllProgress).toHaveBeenCalledTimes(1)
    expect(loadRecentEvents).toHaveBeenCalledTimes(1)
  })

  it('flushes pending progress saves before re-reading anything', async () => {
    await refreshAfterImport()

    expect(calls[0]).toBe('flushPendingSaves')
    expect(calls).toHaveLength(6)
  })
})
