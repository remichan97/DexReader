import { BrowserWindow, MenuItemConstructorOptions } from 'electron'
import i18next from '../i18n/i18n.config'

export function buildViewMenu(mainWindow: BrowserWindow): MenuItemConstructorOptions {
  return {
    label: i18next.t('menu:view.label'),
    submenu: [
      {
        label: i18next.t('menu:view.browseManga'),
        accelerator: 'CmdOrCtrl+1',
        click: () => {
          mainWindow.webContents.send('navigate', '/browse')
        }
      },
      {
        label: i18next.t('menu:view.myLibrary'),
        accelerator: 'CmdOrCtrl+2',
        click: () => {
          mainWindow.webContents.send('navigate', '/library')
        }
      },
      {
        label: i18next.t('menu:view.downloads'),
        accelerator: 'CmdOrCtrl+3',
        click: () => {
          mainWindow.webContents.send('navigate', '/downloads')
        }
      },
      {
        label: i18next.t('menu:view.readingHistory'),
        accelerator: 'CmdOrCtrl+4',
        click: () => {
          mainWindow.webContents.send('navigate', '/history')
        }
      },
      { type: 'separator' },
      {
        label: i18next.t('menu:view.toggleFullscreen'),
        accelerator: 'F11',
        role: 'togglefullscreen'
      },
      { type: 'separator' },
      {
        label: i18next.t('menu:view.reload'),
        accelerator: 'CmdOrCtrl+R',
        role: 'reload'
      },
      ...(process.env.NODE_ENV === 'development'
        ? [
            {
              label: i18next.t('menu:view.toggleDevTools'),
              accelerator: 'F12',
              role: 'toggleDevTools' as const
            }
          ]
        : [])
    ]
  }
}
