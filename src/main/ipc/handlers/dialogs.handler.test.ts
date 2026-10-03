import { dialog, ipcMain, IpcMainInvokeEvent } from 'electron'
import { getMainWindow } from '../../window'
import { registerAdditionalDialogHandlers } from './dialogs.handler'

vi.mock('electron', () => ({
  ipcMain: { handle: vi.fn() },
  dialog: { showMessageBox: vi.fn() }
}))

vi.mock('../../services/logging/main-logging.service', () => ({
  mainLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))

vi.mock('../../window', () => ({
  getMainWindow: vi.fn()
}))

vi.mock('../../i18n/i18n.config', () => ({
  default: { t: vi.fn((key: string) => key) }
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
const FAKE_WINDOW = {} as Electron.BrowserWindow

describe('dialogs.handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    registerAdditionalDialogHandlers()
  })

  describe('show-confirm-dialog', () => {
    it('returns false immediately when there is no main window', async () => {
      vi.mocked(getMainWindow).mockReturnValue(undefined)

      await expect(
        getRegisteredHandler('show-confirm-dialog')(EVENT, 'Delete this manga?')
      ).resolves.toEqual({ success: true, data: false })
      expect(dialog.showMessageBox).not.toHaveBeenCalled()
    })

    it('returns true when the user clicks the confirm button (response index 1)', async () => {
      vi.mocked(getMainWindow).mockReturnValue(FAKE_WINDOW)
      vi.mocked(dialog.showMessageBox).mockResolvedValue({
        response: 1,
        checkboxChecked: false
      })

      await expect(
        getRegisteredHandler('show-confirm-dialog')(
          EVENT,
          'Delete this manga?',
          'This cannot be undone.',
          'Delete',
          'Cancel'
        )
      ).resolves.toEqual({ success: true, data: true })
      expect(dialog.showMessageBox).toHaveBeenCalledWith(
        FAKE_WINDOW,
        expect.objectContaining({
          buttons: ['Cancel', 'Delete'],
          message: 'Delete this manga?',
          detail: 'This cannot be undone.',
          defaultId: 1,
          cancelId: 0
        })
      )
    })

    it('returns false when the user cancels (response index 0)', async () => {
      vi.mocked(getMainWindow).mockReturnValue(FAKE_WINDOW)
      vi.mocked(dialog.showMessageBox).mockResolvedValue({
        response: 0,
        checkboxChecked: false
      })

      await expect(
        getRegisteredHandler('show-confirm-dialog')(EVENT, 'Delete this manga?')
      ).resolves.toEqual({ success: true, data: false })
    })

    it('falls back to translated button labels when none are provided', async () => {
      vi.mocked(getMainWindow).mockReturnValue(FAKE_WINDOW)
      vi.mocked(dialog.showMessageBox).mockResolvedValue({
        response: 0,
        checkboxChecked: false
      })

      await getRegisteredHandler('show-confirm-dialog')(EVENT, 'Delete this manga?')

      expect(dialog.showMessageBox).toHaveBeenCalledWith(
        FAKE_WINDOW,
        expect.objectContaining({
          buttons: ['common:button.cancel', 'common:button.ok']
        })
      )
    })
  })

  describe('show-dialog', () => {
    it('returns { response: -1, checkboxChecked: false } when there is no main window', async () => {
      vi.mocked(getMainWindow).mockReturnValue(undefined)

      await expect(
        getRegisteredHandler('show-dialog')(EVENT, { message: 'Continue?' })
      ).resolves.toEqual({ success: true, data: { response: -1, checkboxChecked: false } })
      expect(dialog.showMessageBox).not.toHaveBeenCalled()
    })

    it('forwards custom options and returns the response/checkbox state', async () => {
      vi.mocked(getMainWindow).mockReturnValue(FAKE_WINDOW)
      vi.mocked(dialog.showMessageBox).mockResolvedValue({
        response: 2,
        checkboxChecked: true
      })

      const options = {
        message: 'Update available',
        detail: 'Version 2.0 is ready.',
        buttons: ['Install', 'Later', 'Skip'],
        type: 'warning' as const,
        defaultId: 0,
        cancelId: 1,
        checkboxLabel: 'Auto-download updates',
        checkboxChecked: true
      }

      await expect(getRegisteredHandler('show-dialog')(EVENT, options)).resolves.toEqual({
        success: true,
        data: { response: 2, checkboxChecked: true }
      })
      expect(dialog.showMessageBox).toHaveBeenCalledWith(
        FAKE_WINDOW,
        expect.objectContaining({
          type: 'warning',
          buttons: ['Install', 'Later', 'Skip'],
          defaultId: 0,
          cancelId: 1,
          message: 'Update available',
          detail: 'Version 2.0 is ready.',
          checkboxLabel: 'Auto-download updates',
          checkboxChecked: true
        })
      )
    })

    it('applies defaults for an options object with only a message', async () => {
      vi.mocked(getMainWindow).mockReturnValue(FAKE_WINDOW)
      vi.mocked(dialog.showMessageBox).mockResolvedValue({
        response: 0,
        checkboxChecked: false
      })

      await getRegisteredHandler('show-dialog')(EVENT, { message: 'Continue?' })

      expect(dialog.showMessageBox).toHaveBeenCalledWith(
        FAKE_WINDOW,
        expect.objectContaining({
          type: 'question',
          buttons: ['common:button.ok', 'common:button.cancel'],
          defaultId: 0,
          cancelId: 0,
          noLink: false,
          checkboxChecked: false
        })
      )
    })
  })
})
