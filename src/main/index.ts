import { LocalImageProxy } from './api/proxy/local-image.proxy'
import { app, ipcMain } from 'electron'
import path from 'node:path'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { updateMenuState } from './menu/index'
import { secureFs } from './filesystem/secure-fs'
import { getAppDataPath, getDownloadsPath } from './filesystem/path-validator'
import { initializeDownloadsPath, loadSettings } from './settings/settings-manager'
import { ImageProxy } from './api/proxy/image.proxy'
import { createWindow, getMainWindow } from './window'
import { setupAppLifecycle } from './app-lifecycle'
import { registerAllHandlers } from './ipc/registry'
import { databaseConnection } from './database/connection'
import { runMigrations } from './database/migrations/migrations'
import { downloadQueueService } from './services/download-queue.service'
import { diskCacheUtil } from './api/utils/disk-cache.util'
import { appUpdateService } from './services/app-update.service'
import { mainLog } from './services/logging/main-logging.service'
import './i18n/i18n.config'

const imageProxy = new ImageProxy()
const localImageProxy = new LocalImageProxy()

// Store menu state
let menuState = {
  isIncognito: false
}

async function initFileSystem(): Promise<void> {
  mainLog.info('[Main] Initialising secure filesystem...')

  // Ensure app data directory exists
  const appDataPath = getAppDataPath()
  mainLog.debug(`[Main] App data path: ${appDataPath}`)
  await secureFs.ensureDir(appDataPath)

  //Ensure required directories exists
  await secureFs.ensureDir(path.join(appDataPath, 'metadata'))
  await secureFs.ensureDir(path.join(appDataPath, 'logs'))
  await secureFs.ensureDir(path.join(appDataPath, 'downloads'))
  await diskCacheUtil.initCachePath()

  // Load App settings
  const settings = await loadSettings()
  mainLog.info('[Main] Settings loaded:', settings)

  // Init Downloads path
  mainLog.debug('[Main] Initializing downloads path...')
  await initializeDownloadsPath().catch((error) =>
    mainLog.error('[Main] Failed to initialize downloads path:', error)
  )
  const downloadsPath = getDownloadsPath()
  mainLog.info(`[Main] Downloads path: ${downloadsPath}`)

  mainLog.info('[Main] Finished initialising secure filesystem.')
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  mainLog.info('[Main] App ready - Starting initialization')
  mainLog.info(`[Main] Version: ${app.getVersion()}`)
  mainLog.info(`[Main] Electron: ${process.versions.electron}`)
  mainLog.info(`[Main] Node: ${process.versions.node}`)
  mainLog.info(`[Main] Platform: ${process.platform} ${process.arch}`)

  // Set app user model id for windows
  electronApp.setAppUserModelId('com.dexreader.app')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => mainLog.debug('[Main] pong'))

  // IPC handler for menu state updates
  ipcMain.on('update-menu-state', (_, state) => {
    // Merge new state
    menuState = { ...menuState, ...state }
    // Rebuild menu with current state (handles both labels and enabled states)
    updateMenuState(menuState)
  })

  await initFileSystem()

  mainLog.info('[Main] Initializing database connection...')
  databaseConnection.init()
  mainLog.info('[Main] Database connection initialized')

  mainLog.info('[Main] Running database migrations...')
  runMigrations()
  mainLog.info('[Main] Database migrations complete')

  mainLog.info('[Main] Registering protocol handlers...')
  await imageProxy.registerProtocol()
  localImageProxy.registerProtocol()
  mainLog.info('[Main] Protocol handlers registered')

  mainLog.info('[Main] Registering IPC handlers...')
  registerAllHandlers(imageProxy)
  mainLog.info('[Main] IPC handlers registered')

  mainLog.info('[Main] Creating main window...')
  createWindow()
  mainLog.info('[Main] Main window created')

  setupAppLifecycle(imageProxy)

  setTimeout(() => {
    mainLog.info('[Main] Resuming incomplete downloads from queue...')
    downloadQueueService.resumeIncompleteDownloads()
    mainLog.info('[Main] Download queue resume initiated')
  }, 1000)

  mainLog.info('[Main] Starting auto-update check...')
  const mainWindow = getMainWindow()
  if (mainWindow) {
    appUpdateService.setMainWindow(mainWindow)

    setTimeout(() => {
      appUpdateService.checkForUpdates(false).catch((error) => {
        mainLog.error('[Main] Startup update check failed:', error)
        // Don't crash app if update check fails
      })
    }, 5000)
  }

  mainLog.cleanupLogs().catch((error) => {
    mainLog.error('[Main] Error during log cleanup on startup:', error)
  })
})
