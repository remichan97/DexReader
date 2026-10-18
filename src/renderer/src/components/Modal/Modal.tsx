import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  makeStyles,
  mergeClasses,
  tokens,
  type DialogOpenChangeData,
  type DialogOpenChangeEvent
} from '@fluentui/react-components'
import { Dismiss20Regular } from '@fluentui/react-icons'
import { ModalSize, BaseComponentProps } from '@renderer/types/components'
import { useTranslation } from '@renderer/hooks/useTranslation'

export interface ModalProps extends BaseComponentProps {
  /**
   * Whether the modal is open
   */
  open: boolean

  /**
   * Close handler
   */
  onClose: () => void

  /**
   * Modal title
   */
  title: string

  /**
   * Modal content
   */
  children: React.ReactNode

  /**
   * Modal footer (actions)
   */
  footer?: React.ReactNode

  /**
   * Modal size
   * @default 'medium'
   */
  size?: ModalSize

  /**
   * Whether to close on overlay click
   * @default true
   */
  closeOnOverlayClick?: boolean

  /**
   * Whether to close on Escape key
   * @default true
   */
  closeOnEscape?: boolean
}

// Fluent's Dialog has no size prop - DialogSurface's width is meant to be controlled via
// className, same approach the rest of this migration uses for size variants Fluent doesn't
// ship natively (see Button's danger/warning). Max-widths match the original .modal--* values.
const useStyles = makeStyles({
  small: { maxWidth: '400px' },
  medium: { maxWidth: '600px' },
  large: { maxWidth: '800px' },
  closeButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    padding: 0,
    border: 'none',
    borderRadius: tokens.borderRadiusSmall,
    backgroundColor: 'transparent',
    color: tokens.colorNeutralForeground3,
    cursor: 'pointer',
    transitionProperty: 'background-color, border-color, color',
    transitionDuration: tokens.durationFast,
    transitionTimingFunction: tokens.curveDecelerateMid,
    ':hover': {
      backgroundColor: tokens.colorSubtleBackgroundHover,
      color: tokens.colorNeutralForeground1
    },
    ':active': {
      backgroundColor: tokens.colorSubtleBackgroundPressed
    }
  }
})

/**
 * Modal component for overlay dialogs, built on Fluent 2's `Dialog`/`DialogSurface`
 * (@fluentui/react-components). Portal rendering, backdrop, focus trap, and body
 * scroll lock all come from Fluent's Dialog system.
 *
 * @example
 * ```tsx
 * <Modal
 *   open={isOpen}
 *   onClose={handleClose}
 *   title="Confirm Action"
 *   footer={<Button onClick={handleConfirm}>Confirm</Button>}
 * >
 *   Are you sure you want to proceed?
 * </Modal>
 * ```
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'medium',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className,
  'aria-label': ariaLabel
}: Readonly<ModalProps>): React.JSX.Element {
  const { t } = useTranslation('common')
  const styles = useStyles()

  // Fluent reports *why* the dialog is closing via data.type, which lets closeOnEscape and
  // closeOnOverlayClick be honoured independently (some callers disable only one, e.g.
  // DownloadConfirmationDialog blocks backdrop-click but still allows Escape) - the original
  // achieved the same by comparing click targets and a manual keydown listener; this is the
  // same selective behaviour driven by Fluent's own event data instead.
  const handleOpenChange = (_event: DialogOpenChangeEvent, data: DialogOpenChangeData): void => {
    if (data.open) return

    if (data.type === 'escapeKeyDown' && !closeOnEscape) return
    if (data.type === 'backdropClick' && !closeOnOverlayClick) return

    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogSurface className={mergeClasses(styles[size], className)} aria-label={ariaLabel}>
        <DialogBody>
          <DialogTitle
            action={
              <button
                type="button"
                className={styles.closeButton}
                onClick={onClose}
                aria-label={t('aria.closeDialog')}
              >
                <Dismiss20Regular />
              </button>
            }
          >
            {title}
          </DialogTitle>
          <DialogContent>{children}</DialogContent>
          {/* fluid: DialogBody's grid reserves actions only 2 of its 3 columns by default
              (for a hypothetical left-aligned action group), leaving ~2/3 width at size="small" -
              not enough for two buttons with a longer label without wrapping. fluid spans the
              full width, matching the original .modal__footer's always-full-width flex row. */}
          {footer && <DialogActions fluid>{footer}</DialogActions>}
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
}
