import { ipcMain, IpcMainInvokeEvent } from 'electron'
import { searchPresetService } from '../../services/search-preset.service'
import { registerSearchPresetsHandler } from './search-presets.handler'
import { ContentRating, IncludedTagsMode, OrderDirection, OrderOptions } from '../../api/enums'

vi.mock('electron', () => ({
  ipcMain: { handle: vi.fn() }
}))

vi.mock('../../services/logging/main-logging.service', () => ({
  mainLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))

vi.mock('../../services/search-preset.service', () => ({
  searchPresetService: {
    getAllSearchPresets: vi.fn(),
    updateLastUsedAt: vi.fn(),
    deleteSearchPreset: vi.fn(),
    createSearchPreset: vi.fn()
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

function validFilters(): Record<string, unknown> {
  return {
    contentRating: [ContentRating.Safe],
    includedTagsMode: IncludedTagsMode.AND,
    availableTranslatedLanguages: ['en'],
    resultPerPage: 20,
    sortBy: OrderOptions.LatestUploadedChapter,
    sortDirection: OrderDirection.Desc
  }
}

describe('search-presets.handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    registerSearchPresetsHandler()
  })

  describe('search-presets:getAll', () => {
    it('returns searchPresetService.getAllSearchPresets() unchanged', async () => {
      vi.mocked(searchPresetService.getAllSearchPresets).mockReturnValue([
        { id: 1, name: 'Default' }
      ] as never)

      await expect(getRegisteredHandler('search-presets:getAll')(EVENT)).resolves.toEqual({
        success: true,
        data: [{ id: 1, name: 'Default' }]
      })
    })
  })

  describe('search-presets:updateLastUsedAt', () => {
    it('forwards a valid id to searchPresetService.updateLastUsedAt', async () => {
      await getRegisteredHandler('search-presets:updateLastUsedAt')(EVENT, 1)

      expect(searchPresetService.updateLastUsedAt).toHaveBeenCalledWith(1)
    })

    it('rejects a non-number id', async () => {
      const response = await getRegisteredHandler('search-presets:updateLastUsedAt')(EVENT, '1')

      expect(response).toEqual({
        success: false,
        error: expect.objectContaining({ name: 'TypeError' })
      })
      expect(searchPresetService.updateLastUsedAt).not.toHaveBeenCalled()
    })
  })

  describe('search-presets:delete', () => {
    it('forwards a valid id to searchPresetService.deleteSearchPreset', async () => {
      await getRegisteredHandler('search-presets:delete')(EVENT, 1)

      expect(searchPresetService.deleteSearchPreset).toHaveBeenCalledWith(1)
    })

    it('rejects a non-number id', async () => {
      const response = await getRegisteredHandler('search-presets:delete')(EVENT, '1')

      expect(response.success).toBe(false)
      expect(searchPresetService.deleteSearchPreset).not.toHaveBeenCalled()
    })
  })

  describe('search-presets:save', () => {
    it('forwards a valid command to searchPresetService.createSearchPreset', async () => {
      vi.mocked(searchPresetService.createSearchPreset).mockResolvedValue({
        id: 1,
        name: 'My Preset'
      } as never)
      const command = { name: 'My Preset', filters: validFilters() }

      await expect(getRegisteredHandler('search-presets:save')(EVENT, command)).resolves.toEqual({
        success: true,
        data: { id: 1, name: 'My Preset' }
      })
      expect(searchPresetService.createSearchPreset).toHaveBeenCalledWith(command)
    })

    it('rejects a command missing a name', async () => {
      const response = await getRegisteredHandler('search-presets:save')(EVENT, {
        filters: validFilters()
      })

      expect(response).toEqual({
        success: false,
        error: expect.objectContaining({ name: 'TypeError' })
      })
      expect(searchPresetService.createSearchPreset).not.toHaveBeenCalled()
    })

    it('rejects a command with invalid filters data', async () => {
      const response = await getRegisteredHandler('search-presets:save')(EVENT, {
        name: 'My Preset',
        filters: { ...validFilters(), resultPerPage: 7 }
      })

      expect(response.success).toBe(false)
      expect(searchPresetService.createSearchPreset).not.toHaveBeenCalled()
    })

    it('rejects a non-object value', async () => {
      const response = await getRegisteredHandler('search-presets:save')(EVENT, 'My Preset')

      expect(response.success).toBe(false)
      expect(searchPresetService.createSearchPreset).not.toHaveBeenCalled()
    })
  })
})
