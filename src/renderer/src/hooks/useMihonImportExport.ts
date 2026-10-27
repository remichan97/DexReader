import { useState, useEffect, useCallback } from 'react'
import { useToastStore } from '@renderer/stores'
import type { ImportResult } from '@renderer/components/ImportResultDialog'
import { rendererLog } from '@renderer/services/logging.service'
import { useTranslation } from '@renderer/hooks/useTranslation'
import { releaseBackupLock, tryAcquireBackupLock } from '@renderer/utils/backupOperationLock'
import { refreshAfterImport } from '@renderer/utils/refreshAfterImport'
import type { ISerializeError } from '@shared/contracts/ipc/ipc-response.contract'

interface UseMihonImportExportReturn {
  // State
  isImporting: boolean
  isAddingSkipped: boolean
  importResult: ImportResult | null

  // Handlers
  clearImportResult: () => void
  handleCancelImport: () => Promise<void>
  addSkippedToLibrary: (mangaIds: string[]) => Promise<void>
}

/**
 * Fold the result of adding skipped titles back into the result of the original import, so the
 * dialog keeps showing the whole picture. The list of skipped titles is replaced by what is
 * still left out.
 */
function mergeAddBackResult(original: ImportResult, added: ImportResult): ImportResult {
  return {
    ...original,
    importedMangaCount: original.importedMangaCount + added.importedMangaCount,
    skippedMangaCount: original.skippedMangaCount + added.skippedMangaCount,
    failedMangaCount: original.failedMangaCount + added.failedMangaCount,
    errors: [...(original.errors ?? []), ...(added.errors ?? [])],
    importedMangaIds: [...(original.importedMangaIds ?? []), ...(added.importedMangaIds ?? [])],
    skippedOtherLanguage: added.skippedOtherLanguage ?? []
  }
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
  const [isAddingSkipped, setIsAddingSkipped] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  // The file the shown result came from, so skipped titles can be added back from it
  const [importedFilePath, setImportedFilePath] = useState<string | null>(null)
  const show = useToastStore((state) => state.show)
  const { t } = useTranslation(['common', 'dialogs'])

  // Specific, translated wording for the failures the importer knows about
  const describeFailure = useCallback(
    (error: ISerializeError | undefined, fallback: string): string => {
      if (error?.code?.startsWith('MIHON_BACKUP_')) {
        return t(`dialogs:mihonImport.errors.${error.code}`, { defaultValue: error.message })
      }
      return error?.message || fallback
    },
    [t]
  )

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
      setImportedFilePath(null)

      try {
        const response = await globalThis.mihon.importBackup(filePath)

        if (response.success && response.data) {
          setImportResult(response.data)
          setImportedFilePath(filePath)

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
            message: describeFailure(response.error, 'Could not import backup file'),
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
  }, [show, t, describeFailure])

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
    setImportedFilePath(null)
  }

  const addSkippedToLibrary = async (mangaIds: string[]): Promise<void> => {
    if (!importedFilePath || !importResult || mangaIds.length === 0) return

    if (!tryAcquireBackupLock()) {
      show({
        title: t('backup.busyTitle'),
        message: t('backup.busyMessage'),
        variant: 'warning',
        duration: 4000
      })
      return
    }

    setIsAddingSkipped(true)
    try {
      const response = await globalThis.mihon.importBackup(importedFilePath, mangaIds)

      if (response.success && response.data) {
        const added = response.data
        setImportResult((current) => (current ? mergeAddBackResult(current, added) : added))
        await refreshAfterImport()

        show({
          title: t('dialogs:importResult.skippedLanguages.addedTitle'),
          message: t('dialogs:importResult.skippedLanguages.addedMessage', {
            count: added.importedMangaCount
          }),
          variant: added.failedMangaCount > 0 ? 'warning' : 'success',
          duration: 4000
        })
      } else {
        show({
          title: t('dialogs:importResult.skippedLanguages.addFailedTitle'),
          message: describeFailure(response.error, 'Could not import backup file'),
          variant: 'error',
          duration: 4000
        })
      }
    } catch (error) {
      rendererLog.error('[useMihonImportExport] Error adding skipped titles:', error)
      show({
        title: t('dialogs:importResult.skippedLanguages.addFailedTitle'),
        message: 'An error occurred during import',
        variant: 'error',
        duration: 4000
      })
    } finally {
      releaseBackupLock()
      setIsAddingSkipped(false)
    }
  }

  return {
    isImporting,
    isAddingSkipped,
    importResult,
    clearImportResult,
    handleCancelImport,
    addSkippedToLibrary
  }
}
