import { Modal } from '../Modal'
import { Button } from '../Button'
import {
  CheckmarkCircle48Regular,
  Warning48Regular,
  ErrorCircle48Regular,
  Dismiss24Regular,
  ChevronDown20Regular,
  ChevronUp20Regular
} from '@fluentui/react-icons'
import { useState } from 'react'
import './ImportResultDialog.css'

// ImportResult interface matches src/main/services/results/import.result.ts
interface ImportResult {
  imported: number
  skipped: number
  failed: number
  errors: Array<{
    mangaId?: string
    title?: string
    message: string
  }>
}

export interface ImportResultDialogProps {
  /**
   * Whether the dialog is open
   */
  readonly open: boolean

  /**
   * Import result data
   */
  readonly result: ImportResult | null

  /**
   * Called when dialog is closed
   */
  readonly onClose: () => void

  /**
   * Called when user wants to view imported manga in library
   */
  readonly onViewLibrary?: () => void
}

/**
 * Dialog showing results of Tachiyomi/Mihon import operation
 *
 * @example
 * ```tsx
 * <ImportResultDialog
 *   open={showResult}
 *   result={importResult}
 *   onClose={() => setShowResult(false)}
 *   onViewLibrary={() => navigate('/library')}
 * />
 * ```
 */
export function ImportResultDialog({
  open,
  result,
  onClose,
  onViewLibrary
}: Readonly<ImportResultDialogProps>): React.JSX.Element {
  const [showErrors, setShowErrors] = useState(false)

  if (!result) {
    return <></>
  }

  const { imported, skipped, failed, errors } = result
  const total = imported + skipped + failed
  const hasErrors = errors && errors.length > 0

  // Determine dialog status
  let status: 'success' | 'warning' | 'error' = 'success'
  let StatusIcon = CheckmarkCircle48Regular
  let statusText = 'Import Successful'

  if (failed > 0) {
    status = 'error'
    StatusIcon = ErrorCircle48Regular
    statusText = 'Import Completed with Errors'
  } else if (skipped > 0) {
    status = 'warning'
    StatusIcon = Warning48Regular
    statusText = 'Import Completed with Warnings'
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={statusText}
      size="medium"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} icon={<Dismiss24Regular />}>
            Close
          </Button>
          {onViewLibrary && imported > 0 && (
            <Button variant="primary" onClick={onViewLibrary}>
              View Library
            </Button>
          )}
        </>
      }
    >
      <div className="import-result-dialog">
        <div className={`import-result-dialog__header import-result-dialog__header--${status}`}>
          <StatusIcon className="import-result-dialog__icon" />
        </div>

        <div className="import-result-dialog__stats">
          <div className="import-result-dialog__stat import-result-dialog__stat--success">
            <div className="import-result-dialog__stat-value">{imported}</div>
            <div className="import-result-dialog__stat-label">Imported</div>
          </div>

          <div className="import-result-dialog__stat import-result-dialog__stat--warning">
            <div className="import-result-dialog__stat-value">{skipped}</div>
            <div className="import-result-dialog__stat-label">Skipped</div>
          </div>

          <div className="import-result-dialog__stat import-result-dialog__stat--error">
            <div className="import-result-dialog__stat-value">{failed}</div>
            <div className="import-result-dialog__stat-label">Failed</div>
          </div>
        </div>

        <div className="import-result-dialog__summary">
          <p>
            Successfully imported {imported} out of {total} manga from your backup.
          </p>

          {skipped > 0 && (
            <p className="import-result-dialog__note">
              {skipped} manga were skipped (already in library or not from MangaDex).
            </p>
          )}
        </div>

        {hasErrors && (
          <div className="import-result-dialog__errors">
            <button
              type="button"
              className="import-result-dialog__errors-toggle"
              onClick={() => setShowErrors(!showErrors)}
            >
              <span>
                {showErrors ? <ChevronUp20Regular /> : <ChevronDown20Regular />}
                View Error Details ({errors.length})
              </span>
            </button>

            {showErrors && (
              <div className="import-result-dialog__errors-list">
                {errors.map((error, index) => (
                  <div
                    key={`error-${error.mangaId || 'unknown'}-${index}`}
                    className="import-result-dialog__error-item"
                  >
                    <div className="import-result-dialog__error-title">
                      {error.title || 'Unknown Manga'}
                    </div>
                    <div className="import-result-dialog__error-message">{error.message}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
