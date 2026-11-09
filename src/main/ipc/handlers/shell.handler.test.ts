import { ipcMain, IpcMainInvokeEvent, shell } from 'electron'
import { registerShellHandlers } from './shell.handler'

vi.mock('electron', () => ({
  ipcMain: { handle: vi.fn() },
  shell: { openExternal: vi.fn() }
}))

vi.mock('../../services/logging/main-logging.service', () => ({
  mainLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
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

describe('shell.handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    registerShellHandlers()
  })

  describe('shell:open-external', () => {
    it.each(['http://example.com', 'https://example.com', 'mailto:support@example.com'])(
      'opens an allowed protocol (%s)',
      async (url) => {
        await getRegisteredHandler('shell:open-external')(EVENT, url)

        expect(shell.openExternal).toHaveBeenCalledWith(url)
      }
    )

    it.each([
      ['file:///etc/passwd', 'file:', 'a file:// URL'],
      ['javascript:alert(1)', 'javascript:', 'a javascript: URL'],
      ['ftp://example.com/file', 'ftp:', 'an ftp: URL'],
      ['app://malicious', 'app:', 'a custom app: protocol']
    ])('rejects %s (%s) without opening it', async (url, protocol) => {
      const response = await getRegisteredHandler('shell:open-external')(EVENT, url)

      expect(response).toEqual({
        success: false,
        error: expect.objectContaining({ message: `Protocol ${protocol} is not allowed` })
      })
      expect(shell.openExternal).not.toHaveBeenCalled()
    })

    it('rejects a malformed URL', async () => {
      const response = await getRegisteredHandler('shell:open-external')(EVENT, 'not a url')

      expect(response).toEqual({
        success: false,
        error: expect.objectContaining({ message: expect.stringContaining('Invalid URL') })
      })
      expect(shell.openExternal).not.toHaveBeenCalled()
    })

    it('rejects a non-string url', async () => {
      const response = await getRegisteredHandler('shell:open-external')(EVENT, 42)

      expect(response).toEqual({
        success: false,
        error: expect.objectContaining({ name: 'TypeError' })
      })
      expect(shell.openExternal).not.toHaveBeenCalled()
    })
  })
})
