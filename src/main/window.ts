import { BrowserWindow, Menu, shell, ipcMain } from 'electron'
import icon from '../../resources/icon.png?asset'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createMenu } from './menu/index'
import { setupThemeDetection } from './theme'
import { is } from '@electron-toolkit/utils'
import { mainLog } from './services/logging/main-logging.service'
import {
  buildContentSecurityPolicy,
  DEV_CONTENT_SECURITY_POLICY,
  generateCspNonce
} from './security/csp-nonce'

// ESM: Get __dirname equivalent
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

let mainWindow: BrowserWindow | undefined = undefined
let isQuitting = false

const menuState = {
  isIncognito: false
}

export function createWindow(): void {
  mainLog.info('[Window] Creating browser window...')
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: false,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.cjs'),
      sandbox: true,
      contextIsolation: true,
      // Disable DevTools in production for security
      // Can still be opened programmatically if needed for debugging
      devTools: is.dev
    }
  })

  // Vite's dev server URL (HMR), if this launch is loading it - also used below
  // to pick between loadURL/loadFile.
  const devServerUrl = is.dev ? process.env['ELECTRON_RENDERER_URL'] : undefined

  // Generate a fresh CSP nonce for this launch and serve the policy via a response
  // header rather than a static <meta> tag, so Fluent's Griffel-injected <style>
  // tags can carry a matching nonce without weakening style-src to 'unsafe-inline'.
  // The dev server needs 'unsafe-inline' instead - see DEV_CONTENT_SECURITY_POLICY.
  const nonce = generateCspNonce()
  const cspHeaderValue = devServerUrl
    ? DEV_CONTENT_SECURITY_POLICY
    : buildContentSecurityPolicy(nonce)
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    if (details.resourceType !== 'mainFrame') {
      callback({ cancel: false })
      return
    }

    callback({
      cancel: false,
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [cspHeaderValue]
      }
    })
  })

  mainWindow.on('ready-to-show', () => {
    mainLog.info('[Window] Window ready to show')
    mainWindow?.show()
  })

  // Add window state change logging for debugging
  mainWindow.on('minimize', () => {
    mainLog.debug('[Window] Window minimized')
  })

  mainWindow.on('maximize', () => {
    mainLog.debug('[Window] Window maximized')
  })

  mainWindow.on('unmaximize', () => {
    mainLog.debug('[Window] Window restored from maximized')
  })

  mainWindow.on('restore', () => {
    mainLog.debug('[Window] Window restored from minimized')
  })

  mainWindow.on('focus', () => {
    mainLog.debug('[Window] Window gained focus')
  })

  mainWindow.on('blur', () => {
    mainLog.debug('[Window] Window lost focus')
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell
      .openExternal(details.url)
      .catch((error) => mainLog.error('[Window] Failed to open external URL:', error))
    return { action: 'deny' }
  })

  // Handle window close - flush pending debounced saves before actually closing
  mainWindow.on('close', (event) => {
    if (!isQuitting && mainWindow) {
      // Prevent immediate close
      event.preventDefault()

      // Request renderer to flush pending saves
      mainLog.debug('[Window] Requesting renderer to flush pending saves')
      mainWindow.webContents.send('flush-pending-saves')

      // Set a timeout in case renderer doesn't respond (3 seconds max)
      const timeout = setTimeout(() => {
        mainLog.warn('[Window] Flush timeout reached (3s), forcing window close')
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
  if (devServerUrl) {
    mainLog.info(`[Window] Loading dev URL: ${devServerUrl}`)
    mainWindow.loadURL(devServerUrl)
  } else {
    const htmlPath = join(__dirname, '../renderer/index.html')
    mainLog.info(`[Window] Loading production HTML: ${htmlPath}`)
    mainWindow.loadFile(htmlPath)
  }

  // Log when page finishes loading
  mainWindow.webContents.on('did-finish-load', () => {
    mainLog.info('[Window] Page loaded successfully')
  })

  // Log page load failures
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    mainLog.error(`[Window] Page failed to load: ${errorCode} - ${errorDescription}`)
  })

  // Allow opening DevTools in production for debugging if ENABLE_DEVTOOLS=1
  // Usage: ENABLE_DEVTOOLS=1 ./dexreader.exe
  if (!is.dev && process.env['ENABLE_DEVTOOLS'] === '1') {
    mainWindow.webContents.openDevTools()
    mainLog.info('[DevTools] Enabled in production mode via ENABLE_DEVTOOLS flag')
  }
}

export function getMainWindow(): BrowserWindow | undefined {
  return mainWindow
}
