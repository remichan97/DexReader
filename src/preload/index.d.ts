// Third-party imports
import { ElectronAPI } from '@electron-toolkit/preload'

// IPC types
import type { IpcResponse, FileStats, AllowedPaths, FolderSelectResult } from './ipc.types'

// API entities
import { Manga } from '../main/api/entities/manga.entity'
import { Chapter } from '../main/api/entities/chapter.entity'

// API responses
import { ApiResponse } from '../main/api/responses/api.response'
import { CollectionResponse } from '../main/api/responses/collection.response'
import { ImageUrlResponse } from '../main/api/responses/image-url.response'

// API enums & params
import { ImageQuality } from '../main/api/enums/image-quality.enum'
import { MangaSearchParams } from '../main/api/search-params/manga-search.searchparam'
import { FeedParams } from '../main/api/search-params/feed.searchparam'

// Database queries
import type { MangaProgress } from '../main/database/queries/progress/manga-progress.query'
import type { MangaProgressMetadata } from '../main/database/queries/progress/manga-progress-metadata.query'
import type { ChapterProgress } from '../main/database/queries/progress/chapter-progress.query'
import type { ProgressDatabase } from '../main/database/queries/progress/progress-database.query'
import type { ReadingStats } from '../main/database/queries/reading-stats/reading-stats.query'
import { MangaOverride } from '../main/database/queries/manga/manga-override.query'
import { MangaWithMetadata } from '../main/database/queries/manga/manga-with-metadata.query'
import type { ChapterWithMetadata } from '../main/database/queries/manga/chapter-with-metadata.query'
import type { ChapterDownloadQuery } from '../main/database/queries/chapter-downloads/chapter-downloads.query'
import { ReadHistoryEntry } from '../main/database/queries/read-history/read-history.query'
import type { ChapterDownloadsEvent } from '../main/services/events/chapter-downloads.event'
import type { MangaCacheStatsQuery } from '../main/database/queries/manga/manga-cache-stats.query'
import { SearchPresetQuery } from './../main/database/queries/search-presets/search-preset.query'

// Database commands
import { CreateCollectionCommand } from '../main/database/commands/collections/create-collection.command'
import { UpdateCollectionCommand } from '../main/database/commands/collections/update-collection.command'
import { AddToCollectionCommand } from '../main/database/commands/collections/add-to-collection.command'
import { RemoveFromCollectionCommand } from '../main/database/commands/collections/remove-from-collection.command'
import { ReorderMangaInCollectionCommand } from '../main/database/commands/collections/reorder-manga-in-collection.command'
import { RecordReadCommand } from '../main/database/commands/read-history/record-read.command'
import { GetLibraryMangaCommand } from '../main/database/commands/library/get-library-manga.command'
import { UpsertMangaCommand } from '../main/database/commands/manga/upsert-manga.command'

// Database entities
import { CollectionEntity } from '../main/database/schemas/collections.schema'

// Settings
import type { MangaReadingSettings } from '../main/settings/entities/reading-settings.entity'
import type { AppSettings } from '../main/settings/entities/app-settings.entity'
import type { MemoryTierInfo } from '../main/settings/response/memory-tier.response'

// Service options
import type { DexreaderExportOption } from '../main/services/options/dexreader-export.option'
import type { DownloadChapterOptions } from '../main/services/options/download-chapter.option'
import type { DeleteChapterOptions } from '../main/services/options/delete-chapter.option'
import type { CreateSearchPresetOptions } from './../main/services/options/create-search-preset.option'

// Service types
import type { QueuedDownloads } from '../main/services/types/downloads/queued-downloads.type'
import type { QueueState } from '../main/services/types/downloads/queue-state.type'

// Service results
import { ImportResult } from '../main/services/results/import.result'
import { ExportResult } from '../main/services/results/export.result'
import { DexReaderExportResult } from '../main/services/results/dexreader/export.result'
import { DexReaderImportResult } from '../main/services/results/dexreader/import.result'
import { DownloadChapterResult } from '../main/services/results/dexreader/download-chapter.result'
import { DeleteMangaResult } from '../main/services/results/dexreader/delete-manga.result'
import { DownloadStatResult } from '../main/services/results/dexreader/download-stats.result'

