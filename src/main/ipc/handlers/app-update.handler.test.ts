import { ipcMain, IpcMainInvokeEvent } from 'electron'
import { appUpdateService } from '../../services/app-update.service'
import { registerAppUpdateHandler } from './app-update.handler'

vi.mock('electron', () => ({
  ipcMain: { handle: vi.fn() }
}))

vi.mock('../../services/logging/main-logging.service', () => ({
  mainLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))

vi.mock('../../services/app-update.service', () => ({
  appUpdateService: {
    checkForUpdates: vi.fn(),
    downloadUpdate: vi.fn(),
    exitAndInstall: vi.fn(),
    getAppVersion: vi.fn()
  }
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

describe('app-update.handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    registerAppUpdateHandler()
  })

  describe('app-update:check', () => {
    it.each([true, false])('forwards an explicit manual flag (%s) unchanged', async (manual) => {
      await getRegisteredHandler('app-update:check')(EVENT, manual)

      expect(appUpdateService.checkForUpdates).toHaveBeenCalledWith(manual)
    })

    it('coerces a non-boolean manual flag to false rather than rejecting', async () => {
      await getRegisteredHandler('app-update:check')(EVENT, 'yes')

      expect(appUpdateService.checkForUpdates).toHaveBeenCalledWith(false)
    })

    it('coerces a missing manual flag to false', async () => {
      await getRegisteredHandler('app-update:check')(EVENT, undefined)

      expect(appUpdateService.checkForUpdates).toHaveBeenCalledWith(false)
    })
  })

  describe('app-update:download', () => {
    it('calls appUpdateService.downloadUpdate()', async () => {
      await getRegisteredHandler('app-update:download')(EVENT)

      expect(appUpdateService.downloadUpdate).toHaveBeenCalled()
    })
  })

  describe('app-update:install', () => {
    it('calls appUpdateService.exitAndInstall()', async () => {
      await getRegisteredHandler('app-update:install')(EVENT)

      expect(appUpdateService.exitAndInstall).toHaveBeenCalled()
    })
  })

  describe('app-update:version', () => {
    it('returns appUpdateService.getAppVersion() unchanged', async () => {
      vi.mocked(appUpdateService.getAppVersion).mockReturnValue('1.14.0')

      await expect(getRegisteredHandler('app-update:version')(EVENT)).resolves.toEqual({
        success: true,
        data: '1.14.0'
      })
    })
  })
})
