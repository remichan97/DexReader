import { DexReaderSectionImportErrorResult } from './section-errors.result'

export interface DexReaderImportResult {
  importedMangaCount: number
  importedChaptersCount: number
  importedCollectionsCount: number
  importedCollectionItemsCount: number
  importedMangaProgressCount: number
  importedReaderOverridesCount: number
  skippedCollectionsCount: number
  skippedReaderSettingsCount: number
  sectionErrors: DexReaderSectionImportErrorResult
  message?: string
}
