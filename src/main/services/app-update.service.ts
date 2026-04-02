import { is } from '@electron-toolkit/utils'
import { app, BrowserWindow } from 'electron'
import { autoUpdater } from 'electron-updater'
import { getSettingByPath } from '../settings/settings-manager'

export class AppUpdateService {
  private mainWindow: BrowserWindow | undefined = undefined
  private checkInProgress: boolean = false
  private updateDownloaded: boolean = false

  constructor() {
    this.initAutoUpdater()
  }

  getAppVersion(): string {
    return app.getVersion()
  }

  exitAndInstall(): void {
    if (!this.updateDownloaded) {
      console.warn('[AppUpdate] No update downloaded yet. Cannot install.')
      return
    }

    console.log('[AppUpdate] Installing update and restarting app...')

    setImmediate(() => {
      autoUpdater.quitAndInstall(false, true)
    })
  }

  async checkForUpdates(isManual: boolean = false): Promise<void> {
    if (this.checkInProgress) {
      console.warn('[AppUpdate] Update check already in progress. Please wait.')
      return
    }

    if (!isManual) {
      const isAutoUpdate = (await getSettingByPath('update', 'autoUpdate')) as boolean

      if (!isAutoUpdate) {
        console.log('[AppUpdate] Auto-update is disabled. Skipping update check.')
        return
      }
    }

    try {
      this.checkInProgress = true
      await autoUpdater.checkForUpdates()
    } catch (error) {
      console.error(`[AppUpdate] Failed to check for updates: ${(error as Error).message}`)
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
      console.log('[AppUpdate] Starting update download...')
      this.sendToRenderer('update-downloading')
      await autoUpdater.downloadUpdate()
    } catch (error) {
      console.error(`[AppUpdate] Failed to download update: ${(error as Error).message}`)
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
      console.log('[AppUpdate] Running in development mode, using dev update config.')
    }

    // Append all message logs with a prefix for better visibility in the console
    autoUpdater.logger = {
      info: (message: string) => console.log(`[AppUpdate] ${message}`),
      warn: (message: string) => console.warn(`[AppUpdate] ${message}`),
      error: (message: string) => console.error(`[AppUpdate] ${message}`),
      debug: (message: string) => console.debug(`[AppUpdate] ${message}`)
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

    return `Something went wrong: ${error.message}`
  }

  private async shouldAutoDownload(): Promise<boolean> {
    const isAutoDownload = (await getSettingByPath('update', 'autoDownload')) as boolean
    return isAutoDownload
  }

  private setupUpdateEventListeners(): void {
    autoUpdater.on('checking-for-update', () => {
      console.log('[AppUpdate] Checking for updates...')
      this.sendToRenderer('update-checking')
    })

    autoUpdater.on('update-available', (info) => {
      console.log(`[AppUpdate] Update available: version ${info.version}`)
      this.shouldAutoDownload().then((shouldDownload) => {
        if (shouldDownload) {
          this.downloadUpdate()
        }
      })
      this.sendToRenderer('update-available', {
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes: info.releaseNotes
      })
    })

    autoUpdater.on('update-not-available', (info) => {
      console.log('[AppUpdate] Currently up-to-date. No updates available.')
      this.sendToRenderer('update-not-available', info)
    })

    autoUpdater.on('download-progress', (progressObj) => {
      // Log every 10% increment to avoid flooding the console
      if (Math.floor(progressObj.percent) % 10 === 0) {
        console.log(`[AppUpdate] Download progress: ${progressObj.percent.toFixed(2)}%`)
      }

      this.sendToRenderer('update-download-progress', {
        percent: progressObj.percent,
        transferred: progressObj.transferred,
        total: progressObj.total,
        bytesPerSecond: progressObj.bytesPerSecond
      })
    })

    autoUpdater.on('update-downloaded', (info) => {
      console.log(
        `[AppUpdate] Update downloaded: version ${info.version}. Ready to install on quit.`
      )
      this.updateDownloaded = true
      this.checkInProgress = false
      this.sendToRenderer('update-downloaded', {
        version: info.version,
        releaseNotes: info.releaseNotes,
        releaseDate: info.releaseDate
      })
    })

    autoUpdater.on('error', (err) => {
      console.error(`[AppUpdate] Error during update process: ${err.message}`)
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
