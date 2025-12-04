import { ElectronAPI } from '@electron-toolkit/preload'

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
  readFile(filePath: string, encoding?: BufferEncoding): Promise<string | Buffer>
  writeFile(filePath: string, data: string | Buffer, encoding?: BufferEncoding): Promise<boolean>
  mkdir(dirPath: string): Promise<boolean>
  isExists(filePath: string): Promise<boolean>
  copyFile(srcPath: string, destPath: string): Promise<boolean>
  appendFile(filePath: string, data: string): Promise<boolean>
  rename(oldPath: string, newPath: string): Promise<boolean>
  unlink(filePath: string): Promise<boolean>
  rmdir(dirPath: string): Promise<boolean>
  stat(path: string): Promise<{
    isFile: boolean
    isDirectory: boolean
    size: number
    created: string
    modified: string
  }>
  readdir(dirPath: string): Promise<string[]>
  getAllowedPaths(): Promise<{
    appData: string
    downloads: string
  }>
  selectDownloadsFolder(): Promise<{
    cancelled: boolean
    path: string | null
  }>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: API
    fileSystem: FileSystem
  }
}
