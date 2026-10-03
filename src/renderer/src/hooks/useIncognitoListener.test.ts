import { renderHook } from '@testing-library/react'
import { useIncognitoListener } from './useIncognitoListener'
import { useProgressStore } from '@renderer/stores/progressStore'

const INITIAL_STATE = useProgressStore.getState()

const onIncognitoToggle = vi.fn()
const removeListener = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  useProgressStore.setState(INITIAL_STATE, true)
  globalThis.progress = { onIncognitoToggle } as unknown as typeof globalThis.progress
  onIncognitoToggle.mockReturnValue(removeListener)
})

it('registers the toggle listener on mount', () => {
  renderHook(() => useIncognitoListener())

  expect(onIncognitoToggle).toHaveBeenCalledWith(expect.any(Function))
})

it('toggles incognito mode when the menu event fires', () => {
  const toggleIncognito = vi.fn()
  useProgressStore.setState({ toggleIncognito })
  renderHook(() => useIncognitoListener())

  const handler = onIncognitoToggle.mock.calls[0][0] as () => void
  handler()

  expect(toggleIncognito).toHaveBeenCalled()
})

it('cleans up the listener on unmount', () => {
  const { unmount } = renderHook(() => useIncognitoListener())
  expect(removeListener).not.toHaveBeenCalled()

  unmount()

  expect(removeListener).toHaveBeenCalled()
})
