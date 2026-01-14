import { mihonBackupService } from '../../services/mihon/mihon-backup.service'
import { wrapIpcHandler } from '../wrapHandler'

export function registerMihonHandlers(): void {
  wrapIpcHandler('mihon:import-backup', async (_, filePath: unknown) => {
    if (typeof filePath !== 'string') {
      throw new TypeError('Invalid file path')
    }

    if (!filePath.endsWith('.tachibk') && !filePath.endsWith('.proto.gz')) {
      throw new Error("Selected file isn't a valid Tachiyomi/Mihon backup file")
    }

    return await mihonBackupService.importFromBackup(filePath)
  })

  wrapIpcHandler('mihon:cancel-import', async () => {
    mihonBackupService.cancelImport()
  })
}
