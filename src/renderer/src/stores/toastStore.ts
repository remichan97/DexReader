/**
 * Toast Store - Global notification system
 *
 * Replaces the useToast hook with centralized Zustand state.
 * Any component can show toasts from anywhere in the app.
 *
 * Features:
 * - Auto-dismiss timers
 * - Multiple simultaneous toasts
 * - Programmatic dismiss by ID
 * - Unique ID generation
 */

import { create } from 'zustand'
import type { ToastItem } from './types'

interface ToastState {
  toasts: ToastItem[]
  show: (toast: Omit<ToastItem, 'id'>) => string
  dismiss: (id: string) => void
  dismissAll: () => void
}

// Counter for generating unique IDs
let toastIdCounter = 0

// Store active timers so we can clean them up
const activeTimers = new Map<string, NodeJS.Timeout>()

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  /**
   * Show a new toast notification
   * Returns the toast ID for programmatic dismissal
   */
  show: (toast) => {
    const id = `toast-${++toastIdCounter}-${Date.now()}`
    const duration = toast.duration ?? 5000 // Default 5 seconds

    const newToast: ToastItem = {
      ...toast,
      id,
      duration
    }

    // Add toast to array
    set((state) => ({
      toasts: [...state.toasts, newToast]
    }))

    // Set up auto-dismiss timer if duration > 0
    if (duration > 0) {
      const timer = setTimeout(() => {
        get().dismiss(id)
      }, duration)

      activeTimers.set(id, timer)
    }

    return id
  },

  /**
   * Dismiss a specific toast by ID
   * Cleans up any active timers
   */
  dismiss: (id) => {
    // Clear timer if exists
    const timer = activeTimers.get(id)
    if (timer) {
      clearTimeout(timer)
      activeTimers.delete(id)
    }

    // Remove toast from array
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id)
    }))
  },

  /**
   * Dismiss all toasts at once
   * Cleans up all active timers
   */
  dismissAll: () => {
    // Clear all timers
    for (const timer of activeTimers.values()) {
      clearTimeout(timer)
    }
    activeTimers.clear()

    // Clear toasts array
    set({ toasts: [] })
  }
}))

/**
 * Convenience hook for easier migration from useToast
 * Usage: const { show, dismiss, toasts } = useToast()
 */
export const useToast = useToastStore
