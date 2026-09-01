import { useEffect } from 'react'
import { useAppStore, useSidebarStore } from '@renderer/stores'
import { rendererLog } from '@renderer/services/logging.service'

/**
 * Loads the theme + sidebar display mode from settings and the OS as early as
 * possible on startup, then keeps `document.documentElement`'s theme dataset
 * in sync with the resolved theme.
 */
export function useStartupTheme(): void {
  const setSystemTheme = useAppStore((state) => state.setSystemTheme)
  const setThemeMode = useAppStore((state) => state.setThemeMode)
  const theme = useAppStore((state) => state.theme)
  const setSidebarDisplayMode = useSidebarStore((state) => state.setDisplayMode)

  // Load theme preference FIRST (before anything else)
  useEffect(() => {
    async function loadThemeEarly(): Promise<void> {
      try {
        // Load theme from settings
        const settingsResult = await globalThis.settings.load()
        if (settingsResult.success && settingsResult.data?.appearance?.theme) {
          setThemeMode(settingsResult.data.appearance.theme)
        }

        // Load sidebar display mode from settings
        if (settingsResult.success && settingsResult.data?.appearance?.sidebarSize) {
          setSidebarDisplayMode(settingsResult.data.appearance.sidebarSize)
        }

        // Get system theme
        const themeResult = await globalThis.api.getTheme()
        if (themeResult.success && themeResult.data) {
          setSystemTheme(themeResult.data as 'light' | 'dark')
        }
      } catch (error) {
        rendererLog.error('[useStartupTheme] Failed to load theme early:', error)
      }
    }
    void loadThemeEarly()
  }, [setThemeMode, setSystemTheme, setSidebarDisplayMode])

  // Apply theme to document
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])
}
