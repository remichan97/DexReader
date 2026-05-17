import { Modal } from '../Modal'
import { ProgressRing } from '../ProgressRing'
import { Button } from '../Button'
import { Dismiss24Regular } from '@fluentui/react-icons'
import { useTranslation } from '@renderer/hooks/useTranslation'
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
  const { t } = useTranslation(['dialogs', 'common'])
  // Calculate progress percentage (0-100)
  const progress = total > 0 ? Math.round((current / total) * 100) : 0
  const isIndeterminate = total === 0 || current === 0

  return (
    <Modal
      open={open}
      onClose={() => {
        /* Prevent closing during import */
      }}
      title={t('dialogs:importProgress.title')}
      footer={
        cancellable && onCancel ? (
          <div className="import-progress-dialog__footer flex justify-end">
            <Button variant="secondary" onClick={onCancel} icon={<Dismiss24Regular />}>
              {t('dialogs:importProgress.buttons.cancel')}
            </Button>
          </div>
        ) : null
      }
      closeOnOverlayClick={false}
      closeOnEscape={false}
    >
      <div className="import-progress-dialog flex flex-col items-center gap-6">
        <div className="import-progress-dialog__ring flex justify-center items-center">
          <ProgressRing value={isIndeterminate ? undefined : progress} size="large" />
        </div>

        <div className="import-progress-dialog__status flex flex-col items-center gap-2">
          {isIndeterminate ? (
            <div className="import-progress-dialog__progress">
              {t('dialogs:importProgress.progress.indeterminate')}
            </div>
          ) : (
            <div className="import-progress-dialog__progress">
              {t('dialogs:importProgress.progress.current', { current, total })}
            </div>
          )}

          {currentTitle && (
            <div className="import-progress-dialog__current-title">
              {t('dialogs:importProgress.progress.currentTitle', { title: currentTitle })}
            </div>
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
