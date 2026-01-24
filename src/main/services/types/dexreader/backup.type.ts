import { CollectionsData } from './collections.type'
import { LibraryData } from './library.type'
import { ProgressData } from './progress.type'
import { ReaderSettingsData } from './reader-settings.type'

export interface DexReaderBackup {
  // Metadata (always present)
  schemaVersion: number // Schema version for compatibility checking
  exportedAt: number // Unix timestamp (milliseconds)
  appVersion: string // DexReader version (e.g., "1.0.0")

  // Library data (always present)
  library: LibraryData

  // Optional sections (based on export selection)
  collections?: CollectionsData // Collections & organization
  progress?: ProgressData // Reading progress
  readerSettings?: ReaderSettingsData // Per-manga reader settings
}
