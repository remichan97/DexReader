import { app, ipcMain, Menu } from 'electron'
import path from 'node:path'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { createMenu, updateMenuState } from './menu'
import { secureFs } from './filesystem/secureFs'
import { getAppDataPath, getDownloadsPath } from './filesystem/pathValidator'
import { initializeDownloadsPath, loadSettings } from './filesystem/settingsManager'
import { ImageProxy } from './api/imageProxy'
import { createWindow, getMainWindow } from './window'
import { setupAppLifecycle } from './app-lifecycle'
import { registerAllHandlers } from './ipc/registry'

const imageProxy = new ImageProxy()

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
  electronApp.setAppUserModelId('com.electron')

  imageProxy.registerProtocol()

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
    // Rebuild menu with current state to apply label changes
    const mainWindow = getMainWindow()
    if (mainWindow) {
      const updatedMenu = createMenu(mainWindow, menuState)
      Menu.setApplicationMenu(updatedMenu)
      // Re-apply state AFTER setting new menu (for enabled/disabled states)
      updateMenuState(menuState)
    }
  })

  electronApp.setAppUserModelId('com.dexreader.app')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  await initFileSystem()

  registerAllHandlers()

  createWindow()

  setupAppLifecycle()
})
