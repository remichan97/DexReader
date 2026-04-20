import { getCurrentTheme, getSystemAccentColor } from '../../theme'
import { wrapIpcHandler } from '../wrap-handler'

export function registerThemeHandlers(): void {
  /**
   * Get the system's current accent color.
   *
   * Retrieves the accent color from the operating system (e.g., Windows accent color,
   * macOS tint color). Returns as a hex color string for use in custom theming.
   *
   * @returns Promise<string> - Hex color code (e.g., '#0078D4')
   *
   * @example
   * // Get system accent color for custom theming
   * const accentColor = await window.api.getSystemAccentColor()
   * console.log(accentColor) // '#0078D4'
   */
  wrapIpcHandler('theme:get-system-accent-color', async () => {
    return getSystemAccentColor()
  })

  /**
   * Get the application's current theme.
   *
   * Returns the active theme ('light', 'dark', or 'system'). When set to 'system',
   * the app follows the OS theme preference. Theme is persisted in application settings.
   *
   * @returns Promise<'light' | 'dark' | 'system'> - Current theme setting
   *
   * @example
   * // Check current theme
   * const theme = await window.api.getTheme()
   * if (theme === 'dark') {
   *   // Apply dark mode specific behavior
   * }
   */
  wrapIpcHandler('get-theme', () => {
    return getCurrentTheme()
  })
}
