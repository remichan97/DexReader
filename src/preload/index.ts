import { DownloadChapterCommand } from '@shared/commands/services/download-chapter.command'
import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { IpcResponse, FileStats, AllowedPaths, FolderSelectResult } from './ipc.types'
import { MangaSearchParams } from '../shared/search-params/manga.searchparam'
import { FeedParams } from '../shared/search-params/feed.searchparam'
import { ImageQuality } from '@shared/enums/mangadex/image-quality.enum'
import { GetLibraryMangaCommand } from '@shared/commands/repositories/manga/get-library-manga.command'
import { UpsertMangaCommand } from '@shared/commands/repositories/manga/upsert-manga.command'
import { CreateCollectionCommand } from '@shared/commands/repositories/collections/create-collection.command'
import { UpdateCollectionCommand } from '@shared/commands/repositories/collections/update-collection.command'
import { AddToCollectionCommand } from '@shared/commands/repositories/collections/add-to-collection.command'
import { RemoveFromCollectionCommand } from '@shared/commands/repositories/collections/remove-from-collection.command'
import { RecordReadCommand } from '@shared/commands/repositories/history/record-read.command'
import { DexreaderExportCommand } from '@shared/commands/services/dexreader-export.command'
import { QueuedDownloads } from '@shared/types/downloads/queued-downloads.type'
import { DeleteChapterCommand } from '@shared/commands/services/delete-chapter.command'
import { CreateSearchPresetCommand } from '@shared/commands/services/create-search-preset.command'
import type { ChapterDownloadsEvent } from '@shared/events/chapter-downloads.event'
import { SnapshotTrigger } from '@shared/enums/services/snapshot-trigger.enum'

// Export enums for renderer
export { DownloadConfirmation } from '@shared/enums/settings/download-confirmation.enum'

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

  // Shell API
  openExternal: (url: string) => ipcRenderer.invoke('shell:open-external', url),

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
  onDownloadProgress: (callback: (event: ChapterDownloadsEvent) => void) => {
    const listener = (_: unknown, event: ChapterDownloadsEvent): void => callback(event)
    ipcRenderer.on('download:chapter-progress', listener)
    return () => ipcRenderer.removeListener('download:chapter-progress', listener)
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
  },
  onConnectivityToggle: (callback: () => void) => {
    ipcRenderer.on('connectivity:toggle-offline', callback)
    return () => ipcRenderer.removeListener('connectivity:toggle-offline', callback)
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
    ipcRenderer.invoke('fs:select-downloads-folder'),

  // Open downloads folder in file explorer
  openDownloadsFolder: (): Promise<IpcResponse<boolean>> =>
    ipcRenderer.invoke('fs:open-downloads-folder')
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
    ipcRenderer.invoke('mangadex:get-chapter-images', id, quality),
  isServiceAlive: () => ipcRenderer.invoke('mangadex:healthcheck')
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
    ipcRenderer.invoke('reader:reset-manga-settings', mangaId),
  clearAllOverrides: () => ipcRenderer.invoke('reader:clear-all-overrides'),
  getAllMangaOverrides: () => ipcRenderer.invoke('reader:get-all-manga-overrides')
}

const library = {
  getLibraryManga: (command: GetLibraryMangaCommand) =>
    ipcRenderer.invoke('library:get-manga', command),
  getMangaById: (mangaId: string) => ipcRenderer.invoke('library:get-manga-by-id', mangaId),
  getCachedChapters: (mangaId: string) =>
    ipcRenderer.invoke('library:get-cached-chapters', mangaId),
  toggleFavourite: (mangaId: string) => ipcRenderer.invoke('library:toggle-favourite', mangaId),
  upsertManga: (command: UpsertMangaCommand) => ipcRenderer.invoke('library:upsert-manga', command),
  getDownloadedManga: () => ipcRenderer.invoke('library:get-downloaded-manga')
}

const storage = {
  statsMangaTable: () => ipcRenderer.invoke('storage:get-stats'),
  clearMangaCache: (immediate: boolean) =>
    ipcRenderer.invoke('storage:clear-manga-cache', immediate),
  optimiseMangaCache: () => ipcRenderer.invoke('storage:optimise-manga-cache'),
  setCoverCacheLimit: (limitInMB: number) =>
    ipcRenderer.invoke('storage:set-cover-cache-limit', limitInMB)
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
    ipcRenderer.invoke('collections:remove-manga', command)
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
  getSettingByPath: (section: string, settingsPath?: string) =>
    ipcRenderer.invoke('settings:get', section, settingsPath),
  saveAll: (settings: unknown) => ipcRenderer.invoke('settings:save-all', settings),
  openFile: () => ipcRenderer.invoke('settings:open-settings-file'),
  resetToDefaults: () => ipcRenderer.invoke('settings:reset-to-defaults'),
  clearAllData: () => ipcRenderer.invoke('settings:clear-all'),
  openSystemDateSettings: () => ipcRenderer.invoke('settings:open-system-date-settings'),
  openSystemProxySettings: () => ipcRenderer.invoke('settings:open-system-proxy-settings'),
  getMemoryTierInfo: () => ipcRenderer.invoke('settings:get-memory-tier-info'),
  restart: () => ipcRenderer.invoke('app:restart')
}

