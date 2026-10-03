import { ipcMain, IpcMainInvokeEvent } from 'electron'
import { mihonBackupService } from '../../services/mihon/mihon-backup.service'
import { mihonExportService } from '../../services/mihon/mihon-export.service'
import { registerMihonHandlers } from './mihon.handler'

vi.mock('electron', () => ({
  ipcMain: { handle: vi.fn() }
}))

vi.mock('../../services/logging/main-logging.service', () => ({
  mainLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))

vi.mock('../../services/mihon/mihon-backup.service', () => ({
  mihonBackupService: { importFromBackup: vi.fn(), cancelImport: vi.fn() }
}))

vi.mock('../../services/mihon/mihon-export.service', () => ({
  mihonExportService: { exportMihonData: vi.fn() }
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

describe('mihon.handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    registerMihonHandlers()
  })

  describe('mihon:import-backup', () => {
    it.each(['/backups/library.tachibk', '/backups/library.proto.gz'])(
      'forwards a valid backup path (%s) to mihonBackupService.importFromBackup',
      async (filePath) => {
        vi.mocked(mihonBackupService.importFromBackup).mockResolvedValue({
          mangaImported: 5
        } as never)

        await expect(getRegisteredHandler('mihon:import-backup')(EVENT, filePath)).resolves.toEqual(
          { success: true, data: { mangaImported: 5 } }
        )
        expect(mihonBackupService.importFromBackup).toHaveBeenCalledWith(filePath)
      }
    )

    it('rejects a non-string file path', async () => {
      const response = await getRegisteredHandler('mihon:import-backup')(EVENT, 42)

      expect(response).toEqual({
        success: false,
        error: expect.objectContaining({ name: 'TypeError', message: 'Invalid file path' })
      })
      expect(mihonBackupService.importFromBackup).not.toHaveBeenCalled()
    })

    it('rejects a file without a .tachibk or .proto.gz extension', async () => {
      const response = await getRegisteredHandler('mihon:import-backup')(
        EVENT,
        '/backups/library.zip'
      )

      expect(response).toEqual({
        success: false,
        error: expect.objectContaining({
          message: "Selected file isn't a valid Tachiyomi/Mihon backup file"
        })
      })
      expect(mihonBackupService.importFromBackup).not.toHaveBeenCalled()
    })

    it('propagates a corrupted-backup failure as { success: false, error }', async () => {
      vi.mocked(mihonBackupService.importFromBackup).mockRejectedValue(
        new Error('corrupted backup')
      )

      const response = await getRegisteredHandler('mihon:import-backup')(
        EVENT,
        '/backups/library.tachibk'
      )

      expect(response).toEqual({
        success: false,
        error: expect.objectContaining({ message: 'corrupted backup' })
      })
    })
  })

  describe('mihon:cancel-import', () => {
    it('calls mihonBackupService.cancelImport()', async () => {
      await getRegisteredHandler('mihon:cancel-import')(EVENT)

      expect(mihonBackupService.cancelImport).toHaveBeenCalled()
    })
  })

  describe('mihon:export-backup', () => {
    it('forwards a valid save path to mihonExportService.exportMihonData', async () => {
      vi.mocked(mihonExportService.exportMihonData).mockResolvedValue({
        mangaExported: 12
      } as never)

      await expect(
        getRegisteredHandler('mihon:export-backup')(EVENT, '/backups/dexreader.tachibk')
      ).resolves.toEqual({ success: true, data: { mangaExported: 12 } })
      expect(mihonExportService.exportMihonData).toHaveBeenCalledWith('/backups/dexreader.tachibk')
    })

    it('rejects a non-string save path', async () => {
      const response = await getRegisteredHandler('mihon:export-backup')(EVENT, 42)

      expect(response).toEqual({
        success: false,
        error: expect.objectContaining({ name: 'TypeError', message: 'Invalid save path' })
      })
      expect(mihonExportService.exportMihonData).not.toHaveBeenCalled()
    })
  })
})
