import { act, renderHook, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { useGatekeeperGuard } from './useGatekeeperGuard'

vi.mock('@renderer/services/logging.service', () => ({
  rendererLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))

const isEnabled = vi.fn()
const getRequireForSettings = vi.fn()
const onNavigate = vi.fn()
const removeNavigateListener = vi.fn()
const navigateMock = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => navigateMock }
})

function mountGatekeeperGuard(): ReturnType<
  typeof renderHook<ReturnType<typeof useGatekeeperGuard>, unknown>
> {
  return renderHook(() => useGatekeeperGuard(), { wrapper: MemoryRouter })
}

beforeEach(() => {
  vi.clearAllMocks()
  globalThis.gatekeeper = {
    isEnabled,
    getRequireForSettings
  } as unknown as typeof globalThis.gatekeeper
  globalThis.api = { onNavigate } as unknown as typeof globalThis.api
  onNavigate.mockReturnValue(removeNavigateListener)
  isEnabled.mockResolvedValue({ success: true, data: false })
  getRequireForSettings.mockResolvedValue({ success: true, data: false })
})

describe('lock status on mount', () => {
  it('locks when Gatekeeper is enabled', async () => {
    isEnabled.mockResolvedValue({ success: true, data: true })

    const { result } = mountGatekeeperGuard()

    await waitFor(() => expect(result.current.isCheckingLock).toBe(false))
    expect(result.current.isLocked).toBe(true)
  })

  it('does not lock when Gatekeeper is disabled', async () => {
    const { result } = mountGatekeeperGuard()

    await waitFor(() => expect(result.current.isCheckingLock).toBe(false))
    expect(result.current.isLocked).toBe(false)
  })

  it('stays unlocked and still settles isCheckingLock when the status check throws', async () => {
    isEnabled.mockRejectedValue(new Error('IPC crashed'))

    const { result } = mountGatekeeperGuard()

    await waitFor(() => expect(result.current.isCheckingLock).toBe(false))
    expect(result.current.isLocked).toBe(false)
  })
})

describe('menu navigation listener', () => {
  it('registers the guarded handler and cleans it up on unmount', () => {
    const { unmount } = mountGatekeeperGuard()

    expect(onNavigate).toHaveBeenCalledWith(expect.any(Function))
    expect(removeNavigateListener).not.toHaveBeenCalled()

    unmount()

    expect(removeNavigateListener).toHaveBeenCalled()
  })
})

describe('handleNavigate', () => {
  it('navigates directly for a non-settings route', async () => {
    const { result } = mountGatekeeperGuard()

    await act(async () => {
      await result.current.handleNavigate('/library')
    })

    expect(navigateMock).toHaveBeenCalledWith('/library')
    expect(result.current.showReauthModal).toBe(false)
  })

  it('shows the re-auth modal instead of navigating when Settings requires it', async () => {
    isEnabled.mockResolvedValue({ success: true, data: true })
    getRequireForSettings.mockResolvedValue({ success: true, data: true })
    const { result } = mountGatekeeperGuard()

    await act(async () => {
      await result.current.handleNavigate('/settings')
    })

    expect(result.current.showReauthModal).toBe(true)
    expect(navigateMock).not.toHaveBeenCalled()
  })
})

describe('handleReauthSuccess', () => {
  it('navigates to the pending route and hides the modal', async () => {
    isEnabled.mockResolvedValue({ success: true, data: true })
    getRequireForSettings.mockResolvedValue({ success: true, data: true })
    const { result } = mountGatekeeperGuard()
    await act(async () => {
      await result.current.handleNavigate('/settings')
    })

    act(() => {
      result.current.handleReauthSuccess()
    })

    expect(navigateMock).toHaveBeenCalledWith('/settings')
    expect(result.current.showReauthModal).toBe(false)
  })

  it('does nothing but hide the modal when there is no pending navigation', () => {
    const { result } = mountGatekeeperGuard()

    act(() => {
      result.current.handleReauthSuccess()
    })

    expect(navigateMock).not.toHaveBeenCalled()
    expect(result.current.showReauthModal).toBe(false)
  })
})

describe('handleReauthCancel', () => {
  it('clears the pending navigation and hides the modal without navigating', async () => {
    isEnabled.mockResolvedValue({ success: true, data: true })
    getRequireForSettings.mockResolvedValue({ success: true, data: true })
    const { result } = mountGatekeeperGuard()
    await act(async () => {
      await result.current.handleNavigate('/settings')
    })

    act(() => {
      result.current.handleReauthCancel()
    })

    expect(result.current.showReauthModal).toBe(false)
    expect(navigateMock).not.toHaveBeenCalled()

    // Confirms pendingNavigation was actually cleared, not just the modal hidden:
    // a subsequent success call has nothing left to navigate to.
    act(() => {
      result.current.handleReauthSuccess()
    })
    expect(navigateMock).not.toHaveBeenCalled()
  })
})

describe('unlock', () => {
  it('clears isLocked', async () => {
    isEnabled.mockResolvedValue({ success: true, data: true })
    const { result } = mountGatekeeperGuard()
    await waitFor(() => expect(result.current.isLocked).toBe(true))

    act(() => {
      result.current.unlock()
    })

    expect(result.current.isLocked).toBe(false)
  })
})
