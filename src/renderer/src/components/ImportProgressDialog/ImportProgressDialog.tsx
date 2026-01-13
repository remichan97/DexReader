import { Modal } from '../Modal'
import { ProgressRing } from '../ProgressRing'
import { Button } from '../Button'
import { Dismiss24Regular } from '@fluentui/react-icons'
import './ImportProgressDialog.css'

export interface ImportProgressDialogProps {
  /**
   * Whether the dialog is open
   */
  readonly open: boolean

  /**
   * Total number of items to import
   */
  readonly total: number

  /**
   * Current item number being processed
   */
  readonly current: number

  /**
   * Current manga title being imported (optional)
   */
  readonly currentTitle?: string

  /**
   * Called when user clicks cancel
   */
  readonly onCancel?: () => void

  /**
   * Whether the import is cancellable
   */
  readonly cancellable?: boolean
}

/**
 * Dialog showing progress of Tachiyomi/Mihon import operation
 *
 * @example
 * ```tsx
 * <ImportProgressDialog
 *   open={isImporting}
 *   current={45}
 *   total={60}
 *   currentTitle="One Piece"
 *   onCancel={handleCancel}
 *   cancellable={true}
 * />
 * ```
 */
export function ImportProgressDialog({
  open,
  total,
  current,
  currentTitle,
  onCancel,
  cancellable = true
}: Readonly<ImportProgressDialogProps>): React.JSX.Element {
  // Calculate progress percentage (0-100)
  const progress = total > 0 ? Math.round((current / total) * 100) : 0
  const isIndeterminate = total === 0 || current === 0

  return (
    <Modal
      open={open}
      onClose={() => {
        /* Prevent closing during import */
      }}
      title="Importing Library"
      footer={
        cancellable && onCancel ? (
          <div className="import-progress-dialog__footer">
            <Button variant="secondary" onClick={onCancel} icon={<Dismiss24Regular />}>
              Cancel Import
            </Button>
          </div>
        ) : null
      }
      closeOnOverlayClick={false}
      closeOnEscape={false}
    >
      <div className="import-progress-dialog">
        <div className="import-progress-dialog__ring">
          <ProgressRing value={isIndeterminate ? undefined : progress} size="large" />
        </div>

        <div className="import-progress-dialog__status">
          {isIndeterminate ? (
            <div className="import-progress-dialog__progress">Importing...</div>
          ) : (
            <div className="import-progress-dialog__progress">
              {current} of {total} items
            </div>
          )}

          {currentTitle && (
            <div className="import-progress-dialog__current-title">{currentTitle}</div>
          )}
        </div>

        <div className="import-progress-dialog__info">
          <p>
            Importing manga from your Tachiyomi/Mihon backup. This may take a few moments depending
            on the size of your library.
          </p>
        </div>
      </div>
    </Modal>
  )
}
