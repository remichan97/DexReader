import { BrowserWindow, Menu, shell, ipcMain } from 'electron'
import icon from '../../resources/icon.png?asset'
import { join } from 'node:path'
import { createMenu } from './menu/index'
import { setupThemeDetection } from './theme'
import { is } from '@electron-toolkit/utils'

let mainWindow: BrowserWindow | null = null
let isQuitting = false

const menuState = {
  isIncognito: false
}

export function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: false,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Handle window close - wait for pending saves to flush
  mainWindow.on('close', (event) => {
    if (!isQuitting && mainWindow) {
      // Prevent immediate close
      event.preventDefault()

      // Request renderer to flush pending saves
      mainWindow.webContents.send('flush-pending-saves')

      // Set a timeout in case renderer doesn't respond (3 seconds max)
      const timeout = setTimeout(() => {
        isQuitting = true
        mainWindow?.close()
      }, 3000)

      // Wait for renderer to signal it's done
      const handleFlushComplete = (): void => {
        clearTimeout(timeout)
        ipcMain.removeListener('flush-complete', handleFlushComplete)
        isQuitting = true
        mainWindow?.close()
      }

      ipcMain.once('flush-complete', handleFlushComplete)
    }
  })

  // Set up application menu
  const menu = createMenu(menuState)
  Menu.setApplicationMenu(menu)

  // Set up theme detection
  setupThemeDetection(mainWindow)

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow
}
