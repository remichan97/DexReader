import { app, shell, BrowserWindow, ipcMain, Menu, dialog } from 'electron'
import path, { join } from 'node:path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { createMenu, updateMenuState } from './menu'
import { setupThemeDetection, getCurrentTheme } from './theme'
import { secureFs } from './filesystem/secureFs'
import { getAppDataPath, getDownloadsPath } from './filesystem/pathValidator'
import {
  deleteMangaReaderSettings,
  getMangaReaderSettings,
  initializeDownloadsPath,
  loadSettings,
  setDownloadsPath,
  updateMangaReaderSettings,
  updateSettings
} from './filesystem/settingsManager'
import { wrapIpcHandler } from './ipc/wrapHandler'
import { validatePath, validateEncoding } from './ipc/validators'
import { ImageProxy } from './api/imageProxy'
import { MangaDexClient } from './api/mangadexClient'
import { MangaSearchParams } from './api/searchparams/manga.searchparam'
import { FeedParams } from './api/searchparams/feed.searchparam'
import { ImageQuality } from './api/enums'
import { ProgressManager } from './progress/progressManager'
import { MangaProgress } from './progress/entity/manga-progress.entity'
import { ReaderSettings } from './filesystem/entity/reading-settings.entity'
import { AppSettings } from './filesystem/enum/app-settings.entity'

let mainWindow: BrowserWindow | null = null

const imageProxy = new ImageProxy()
const mangadexClient = new MangaDexClient()
const progressManager = new ProgressManager()

// Store menu state
let menuState = {
  isIncognito: false
}

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
  const menu = createMenu(mainWindow, menuState)
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
  wrapIpcHandler('mangadex:search-manga', async (_, query: unknown) => {
    return await mangadexClient.searchManga(query as MangaSearchParams)
  })

  wrapIpcHandler('mangadex:get-manga', async (_, id: unknown, includes: unknown) => {
    return await mangadexClient.getManga(id as string, includes as string[] | undefined)
  })

  wrapIpcHandler('mangadex:get-manga-feed', async (_, id: unknown, query: unknown) => {
    return await mangadexClient.getMangaFeed(id as string, query as FeedParams)
  })

  wrapIpcHandler('mangadex:get-chapter', async (_, id: unknown, includes: unknown) => {
    return await mangadexClient.getChapter(id as string, includes as string[] | undefined)
  })

  wrapIpcHandler('mangadex:get-chapter-images', async (_, id: unknown, quality: unknown) => {
    return await mangadexClient.getChapterImages(id as string, quality as ImageQuality)
  })
}

function registerProgressTrackingHandlers(): void {
  wrapIpcHandler('progress:get-progress', async (_, id: unknown) => {
    return await progressManager.getProgress(id as string)
  })

  wrapIpcHandler('progress:save-progress', async (_, progressData: unknown) => {
    return await progressManager.saveProgress(progressData as MangaProgress[])
  })

  wrapIpcHandler('progress:delete-progress', async (_, id: unknown) => {
    return await progressManager.deleteProgress(id as string)
  })

  wrapIpcHandler('progress:get-statistics', async () => {
    return await progressManager.getStatistics()
  })

  wrapIpcHandler('progress:get-all-progress', async () => {
    return await progressManager.getAllProgress()
  })

  wrapIpcHandler('progress:load-progress', async () => {
    return await progressManager.loadProgress()
  })
}

function registerReaderSettingsHandlers(): void {
  wrapIpcHandler('reader:get-manga-settings', async (_, mangaId: unknown) => {
    return await getMangaReaderSettings(mangaId as string)
  })

  wrapIpcHandler(
    'reader:update-manga-settings',
    async (_, mangaId: unknown, newSettings: unknown) => {
      return await updateMangaReaderSettings(mangaId as string, newSettings as ReaderSettings)
    }
  )

  wrapIpcHandler('reader:reset-manga-settings', async (_, mangaId: unknown) => {
    return await deleteMangaReaderSettings(mangaId as string)
  })
}

function registerAppSettingsHandlers(): void {
  wrapIpcHandler('settings:load', async () => {
    return await loadSettings()
  })

  wrapIpcHandler('settings:save', async (_, key: unknown, value: unknown) => {
    return await updateSettings(key as keyof AppSettings, value as AppSettings[keyof AppSettings])
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
    if (mainWindow) {
      const updatedMenu = createMenu(mainWindow, menuState)
      Menu.setApplicationMenu(updatedMenu)
      // Re-apply state AFTER setting new menu (for enabled/disabled states)
      updateMenuState(menuState)
    }
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

  registerProgressTrackingHandlers()

  registerReaderSettingsHandlers()

  registerAppSettingsHandlers()

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

// Before stopping the app, save all reading progress
app.on('before-quit', async (event) => {
  event.preventDefault()
  await new Promise((resolve) => setTimeout(resolve, 1000)) // Wait a second for everything to settle
  app.exit(0)
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
