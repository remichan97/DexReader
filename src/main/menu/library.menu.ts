import { BrowserWindow, dialog, MenuItemConstructorOptions } from 'electron'
import i18next from '../i18n/i18n.config'

export function buildLibraryMenu(mainWindow: BrowserWindow): MenuItemConstructorOptions {
  return {
    label: i18next.t('menu:library.label'),
    submenu: [
      {
        label: i18next.t('menu:library.importLibrary'),
        submenu: [
          {
            label: i18next.t('menu:library.fromDexReaderBackup'),
            click: () => {
              dialog
                .showOpenDialog(mainWindow, {
                  title: i18next.t('menu:library.dialogs.importLibrary.title'),
                  filters: [
                    {
                      name: i18next.t('menu:library.dialogs.importLibrary.filterName'),
                      extensions: ['dexreader']
                    }
                  ],
                  properties: ['openFile']
                })
                .then((result) => {
                  if (!result.canceled && result.filePaths.length > 0) {
                    mainWindow.webContents.send('import-library', result.filePaths[0])
                  }
                })
            }
          },
          {
            label: i18next.t('menu:library.fromMihonTachiyomiBackup'),
            click: () => {
              dialog
                .showOpenDialog(mainWindow, {
                  title: i18next.t('menu:library.dialogs.importMihonTachiyomi.title'),
                  filters: [
                    {
                      name: i18next.t('menu:library.dialogs.importMihonTachiyomi.filterName'),
                      extensions: ['proto.gz', 'tachibk']
                    }
                  ],
                  properties: ['openFile']
                })
                .then((result) => {
                  if (!result.canceled && result.filePaths.length > 0) {
                    mainWindow.webContents.send('import-tachiyomi', result.filePaths[0])
                  }
                })
            }
          }
        ]
      },
      {
        label: i18next.t('menu:library.exportLibrary'),
        submenu: [
          {
            label: i18next.t('menu:library.toDexReaderBackup'),
            accelerator: 'CmdOrCtrl+Shift+E',
            click: () => {
              dialog
                .showSaveDialog(mainWindow, {
                  title: i18next.t('menu:library.dialogs.exportLibrary.title'),
                  defaultPath: 'dexreader-backup.dexreader',
                  filters: [
                    {
                      name: i18next.t('menu:library.dialogs.importLibrary.filterName'),
                      extensions: ['dexreader']
                    }
                  ]
                })
                .then((result) => {
                  if (!result.canceled && result.filePath) {
                    mainWindow.webContents.send('export-library', result.filePath)
                  }
                })
            }
          },
          {
            label: i18next.t('menu:library.toMihonTachiyomiFormat'),
            click: () => {
              // Warn the user that we don't export some data for Mihon/Tachiyomi
              dialog
                .showMessageBox(mainWindow, {
                  type: 'warning',
                  title: i18next.t('menu:library.dialogs.exportMihonTachiyomiWarning.title'),
                  message: i18next.t('menu:library.dialogs.exportMihonTachiyomiWarning.message'),
                  detail: [
                    i18next.t('menu:library.dialogs.exportMihonTachiyomiWarning.detail'),
                    i18next.t('menu:library.dialogs.exportMihonTachiyomiWarning.deprecation')
                  ].join('\n\n'),
                  buttons: [
                    i18next.t('menu:library.dialogs.exportMihonTachiyomiWarning.buttonCancel'),
                    i18next.t('menu:library.dialogs.exportMihonTachiyomiWarning.buttonProceed')
                  ],
                  defaultId: 1,
                  cancelId: 0,
                  noLink: true
                })
                .then((res) => {
                  if (res.response === 0) {
                    return
                  }
                  // Show save file dialog
                  return dialog
                    .showSaveDialog(mainWindow, {
                      title: i18next.t('menu:library.dialogs.exportMihonTachiyomi.title'),
                      defaultPath: `dexreader-backup-${new Date().toISOString().split('T')[0]}.tachibk`,
                      filters: [
                        {
                          name: i18next.t('menu:library.dialogs.exportMihonTachiyomi.filterName'),
                          extensions: ['tachibk']
                        }
                      ]
                    })
                    .then((result) => {
                      if (!result.canceled && result.filePath) {
                        mainWindow.webContents.send('export-tachiyomi', result.filePath)
                      }
                    })
                })
            }
          }
        ]
      }
    ]
  }
}
