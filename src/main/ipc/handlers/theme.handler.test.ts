import { ipcMain, IpcMainInvokeEvent } from 'electron'
import { getCurrentTheme, getSystemAccentColor } from '../../theme'
import { registerThemeHandlers } from './theme.handler'

vi.mock('electron', () => ({
  ipcMain: { handle: vi.fn() }
}))

vi.mock('../../services/logging/main-logging.service', () => ({
  mainLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))

vi.mock('../../theme', () => ({
  getCurrentTheme: vi.fn(),
  getSystemAccentColor: vi.fn()
}))

type RegisteredHandler = (
  event: IpcMainInvokeEvent,
  ...args: unknown[]
) => Promise<{ success: boolean; data?: unknown; error?: unknown }>

function getRegisteredHandler(channel: string): RegisteredHandler {
  const call = vi
    .mocked(ipcMain.handle)
    .mock.calls.find(([registeredChannel]) => registeredChannel === channel)
  if (!call) {
    throw new Error(`No handler registered for channel "${channel}"`)
  }
  return call[1] as RegisteredHandler
}

const EVENT = {} as IpcMainInvokeEvent

describe('theme.handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    registerThemeHandlers()
  })

  describe('theme:get-system-accent-color', () => {
    it('returns getSystemAccentColor() unchanged', async () => {
      vi.mocked(getSystemAccentColor).mockResolvedValue('#0078D4')

      await expect(getRegisteredHandler('theme:get-system-accent-color')(EVENT)).resolves.toEqual({
        success: true,
        data: '#0078D4'
      })
    })
  })

  describe('get-theme', () => {
    it('returns getCurrentTheme() unchanged', async () => {
      vi.mocked(getCurrentTheme).mockReturnValue('dark')

      await expect(getRegisteredHandler('get-theme')(EVENT)).resolves.toEqual({
        success: true,
        data: 'dark'
      })
    })
  })
})
