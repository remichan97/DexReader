import { BrowserWindow } from 'electron'
import { openExternal } from './utils/shell.util'
import { getMainWindow } from './window'
import { mainLog } from './services/logging/main-logging.service'
import { join } from 'node:path'
import { is } from '@electron-toolkit/utils'
import { AppTheme } from '@shared/enums/settings/theme-mode.enum'
import { settingsManager } from './settings/settings-manager'
import { getCurrentTheme } from './theme'

let changelogWindow: BrowserWindow | undefined = undefined

// The window's preload cannot read settings, so main resolves what the first paint needs and
// passes it on the page URL: the display language, and the theme with 'system' resolved to the
// OS's current light or dark.
function getPageQuery(): Record<string, string> {
  const theme = settingsManager.getByPath('appearance', 'theme')

  return {
    lng: settingsManager.getByPath('language', 'displayLanguage'),
    theme: theme === AppTheme.System ? getCurrentTheme() : theme
  }
}

// `Menu.setApplicationMenu` puts the menu back on every open window, undoing `removeMenu()`, and the
// app rebuilds its menu whenever the menu state changes. Call this straight after each rebuild so the
// changelog window never keeps (or flashes) a menu bar, or the accelerators that come with it.
export function removeChangelogWindowMenu(): void {
  changelogWindow?.removeMenu()
}

// Create the dedicated changelog window, which will display the changelog content to the user.
// This window will have no menu bar, but still preserves the existing security settings.
export async function createChangelogWindow(): Promise<void> {
  const parent = getMainWindow()

  // If a changelog window already exists, focus it instead of creating a new one
  if (changelogWindow) {
    changelogWindow.focus()
    return
  }

  changelogWindow = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 640, // Below this the two columns no longer leave the notes room to read
    minHeight: 420,
    show: false,
    parent: parent && !parent.isDestroyed() ? parent : undefined,
    webPreferences: {
      contextIsolation: true,
      preload: join(__dirname, '../preload/changelog.cjs'),
      sandbox: true,
      devTools: is.dev // TODO: Force this to false after development is complete, since this devtool is here mostly for styling debugging purposes, not much else
    }
  })

  // Prevent the changelog window from being minimised, maximised, full-screened but still able to resize
  changelogWindow.minimizable = false
  changelogWindow.maximizable = false
  changelogWindow.fullScreenable = false

  // Remove the menu bar from the changelog window, because, who needs it for a simple changelog display?
  // The application menu is rebuilt from time to time, see removeChangelogWindowMenu
  changelogWindow.removeMenu()

  // Route all external links to the user's default browser
  changelogWindow.webContents.setWindowOpenHandler((details) => {
    openExternal(details.url).catch((error) =>
      mainLog.error('[Changelog Window] Failed to open external URL:', error)
    )

    return { action: 'deny' }
  })

  // Block all will-navigate events to prevent navigation within the changelog window
  changelogWindow.webContents.on('will-navigate', (event) => {
    event.preventDefault()
  })

  changelogWindow.once('ready-to-show', () => {
    changelogWindow?.show()
  })

  changelogWindow.on('closed', () => {
    changelogWindow = undefined
  })

  const devServerUrl = is.dev ? process.env['ELECTRON_RENDERER_URL'] : undefined
  try {
    if (devServerUrl) {
      await changelogWindow.loadURL(
        `${devServerUrl}/changelog.html?${new URLSearchParams(getPageQuery())}`
      )
    } else {
      await changelogWindow.loadFile(join(__dirname, '../renderer/changelog.html'), {
        query: getPageQuery()
      })
    }
  } catch (error) {
    mainLog.error('[Changelog Window] Failed to load changelog content:', error)
  }
}
