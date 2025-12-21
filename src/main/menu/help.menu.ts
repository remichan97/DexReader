import { MenuItemConstructorOptions, shell, dialog, app, BrowserWindow } from 'electron'

export function buildHelpMenu(mainWindow: BrowserWindow): MenuItemConstructorOptions {
  return {
    label: 'Help',
    submenu: [
      {
        label: 'Documentation',
        accelerator: 'F1',
        click: () => {
          shell.openExternal('https://github.com/remichan97/DexReader/wiki')
        }
      },
      {
        label: 'Keyboard Shortcuts...',
        accelerator: 'CmdOrCtrl+/',
        click: () => {
          mainWindow.webContents.send('show-shortcuts')
        }
      },
      { type: 'separator' },
      {
        label: 'Report Issue...',
        click: () => {
          shell.openExternal('https://github.com/remichan97/DexReader/issues/new')
        }
      },
      {
        label: 'About DexReader...',
        click: () => {
          dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'About DexReader',
            message: 'DexReader',
            detail: `Version ${app.getVersion()}\n\nA desktop manga reader for MangaDex\n\nDeveloped by remichan97`,
            buttons: ['OK'],
            noLink: true
          })
        }
      }
    ]
  }
}
