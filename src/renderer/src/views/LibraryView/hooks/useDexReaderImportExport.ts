import { useState, useEffect } from 'react'
import { useToastStore } from '@renderer/stores'
import type { ExportOptions } from '@renderer/components/DexReaderExportDialog'
import type { DexReaderImportResult } from '../../../../../preload/index.d'

interface UseDexReaderImportExportReturn {
  // State
  exportDialogOpen: boolean
  exportFilePath: string | null
  isExporting: boolean
  exportError: string | null
  importDialogOpen: boolean
  importFilePath: string | null

  // Setters
  setExportDialogOpen: (open: boolean) => void
  setImportDialogOpen: (open: boolean) => void

  // Handlers
  handleExport: (options: ExportOptions) => Promise<void>
  handleCloseExportDialog: () => void
  handleImportComplete: (result: DexReaderImportResult) => Promise<void>
  handleCloseImportDialog: () => void
}

export function useDexReaderImportExport(
  loadFavourites: () => Promise<void>,
  loadCollections: () => Promise<void>
): UseDexReaderImportExportReturn {
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [exportFilePath, setExportFilePath] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importFilePath, setImportFilePath] = useState<string | null>(null)

  const show = useToastStore((state) => state.show)

  // Listen for DexReader export events from main process
  useEffect(() => {
    const removeListener = globalThis.api.onExportLibrary((filePath: string) => {
      setExportFilePath(filePath)
      setExportDialogOpen(true)
    })

    return removeListener
  }, [])

  // Listen for DexReader import events from main process
  useEffect(() => {
    const removeListener = globalThis.api.onImportLibrary((filePath: string) => {
      setImportFilePath(filePath)
      setImportDialogOpen(true)
    })

    return removeListener
  }, [])

  const handleExport = async (options: ExportOptions): Promise<void> => {
    if (!exportFilePath) return

    setIsExporting(true)
    setExportError(null)
    try {
      const response = await globalThis.dexreader.exportData(exportFilePath, options)

      if (response.success && response.data) {
        // Show success toast
        show({
          title: 'Export Complete',
          message: `Exported ${response.data.exportedMangaCount} manga to DexReader backup`,
          variant: 'success',
          duration: 4000
        })

        // Close dialog and reset
        setExportDialogOpen(false)
        setExportFilePath(null)
        setExportError(null)
      } else {
        // Show error inline
        const errorMessage = response.error?.message || 'Could not export library'
        setExportError(errorMessage)
      }
    } catch (error) {
      console.error('Error exporting backup:', error)
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
      setExportError(errorMessage)
    } finally {
      setIsExporting(false)
    }
  }

  const handleCloseExportDialog = (): void => {
    if (!isExporting) {
      setExportDialogOpen(false)
      setExportFilePath(null)
      setExportError(null)
    }
  }

  const handleImportComplete = async (result: DexReaderImportResult): Promise<void> => {
    // Refresh library to show imported manga
    await loadFavourites()
    await loadCollections()

    // Build success message
    const parts: string[] = []
    if (result.importedMangaCount > 0) {
      parts.push(`${result.importedMangaCount} manga`)
    }
    if (result.importedCollectionsCount > 0) {
      parts.push(`${result.importedCollectionsCount} collections`)
    }
    if (result.importedMangaProgressCount > 0) {
      parts.push(`${result.importedMangaProgressCount} progress entries`)
    }
    if (result.importedReaderOverridesCount > 0) {
      parts.push(`${result.importedReaderOverridesCount} reader settings`)
    }

    const message = parts.length > 0 ? `Imported: ${parts.join(', ')}` : 'Import complete'

    // Show warnings for section errors if any
    const warnings: string[] = []
    if (result.sectionErrors) {
      if (result.sectionErrors.collection) {
        warnings.push('Collections import had errors')
      }
      if (result.sectionErrors.progress) {
        warnings.push('Progress import had errors')
      }
      if (result.sectionErrors.readerSettings) {
        warnings.push('Reader settings import had errors')
      }
    }

    show({
      title: warnings.length > 0 ? 'Import Completed with Warnings' : 'Import Complete',
      message: warnings.length > 0 ? `${message}. ${warnings.join(', ')}` : message,
      variant: warnings.length > 0 ? 'warning' : 'success',
      duration: 5000
    })
  }

  const handleCloseImportDialog = (): void => {
    setImportDialogOpen(false)
    setImportFilePath(null)
  }

  return {
    exportDialogOpen,
    exportFilePath,
    isExporting,
    exportError,
    importDialogOpen,
    importFilePath,
    setExportDialogOpen,
    setImportDialogOpen,
    handleExport,
    handleCloseExportDialog,
    handleImportComplete,
    handleCloseImportDialog
  }
}
