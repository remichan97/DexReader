import { ipcMain, IpcMainEvent } from 'electron'
import { updateMenuState } from '../../menu/index'

vi.mock('electron', () => ({
  ipcMain: { on: vi.fn() }
}))

vi.mock('../../menu/index', () => ({
  updateMenuState: vi.fn()
}))

const EVENT = {} as IpcMainEvent

describe('menu.handler', () => {
  let registerMenuStateHandler: typeof import('./menu.handler').registerMenuStateHandler

  beforeEach(async () => {
    vi.clearAllMocks()
    // menuState is a module-level singleton the handler accumulates into, so each
    // test needs a fresh module instance to start from the { isIncognito: false } default.
    vi.resetModules()
    ;({ registerMenuStateHandler } = await import('./menu.handler'))
  })

  function getListener(): (event: IpcMainEvent, state: unknown) => void {
    const call = vi
      .mocked(ipcMain.on)
      .mock.calls.find(([channel]) => channel === 'update-menu-state')
    if (!call) {
      throw new Error('No listener registered for "update-menu-state"')
    }
    return call[1] as (event: IpcMainEvent, state: unknown) => void
  }

  it('registers a plain ipcMain.on listener (not a request/response handler)', () => {
    registerMenuStateHandler()

    expect(ipcMain.on).toHaveBeenCalledWith('update-menu-state', expect.any(Function))
  })

  it('pushes the merged state (starting from isIncognito: false) to updateMenuState', () => {
    registerMenuStateHandler()

    getListener()(EVENT, { isOffline: true })

    expect(updateMenuState).toHaveBeenCalledWith({ isIncognito: false, isOffline: true })
  })

  it('merges successive partial updates rather than replacing the whole state', () => {
    registerMenuStateHandler()
    const listener = getListener()

    listener(EVENT, { isOffline: true })
    listener(EVENT, { isIncognito: true })

    expect(updateMenuState).toHaveBeenLastCalledWith({
      isIncognito: true,
      isOffline: true
    })
  })

  it('lets a later update overwrite a field set by an earlier one', () => {
    registerMenuStateHandler()
    const listener = getListener()

    listener(EVENT, { isIncognito: true })
    listener(EVENT, { isIncognito: false })

    expect(updateMenuState).toHaveBeenLastCalledWith({ isIncognito: false })
  })
})
