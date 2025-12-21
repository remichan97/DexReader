import { BrowserWindow, MenuItemConstructorOptions } from 'electron'

export function buildViewMenu(mainWindow: BrowserWindow): MenuItemConstructorOptions {
  return {
    label: 'View',
    submenu: [
      {
        label: 'Browse Manga',
        accelerator: 'CmdOrCtrl+1',
        click: () => {
          mainWindow.webContents.send('navigate', '/browse')
        }
      },
      {
        label: 'My Library',
        accelerator: 'CmdOrCtrl+2',
        click: () => {
          mainWindow.webContents.send('navigate', '/library')
        }
      },
      {
        label: 'Downloads',
        accelerator: 'CmdOrCtrl+3',
        click: () => {
          mainWindow.webContents.send('navigate', '/downloads')
        }
      },
      {
        label: 'Reading History',
        accelerator: 'CmdOrCtrl+4',
        click: () => {
          mainWindow.webContents.send('navigate', '/history')
        }
      },
      { type: 'separator' },
      {
        label: 'Toggle Fullscreen',
        accelerator: 'F11',
        role: 'togglefullscreen'
      },
      { type: 'separator' },
      {
        label: 'Reload',
        accelerator: 'CmdOrCtrl+R',
        role: 'reload'
      },
      ...(process.env.NODE_ENV === 'development'
        ? [
            {
              label: 'Toggle DevTools',
              accelerator: 'F12',
              role: 'toggleDevTools' as const
            }
          ]
        : [])
    ]
  }
}
