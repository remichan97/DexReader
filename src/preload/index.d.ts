import { ImageUrlResponse } from './../main/api/responses/image-url.response'
import { ApiResponse } from './../main/api/responses/api.response'
import { Manga } from './../main/api/entities/manga.entity'
import { CollectionResponse } from './../main/api/responses/collection.response'
import { ElectronAPI } from '@electron-toolkit/preload'
import type { IpcResponse, FileStats, AllowedPaths, FolderSelectResult } from './ipc.types'

interface MenuState {
  canAddToFavorites?: boolean
  isFavorited?: boolean
  canDownloadChapter?: boolean
  chapterTitle?: string
  canDownloadManga?: boolean
  mangaTitle?: string
}

interface API {
  // Theme API
  onThemeChanged: (callback: (theme: 'light' | 'dark') => void) => void
  onAccentColorChanged: (callback: (color: string) => void) => void
  getTheme: () => Promise<'light' | 'dark'>
  getSystemAccentColor: () => Promise<string>

  // Navigation API
  onNavigate: (callback: (route: string) => void) => void

  // Dialog API
  showConfirmDialog: (message: string, detail?: string) => Promise<boolean>
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
  onCheckForUpdates: (callback: () => void) => void
  onAddToFavorites: (callback: () => void) => void
  onCreateCollection: (callback: () => void) => void
  onManageCollections: (callback: () => void) => void
  onImportLibrary: (callback: (filePath: string) => void) => void
  onImportTachiyomi: (callback: (filePath: string) => void) => void
  onExportLibrary: (callback: (filePath: string) => void) => void
  onExportTachiyomi: (callback: (filePath: string) => void) => void
  onDownloadChapter: (callback: () => void) => void
  onDownloadManga: (callback: () => void) => void
  onClearMetadata: (callback: () => void) => void
  onClearHistory: (callback: () => void) => void
  onShowShortcuts: (callback: () => void) => void
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
  getChapterImages: (id: string, quality: ImageQuality) => Promise<ImageUrlResponse[]>
  getCoverUrl: (id: string, fileName: string, size?: string) => string
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: API
    fileSystem: FileSystem
  }
}
