import { Toast } from './Toast'
import type { ToastItem } from '@renderer/stores'
import './Toast.css'

export interface ToastContainerProps {
  /**
   * Array of active toasts (from Zustand store)
   */
  toasts: ToastItem[]

  /**
   * Function to dismiss a toast (from Zustand store)
   */
  onDismiss: (id: string) => void

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
 * const toasts = useToastStore((state) => state.toasts)
 * const dismiss = useToastStore((state) => state.dismiss)
 *
 * <ToastContainer
 *   toasts={toasts}
 *   onDismiss={dismiss}
 *   position="top-right"
 * />
 * ```
 */
export function ToastContainer({
  toasts,
  onDismiss,
  position = 'top-right'
}: ToastContainerProps): React.JSX.Element | null {
  if (toasts.length === 0) return null

  const classNames = ['toast-container', `toast-container--${position}`].join(' ')

  return (
    <div className={classNames} aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={onDismiss} />
      ))}
    </div>
  )
}