const dexReader = {
  exportData: (savePath: string, options: DexreaderExportCommand) =>
    ipcRenderer.invoke('dexreader:export-data', savePath, options),

  importData: (filePath: string) => ipcRenderer.invoke('dexreader:import-data', filePath),

  cancelImport: () => ipcRenderer.invoke('dexreader:cancel-import')
}

const downloads = {
  downloadChapter: (options: DownloadChapterCommand) =>
    ipcRenderer.invoke('download:download-chapter', options),
  deleteChapter: (options: DeleteChapterCommand) =>
    ipcRenderer.invoke('download:delete-chapter', options),
  getAllDownloads: () => ipcRenderer.invoke('download:get-all-downloads'),
  getStorageInfo: () => ipcRenderer.invoke('download:storage-stats'),
  clearCompleted: () => ipcRenderer.invoke('download:clear-completed'),
  getDownload: (chapterId: string) => ipcRenderer.invoke('download:get-download', chapterId),
  isDownloaded: (chapterId: string) => ipcRenderer.invoke('download:is-downloaded', chapterId),
  addToQueue: (options: QueuedDownloads) => ipcRenderer.invoke('download:add-to-queue', options),
  addBatchToQueue: (options: QueuedDownloads[]) =>
    ipcRenderer.invoke('download:add-batch-to-queue', options),
  removeFromQueue: (chapterId: string) =>
    ipcRenderer.invoke('download:remove-from-queue', chapterId),
  clearQueue: () => ipcRenderer.invoke('download:clear-queue'),
  clearCoverCache: () => ipcRenderer.invoke('download:clear-cover-cache'),
  deleteManga: (mangaId: string) => ipcRenderer.invoke('download:delete-manga', mangaId),
  batchDeleteManga: (mangaIds: string[]) =>
    ipcRenderer.invoke('download:batch-delete-manga', mangaIds),
  cancelAllQueued: () => ipcRenderer.invoke('download:cancel-all-queued'),
  retryDownload: (chapterId: string) => ipcRenderer.invoke('download:retry', chapterId),
  getQueueStats: () => ipcRenderer.invoke('download:get-queue-stats'),
  getQueuedItems: () => ipcRenderer.invoke('download:get-queued-items'),
  getDownloadStats: (mangaId: string) => ipcRenderer.invoke('download:get-download-stats', mangaId)
}

const appUpdate = {
  checkForUpdates: (manual: boolean) => ipcRenderer.invoke('app-update:check', manual),
  downloadUpdate: () => ipcRenderer.invoke('app-update:download'),
  installUpdate: () => ipcRenderer.invoke('app-update:install'),
  getAppVersion: () => ipcRenderer.invoke('app-update:version'),

  // Event listeners
  onUpdateChecking: (callback: () => void) => {
    ipcRenderer.on('app-update:update-checking', callback)
    return () => ipcRenderer.removeListener('app-update:update-checking', callback)
  },
  onUpdateAvailable: (
    callback: (info: { version: string; releaseDate?: string; releaseNotes?: string }) => void
  ) => {
    ipcRenderer.on('app-update:update-available', (_, info) => callback(info))
    return () => ipcRenderer.removeListener('app-update:update-available', () => {})
  },

  onUpdateNotAvailable: (callback: (info: { version: string }) => void) => {
    ipcRenderer.on('app-update:update-not-available', (_, info) => callback(info))
    return () => ipcRenderer.removeListener('app-update:update-not-available', () => {})
  },
  onUpdateDownloading: (callback: () => void) => {
    ipcRenderer.on('app-update:update-downloading', callback)
    return () => ipcRenderer.removeListener('app-update:update-downloading', callback)
  },
  onDownloadProgress: (
    callback: (progress: {
      percent: number
      transferred: number
      total: number
      bytesPerSecond: number
    }) => void
  ) => {
    ipcRenderer.on('app-update:update-download-progress', (_, progress) => callback(progress))
    return () => ipcRenderer.removeListener('app-update:update-download-progress', () => {})
  },
  onUpdateDownloaded: (
    callback: (info: { version: string; releaseDate?: string; releaseNotes?: string }) => void
  ) => {
    ipcRenderer.on('app-update:update-downloaded', (_, info) => callback(info))
    return () => ipcRenderer.removeListener('app-update:update-downloaded', () => {})
  },
  onUpdateError: (callback: (error: { message: string; userMessage: string }) => void) => {
    ipcRenderer.on('app-update:update-error', (_, error) => callback(error))
    return () => ipcRenderer.removeListener('app-update:update-error', () => {})
  }
}

