import { act, renderHook, waitFor } from '@testing-library/react'
import { useUpdateBanner } from './useUpdateBanner'

vi.mock('@renderer/services/logging.service', () => ({
  rendererLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))

const getAppVersion = vi.fn()
const openChangelog = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  globalThis.appUpdate = {
    getAppVersion,
    openChangelog
  } as unknown as typeof globalThis.appUpdate
  openChangelog.mockResolvedValue({ success: true, data: undefined })
})

it('does not show the banner when no update-completed flag is set', async () => {
  const { result } = renderHook(() => useUpdateBanner())

  await waitFor(() => expect(result.current.showUpdateBanner).toBe(false))
})

it('shows the banner using the version stored in localStorage, then clears the flags', async () => {
  localStorage.setItem('dexreader:updateJustCompleted', 'true')
  localStorage.setItem('dexreader:newVersion', '1.15.0')

  const { result } = renderHook(() => useUpdateBanner())

  await waitFor(() => expect(result.current.showUpdateBanner).toBe(true))
  expect(result.current.updateVersion).toBe('1.15.0')
  expect(localStorage.getItem('dexreader:updateJustCompleted')).toBeNull()
  expect(localStorage.getItem('dexreader:newVersion')).toBeNull()
  expect(getAppVersion).not.toHaveBeenCalled()
})

it('falls back to the app version via IPC when no version was stored', async () => {
  localStorage.setItem('dexreader:updateJustCompleted', 'true')
  getAppVersion.mockResolvedValue({ success: true, data: '1.15.0' })

  const { result } = renderHook(() => useUpdateBanner())

  await waitFor(() => expect(result.current.updateVersion).toBe('1.15.0'))
})

it('does not show the banner when the flag is any value other than "true"', async () => {
  localStorage.setItem('dexreader:updateJustCompleted', 'false')

  const { result } = renderHook(() => useUpdateBanner())

  // Only the 'true' flag value is ever handled - a falsy-but-present flag like 'false'
  // isn't cleared either, it's simply ignored. There's no other signal to await here.
  await act(async () => {})
  expect(result.current.showUpdateBanner).toBe(false)
  expect(localStorage.getItem('dexreader:updateJustCompleted')).toBe('false')
})

it('clears the flags even when checking throws', async () => {
  localStorage.setItem('dexreader:updateJustCompleted', 'true')
  // getItem resolves fine but getAppVersion rejects when no version was stored, exercising
  // the catch branch's own flag cleanup.
  getAppVersion.mockRejectedValue(new Error('IPC crashed'))

  const { result } = renderHook(() => useUpdateBanner())

  await waitFor(() => expect(result.current.showUpdateBanner).toBe(false))
  expect(localStorage.getItem('dexreader:updateJustCompleted')).toBeNull()
})

describe('handleDismissBanner', () => {
  it('hides the banner', async () => {
    localStorage.setItem('dexreader:updateJustCompleted', 'true')
    localStorage.setItem('dexreader:newVersion', '1.15.0')
    const { result } = renderHook(() => useUpdateBanner())
    await waitFor(() => expect(result.current.showUpdateBanner).toBe(true))

    act(() => {
      result.current.handleDismissBanner()
    })

    expect(result.current.showUpdateBanner).toBe(false)
  })
})

describe('handleViewReleaseNotes', () => {
  async function showBanner(): Promise<
    ReturnType<typeof renderHook<ReturnType<typeof useUpdateBanner>, unknown>>
  > {
    localStorage.setItem('dexreader:updateJustCompleted', 'true')
    localStorage.setItem('dexreader:newVersion', '1.15.0')
    const rendered = renderHook(() => useUpdateBanner())
    await waitFor(() => expect(rendered.result.current.showUpdateBanner).toBe(true))
    return rendered
  }

  it('opens the in-app changelog window, with no version, and dismisses the banner', async () => {
    const { result } = await showBanner()

    await act(async () => {
      await result.current.handleViewReleaseNotes()
    })

    expect(openChangelog).toHaveBeenCalledExactlyOnceWith()
    expect(result.current.showUpdateBanner).toBe(false)
  })

  it('no longer opens the GitHub release page itself', async () => {
    const openSpy = vi.fn()
    globalThis.open = openSpy
    const { result } = await showBanner()

    await act(async () => {
      await result.current.handleViewReleaseNotes()
    })

    expect(openSpy).not.toHaveBeenCalled()
  })

  it('does not dismiss the banner when main reports the window could not open', async () => {
    openChangelog.mockResolvedValue({ success: false, error: { message: 'no display' } })
    const { result } = await showBanner()

    await act(async () => {
      await result.current.handleViewReleaseNotes()
    })

    expect(result.current.showUpdateBanner).toBe(true)
  })

  it('does not dismiss the banner when the request itself throws', async () => {
    openChangelog.mockRejectedValue(new Error('channel closed'))
    const { result } = await showBanner()

    await act(async () => {
      await result.current.handleViewReleaseNotes()
    })

    expect(result.current.showUpdateBanner).toBe(true)
  })
})
