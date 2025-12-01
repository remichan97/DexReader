import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  // Theme API
  onThemeChanged: (callback: (theme: 'light' | 'dark') => void) => {
    ipcRenderer.on('theme-changed', (_, theme) => callback(theme))
  },
  getTheme: () => ipcRenderer.invoke('get-theme'),

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

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
