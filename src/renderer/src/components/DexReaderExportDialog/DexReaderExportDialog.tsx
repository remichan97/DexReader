import { JSX, useState, useEffect } from 'react'
import { Modal } from '../Modal'
import { Button } from '../Button'
import { Checkbox } from '../Checkbox'
import {
  Library20Regular,
  Folder20Regular,
  BookOpen20Regular,
  Settings20Regular,
  Warning20Regular,
  SaveArrowRight20Regular
} from '@fluentui/react-icons'
import './DexReaderExportDialog.css'

interface DexReaderExportDialogProps {
  isOpen: boolean
  savePath: string | null
  onClose: () => void
  onExport: (options: ExportOptions) => Promise<void>
  isExporting: boolean
  error: string | null
}

export interface ExportOptions {
  includeCollections: boolean
  includeProgress: boolean
  includeReaderSettings: boolean
}

export function DexReaderExportDialog({
  isOpen,
  savePath,
  onClose,
  onExport,
  isExporting,
  error
}: Readonly<DexReaderExportDialogProps>): JSX.Element | null {
  const [includeCollections, setIncludeCollections] = useState(true)
  const [includeProgress, setIncludeProgress] = useState(true)
  const [includeReaderSettings, setIncludeReaderSettings] = useState(true)

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setIncludeCollections(true)
      setIncludeProgress(true)
      setIncludeReaderSettings(true)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleExport = async (): Promise<void> => {
    await onExport({
      includeCollections,
      includeProgress,
      includeReaderSettings
    })
  }

  const handleCancel = (): void => {
    if (!isExporting) {
      onClose()
    }
  }

  return (
    <Modal open={isOpen} onClose={handleCancel} title="Export DexReader Backup" size="medium">
      <div className="dexreader-export-dialog flex flex-col gap-4">
        {savePath && (
          <div className="export-path-info flex items-center gap-3">
            <SaveArrowRight20Regular className="export-icon" />
            <div className="path-details flex flex-col gap-1">
              <span className="path-label">Save to:</span>
              <span className="path-name">{savePath}</span>
            </div>
          </div>
        )}

        <div className="export-info">
          <p className="info-text">
            Choose what to include in your backup file. Library manga metadata is always included.
          </p>
        </div>

        <div className="export-options flex flex-col gap-2">
          <div className="option-section">
            <div className="option-header flex items-center gap-2">
              <Library20Regular className="option-icon" />
              <strong>Library</strong>
              <span className="always-included">Always included</span>
            </div>
            <p className="option-description no-checkbox">
              Manga metadata, cover URLs, chapters, tags, and authors
            </p>
          </div>

          <div className="option-section">
            <div className="option-header flex items-center gap-2">
              <Checkbox
                checked={includeCollections}
                onChange={setIncludeCollections}
                disabled={isExporting}
              />
              <Folder20Regular className="option-icon" />
              <strong>Collections</strong>
            </div>
            <p className="option-description">Your custom collections and their organization</p>
          </div>

          <div className="option-section">
            <div className="option-header flex items-center gap-2">
              <Checkbox
                checked={includeProgress}
                onChange={setIncludeProgress}
                disabled={isExporting}
              />
              <BookOpen20Regular className="option-icon" />
              <strong>Reading Progress</strong>
            </div>
            <p className="option-description">
              Chapter progress, reading history, and completion status
            </p>
          </div>

          <div className="option-section">
            <div className="option-header flex items-center gap-2">
              <Checkbox
                checked={includeReaderSettings}
                onChange={setIncludeReaderSettings}
                disabled={isExporting}
              />
              <Settings20Regular className="option-icon" />
              <strong>Reader Settings</strong>
            </div>
            <p className="option-description">
              Per-manga reading mode preferences and reader configurations
            </p>
          </div>
        </div>

        <div className="export-note">
          <p className="note-text">
            <strong>Note:</strong> App settings (theme, language, shortcuts) are stored separately.
            Use <em>Settings → Advanced → Open Settings File</em> to back them up.
          </p>
        </div>

        {error && (
          <div className="export-error flex items-start gap-3">
            <Warning20Regular className="error-icon" />
            <p className="error-text">{error}</p>
          </div>
        )}

        <div className="dexreader-export-dialog__actions flex justify-end gap-2">
          <Button variant="secondary" onClick={handleCancel} disabled={isExporting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleExport} disabled={isExporting}>
            {isExporting ? 'Exporting...' : 'Export Backup'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
