// Third-party imports
import { ElectronAPI } from '@electron-toolkit/preload'

// IPC types
import type { IpcResponse, FileStats, AllowedPaths, FolderSelectResult } from './ipc.types'

// API entities
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
import { Manga } from '../main/api/entities/manga.entity'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
import { Chapter } from '../main/api/entities/chapter.entity'

// API responses
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
import { ApiResponse } from '../main/api/responses/api.response'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
import { CollectionResponse } from '../main/api/responses/collection.response'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
import { ImageUrlResponse } from '../main/api/responses/image-url.response'

// API enums & params
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
import { ImageQuality } from '../main/api/enums/image-quality.enum'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
import { MangaSearchParams } from '../main/api/search-params/manga.searchparam'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
import { FeedParams } from '../main/api/search-params/feed.searchparam'

// Database queries
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
import type { MangaProgressQuery } from '../main/database/queries/progress/manga-progress.query'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
import type { MangaProgressMetadata } from '../main/database/queries/progress/manga-progress-metadata.query'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
import type { ChapterProgressQuery } from '../main/database/queries/progress/chapter-progress.query'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
import type { ProgressDatabase } from '../main/database/queries/progress/progress-database.query'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
import type { ReadingStats } from '../main/database/queries/reading-stats/reading-stats.query'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
import { MangaOverride } from '../main/database/queries/manga/manga-override.query'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
import { MangaWithMetadata } from '../main/database/queries/manga/manga-with-metadata.query'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
import type { ChapterWithMetadata } from '../main/database/queries/manga/chapter-with-metadata.query'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
import type { ChapterDownloadQuery } from '../main/database/queries/chapter-downloads/chapter-downloads.query'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
import { ReadHistoryQuery } from '../main/database/queries/history/reading-history.query'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
import type { ChapterDownloadsEvent } from '../main/services/events/chapter-downloads.event'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
import type { MangaCacheStatsQuery } from '../main/database/queries/manga/manga-cache-stats.query'
import { SearchPresetQuery } from '@shared/contracts/settings/search-preset.contract'

// Database commands
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
import { CreateCollectionCommand } from '../main/database/commands/collections/create-collection.command'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
import { UpdateCollectionCommand } from '../main/database/commands/collections/update-collection.command'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
import { AddToCollectionCommand } from '../main/database/commands/collections/add-to-collection.command'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
import { RemoveFromCollectionCommand } from '../main/database/commands/collections/remove-from-collection.command'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
import { ReorderMangaInCollectionCommand } from '../main/database/commands/collections/reorder-manga-collection.command'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
import { RecordReadCommand } from '../main/database/commands/history/record-read.command'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
import { GetLibraryMangaCommand } from '../main/database/commands/manga/get-library-manga.command'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
import { UpsertMangaCommand } from '../main/database/commands/manga/upsert-manga.command'

// Database entities
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
import { CollectionQuery } from '../main/database/queries/collections/collection.query'

// Settings
import type { MangaReadingSettings } from '@shared/contracts/settings/reading-settings.contract'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
import type { AppSettings } from '../main/settings/entities/app-settings.entity'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
import type { MemoryTierInfo } from '../main/settings/response/memory-tier.response'

// Service options
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
import type { DexreaderExportOption } from '../main/services/options/dexreader-export.option'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
import type { DownloadChapterOptions } from '../main/services/options/download-chapter.option'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
import type { DeleteChapterOptions } from '../main/services/options/delete-chapter.option'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
import type { CreateSearchPresetOptions } from '../main/services/options/create-search-preset.option'

// Service types
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
import type { QueuedDownloads } from '../main/services/types/downloads/queued-downloads.type'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
import type { QueueState } from '../main/services/types/downloads/queue-state.type'

// Service results
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
import { ImportResult } from '../main/services/results/mihon/import.result'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
import { ExportResult } from '../main/services/results/mihon/export.result'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
import { DexReaderExportResult } from '../main/services/results/dexreader/export.result'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
import { DexReaderImportResult } from '../main/services/results/dexreader/import.result'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
import { DownloadChapterResult } from '../main/services/results/dexreader/download-chapter.result'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
import { DeleteMangaResult } from '../main/services/results/dexreader/delete-manga.result'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
import { DownloadStatResult } from '../main/services/results/dexreader/download-stats.result'

// Data objects
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
import { StorageData } from '../main/services/data/storage.data'

