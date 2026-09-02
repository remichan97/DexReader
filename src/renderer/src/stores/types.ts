/**
 * Shared TypeScript interfaces for all Zustand stores
 * Used across appStore, toastStore, and libraryStore
 */

// ============================================================================
// Toast Types
// ============================================================================

export type ToastVariant = 'info' | 'success' | 'warning' | 'error' | 'loading'

export interface ToastItem {
  id: string
  variant: ToastVariant
  title: string
  message?: string
  duration?: number // milliseconds, 0 = infinite
}

// ============================================================================
// Theme Types
// ============================================================================

export type Theme = 'light' | 'dark'
export type ThemeMode = 'system' | 'light' | 'dark'
