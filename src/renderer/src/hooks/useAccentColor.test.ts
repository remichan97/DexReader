import { renderHook, waitFor } from '@testing-library/react'
import { useAccentColor } from './useAccentColor'

vi.mock('@renderer/services/logging.service', () => ({
  rendererLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))

const getSystemAccentColor = vi.fn()
const onAccentColorChanged = vi.fn()
const getAllowedPaths = vi.fn()
const readFile = vi.fn()
const removeAccentListener = vi.fn()

function accentVar(name: string): string {
  return document.documentElement.style.getPropertyValue(name)
}

beforeEach(() => {
  vi.clearAllMocks()
  document.documentElement.style.cssText = ''
  globalThis.api = {
    getSystemAccentColor,
    onAccentColorChanged
  } as unknown as typeof globalThis.api
  globalThis.fileSystem = {
    getAllowedPaths,
    readFile
  } as unknown as typeof globalThis.fileSystem

  getSystemAccentColor.mockResolvedValue({ success: true, data: '#336699' })
  getAllowedPaths.mockResolvedValue({ success: true, data: { appData: '/appdata' } })
  readFile.mockResolvedValue({ success: false })
  onAccentColorChanged.mockReturnValue(removeAccentListener)
})

it('applies the system accent color when there is no settings file', async () => {
  renderHook(() => useAccentColor())

  await waitFor(() => expect(accentVar('--win-accent')).toBe('#336699'))
})

it('applies a custom accent color from settings.json when present', async () => {
  readFile.mockResolvedValue({
    success: true,
    data: JSON.stringify({ accentColor: '#ff0000' })
  })

  renderHook(() => useAccentColor())

  await waitFor(() => expect(accentVar('--win-accent')).toBe('#ff0000'))
})

it('falls back to the system color when settings.json has no accentColor', async () => {
  readFile.mockResolvedValue({ success: true, data: JSON.stringify({}) })

  renderHook(() => useAccentColor())

  await waitFor(() => expect(accentVar('--win-accent')).toBe('#336699'))
})

it('falls back to the default color when fetching the system accent color fails', async () => {
  getSystemAccentColor.mockResolvedValue({ success: false })

  renderHook(() => useAccentColor())

  await waitFor(() => expect(accentVar('--win-accent')).toBe('#0078d4'))
})

it('falls back to the hardcoded default color when getAllowedPaths fails (not even the already-fetched system color)', async () => {
  getAllowedPaths.mockResolvedValue({ success: false })

  renderHook(() => useAccentColor())

  await waitFor(() => expect(accentVar('--win-accent')).toBe('#0078d4'))
})

it('uses white text on a dark accent color and black text on a light one', async () => {
  getSystemAccentColor.mockResolvedValue({ success: true, data: '#000000' })
  renderHook(() => useAccentColor())
  await waitFor(() => expect(accentVar('--win-text-on-accent')).toBe('#ffffff'))

  document.documentElement.style.cssText = ''
  getSystemAccentColor.mockResolvedValue({ success: true, data: '#ffffff' })
  renderHook(() => useAccentColor())
  await waitFor(() => expect(accentVar('--win-text-on-accent')).toBe('#000000'))
})

describe('system accent color change listener', () => {
  it('registers the listener and cleans it up on unmount', async () => {
    const { unmount } = renderHook(() => useAccentColor())
    await waitFor(() => expect(onAccentColorChanged).toHaveBeenCalledWith(expect.any(Function)))
    expect(removeAccentListener).not.toHaveBeenCalled()

    unmount()

    expect(removeAccentListener).toHaveBeenCalled()
  })

  it('applies a system color change while still using the system color', async () => {
    renderHook(() => useAccentColor())
    await waitFor(() => expect(onAccentColorChanged).toHaveBeenCalled())

    const handler = onAccentColorChanged.mock.calls[
      onAccentColorChanged.mock.calls.length - 1
    ][0] as (color: string) => void
    handler('#abcdef')

    await waitFor(() => expect(accentVar('--win-accent')).toBe('#abcdef'))
  })

  it('ignores a system color change once the user has a custom color', async () => {
    readFile.mockResolvedValue({ success: true, data: JSON.stringify({ accentColor: '#ff0000' }) })
    renderHook(() => useAccentColor())
    await waitFor(() => expect(accentVar('--win-accent')).toBe('#ff0000'))
    await waitFor(() => expect(onAccentColorChanged).toHaveBeenCalled())

    const handler = onAccentColorChanged.mock.calls[
      onAccentColorChanged.mock.calls.length - 1
    ][0] as (color: string) => void
    handler('#abcdef')

    expect(accentVar('--win-accent')).toBe('#ff0000')
  })
})
