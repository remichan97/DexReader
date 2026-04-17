import { logger } from './logging.service'

class MainLogService {
  public info(message: string, ...args: unknown[]): void {
    logger.info('main', message, ...args)
  }

  public error(message: string, ...args: unknown[]): void {
    logger.error('main', message, ...args)
  }

  public debug(message: string, ...args: unknown[]): void {
    logger.debug('main', message, ...args)
  }

  public warn(message: string, ...args: unknown[]): void {
    logger.warn('main', message, ...args)
  }
}
export const mainLog = new MainLogService()
