import { BrowserWindow, MenuItemConstructorOptions } from 'electron'

export function buildToolsMenu(mainWindow: BrowserWindow): MenuItemConstructorOptions {
  return {
    label: 'Tools',
    submenu: [
      {
        id: 'download-chapter',
        label: 'Download Chapter',
        accelerator: 'CmdOrCtrl+Shift+D',
        enabled: false,
        click: () => {
          mainWindow.webContents.send('download-chapter')
        }
      },
      {
        id: 'download-manga',
        label: 'Download Manga',
        enabled: false,
        click: () => {
          mainWindow.webContents.send('download-manga')
        }
      },
      { type: 'separator' },
      {
        label: 'Clear Cache...',
        click: () => {
          mainWindow.webContents.send('clear-metadata')
        }
      },
      {
        label: 'Clear Reading History...',
        click: () => {
          mainWindow.webContents.send('clear-history')
        }
      }
    ]
  }
}
