import { ipcMain, IpcMainInvokeEvent } from 'electron'
import { ChangelogCategory } from '@shared/enums/changelog/changelog-category.enum'
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

  it('registers the changelog:get channel', () => {
    expect(ipcMain.handle).toHaveBeenCalledExactlyOnceWith('changelog:get', expect.any(Function))
  })

  describe('changelog:get', () => {
    it('returns the parsed releases', async () => {
      const releases = [
        {
          version: '1.0.0',
          date: '2026-01-01',
          isYanked: false,
          sections: [{ category: ChangelogCategory.Added, items: ['Item'] }]
        }
      ]
      vi.mocked(changelogService.processChangelogText).mockReturnValue(releases)

      await expect(getRegisteredHandler('changelog:get')(EVENT)).resolves.toEqual({
        success: true,
        data: releases
      })
    })

    it('reports failure when parsing throws', async () => {
      vi.mocked(changelogService.processChangelogText).mockImplementation(() => {
        throw new Error('parse failed')
      })

      await expect(getRegisteredHandler('changelog:get')(EVENT)).resolves.toEqual({
        success: false,
        error: expect.objectContaining({ message: 'parse failed' })
      })
    })
  })
})
