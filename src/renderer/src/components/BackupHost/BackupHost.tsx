import type { JSX } from 'react'
import { ImportProgressDialog } from '@renderer/components/ImportProgressDialog'
import { ImportResultDialog } from '@renderer/components/ImportResultDialog'
import { DexReaderExportDialog } from '@renderer/components/DexReaderExportDialog'
import { DexReaderImportDialog } from '@renderer/components/DexReaderImportDialog'
import { useDexReaderImportExport } from '@renderer/hooks/useDexReaderImportExport'
import { useMihonImportExport } from '@renderer/hooks/useMihonImportExport'
import { useSecureNavigation } from '@renderer/hooks/useSecureNavigation'

/**
 * App-level owner of the backup import/export flows.
 *
 * The menu's import and export items can be used from any view, so their listeners and dialogs
 * can't live inside one view. This component is mounted once in `App` (above the Reader/AppShell
 * split, after the Gatekeeper gate), and renders nothing until a menu event arrives.
 *
 * Must be rendered inside SecureNavigationProvider.
 */
export function BackupHost(): JSX.Element {
  const { secureNavigate } = useSecureNavigation()

  const { isImporting, importResult, clearImportResult, handleCancelImport } =
    useMihonImportExport()

  const {
    exportDialogOpen,
    exportFilePath,
    isExporting,
    exportError,
    importDialogOpen,
    importFilePath,
    handleExport,
    handleCloseExportDialog,
    handleImportComplete,
    handleCloseImportDialog
  } = useDexReaderImportExport()

  return (
    <>
      {/* Mihon/Tachiyomi import progress */}
      <ImportProgressDialog
        open={isImporting}
        current={0}
        total={0}
        onCancel={handleCancelImport}
      />

      {/* Mihon/Tachiyomi import result */}
      {importResult && (
        <ImportResultDialog
          open={!!importResult}
          result={importResult}
          onClose={() => clearImportResult()}
          onViewLibrary={() => {
            clearImportResult()
            // The import can run from any view, so go to the library rather than assume we're in it
            void secureNavigate('/library')
          }}
        />
      )}

      {/* DexReader export */}
      <DexReaderExportDialog
        isOpen={exportDialogOpen}
        savePath={exportFilePath}
        onClose={handleCloseExportDialog}
        onExport={handleExport}
        isExporting={isExporting}
        error={exportError}
      />

      {/* DexReader import */}
      <DexReaderImportDialog
        isOpen={importDialogOpen}
        filePath={importFilePath}
        onClose={handleCloseImportDialog}
        onImportComplete={handleImportComplete}
      />
    </>
  )
}
