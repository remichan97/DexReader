import { logger } from './logging.service'

class RendererLoggingService {
  public info(message: string, ...args: unknown[]): void {
    logger.info('renderer', message, ...args)
  }

  public error(message: string, ...args: unknown[]): void {
    logger.error('renderer', message, ...args)
  }

  public debug(message: string, ...args: unknown[]): void {
    logger.debug('renderer', message, ...args)
  }

  public warn(message: string, ...args: unknown[]): void {
    logger.warn('renderer', message, ...args)
  }
}
export const rendererLog = new RendererLoggingService()
