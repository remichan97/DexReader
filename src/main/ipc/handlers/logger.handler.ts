import { shell } from 'electron'
import { logger } from '../../services/logging/logging.service'
import { rendererLog } from '../../services/logging/renderer-logging.service'
import { wrapIpcHandler } from '../wrap-handler'

export function registerLoggerHandlers(): void {
  /**
   * Log an informational message from the renderer process.
   *
   * Writes INFO level log entries to the main log file. Use for general
   * application flow information, user actions, and non-critical events.
   *
   * @param message - Log message (converted to string if not already)
   * @param args - Additional arguments to log (serialized as JSON)
   * @returns Promise<void>
   *
   * @example
   * // Log user action
   * await window.api.logInfo('User opened manga detail', { mangaId: 'abc123' })
   */
  wrapIpcHandler('log:info', async (_, message: unknown, ...args: unknown[]) => {
    return rendererLog.info(String(message), ...args)
  })

  /**
   * Log an error message from the renderer process.
   *
   * Writes ERROR level log entries to the main log file. Use for errors,
   * exceptions, and critical failures that need investigation.
   *
   * @param message - Error message (converted to string if not already)
   * @param args - Additional error context (e.g., error objects, stack traces)
   * @returns Promise<void>
   *
   * @example
   * // Log API error
   * await window.api.logError('Failed to fetch manga', error)
   */
  wrapIpcHandler('log:error', async (_, message: unknown, ...args: unknown[]) => {
    return rendererLog.error(String(message), ...args)
  })

  /**
   * Log a debug message from the renderer process.
   *
   * Writes DEBUG level log entries to the main log file. Use for detailed
   * debugging information, only written when debug logging is enabled.
   *
   * @param message - Debug message (converted to string if not already)
   * @param args - Additional debug context
   * @returns Promise<void>
   *
   * @example
   * // Log component render
   * await window.api.logDebug('MangaCard rendered', { mangaId, cached: true })
   */
  wrapIpcHandler('log:debug', async (_, message: unknown, ...args: unknown[]) => {
    return rendererLog.debug(String(message), ...args)
  })

  /**
   * Log a warning message from the renderer process.
   *
   * Writes WARN level log entries to the main log file. Use for unexpected
   * but recoverable conditions, deprecated API usage, or potential issues.
   *
   * @param message - Warning message (converted to string if not already)
   * @param args - Additional warning context
   * @returns Promise<void>
   *
   * @example
   * // Log recoverable error
   * await window.api.logWarn('Image failed to load, using fallback', { url })
   */
  wrapIpcHandler('log:warn', async (_, message: unknown, ...args: unknown[]) => {
    return rendererLog.warn(String(message), ...args)
  })

  /**
   * Clean up old log files based on retention period.
   *
   * Deletes log files older than the configured retention period (default: 7 days).
   * Can optionally force delete all log files immediately for troubleshooting.
   *
   * @param forceCleanup - If true, deletes ALL log files immediately; if false/undefined, deletes only old files based on retention period
   * @returns Promise<void>
   *
   * @example
   * // Clean up old logs (respects retention setting)
   * await window.api.cleanupLogs()
   *
   * @example
   * // Delete all logs immediately
   * await window.api.cleanupLogs(true)
   */
  wrapIpcHandler('log:cleanup', async (_, forceCleanup?: boolean) => {
    return logger.cleanupLogs(forceCleanup ?? false)
  })

  /**
   * Open the logs folder in the system's default file explorer.
   *
   * Opens the AppData logs directory (e.g., C:\Users\<user>\AppData\Roaming\DexReader\logs)
   * using the system's default file manager. Useful for accessing logs manually or
   * sharing log files for troubleshooting.
   *
   * @returns Promise<string> - Empty string on success, error string if folder cannot be opened
   *
   * @example
   * // Open logs folder from Help menu
   * await window.api.openLogsFolder()
   */
  wrapIpcHandler('log:open-folder', async () => {
    return shell.openPath(logger.getLogFolder())
  })
}
