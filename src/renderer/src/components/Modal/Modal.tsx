import { useEffect, useRef } from 'react'
import { ModalSize, BaseComponentProps } from '@renderer/types/components'
import './Modal.css'

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

/**
 * Modal component for overlay dialogs
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
  className = '',
  'aria-label': ariaLabel
}: Readonly<ModalProps>): React.JSX.Element | null {
  const dialogRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  // Handle Escape key
  useEffect(() => {
    if (!open || !closeOnEscape) return

    const handleEscape = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open, closeOnEscape, onClose])

  // Handle body scroll lock and focus management
  useEffect(() => {
    if (open) {
      // Save current active element
      previousActiveElement.current = document.activeElement as HTMLElement

      // Lock body scroll
      document.body.style.overflow = 'hidden'

      // Focus the dialog
      dialogRef.current?.focus()

      return () => {
        // Restore body scroll
        document.body.style.overflow = ''

        // Restore focus to previous element
        previousActiveElement.current?.focus()
      }
    }
    return undefined
  }, [open])

  // Handle overlay click
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose()
    }
  }

  // Handle focus trap
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>): void => {
    if (e.key === 'Tab') {
      const focusableElements = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )

      if (!focusableElements || focusableElements.length === 0) return

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (e.shiftKey && document.activeElement === firstElement) {
        // Shift + Tab - wrap to last
        e.preventDefault()
        lastElement.focus()
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        // Tab - wrap to first
        e.preventDefault()
        firstElement.focus()
      }
    }
  }

  if (!open) return null

  const classNames = ['modal', `modal--${size}`, className].filter(Boolean).join(' ')

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div
        ref={dialogRef}
        className={classNames}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel || title}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        <div className="modal__header">
          <h2 className="modal__title">{title}</h2>
          <button
            type="button"
            className="modal__close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <svg
              className="modal__close-icon"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 4L4 12M4 4L12 12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="modal__content">{children}</div>

        {footer && <div className="modal__footer">{footer}</div>}
      </div>
    </div>
  )
}
