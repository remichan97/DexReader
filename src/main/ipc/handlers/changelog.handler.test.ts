import { ipcMain, IpcMainInvokeEvent } from 'electron'
import { ChangelogCategory } from '@shared/enums/changelog/changelog-category.enum'
import { createChangelogWindow } from '../../changelog-window'
import { appUpdateService } from '../../services/app-update.service'
import { changelogService } from '../../services/changelog/changelog.service'
import { registerChangelogHandler } from './changelog.handler'

vi.mock('electron', () => ({
  ipcMain: { handle: vi.fn() }
}))

vi.mock('../../services/logging/main-logging.service', () => ({
  mainLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))

vi.mock('../../services/changelog/changelog.service', () => ({
  changelogService: { processChangelogText: vi.fn() }
}))

vi.mock('../../services/app-update.service', () => ({
  appUpdateService: { getAppVersion: vi.fn() }
}))

vi.mock('../../changelog-window', () => ({
  createChangelogWindow: vi.fn()
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

describe('changelog.handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    registerChangelogHandler()
  })

  it('registers the changelog:get and changelog:open channels', () => {
    expect(vi.mocked(ipcMain.handle).mock.calls.map(([channel]) => channel)).toEqual([
      'changelog:get',
      'changelog:open'
    ])
  })

  describe('changelog:get', () => {
    it('returns the parsed releases together with the installed version', async () => {
      const releases = [
        {
          version: '1.0.0',
          date: '2026-01-01',
          isYanked: false,
          sections: [{ category: ChangelogCategory.Added, items: ['Item'] }]
        }
      ]
      vi.mocked(changelogService.processChangelogText).mockReturnValue(releases)
      vi.mocked(appUpdateService.getAppVersion).mockReturnValue('1.0.0')

      await expect(getRegisteredHandler('changelog:get')(EVENT)).resolves.toEqual({
        success: true,
        data: { installedVersion: '1.0.0', releases }
      })
    })

    it('reports failure when parsing throws', async () => {
      vi.mocked(appUpdateService.getAppVersion).mockReturnValue('1.0.0')
      vi.mocked(changelogService.processChangelogText).mockImplementation(() => {
        throw new Error('parse failed')
      })

      await expect(getRegisteredHandler('changelog:get')(EVENT)).resolves.toEqual({
        success: false,
        error: expect.objectContaining({ message: 'parse failed' })
      })
    })
  })

  describe('changelog:open', () => {
    it('opens the changelog window', async () => {
      vi.mocked(createChangelogWindow).mockResolvedValue(undefined)

      await expect(getRegisteredHandler('changelog:open')(EVENT)).resolves.toEqual({
        success: true,
        data: undefined
      })
      expect(createChangelogWindow).toHaveBeenCalledOnce()
    })

    it('ignores anything the renderer sends along with the request', async () => {
      vi.mocked(createChangelogWindow).mockResolvedValue(undefined)

      await getRegisteredHandler('changelog:open')(EVENT, '1.0.0', { unexpected: true })

      expect(createChangelogWindow).toHaveBeenCalledExactlyOnceWith()
    })

    it('reports failure when the window cannot be created', async () => {
      vi.mocked(createChangelogWindow).mockRejectedValue(new Error('no display'))

      await expect(getRegisteredHandler('changelog:open')(EVENT)).resolves.toEqual({
        success: false,
        error: expect.objectContaining({ message: 'no display' })
      })
    })
  })
})
