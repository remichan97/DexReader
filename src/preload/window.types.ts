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
import type { MangaProgressContract } from '@shared/contracts/database/progress/manga-progress.contract'
import type { MangaProgressMetadataContract } from '@shared/contracts/database/progress/manga-progress-metadata.contract'
import type { ChapterProgressContract } from '@shared/contracts/database/progress/chapter-progress.contract'
import type { ProgressDatabaseContract } from '@shared/contracts/database/progress/progress-database.contract'
import type { ReadingStatsContract } from '@shared/contracts/database/reading-stats/reading-stats.contract'
import { MangaOverrideContract } from '@shared/contracts/database/manga/manga-override.contract'
import { MangaWithMetadataContract } from '@shared/contracts/database/manga/manga-with-metadata.contract'
import type { ChapterWithMetadataContract } from '@shared/contracts/database/manga/chapter-with-metadata.contract'
import type { ChapterDownloadContract } from '@shared/contracts/database/chapter-downloads/chapter-downloads.contract'
import { ReadHistoryContract } from '@shared/contracts/database/history/reading-history.query'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
import type { ChapterDownloadsEvent } from '../main/services/events/chapter-downloads.event'
import type { MangaCacheStatsContract } from '@shared/contracts/database/manga/manga-cache-stats.contract'
import { SearchPresetQuery } from '@shared/contracts/settings/search-preset.contract'

// Database commands
import { CreateCollectionCommand } from '@shared/commands/repositories/collections/create-collection.command'
import { UpdateCollectionCommand } from '@shared/commands/repositories/collections/update-collection.command'
import { AddToCollectionCommand } from '@shared/commands/repositories/collections/add-to-collection.command'
import { RemoveFromCollectionCommand } from '@shared/commands/repositories/collections/remove-from-collection.command'
import { ReorderMangaInCollectionCommand } from '@shared/commands/repositories/collections/reorder-manga-collection.command'
import { RecordReadCommand } from '@shared/commands/repositories/history/record-read.command'
import { GetLibraryMangaCommand } from '@shared/commands/repositories/manga/get-library-manga.command'
import { UpsertMangaCommand } from '@shared/commands/repositories/manga/upsert-manga.command'

// Database entities
import { CollectionContract } from '@shared/contracts/database/collections/collection.contract'

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
export type { MangaProgressContract } from '@shared/contracts/database/progress/manga-progress.contract'
export type { MangaProgressMetadataContract } from '@shared/contracts/database/progress/manga-progress-metadata.contract'
export type { ChapterProgressContract } from '@shared/contracts/database/progress/chapter-progress.contract'
export type { ProgressDatabaseContract } from '@shared/contracts/database/progress/progress-database.contract'
export type { ReadingStatsContract } from '@shared/contracts/database/reading-stats/reading-stats.contract'
export type { MangaOverrideContract } from '@shared/contracts/database/manga/manga-override.contract'
export type { MangaWithMetadataContract } from '@shared/contracts/database/manga/manga-with-metadata.contract'
export type { ChapterWithMetadataContract } from '@shared/contracts/database/manga/chapter-with-metadata.contract'
export type { MangaReadingSettings } from '@shared/contracts/settings/reading-settings.contract'
export type { CreateCollectionCommand } from '@shared/commands/repositories/collections/create-collection.command'
export type { UpdateCollectionCommand } from '@shared/commands/repositories/collections/update-collection.command'
export type { AddToCollectionCommand } from '@shared/commands/repositories/collections/add-to-collection.command'
export type { RemoveFromCollectionCommand } from '@shared/commands/repositories/collections/remove-from-collection.command'
export type { ReorderMangaInCollectionCommand } from '@shared/commands/repositories/collections/reorder-manga-collection.command'
export type { RecordReadCommand } from '@shared/commands/repositories/history/record-read.command'
export type { ReadHistoryContract } from '@shared/contracts/database/history/reading-history.query'
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
export type { CollectionContract } from '@shared/contracts/database/collections/collection.contract'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
export type { AppSettings } from '../main/settings/entities/app-settings.entity'
// eslint-disable-next-line no-restricted-imports -- TODO(shared-migration): move this type to src/shared
export type { DownloadStatResult } from '../main/services/results/dexreader/download-stats.result'
export type { MangaCacheStatsContract } from '@shared/contracts/database/manga/manga-cache-stats.contract'
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
  getProgress: (mangaId: string) => Promise<IpcResponse<MangaProgressContract | undefined>>
  saveProgress: (progressData: unknown) => Promise<IpcResponse<void>>
  getAllProgress: () => Promise<IpcResponse<MangaProgressMetadataContract[]>>
  deleteProgress: (mangaId: string) => Promise<IpcResponse<void>>
  getStatistics: () => Promise<IpcResponse<ReadingStatsContract>>
  loadProgress: () => Promise<IpcResponse<ProgressDatabaseContract>>
  onIncognitoToggle: (callback: () => void) => () => void // Returns cleanup function
  getChapterProgress: (
    mangaId: string,
    chapterId: string
  ) => Promise<IpcResponse<ChapterProgressContract | undefined>>
  getAllChapterProgress: (mangaId: string) => Promise<IpcResponse<ChapterProgressContract[]>>
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
  getAllReaderOverrides: () => Promise<IpcResponse<MangaOverrideContract[]>>
}

