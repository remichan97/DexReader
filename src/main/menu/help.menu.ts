import { MenuItemConstructorOptions, shell, dialog, app, BrowserWindow } from 'electron'
import path from 'node:path'
import { mainLog } from '../services/logging/main-logging.service'

export function buildHelpMenu(mainWindow: BrowserWindow): MenuItemConstructorOptions {
  return {
    label: 'Help',
    submenu: [
      {
        label: 'Documentation',
        accelerator: 'F1',
        click: () => {
          shell
            .openExternal('https://github.com/remichan97/DexReader/wiki')
            .catch((error) => mainLog.error('[Menu] Failed to open wiki:', error))
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
            label: 'View Existing Issues...',
            click: () => {
              shell
                .openExternal('https://github.com/remichan97/DexReader/issues')
                .catch((error) => mainLog.error('[Menu] Failed to open issues:', error))
            }
          },
          {
            label: 'New Bug Report...',
            click: () => {
              shell
                .openExternal(
                  'https://github.com/remichan97/DexReader/issues/new?template=bug-report.yaml'
                )
                .catch((error) => mainLog.error('[Menu] Failed to open bug report:', error))
            }
          },
          {
            label: 'Request a Feature...',
            click: () => {
              shell
                .openExternal(
                  'https://github.com/remichan97/DexReader/issues/new?template=feature-request.yaml'
                )
                .catch((error) => mainLog.error('[Menu] Failed to open feature request:', error))
            }
          },
          {
            label: 'Other Feedback...',
            click: () => {
              shell
                .openExternal(
                  'https://github.com/remichan97/DexReader/issues/new?template=other-issues.yaml'
                )
                .catch((error) => mainLog.error('[Menu] Failed to open feedback:', error))
            }
          }
        ]
      },
      {
        label: 'Open Logs Folder',
        click: () => {
          const logPath = path.join(app.getPath('userData'), 'logs')
          shell
            .openPath(logPath)
            .catch((error) => mainLog.error('[Menu] Failed to open logs folder:', error))
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
