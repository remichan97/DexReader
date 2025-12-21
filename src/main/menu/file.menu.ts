import { BrowserWindow, MenuItemConstructorOptions } from 'electron'
import { MenuState } from '../menu'

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
        click: () => {
          mainWindow.webContents.send('check-for-updates')
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
        label: 'Exit',
        accelerator: 'Alt+F4',
        role: 'quit'
      }
    ]
  }
}
