import { ipcMain, IpcMainInvokeEvent } from 'electron'
import { dexreaderExportService } from '../../services/dexreader/dexreader-export.service'
import { dexreaderImportService } from '../../services/dexreader/dexreader-import.service'
import { registerDexReaderHandler } from './dexreader.handler'

vi.mock('electron', () => ({
  ipcMain: { handle: vi.fn() }
}))

vi.mock('../../services/logging/main-logging.service', () => ({
  mainLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))

vi.mock('../../services/dexreader/dexreader-export.service', () => ({
  dexreaderExportService: { exportLibrary: vi.fn() }
}))

vi.mock('../../services/dexreader/dexreader-import.service', () => ({
  dexreaderImportService: { importLibrary: vi.fn(), cancelImport: vi.fn() }
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

describe('dexreader.handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    registerDexReaderHandler()
  })

  describe('dexreader:export-data', () => {
    it('forwards a valid save path and options to dexreaderExportService.exportLibrary', async () => {
      vi.mocked(dexreaderExportService.exportLibrary).mockResolvedValue({
        success: true,
        mangaCount: 3
      } as never)
      const options = {
        includeCollections: true,
        includeProgress: true,
        includeReaderSettings: false
      }

      await expect(
        getRegisteredHandler('dexreader:export-data')(
          EVENT,
          'C:\\backups\\library.dexreader',
          options
        )
      ).resolves.toEqual({ success: true, data: { success: true, mangaCount: 3 } })
      expect(dexreaderExportService.exportLibrary).toHaveBeenCalledWith(
        'C:\\backups\\library.dexreader',
        options
      )
    })

    it('rejects a non-string save path', async () => {
      const response = await getRegisteredHandler('dexreader:export-data')(EVENT, 42, {})

      expect(response).toEqual({
        success: false,
        error: expect.objectContaining({ name: 'TypeError', message: 'Invalid save path' })
      })
      expect(dexreaderExportService.exportLibrary).not.toHaveBeenCalled()
    })

    it('rejects a save path without the .dexreader extension', async () => {
      const response = await getRegisteredHandler('dexreader:export-data')(
        EVENT,
        'C:\\backups\\library.zip',
        {}
      )

      expect(response).toEqual({
        success: false,
        error: expect.objectContaining({
          message: 'Save path must have a .dexreader extension'
        })
      })
      expect(dexreaderExportService.exportLibrary).not.toHaveBeenCalled()
    })

    it('rejects a non-object options value', async () => {
      const response = await getRegisteredHandler('dexreader:export-data')(
        EVENT,
        'C:\\backups\\library.dexreader',
        'not-an-object'
      )

      expect(response).toEqual({
        success: false,
        error: expect.objectContaining({ message: 'Invalid export options' })
      })
      expect(dexreaderExportService.exportLibrary).not.toHaveBeenCalled()
    })

    it('rejects a null options value', async () => {
      const response = await getRegisteredHandler('dexreader:export-data')(
        EVENT,
        'C:\\backups\\library.dexreader',
        null
      )

      expect(response.success).toBe(false)
      expect(dexreaderExportService.exportLibrary).not.toHaveBeenCalled()
    })
  })

  describe('dexreader:import-data', () => {
    it('forwards a valid file path to dexreaderImportService.importLibrary', async () => {
      vi.mocked(dexreaderImportService.importLibrary).mockResolvedValue({
        mangaImported: 10
      } as never)

      await expect(
        getRegisteredHandler('dexreader:import-data')(EVENT, 'C:\\backups\\library.dexreader')
      ).resolves.toEqual({ success: true, data: { mangaImported: 10 } })
      expect(dexreaderImportService.importLibrary).toHaveBeenCalledWith(
        'C:\\backups\\library.dexreader'
      )
    })

    it('rejects a non-string file path', async () => {
      const response = await getRegisteredHandler('dexreader:import-data')(EVENT, 42)

      expect(response).toEqual({
        success: false,
        error: expect.objectContaining({ name: 'TypeError', message: 'Invalid file path' })
      })
      expect(dexreaderImportService.importLibrary).not.toHaveBeenCalled()
    })

    it('rejects a file path without the .dexreader extension', async () => {
      const response = await getRegisteredHandler('dexreader:import-data')(
        EVENT,
        'C:\\backups\\library.zip'
      )

      expect(response).toEqual({
        success: false,
        error: expect.objectContaining({
          message: 'File path must have a .dexreader extension'
        })
      })
      expect(dexreaderImportService.importLibrary).not.toHaveBeenCalled()
    })

    it('propagates an import failure (e.g. a corrupted backup) as { success: false, error }', async () => {
      vi.mocked(dexreaderImportService.importLibrary).mockRejectedValue(
        new Error('corrupted backup file')
      )

      const response = await getRegisteredHandler('dexreader:import-data')(
        EVENT,
        'C:\\backups\\library.dexreader'
      )

      expect(response).toEqual({
        success: false,
        error: expect.objectContaining({ message: 'corrupted backup file' })
      })
    })
  })

  describe('dexreader:cancel-import', () => {
    it('calls dexreaderImportService.cancelImport()', async () => {
      await getRegisteredHandler('dexreader:cancel-import')(EVENT)

      expect(dexreaderImportService.cancelImport).toHaveBeenCalled()
    })
  })
})