// Data objects
import { StorageData } from '../main/services/data/storage.data'

// Re-export types for renderer use
export type { IpcResponse } from './ipc.types'
export type { ImageUrlResponse } from '../main/api/responses/image-url.response'
export type { MangaProgress } from '../main/database/queries/progress/manga-progress.query'
export type { MangaProgressMetadata } from '../main/database/queries/progress/manga-progress-metadata.query'
export type { ChapterProgress } from '../main/database/queries/progress/chapter-progress.query'
export type { ProgressDatabase } from '../main/database/queries/progress/progress-database.query'
export type { ReadingStats } from '../main/database/queries/reading-stats/reading-stats.query'
export type { MangaOverride } from '../main/database/queries/manga/manga-override.query'
export type { MangaWithMetadata } from '../main/database/queries/manga/manga-with-metadata.query'
export type { ChapterWithMetadata } from '../main/database/queries/manga/chapter-with-metadata.query'
export type { MangaReadingSettings } from '../main/settings/entities/reading-settings.entity'
export type { CreateCollectionCommand } from '../main/database/commands/collections/create-collection.command'
export type { UpdateCollectionCommand } from '../main/database/commands/collections/update-collection.command'
export type { AddToCollectionCommand } from '../main/database/commands/collections/add-to-collection.command'
export type { RemoveFromCollectionCommand } from '../main/database/commands/collections/remove-from-collection.command'
export type { ReorderMangaInCollectionCommand } from '../main/database/commands/collections/reorder-manga-in-collection.command'
export type { RecordReadCommand } from '../main/database/commands/read-history/record-read.command'
export type { ReadHistoryEntry } from '../main/database/queries/read-history/read-history.query'
export type { ImportResult } from '../main/services/results/import.result'
export type { ExportResult } from '../main/services/results/export.result'
export type { DexReaderImportResult } from '../main/services/results/dexreader/import.result'
export type { DexReaderExportResult } from '../main/services/results/dexreader/export.result'
export type { DexreaderExportOption } from '../main/services/options/dexreader-export.option'
export type { DownloadChapterOptions } from '../main/services/options/download-chapter.option'
export type { CreateSearchPresetOptions } from '../main/services/options/create-search-preset.option'
export type { DeleteChapterOptions } from '../main/services/options/delete-chapter.option'
export type { DownloadChapterResult } from '../main/services/results/dexreader/download-chapter.result'
export type { QueuedDownloads } from '../main/services/types/downloads/queued-downloads.type'
export type { QueueState } from '../main/services/types/downloads/queue-state.type'
export type { ChapterDownloadsEvent } from '../main/services/events/chapter-downloads.event'
export type { StorageData } from '../main/services/data/storage.data'
export type { DeleteMangaResult } from '../main/services/results/dexreader/delete-manga.result'
export type { CollectionEntity } from '../main/database/schemas/collections.schema'
export type { AppSettings } from '../main/settings/entities/app-settings.entity'
export type { DownloadStatResult } from '../main/services/results/dexreader/download-stats.result'
export type { MangaCacheStatsQuery } from '../main/database/queries/manga/manga-cache-stats.query'
export type { SearchPresetQuery } from '../main/database/queries/search-presets/search-preset.query'
export type { MemoryTierInfo } from '../main/settings/response/memory-tier.response'

interface MenuState {
  canAddToFavorites?: boolean
  isFavorited?: boolean
  canDownloadChapter?: boolean
  chapterTitle?: string
  canDownloadManga?: boolean
  mangaTitle?: string
  isIncognito?: boolean
  isOffline?: boolean
}

interface API {
  // Theme API
  onThemeChanged: (callback: (theme: 'light' | 'dark') => void) => () => void
  onAccentColorChanged: (callback: (color: string) => void) => () => void
  getTheme: () => Promise<'light' | 'dark'>
  getSystemAccentColor: () => Promise<string>

  // Navigation API
  onNavigate: (callback: (route: string) => void) => () => void

