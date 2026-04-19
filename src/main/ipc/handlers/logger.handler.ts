import { shell } from 'electron'
import { logger } from '../../services/logging/logging.service'
import { rendererLog } from '../../services/logging/renderer-logging.service'
import { wrapIpcHandler } from '../wrap-handler'

export function registerLoggerHandlers(): void {
  wrapIpcHandler('log:info', async (_, message: unknown, ...args: unknown[]) => {
    return rendererLog.info(String(message), ...args)
  })

  wrapIpcHandler('log:error', async (_, message: unknown, ...args: unknown[]) => {
    return rendererLog.error(String(message), ...args)
  })

  wrapIpcHandler('log:debug', async (_, message: unknown, ...args: unknown[]) => {
    return rendererLog.debug(String(message), ...args)
  })

  wrapIpcHandler('log:warn', async (_, message: unknown, ...args: unknown[]) => {
    return rendererLog.warn(String(message), ...args)
  })

  // Clean up log files based on retention period or delete all logs
  wrapIpcHandler('log:cleanup', async (_, forceCleanup?: boolean) => {
    return logger.cleanupLogs(forceCleanup ?? false)
  })

  // Open logs folder in file explorer
  wrapIpcHandler('log:open-folder', async () => {
    return shell.openPath(logger.getLogFolder())
  })
}
