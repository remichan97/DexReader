import { BrowserWindow, MenuItemConstructorOptions } from 'electron'
import { MenuState } from './menu-state'
import { appUpdateService } from '../services/app-update.service'
import i18next from '../i18n/i18n.config'

export function buildFileMenu(
  mainWindow: BrowserWindow,
  state: MenuState = {}
): MenuItemConstructorOptions {
  return {
    label: i18next.t('menu:file.label'),
    submenu: [
      {
        label: i18next.t('menu:file.checkForUpdates'),
        accelerator: 'CmdOrCtrl+U',
        click: () => {
          appUpdateService.checkForUpdates(true) // true = manual check
        }
      },
      { type: 'separator' },
      {
        label: i18next.t('menu:file.settings'),
        accelerator: 'CmdOrCtrl+,',
        click: () => {
          mainWindow.webContents.send('navigate', '/settings')
        }
      },
      { type: 'separator' },
      {
        label: state.isIncognito
          ? i18next.t('menu:file.leaveIncognito')
          : i18next.t('menu:file.goIncognito'),
        id: 'go-incognito',
        accelerator: 'CmdOrCtrl+Shift+N',
        click: () => {
          mainWindow.webContents.send('progress:toggle-incognito')
        }
      },
      {
        label: state.isOffline ? i18next.t('menu:file.goOnline') : i18next.t('menu:file.goOffline'),
        id: 'go-offline',
        accelerator: 'CmdOrCtrl+Shift+O',
        click: () => {
          mainWindow.webContents.send('connectivity:toggle-offline')
        }
      },
      { type: 'separator' },
      {
        label: i18next.t('menu:file.exit'),
        accelerator: 'Alt+F4',
        role: 'quit'
      }
    ]
  }
}