  // Dialog API
  showConfirmDialog: (
    message: string,
    detail?: string,
    confirmLabel?: string,
    cancelLabel?: string
  ) => Promise<boolean>
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
  }) => Promise<{ response: number; checkboxChecked: boolean }>

  // Menu state API
  updateMenuState: (state: MenuState) => void

  // Menu action handlers
  onCheckForUpdates: (callback: () => void) => () => void
  onAddToFavorites: (callback: () => void) => () => void
  onCreateCollection: (callback: () => void) => () => void
  onManageCollections: (callback: () => void) => () => void
  onImportLibrary: (callback: (filePath: string) => void) => () => void
  onImportTachiyomi: (callback: (filePath: string) => void) => () => void
  onExportLibrary: (callback: (filePath: string) => void) => () => void
  onExportTachiyomi: (callback: (filePath: string) => void) => () => void
  onDownloadChapter: (callback: () => void) => () => void
  onDownloadManga: (callback: () => void) => () => void
  onDownloadProgress: (callback: (event: ChapterDownloadsEvent) => void) => () => void
  onClearMetadata: (callback: () => void) => () => void
  onClearHistory: (callback: () => void) => () => void
  onShowShortcuts: (callback: () => void) => () => void
  onConnectivityToggle: (callback: () => void) => () => void
}

interface FileSystem {
  readFile(filePath: string, encoding: BufferEncoding): Promise<IpcResponse<string | Buffer>>
  writeFile(
    filePath: string,
    data: string | Buffer,
    encoding: BufferEncoding
  ): Promise<IpcResponse<boolean>>
  mkdir(dirPath: string): Promise<IpcResponse<boolean>>
  isExists(filePath: string): Promise<IpcResponse<boolean>>
  copyFile(srcPath: string, destPath: string): Promise<IpcResponse<boolean>>
  appendFile(filePath: string, data: string): Promise<IpcResponse<boolean>>
  rename(oldPath: string, newPath: string): Promise<IpcResponse<boolean>>
  unlink(filePath: string): Promise<IpcResponse<boolean>>
  rmdir(dirPath: string): Promise<IpcResponse<boolean>>
  stat(path: string): Promise<IpcResponse<FileStats>>
  readdir(dirPath: string): Promise<IpcResponse<string[]>>
  getAllowedPaths(): Promise<IpcResponse<AllowedPaths>>
  selectDownloadsFolder(): Promise<IpcResponse<FolderSelectResult>>
  openDownloadsFolder(): Promise<IpcResponse<boolean>>
}

interface MangaDexApi {
  searchManga: (params: MangaSearchParams) => Promise<CollectionResponse<Manga>>
  getManga: (id: string, includes?: string[]) => Promise<ApiResponse<Manga>>
  getMangaFeed: (id: string, query: FeedParams) => Promise<CollectionResponse<Chapter>>
  getChapter: (id: string, includes?: string[]) => Promise<ApiResponse<Chapter>>
  getChapterImages: (id: string, quality: ImageQuality) => Promise<IpcResponse<ImageUrlResponse[]>>
  getCoverUrl: (id: string, fileName: string, size?: string) => string
  isServiceAlive: () => Promise<IpcResponse<boolean>>
}

interface Progress {
  getProgress: (mangaId: string) => Promise<IpcResponse<MangaProgress | undefined>>
  saveProgress: (progressData: unknown) => Promise<IpcResponse<void>>
  getAllProgress: () => Promise<IpcResponse<MangaProgressMetadata[]>>
  deleteProgress: (mangaId: string) => Promise<IpcResponse<void>>
  getStatistics: () => Promise<IpcResponse<ReadingStats>>
  loadProgress: () => Promise<IpcResponse<ProgressDatabase>>
  onIncognitoToggle: (callback: () => void) => () => void // Returns cleanup function
  getChapterProgress: (
    mangaId: string,
    chapterId: string
  ) => Promise<IpcResponse<ChapterProgress | undefined>>
  getAllChapterProgress: (mangaId: string) => Promise<IpcResponse<ChapterProgress[]>>
  saveChapters: (
    chapters: Array<{
      chapterId: string
      mangaId: string
      title?: string
      chapterNumber?: string
      volume?: string
      language: string
      publishAt: Date
      scanlationGroup?: string
      externalUrl?: string
    }>
  ) => Promise<IpcResponse<void>>
}

