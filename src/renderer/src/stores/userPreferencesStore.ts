/**
 * User Preferences Store - Persistent user settings
 *
 * Manages all user-configurable preferences including:
 * - Reading preferences (mode, direction, image fit, preload)
 * - Download preferences (path, quality, simultaneous downloads)
 * - UI preferences (compact view, page numbers)
 * - Notification preferences (notifications, auto-update)
 *
 * All preferences are persisted to localStorage and survive app restarts.
 *
 * EXTENSIBILITY NOTE:
 * This store will be extended with additional preferences in future phases:
 * - Phase 2: Additional reader settings (zoom, tap zones, gesture controls)
 * - Phase 3: Library organization preferences (sort order, filters, grid size)
 * - Phase 5: Localization settings (language, date format, number format)
 * - Phase 6: Privacy and analytics preferences (telemetry, crash reports)
 *
 * Adding new preferences is straightforward with Zustand's persist middleware:
 * 1. Add new field to UserPreferencesState interface
 * 2. Add default value to defaultPreferences object
 * 3. Create setter action if needed
 * 4. Existing users automatically get new defaults on next app launch
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  ReadingMode,
  ReadingDirection,
  ImageFit,
  ImageQuality,
  ReadingPreferences,
  DownloadPreferences,
  UIPreferences,
  NotificationPreferences
} from './types'

interface UserPreferencesState {
  // Reading preferences
  readingMode: ReadingMode
  readingDirection: ReadingDirection
  imageFit: ImageFit
  preloadPages: number

  // Download preferences
  downloadsPath: string
  simultaneousDownloads: number
  imageQuality: ImageQuality

  // UI preferences
  compactView: boolean
  showPageNumbers: boolean

  // Notification preferences
  notifications: boolean
  autoUpdate: boolean

  // Actions - Granular updates
  setReadingMode: (mode: ReadingMode) => void
  setReadingDirection: (direction: ReadingDirection) => void
  setImageFit: (fit: ImageFit) => void
  setPreloadPages: (pages: number) => void

  setDownloadsPath: (path: string) => void
  setSimultaneousDownloads: (count: number) => void
  setImageQuality: (quality: ImageQuality) => void

  setCompactView: (compact: boolean) => void
  setShowPageNumbers: (show: boolean) => void

  setNotifications: (enabled: boolean) => void
  setAutoUpdate: (enabled: boolean) => void

  // Bulk update actions
  updateReadingPreferences: (prefs: Partial<ReadingPreferences>) => void
  updateDownloadPreferences: (prefs: Partial<DownloadPreferences>) => void
  updateUIPreferences: (prefs: Partial<UIPreferences>) => void
  updateNotificationPreferences: (prefs: Partial<NotificationPreferences>) => void

  // Reset to defaults
  resetToDefaults: () => void
}

// Default preferences - sensible defaults for first-time users
const defaultPreferences = {
  // Reading
  readingMode: 'single' as ReadingMode,
  readingDirection: 'ltr' as ReadingDirection,
  imageFit: 'height' as ImageFit,
  preloadPages: 2,

  // Downloads
  downloadsPath: '', // Will be set by main process to downloads folder
  simultaneousDownloads: 3,
  imageQuality: 'high' as ImageQuality,

  // UI
  compactView: false,
  showPageNumbers: true,

  // Notifications
  notifications: true,
  autoUpdate: true
}

export const useUserPreferencesStore = create<UserPreferencesState>()(
  persist(
    (set) => ({
      ...defaultPreferences,

      // Individual setters
      setReadingMode: (readingMode) => set({ readingMode }),
      setReadingDirection: (readingDirection) => set({ readingDirection }),
      setImageFit: (imageFit) => set({ imageFit }),
      setPreloadPages: (preloadPages) => {
        // Validate: must be 1-5
        const validated = Math.max(1, Math.min(5, preloadPages))
        set({ preloadPages: validated })
      },

      setDownloadsPath: (downloadsPath) => set({ downloadsPath }),
      setSimultaneousDownloads: (simultaneousDownloads) => {
        // Validate: must be 1-5
        const validated = Math.max(1, Math.min(5, simultaneousDownloads))
        set({ simultaneousDownloads: validated })
      },
      setImageQuality: (imageQuality) => set({ imageQuality }),

      setCompactView: (compactView) => set({ compactView }),
      setShowPageNumbers: (showPageNumbers) => set({ showPageNumbers }),

      setNotifications: (notifications) => set({ notifications }),
      setAutoUpdate: (autoUpdate) => set({ autoUpdate }),

      // Bulk update actions
      updateReadingPreferences: (prefs) =>
        set((state) => ({
          readingMode: prefs.readingMode ?? state.readingMode,
          readingDirection: prefs.readingDirection ?? state.readingDirection,
          imageFit: prefs.imageFit ?? state.imageFit,
          preloadPages: prefs.preloadPages
            ? Math.max(1, Math.min(5, prefs.preloadPages))
            : state.preloadPages
        })),

      updateDownloadPreferences: (prefs) =>
        set((state) => ({
          downloadsPath: prefs.downloadsPath ?? state.downloadsPath,
          simultaneousDownloads: prefs.simultaneousDownloads
            ? Math.max(1, Math.min(5, prefs.simultaneousDownloads))
            : state.simultaneousDownloads,
          imageQuality: prefs.imageQuality ?? state.imageQuality
        })),

      updateUIPreferences: (prefs) =>
        set((state) => ({
          compactView: prefs.compactView ?? state.compactView,
          showPageNumbers: prefs.showPageNumbers ?? state.showPageNumbers
        })),

      updateNotificationPreferences: (prefs) =>
        set((state) => ({
          notifications: prefs.notifications ?? state.notifications,
          autoUpdate: prefs.autoUpdate ?? state.autoUpdate
        })),

      // Reset all preferences to defaults
      resetToDefaults: () => set(defaultPreferences)
    }),
    {
      name: 'dexreader-preferences' // localStorage key
    }
  )
)
