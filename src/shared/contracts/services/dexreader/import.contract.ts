import { DexReaderSectionImportErrorContract } from './section-errors.contract'

export interface DexReaderImportContract {
  importedMangaCount: number
  importedChaptersCount: number
  importedCollectionsCount: number
  importedCollectionItemsCount: number
  importedMangaProgressCount: number
  importedReaderOverridesCount: number
  skippedCollectionsCount: number
  skippedReaderSettingsCount: number
  sectionErrors: DexReaderSectionImportErrorContract
}
