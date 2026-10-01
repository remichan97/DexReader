import { ipcMain, IpcMainInvokeEvent } from 'electron'
import { readerSettingsRepo } from '../../database/repositories/reader-settings.repo'
import { settingsManager } from '../../settings/settings-manager'
import { registerReaderSettingsHandlers } from './reader-settings.handler'
import { ReadingMode } from '@shared/enums/settings/reading-mode.enum'

vi.mock('electron', () => ({
  ipcMain: { handle: vi.fn() }
}))

vi.mock('../../services/logging/main-logging.service', () => ({
  mainLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))

vi.mock('../../database/repositories/reader-settings.repo', () => ({
  readerSettingsRepo: {
    clearMangaOverride: vi.fn(),
    updateMangaOverride: vi.fn(),
    clearAllOverrides: vi.fn(),
    getAllOverridesWithMetadata: vi.fn()
  }
}))

vi.mock('../../settings/settings-manager', () => ({
  settingsManager: { getMangaReaderSettings: vi.fn() }
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
const GLOBAL_SETTINGS = { readingMode: ReadingMode.SinglePage }

describe('reader-settings.handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(settingsManager.getMangaReaderSettings).mockReturnValue(GLOBAL_SETTINGS as never)
    registerReaderSettingsHandlers()
  })

  describe('reader:get-manga-settings', () => {
    it('forwards the mangaId to settingsManager.getMangaReaderSettings', async () => {
      await expect(
        getRegisteredHandler('reader:get-manga-settings')(EVENT, 'manga-1')
      ).resolves.toEqual({ success: true, data: GLOBAL_SETTINGS })
      expect(settingsManager.getMangaReaderSettings).toHaveBeenCalledWith('manga-1')
    })
  })

  describe('reader:update-manga-settings', () => {
    it('clears the override instead of saving it when the new settings match global defaults', async () => {
      await getRegisteredHandler('reader:update-manga-settings')(EVENT, 'manga-1', GLOBAL_SETTINGS)

      expect(readerSettingsRepo.clearMangaOverride).toHaveBeenCalledWith('manga-1')
      expect(readerSettingsRepo.updateMangaOverride).not.toHaveBeenCalled()
    })

    it('saves a valid override that differs from global defaults', async () => {
      const newSettings = { readingMode: ReadingMode.VerticalScroll }

      await getRegisteredHandler('reader:update-manga-settings')(EVENT, 'manga-1', newSettings)

      expect(readerSettingsRepo.updateMangaOverride).toHaveBeenCalledWith({
        mangaId: 'manga-1',
        overrideData: newSettings
      })
      expect(readerSettingsRepo.clearMangaOverride).not.toHaveBeenCalled()
    })

    it('rejects settings with an invalid readingMode', async () => {
      const response = await getRegisteredHandler('reader:update-manga-settings')(
        EVENT,
        'manga-1',
        { readingMode: 'sideways' }
      )

      expect(response).toEqual({
        success: false,
        error: expect.objectContaining({ name: 'TypeError' })
      })
      expect(readerSettingsRepo.updateMangaOverride).not.toHaveBeenCalled()
    })
  })

  describe('reader:reset-manga-settings', () => {
    it('forwards the mangaId to readerSettingsRepo.clearMangaOverride', async () => {
      await getRegisteredHandler('reader:reset-manga-settings')(EVENT, 'manga-1')

      expect(readerSettingsRepo.clearMangaOverride).toHaveBeenCalledWith('manga-1')
    })
  })

  describe('reader:clear-all-overrides', () => {
    it('calls readerSettingsRepo.clearAllOverrides()', async () => {
      await getRegisteredHandler('reader:clear-all-overrides')(EVENT)

      expect(readerSettingsRepo.clearAllOverrides).toHaveBeenCalled()
    })
  })

  describe('reader:get-all-manga-overrides', () => {
    it('returns readerSettingsRepo.getAllOverridesWithMetadata() unchanged', async () => {
      vi.mocked(readerSettingsRepo.getAllOverridesWithMetadata).mockReturnValue([
        { mangaId: 'manga-1' }
      ] as never)

      await expect(getRegisteredHandler('reader:get-all-manga-overrides')(EVENT)).resolves.toEqual({
        success: true,
        data: [{ mangaId: 'manga-1' }]
      })
    })
  })
})
