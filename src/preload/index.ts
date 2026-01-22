import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { IpcResponse, FileStats, AllowedPaths, FolderSelectResult } from './ipc.types'
import { MangaSearchParams } from '../main/api/searchparams/manga.searchparam'
import { FeedParams } from '../main/api/searchparams/feed.searchparam'
import { ImageQuality } from '../main/api/enums'
import { GetLibraryMangaCommand } from '../main/database/commands/manga/get-library-manga.command'
import { UpsertMangaCommand } from '../main/database/commands/collections/upsert-manga.command'
import { CreateCollectionCommand } from '../main/database/commands/collections/create-collection.command'
import { UpdateCollectionCommand } from '../main/database/commands/collections/update-collection.command'
import { AddToCollectionCommand } from '../main/database/commands/collections/add-to-collection.command'
import { RemoveFromCollectionCommand } from '../main/database/commands/collections/remove-from-collection.command'
import { ReorderMangaInCollectionCommand } from '../main/database/commands/collections/reorder-manga-collection.command'
import { RecordReadCommand } from '../main/database/commands/history/record-read.command'

// Custom APIs for renderer
const api = {
  // Theme API
  onThemeChanged: (callback: (theme: 'light' | 'dark') => void) => {
    const listener = (_: unknown, theme: 'light' | 'dark'): void => callback(theme)
    ipcRenderer.on('theme-changed', listener)
    return () => ipcRenderer.removeListener('theme-changed', listener)
  },
  onAccentColorChanged: (callback: (color: string) => void) => {
    const listener = (_: unknown, color: string): void => callback(color)
    ipcRenderer.on('accent-color-changed', listener)
    return () => ipcRenderer.removeListener('accent-color-changed', listener)
  },
  getTheme: () => ipcRenderer.invoke('get-theme'),
  getSystemAccentColor: () => ipcRenderer.invoke('theme:get-system-accent-color'),

  // Navigation API
  onNavigate: (callback: (route: string) => void) => {
    const listener = (_: unknown, route: string): void => callback(route)
    ipcRenderer.on('navigate', listener)
    return () => ipcRenderer.removeListener('navigate', listener)
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
    return () => ipcRenderer.removeListener('check-for-updates', callback)
  },
  onAddToFavorites: (callback: () => void) => {
    ipcRenderer.on('add-to-favorites', callback)
    return () => ipcRenderer.removeListener('add-to-favorites', callback)
  },
  onCreateCollection: (callback: () => void) => {
    ipcRenderer.on('create-collection', callback)
    return () => ipcRenderer.removeListener('create-collection', callback)
  },
  onManageCollections: (callback: () => void) => {
    ipcRenderer.on('manage-collections', callback)
    return () => ipcRenderer.removeListener('manage-collections', callback)
  },
  onImportLibrary: (callback: (filePath: string) => void) => {
    const listener = (_: unknown, filePath: string): void => callback(filePath)
    ipcRenderer.on('import-library', listener)
    return () => ipcRenderer.removeListener('import-library', listener)
  },
  onImportTachiyomi: (callback: (filePath: string) => void) => {
    const listener = (_: unknown, filePath: string): void => callback(filePath)
    ipcRenderer.on('import-tachiyomi', listener)
    return () => ipcRenderer.removeListener('import-tachiyomi', listener)
  },
  onExportLibrary: (callback: (filePath: string) => void) => {
    const listener = (_: unknown, filePath: string): void => callback(filePath)
    ipcRenderer.on('export-library', listener)
    return () => ipcRenderer.removeListener('export-library', listener)
  },
  onExportTachiyomi: (callback: (filePath: string) => void) => {
    const listener = (_: unknown, filePath: string): void => callback(filePath)
    ipcRenderer.on('export-tachiyomi', listener)
    return () => ipcRenderer.removeListener('export-tachiyomi', listener)
  },
  onDownloadChapter: (callback: () => void) => {
    ipcRenderer.on('download-chapter', callback)
    return () => ipcRenderer.removeListener('download-chapter', callback)
  },
  onDownloadManga: (callback: () => void) => {
    ipcRenderer.on('download-manga', callback)
    return () => ipcRenderer.removeListener('download-manga', callback)
  },
  onClearMetadata: (callback: () => void) => {
    ipcRenderer.on('clear-metadata', callback)
    return () => ipcRenderer.removeListener('clear-metadata', callback)
  },
  onClearHistory: (callback: () => void) => {
    ipcRenderer.on('clear-history', callback)
    return () => ipcRenderer.removeListener('clear-history', callback)
  },
  onShowShortcuts: (callback: () => void) => {
    ipcRenderer.on('show-shortcuts', callback)
    return () => ipcRenderer.removeListener('show-shortcuts', callback)
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
  onIncognitoToggle: (callback: () => void) => {
    ipcRenderer.on('progress:toggle-incognito', callback)
    // Return cleanup function to remove listener
    return () => {
      ipcRenderer.removeListener('progress:toggle-incognito', callback)
    }
  },
  getChapterProgress: (mangaId: string, chapterId: string) =>
    ipcRenderer.invoke('progress:get-chapter-progress', { mangaId, chapterId }),
  getAllChapterProgress: (mangaId: string) =>
    ipcRenderer.invoke('progress:get-all-chapter-progress', mangaId),
  saveChapters: (chapters: unknown) => ipcRenderer.invoke('progress:save-chapters', chapters)
}

const reader = {
  getMangaReaderSettings: (mangaId: string) =>
    ipcRenderer.invoke('reader:get-manga-settings', mangaId),
  updateMangaReaderSettings: (mangaId: string, newSettings: unknown) =>
    ipcRenderer.invoke('reader:update-manga-settings', mangaId, newSettings),
  resetMangaReaderSettings: (mangaId: string) =>
    ipcRenderer.invoke('reader:reset-manga-settings', mangaId)
}

const library = {
  getLibraryManga: (command: GetLibraryMangaCommand) =>
    ipcRenderer.invoke('library:get-manga', command),
  toggleFavourite: (mangaId: string) => ipcRenderer.invoke('library:toggle-favourite', mangaId),
  upsertManga: (command: UpsertMangaCommand) => ipcRenderer.invoke('library:upsert-manga', command),
  checkForUpdates: (mangaIds: string[]) =>
    ipcRenderer.invoke('library:check-for-updates', mangaIds),
  getMangaWithUpdates: () => ipcRenderer.invoke('library:get-manga-with-updates')
}

const collections = {
  getAllCollections: () => ipcRenderer.invoke('collections:get-all'),
  getMangaInCollection: (collectionId: number) =>
    ipcRenderer.invoke('collections:get-manga', collectionId),
  getCollectionsByManga: (mangaId: string) =>
    ipcRenderer.invoke('collections:get-by-manga', mangaId),
  createCollection: (command: CreateCollectionCommand) =>
    ipcRenderer.invoke('collections:create', command),
  updateCollection: (command: UpdateCollectionCommand) =>
    ipcRenderer.invoke('collections:update', command),
  deleteCollection: (collectionId: number) =>
    ipcRenderer.invoke('collections:delete', collectionId),
  addToCollection: (command: AddToCollectionCommand) =>
    ipcRenderer.invoke('collections:add-manga', command),
  removeFromCollection: (command: RemoveFromCollectionCommand[]) =>
    ipcRenderer.invoke('collections:remove-manga', command),
  reorderMangaInCollection: (command: ReorderMangaInCollectionCommand) =>
    ipcRenderer.invoke('collections:reorder', command)
}

const readHistory = {
  getHistory: () => ipcRenderer.invoke('history:get-all'),
  getRecentlyRead: (limit: number) => ipcRenderer.invoke('history:get-recently-read', limit),
  recordRead: (command: RecordReadCommand) => ipcRenderer.invoke('history:record-read', command),
  clearAllHistory: () => ipcRenderer.invoke('history:clear-history')
}

const mihon = {
  importBackup: (filePath: string) => ipcRenderer.invoke('mihon:import-backup', filePath),
  cancelImport: () => ipcRenderer.invoke('mihon:cancel-import'),
  exportBackup: (savePath: string) => ipcRenderer.invoke('mihon:export-backup', savePath)
}

const settings = {
  load: () => ipcRenderer.invoke('settings:load'),
  save: (key: string, value: unknown) => ipcRenderer.invoke('settings:save', key, value),
  openFile: () => ipcRenderer.invoke('settings:open-settings-file'),
  resetToDefaults: () => ipcRenderer.invoke('settings:reset-to-defaults'),
  clearAllData: () => ipcRenderer.invoke('settings:clear-all')
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
    contextBridge.exposeInMainWorld('library', library)
    contextBridge.exposeInMainWorld('collections', collections)
    contextBridge.exposeInMainWorld('readHistory', readHistory)
    contextBridge.exposeInMainWorld('mihon', mihon)
    contextBridge.exposeInMainWorld('settings', settings)
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
  // @ts-ignore (define in dts)
  globalThis.reader = reader
  // @ts-ignore (define in dts)
  globalThis.library = library
  // @ts-ignore (define in dts)
  globalThis.collections = collections
  // @ts-ignore (define in dts)
  globalThis.readHistory = readHistory
  // @ts-ignore (define in dts)
  globalThis.mihon = mihon
  // @ts-ignore (define in dts)
  globalThis.settings = settings
}
