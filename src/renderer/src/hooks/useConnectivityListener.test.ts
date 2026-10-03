import { renderHook } from '@testing-library/react'
import { useConnectivityListener } from './useConnectivityListener'
import { useConnectivityStore } from '@renderer/stores/connectivityStore'

const INITIAL_STATE = useConnectivityStore.getState()

const onConnectivityToggle = vi.fn()
const removeListener = vi.fn()
const updateMenuState = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  useConnectivityStore.setState(INITIAL_STATE, true)
  globalThis.api = {
    onConnectivityToggle,
    updateMenuState
  } as unknown as typeof globalThis.api
  onConnectivityToggle.mockReturnValue(removeListener)
})

it('registers the toggle listener on mount', () => {
  renderHook(() => useConnectivityListener())

  expect(onConnectivityToggle).toHaveBeenCalledWith(expect.any(Function))
})

it('toggles offline mode when the menu event fires', () => {
  renderHook(() => useConnectivityListener())
  expect(useConnectivityStore.getState().isOnline).toBe(true)

  const handler = onConnectivityToggle.mock.calls[0][0] as () => void
  handler()

  expect(useConnectivityStore.getState().isOnline).toBe(false)
})

it('cleans up the listener on unmount', () => {
  const { unmount } = renderHook(() => useConnectivityListener())
  expect(removeListener).not.toHaveBeenCalled()

  unmount()

  expect(removeListener).toHaveBeenCalled()
})
