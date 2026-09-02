import { act, renderHook } from '@testing-library/react'
import { useCollectionManager } from './useCollectionManager'

const showConfirmDialog = vi.fn()
const deleteCollection = vi.fn()
const showToast = vi.fn()

// A single stable object/array reference matters here: useCollectionManager's effect
// depends on `[collections]`, and real Zustand only returns a new reference when state
// actually changes. A mock that builds a fresh `{ collections: [] }` on every call gives
// a new array identity every render, so the effect never stops re-firing.
const collectionsState = {
  collections: [] as unknown[],
  createCollection: vi.fn(),
  updateCollection: vi.fn(),
  deleteCollection
}

vi.mock('@renderer/stores', () => ({
  useCollectionsStore: (selector?: (state: typeof collectionsState) => unknown) =>
    selector ? selector(collectionsState) : collectionsState,
  useToastStore: (selector: (state: { show: typeof showToast }) => unknown) =>
    selector({ show: showToast })
}))

vi.mock('@renderer/services/logging.service', () => ({
  rendererLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))

describe('useCollectionManager - handleDeleteCollection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // The real show-confirm-dialog channel goes through wrapIpcHandler and resolves
    // IpcResponse<boolean> at runtime; index.d.ts's Promise<boolean> signature for it
    // is stale (see the refactor plan's Phase 2 notes on the preload type contract),
    // so this cast reflects what the code under test actually receives.
    globalThis.api = { showConfirmDialog } as unknown as typeof globalThis.api
  })

  it('does not delete when the user declines the confirm dialog', async () => {
    showConfirmDialog.mockResolvedValue({ success: true, data: false })

    const { result } = renderHook(() => useCollectionManager())
    await act(async () => {
      await result.current.handleDeleteCollection(1, 'My Collection')
    })

    expect(deleteCollection).not.toHaveBeenCalled()
  })

  it('does not delete when the confirm dialog IPC call itself fails', async () => {
    showConfirmDialog.mockResolvedValue({ success: false, error: { message: 'dialog failed' } })

    const { result } = renderHook(() => useCollectionManager())
    await act(async () => {
      await result.current.handleDeleteCollection(1, 'My Collection')
    })

    expect(deleteCollection).not.toHaveBeenCalled()
  })

  it('deletes when the user confirms', async () => {
    showConfirmDialog.mockResolvedValue({ success: true, data: true })
    deleteCollection.mockResolvedValue(undefined)

    const { result } = renderHook(() => useCollectionManager())
    await act(async () => {
      await result.current.handleDeleteCollection(1, 'My Collection')
    })

    expect(deleteCollection).toHaveBeenCalledWith(1)
  })
})
