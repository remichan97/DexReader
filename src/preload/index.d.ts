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
  getTheme: () => Promise<'light' | 'dark'>

  // Navigation API
  onNavigate: (callback: (route: string) => void) => void

  // Dialog API
  showConfirmDialog: (message: string, detail?: string) => Promise<boolean>

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
  onClearCache: (callback: () => void) => void
  onClearHistory: (callback: () => void) => void
  onShowShortcuts: (callback: () => void) => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: API
  }
}
