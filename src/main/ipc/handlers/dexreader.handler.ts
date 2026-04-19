import { dexreaderExportService } from '../../services/dexreader/dexreader-export.service'
import { dexreaderImportService } from '../../services/dexreader/dexreader-import.service'
import { DexreaderExportOption } from '../../services/options/dexreader-export.option'
import { wrapIpcHandler } from '../wrap-handler'
import { mainLog } from '../../services/logging/main-logging.service'

export function registerDexReaderHandler(): void {
  wrapIpcHandler('dexreader:export-data', async (_, savePath: unknown, options: unknown) => {
    mainLog.info(`[DexReader] Export requested to: ${savePath}`)
    if (typeof savePath !== 'string') {
      mainLog.warn('[DexReader] Export failed: Invalid save path type')
      throw new TypeError('Invalid save path')
    }

    if (savePath.endsWith('.dexreader') === false) {
      mainLog.warn(`[DexReader] Export failed: Invalid extension for ${savePath}`)
      throw new TypeError('Save path must have a .dexreader extension')
    }

    if (typeof options !== 'object' || options === null) {
      mainLog.warn('[DexReader] Export failed: Invalid options')
      throw new TypeError('Invalid export options')
    }

    const exportOptions = options as DexreaderExportOption
    mainLog.debug('[DexReader] Export options:', exportOptions)

    const result = await dexreaderExportService.exportLibrary(savePath, exportOptions)
    mainLog.info('[DexReader] Export completed successfully')
    return result
  })

  wrapIpcHandler('dexreader:import-data', async (_, filePath: unknown) => {
    mainLog.info(`[DexReader] Import requested from: ${filePath}`)
    if (typeof filePath !== 'string') {
      mainLog.warn('[DexReader] Import failed: Invalid file path type')
      throw new TypeError('Invalid file path')
    }

    if (filePath.endsWith('.dexreader') === false) {
      mainLog.warn(`[DexReader] Import failed: Invalid extension for ${filePath}`)
      throw new TypeError('File path must have a .dexreader extension')
    }

    const result = await dexreaderImportService.importLibrary(filePath)
    mainLog.info('[DexReader] Import completed successfully')
    return result
  })

  wrapIpcHandler('dexreader:cancel-import', async () => {
    mainLog.info('[DexReader] Import cancellation requested')
    dexreaderImportService.cancelImport()
  })
}
