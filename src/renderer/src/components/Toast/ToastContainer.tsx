import { Toast, ToastProps } from './Toast'
import './Toast.css'

export interface ToastContainerProps {
  /**
   * Array of active toasts
   */
  toasts: ToastProps[]

  /**
   * Position of the toast container
   * @default 'top-right'
   */
  position?: 'top-right' | 'top-center' | 'bottom-right' | 'bottom-center'
}

/**
 * Container for displaying multiple toast notifications
 *
 * @example
 * ```tsx
 * <ToastContainer
 *   toasts={activeToasts}
 *   position="top-right"
 * />
 * ```
 */
export function ToastContainer({
  toasts,
  position = 'top-right'
}: ToastContainerProps): React.JSX.Element | null {
  if (toasts.length === 0) return null

  const classNames = ['toast-container', `toast-container--${position}`].join(' ')

  return (
    <div className={classNames} aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>
  )
}
