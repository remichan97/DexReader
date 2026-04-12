import { MenuItemConstructorOptions, shell, dialog, app, BrowserWindow } from 'electron'
import path from 'node:path'

export function buildHelpMenu(mainWindow: BrowserWindow): MenuItemConstructorOptions {
  return {
    label: 'Help',
    submenu: [
      {
        label: 'Documentation',
        accelerator: 'F1',
        click: () => {
          shell.openExternal('https://github.com/remichan97/DexReader/wiki').catch(console.error)
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
        label: 'Report an Issue',
        submenu: [
          {
            label: 'View Existing Issues',
            click: () => {
              shell
                .openExternal('https://github.com/remichan97/DexReader/issues')
                .catch(console.error)
            }
          },
          {
            label: 'New Issue',
            click: () => {
              shell
                .openExternal(
                  'https://github.com/remichan97/DexReader/issues/new?template=bug-report.yaml'
                )
                .catch(console.error)
            }
          },
          {
            label: 'Request a Feature',
            click: () => {
              shell
                .openExternal(
                  'https://github.com/remichan97/DexReader/issues/new?template=feature-request.yaml'
                )
                .catch(console.error)
            }
          },
          {
            label: 'Other Feedback',
            click: () => {
              shell
                .openExternal(
                  'https://github.com/remichan97/DexReader/issues/new?template=other-issues.yaml'
                )
                .catch(console.error)
            }
          }
        ]
      },
      {
        label: 'Open Logs Folder',
        click: () => {
          const logPath = path.join(app.getPath('userData'), 'logs')
          shell.openPath(logPath).catch(console.error)
        }
      },
      { type: 'separator' },
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
