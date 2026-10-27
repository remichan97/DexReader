import { useState, useEffect } from 'react'
import { useToastStore } from '@renderer/stores'
import type { ImportResult } from '@renderer/components/ImportResultDialog'
import { rendererLog } from '@renderer/services/logging.service'
import { useTranslation } from '@renderer/hooks/useTranslation'
import { releaseBackupLock, tryAcquireBackupLock } from '@renderer/utils/backupOperationLock'
import { refreshAfterImport } from '@renderer/utils/refreshAfterImport'

interface UseMihonImportExportReturn {
  // State
  isImporting: boolean
  importResult: ImportResult | null

  // Handlers
  clearImportResult: () => void
  handleCancelImport: () => Promise<void>
}

/**
 * Drives the Mihon/Tachiyomi (.tachibk) import and export from the menu events.
 *
 * Mounted once at app level (see BackupHost), so it works from every view. Each operation
 * holds the shared backup lock until it finishes, so it can't overlap a DexReader backup
 * dialog or another Mihon operation.
 */
export function useMihonImportExport(): UseMihonImportExportReturn {
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const show = useToastStore((state) => state.show)
  const { t } = useTranslation('common')

  // Listen for import events from main process
  useEffect(() => {
    const removeListener = globalThis.api.onImportTachiyomi(async (filePath: string) => {
      // Prevent overlapping backup operations (this also covers a double import)
      if (!tryAcquireBackupLock()) {
        show({
          title: t('backup.busyTitle'),
          message: t('backup.busyMessage'),
          variant: 'warning',
          duration: 4000
        })
        return
      }

      // Start import
      setIsImporting(true)
      setImportResult(null)

      try {
        const response = await globalThis.mihon.importBackup(filePath)

        if (response.success && response.data) {
          setImportResult(response.data)

          // Refresh everything the import may have changed, wherever the user currently is
          await refreshAfterImport()

          // Show toast notification
          show({
            title: 'Import Complete',
            message: `Imported ${response.data.importedMangaCount} manga, skipped ${response.data.skippedMangaCount}, failed ${response.data.failedMangaCount}`,
            variant: response.data.failedMangaCount > 0 ? 'warning' : 'success',
            duration: 4000
          })
        } else {
          // Import failed
          show({
            title: 'Import Failed',
            message: response.error?.message || 'Could not import backup file',
            variant: 'error',
            duration: 4000
          })
        }
      } catch (error) {
        rendererLog.error('[useMihonImportExport] Error importing backup:', error)
        show({
          title: 'Import Failed',
          message: 'An error occurred during import',
          variant: 'error',
          duration: 4000
        })
      } finally {
        releaseBackupLock()
        setIsImporting(false)
      }
    })

    return removeListener
  }, [show, t])

  // Listen for export events from main process
  useEffect(() => {
    const removeListener = globalThis.api.onExportTachiyomi(async (filePath: string) => {
      if (!tryAcquireBackupLock()) {
        show({
          title: t('backup.busyTitle'),
          message: t('backup.busyMessage'),
          variant: 'warning',
          duration: 4000
        })
        return
      }

      try {
        const response = await globalThis.mihon.exportBackup(filePath)

        if (response.success && response.data) {
          show({
            title: 'Export Complete',
            message: `Exported ${response.data.exportedCount} manga to Mihon backup`,
            variant: 'success',
            duration: 4000
          })
        } else {
          show({
            title: 'Export Failed',
            message: response.error?.message || 'Could not export library',
            variant: 'error',
            duration: 4000
          })
        }
      } catch (error) {
        rendererLog.error('[useMihonImportExport] Error exporting backup:', error)
        show({
          title: 'Export Failed',
          message: 'An error occurred during export',
          variant: 'error',
          duration: 4000
        })
      } finally {
        releaseBackupLock()
      }
    })

    return removeListener
  }, [show, t])

  const handleCancelImport = async (): Promise<void> => {
    try {
      const response = await globalThis.mihon.cancelImport()
      if (response.success) {
        show({
          title: 'Import Cancelled',
          message: 'The import has been cancelled',
          variant: 'info',
          duration: 3000
        })
      }
    } catch (error) {
      rendererLog.error('[useMihonImportExport] Error cancelling import:', error)
    }
  }

  const clearImportResult = (): void => {
    setImportResult(null)
  }

  return {
    isImporting,
    importResult,
    clearImportResult,
    handleCancelImport
  }
}