interface Reader {
  getMangaReaderSettings: (mangaId: string) => Promise<MangaReadingSettings>
  updateMangaReaderSettings: (mangaId: string, settings: MangaReadingSettings) => Promise<void>
  resetMangaReaderSettings: (mangaId: string) => Promise<void>
  clearAllMangaReaderOverrides: () => Promise<void>
  getAllReaderOverrides: () => Promise<IpcResponse<MangaOverride[]>>
}

interface Library {
  getLibraryManga: (command: GetLibraryMangaCommand) => Promise<IpcResponse<MangaWithMetadata[]>>
  getMangaById: (mangaId: string) => Promise<IpcResponse<MangaWithMetadata | undefined>>
  getCachedChapters: (mangaId: string) => Promise<IpcResponse<ChapterWithMetadata[]>>
  toggleFavourite: (mangaId: string) => Promise<IpcResponse<void>>
  upsertManga: (command: UpsertMangaCommand) => Promise<IpcResponse<void>>
  getDownloadedManga: () => Promise<IpcResponse<MangaWithMetadata[]>>
}

interface Collections {
  getAllCollections: () => Promise<IpcResponse<CollectionEntity[]>>
  getMangaInCollection: (collectionId: number) => Promise<IpcResponse<string[]>>
  getCollectionsByManga: (mangaId: string) => Promise<IpcResponse<CollectionEntity[]>>
  createCollection: (command: CreateCollectionCommand) => Promise<IpcResponse<CollectionEntity>>
  updateCollection: (command: UpdateCollectionCommand) => Promise<IpcResponse<CollectionEntity>>
  deleteCollection: (collectionId: number) => Promise<IpcResponse<void>>
  addToCollection: (command: AddToCollectionCommand) => Promise<IpcResponse<boolean>>
  removeFromCollection: (command: RemoveFromCollectionCommand[]) => Promise<IpcResponse<void>>
  reorderMangaInCollection: (command: ReorderMangaInCollectionCommand) => Promise<IpcResponse<void>>
}

interface ReadHistory {
  getHistory: () => Promise<IpcResponse<ReadHistoryEntry[]>>
  getRecentlyRead: (limit: number) => Promise<IpcResponse<ReadHistoryEntry[]>>
  recordRead: (command: RecordReadCommand) => Promise<IpcResponse<void>>
  clearAllHistory: () => Promise<IpcResponse<void>>
}

interface Mihon {
  importBackup: (filePath: string) => Promise<IpcResponse<ImportResult>>
  cancelImport: () => Promise<IpcResponse<void>>
  exportBackup: (savePath: string) => Promise<IpcResponse<ExportResult>>
}

interface Storage {
  statsMangaTable: () => Promise<IpcResponse<MangaCacheStatsQuery>>
  clearMangaCache: (immediate: boolean) => Promise<IpcResponse<number>>
  optimiseMangaCache: () => Promise<IpcResponse<number>>
  setCoverCacheLimit: (limitInMB: number) => Promise<IpcResponse<void>>
}

interface Settings {
  load: () => Promise<IpcResponse<AppSettings>>
  getSettingByPath: (section: string, settingsPath?: string) => Promise<IpcResponse<unknown>>
  saveAll: (settings: AppSettings) => Promise<IpcResponse<boolean>>
  openFile: () => Promise<IpcResponse<boolean>>
  resetToDefaults: () => Promise<IpcResponse<boolean>>
  clearAllData: () => Promise<IpcResponse<boolean>>
  openSystemDateSettings: () => Promise<IpcResponse<boolean>>
  getMemoryTierInfo: () => Promise<IpcResponse<MemoryTierInfo>>
  restart: () => Promise<IpcResponse<void>>
}

interface DexReader {
  exportData: (
    savePath: string,
    options: DexreaderExportOption
  ) => Promise<IpcResponse<DexReaderExportResult>>

  importData: (filePath: string) => Promise<IpcResponse<DexReaderImportResult>>
  cancelImport: () => Promise<IpcResponse<void>>
}

