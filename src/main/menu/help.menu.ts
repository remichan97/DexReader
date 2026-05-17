import { MenuItemConstructorOptions, shell, dialog, app, BrowserWindow } from 'electron'
import path from 'node:path'
import { mainLog } from '../services/logging/main-logging.service'
import i18next from '../i18n/i18n.config'

export function buildHelpMenu(mainWindow: BrowserWindow): MenuItemConstructorOptions {
  return {
    label: i18next.t('menu:help.label'),
    submenu: [
      {
        label: i18next.t('menu:help.documentation'),
        accelerator: 'F1',
        click: () => {
          shell
            .openExternal('https://github.com/remichan97/DexReader/wiki')
            .catch((error) => mainLog.error('[Menu] Failed to open wiki:', error))
        }
      },
      {
        label: i18next.t('menu:help.keyboardShortcuts'),
        accelerator: 'CmdOrCtrl+/',
        click: () => {
          mainWindow.webContents.send('show-shortcuts')
        }
      },
      { type: 'separator' },
      {
        label: i18next.t('menu:help.reportAnIssue'),
        submenu: [
          {
            label: i18next.t('menu:help.viewExistingIssues'),
            click: () => {
              shell
                .openExternal('https://github.com/remichan97/DexReader/issues')
                .catch((error) => mainLog.error('[Menu] Failed to open issues:', error))
            }
          },
          {
            label: i18next.t('menu:help.newBugReport'),
            click: () => {
              shell
                .openExternal(
                  'https://github.com/remichan97/DexReader/issues/new?template=bug-report.yaml'
                )
                .catch((error) => mainLog.error('[Menu] Failed to open bug report:', error))
            }
          },
          {
            label: i18next.t('menu:help.requestAFeature'),
            click: () => {
              shell
                .openExternal(
                  'https://github.com/remichan97/DexReader/issues/new?template=feature-request.yaml'
                )
                .catch((error) => mainLog.error('[Menu] Failed to open feature request:', error))
            }
          },
          {
            label: i18next.t('menu:help.otherFeedback'),
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
        label: i18next.t('menu:help.openLogsFolder'),
        click: () => {
          const logPath = path.join(app.getPath('userData'), 'logs')
          shell
            .openPath(logPath)
            .catch((error) => mainLog.error('[Menu] Failed to open logs folder:', error))
        }
      },
      { type: 'separator' },
      {
        label: i18next.t('menu:help.aboutDexReader'),
        click: () => {
          dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: i18next.t('menu:help.dialogs.about.title'),
            message: i18next.t('menu:help.dialogs.about.message'),
            detail: i18next.t('menu:help.dialogs.about.detail', { version: app.getVersion() }),
            buttons: [i18next.t('menu:help.dialogs.about.buttonOk')],
            noLink: true
          })
        }
      }
    ]
  }
}
