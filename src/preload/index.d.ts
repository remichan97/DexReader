import { MangaWithMetadata } from './../main/database/queries/manga/manga-with-metadata.query'
import { ImportResult } from './../main/services/results/import.result'
import { UpdateResult } from './../main/services/results/update.result'
import { ExportResult } from './../main/services/results/export.result'
import { DexReaderExportResult } from './../main/services/results/dexreader/export.result'
import { ImageUrlResponse } from './../main/api/responses/image-url.response'
import { ApiResponse } from './../main/api/responses/api.response'
import { Manga } from './../main/api/entities/manga.entity'
import { CollectionResponse } from './../main/api/responses/collection.response'
import { ElectronAPI } from '@electron-toolkit/preload'
import type { IpcResponse, FileStats, AllowedPaths, FolderSelectResult } from './ipc.types'
import type { MangaProgress } from '../main/database/queries/progress/manga-progress.query'
import type { ProgressDatabase } from '../main/database/queries/progress/progress-database.query'
import type { ReadingStats } from '../main/database/queries/reading-stats/reading-stats.query'
import type { MangaProgressMetadata } from '../main/database/queries/progress/manga-progress-metadata.query'
import type { ChapterProgress } from '../main/database/queries/progress/chapter-progress.query'
import type { MangaReadingSettings } from '../main/settings/entity/reading-settings.entity'
import type { DexreaderExportOption } from './../main/services/options/dexreader-export.option'

// Re-export types for renderer use
export type { ImageUrlResponse } from './../main/api/responses/image-url.response'
export type { IpcResponse } from './ipc.types'
export type { MangaProgress } from '../main/database/queries/progress/manga-progress.query'
export type { MangaProgressMetadata } from '../main/database/queries/progress/manga-progress-metadata.query'
export type { ChapterProgress } from '../main/database/queries/progress/chapter-progress.query'
export type { ProgressDatabase } from '../main/database/queries/progress/progress-database.query'
export type { ReadingStats } from '../main/database/queries/reading-stats/reading-stats.query'
export type { MangaReadingSettings } from '../main/settings/entity/reading-settings.entity'
export type { CreateCollectionCommand } from '../main/database/commands/collections/create-collection.command'
export type { UpdateCollectionCommand } from '../main/database/commands/collections/update-collection.command'
export type { AddToCollectionCommand } from '../main/database/commands/collections/add-to-collection.command'
export type { RemoveFromCollectionCommand } from '../main/database/commands/collections/remove-from-collection.command'
export type { ImportResult } from './../main/services/results/import.result'
export type { ExportResult } from './../main/services/results/export.result'
export type { MangaWithMetadata } from './../main/database/queries/manga/manga-with-metadata.query'
export type { DexreaderExportOption } from './../main/services/options/dexreader-export.option'
export type { DexReaderExportResult } from './../main/services/results/dexreader/export.result'
interface MenuState {
  canAddToFavorites?: boolean
  isFavorited?: boolean
  canDownloadChapter?: boolean
  chapterTitle?: string
  canDownloadManga?: boolean
  mangaTitle?: string
  isIncognito?: boolean
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
  onClearMetadata: (callback: () => void) => () => void
  onClearHistory: (callback: () => void) => () => void
  onShowShortcuts: (callback: () => void) => () => void
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
}

interface MangaDexApi {
  searchManga: (params: MangaSearchParams) => Promise<CollectionResponse<Manga>>
  getManga: (id: string, includes?: string[]) => Promise<ApiResponse<Manga>>
  getMangaFeed: (id: string, query: FeedParams) => Promise<CollectionResponse<Chapter>>
  getChapter: (id: string, includes?: string[]) => Promise<ApiResponse<Chapter>>
  getChapterImages: (id: string, quality: ImageQuality) => Promise<IpcResponse<ImageUrlResponse[]>>
  getCoverUrl: (id: string, fileName: string, size?: string) => string
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
}

interface Library {
  getLibraryManga: (command: GetLibraryMangaCommand) => Promise<IpcResponse<MangaWithMetadata[]>>
  toggleFavourite: (mangaId: string) => Promise<IpcResponse<void>>
  upsertManga: (command: UpsertMangaCommand) => Promise<IpcResponse<void>>
  checkForUpdates: (mangaIds: string[]) => Promise<IpcResponse<UpdateResult[]>>
  getMangaWithUpdates: () => Promise<IpcResponse<MangaWithMetadata[]>>
}

interface Collections {
  getAllCollections: () => Promise<IpcResponse<CollectionEntity[]>>
  getMangaInCollection: (collectionId: number) => Promise<IpcResponse<string[]>>
  getCollectionsByManga: (mangaId: string) => Promise<IpcResponse<CollectionEntity[]>>
  createCollection: (command: CreateCollectionCommand) => Promise<IpcResponse<CollectionEntity>>
  updateCollection: (command: UpdateCollectionCommand) => Promise<IpcResponse<CollectionEntity>>
  deleteCollection: (collectionId: number) => Promise<IpcResponse<void>>
  addToCollection: (command: AddToCollectionCommand) => Promise<IpcResponse<void>>
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

interface Settings {
  load: () => Promise<IpcResponse<AppSettings>>
  save: (key: string, value: unknown) => Promise<IpcResponse<void>>
  openFile: () => Promise<IpcResponse<boolean>>
  resetToDefaults: () => Promise<IpcResponse<boolean>>
  clearAllData: () => Promise<IpcResponse<boolean>>
}

interface DexReader {
  exportData: (
    savePath: string,
    options: DexreaderExportOption
  ) => Promise<IpcResponse<DexReaderExportResult>>
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
  }
}
