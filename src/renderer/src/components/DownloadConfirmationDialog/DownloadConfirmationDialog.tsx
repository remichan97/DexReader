import type { JSX } from 'react'
import { useState } from 'react'
import { Modal } from '@renderer/components/Modal'
import { Select, type SelectOption } from '@renderer/components/Select'
import { Button } from '@renderer/components/Button'
import { useTranslation } from '@renderer/hooks/useTranslation'
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
  const { t } = useTranslation(['dialogs', 'common'])
  const [selectedQuality, setSelectedQuality] = useState<'data' | 'data-saver'>(defaultQuality)

  const isBatch = chapterCount > 1
  const title = isBatch
    ? t('dialogs:downloadConfirmation.titles.batch')
    : t('dialogs:downloadConfirmation.titles.single')

  const qualityOptions: SelectOption[] = [
    { value: 'data', label: t('dialogs:downloadConfirmation.quality.options.high') },
    { value: 'data-saver', label: t('dialogs:downloadConfirmation.quality.options.dataSaver') }
  ]

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
    <div className="download-dialog__footer flex justify-end gap-2">
      <Button variant="secondary" onClick={onClose}>
        {t('common:button.cancel')}
      </Button>
      <Button variant="primary" onClick={handleConfirm}>
        {t('common:button.download')}
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
      <div className="download-dialog flex flex-col gap-5">
        {/* Chapter info */}
        <div className="download-dialog__info">
          {isBatch ? (
            <p
              className="download-dialog__description"
              dangerouslySetInnerHTML={{
                __html: t('dialogs:downloadConfirmation.messages.batch', { count: chapterCount })
              }}
            />
          ) : (
            <p className="download-dialog__chapter-title">
              {chapterTitle ||
                t('dialogs:downloadConfirmation.messages.single', { title: 'Chapter' })}
            </p>
          )}
        </div>

        {/* Quality selection */}
        <div className="download-dialog__section flex flex-col gap-2">
          <Select
            value={selectedQuality}
            onChange={handleQualityChange}
            options={qualityOptions}
            label={t('dialogs:downloadConfirmation.quality.label')}
            helperText={
              selectedQuality === 'data'
                ? t('dialogs:downloadConfirmation.quality.helperText.high')
                : t('dialogs:downloadConfirmation.quality.helperText.dataSaver')
            }
          />
        </div>

        {/* Download location */}
        <div className="download-dialog__section flex flex-col gap-2">
          <div className="download-dialog__label">
            {t('dialogs:downloadConfirmation.location.label')}
          </div>
          <div className="download-dialog__location flex items-center gap-2">
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
              {t('dialogs:downloadConfirmation.location.changeLink')}
            </button>
          )}
        </div>

        {/* Batch info message */}
        {isBatch && showBatchInfo && (
          <div className="download-dialog__batch-info flex items-start gap-2">
            <Info20Regular className="download-dialog__info-icon" />
            <p className="download-dialog__info-text">
              {t('dialogs:downloadConfirmation.batchInfo')}
            </p>
          </div>
        )}
      </div>
    </Modal>
  )
}
