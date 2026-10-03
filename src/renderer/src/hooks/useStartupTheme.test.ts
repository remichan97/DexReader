import { act, renderHook, waitFor } from '@testing-library/react'
import { useStartupTheme } from './useStartupTheme'
import { useAppStore } from '@renderer/stores/appStore'
import { useSidebarStore } from '@renderer/stores/sidebarStore'
import { AppTheme } from '@shared/enums/settings/theme-mode.enum'
import { SidebarSize } from '@shared/enums/settings/sidebar-size.enum'

vi.mock('@renderer/services/logging.service', () => ({
  rendererLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))

const APP_INITIAL_STATE = useAppStore.getState()
const SIDEBAR_INITIAL_STATE = useSidebarStore.getState()

const load = vi.fn()
const getTheme = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  useAppStore.setState(APP_INITIAL_STATE, true)
  useSidebarStore.setState(SIDEBAR_INITIAL_STATE, true)
  globalThis.settings = { load } as unknown as typeof globalThis.settings
  globalThis.api = { getTheme } as unknown as typeof globalThis.api
  load.mockResolvedValue({ success: false })
  getTheme.mockResolvedValue({ success: false })
})

it('applies the saved theme mode and sidebar size from settings', async () => {
  load.mockResolvedValue({
    success: true,
    data: { appearance: { theme: AppTheme.Dark, sidebarSize: SidebarSize.Compact } }
  })

  renderHook(() => useStartupTheme())

  await waitFor(() => expect(useAppStore.getState().themeMode).toBe(AppTheme.Dark))
  expect(useSidebarStore.getState().displayMode).toBe(SidebarSize.Compact)
})

it('applies the system theme from the OS', async () => {
  getTheme.mockResolvedValue({ success: true, data: 'dark' })

  renderHook(() => useStartupTheme())

  await waitFor(() => expect(useAppStore.getState().systemTheme).toBe('dark'))
})

it('leaves theme/sidebar state unchanged when settings load fails', async () => {
  renderHook(() => useStartupTheme())

  await waitFor(() => expect(load).toHaveBeenCalled())
  expect(useAppStore.getState().themeMode).toBe(APP_INITIAL_STATE.themeMode)
  expect(useSidebarStore.getState().displayMode).toBe(SIDEBAR_INITIAL_STATE.displayMode)
})

it('does not throw when settings.load rejects', async () => {
  load.mockRejectedValue(new Error('IPC crashed'))

  renderHook(() => useStartupTheme())

  await waitFor(() => expect(load).toHaveBeenCalled())
})

it('keeps document.documentElement.dataset.theme in sync with the resolved theme', () => {
  act(() => {
    useAppStore.setState({ theme: 'dark' })
  })

  renderHook(() => useStartupTheme())

  expect(document.documentElement.dataset.theme).toBe('dark')

  act(() => {
    useAppStore.setState({ theme: 'light' })
  })
  expect(document.documentElement.dataset.theme).toBe('light')
})
