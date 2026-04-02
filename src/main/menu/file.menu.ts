import { BrowserWindow, MenuItemConstructorOptions } from 'electron'
import { MenuState } from './menu-state'

export function buildFileMenu(
  mainWindow: BrowserWindow,
  state: MenuState = {}
): MenuItemConstructorOptions {
  return {
    label: 'File',
    submenu: [
      {
        label: 'Check for Updates...',
        accelerator: 'CmdOrCtrl+U',
        click: async () => {
          const { appUpdateService } = await import('../services/app-update.service')
          appUpdateService.checkForUpdates(true) // true = manual check
        }
      },
      { type: 'separator' },
      {
        label: 'Settings...',
        accelerator: 'CmdOrCtrl+,',
        click: () => {
          mainWindow.webContents.send('navigate', '/settings')
        }
      },
      { type: 'separator' },
      {
        label: state.isIncognito ? 'Leave Incognito' : 'Go Incognito',
        id: 'go-incognito',
        accelerator: 'CmdOrCtrl+Shift+N',
        click: () => {
          mainWindow.webContents.send('progress:toggle-incognito')
        }
      },
      {
        label: state.isOffline ? 'Go Online' : 'Go Offline',
        id: 'go-offline',
        accelerator: 'CmdOrCtrl+Shift+O',
        click: () => {
          mainWindow.webContents.send('connectivity:toggle-offline')
        }
      },
      { type: 'separator' },
      {
        label: 'Exit',
        accelerator: 'Alt+F4',
        role: 'quit'
      }
    ]
  }
}
