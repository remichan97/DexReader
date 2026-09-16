import { ipcMain, IpcMainInvokeEvent } from 'electron'
import { mainLog } from '../services/logging/main-logging.service'
import { wrapIpcHandler } from './wrap-handler'

vi.mock('electron', () => ({
  ipcMain: { handle: vi.fn() }
}))

vi.mock('../services/logging/main-logging.service', () => ({
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

describe('wrapIpcHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('registers the handler under the given channel', () => {
    wrapIpcHandler('test:channel', vi.fn())

    expect(ipcMain.handle).toHaveBeenCalledWith('test:channel', expect.any(Function))
  })

  it('wraps a successful sync handler result in { success: true, data }', async () => {
    wrapIpcHandler('test:sync', () => 'ok')
    const handler = getRegisteredHandler('test:sync')

    await expect(handler({} as IpcMainInvokeEvent)).resolves.toEqual({
      success: true,
      data: 'ok'
    })
  })

  it('wraps a successful async handler result in { success: true, data }', async () => {
    wrapIpcHandler('test:async', async () => 'ok-async')
    const handler = getRegisteredHandler('test:async')

    await expect(handler({} as IpcMainInvokeEvent)).resolves.toEqual({
      success: true,
      data: 'ok-async'
    })
  })

  it('forwards the event and all arguments to the handler', async () => {
    const inner = vi.fn().mockResolvedValue(undefined)
    wrapIpcHandler('test:args', inner)
    const handler = getRegisteredHandler('test:args')
    const event = { sender: {} } as IpcMainInvokeEvent

    await handler(event, 'a', 42)

    expect(inner).toHaveBeenCalledWith(event, 'a', 42)
  })

  it('catches a thrown error, logs it against the channel, and returns { success: false, error }', async () => {
    wrapIpcHandler('test:throws', () => {
      throw new Error('boom')
    })
    const handler = getRegisteredHandler('test:throws')

    const response = await handler({} as IpcMainInvokeEvent)

    expect(response).toEqual({
      success: false,
      error: expect.objectContaining({ name: 'Error', message: 'boom' })
    })
    expect(mainLog.error).toHaveBeenCalledWith(
      expect.stringContaining('test:throws'),
      expect.any(Error)
    )
  })

  it('catches a rejected promise the same way as a synchronously thrown error', async () => {
    wrapIpcHandler('test:rejects', async () => {
      throw new Error('async boom')
    })
    const handler = getRegisteredHandler('test:rejects')

    const response = await handler({} as IpcMainInvokeEvent)

    expect(response).toEqual({
      success: false,
      error: expect.objectContaining({ message: 'async boom' })
    })
  })

  it('never lets the ipcMain.handle callback itself reject, even for a non-Error throw', async () => {
    wrapIpcHandler('test:non-error-throw', () => {
      throw 'not an Error instance'
    })
    const handler = getRegisteredHandler('test:non-error-throw')

    await expect(handler({} as IpcMainInvokeEvent)).resolves.toEqual({
      success: false,
      error: { name: 'UnknownError', message: 'not an Error instance' }
    })
  })
})
