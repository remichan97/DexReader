import { useState, useCallback } from 'react'
import { ToastProps } from './Toast'

let toastIdCounter = 0

export interface UseToastReturn {
  /**
   * Show a new toast notification
   */
  show: (toast: Omit<ToastProps, 'id' | 'onClose'>) => string

  /**
   * Dismiss a specific toast
   */
  dismiss: (id: string) => void

  /**
   * Dismiss all toasts
   */
  dismissAll: () => void

  /**
   * Active toasts
   */
  toasts: ToastProps[]
}

/**
 * Hook for managing toast notifications
 *
 * @example
 * ```tsx
 * const { show, toasts } = useToast()
 *
 * const handleSave = () => {
 *   show({
 *     variant: 'success',
 *     title: 'Saved',
 *     message: 'Your changes have been saved'
 *   })
 * }
 *
 * return <ToastContainer toasts={toasts} />
 * ```
 */
export function useToast(): UseToastReturn {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const dismissAll = useCallback(() => {
    setToasts([])
  }, [])

  const show = useCallback(
    (toast: Omit<ToastProps, 'id' | 'onClose'>): string => {
      const id = `toast-${++toastIdCounter}`
      const newToast: ToastProps = {
        ...toast,
        id,
        onClose: dismiss
      }

      setToasts((prev) => [...prev, newToast])
      return id
    },
    [dismiss]
  )

  return { show, dismiss, dismissAll, toasts }
}

/**
 * Helper functions for common toast types
 */
export const toast = {
  info: (title: string, message?: string): void => {
    // This is a placeholder - actual implementation would use a global toast provider
    console.log('Toast (info):', title, message)
  },
  success: (title: string, message?: string): void => {
    console.log('Toast (success):', title, message)
  },
  warning: (title: string, message?: string): void => {
    console.log('Toast (warning):', title, message)
  },
  error: (title: string, message?: string): void => {
    console.log('Toast (error):', title, message)
  }
}
