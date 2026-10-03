import { renderHook } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useKeyboardShortcuts } from './useKeyboardShortcuts'
import { SecureNavigationContext } from '@renderer/hooks/useSecureNavigation'

const navigateMock = vi.fn()
const secureNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => navigateMock }
})

function Wrapper({ children }: { children: ReactNode }): ReactNode {
  return (
    <MemoryRouter>
      <SecureNavigationContext.Provider value={{ secureNavigate }}>
        {children}
      </SecureNavigationContext.Provider>
    </MemoryRouter>
  )
}

function dispatchKeyDown(init: KeyboardEventInit): void {
  globalThis.window.dispatchEvent(new KeyboardEvent('keydown', init))
}

beforeEach(() => {
  vi.clearAllMocks()
})

it.each([
  ['1', '/browse'],
  ['2', '/library'],
  ['3', '/downloads']
])('navigates to %s on Ctrl+%s', (key, route) => {
  renderHook(() => useKeyboardShortcuts(), { wrapper: Wrapper })

  dispatchKeyDown({ key, ctrlKey: true })

  expect(navigateMock).toHaveBeenCalledWith(route)
})

it('navigates with Cmd (metaKey) on macOS the same way', () => {
  renderHook(() => useKeyboardShortcuts(), { wrapper: Wrapper })

  dispatchKeyDown({ key: '1', metaKey: true })

  expect(navigateMock).toHaveBeenCalledWith('/browse')
})

it('does nothing without the Ctrl/Cmd modifier', () => {
  renderHook(() => useKeyboardShortcuts(), { wrapper: Wrapper })

  dispatchKeyDown({ key: '1' })

  expect(navigateMock).not.toHaveBeenCalled()
})

it('uses secureNavigate (gatekeeper-aware) for Ctrl+, to Settings', () => {
  renderHook(() => useKeyboardShortcuts(), { wrapper: Wrapper })

  dispatchKeyDown({ key: ',', ctrlKey: true })

  expect(secureNavigate).toHaveBeenCalledWith('/settings')
  expect(navigateMock).not.toHaveBeenCalled()
})

it('dispatches a show-keyboard-shortcuts event for Ctrl+/', () => {
  renderHook(() => useKeyboardShortcuts(), { wrapper: Wrapper })
  const listener = vi.fn()
  globalThis.window.addEventListener('show-keyboard-shortcuts', listener)

  dispatchKeyDown({ key: '/', ctrlKey: true })

  expect(listener).toHaveBeenCalled()
})

it('ignores an unrelated Ctrl-modified key', () => {
  renderHook(() => useKeyboardShortcuts(), { wrapper: Wrapper })

  dispatchKeyDown({ key: 'z', ctrlKey: true })

  expect(navigateMock).not.toHaveBeenCalled()
  expect(secureNavigate).not.toHaveBeenCalled()
})

it('removes the keydown listener on unmount', () => {
  const { unmount } = renderHook(() => useKeyboardShortcuts(), { wrapper: Wrapper })
  unmount()

  dispatchKeyDown({ key: '1', ctrlKey: true })

  expect(navigateMock).not.toHaveBeenCalled()
})
