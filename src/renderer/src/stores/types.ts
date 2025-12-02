/**
 * Shared TypeScript interfaces for all Zustand stores
 * Used across appStore, toastStore, userPreferencesStore, and libraryStore
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

// ============================================================================
// Reading Preferences Types
// ============================================================================

export type ReadingMode = 'single' | 'double' | 'vertical'
export type ReadingDirection = 'ltr' | 'rtl'
export type ImageFit = 'height' | 'width' | 'original'

export interface ReadingPreferences {
  readingMode: ReadingMode
  readingDirection: ReadingDirection
  imageFit: ImageFit
  preloadPages: number // 1-5
}

// ============================================================================
// Download Preferences Types
// ============================================================================

export type ImageQuality = 'original' | 'high' | 'medium' | 'low'

export interface DownloadPreferences {
  downloadsPath: string
  simultaneousDownloads: number // 1-5
  imageQuality: ImageQuality
}

// ============================================================================
// UI Preferences Types
// ============================================================================

export interface UIPreferences {
  compactView: boolean
  showPageNumbers: boolean
}

// ============================================================================
// Notification Preferences Types
// ============================================================================

export interface NotificationPreferences {
  notifications: boolean
  autoUpdate: boolean
}

// ============================================================================
// Library Types (Phase 3 - Skeleton for now)
// ============================================================================

export interface Collection {
  id: string
  name: string
  mangaIds: string[]
  createdAt: number
  updatedAt: number
}
