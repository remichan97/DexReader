import { JSX, useState, useEffect } from 'react'
import { Modal } from '../Modal'
import { Button } from '../Button'
import {
  ArrowImport20Regular,
  Library20Regular,
  Folder20Regular,
  BookOpen20Regular,
  Settings20Regular,
  Warning20Regular
} from '@fluentui/react-icons'
import type { DexReaderImportResult } from '../../../../preload/index.d'
import './DexReaderImportDialog.css'

interface DexReaderImportDialogProps {
  isOpen: boolean
  filePath: string | null
  onClose: () => void
  onImportComplete: (result: DexReaderImportResult) => void
}

export function DexReaderImportDialog({
  isOpen,
  filePath,
  onClose,
  onImportComplete
}: Readonly<DexReaderImportDialogProps>): JSX.Element | null {
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setIsImporting(false)
      setError(null)
    }
  }, [isOpen])

  if (!isOpen || !filePath) return null

  const handleImport = async (): Promise<void> => {
    if (!filePath) return

    try {
      setIsImporting(true)
      setError(null)

      const result = await globalThis.dexreader.importData(filePath)

      if (!result.success) {
        throw new Error(result.error?.message || 'Import failed')
      }

      onImportComplete(result.data)
      onClose()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
      setError(errorMessage)
    } finally {
      setIsImporting(false)
    }
  }

  const handleCancel = (): void => {
    if (!isImporting) {
      onClose()
    }
  }

  return (
    <Modal open={isOpen} onClose={handleCancel} title="Import DexReader Backup" size="medium">
      <div className="dexreader-import-dialog flex flex-col gap-4">
        <div className="import-file-info flex items-center gap-3">
          <ArrowImport20Regular className="import-icon" />
          <div className="file-details flex flex-col gap-1">
            <span className="file-label">File:</span>
            <span className="file-name">{filePath}</span>
          </div>
        </div>

        <div className="import-info">
          <p className="info-text">
            This backup will be merged with your existing library. The following data will be
            imported:
          </p>
        </div>

        <div className="import-sections flex flex-col gap-2">
          <div className="section-item flex items-start gap-3">
            <Library20Regular className="section-icon" />
            <div className="section-content">
              <strong>Library</strong>
              <p className="section-description">Manga metadata, chapters, and cover URLs</p>
            </div>
          </div>

          <div className="section-item flex items-start gap-3">
            <Folder20Regular className="section-icon" />
            <div className="section-content">
              <strong>Collections</strong>
              <p className="section-description">Custom collections (duplicates will be merged)</p>
            </div>
          </div>

          <div className="section-item flex items-start gap-3">
            <BookOpen20Regular className="section-icon" />
            <div className="section-content">
              <strong>Reading Progress</strong>
              <p className="section-description">Chapter progress and reading history</p>
            </div>
          </div>

          <div className="section-item flex items-start gap-3">
            <Settings20Regular className="section-icon" />
            <div className="section-content">
              <strong>Reader Settings</strong>
              <p className="section-description">
                Per-manga reading preferences (existing settings preserved)
              </p>
            </div>
          </div>
        </div>

        <div className="import-warning flex items-start gap-3">
          <Warning20Regular className="warning-icon" />
          <div className="warning-content">
            <strong>Import Behavior:</strong>
            <ul>
              <li>Existing manga will be updated with imported data</li>
              <li>Collections with the same name will be merged</li>
              <li>Your current reader settings take priority</li>
              <li>No data will be deleted from your library</li>
            </ul>
          </div>
        </div>

        {error && (
          <div className="import-error flex items-start gap-3">
            <Warning20Regular className="error-icon" />
            <p className="error-text">{error}</p>
          </div>
        )}

        <div className="dexreader-import-dialog__actions flex gap-3 justify-end">
          <Button variant="secondary" onClick={handleCancel} disabled={isImporting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleImport} disabled={isImporting}>
            {isImporting ? 'Importing...' : 'Import Backup'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
