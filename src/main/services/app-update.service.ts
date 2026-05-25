import { is } from '@electron-toolkit/utils'
import { app, BrowserWindow } from 'electron'
import pkg from 'electron-updater'
const { autoUpdater } = pkg
import { mainLog } from './logging/main-logging.service'
import { settingsManager } from '../settings/settings-manager'

class AppUpdateService {
  private mainWindow: BrowserWindow | undefined = undefined
  private checkInProgress: boolean = false
  private updateDownloaded: boolean = false
  private isManualCheck: boolean = false // Track if current check is user-initiated

  constructor() {
    this.initAutoUpdater()
  }

  getAppVersion(): string {
    return app.getVersion()
  }

  exitAndInstall(): void {
    if (!this.updateDownloaded) {
      mainLog.warn('[AppUpdate] No update downloaded yet. Cannot install.')
      return
    }

    mainLog.info('[AppUpdate] Installing update and restarting app...')

    setImmediate(() => {
      autoUpdater.quitAndInstall(false, true)
    })
  }

  async checkForUpdates(isManual: boolean = false): Promise<void> {
    if (this.checkInProgress) {
      mainLog.warn('[AppUpdate] Update check already in progress. Please wait.')
      return
    }

    if (!isManual) {
      const isAutoUpdate = (await settingsManager.getByPath('update', 'autoCheck')) as boolean

      if (!isAutoUpdate) {
        mainLog.info('[AppUpdate] Auto-update is disabled. Skipping update check.')
        return
      }
    }

    try {
      this.checkInProgress = true
      this.isManualCheck = isManual // Track whether this is a manual check
      await autoUpdater.checkForUpdates()
    } catch (error) {
      mainLog.error('[AppUpdate] Failed to check for updates:', error)
      // Always show errors, even for automatic checks
      this.sendToRenderer('update-error', {
        message: (error as Error).message,
        userMessage: this.getUserFriendlyErrorMessage(error as Error)
      })
    } finally {
      this.checkInProgress = false
    }
  }

  async downloadUpdate(): Promise<void> {
    try {
      mainLog.info('[AppUpdate] Starting update download...')
      this.sendToRenderer('update-downloading')
      await autoUpdater.downloadUpdate()
    } catch (error) {
      mainLog.error('[AppUpdate] Failed to download update:', error)
      this.sendToRenderer('update-error', {
        message: (error as Error).message,
        userMessage: this.getUserFriendlyErrorMessage(error as Error)
      })
    }
  }

  private initAutoUpdater(): void {
    autoUpdater.autoDownload = false // We have user control over when to download updates
    autoUpdater.autoInstallOnAppQuit = true // Install updates on app quit

    if (is.dev) {
      autoUpdater.forceDevUpdateConfig = true // Force using the dev update config in development
      mainLog.info('[AppUpdate] Running in development mode, using dev update config.')
    }

    // Use electron-updater's built-in logger for detailed internal logging
    // Only add custom logs in event handlers where we need extra context
    autoUpdater.logger = {
      info: (message: string) => mainLog.info(`[AutoUpdater] ${message}`),
      warn: (message: string) => mainLog.warn(`[AutoUpdater] ${message}`),
      error: (message: string) => mainLog.error(`[AutoUpdater] ${message}`),
      debug: (message: string) => mainLog.debug(`[AutoUpdater] ${message}`)
    }

    this.setupUpdateEventListeners()
  }

  private getUserFriendlyErrorMessage(error: Error): string {
    const message = error.message.toLowerCase()

    // Object lookup common error patterns to user-friendly messages
    const errorMap: Record<string, string> = {
      'net::': 'Unable to connect to update server. Please check your internet connection.',
      eacces:
        'Permission denied. Please try running the app as administrator. You may also reinstall the app if the issue persists.',
      enospc: 'Insufficient disk space. Please free up some space and try again.',
      signature:
        'Update file signature verification failed. This may indicate a corrupted download or a security issue. Please try downloading the update again.'
    }

    for (const [key, userMessage] of Object.entries(errorMap)) {
      if (message.includes(key)) {
        return userMessage
      }
    }

    return `Something went wrong and we could't check for updates. Please try again later.`
  }

  private async shouldAutoDownload(): Promise<boolean> {
    const autoDownload = (await settingsManager.getByPath('update', 'autoDownload')) as boolean
    return autoDownload
  }

  private setupUpdateEventListeners(): void {
    autoUpdater.on('checking-for-update', () => {
      // Only show "checking" banner for manual checks, silent for automatic startup checks
      if (this.isManualCheck) {
        this.sendToRenderer('update-checking')
      }
    })

    autoUpdater.on('update-available', (info) => {
      // Always notify about available updates, regardless of manual/automatic
      this.shouldAutoDownload().then((shouldDownload) => {
        if (shouldDownload) {
          mainLog.info('[AppUpdate] Auto-download enabled, starting download...')
          this.downloadUpdate()
        } else {
          mainLog.info('[AppUpdate] Auto-download disabled, waiting for user action.')
        }
      })
      this.sendToRenderer('update-available', {
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes: info.releaseNotes
      })
    })

    autoUpdater.on('update-not-available', (info) => {
      // Only show "up to date" banner for manual checks, silent for automatic checks
      if (this.isManualCheck) {
        this.sendToRenderer('update-not-available', info)
      }
    })

    autoUpdater.on('download-progress', (progressObj) => {
      // electron-updater logs download progress internally, just send to renderer
      this.sendToRenderer('update-download-progress', {
        percent: progressObj.percent,
        transferred: progressObj.transferred,
        total: progressObj.total,
        bytesPerSecond: progressObj.bytesPerSecond
      })
    })

    autoUpdater.on('update-downloaded', (info) => {
      // electron-updater logs download completion, just track state
      this.updateDownloaded = true
      this.checkInProgress = false
      this.sendToRenderer('update-downloaded', {
        version: info.version,
        releaseNotes: info.releaseNotes,
        releaseDate: info.releaseDate
      })
    })

    autoUpdater.on('error', (err) => {
      // electron-updater logs the error, just add user-friendly message context
      mainLog.error(`[AppUpdate] User-friendly error: ${this.getUserFriendlyErrorMessage(err)}`)
      this.sendToRenderer('update-error', {
        message: err.message,
        userMessage: this.getUserFriendlyErrorMessage(err)
      })
    })
  }

  setMainWindow(mainWindow: BrowserWindow): void {
    this.mainWindow = mainWindow
  }

  private sendToRenderer(channel: string, data?: unknown): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(`app-update:${channel}`, data)
    }
  }
}
export const appUpdateService = new AppUpdateService()
