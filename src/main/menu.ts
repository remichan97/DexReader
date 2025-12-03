import { Menu, dialog, shell, app, BrowserWindow, MenuItemConstructorOptions } from 'electron'

export function createMenu(mainWindow: BrowserWindow): Menu {
  const menuTemplate: MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Check for Updates...',
          accelerator: 'CmdOrCtrl+U',
          click: () => {
            mainWindow.webContents.send('check-for-updates')
          }
        },
        { type: 'separator' },
        {
          label: 'Settings...',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            mainWindow.webContents.send('navigate', '/settings')
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: 'Alt+F4',
          role: 'quit'
        }
      ]
    },
    {
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
        {
          label: 'Toggle DevTools',
          accelerator: 'F12',
          role: 'toggleDevTools'
        }
      ]
    },
    {
      label: 'Library',
      submenu: [
        {
          id: 'add-to-favorites',
          label: 'Add to Favourites',
          accelerator: 'CmdOrCtrl+D',
          enabled: false,
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
          label: 'Import Library',
          submenu: [
            {
              label: 'From DexReader Backup...',
              click: async () => {
                const result = await dialog.showOpenDialog(mainWindow, {
                  title: 'Import Library',
                  filters: [{ name: 'DexReader Backup', extensions: ['dexreader'] }],
                  properties: ['openFile']
                })
                if (!result.canceled && result.filePaths.length > 0) {
                  mainWindow.webContents.send('import-library', result.filePaths[0])
                }
              }
            },
            {
              label: 'From Tachiyomi Backup...',
              click: async () => {
                const result = await dialog.showOpenDialog(mainWindow, {
                  title: 'Import Tachiyomi Backup',
                  filters: [{ name: 'Tachiyomi Backup', extensions: ['proto.gz', 'tachibk'] }],
                  properties: ['openFile']
                })
                if (!result.canceled && result.filePaths.length > 0) {
                  mainWindow.webContents.send('import-tachiyomi', result.filePaths[0])
                }
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
              click: async () => {
                const result = await dialog.showSaveDialog(mainWindow, {
                  title: 'Export Library',
                  defaultPath: 'dexreader-backup.dexreader',
                  filters: [{ name: 'DexReader Backup', extensions: ['dexreader'] }]
                })
                if (!result.canceled && result.filePath) {
                  mainWindow.webContents.send('export-library', result.filePath)
                }
              }
            },
            {
              label: 'To Tachiyomi Format...',
              click: async () => {
                const result = await dialog.showSaveDialog(mainWindow, {
                  title: 'Export to Tachiyomi',
                  defaultPath: 'tachiyomi-backup.proto.gz',
                  filters: [{ name: 'Tachiyomi Backup', extensions: ['proto.gz'] }]
                })
                if (!result.canceled && result.filePath) {
                  mainWindow.webContents.send('export-tachiyomi', result.filePath)
                }
              }
            }
          ]
        }
      ]
    },
    {
      label: 'Tools',
      submenu: [
        {
          id: 'download-chapter',
          label: 'Download Chapter',
          accelerator: 'CmdOrCtrl+Shift+D',
          enabled: false,
          click: () => {
            mainWindow.webContents.send('download-chapter')
          }
        },
        {
          id: 'download-manga',
          label: 'Download Manga',
          enabled: false,
          click: () => {
            mainWindow.webContents.send('download-manga')
          }
        },
        { type: 'separator' },
        {
          label: 'Clear Cache...',
          click: () => {
            mainWindow.webContents.send('clear-metadata')
          }
        },
        {
          label: 'Clear Reading History...',
          click: () => {
            mainWindow.webContents.send('clear-history')
          }
        }
      ]
    },
    {
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
  ]

  const menu = Menu.buildFromTemplate(menuTemplate)
  return menu
}

export function updateMenuState(state: {
  canAddToFavorites?: boolean
  isFavorited?: boolean
  canDownloadChapter?: boolean
  chapterTitle?: string
  canDownloadManga?: boolean
  mangaTitle?: string
}): void {
  const menu = Menu.getApplicationMenu()
  if (!menu) return

  // Update "Add to Favourites"
  const addToFavoritesItem = menu.getMenuItemById('add-to-favorites')
  if (addToFavoritesItem) {
    addToFavoritesItem.enabled = state.canAddToFavorites ?? false
    addToFavoritesItem.label = state.isFavorited ? 'Remove from Favourites' : 'Add to Favourites'
  }

  // Update "Download Chapter"
  const downloadChapterItem = menu.getMenuItemById('download-chapter')
  if (downloadChapterItem) {
    downloadChapterItem.enabled = state.canDownloadChapter ?? false
    if (state.chapterTitle) {
      downloadChapterItem.label = `Download ${state.chapterTitle}`
    } else {
      downloadChapterItem.label = 'Download Chapter'
    }
  }

  // Update "Download Manga"
  const downloadMangaItem = menu.getMenuItemById('download-manga')
  if (downloadMangaItem) {
    downloadMangaItem.enabled = state.canDownloadManga ?? false
    if (state.mangaTitle) {
      downloadMangaItem.label = `Download '${state.mangaTitle}'`
    } else {
      downloadMangaItem.label = 'Download Manga'
    }
  }
}
