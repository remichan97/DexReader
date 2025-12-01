import { useEffect } from 'react'
import { ToastVariant, BaseComponentProps } from '@renderer/types/components'
import { ProgressRing } from '../ProgressRing'
import './Toast.css'

export interface ToastProps extends BaseComponentProps {
  /**
   * Unique toast identifier
   */
  id: string

  /**
   * Toast variant
   */
  variant: ToastVariant

  /**
   * Toast title
   */
  title: string

  /**
   * Optional message
   */
  message?: string

  /**
   * Auto-dismiss duration in milliseconds (0 to disable)
   * @default 5000
   */
  duration?: number

  /**
   * Close handler
   */
  onClose: (id: string) => void
}

/**
 * Toast notification component
 *
 * @example
 * ```tsx
 * <Toast
 *   id="toast-1"
 *   variant="success"
 *   title="Changes saved"
 *   message="Your settings have been updated"
 *   onClose={handleClose}
 * />
 * ```
 */
export function Toast({
  id,
  variant,
  title,
  message,
  duration = 5000,
  onClose,
  className = '',
  'aria-label': ariaLabel
}: ToastProps): React.JSX.Element {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id)
      }, duration)

      return (): void => {
        clearTimeout(timer)
      }
    }
    return undefined
  }, [id, duration, onClose])

  const handleClose = (): void => {
    onClose(id)
  }

  const classNames = ['toast', `toast--${variant}`, className].filter(Boolean).join(' ')

  const icons = {
    info: (
      <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2" />
        <path d="M10 6v4M10 14h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    success: (
      <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2" />
        <path d="M6 10l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    warning: (
      <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M10 2l8 14H2L10 2z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M10 8v3M10 14h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    error: (
      <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2" />
        <path d="M7 7l6 6M13 7l-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    loading: <ProgressRing size="small" aria-label="Loading" />
  }

  return (
    <div
      className={classNames}
      role="alert"
      aria-live="assertive"
      aria-label={ariaLabel || `${variant}: ${title}`}
    >
      <div className="toast__icon" aria-hidden="true">
        {icons[variant]}
      </div>

      <div className="toast__content">
        <div className="toast__title">{title}</div>
        {message && <div className="toast__message">{message}</div>}
      </div>

      <button
        type="button"
        className="toast__close"
        onClick={handleClose}
        aria-label="Close notification"
      >
        <svg
          className="toast__close-icon"
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
  )
}
