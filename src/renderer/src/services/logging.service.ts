/**
 * Renderer-side logging service
 * Forwards logs to main process via IPC for centralized file logging
 *
 * Usage:
 *   import { rendererLog } from '@renderer/services/logging.service'
 *   rendererLog.info('[Component] Operation completed')
 *   rendererLog.error('[API] Request failed:', error)
 *
 * Logs are written to: AppData/logs/renderer.log (10MB rotation)
 */

interface RendererLogger {
  info(message: string, ...args: unknown[]): void
  error(message: string, ...args: unknown[]): void
  warn(message: string, ...args: unknown[]): void
  debug(message: string, ...args: unknown[]): void
}

class RendererLoggingService implements RendererLogger {
  /**
   * Log informational messages: user actions, state changes, operation completion
   */
  public info(message: string, ...args: unknown[]): void {
    // Log to console for DevTools
    console.info(message, ...args)

    // Forward to main process for file logging via existing logger API
    globalThis.logger.info(message, ...args)
  }

  /**
   * Log errors: exceptions, API failures, IPC errors, component crashes
   */
  public error(message: string, ...args: unknown[]): void {
    console.error(message, ...args)
    globalThis.logger.error(message, ...args)
  }

  /**
   * Log warnings: validation failures, deprecated usage, fallback behavior
   */
  public warn(message: string, ...args: unknown[]): void {
    console.warn(message, ...args)
    globalThis.logger.warn(message, ...args)
  }

  /**
   * Log debug information: detailed state, API responses (dev mode only)
   */
  public debug(message: string, ...args: unknown[]): void {
    console.debug(message, ...args)
    globalThis.logger.debug(message, ...args)
  }
}

export const rendererLog = new RendererLoggingService()
