import type { JSX } from 'react'
import { useState } from 'react'
import { Modal } from '@renderer/components/Modal'
import { Select, type SelectOption } from '@renderer/components/Select'
import { Button } from '@renderer/components/Button'
import { Folder20Regular, Info20Regular } from '@fluentui/react-icons'
import './DownloadConfirmationDialog.css'

export interface DownloadConfirmationDialogProps {
  /**
   * Whether the dialog is open
   */
  readonly isOpen: boolean

  /**
   * Called when the dialog should close
   */
  readonly onClose: () => void

  /**
   * Called when user confirms download with selected quality
   */
  readonly onConfirm: (quality: 'data' | 'data-saver') => void

  /**
   * Number of chapters to download
   * If 1, shows single chapter variant
   * If > 1, shows batch variant
   */
  readonly chapterCount: number

  /**
   * Title of the chapter (only shown for single chapter downloads)
   */
  readonly chapterTitle?: string

  /**
   * Default quality (pre-selected in dropdown)
   */
  readonly defaultQuality: 'data' | 'data-saver'

  /**
   * Download location path
   */
  readonly downloadsPath: string

  /**
   * Whether to show batch-specific message
   * (enabled when chapterCount >= threshold && confirmation setting enabled)
   */
  readonly showBatchInfo?: boolean

  /**
   * Callback to open settings
   */
  readonly onOpenSettings?: () => void
}

const qualityOptions: SelectOption[] = [
  { value: 'data', label: 'High Quality' },
  { value: 'data-saver', label: 'Data Saver' }
]

/**
 * DownloadConfirmationDialog - Unified dialog for download confirmation and quality selection
 *
 * This dialog handles both single and batch downloads, showing:
 * - Chapter count/title
 * - Quality dropdown (always visible)
 * - Download location
 * - Batch info message (when applicable)
 */
export function DownloadConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  chapterCount,
  chapterTitle,
  defaultQuality,
  downloadsPath,
  showBatchInfo = false,
  onOpenSettings
}: DownloadConfirmationDialogProps): JSX.Element {
  const [selectedQuality, setSelectedQuality] = useState<'data' | 'data-saver'>(defaultQuality)

  const isBatch = chapterCount > 1
  const title = isBatch ? 'Download Multiple Chapters?' : 'Download Chapter?'

  const handleQualityChange = (value: string | string[]): void => {
    const quality = Array.isArray(value) ? value[0] : value
    setSelectedQuality(quality as 'data' | 'data-saver')
  }

  const handleConfirm = (): void => {
    onConfirm(selectedQuality)
    onClose()
  }

  const handleOpenSettings = (): void => {
    if (onOpenSettings) {
      onOpenSettings()
      onClose()
    }
  }

  const footer = (
    <div className="download-dialog__footer">
      <Button variant="secondary" onClick={onClose}>
        Cancel
      </Button>
      <Button variant="primary" onClick={handleConfirm}>
        Download
      </Button>
    </div>
  )

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={title}
      footer={footer}
      size="small"
      closeOnOverlayClick={false}
      aria-label={title}
    >
      <div className="download-dialog">
        {/* Chapter info */}
        <div className="download-dialog__info">
          {isBatch ? (
            <p className="download-dialog__description">
              You&apos;re about to download <strong>{chapterCount} chapters</strong>.
            </p>
          ) : (
            <p className="download-dialog__chapter-title">{chapterTitle || 'Chapter'}</p>
          )}
        </div>

        {/* Quality selection */}
        <div className="download-dialog__section">
          <Select
            value={selectedQuality}
            onChange={handleQualityChange}
            options={qualityOptions}
            label="Quality"
            helperText={
              selectedQuality === 'data'
                ? 'Best image quality, larger file size'
                : 'Compressed images, smaller file size'
            }
          />
        </div>

        {/* Download location */}
        <div className="download-dialog__section">
          <div className="download-dialog__label">Download location:</div>
          <div className="download-dialog__location">
            <Folder20Regular className="download-dialog__folder-icon" />
            <span className="download-dialog__path" title={downloadsPath}>
              {downloadsPath}
            </span>
          </div>
          {onOpenSettings && (
            <button
              type="button"
              className="download-dialog__settings-link"
              onClick={handleOpenSettings}
            >
              Change in Settings →
            </button>
          )}
        </div>

        {/* Batch info message */}
        {isBatch && showBatchInfo && (
          <div className="download-dialog__batch-info">
            <Info20Regular className="download-dialog__info-icon" />
            <p className="download-dialog__info-text">
              Downloads will run in the background. You can continue browsing while they complete.
            </p>
          </div>
        )}
      </div>
    </Modal>
  )
}
