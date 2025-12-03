import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  // Theme API
  onThemeChanged: (callback: (theme: 'light' | 'dark') => void) => {
    ipcRenderer.on('theme-changed', (_, theme) => callback(theme))
  },
  onAccentColorChanged: (callback: (color: string) => void) => {
    ipcRenderer.on('accent-color-changed', (_, color) => callback(color))
  },
  getTheme: () => ipcRenderer.invoke('get-theme'),
  getSystemAccentColor: () => ipcRenderer.invoke('theme:get-system-accent-color'),

  // Navigation API
  onNavigate: (callback: (route: string) => void) => {
    ipcRenderer.on('navigate', (_, route) => callback(route))
  },

  // Dialog API
  showConfirmDialog: (message: string, detail?: string) =>
    ipcRenderer.invoke('show-confirm-dialog', message, detail),

  // Menu state API
  updateMenuState: (state: {
    canAddToFavorites?: boolean
    isFavorited?: boolean
    canDownloadChapter?: boolean
    chapterTitle?: string
    canDownloadManga?: boolean
    mangaTitle?: string
  }) => {
    ipcRenderer.send('update-menu-state', state)
  },

  // Menu action handlers
  onCheckForUpdates: (callback: () => void) => {
    ipcRenderer.on('check-for-updates', callback)
  },
  onAddToFavorites: (callback: () => void) => {
    ipcRenderer.on('add-to-favorites', callback)
  },
  onCreateCollection: (callback: () => void) => {
    ipcRenderer.on('create-collection', callback)
  },
  onManageCollections: (callback: () => void) => {
    ipcRenderer.on('manage-collections', callback)
  },
  onImportLibrary: (callback: (filePath: string) => void) => {
    ipcRenderer.on('import-library', (_, filePath) => callback(filePath))
  },
  onImportTachiyomi: (callback: (filePath: string) => void) => {
    ipcRenderer.on('import-tachiyomi', (_, filePath) => callback(filePath))
  },
  onExportLibrary: (callback: (filePath: string) => void) => {
    ipcRenderer.on('export-library', (_, filePath) => callback(filePath))
  },
  onExportTachiyomi: (callback: (filePath: string) => void) => {
    ipcRenderer.on('export-tachiyomi', (_, filePath) => callback(filePath))
  },
  onDownloadChapter: (callback: () => void) => {
    ipcRenderer.on('download-chapter', callback)
  },
  onDownloadManga: (callback: () => void) => {
    ipcRenderer.on('download-manga', callback)
  },
  onClearCache: (callback: () => void) => {
    ipcRenderer.on('clear-cache', callback)
  },
  onClearHistory: (callback: () => void) => {
    ipcRenderer.on('clear-history', callback)
  },
  onShowShortcuts: (callback: () => void) => {
    ipcRenderer.on('show-shortcuts', callback)
  }
}

// File system API
const fileSystem = {
  // read file
  readFile: (filePath: string, encoding: BufferEncoding) =>
    ipcRenderer.invoke('fs:read-file', filePath, encoding),

  // write file
  writeFile: (filePath: string, data: string, encoding: BufferEncoding) =>
    ipcRenderer.invoke('fs:write-file', filePath, data, encoding),
  // check if path exists
  isExists: (filePath: string) => ipcRenderer.invoke('fs:is-exists', filePath),

  // copy file
  copyFile: (srcPath: string, destPath: string) =>
    ipcRenderer.invoke('fs:copy-file', srcPath, destPath),

  // append to file
  appendFile: (filePath: string, data: string) =>
    ipcRenderer.invoke('fs:append-file', filePath, data),

  // rename file or directory
  rename: (oldPath: string, newPath: string) => ipcRenderer.invoke('fs:rename', oldPath, newPath),

  // create directory
  mkdir: (dirPath: string) => ipcRenderer.invoke('fs:mkdir', dirPath),

  // Delete file
  unlink: (filePath: string) => ipcRenderer.invoke('fs:unlink', filePath),

  // Delete directory
  rmdir: (dirPath: string) => ipcRenderer.invoke('fs:rmdir', dirPath),

  // Get stats
  stat: (path: string) => ipcRenderer.invoke('fs:stat', path),

  // Read directory
  readdir: (dirPath: string) => ipcRenderer.invoke('fs:readdir', dirPath),

  //Get Allowed Paths
  getAllowedPaths: () => ipcRenderer.invoke('fs:get-allowed-paths'),

  // Select download folder
  selectDownloadsFolder: () => ipcRenderer.invoke('fs:select-downloads-folder')
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('fileSystem', fileSystem)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  globalThis.electron = electronAPI
  // @ts-ignore (define in dts)
  globalThis.api = api
  // @ts-ignore (define in dts)
  globalThis.fileSystem = fileSystem
}
