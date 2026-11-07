import { BrowserWindow } from 'electron'
import { openExternal } from './utils/shell.util'
import { getMainWindow } from './window'
import { mainLog } from './services/logging/main-logging.service'
import { join } from 'node:path'
import { is } from '@electron-toolkit/utils'

let changelogWindow: BrowserWindow | undefined = undefined

// Create the dedicated changelog window, which will display the changelog content to the user.
// This window will have no menu bar, but still preserves the existing security settings.
export function createChangelogWindow(): void {
  const parent = getMainWindow()

  changelogWindow = new BrowserWindow({
    width: 800,
    height: 600,
    show: false,
    parent: parent && !parent.isDestroyed() ? parent : undefined,
    webPreferences: {
      contextIsolation: true,
      preload: join(__dirname, '../preload/changelog.cjs'),
      sandbox: true,
      devTools: is.dev // TODO: Force this to false after development is complete, since this devtool is here mostly for styling debugging purposes, not much else
    }
  })

  // Remove the menu bar from the changelog window, because, who needs it for a simple changelog display?
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
}
