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

const imageProxy = new ImageProxy()
const localImageProxy = new LocalImageProxy()

// Store menu state
let menuState = {
  isIncognito: false
}

async function initFileSystem(): Promise<void> {
  console.log('Initialising secure filesystem...')

  // Ensure app data directory exists
  const appDataPath = getAppDataPath()
  await secureFs.ensureDir(appDataPath)

  //Ensure required directories exists
  await secureFs.ensureDir(path.join(appDataPath, 'metadata'))
  await secureFs.ensureDir(path.join(appDataPath, 'logs'))
  await secureFs.ensureDir(path.join(appDataPath, 'downloads'))
  await diskCacheUtil.initCachePath()

  // Load App settings
  const settings = await loadSettings()
  console.log('Settings loaded:', settings)

  // Init Downloads path
  await initializeDownloadsPath().catch(console.error)
  console.log('Download path: ', getDownloadsPath())

  console.log('Finished initialising secure filesystem.')
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.dexreader.app')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // IPC handler for menu state updates
  ipcMain.on('update-menu-state', (_, state) => {
    // Merge new state
    menuState = { ...menuState, ...state }
    // Rebuild menu with current state (handles both labels and enabled states)
    updateMenuState(menuState)
  })

  await initFileSystem()

  databaseConnection.init()

  runMigrations()

  await imageProxy.registerProtocol()
  localImageProxy.registerProtocol()

  registerAllHandlers(imageProxy)

  createWindow()

  setupAppLifecycle(imageProxy)

  setTimeout(() => {
    console.log('Resuming any incomplete downloads in the queue...')
    downloadQueueService.resumeIncompleteDownloads()
  })

  const mainWindow = getMainWindow()
  if (mainWindow) {
    appUpdateService.setMainWindow(mainWindow)

    setTimeout(() => {
      appUpdateService.checkForUpdates(false).catch((error) => {
        console.error('[Main] Startup update check failed:', error)
        // Don't crash app if update check fails
      })
    }, 5000)
  }
})
