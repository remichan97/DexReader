import { JSX, useState } from 'react'
import { Modal } from '../Modal'
import { Button } from '../Button'
import { Checkbox } from '../Checkbox'
import {
  Library20Regular,
  Folder20Regular,
  BookOpen20Regular,
  Settings20Regular
} from '@fluentui/react-icons'
import './DexReaderExportDialog.css'

interface DexReaderExportDialogProps {
  isOpen: boolean
  onClose: () => void
  onExport: (options: ExportOptions) => void
  isExporting: boolean
}

export interface ExportOptions {
  includeCollections: boolean
  includeProgress: boolean
  includeReaderSettings: boolean
}

export function DexReaderExportDialog({
  isOpen,
  onClose,
  onExport,
  isExporting
}: Readonly<DexReaderExportDialogProps>): JSX.Element | null {
  const [includeCollections, setIncludeCollections] = useState(true)
  const [includeProgress, setIncludeProgress] = useState(true)
  const [includeReaderSettings, setIncludeReaderSettings] = useState(true)

  if (!isOpen) return null

  const handleExport = (): void => {
    onExport({
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
      <div className="dexreader-export-dialog">
        <div className="export-info">
          <p className="info-text">
            Choose what to include in your backup file. Library manga metadata is always included.
          </p>
        </div>

        <div className="export-options">
          <div className="option-section">
            <div className="option-header">
              <Library20Regular className="option-icon" />
              <strong>Library</strong>
              <span className="always-included">Always included</span>
            </div>
            <p className="option-description">
              Manga metadata, cover URLs, chapters, tags, and authors
            </p>
          </div>

          <div className="option-section">
            <div className="option-header">
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
            <div className="option-header">
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
            <div className="option-header">
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

        <div className="dexreader-export-dialog__actions">
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
