import { ipcMain, IpcMainInvokeEvent } from 'electron'
import { gatekeeperService } from '../../services/gatekeeper.service'
import { registerGatekeeperHandlers } from './gatekeeper.handler'

vi.mock('electron', () => ({
  ipcMain: { handle: vi.fn() }
}))

vi.mock('../../services/logging/main-logging.service', () => ({
  mainLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))

vi.mock('../../services/gatekeeper.service', () => ({
  gatekeeperService: {
    isEnabled: vi.fn(),
    getRequireForSettings: vi.fn(),
    enable: vi.fn(),
    verify: vi.fn(),
    disable: vi.fn(),
    changePassphrase: vi.fn(),
    reset: vi.fn(),
    toggleRequiredForSettings: vi.fn()
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

describe('gatekeeper.handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    registerGatekeeperHandlers()
  })

  it('gatekeeper:available returns gatekeeperService.isEnabled()', async () => {
    vi.mocked(gatekeeperService.isEnabled).mockReturnValue(true)

    await expect(getRegisteredHandler('gatekeeper:available')(EVENT)).resolves.toEqual({
      success: true,
      data: true
    })
  })

  it('gatekeeper:getRequireForSettings returns gatekeeperService.getRequireForSettings()', async () => {
    vi.mocked(gatekeeperService.getRequireForSettings).mockReturnValue(false)

    await expect(getRegisteredHandler('gatekeeper:getRequireForSettings')(EVENT)).resolves.toEqual({
      success: true,
      data: false
    })
  })

  it.each([
    ['gatekeeper:enable', 'enable'],
    ['gatekeeper:verify', 'verify'],
    ['gatekeeper:disable', 'disable']
  ] as const)(
    '%s trims the passphrase before calling gatekeeperService.%s',
    async (channel, method) => {
      vi.mocked(gatekeeperService[method]).mockResolvedValue(true)

      await getRegisteredHandler(channel)(EVENT, '  hunter2  ')

      expect(gatekeeperService[method]).toHaveBeenCalledWith('hunter2')
    }
  )

  it('gatekeeper:update trims both passphrases before calling gatekeeperService.changePassphrase', async () => {
    vi.mocked(gatekeeperService.changePassphrase).mockResolvedValue(true)

    await getRegisteredHandler('gatekeeper:update')(EVENT, '  old  ', '  new  ')

    expect(gatekeeperService.changePassphrase).toHaveBeenCalledWith('old', 'new')
  })

  it.each([
    [true, true],
    [false, false],
    ['truthy-string', true],
    [0, false]
  ])(
    'gatekeeper:toggleRequireForSettings coerces %s to boolean %s before forwarding',
    async (input, expected) => {
      await getRegisteredHandler('gatekeeper:toggleRequireForSettings')(EVENT, input)

      expect(gatekeeperService.toggleRequiredForSettings).toHaveBeenCalledWith(expected)
    }
  )

  it('gatekeeper:reset calls gatekeeperService.reset() and always returns true', async () => {
    await expect(getRegisteredHandler('gatekeeper:reset')(EVENT)).resolves.toEqual({
      success: true,
      data: true
    })
    expect(gatekeeperService.reset).toHaveBeenCalled()
  })

  it('propagates a service rejection as { success: false, error }', async () => {
    vi.mocked(gatekeeperService.verify).mockRejectedValue(new Error('too many attempts'))

    const response = await getRegisteredHandler('gatekeeper:verify')(EVENT, 'hunter2')

    expect(response).toEqual({
      success: false,
      error: expect.objectContaining({ message: 'too many attempts' })
    })
  })
})
