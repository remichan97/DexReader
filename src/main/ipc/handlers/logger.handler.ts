import { logger } from '../../services/logging.service'
import { wrapIpcHandler } from '../wrap-handler'

export function registerLoggerHandlers(): void {
  wrapIpcHandler('log:info', async (_, message: unknown, ...args: unknown[]) => {
    return logger.info('renderer', String(message), ...args)
  })

  wrapIpcHandler('log:error', async (_, message: unknown, ...args: unknown[]) => {
    return logger.error('renderer', String(message), ...args)
  })

  wrapIpcHandler('log:debug', async (_, message: unknown, ...args: unknown[]) => {
    return logger.debug('renderer', String(message), ...args)
  })

  wrapIpcHandler('log:warn', async (_, message: unknown, ...args: unknown[]) => {
    return logger.warn('renderer', String(message), ...args)
  })
}
