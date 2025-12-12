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
import { wrapIpcHandler } from './ipc/wrapHandler'
import { validatePath, validateEncoding } from './ipc/validators'
import { ImageProxy } from './api/imageProxy'
import { MangaDexClient } from './api/mangadexClient'
import { MangaSearchParams } from './api/searchparams/manga.searchparam'
import { FeedParams } from './api/searchparams/feed.searchparam'
import { CoverSize, ImageQuality } from './api/enums'

let mainWindow: BrowserWindow | null = null

const imageProxy = new ImageProxy()
const mangadexClient = new MangaDexClient()

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
  wrapIpcHandler('fs:read-file', async (_event, filePath: unknown, encoding: unknown) => {
    const validPath = validatePath(filePath, 'filePath')
    const validEncoding = validateEncoding(encoding, 'encoding')
    return await secureFs.readFile(validPath, validEncoding)
  })

  // Write files
  wrapIpcHandler('fs:write-file', async (_event, filePath: unknown, data: unknown) => {
    const validPath = validatePath(filePath, 'filePath')
    await secureFs.writeFile(validPath, data as string | Buffer)
    return true
  })

  // Copy files
  wrapIpcHandler('fs:copy-file', async (_event, srcPath: unknown, destPath: unknown) => {
    const validSrcPath = validatePath(srcPath, 'srcPath')
    const validDestPath = validatePath(destPath, 'destPath')
    await secureFs.copyFile(validSrcPath, validDestPath)
    return true
  })

  // Append to file
  wrapIpcHandler('fs:append-file', async (_event, filePath: unknown, data: unknown) => {
    const validPath = validatePath(filePath, 'filePath')
    await secureFs.appendFile(validPath, data as string | Buffer)
    return true
  })

  // Rename file or directory
  wrapIpcHandler('fs:rename', async (_event, oldPath: unknown, newPath: unknown) => {
    const validOldPath = validatePath(oldPath, 'oldPath')
    const validNewPath = validatePath(newPath, 'newPath')
    await secureFs.rename(validOldPath, validNewPath)
    return true
  })

  // Check if path exists
  wrapIpcHandler('fs:is-exists', async (_event, pathToCheck: unknown) => {
    const validPath = validatePath(pathToCheck, 'path')
    return await secureFs.isExists(validPath)
  })

  // Create directory
  wrapIpcHandler('fs:mkdir', async (_event, dirPath: unknown) => {
    const validPath = validatePath(dirPath, 'dirPath')
    await secureFs.mkdir(validPath)
    return true
  })

  // Delete file
  wrapIpcHandler('fs:unlink', async (_event, filePath: unknown) => {
    const validPath = validatePath(filePath, 'filePath')
    await secureFs.deleteFile(validPath)
    return true
  })

  // Delete directory
  wrapIpcHandler('fs:rm', async (_event, dirPath: unknown, options: unknown) => {
    const validPath = validatePath(dirPath, 'dirPath')
    await secureFs.deleteDir(validPath, options as { recursive?: boolean } | undefined)
    return true
  })

  // Get stats
  wrapIpcHandler('fs:stat', async (_event, pathToStat: unknown) => {
    const validPath = validatePath(pathToStat, 'path')
    const stats = await secureFs.stat(validPath)
    // Serialise Stats object for IPC
    return {
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
      size: stats.size,
      created: stats.birthtime.toISOString(),
      modified: stats.mtime.toISOString()
    }
  })

  // Read directory
  wrapIpcHandler('fs:readdir', async (_event, dirPath: unknown) => {
    const validPath = validatePath(dirPath, 'dirPath')
    return await secureFs.readDir(validPath)
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
      return { cancelled: true, filePath: undefined }
    }

    const selectedPath = result.filePaths[0]

    try {
      await setDownloadsPath(selectedPath)
      return { cancelled: false, filePath: selectedPath }
    } catch (error) {
      throw new Error(`Unable to set downloads folder: ${error}`)
    }
  })
}

function registerMangaDexHandlers(): void {
  ipcMain.handle('mangadex:search-manga', async (_, query: MangaSearchParams) => {
    return await mangadexClient.searchManga(query)
  })

  ipcMain.handle('mangadex:get-manga', async (_, id: string, includes?: string[]) => {
    return await mangadexClient.getManga(id, includes)
  })

  ipcMain.handle('mangadex:get-manga-feed', async (_, id: string, query: FeedParams) => {
    return await mangadexClient.getMangaFeed(id, query)
  })

  ipcMain.handle('mangadex:get-chapter', async (_, id: string, includes?: string[]) => {
    return await mangadexClient.getChapter(id, includes)
  })

  ipcMain.handle(
    'mangadex:get-chapter-images',
    async (_event, id: string, quality: ImageQuality) => {
      return await mangadexClient.getChapterImages(id, quality)
    }
  )

  ipcMain.handle(
    'mangadex:get-cover-url',
    async (_, id: string, fileName: string, size?: CoverSize) => {
      return mangadexClient.getCoverImageUrl(id, fileName, size)
    }
  )
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
    updateMenuState(state)
  })

  // IPC handler for theme request
  ipcMain.handle('get-theme', () => {
    return getCurrentTheme()
  })

  // IPC handler for confirm dialog
  // Simple yes/no confirmation dialog
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

  // Enhanced dialog with custom buttons and options
  ipcMain.handle(
    'show-dialog',
    async (
      _event,
      options: {
        message: string
        detail?: string
        buttons?: string[]
        type?: 'none' | 'info' | 'error' | 'question' | 'warning'
        defaultId?: number
        cancelId?: number
        noLink?: boolean
        checkboxLabel?: string
        checkboxChecked?: boolean
      }
    ) => {
      if (!mainWindow) {
        return { response: -1, checkboxChecked: false }
      }

      const { dialog } = await import('electron')
      const result = await dialog.showMessageBox(mainWindow, {
        type: options.type || 'question',
        buttons: options.buttons || ['OK', 'Cancel'],
        defaultId: options.defaultId ?? 0,
        cancelId: options.cancelId ?? (options.buttons?.length ?? 1) - 1,
        message: options.message,
        detail: options.detail,
        noLink: options.noLink ?? false,
        checkboxLabel: options.checkboxLabel,
        checkboxChecked: options.checkboxChecked ?? false
      })

      return {
        response: result.response,
        checkboxChecked: result.checkboxChecked
      }
    }
  )

  await initFileSystem()

  registerMangaDexHandlers()

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
