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
        label: 'Check for Updates',
        accelerator: 'CmdOrCtrl+R',
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
            label: 'From Tachiyomi Backup...',
            click: () => {
              dialog
                .showOpenDialog(mainWindow, {
                  title: 'Import Tachiyomi Backup',
                  filters: [{ name: 'Tachiyomi Backup', extensions: ['proto.gz', 'tachibk'] }],
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
            label: 'To Tachiyomi Format...',
            click: () => {
              dialog
                .showSaveDialog(mainWindow, {
                  title: 'Export to Tachiyomi',
                  defaultPath: 'tachiyomi-backup.proto.gz',
                  filters: [{ name: 'Tachiyomi Backup', extensions: ['proto.gz'] }]
                })
                .then((result) => {
                  if (!result.canceled && result.filePath) {
                    mainWindow.webContents.send('export-tachiyomi', result.filePath)
                  }
                })
            }
          }
        ]
      }
    ]
  }
}
