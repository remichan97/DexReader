import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { IpcResponse, FileStats, AllowedPaths, FolderSelectResult } from './ipc.types'
import { MangaSearchParams } from '../main/api/searchparams/manga.searchparam'
import { FeedParams } from '../main/api/searchparams/feed.searchparam'
import { ImageQuality } from '../main/api/enums'

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
  showConfirmDialog: (
    message: string,
    detail?: string,
    confirmLabel?: string,
    cancelLabel?: string
  ) => ipcRenderer.invoke('show-confirm-dialog', message, detail, confirmLabel, cancelLabel),

  showDialog: (options: {
    message: string
    detail?: string
    buttons?: string[]
    type?: 'none' | 'info' | 'error' | 'question' | 'warning'
    defaultId?: number
    cancelId?: number
    noLink?: boolean
    checkboxLabel?: string
    checkboxChecked?: boolean
  }) => ipcRenderer.invoke('show-dialog', options),

  // Menu state API
  updateMenuState: (state: {
    canAddToFavorites?: boolean
    isFavorited?: boolean
    canDownloadChapter?: boolean
    chapterTitle?: string
    canDownloadManga?: boolean
    mangaTitle?: string
    isIncognito?: boolean
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
  onClearMetadata: (callback: () => void) => {
    ipcRenderer.on('clear-metadata', callback)
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
  readFile: (filePath: string, encoding: BufferEncoding): Promise<IpcResponse<string | Buffer>> =>
    ipcRenderer.invoke('fs:read-file', filePath, encoding),

  // write file
  writeFile: (
    filePath: string,
    data: string | Buffer,
    encoding: BufferEncoding
  ): Promise<IpcResponse<boolean>> => ipcRenderer.invoke('fs:write-file', filePath, data, encoding),

  // check if path exists
  isExists: (filePath: string): Promise<IpcResponse<boolean>> =>
    ipcRenderer.invoke('fs:is-exists', filePath),

  // copy file
  copyFile: (srcPath: string, destPath: string): Promise<IpcResponse<boolean>> =>
    ipcRenderer.invoke('fs:copy-file', srcPath, destPath),

  // append to file
  appendFile: (filePath: string, data: string): Promise<IpcResponse<boolean>> =>
    ipcRenderer.invoke('fs:append-file', filePath, data),

  // rename file or directory
  rename: (oldPath: string, newPath: string): Promise<IpcResponse<boolean>> =>
    ipcRenderer.invoke('fs:rename', oldPath, newPath),

  // create directory
  mkdir: (dirPath: string): Promise<IpcResponse<boolean>> =>
    ipcRenderer.invoke('fs:mkdir', dirPath),

  // Delete file
  unlink: (filePath: string): Promise<IpcResponse<boolean>> =>
    ipcRenderer.invoke('fs:unlink', filePath),

  // Delete directory
  rmdir: (dirPath: string): Promise<IpcResponse<boolean>> =>
    ipcRenderer.invoke('fs:rmdir', dirPath),

  // Get stats
  stat: (path: string): Promise<IpcResponse<FileStats>> => ipcRenderer.invoke('fs:stat', path),

  // Read directory
  readdir: (dirPath: string): Promise<IpcResponse<string[]>> =>
    ipcRenderer.invoke('fs:readdir', dirPath),

  // Get Allowed Paths
  getAllowedPaths: (): Promise<IpcResponse<AllowedPaths>> =>
    ipcRenderer.invoke('fs:get-allowed-paths'),

  // Select download folder
  selectDownloadsFolder: (): Promise<IpcResponse<FolderSelectResult>> =>
    ipcRenderer.invoke('fs:select-downloads-folder')
}

const mangadexApi = {
  searchManga: (params: MangaSearchParams) => ipcRenderer.invoke('mangadex:search-manga', params),
  getManga: (id: string, includes?: string[]) =>
    ipcRenderer.invoke('mangadex:get-manga', id, includes),
  getMangaFeed: (id: string, query: FeedParams) =>
    ipcRenderer.invoke('mangadex:get-manga-feed', id, query),
  getChapter: (id: string, includes?: string[]) =>
    ipcRenderer.invoke('mangadex:get-chapter', id, includes),
  getChapterImages: (id: string, quality: ImageQuality) =>
    ipcRenderer.invoke('mangadex:get-chapter-images', id, quality)
}

// Progress tracking API
const progress = {
  getProgress: (mangaId: string) => ipcRenderer.invoke('progress:get-progress', mangaId),
  saveProgress: (progressData: unknown) =>
    ipcRenderer.invoke('progress:save-progress', progressData),
  getAllProgress: () => ipcRenderer.invoke('progress:get-all-progress'),
  deleteProgress: (mangaId: string) => ipcRenderer.invoke('progress:delete-progress', mangaId),
  getStatistics: () => ipcRenderer.invoke('progress:get-statistics'),
  loadProgress: () => ipcRenderer.invoke('progress:load-progress'),
  onIncognitoToggle: (callback: () => void) => {
    ipcRenderer.on('progress:toggle-incognito', callback)
    // Return cleanup function to remove listener
    return () => {
      ipcRenderer.removeListener('progress:toggle-incognito', callback)
    }
  }
}

const reader = {
  getMangaReaderSettings: (mangaId: string) =>
    ipcRenderer.invoke('reader:get-manga-settings', mangaId),
  updateMangaReaderSettings: (
    mangaId: string,
    newSettings: unknown,
    title: string,
    coverUrl?: string
  ) => ipcRenderer.invoke('reader:update-manga-settings', mangaId, newSettings, title, coverUrl),
  resetMangaReaderSettings: (mangaId: string) =>
    ipcRenderer.invoke('reader:reset-manga-settings', mangaId)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('fileSystem', fileSystem)
    contextBridge.exposeInMainWorld('mangadex', mangadexApi)
    contextBridge.exposeInMainWorld('progress', progress)
    contextBridge.exposeInMainWorld('reader', reader)
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
  // @ts-ignore (define in dts)
  globalThis.mangadex = mangadexApi
  // @ts-ignore (define in dts)
  globalThis.progress = progress
}
