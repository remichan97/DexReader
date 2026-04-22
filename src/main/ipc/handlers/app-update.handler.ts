import { appUpdateService } from '../../services/app-update.service'
import { wrapIpcHandler } from '../wrap-handler'

export function registerAppUpdateHandler(): void {
  /**
   * Check for application updates.
   *
   * Checks GitHub Releases for newer versions using electron-updater.
   * Respects user's auto-check settings when called automatically on startup.
   * Manual checks always proceed regardless of settings.
   *
   * @param manual - True if user initiated check (Help > Check for Updates), false for automatic startup check
   * @returns Promise<{available: boolean, version?: string}> - Update availability status
   *
   * @example
   * // Manual check from Help menu
   * const result = await window.api.checkForUpdates(true)
   * if (result.available) {
   *   console.log(`Update ${result.version} available`)
   * }
   *
   * @example
   * // Automatic check on startup
   * await window.api.checkForUpdates(false)
   */
  wrapIpcHandler('app-update:check', async (_, manual: unknown) => {
    // Validate and safely coerce manual parameter
    const isManual = typeof manual === 'boolean' ? manual : false
    return await appUpdateService.checkForUpdates(isManual)
  })

  /**
   * Download available application update.
   *
   * Downloads the update in the background. Progress is emitted via IPC events.
   * Download is cached, so calling this multiple times won't re-download.
   *
   * @returns Promise<void>
   *
   * @example
   * // Start downloading update
   * await window.api.downloadUpdate()
   */
  wrapIpcHandler('app-update:download', async () => {
    return await appUpdateService.downloadUpdate()
  })

  /**
   * Quit application and install downloaded update.
   *
   * Exits the app immediately and launches the installer. App will restart
   * automatically after installation completes. Unsaved changes will be lost.
   *
   * @returns void - Does not return (app exits)
   *
   * @example
   * // Install update and restart
   * window.api.installUpdate() // App quits immediately
   */
  wrapIpcHandler('app-update:install', async () => {
    return appUpdateService.exitAndInstall()
  })

  /**
   * Get current application version.
   *
   * Returns the app version from package.json in semantic versioning format.
   *
   * @returns Promise<string> - Version string (e.g., '1.0.0')
   *
   * @example
   * // Display current version in About dialog
   * const version = await window.api.getAppVersion()
   * console.log(`DexReader ${version}`)
   */
  wrapIpcHandler('app-update:version', async () => {
    return appUpdateService.getAppVersion()
  })
}