// Re-export types for renderer use
export type { IpcResponse } from './ipc.types'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
export type { ImageUrlResponse } from '../main/api/responses/image-url.response'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
export type { MangaProgressQuery } from '../main/database/queries/progress/manga-progress.query'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
export type { MangaProgressMetadata } from '../main/database/queries/progress/manga-progress-metadata.query'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
export type { ChapterProgressQuery } from '../main/database/queries/progress/chapter-progress.query'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
export type { ProgressDatabase } from '../main/database/queries/progress/progress-database.query'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
export type { ReadingStats } from '../main/database/queries/reading-stats/reading-stats.query'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
export type { MangaOverride } from '../main/database/queries/manga/manga-override.query'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
export type { MangaWithMetadata } from '../main/database/queries/manga/manga-with-metadata.query'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
export type { ChapterWithMetadata } from '../main/database/queries/manga/chapter-with-metadata.query'
export type { MangaReadingSettings } from '@shared/contracts/settings/reading-settings.contract'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
export type { CreateCollectionCommand } from '../main/database/commands/collections/create-collection.command'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
export type { UpdateCollectionCommand } from '../main/database/commands/collections/update-collection.command'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
export type { AddToCollectionCommand } from '../main/database/commands/collections/add-to-collection.command'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
export type { RemoveFromCollectionCommand } from '../main/database/commands/collections/remove-from-collection.command'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
export type { ReorderMangaInCollectionCommand } from '../main/database/commands/collections/reorder-manga-collection.command'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
export type { RecordReadCommand } from '../main/database/commands/history/record-read.command'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
export type { ReadHistoryQuery } from '../main/database/queries/history/reading-history.query'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
export type { ImportResult } from '../main/services/results/mihon/import.result'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
export type { ExportResult } from '../main/services/results/mihon/export.result'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
export type { DexReaderImportResult } from '../main/services/results/dexreader/import.result'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
export type { DexReaderExportResult } from '../main/services/results/dexreader/export.result'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
export type { DexreaderExportOption } from '../main/services/options/dexreader-export.option'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
export type { DownloadChapterOptions } from '../main/services/options/download-chapter.option'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
export type { CreateSearchPresetOptions } from '../main/services/options/create-search-preset.option'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
export type { DeleteChapterOptions } from '../main/services/options/delete-chapter.option'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
export type { DownloadChapterResult } from '../main/services/results/dexreader/download-chapter.result'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
export type { QueuedDownloads } from '../main/services/types/downloads/queued-downloads.type'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
export type { QueueState } from '../main/services/types/downloads/queue-state.type'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
export type { ChapterDownloadsEvent } from '../main/services/events/chapter-downloads.event'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
export type { StorageData } from '../main/services/data/storage.data'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
export type { DeleteMangaResult } from '../main/services/results/dexreader/delete-manga.result'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
export type { CollectionQuery } from '../main/database/queries/collections/collection.query'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
export type { AppSettings } from '../main/settings/entities/app-settings.entity'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
export type { DownloadStatResult } from '../main/services/results/dexreader/download-stats.result'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
export type { MangaCacheStatsQuery } from '../main/database/queries/manga/manga-cache-stats.query'
export type { SearchPresetQuery } from '@shared/contracts/settings/search-preset.contract'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
export type { MemoryTierInfo } from '../main/settings/response/memory-tier.response'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
export type { Manga } from '../main/api/entities/manga.entity'

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

  // Shell API
  openExternal: (url: string) => Promise<void>

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
  searchManga: (params: MangaSearchParams) => Promise<IpcResponse<CollectionResponse<Manga>>>
  getManga: (id: string, includes?: string[]) => Promise<ApiResponse<Manga>>
  getMangaFeed: (id: string, query: FeedParams) => Promise<CollectionResponse<Chapter>>
  getChapter: (id: string, includes?: string[]) => Promise<ApiResponse<Chapter>>
  getChapterImages: (id: string, quality: ImageQuality) => Promise<IpcResponse<ImageUrlResponse[]>>
  getCoverUrl: (id: string, fileName: string, size?: string) => string
  isServiceAlive: () => Promise<IpcResponse<boolean>>
}

interface Progress {
  getProgress: (mangaId: string) => Promise<IpcResponse<MangaProgressQuery | undefined>>
  saveProgress: (progressData: unknown) => Promise<IpcResponse<void>>
  getAllProgress: () => Promise<IpcResponse<MangaProgressMetadata[]>>
  deleteProgress: (mangaId: string) => Promise<IpcResponse<void>>
  getStatistics: () => Promise<IpcResponse<ReadingStats>>
  loadProgress: () => Promise<IpcResponse<ProgressDatabase>>
  onIncognitoToggle: (callback: () => void) => () => void // Returns cleanup function
  getChapterProgress: (
    mangaId: string,
    chapterId: string
  ) => Promise<IpcResponse<ChapterProgressQuery | undefined>>
  getAllChapterProgress: (mangaId: string) => Promise<IpcResponse<ChapterProgressQuery[]>>
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
  getAllCollections: () => Promise<IpcResponse<CollectionQuery[]>>
  getMangaInCollection: (collectionId: number) => Promise<IpcResponse<string[]>>
  getCollectionsByManga: (mangaId: string) => Promise<IpcResponse<CollectionQuery[]>>
  createCollection: (command: CreateCollectionCommand) => Promise<IpcResponse<number>>
  updateCollection: (command: UpdateCollectionCommand) => Promise<IpcResponse<void>>
  deleteCollection: (collectionId: number) => Promise<IpcResponse<void>>
  addToCollection: (command: AddToCollectionCommand) => Promise<IpcResponse<boolean>>
  removeFromCollection: (command: RemoveFromCollectionCommand[]) => Promise<IpcResponse<void>>
  reorderMangaInCollection: (command: ReorderMangaInCollectionCommand) => Promise<IpcResponse<void>>
}

interface ReadHistory {
  getHistory: () => Promise<IpcResponse<ReadHistoryQuery[]>>
  getRecentlyRead: (limit: number) => Promise<IpcResponse<ReadHistoryQuery[]>>
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
  openSystemProxySettings: () => Promise<IpcResponse<boolean>>
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
  getRequireForSettings: () => Promise<IpcResponse<boolean>>
  enable: (passphrase: string) => Promise<IpcResponse<boolean>>
  verify: (passphrase: string) => Promise<IpcResponse<boolean>>
  disable: (passphrase: string) => Promise<IpcResponse<boolean>>
  changePassphrase: (oldPassphrase: string, newPassphrase: string) => Promise<IpcResponse<boolean>>
  reset: () => Promise<IpcResponse<void>>
  toggleRequiredForSettings: (required: boolean) => Promise<IpcResponse<void>>
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
