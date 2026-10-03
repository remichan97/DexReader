import { renderHook, waitFor } from '@testing-library/react'
import { useStartupRoute } from './useStartupRoute'
import { StartupPage } from '@shared/enums/settings/startup-page.enum'

vi.mock('@renderer/services/logging.service', () => ({
  rendererLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))

const load = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  globalThis.settings = { load } as unknown as typeof globalThis.settings
})

it('returns null while the preference is still loading', () => {
  load.mockReturnValue(new Promise(() => {}))

  const { result } = renderHook(() => useStartupRoute())

  expect(result.current).toBeNull()
})

it.each([
  [StartupPage.Library, '/library'],
  [StartupPage.Downloads, '/downloads'],
  [StartupPage.Browse, '/browse']
])('maps startupPage %s to %s', async (startupPage, route) => {
  load.mockResolvedValue({ success: true, data: { appearance: { startupPage } } })

  const { result } = renderHook(() => useStartupRoute())

  await waitFor(() => expect(result.current).toBe(route))
})

it('defaults to /browse for an unrecognised startupPage value', async () => {
  load.mockResolvedValue({
    success: true,
    data: { appearance: { startupPage: 'bogus' } }
  })

  const { result } = renderHook(() => useStartupRoute())

  await waitFor(() => expect(result.current).toBe('/browse'))
})

it('falls back to /browse when settings load fails', async () => {
  load.mockResolvedValue({ success: false })

  const { result } = renderHook(() => useStartupRoute())

  await waitFor(() => expect(result.current).toBe('/browse'))
})

it('falls back to /browse when settings.load rejects', async () => {
  load.mockRejectedValue(new Error('IPC crashed'))

  const { result } = renderHook(() => useStartupRoute())

  await waitFor(() => expect(result.current).toBe('/browse'))
})