interface Downloads {
  downloadChapter: (options: DownloadChapterOptions) => Promise<IpcResponse<DownloadChapterResult>>
  deleteChapter: (options: DeleteChapterOptions) => Promise<IpcResponse<void>>
  getAllDownloads: () => Promise<IpcResponse<ChapterDownloadQuery[]>>
  clearCompleted: () => Promise<IpcResponse<number>>
  getDownload: (chapterId: string) => Promise<IpcResponse<ChapterDownloadQuery | undefined>>
  getStorageInfo: () => Promise<IpcResponse<StorageData>>
  isDownloaded: (chapterId: string) => Promise<IpcResponse<ChapterDownloadQuery | undefined>>
  addToQueue: (options: QueuedDownloads) => Promise<IpcResponse<void>>
  addBatchToQueue: (options: QueuedDownloads[]) => Promise<IpcResponse<void>>
  removeFromQueue: (chapterId: string) => Promise<IpcResponse<void>>
  clearQueue: () => Promise<IpcResponse<void>>
  cancelAllQueued: () => Promise<IpcResponse<number>>
  retryDownload: (chapterId: string) => Promise<IpcResponse<void>>
  getQueueStats: () => Promise<IpcResponse<QueueState>>
  getQueuedItems: () => Promise<IpcResponse<QueuedDownloads[]>>
  deleteManga: (mangaId: string) => Promise<IpcResponse<DeleteMangaResult>>
  batchDeleteManga: (mangaIds: string[]) => Promise<IpcResponse<void>>
  getDownloadStats: (mangaId: string) => Promise<IpcResponse<DownloadStatResult>>
  clearCoverCache: () => Promise<IpcResponse<void>>
}

interface AppUpdate {
  checkForUpdates: (manual: boolean) => Promise<IpcResponse<void>>
  downloadUpdate: () => Promise<IpcResponse<void>>
  installUpdate: () => Promise<IpcResponse<void>>
  getAppVersion: () => Promise<IpcResponse<string>>

  // Event listeners
  onUpdateChecking: (callback: () => void) => () => void
  onUpdateAvailable: (
    callback: (info: { version: string; releaseDate?: string; releaseNotes?: string }) => void
  ) => () => void
  onUpdateNotAvailable: (callback: (info: { version: string }) => void) => () => void
  onUpdateDownloading: (callback: () => void) => () => void
  onDownloadProgress: (
    callback: (progress: {
      percent: number
      transferred: number
      total: number
      bytesPerSecond: number
    }) => void
  ) => () => void
  onUpdateDownloaded: (
    callback: (info: { version: string; releaseDate?: string; releaseNotes?: string }) => void
  ) => () => void
  onUpdateError: (callback: (error: { message: string; userMessage: string }) => void) => () => void
}

interface Logger {
  info: (message: string, ...args: unknown[]) => void
  warn: (message: string, ...args: unknown[]) => void
  error: (message: string, ...args: unknown[]) => void
  debug: (message: string, ...args: unknown[]) => void
  cleanupLogs: (forceCleanup?: boolean) => Promise<void>
  openLogsFolder: () => Promise<string>
}

interface SearchPresets {
  getAll: () => Promise<IpcResponse<SearchPresetQuery[]>>
  getByName: (name: string) => Promise<IpcResponse<SearchPresetQuery | undefined>>
  getById: (id: number) => Promise<IpcResponse<SearchPresetQuery | undefined>>
  create: (options: CreateSearchPresetOptions) => Promise<IpcResponse<SearchPresetQuery>>
  delete: (id: number) => Promise<IpcResponse<void>>
  updateLastUsedAt: (id: number) => Promise<IpcResponse<void>>
}

interface Gatekeeper {
  isEnabled: () => Promise<IpcResponse<boolean>>
  enable: (passphrase: string) => Promise<IpcResponse<boolean>>
  verify: (passphrase: string) => Promise<IpcResponse<boolean>>
  disable: (passphrase: string) => Promise<IpcResponse<boolean>>
  changePassphrase: (oldPassphrase: string, newPassphrase: string) => Promise<IpcResponse<boolean>>
  reset: () => Promise<IpcResponse<void>>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: API
    fileSystem: FileSystem
    mangadex: MangaDexApi
    progress: Progress
    reader: Reader
    library: Library
    collections: Collections
    readHistory: ReadHistory
    mihon: Mihon
    settings: Settings
    dexreader: DexReader
    downloads: Downloads
    storage: Storage
    appUpdate: AppUpdate
    logger: Logger
    searchPresets: SearchPresets
    gatekeeper: Gatekeeper
  }
}
