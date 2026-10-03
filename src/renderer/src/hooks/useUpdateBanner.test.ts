import { act, renderHook, waitFor } from '@testing-library/react'
import { useUpdateBanner } from './useUpdateBanner'

vi.mock('@renderer/services/logging.service', () => ({
  rendererLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))

const getAppVersion = vi.fn()
const openSpy = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  globalThis.appUpdate = { getAppVersion } as unknown as typeof globalThis.appUpdate
  globalThis.open = openSpy
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
  it('opens the release notes page for the detected version and dismisses the banner', async () => {
    localStorage.setItem('dexreader:updateJustCompleted', 'true')
    localStorage.setItem('dexreader:newVersion', '1.15.0')
    const { result } = renderHook(() => useUpdateBanner())
    await waitFor(() => expect(result.current.showUpdateBanner).toBe(true))

    await act(async () => {
      await result.current.handleViewReleaseNotes()
    })

    expect(openSpy).toHaveBeenCalledWith(
      'https://github.com/remichan97/DexReader/releases/tag/v1.15.0',
      '_blank',
      'noopener,noreferrer'
    )
    expect(result.current.showUpdateBanner).toBe(false)
  })

  it('does not dismiss the banner when opening the release notes throws', async () => {
    localStorage.setItem('dexreader:updateJustCompleted', 'true')
    localStorage.setItem('dexreader:newVersion', '1.15.0')
    globalThis.open = vi.fn(() => {
      throw new Error('popup blocked')
    })
    const { result } = renderHook(() => useUpdateBanner())
    await waitFor(() => expect(result.current.showUpdateBanner).toBe(true))

    await act(async () => {
      await result.current.handleViewReleaseNotes()
    })

    expect(result.current.showUpdateBanner).toBe(true)
  })
})
