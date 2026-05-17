import { BrowserWindow, dialog, MenuItemConstructorOptions } from 'electron'
import { MenuState } from './menu-state'
import i18next from '../i18n/i18n.config'

export function buildLibraryMenu(
  mainWindow: BrowserWindow,
  state: MenuState = {}
): MenuItemConstructorOptions {
  return {
    label: i18next.t('menu:library.label'),
    submenu: [
      {
        id: 'add-to-favorites',
        label: state.isFavorited
          ? i18next.t('menu:library.removeFromFavourites')
          : i18next.t('menu:library.addToFavourites'),
        accelerator: 'CmdOrCtrl+D',
        enabled: state.canAddToFavorites ?? false,
        click: () => {
          mainWindow.webContents.send('add-to-favorites')
        }
      },
      {
        label: i18next.t('menu:library.createCollection'),
        accelerator: 'CmdOrCtrl+Shift+N',
        click: () => {
          mainWindow.webContents.send('create-collection')
        }
      },
      {
        label: i18next.t('menu:library.manageCollections'),
        accelerator: 'CmdOrCtrl+Shift+C',
        click: () => {
          mainWindow.webContents.send('manage-collections')
        }
      },
      { type: 'separator' },
      {
        id: 'download-chapter',
        label: state.chapterTitle
          ? i18next.t('menu:library.downloadChapterWithTitle', { chapterTitle: state.chapterTitle })
          : i18next.t('menu:library.downloadChapter'),
        accelerator: 'CmdOrCtrl+Shift+D',
        enabled: state.canDownloadChapter ?? false,
        click: () => {
          mainWindow.webContents.send('download-chapter')
        }
      },
      {
        id: 'download-manga',
        label: state.mangaTitle
          ? i18next.t('menu:library.downloadMangaWithTitle', { mangaTitle: state.mangaTitle })
          : i18next.t('menu:library.downloadManga'),
        accelerator: 'CmdOrCtrl+Alt+D',
        enabled: state.canDownloadManga ?? false,
        click: () => {
          mainWindow.webContents.send('download-manga')
        }
      },
      { type: 'separator' },
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
                  detail: i18next.t('menu:library.dialogs.exportMihonTachiyomiWarning.detail'),
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
