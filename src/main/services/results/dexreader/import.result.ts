import { DexReaderImportErrorResult } from './import-error.result'

export interface DexReaderImportResult {
  importedMangaCount: number
  importedChaptersCount: number
  importedCollectionsCount: number
  importedCollectionItemsCount: number
  importedMangaProgressCount: number
  importedReaderOverridesCount: number
  skippedMangaCount: number
  skippedChaptersCount: number
  skippedCollectionsCount: number
  errors: DexReaderImportErrorResult[]
  message?: string
}
