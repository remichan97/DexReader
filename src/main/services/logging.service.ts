import { app } from 'electron'
import path from 'node:path'
import log from 'electron-log'
import { is } from '@electron-toolkit/utils'

class LoggingService {
  private readonly logFolder = path.join(app.getPath('userData'), 'logs')
  private renderLogInstance: log.MainLogger | undefined = undefined
  private mainLogInstance: log.MainLogger | undefined = undefined

  constructor() {
    this.initLogger()
  }

  public info(scope: 'main' | 'renderer', message: string, ...args: unknown[]): void {
    if (scope === 'main') {
      this.mainLogInstance?.info(message, ...args)
    } else {
      this.renderLogInstance?.info(message, ...args)
    }
  }

  public error(scope: 'main' | 'renderer', message: string, ...args: unknown[]): void {
    if (scope === 'main') {
      this.mainLogInstance?.error(message, ...args)
    } else {
      this.renderLogInstance?.error(message, ...args)
    }
  }

  public debug(scope: 'main' | 'renderer', message: string, ...args: unknown[]): void {
    if (scope === 'main') {
      this.mainLogInstance?.debug(message, ...args)
    } else {
      this.renderLogInstance?.debug(message, ...args)
    }
  }

  public warn(scope: 'main' | 'renderer', message: string, ...args: unknown[]): void {
    if (scope === 'main') {
      this.mainLogInstance?.warn(message, ...args)
    } else {
      this.renderLogInstance?.warn(message, ...args)
    }
  }

  private initLogger(): void {
    this.initMainLogger()
    this.initRendererLogger()
  }

  private initMainLogger(): void {
    this.mainLogInstance = log.create({ logId: 'main' })
    this.mainLogInstance.transports.file.fileName = 'main.log'
    this.mainLogInstance.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}'
    this.mainLogInstance.transports.file.resolvePathFn = () => {
      const logFileName = `app-${new Date().toISOString().split('T')[0]}.log`
      return path.join(this.logFolder, logFileName)
    }
    this.mainLogInstance.transports.file.level = is.dev ? 'debug' : 'info'
  }

  private initRendererLogger(): void {
    this.renderLogInstance = log.create({ logId: 'renderer' })
    this.renderLogInstance.transports.file.fileName = 'renderer.log'
    this.renderLogInstance.transports.file.format =
      '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}'
    this.renderLogInstance.transports.file.resolvePathFn = () => {
      const logFileName = `renderer-${new Date().toISOString().split('T')[0]}.log`
      return path.join(this.logFolder, logFileName)
    }
    this.renderLogInstance.transports.file.level = is.dev ? 'debug' : 'info'
  }
}
export const logger = new LoggingService()
