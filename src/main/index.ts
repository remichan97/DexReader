import { app, shell, BrowserWindow, ipcMain, Menu, dialog } from 'electron'
import path, { join } from 'node:path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { createMenu, updateMenuState } from './menu'
import { setupThemeDetection, getCurrentTheme } from './theme'
import { secureFs } from './filesystem/secureFs'
import { getAppDataPath, getDownloadsPath } from './filesystem/pathValidator'
import {
  initializeDownloadsPath,
  loadSettings,
  setDownloadsPath
} from './filesystem/settingsManager'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
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

  // Set up application menu
  const menu = createMenu(mainWindow)
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

// Setting up IPC handlers for filesystem operations
function registerFileSystemHandlers(mainWindow: BrowserWindow): void {
  // Read files
  ipcMain.handle('fs:read-file', async (_event, filePath: string, encoding?: BufferEncoding) => {
    try {
      return await secureFs.readFile(filePath, encoding)
    } catch (error) {
      throw new Error(`Unable to read file: ${error}`)
    }
  })

  // Write files
  ipcMain.handle('fs:write-file', async (_event, filePath: string, data: string | Buffer) => {
    try {
      await secureFs.writeFile(filePath, data)
      return true
    } catch (error) {
      throw new Error(`Unable to write file: ${error}`)
    }
  })

  // Copy files
  ipcMain.handle('fs:copy-file', async (_event, srcPath: string, destPath: string) => {
    try {
      await secureFs.copyFile(srcPath, destPath)
      return true
    } catch (error) {
      throw new Error(`Unable to copy file: ${error}`)
    }
  })

  // Append to file
  ipcMain.handle('fs:append-file', async (_event, filePath: string, data: string | Buffer) => {
    try {
      await secureFs.appendFile(filePath, data)
      return true
    } catch (error) {
      throw new Error(`Unable to append to file: ${error}`)
    }
  })

  // Rename file or directory
  ipcMain.handle('fs:rename', async (_event, oldPath: string, newPath: string) => {
    try {
      await secureFs.rename(oldPath, newPath)
      return true
    } catch (error) {
      throw new Error(`Unable to rename: ${error}`)
    }
  })

  // Check if path exists
  ipcMain.handle('fs:is-exists', async (_event, path: string) => {
    try {
      return await secureFs.isExists(path)
    } catch (error) {
      throw new Error(`Unable to check path existence: ${error}`)
    }
  })

  // Create directory
  ipcMain.handle('fs:mkdir', async (_event, dirPath: string) => {
    try {
      await secureFs.mkdir(dirPath)
      return true
    } catch (error) {
      throw new Error(`Unable to create directory: ${error}`)
    }
  })

  // Delete file
  ipcMain.handle('fs:unlink', async (_event, filePath: string) => {
    try {
      await secureFs.deleteFile(filePath)
      return true
    } catch (error) {
      throw new Error(`Unable to delete file: ${error}`)
    }
  })

  // Delete directory
  ipcMain.handle('fs:rm', async (_event, dirPath: string, options?: { recursive?: boolean }) => {
    try {
      await secureFs.deleteDir(dirPath, options)
      return true
    } catch (error) {
      throw new Error(`Unable to delete directory: ${error}`)
    }
  })

  // Get stats
  ipcMain.handle('fs:stat', async (_event, path: string) => {
    try {
      const stats = await secureFs.stat(path)
      // Serialize Stats object for IPC
      return {
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
        size: stats.size,
        created: stats.birthtime.toISOString(),
        modified: stats.mtime.toISOString()
      }
    } catch (error) {
      throw new Error(`Unable to get stats: ${error}`)
    }
  })

  // Read directory
  ipcMain.handle('fs:readdir', async (_event, dirPath: string) => {
    try {
      return await secureFs.readDir(dirPath)
    } catch (error) {
      throw new Error(`Unable to read directory: ${error}`)
    }
  })

  // Get Allowed Paths
  ipcMain.handle('fs:get-allowed-paths', () => {
    return {
      appData: getAppDataPath(),
      downloads: getDownloadsPath()
    }
  })

  // Theme IPC handlers
  ipcMain.handle('theme:get-system-accent-color', async () => {
    const { getSystemAccentColor } = await import('./theme')
    return getSystemAccentColor()
  })

  // Select download folder using native dialog
  ipcMain.handle('fs:select-downloads-folder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory', 'createDirectory'],
      title: 'Choose where to save downloaded manga',
      defaultPath: getDownloadsPath(),
      buttonLabel: 'Select Folder'
    })

    if (result.canceled || result.filePaths.length === 0) {
      return { cancelled: true, path: null }
    }

    const selectedPath = result.filePaths[0]

    try {
      await setDownloadsPath(selectedPath)
      return { cancelled: false, path: selectedPath }
    } catch (error) {
      throw new Error(`Unable to set downloads folder: ${error}`)
    }
  })
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
    updateMenuState(state)
  })

  // IPC handler for theme request
  ipcMain.handle('get-theme', () => {
    return getCurrentTheme()
  })

  // IPC handler for confirm dialog
  ipcMain.handle('show-confirm-dialog', async (_event, message: string, detail?: string) => {
    if (!mainWindow) return false

    const { dialog } = await import('electron')
    const result = await dialog.showMessageBox(mainWindow, {
      type: 'warning',
      buttons: ['Cancel', 'Leave'],
      defaultId: 0,
      cancelId: 0,
      message: message,
      detail: detail,
      noLink: true
    })

    return result.response === 1
  })

  await initFileSystem()

  createWindow()

  if (mainWindow) {
    registerFileSystemHandlers(mainWindow)
  }

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