const logger = {
  info: (message: string, ...args: unknown[]) => ipcRenderer.invoke('log:info', message, ...args),
  error: (message: string, ...args: unknown[]) => ipcRenderer.invoke('log:error', message, ...args),
  debug: (message: string, ...args: unknown[]) => ipcRenderer.invoke('log:debug', message, ...args),
  warn: (message: string, ...args: unknown[]) => ipcRenderer.invoke('log:warn', message, ...args),
  cleanupLogs: (forceCleanup = false) => ipcRenderer.invoke('log:cleanup', forceCleanup),
  openLogsFolder: () => ipcRenderer.invoke('log:open-folder')
}

const searchPresets = {
  getAll: () => ipcRenderer.invoke('search-presets:getAll'),
  getByName: (name: string) => ipcRenderer.invoke('search-presets:getByName', name),
  getById: (id: number) => ipcRenderer.invoke('search-presets:getById', id),
  updateLastUsedAt: (id: number) => ipcRenderer.invoke('search-presets:updateLastUsedAt', id),
  delete: (id: number) => ipcRenderer.invoke('search-presets:delete', id),
  create: (command: CreateSearchPresetCommand) => ipcRenderer.invoke('search-presets:save', command)
}

const gatekeeper = {
  isEnabled: () => ipcRenderer.invoke('gatekeeper:available'),
  getRequireForSettings: () => ipcRenderer.invoke('gatekeeper:getRequireForSettings'),
  enable: (passphrase: string) => ipcRenderer.invoke('gatekeeper:enable', passphrase),
  verify: (passphrase: string) => ipcRenderer.invoke('gatekeeper:verify', passphrase),
  disable: (passphrase: string) => ipcRenderer.invoke('gatekeeper:disable', passphrase),
  changePassphrase: (oldPassphrase: string, newPassphrase: string) =>
    ipcRenderer.invoke('gatekeeper:update', oldPassphrase, newPassphrase),
  reset: () => ipcRenderer.invoke('gatekeeper:reset'),
  toggleRequiredForSettings: (required: boolean) =>
    ipcRenderer.invoke('gatekeeper:toggleRequireForSettings', required)
}

const snapshots = {
  createSnapshot: (trigger: SnapshotTrigger) => ipcRenderer.invoke('snapshot:create', trigger),
  listSnapshots: () => ipcRenderer.invoke('snapshot:list'),
  deleteSnapshot: (snapshotName: string) => ipcRenderer.invoke('snapshot:delete', snapshotName),
  restoreSnapshot: (snapshotName: string) => ipcRenderer.invoke('snapshot:restore', snapshotName)
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
    contextBridge.exposeInMainWorld('dexreader', dexReader)
    contextBridge.exposeInMainWorld('downloads', downloads)
    contextBridge.exposeInMainWorld('storage', storage)
    contextBridge.exposeInMainWorld('appUpdate', appUpdate)
    contextBridge.exposeInMainWorld('logger', logger)
    contextBridge.exposeInMainWorld('searchPresets', searchPresets)
    contextBridge.exposeInMainWorld('gatekeeper', gatekeeper)
    contextBridge.exposeInMainWorld('snapshots', snapshots)
  } catch (error) {
    console.error(error)
  }
} else {
  globalThis.electron = electronAPI
  globalThis.api = api
  globalThis.fileSystem = fileSystem
  globalThis.mangadex = mangadexApi
  globalThis.progress = progress
  globalThis.reader = reader
  globalThis.library = library
  globalThis.collections = collections
  globalThis.readHistory = readHistory
  globalThis.mihon = mihon
  globalThis.settings = settings
  globalThis.dexreader = dexReader
  globalThis.downloads = downloads
  globalThis.storage = storage
  globalThis.appUpdate = appUpdate
  globalThis.logger = logger
  globalThis.searchPresets = searchPresets
  globalThis.gatekeeper = gatekeeper
  globalThis.snapshots = snapshots
}
