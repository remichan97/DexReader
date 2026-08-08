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
import type { DexReaderImportContract } from '../../../../preload/window.types'
import { useTranslation } from '@renderer/hooks/useTranslation'
import './DexReaderImportDialog.css'

interface DexReaderImportDialogProps {
  isOpen: boolean
  filePath: string | null
  onClose: () => void
  onImportComplete: (result: DexReaderImportContract) => void
}

export function DexReaderImportDialog({
  isOpen,
  filePath,
  onClose,
  onImportComplete
}: Readonly<DexReaderImportDialogProps>): JSX.Element | null {
  const { t } = useTranslation(['dialogs', 'common'])
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
        throw new Error(
          result.error?.message ||
            t('dialogs:dexreaderImport.errors.importFailed', { message: 'Unknown error' })
        )
      }

      onImportComplete(result.data)
      onClose()
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : t('dialogs:dexreaderImport.errors.unknownError')
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
    <Modal
      open={isOpen}
      onClose={handleCancel}
      title={t('dialogs:dexreaderImport.title')}
      size="medium"
    >
      <div className="dexreader-import-dialog flex flex-col gap-4">
        <div className="import-file-info flex items-center gap-3">
          <ArrowImport20Regular className="import-icon" />
          <div className="file-details flex flex-col gap-1">
            <span className="file-label">{t('dialogs:dexreaderImport.fileInfo.label')}</span>
            <span className="file-name">{filePath}</span>
          </div>
        </div>

        <div className="import-info">
          <p className="info-text">{t('dialogs:dexreaderImport.description')}</p>
        </div>

        <div className="import-sections flex flex-col gap-2">
          <div className="section-item flex items-start gap-3">
            <Library20Regular className="section-icon" />
            <div className="section-content">
              <strong>{t('dialogs:dexreaderImport.sections.library.title')}</strong>
              <p className="section-description">
                {t('dialogs:dexreaderImport.sections.library.description')}
              </p>
            </div>
          </div>

          <div className="section-item flex items-start gap-3">
            <Folder20Regular className="section-icon" />
            <div className="section-content">
              <strong>{t('dialogs:dexreaderImport.sections.collections.title')}</strong>
              <p className="section-description">
                {t('dialogs:dexreaderImport.sections.collections.description')}
              </p>
            </div>
          </div>

          <div className="section-item flex items-start gap-3">
            <BookOpen20Regular className="section-icon" />
            <div className="section-content">
              <strong>{t('dialogs:dexreaderImport.sections.progress.title')}</strong>
              <p className="section-description">
                {t('dialogs:dexreaderImport.sections.progress.description')}
              </p>
            </div>
          </div>

          <div className="section-item flex items-start gap-3">
            <Settings20Regular className="section-icon" />
            <div className="section-content">
              <strong>{t('dialogs:dexreaderImport.sections.readerSettings.title')}</strong>
              <p className="section-description">
                {t('dialogs:dexreaderImport.sections.readerSettings.description')}
              </p>
            </div>
          </div>
        </div>

        <div className="import-warning flex items-start gap-3">
          <Warning20Regular className="warning-icon" />
          <div className="warning-content">
            <strong>{t('dialogs:dexreaderImport.behaviour.title')}</strong>
            <ul>
              <li>{t('dialogs:dexreaderImport.behaviour.points.existingUpdated')}</li>
              <li>{t('dialogs:dexreaderImport.behaviour.points.collectionsMerged')}</li>
              <li>{t('dialogs:dexreaderImport.behaviour.points.settingsPriority')}</li>
              <li>{t('dialogs:dexreaderImport.behaviour.points.noDataDeleted')}</li>
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
            {t('common:button.cancel')}
          </Button>
          <Button variant="primary" onClick={handleImport} disabled={isImporting}>
            {isImporting
              ? t('dialogs:dexreaderImport.buttons.importing')
              : t('dialogs:dexreaderImport.buttons.import')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
