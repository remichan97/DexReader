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
import { useTranslation } from '@renderer/hooks/useTranslation'
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
  const { t } = useTranslation(['dialogs', 'common'])
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
    <Modal
      open={isOpen}
      onClose={handleCancel}
      title={t('dialogs:dexreaderExport.title')}
      size="medium"
    >
      <div className="dexreader-export-dialog flex flex-col gap-4">
        {savePath && (
          <div className="export-path-info flex items-center gap-3">
            <SaveArrowRight20Regular className="export-icon" />
            <div className="path-details flex flex-col gap-1">
              <span className="path-label">{t('dialogs:dexreaderExport.pathInfo.label')}</span>
              <span className="path-name">{savePath}</span>
            </div>
          </div>
        )}

        <div className="export-info">
          <p className="info-text">{t('dialogs:dexreaderExport.description')}</p>
        </div>

        <div className="export-options flex flex-col gap-2">
          <div className="option-section">
            <div className="option-header flex items-center gap-2">
              <Library20Regular className="option-icon" />
              <strong>{t('dialogs:dexreaderExport.options.library.title')}</strong>
              <span className="always-included">
                {t('dialogs:dexreaderExport.options.library.alwaysIncluded')}
              </span>
            </div>
            <p className="option-description no-checkbox">
              {t('dialogs:dexreaderExport.options.library.description')}
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
              <strong>{t('dialogs:dexreaderExport.options.collections.title')}</strong>
            </div>
            <p className="option-description">
              {t('dialogs:dexreaderExport.options.collections.description')}
            </p>
          </div>

          <div className="option-section">
            <div className="option-header flex items-center gap-2">
              <Checkbox
                checked={includeProgress}
                onChange={setIncludeProgress}
                disabled={isExporting}
              />
              <BookOpen20Regular className="option-icon" />
              <strong>{t('dialogs:dexreaderExport.options.progress.title')}</strong>
            </div>
            <p className="option-description">
              {t('dialogs:dexreaderExport.options.progress.description')}
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
              <strong>{t('dialogs:dexreaderExport.options.readerSettings.title')}</strong>
            </div>
            <p className="option-description">
              {t('dialogs:dexreaderExport.options.readerSettings.description')}
            </p>
          </div>
        </div>

        <div className="export-note">
          <p className="note-text">
            <strong>{t('dialogs:dexreaderExport.note.prefix')}</strong>{' '}
            {t('dialogs:dexreaderExport.note.message')}
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
            {t('common:button.cancel')}
          </Button>
          <Button variant="primary" onClick={handleExport} disabled={isExporting}>
            {isExporting
              ? t('dialogs:dexreaderExport.buttons.exporting')
              : t('dialogs:dexreaderExport.buttons.export')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
