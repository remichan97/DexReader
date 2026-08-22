import { app } from 'electron'
import path from 'node:path'
import log from 'electron-log'
import { is } from '@electron-toolkit/utils'
import { secureFs } from '../../filesystem/secure-fs'
import { settingsManager } from '../../settings/settings-manager'

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

  /**
   * Get the path to the logs folder
   */
  public getLogFolder(): string {
    return this.logFolder
  }

  /**
   * Clean up old log files based on retention policy
   * Removes .log and .old files older than specified retention period
   * @param retentionDays Number of days to keep logs (default: 30)
   * @param forceCleanup If true, deletes all log files regardless of age
   */
  public async cleanupLogs(forceCleanup = false): Promise<void> {
    try {
      const files = await secureFs.readDir(this.logFolder)
      const now = Date.now()
      const retentionDays = settingsManager.getByPath('logs', 'retentionInDays')
      const maxAge = retentionDays * 24 * 60 * 60 * 1000 // Convert days to milliseconds

      for (const file of files) {
        // Only process log files (main.log, renderer.log, *.old)
        if (!file.endsWith('.log') && !file.endsWith('.old')) continue

        const filePath = path.join(this.logFolder, file)

        try {
          const stats = await secureFs.stat(filePath)
          const fileAge = now - stats.mtime.getTime()

          if (forceCleanup || fileAge > maxAge) {
            await secureFs.deleteFile(filePath)
            this.info(
              'main',
              `[Logs] Deleted old log file: ${file} (age: ${Math.floor(fileAge / (24 * 60 * 60 * 1000))} days)`
            )
          }
        } catch (fileError) {
          // Skip files that can't be accessed (might be in use)
          this.warn('main', `[Logs] Failed to process ${file}:`, fileError)
        }
      }
    } catch (error) {
      this.error('main', '[Logs] Failed to clean up logs:', error)
    }
  }

  private initLogger(): void {
    this.initMainLogger()
    this.initRendererLogger()
  }

  private initMainLogger(): void {
    this.mainLogInstance = log.create({ logId: 'main' })

    // Use electron-log's built-in rotation instead of date-based files
    this.mainLogInstance.transports.file.resolvePathFn = () => path.join(this.logFolder, 'main.log')
    this.mainLogInstance.transports.file.maxSize = 10 * 1024 * 1024 // 10MB per file
    this.mainLogInstance.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}'
    this.mainLogInstance.transports.file.level = is.dev ? 'debug' : 'info'
  }

  private initRendererLogger(): void {
    this.renderLogInstance = log.create({ logId: 'renderer' })

    // Use electron-log's built-in rotation instead of date-based files
    this.renderLogInstance.transports.file.resolvePathFn = () =>
      path.join(this.logFolder, 'renderer.log')
    this.renderLogInstance.transports.file.maxSize = 10 * 1024 * 1024 // 10MB per file
    this.renderLogInstance.transports.file.format =
      '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}'
    this.renderLogInstance.transports.file.level = is.dev ? 'debug' : 'info'
  }
}
export const logger = new LoggingService()
