/**
 * App State Store - Global UI state management
 *
 * Manages:
 * - Theme (system detection + manual override)
 * - Fullscreen state
 * - Future: Window size, zoom level, etc.
 *
 * Persistence: themeMode persisted to localStorage
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Theme, ThemeMode } from './types'

interface AppState {
  // Theme management
  theme: Theme // Computed: system or manual
  systemTheme: Theme // From Electron main process
  themeMode: ThemeMode // User preference: 'system' | 'light' | 'dark'

  // UI state (non-persisted)
  isFullscreen: boolean

  // Actions
  setTheme: (theme: Theme) => void
  setSystemTheme: (theme: Theme) => void
  setThemeMode: (mode: ThemeMode) => void
  setFullscreen: (fullscreen: boolean) => void
}

/**
 * Helper to calculate the effective theme
 * If themeMode is 'system', use systemTheme
 * Otherwise, use the explicit themeMode as the theme
 */
const calculateTheme = (themeMode: ThemeMode, systemTheme: Theme): Theme => {
  return themeMode === 'system' ? systemTheme : (themeMode as Theme)
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial state
      theme: 'light',
      systemTheme: 'light',
      themeMode: 'system',
      isFullscreen: false,

      // Actions
      setTheme: (theme) =>
        set({
          theme,
          // When manually setting theme, update themeMode to match
          themeMode: theme
        }),

      setSystemTheme: (systemTheme) =>
        set((state) => ({
          systemTheme,
          // Recalculate theme if in system mode
          theme: calculateTheme(state.themeMode, systemTheme)
        })),

      setThemeMode: (themeMode) =>
        set((state) => ({
          themeMode,
          // Recalculate theme based on new mode
          theme: calculateTheme(themeMode, state.systemTheme)
        })),

      setFullscreen: (isFullscreen) => set({ isFullscreen })
    }),
    {
      name: 'dexreader-app', // localStorage key
      // Only persist themeMode (not theme, systemTheme, or isFullscreen)
      partialize: (state) => ({
        themeMode: state.themeMode
      })
    }
  )
)
