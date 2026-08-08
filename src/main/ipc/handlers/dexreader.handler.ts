import { dexreaderExportService } from '../../services/dexreader/dexreader-export.service'
import { dexreaderImportService } from '../../services/dexreader/dexreader-import.service'
import { DexreaderExportCommand } from '@shared/commands/services/dexreader-export.command'
import { wrapIpcHandler } from '../wrap-handler'
import { mainLog } from '../../services/logging/main-logging.service'

export function registerDexReaderHandler(): void {
  /**
   * Export DexReader library to backup file.
   *
   * Creates a .dexreader backup file containing favorites, collections, reading progress,
   * and optionally downloaded chapters. Uses protobuf format for compact, efficient storage.
   * Backup can be restored to same or different DexReader installation.
   *
   * @param savePath - Absolute path where backup file will be saved (must end with .dexreader)
   * @param options - Export configuration with boolean flags for what to include
   * @param options.includeFavorites - Include favorited manga (default: true)
   * @param options.includeCollections - Include collections and their manga (default: true)
   * @param options.includeProgress - Include reading progress (default: true)
   * @param options.includeDownloads - Include downloaded chapter metadata (default: false, files not copied)
   * @returns Promise<{success: boolean, mangaCount: number, collectionsCount: number}> - Export result summary
   * @throws {TypeError} - If savePath is invalid or doesn't have .dexreader extension
   * @throws {Error} - If export operation fails
   *
   * @example
   * // Full library backup
   * const result = await window.api.exportDexReaderBackup(
   *   'C:\\...\\Documents\\my-library-2026.dexreader',
   *   {
   *     includeFavorites: true,
   *     includeCollections: true,
   *     includeProgress: true,
   *     includeDownloads: false
   *   }
   * )
   * console.log(`Backed up ${result.mangaCount} manga`)
   */
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

    const exportOptions = options as DexreaderExportCommand
    mainLog.debug('[DexReader] Export options:', exportOptions)

    const result = await dexreaderExportService.exportLibrary(savePath, exportOptions)
    mainLog.info('[DexReader] Export completed successfully')
    return result
  })

  /**
   * Import DexReader library from backup file.
   *
   * Restores favorites, collections, and reading progress from a .dexreader backup file.
   * Merge strategy: Adds new entries without removing existing data. Duplicates are skipped.
   * Progress emitted via IPC events for UI feedback.
   *
   * @param filePath - Absolute path to .dexreader backup file
   * @returns Promise<{success: boolean, mangaImported: number, collectionsImported: number, progressImported: number}> - Import result summary
   * @throws {TypeError} - If filePath is invalid or doesn't have .dexreader extension
   * @throws {Error} - If backup file is corrupted or import fails
   *
   * @example
   * // Restore from backup
   * const result = await window.api.importDexReaderBackup(
   *   'C:\\...\\Documents\\my-library-2026.dexreader'
   * )
   * console.log(`Imported ${result.mangaImported} manga`)
   */
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

  /**
   * Cancel ongoing DexReader import operation.
   *
   * Stops import in progress. Partially imported data remains in database (not rolled back).
   * Safe to call even if no import is running.
   *
   * @returns Promise<void>
   *
   * @example
   * // Cancel import on user request
   * await window.api.cancelDexReaderImport()
   */
  wrapIpcHandler('dexreader:cancel-import', async () => {
    mainLog.info('[DexReader] Import cancellation requested')
    dexreaderImportService.cancelImport()
  })
}
