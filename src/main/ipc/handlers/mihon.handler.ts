import { mihonBackupService } from '../../services/mihon/mihon-backup.service'
import { mihonExportService } from '../../services/mihon/mihon-export.service'
import { wrapIpcHandler } from '../wrap-handler'
import { mainLog } from '../../services/logging/main-logging.service'
import { MihonImportOptionsContract } from '@shared/contracts/services/mihon/mihon-import-options.contract'

// Same shape the importer extracts from a MangaDex URL
const MANGA_ID_PATTERN = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i
const MAX_INCLUDED_MANGA = 5000

function parseImportOptions(value: unknown): MihonImportOptionsContract {
  if (value === undefined) return {}

  if (
    !Array.isArray(value) ||
    value.length > MAX_INCLUDED_MANGA ||
    !value.every((id) => typeof id === 'string' && MANGA_ID_PATTERN.test(id))
  ) {
    throw new TypeError('Invalid list of manga to add back')
  }

  return { includeMangaIds: value as string[] }
}

export function registerMihonHandlers(): void {
  /**
   * Import library from Mihon/Tachiyomi backup file.
   *
   * Restores favorites and reading progress from .tachibk or .proto.gz backup files
   * created by Mihon or Tachiyomi Android apps. Only MangaDex manga are imported
   * (other sources are skipped). Merge strategy: adds new entries without removing
   * existing data.
   *
   * @param filePath - Absolute path to backup file (.tachibk or .proto.gz)
   * @param includeMangaIds - Optional. Second pass over the same file: import only these
   *   other-language MangaDex titles (taken from the first pass's `skippedOtherLanguage`)
   * @returns Promise<{success: boolean, mangaImported: number, chaptersImported: number}> - Import result summary
   * @throws {TypeError} - If filePath is invalid
   * @throws {Error} - If file extension is incorrect or backup is corrupted
   *
   * @example
   * // Import from Mihon backup
   * const result = await window.api.importMihonBackup(
   *   'C:\\...\\Downloads\\tachiyomi_2026-04-20.tachibk'
   * )
   * console.log(`Imported ${result.mangaImported} MangaDex manga`)
   */
  wrapIpcHandler('mihon:import-backup', async (_, filePath: unknown, includeMangaIds: unknown) => {
    mainLog.info(`[Mihon] Import requested from: ${filePath}`)
    if (typeof filePath !== 'string') {
      mainLog.warn('[Mihon] Import failed: Invalid file path type')
      throw new TypeError('Invalid file path')
    }

    if (!filePath.endsWith('.tachibk') && !filePath.endsWith('.proto.gz')) {
      mainLog.warn(`[Mihon] Import failed: Invalid file extension for ${filePath}`)
      throw new Error("Selected file isn't a valid Tachiyomi/Mihon backup file")
    }

    const options = parseImportOptions(includeMangaIds)

    const result = await mihonBackupService.importFromBackup(filePath, options)
    mainLog.info('[Mihon] Import completed successfully')
    return result
  })

  /**
   * Cancel ongoing Mihon/Tachiyomi import operation.
   *
   * Stops import in progress. Partially imported data remains in database (not rolled back).
   * Safe to call even if no import is running.
   *
   * @returns Promise<void>
   *
   * @example
   * // Cancel import on user request
   * await window.api.cancelMihonImport()
   */
  wrapIpcHandler('mihon:cancel-import', async () => {
    mainLog.info('[Mihon] Import cancellation requested')
    mihonBackupService.cancelImport()
  })

  /**
   * Export library to Mihon/Tachiyomi compatible backup file.
   *
   * Creates a .tachibk backup file that can be imported into Mihon or Tachiyomi
   * Android apps. Includes favorites and reading progress for MangaDex manga only.
   * Useful for syncing library between DexReader desktop and Mihon/Tachiyomi mobile.
   *
   * @param savePath - Absolute path where backup file will be saved (should end with .tachibk)
   * @returns Promise<{success: boolean, mangaExported: number, chaptersExported: number}> - Export result summary
   * @throws {TypeError} - If savePath is invalid
   *
   * @example
   * // Export for use in Mihon on Android
   * const result = await window.api.exportMihonBackup(
   *   'C:\\...\\Documents\\dexreader-to-mihon.tachibk'
   * )
   * console.log(`Exported ${result.mangaExported} manga`)
   */
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
