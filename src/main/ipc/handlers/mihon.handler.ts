import { mihonBackupService } from '../../services/mihon/mihon-backup.service'
import { mihonExportService } from '../../services/mihon/mihon-export.service'
import { wrapIpcHandler } from '../wrap-handler'
import { mainLog } from '../../services/logging/main-logging.service'

export function registerMihonHandlers(): void {
  wrapIpcHandler('mihon:import-backup', async (_, filePath: unknown) => {
    mainLog.info(`[Mihon] Import requested from: ${filePath}`)
    if (typeof filePath !== 'string') {
      mainLog.warn('[Mihon] Import failed: Invalid file path type')
      throw new TypeError('Invalid file path')
    }

    if (!filePath.endsWith('.tachibk') && !filePath.endsWith('.proto.gz')) {
      mainLog.warn(`[Mihon] Import failed: Invalid file extension for ${filePath}`)
      throw new Error("Selected file isn't a valid Tachiyomi/Mihon backup file")
    }

    const result = await mihonBackupService.importFromBackup(filePath)
    mainLog.info('[Mihon] Import completed successfully')
    return result
  })

  wrapIpcHandler('mihon:cancel-import', async () => {
    mainLog.info('[Mihon] Import cancellation requested')
    mihonBackupService.cancelImport()
  })

  wrapIpcHandler('mihon:export-backup', async (_, savePath: unknown) => {
    mainLog.info(`[Mihon] Export requested to: ${savePath}`)
    if (typeof savePath !== 'string') {
      mainLog.warn('[Mihon] Export failed: Invalid save path type')
      throw new TypeError('Invalid save path')
    }

    const result = await mihonExportService.exportMihonData(savePath)
    mainLog.info('[Mihon] Export completed successfully')
    return result
  })
}
