import { app, shell } from 'electron'
import { is } from '@electron-toolkit/utils'
import { AppSettings } from '../../../shared/types/settings/app-settings.type'
import { mainLog } from '../../services/logging/main-logging.service'
import { wrapIpcHandler } from '../wrap-handler'
import { cleanupRepo } from '../../database/repositories/cleanup.repo'
import type { ImageProxy } from '../../api/proxy/image.proxy'
import { settingsManager } from '../../settings/settings-manager'
import { gatekeeperService } from '../../services/gatekeeper.service'
import { isSettingsSectionKey, validateSection } from '../../settings/validators/section.validator'

export function registerAppSettingsHandlers(imageProxy?: ImageProxy): void {
  /**
   * Load all application settings.
   *
   * Reads settings from settings.json file in AppData directory. Returns entire
   * settings object with all sections (appearance, downloads, reader, update, logs, search, language).
   *
   * @returns Promise<AppSettings> - Complete settings object
   *
   * @example
   * // Load settings on app startup
   * const settings = await window.api.loadSettings()
   * console.log(settings.appearance.theme) // 'light' | 'dark' | 'system'
   */
  /**
   * Load all application settings.
   *
   * Reads settings from settings.json file in AppData directory. Returns entire
   * settings object with all sections (appearance, downloads, reader, update, logs, search, language).
   *
   * @returns Promise<AppSettings> - Complete settings object
   *
   * @example
   * // Load settings on app startup
   * const settings = await window.api.loadSettings()
   * console.log(settings.appearance.theme) // 'light' | 'dark' | 'system'
   */
  wrapIpcHandler('settings:load', async () => {
    return settingsManager.load()
  })

  /**
   * Get a specific settings section or nested property.
   *
   * Retrieves settings at section level (e.g., 'appearance') or nested property
   * level (e.g., 'appearance.theme'). Validates section names for security.
   *
   * @param section - Top-level settings section: 'appearance' | 'downloads' | 'reader' | 'update' | 'logs'
   * @param path - Optional dot-notation path to nested property (e.g., 'theme' for appearance.theme)
   * @returns Promise<any> - Settings value at specified path
   * @throws {TypeError} - If section is not a string
   * @throws {Error} - If section is invalid or path is not a string
   *
   * @example
   * // Get entire appearance section
   * const appearance = await window.api.getSetting('appearance')
   *
   * @example
   * // Get specific nested property
   * const theme = await window.api.getSetting('appearance', 'theme')
   */
  wrapIpcHandler('settings:get', async (_, section: unknown, path?: unknown) => {
    if (typeof section !== 'string') {
      throw new TypeError('Section must be a string')
    }

    // Validate section is a valid top-level key in AppSettings
    if (typeof section !== 'string' || !isSettingsSectionKey(section)) {
      throw new TypeError(`Unknown settings section: ${section}`)
    }

    if (path !== undefined && typeof path !== 'string') {
      throw new Error('Path must be a string')
    }

    return settingsManager.getByDynamicPath(section as keyof AppSettings, path)
  })

  /**
   * Open settings.json file in default text editor.
   *
   * Opens the settings file for manual editing. Useful for advanced users or
   * troubleshooting. Changes made externally require app restart to take effect.
   *
   * @returns Promise<void> - Resolves when file is opened (or fails to open)
   *
   * @example
   * // Open settings file from Help menu
   * await window.api.openSettingsFile()
   */
  wrapIpcHandler('settings:open-settings-file', async () => {
    return settingsManager.openSettingsFile()
  })

  /**
   * Reset all settings to default values.
   *
   * Overwrites settings.json with factory defaults. Does NOT clear library data
   * (favorites, progress, downloads). User preferences are lost.
   *
   * @returns Promise<boolean> - Always returns true on success
   *
   * @example
   * // Reset settings from Danger Zone
   * await window.api.resetToDefaults()
   */
  wrapIpcHandler('settings:reset-to-defaults', async () => {
    settingsManager.reset()
    gatekeeperService.reset() // Also reset gatekeeper settings
    return true
  })

  /**
   * Clear ALL application data and reset to factory state.
   *
   * DESTRUCTIVE: Deletes entire database (favorites, progress, downloads, collections),
   * resets settings to defaults, and restarts the app. Cannot be undone.
   * Use only for troubleshooting or complete reset.
   *
   * @returns Promise<boolean> - Returns true but app exits before promise resolves
   *
   * @example
   * // Nuclear option from Danger Zone
   * await window.api.clearAllData() // App will restart
   */
  wrapIpcHandler('settings:clear-all', async () => {
    cleanupRepo.clearAllData()

    settingsManager.reset()
    gatekeeperService.reset() // Also reset gatekeeper settings

    // In dev mode, just exit. In production, relaunch the app
    if (!is.dev) {
      app.relaunch()
    }
    app.exit(0)
    return true
  })

  /**
   * Restart the application.
   *
   * Relaunches the app and exits the current instance. Used when settings
   * changes require a restart to take full effect (e.g., language changes).
   *
   * @returns Promise<void>
   *
   * @example
   * // Restart app after language change
   * await window.app.restart()
   */
  wrapIpcHandler('app:restart', async () => {
    app.relaunch()
    app.exit(0)
  })

  /**
   * Open system date/time settings.
   *
   * Opens the operating system's region & language settings where users can change
   * date format preferences. Platform-specific implementation (Windows/macOS only,
   * returns false on Linux - no universal way).
   *
   * @returns Promise<boolean> - True if system settings opened, false if unsupported platform or failed
   *
   * @example
   * // Open system settings from date format hint
   * const opened = await window.api.openSystemDateSettings()
   * if (!opened) {
   *   console.log('Platform not supported or failed to open')
   * }
   */
  wrapIpcHandler('settings:open-system-date-settings', async () => {
    const platform = process.platform

    try {
      if (platform === 'win32') {
        // Windows: Open Region & Language settings
        await shell.openExternal('ms-settings:regionlanguage')
      } else if (platform === 'darwin') {
        // macOS: Open Language & Region in System Preferences
        await shell.openExternal('x-apple.systempreferences:com.apple.preference.international')
      } else {
        // Linux: No universal way, return false to indicate unsupported
        return false
      }
      return true
    } catch (error) {
      mainLog.error('[Settings] Failed to open system date settings:', error)
      return false
    }
  })

  /**
   * Open system network proxy settings.
   *
   * Opens the system's network proxy configuration panel. Used to let users configure
   * proxy settings for network connections to MangaDex.
   *
   * @returns Promise<boolean> - True if opened successfully, false if platform not supported
   *
   * @example
   * // Open proxy settings from Advanced Settings
   * const opened = await window.api.openSystemProxySettings()
   * if (!opened) {
   *   console.log('Platform not supported or failed to open')
   * }
   */
  wrapIpcHandler('settings:open-system-proxy-settings', async () => {
    const platform = process.platform

    try {
      if (platform === 'win32') {
        // Windows: Open Network & Internet > Proxy settings
        await shell.openExternal('ms-settings:network-proxy')
      } else if (platform === 'darwin') {
        // macOS: Open Network preferences
        await shell.openExternal('x-apple.systempreferences:com.apple.preference.network')
      } else {
        // Linux: No universal way, return false to indicate unsupported
        return false
      }
      return true
    } catch (error) {
      mainLog.error('[Settings] Failed to open system proxy settings:', error)
      return false
    }
  })

  /**
   * Get memory tier information for chapter cache sizing.
   *
   * Returns system RAM tier (Low/Normal/High) and recommended cache sizes based on
   * available memory. Used in Settings UI to help users choose appropriate cache size.
   *
   * @returns Promise<{tier: string, totalRAM: number, recommendedSize: number}> - Memory tier info
   *
   * @example
   * // Show tier-based recommendations in Settings
   * const tierInfo = await window.api.getMemoryTierInfo()
   * console.log(`Your system: ${tierInfo.tier} tier (${tierInfo.totalRAM} GB RAM)`)
   * console.log(`Recommended cache: ${tierInfo.recommendedSize} MB`)
   */
  wrapIpcHandler('settings:get-memory-tier-info', async () => {
    return settingsManager.getMemoryTierInfo()
  })

  /**
   * Update a single settings section, immediately (used by the Settings page's
   * autosave - see the settings-autosave migration plan).
   *
   * @param section - Top-level settings section
   * @param value - The section's complete new value (settingsManager.update replaces
   * the whole section, not a merge)
   * @throws {TypeError} - If section is unknown or value fails that section's validator
   */
  wrapIpcHandler('settings:update-section', async (_, section: unknown, value: unknown) => {
    if (typeof section !== 'string' || !isSettingsSectionKey(section)) {
      throw new TypeError(`Unknown settings section: ${section}`)
    }

    if (!validateSection(section, value)) {
      throw new TypeError(`Invalid settings values for ${section}`)
    }

    await settingsManager.updateSection(section, value)

    // Chapter cache size lives under `reader.performance` - refresh the running
    // proxy's cache immediately rather than waiting for a restart (mirrors what
    // settings:save-all used to do after every whole-object save).
    if (imageProxy && section === 'reader') {
      await imageProxy.updateChapterCacheSize()
      mainLog.info('[Settings] Chapter cache size updated after reader settings change')
    }
  })
}
