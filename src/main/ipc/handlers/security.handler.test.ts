import { ipcMain, IpcMainInvokeEvent } from 'electron'
import { getCspNonce } from '../../security/csp-nonce'
import { registerSecurityHandlers } from './security.handler'

vi.mock('electron', () => ({
  ipcMain: { handle: vi.fn() }
}))

vi.mock('../../services/logging/main-logging.service', () => ({
  mainLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))

vi.mock('../../security/csp-nonce', () => ({
  getCspNonce: vi.fn()
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

describe('security.handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    registerSecurityHandlers()
  })

  describe('security:get-csp-nonce', () => {
    it('returns getCspNonce() unchanged', async () => {
      vi.mocked(getCspNonce).mockReturnValue('abc123==')

      await expect(getRegisteredHandler('security:get-csp-nonce')(EVENT)).resolves.toEqual({
        success: true,
        data: 'abc123=='
      })
    })

    it('reports failure when the nonce has not been generated yet', async () => {
      vi.mocked(getCspNonce).mockImplementation(() => {
        throw new Error('CSP nonce has not been generated yet - call generateCspNonce() first')
      })

      const result = await getRegisteredHandler('security:get-csp-nonce')(EVENT)
      expect(result.success).toBe(false)
    })
  })
})
