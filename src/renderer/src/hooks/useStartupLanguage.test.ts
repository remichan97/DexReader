import { renderHook, waitFor } from '@testing-library/react'
import { useStartupLanguage } from './useStartupLanguage'
import i18next from '@renderer/i18n/config'
import { DisplayLanguage } from '@shared/enums/settings/display-languages.enum'

vi.mock('@renderer/services/logging.service', () => ({
  rendererLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))

vi.mock('@renderer/i18n/config', () => ({
  default: { changeLanguage: vi.fn() }
}))

const load = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  globalThis.settings = { load } as unknown as typeof globalThis.settings
})

it('applies the saved display language on startup', async () => {
  load.mockResolvedValue({
    success: true,
    data: { language: { displayLanguage: DisplayLanguage.Vietnamese } }
  })

  renderHook(() => useStartupLanguage())

  await waitFor(() =>
    expect(i18next.changeLanguage).toHaveBeenCalledWith(DisplayLanguage.Vietnamese)
  )
})

it('does nothing when settings load fails', async () => {
  load.mockResolvedValue({ success: false })

  renderHook(() => useStartupLanguage())

  await waitFor(() => expect(load).toHaveBeenCalled())
  expect(i18next.changeLanguage).not.toHaveBeenCalled()
})

it('does nothing when there is no saved display language', async () => {
  load.mockResolvedValue({ success: true, data: { language: {} } })

  renderHook(() => useStartupLanguage())

  await waitFor(() => expect(load).toHaveBeenCalled())
  expect(i18next.changeLanguage).not.toHaveBeenCalled()
})

it('does not throw when settings.load rejects', async () => {
  load.mockRejectedValue(new Error('IPC crashed'))

  renderHook(() => useStartupLanguage())

  await waitFor(() => expect(load).toHaveBeenCalled())
  expect(i18next.changeLanguage).not.toHaveBeenCalled()
})