interface Library {
  getLibraryManga: (
    command: GetLibraryMangaCommand
  ) => Promise<IpcResponse<MangaWithMetadataContract[]>>
  getMangaById: (mangaId: string) => Promise<IpcResponse<MangaWithMetadataContract | undefined>>
  getCachedChapters: (mangaId: string) => Promise<IpcResponse<ChapterWithMetadataContract[]>>
  toggleFavourite: (mangaId: string) => Promise<IpcResponse<void>>
  upsertManga: (command: UpsertMangaCommand) => Promise<IpcResponse<void>>
  getDownloadedManga: () => Promise<IpcResponse<MangaWithMetadataContract[]>>
}

interface Collections {
  getAllCollections: () => Promise<IpcResponse<CollectionContract[]>>
  getMangaInCollection: (collectionId: number) => Promise<IpcResponse<string[]>>
  getCollectionsByManga: (mangaId: string) => Promise<IpcResponse<CollectionContract[]>>
  createCollection: (command: CreateCollectionCommand) => Promise<IpcResponse<number>>
  updateCollection: (command: UpdateCollectionCommand) => Promise<IpcResponse<void>>
  deleteCollection: (collectionId: number) => Promise<IpcResponse<void>>
  addToCollection: (command: AddToCollectionCommand) => Promise<IpcResponse<boolean>>
  removeFromCollection: (command: RemoveFromCollectionCommand[]) => Promise<IpcResponse<void>>
  reorderMangaInCollection: (command: ReorderMangaInCollectionCommand) => Promise<IpcResponse<void>>
}

interface ReadHistory {
  getHistory: () => Promise<IpcResponse<ReadHistoryContract[]>>
  getRecentlyRead: (limit: number) => Promise<IpcResponse<ReadHistoryContract[]>>
  recordRead: (command: RecordReadCommand) => Promise<IpcResponse<void>>
  clearAllHistory: () => Promise<IpcResponse<void>>
}

interface Mihon {
  importBackup: (filePath: string) => Promise<IpcResponse<ImportResult>>
  cancelImport: () => Promise<IpcResponse<void>>
  exportBackup: (savePath: string) => Promise<IpcResponse<ExportResult>>
}

interface Storage {
  statsMangaTable: () => Promise<IpcResponse<MangaCacheStatsContract>>
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
  getAllDownloads: () => Promise<IpcResponse<ChapterDownloadContract[]>>
  clearCompleted: () => Promise<IpcResponse<number>>
  getDownload: (chapterId: string) => Promise<IpcResponse<ChapterDownloadContract | undefined>>
  getStorageInfo: () => Promise<IpcResponse<StorageData>>
  isDownloaded: (chapterId: string) => Promise<IpcResponse<ChapterDownloadContract | undefined>>
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
