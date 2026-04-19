import { useState, useEffect, useRef } from 'react'
import { useToastStore } from '@renderer/stores'

// ImportResult interface matches src/main/services/results/import.result.ts
import { rendererLog } from '@renderer/services/logging.service'

export interface ImportResult {
  importedMangaCount: number
  skippedMangaCount: number
  failedMangaCount: number
  errors?: Array<{
    mangaId?: string
    title?: string
    reason: string
  }>
  importedMangaIds?: string[]
}

interface UseMihonImportExportReturn {
  // State
  isImporting: boolean
  importResult: ImportResult | null

  // Handlers
  clearImportResult: () => void
  handleCancelImport: () => Promise<void>
}

export function useMihonImportExport(
  loadFavourites: () => Promise<void>,
  loadCollections: () => Promise<void>
): UseMihonImportExportReturn {
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const importingRef = useRef(false) // Synchronous guard against double imports
  const show = useToastStore((state) => state.show)

  // Listen for import events from main process
  useEffect(() => {
    const removeListener = globalThis.api.onImportTachiyomi(async (filePath: string) => {
      // Prevent concurrent imports with synchronous ref check
      if (importingRef.current) {
        return
      }

      // Start import
      importingRef.current = true
      setIsImporting(true)
      setImportResult(null)

      try {
        const response = await globalThis.mihon.importBackup(filePath)

        if (response.success && response.data) {
          setImportResult(response.data)

          // Reload library to show imported manga
          await loadFavourites()
          await loadCollections()

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
        importingRef.current = false
        setIsImporting(false)
      }
    })

    return removeListener
  }, [show, loadFavourites, loadCollections])

  // Listen for export events from main process
  useEffect(() => {
    const removeListener = globalThis.api.onExportTachiyomi(async (filePath: string) => {
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
      }
    })

    return removeListener
  }, [show])

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
