import { ipcMain, IpcMainInvokeEvent, shell } from 'electron'
import { logger } from '../../services/logging/logging.service'
import { rendererLog } from '../../services/logging/renderer-logging.service'
import { registerLoggerHandlers } from './logger.handler'

vi.mock('electron', () => ({
  ipcMain: { handle: vi.fn() },
  shell: { openPath: vi.fn() }
}))

vi.mock('../../services/logging/main-logging.service', () => ({
  mainLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))

vi.mock('../../services/logging/logging.service', () => ({
  logger: { cleanupLogs: vi.fn(), getLogFolder: vi.fn() }
}))

vi.mock('../../services/logging/renderer-logging.service', () => ({
  rendererLog: { info: vi.fn(), error: vi.fn(), debug: vi.fn(), warn: vi.fn() }
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

describe('logger.handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    registerLoggerHandlers()
  })

  it.each([
    ['log:info', 'info'],
    ['log:error', 'error'],
    ['log:debug', 'debug'],
    ['log:warn', 'warn']
  ] as const)(
    '%s stringifies the message and forwards extra args to rendererLog.%s',
    async (channel, method) => {
      await getRegisteredHandler(channel)(EVENT, 'User opened manga detail', { mangaId: 'manga-1' })

      expect(rendererLog[method]).toHaveBeenCalledWith('User opened manga detail', {
        mangaId: 'manga-1'
      })
    }
  )

  it.each([
    ['log:info', 'info'],
    ['log:error', 'error'],
    ['log:debug', 'debug'],
    ['log:warn', 'warn']
  ] as const)(
    '%s coerces a non-string message to a string before logging',
    async (channel, method) => {
      await getRegisteredHandler(channel)(EVENT, 42)

      expect(rendererLog[method]).toHaveBeenCalledWith('42')
    }
  )

  describe('log:cleanup', () => {
    it('forwards an explicit forceCleanup flag to logger.cleanupLogs', async () => {
      await getRegisteredHandler('log:cleanup')(EVENT, true)

      expect(logger.cleanupLogs).toHaveBeenCalledWith(true)
    })

    it('defaults forceCleanup to false when omitted', async () => {
      await getRegisteredHandler('log:cleanup')(EVENT)

      expect(logger.cleanupLogs).toHaveBeenCalledWith(false)
    })
  })

  describe('log:open-folder', () => {
    it('opens the log folder path returned by logger.getLogFolder', async () => {
      vi.mocked(logger.getLogFolder).mockReturnValue('/appdata/logs')
      vi.mocked(shell.openPath).mockResolvedValue('')

      await expect(getRegisteredHandler('log:open-folder')(EVENT)).resolves.toEqual({
        success: true,
        data: ''
      })
      expect(shell.openPath).toHaveBeenCalledWith('/appdata/logs')
    })
  })
})
