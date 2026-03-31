import { BrowserWindow, dialog, MenuItemConstructorOptions } from 'electron'
import { MenuState } from './menu-state'

export function buildLibraryMenu(
  mainWindow: BrowserWindow,
  state: MenuState = {}
): MenuItemConstructorOptions {
  return {
    label: 'Library',
    submenu: [
      {
        id: 'add-to-favorites',
        label: state.isFavorited ? 'Remove from Favourites' : 'Add to Favourites',
        accelerator: 'CmdOrCtrl+D',
        enabled: state.canAddToFavorites ?? false,
        click: () => {
          mainWindow.webContents.send('add-to-favorites')
        }
      },
      {
        label: 'Create Collection...',
        accelerator: 'CmdOrCtrl+Shift+N',
        click: () => {
          mainWindow.webContents.send('create-collection')
        }
      },
      {
        label: 'Manage Collections...',
        accelerator: 'CmdOrCtrl+Shift+C',
        click: () => {
          mainWindow.webContents.send('manage-collections')
        }
      },
      { type: 'separator' },
      {
        label: 'Check Library for Updates',
        accelerator: 'CmdOrCtrl+Shift+U',
        click: () => {
          mainWindow.webContents.send('library-check-updates')
        }
      },
      { type: 'separator' },
      {
        id: 'download-chapter',
        label: state.chapterTitle ? `Download ${state.chapterTitle}` : 'Download Chapter',
        accelerator: 'CmdOrCtrl+Shift+D',
        enabled: state.canDownloadChapter ?? false,
        click: () => {
          mainWindow.webContents.send('download-chapter')
        }
      },
      {
        id: 'download-manga',
        label: state.mangaTitle ? `Download '${state.mangaTitle}'` : 'Download Manga',
        accelerator: 'CmdOrCtrl+Alt+D',
        enabled: state.canDownloadManga ?? false,
        click: () => {
          mainWindow.webContents.send('download-manga')
        }
      },
      { type: 'separator' },
      {
        label: 'Import Library',
        submenu: [
          {
            label: 'From DexReader Backup...',
            click: () => {
              dialog
                .showOpenDialog(mainWindow, {
                  title: 'Import Library',
                  filters: [{ name: 'DexReader Backup', extensions: ['dexreader'] }],
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
            label: 'From Mihon/Tachiyomi Backup...',
            click: () => {
              dialog
                .showOpenDialog(mainWindow, {
                  title: 'Import Mihon/Tachiyomi Backup',
                  filters: [
                    { name: 'Mihon/Tachiyomi Backup', extensions: ['proto.gz', 'tachibk'] }
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
        label: 'Export Library',
        submenu: [
          {
            label: 'To DexReader Backup...',
            accelerator: 'CmdOrCtrl+Shift+E',
            click: () => {
              dialog
                .showSaveDialog(mainWindow, {
                  title: 'Export Library',
                  defaultPath: 'dexreader-backup.dexreader',
                  filters: [{ name: 'DexReader Backup', extensions: ['dexreader'] }]
                })
                .then((result) => {
                  if (!result.canceled && result.filePath) {
                    mainWindow.webContents.send('export-library', result.filePath)
                  }
                })
            }
          },
          {
            label: 'To Mihon/Tachiyomi Format...',
            click: () => {
              // Warn the user that we don't export some data for Mihon/Tachiyomi
              dialog
                .showMessageBox(mainWindow, {
                  type: 'warning',
                  title: 'Export to Mihon/Tachiyomi',
                  message:
                    'Before you proceed, this action will export your manga library including:',
                  detail:
                    '• Manga metadata and covers\n' +
                    '• Collections (as categories)\n' +
                    '• Reading progress and history\n' +
                    '• Chapter metadata\n\n' +
                    'Please note: App settings (themes, preferences) are DexReader-specific ' +
                    'and cannot be exported to Tachiyomi/Mihon.',
                  buttons: ['Cancel', 'Proceed...'],
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
                      title: 'Export Library to Mihon/Tachiyomi',
                      defaultPath: `dexreader-backup-${new Date().toISOString().split('T')[0]}.tachibk`,
                      filters: [{ name: 'Mihon/Tachiyomi Backup', extensions: ['tachibk'] }]
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
